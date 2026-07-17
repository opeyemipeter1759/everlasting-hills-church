import { Heart } from "lucide-react";
import { ChipCard } from "./ChipCard";

/** Marital status — inverted (burgundy) card when married, plain chip when single. */
export function MaritalStatusCard({ isMarried, anniversary }: { isMarried: boolean; anniversary: string | null }) {
  if (!isMarried) return <ChipCard icon={Heart} label="Marital status" value="Single" />;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 h-full min-h-[160px]"
      style={{ background: "linear-gradient(150deg, #87102C 0%, #6E0C24 55%, #4a0819 100%)" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div aria-hidden="true" className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/8 blur-2xl pointer-events-none" />
      <div className="relative z-10 w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
        <Heart size={17} className="text-white" aria-hidden="true" />
      </div>
      <div className="relative z-10 flex-1">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-white/50 mb-1.5">Marital status</p>
        <p className="text-[15px] font-bold text-white">Married</p>
        {anniversary && <p className="text-xs text-white/50 mt-2">Anniversary · {anniversary}</p>}
      </div>
    </div>
  );
}
