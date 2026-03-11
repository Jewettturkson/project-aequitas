export default function KPIGrid({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: 'default' | 'good' | 'accent' }>;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
          <p
            className={`mt-2 text-3xl font-black tracking-tight ${
              item.tone === 'good'
                ? 'text-emerald-700'
                : item.tone === 'accent'
                ? 'text-[#0b3ea3]'
                : 'text-slate-900'
            }`}
          >
            {item.value}
          </p>
        </article>
      ))}
    </section>
  );
}
