import { Search } from "lucide-react";

export default function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full sm:w-48">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b8a8ac] dark:text-white/30 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search first timers…"
        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 focus:border-[#87102C] transition-all placeholder:text-[#a8a3a4] dark:placeholder:text-white/30"
      />
    </div>
  );
}
