"use client";

import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { ROLE_LABEL } from "./constants";
import { initialsOf, tenureFrom } from "./helpers";
import { getMyMinistries } from "./ministries";
import { PageHeader } from "./PageHeader";
import { HeroAndStorySection } from "./HeroAndStorySection";
import { CompletionCard } from "./CompletionCard";
import { ContactMembershipSection } from "./ContactMembershipSection";
import { PersonalDetailsSection } from "./PersonalDetailsSection";
import { TagsSection } from "./TagsSection";
import { SocialSection } from "./SocialSection";
import { MinistrySection } from "./MinistrySection";
import { ServingSection } from "./ServingSection";
import { CertificatesSection } from "./CertificatesSection";
import { FooterCta } from "./FooterCta";
import ScrollReveal from "@/components/home/ScrollReveal";

export default function ProfileView({ profile }: { profile: ProfileViewModel }) {
  const displayName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "Member";
  const initials = initialsOf(profile.firstName, profile.lastName);
  // "Worker" is a display-only distinction, not a real role: a plain MEMBER who
  // also belongs to a unit (but isn't its lead — that's UNIT_LEAD, a real role).
  const isWorker = profile.role === "MEMBER" && profile.units.length > 0;
  const role = isWorker ? "Worker" : profile.role ? (ROLE_LABEL[profile.role] ?? profile.role) : "Member";
  const tenure = tenureFrom(profile.joinedAt);
  const isMarried = !!profile.weddingAnniversary;
  const ministries = getMyMinistries(profile.dateOfBirth, profile.gender, isMarried);

  return (
    <div className="space-y-8">
      <PageHeader />

      <HeroAndStorySection profile={profile} displayName={displayName} initials={initials} role={role} tenure={tenure} />

      <ScrollReveal delay={0.05}>
        <CompletionCard profile={profile} />
      </ScrollReveal>

      <ContactMembershipSection profile={profile} role={role} />

      <PersonalDetailsSection profile={profile} />

      <TagsSection tags={profile.tags} />

      <SocialSection profile={profile} />

      {ministries.length > 0 && <MinistrySection ministries={ministries} />}

      <ServingSection units={profile.units} />

      <CertificatesSection />

      <FooterCta />
    </div>
  );
}
