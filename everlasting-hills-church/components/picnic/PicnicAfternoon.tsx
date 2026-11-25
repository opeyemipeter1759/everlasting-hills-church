import Image from "next/image";
import ScrollReveal from "@/components/home/ScrollReveal";
import { PHOTOS } from "./picnic-config";
import { INK } from "./picnic-styles";

const AFTERNOON = [
  {
    n: "01",
    title: "Food to share",
    body: "Coolers, plates, something from your kitchen if you'd like to bring it. Nobody goes home hungry.",
  },
  {
    n: "02",
    title: "Games on the grass",
    body: "Something for the children, and something for the ones who still think they can win a race.",
  },
  {
    n: "03",
    title: "The gift exchange",
    body: "Signed up for the gift exchange? This is where the gifts change hands.",
  },
  {
    n: "04",
    title: "Time with each other",
    body: "No programme to rush through. Sit, talk, laugh, pray — and meet the people you only ever wave at on Sunday.",
  },
];

/** What the day is, then Psalm 133 over the park. */
export default function PicnicAfternoon() {
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
              <p className="absolute -bottom-6 right-4 max-w-[15rem] rotate-[-2deg] bg-[#F2B33D] px-4 py-3 font-[family-name:var(--nf-dancing)] text-xl leading-snug text-[#1B1714] shadow-md sm:right-[-1.5rem]">
                Aunties, uncles, little ones — everybody&apos;s invited.
              </p>
            </div>
          </ScrollReveal>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#87102C]">The afternoon</p>
            <h2 className={`mt-4 font-serif text-4xl leading-[1.05] tracking-tight ${INK} sm:text-5xl`}>
              Nothing fancy. <span className="italic">Just us,</span> outside.
            </h2>
            <ol className="mt-10 divide-y divide-[#1B1714]/10 border-y border-[#1B1714]/10">
              {AFTERNOON.map((item) => (
                <li key={item.n} className="grid grid-cols-[3.5rem_1fr] gap-4 py-6">
                  <span className="font-serif text-3xl italic text-[#87102C]/70">{item.n}</span>
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

      {/* ── Scripture over the park ──────────────────────────────────────── */}
      <section className="relative isolate flex h-[520px] items-end overflow-hidden sm:h-[620px]">
        <Image src={PHOTOS.park.src} alt={PHOTOS.park.alt} fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#10241A]/90 via-[#10241A]/50 to-[#10241A]/5" />
        <ScrollReveal className="w-full">
          <blockquote className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
            <p className="max-w-3xl font-serif text-3xl leading-[1.2] text-[#F7F0E3] sm:text-5xl">
              &ldquo;Behold, how good and how pleasant it is for brethren to dwell together in unity!&rdquo;
            </p>
            <footer className="mt-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F7F0E3]/70">Psalm 133:1</footer>
          </blockquote>
        </ScrollReveal>
      </section>
    </>
  );
}
