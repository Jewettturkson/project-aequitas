import { Clock3, MapPin, Medal, Sparkles } from "lucide-react";
import type { Volunteer } from "../types";

type VolunteerProfileCardProps = {
  volunteer: Volunteer;
};

export default function VolunteerProfileCard({ volunteer }: VolunteerProfileCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col items-center text-center">
        <img
          src={volunteer.avatarUrl}
          alt={`${volunteer.name} avatar`}
          className="mb-4 h-28 w-28 rounded-full object-cover"
        />
        <h2 className="text-3xl font-black tracking-tight text-slate-900">{volunteer.name}</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">{volunteer.role}</p>
      </div>

      <button
        type="button"
        className="mb-4 w-full rounded-xl bg-[#0E1628] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15223a]"
      >
        Edit Profile
      </button>

      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        {volunteer.availability}
      </div>

      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Skills & interests</p>
        <div className="flex flex-wrap gap-2">
          {volunteer.interests.map((interest) => (
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
          <dd className="font-semibold text-slate-800">{volunteer.location}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
            <Clock3 className="h-3.5 w-3.5" /> Hours
          </dt>
          <dd className="font-semibold text-slate-800">{volunteer.hoursVolunteered}h</dd>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3.5 w-3.5" /> Completed
          </dt>
          <dd className="font-semibold text-slate-800">{volunteer.completedProjects}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
            <Medal className="h-3.5 w-3.5" /> Impact
          </dt>
          <dd className="font-semibold text-slate-800">{volunteer.impactScore}</dd>
        </div>
      </dl>
    </section>
  );
}
