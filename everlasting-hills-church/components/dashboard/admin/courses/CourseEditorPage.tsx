"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, ClipboardList, Info, Layers, ListChecks, Lock, Palette } from "lucide-react";
import { useCourses, useCreateCourse, useUpdateCourse, type CourseAdminDetail, type CourseInput, type ExamQuestionAdmin } from "@/lib/api/courses";
import { GRADIENT_PRESETS } from "@/lib/courses-data";
import CourseDetailsFields, { type CourseFormFields } from "./CourseDetailsFields";
import CourseIconColorPicker from "./CourseIconColorPicker";
import CourseOutcomesEditor from "./CourseOutcomesEditor";
import CurriculumEditor from "./CurriculumEditor";
import CoursePrerequisiteSelect from "./CoursePrerequisiteSelect";
import CourseExamEditor from "./CourseExamEditor";
import CourseEditorPreview from "./CourseEditorPreview";
import CourseEditorSection from "./CourseEditorSection";
import { gradientIndexFor, initialFields } from "./courseEditorUtils";

export default function CourseEditorPage({ mode, course }: { mode: "create" | "edit"; course?: CourseAdminDetail }) {
  const router = useRouter();
  const { data: allCourses = [] } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(course?.id ?? "");
  // Edit mode backs out to that course's detail page; create mode has no detail page yet.
  const goBack = () => router.push(course ? `/dashboard/admin/courses/${course.id}` : "/dashboard/admin/courses");

  const [fields, setFields] = useState<CourseFormFields>(() => initialFields(course));
  const [iconKey, setIconKey] = useState(course?.iconKey ?? "BookOpen");
  const [gradientIndex, setGradientIndex] = useState(gradientIndexFor(course));
  const [outcomes, setOutcomes] = useState<string[]>(course?.outcomes.length ? course.outcomes : [""]);
  const [curriculum, setCurriculum] = useState(course?.curriculum ?? []);
  const [prerequisiteId, setPrerequisiteId] = useState<string | null>(course?.prerequisiteId ?? null);
  const [questions, setQuestions] = useState<ExamQuestionAdmin[]>(course?.exam ?? []);

  function updateFields(patch: Partial<CourseFormFields>) {
    setFields((f) => ({ ...f, ...patch }));
  }

  const coreValid = !!(fields.title.trim() && fields.tagline.trim() && fields.category.trim() && fields.duration.trim() && fields.instructor.name.trim());
  const examValid = !questions.some((q) => !q.question.trim() || q.options.some((o) => !o.trim()));
  const outcomesDone = outcomes.some((o) => o.trim());
  const examDone = questions.length > 0 && examValid;

  const prerequisiteOptions = allCourses.filter((c) => c.id !== course?.id && c.prerequisiteId !== course?.id);
  // A module/lesson with real content should never be silently dropped just because
  // its own title or duration was left blank — fall back to a sensible default instead
  // (the backend requires both non-empty). Only fully-empty modules are discarded.
  const cleanCurriculum = curriculum
    .map((m, mi) => ({
      title: m.title.trim() || `Module ${mi + 1}`,
      lessons: m.lessons
        .filter((l) => l.title.trim())
        .map((l) => ({ ...l, duration: l.duration.trim() || "—" })),
      check:
        m.check && m.check.question.trim() && m.check.options.every((o) => o.trim())
          ? { question: m.check.question.trim(), options: m.check.options.map((o) => o.trim()), correctIndex: m.check.correctIndex }
          : null,
    }))
    .filter((m) => m.lessons.length > 0);
  // Rows were added but every lesson title is still blank — block save instead of
  // silently submitting an empty curriculum (this is exactly what caused the bug
  // where "curriculum: []" showed up despite modules/lessons being added on screen).
  const curriculumValid = curriculum.length === 0 || cleanCurriculum.length > 0;
  const curriculumDone = cleanCurriculum.length > 0;
  // A checkpoint question left half-filled (e.g. an empty option) should block save
  // rather than silently saving as "no checkpoint" — same reasoning as examValid.
  const moduleChecksValid = curriculum.every(
    (m) => !m.check || (m.check.question.trim() && m.check.options.every((o) => o.trim())),
  );
  const canSave = coreValid && examValid && curriculumValid && moduleChecksValid;
  const saving = createCourse.isPending || updateCourse.isPending;
  const prerequisiteTitle = allCourses.find((c) => c.id === prerequisiteId)?.title ?? null;
  const checklist = [coreValid, outcomesDone, curriculumDone, examDone];
  const progress = { done: checklist.filter(Boolean).length, total: checklist.length };

  function handleSave() {
    if (!canSave || saving) return;
    const input: CourseInput = {
      title: fields.title.trim(),
      tagline: fields.tagline.trim(),
      description: fields.description.trim(),
      category: fields.category.trim(),
      duration: fields.duration.trim(),
      instructor: { name: fields.instructor.name.trim(), role: fields.instructor.role.trim() },
      iconKey,
      gradient: GRADIENT_PRESETS[gradientIndex],
      outcomes: outcomes.map((o) => o.trim()).filter(Boolean),
      curriculum: cleanCurriculum,
      prerequisiteId,
      exam: questions.map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex })),
    };

    const onSuccess = (saved: CourseAdminDetail) => {
      toast.success(mode === "create" ? `"${input.title}" added to the catalog` : `"${input.title}" saved`);
      router.push(`/dashboard/admin/courses/${saved.id}`);
    };
    const onError = (err: unknown) => toast.error((err as Error).message || "Couldn't save — try again");

    if (mode === "create") createCourse.mutate(input, { onSuccess, onError });
    else if (course) updateCourse.mutate(input, { onSuccess, onError });
  }

  return (
    <div className="max-w-5xl space-y-5">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} /> Courses
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a] mb-1.5">
            {mode === "create" ? "New Course" : "Edit Course"}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {fields.title || "Untitled course"}
          </h1>
          {fields.tagline && <p className="mt-1 text-sm text-gray-500 dark:text-white/50">{fields.tagline}</p>}
        </div>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-white/50">
          {progress.done}/{progress.total} sections complete
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] items-start">
        <div className="space-y-5">
          <CourseEditorSection icon={Info} label="Details" description="Title, tagline, category and who's teaching it" complete={coreValid}>
            <CourseDetailsFields values={fields} onChange={updateFields} />
          </CourseEditorSection>

          <CourseEditorSection icon={Palette} label="Appearance" description="The icon and cover gradient shown on course cards">
            <CourseIconColorPicker iconKey={iconKey} gradientIndex={gradientIndex} onIconChange={setIconKey} onGradientChange={setGradientIndex} />
          </CourseEditorSection>

          <CourseEditorSection icon={ListChecks} label="Outcomes" description="What a member will be able to do after finishing" complete={outcomesDone}>
            <CourseOutcomesEditor outcomes={outcomes} onChange={setOutcomes} />
          </CourseEditorSection>

          <CourseEditorSection icon={Layers} label="Curriculum" description="Modules and lessons, in the order members complete them" complete={curriculumDone}>
            <CurriculumEditor curriculum={curriculum} onChange={setCurriculum} />
          </CourseEditorSection>

          <CourseEditorSection icon={Lock} label="Prerequisite" description="Optional — a course that must be completed first">
            <CoursePrerequisiteSelect value={prerequisiteId} options={prerequisiteOptions} onChange={setPrerequisiteId} />
          </CourseEditorSection>

          <CourseEditorSection icon={ClipboardList} label="Exam" description="Members must score 100% to complete the course" complete={examDone}>
            <CourseExamEditor questions={questions} onChange={setQuestions} />
          </CourseEditorSection>
        </div>

        <CourseEditorPreview
          title={fields.title}
          tagline={fields.tagline}
          category={fields.category}
          duration={fields.duration}
          lessonsCount={cleanCurriculum.reduce((n, m) => n + m.lessons.length, 0)}
          iconKey={iconKey}
          gradient={GRADIENT_PRESETS[gradientIndex]}
          questionCount={questions.length}
          prerequisiteTitle={prerequisiteTitle}
          mode={mode}
          progress={progress}
          canSave={canSave && !saving}
          saving={saving}
          onSave={handleSave}
          onCancel={goBack}
        />
      </div>
    </div>
  );
}
