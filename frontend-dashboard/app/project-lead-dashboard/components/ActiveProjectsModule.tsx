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
  onAction,
}: {
  projects: ProjectDoc[];
  onAction?: (projectId: string, action: 'view' | 'edit' | 'assign' | 'tasks') => void;
}) {
  return (
    <section className="rounded-3xl border border-[#e9e0d4] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-2xl font-black tracking-tight text-[#122a3f]">Active Projects</h3>
        <button className="rounded-xl border border-[#d8cec5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#faf7f2]">
          View all
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d8cec5] bg-[#faf7f2] px-4 py-5 text-sm text-slate-600">
          No active initiatives yet. Create a project to start recruiting volunteers.
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const progress = calculateProgress(project.startDate, project.endDate);
            return (
              <article key={project.id} className="rounded-2xl border border-[#e9e0d4] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{project.category}</p>
                    <h4 className="text-lg font-bold text-[#122a3f]">{project.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {project.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-4">
                  <div>
                    <p className="uppercase tracking-wide text-slate-500">Volunteers</p>
                    <p className="mt-1 font-semibold text-[#122a3f]">{project.participantCount || 0} assigned</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-slate-500">Next milestone</p>
                    <p className="mt-1 font-semibold text-[#122a3f]">Field readiness check</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-slate-500">Deadline</p>
                    <p className="mt-1 font-semibold text-[#122a3f]">{project.endDate || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-slate-500">Progress</p>
                    <p className="mt-1 font-semibold text-[#122a3f]">{progress}%</p>
                  </div>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${progress}%` }} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: 'View Project', action: 'view' as const },
                    { label: 'Edit', action: 'edit' as const },
                    { label: 'Assign Volunteers', action: 'assign' as const },
                    { label: 'View Tasks', action: 'tasks' as const },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onAction?.(project.id, action)}
                      className="rounded-lg border border-[#d8cec5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#faf7f2]"
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
