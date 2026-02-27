"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export type ProjectStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type ProjectPreview = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  contactEmail?: string;
};

type ProjectApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

type ProjectApplication = {
  id: string;
  projectId: string;
  volunteerName: string;
  volunteerEmail: string;
  message: string;
  status: ProjectApplicationStatus;
  decisionNote: string;
  createdAt: string;
  reviewedAt?: string | null;
};

type ApplyFormState = {
  volunteerName: string;
  volunteerEmail: string;
  message: string;
};

type NoticeState = {
  tone: "success" | "error";
  message: string;
};

type ApiErrorResponse = {
  message?: string;
  error?: {
    message?: string;
  };
};

type ProjectApplicationsResponse = {
  data?: ProjectApplication[];
};

type StatusUpdateResponse = {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
  };
};

type Props = {
  projects: ProjectPreview[];
  isLoading: boolean;
  orchestratorUrl: string;
  projectStatusClasses: Record<ProjectStatus, string>;
  isAuthenticated: boolean;
  hasManagerAccess: boolean;
  signedInEmail?: string;
  onProjectChanged: () => Promise<void>;
  showToast: (tone: "success" | "error", message: string) => void;
};

const ACTIVE_STATUSES = new Set<ProjectStatus>(["OPEN", "IN_PROGRESS"]);

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

function emptyApplyForm(): ApplyFormState {
  return {
    volunteerName: "",
    volunteerEmail: "",
    message: "",
  };
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const apiPayload = payload as ApiErrorResponse;
  return apiPayload.message || apiPayload.error?.message || fallback;
}

export default function OpenProjectIntakePanel({
  projects,
  isLoading,
  orchestratorUrl,
  projectStatusClasses,
  isAuthenticated,
  hasManagerAccess,
  signedInEmail = "",
  onProjectChanged,
  showToast,
}: Props) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [applyForms, setApplyForms] = useState<Record<string, ApplyFormState>>({});
  const [notices, setNotices] = useState<Record<string, NoticeState | undefined>>({});
  const [applicationsByProject, setApplicationsByProject] = useState<
    Record<string, ProjectApplication[]>
  >({});
  const [hasLoadedApplications, setHasLoadedApplications] = useState<Record<string, boolean>>({});
  const [isApplyingProjectId, setIsApplyingProjectId] = useState<string | null>(null);
  const [isLoadingApplicationsProjectId, setIsLoadingApplicationsProjectId] = useState<
    string | null
  >(null);
  const [isDecidingApplicationId, setIsDecidingApplicationId] = useState<string | null>(null);
  const [isUpdatingProjectId, setIsUpdatingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!expandedProjectId || !signedInEmail) {
      return;
    }

    setApplyForms((prev) => {
      const existing = prev[expandedProjectId] || emptyApplyForm();
      if (existing.volunteerEmail.trim().length > 0) {
        return prev;
      }

      return {
        ...prev,
        [expandedProjectId]: {
          ...existing,
          volunteerEmail: signedInEmail,
        },
      };
    });
  }, [expandedProjectId, signedInEmail]);

  const setProjectNotice = (projectId: string, tone: NoticeState["tone"], message: string) => {
    setNotices((prev) => ({ ...prev, [projectId]: { tone, message } }));
  };

  const getForm = (projectId: string) => applyForms[projectId] || emptyApplyForm();

  const handleApplyField = (
    projectId: string,
    field: keyof ApplyFormState,
    value: string
  ) => {
    setApplyForms((prev) => ({
      ...prev,
      [projectId]: {
        ...getForm(projectId),
        [field]: value,
      },
    }));
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId));
  };

  const getManagerAuthHeaders = async (includeJsonContentType: boolean) => {
    if (!hasManagerAccess) {
      return null;
    }

    try {
      const { auth } = await import("../../lib/firebase");
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }

      const idToken = await currentUser.getIdToken();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${idToken}`,
      };
      if (includeJsonContentType) {
        headers["Content-Type"] = "application/json";
      }
      return headers;
    } catch {
      return null;
    }
  };

  const submitApplication = async (project: ProjectPreview, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = getForm(project.id);

    if (form.volunteerName.trim().length < 2) {
      setProjectNotice(project.id, "error", "Volunteer name must be at least 2 characters.");
      return;
    }

    if (!isValidEmail(form.volunteerEmail)) {
      setProjectNotice(project.id, "error", "Enter a valid volunteer email address.");
      return;
    }

    if (form.message.trim().length < 20) {
      setProjectNotice(project.id, "error", "Application message must be at least 20 characters.");
      return;
    }

    setIsApplyingProjectId(project.id);

    try {
      const response = await fetch(
        `${orchestratorUrl}/api/v1/projects/${project.id}/applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            volunteerName: form.volunteerName.trim(),
            volunteerEmail: form.volunteerEmail.trim(),
            message: form.message.trim(),
          }),
        }
      );

      const payload = (await response.json().catch(() => ({}))) as
        | ApiErrorResponse
        | {
            project?: {
              contactEmail?: string;
            };
          };

      if (!response.ok) {
        const message = readErrorMessage(payload, "Unable to submit project application.");
        setProjectNotice(project.id, "error", message);
        return;
      }

      const contactEmail =
        "project" in payload && payload.project?.contactEmail
          ? payload.project.contactEmail
          : project.contactEmail;
      const successMessage = contactEmail
        ? `Application submitted. Project contact: ${contactEmail}.`
        : "Application submitted. The project team will review it.";
      setProjectNotice(project.id, "success", successMessage);
      showToast("success", "Application submitted.");
      setApplyForms((prev) => ({ ...prev, [project.id]: emptyApplyForm() }));
    } catch {
      setProjectNotice(project.id, "error", "Could not reach project intake service.");
    } finally {
      setIsApplyingProjectId(null);
    }
  };

  const loadApplications = async (projectId: string) => {
    const authHeaders = await getManagerAuthHeaders(false);
    if (!authHeaders) {
      setProjectNotice(
        projectId,
        "error",
        "Sign in with a manager Firebase account to review applications."
      );
      return;
    }

    setIsLoadingApplicationsProjectId(projectId);

    try {
      const response = await fetch(
        `${orchestratorUrl}/api/v1/projects/${projectId}/applications?limit=100`,
        {
          headers: authHeaders,
        }
      );
      const payload = (await response.json().catch(() => ({}))) as
        | ProjectApplicationsResponse
        | ApiErrorResponse;

      if (!response.ok) {
        const message = readErrorMessage(payload, "Unable to load project applications.");
        setProjectNotice(projectId, "error", message);
        return;
      }

      const data = "data" in payload && Array.isArray(payload.data) ? payload.data : [];
      setApplicationsByProject((prev) => ({ ...prev, [projectId]: data }));
      setHasLoadedApplications((prev) => ({ ...prev, [projectId]: true }));
      if (data.length === 0) {
        setProjectNotice(projectId, "success", "No applications submitted yet.");
      }
    } catch {
      setProjectNotice(projectId, "error", "Could not reach application review endpoint.");
    } finally {
      setIsLoadingApplicationsProjectId(null);
    }
  };

  const decideApplication = async (
    projectId: string,
    applicationId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    const authHeaders = await getManagerAuthHeaders(true);
    if (!authHeaders) {
      setProjectNotice(
        projectId,
        "error",
        "Sign in with a manager Firebase account to decide applications."
      );
      return;
    }

    setIsDecidingApplicationId(applicationId);

    try {
      const response = await fetch(
        `${orchestratorUrl}/api/v1/projects/${projectId}/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ status }),
        }
      );

      const payload = (await response.json().catch(() => ({}))) as
        | ApiErrorResponse
        | { application?: ProjectApplication };

      if (!response.ok) {
        const message = readErrorMessage(payload, "Unable to update application status.");
        setProjectNotice(projectId, "error", message);
        return;
      }

      const nextApplication =
        "application" in payload && payload.application ? payload.application : null;
      if (nextApplication) {
        setApplicationsByProject((prev) => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map((entry) =>
            entry.id === nextApplication.id ? nextApplication : entry
          ),
        }));
      }
      setProjectNotice(
        projectId,
        "success",
        status === "APPROVED" ? "Application approved." : "Application rejected."
      );
    } catch {
      setProjectNotice(projectId, "error", "Could not update application decision.");
    } finally {
      setIsDecidingApplicationId(null);
    }
  };

  const updateProjectStatus = async (projectId: string, nextStatus: ProjectStatus) => {
    const authHeaders = await getManagerAuthHeaders(true);
    if (!authHeaders) {
      setProjectNotice(
        projectId,
        "error",
        "Sign in with a manager Firebase account to update project status."
      );
      return;
    }

    setIsUpdatingProjectId(projectId);

    try {
      const response = await fetch(`${orchestratorUrl}/api/v1/projects/${projectId}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json().catch(() => ({}))) as StatusUpdateResponse;

      if (!response.ok) {
        const message =
          payload.message || payload.error?.message || "Unable to update project status.";
        setProjectNotice(projectId, "error", message);
        return;
      }

      const successMessage =
        nextStatus === "COMPLETED"
          ? "Project marked as completed and intake closed."
          : "Project intake reopened.";
      showToast("success", successMessage);
      await onProjectChanged();
    } catch {
      setProjectNotice(projectId, "error", "Could not update project status.");
    } finally {
      setIsUpdatingProjectId(null);
    }
  };

  return (
    <article className="rounded-xl border border-blue-200 bg-white p-5">
      <h3 className="text-base font-semibold text-blue-900">Open Project Intake</h3>
      <p className="mt-1 text-sm text-slate-600">
        Click a project to apply. Volunteers can apply publicly; managers can review and close intake after sign-in.
      </p>

      <div className="mt-3 space-y-3">
        {isLoading ? (
          <>
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </>
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500">No active projects yet.</p>
        ) : (
          projects.map((project) => {
            const isExpanded = expandedProjectId === project.id;
            const canApply = ACTIVE_STATUSES.has(project.status);
            const form = getForm(project.id);
            const notice = notices[project.id];
            const applications = applicationsByProject[project.id] || [];
            const hasLoaded = Boolean(hasLoadedApplications[project.id]);

            return (
              <div key={project.id} className="rounded-lg border border-slate-200 p-3">
                <button
                  type="button"
                  onClick={() => toggleProject(project.id)}
                  className="w-full text-left"
                >
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
                  <p className="mt-2 text-xs font-semibold text-blue-800">
                    {isExpanded ? "Hide application workflow" : "Click to apply or review applications"}
                  </p>
                </button>

                {isExpanded ? (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    {project.contactEmail ? (
                      <p className="text-sm text-slate-700">
                        Project contact email:{" "}
                        <a
                          href={`mailto:${project.contactEmail}`}
                          className="font-semibold text-blue-900 underline underline-offset-2"
                        >
                          {project.contactEmail}
                        </a>
                      </p>
                    ) : null}

                    {canApply ? (
                      <form
                        onSubmit={(event) => {
                          void submitApplication(project, event);
                        }}
                        className="mt-3 space-y-2"
                      >
                        <input
                          value={form.volunteerName}
                          onChange={(event) =>
                            handleApplyField(project.id, "volunteerName", event.target.value)
                          }
                          placeholder="Your full name"
                          className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                          required
                        />
                        <input
                          type="email"
                          value={form.volunteerEmail}
                          onChange={(event) =>
                            handleApplyField(project.id, "volunteerEmail", event.target.value)
                          }
                          placeholder="Your email"
                          className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                          required
                        />
                        <textarea
                          value={form.message}
                          onChange={(event) =>
                            handleApplyField(project.id, "message", event.target.value)
                          }
                          placeholder="Why you are a fit for this project"
                          className="h-24 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isApplyingProjectId === project.id}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-200"
                        >
                          {isApplyingProjectId === project.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply To Project"
                          )}
                        </button>
                      </form>
                    ) : (
                      <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        Intake is closed for this project.
                      </p>
                    )}

                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
                      {hasManagerAccess ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                void loadApplications(project.id);
                              }}
                              disabled={isLoadingApplicationsProjectId === project.id}
                              className="inline-flex items-center justify-center rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-blue-100 disabled:text-blue-300"
                            >
                              {isLoadingApplicationsProjectId === project.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Load Applications"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void updateProjectStatus(
                                  project.id,
                                  canApply ? "COMPLETED" : "OPEN"
                                );
                              }}
                              disabled={isUpdatingProjectId === project.id}
                              className="inline-flex items-center justify-center rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-blue-100 disabled:text-blue-300"
                            >
                              {isUpdatingProjectId === project.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : canApply ? (
                                "Close Intake (Completed)"
                              ) : (
                                "Reopen Intake"
                              )}
                            </button>
                          </div>

                          {isLoadingApplicationsProjectId === project.id ? (
                            <p className="mt-2 text-sm text-slate-600">Loading applications...</p>
                          ) : null}

                          {hasLoaded ? (
                            <div className="mt-3 space-y-2">
                              {applications.length === 0 ? (
                                <p className="text-sm text-slate-600">No applications yet.</p>
                              ) : (
                                applications.map((application) => (
                                  <div
                                    key={application.id}
                                    className="rounded-lg border border-blue-200 bg-white p-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-semibold text-blue-900">
                                          {application.volunteerName}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                          {application.volunteerEmail}
                                        </p>
                                      </div>
                                      <span
                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                          application.status === "APPROVED"
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                            : application.status === "REJECTED"
                                              ? "border-red-300 bg-red-50 text-red-700"
                                              : "border-amber-300 bg-amber-50 text-amber-700"
                                        }`}
                                      >
                                        {application.status}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-700">{application.message}</p>

                                    {application.status === "PENDING" ? (
                                      <div className="mt-2 flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            void decideApplication(
                                              project.id,
                                              application.id,
                                              "APPROVED"
                                            );
                                          }}
                                          disabled={isDecidingApplicationId === application.id}
                                          className="inline-flex items-center justify-center rounded-md border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:text-emerald-300"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            void decideApplication(
                                              project.id,
                                              application.id,
                                              "REJECTED"
                                            );
                                          }}
                                          disabled={isDecidingApplicationId === application.id}
                                          className="inline-flex items-center justify-center rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-red-100 disabled:text-red-300"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                ))
                              )}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-sm text-slate-600">
                          {isAuthenticated
                            ? "Signed in without manager role. Ask an admin to grant the projectManager claim."
                            : "Sign in to unlock manager review tools for this project."}
                        </p>
                      )}
                    </div>

                    {notice ? (
                      <p
                        className={`mt-3 text-sm ${
                          notice.tone === "success" ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {notice.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
