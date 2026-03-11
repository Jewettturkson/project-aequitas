import {
  Award,
  Bookmark,
  CalendarDays,
  Compass,
  Home,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import type { NavItem } from "../types";

type SidebarProps = {
  navItems: NavItem[];
  activeItem: string;
  onSelect: (itemId: string) => void;
  profileName: string;
  profileRole: string;
  profileCompletion: number;
  isOpen: boolean;
  onToggle: () => void;
};

export default function Sidebar({
  navItems,
  activeItem,
  onSelect,
  profileName,
  profileRole,
  profileCompletion,
  isOpen,
  onToggle,
}: SidebarProps) {
  const iconById: Record<string, typeof Home> = {
    home: Home,
    discover: Compass,
    contributions: UserRoundCheck,
    messages: MessageSquare,
    opportunities: Sparkles,
    events: CalendarDays,
    reports: Award,
    saved: Bookmark,
    settings: Settings,
  };

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="fixed left-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E1628] text-white shadow-lg transition hover:bg-[#121f36] lg:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] transform border-r border-white/10 bg-[#0E1628] text-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-black tracking-tight">TurkNode</p>
          </div>

          <div className="mb-5 rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
              <div>
                <p className="font-semibold">{profileName}</p>
                <p className="text-xs text-slate-300">{profileRole}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1" aria-label="Sidebar navigation">
            {navItems.map((item) => {
              const active = item.id === activeItem;
              const Icon = iconById[item.id] || Home;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                    active
                      ? "bg-white text-[#0E1628] shadow-sm"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={`h-4 w-4 transition ${
                      active ? "text-[#0E1628]" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Profile completion</span>
              <span className="font-semibold text-amber-300">{profileCompletion}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      {isOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={onToggle}
        />
      ) : null}
    </>
  );
}
