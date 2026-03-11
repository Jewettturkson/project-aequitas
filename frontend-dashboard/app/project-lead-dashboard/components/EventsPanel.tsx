import type { EventRow } from '../types';

export default function EventsPanel({ events }: { events: EventRow[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tight text-slate-900">Events & Schedule</h3>
        <button className="rounded-xl bg-[#0b1a37] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#13264d]">Create Event</button>
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <article key={event.id} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900">{event.title}</h4>
                <p className="text-xs text-slate-600">{event.when} • {event.location}</p>
              </div>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{event.type}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{event.rsvpCount} RSVPs</span>
              <button className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Edit Event</button>
              <button className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Send Reminder</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
