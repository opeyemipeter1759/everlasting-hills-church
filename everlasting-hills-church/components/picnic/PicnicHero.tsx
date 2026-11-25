import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { PHOTOS, PICNIC, type formatPicnicDate } from "./picnic-config";
import { INK } from "./picnic-styles";

type PicnicDate = ReturnType<typeof formatPicnicDate>;

/** Headline, ticket stub with the date, and the taped prints. */
export default function PicnicHero({ d }: { d: PicnicDate }) {
  return (
      <section className="relative">
        <div className="gingham h-3 w-full" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-28 sm:px-8 sm:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#87102C]">
              Everlasting Hills Church · End-of-year picnic
            </p>
            <h1 className={`mt-6 font-serif text-[3.4rem] leading-[0.95] tracking-[-0.02em] ${INK} sm:text-7xl lg:text-[5.6rem]`}>
              Pack a blanket.
              <br />
              We&apos;re having
              <br />
              <span className="italic text-[#87102C]">a picnic.</span>
            </h1>
            <p className="mt-7 max-w-[30rem] text-[17px] leading-relaxed text-[#1B1714]/70">
              One unhurried Sunday afternoon to close the year — good food, open grass, games for the children, and the
              whole church family in one place.
            </p>

            {/* Ticket stub */}
            <div className="mt-9 flex max-w-md overflow-hidden rounded-xl bg-white shadow-[0_18px_40px_-24px_rgba(27,23,20,0.45)] ring-1 ring-[#1B1714]/[0.06]">
              <div className="flex w-28 flex-shrink-0 flex-col items-center justify-center bg-[#87102C] px-3 py-5 text-[#F7F0E3]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] opacity-80">{d.weekdayShort}</span>
                <span className="font-serif text-5xl leading-none">{d.day}</span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] opacity-80">
                  {d.monthShort} {d.year}
                </span>
              </div>
              <div className="relative flex-1 border-l-2 border-dashed border-[#1B1714]/15 px-5 py-4">
                <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full bg-[#F7F0E3]" aria-hidden="true" />
                <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full bg-[#F7F0E3]" aria-hidden="true" />
                <dl className="space-y-2.5 text-sm">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1B1714]/40">When</dt>
                    <dd className={`font-semibold ${INK}`}>
                      {d.weekday}, {Number(d.day)} {d.month}
                      {PICNIC.time ? ` · ${PICNIC.time}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1B1714]/40">Where</dt>
                    <dd className={`font-semibold ${INK}`}>{PICNIC.venue ?? "Venue to be announced"}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#rsvp"
                className="inline-flex items-center gap-2 rounded-full bg-[#1E3A2A] px-7 py-3.5 text-[15px] font-semibold text-[#F7F0E3] transition-transform hover:-translate-y-0.5"
              >
                Count me in <ArrowDown size={16} />
              </a>
              <a
                href="#share"
                className={`inline-flex items-center rounded-full px-5 py-3.5 text-[15px] font-semibold ${INK} underline decoration-[#87102C]/40 decoration-2 underline-offset-[6px] hover:decoration-[#87102C]`}
              >
                Share the invite
              </a>
            </div>
          </div>

          {/* Prints */}
          <div className="relative mx-auto w-full max-w-[460px] pb-10 lg:max-w-none">
            <figure className="picnic-float relative ml-auto w-[86%] bg-white p-3 pb-12 shadow-[0_30px_60px_-28px_rgba(27,23,20,0.55)] [--r:-2deg]">
              <span className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-3" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e1d2]">
                <Image src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} fill priority sizes="(max-width: 1024px) 90vw, 480px" className="object-cover" />
              </div>
              <figcaption className="absolute bottom-3 right-5 font-[family-name:var(--nf-dancing)] text-2xl text-[#1B1714]/75">
                see you on the grass
              </figcaption>
            </figure>
            <figure className="absolute -bottom-2 left-0 w-[44%] rotate-[5deg] bg-white p-2 pb-8 shadow-[0_24px_50px_-24px_rgba(27,23,20,0.6)]">
              <span className="tape -top-3 left-6 rotate-6" aria-hidden="true" />
              <div className="relative aspect-square overflow-hidden bg-[#e9e1d2]">
                <Image src={PHOTOS.fruit.src} alt={PHOTOS.fruit.alt} fill sizes="220px" className="object-cover" />
              </div>
            </figure>
            {/* Hand-drawn arrow */}
            <svg
              viewBox="0 0 120 80"
              className="absolute -left-6 top-6 hidden w-28 text-[#87102C] lg:block"
              fill="none"
              aria-hidden="true"
            >
              <path d="M6 10c26-6 58 2 74 26 6 9 9 19 10 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M80 58l10 10 9-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </section>
  );
}
