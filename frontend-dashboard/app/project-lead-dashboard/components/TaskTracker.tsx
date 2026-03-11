import type { TaskRow } from '../types';

const priorityTone: Record<TaskRow['priority'], string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

export default function TaskTracker({
  tasks,
  onStatus,
}: {
  tasks: TaskRow[];
  onStatus: (id: string, status: TaskRow['status']) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tight text-slate-900">Task & Milestone Tracker</h3>
        <button className="rounded-xl bg-[#0b1a37] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#13264d]">Create Task</button>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900">{task.title}</h4>
                <p className="text-xs text-slate-600">{task.project} • {task.volunteer}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityTone[task.priority]}`}>{task.priority}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Due: {task.dueDate}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => onStatus(task.id, 'done')} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Mark Complete</button>
              <button onClick={() => onStatus(task.id, 'in_progress')} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">In Progress</button>
              <button className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Reassign</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
