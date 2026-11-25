import "./picnic.css";
import PicnicAfternoon from "./PicnicAfternoon";
import PicnicBring from "./PicnicBring";
import PicnicHero from "./PicnicHero";
import PicnicRsvp from "./PicnicRsvp";
import PicnicShare from "./PicnicShare";
import { PHOTOS, formatPicnicDate, picnicDate } from "./picnic-config";

export default function PicnicLanding() {
  const date = picnicDate();
  const d = formatPicnicDate(date);

  return (
    <main className="paper-grain overflow-x-hidden">
      <PicnicHero d={d} />
      <PicnicAfternoon />
      <PicnicBring />

      {/* ── RSVP ─────────────────────────────────────────────────────────── */}
      <section id="rsvp" className="relative scroll-mt-20 bg-[#1E3A2A] text-[#F7F0E3]">
        <div className="gingham h-3 w-full opacity-90" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F2B33D]">Save your spot</p>
            <h2 className="mt-4 font-serif text-5xl leading-[1] tracking-tight sm:text-6xl">
              Will we see <span className="italic">you</span> there?
            </h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#F7F0E3]/65">
              Everyone is welcome — friends, family, neighbours. Leave your details so we plan enough of everything for everyone.
            </p>
            <p className="mt-10 font-[family-name:var(--nf-dancing)] text-3xl text-[#F2B33D]">{d.long}</p>
          </div>
          <div className="lg:pt-4">
            <PicnicRsvp fallbackDate={date.toISOString()} />
          </div>
        </div>
      </section>

      {/* ── Share ────────────────────────────────────────────────────────── */}
      <section id="share" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <PicnicShare dateLong={d.long} />
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
