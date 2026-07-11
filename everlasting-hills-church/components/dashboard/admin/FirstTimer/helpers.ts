const AVATAR_COLORS = [
  "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400",
  "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400",
  "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
  "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
  "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
];

export function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function relativeDate(raw: string) {
  const d = new Date(raw);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
