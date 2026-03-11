'use client';

import { auth } from './firebase';

export type UserProfileDoc = {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: 'volunteer' | 'manager';
  bio: string;
  location: string;
  interests: string[];
  skills: string[];
  availableForProjects: boolean;
  hoursContributed: number;
  completedProjects: number;
  impactScore: number;
  badgesEarned: string[];
  notificationPrefs: {
    projectInvites: boolean;
    milestones: boolean;
    badges: boolean;
    messages: boolean;
  };
  profileCompletion: number;
};

export type ProjectDoc = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  skillsRequired: string[];
  startDate: string;
  endDate: string;
  impactMetric: string;
  status: 'active' | 'completed';
  participants: string[];
  participantCount: number;
  projectLead: string;
};

export type CreateProjectInput = {
  title: string;
  description: string;
  category: string;
  location: string;
  skillsRequired: string[];
  startDate: string;
  endDate: string;
  impactMetric: string;
  projectLead: string;
};

export type ContributionDoc = {
  id: string;
  uid: string;
  projectId: string;
  projectTitle: string;
  hours: number;
  notes: string;
  completedTask: boolean;
  createdAt?: string;
};

export type NotificationDoc = {
  id: string;
  uid: string;
  type: 'invite' | 'milestone' | 'badge' | 'message' | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt?: string;
};

export type EventDoc = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  category: string;
  rsvps: string[];
};

const BADGES = {
  HOURS_100: '100 Hours Badge',
  COMMUNITY_BUILDER: 'Community Builder',
  EDUCATION_ADVOCATE: 'Education Advocate',
  SUSTAINABILITY_CHAMPION: 'Sustainability Champion',
  FIRST_PROJECT: 'First Project Completed',
} as const;

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function calcProfileCompletion(profile: Partial<UserProfileDoc>) {
  const checks = [
    profile.photoUrl,
    profile.displayName,
    profile.bio,
    profile.location,
    profile.interests && profile.interests.length > 0,
    profile.skills && profile.skills.length > 0,
    typeof profile.availableForProjects === 'boolean',
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { arrayValue: { values: FsValue[] } }
  | { mapValue: { fields: Record<string, FsValue> } }
  | { nullValue: null };

function toFsValue(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFsValue) } };
  if (typeof value === 'object') {
    const fields: Record<string, FsValue> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      fields[k] = toFsValue(v);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFsValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFsValue);
  if ('mapValue' in value) {
    const output: Record<string, unknown> = {};
    Object.entries(value.mapValue.fields || {}).forEach(([k, v]) => {
      output[k] = fromFsValue(v);
    });
    return output;
  }
  if ('timestampValue' in value) return value.timestampValue;
  return null;
}

function mapFromFsDocument<T>(doc: any): T & { id: string } {
  const id = String(doc.name || '').split('/').pop() || '';
  const fields = doc.fields || {};
  const data: Record<string, unknown> = {};
  Object.entries(fields).forEach(([k, v]) => {
    data[k] = fromFsValue(v);
  });
  return { id, ...(data as T) };
}

function toFsFields(data: Record<string, unknown>) {
  const fields: Record<string, FsValue> = {};
  Object.entries(data).forEach(([k, v]) => {
    fields[k] = toFsValue(v);
  });
  return { fields };
}

async function getIdToken() {
  if (!auth) throw new Error('Firebase auth is unavailable.');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated.');
  return user.getIdToken();
}

async function fsFetch(path: string, init: RequestInit = {}) {
  if (!PROJECT_ID || !API_KEY) {
    throw new Error('Firebase project env vars missing for Firestore.');
  }

  const token = await getIdToken();
  const url = `${FIRESTORE_BASE}${path}${path.includes('?') ? '&' : '?'}key=${API_KEY}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore request failed (${res.status}): ${body}`);
  }

  return res.json();
}

async function getDocument<T>(collectionName: string, docId: string): Promise<(T & { id: string }) | null> {
  try {
    const data = await fsFetch(`/${collectionName}/${docId}`);
    return mapFromFsDocument<T>(data);
  } catch {
    return null;
  }
}

async function setDocument(collectionName: string, docId: string, data: Record<string, unknown>) {
  await fsFetch(`/${collectionName}/${docId}`, {
    method: 'PATCH',
    body: JSON.stringify(toFsFields(data)),
  });
}

async function addDocument(collectionName: string, data: Record<string, unknown>) {
  const result = await fsFetch(`/${collectionName}`, {
    method: 'POST',
    body: JSON.stringify(toFsFields(data)),
  });
  return mapFromFsDocument<Record<string, unknown>>(result).id;
}

async function listCollection<T>(collectionName: string): Promise<Array<T & { id: string }>> {
  const result = await fsFetch(`/${collectionName}`);
  const docs = result.documents || [];
  return docs.map((doc: any) => mapFromFsDocument<T>(doc));
}

async function deleteDocument(collectionName: string, docId: string) {
  await fsFetch(`/${collectionName}/${docId}`, { method: 'DELETE' });
}

export async function upsertUserProfile(uid: string, data: Partial<UserProfileDoc>) {
  const existing = await getDocument<UserProfileDoc>('users', uid);
  const merged: UserProfileDoc = {
    uid,
    role: 'volunteer',
    email: data.email || existing?.email || '',
    displayName: data.displayName || existing?.displayName || 'TurkNode Volunteer',
    photoUrl: data.photoUrl || existing?.photoUrl || '',
    bio: data.bio || existing?.bio || '',
    location: data.location || existing?.location || '',
    interests: data.interests || existing?.interests || [],
    skills: data.skills || existing?.skills || [],
    availableForProjects: data.availableForProjects ?? existing?.availableForProjects ?? true,
    hoursContributed: data.hoursContributed ?? existing?.hoursContributed ?? 0,
    completedProjects: data.completedProjects ?? existing?.completedProjects ?? 0,
    impactScore: data.impactScore ?? existing?.impactScore ?? 0,
    badgesEarned: data.badgesEarned || existing?.badgesEarned || [],
    notificationPrefs: data.notificationPrefs ||
      existing?.notificationPrefs || {
        projectInvites: true,
        milestones: true,
        badges: true,
        messages: true,
      },
    profileCompletion: 0,
  };
  merged.profileCompletion = calcProfileCompletion(merged);
  await setDocument('users', uid, merged as unknown as Record<string, unknown>);
}

export async function getUserProfile(uid: string) {
  return getDocument<UserProfileDoc>('users', uid);
}

export async function listProjects() {
  return listCollection<ProjectDoc>('projects');
}

export async function createProject(input: CreateProjectInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 3) throw new Error('Project title must be at least 3 characters.');
  if (description.length < 20) throw new Error('Project description must be at least 20 characters.');

  const id = await addDocument('projects', {
    title,
    description,
    category: input.category.trim() || 'Community',
    location: input.location.trim() || 'Remote',
    skillsRequired: input.skillsRequired.filter(Boolean),
    startDate: input.startDate,
    endDate: input.endDate,
    impactMetric: input.impactMetric.trim() || 'Community members supported',
    status: 'active',
    participants: [],
    participantCount: 0,
    projectLead: input.projectLead.trim(),
  });

  return id;
}

export async function joinProject(uid: string, projectId: string) {
  const project = await getDocument<ProjectDoc>('projects', projectId);
  if (!project) throw new Error('Project not found.');
  const participants = Array.from(new Set([...(project.participants || []), uid]));
  await setDocument('projects', projectId, {
    ...project,
    participants,
    participantCount: participants.length,
  });
  await setDocument('memberships', `${uid}_${projectId}`, {
    uid,
    projectId,
    status: 'active',
    joinedAt: new Date().toISOString(),
  });
  await addNotification(uid, 'invite', 'Joined project', `You joined ${project.title}.`);
}

export async function leaveProject(uid: string, projectId: string) {
  const project = await getDocument<ProjectDoc>('projects', projectId);
  if (!project) return;
  const participants = (project.participants || []).filter((id) => id !== uid);
  await setDocument('projects', projectId, {
    ...project,
    participants,
    participantCount: participants.length,
  });
  await setDocument('memberships', `${uid}_${projectId}`, {
    uid,
    projectId,
    status: 'left',
    leftAt: new Date().toISOString(),
  });
}

export async function saveProject(uid: string, projectId: string) {
  await setDocument('saved', `${uid}_${projectId}`, {
    uid,
    projectId,
    savedAt: new Date().toISOString(),
  });
}

export async function unsaveProject(uid: string, projectId: string) {
  await deleteDocument('saved', `${uid}_${projectId}`);
}

export async function getSavedProjectIds(uid: string) {
  const all = await listCollection<{ uid: string; projectId: string }>('saved');
  return all.filter((d) => d.uid === uid).map((d) => d.projectId);
}

export async function logContribution(payload: Omit<ContributionDoc, 'id'>) {
  const id = await addDocument('contributions', {
    ...payload,
    createdAt: new Date().toISOString(),
  });
  const profile = await getUserProfile(payload.uid);
  if (profile) {
    await upsertUserProfile(payload.uid, {
      hoursContributed: Number((profile.hoursContributed + payload.hours).toFixed(1)),
      impactScore: Math.round(profile.impactScore + payload.hours * 0.8),
    });
  }
  return id;
}

export async function listContributions(uid: string) {
  const all = await listCollection<ContributionDoc>('contributions');
  return all
    .filter((d) => d.uid === uid)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function sendMessage(threadId: string, fromUid: string, toUid: string, text: string) {
  await setDocument('messages', threadId, {
    threadId,
    members: [fromUid, toUid],
    lastMessage: text,
    updatedAt: new Date().toISOString(),
  });
  await addDocument('messageEntries', {
    threadId,
    fromUid,
    toUid,
    text,
    createdAt: new Date().toISOString(),
  });
  await addNotification(toUid, 'message', 'New message', text.slice(0, 120));
}

export async function listThreads(uid: string) {
  const all = await listCollection<Record<string, unknown>>('messages');
  return all
    .filter((d) => Array.isArray(d.members) && (d.members as string[]).includes(uid))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

export async function addNotification(
  uid: string,
  type: NotificationDoc['type'],
  title: string,
  body: string
) {
  await addDocument('notifications', {
    uid,
    type,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function listNotifications(uid: string) {
  const all = await listCollection<NotificationDoc>('notifications');
  return all
    .filter((d) => d.uid === uid)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function markNotificationRead(notificationId: string) {
  const notification = await getDocument<NotificationDoc>('notifications', notificationId);
  if (!notification) return;
  await setDocument('notifications', notificationId, {
    ...notification,
    read: true,
  });
}

export async function toggleAvailability(uid: string, availableForProjects: boolean) {
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error('Profile missing.');
  await upsertUserProfile(uid, {
    ...profile,
    availableForProjects,
  });
}

export async function updateNotificationPrefs(uid: string, prefs: UserProfileDoc['notificationPrefs']) {
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error('Profile missing.');
  await upsertUserProfile(uid, {
    ...profile,
    notificationPrefs: prefs,
  });
}

export async function listEvents() {
  const all = await listCollection<EventDoc>('events');
  return all.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
}

export async function rsvpToEvent(uid: string, eventId: string) {
  const event = await getDocument<EventDoc>('events', eventId);
  if (!event) throw new Error('Event not found.');
  const rsvps = Array.from(new Set([...(event.rsvps || []), uid]));
  await setDocument('events', eventId, {
    ...event,
    rsvps,
  });
}

export async function evaluateAndAwardBadges(uid: string) {
  const [profile, contributions] = await Promise.all([getUserProfile(uid), listContributions(uid)]);
  if (!profile) return;

  const totalHours = contributions.reduce((sum, row) => sum + Number(row.hours || 0), 0);
  const completedCount = contributions.filter((row) => row.completedTask).length;
  const educationCount = contributions.filter((row) =>
    String(row.projectTitle).toLowerCase().includes('education')
  ).length;
  const sustainabilityCount = contributions.filter((row) =>
    /sustain|climate|tree|green/i.test(String(row.projectTitle))
  ).length;

  const unlocked: string[] = [];
  if (totalHours >= 100) unlocked.push(BADGES.HOURS_100);
  if (completedCount >= 10) unlocked.push(BADGES.COMMUNITY_BUILDER);
  if (educationCount >= 3) unlocked.push(BADGES.EDUCATION_ADVOCATE);
  if (sustainabilityCount >= 3) unlocked.push(BADGES.SUSTAINABILITY_CHAMPION);
  if (completedCount >= 1) unlocked.push(BADGES.FIRST_PROJECT);

  const current = new Set(profile.badgesEarned || []);
  const newOnes = unlocked.filter((badge) => !current.has(badge));

  await upsertUserProfile(uid, {
    ...profile,
    hoursContributed: Number(totalHours.toFixed(1)),
    completedProjects: completedCount,
    badgesEarned: Array.from(new Set([...(profile.badgesEarned || []), ...newOnes])),
  });

  for (const badge of newOnes) {
    await addDocument('badges', {
      uid,
      name: badge,
      earnedAt: new Date().toISOString(),
    });
  }

  if (newOnes.length > 0) {
    await addNotification(uid, 'badge', 'Badge unlocked', `You earned: ${newOnes.join(', ')}`);
  }
}

export async function seedIfEmpty(uid: string, email: string, displayName: string) {
  const profile = await getUserProfile(uid);
  if (!profile) {
    await upsertUserProfile(uid, {
      uid,
      email,
      displayName,
      role: 'volunteer',
      bio: '',
      location: '',
      interests: [],
      skills: [],
      availableForProjects: true,
      badgesEarned: [],
      hoursContributed: 0,
      completedProjects: 0,
      impactScore: 0,
      notificationPrefs: {
        projectInvites: true,
        milestones: true,
        badges: true,
        messages: true,
      },
      profileCompletion: 20,
    });
  }

  const projects = await listProjects();
  if (projects.length === 0) {
    const baseProjects: Omit<ProjectDoc, 'id'>[] = [
      {
        title: 'Neighborhood Tree Renewal',
        description: 'Plant and maintain native trees across school and community corridors.',
        category: 'Environment',
        location: 'Philadelphia, PA',
        skillsRequired: ['Field Support', 'Community Outreach'],
        startDate: '2026-03-12',
        endDate: '2026-05-10',
        impactMetric: 'Trees planted',
        status: 'active',
        participants: [],
        participantCount: 0,
        projectLead: 'impact@turknode.org',
      },
      {
        title: 'Youth STEM Tutor Circles',
        description: 'Weekly volunteer mentorship for middle-school STEM confidence.',
        category: 'Education',
        location: 'Remote',
        skillsRequired: ['Teaching', 'Mentoring'],
        startDate: '2026-03-15',
        endDate: '2026-06-30',
        impactMetric: 'Students supported',
        status: 'active',
        participants: [],
        participantCount: 0,
        projectLead: 'education@turknode.org',
      },
      {
        title: 'Community Digital Help Desk',
        description: 'Assist residents with digital literacy and public service access.',
        category: 'Technology',
        location: 'Philadelphia, PA',
        skillsRequired: ['Tech Support', 'Communication'],
        startDate: '2026-01-12',
        endDate: '2026-02-20',
        impactMetric: 'Residents assisted',
        status: 'completed',
        participants: [],
        participantCount: 0,
        projectLead: 'tech4good@turknode.org',
      },
    ];

    for (const item of baseProjects) {
      await addDocument('projects', item as unknown as Record<string, unknown>);
    }
  }

  const events = await listEvents();
  if (events.length === 0) {
    await addDocument('events', {
      title: 'Spring River Cleanup',
      location: 'Schuylkill Banks',
      startsAt: '2026-03-20T10:00:00-04:00',
      category: 'Environment',
      rsvps: [],
    });
    await addDocument('events', {
      title: 'Volunteer Mentor Onboarding',
      location: 'Remote',
      startsAt: '2026-03-25T18:00:00-04:00',
      category: 'Education',
      rsvps: [],
    });
  }
}
