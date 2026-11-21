const glass = "rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6";

/** Hidden until the pastors approve who is on the counselling team. */
export function CounsellingTeam({
  counsellors,
}: {
  counsellors: string | null;
}) {
  if (!counsellors) return null;
  return (
    <section aria-labelledby="team-heading" className="mt-20">
      <h2
        id="team-heading"
        className="font-display text-2xl font-bold text-white sm:text-3xl"
      >
        The counselling team
      </h2>
      <p
        className={`${glass} mt-6 whitespace-pre-line text-sm leading-relaxed text-white/80`}
      >
        {counsellors}
      </p>
    </section>
  );
}
