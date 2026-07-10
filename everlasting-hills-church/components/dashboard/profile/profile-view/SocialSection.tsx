import { Globe } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { SOCIAL_PLATFORMS } from "./social-platforms";
import { SocialCard } from "./SocialCard";

/** Section 4c — Platform links, clickable when set, dimmed when not. */
export function SocialSection({ profile }: { profile: ProfileViewModel }) {
  const noneConnected = SOCIAL_PLATFORMS.every((p) => !profile[p.key]);

  return (
    <ScrollReveal delay={0.05}>
      <section aria-labelledby="social-section-title">
        <div className="flex items-center gap-3 mb-5">
          <h2 id="social-section-title" className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0">
            Connect with me
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
        </div>

        {noneConnected ? (
          <div className="bg-[#FFF4F6] dark:bg-white/[0.03] border border-[#E7CDD3]/40 dark:border-white/[0.06] rounded-2xl p-7 sm:p-8 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
              <Globe size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111] dark:text-white">No social links yet</p>
              <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-0.5">
                Add your handles in{" "}
                <a href="/dashboard/settings" className="text-[#87102C] dark:text-[#FFB3C1] underline underline-offset-2 hover:no-underline">
                  Settings → Social Media
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <SocialCard key={platform.key} platform={platform} value={profile[platform.key]} />
            ))}
          </div>
        )}
      </section>
    </ScrollReveal>
  );
}
