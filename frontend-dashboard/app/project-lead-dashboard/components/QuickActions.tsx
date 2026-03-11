import { Megaphone, PlusCircle, Presentation, Upload } from 'lucide-react';

export default function QuickActions({
  onCreateProject,
}: {
  onCreateProject: () => void;
}) {
  const actions = [
    { label: 'Create Project', icon: PlusCircle, onClick: onCreateProject },
    { label: 'Add Event', icon: Presentation },
    { label: 'Broadcast Update', icon: Megaphone },
    { label: 'Export Report', icon: Upload },
  ];

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Quick Actions</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Icon className="h-4 w-4" /> {action.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
