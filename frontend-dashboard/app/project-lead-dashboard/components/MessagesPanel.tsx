import type { MessageThread } from '../types';

export default function MessagesPanel({ threads }: { threads: MessageThread[] }) {
  const unread = threads.reduce((sum, item) => sum + item.unread, 0);

  return (
    <section className="rounded-3xl border border-[#e9e0d4] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tight text-[#122a3f]">Messages & Team Updates</h3>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{unread} unread</span>
      </div>
      <div className="space-y-2">
        {threads.map((thread) => (
          <button
            key={thread.id}
            className="w-full rounded-xl border border-[#e9e0d4] p-3 text-left transition hover:bg-[#faf7f2] focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-[#122a3f]">{thread.title}</p>
              <p className="text-xs text-slate-500">{thread.updatedAt}</p>
            </div>
            <p className="mt-1 text-sm text-slate-600">{thread.preview}</p>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-lg bg-[#0b1a37] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#13264d]">Start new message</button>
        <button className="rounded-lg border border-[#d8cec5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#faf7f2]">Broadcast update</button>
      </div>
    </section>
  );
}
