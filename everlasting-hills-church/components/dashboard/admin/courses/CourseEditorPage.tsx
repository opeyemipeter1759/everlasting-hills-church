"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Check, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { fieldCls } from "@/components/ui/overlay/FormModal";
import {
  createCourse,
  getCatalog,
  getIconKeyForCourse,
  saveCourseAdmin,
  type CourseOverride,
} from "@/lib/courses-catalog";
import {
  GRADIENT_PRESETS,
  ICON_OPTIONS,
  type Course,
  type CourseLevel,
  type ExamQuestion,
} from "@/lib/courses-data";
import CurriculumEditor from "./CurriculumEditor";

const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

function blankQuestion(): ExamQuestion {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
  };
}

function gradientIndexFor(course: Course | undefined): number {
  if (!course) return 0;
  const i = GRADIENT_PRESETS.findIndex(([f, t]) => f === course.gradient[0] && t === course.gradient[1]);
  return i === -1 ? 0 : i;
}

export default function CourseEditorPage({ mode, course }: { mode: "create" | "edit"; course?: Course }) {
  const router = useRouter();
  const allCourses = useMemo(getCatalog, []);

  const [title, setTitle] = useState(course?.title ?? "");
  const [tagline, setTagline] = useState(course?.tagline ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [category, setCategory] = useState(course?.category ?? "");
  const [level, setLevel] = useState<CourseLevel>(course?.level ?? "Beginner");
  const [duration, setDuration] = useState(course?.duration ?? "");
  const [instructorName, setInstructorName] = useState(course?.instructor.name ?? "");
  const [instructorRole, setInstructorRole] = useState(course?.instructor.role ?? "");
  const [iconKey, setIconKey] = useState(course ? getIconKeyForCourse(course) : "BookOpen");
  const [gradientIndex, setGradientIndex] = useState(gradientIndexFor(course));
  const [outcomes, setOutcomes] = useState<string[]>(course?.outcomes.length ? course.outcomes : [""]);
  const [curriculum, setCurriculum] = useState(course?.curriculum ?? []);
  const [prerequisiteSlug, setPrerequisiteSlug] = useState<string | null>(course?.prerequisiteSlug ?? null);
  const [questions, setQuestions] = useState<ExamQuestion[]>(course?.exam ?? []);

  const coreValid = !!(title.trim() && tagline.trim() && category.trim() && duration.trim() && instructorName.trim());
  const examValid = !questions.some((q) => !q.question.trim() || q.options.some((o) => !o.trim()));
  const canSave = coreValid && examValid;

  const prerequisiteOptions = allCourses.filter(
    (c) => c.id !== course?.id && c.prerequisiteSlug !== course?.slug,
  );

  function updateQuestion(id: string, patch: Partial<ExamQuestion>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function updateOption(qId: string, optIndex: number, value: string) {
    setQuestions((qs) =>
      qs.map((q) => (q.id === qId ? { ...q, options: q.options.map((o, i) => (i === optIndex ? value : o)) } : q)),
    );
  }

  function updateOutcome(i: number, value: string) {
    setOutcomes((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function handleSave() {
    if (!canSave) return;

    const patch: CourseOverride = {
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      category: category.trim(),
      level,
      iconKey,
      gradient: GRADIENT_PRESETS[gradientIndex],
      duration: duration.trim(),
      instructor: { name: instructorName.trim(), role: instructorRole.trim() },
      outcomes: outcomes.map((o) => o.trim()).filter(Boolean),
      curriculum: curriculum
        .map((m) => ({ title: m.title.trim(), lessons: m.lessons.filter((l) => l.title.trim()) }))
        .filter((m) => m.title && m.lessons.length > 0),
      prerequisiteSlug,
      exam: questions,
    };

    if (mode === "create") {
      const created = createCourse(patch);
      toast.success(`"${created.title}" added to the catalog`);
    } else if (course) {
      saveCourseAdmin(course.id, patch);
      toast.success(`"${patch.title}" saved`);
    }

    router.push("/dashboard/admin/courses");
  }

  return (
    <div className="max-w-3xl space-y-5 pb-24">
      <button
        type="button"
        onClick={() => router.push("/dashboard/admin/courses")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} /> Courses
      </button>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a] mb-1.5">
          {mode === "create" ? "New Course" : "Edit Course"}
        </p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          {mode === "create" ? "Add a course" : title || "Untitled course"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
          Core details, lesson videos, the prerequisite, and the pass/fail exam — all in one place.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Details</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Title
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Fruit of Patience" className={fieldCls} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Tagline
            </label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="One line that sells the course"
              className={fieldCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this course is about"
              className={`${fieldCls} resize-none`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Category
            </label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Bible Study" className={fieldCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Level
            </label>
            <select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)} className={fieldCls}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Duration
            </label>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 4 weeks" className={fieldCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Instructor name
            </label>
            <input
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="e.g. Pastor Opeyemi Peter"
              className={fieldCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Instructor role
            </label>
            <input
              value={instructorRole}
              onChange={(e) => setInstructorRole(e.target.value)}
              placeholder="e.g. Lead Pastor"
              className={fieldCls}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ICON_OPTIONS).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setIconKey(key)}
                title={key}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                  iconKey === key
                    ? "border-[#87102C] bg-[#87102C]/10 text-[#87102C] dark:text-[#e8768a]"
                    : "border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300"
                }`}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
            Cover color
          </label>
          <div className="flex flex-wrap gap-2">
            {GRADIENT_PRESETS.map(([from, to], i) => (
              <button
                key={from + to}
                type="button"
                onClick={() => setGradientIndex(i)}
                className="relative h-10 w-10 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                {gradientIndex === i && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl ring-2 ring-white/80 ring-offset-2 ring-offset-white dark:ring-offset-[#161618]">
                    <Check size={15} className="text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
            What you'll learn
          </label>
          <button
            type="button"
            onClick={() => setOutcomes((o) => [...o, ""])}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:text-[#6E0C24] dark:text-[#e8768a]"
          >
            <Plus size={13} /> Add outcome
          </button>
        </div>
        <div className="space-y-2">
          {outcomes.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={o}
                onChange={(e) => updateOutcome(i, e.target.value)}
                placeholder="e.g. Build a daily prayer rhythm"
                className={`${fieldCls} flex-1`}
              />
              <button
                type="button"
                onClick={() => setOutcomes((prev) => prev.filter((_, idx) => idx !== i))}
                className="flex-shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <CurriculumEditor curriculum={curriculum} onChange={setCurriculum} />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
          Prerequisite course
        </label>
        <select
          value={prerequisiteSlug ?? ""}
          onChange={(e) => setPrerequisiteSlug(e.target.value || null)}
          className={fieldCls}
        >
          <option value="">None — open to everyone</option>
          {prerequisiteOptions.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-white/40">
          Members must score 100% on the prerequisite's exam before they can enroll in this course.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
            Exam questions ({questions.length})
          </h2>
          <button
            type="button"
            onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:text-[#6E0C24] dark:text-[#e8768a]"
          >
            <Plus size={13} /> Add question
          </button>
        </div>

        {questions.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-6 text-center text-xs text-gray-400 dark:text-white/40">
            No exam questions yet — members can enroll and complete this course without a test.
          </p>
        )}

        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={q.id} className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <div className="mb-2.5 flex items-start gap-2">
                <input
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                  placeholder={`Question ${qi + 1}`}
                  className={`${fieldCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                  title="Remove question"
                  className="flex-shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, { correctIndex: oi })}
                      title="Mark as the correct answer"
                      className="flex-shrink-0 text-gray-300 hover:text-emerald-600 dark:text-white/20"
                    >
                      {q.correctIndex === oi ? (
                        <CheckCircle2 size={17} className="text-emerald-500" />
                      ) : (
                        <Circle size={17} />
                      )}
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(q.id, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className={`${fieldCls} flex-1 py-2 text-sm`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-sm p-4 shadow-lg">
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin/courses")}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mode === "create" ? "Create Course" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
