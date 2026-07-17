import { fieldCls } from "@/components/ui/overlay/FormModal";
import type { CourseListItem } from "@/lib/api/courses";
import { Select } from "@/components/ui/select";

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
      <Select
        aria-label="Prerequisite course"
        value={value ?? ""}
        onChange={(v) => onChange(v || null)}
        className={fieldCls}
        options={[
          { value: "", label: "None — open to everyone" },
          ...options.map((c) => ({ value: c.id, label: c.title })),
        ]}
      />
      <p className="mt-1.5 text-xs text-gray-400 dark:text-white/40">
        Members must score 100% on the prerequisite's exam before they can enroll in this course.
      </p>
    </div>
  );
}
