import type { ReactNode } from "react";
import Image from "next/image";

/**
 * Shared hero band for public marketing pages (About, Beliefs, Pastor,
 * Ministries, Visit, legal). Dark cosmic ground with a burgundy glow, an
 * eyebrow label, a two-tone heading, and an optional lead paragraph.
 *
 * Kept deliberately simple and server-rendered. Pages compose their own
 * content sections below this band.
 */
export default function PageHero({
  eyebrow,
  title,
  accent,
  lead,
  children,
  backgroundImage,
}: {
  eyebrow: string;
  title: string;
  /** Accent fragment rendered in serif italic burgundy after the title. */
  accent?: string;
  lead?: string;
  children?: ReactNode;
  /** Optional CMS-uploaded photo behind the band, dimmed so the text stays readable. */
  backgroundImage?: string | null;
}) {
  return (
    <section className="relative overflow-hidden bg-church-dark text-white">
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image src={backgroundImage} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/65 to-church-dark/95" />
        </div>
      )}
      {/* Cosmic glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
        <div className="absolute bottom-[-30%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-16 pt-36 text-center sm:px-8 sm:pt-44">
        <p className="mb-5 text-[10px] font-black uppercase tracking-[0.4em] text-church-accent">
          {eyebrow}
        </p>
        <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          {title}
          {accent ? (
            <span className="mt-1 block bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#FFB3C1] bg-clip-text font-serif italic font-normal text-transparent sm:mt-0 sm:inline">
              {" "}
              {accent}
            </span>
          ) : null}
        </h1>
        {lead ? (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
            {lead}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
