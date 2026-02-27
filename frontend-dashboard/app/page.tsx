"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Database,
  Leaf,
  Loader2,
  MapPinned,
  Search,
  UserPlus,
  Users,
} from "lucide-react";

type MatchVolunteer = {
  volunteer_id: string;
  full_name: string;
  email: string;
  skill_summary: string;
  cosine_similarity: string;
};

type Stats = {
  volunteers: number;
  totalImpact: number;
  activeProjects: number;
};

type VolunteerPreview = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  skillSummary: string;
  createdAt: string;
};

type ProjectPreview = {
  id: string;
  name: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
};

type ApiErrorResponse = {
  message?: string;
  error?: {
    message?: string;
  };
};

const ORCHESTRATOR_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:3000";
const INTELLIGENCE_URL =
  process.env.NEXT_PUBLIC_INTELLIGENCE_URL || "http://localhost:8001";

export default function Page() {
  const [status, setStatus] = useState<"loading" | "connected" | "disconnected">(
    "loading"
  );
  const [stats, setStats] = useState<Stats>({
    volunteers: 0,
    totalImpact: 0,
    activeProjects: 0,
  });
  const [recentVolunteers, setRecentVolunteers] = useState<VolunteerPreview[]>([]);
  const [openProjects, setOpenProjects] = useState<ProjectPreview[]>([]);
  const [skill, setSkill] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [results, setResults] = useState<MatchVolunteer[]>([]);
  const [error, setError] = useState("");
  const [volunteerForm, setVolunteerForm] = useState({
    fullName: "",
    email: "",
    skillSummary: "",
  });
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    adminKey: "",
  });
  const [isSubmittingVolunteer, setIsSubmittingVolunteer] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [volunteerNotice, setVolunteerNotice] = useState("");
  const [projectNotice, setProjectNotice] = useState("");

  const loadPlatformState = async () => {
    try {
      const [statusRes, statsRes, volunteersRes, projectsRes] = await Promise.all([
        fetch(`${ORCHESTRATOR_URL}/api/v1/status`),
        fetch(`${ORCHESTRATOR_URL}/api/v1/stats`),
        fetch(`${ORCHESTRATOR_URL}/api/v1/volunteers?limit=6`),
        fetch(`${ORCHESTRATOR_URL}/api/v1/projects?scope=active&limit=6`),
      ]);

      if (statusRes.ok) {
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }

      if (statsRes.ok) {
        const data = (await statsRes.json()) as Stats;
        setStats(data);
      }

      if (volunteersRes.ok) {
        const data = (await volunteersRes.json()) as {
          data?: VolunteerPreview[];
        };
        setRecentVolunteers(data.data || []);
      }

      if (projectsRes.ok) {
        const data = (await projectsRes.json()) as {
          data?: ProjectPreview[];
        };
        setOpenProjects(data.data || []);
      }
    } catch {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    void loadPlatformState();
  }, []);

  const handleVolunteerSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setVolunteerNotice("");
    setIsSubmittingVolunteer(true);

    try {
      const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/volunteers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: volunteerForm.fullName,
          email: volunteerForm.email,
          skillSummary: volunteerForm.skillSummary,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | ApiErrorResponse
        | { embeddingIndexed?: boolean };

      if (!response.ok) {
        setVolunteerNotice(
          payload.message || payload.error?.message || "Volunteer onboarding failed."
        );
        return;
      }

      const embeddingIndexed =
        "embeddingIndexed" in payload ? Boolean(payload.embeddingIndexed) : true;

      setVolunteerNotice(
        embeddingIndexed
          ? "Volunteer added and indexed for matching."
          : "Volunteer added. Embedding index is pending."
      );
      setVolunteerForm({ fullName: "", email: "", skillSummary: "" });
      await loadPlatformState();
    } catch {
      setVolunteerNotice("Could not reach onboarding service.");
    } finally {
      setIsSubmittingVolunteer(false);
    }
  };

  const handleProjectSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setProjectNotice("");
    setIsSubmittingProject(true);

    try {
      const adminKey = projectForm.adminKey.trim();
      const isAdminSubmission = adminKey.length > 0;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (isAdminSubmission) {
        headers["X-Admin-Key"] = adminKey;
      }

      const endpoint = isAdminSubmission
        ? `${ORCHESTRATOR_URL}/api/v1/projects`
        : `${ORCHESTRATOR_URL}/api/v1/projects/public`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: projectForm.name,
          description: projectForm.description,
          latitude: Number(projectForm.latitude),
          longitude: Number(projectForm.longitude),
          status: "OPEN",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;

      if (!response.ok) {
        setProjectNotice(
          payload.message || payload.error?.message || "Project creation failed."
        );
        return;
      }

      setProjectNotice(
        isAdminSubmission
          ? "Project posted via admin channel and opened for matching."
          : "Project submitted publicly and opened for volunteer matching."
      );
      setProjectForm({
        name: "",
        description: "",
        latitude: "",
        longitude: "",
        adminKey: "",
      });
      await loadPlatformState();
    } catch {
      setProjectNotice("Could not reach project onboarding service.");
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleMatch = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) return;

    setError("");
    setIsMatching(true);

    try {
      const response = await fetch(`${INTELLIGENCE_URL}/api/v1/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectDescription: `Need volunteers skilled in ${trimmedSkill} for urgent sustainability deployment.`,
          topK: 5,
        }),
      });

      const data = (await response.json()) as { data?: MatchVolunteer[]; error?: { message?: string } };

      if (!response.ok) {
        setResults([]);
        setError(data.error?.message || "Matching request failed.");
        return;
      }

      setResults(data.data || []);
    } catch {
      setResults([]);
      setError("Could not reach matcher service.");
    } finally {
      setIsMatching(false);
    }
  };

  const statusClasses = useMemo(() => {
    if (status === "connected") {
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    }
    if (status === "disconnected") {
      return "border-red-300 bg-red-50 text-red-700";
    }
    return "border-slate-300 bg-slate-100 text-slate-700";
  }, [status]);

  const projectStatusClasses = useMemo(
    () => ({
      OPEN: "border-emerald-200 bg-emerald-50 text-emerald-700",
      IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
      COMPLETED: "border-slate-200 bg-slate-100 text-slate-700",
      CANCELLED: "border-red-200 bg-red-50 text-red-700",
    }),
    []
  );

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-blue-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-2xl font-bold text-blue-900">TurkNode</div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${statusClasses}`}
          >
            <Database className="h-4 w-4" />
            {status === "loading" ? "Checking Docker DB..." : `Status: Docker DB ${status}`}
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border-2 border-blue-900 bg-white p-5">
            <div className="mb-2 flex items-center gap-2 text-blue-900">
              <Users className="h-5 w-5" />
              <span className="font-medium">Volunteers</span>
            </div>
            <p className="text-4xl font-bold text-emerald-600">{stats.volunteers}</p>
          </div>

          <div className="rounded-xl border-2 border-blue-900 bg-white p-5">
            <div className="mb-2 flex items-center gap-2 text-blue-900">
              <Leaf className="h-5 w-5" />
              <span className="font-medium">Total Impact</span>
            </div>
            <p className="text-4xl font-bold text-blue-900">
              {stats.totalImpact.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="rounded-xl border-2 border-blue-900 bg-white p-5">
            <div className="mb-2 flex items-center gap-2 text-blue-900">
              <Briefcase className="h-5 w-5" />
              <span className="font-medium">Active Projects</span>
            </div>
            <p className="text-4xl font-bold text-emerald-600">{stats.activeProjects}</p>
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50/40 p-5">
          <h2 className="text-lg font-semibold text-blue-900">How TurkNode Works</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-blue-200 bg-white p-3">
              <p className="text-sm font-semibold text-blue-900">1. Onboard Volunteers</p>
              <p className="mt-1 text-sm text-slate-700">
                Add a volunteer profile with skill summary. The platform indexes embeddings automatically.
              </p>
            </article>
            <article className="rounded-lg border border-blue-200 bg-white p-3">
              <p className="text-sm font-semibold text-blue-900">2. Post Urgent Projects</p>
              <p className="mt-1 text-sm text-slate-700">
                Register a sustainability project with geolocation and urgency context.
              </p>
            </article>
            <article className="rounded-lg border border-blue-200 bg-white p-3">
              <p className="text-sm font-semibold text-blue-900">3. Run AI Matching</p>
              <p className="mt-1 text-sm text-slate-700">
                Use the matcher to rank top-fit volunteers for rapid deployment.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border-2 border-blue-900 bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-blue-900">
              <UserPlus className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Join As Volunteer</h2>
            </div>

            <form onSubmit={handleVolunteerSubmit} className="space-y-3">
              <input
                value={volunteerForm.fullName}
                onChange={(event) =>
                  setVolunteerForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                placeholder="Full name"
                className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                required
              />
              <input
                type="email"
                value={volunteerForm.email}
                onChange={(event) =>
                  setVolunteerForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="Email"
                className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                required
              />
              <textarea
                value={volunteerForm.skillSummary}
                onChange={(event) =>
                  setVolunteerForm((prev) => ({
                    ...prev,
                    skillSummary: event.target.value,
                  }))
                }
                placeholder="Skills summary (e.g., solar microgrids, GIS mapping, logistics)"
                className="h-24 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={isSubmittingVolunteer}
                className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-200"
              >
                {isSubmittingVolunteer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Volunteer Profile"
                )}
              </button>
            </form>
            {volunteerNotice ? (
              <p className="mt-3 text-sm text-slate-700">{volunteerNotice}</p>
            ) : null}
          </article>

          <article className="rounded-xl border-2 border-blue-900 bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-blue-900">
              <MapPinned className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Post A Project</h2>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Public project posting is enabled. Use an admin key only for protected admin submissions.
            </p>

            <form onSubmit={handleProjectSubmit} className="space-y-3">
              <input
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Project title"
                className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                required
              />
              <textarea
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Urgency, impact goals, and required skills"
                className="h-24 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  step="any"
                  value={projectForm.latitude}
                  onChange={(event) =>
                    setProjectForm((prev) => ({ ...prev, latitude: event.target.value }))
                  }
                  placeholder="Latitude"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                  required
                />
                <input
                  type="number"
                  step="any"
                  value={projectForm.longitude}
                  onChange={(event) =>
                    setProjectForm((prev) => ({ ...prev, longitude: event.target.value }))
                  }
                  placeholder="Longitude"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                  required
                />
              </div>
              <input
                type="password"
                value={projectForm.adminKey}
                onChange={(event) =>
                  setProjectForm((prev) => ({ ...prev, adminKey: event.target.value }))
                }
                placeholder="Optional admin key (leave blank for public posting)"
                className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmittingProject}
                className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-200"
              >
                {isSubmittingProject ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Publish Project"
                )}
              </button>
            </form>
            {projectNotice ? (
              <p className="mt-3 text-sm text-slate-700">{projectNotice}</p>
            ) : null}
          </article>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-blue-200 bg-white p-5">
            <h3 className="text-base font-semibold text-blue-900">Recently Onboarded Volunteers</h3>
            <div className="mt-3 space-y-3">
              {recentVolunteers.length === 0 ? (
                <p className="text-sm text-slate-500">No volunteers yet.</p>
              ) : (
                recentVolunteers.map((volunteer) => (
                  <div
                    key={volunteer.id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <p className="font-medium text-blue-900">{volunteer.fullName}</p>
                    <p className="text-sm text-slate-600">{volunteer.email}</p>
                    <p className="mt-1 text-sm text-slate-700">{volunteer.skillSummary || "Skill summary pending"}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-xl border border-blue-200 bg-white p-5">
            <h3 className="text-base font-semibold text-blue-900">Open Project Intake</h3>
            <div className="mt-3 space-y-3">
              {openProjects.length === 0 ? (
                <p className="text-sm text-slate-500">No active projects yet.</p>
              ) : (
                openProjects.map((project) => (
                  <div key={project.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-blue-900">{project.name}</p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          projectStatusClasses[project.status]
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{project.description}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="text-center text-xl font-semibold text-blue-900">AI Matcher</h2>

          <form
            onSubmit={handleMatch}
            className="mx-auto mt-4 flex w-full max-w-2xl items-center gap-3"
          >
            <div className="flex flex-1 items-center rounded-xl border-2 border-blue-900 px-4 py-3">
              <Search className="mr-2 h-4 w-4 text-blue-900" />
              <input
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
                placeholder="Type a skill (e.g., GIS mapping, logistics, reforestation)"
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={skill.trim().length === 0 || isMatching}
              className="inline-flex min-w-24 items-center justify-center rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-200"
            >
              {isMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Match"}
            </button>
          </form>

          {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
        </section>

        <section className="mt-10">
          <h3 className="mb-4 text-lg font-semibold text-blue-900">
            Results ({results.length})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((volunteer) => (
              <article
                key={volunteer.volunteer_id}
                className="rounded-xl border border-slate-200 border-t-2 border-t-emerald-500 bg-white p-5 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-blue-900">
                  <Users className="h-4 w-4" />
                  <p className="font-semibold">{volunteer.full_name}</p>
                </div>
                <p className="mb-2 text-sm text-slate-600">{volunteer.email}</p>
                <p className="mb-3 text-sm text-slate-700">{volunteer.skill_summary}</p>
                <p className="text-sm font-medium text-emerald-700">
                  Match Score: {Number(volunteer.cosine_similarity).toFixed(3)}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
