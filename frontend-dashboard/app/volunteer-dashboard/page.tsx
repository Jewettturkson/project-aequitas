"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import FloatingActions from "./components/FloatingActions";
import HeroSection from "./components/HeroSection";
import Sidebar from "./components/Sidebar";
import TabNav from "./components/TabNav";
import VolunteerProfileCard from "./components/VolunteerProfileCard";
import { sidebarNav } from "./mockData";
import type { DashboardTab } from "./types";
import { useVolunteerDashboard } from "./useVolunteerDashboard";
import type { NavSection } from "./useVolunteerDashboard";

const MAX_UPLOAD_DIMENSION = 512;
const MAX_UPLOAD_BYTES = 350_000;

async function fileToDataUrl(file: File) {
  const fileBuffer = await file.arrayBuffer();
  const blob = new Blob([fileBuffer], { type: file.type });
  const imageUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = imageUrl;
    });

    const ratio = Math.min(
      1,
      MAX_UPLOAD_DIMENSION / Math.max(image.width, image.height)
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to process image.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Prefer jpeg for compact storage in Firestore profile document.
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    if (dataUrl.length > MAX_UPLOAD_BYTES * 1.5) {
      throw new Error("Image is too large. Use a smaller image.");
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const {
    authStatus,
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
  } = useVolunteerDashboard();

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [themeMode, setThemeMode] = useState<"mission" | "clean" | "contrast">("mission");
  const [profileDraft, setProfileDraft] = useState({
    displayName: profile?.displayName || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    skills: (profile?.skills || []).join(", "),
    interests: (profile?.interests || []).join(", "),
    photoUrl: profile?.photoUrl || "",
  });
  const [profilePhotoError, setProfilePhotoError] = useState("");
  const [messageDraft, setMessageDraft] = useState({ toUid: "manager-demo", text: "" });
  const [contributionDraft, setContributionDraft] = useState({
    projectId: "",
    hours: "2",
    notes: "",
    completedTask: false,
  });

  const panelTitle = useMemo(() => {
    if (activeTab === "projects") return "Discover and contribute to high-impact community projects";
    if (activeTab === "achievements") return "Celebrate milestones and sustained service impact";
    if (activeTab === "recommendations") return "Personalized opportunities for your mission profile";
    return "Making community impact through service, collaboration, and innovation";
  }, [activeTab]);

  const missionClasses =
    themeMode === "clean"
      ? "bg-slate-50"
      : themeMode === "contrast"
      ? "bg-slate-100"
      : "bg-[#F6F7F5]";

  const validSections: NavSection[] = [
    "home",
    "discover",
    "contributions",
    "messages",
    "opportunities",
    "events",
    "reports",
    "saved",
    "settings",
  ];

  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window === "undefined") return;
      const query = new URLSearchParams(window.location.search);
      const sectionFromUrl = (query.get("section") || "").toLowerCase();
      const normalizedSection = validSections.includes(sectionFromUrl as NavSection)
        ? (sectionFromUrl as NavSection)
        : "home";
      if (normalizedSection !== activeSection) {
        setActiveSection(normalizedSection);
        if (normalizedSection === "discover") {
          setActiveTab("projects");
        } else if (normalizedSection === "opportunities") {
          setActiveTab("recommendations");
        } else if (normalizedSection === "home") {
          setActiveTab("overview");
        }
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [activeSection, setActiveSection]);

  useEffect(() => {
    if (authStatus === "ready" && !profile) {
      const next = encodeURIComponent(
        "/volunteer-dashboard" + (typeof window !== "undefined" ? window.location.search : "")
      );
      router.replace(`/?next=${next}`);
    }
  }, [authStatus, profile, router]);

  if (authStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7F5] text-slate-900">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading TurkNode volunteer workspace...
        </div>
      </main>
    );
  }

  if (authStatus === "unavailable") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7F5] p-6 text-center">
        <div className="rounded-2xl border border-amber-200 bg-white p-6">
          <p className="text-slate-800">Firebase configuration is unavailable in this environment.</p>
          <p className="mt-2 text-sm text-slate-600">
            Set all `NEXT_PUBLIC_FIREBASE_*` variables in Render, redeploy, and refresh.
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7F5] p-6 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="mb-3 text-slate-700">Redirecting to sign in...</p>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/` +
                  `?next=${encodeURIComponent(
                    "/volunteer-dashboard" +
                      (typeof window !== "undefined" ? window.location.search : "")
                  )}`
              )
            }
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Return to sign in
          </button>
        </div>
      </main>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onUpdateProfile({
      displayName: profileDraft.displayName.trim(),
      bio: profileDraft.bio.trim(),
      location: profileDraft.location.trim(),
      skills: profileDraft.skills
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      interests: profileDraft.interests
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      photoUrl: profileDraft.photoUrl.trim(),
    });
    setShowProfileEditor(false);
  };

  const handleContributionSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const project = projects.find((p) => p.id === contributionDraft.projectId);
    if (!project) return;
    await onLogContribution({
      projectId: contributionDraft.projectId,
      projectTitle: project.title,
      hours: Number(contributionDraft.hours),
      notes: contributionDraft.notes,
      completedTask: contributionDraft.completedTask,
    });
    setShowContributionModal(false);
    setContributionDraft({ projectId: "", hours: "2", notes: "", completedTask: false });
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!messageDraft.text.trim()) return;
    await onSendMessage(messageDraft.toUid, messageDraft.text.trim());
    setMessageDraft((prev) => ({ ...prev, text: "" }));
  };

  const renderHomeContent = () => (
    <>
      <HeroSection title={panelTitle} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <div className="space-y-5">
          <SectionCard title="Live Dashboard Signals">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase text-slate-500">Active projects</p>
                <p className="mt-2 text-2xl font-black">{activeProjects.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase text-slate-500">Completed projects</p>
                <p className="mt-2 text-2xl font-black">{completedProjects.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase text-slate-500">Hours logged</p>
                <p className="mt-2 text-2xl font-black">{totalHours.toFixed(1)}h</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase text-slate-500">Unread notifications</p>
                <p className="mt-2 text-2xl font-black">{unreadNotifications}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Completed Projects">
            <div className="grid gap-4 md:grid-cols-2">
              {completedProjects.length === 0 ? (
                <p className="text-sm text-slate-600">No completed projects yet. Your contributions will appear here.</p>
              ) : (
                completedProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">{project.category}</p>
                    <h3 className="mt-1 text-lg font-bold">{project.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                  </article>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {(activeTab === "projects" || activeTab === "recommendations") && (
        <SectionCard title={activeTab === "projects" ? "Project Directory" : "Recommended Opportunities"}>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Category</span>
              <input
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Environment"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Location</span>
              <input
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Philadelphia"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Skills</span>
              <input
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Teaching"
              />
            </label>
          </div>
          <div className="space-y-3">
            {(activeTab === "recommendations" ? recommendations : filteredProjects).map((project) => {
              const joined = (project.participants || []).includes(profile.uid);
              const saved = savedProjectIds.includes(String(project.id));
              return (
                <article key={String(project.id)} className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">{project.category} • {project.location}</p>
                      <h3 className="mt-1 text-lg font-bold">{project.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void onSaveProject(String(project.id))}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100"
                      >
                        {saved ? "Unsave" : "Save"}
                      </button>
                      {joined ? (
                        <button
                          type="button"
                          onClick={() => void onLeaveProject(String(project.id))}
                          className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void onJoinProject(String(project.id))}
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          Join Project
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
      )}

      {activeTab === "achievements" && (
        <SectionCard title="Achievements and Badges">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(profile.badgesEarned || []).length === 0 ? (
              <p className="text-sm text-slate-600">No badges unlocked yet. Log contributions and complete project tasks.</p>
            ) : (
              profile.badgesEarned.map((badge) => (
                <div key={badge} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">{badge}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      )}
    </>
  );

  const renderSection = () => {
    if (activeSection === "home") return renderHomeContent();

    if (activeSection === "discover") {
      return (
        <SectionCard title="Discover Projects">
          <p className="mb-3 text-sm text-slate-600">Browse and join active community projects aligned with your mission interests.</p>
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Open project filters
          </button>
        </SectionCard>
      );
    }

    if (activeSection === "contributions") {
      return (
        <SectionCard title="My Contributions">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">Track logged hours and completed work entries.</p>
            <button
              type="button"
              onClick={() => setShowContributionModal(true)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Log Hours
            </button>
          </div>
          <div className="space-y-3">
            {contributions.length === 0 ? (
              <p className="text-sm text-slate-600">No contributions logged yet.</p>
            ) : (
              contributions.map((item, index) => (
                <article key={`${item.projectId}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold">{item.projectTitle}</p>
                  <p className="text-sm text-slate-600">{item.hours}h • {item.notes}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Task completion: {item.completedTask ? "Completed" : "In progress"}
                  </p>
                </article>
              ))
            )}
          </div>
        </SectionCard>
      );
    }

    if (activeSection === "messages") {
      return (
        <SectionCard title="Messages">
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="mb-2 text-sm font-semibold">Conversation Threads</p>
              {threads.length === 0 ? (
                <p className="text-sm text-slate-600">No active conversations.</p>
              ) : (
                threads.map((thread) => (
                  <div key={String(thread.id)} className="mb-2 rounded-xl bg-slate-50 p-2 text-xs">
                    <p className="font-semibold">Thread {String(thread.id)}</p>
                    <p className="text-slate-600">{String(thread.lastMessage || "No messages yet")}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="rounded-2xl border border-slate-200 p-4">
              <p className="mb-2 text-sm font-semibold">Send Message</p>
              <input
                value={messageDraft.toUid}
                onChange={(e) => setMessageDraft((prev) => ({ ...prev, toUid: e.target.value }))}
                className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Recipient UID"
              />
              <textarea
                value={messageDraft.text}
                onChange={(e) => setMessageDraft((prev) => ({ ...prev, text: e.target.value }))}
                className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={4}
                placeholder="Write your message"
              />
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Send
              </button>
            </form>
          </div>
        </SectionCard>
      );
    }

    if (activeSection === "opportunities") {
      return (
        <SectionCard title="Opportunities">
          <p className="mb-3 text-sm text-slate-600">Rules-based recommendations matched by your interests and skills.</p>
          <div className="space-y-3">
            {recommendations.map((project) => (
              <article key={String(project.id)} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold">{project.title}</h3>
                <p className="text-sm text-slate-600">{project.category} • {project.location}</p>
                <button
                  type="button"
                  onClick={() => void onJoinProject(String(project.id))}
                  className="mt-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Join Opportunity
                </button>
              </article>
            ))}
          </div>
        </SectionCard>
      );
    }

    if (activeSection === "events") {
      return (
        <SectionCard title="Events">
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-slate-600">No upcoming events yet.</p>
            ) : (
              events.map((event) => (
                <article key={String(event.id)} className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-slate-600">{event.location} • {event.startsAt}</p>
                  <button
                    type="button"
                    onClick={() => void onRsvpEvent(String(event.id))}
                    className="mt-2 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                  >
                    RSVP
                  </button>
                </article>
              ))
            )}
          </div>
        </SectionCard>
      );
    }

    if (activeSection === "reports") {
      return (
        <SectionCard title="Impact Reports">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Hours contributed</p>
              <p className="mt-1 text-2xl font-black">{profile.hoursContributed}h</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Completed projects</p>
              <p className="mt-1 text-2xl font-black">{profile.completedProjects}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Impact score</p>
              <p className="mt-1 text-2xl font-black">{profile.impactScore}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Badges earned</p>
              <p className="mt-1 text-2xl font-black">{(profile.badgesEarned || []).length}</p>
            </div>
          </div>
        </SectionCard>
      );
    }

    if (activeSection === "saved") {
      const saved = projects.filter((p) => savedProjectIds.includes(String(p.id)));
      return (
        <SectionCard title="Saved Projects">
          {saved.length === 0 ? (
            <p className="text-sm text-slate-600">No saved opportunities yet.</p>
          ) : (
            <div className="space-y-3">
              {saved.map((project) => (
                <article key={String(project.id)} className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold">{project.title}</h3>
                  <p className="text-sm text-slate-600">{project.category} • {project.location}</p>
                  <button
                    type="button"
                    onClick={() => void onSaveProject(String(project.id))}
                    className="mt-2 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                  >
                    Remove from saved
                  </button>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      );
    }

    return (
      <SectionCard title="Settings">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onUpdatePrefs(profile.notificationPrefs);
          }}
          className="space-y-3"
        >
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
            Project invites
            <input
              type="checkbox"
              checked={profile.notificationPrefs.projectInvites}
              onChange={(e) =>
                void onUpdatePrefs({
                  ...profile.notificationPrefs,
                  projectInvites: e.target.checked,
                })
              }
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
            Milestone updates
            <input
              type="checkbox"
              checked={profile.notificationPrefs.milestones}
              onChange={(e) =>
                void onUpdatePrefs({
                  ...profile.notificationPrefs,
                  milestones: e.target.checked,
                })
              }
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
            Badge alerts
            <input
              type="checkbox"
              checked={profile.notificationPrefs.badges}
              onChange={(e) =>
                void onUpdatePrefs({
                  ...profile.notificationPrefs,
                  badges: e.target.checked,
                })
              }
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
            Message alerts
            <input
              type="checkbox"
              checked={profile.notificationPrefs.messages}
              onChange={(e) =>
                void onUpdatePrefs({
                  ...profile.notificationPrefs,
                  messages: e.target.checked,
                })
              }
            />
          </label>
        </form>
      </SectionCard>
    );
  };

  return (
    <main className={`min-h-screen ${missionClasses} text-slate-900`}>
      <Sidebar
        navItems={sidebarNav}
        activeItem={activeSection}
        onSelect={(itemId) => {
          const next = itemId as NavSection;
          setActiveSection(next);
          if (next === "discover") {
            setActiveTab("projects");
          } else if (next === "opportunities") {
            setActiveTab("recommendations");
          } else if (next === "home") {
            setActiveTab("overview");
          }
          router.replace(`/volunteer-dashboard?section=${next}`, { scroll: false });
        }}
        profileName={profile.displayName}
        profileRole="Volunteer"
        profileCompletion={profile.profileCompletion}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((current) => !current)}
      />

      <div className="lg:pl-[280px]">
        <div className="mx-auto max-w-[1560px] p-4 pt-20 lg:p-8 lg:pt-8">
          {notice ? (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              <Bell className="h-3.5 w-3.5" /> {unreadNotifications} unread notifications
            </span>
            <button
              type="button"
              onClick={() => setShowContributionModal(true)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Log activity
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <VolunteerProfileCard
              volunteer={profile}
              onEditProfile={() => {
                setProfileDraft({
                  displayName: profile.displayName,
                  bio: profile.bio,
                  location: profile.location,
                  skills: (profile.skills || []).join(", "),
                  interests: (profile.interests || []).join(", "),
                  photoUrl: profile.photoUrl || "",
                });
                setProfilePhotoError("");
                setShowProfileEditor(true);
              }}
              onToggleAvailability={() => void onToggleAvailability(!profile.availableForProjects)}
            />

            <div className="space-y-5">{renderSection()}</div>
          </div>

          <SectionCard title="Notifications">
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-600">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-xs text-slate-600">{n.body}</p>
                    </div>
                    {!n.read ? (
                      <button
                        type="button"
                        onClick={() => void onMarkNotificationRead(n.id)}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        Mark read
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700">Read</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <FloatingActions
        onCustomize={() =>
          setThemeMode((prev) =>
            prev === "mission" ? "clean" : prev === "clean" ? "contrast" : "mission"
          )
        }
        onLogContribution={() => setShowContributionModal(true)}
        onShare={() => {
          void navigator.clipboard.writeText(window.location.href);
        }}
      />

      {showProfileEditor ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={handleProfileSubmit} className="w-full max-w-lg rounded-2xl bg-white p-5">
            <h3 className="mb-4 text-xl font-bold">Edit Volunteer Profile</h3>
            <div className="space-y-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Profile photo
                </p>
                <div className="mb-3 flex items-center gap-3">
                  {profileDraft.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileDraft.photoUrl}
                      alt="Profile preview"
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
                  )}
                  <div className="text-xs text-slate-600">
                    Upload a square photo. It will be visible on your volunteer profile.
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setProfilePhotoError("");
                    void fileToDataUrl(file)
                      .then((photoDataUrl) => {
                        setProfileDraft((prev) => ({ ...prev, photoUrl: photoDataUrl }));
                      })
                      .catch((uploadErr) => {
                        setProfilePhotoError(
                          uploadErr instanceof Error
                            ? uploadErr.message
                            : "Could not upload image."
                        );
                      });
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                {profileDraft.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => setProfileDraft((prev) => ({ ...prev, photoUrl: "" }))}
                    className="mt-2 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                  >
                    Remove photo
                  </button>
                ) : null}
                {profilePhotoError ? (
                  <p className="mt-2 text-xs text-red-600">{profilePhotoError}</p>
                ) : null}
              </div>
              <input
                value={profileDraft.displayName}
                onChange={(e) => setProfileDraft((prev) => ({ ...prev, displayName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Full name"
              />
              <textarea
                value={profileDraft.bio}
                onChange={(e) => setProfileDraft((prev) => ({ ...prev, bio: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                rows={3}
                placeholder="Mission-aligned bio"
              />
              <input
                value={profileDraft.location}
                onChange={(e) => setProfileDraft((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Location"
              />
              <input
                value={profileDraft.skills}
                onChange={(e) => setProfileDraft((prev) => ({ ...prev, skills: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Skills (comma separated)"
              />
              <input
                value={profileDraft.interests}
                onChange={(e) => setProfileDraft((prev) => ({ ...prev, interests: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Interests (comma separated)"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowProfileEditor(false)} className="rounded-xl border px-3 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                Save profile
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showContributionModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={handleContributionSubmit} className="w-full max-w-lg rounded-2xl bg-white p-5">
            <h3 className="mb-4 text-xl font-bold">Log Contribution Hours</h3>
            <div className="space-y-2">
              <select
                value={contributionDraft.projectId}
                onChange={(e) => setContributionDraft((prev) => ({ ...prev, projectId: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="">Select project</option>
                {activeProjects.map((project) => (
                  <option key={String(project.id)} value={String(project.id)}>
                    {project.title}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={contributionDraft.hours}
                onChange={(e) => setContributionDraft((prev) => ({ ...prev, hours: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Hours"
              />
              <textarea
                value={contributionDraft.notes}
                onChange={(e) => setContributionDraft((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                rows={3}
                placeholder="Contribution details"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contributionDraft.completedTask}
                  onChange={(e) =>
                    setContributionDraft((prev) => ({ ...prev, completedTask: e.target.checked }))
                  }
                />
                Mark task complete
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowContributionModal(false)} className="rounded-xl border px-3 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                Save contribution
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isBusy ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Processing...
        </div>
      ) : null}
    </main>
  );
}
