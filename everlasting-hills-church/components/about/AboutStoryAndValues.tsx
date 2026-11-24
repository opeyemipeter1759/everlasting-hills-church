import { Icon, Compass, Heart, Target } from "@/components/icons";

interface AboutStoryAndValuesProps {
  story: { heading: string; paragraphs: string[] };
  cards: { title: string; body: string }[];
}

const CARD_ICONS = [Compass, Target, Heart];

export default function AboutStoryAndValues({ story, cards }: AboutStoryAndValuesProps) {
  return (
    <>
      <section id="our-story" aria-labelledby="our-story-title" className="bg-[#FAF8F7] py-16 sm:py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 xs:px-5 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-16 lg:gap-24">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-[#87102C]/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#87102C]">Our Story</p>
              </div>
              <h2 id="our-story-title" className="max-w-md text-balance text-3xl font-bold leading-tight tracking-tight text-[#111] sm:text-4xl md:text-[2.75rem]">
                {story.heading}
              </h2>
            </div>

            <ol className="space-y-0 border-l border-[#E7CDD3]">
              {story.paragraphs.map((para, i) => (
                <li key={i} className="relative pb-7 pl-6 last:pb-0 sm:pl-9">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#FAF8F7] bg-[#87102C]"
                  />
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.16em] text-[#87102C]/65">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className={i === 0 ? "text-base font-medium leading-7 text-[#292526] sm:text-lg sm:leading-8" : "text-sm leading-7 text-[#555052] sm:text-base"}>
                    {para}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-brand-blush py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4 xs:px-5 sm:px-8">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-[#87102C]/50" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#87102C]">Our foundations</p>
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-[#111] sm:text-4xl">
              The values that shape us
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {cards.map((card, i) => {
              const Glyph = CARD_ICONS[i] ?? Heart;
              const featured = i === 1;
              return (
                <article
                  key={i}
                  className={`group relative isolate flex min-h-[250px] flex-col overflow-hidden rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 sm:p-8 ${
                    featured
                      ? "border-[#87102C] bg-[#87102C] text-white shadow-[0_16px_40px_-20px_rgba(89,9,28,0.65)]"
                      : "border-[#E7CDD3] bg-white text-[#111] shadow-[0_8px_30px_-20px_rgba(135,16,44,0.25)] hover:shadow-[0_18px_40px_-20px_rgba(135,16,44,0.35)]"
                  }`}
                >
                  {featured && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-14 -top-16 -z-10 h-48 w-48 rounded-full border-[1.5rem] border-white/[0.07]"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                      featured ? "bg-white/15 text-white" : "bg-[#87102C]/10 text-[#87102C]"
                    }`}>
                      <Icon icon={Glyph} size={22} />
                    </span>
                    <span className={`text-xs font-bold tracking-[0.18em] ${
                      featured ? "text-white/55" : "text-[#87102C]/50"
                    }`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className={`text-xl font-bold tracking-tight sm:text-2xl ${
                      featured ? "text-white" : "text-[#111]"
                    }`}>
                      {card.title}
                    </h3>
                    <p className={`mt-3 text-sm leading-7 sm:text-base ${
                      featured ? "text-white/75" : "text-[#555052]"
                    }`}>
                      {card.body}
                    </p>
                  </div>
                  <div className="mt-auto pt-8">
                    <span className={`block h-px w-10 ${
                      featured ? "bg-white/35" : "bg-[#87102C]/25"
                    }`} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
