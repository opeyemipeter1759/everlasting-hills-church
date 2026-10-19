import Link from "next/link";
import { cookies } from "next/headers";
import { Check, MapPin, Clock, Users, BookOpen } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-constants";
import { ClassTheme, EmphasisHeading } from "@/components/classes/theme";
import { CLASS_PATHWAY, MEMBERSHIP_WEEKS } from "@/components/classes/membership-content";
import CurriculumTabs from "@/components/classes/CurriculumTabs";

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
  "A solid understanding of the core truths we stand on",
  "Our house cultures, and how they deepen your walk with God",
  "A Home Cell to belong to, and a church family to grow with",
  "Your next step in growth and service, and your place in the house",
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
        <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <EmphasisHeading before="Welcome" emphasis="home." className="text-5xl sm:text-6xl lg:text-7xl text-[var(--color-ink)]" />
            <span aria-hidden="true" className="mt-6 block h-1 w-14 rounded-full bg-[var(--color-burgundy)]" />
          </div>
          <div className="max-w-[680px] space-y-6 text-lg leading-[1.7] text-black/70">
            <p className="text-xl leading-[1.6] text-[var(--color-ink)] sm:text-2xl">
              If you’ve been worshipping with us for a few weeks, you already have a feel for who we are. The Membership
              Class is where attending EHC becomes belonging to EHC.
            </p>
            <p>
              Over four weeks, we’ll walk you through our story, what we believe, how we live as a family, and how you can
              take your place in the house. There’s no exam at the end. The goal is for you to be planted here.
            </p>
            <p className="cls-display border-l-2 border-[var(--color-burgundy)] pl-5 text-2xl italic !leading-[1.3] text-[var(--color-burgundy)] sm:text-[28px]">
              By the end, we pray you’ll know EHC well, and know that you have a place here that nobody else can fill.
            </p>
          </div>
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

      {/* 4. What you’ll gain */}
      <section className="bg-[var(--color-blush)] px-4 py-20 sm:py-28 text-[var(--color-ink)]">
        <div className="mx-auto max-w-[1200px]">
          <EmphasisHeading before="What you’ll" emphasis="gain" className="text-5xl sm:text-6xl" />
          <ul className="mt-12 border-t border-[var(--color-pink-border)]">
            {GAINS.map((g) => (
              <li key={g} className="flex items-start gap-5 border-b border-[var(--color-pink-border)] py-6 sm:gap-7 sm:py-8">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-1.5 h-6 w-6 flex-none text-[var(--color-burgundy)] sm:mt-2 sm:h-7 sm:w-7" fill="none">
                  <path d="M3 21V12a9 9 0 0 1 18 0v9Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 21v-8a4 4 0 0 1 8 0v8Z" fill="currentColor" />
                </svg>
                <p className="cls-display max-w-[52ch] text-2xl !leading-[1.25] sm:text-[32px]">{g}</p>
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
        <div className="mx-auto max-w-[1200px]">
          <EmphasisHeading before="The" emphasis="curriculum" className="text-5xl sm:text-6xl" />
          <p className="mt-4 max-w-xl text-lg text-black/65">Four weeks, five lessons each. Pick a week to see what you will cover.</p>
          <div className="mt-10">
            <CurriculumTabs />
          </div>
        </div>
      </section>

      {/* 7. How it works */}
      <section id="how-it-works" className="bg-white px-4 py-20 sm:py-28 text-[var(--color-ink)]">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div>
            <EmphasisHeading before="How it" emphasis="works" className="text-5xl sm:text-6xl" />
            <span aria-hidden="true" className="mt-6 block h-1 w-14 rounded-full bg-[var(--color-burgundy)]" />
          </div>
          <dl className="divide-y divide-[var(--color-pink-border)] overflow-hidden rounded-[24px] border border-[var(--color-pink-border)]">
            <div className="grid gap-2 px-6 py-7 sm:grid-cols-[9rem_1fr] sm:gap-8 sm:px-8">
              <dt className="cls-display text-2xl text-[var(--color-burgundy)]">Format</dt>
              <dd className="text-lg leading-relaxed text-black/70">
                Each week, a recorded class video is posted on your member dashboard. Watch it to the end and write a
                short summary of what you learnt. Then join us for a 45-minute session after the Sunday service.
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-7 sm:grid-cols-[9rem_1fr] sm:gap-8 sm:px-8">
              <dt className="cls-display text-2xl text-[var(--color-burgundy)]">Duration</dt>
              <dd>
                <p className="text-lg leading-relaxed text-black/70">Four weeks, recurring.</p>
                <div aria-hidden="true" className="mt-4 grid max-w-sm grid-cols-4 gap-2">
                  {MEMBERSHIP_WEEKS.map((w) => (
                    <span key={w.number} className="rounded-full bg-[var(--color-chip)] py-1.5 text-center text-xs font-semibold tabular-nums text-[var(--color-burgundy)]">
                      Week {w.number}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-7 sm:grid-cols-[9rem_1fr] sm:gap-8 sm:px-8">
              <dt className="cls-display text-2xl text-[var(--color-burgundy)]">Completion</dt>
              <dd className="text-lg leading-relaxed text-black/70">
                Watch all the videos, submit your summaries and attend the sessions to be recognised as a member of EHC.
              </dd>
            </div>
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
