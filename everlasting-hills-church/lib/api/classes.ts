"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Learner ──────────────────────────────────────────────────────────────────

export type MembershipStatus = "IN_TRAINING" | "FULL";
export type EnrollmentStatus = "WAITING" | "ACTIVE" | "COMPLETED";
export type LessonStatus = "locked" | "not_started" | "in_progress" | "done";
export type ActionVerification = "SELF" | "LEADER";

export interface Eligibility {
  required: number;
  attended: number;
  eligible: boolean;
  remaining: number;
}

export interface ClassListItem {
  slug: string;
  title: string;
  tagline: string;
  duration: string;
  totalLessons: number;
  eligibility: Eligibility;
  requiresFullMembership: boolean;
  prerequisiteMet: boolean;
  enrollment: { status: EnrollmentStatus; completedLessons: number; progressPct: number; completedAt: string | null } | null;
}

export interface ClassList {
  membershipStatus: MembershipStatus;
  classes: ClassListItem[];
}

export interface LessonRef {
  week: number;
  slug: string;
  title: string;
}

export interface ClassSession {
  id: string;
  title: string;
  weekNumber: number | null;
  startsAt: string;
  location: string | null;
}

export interface ClassHome {
  class: {
    id: string;
    slug: string;
    title: string;
    tagline: string;
    description: string;
    duration: string;
    grantsMembership: boolean;
    weeks: {
      number: number;
      title: string;
      subtitle: string | null;
      stage: string | null;
      lessons: { id: string; slug: string; number: number; title: string; description: string | null; status: LessonStatus }[];
    }[];
  };
  membershipStatus: MembershipStatus;
  eligibility: Eligibility;
  prerequisite: { title: string; slug: string; met: boolean } | null;
  canEnroll: boolean;
  blocker: string | null;
  enrollment: {
    status: EnrollmentStatus;
    enrolledAt: string;
    completedAt: string | null;
    completedLessons: number;
    totalLessons: number;
    progressPct: number;
    currentWeek: number;
    next: LessonRef | null;
    cohort: {
      name: string;
      startsOn: string;
      minSessions: number;
      sessionsAttended: number;
      nextSession: ClassSession | null;
    } | null;
  } | null;
  actions: {
    lessonId: string;
    week: number;
    lessonSlug: string;
    lessonTitle: string;
    step: string;
    verification: ActionVerification;
    doneAt: string | null;
    verifiedAt: string | null;
  }[];
}

export interface Scripture {
  ref: string;
  text?: string;
}

export interface LessonView {
  class: { slug: string; title: string };
  lesson: {
    id: string;
    slug: string;
    week: number;
    number: number;
    weekTitle: string | null;
    title: string;
    description: string | null;
    duration: string;
    outcome: string | null;
    videoUrl: string | null;
    scriptures: Scripture[];
    summary: string | null;
    reflectionPrompt: string | null;
    actionStep: string | null;
    actionVerification: ActionVerification;
    /** Options only. The correct answers never reach the browser. */
    quiz: { id: string; prompt: string; options: string[] }[];
  };
  progress: {
    status: LessonStatus;
    videoDone: boolean;
    quizScorePct: number | null;
    quizPassed: boolean;
    quizAttempts: number;
    reflection: string;
    actionDone: boolean;
    actionVerified: boolean;
    completed: boolean;
  };
  previous: LessonRef | null;
  next: LessonRef | null;
}

export interface QuizResult {
  scorePct: number;
  passed: boolean;
  right: number;
  total: number;
  results: boolean[];
  completed: boolean;
}

export interface Certificate {
  name: string;
  classTitle: string;
  completedAt: string;
  grantsMembership: boolean;
  membershipStatus: MembershipStatus;
  membershipConfirmedAt: string | null;
}

export interface FacilitatedCohort {
  id: string;
  name: string;
  startsOn: string;
  status: string;
  Course: { title: string; slug: string };
  _count: { Enrollments: number };
}

const keys = {
  all: ["classes"] as const,
  list: ["classes", "list"] as const,
  home: (slug: string) => ["classes", "home", slug] as const,
  lesson: (slug: string, lesson: string) => ["classes", "lesson", slug, lesson] as const,
  certificate: (slug: string) => ["classes", "certificate", slug] as const,
  facilitating: ["classes", "facilitating"] as const,
};

export function useClasses() {
  return useQuery({ queryKey: keys.list, queryFn: () => api.get<ClassList>("/classes") });
}

export function useClassHome(slug: string) {
  return useQuery({ queryKey: keys.home(slug), queryFn: () => api.get<ClassHome>(`/classes/${slug}`) });
}

export function useEnroll(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ClassHome>(`/classes/${slug}/enroll`),
    onSuccess: (home) => {
      qc.setQueryData(keys.home(slug), home);
      qc.invalidateQueries({ queryKey: keys.list });
    },
  });
}

export function useLesson(slug: string, lesson: string) {
  return useQuery({ queryKey: keys.lesson(slug, lesson), queryFn: () => api.get<LessonView>(`/classes/${slug}/lessons/${lesson}`) });
}

function useLessonMutation<TBody, TResult>(slug: string, lesson: string, send: (body: TBody) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: send,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.lesson(slug, lesson) });
      qc.invalidateQueries({ queryKey: keys.home(slug) });
      qc.invalidateQueries({ queryKey: keys.list });
    },
  });
}

export function useMarkVideo(slug: string, lesson: string) {
  return useLessonMutation(slug, lesson, () => api.post<{ completed: boolean }>(`/classes/${slug}/lessons/${lesson}/video`));
}

export function useSubmitQuiz(slug: string, lesson: string) {
  return useLessonMutation(slug, lesson, (answers: (number | null)[]) =>
    api.post<QuizResult>(`/classes/${slug}/lessons/${lesson}/quiz`, { answers }),
  );
}

export function useSaveReflection(slug: string, lesson: string) {
  return useLessonMutation(slug, lesson, (text: string) =>
    api.put<{ completed: boolean }>(`/classes/${slug}/lessons/${lesson}/reflection`, { text }),
  );
}

export function useSetAction(slug: string, lesson: string) {
  return useLessonMutation(slug, lesson, (body: { done: boolean; note?: string }) =>
    api.put<{ completed: boolean }>(`/classes/${slug}/lessons/${lesson}/action`, body),
  );
}

export function useCertificate(slug: string) {
  return useQuery({ queryKey: keys.certificate(slug), queryFn: () => api.get<Certificate>(`/classes/${slug}/certificate`), retry: false });
}

export function useFacilitating() {
  return useQuery({ queryKey: keys.facilitating, queryFn: () => api.get<FacilitatedCohort[]>("/classes/facilitating") });
}

// ── Admin and facilitators ───────────────────────────────────────────────────

export interface AdminClass {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  eligibilitySundays: number | null;
  grantsMembership: boolean;
  requiresFullMembership: boolean;
  lessons: number;
  cohorts: number;
  learners: { waiting: number; active: number; completed: number };
}

export interface QuizItem {
  id?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface AdminLesson {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  duration: string;
  outcome: string | null;
  videoUrl: string | null;
  summary: string | null;
  reflectionPrompt: string | null;
  scriptures: Scripture[] | null;
  actionStep: string | null;
  actionVerification: ActionVerification;
  QuizItems: QuizItem[];
}

export interface AdminContent {
  id: string;
  slug: string;
  title: string;
  Modules: { id: string; title: string; subtitle: string | null; stage: string | null; Lessons: AdminLesson[] }[];
}

export interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

export interface AdminCohort {
  id: string;
  name: string;
  startsOn: string;
  status: "OPEN" | "CLOSED";
  minSessions: number;
  Sessions: ClassSession[];
  Facilitators: { Member: PersonRef }[];
  _count: { Enrollments: number };
}

export interface RosterLearner {
  enrollmentId: string;
  member: PersonRef & { name: string; phone: string | null; email: string | null; membershipStatus: MembershipStatus };
  status: EnrollmentStatus;
  completedLessons: number;
  totalLessons: number;
  progressPct: number;
  lastActivityAt: string | null;
  stalled: boolean;
  actions: { id: string; lessonId: string; doneAt: string; note: string | null; verifiedAt: string | null; lessonTitle: string; needsLeader: boolean }[];
}

export interface Roster {
  id: string;
  name: string;
  startsOn: string;
  status: string;
  minSessions: number;
  course: { id: string; title: string; slug: string };
  sessions: (ClassSession & { attendees: string[] })[];
  learners: RosterLearner[];
}

export interface StalledLearner {
  enrollmentId: string;
  member: PersonRef & { name: string; phone: string | null };
  class: { title: string; slug: string };
  cohort: { id: string; name: string };
  lastActivityAt: string | null;
  notifiedAt: string | null;
}

export interface Approval {
  id: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED";
  createdAt: string;
  decidedAt: string | null;
  note: string | null;
  Course: { title: string; slug: string };
  Member: PersonRef & { email: string | null; membershipStatus: MembershipStatus };
}

export interface MemberMembership {
  membershipStatus: MembershipStatus;
  membershipConfirmedAt: string | null;
  creditedSundays: number;
  events: { id: string; fromStatus: string | null; toStatus: string; method: string; reason: string | null; createdAt: string }[];
}

const admin = {
  classes: ["class-admin", "classes"] as const,
  content: (id: string) => ["class-admin", "content", id] as const,
  cohorts: (id: string) => ["class-admin", "cohorts", id] as const,
  roster: (id: string) => ["class-admin", "roster", id] as const,
  stalled: ["class-admin", "stalled"] as const,
  approvals: (status: string) => ["class-admin", "approvals", status] as const,
  membership: (memberId: string) => ["class-admin", "membership", memberId] as const,
};

export function useAdminClasses() {
  return useQuery({ queryKey: admin.classes, queryFn: () => api.get<AdminClass[]>("/class-admin/classes") });
}

export function useClassContent(courseId: string | undefined) {
  return useQuery({
    queryKey: admin.content(courseId ?? ""),
    queryFn: () => api.get<AdminContent>(`/class-admin/classes/${courseId}/content`),
    enabled: !!courseId,
  });
}

export function useUpdateLesson(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, ...body }: { lessonId: string } & Partial<Omit<AdminLesson, "id" | "QuizItems" | "slug">>) =>
      api.patch(`/class-admin/lessons/${lessonId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: admin.content(courseId) }),
  });
}

export function useSetQuiz(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, items }: { lessonId: string; items: QuizItem[] }) =>
      api.put(`/class-admin/lessons/${lessonId}/quiz`, { items: items.map(({ prompt, options, correctIndex }) => ({ prompt, options, correctIndex })) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: admin.content(courseId) }),
  });
}

export function useCohorts(courseId: string | undefined) {
  return useQuery({
    queryKey: admin.cohorts(courseId ?? ""),
    queryFn: () => api.get<AdminCohort[]>(`/class-admin/classes/${courseId}/cohorts`),
    enabled: !!courseId,
  });
}

function useCohortMutation<T>(courseId: string, send: (input: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: send,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: admin.cohorts(courseId) });
      qc.invalidateQueries({ queryKey: admin.classes });
      qc.invalidateQueries({ queryKey: ["class-admin", "roster"] });
    },
  });
}

export function useCreateCohort(courseId: string) {
  return useCohortMutation(courseId, (body: { name: string; startsOn: string; minSessions?: number }) =>
    api.post(`/class-admin/classes/${courseId}/cohorts`, body),
  );
}

export function useUpdateCohort(courseId: string) {
  return useCohortMutation(courseId, ({ cohortId, ...body }: { cohortId: string; name?: string; startsOn?: string; status?: "OPEN" | "CLOSED"; minSessions?: number }) =>
    api.patch(`/class-admin/cohorts/${cohortId}`, body),
  );
}

export function useAddSession(courseId: string) {
  return useCohortMutation(courseId, ({ cohortId, ...body }: { cohortId: string; title: string; weekNumber?: number; startsAt: string; location?: string }) =>
    api.post(`/class-admin/cohorts/${cohortId}/sessions`, body),
  );
}

export function useRemoveSession(courseId: string) {
  return useCohortMutation(courseId, (sessionId: string) => api.delete(`/class-admin/sessions/${sessionId}`));
}

export function useAddFacilitator(courseId: string) {
  return useCohortMutation(courseId, ({ cohortId, memberId }: { cohortId: string; memberId: string }) =>
    api.post(`/class-admin/cohorts/${cohortId}/facilitators`, { memberId }),
  );
}

export function useRemoveFacilitator(courseId: string) {
  return useCohortMutation(courseId, ({ cohortId, memberId }: { cohortId: string; memberId: string }) =>
    api.delete(`/class-admin/cohorts/${cohortId}/facilitators/${memberId}`),
  );
}

export function useRoster(cohortId: string | undefined) {
  return useQuery({
    queryKey: admin.roster(cohortId ?? ""),
    queryFn: () => api.get<Roster>(`/class-admin/cohorts/${cohortId}/roster`),
    enabled: !!cohortId,
  });
}

export function useMarkSession(cohortId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, memberId, present }: { sessionId: string; memberId: string; present: boolean }) =>
      api.put(`/class-admin/sessions/${sessionId}/attendance`, { memberId, present }),
    onSuccess: () => qc.invalidateQueries({ queryKey: admin.roster(cohortId) }),
  });
}

export function useVerifyAction(cohortId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, verified }: { actionId: string; verified: boolean }) =>
      api.put(`/class-admin/actions/${actionId}/verify`, { verified }),
    onSuccess: () => qc.invalidateQueries({ queryKey: admin.roster(cohortId) }),
  });
}

export function useStalled() {
  return useQuery({ queryKey: admin.stalled, queryFn: () => api.get<StalledLearner[]>("/class-admin/stalled") });
}

export function useApprovals(status: "PENDING" | "CONFIRMED" | "DECLINED") {
  return useQuery({ queryKey: admin.approvals(status), queryFn: () => api.get<Approval[]>("/class-admin/approvals", { status }) });
}

export function useDecideApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirm, note }: { id: string; confirm: boolean; note?: string }) =>
      api.post(`/class-admin/approvals/${id}/${confirm ? "confirm" : "decline"}`, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-admin", "approvals"] }),
  });
}

export function useMemberMembership(memberId: string | undefined) {
  return useQuery({
    queryKey: admin.membership(memberId ?? ""),
    queryFn: () => api.get<MemberMembership>(`/class-admin/members/${memberId}/membership`),
    enabled: !!memberId,
  });
}

export function useSetMembership(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: MembershipStatus; reason: string }) => api.put(`/class-admin/members/${memberId}/membership`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: admin.membership(memberId) }),
  });
}

export function useEnrollByException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { memberId: string; courseId: string; cohortId?: string; reason: string }) => api.post("/class-admin/enroll", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-admin"] });
    },
  });
}
