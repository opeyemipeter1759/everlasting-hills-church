import Image from "next/image";
import ScrollReveal from "@/components/home/ScrollReveal";
import { PHOTOS } from "./picnic-config";
import type { PicnicContent } from "./picnic-content";

/** A small wall of prints beside the "bring along" list. */
export default function PicnicBring({ c }: { c: PicnicContent }) {
  return (
      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative grid grid-cols-2 items-center gap-5 sm:gap-7">
            <Print photo={PHOTOS.reading} caption="slow afternoons" rotate="-rotate-2" />
            <div className="space-y-6 sm:space-y-8">
              <Print photo={PHOTOS.gingham} caption="the good blanket" rotate="rotate-2" />
              <Print photo={PHOTOS.fruit} caption="someone always brings fruit" rotate="-rotate-1" square />
            </div>
          </div>

          <ScrollReveal>
            <div className="lined-paper relative rounded-sm px-8 pb-10 pt-9 shadow-[0_24px_50px_-30px_rgba(27,23,20,0.5)] ring-1 ring-[#1B1714]/[0.06]">
              <span className="tape -top-3 right-10 rotate-3" aria-hidden="true" />
              <p className="text-sm font-medium text-[#87102C]">Bring along</p>
              <ul className="mt-6 space-y-[14px]">
                {c.bring.filter((t) => t.trim()).map((thing, i) => (
                  <li key={i} className="flex items-center gap-4 text-[17px] leading-[26px] text-[#1B1714]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-[#1E3A2A]" fill="none" aria-hidden="true">
                      <path d="M4 13c2 1.5 3.5 3.5 5 6 3-6 6.5-10.5 11-14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {thing}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[15px] font-medium text-[#87102C]">{c.bringClose}</p>
            </div>
          </ScrollReveal>
        </div>
      </section>
  );
}

function Print({
  photo,
  caption,
  rotate,
  className = "",
  square = false,
}: {
  photo: { src: string; alt: string };
  caption: string;
  rotate: string;
  className?: string;
  square?: boolean;
}) {
  return (
    <figure className={`relative bg-white p-2.5 pb-10 shadow-[0_22px_44px_-26px_rgba(27,23,20,0.55)] ${rotate} ${className}`}>
      <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" aria-hidden="true" />
      <div className={`relative overflow-hidden bg-[#e9e1d2] ${square ? "aspect-square" : "aspect-[3/4]"}`}>
        <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 1024px) 45vw, 300px" className="object-cover" />
      </div>
      <figcaption className="absolute bottom-2.5 left-3 text-[13px] font-medium text-[#1B1714]/60">
        {caption}
      </figcaption>
    </figure>
  );
}
