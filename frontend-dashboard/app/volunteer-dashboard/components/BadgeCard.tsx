import { Award } from "lucide-react";
import type { Badge } from "../types";

type BadgeCardProps = {
  badge: Badge;
};

export default function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex rounded-full bg-amber-100 p-2 text-amber-700">
        <Award className="h-4 w-4" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{badge.name}</h3>
      <p className="mt-2 text-sm text-slate-600">{badge.description}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Earned {badge.earnedOn}</p>
    </article>
  );
}
