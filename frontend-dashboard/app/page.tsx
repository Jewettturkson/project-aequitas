"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Database,
  Leaf,
  Loader2,
  Search,
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
  const [skill, setSkill] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [results, setResults] = useState<MatchVolunteer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [statusRes, statsRes] = await Promise.all([
          fetch(`${ORCHESTRATOR_URL}/api/v1/status`),
          fetch(`${ORCHESTRATOR_URL}/api/v1/stats`),
        ]);

        if (!active) return;

        if (statusRes.ok) {
          setStatus("connected");
        } else {
          setStatus("disconnected");
        }

        if (statsRes.ok) {
          const data = (await statsRes.json()) as Stats;
          setStats(data);
        }
      } catch {
        if (!active) return;
        setStatus("disconnected");
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

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
