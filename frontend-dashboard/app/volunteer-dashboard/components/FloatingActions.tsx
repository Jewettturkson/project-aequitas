import { Palette, Plus, Share2 } from "lucide-react";

type FloatingActionsProps = {
  onCustomize: () => void;
  onLogContribution: () => void;
  onShare: () => void;
};

export default function FloatingActions({
  onCustomize,
  onLogContribution,
  onShare,
}: FloatingActionsProps) {
  const actions = [
    { id: "theme", label: "Customize theme", icon: Palette, onClick: onCustomize },
    { id: "add", label: "Add contribution", icon: Plus, onClick: onLogContribution },
    { id: "share", label: "Share dashboard", icon: Share2, onClick: onShare },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-20 flex flex-row gap-3 md:right-8 md:top-1/2 md:flex-col md:-translate-y-1/2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          aria-label={action.label}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
        >
          <action.icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}
