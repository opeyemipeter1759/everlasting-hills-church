import { ICON_OPTIONS } from "@/lib/courses-data";
import type { CourseDetail } from "@/lib/api/courses";

export default function CourseHero({ course }: { course: CourseDetail }) {
  const Icon = ICON_OPTIONS[course.iconKey] ?? ICON_OPTIONS.BookOpen;
  const [from, to] = course.gradient;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-7 sm:p-9"
      style={{ background: `linear-gradient(150deg, ${from} 0%, ${to} 100%)` }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-black/10 blur-3xl" />
      <Icon size={64} strokeWidth={1.25} className="absolute right-8 top-1/2 hidden -translate-y-1/2 text-white/10 sm:block" />

      <div className="relative z-10 max-w-2xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm">
            {course.category.name}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl">{course.title}</h1>
        <p className="mt-2.5 text-sm text-white/70 sm:text-base">{course.tagline}</p>
      </div>
    </div>
  );
}
