"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Menu, X } from "lucide-react";
import { auth, firebaseReady } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import {
  createProject,
  listApplicationsForLead,
  listEvents,
  listTasksForLead,
  listThreads,
  listVolunteers,
  getUserProfile,
  listProjects,
  seedIfEmpty,
  updateApplicationState,
  updateTaskStatus,
  upsertUserProfile,
  type ApplicationDoc,
  type EventDoc,
  type ProjectDoc,
  type TaskDoc,
  type UserProfileDoc,
} from "../../lib/turknodeDb";
import ActiveProjectsModule from "./components/ActiveProjectsModule";
import ApplicationsQueue from "./components/ApplicationsQueue";
import CommandSummary from "./components/CommandSummary";
import EventsPanel from "./components/EventsPanel";
import ImpactAnalytics from "./components/ImpactAnalytics";
import KPIGrid from "./components/KPIGrid";
import ManagerHeader from "./components/ManagerHeader";
import ManagerSidebar from "./components/ManagerSidebar";
import MessagesPanel from "./components/MessagesPanel";
import QuickActions from "./components/QuickActions";
import TaskTracker from "./components/TaskTracker";
import VolunteersModule from "./components/VolunteersModule";
import type { ApplicationRow, ManagerSection, ManagerTab, MessageThread, TaskRow, VolunteerRow } from "./types";

type FormState = {
  title: string;
  description: string;
  category: string;
  location: string;
  skillsRequired: string;
  startDate: string;
  endDate: string;
  impactMetric: string;
};

const initialForm: FormState = {
  title: "",
  description: "",
  category: "Community",
  location: "",
  skillsRequired: "",
  startDate: "",
  endDate: "",
  impactMetric: "",
};

function mapApplication(doc: ApplicationDoc): ApplicationRow {
  return {
    id: doc.id,
    name: doc.applicantName,
    project: doc.projectTitle,
    skillsMatch: doc.skillsMatch || 0,
    availability: doc.availability || "Not specified",
    message: doc.message || "No message included.",
    appliedAt: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Recently",
    state: doc.state || "pending",
  };
}

function mapTask(doc: TaskDoc): TaskRow {
  return {
    id: doc.id,
    title: doc.title,
    volunteer: doc.assignedVolunteerName || "Unassigned",
    project: doc.projectTitle || "General",
    dueDate: doc.dueDate,
    priority: doc.priority || "medium",
    status: doc.status || "todo",
  };
}

function mapVolunteer(row: UserProfileDoc): VolunteerRow {
  const isAssigned = (row.completedProjects || 0) > 0 || (row.hoursContributed || 0) > 0;
  return {
    id: row.uid,
    name: row.displayName || "Volunteer",
    skills: row.skills || [],
    assignment: isAssigned ? "Active assignment" : "Unassigned",
    hours: row.hoursContributed || 0,
    status: row.availableForProjects
      ? isAssigned
        ? "assigned"
        : "needs-assignment"
      : "available",
  };
}

export default function ProjectLeadDashboardPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement | null>(null);
  const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ManagerSection>("dashboard");
  const [tab, setTab] = useState<ManagerTab>("overview");
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [events, setEvents] = useState<EventDoc[]>([]);

  const refresh = async (currentUid: string) => {
    const [profileRow, projectsRows, volunteerRows, threadRows, eventRows] = await Promise.all([
      getUserProfile(currentUid),
      listProjects(),
      listVolunteers(),
      listThreads(currentUid),
      listEvents(),
    ]);
    setProfile(profileRow);
    setProjects(projectsRows);
    setVolunteers(volunteerRows.map(mapVolunteer));
    setThreads(
      threadRows.map((thread) => ({
        id: String(thread.id),
        title: Array.isArray(thread.members)
          ? `Conversation (${(thread.members as string[]).length} members)`
          : "Conversation",
        preview: String(thread.lastMessage || "No messages yet."),
        unread: 0,
        updatedAt: thread.updatedAt
          ? new Date(String(thread.updatedAt)).toLocaleString()
          : "Recently",
      }))
    );
    setEvents(eventRows);

    const leadEmail = (profileRow?.email || "").trim();
    if (leadEmail) {
      const [applicationRows, taskRows] = await Promise.all([
        listApplicationsForLead(leadEmail),
        listTasksForLead(leadEmail),
      ]);
      setApplications(applicationRows.map(mapApplication));
      setTasks(taskRows.map(mapTask));
    } else {
      setApplications([]);
      setTasks([]);
    }
  };

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setAuthStatus("unavailable");
      return;
    }

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUid("");
        setProfile(null);
        setAuthStatus("ready");
        return;
      }

      try {
        setUid(user.uid);
        await seedIfEmpty(user.uid, user.email || "", user.displayName || "Project Lead");
        const existing = await getUserProfile(user.uid);
        if (!existing || existing.role !== "manager") {
          await upsertUserProfile(user.uid, {
            uid: user.uid,
            email: user.email || existing?.email || "",
            displayName: user.displayName || existing?.displayName || "Project Lead",
            role: "manager",
            availableForProjects: true,
          });
        }

        await refresh(user.uid);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project lead dashboard.");
      } finally {
        setAuthStatus("ready");
      }
    });

    return () => unsub();
  }, []);

  const managerProjects = useMemo(() => {
    const email = (profile?.email || "").toLowerCase();
    return projects.filter((project) => (project.projectLead || "").toLowerCase() === email);
  }, [projects, profile?.email]);

  const activeProjects = useMemo(
    () => managerProjects.filter((project) => project.status === "active"),
    [managerProjects]
  );

  const kpis = useMemo(
    () => [
      { label: "Active Projects", value: `${activeProjects.length}`, tone: "accent" as const },
      {
        label: "Open Volunteer Roles",
        value: `${Math.max(0, activeProjects.reduce((sum, p) => sum + (3 - Math.min(3, p.participantCount || 0)), 0))}`,
      },
      { label: "Pending Applications", value: `${applications.filter((a) => a.state === "pending").length}` },
      { label: "Upcoming Events", value: `${events.length}` },
      {
        label: "Tasks Due This Week",
        value: `${tasks.filter((t) => t.status !== "done").length}`,
      },
      {
        label: "Total Impact Score",
        value: `${profile?.impactScore || 0}`,
        tone: "good" as const,
      },
    ],
    [activeProjects, applications, events.length, profile?.impactScore, tasks]
  );

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uid || !profile) return;
    setIsBusy(true);
    setError("");
    setNotice("");

    try {
      await createProject({
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        skillsRequired: form.skillsRequired
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        startDate: form.startDate,
        endDate: form.endDate,
        impactMetric: form.impactMetric,
        projectLead: profile.email,
      });
      setForm(initialForm);
      await refresh(uid);
      setNotice("Project published. Volunteers can now discover and join it.");
      setActiveSection("projects");
      setTab("projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    setIsBusy(true);
    setError("");
    try {
      await signOut(auth);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
      setIsBusy(false);
    }
  };

  const handleApplicationState = async (id: string, state: ApplicationRow["state"]) => {
    try {
      setIsBusy(true);
      setError("");
      await updateApplicationState(id, state);
      setApplications((prev) => prev.map((row) => (row.id === id ? { ...row, state } : row)));
      setNotice(`Application ${state}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update application state.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleTaskState = async (id: string, status: TaskRow["status"]) => {
    try {
      setIsBusy(true);
      setError("");
      await updateTaskStatus(id, status);
      setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
      setNotice(`Task updated to ${status.replace("_", " ")}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task status.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleProjectAction = (projectId: string, action: "view" | "edit" | "assign" | "tasks") => {
    if (action === "tasks") {
      setActiveSection("tasks");
      setTab("projects");
      setNotice("Showing project tasks for operational follow-up.");
      return;
    }
    if (action === "assign") {
      setActiveSection("volunteers");
      setTab("volunteers");
      setNotice("Open volunteer management to assign team members.");
      return;
    }
    if (action === "edit") {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setNotice(`Editing flow ready for project ID: ${projectId}`);
      return;
    }
    setNotice(`Viewing project details for ${projectId}`);
  };

  const showOverview = tab === "overview" && activeSection === "dashboard";

  if (authStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7F5]">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading project lead workspace...
        </div>
      </main>
    );
  }

  if (authStatus === "unavailable") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7F5] p-6 text-center">
        <div className="rounded-2xl border border-amber-200 bg-white p-6">
          <p className="text-slate-800">Firebase auth is unavailable in this environment.</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7F5] p-6 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="mb-3 text-slate-700">No active session. Please sign in as a project lead.</p>
          <button
            type="button"
            onClick={() => router.push("/?next=/project-lead-dashboard")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Return to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F7F5] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="mb-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Menu
        </button>

        <div className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
          <ManagerSidebar
            active={activeSection}
            onChange={(next) => {
              setActiveSection(next);
              setSidebarOpen(false);
            }}
            profileName={profile.displayName}
            profileCompletion={profile.profileCompletion}
          />
        </div>

        <div className="space-y-5">
          <ManagerHeader onCreateProject={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(["overview", "projects", "volunteers", "analytics"] as ManagerTab[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    tab === item ? "bg-[#0b1a37] text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>

          {notice ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</p>
          ) : null}
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          ) : null}

          {(showOverview || tab === "projects" || activeSection === "projects") && <CommandSummary />}
          {(showOverview || tab === "projects" || tab === "analytics") && <KPIGrid items={kpis} />}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              {(showOverview || tab === "projects" || activeSection === "projects") && (
                <ActiveProjectsModule projects={activeProjects} onAction={handleProjectAction} />
              )}

              {(showOverview || tab === "volunteers" || activeSection === "volunteers" || activeSection === "applications") && (
                <div className="grid gap-5 xl:grid-cols-2">
                  <VolunteersModule volunteers={volunteers} />
                  <ApplicationsQueue
                    applications={applications.filter((item) => item.state === "pending" || item.state === "saved")}
                    onStateChange={handleApplicationState}
                    onMessage={(applicationId) => {
                      setActiveSection("messages");
                      setNotice(`Message workspace opened for applicant ${applicationId}.`);
                    }}
                  />
                </div>
              )}

              {(showOverview || tab === "projects" || activeSection === "tasks" || activeSection === "events") && (
                <div className="grid gap-5 xl:grid-cols-2">
                  <TaskTracker tasks={tasks} onStatus={handleTaskState} />
                  <EventsPanel
                    events={events.map((event) => ({
                      id: String(event.id),
                      title: event.title,
                      type: event.type || "community",
                      when: new Date(event.startsAt).toLocaleString(),
                      location: event.location,
                      rsvpCount: (event.rsvps || []).length,
                    }))}
                  />
                </div>
              )}

              {(showOverview || activeSection === "messages") && <MessagesPanel threads={threads} />}

              {(showOverview || tab === "analytics" || activeSection === "impact") && (
                <ImpactAnalytics
                  hours={profile.hoursContributed}
                  activeInitiatives={activeProjects.length}
                  completed={profile.completedProjects}
                />
              )}

              {activeSection === "settings" ? (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-black tracking-tight text-slate-900">Manager Settings</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Configure communication preferences, notification cadence, and partner reporting defaults.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      Application alerts
                      <input type="checkbox" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      Deadline reminders
                      <input type="checkbox" defaultChecked />
                    </label>
                  </div>
                </section>
              ) : null}
            </div>

            <div className="space-y-5">
              <QuickActions onCreateProject={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

              <section ref={formRef} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-black tracking-tight text-slate-900">Create Project</h3>
                <p className="mt-1 text-sm text-slate-600">Publish roles, receive applicants, and start coordination.</p>

                <form onSubmit={handleCreateProject} className="mt-4 space-y-3">
                  <input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Project title"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    required
                  />
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Description"
                    className="h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    required
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="Category" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" required />
                    <input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Location" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" required />
                    <input type="date" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" required />
                    <input type="date" value={form.endDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" required />
                  </div>
                  <input value={form.skillsRequired} onChange={(event) => setForm((prev) => ({ ...prev, skillsRequired: event.target.value }))} placeholder="Skills required (comma separated)" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" />
                  <input value={form.impactMetric} onChange={(event) => setForm((prev) => ({ ...prev, impactMetric: event.target.value }))} placeholder="Impact metric" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" />
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#0b1a37] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#13264d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Project"}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
