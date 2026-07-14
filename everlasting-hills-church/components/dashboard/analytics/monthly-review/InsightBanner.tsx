interface Props {
  rate: number;
  members: number;
  teams: number;
}

export default function InsightBanner({ rate, members, teams }: Props) {
  const width = Math.min(Math.max(rate, 0), 100);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#87102C] to-[#4a0819] p-6 text-white">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Team Integration</p>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <p className="text-3xl font-bold tabular-nums">{rate}%</p>
        <p className="mb-1 text-sm text-white/70">
          {teams} of {members} new member{members === 1 ? "" : "s"} joined a team
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
