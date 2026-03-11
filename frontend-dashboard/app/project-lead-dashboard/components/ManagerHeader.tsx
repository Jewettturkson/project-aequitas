import { Bell, MessageCircle, PlusCircle, Search } from 'lucide-react';

export default function ManagerHeader({
  onCreateProject,
}: {
  onCreateProject: () => void;
}) {
  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Control + coordination + accountability</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Project Manager Dashboard</h1>
        </div>

        <label className="relative min-w-[220px] flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search projects, volunteers, tasks"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <Bell className="h-4 w-4" /> Alerts
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <MessageCircle className="h-4 w-4" /> Messages
          </button>
          <button
            type="button"
            onClick={onCreateProject}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b1a37] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#13264d]"
          >
            <PlusCircle className="h-4 w-4" /> Create Project
          </button>
        </div>
      </div>
    </header>
  );
}
