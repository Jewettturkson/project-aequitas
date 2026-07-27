import type { VolunteerRow } from '../types';

const statusTone: Record<VolunteerRow['status'], string> = {
  available: 'bg-emerald-100 text-emerald-700',
  assigned: 'bg-blue-100 text-blue-700',
  'needs-assignment': 'bg-amber-100 text-amber-700',
};

export default function VolunteersModule({ volunteers }: { volunteers: VolunteerRow[] }) {
  return (
    <section className="rounded-3xl border border-[#e9e0d4] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tight text-[#122a3f]">Volunteer Management</h3>
        <button className="rounded-xl border border-[#d8cec5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#faf7f2]">
          View directory
        </button>
      </div>
      <div className="space-y-3">
        {volunteers.map((v) => (
          <article key={v.id} className="rounded-2xl border border-[#e9e0d4] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-[#122a3f]">{v.name}</h4>
                <p className="text-xs text-slate-600">{v.assignment}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone[v.status]}`}>{v.status.replace('-', ' ')}</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">Skills: {v.skills.join(', ')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{v.hours}h contributed</span>
              {['View Profile', 'Message', 'Assign Task', 'Reassign'].map((label) => (
                <button key={label} className="rounded-lg border border-[#d8cec5] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-[#faf7f2]">
                  {label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
