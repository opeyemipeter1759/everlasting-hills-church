import { Calendar, ShieldCheck, Sparkles, MessageSquare, Star, TrendingUp, Headphones, Bookmark } from "lucide-react";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { DarkInsightChip } from "./InsightChips";

interface StoryPanelProps {
  profile: ProfileViewModel;
  tenure: string;
  role: string;
}

/**
 * Section 2 (right) — condensed "Your story" panel: only the 3 facts that
 * matter on day one (Tenure, Role, Membership); engagement metrics only
 * render once the member actually has data, instead of a wall of "—" chips.
 */
export function StoryPanel({ profile, tenure, role }: StoryPanelProps) {
  const prayers = profile.prayerCount ?? 0;
  const testimonies = profile.testimonyCount ?? 0;
  const hasEngagementStats =
    prayers > 0 ||
    testimonies > 0 ||
    profile.attendanceRate != null ||
    profile.totalServicesAttended != null ||
    profile.sermonListenStreak != null ||
    profile.bookmarkCount != null;

  return (
    <section
      aria-labelledby="story-heading"
      className="relative overflow-hidden rounded-2xl h-full"
      style={{ background: "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div aria-hidden="true" className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/8 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-7 flex flex-col gap-5">
        <div>
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-semibold mb-1.5">Member Insights</p>
          <h3 id="story-heading" className="text-lg font-bold text-white tracking-tight">
            Your story at EHC
          </h3>
        </div>

        <div className="space-y-3">
          <DarkInsightChip icon={Calendar} label="Tenure" value={tenure} />
          <DarkInsightChip icon={ShieldCheck} label="Role" value={role} />
          <DarkInsightChip icon={Sparkles} label="Membership" value="Active" />
        </div>

        {hasEngagementStats && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            {prayers > 0 && <DarkInsightChip icon={MessageSquare} label="Prayers submitted" value={`${prayers}`} />}
            {testimonies > 0 && <DarkInsightChip icon={Star} label="Testimonies" value={`${testimonies}`} />}
            {profile.attendanceRate != null && (
              <DarkInsightChip icon={TrendingUp} label="Attendance rate" value={`${profile.attendanceRate}%`} />
            )}
            {profile.totalServicesAttended != null && (
              <DarkInsightChip icon={Calendar} label="Services attended" value={`${profile.totalServicesAttended}`} />
            )}
            {profile.sermonListenStreak != null && (
              <DarkInsightChip
                icon={Headphones}
                label="Sermon streak"
                value={`${profile.sermonListenStreak} day${profile.sermonListenStreak === 1 ? "" : "s"}`}
              />
            )}
            {profile.bookmarkCount != null && (
              <DarkInsightChip icon={Bookmark} label="Bookmarks" value={`${profile.bookmarkCount}`} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
