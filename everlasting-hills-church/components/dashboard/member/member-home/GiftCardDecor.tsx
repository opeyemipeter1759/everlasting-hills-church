import { Sparkles } from "lucide-react";

const GOLD = "#F5C76B";

/** Purely decorative: gift-wrap ribbons and a bow, soft glows, and twinkling sparkles. */
export function GiftCardDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft glows */}
      <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#FF6B8B]/25 blur-3xl" />
      <div className="absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#F5C76B]/20 blur-3xl" />

      {/* Gift-wrap ribbons crossing near the top-right corner */}
      <div className="absolute inset-y-0 right-14 w-5 bg-gradient-to-b from-[#F5C76B]/70 via-[#F5C76B]/40 to-transparent" />
      <div className="absolute inset-x-0 top-14 h-5 bg-gradient-to-l from-[#F5C76B]/70 via-[#F5C76B]/35 to-transparent" />

      {/* The bow, sitting where the ribbons cross */}
      <svg viewBox="0 0 64 40" className="absolute right-[1.6rem] top-[2.6rem] h-10 w-16 drop-shadow-md">
        <path d="M32 20 C20 2, 2 6, 8 18 C12 26, 24 24, 32 20 Z" fill={GOLD} />
        <path d="M32 20 C44 2, 62 6, 56 18 C52 26, 40 24, 32 20 Z" fill={GOLD} />
        <path d="M30 20 L22 38 L28 35 L31 22 Z M34 20 L42 38 L36 35 L33 22 Z" fill="#E0AE4E" />
        <circle cx="32" cy="20" r="5" fill="#E0AE4E" />
      </svg>

      {/* Sparkles */}
      <Sparkles size={14} className="absolute left-[46%] top-5 text-[#F5C76B] motion-safe:animate-pulse" />
      <Sparkles size={10} className="absolute left-6 top-[58%] text-white/60 motion-safe:animate-pulse [animation-delay:700ms]" />
      <Sparkles size={12} className="absolute bottom-6 right-1/3 text-[#F5C76B]/80 motion-safe:animate-pulse [animation-delay:1400ms]" />
      <span className="absolute right-8 top-[46%] h-1.5 w-1.5 rounded-full bg-white/70 motion-safe:animate-ping [animation-duration:3s]" />
      <span className="absolute left-[30%] top-10 h-1 w-1 rounded-full bg-[#F5C76B] motion-safe:animate-ping [animation-duration:4s]" />
    </div>
  );
}
