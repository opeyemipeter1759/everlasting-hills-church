import Link from "next/link";
import { Moon, Users, Clock3 } from "lucide-react";
import { PrayerWatchTheme } from "@/components/pray-watch/theme";
import PublicSignupWidget from "@/components/pray-watch/PublicSignupWidget";

export const metadata = {
  title: "Prayer Watch | Everlasting Hills Church",
  description: "Every night, 10pm to 6am, EHC prays together in four two-hour watches. Pick the watch that fits your schedule and meet your watch family there daily.",
};

export default function PrayerWatchPage() {
  return (
    <PrayerWatchTheme>
      <main>
        {/* 1. Hero */}
        <section className="pw-ink relative overflow-hidden pb-20 pt-28 sm:pt-36">
          <div className="pw-sky pw-reveal absolute inset-x-0 top-0 h-2" aria-hidden="true" />
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <p className="pw-reveal text-sm font-semibold text-white/60">Isaiah 62:6-7</p>
            <h1 className="pw-reveal pw-display mt-4 text-[40px] leading-[1.05] sm:text-[56px]">
              A watch kept every night, so the house is never silent.
            </h1>
            <p className="pw-reveal mt-6 max-w-xl text-lg text-white/70">
              From 10pm to 6am, Monday to Saturday, EHC prays together across four two-hour watches. Pick the one
              hour that fits your life, and meet the same family there, every night.
            </p>
            <div className="pw-reveal mt-9 flex flex-wrap gap-3">
              <a href="#signup" className="pw-btn pw-btn-primary">Sign up for a watch</a>
              <a href="#how-it-works" className="pw-btn pw-btn-glass">How it works</a>
            </div>
          </div>
        </section>

        {/* 2. The idea */}
        <section className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="pw-display text-4xl sm:text-5xl">The schedule</h2>
              <span aria-hidden="true" className="mt-6 block h-1 w-14 rounded-full" style={{ background: "var(--color-flame)" }} />
            </div>
            <div className="max-w-[680px] space-y-6 text-lg leading-[1.7] text-black/70">
              <p className="text-xl leading-[1.6] text-[var(--color-ink)] sm:text-2xl">
                The platform runs eight hours a day, 10pm to 6am, Monday to Saturday. We rest on Sundays for church
                service.
              </p>
              <p>
                Those eight hours are broken into four watches of two hours each. You pick the one watch that best
                fits your daily rhythm — that becomes your standing time to pray with your watchmen. Most of us end
                up giving about two hours a day to the house this way.
              </p>
              <p>
                Every sign-up is reviewed before it's confirmed — once an admin approves yours, you'll get the link
                to the Telegram channel where the prayer itself happens, and to your watch family on WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Watch vs Family */}
        <section id="how-it-works" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28" style={{ background: "var(--color-paper-line)" }}>
          <div className="mx-auto max-w-[1100px]">
            <h2 className="pw-display text-4xl sm:text-5xl">Two words, two different things</h2>
            <p className="mt-4 max-w-xl text-black/65">
              People mix these up often enough that it's worth spelling out plainly.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <div className="rounded-[20px] bg-white p-7">
                <Clock3 className="h-6 w-6" style={{ color: "var(--color-flame)" }} aria-hidden="true" />
                <h3 className="pw-display mt-4 text-2xl">A Prayer Watch</h3>
                <p className="mt-2 text-black/65">
                  Simply a time slot — say, 2am to 4am. It's the hour on the clock, nothing more.
                </p>
              </div>
              <div className="rounded-[20px] bg-white p-7">
                <Users className="h-6 w-6" style={{ color: "var(--color-flame)" }} aria-hidden="true" />
                <h3 className="pw-display mt-4 text-2xl">A Watchmen Family</h3>
                <p className="mt-2 text-black/65">
                  The WhatsApp community tied to that time slot — the people who pray it with you nightly, much like
                  a cell group.
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-2xl text-black/65">
              You keep one family as home base, but you're never stuck. Jump into another watch's chain whenever
              your routine shifts for the night — you're always welcome there too.
            </p>
          </div>
        </section>

        {/* 4. Sign up */}
        <section id="signup" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex items-start gap-3">
              <Moon className="mt-1 h-6 w-6 shrink-0" style={{ color: "var(--color-flame)" }} aria-hidden="true" />
              <div>
                <h2 className="pw-display text-4xl sm:text-5xl">Pick your watch</h2>
                <p className="mt-3 max-w-xl text-black/65">
                  No account needed to sign up. If you're signed in already, we'll use your profile details.
                </p>
              </div>
            </div>
            <div className="mt-10">
              <PublicSignupWidget />
            </div>
          </div>
        </section>

        {/* 5. Closing */}
        <section className="pw-ink px-5 py-24 text-center sm:py-32">
          <div className="mx-auto max-w-[700px]">
            <h2 className="pw-display text-4xl sm:text-5xl">The house is never silent.</h2>
            <p className="mt-4 text-white/65">
              Every watch, every night, someone from EHC is before God on behalf of the rest of us.
            </p>
            <a href="#signup" className="pw-btn pw-btn-primary mt-9">Sign up for a watch</a>
            <p className="mt-10 text-sm text-white/45">
              Questions about the platform? <Link href="/contact" className="underline hover:text-white">Reach the church office</Link>.
            </p>
          </div>
        </section>
      </main>
    </PrayerWatchTheme>
  );
}
