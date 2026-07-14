"use client";

import type { Course } from "./courses-data";

// Frontend-only member progress tracking (localStorage) — swap for a real mutation
// once the courses backend ships. Kept isolated here so that swap only touches this file.
const PROGRESS_KEY = "ehc-course-progress";

export interface CourseProgress {
  enrolled: boolean;
  /** True only once the exam has been passed with a perfect score. */
  completed: boolean;
  lastScorePct: number | null;
  attempts: number;
}

export type ProgressMap = Record<string, CourseProgress>;
export type CourseStatus = "locked" | "available" | "enrolled" | "completed";

function defaultProgress(): CourseProgress {
  return { enrolled: false, completed: false, lastScorePct: null, attempts: 0 };
}

function readProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeProgress(progress: ProgressMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getProgressMap(): ProgressMap {
  return readProgress();
}

export function enrollInCourse(courseId: string): void {
  const progress = readProgress();
  progress[courseId] = { ...(progress[courseId] ?? defaultProgress()), enrolled: true };
  writeProgress(progress);
}

/** Records an exam attempt; the course only becomes `completed` on a perfect score. */
export function recordExamAttempt(courseId: string, scorePct: number): CourseProgress {
  const progress = readProgress();
  const prev = progress[courseId] ?? defaultProgress();
  const next: CourseProgress = {
    ...prev,
    enrolled: true,
    attempts: prev.attempts + 1,
    lastScorePct: scorePct,
    completed: prev.completed || scorePct === 100,
  };
  progress[courseId] = next;
  writeProgress(progress);
  return next;
}

/** A course is locked if it has a prerequisite that hasn't been passed at 100% yet. */
export function isCourseUnlocked(course: Course, allCourses: Course[], progress: ProgressMap): boolean {
  if (!course.prerequisiteSlug) return true;
  const prereq = allCourses.find((c) => c.slug === course.prerequisiteSlug);
  if (!prereq) return true; // dangling reference — fail open rather than lock forever
  return progress[prereq.id]?.completed ?? false;
}

export function getCourseStatus(course: Course, allCourses: Course[], progress: ProgressMap): CourseStatus {
  if (!isCourseUnlocked(course, allCourses, progress)) return "locked";
  const p = progress[course.id];
  if (p?.completed) return "completed";
  if (p?.enrolled) return "enrolled";
  return "available";
}
