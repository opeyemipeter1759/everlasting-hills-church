import { ShieldCheck } from "lucide-react";

/**
 * Inverted Card — Membership status. Burgundy background, stands out
 * as the "this one matters most" card in the grid.
 */
export function MembershipCard({ role }: { role: string }) {
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
      <div
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/8 blur-2xl pointer-events-none"
      />
      <div className="relative z-10 w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
        <ShieldCheck size={17} className="text-white" aria-hidden="true" />
      </div>
      <div className="relative z-10 flex-1">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-white/50 mb-1.5">
          Membership Status
        </p>
        <p className="text-[15px] font-bold text-white">Active {role}</p>
        <p className="text-xs text-white/40 mt-3 leading-relaxed">
          Raising men who flourish beyond limits.
        </p>
      </div>
    </div>
  );
}
