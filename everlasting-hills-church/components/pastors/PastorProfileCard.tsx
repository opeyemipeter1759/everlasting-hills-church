import { BookOpen, Instagram, Mail } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import PastorPortraitPlaceholder from "./PastorPortraitPlaceholder";
import type { Pastor } from "./pastor-content";

export default function PastorProfileCard({ pastor, index }: { pastor: Pastor; index: number }) {
  const reversed = index % 2 === 1;
  return (
    <article
      id={pastor.id}
      className={`scroll-mt-24 ${reversed ? "bg-[#FAF7F8]" : "bg-white"}`}
    >
      <ScrollReveal>
        <div className="mx-auto max-w-6xl px-4 py-16 xs:px-6 sm:px-8 sm:py-24">
          <div className="grid items-center gap-12 md:grid-cols-12 md:gap-16">
            <div className={`md:col-span-5 ${reversed ? "md:order-2" : ""}`}>
              <div className="relative mx-auto max-w-sm md:max-w-none">
                <div
                  className={`absolute inset-0 rounded-2xl border border-[#87102C]/25 ${
                    reversed ? "-translate-x-4 translate-y-4" : "translate-x-4 translate-y-4"
                  }`}
                  aria-hidden="true"
                />
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#141414] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
                  {pastor.photo ? (
                    <img
                      src={pastor.photo}
                      alt={pastor.name}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : (
                    <PastorPortraitPlaceholder />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 pt-16">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">{pastor.role}</p>
                    <p className="mt-1 font-serif text-xl text-white">{pastor.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`md:col-span-7 ${reversed ? "md:order-1" : ""}`}>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#87102C]">
                <span className="h-px w-8 bg-[#87102C]/40" />
                {pastor.role}
              </p>
              <h2 className="mt-3 text-balance font-serif text-3xl font-normal tracking-tight text-[#111] sm:text-4xl">
                {pastor.name}
              </h2>
              <blockquote className="relative mt-8">
                <span aria-hidden="true" className="absolute -left-1 -top-6 font-serif text-7xl leading-none text-[#87102C]/15">
                  &ldquo;
                </span>
                <p className="relative text-balance font-serif text-xl italic leading-relaxed text-[#1a1a1a] sm:text-2xl">
                  {pastor.quote}
                </p>
              </blockquote>
              <div className="mt-7 space-y-4">
                {pastor.bio.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="text-[15px] leading-[1.75] text-[#555]">
                    {paragraph}
                  </p>
                ))}
              </div>
              <figure className="mt-8 flex gap-4 rounded-xl border border-[#87102C]/10 bg-white p-5 shadow-sm">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#87102C]/[0.08] text-[#87102C]">
                  <BookOpen size={16} />
                </span>
                <div>
                  <blockquote className="text-sm italic leading-relaxed text-[#444]">&ldquo;{pastor.scriptureText}&rdquo;</blockquote>
                  <figcaption className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#87102C]">
                    {pastor.scripture}
                  </figcaption>
                </div>
              </figure>
              {(pastor.email || pastor.instagram) && (
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {pastor.email && (
                    <a
                      href={`mailto:${pastor.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[#333] transition-colors hover:border-[#87102C]/30 hover:text-[#87102C]"
                    >
                      <Mail size={15} />
                      Email
                    </a>
                  )}
                  {pastor.instagram && (
                    <a
                      href={pastor.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[#333] transition-colors hover:border-[#87102C]/30 hover:text-[#87102C]"
                    >
                      <Instagram size={15} />
                      Instagram
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </article>
  );
}
