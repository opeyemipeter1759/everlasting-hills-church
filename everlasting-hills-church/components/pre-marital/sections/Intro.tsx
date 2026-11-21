const glass = "rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6";

/** Hero, then why it matters. */
export function Hero() {
  return (
    <header className="pt-24 text-center sm:pt-32">
      <p className="text-sm font-semibold text-[#FFB3C1]">
        Pre-marital counselling
      </p>
      <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
        Preparing for a Marriage That Flourishes
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
        Marriage is more than a wedding ceremony. It is a covenant that deserves
        spiritual preparation, biblical understanding, and intentional
        commitment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="#apply"
          className="inline-flex min-h-12 items-center rounded-xl bg-church-maroon px-6 font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Begin Counselling
        </a>
      </div>
    </header>
  );
}

const WHY = ["Built on God's word", "Honest conversations", "Walked with you"];

export function WhyItMatters() {
  return (
    <section aria-labelledby="why-heading" className="mt-20">
      <h2
        id="why-heading"
        className="font-display text-2xl font-bold text-white sm:text-3xl"
      >
        Why it matters
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {WHY.map((w) => (
          <li key={w} className={`${glass} font-semibold text-white`}>
            {w}
          </li>
        ))}
      </ul>
    </section>
  );
}
