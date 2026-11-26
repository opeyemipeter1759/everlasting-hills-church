import type { PicnicContent } from "./picnic-content";

/**
 * The hangout strip under the hero: the afternoon's good things drifting past
 * on a green band, like a banner strung between two trees. Words come from the
 * CMS (Picnic → Hangout strip). Holds still for people who ask for less motion.
 */
export default function PicnicVibes({ c }: { c: PicnicContent }) {
  const words = (c.vibes ?? []).map((w) => w.trim()).filter(Boolean);
  if (words.length === 0) return null;
  // Two identical runs side by side: sliding by exactly one run loops without a seam.
  const run = (hidden: boolean) => (
    <ul className="flex flex-shrink-0 items-center" aria-hidden={hidden || undefined}>
      {words.map((word, i) => (
        <li key={i} className="flex items-center whitespace-nowrap">
          <span className="px-5 font-serif text-xl text-[#F7F0E3] sm:px-7 sm:text-2xl">{word}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#F7F0E3]/40" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="What the afternoon is about" className="relative overflow-hidden bg-[#1E3A2A] py-5 sm:py-6">
      <div className="picnic-drift flex w-max">
        {run(false)}
        {run(true)}
      </div>
    </section>
  );
}
