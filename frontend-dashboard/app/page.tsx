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
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

type VolunteerFormErrors = {
  fullName?: string;
  email?: string;
  skillSummary?: string;
};

type ProjectFormErrors = {
  name?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
};

type ToastState = {
  tone: "success" | "error";
  message: string;
};

const ORCHESTRATOR_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:3000";
const INTELLIGENCE_URL =
  process.env.NEXT_PUBLIC_INTELLIGENCE_URL || "http://localhost:8001";
const MIN_SKILL_SUMMARY_LENGTH = 20;

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
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(true);
  const [activeIntakeTab, setActiveIntakeTab] = useState<"volunteer" | "project">(
    "volunteer"
  );
  const [volunteerErrors, setVolunteerErrors] = useState<VolunteerFormErrors>({});
  const [projectErrors, setProjectErrors] = useState<ProjectFormErrors>({});
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (tone: ToastState["tone"], message: string) => {
    setToast({ tone, message });
  };

  const validateVolunteerForm = () => {
    const errors: VolunteerFormErrors = {};

    if (volunteerForm.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters.";
    }

    const normalizedEmail = volunteerForm.email.trim();
    if (normalizedEmail.length === 0) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (volunteerForm.skillSummary.trim().length < MIN_SKILL_SUMMARY_LENGTH) {
      errors.skillSummary = "Skill summary must be at least 20 characters.";
    }

    setVolunteerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProjectForm = () => {
    const errors: ProjectFormErrors = {};

    if (projectForm.name.trim().length < 3) {
      errors.name = "Project title must be at least 3 characters.";
    }

    if (projectForm.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters.";
    }

    const latitude = Number(projectForm.latitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = "Latitude must be between -90 and 90.";
    }

    const longitude = Number(projectForm.longitude);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = "Longitude must be between -180 and 180.";
    }

    setProjectErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadPlatformState = async () => {
    setIsDirectoryLoading(true);
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
    } finally {
      setIsDirectoryLoading(false);
    }
  };

  useEffect(() => {
    void loadPlatformState();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleVolunteerSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setVolunteerNotice("");
    setVolunteerErrors({});

    if (!validateVolunteerForm()) {
      return;
    }
    const normalizedSkillSummary = volunteerForm.skillSummary.trim();

    setIsSubmittingVolunteer(true);

    try {
      const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/volunteers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: volunteerForm.fullName,
          email: volunteerForm.email,
          skillSummary: normalizedSkillSummary,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | ApiErrorResponse
        | { embeddingIndexed?: boolean };

      if (!response.ok) {
        const errorPayload = payload as ApiErrorResponse;
        const nextErrors: VolunteerFormErrors = {
          skillSummary: errorPayload.details?.fieldErrors?.skillSummary?.[0],
          email: errorPayload.details?.fieldErrors?.email?.[0],
          fullName: errorPayload.details?.fieldErrors?.fullName?.[0],
        };
        setVolunteerErrors(nextErrors);
        const firstError =
          nextErrors.skillSummary ||
          nextErrors.email ||
          nextErrors.fullName ||
          errorPayload.message ||
          errorPayload.error?.message ||
          "Volunteer onboarding failed.";
        setVolunteerNotice(firstError);
        showToast("error", firstError);
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
      showToast(
        "success",
        embeddingIndexed
          ? "Volunteer profile created successfully."
          : "Volunteer created. Embedding indexing is pending."
      );
      await loadPlatformState();
    } catch {
      const message = "Could not reach onboarding service.";
      setVolunteerNotice(message);
      showToast("error", message);
    } finally {
      setIsSubmittingVolunteer(false);
    }
  };

  const handleProjectSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setProjectNotice("");
    setProjectErrors({});

    if (!validateProjectForm()) {
      return;
    }

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
        const message = payload.message || payload.error?.message || "Project creation failed.";
        setProjectNotice(message);
        showToast("error", message);
        return;
      }

      const successMessage =
        isAdminSubmission
          ? "Project posted via admin channel and opened for matching."
          : "Project submitted publicly and opened for volunteer matching.";
      setProjectNotice(successMessage);
      showToast("success", successMessage);
      setProjectForm({
        name: "",
        description: "",
        latitude: "",
        longitude: "",
        adminKey: "",
      });
      await loadPlatformState();
    } catch {
      const message = "Could not reach project onboarding service.";
      setProjectNotice(message);
      showToast("error", message);
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

      {toast ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm">
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.tone === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

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

        <section id="intake" className="mt-10 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-blue-900">Intake Workspace</h2>
            <div className="inline-flex rounded-lg border border-blue-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setActiveIntakeTab("volunteer")}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  activeIntakeTab === "volunteer"
                    ? "bg-blue-900 text-white"
                    : "text-blue-900 hover:bg-blue-50"
                }`}
              >
                Volunteer Intake
              </button>
              <button
                type="button"
                onClick={() => setActiveIntakeTab("project")}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  activeIntakeTab === "project"
                    ? "bg-blue-900 text-white"
                    : "text-blue-900 hover:bg-blue-50"
                }`}
              >
                Project Intake
              </button>
            </div>
          </div>

          {activeIntakeTab === "volunteer" ? (
            <article className="mt-5 rounded-xl border border-blue-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2 text-blue-900">
                <UserPlus className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Join As Volunteer</h3>
              </div>

              <form onSubmit={handleVolunteerSubmit} className="space-y-3">
                <div>
                  <input
                    value={volunteerForm.fullName}
                    onChange={(event) =>
                      setVolunteerForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    placeholder="Full name"
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                      volunteerErrors.fullName
                        ? "border-red-300 focus:border-red-500"
                        : "border-blue-200 focus:border-blue-900"
                    }`}
                    required
                  />
                  {volunteerErrors.fullName ? (
                    <p className="mt-1 text-xs text-red-600">{volunteerErrors.fullName}</p>
                  ) : null}
                </div>

                <div>
                  <input
                    type="email"
                    value={volunteerForm.email}
                    onChange={(event) =>
                      setVolunteerForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="Email"
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                      volunteerErrors.email
                        ? "border-red-300 focus:border-red-500"
                        : "border-blue-200 focus:border-blue-900"
                    }`}
                    required
                  />
                  {volunteerErrors.email ? (
                    <p className="mt-1 text-xs text-red-600">{volunteerErrors.email}</p>
                  ) : null}
                </div>

                <div>
                  <textarea
                    value={volunteerForm.skillSummary}
                    onChange={(event) =>
                      setVolunteerForm((prev) => ({
                        ...prev,
                        skillSummary: event.target.value,
                      }))
                    }
                    placeholder="Skills summary (e.g., solar microgrids, GIS mapping, logistics)"
                    className={`h-24 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                      volunteerErrors.skillSummary
                        ? "border-red-300 focus:border-red-500"
                        : "border-blue-200 focus:border-blue-900"
                    }`}
                    minLength={MIN_SKILL_SUMMARY_LENGTH}
                    required
                  />
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <p className="text-slate-500">
                      Minimum 20 characters so the AI matcher can index useful context.
                    </p>
                    <p className="text-slate-500">{volunteerForm.skillSummary.trim().length}/20+</p>
                  </div>
                  {volunteerErrors.skillSummary ? (
                    <p className="mt-1 text-xs text-red-600">{volunteerErrors.skillSummary}</p>
                  ) : null}
                </div>

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
          ) : (
            <article className="mt-5 rounded-xl border border-blue-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2 text-blue-900">
                <MapPinned className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Post A Project</h3>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                Public project posting is enabled. Use an admin key only for protected admin submissions.
              </p>

              <form onSubmit={handleProjectSubmit} className="space-y-3">
                <div>
                  <input
                    value={projectForm.name}
                    onChange={(event) =>
                      setProjectForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Project title"
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                      projectErrors.name
                        ? "border-red-300 focus:border-red-500"
                        : "border-blue-200 focus:border-blue-900"
                    }`}
                    required
                  />
                  {projectErrors.name ? (
                    <p className="mt-1 text-xs text-red-600">{projectErrors.name}</p>
                  ) : null}
                </div>

                <div>
                  <textarea
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Urgency, impact goals, and required skills"
                    className={`h-24 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                      projectErrors.description
                        ? "border-red-300 focus:border-red-500"
                        : "border-blue-200 focus:border-blue-900"
                    }`}
                    required
                  />
                  {projectErrors.description ? (
                    <p className="mt-1 text-xs text-red-600">{projectErrors.description}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <input
                      type="number"
                      step="any"
                      value={projectForm.latitude}
                      onChange={(event) =>
                        setProjectForm((prev) => ({ ...prev, latitude: event.target.value }))
                      }
                      placeholder="Latitude"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                        projectErrors.latitude
                          ? "border-red-300 focus:border-red-500"
                          : "border-blue-200 focus:border-blue-900"
                      }`}
                      required
                    />
                    {projectErrors.latitude ? (
                      <p className="mt-1 text-xs text-red-600">{projectErrors.latitude}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      type="number"
                      step="any"
                      value={projectForm.longitude}
                      onChange={(event) =>
                        setProjectForm((prev) => ({ ...prev, longitude: event.target.value }))
                      }
                      placeholder="Longitude"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                        projectErrors.longitude
                          ? "border-red-300 focus:border-red-500"
                          : "border-blue-200 focus:border-blue-900"
                      }`}
                      required
                    />
                    {projectErrors.longitude ? (
                      <p className="mt-1 text-xs text-red-600">{projectErrors.longitude}</p>
                    ) : null}
                  </div>
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
          )}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-blue-200 bg-white p-5">
            <h3 className="text-base font-semibold text-blue-900">Recently Onboarded Volunteers</h3>
            <div className="mt-3 space-y-3">
              {isDirectoryLoading ? (
                <>
                  <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                </>
              ) : recentVolunteers.length === 0 ? (
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
              {isDirectoryLoading ? (
                <>
                  <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                </>
              ) : openProjects.length === 0 ? (
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
            {results.length === 0 && !isMatching ? (
              <article className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No matches yet. Enter a skill and run AI matching.
              </article>
            ) : null}

            {results.map((volunteer) => {
              const score = Math.max(
                0,
                Math.min(1, Number(volunteer.cosine_similarity) || 0)
              );
              const scorePct = Math.round(score * 100);
              const relevanceLabel =
                scorePct >= 70 ? "High Relevance" : scorePct >= 40 ? "Medium Relevance" : "Low Relevance";
              const relevanceClass =
                scorePct >= 70
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : scorePct >= 40
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-slate-100 text-slate-700";

              return (
                <article
                  key={volunteer.volunteer_id}
                  className="rounded-xl border border-slate-200 border-t-2 border-t-emerald-500 bg-white p-5 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-blue-900">
                      <Users className="h-4 w-4" />
                      <p className="font-semibold">{volunteer.full_name}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${relevanceClass}`}
                    >
                      {relevanceLabel}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-slate-600">{volunteer.email}</p>
                  <p className="mb-3 text-sm text-slate-700">{volunteer.skill_summary}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-emerald-700">
                      Match Score: {scorePct}%
                    </p>
                    <a
                      href={`mailto:${volunteer.email}?subject=TurkNode Project Match Opportunity`}
                      className="inline-flex items-center justify-center rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-900 transition hover:bg-blue-50"
                    >
                      Invite
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
