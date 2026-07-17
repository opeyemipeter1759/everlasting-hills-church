import { Calendar, Mail, MapPin, Phone } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { ChipCard } from "./ChipCard";
import { MembershipCard } from "./MembershipCard";
import { ContactRow } from "./ContactRow";
import { fmtJoined } from "./helpers";

/**
 * Section 3 — Contact & Membership bento grid:
 *   Direct contact (2 cols) | Status
 *   Join date               | Address (2 cols)
 */
export function ContactMembershipSection({ profile, role }: { profile: ProfileViewModel; role: string }) {
  return (
    <section aria-labelledby="contact-section-label">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-5">
          <h2 id="contact-section-label" className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0">
            How we reach you
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ScrollReveal delay={0.05} className="h-full">
            <div className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl px-6 sm:px-7 py-5 h-full flex flex-col
              hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)]
              transition-all duration-300"
            >
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] pt-1.5">
                Direct contact
              </p>
              <ContactRow icon={Mail} label="Email" value={profile.email} href={profile.email ? `mailto:${profile.email}` : null} />
              <div className="h-px bg-[#E7CDD3]/40 dark:bg-white/[0.07]" />
              <ContactRow icon={Phone} label="Phone" value={profile.phone} href={profile.phone ? `tel:${profile.phone}` : null} />
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.1} className="h-full">
          <MembershipCard role={role} />
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <ChipCard icon={Calendar} label="Member since" value={fmtJoined(profile.joinedAt)} />
        </ScrollReveal>

        <div className="lg:col-span-2">
          <ScrollReveal delay={0.2} className="h-full">
            <ChipCard
              icon={MapPin}
              label="Home address"
              value={
                profile.address ?? (
                  <span className="text-[#b8a8ac] dark:text-white/30 italic font-normal text-sm">Not set</span>
                )
              }
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
