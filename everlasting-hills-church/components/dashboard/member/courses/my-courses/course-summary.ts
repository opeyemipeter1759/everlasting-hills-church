import type { CourseListItem, ProgressMap } from "@/lib/api/courses";

/** How far through a course's lessons the member is, 0–100. */
export function progressPctFor(course: CourseListItem, progress: ProgressMap): number {
  if (course.lessonsCount === 0) return 0;
  const watched = progress[course.id]?.watchedLessonIds.length ?? 0;
  return Math.min(100, Math.round((watched / course.lessonsCount) * 100));
}

/**
 * The member's courses, sorted for the page: enrolled, in progress and
 * completed; the in-progress course furthest along (the hero tile, so a
 * returning member lands on their next step); and their average progress.
 */
export function summarizeCourses(catalog: CourseListItem[], progress: ProgressMap) {
  const enrolled = catalog.filter((c) => progress[c.id]?.enrolled);
  const inProgress = enrolled.filter((c) => !progress[c.id]?.completed);
  const completed = enrolled.filter((c) => progress[c.id]?.completed);
  const featured =
    inProgress.length > 0 ? [...inProgress].sort((a, b) => progressPctFor(b, progress) - progressPctFor(a, progress))[0] : null;
  const restInProgress = featured ? inProgress.filter((c) => c.id !== featured.id) : inProgress;
  const avgProgress =
    enrolled.length > 0
      ? Math.round(enrolled.reduce((sum, c) => sum + (progress[c.id]?.completed ? 100 : progressPctFor(c, progress)), 0) / enrolled.length)
      : 0;
  return { enrolled, inProgress, completed, featured, restInProgress, avgProgress };
}
