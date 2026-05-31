import ScrollReveal from "@/components/home/ScrollReveal";
import { HEAVEN_ON_EARTH } from "./event-constants";

/**
 * Personal invitation section — a warm, hand-written-style letter from the senior
 * pastor. Light section (white bg) following the design system's alternating rhythm
 * after the dark hero.
 *
 * Pattern: Centered Hero + Elevated Card. Serif italic accent for the headline.
 * The "letter" is set in a slightly wider, more serif-leaning body to read like
 * personal correspondence rather than marketing copy.
 */
export default function InvitationLetter() {
  return (
    <section
      id="invitation"
      className="py-24 md:py-32 bg-white relative overflow-hidden"
    >
      {/* Soft top fade so the dark hero transitions cleanly */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#FFF4F6]/50 to-transparent pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8">
        <ScrollReveal>
          <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3 text-center">
            A Personal Letter
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance text-center">
            You Are{" "}
            <span className="text-[#87102C] font-serif italic">
              Personally Invited
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          {/*
            Elevated card with subtle paper-like texture — the "letter".
            Generous padding and serif-leaning body text mark this as different from
            standard marketing copy; readers should feel they're reading something
            written to them, not at them.
          */}
          <article className="relative mt-12 rounded-3xl bg-white border border-[#E7CDD3]/60 shadow-[0_24px_80px_-20px_rgba(135,16,44,0.18)] p-8 sm:p-12 md:p-16">
            {/* Decorative top corner accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#FFE8ED] border border-[#E7CDD3] flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#87102C]"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>

            <div className="text-[#3a3a3a] text-base sm:text-lg leading-[1.85] font-light space-y-5 font-serif">
              <p className="text-[#87102C] not-italic font-sans font-semibold tracking-wide">
                Dear friend,
              </p>

              <p>
                There are gatherings we attend, and then there are gatherings
                that mark us — moments where the distance between heaven and
                earth feels suddenly small, and we leave more aware of God than
                when we arrived.
              </p>

              <p>
                We&apos;re putting one of those together. We&apos;ve named it{" "}
                <em className="not-italic font-semibold text-[#87102C]">
                  Heaven on Earth
                </em>
                , and it is exactly what it sounds like: a deliberate weekend
                where we make room for the King to come and the kingdom to
                show.
              </p>

              <p>
                Come hungry. Bring a friend. Make space on your calendar for
                worship that holds nothing back, teaching that goes deep, and
                hours among the family that remind you why you were saved in
                the first place.
              </p>

              <p>
                Whether you&apos;ve been with us for years or you&apos;re
                meeting Everlasting Hills for the first time — there is a seat
                with your name on it.
              </p>

              <p className="text-[#111] not-italic font-sans font-semibold pt-2">
                See you there.
              </p>
            </div>

            {/* Signature block */}
            <div className="mt-10 pt-8 border-t border-[#E7CDD3]/60 flex items-end justify-between gap-4 flex-wrap">
              <div>
                {/* Hand-written-style name */}
                <p className="text-2xl sm:text-3xl text-[#87102C] font-serif italic mb-1">
                  {HEAVEN_ON_EARTH.pastor.name.split(" ").slice(0, 2).join(" ")}
                </p>
                <p className="text-sm font-bold text-[#111]">
                  {HEAVEN_ON_EARTH.pastor.name}
                </p>
                <p className="text-xs text-[#888] mt-0.5">
                  {HEAVEN_ON_EARTH.pastor.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#888] font-semibold mb-1">
                  RSVP by
                </p>
                <p className="text-sm font-bold text-[#111]">
                  {HEAVEN_ON_EARTH.dateDisplay.replace(/, \d{4}/, "")}
                </p>
              </div>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  );
}
