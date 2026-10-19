import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import HillRidge from "./HillRidge";

/**
 * Shared hero for public marketing pages (About, Beliefs, Visit, legal).
 *
 * Left-aligned type on the church's dark ground, with the page's photo cut
 * into an arch — a hill — on the right. With no photo, three nested arches
 * stand in. The front ridge along the bottom is painted in `nextFill`, so the
 * hero rolls into the section beneath it.
 *
 * Server-rendered; pages compose their own content below.
 */
export default function PageHero({
  eyebrow,
  title,
  accent,
  lead,
  children,
  backgroundImage,
  nextFill = "#ffffff",
}: {
  /** The page's name, shown as a small trail back to Home. */
  eyebrow: string;
  title: string;
  /** Second line of the heading — set in the same type, one tone quieter. */
  accent?: string;
  lead?: string;
  children?: ReactNode;
  /** Optional CMS-uploaded photo, shown inside the arch. */
  backgroundImage?: string | null;
  /** Colour of the section under the hero, so the ridge lands on it cleanly. */
  nextFill?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-church-dark text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-[-12%] top-[-25%] h-[75%] w-[65%] rounded-full bg-[#87102C]/25 blur-[150px]" />
        <div className="absolute bottom-[-30%] left-[-15%] h-[55%] w-[55%] rounded-full bg-[#4a0819]/40 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-32 xs:px-5 sm:px-8 sm:pb-32 sm:pt-40 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16 lg:pb-40 lg:pt-44">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/55">
            <Link
              href="/"
              className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-accent"
            >
              Home
            </Link>
            <span aria-hidden="true" className="text-white/25">/</span>
            <span aria-current="page" className="text-church-accent">{eyebrow}</span>
          </nav>

          <h1 className="mt-6 max-w-[16ch] text-balance font-serif text-[2.6rem] font-normal leading-[1.04] tracking-tight xs:text-5xl sm:text-6xl lg:text-[4.5rem]">
            {title}
            {accent ? <span className="block text-white/55">{accent}</span> : null}
          </h1>

          {lead ? (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">{lead}</p>
          ) : null}
          {children}
        </div>

        {backgroundImage ? (
          <div className="relative mx-auto w-full max-w-[17rem] lg:ml-auto lg:mr-0 lg:max-w-[22rem]">
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-[999px] border border-church-accent/30 sm:translate-x-4 sm:translate-y-4"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] bg-church-card">
              <Image
                src={backgroundImage}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 272px, 352px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-church-dark/50 via-transparent to-transparent" />
            </div>
          </div>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 220 260"
            fill="none"
            className="hidden h-auto w-full max-w-[19rem] justify-self-end text-church-accent lg:block"
          >
            <path d="M10 260V120a100 100 0 0 1 200 0v140" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
            <path d="M40 260V125a70 70 0 0 1 140 0v135" stroke="currentColor" strokeOpacity="0.32" strokeWidth="1.5" />
            <path d="M70 260V130a40 40 0 0 1 80 0v130Z" fill="#87102C" fillOpacity="0.9" />
          </svg>
        )}
      </div>

      <HillRidge fill={nextFill} />
    </section>
  );
}
