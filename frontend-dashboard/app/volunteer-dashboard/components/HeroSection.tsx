import { Sparkles } from "lucide-react";

type HeroSectionProps = {
  title: string;
  subtitle?: string;
};

export default function HeroSection({ title, subtitle }: HeroSectionProps) {
  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-amber-50"
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          View AI suggestions
        </button>
      </div>
      <h1 className="max-w-3xl text-2xl font-black leading-[1.1] tracking-tight text-[#122a3f] md:text-3xl">
        {title}
      </h1>
      {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">{subtitle}</p> : null}
    </section>
  );
}
