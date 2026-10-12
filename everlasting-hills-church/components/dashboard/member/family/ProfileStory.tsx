"use client";

import { Briefcase, Droplets, Flame, GraduationCap, HandHeart, Languages, Phone, Quote, Sparkles, Sprout, Users } from "lucide-react";
import type { FamilyProfile } from "@/lib/api/family";
import { CardTitle, card } from "./ProfileSections";

function Chips({ items, tone = "rose" }: { items: string[]; tone?: "rose" | "gold" | "slate" }) {
  const cls =
    tone === "gold"
      ? "bg-[#FFF6DD] text-[#7A5B00] dark:bg-[#C9A227]/15 dark:text-[#F3D77A]"
      : tone === "slate"
        ? "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/75"
        : "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]";
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className={`rounded-full px-3 py-1 text-sm font-semibold ${cls}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The favourite scripture, set like a pull quote under the header. */
export function VerseBanner({ p }: { p: FamilyProfile }) {
  if (!p.favouriteVerse) return null;
  return (
    <figure className="relative overflow-hidden rounded-2xl bg-[#2a0410] px-6 py-6 text-white sm:px-8">
      <Quote size={56} className="absolute -left-1 -top-2 text-white/10" aria-hidden="true" fill="currentColor" />
      <blockquote className="relative font-serif text-lg leading-relaxed sm:text-xl">“{p.favouriteVerse}”</blockquote>
      {p.favouriteVerseRef && (
        <figcaption className="relative mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#F3D77A]">
          {p.favouriteVerseRef} · {p.firstName}&apos;s favourite scripture
        </figcaption>
      )}
    </figure>
  );
}

/** Born again, baptised, filled, membership class: dated milestones down a line. */
export function JourneySection({ p }: { p: FamilyProfile }) {
  const j = p.journey;
  const steps = j
    ? ([
        [j.bornAgainYear, "Born again", Sprout],
        [j.waterBaptismYear, "Baptised in water", Droplets],
        [j.holySpiritYear, "Baptised in the Holy Spirit", Flame],
        [j.membershipClassYear, "Finished the membership class", GraduationCap],
      ] as const).filter(([year]) => year != null)
    : [];
  const joined = new Date(p.joinedAt).getFullYear();
  if (steps.length === 0) return null;
  const all = [...steps, [joined, "Joined Everlasting Hills Church", Users] as const].sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0));
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <CardTitle>Spiritual journey</CardTitle>
      <ol className="relative ml-3 border-l-2 border-[#E7CDD3] dark:border-white/10">
        {all.map(([year, label, Icon]) => (
          <li key={label} className="relative mb-5 ml-6 last:mb-0">
            <span className="absolute -left-[2.15rem] flex h-8 w-8 items-center justify-center rounded-full bg-[#87102C] text-white ring-4 ring-white dark:ring-[#140b10]">
              <Icon size={14} aria-hidden="true" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#FFB3C1]">{year}</p>
            <p className="text-[15px] font-semibold text-[#111] dark:text-white">{label}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CareerSection({ p }: { p: FamilyProfile }) {
  const c = p.career;
  if (!c || (!c.occupation && !c.employer && !c.industry && c.skills.length === 0)) return null;
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <CardTitle>Career</CardTitle>
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25">
          <Briefcase size={20} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          {c.occupation && <p className="text-[15px] font-bold text-[#111] dark:text-white">{c.occupation}</p>}
          {c.employer && <p className="text-sm text-[#3d3436] dark:text-white/75">{c.employer}</p>}
          {c.industry && <p className="text-sm text-[#8a7e80] dark:text-white/45">{c.industry}</p>}
        </div>
      </div>
      {c.skills.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold text-[#111] dark:text-white">Skills</h3>
          <Chips items={c.skills} tone="slate" />
        </div>
      )}
    </section>
  );
}

/** Gifts, interests and languages: common ground, and a welcome for newer members. */
export function GiftsSection({ p }: { p: FamilyProfile }) {
  if (p.gifts.length + p.interests.length + p.languages.length === 0) return null;
  return (
    <section className={`${card} space-y-4 p-5 sm:p-6`}>
      <CardTitle>Gifts and interests</CardTitle>
      {p.gifts.length > 0 && (
        <div>
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#111] dark:text-white">
            <Sparkles size={14} aria-hidden="true" /> Spiritual gifts and ministry
          </h3>
          <Chips items={p.gifts} />
        </div>
      )}
      {p.interests.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#111] dark:text-white">Interests</h3>
          <Chips items={p.interests} tone="gold" />
        </div>
      )}
      {p.languages.length > 0 && (
        <div>
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#111] dark:text-white">
            <Languages size={14} aria-hidden="true" /> Languages
          </h3>
          <Chips items={p.languages} tone="slate" />
        </div>
      )}
    </section>
  );
}

export function TestimonySection({ p }: { p: FamilyProfile }) {
  if (!p.testimony) return null;
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <CardTitle>{p.isMe ? "My testimony" : `${p.firstName}'s testimony`}</CardTitle>
      <p className="whitespace-pre-line font-serif text-[15px] leading-relaxed text-[#2b2325] dark:text-white/85">{p.testimony}</p>
    </section>
  );
}

/** Prayer focus, and a phone number if they chose to share it. */
export function ConnectSide({ p }: { p: FamilyProfile }) {
  if (!p.prayerFocus && !p.phone) return null;
  return (
    <section className={`${card} space-y-4 p-5`}>
      <CardTitle>Connect with {p.isMe ? "me" : p.firstName}</CardTitle>
      {p.prayerFocus && (
        <div className="rounded-xl bg-[#FFF4F6] p-4 dark:bg-white/[0.04]">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#FFB3C1]">
            <HandHeart size={13} aria-hidden="true" /> Pray with {p.isMe ? "me" : p.firstName}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#111] dark:text-white">{p.prayerFocus}</p>
        </div>
      )}
      {p.phone && (
        <a
          href={`tel:${p.phone.replace(/\s+/g, "")}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E7CDD3] px-4 text-sm font-semibold text-[#87102C] hover:bg-[#FFF4F6] dark:border-white/[0.14] dark:text-[#FFB3C1]"
        >
          <Phone size={14} aria-hidden="true" /> {p.phone}
        </a>
      )}
    </section>
  );
}
