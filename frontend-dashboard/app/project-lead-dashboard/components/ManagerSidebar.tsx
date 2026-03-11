import type { ManagerSection } from '../types';
import BrandLogo from '../../components/BrandLogo';

export default function ManagerSidebar({
  active,
  onChange,
  profileName,
  profileCompletion,
}: {
  active: ManagerSection;
  onChange: (section: ManagerSection) => void;
  profileName: string;
  profileCompletion: number;
}) {
  const nav: Array<{ id: ManagerSection; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'projects', label: 'My Projects' },
    { id: 'volunteers', label: 'Volunteers' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'messages', label: 'Messages' },
    { id: 'events', label: 'Events' },
    { id: 'impact', label: 'Impact Reports' },
    { id: 'applications', label: 'Applications' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <aside className="rounded-3xl bg-[#06163a] p-4 text-white shadow-xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:flex lg:flex-col">
      <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-5">
        <div className="mx-auto h-[74px] w-full max-w-[220px]">
          <BrandLogo variant="auto" className="h-full w-full" priority />
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-4">
        <p className="text-xl font-bold">{profileName}</p>
        <p className="text-sm text-blue-100/90">Project Manager</p>
      </div>
      <nav className="mt-4 flex-1 space-y-1" aria-label="Project manager sections">
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`w-full rounded-xl px-3 py-2 text-left text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
              active === item.id
                ? 'bg-white text-[#06163a]'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4">
        <div className="flex items-center justify-between text-sm">
          <span>Manager setup</span>
          <span className="font-bold text-amber-300">{profileCompletion}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-amber-300" style={{ width: `${profileCompletion}%` }} />
        </div>
      </div>
    </aside>
  );
}
