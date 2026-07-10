import { Cake, Home, UserCircle2 } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { ChipCard } from "./ChipCard";
import { MaritalStatusCard } from "./MaritalStatusCard";
import { computeAge, fmtDayMonth } from "./helpers";

/**
 * Section 3b — Gender, birthday + age, marital status, anniversary, household.
 * Household only rendered when assigned — no wasted empty-state card.
 */
export function PersonalDetailsSection({ profile }: { profile: ProfileViewModel }) {
  const isMarried = !!profile.weddingAnniversary;
  const birthday = fmtDayMonth(profile.dateOfBirth);
  const anniversary = fmtDayMonth(profile.weddingAnniversary);

  return (
    <section aria-labelledby="personal-section-label">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-5">
          <h2 id="personal-section-label" className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0">
            Personal details
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ScrollReveal delay={0.05}>
          <ChipCard
            icon={UserCircle2}
            label="Gender"
            value={
              profile.gender ? (
                <span className="flex items-center gap-2">
                  {profile.gender}
                  <span className="ml-auto text-[10px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-full
                    bg-[#FFE8ED] dark:bg-[#87102C]/30 text-[#87102C] dark:text-[#FFB3C1]">
                    {profile.gender === "Female" ? "♀" : "♂"}
                  </span>
                </span>
              ) : (
                <span className="text-[#b8a8ac] dark:text-white/30 italic font-normal text-sm">Not on file</span>
              )
            }
          />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <ChipCard
            icon={Cake}
            label="Birthday"
            value={
              birthday ? (
                <span>
                  {birthday}
                  {computeAge(profile.dateOfBirth) !== null && (
                    <span className="ml-2 text-xs font-normal text-[#8a7e80] dark:text-white/40">
                      · {computeAge(profile.dateOfBirth)} yrs
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[#b8a8ac] dark:text-white/30 italic font-normal text-sm">Not on file</span>
              )
            }
          />
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <MaritalStatusCard isMarried={isMarried} anniversary={anniversary} />
        </ScrollReveal>

        {profile.household && (
          <div className="sm:col-span-2 lg:col-span-3">
            <ScrollReveal delay={0.2} className="h-full">
              <div className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6
                hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-none
                transition-all duration-300 flex items-center gap-5">
                <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
                  <Home size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] mb-1">Household</p>
                  <p className="text-[15px] font-bold text-[#111] dark:text-white">{profile.household}</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        )}
      </div>
    </section>
  );
}
