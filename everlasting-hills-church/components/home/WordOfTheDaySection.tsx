import WordOfTheDayCard from "@/components/sermon-digest/WordOfTheDayCard";

/** Homepage home for the Word of the Day drawn from the latest sermon. */
export default function WordOfTheDaySection() {
  return (
    <section
      id="word-of-the-day"
      aria-labelledby="word-of-the-day-heading"
      className="bg-[#fff8f4] pb-16 text-[#211317] sm:pb-20 dark:bg-[#12090d] dark:text-white"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
        <div className="pt-2">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#87102C] dark:text-[#f5d49a]">From the pulpit</p>
          <h2 id="word-of-the-day-heading" className="mt-4 max-w-lg font-display text-3xl font-bold leading-tight sm:text-4xl">
            One word from our latest sermon, to carry all week.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#6d565b] dark:text-white/60">
            Taken from what was preached at our most recent Sunday or Wednesday service, with the verse behind it and a
            link straight to the sermon.
          </p>
        </div>

        <WordOfTheDayCard />
      </div>
    </section>
  );
}
