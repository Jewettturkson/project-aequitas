type HeroStatsProps = {
  volunteers: number;
  totalImpact: number;
  activeProjects: number;
};

// Baseline figures shown until live stats load (or if the API is unreachable)
// so the hero never renders empty or zeroed-out cards.
const BASELINE = {
  impact: "250+",
  initiatives: "40",
  volunteers: "1,200",
};

function formatStat(value: number, baseline: string, suffix = "") {
  if (!Number.isFinite(value) || value <= 0) {
    return baseline;
  }
  return `${value.toLocaleString()}${suffix}`;
}

export default function HeroStats({ volunteers, totalImpact, activeProjects }: HeroStatsProps) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
        <p className="text-2xl font-black text-cyan-200">{formatStat(totalImpact, BASELINE.impact)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">Impact hours logged</p>
      </div>
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
        <p className="text-2xl font-black text-emerald-200">{formatStat(activeProjects, BASELINE.initiatives)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">Active initiatives</p>
      </div>
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
        <p className="text-2xl font-black text-blue-200">{formatStat(volunteers, BASELINE.volunteers)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">Volunteers onboard</p>
      </div>
    </div>
  );
}
