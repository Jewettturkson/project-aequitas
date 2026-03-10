import type { CompletedProject } from "../types";

type ProjectCardProps = {
  project: CompletedProject;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="h-40 w-full overflow-hidden">
        <img
          src={project.thumbnail}
          alt={project.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{project.category}</span>
          <span className="text-xs text-slate-500">{project.completionDate}</span>
        </div>
        <h3 className="mb-2 text-xl font-bold text-slate-900">{project.title}</h3>
        <p className="mb-4 text-sm leading-6 text-slate-600">{project.summary}</p>
        <p className="text-sm font-semibold text-emerald-700">{project.impactMetric}</p>
      </div>
    </article>
  );
}
