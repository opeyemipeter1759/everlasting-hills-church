"use client";

import Link from "next/link";
import { ArrowLeft, Cake, Heart, Lock, Network, UserCircle2 } from "lucide-react";
import { useMe } from "@/lib/api";
import { useFamilyProfile, type FamilyProfile as Profile, type RestrictedProfile } from "@/lib/api/family";
import { SocialCard } from "@/components/dashboard/profile/profile-view/SocialCard";
import { SOCIAL_PLATFORMS } from "@/components/dashboard/profile/profile-view/social-platforms";
import KindWords from "./KindWords";
import RolesLine from "./RolesLine";
import { ArticlesSection, BadgesSection, CardTitle, Cover, ProfileHeader, StatsStrip, card } from "./ProfileSections";
import { CareerSection, ConnectSide, GiftsSection, JourneySection, TestimonySection, VerseBanner } from "./ProfileStory";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const dayMonth = (d: Profile["birthday"]) => (d ? `${d.day} ${MONTHS[d.month - 1]}` : null);
const STAFF = ["PASTOR", "ADMIN", "ADMIN_HEAD", "SUPER_ADMIN"];

function Detail({ icon: Icon, label, children }: { icon: typeof Cake; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2">
      <Icon size={16} className="mt-0.5 flex-shrink-0 text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a7e80] dark:text-white/45">{label}</p>
        <div className="text-sm font-semibold text-[#111] dark:text-white">{children}</div>
      </div>
    </li>
  );
}

/**
 * A member's profile, laid out like a LinkedIn page for a walk with God: a
 * cover and headline, the figures that matter here, their badges, the
 * articles they have written, and kind words from the family.
 * Anyone signed in can open it, and it can be shared as a link.
 */
export default function FamilyProfile({ id: routeId }: { id: string }) {
  const { data: me, isLoading: meLoading } = useMe();
  // "/dashboard/family/me" opens your own profile: the sidebar's "My badges" link.
  const id = routeId === "me" ? me?.member?.id : routeId;
  const { data: p, isLoading: profileLoading, isError: profileError } = useFamilyProfile(id);
  const isLoading = profileLoading || (routeId === "me" && meLoading);
  const isError = profileError || (routeId === "me" && !meLoading && !id);
  const viewerId = me?.member?.id ?? null;
  const isStaff = (me?.effectiveRoles ?? []).some((r) => STAFF.includes(r));

  const back = (
    <Link href="/dashboard/family" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
      <ArrowLeft size={15} aria-hidden="true" /> Church family
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {back}
        <div className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
        <div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }
  if (isError || !p) {
    return (
      <div className="space-y-4">
        {back}
        <p role="alert" className="text-sm text-[#8a7e80] dark:text-white/50">
          This profile could not be found. The member may have left the church.
        </p>
      </div>
    );
  }

  if (p.restricted) return <PrivateProfile p={p} back={back} />;

  const married = p.maritalStatus === "MARRIED";
  const socials = SOCIAL_PLATFORMS.filter((platform) => p.socials[platform.key]);

  return (
    <div className="space-y-5">
      {back}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <ProfileHeader p={p} />
          <VerseBanner p={p} />
          <StatsStrip p={p} />
          {p.bio && (
            <section className={`${card} p-5 sm:p-6`}>
              <CardTitle>About {p.isMe ? "me" : p.firstName}</CardTitle>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#3d3436] dark:text-white/80">{p.bio}</p>
            </section>
          )}
          {p.isMe && !p.headline && !p.favouriteVerse && !p.journey?.bornAgainYear && !p.career?.occupation && (
            <Link
              href="/dashboard/settings#spiritual-career"
              className="block rounded-2xl border-2 border-dashed border-[#E7CDD3] p-5 text-center text-sm font-semibold text-[#87102C] hover:bg-[#FFF4F6] dark:border-white/15 dark:text-[#FFB3C1]"
            >
              Add your headline, favourite scripture, spiritual journey and career, so the church family can know you better.
            </Link>
          )}
          <JourneySection p={p} />
          <BadgesSection p={p} />
          <CareerSection p={p} />
          <GiftsSection p={p} />
          <TestimonySection p={p} />
          <ArticlesSection p={p} />
          <KindWords memberId={p.id} firstName={p.firstName} isMe={p.isMe} viewerId={viewerId} isStaff={isStaff} />
        </div>

        <aside className="space-y-5">
          <ConnectSide p={p} />
          <section className={`${card} p-5`}>
            <CardTitle>Details</CardTitle>
            <ul className="divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06]">
              {p.gender && (
                <Detail icon={UserCircle2} label="Gender">
                  {p.gender}
                </Detail>
              )}
              {p.birthday && (
                <Detail icon={Cake} label="Birthday">
                  {dayMonth(p.birthday)}
                </Detail>
              )}
              <Detail icon={Heart} label="Marital status">
                {married ? (
                  p.spouse ? (
                    <>
                      Married to{" "}
                      <Link href={`/dashboard/family/${p.spouse.id}`} className="text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                        {p.spouse.name}
                      </Link>
                    </>
                  ) : p.spouseName ? (
                    `Married to ${p.spouseName}`
                  ) : (
                    "Married"
                  )
                ) : (
                  "Single"
                )}
                {married && p.anniversary && (
                  <span className="block text-xs font-normal text-[#8a7e80] dark:text-white/45">Anniversary · {dayMonth(p.anniversary)}</span>
                )}
              </Detail>
            </ul>
          </section>

          {p.units.length > 0 && (
            <section className={`${card} p-5`}>
              <CardTitle>Serving in</CardTitle>
              <ul className="space-y-3">
                {p.units.map((u) => (
                  <li key={u.id} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/25">
                      <Network size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#111] dark:text-white">{u.name}</p>
                      <p className="text-xs text-[#8a7e80] dark:text-white/45">{u.isLead ? "Leads" : u.isAssistant ? "Assistant lead" : "Serves in"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {socials.length > 0 && (
            <section className={`${card} p-5`}>
              <CardTitle>Connect</CardTitle>
              <div className="space-y-3">
                {socials.map((platform) => (
                  <SocialCard key={platform.key} platform={platform} value={p.socials[platform.key]} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/** A member who keeps their profile to themselves. */
function PrivateProfile({ p, back }: { p: RestrictedProfile; back: React.ReactNode }) {
  const name = `${p.firstName} ${p.lastName}`.trim();
  const initials = `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="space-y-5">
      {back}
      <section className={`${card} overflow-hidden`}>
        <Cover coverUrl={p.coverUrl} isMe={false} />
        <div className="px-5 pb-6 sm:px-8">
          <div className="relative z-10 -mt-14">
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photoUrl} alt="" className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md dark:border-[#140b10]" />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#FFE8ED] text-3xl font-bold text-[#87102C] shadow-md dark:border-[#140b10]">
                {initials}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#111] dark:text-white">{name}</h1>
          <RolesLine roles={p.roles} className="mt-2" />
          {p.headline && <p className="mt-1 text-[15px] text-[#3d3436] dark:text-white/80">{p.headline}</p>}
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FFF4F6] px-4 py-3 text-sm text-[#5A4A4D] dark:bg-white/[0.04] dark:text-white/60">
            <Lock size={15} aria-hidden="true" /> {p.firstName} keeps their profile private.
          </p>
        </div>
      </section>
    </div>
  );
}
