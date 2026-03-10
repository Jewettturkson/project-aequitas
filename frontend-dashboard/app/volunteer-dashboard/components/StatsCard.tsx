import type { Stat } from "../types";

type StatsCardProps = {
  stat: Stat;
};

export default function StatsCard({ stat }: StatsCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{stat.value}</p>
      <p className="mt-1 text-sm text-slate-500">{stat.hint}</p>
    </article>
  );
}
