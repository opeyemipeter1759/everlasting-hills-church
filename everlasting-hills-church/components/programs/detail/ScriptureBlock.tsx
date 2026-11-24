import type { Scripture } from "@/lib/programs";
import { BRAND, SERIF } from "../accents";

/** The emotional centre of a program's page: its scripture in full, with the translation named. */
export function ScriptureBlock({ scriptures }: { scriptures: Scripture[] }) {
  const withText = scriptures.filter((s) => s.text);
  if (!withText.length) return null;
  const [first, ...rest] = withText;
  return (
    <section aria-label="Scripture" className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: `radial-gradient(70% 60% at 50% 40%, ${BRAND.deepBurgundy}cc, transparent 70%)` }}
      />
      <div className="relative mx-auto max-w-3xl">
        <figure>
          {/* A long passage (Malachi 3:1-3) steps down a size so it stays readable on a phone. */}
          <blockquote className={`${SERIF} text-white ${(first.text ?? "").length > 260 ? "text-[22px] leading-[1.5] sm:text-[30px]" : "text-[28px] leading-[1.4] sm:text-[38px]"}`}>{first.text}</blockquote>
          <figcaption className="mt-6 text-[15px] tracking-wide" style={{ color: BRAND.gold }}>
            {first.reference}
            {first.translation && <span className="text-white/50">, {first.translation}</span>}
          </figcaption>
        </figure>
        {rest.length > 0 && (
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {rest.map((s) => (
              <figure key={s.reference} className="border-l pl-5" style={{ borderColor: `${BRAND.gold}55` }}>
                <blockquote className={`${SERIF} text-[19px] leading-[1.55] text-white/85`}>{s.text}</blockquote>
                <figcaption className="mt-3 text-[13px]" style={{ color: BRAND.gold }}>
                  {s.reference}
                  {s.translation && <span className="text-white/50">, {s.translation}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
