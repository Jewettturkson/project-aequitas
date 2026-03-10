"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Contact, FolderKanban, Loader2, Sparkles } from "lucide-react";
import BadgeCard from "./components/BadgeCard";
import FloatingActions from "./components/FloatingActions";
import HeroSection from "./components/HeroSection";
import ProjectCard from "./components/ProjectCard";
import Sidebar from "./components/Sidebar";
import StatsCard from "./components/StatsCard";
import TabNav from "./components/TabNav";
import VolunteerProfileCard from "./components/VolunteerProfileCard";
import {
  activeProjects as fallbackActiveProjects,
  completedProjects as fallbackCompletedProjects,
  recommendations,
  sidebarNav,
  stats as fallbackStats,
  volunteer as fallbackVolunteer,
} from "./mockData";
import type {
  ActiveProject,
  Badge,
  CompletedProject,
  DashboardTab,
  Stat,
  Volunteer,
} from "./types";

const ORCHESTRATOR_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:3000";

type SessionUser = {
  uid: string;
  email: string;
  displayName: string;
};

type VolunteerApiRow = {
  id: string;
  fullName: string;
  email: string;
  skillSummary: string;
};

type ProjectApiRow = {
  id: string;
  name: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  contactEmail?: string;
  createdAt?: string;
};

type StatsApi = {
  volunteers: number;
  totalImpact: number;
  activeProjects: number;
};

function buildDynamicBadges({
  completedCount,
  activeCount,
  estimatedHours,
  totalImpact,
}: {
  completedCount: number;
  activeCount: number;
  estimatedHours: number;
  totalImpact: number;
}): Badge[] {
  const badgeList: Badge[] = [];

  if (estimatedHours >= 100) {
    badgeList.push({
      id: "hours-100",
      name: "100 Hours Badge",
      description: "Crossed 100+ estimated volunteer service hours.",
      earnedOn: "Recently earned",
    });
  }

  if (completedCount >= 5) {
    badgeList.push({
      id: "community-builder",
      name: "Community Builder",
      description: "Completed 5+ community projects.",
      earnedOn: "Recently earned",
    });
  }

  if (activeCount >= 2) {
    badgeList.push({
      id: "active-collaborator",
      name: "Active Collaborator",
      description: "Contributing across multiple active initiatives.",
      earnedOn: "In progress",
    });
  }

  if (totalImpact >= 1) {
    badgeList.push({
      id: "impact-supporter",
      name: "Impact Supporter",
      description: "Part of a network delivering measurable impact outcomes.",
      earnedOn: "Platform milestone",
    });
  }

  if (badgeList.length === 0) {
    badgeList.push({
      id: "first-step",
      name: "First Step",
      description: "Complete your first contribution to unlock new badges.",
      earnedOn: "Available",
    });
  }

  return badgeList;
}

function mapApiProjectToCompleted(project: ProjectApiRow): CompletedProject {
  const createdAt = project.createdAt ? new Date(project.createdAt) : new Date();
  return {
    id: project.id,
    title: project.name,
    summary: project.description || "Community impact initiative.",
    category: project.status === "COMPLETED" ? "Impact" : "Community",
    completionDate: createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    impactMetric: "Impact metrics available in project details",
    thumbnail: `https://picsum.photos/seed/${project.id}/900/500`,
  };
}

function mapApiProjectToActive(project: ProjectApiRow, index: number): ActiveProject {
  const simulatedProgress = Math.max(20, 78 - index * 14);
  return {
    id: project.id,
    title: project.name,
    nextMilestone: "Weekly project checkpoint",
    lead: project.contactEmail || "Project coordinator",
    progress: simulatedProgress,
  };
}

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const [activeSidebarItem, setActiveSidebarItem] = useState("home");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [volunteerData, setVolunteerData] = useState<Volunteer>(fallbackVolunteer);
  const [completedProjects, setCompletedProjects] = useState<CompletedProject[]>(
    fallbackCompletedProjects
  );
  const [activeProjects, setActiveProjects] =
    useState<ActiveProject[]>(fallbackActiveProjects);
  const [stats, setStats] = useState<Stat[]>(fallbackStats);
  const [badgeItems, setBadgeItems] = useState<Badge[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string>("");

  const panelTitle = useMemo(() => {
    if (activeTab === "projects") {
      return "Turning effort into measurable community outcomes";
    }
    if (activeTab === "achievements") {
      return "Tracking growth, milestones, and volunteer excellence";
    }
    if (activeTab === "recommendations") {
      return "Finding your next high-impact opportunity";
    }
    return "Making community impact through service, collaboration, and innovation";
  }, [activeTab]);

  useEffect(() => {
    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;

    const loadAuthState = async () => {
      try {
        const [{ auth }, { onAuthStateChanged }] = await Promise.all([
          import("../../lib/firebase"),
          import("firebase/auth"),
        ]);

        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          if (isCancelled) {
            return;
          }

          if (!nextUser) {
            setSessionUser(null);
            setAuthStatus("ready");
            return;
          }

          setSessionUser({
            uid: nextUser.uid,
            email: nextUser.email || "",
            displayName: nextUser.displayName || "",
          });
          setAuthStatus("ready");
        });
      } catch {
        if (isCancelled) {
          return;
        }

        setSessionUser(null);
        setAuthStatus("unavailable");
      }
    };

    void loadAuthState();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "ready") {
      return;
    }

    if (!sessionUser) {
      router.replace("/");
    }
  }, [authStatus, router, sessionUser]);

  useEffect(() => {
    if (!sessionUser) {
      return;
    }

    let isCancelled = false;

    const loadLiveVolunteerDashboardData = async () => {
      setIsDataLoading(true);
      setDataError("");

      try {
        const [statsRes, volunteersRes, completedRes, activeRes] = await Promise.all([
          fetch(`${ORCHESTRATOR_URL}/api/v1/stats`),
          fetch(`${ORCHESTRATOR_URL}/api/v1/volunteers?limit=50&includeInactive=true`),
          fetch(`${ORCHESTRATOR_URL}/api/v1/projects?scope=all&status=COMPLETED&limit=6`),
          fetch(`${ORCHESTRATOR_URL}/api/v1/projects?scope=active&limit=6`),
        ]);

        if (isCancelled) {
          return;
        }

        let completedCount = fallbackVolunteer.completedProjects;
        let activeCount = fallbackVolunteer.currentlyActiveProjects;
        if (completedRes.ok) {
          const completedPayload = (await completedRes.json()) as {
            data?: ProjectApiRow[];
          };
          const completedRows = completedPayload.data || [];
          if (completedRows.length > 0) {
            completedCount = completedRows.length;
            setCompletedProjects(completedRows.map(mapApiProjectToCompleted));
          }
        }

        if (activeRes.ok) {
          const activePayload = (await activeRes.json()) as {
            data?: ProjectApiRow[];
          };
          const activeRows = activePayload.data || [];
          activeCount = activeRows.length;
          if (activeRows.length > 0) {
            setActiveProjects(activeRows.map(mapApiProjectToActive));
          }
        }

        if (statsRes.ok) {
          const statsPayload = (await statsRes.json()) as StatsApi;
          const estimatedHours = completedCount * 14 + activeCount * 6;

          setStats([
            {
              id: "s1",
              label: "Total Hours Served",
              value: `${estimatedHours}h`,
              hint: "Estimated from project activity",
            },
            {
              id: "s2",
              label: "Completed Projects",
              value: String(completedCount),
              hint: "From project history",
            },
            {
              id: "s3",
              label: "Upcoming Events",
              value: "4",
              hint: "Next 30 days",
            },
            {
              id: "s4",
              label: "Badges Earned",
              value: String(
                buildDynamicBadges({
                  completedCount,
                  activeCount,
                  estimatedHours,
                  totalImpact: statsPayload.totalImpact,
                }).length
              ),
              hint: `Network impact: ${statsPayload.totalImpact.toFixed(1)}`,
            },
          ]);

          setBadgeItems(
            buildDynamicBadges({
              completedCount,
              activeCount,
              estimatedHours,
              totalImpact: statsPayload.totalImpact,
            })
          );
        }

        if (volunteersRes.ok) {
          const volunteersPayload = (await volunteersRes.json()) as {
            data?: VolunteerApiRow[];
          };
          const normalizedEmail = sessionUser.email.trim().toLowerCase();
          const matchedVolunteer = (volunteersPayload.data || []).find(
            (item) => item.email.trim().toLowerCase() === normalizedEmail
          );

          setVolunteerData((prev) => ({
            ...prev,
            name: sessionUser.displayName || matchedVolunteer?.fullName || prev.name,
            role: "Community Volunteer",
            bio:
              matchedVolunteer?.skillSummary?.trim() ||
              prev.bio,
            location: prev.location,
            completedProjects: prev.completedProjects,
            availability:
              activeCount > 0
                ? `Currently active on ${activeCount} projects`
                : "Available for new projects",
          }));
        } else {
          setVolunteerData((prev) => ({
            ...prev,
            name: sessionUser.displayName || prev.name,
          }));
        }

        setVolunteerData((prev) => ({
          ...prev,
          availability:
            activeCount > 0
              ? `Currently active on ${activeCount} projects`
              : "Available for new projects",
          currentlyActiveProjects: activeCount,
        }));

        if (!statsRes.ok) {
          setBadgeItems(
            buildDynamicBadges({
              completedCount,
              activeCount,
              estimatedHours: completedCount * 14 + activeCount * 6,
              totalImpact: 0,
            })
          );
        }
      } catch {
        if (!isCancelled) {
          setDataError("Live data unavailable. Showing cached dashboard content.");
        }
      } finally {
        if (!isCancelled) {
          setIsDataLoading(false);
        }
      }
    };

    void loadLiveVolunteerDashboardData();

    return () => {
      isCancelled = true;
    };
  }, [sessionUser]);

  if (authStatus === "loading" || (authStatus === "ready" && !sessionUser)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7F5] text-slate-900">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading volunteer workspace...
        </div>
      </main>
    );
  }

  if (authStatus === "unavailable") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7F5] px-4 text-center text-slate-900">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-6">
          <h1 className="text-xl font-bold">Auth is unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            Firebase configuration is missing for this environment. Set the public Firebase variables and redeploy.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F7F5] text-slate-900">
      <Sidebar
        navItems={sidebarNav}
        activeItem={activeSidebarItem}
        onSelect={(itemId) => setActiveSidebarItem(itemId)}
        profileName={volunteerData.name}
        profileRole="Volunteer"
        profileCompletion={volunteerData.profileCompletion}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((current) => !current)}
      />

      <div className="lg:pl-[280px]">
        <div className="mx-auto max-w-[1560px] p-4 pt-20 lg:p-8 lg:pt-8">
          {dataError ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {dataError}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div>
              <VolunteerProfileCard volunteer={volunteerData} />
            </div>

            <div>
              <HeroSection title={panelTitle} />
              <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

              {(activeTab === "overview" || activeTab === "projects") && (
                <section className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Completed Projects</h2>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <Sparkles className="h-4 w-4 text-amber-500" /> Explore all
                    </button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                    {completedProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === "overview" || activeTab === "projects") && (
                <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-2xl font-black tracking-tight">Active Projects</h2>
                  <div className="space-y-4">
                    {activeProjects.map((project) => (
                      <article
                        key={project.id}
                        className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
                          <span className="text-sm font-semibold text-slate-600">{project.progress}% complete</span>
                        </div>
                        <div className="mb-3 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <p className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Next milestone: {project.nextMilestone}
                          </p>
                          <p className="inline-flex items-center gap-1">
                            <Contact className="h-4 w-4" /> Project lead: {project.lead}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === "overview" || activeTab === "achievements") && (
                <section className="mb-8">
                  <h2 className="mb-4 text-2xl font-black tracking-tight">Volunteer Stats</h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                      <StatsCard key={stat.id} stat={stat} />
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === "overview" || activeTab === "achievements") && (
                <section className="mb-8">
                  <h2 className="mb-4 text-2xl font-black tracking-tight">Achievements & Badges</h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {badgeItems.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === "overview" || activeTab === "recommendations") && (
                <section>
                  <h2 className="mb-4 text-2xl font-black tracking-tight">Recommended Opportunities</h2>
                  <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {recommendations.map((rec) => (
                      <article
                        key={rec.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          <FolderKanban className="h-3.5 w-3.5" /> Opportunity
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{rec.title}</h3>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {rec.location} • {rec.commitment}
                        </p>
                        <p className="mt-3 text-sm text-slate-600">{rec.reason}</p>
                        <button
                          type="button"
                          className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          View details
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isDataLoading ? <FloatingActions /> : null}
    </main>
  );
}
