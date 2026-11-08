// ── Design tokens (match admin DashboardCard exactly) ────────────────────────
export const card = "flex flex-col rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-white dark:bg-white/[0.05] shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none";
export const hdrBdr = "border-b border-[#E7CDD3]/40 dark:border-white/[0.07]";
export const iconBg = "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25";
export const iconCl = "text-[#87102C] dark:text-[#FFB3C1]";
export const muted = "text-[#8a7e80] dark:text-white/45";
export const linkCl = "text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:underline flex items-center gap-0.5";

// ── Type scale: every home card uses these, so sizes match across the page ──
/** Section label above a card title: "PRAYER WATCH". 10px. */
export const kicker = "text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]";
/** The card's own title: "Your watch hour". 14px bold. */
export const cardTitle = "text-sm font-bold text-[#111] dark:text-white";
/** A row inside a card: an announcement, a sermon, a person. 14px semibold. */
export const itemTitle = "text-sm font-semibold text-[#111] dark:text-white";
/** The one thing the card is about: "Matthew 16–28", a sermon title. 16px bold. */
export const valueText = "text-base font-bold leading-snug text-[#111] dark:text-white";
/** A figure: "38%", "22:00–00:00", a countdown. 24px bold, aligned digits. */
export const statText = "text-2xl font-bold leading-none tracking-tight tabular-nums text-[#111] dark:text-white";
/** Running text. 14px. */
export const bodyText = "text-sm leading-relaxed text-[#4a4244] dark:text-white/75";
/** Supporting line under a title: dates, speakers, durations. 12px. */
export const metaText = `text-xs ${muted}`;
/** Chips, counts and fine print. 11px. */
export const smallText = "text-[11px]";

// ── Buttons: one height and one text size everywhere ────────────────────────
const button = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors";
export const btnPrimary = `${button} bg-[#87102C] text-white hover:bg-[#6E0C24]`;
export const btnSecondary = `${button} border border-[#E7CDD3] text-[#4a4244] hover:border-[#87102C]/40 hover:text-[#87102C] dark:border-white/15 dark:text-white/80 dark:hover:text-[#FFB3C1]`;

/** Icon sizes: card headers and buttons 15, inline beside text 13. */
export const ICON = { header: 15, button: 15, inline: 13 } as const;
