import type { PremaritalPageData } from "@/lib/premarital-page";

const glass = "rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6";

/** The curriculum, labelled "proposed" until the pastors approve each module. */
export function Curriculum({ modules }: { modules: PremaritalPageData["modules"] }) {
  if (modules.length === 0) return null;
  return (
    <section aria-labelledby="learn-heading" className="mt-20">
      <h2 id="learn-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">What you will learn</h2>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <li key={m.id} className={glass}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-white">{m.title}</h3>
              {m.approvalState === "PROPOSED" && <span className="flex-shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/70">Proposed</span>}
            </div>
            {m.description && <p className="mt-2 text-sm leading-relaxed text-white/70">{m.description}</p>}
            {m.scriptureRefs.length > 0 && <p className="mt-3 text-xs text-[#FFB3C1]">{m.scriptureRefs.join(", ")}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

const STEPS = [
  { title: "Apply together", body: "Fill in the short form below with your partner's agreement. It takes a few minutes." },
  { title: "The pastors review it", body: "The pastoral team reads your application and contacts you both about next steps." },
  { title: "Meet your counsellor", body: "You are matched with a counsellor from our marriage ministry, who arranges your sessions with you." },
  { title: "Prepare together", body: "Work through the sessions at a pace that suits you both, in person or online." },
  { title: "A final review", body: "Once the sessions are done, the pastors look back over them with you as you prepare for your wedding." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="mt-20 scroll-mt-24">
      <h2 id="how-it-works" className="font-display text-2xl font-bold text-white sm:text-3xl">How it works</h2>
      <ol className="mt-6 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className={`${glass} flex gap-4`}>
            <span aria-hidden="true" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-church-maroon font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/70">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Hidden until the pastors approve who is on the counselling team. */
export function CounsellingTeam({ counsellors }: { counsellors: string | null }) {
  if (!counsellors) return null;
  return (
    <section aria-labelledby="team-heading" className="mt-20">
      <h2 id="team-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">The counselling team</h2>
      <p className={`${glass} mt-6 whitespace-pre-line text-sm leading-relaxed text-white/80`}>{counsellors}</p>
    </section>
  );
}

const FAQ = [
  { q: "Does applying book a session?", a: "Not yet. The pastoral team reviews every application first, then contacts you to arrange your sessions." },
  { q: "We have not set a wedding date. Can we still apply?", a: "Yes. The wedding date is optional, and preparing early is a good thing." },
  { q: "Who sees our application?", a: "Only the pastors, the marriage ministry team and the counsellor assigned to you. Nothing one of you shares is passed to the other without permission." },
  { q: "Does my partner need to fill in a form too?", a: "No. One of you applies for both, with your partner's agreement to be contacted." },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-heading" className="mt-20">
      <h2 id="faq-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">Questions couples ask</h2>
      <div className="mt-6 space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className={`${glass} group`}>
            <summary className="cursor-pointer list-none font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">{f.q}</summary>
            <p className="mt-3 text-sm leading-relaxed text-white/75">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
