import { card, hdrBdr, iconBg, iconCl, kicker, cardTitle } from "./tokens";

// ── Circular Progress ─────────────────────────────────────────────────────────

export function CircleProgress({ value, size = 40 }: { value: number; size?: number }) {
  const r = size * 0.375;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0 -rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="4"
        className="stroke-[#E7CDD3]/60 dark:stroke-white/10" />
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="4"
        stroke="#87102C" strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" />
    </svg>
  );
}

// ── Panel Card (shared premium card shell) ────────────────────────────────────

export function PanelCard({
  kicker: k, title, icon: Icon, action, children, bodyClass = "p-5 sm:p-6",
}: {
  kicker: string;
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClass?: string;
}) {
  return (
    <section className={card}>
      <div className={`flex items-center justify-between gap-3 ${hdrBdr} px-5 py-4 sm:px-6`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={iconBg}>
            <Icon size={15} className={iconCl} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={kicker}>{k}</p>
            <h3 className={`${cardTitle} truncate`}>{title}</h3>
          </div>
        </div>
        {action}
      </div>
      <div className={`flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}
