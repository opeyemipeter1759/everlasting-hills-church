import type { ReactNode } from "react";
import { BookOpen, ClipboardList, PlayCircle, Users } from "lucide-react";
import type { CourseListItem } from "@/lib/api/courses";

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#e8768a] mb-3">
        {icon}
      </span>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{compact(value)}</p>
    </div>
  );
}

export default function CourseStatsRow({ catalog }: { catalog: CourseListItem[] }) {
  const totalStudents = catalog.reduce((n, c) => n + c.studentsCount, 0);
  const totalLessons = catalog.reduce((n, c) => n + c.lessonsCount, 0);
  const totalQuestions = catalog.reduce((n, c) => n + c.examQuestionCount, 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile icon={<BookOpen size={16} />} label="Courses" value={catalog.length} />
      <Tile icon={<Users size={16} />} label="Students enrolled" value={totalStudents} />
      <Tile icon={<PlayCircle size={16} />} label="Lessons" value={totalLessons} />
      <Tile icon={<ClipboardList size={16} />} label="Exam questions" value={totalQuestions} />
    </div>
  );
}
