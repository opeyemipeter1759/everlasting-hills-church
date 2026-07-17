import { Wifi, WifiOff } from "lucide-react";

export function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-[#b8a8ac] dark:text-white/25 text-xs">—</span>;
  const online = type.toLowerCase().includes("online");
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        online
          ? "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400"
          : "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400"
      }`}
    >
      {online ? <Wifi size={10} /> : <WifiOff size={10} />}
      {type}
    </span>
  );
}

export function InterestBadge({ interest }: { interest: string | null }) {
  if (!interest) return <span className="text-[#b8a8ac] dark:text-white/25 text-xs">—</span>;
  const yes = interest === "Yes";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        yes
          ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
          : "bg-[#FFF4F6] dark:bg-white/[0.04] text-[#8a7e80] dark:text-white/40 border border-[#E7CDD3]/60 dark:border-white/[0.08]"
      }`}
    >
      {yes ? "Interested" : "Not yet"}
    </span>
  );
}
