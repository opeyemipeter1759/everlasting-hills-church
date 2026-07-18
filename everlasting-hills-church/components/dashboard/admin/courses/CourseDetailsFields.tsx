import { fieldCls } from "@/components/ui/overlay/FormModal";
import { useCourseCategories } from "@/lib/api/courses";

export interface CourseFormFields {
  title: string;
  tagline: string;
  description: string;
  categoryId: string;
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
  const { data: categories = [] } = useCourseCategories();
  const topLevel = categories.filter((c) => !c.parentId);
  const selected = categories.find((c) => c.id === values.categoryId);
  const selectedTopId = selected ? (selected.parentId ?? selected.id) : "";
  const selectedChildId = selected?.parentId ? selected.id : "";
  const children = categories.filter((c) => c.parentId === selectedTopId);

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
        <select value={selectedTopId} onChange={(e) => onChange({ categoryId: e.target.value })} className={fieldCls}>
          <option value="">Select a category</option>
          {topLevel.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {children.length > 0 && (
        <div>
          <label className={LABEL}>Subcategory</label>
          <select value={selectedChildId} onChange={(e) => onChange({ categoryId: e.target.value || selectedTopId })} className={fieldCls}>
            <option value="">All of this category</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

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
