import DailyScriptureCard from "@/components/dashboard/member/member-home/DailyScriptureCard";

/** Public home for the same daily scripture and sharing tools members receive. */
export default function PublicDailyScriptureSection() {
  return (
    <section
      id="daily-scripture-today"
      aria-labelledby="public-daily-scripture-title"
      className="relative overflow-hidden bg-[#fff8f4] py-16 text-[#211317] sm:py-20 dark:bg-[#12090d] dark:text-white"
    >
      <div
        aria-hidden="true"
        className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#87102C]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#f5d49a]/30 blur-3xl dark:bg-[#87102C]/15"
      />

      <div className="relative mx-auto grid max-w-6xl items-start gap-8 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
        <div className="pt-2 lg:sticky lg:top-28">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#87102C] dark:text-[#f5d49a]">
            A word for today
          </p>
          <h2
            id="public-daily-scripture-title"
            className="mt-4 max-w-lg font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
          >
            Read it. Carry it. Share hope with someone.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#6d565b] dark:text-white/60">
            Today&apos;s scripture is available to everyone. Choose your Bible
            version, copy the text, or create a ready-to-share image for your
            WhatsApp status.
          </p>
        </div>

        <DailyScriptureCard />
      </div>
    </section>
  );
}
