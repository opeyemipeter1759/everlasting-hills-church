import Link from "next/link";
import { Award, ExternalLink } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/courses-data";
import type { CourseListItem } from "@/lib/api/courses";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function CourseCertificateBadge({ course, completedAt }: { course: CourseListItem; completedAt: string | null }) {
  const Icon = ICON_OPTIONS[course.iconKey] ?? Award;
  const [from, to] = course.gradient;

  return (
    <Link
      href={`/dashboard/courses/${course.slug}/certificate`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-white dark:bg-white/[0.05] p-6 text-center
        hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)]
        transition-all duration-300"
    >
      <div className="relative">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full shadow-md ring-4 ring-white dark:ring-[#1c1c1e]"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <Icon size={26} className="text-white" strokeWidth={1.75} />
        </span>
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#D4AF37] dark:border-[#1c1c1e]">
          <Award size={11} className="text-white" fill="currentColor" aria-hidden="true" />
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-[#111] dark:text-white leading-snug line-clamp-2">{course.title}</p>
        <p className="mt-1 text-[11px] text-[#8a7e80] dark:text-white/40">Completed {formatDate(completedAt)}</p>
      </div>

      <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] group-hover:underline">
        View Certificate <ExternalLink size={11} aria-hidden="true" />
      </span>
    </Link>
  );
}
