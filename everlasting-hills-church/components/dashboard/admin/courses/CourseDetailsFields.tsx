import { fieldCls } from "@/components/ui/overlay/FormModal";
import { LEVEL_LABEL, type CourseLevel } from "@/lib/api/courses";

const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export interface CourseFormFields {
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: CourseLevel;
  duration: string;
  instructor: { name: string; role: string };
}

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40";

export default function CourseDetailsFields({
  values,
  onChange,
}: {
  values: CourseFormFields;
  onChange: (patch: Partial<CourseFormFields>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={LABEL}>Title</label>
        <input value={values.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. The Fruit of Patience" className={fieldCls} />
      </div>

      <div className="sm:col-span-2">
        <label className={LABEL}>Tagline</label>
        <input value={values.tagline} onChange={(e) => onChange({ tagline: e.target.value })} placeholder="One line that sells the course" className={fieldCls} />
      </div>

      <div className="sm:col-span-2">
        <label className={LABEL}>Description</label>
        <textarea
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="What this course is about"
          className={`${fieldCls} resize-none`}
        />
      </div>

      <div>
        <label className={LABEL}>Category</label>
        <input value={values.category} onChange={(e) => onChange({ category: e.target.value })} placeholder="e.g. Bible Study" className={fieldCls} />
      </div>

      <div>
        <label className={LABEL}>Level</label>
        <select value={values.level} onChange={(e) => onChange({ level: e.target.value as CourseLevel })} className={fieldCls}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABEL[l]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>Duration</label>
        <input value={values.duration} onChange={(e) => onChange({ duration: e.target.value })} placeholder="e.g. 4 weeks" className={fieldCls} />
      </div>

      <div>
        <label className={LABEL}>Instructor name</label>
        <input
          value={values.instructor.name}
          onChange={(e) => onChange({ instructor: { ...values.instructor, name: e.target.value } })}
          placeholder="e.g. Pastor Opeyemi Peter"
          className={fieldCls}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={LABEL}>Instructor role</label>
        <input
          value={values.instructor.role}
          onChange={(e) => onChange({ instructor: { ...values.instructor, role: e.target.value } })}
          placeholder="e.g. Lead Pastor"
          className={fieldCls}
        />
      </div>
    </div>
  );
}
