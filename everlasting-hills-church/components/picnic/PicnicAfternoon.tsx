import Image from "next/image";
import ScrollReveal from "@/components/home/ScrollReveal";
import { PHOTOS } from "./picnic-config";
import type { PicnicContent } from "./picnic-content";
import { INK } from "./picnic-styles";

/** What the day is, then Psalm 133 over the park. */
export default function PicnicAfternoon({ c }: { c: PicnicContent }) {
  return (
    <>
      {/* ── The afternoon ────────────────────────────────────────────────── */}
      <section className="border-t border-[#1B1714]/10 bg-[#FBF7EF] py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal>
            <div className="relative">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[2px]">
                <Image src={PHOTOS.family.src} alt={PHOTOS.family.alt} fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
              </div>
              <p className="absolute -bottom-6 right-4 max-w-[15rem] rotate-[-2deg] bg-[#87102C] px-4 py-3 text-[15px] font-medium leading-snug text-[#F7F0E3] shadow-md sm:right-[-1.5rem]">
                {c.familyNote}
              </p>
            </div>
          </ScrollReveal>

          <div>
            <p className="text-sm font-medium text-[#87102C]">{c.afternoonKicker}</p>
            <h2 className={`mt-4 font-serif text-4xl leading-[1.05] tracking-tight ${INK} sm:text-5xl`}>
              {c.afternoonTitle}
            </h2>
            <ol className="mt-10 divide-y divide-[#1B1714]/10 border-y border-[#1B1714]/10">
              {c.afternoon.map((item, i) => (
                <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-4 py-6">
                  <span className="font-serif text-2xl text-[#87102C]">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className={`text-lg font-semibold ${INK}`}>{item.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#1B1714]/65">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Scripture over a picnic spread ──────────────────────────────── */}
      <section className="relative isolate flex h-[600px] items-end overflow-hidden sm:h-[760px] lg:h-[860px]">
        <Image src={PHOTOS.unity.src} alt={PHOTOS.unity.alt} fill sizes="100vw" quality={92} className="-z-10 object-cover object-[center_60%]" />
        {/* Warm dark shade from the ground up: the sunset stays golden, the verse stays readable. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#140C06]/90 via-[#140C06]/45 via-40% to-[#140C06]/5" />
        <ScrollReveal className="w-full">
          <blockquote className="mx-auto max-w-4xl px-5 pb-16 text-center sm:px-8 sm:pb-20">
            <p className="text-balance font-serif text-3xl leading-[1.2] text-[#FBF4E6] [text-shadow:0_2px_24px_rgba(20,12,6,0.6)] sm:text-5xl">
              &ldquo;{c.verseText}&rdquo;
            </p>
            <footer className="mt-6 text-[15px] font-medium text-[#FBF4E6]/80">{c.verseRef}</footer>
          </blockquote>
        </ScrollReveal>
      </section>
    </>
  );
}
