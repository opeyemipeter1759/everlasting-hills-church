"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CourseInstructor {
  name: string;
  role: string;
}

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  iconKey: string;
  gradient: [string, string];
  duration: string;
  instructor: CourseInstructor;
  lessonsCount: number;
  studentsCount: number;
  examQuestionCount: number;
  prerequisiteId: string | null;
  prerequisiteSlug: string | null;
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string | null;
}

/** A module's optional single checkpoint question — options only, no correct answer. */
export interface ModuleCheck {
  question: string;
  options: string[];
}

export interface ModuleCheckAdmin extends ModuleCheck {
  correctIndex: number;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
  check: ModuleCheck | null;
}

/** Admin editor's curriculum shape — checkpoint questions include the correct answer. */
export interface CourseModuleAdmin {
  id: string;
  title: string;
  lessons: CourseLesson[];
  check: ModuleCheckAdmin | null;
}

/** Member-facing detail — exam options only, correct answers never sent to the client. */
export interface CourseDetail extends CourseListItem {
  description: string;
  outcomes: string[];
  curriculum: CourseModule[];
  exam: { id: string; question: string; options: string[] }[];
}

export interface ExamQuestionAdmin {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

/** Admin editor detail — includes exam correct answers and prerequisiteId. */
export interface CourseAdminDetail {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  iconKey: string;
  gradient: [string, string];
  duration: string;
  instructor: CourseInstructor;
  outcomes: string[];
  curriculum: CourseModuleAdmin[];
  prerequisiteId: string | null;
  exam: ExamQuestionAdmin[];
}

export interface CourseInput {
  title: string;
  tagline: string;
  description: string;
  category: string;
  iconKey: string;
  gradient: [string, string];
  duration: string;
  instructor: CourseInstructor;
  outcomes: string[];
  curriculum: { title: string; lessons: CourseLesson[]; check: ModuleCheckAdmin | null }[];
  prerequisiteId: string | null;
  exam: { question: string; options: string[]; correctIndex: number }[];
}

export interface CourseProgress {
  enrolled: boolean;
  completed: boolean;
  completedAt: string | null;
  lastScorePct: number | null;
  attempts: number;
  watchedLessonIds: string[];
  passedModuleIds: string[];
}

export type ProgressMap = Record<string, CourseProgress>;

export type CourseStatus = "locked" | "available" | "enrolled" | "completed";
export type ModuleWatchStatus = "completed" | "in-progress" | "not-started";

/** Every lesson id in the course that actually has a video ("necessary" for exam gating). */
export function getVideoLessonIds(course: { curriculum: CourseModule[] }): string[] {
  return course.curriculum.flatMap((m) => m.lessons.filter((l) => l.videoUrl).map((l) => l.id));
}

export function hasWatchedAllVideos(course: { curriculum: CourseModule[] }, watchedLessonIds: string[]): boolean {
  const required = getVideoLessonIds(course);
  return required.length > 0 && required.every((id) => watchedLessonIds.includes(id));
}

/** Whether a module's checkpoint question (if it has one) has been passed. */
export function isModulePassed(mod: { id: string; check: ModuleCheck | null }, passedModuleIds: string[]): boolean {
  return !mod.check || passedModuleIds.includes(mod.id);
}

/** Every module in the course whose checkpoint question (if any) has been passed. */
export function hasPassedAllModuleChecks(course: { curriculum: CourseModule[] }, passedModuleIds: string[]): boolean {
  return course.curriculum.every((m) => isModulePassed(m, passedModuleIds));
}

/**
 * Sequential gating — a lesson only unlocks once every earlier watchable lesson (in
 * curriculum order) has been watched AND every module before it whose checkpoint
 * question must be passed has been passed. Because curriculum order runs module by
 * module, this also forces module N+1 to stay locked until module N is fully watched
 * and (if it has one) its checkpoint question is answered correctly.
 */
export function isLessonUnlocked(
  course: { curriculum: CourseModule[] },
  lessonId: string,
  watchedLessonIds: string[],
  passedModuleIds: string[] = [],
): boolean {
  const order = getVideoLessonIds(course);
  const pos = order.indexOf(lessonId);
  if (pos <= 0) return true;
  const priorWatched = order.slice(0, pos).every((id) => watchedLessonIds.includes(id));
  if (!priorWatched) return false;

  const modIndex = course.curriculum.findIndex((m) => m.lessons.some((l) => l.id === lessonId));
  const priorModules = course.curriculum.slice(0, modIndex);
  return priorModules.every((m) => isModulePassed(m, passedModuleIds));
}

export function getModuleWatchStatus(mod: CourseModule, watchedLessonIds: string[]): ModuleWatchStatus {
  const videoLessons = mod.lessons.filter((l) => l.videoUrl);
  if (videoLessons.length === 0) return "not-started";
  const watchedCount = videoLessons.filter((l) => watchedLessonIds.includes(l.id)).length;
  if (watchedCount === 0) return "not-started";
  if (watchedCount === videoLessons.length) return "completed";
  return "in-progress";
}

// ── Status helpers (pure — operate on already-fetched data) ─────────────────

export function isCourseUnlocked(
  course: { prerequisiteSlug: string | null },
  allCourses: { slug: string; id: string }[],
  progress: ProgressMap,
): boolean {
  if (!course.prerequisiteSlug) return true;
  const prereq = allCourses.find((c) => c.slug === course.prerequisiteSlug);
  if (!prereq) return true; // dangling reference — fail open rather than lock forever
  return progress[prereq.id]?.completed ?? false;
}

export function getCourseStatus(
  course: { id: string; prerequisiteSlug: string | null },
  allCourses: { slug: string; id: string }[],
  progress: ProgressMap,
): CourseStatus {
  if (!isCourseUnlocked(course, allCourses, progress)) return "locked";
  const p = progress[course.id];
  if (p?.completed) return "completed";
  if (p?.enrolled) return "enrolled";
  return "available";
}

// ── Queries ──────────────────────────────────────────────────────────────────

const KEY = ["courses"] as const;

export function useCourses() {
  return useQuery({
    queryKey: [...KEY, "list"],
    queryFn: () => api.get<CourseListItem[]>("/courses"),
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: [...KEY, "bySlug", slug],
    queryFn: () => api.get<CourseDetail>(`/courses/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useCourseAdmin(id: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "admin", id],
    queryFn: () => api.get<CourseAdminDetail>(`/courses/admin/${id}`),
    enabled: Boolean(id),
  });
}

export function useMyCourseProgress() {
  return useQuery({
    queryKey: [...KEY, "progress", "me"],
    queryFn: () => api.get<ProgressMap>("/courses/progress/me"),
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: CourseInput) => api.post<CourseAdminDetail>("/courses", body),
    onSuccess: invalidate,
  });
}

export function useUpdateCourse(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: CourseInput) => api.patch<CourseAdminDetail>(`/courses/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/courses/${id}`),
    onSuccess: invalidate,
  });
}

export function useEnrollCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.post<{ courseId: string; enrolled: boolean }>(`/courses/${id}/enroll`),
    onSuccess: invalidate,
  });
}

export interface ExamResult {
  scorePct: number;
  correct: number;
  total: number;
  completed: boolean;
}

export function useSubmitExam(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (answers: Record<string, number>) => api.post<ExamResult>(`/courses/${id}/exam/submit`, { answers }),
    onSuccess: invalidate,
  });
}

export function useMarkLessonWatched(courseId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (lessonId: string) =>
      api.post<{ lessonId: string; watched: boolean }>(`/courses/${courseId}/lessons/${lessonId}/watched`),
    onSuccess: invalidate,
  });
}

export interface ModuleCheckResult {
  correct: boolean;
  passed: boolean;
}

export function useSubmitModuleCheck(courseId: string, moduleId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (answer: number) =>
      api.post<ModuleCheckResult>(`/courses/${courseId}/modules/${moduleId}/check/submit`, { answer }),
    onSuccess: invalidate,
  });
}
