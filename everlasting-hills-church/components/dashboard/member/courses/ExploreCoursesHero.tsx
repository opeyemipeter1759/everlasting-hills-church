import { GraduationCap, Layers, PlayCircle, Users } from "lucide-react";

export default function ExploreCoursesHero({
  courseCount,
  categoryCount,
  studentCount,
}: {
  courseCount: number;
  categoryCount: number;
  studentCount: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none text-[80px] font-black leading-none tracking-tight text-white/[0.04]">
        LEARN
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-7 sm:p-9">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.32em] text-[#FFB3C1]">
          <GraduationCap size={13} />
          Explore Courses
        </div>

        <div>
          <h1 className="text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl">
            Grow deeper, one course at a time.
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/55">
            Discipleship courses taught by our pastors and leaders — learn at your own pace, wherever you are.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
            <PlayCircle size={14} /> {courseCount} courses
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
            <Layers size={14} /> {categoryCount} topics
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
            <Users size={14} /> {studentCount} enrolled
          </span>
        </div>
      </div>
    </div>
  );
}
