import { Tag } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";

/** Section 4b — Admin-assigned labels, read-only. Premium empty state when none set. */
export function TagsSection({ tags }: { tags: ProfileViewModel["tags"] }) {
  return (
    <ScrollReveal delay={0.05}>
      <section aria-labelledby="tags-section-title">
        <div className="flex items-center gap-3 mb-5">
          <h2 id="tags-section-title" className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0">
            Ministry tags
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
        </div>

        {tags.length > 0 ? (
          <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-7 sm:p-8">
            <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] mb-5">
              {tags.length} tag{tags.length === 1 ? "" : "s"} assigned
            </p>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="group inline-flex items-center gap-2 rounded-full
                    bg-[#FFE8ED] dark:bg-[#87102C]/20 border border-[#E7CDD3]/60 dark:border-[#87102C]/30
                    text-[#87102C] dark:text-[#FFB3C1] px-4 py-2 text-sm font-semibold
                    hover:bg-[#FFD8E1] dark:hover:bg-[#87102C]/35 hover:border-[#E7CDD3] dark:hover:border-[#87102C]/50
                    transition-colors duration-200"
                >
                  <Tag size={13} aria-hidden="true" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-[#FFF4F6] dark:bg-white/[0.03] border border-dashed border-[#E7CDD3] dark:border-white/[0.10] rounded-2xl p-8 sm:p-10">
            <Tag
              size={96}
              aria-hidden="true"
              className="absolute -right-4 -bottom-4 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
              style={{ color: "#87102C" }}
            />
            <div className="relative z-10 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#87102C]/20 border border-[#E7CDD3]/60 dark:border-[#87102C]/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Tag size={19} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111] dark:text-white mb-1.5">No tags yet</p>
                <p className="text-sm text-[#6a5a5d] dark:text-white/45 leading-relaxed max-w-[44ch]">
                  Tags are added by your ministry leaders as you serve, lead, or join a team at EHC.
                  They show your involvement in the community.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </ScrollReveal>
  );
}
