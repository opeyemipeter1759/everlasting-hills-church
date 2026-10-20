import Link from "next/link";
import PageHero from "@/components/marketing/PageHero";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "Our Culture — Everlasting Hills Church",
  description:
    "Twelve cultures, anchored in Scripture, that shape the atmosphere of our church family.",
};

interface Culture {
  title: string;
  /** Single scripture reference, e.g. "2 Tim 3:16–17" */
  anchorText: string;
  /** NKJV wording of anchorText */
  verseText: string;
  /** Original-language key term, e.g. "theopneustos" or "oikeios · koinonia" */
  keyTerm?: string;
  /** What the key term means, e.g. "God-breathed" */
  keyTermMeaning?: string;
}
interface CultureContent {
  eyebrow: string;
  title: string;
  accent: string;
  lead: string;
  heroImage: string | null;
  pillars: Culture[];
  cta: { heading: string; body: string };
}

/** Current content — the fallback if the CMS has nothing published (or is down). */
const FALLBACK: CultureContent = {
  eyebrow: "Our Culture",
  title: "12 cultures that shape",
  accent: "who we are",
  lead: "Our culture shapes the atmosphere of our church family. It helps each person grow in God and freely experience the blessings He has given us together.",
  heroImage: null,
  pillars: [
    {
      title: "The Word of God",
      anchorText: "2 Tim 3:16–17",
      verseText:
        "All Scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness, that the man of God may be complete, thoroughly equipped for every good work.",
      keyTerm: "theopneustos",
      keyTermMeaning: "God-breathed",
    },
    {
      title: "Prayer",
      anchorText: "Luke 18:1",
      verseText: "Then He spoke a parable to them, that men always ought to pray and not lose heart,",
      keyTerm: "proskartereo",
      keyTermMeaning: "to continue steadfastly",
    },
    {
      title: "Fasting",
      anchorText: "Matt 6:16–18",
      verseText:
        "Moreover, when you fast, do not be like the hypocrites, with a sad countenance. For they disfigure their faces that they may appear to men to be fasting. Assuredly, I say to you, they have their reward. But you, when you fast, anoint your head and wash your face, so that you do not appear to men to be fasting, but to your Father who is in the secret place; and your Father who sees in secret will reward you openly.",
      keyTerm: "nesteia",
      keyTermMeaning: "fasting",
    },
    {
      title: "Family",
      anchorText: "Eph 2:19",
      verseText:
        "Now, therefore, you are no longer strangers and foreigners, but fellow citizens with the saints and members of the household of God,",
      keyTerm: "oikeios · koinonia",
      keyTermMeaning: "household members · fellowship",
    },
    {
      title: "Honor",
      anchorText: "Rom 12:10",
      verseText: "Be kindly affectionate to one another with brotherly love, in honor giving preference to one another;",
    },
    {
      title: "Service",
      anchorText: "Mark 10:43–45",
      verseText:
        "Yet it shall not be so among you; but whoever desires to become great among you shall be your servant. And whoever of you desires to be first shall be slave of all. For even the Son of Man did not come to be served, but to serve, and to give His life a ransom for many.",
      keyTerm: "diakonia",
      keyTermMeaning: "service, ministry",
    },
    {
      title: "Discipline",
      anchorText: "1 Cor 9:24–27",
      verseText:
        "Do you not know that those who run in a race all run, but one receives the prize? Run in such a way that you may obtain it. And everyone who competes for the prize is temperate in all things. Now they do it to obtain a perishable crown, but we for an imperishable crown. Therefore I run thus: not with uncertainty. Thus I fight: not as one who beats the air. But I discipline my body and bring it into subjection, lest, when I have preached to others, I myself should become disqualified.",
      keyTerm: "gymnazo",
      keyTermMeaning: "to train",
    },
    {
      title: "Positive Confession",
      anchorText: "Heb 10:23",
      verseText: "Let us hold fast the confession of our hope without wavering, for He who promised is faithful.",
      keyTerm: "homologia",
      keyTermMeaning: "saying the same thing",
    },
    {
      title: "The Supernatural",
      anchorText: "1 Cor 2:4–5",
      verseText:
        "And my speech and my preaching were not with persuasive words of human wisdom, but in demonstration of the Spirit and of power, that your faith should not be in the wisdom of men but in the power of God.",
      keyTerm: "dynamis",
      keyTermMeaning: "power",
    },
    {
      title: "Sincerity and Intentionality",
      anchorText: "Phil 1:10",
      verseText: "that you may approve the things that are excellent, that you may be sincere and without offense till the day of Christ,",
      keyTerm: "eilikrines",
      keyTermMeaning: "tested by sunlight",
    },
    {
      title: "Excellence",
      anchorText: "Col 3:23",
      verseText: "And whatever you do, do it heartily, as to the Lord and not to men,",
    },
    {
      title: "Simplicity",
      anchorText: "2 Cor 11:3",
      verseText:
        "But I fear, lest somehow, as the serpent deceived Eve by his craftiness, so your minds may be corrupted from the simplicity that is in Christ.",
      keyTerm: "haplotes",
      keyTermMeaning: "singleness",
    },
  ],
  cta: { heading: "Come and see for yourself", body: "These are not just words on a page. Join us on a Sunday and experience them in a living family." },
};

function isValid(c: unknown): c is CultureContent {
  return Boolean(c && Array.isArray((c as CultureContent).pillars) && (c as CultureContent).pillars.length > 0);
}

export default async function CulturesPage({
  searchParams,
}: {
  searchParams: { preview?: string };
}) {
  const c = await getStructuredContent("about/cultures", { preview: searchParams.preview, fallback: FALLBACK, valid: isValid });

  return (
    <main className="bg-white">
      {searchParams.preview && (
        <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
          PREVIEW — draft, not published
        </div>
      )}
      <PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} lead={c.lead} backgroundImage={c.heroImage} />

      {/* A continuous reading list, not a grid of cards — the subject is Scripture,
          so the page reads like a page of it: one column, hairline breaks between
          entries, numerals set like verse numbers rather than UI badges. */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="lg:columns-2 lg:gap-x-16">
          {c.pillars.map((p, i) => {
            const n = String(i + 1).padStart(2, "0");
            const isFirst = i === 0;
            return (
              <article key={p.title} className="break-inside-avoid-column pb-8 sm:pb-9">
                {!isFirst && <div className="mb-8 border-t border-[#E7CDD3]/70 sm:mb-9" aria-hidden="true" />}
                <div className="flex items-start gap-4 sm:gap-6">
                  <span
                    aria-hidden="true"
                    className="select-none font-serif text-3xl font-normal leading-[0.8] text-[#87102C]/15 sm:text-4xl"
                  >
                    {n}
                  </span>
                  <div className="min-w-0 flex-1 pt-1 sm:pt-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h2 className="font-display text-lg font-bold tracking-tight text-[#1A1210] sm:text-xl">
                        {p.title}
                      </h2>
                      <span className="font-sans text-sm text-[#6B625D]">{p.anchorText}</span>
                    </div>

                    <p className="mt-2.5 font-serif text-[15px] italic leading-relaxed text-[#1A1210]/80 sm:text-base">
                      &ldquo;{p.verseText}&rdquo;
                    </p>

                    {p.keyTerm && (
                      <p className="mt-3 font-serif text-sm italic text-[#9C7A3C]">
                        {p.keyTerm}
                        <span className="font-sans not-italic text-[#6B625D]"> — {p.keyTermMeaning}</span>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        </div>
      </section>

      <section className="bg-church-dark py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-4 xs:px-5 sm:px-8">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{c.cta.heading}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55">{c.cta.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/visit" className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]">Plan a Visit</Link>
            <Link href="/about" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5">About Us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
