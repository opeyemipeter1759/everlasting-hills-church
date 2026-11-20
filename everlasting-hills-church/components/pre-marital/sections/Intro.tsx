import type { PremaritalPageData } from "@/lib/premarital-page";

const glass = "rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6";

/** Hero, then why it matters, then who can apply. */
export function Hero() {
  return (
    <header className="pt-24 text-center sm:pt-32">
      <p className="text-sm font-semibold text-[#FFB3C1]">Pre-marital counselling</p>
      <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">Preparing for a Marriage That Flourishes</h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
        Marriage is more than a wedding ceremony. It is a covenant that deserves spiritual preparation, biblical understanding, and intentional
        commitment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="#apply" className="inline-flex min-h-12 items-center rounded-xl bg-church-maroon px-6 font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          Begin Counselling
        </a>
        <a href="#how-it-works" className="inline-flex min-h-12 items-center rounded-xl border border-white/25 px-6 font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          How It Works
        </a>
      </div>
    </header>
  );
}

const WHY = [
  { title: "Built on God's word", body: "Talk through what Scripture says about marriage, so your home is founded on something that lasts." },
  { title: "Honest conversations", body: "Some of the most important things are easiest to discuss before the wedding: money, family, faith and expectations." },
  { title: "Walked with you", body: "A counsellor from our marriage ministry meets with you both, prays with you and helps you prepare." },
];

export function WhyItMatters() {
  return (
    <section aria-labelledby="why-heading" className="mt-20">
      <h2 id="why-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">Why it matters</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {WHY.map((w) => (
          <div key={w.title} className={glass}>
            <h3 className="font-semibold text-white">{w.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{w.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Only approved policy is shown; until then the page says the pastors will confirm it. */
export function WhoCanApply({ policy }: { policy: PremaritalPageData["policy"] }) {
  const rows = [
    { label: "Who can apply", value: policy.eligibility },
    { label: "How long it runs", value: policy.duration },
    { label: "Cost", value: policy.fees },
  ];
  return (
    <section aria-labelledby="who-heading" className="mt-20">
      <h2 id="who-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">Who can apply</h2>
      <dl className={`${glass} mt-6 divide-y divide-white/10`}>
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[12rem_1fr]">
            <dt className="text-sm font-semibold text-white">{r.label}</dt>
            <dd className="whitespace-pre-line text-sm leading-relaxed text-white/75">{r.value ?? "The pastoral team will confirm this with you when they review your application."}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
