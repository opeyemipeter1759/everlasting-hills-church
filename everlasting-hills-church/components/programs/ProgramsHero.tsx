import type { Scripture } from "@/lib/programs";
import { BRAND, SERIF } from "./accents";

/** The top of /programs: what the page is about, and Genesis 49:26 as a quiet anchor. */
export function ProgramsHero({ anchor }: { anchor: Scripture | null }) {
  return (
    <header className="relative overflow-hidden px-4 pb-10 pt-32 sm:px-6 sm:pb-14 sm:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-64 -top-64 h-[820px] w-[820px] opacity-70"
        style={{ background: `radial-gradient(circle, ${BRAND.deepBurgundy}, transparent 70%)` }}
      />
      <div className="relative mx-auto max-w-6xl">
        <h1 className={`${SERIF} max-w-3xl text-[44px] leading-[1.02] tracking-[-0.015em] text-white sm:text-[72px]`}>Our appointed times</h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/75 sm:text-lg">
          Nights on the wall, a crossover into every new month, thirty days in the fire and a homecoming every year. This is how the house keeps time with God.
        </p>
        {anchor?.text && (
          <figure className="mt-10 max-w-xl border-l pl-5" style={{ borderColor: `${BRAND.gold}66` }}>
            <blockquote className={`${SERIF} text-[19px] leading-[1.55] text-white/80`}>{anchor.text}</blockquote>
            <figcaption className="mt-2 text-[13px] tracking-wide" style={{ color: BRAND.gold }}>
              {anchor.reference}
              {anchor.translation ? `, ${anchor.translation}` : ""}
            </figcaption>
          </figure>
        )}
      </div>
    </header>
  );
}
