import { notFound } from "next/navigation";
import Link from "next/link";
import { Crown, Heart, Zap, Users, ArrowLeft, ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import type { Metadata } from "next";
import { getStructuredContent } from "@/lib/cms-page";

/** CMS-editable text fields for a ministry detail page (icon + image stay fixed). */
interface MinistryDetailContent {
  name: string;
  heroLabel: string;
  heroHeadline: string;
  heroAccent: string;
  heroBody: string;
  overview: string;
  pullQuote: string;
  verseRef: string;
  verseText: string;
  activities: { num: string; title: string; body: string }[];
  who: string;
  close: string;
}

function isValidDetail(c: unknown): c is MinistryDetailContent {
  const v = c as MinistryDetailContent;
  return Boolean(v && v.heroHeadline && Array.isArray(v.activities) && v.activities.length > 0);
}

// ── Ministry content ───────────────────────────────────────────────────────────

const MINISTRIES = {
  mens: {
    icon: Crown,
    name: "Men's Ministry",
    heroImage: "/images/church_congregation_3_1779193624434.png",
    heroLabel: "Brotherhood",
    heroHeadline: "Iron sharpens iron.",
    heroAccent: "Show up and be sharpened.",
    heroBody:
      "A community of men forged in honesty, accountability, and the word of God. No performance. No pretence. Just brothers walking together.",
    overview:
      "The Men's Ministry exists to build men of God who lead with integrity — in their homes, their work, and their community. We believe men don't grow alone. They grow in rooms where honesty is allowed, where scripture is taken seriously, and where no one has to pretend they have it all together.",
    pullQuote: "You were never meant to carry it alone.",
    verseRef: "Proverbs 27:17",
    verseText: "Iron sharpens iron, and one man sharpens another.",
    activities: [
      {
        num: "01",
        title: "Prayer Breakfast",
        body: "Every month, before the city wakes up, brothers gather to pray, eat, and speak life over each other. The kind of conversation most men never have — and can't stop having once they do.",
      },
      {
        num: "02",
        title: "Bible Study",
        body: "We read scripture the way iron reads iron — honestly, without softening the edges. Real questions. Real answers. Men who actually want to understand what God is saying.",
      },
      {
        num: "03",
        title: "Mentorship",
        body: "Seasoned men pour into younger ones. Not lectures. Just life shared across a table — wisdom that only comes from someone who has walked the road ahead of you.",
      },
      {
        num: "04",
        title: "Annual Retreat",
        body: "One weekend. No distractions. Just you, God, and the men He has placed beside you. Men come in carrying weight. They leave different.",
      },
    ],
    who: "Adult men (20 and above) who want to grow in faith, take their calling seriously, and walk with other men doing the same.",
    close: "Every man needs a circle. This is yours.",
  },
  womens: {
    icon: Heart,
    name: "Women's Ministry",
    heroImage: "/images/church_congregation_2_1779193607195.png",
    heroLabel: "Sisterhood",
    heroHeadline: "Clothed with strength.",
    heroAccent: "Walk in who you already are.",
    heroBody:
      "A sisterhood where every woman — regardless of where she is in life — finds belonging, truth, and the courage to walk in her God-given identity.",
    overview:
      "The Women's Ministry is a community where women are celebrated, equipped, and deeply rooted in God's word. We gather to build one another up in truth and prayer — through seasons of joy and seasons of hardship — as women who know whose they are.",
    pullQuote: "You were made for more than survival.",
    verseRef: "Proverbs 31:25",
    verseText:
      "She is clothed with strength and dignity; she can laugh at the days to come.",
    activities: [
      {
        num: "01",
        title: "Women's Fellowship",
        body: "Regular gatherings centred on worship, the word, and the kind of honest conversation that leaves you feeling truly seen and known.",
      },
      {
        num: "02",
        title: "Prayer Circles",
        body: "Intimate prayer groups that go deep — believing God together for the things that feel too heavy to carry alone.",
      },
      {
        num: "03",
        title: "Skill Development",
        body: "Workshops that equip women in family, career, finances, and personal growth — because God is Lord over all of it.",
      },
      {
        num: "04",
        title: "Annual Conference",
        body: "A highlight of the year. Powerful speakers, worship, and encounters that stay with you long after you go home.",
      },
    ],
    who: "All women of the church — single, married, young, or seasoned — who desire to grow in who God made them to be.",
    close: "You belong here exactly as you are.",
  },
  teens: {
    icon: Zap,
    name: "Teen's Ministry",
    heroImage: "/images/church_congregation_4_1779193639860.png",
    heroLabel: "The Next Generation",
    heroHeadline: "Don't let anyone look down on you.",
    heroAccent: "Own your faith. Now.",
    heroBody:
      "A movement for the next generation — where teenagers encounter God, own their faith, and discover who He made them to be.",
    overview:
      "Teen's Ministry is a movement — not just a service. We exist to help teenagers encounter God in a real and personal way, to walk boldly in who He made them, and to build friendships that outlast high school. This generation doesn't need to wait to do something great for God.",
    pullQuote: "Your faith is not a smaller version of someone else's.",
    verseRef: "1 Timothy 4:12",
    verseText:
      "Don't let anyone look down on you because you are young, but set an example in speech, in conduct, in love, in faith and in purity.",
    activities: [
      {
        num: "01",
        title: "Weekly Youth Services",
        body: "Energetic, Spirit-filled services built for how teens worship. You'll feel it from the moment you walk in.",
      },
      {
        num: "02",
        title: "Teen Bible Study",
        body: "Real conversations about faith, identity, purpose, and the world you actually live in — no sanitised answers, no filler.",
      },
      {
        num: "03",
        title: "Annual Youth Camp",
        body: "Days away from school and screens, into God's presence, deep conversations, and friendships you'll carry for life.",
      },
      {
        num: "04",
        title: "Community Outreach",
        body: "Teens serving beyond church walls — learning early that a life of faith was never meant to stay inside a building.",
      },
    ],
    who: "Young people between the ages of 13 and 19 who are ready to own their faith and find their people.",
    close: "You are not the next generation. You are this generation.",
  },
  couples: {
    icon: Users,
    name: "Couple's Ministry",
    heroImage: "/images/church_congregation_1_1779193592146.png",
    heroLabel: "Marriage",
    heroHeadline: "Two are better than one.",
    heroAccent: "A great marriage is built, not found.",
    heroBody:
      "Strengthening marriages through the word, honest conversation, and intentional moments that remind couples why they chose each other.",
    overview:
      "The Couple's Ministry is built on the belief that a strong marriage changes everything — family, community, and church. We gather to strengthen marriages through the word, real conversations, and intentional experiences that help couples grow closer to each other and to God.",
    pullQuote: "The best version of your marriage is still ahead.",
    verseRef: "Ecclesiastes 4:9",
    verseText:
      "Two are better than one, because they have a good return for their labour — for if either of them falls, one can help the other up.",
    activities: [
      {
        num: "01",
        title: "Monthly Couples' Dinner",
        body: "A relaxed evening for married couples to reconnect, share, and build friendships with others who take marriage seriously.",
      },
      {
        num: "02",
        title: "Marriage Enrichment",
        body: "Practical, honest teaching on communication, intimacy, finances, and building a home that reflects God's love.",
      },
      {
        num: "03",
        title: "Annual Retreat",
        body: "A dedicated weekend to quiet the noise and deepen the bond between you and your spouse.",
      },
      {
        num: "04",
        title: "Support Groups",
        body: "Safe spaces for couples navigating hard seasons — with prayer, pastoral care, and people who understand.",
      },
    ],
    who: "Married couples at any stage — newlyweds figuring it out, or long-married partners ready to go deeper.",
    close: "The best marriages are built together — in community.",
  },
} as const;

type Slug = keyof typeof MINISTRIES;

export function generateStaticParams() {
  return (Object.keys(MINISTRIES) as Slug[]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = MINISTRIES[slug as Slug];
  if (!m) return {};
  return {
    title: `${m.name} — Everlasting Hills Church`,
    description: m.overview.slice(0, 155),
  };
}

// ── Primitives ─────────────────────────────────────────────────────────────────

const DOT_PATTERN = `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff'/%3E%3C/svg%3E")`;

function DotOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{ backgroundImage: DOT_PATTERN }}
    />
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default async function MinistryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const base = MINISTRIES[slug as Slug];
  if (!base) notFound();

  // Text comes from the CMS (falling back to the bundled copy); the icon and hero
  // image stay fixed per group since they aren't text-editable.
  const content = await getStructuredContent<MinistryDetailContent>(`ministries/${slug}`, {
    preview,
    fallback: base as unknown as MinistryDetailContent,
    valid: isValidDetail,
  });
  const m = { ...content, icon: base.icon, heroImage: base.heroImage };

  const Icon = m.icon;

  return (
    <main>
      {preview && (
        <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
          PREVIEW — draft, not published
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          1. HERO — split-screen, dark
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-church-dark text-white">
        {/* Background image */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ opacity: 0.40 }}
          />
          {/* Dark scrim — heavier on the left so white text stays legible */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        </div>

        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute right-[-10%] top-[-10%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
          <div className="absolute bottom-[-20%] left-[-5%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-20">

          {/* Back link */}
          <ScrollReveal>
            <Link
              href="/ministries"
              className="inline-flex items-center gap-2 text-white/35 text-xs font-semibold uppercase tracking-widest mb-16 hover:text-white/65 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1] rounded"
            >
              <ArrowLeft size={13} />
              All Ministries
            </Link>
          </ScrollReveal>

          {/* Split layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* ── Left: text ── */}
            <div>
              <ScrollReveal delay={0.05}>
                <p className="text-white/40 text-xs tracking-[0.3em] uppercase font-semibold mb-4">
                  {m.heroLabel}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.06] tracking-tight text-balance text-white mb-4">
                  {m.heroHeadline}
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={0.17}>
                <p className="text-[#FFB3C1] text-lg sm:text-xl font-medium mb-6 tracking-tight">
                  {m.heroAccent}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.24}>
                <p className="text-white/55 text-base sm:text-lg leading-relaxed max-w-md">
                  {m.heroBody}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.32}>
                <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#87102C]/50">
                    <Icon size={14} strokeWidth={2} className="text-[#FFB3C1]" />
                  </span>
                  <span className="text-white/50 text-sm">{m.name}</span>
                </div>
              </ScrollReveal>
            </div>

            {/* ── Right: gradient block with glassmorphic verse card ── */}
            <ScrollReveal delay={0.2}>
              <div className="relative">
                {/* Verse block */}
                <div
                  className="relative w-full rounded-3xl overflow-hidden bg-[#87102C]"
                  style={{ minHeight: "360px" }}
                >
                  <DotOverlay />

                  {/* Giant watermark icon */}
                  <div className="pointer-events-none absolute bottom-0 right-0 translate-x-6 translate-y-6 opacity-[0.08]">
                    <Icon size={260} strokeWidth={0.5} className="text-white" />
                  </div>

                  {/* Verse content */}
                  <div className="relative z-10 p-8 sm:p-10 flex flex-col h-full justify-between" style={{ minHeight: "360px" }}>
                    <span className="text-white/10 text-8xl font-serif leading-none select-none -ml-1">
                      &ldquo;
                    </span>

                    <div>
                      <blockquote className="text-white text-xl sm:text-2xl font-medium leading-[1.4] [text-wrap:balance] mb-6">
                        {m.verseText}
                      </blockquote>
                      <div className="flex items-center gap-3">
                        <span className="h-px w-8 bg-white/30" />
                        <cite className="text-white/55 text-sm font-semibold not-italic tracking-wider uppercase">
                          {m.verseRef}
                        </cite>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating glassmorphic chip */}
                <div className="absolute -bottom-5 -left-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 py-3 shadow-xl">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Scripture Foundation</p>
                  <p className="text-white text-sm font-bold mt-0.5">{m.verseRef}</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          2. OVERVIEW — blush background, two-column
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#FFF4F6]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16 items-start">

            {/* Left: story */}
            <div>
              <ScrollReveal>
                <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
                  About
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance mb-6">
                  Who we are
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <p className="text-[#555] text-base sm:text-lg leading-relaxed">
                  {m.overview}
                </p>
              </ScrollReveal>

            </div>

            {/* Right: burgundy pull-quote + white info card */}
            <div className="flex flex-col gap-5 lg:pt-10">
              {/* Inverted (burgundy) pull-quote card — matches CultureSection inverted card */}
              <ScrollReveal delay={0.15}>
                <div className="relative overflow-hidden rounded-2xl p-8 bg-[#87102C] shadow-[0_24px_60px_-15px_rgba(135,16,44,0.35)]">
                  <DotOverlay />
                  <span className="absolute top-4 left-5 text-white/10 text-7xl font-serif leading-none select-none">
                    &ldquo;
                  </span>
                  <p className="relative text-white text-xl sm:text-2xl font-bold leading-[1.3] [text-wrap:balance]">
                    {m.pullQuote}
                  </p>
                  <div className="relative mt-6 flex items-center gap-2">
                    <span className="h-px w-6 bg-white/30" />
                    <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">
                      {m.name}
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              {/* White elevated info card */}
              <ScrollReveal delay={0.25}>
                <div className="rounded-2xl bg-white border border-[#E7CDD3] p-6 flex items-center gap-4 shadow-sm">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFE8ED]">
                    <Icon size={20} strokeWidth={1.8} className="text-[#87102C]" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#87102C] mb-1">
                      Ministry Group
                    </p>
                    <p className="text-[#111] font-bold text-base">{m.name}</p>
                    <p className="text-[#999] text-sm mt-0.5">Everlasting Hills Church</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3. SCRIPTURE PULL — burgundy, full-width, centered
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-[#87102C]">
        <DotOverlay />

        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <ScrollReveal>
            <span className="text-white/10 text-[9rem] font-serif leading-none block -mb-10 select-none">
              &ldquo;
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <blockquote className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.25] tracking-tight [text-wrap:balance]">
              {m.verseText}
            </blockquote>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-white/20" />
              <cite className="text-[#FFB3C1] text-sm sm:text-base font-semibold not-italic tracking-widest uppercase">
                {m.verseRef}
              </cite>
              <span className="h-px w-12 bg-white/20" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          4. ACTIVITIES — blush background, bento with number accents
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#FFF4F6]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">

          <div className="mb-16">
            <ScrollReveal>
              <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
                Activities
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
                What we do together
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed max-w-xl">
                Four ways we sharpen, grow, and stay connected as a community.
              </p>
            </ScrollReveal>
          </div>

          {/* Bento grid — 2 wide on desktop */}
          <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
            {m.activities.map((item, i) => (
              <ScrollReveal key={item.num} delay={0.08 + i * 0.1}>
                <div
                  className={`group relative rounded-2xl border p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1
                    ${i === 1
                      ? "bg-[#87102C] border-transparent hover:shadow-[0_20px_60px_-15px_rgba(135,16,44,0.6)]"
                      : "bg-white border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.1)] hover:border-[#E7CDD3]"
                    }`}
                >
                  {i === 1 && <DotOverlay />}

                  {/* Number accent */}
                  <span
                    className={`absolute top-6 right-7 text-5xl font-black leading-none select-none transition-colors duration-300
                      ${i === 1 ? "text-white/10" : "text-[#E7CDD3] group-hover:text-[#FFB3C1]"}`}
                  >
                    {item.num}
                  </span>

                  {/* Icon box */}
                  <div
                    className={`relative mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl
                      ${i === 1 ? "bg-white/15" : "bg-[#FFE8ED]"}`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                      className={i === 1 ? "text-white" : "text-[#87102C]"}
                    />
                  </div>

                  <h3
                    className={`relative text-xl font-bold mb-3 leading-tight
                      ${i === 1 ? "text-white" : "text-[#111]"}`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`relative text-sm sm:text-base leading-relaxed
                      ${i === 1 ? "text-white/65" : "text-[#666]"}`}
                  >
                    {item.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          5. CLOSE — dark, bold statement, navigation
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-church-dark text-white">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-[-5%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[#87102C]/12 blur-[140px]" />
          <div className="absolute right-[-5%] bottom-[-20%] h-[50%] w-[50%] rounded-full bg-[#87102C]/8 blur-[120px]" />
        </div>

        {/* Watermark icon */}
        <div className="pointer-events-none absolute bottom-0 right-0 translate-x-16 translate-y-8 opacity-[0.04] z-0">
          <Icon size={420} strokeWidth={0.4} className="text-white" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl">
            <ScrollReveal>
              <p className="text-white/30 text-xs tracking-[0.3em] uppercase font-semibold mb-6">
                {m.name}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight text-balance text-white mb-6">
                {m.close}
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.18}>
              <p className="text-white/45 text-base sm:text-lg leading-relaxed mb-12 max-w-md">
                We meet every Sunday. Walk through the doors, and you&apos;ll
                find your people waiting.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.26}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/ministries"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1]"
                >
                  <ArrowLeft size={14} />
                  All Ministries
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#87102C] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#87102C]/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1]"
                >
                  Visit Us Sunday
                  <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

    </main>
  );
}
