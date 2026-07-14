"use client";

import slugify from "slugify";
import {
  ICON_OPTIONS,
  SEED_COURSES,
  type Course,
  type CourseLevel,
  type CourseModule,
  type ExamQuestion,
} from "./courses-data";

// Admin edits are stored as overrides keyed by course id and layered on top of the
// base course (seed or custom) at read time. We deliberately don't persist the whole
// Course object — `icon` is a component reference and can't survive JSON.
const OVERRIDES_KEY = "ehc-course-overrides";
// Fully admin-created courses — everything except `icon` (stored as `iconKey`) is
// plain JSON-safe data.
const CUSTOM_KEY = "ehc-course-catalog-custom";

/** Every field an admin can edit on a course, whether it's seed or admin-created. */
export interface CourseOverride {
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: CourseLevel;
  iconKey: string;
  gradient: [string, string];
  duration: string;
  instructor: { name: string; role: string };
  outcomes: string[];
  curriculum: CourseModule[];
  prerequisiteSlug: string | null;
  exam: ExamQuestion[];
}

export type NewCourseInput = CourseOverride;

function countLessons(curriculum: CourseModule[]): number {
  return curriculum.reduce((sum, m) => sum + m.lessons.length, 0);
}

export interface StoredCourse extends Omit<Course, "icon"> {
  iconKey: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readOverrides(): Record<string, CourseOverride> {
  return readJson(OVERRIDES_KEY, {});
}

function writeOverrides(overrides: Record<string, CourseOverride>) {
  writeJson(OVERRIDES_KEY, overrides);
}

function applyOverride(course: Course, overrides: Record<string, CourseOverride>): Course {
  const o = overrides[course.id];
  if (!o) return course;
  return {
    ...course,
    ...o,
    icon: ICON_OPTIONS[o.iconKey] ?? course.icon,
    lessonsCount: countLessons(o.curriculum),
  };
}

function readCustomCourses(): StoredCourse[] {
  return readJson(CUSTOM_KEY, []);
}

function writeCustomCourses(courses: StoredCourse[]) {
  writeJson(CUSTOM_KEY, courses);
}

function resolveIcon(stored: StoredCourse): Course {
  const { iconKey, ...rest } = stored;
  return { ...rest, icon: ICON_OPTIONS[iconKey] ?? ICON_OPTIONS.BookOpen };
}

/** Reverse-lookup so the editor can preselect a course's current icon. */
export function getIconKeyForCourse(course: Course): string {
  const entry = Object.entries(ICON_OPTIONS).find(([, Icon]) => Icon === course.icon);
  return entry?.[0] ?? "BookOpen";
}

/** The live catalog — seed courses + any admin-created courses, edits applied on top. */
export function getCatalog(): Course[] {
  const overrides = readOverrides();
  const seeded = SEED_COURSES.map((c) => applyOverride(c, overrides));
  const custom = readCustomCourses()
    .map(resolveIcon)
    .map((c) => applyOverride(c, overrides));
  return [...seeded, ...custom];
}

export function getCourseBySlug(slug: string): Course | undefined {
  return getCatalog().find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return getCatalog().find((c) => c.id === id);
}

export function getCourseCategories(courses: Course[]): string[] {
  return Array.from(new Set(courses.map((c) => c.category)));
}

export function isCustomCourse(courseId: string): boolean {
  return courseId.startsWith("custom-");
}

/** Admin: persist every editable field for a course (any course, seed or custom). */
export function saveCourseAdmin(courseId: string, patch: CourseOverride): void {
  const overrides = readOverrides();
  overrides[courseId] = patch;
  writeOverrides(overrides);
}

function uniqueSlug(base: string, existing: Course[]): string {
  const root = base || "course";
  let slug = root;
  let n = 2;
  while (existing.some((c) => c.slug === slug)) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}

/** Admin: author a brand-new course — core fields, curriculum, prerequisite and exam all at once. */
export function createCourse(input: NewCourseInput): Course {
  const catalog = getCatalog();

  const stored: StoredCourse = {
    id: `custom-${Date.now()}`,
    slug: uniqueSlug(slugify(input.title, { lower: true, strict: true }), catalog),
    title: input.title,
    tagline: input.tagline,
    description: input.description,
    category: input.category,
    level: input.level,
    iconKey: input.iconKey,
    gradient: input.gradient,
    duration: input.duration,
    lessonsCount: countLessons(input.curriculum),
    studentsCount: 0,
    instructor: input.instructor,
    outcomes: input.outcomes,
    curriculum: input.curriculum,
    prerequisiteSlug: input.prerequisiteSlug,
    exam: input.exam,
  };

  writeCustomCourses([...readCustomCourses(), stored]);
  return resolveIcon(stored);
}

/** Admin: remove a course this tool created. Seed courses can't be deleted this way. */
export function deleteCustomCourse(courseId: string): void {
  writeCustomCourses(readCustomCourses().filter((c) => c.id !== courseId));
}
