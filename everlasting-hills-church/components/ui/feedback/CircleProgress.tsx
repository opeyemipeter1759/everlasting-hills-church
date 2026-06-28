export function CircleProgress({ value }: { value: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3.5" className="stroke-gray-200 dark:stroke-white/10" />
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3.5" stroke="#87102C" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 20 20)" />
    </svg>
  );
}
