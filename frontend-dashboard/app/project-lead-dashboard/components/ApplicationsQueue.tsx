import type { ApplicationRow } from '../types';

export default function ApplicationsQueue({
  applications,
  onStateChange,
}: {
  applications: ApplicationRow[];
  onStateChange: (id: string, state: ApplicationRow['state']) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xl font-black tracking-tight text-slate-900">Applications Queue</h3>
      <div className="space-y-3">
        {applications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">No pending applications.</p>
        ) : (
          applications.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-600">{item.project} • {item.appliedAt}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{item.skillsMatch}% match</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.message}</p>
              <p className="mt-1 text-xs text-slate-500">Availability: {item.availability}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => onStateChange(item.id, 'accepted')} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700">Accept</button>
                <button onClick={() => onStateChange(item.id, 'rejected')} className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700">Reject</button>
                <button onClick={() => onStateChange(item.id, 'saved')} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Save for later</button>
                <button className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Message</button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
