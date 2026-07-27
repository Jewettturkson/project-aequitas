import type { ApplicationRow } from '../types';

export default function ApplicationsQueue({
  applications,
  onStateChange,
  onMessage,
}: {
  applications: ApplicationRow[];
  onStateChange: (id: string, state: ApplicationRow['state']) => void;
  onMessage?: (id: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-[#e9e0d4] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xl font-black tracking-tight text-[#122a3f]">Applications Queue</h3>
      <div className="space-y-3">
        {applications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#d8cec5] bg-[#faf7f2] px-4 py-4 text-sm text-slate-600">No pending applications.</p>
        ) : (
          applications.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#e9e0d4] p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-[#122a3f]">{item.name}</h4>
                  <p className="text-xs text-slate-600">{item.project} • {item.appliedAt}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{item.skillsMatch}% match</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.message}</p>
              <p className="mt-1 text-xs text-slate-500">Availability: {item.availability}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => onStateChange(item.id, 'accepted')} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700">Accept</button>
                <button onClick={() => onStateChange(item.id, 'rejected')} className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700">Reject</button>
                <button onClick={() => onStateChange(item.id, 'saved')} className="rounded-lg border border-[#d8cec5] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-[#faf7f2]">Save for later</button>
                <button
                  type="button"
                  onClick={() => onMessage?.(item.id)}
                  className="rounded-lg border border-[#d8cec5] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-[#faf7f2]"
                >
                  Message
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
