export default function ImpactAnalytics({
  hours,
  activeInitiatives,
  completed,
}: {
  hours: number;
  activeInitiatives: number;
  completed: number;
}) {
  const metrics = [
    { label: 'Volunteer hours contributed', value: `${hours.toFixed(1)}h` },
    { label: 'Initiatives completed', value: `${completed}` },
    { label: 'People helped', value: '1,200' },
    { label: 'Trees planted', value: '340' },
    { label: 'Workshops hosted', value: '75' },
    { label: 'Active partners', value: `${Math.max(6, activeInitiatives + 2)}` },
  ];

  const chartBars = [62, 74, 58, 83, 91, 77];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-black tracking-tight text-slate-900">Impact Analytics</h3>
      <p className="mt-1 text-sm text-slate-600">Proof of mission outcomes across community initiatives.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Monthly initiative momentum</p>
        <div className="mt-3 flex h-28 items-end gap-2">
          {chartBars.map((height, idx) => (
            <div key={idx} className="flex-1 rounded-t-md bg-gradient-to-t from-[#0b1a37] to-[#2563eb]" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    </section>
  );
}
