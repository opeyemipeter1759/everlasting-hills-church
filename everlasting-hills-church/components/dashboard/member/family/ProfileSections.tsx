"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Award, Camera, Check, Heart, Link2, Loader2, Pencil, Share2, Trash2 } from "lucide-react";
import { useLikeProfile, useProfileCover, type BadgeProgress, type FamilyProfile, type ProfileBadge } from "@/lib/api/family";
import { LEVEL_STYLE, TRACK_ICON, TRACK_LABEL } from "./badge-style";

export const card =
  "rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]";

export function CardTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-[#111] dark:text-white">{children}</h2>
      {aside}
    </div>
  );
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

/** The link to a profile, for sharing with another member. */
export function profileUrl(id: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.everlastinghills.church";
  return `${origin}/dashboard/family/${id}`;
}

/**
 * Share and Copy link, side by side. Share opens the phone's share sheet;
 * Copy link always just copies, because on a computer the share sheet is not
 * what people expect and there was no other way to get the link.
 */
export function ShareProfileButton({ id, name, isMe }: { id: string; name: string; isMe: boolean }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);
  const url = () => profileUrl(id);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (an old browser, or no permission): show the link to copy by hand.
      window.prompt("Copy this profile link", url());
    }
  }
  async function share() {
    const text = isMe ? "See my profile in the Everlasting Hills church family" : `${name} in the Everlasting Hills church family`;
    try {
      await navigator.share({ title: name, text, url: url() });
    } catch {
      // The member closed the share sheet: nothing to do.
    }
  }
  const outline =
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-[#87102C] px-5 text-sm font-semibold text-[#87102C] transition-colors hover:bg-[#FFF4F6] dark:border-[#FFB3C1]/60 dark:text-[#FFB3C1] dark:hover:bg-white/[0.06]";
  return (
    <>
      <button type="button" onClick={copy} className={outline} aria-live="polite">
        {copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
        {copied ? "Link copied" : isMe ? "Copy my profile link" : "Copy profile link"}
      </button>
      {canShare && (
        <button type="button" onClick={share} className={outline}>
          <Share2 size={15} aria-hidden="true" /> {isMe ? "Share my profile" : "Share profile"}
        </button>
      )}
    </>
  );
}

/**
 * The banner across the top: the member's own picture, or the church colours
 * with a quiet cross. The member can change it from their own profile.
 */
export function Cover({ coverUrl, isMe }: { coverUrl: string | null; isMe: boolean }) {
  const { upload, remove } = useProfileCover();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = upload.isPending || remove.isPending;

  async function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png"].includes(file.type)) return setError("Choose a JPG or PNG picture.");
    if (file.size > 5 * 1024 * 1024) return setError("Choose a picture under 5 MB.");
    try {
      await upload.mutateAsync(file);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Could not upload the banner. Please try again.");
    }
  }

  return (
    <div
      className="relative h-32 sm:h-48"
      style={coverUrl ? undefined : { background: "linear-gradient(120deg, #4a0819 0%, #87102C 45%, #C9A227 130%)" }}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg aria-hidden="true" viewBox="0 0 40 60" className="absolute right-6 top-3 h-24 w-16 text-white/10 sm:h-32">
          <rect x="16" y="0" width="8" height="60" rx="2" fill="currentColor" />
          <rect x="2" y="16" width="36" height="8" rx="2" fill="currentColor" />
        </svg>
      )}
      {isMe && (
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png" className="hidden" onChange={choose} aria-label="Banner picture" />
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-black/45 px-3.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/60 disabled:opacity-60"
          >
            {upload.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Camera size={14} aria-hidden="true" />}
            {coverUrl ? "Change banner" : "Add a banner"}
          </button>
          {coverUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => remove.mutate()}
              aria-label="Remove banner"
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/60 disabled:opacity-60"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="absolute bottom-2 right-3 z-20 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Cover, photo, name and the line under it, with the actions. */
export function ProfileHeader({ p }: { p: FamilyProfile }) {
  const like = useLikeProfile(p.id);
  const name = `${p.firstName} ${p.lastName}`.trim();
  const initials = `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
  const lead = p.units.find((u) => u.isLead);
  const headline = p.headline || (lead
    ? `Leads ${lead.name}${p.units.length > 1 ? ` · Serves in ${p.units.filter((u) => u !== lead).map((u) => u.name).join(", ")}` : ""}`
    : p.units.length > 0
      ? `Serves in ${p.units.map((u) => u.name).join(", ")}`
      : "Member of the church family");
  const joined = new Date(p.joinedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const topBadge = p.badges[0];

  return (
    <section className={`${card} overflow-hidden`}>
      <Cover coverUrl={p.coverUrl} isMe={p.isMe} />
      <div className="px-5 pb-5 sm:px-8 sm:pb-7">
        {/* Above the banner: without its own layer the photo slid under it. */}
        <div className="relative z-10 -mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          {p.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photoUrl}
              alt=""
              className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md dark:border-[#140b10] sm:h-32 sm:w-32"
            />
          ) : (
            <span className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#FFE8ED] text-3xl font-bold text-[#87102C] shadow-md dark:border-[#140b10] dark:bg-[#87102C]/30 dark:text-[#FFB3C1] sm:h-32 sm:w-32">
              {initials || "?"}
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            {p.isMe ? (
              <Link
                href="/dashboard/settings"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#87102C] px-5 text-sm font-semibold text-white hover:bg-[#6E0C24]"
              >
                <Pencil size={15} aria-hidden="true" /> Edit profile
              </Link>
            ) : (
              <button
                type="button"
                aria-pressed={p.likedByMe}
                disabled={like.isPending}
                onClick={() => like.mutate(!p.likedByMe)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  p.likedByMe ? "bg-[#87102C] text-white hover:bg-[#6E0C24]" : "bg-[#FFE8ED] text-[#87102C] hover:bg-[#FFD6DF] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"
                }`}
              >
                <Heart size={15} aria-hidden="true" fill={p.likedByMe ? "currentColor" : "none"} />
                {p.likedByMe ? "Liked" : "Like"}
              </button>
            )}
            <ShareProfileButton id={p.id} name={name} isMe={p.isMe} />
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#111] dark:text-white sm:text-3xl">{name}</h1>
        <p className="mt-1 text-[15px] text-[#3d3436] dark:text-white/80">{headline}</p>
        <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/45">
          Everlasting Hills Church, Ibadan · Member since {joined}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]">
          <span>
            {p.likeCount} {p.likeCount === 1 ? "like" : "likes"}
          </span>
          <a href="#kind-words" className="hover:underline">
            {p.commentCount} kind {p.commentCount === 1 ? "word" : "words"}
          </a>
          {topBadge && (
            <span className="inline-flex items-center gap-1">
              <Award size={14} aria-hidden="true" /> {topBadge.name}
            </span>
          )}
        </p>
      </div>
    </section>
  );
}

/** The figures along the top, LinkedIn-style but counting a walk with God. */
export function StatsStrip({ p }: { p: FamilyProfile }) {
  const s = p.stats;
  const items: [number, string][] = [
    [s.servicesAttended, "Services attended"],
    [s.daysInTheWord, "Days in the Word"],
    [s.plansFinished, "Bible plans finished"],
    [s.peopleReached, "People reached"],
    [s.soulsWon, "Souls won"],
    [s.booksRead, "Books read"],
    [s.articlesPublished, "Articles"],
    [s.badges, "Badges"],
  ];
  return (
    <section aria-label="At a glance" className={`${card} grid grid-cols-2 p-2 sm:grid-cols-4`}>
      {items.map(([value, label]) => (
        <div key={label} className="px-3 py-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-[#87102C] dark:text-[#FFB3C1]">{value}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#8a7e80] dark:text-white/45">{label}</p>
        </div>
      ))}
    </section>
  );
}

export function BadgeMedal({ badge }: { badge: ProfileBadge }) {
  const Icon = TRACK_ICON[badge.track];
  const style = LEVEL_STYLE[badge.level];
  return (
    <li className="flex flex-col items-center gap-2 rounded-2xl p-3 text-center">
      <span
        className="relative flex h-16 w-16 items-center justify-center rounded-full shadow-sm"
        style={{ background: style.fill, boxShadow: `0 0 0 3px ${style.ring}33` }}
        title={`${style.label} badge`}
      >
        <Icon size={26} className="text-white drop-shadow" aria-hidden="true" />
      </span>
      <span className="text-sm font-bold leading-tight text-[#111] dark:text-white">{badge.name}</span>
      <span className="text-[11px] leading-snug text-[#8a7e80] dark:text-white/45">{badge.description}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: style.ring }}>
        {style.label} · {fmtDate(badge.earnedAt)}
      </span>
    </li>
  );
}

export function BadgesSection({ p }: { p: FamilyProfile }) {
  const [all, setAll] = useState(false);
  const shown = all ? p.badges : p.badges.slice(0, 8);
  const name = p.isMe ? "You" : p.firstName;
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <CardTitle
        aside={
          p.badges.length > 8 && (
            <button type="button" onClick={() => setAll((v) => !v)} className="min-h-11 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
              {all ? "Show fewer" : `Show all ${p.badges.length}`}
            </button>
          )
        }
      >
        Badges
      </CardTitle>
      {p.badges.length === 0 ? (
        <p className="text-sm text-[#8a7e80] dark:text-white/45">
          {p.isMe
            ? "Your first badges come from attending a service, reading a day of a Bible plan, or wishing someone a happy birthday."
            : `${name} has not earned a badge yet.`}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {shown.map((b) => (
            <BadgeMedal key={b.id} badge={b} />
          ))}
        </ul>
      )}
      {p.isMe && <NextBadges progress={p.progress} />}
    </section>
  );
}

/** For the member themselves: how far each track is from its next badge. */
function NextBadges({ progress }: { progress: BadgeProgress[] }) {
  const upcoming = progress
    .filter((t) => t.next)
    .sort((a, b) => b.count / b.next!.at - a.count / a.next!.at)
    .slice(0, 6);
  if (upcoming.length === 0) return null;
  return (
    <div className="mt-5 border-t border-[#E7CDD3]/50 pt-4 dark:border-white/[0.07]">
      <h3 className="mb-3 text-sm font-bold text-[#111] dark:text-white">Your next badges</h3>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {upcoming.map((t) => {
          const Icon = TRACK_ICON[t.track];
          const pct = Math.min(100, Math.round((t.count / t.next!.at) * 100));
          return (
            <li key={t.track} className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25">
                <Icon size={16} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111] dark:text-white">
                  {t.next!.name} <span className="font-normal text-[#8a7e80] dark:text-white/45">· {TRACK_LABEL[t.track]}</span>
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div className="h-full rounded-full bg-[#87102C]" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-0.5 text-[11px] text-[#8a7e80] dark:text-white/45">
                  {t.count} of {t.next!.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ArticlesSection({ p }: { p: FamilyProfile }) {
  if (p.articles.length === 0 && !p.isMe) return null;
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <CardTitle
        aside={
          p.isMe && (
            <Link href="/dashboard/articles/write" className="min-h-11 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
              Write an article
            </Link>
          )
        }
      >
        Articles
      </CardTitle>
      {p.articles.length === 0 ? (
        <p className="text-sm text-[#8a7e80] dark:text-white/45">Articles you publish will show here.</p>
      ) : (
        <ul className="divide-y divide-[#E7CDD3]/50 dark:divide-white/[0.07]">
          {p.articles.map((a) => (
            <li key={a.id}>
              <Link href={`/dashboard/articles/${a.slug}`} className="group flex gap-4 py-3">
                {a.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverImageUrl} alt="" className="h-16 w-24 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-16 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/25">
                    <Pencil size={18} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-[#111] group-hover:text-[#87102C] dark:text-white dark:group-hover:text-[#FFB3C1]">{a.title}</p>
                  {a.excerpt && <p className="mt-0.5 line-clamp-2 text-sm text-[#5A4A4D] dark:text-white/60">{a.excerpt}</p>}
                  <p className="mt-1 text-xs text-[#8a7e80] dark:text-white/45">
                    {a.publishedAt ? fmtDate(a.publishedAt) : ""} · {a.readingMinutes} min read · {a.likeCount}{" "}
                    {a.likeCount === 1 ? "like" : "likes"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
