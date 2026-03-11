import { Clock3, MapPin, Medal, Sparkles } from "lucide-react";
import type { UserProfileDoc } from "../../../lib/turknodeDb";

type VolunteerProfileCardProps = {
  volunteer: UserProfileDoc;
  onEditProfile: () => void;
  onToggleAvailability: () => void;
};

export default function VolunteerProfileCard({
  volunteer,
  onEditProfile,
  onToggleAvailability,
}: VolunteerProfileCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col items-center text-center">
        {volunteer.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={volunteer.photoUrl}
            alt={`${volunteer.displayName} profile`}
            className="mb-4 h-28 w-28 rounded-full object-cover"
          />
        ) : (
          <div className="mb-4 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
        )}
        <h2 className="text-3xl font-black tracking-tight text-slate-900">{volunteer.displayName}</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">Community Volunteer</p>
      </div>

      <button
        type="button"
        onClick={onEditProfile}
        className="mb-4 w-full rounded-xl bg-[#0E1628] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15223a]"
      >
        Edit Profile
      </button>

      <button
        type="button"
        onClick={onToggleAvailability}
        className={`mb-6 w-full rounded-xl border px-3 py-2 text-sm font-medium transition ${
          volunteer.availableForProjects
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
        }`}
      >
        {volunteer.availableForProjects
          ? `Available for new projects • active on ${volunteer.completedProjects} completed`
          : "Currently unavailable for new projects"}
      </button>

      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Skills & interests</p>
        <div className="flex flex-wrap gap-2">
          {[...(volunteer.skills || []), ...(volunteer.interests || [])].slice(0, 8).map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-5 border-t border-slate-100 pt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">About</p>
        <p className="text-sm leading-6 text-slate-700">{volunteer.bio}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
            <MapPin className="h-3.5 w-3.5" /> Location
          </dt>
          <dd className="font-semibold text-slate-800">{volunteer.location || "Not set"}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
            <Clock3 className="h-3.5 w-3.5" /> Hours
          </dt>
          <dd className="font-semibold text-slate-800">{volunteer.hoursContributed || 0}h</dd>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3.5 w-3.5" /> Completed
          </dt>
          <dd className="font-semibold text-slate-800">{volunteer.completedProjects || 0}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
            <Medal className="h-3.5 w-3.5" /> Impact
          </dt>
          <dd className="font-semibold text-slate-800">{volunteer.impactScore || 0}</dd>
        </div>
      </dl>
    </section>
  );
}
