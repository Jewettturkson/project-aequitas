import type { DashboardTab } from "../types";

type TabNavProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
};

const tabs: { id: DashboardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "achievements", label: "Achievements" },
  { id: "recommendations", label: "Recommendations" },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div role="tablist" aria-label="Dashboard sections" className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selected
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
