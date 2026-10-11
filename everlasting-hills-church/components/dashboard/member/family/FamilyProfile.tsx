"use client";

import Link from "next/link";
import { ArrowLeft, Cake, Network, UserCircle2 } from "lucide-react";
import { useFamilyProfile, type FamilyProfile as Profile } from "@/lib/api/family";
import { ChipCard } from "@/components/dashboard/profile/profile-view/ChipCard";
import { MaritalStatusCard } from "@/components/dashboard/profile/profile-view/MaritalStatusCard";
import { SocialCard } from "@/components/dashboard/profile/profile-view/SocialCard";
import { SOCIAL_PLATFORMS } from "@/components/dashboard/profile/profile-view/social-platforms";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const dayMonth = (d: Profile["birthday"]) => (d ? `${d.day} ${MONTHS[d.month - 1]}` : null);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="flex-shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-[#87102C] dark:text-white/40 xs:tracking-[0.2em]">
        {children}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
    </div>
  );
}

const notOnFile = <span className="text-sm font-normal italic text-[#b8a8ac] dark:text-white/30">Not shared</span>;

/** Another member's profile, as the church family sees it. */
export default function FamilyProfile({ id }: { id: string }) {
  const { data: p, isLoading, isError } = useFamilyProfile(id);

  const back = (
    <Link href="/dashboard/family" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
      <ArrowLeft size={15} aria-hidden="true" /> Church family
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {back}
        <div className="h-40 animate-pulse rounded-3xl bg-gray-100 dark:bg-white/5" />
        <div className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
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

  const name = `${p.firstName} ${p.lastName}`.trim();
  const initials = `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
  const joined = new Date(p.joinedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const socials = SOCIAL_PLATFORMS.filter((platform) => p.socials[platform.key]);

  return (
    <div className="space-y-8">
      {back}

      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white sm:p-8"
        style={{ background: "linear-gradient(150deg, #87102C 0%, #6E0C24 55%, #4a0819 100%)" }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {p.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photoUrl} alt="" className="h-24 w-24 rounded-2xl border-2 border-white/25 object-cover" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-white/25 bg-white/10 text-3xl font-bold">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            <p className="mt-1 text-sm text-white/70">Member since {joined}</p>
            {p.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">{p.bio}</p>}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>About</SectionTitle>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ChipCard icon={UserCircle2} label="Gender" value={p.gender ?? notOnFile} />
          <ChipCard icon={Cake} label="Birthday" value={dayMonth(p.birthday) ?? notOnFile} />
          <MaritalStatusCard
            isMarried={p.maritalStatus === "MARRIED"}
            anniversary={dayMonth(p.anniversary)}
            spouse={p.spouse}
            spouseName={p.spouseName}
          />
        </div>
      </section>

      {p.units.length > 0 && (
        <section>
          <SectionTitle>Serving in</SectionTitle>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {p.units.map((u) => (
              <ChipCard
                key={u.id}
                icon={Network}
                label={u.isLead ? "Leads" : u.isAssistant ? "Assistant lead" : "Serves in"}
                value={u.name}
              />
            ))}
          </div>
        </section>
      )}

      {socials.length > 0 && (
        <section>
          <SectionTitle>Connect</SectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {socials.map((platform) => (
              <SocialCard key={platform.key} platform={platform} value={p.socials[platform.key]} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
