'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { auth, firebaseReady } from '../../lib/firebase';
import {
  evaluateAndAwardBadges,
  getSavedProjectIds,
  joinProject,
  leaveProject,
  listContributions,
  listEvents,
  listNotifications,
  listProjects,
  listThreads,
  logContribution,
  markNotificationRead,
  rsvpToEvent,
  saveProject,
  seedIfEmpty,
  sendMessage,
  toggleAvailability,
  unsaveProject,
  updateNotificationPrefs,
  upsertUserProfile,
  getUserProfile,
  type ContributionDoc,
  type EventDoc,
  type NotificationDoc,
  type ProjectDoc,
  type UserProfileDoc,
} from '../../lib/turknodeDb';

export type NavSection =
  | 'home'
  | 'discover'
  | 'contributions'
  | 'messages'
  | 'opportunities'
  | 'events'
  | 'reports'
  | 'saved'
  | 'settings';

export function useVolunteerDashboard() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [uid, setUid] = useState<string>('');
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [contributions, setContributions] = useState<ContributionDoc[]>([]);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [threads, setThreads] = useState<Array<Record<string, unknown>>>([]);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  const refreshAll = useCallback(async (currentUid: string) => {
    try {
      const [profileRow, projectsRows, contributionRows, notificationRows, threadRows, eventRows, savedRows] =
        await Promise.all([
          getUserProfile(currentUid),
          listProjects(),
          listContributions(currentUid),
          listNotifications(currentUid),
          listThreads(currentUid),
          listEvents(),
          getSavedProjectIds(currentUid),
        ]);

      if (profileRow) {
        setProfile(profileRow);
      }
      setProjects(projectsRows);
      setContributions(contributionRows);
      setNotifications(notificationRows);
      setThreads(threadRows);
      setEvents(eventRows);
      setSavedProjectIds(savedRows);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh dashboard data.');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setAuthStatus('unavailable');
      return;
    }

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUid('');
        setProfile(null);
        setAuthStatus('ready');
        return;
      }

      try {
        setUid(user.uid);
        await seedIfEmpty(user.uid, user.email || '', user.displayName || 'TurkNode Volunteer');
        const refreshed = await refreshAll(user.uid);
        if (!refreshed) {
          setProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'TurkNode Volunteer',
            role: 'volunteer',
            bio: 'Volunteer profile is initializing. Please refresh shortly.',
            location: '',
            interests: [],
            skills: [],
            availableForProjects: true,
            hoursContributed: 0,
            completedProjects: 0,
            impactScore: 0,
            badgesEarned: [],
            notificationPrefs: {
              projectInvites: true,
              milestones: true,
              badges: true,
              messages: true,
            },
            profileCompletion: 20,
          });
        }
        setAuthStatus('ready');
      } catch (err) {
        setProfile({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'TurkNode Volunteer',
          role: 'volunteer',
          bio: 'Volunteer profile is initializing. Please refresh shortly.',
          location: '',
          interests: [],
          skills: [],
          availableForProjects: true,
          hoursContributed: 0,
          completedProjects: 0,
          impactScore: 0,
          badgesEarned: [],
          notificationPrefs: {
            projectInvites: true,
            milestones: true,
            badges: true,
            messages: true,
          },
          profileCompletion: 20,
        });
        setError(err instanceof Error ? err.message : 'Failed to initialize dashboard data.');
        setAuthStatus('ready');
      }
    });

    return () => unsub();
  }, [refreshAll]);

  useEffect(() => {
    if (!uid) return;
    const timer = setInterval(() => {
      void refreshAll(uid).catch(() => {
        // Prevent uncaught promise rejections from crashing the route.
      });
    }, 15000);
    return () => clearInterval(timer);
  }, [uid, refreshAll]);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'active'),
    [projects]
  );
  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === 'completed'),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const catOk = !filterCategory || p.category.toLowerCase().includes(filterCategory.toLowerCase());
      const locOk = !filterLocation || p.location.toLowerCase().includes(filterLocation.toLowerCase());
      const skillOk =
        !filterSkill ||
        (p.skillsRequired || []).some((s) => s.toLowerCase().includes(filterSkill.toLowerCase()));
      return catOk && locOk && skillOk;
    });
  }, [projects, filterCategory, filterLocation, filterSkill]);

  const recommendations = useMemo(() => {
    if (!profile) return [] as ProjectDoc[];
    const interests = new Set([...(profile.interests || []), ...(profile.skills || [])].map((x) => x.toLowerCase()));
    return projects
      .filter((project) => project.status === 'active')
      .map((project) => {
        const projectTerms = [project.category, ...(project.skillsRequired || [])].map((v) => String(v).toLowerCase());
        const score = projectTerms.reduce((sum, term) => (interests.has(term) ? sum + 1 : sum), 0);
        return { project, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.project);
  }, [projects, profile]);

  const wrapAction = useCallback(
    async (fn: () => Promise<void>, successMsg: string) => {
      if (!uid) return;
      setIsBusy(true);
      setError('');
      setNotice('');
      try {
        await fn();
        await refreshAll(uid);
        setNotice(successMsg);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed');
      } finally {
        setIsBusy(false);
      }
    },
    [uid, refreshAll]
  );

  const onJoinProject = useCallback(
    async (projectId: string) => {
      if (!uid) return;
      await wrapAction(() => joinProject(uid, projectId), 'Project joined successfully.');
    },
    [uid, wrapAction]
  );

  const onLeaveProject = useCallback(
    async (projectId: string) => {
      if (!uid) return;
      await wrapAction(() => leaveProject(uid, projectId), 'You left the project.');
    },
    [uid, wrapAction]
  );

  const onSaveProject = useCallback(
    async (projectId: string) => {
      if (!uid) return;
      const isSaved = savedProjectIds.includes(projectId);
      await wrapAction(
        () => (isSaved ? unsaveProject(uid, projectId) : saveProject(uid, projectId)),
        isSaved ? 'Removed from saved.' : 'Saved for later.'
      );
    },
    [savedProjectIds, uid, wrapAction]
  );

  const onLogContribution = useCallback(
    async (payload: { projectId: string; projectTitle: string; hours: number; notes: string; completedTask: boolean }) => {
      if (!uid) return;
      await wrapAction(async () => {
        await logContribution({
          uid,
          projectId: payload.projectId,
          projectTitle: payload.projectTitle,
          hours: payload.hours,
          notes: payload.notes,
          completedTask: payload.completedTask,
        });
        await evaluateAndAwardBadges(uid);
      }, 'Contribution logged and impact updated.');
    },
    [uid, wrapAction]
  );

  const onSendMessage = useCallback(
    async (toUid: string, message: string) => {
      if (!uid) return;
      const threadId = [uid, toUid].sort().join('_');
      await wrapAction(() => sendMessage(threadId, uid, toUid, message), 'Message sent.');
    },
    [uid, wrapAction]
  );

  const onToggleAvailability = useCallback(
    async (value: boolean) => {
      if (!uid) return;
      await wrapAction(() => toggleAvailability(uid, value), value ? 'Marked as available.' : 'Marked as unavailable.');
    },
    [uid, wrapAction]
  );

  const onUpdateProfile = useCallback(
    async (patch: Partial<UserProfileDoc>) => {
      if (!uid) return;
      await wrapAction(() => upsertUserProfile(uid, patch), 'Profile updated successfully.');
    },
    [uid, wrapAction]
  );

  const onUpdatePrefs = useCallback(
    async (prefs: UserProfileDoc['notificationPrefs']) => {
      if (!uid) return;
      await wrapAction(() => updateNotificationPrefs(uid, prefs), 'Notification preferences updated.');
    },
    [uid, wrapAction]
  );

  const onRsvpEvent = useCallback(
    async (eventId: string) => {
      if (!uid) return;
      await wrapAction(() => rsvpToEvent(uid, eventId), 'RSVP confirmed.');
    },
    [uid, wrapAction]
  );

  const onMarkNotificationRead = useCallback(
    async (notificationId: string) => {
      await wrapAction(() => markNotificationRead(notificationId), 'Notification marked as read.');
    },
    [wrapAction]
  );

  const totalHours = useMemo(
    () => contributions.reduce((sum, row) => sum + Number(row.hours || 0), 0),
    [contributions]
  );

  return {
    authStatus,
    uid,
    profile,
    projects,
    activeProjects,
    completedProjects,
    filteredProjects,
    recommendations,
    contributions,
    notifications,
    threads,
    events,
    savedProjectIds,
    activeSection,
    setActiveSection,
    filterCategory,
    setFilterCategory,
    filterLocation,
    setFilterLocation,
    filterSkill,
    setFilterSkill,
    totalHours,
    isBusy,
    error,
    notice,
    onJoinProject,
    onLeaveProject,
    onSaveProject,
    onLogContribution,
    onSendMessage,
    onToggleAvailability,
    onUpdateProfile,
    onUpdatePrefs,
    onRsvpEvent,
    onMarkNotificationRead,
  };
}
