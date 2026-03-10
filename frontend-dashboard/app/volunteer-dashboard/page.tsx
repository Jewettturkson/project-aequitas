"use client";

import { useMemo, useState } from "react";
import { Calendar, Contact, FolderKanban, Sparkles } from "lucide-react";
import BadgeCard from "./components/BadgeCard";
import FloatingActions from "./components/FloatingActions";
import HeroSection from "./components/HeroSection";
import ProjectCard from "./components/ProjectCard";
import Sidebar from "./components/Sidebar";
import StatsCard from "./components/StatsCard";
import TabNav from "./components/TabNav";
import VolunteerProfileCard from "./components/VolunteerProfileCard";
import {
  activeProjects,
  badges,
  completedProjects,
  recommendations,
  sidebarNav,
  stats,
  volunteer,
} from "./mockData";
import type { DashboardTab } from "./types";

export default function VolunteerDashboardPage() {
  const [activeSidebarItem, setActiveSidebarItem] = useState("home");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <main className="min-h-screen bg-[#F6F7F5] text-slate-900">
      <Sidebar
        navItems={sidebarNav}
        activeItem={activeSidebarItem}
        onSelect={(itemId) => setActiveSidebarItem(itemId)}
        profileName={volunteer.name}
        profileRole="Volunteer"
        profileCompletion={volunteer.profileCompletion}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((current) => !current)}
      />

      <div className="lg:pl-[280px]">
        <div className="mx-auto max-w-[1560px] p-4 pt-20 lg:p-8 lg:pt-8">
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div>
              <VolunteerProfileCard volunteer={volunteer} />
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
                    {badges.map((badge) => (
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
                        <p className="mt-1 text-sm font-medium text-slate-600">{rec.location} • {rec.commitment}</p>
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

      <FloatingActions />
    </main>
  );
}
