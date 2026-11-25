import ScrollReveal from "@/components/home/ScrollReveal";
import { PICNIC_FALLBACK, type PicnicContent } from "./picnic-content";
import { INK } from "./picnic-styles";

/** The games on the day, as many as the CMS lists. Hidden when there are none. */
export default function PicnicGames({ c }: { c: PicnicContent }) {
  const games = (c.games ?? PICNIC_FALLBACK.games ?? []).filter((g) => g.name?.trim());
  if (games.length === 0) return null;

  return (
    <section id="games" className="relative scroll-mt-20 border-b border-[#1B1714]/10 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-sm font-medium text-[#87102C]">{c.gamesKicker ?? PICNIC_FALLBACK.gamesKicker}</p>
            <h2 className={`mt-4 font-serif text-4xl leading-[1.05] tracking-tight ${INK} sm:text-5xl`}>
              {c.gamesTitle ?? PICNIC_FALLBACK.gamesTitle}
            </h2>
          </div>
          <p className="max-w-lg text-[16px] leading-relaxed text-[#1B1714]/65">{c.gamesIntro ?? PICNIC_FALLBACK.gamesIntro}</p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game, i) => (
            <li key={`${game.name}-${i}`}>
              <ScrollReveal delay={(i % 4) * 0.06} className="h-full">
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-[0_18px_40px_-30px_rgba(27,23,20,0.55)] ring-1 ring-[#1B1714]/[0.07] transition-transform duration-300 hover:-translate-y-1">
                  <span className="gingham absolute inset-x-0 top-0 h-1.5 opacity-80" aria-hidden="true" />
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-3xl leading-none text-[#87102C]">{String(i + 1).padStart(2, "0")}</span>
                    {game.forWho?.trim() && (
                      <span className="rounded-full bg-[#1E3A2A]/[0.08] px-2.5 py-1 text-xs font-medium text-[#1E3A2A]">{game.forWho}</span>
                    )}
                  </div>
                  <h3 className={`mt-5 text-lg font-semibold leading-snug ${INK}`}>{game.name}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#1B1714]/65">{game.description}</p>
                </article>
              </ScrollReveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
