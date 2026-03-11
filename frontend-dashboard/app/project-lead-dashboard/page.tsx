"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, PlusCircle, Users } from "lucide-react";
import { auth, firebaseReady } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import {
  createProject,
  getUserProfile,
  listProjects,
  seedIfEmpty,
  upsertUserProfile,
  type ProjectDoc,
  type UserProfileDoc,
} from "../../lib/turknodeDb";

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

export default function ProjectLeadDashboardPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refresh = async (currentUid: string) => {
    const [profileRow, projectsRows] = await Promise.all([
      getUserProfile(currentUid),
      listProjects(),
    ]);

    setProfile(profileRow);
    setProjects(projectsRows);
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
    <main className="min-h-screen bg-[#F6F7F5] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">TurkNode</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Project Lead Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">Create initiatives and track volunteer participation.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/volunteer-dashboard")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Open Volunteer View
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </header>

        {notice ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</p>
        ) : null}
        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Publish a project</h2>
            <p className="mt-1 text-sm text-slate-600">Projects you publish here immediately appear in volunteer discovery.</p>

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
                placeholder="Describe the initiative, expected outcomes, and volunteer tasks"
                className="h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="Category"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  required
                />
                <input
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="Location"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  required
                />
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  required
                />
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  required
                />
              </div>
              <input
                value={form.skillsRequired}
                onChange={(event) => setForm((prev) => ({ ...prev, skillsRequired: event.target.value }))}
                placeholder="Skills required (comma separated)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              />
              <input
                value={form.impactMetric}
                onChange={(event) => setForm((prev) => ({ ...prev, impactMetric: event.target.value }))}
                placeholder="Impact metric (e.g. households reached)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              />

              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1a37] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#13264d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Publish Project
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Your projects</h2>
            <p className="mt-1 text-sm text-slate-600">Monitor volunteer uptake and keep initiatives active.</p>

            <div className="mt-4 space-y-3">
              {managerProjects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  No projects published yet. Create your first project to start receiving volunteers.
                </p>
              ) : (
                managerProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{project.category}</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">{project.title}</h3>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${project.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">{project.location}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                        <Users className="h-3.5 w-3.5" /> {project.participantCount || 0} volunteers
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">Impact: {project.impactMetric}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
