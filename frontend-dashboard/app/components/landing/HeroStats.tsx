type HeroStatsProps = {
  volunteers: number;
  totalImpact: number;
  activeProjects: number;
};

// Live figures straight from the platform API. Real numbers only.
function formatStat(value: number, suffix = "") {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }
  return `${value.toLocaleString()}${suffix}`;
}

export default function HeroStats({ volunteers, totalImpact, activeProjects }: HeroStatsProps) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-[#e7ded2] bg-white p-4">
        <p className="text-2xl font-black text-emerald-600">{formatStat(totalImpact)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-[#5b6b7a]">Impact hours logged</p>
      </div>
      <div className="rounded-2xl border border-[#e7ded2] bg-white p-4">
        <p className="text-2xl font-black text-[#0b2e59]">{formatStat(activeProjects)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-[#5b6b7a]">Active initiatives</p>
      </div>
      <div className="rounded-2xl border border-[#e7ded2] bg-white p-4">
        <p className="text-2xl font-black text-cyan-700">{formatStat(volunteers)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-[#5b6b7a]">Volunteers onboard</p>
      </div>
    </div>
  );
}
