import type { ProjectDoc } from '../../../lib/turknodeDb';

function calculateProgress(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const progress = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

export default function ActiveProjectsModule({
  projects,
}: {
  projects: ProjectDoc[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-2xl font-black tracking-tight text-slate-900">Active Projects</h3>
        <button className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
          View all
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          No active initiatives yet. Create a project to start recruiting volunteers.
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const progress = calculateProgress(project.startDate, project.endDate);
            return (
              <article key={project.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{project.category}</p>
                    <h4 className="text-lg font-bold text-slate-900">{project.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {project.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-4">
                  <div>
                    <p className="uppercase tracking-wide text-slate-500">Volunteers</p>
                    <p className="mt-1 font-semibold text-slate-900">{project.participantCount || 0} assigned</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-slate-500">Next milestone</p>
                    <p className="mt-1 font-semibold text-slate-900">Field readiness check</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-slate-500">Deadline</p>
                    <p className="mt-1 font-semibold text-slate-900">{project.endDate || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-slate-500">Progress</p>
                    <p className="mt-1 font-semibold text-slate-900">{progress}%</p>
                  </div>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${progress}%` }} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {['View Project', 'Edit', 'Assign Volunteers', 'View Tasks'].map((label) => (
                    <button
                      key={label}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
