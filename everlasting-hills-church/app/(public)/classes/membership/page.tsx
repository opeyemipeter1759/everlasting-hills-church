import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronDown, Check, Sparkles, MapPin, Clock, Users, BookOpen } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-constants";
import { ClassTheme, EmphasisHeading } from "@/components/classes/theme";
import { CLASS_PATHWAY, MEMBERSHIP_WEEKS } from "@/components/classes/membership-content";

export const metadata = {
  title: "Membership Class | Everlasting Hills Church",
  description: "A four-week journey into the life, faith and family of Everlasting Hills Church. Belong. Believe. Walk. Go.",
};

export const dynamic = "force-dynamic";

const PORTAL = "/dashboard/classes/membership";

interface ClassStatus {
  eligibility: { required: number; attended: number; eligible: boolean; remaining: number };
  canEnroll: boolean;
  enrollment: { status: "WAITING" | "ACTIVE" | "COMPLETED"; progressPct: number; currentWeek: number; next: { week: number; slug: string } | null } | null;
}

/** The signed-in visitor's place in the class, or null for everyone else. Display only. */
async function loadStatus(): Promise<ClassStatus | null> {
  if (!cookies().get(ACCESS_TOKEN_COOKIE)?.value) return null;
  try {
    return await serverApi.get<ClassStatus>("/classes/membership/status");
  } catch {
    return null;
  }
}

function primaryAction(status: ClassStatus | null) {
  if (!status) return { href: `/login?next=${encodeURIComponent(PORTAL)}`, label: "Start the Class" };
  const e = status.enrollment;
  if (e?.status === "COMPLETED") return { href: `${PORTAL}/certificate`, label: "See your certificate" };
  if (e?.status === "ACTIVE" && e.next) return { href: `${PORTAL}/${e.next.week}/${e.next.slug}`, label: "Continue" };
  if (e) return { href: PORTAL, label: "Open the class" };
  return { href: PORTAL, label: "Start the Class" };
}

const GAINS = [
  "A clear picture of who EHC is and where we are going",
  "A firm grasp of the core truths we stand on",
  "Practical habits for your walk with God",
  "Real connection through a Home Cell and the church family",
  "A clear next step for your growth and service",
];

const FAQS: [string, string][] = [
  [
    "Do I have to complete the class to become a member?",
    "Yes. The class is how we welcome people into membership. When you finish it, a pastor confirms your membership with you.",
  ],
  [
    "What if I miss a session?",
    "You can catch up through the online lesson, and your facilitator will help you make up the in-person session with the next group.",
  ],
  ["Is there a cost?", "No. The Membership Class is free."],
  [
    "I'm not sure I'm saved. Is this class for me?",
    "You're welcome to join. We may also guide you to the Believers Class.",
  ],
  ["How long does each session take?", "About an hour, with each online lesson taking 10 to 15 minutes."],
  [
    "I filled the first-timer form. How do I get my login?",
    "Once you fill the first-timer form, the church office creates your account and emails you how to sign in. If it has not arrived, speak to a welcome team member on Sunday.",
  ],
];

export default async function MembershipClassPage() {
  const status = await loadStatus();
  const action = primaryAction(status);
  const el = status?.eligibility;

  return (
    <ClassTheme>
      {/* 1. Hero */}
      <section className="cls-glow cls-on-ink relative overflow-hidden px-4 pb-20 pt-28 sm:pt-36">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="cls-reveal">
            <p className="cls-eyebrow text-[var(--color-gold)]">Membership Class</p>
            <h1 className="cls-display mt-4 text-[44px] sm:text-[64px] lg:text-[80px] leading-[0.95]">
              Belong. Believe. Walk. <em className="cls-em">Go.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg sm:text-xl text-white/65">
              A four-week journey into the life, faith and family of Everlasting Hills Church.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={action.href} className="cls-btn cls-btn-primary">
                {action.label}
              </Link>
              <a href="#eligibility" className="cls-btn cls-btn-glass">
                Check Eligibility
              </a>
            </div>
            <p className="mt-8 text-sm cls-scripture">Genesis 49:26</p>
          </div>
          <div className="cls-glass rounded-[20px] p-6 sm:p-8 cls-reveal">
            {status?.enrollment ? (
              <>
                <p className="cls-eyebrow text-white/60">Week {status.enrollment.currentWeek} of 4</p>
                <p className="cls-display mt-2 text-5xl">{status.enrollment.progressPct}%</p>
                <div className="cls-bar mt-4" aria-hidden>
                  <span style={{ width: `${status.enrollment.progressPct}%` }} />
                </div>
                <p className="mt-4 text-sm text-white/65">
                  {status.enrollment.status === "WAITING"
                    ? "You are registered. Your class opens once you have attended four Sundays."
                    : status.enrollment.status === "COMPLETED"
                      ? "You have finished the class."
                      : "Pick up where you left off."}
                </p>
              </>
            ) : (
              <ol className="space-y-4">
                {MEMBERSHIP_WEEKS.map((w) => (
                  <li key={w.number} className="flex items-center gap-4">
                    <span className="cls-display text-3xl text-[var(--color-gold)] w-8">{w.number}</span>
                    <span>
                      <span className="block font-semibold">{w.stage}</span>
                      <span className="block text-sm text-white/60">{w.focus}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      {/* 2. Introduction */}
      <section className="bg-white px-4 py-20 sm:py-28 text-[var(--color-ink)]">
        <div className="mx-auto max-w-[680px] space-y-5 text-lg leading-relaxed text-black/70">
          <EmphasisHeading before="Welcome" emphasis="home." className="text-4xl sm:text-5xl text-[var(--color-ink)]" />
          <p>
            If you have been worshipping with us for a few weeks, you have already felt something of who we are. The
            Membership Class is where you go from attending EHC to belonging to EHC.
          </p>
          <p>
            Over four weeks, we will walk you through our story, what we believe, how we live as a family, and how you
            can take your place in the house. This is not a course to pass. It is an invitation to be planted.
          </p>
          <p>Our prayer is that by the end, you will not only know EHC, but know that you are a vital part of it.</p>
        </div>
      </section>

      {/* 3. Who this class is for, with eligibility */}
      <section id="eligibility" className="scroll-mt-24 bg-white px-4 pb-20 sm:pb-28 text-[var(--color-ink)]">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2">
          <div>
            <EmphasisHeading before="Who this class is" emphasis="for" className="text-4xl sm:text-5xl" />
            <ul className="mt-8 space-y-4 text-lg text-black/70">
              {[
                <>You have attended EHC services for <strong className="text-[var(--color-ink)]">at least 4 weeks</strong></>,
                <>You want to make EHC your church home</>,
                <>You want to understand what we believe and how we do life together</>,
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <Check className="mt-1 h-5 w-5 flex-none text-[var(--color-burgundy)]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[20px] border border-[var(--color-pink-border)] bg-[var(--color-blush)] p-6 sm:p-8">
            <p className="cls-eyebrow text-[var(--color-burgundy)]">Your eligibility</p>
            {el ? (
              <>
                <p className="cls-display mt-3 text-3xl">
                  {el.eligible ? "You're eligible: start now." : `Keep attending: ${el.attended} of ${el.required} weeks complete.`}
                </p>
                <div className="cls-bar mt-5" aria-hidden>
                  <span style={{ width: `${el.required ? Math.min(100, (el.attended / el.required) * 100) : 100}%` }} />
                </div>
                <p className="mt-4 text-black/60">
                  {el.eligible
                    ? "Your attendance shows you are ready. Register and we will place you in the current cohort."
                    : "You can register now. We will place you in the next cohort that starts after your fourth Sunday."}
                </p>
              </>
            ) : (
              <>
                <p className="cls-display mt-3 text-3xl">Sign in to see where you are.</p>
                <p className="mt-4 text-black/60">
                  We count the Sunday services you have checked in to. Sign in with the account the church office created
                  for you after your first-timer form.
                </p>
              </>
            )}
            <Link href={action.href} className="cls-btn cls-btn-primary mt-6">
              {el ? action.label : "Sign in to check"}
            </Link>
          </div>
        </div>
      </section>

      {/* 4. What you'll gain */}
      <section className="bg-[var(--color-blush)] px-4 py-20 sm:py-28 text-[var(--color-ink)]">
        <div className="mx-auto max-w-[1200px]">
          <EmphasisHeading before="What you'll" emphasis="gain" className="text-4xl sm:text-5xl" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GAINS.map((g) => (
              <li key={g} className="rounded-[20px] border border-[var(--color-pink-border)] bg-white p-6 text-lg">
                <Sparkles className="mb-3 h-5 w-5 text-[var(--color-burgundy)]" aria-hidden />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. The journey */}
      <section className="cls-ink cls-on-ink px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px]">
          <EmphasisHeading before="The" emphasis="journey" className="text-4xl sm:text-5xl" />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MEMBERSHIP_WEEKS.map((w) => (
              <li key={w.number} className="cls-glass rounded-[20px] p-6">
                <p className="cls-eyebrow text-white/50">Week {w.number}</p>
                <p className="cls-display mt-2 text-4xl text-[var(--color-gold)]">{w.stage}</p>
                <p className="mt-2 text-white/65">{w.focus}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. Curriculum */}
      <section className="bg-[var(--color-blush)] px-4 py-20 sm:py-28 text-[var(--color-ink)]">
        <div className="mx-auto max-w-[800px]">
          <EmphasisHeading before="The" emphasis="curriculum" className="text-4xl sm:text-5xl" />
          <div className="mt-10 space-y-4">
            {MEMBERSHIP_WEEKS.map((w) => (
              <details key={w.number} className="group rounded-[16px] border border-[var(--color-pink-border)] bg-white p-6" open={w.number === 1}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="cls-eyebrow text-[var(--color-crimson)]">Week {w.number}</span>
                    <span className="cls-display mt-1 block text-[28px] sm:text-[32px]">{w.title}</span>
                    <span className="mt-1 block italic text-black/60">{w.subtitle}</span>
                    <span className="cls-chip mt-3">{w.lessons.length} lessons</span>
                  </span>
                  <ChevronDown className="mt-2 h-5 w-5 flex-none transition-transform duration-[400ms] group-open:rotate-180" aria-hidden />
                </summary>
                <ol className="mt-6 divide-y divide-[var(--color-pink-border)]">
                  {w.lessons.map(([title, desc], i) => (
                    <li key={title} className="flex gap-4 py-4">
                      <span className="cls-display w-6 flex-none text-xl text-[var(--color-crimson)]">{i + 1}</span>
                      <span>
                        <span className="block font-semibold">{title}</span>
                        <span className="block text-black/60">{desc}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How it works */}
      <section className="bg-white px-4 py-20 sm:py-28 text-[var(--color-ink)]">
        <div className="mx-auto max-w-[1200px]">
          <EmphasisHeading before="How it" emphasis="works" className="text-4xl sm:text-5xl" />
          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              [MapPin, "Format", "Weekly in-person sessions, with online lessons to watch before or after each one."],
              [Clock, "Duration", "4 weeks, after the Sunday service. Your facilitator confirms the time for your cohort."],
              [BookOpen, "Each lesson includes", "A short video, key scriptures, a summary, a reflection question, a short quiz and one action step."],
              [Users, "Cohorts", "New classes begin every month."],
              [Check, "Completion", "Finish all lessons and attend the sessions to be recognised as a member of EHC."],
            ].map(([Icon, term, desc]) => {
              const I = Icon as typeof MapPin;
              return (
                <div key={term as string} className="flex gap-4">
                  <I className="mt-1 h-5 w-5 flex-none text-[var(--color-burgundy)]" aria-hidden />
                  <div>
                    <dt className="font-semibold">{term as string}</dt>
                    <dd className="mt-1 text-black/65">{desc as string}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* 8. Growth journey */}
      <section className="bg-white px-4 pb-20 sm:pb-28 text-[var(--color-ink)]">
        <div className="mx-auto max-w-[1200px]">
          <EmphasisHeading before="Your growth journey at" emphasis="EHC" className="text-4xl sm:text-5xl" />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CLASS_PATHWAY.map((c, i) => {
              const here = "here" in c && c.here;
              return (
                <li
                  key={c.title}
                  className={`rounded-[20px] p-6 ${here ? "bg-[var(--color-ink)] text-white ring-2 ring-[var(--color-gold)]" : "border border-[var(--color-pink-border)]"}`}
                >
                  <p className={`cls-eyebrow ${here ? "text-[var(--color-gold)]" : "text-black/40"}`}>{here ? "You are here" : `Step ${i + 1}`}</p>
                  <p className="cls-display mt-2 text-2xl">{c.title}</p>
                  <p className={`mt-2 ${here ? "text-white/65" : "text-black/60"}`}>{c.line}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 9. Facilitators */}
      <section className="bg-[var(--color-blush)] px-4 py-20 sm:py-28 text-[var(--color-ink)]">
        <div className="mx-auto max-w-[800px] text-center">
          <EmphasisHeading before="Meet your" emphasis="facilitators" className="text-4xl sm:text-5xl" />
          <p className="mt-6 text-lg text-black/65">
            Each cohort is led by EHC pastors and trained leaders who know the house and love its people. You will meet
            yours at the first session, and they will walk with you through all four weeks.
          </p>
        </div>
      </section>

      {/* 10. FAQs */}
      <section className="bg-white px-4 py-20 sm:py-28 text-[var(--color-ink)]">
        <div className="mx-auto max-w-[800px]">
          <EmphasisHeading before="Questions," emphasis="answered" className="text-4xl sm:text-5xl" />
          <div className="mt-10 divide-y divide-[var(--color-pink-border)] border-y border-[var(--color-pink-border)]">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="h-5 w-5 flex-none transition-transform duration-[400ms] group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 text-black/65">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Closing call */}
      <section className="cls-glow cls-on-ink px-4 py-24 sm:py-32 text-center">
        <div className="mx-auto max-w-[800px]">
          <EmphasisHeading before="Your place in the house is" emphasis="waiting." className="text-4xl sm:text-6xl" />
          <Link href={action.href} className="cls-btn cls-btn-primary mt-10">
            {status?.enrollment ? action.label : "Start the Membership Class"}
          </Link>
          <p className="mt-8 italic text-white/60">Planted by God, Preserved in Prayer.</p>
        </div>
      </section>
    </ClassTheme>
  );
}
