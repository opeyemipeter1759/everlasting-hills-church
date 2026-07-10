import ScrollReveal from "@/components/home/ScrollReveal";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { HeroCard } from "./HeroCard";
import { StoryPanel } from "./StoryPanel";

interface HeroAndStorySectionProps {
  profile: ProfileViewModel;
  displayName: string;
  initials: string;
  role: string;
  tenure: string;
}

/**
 * Section 2 — two-column, above the fold. Left (lg:2/3): dark gradient hero.
 * Right (lg:1/3): condensed "Your story" panel.
 */
export function HeroAndStorySection({ profile, displayName, initials, role, tenure }: HeroAndStorySectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <HeroCard
        photoUrl={profile.photoUrl}
        displayName={displayName}
        initials={initials}
        role={role}
        bio={profile.bio}
        tenure={tenure}
        joinedAt={profile.joinedAt}
      />

      <ScrollReveal delay={0.14} className="lg:col-span-1">
        <StoryPanel profile={profile} tenure={tenure} role={role} />
      </ScrollReveal>
    </div>
  );
}
