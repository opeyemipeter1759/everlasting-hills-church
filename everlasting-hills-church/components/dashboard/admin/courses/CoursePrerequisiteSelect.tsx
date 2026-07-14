import { fieldCls } from "@/components/ui/overlay/FormModal";
import type { CourseListItem } from "@/lib/api/courses";

export default function CoursePrerequisiteSelect({
  value,
  options,
  onChange,
}: {
  value: string | null;
  options: CourseListItem[];
  onChange: (id: string | null) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
        Prerequisite course
      </label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={fieldCls}>
        <option value="">None — open to everyone</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-xs text-gray-400 dark:text-white/40">
        Members must score 100% on the prerequisite's exam before they can enroll in this course.
      </p>
    </div>
  );
}
