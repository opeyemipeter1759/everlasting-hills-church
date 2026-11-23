import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import { SETMAN_FALLBACK, type SetmanContent } from "@/lib/site-settings";

/** "Pastor John A. Doe" → "JD". Skips honorifics and placeholder brackets. */
function initialsFrom(name: string) {
  const honorifics = new Set(["pastor", "pst", "rev", "reverend", "dr", "bishop", "apostle", "prophet", "evangelist"]);
  const words = name
    .replace(/[[\]().]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !honorifics.has(w.toLowerCase()));
  if (words.length === 0) return "EHC";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * "A word from our Set Man" — portrait + personal welcome, shown above the About
 * section. All copy and the photo come from the SETMAN site-settings section.
 */
export default function SetmanSection({ content }: { content?: SetmanContent }) {
  const c = content ?? SETMAN_FALLBACK;
  if (!c.visible) return null;

  return (
    <section id="setman" className="relative overflow-hidden bg-white px-2 py-20 md:px-4 md:py-24">
      <div className="relative mx-auto max-w-[1200px] px-4 xs:px-5 sm:px-8">
        {/* items-stretch on desktop: the text column sets the row height and the photo fills it. */}
        <div className="grid items-center gap-10 md:gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch lg:gap-16">
          {/* ── Portrait ── */}
          <ScrollReveal direction="left" className="lg:h-full">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[380px] overflow-hidden rounded-2xl bg-[#F1E9EA] lg:aspect-auto lg:h-full lg:min-h-[420px] lg:max-w-none">
              {c.photo ? (
                <Image
                  src={c.photo}
                  alt={c.name}
                  fill
                  sizes="(min-width: 1024px) 460px, (min-width: 480px) 380px, 90vw"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-6xl font-semibold tracking-tight text-[#87102C]/40 sm:text-7xl">
                    {initialsFrom(c.name)}
                  </span>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* ── Message ── */}
          <div className="flex flex-col justify-center">
            <ScrollReveal delay={0.1}>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-[1px] w-full max-w-8 bg-[#87102C]/40" />
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#87102C] xs:tracking-[0.25em]">
                  {c.label}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <h2 className="text-balance text-3xl font-bold tracking-tight text-[#111] sm:text-4xl md:text-[3rem] md:leading-[1.1]">
                {c.headline}
                <span className="block text-[#87102C]">{c.headlineAccent}</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="mt-8 space-y-4">
                {c.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className={`text-base leading-relaxed md:text-[17px] ${
                      i === 0 ? "font-medium text-[#2a2a2a]" : "text-[#4a4a4a]"
                    }`}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-black/[0.06] pt-8">
                <div>
                  <p className="text-xl font-semibold text-[#111]">{c.name}</p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">{c.title}</p>
                </div>
                <Link
                  href={c.cta.href}
                  className="group inline-flex items-center gap-2 rounded-xl border border-[#E7CDD3] px-6 py-3 text-sm font-semibold text-[#87102C] transition-colors hover:border-[#87102C] hover:bg-[#87102C] hover:text-white"
                >
                  {c.cta.label}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
