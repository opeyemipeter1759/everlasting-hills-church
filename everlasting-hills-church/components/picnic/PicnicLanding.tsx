import "./picnic.css";
import PicnicAfternoon from "./PicnicAfternoon";
import PicnicBring from "./PicnicBring";
import PicnicGames from "./PicnicGames";
import PicnicHero from "./PicnicHero";
import PicnicRsvp from "./PicnicRsvp";
import PicnicShare from "./PicnicShare";
import { PHOTOS } from "./picnic-config";
import { TBA_DATE, dateParts, type PicnicContent } from "./picnic-content";

export default function PicnicLanding({ c }: { c: PicnicContent }) {
  const d = dateParts(c.date);

  return (
    <main className="paper-grain overflow-x-hidden">
      <PicnicHero d={d} c={c} />
      <PicnicAfternoon c={c} />
      <PicnicGames c={c} />
      <PicnicBring c={c} />

      {/* ── RSVP ─────────────────────────────────────────────────────────── */}
      <section id="rsvp" className="relative scroll-mt-20 bg-[#1E3A2A] text-[#F7F0E3]">
        <div className="gingham h-3 w-full opacity-90" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="text-sm font-medium text-[#F7F0E3]/75">Save your spot</p>
            <h2 className="mt-4 font-serif text-5xl leading-[1] tracking-tight sm:text-6xl">{c.rsvpTitle}</h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#F7F0E3]/65">
              {c.rsvpBody}
            </p>
            <p className="mt-10 font-serif text-2xl text-[#F7F0E3]">{d.long ?? TBA_DATE}</p>
          </div>
          <div className="lg:pt-4">
            <PicnicRsvp target={d.iso} />
          </div>
        </div>
      </section>

      {/* ── Share ────────────────────────────────────────────────────────── */}
      <section id="share" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <PicnicShare date={c.date ?? null} time={c.time ?? null} venue={c.venue ?? null} />
        </div>
      </section>

      {/* ── Credits ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1B1714]/10 py-8">
        <p className="mx-auto max-w-6xl px-5 text-xs leading-relaxed text-[#1B1714]/45 sm:px-8">
          Photographs from{" "}
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Unsplash
          </a>{" "}
          by{" "}
          {Object.values(PHOTOS).map((p, i, all) => (
            <span key={p.src}>
              <a href={p.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {p.by}
              </a>
              {i < all.length - 2 ? ", " : i === all.length - 2 ? " and " : "."}
            </span>
          ))}
        </p>
      </footer>
    </main>
  );
}
