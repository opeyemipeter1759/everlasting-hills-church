"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { apiClient } from "@/lib/api/axios";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SavedStatus = "YES" | "NO" | "ALREADY";
export type NextAction = "FOLLOW_UP_CALL" | "CALL_BACK" | "NEEDS_VISIT" | "INVITE";
export type ContactStatus =
  | "NEW"
  | "CALL_DONE"
  | "CALL_BACK"
  | "NEEDS_VISIT"
  | "VISITED"
  | "INVITED"
  | "ATTENDED"
  | "JOINED"
  | "NOT_INTERESTED";
export type ActionKind = "CALL" | "VISIT" | "MESSAGE" | "NOTE";
export type FollowUpFlag = "DUE" | "OVERDUE" | "REVIEW";
export type ReviewOutcome = "HANDED_OVER" | "EXTENDED" | "CLOSED";
export type TaskType = "CALL" | "VISIT" | "INVITE" | "PRAYER" | "OTHER";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface EvangelismMe {
  unitId: string;
  canLead: boolean;
  memberId: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  photoUrl: string | null;
  isLead: boolean;
  isAssistant: boolean;
}

export interface WindowState {
  day: number;
  of: number;
  open: boolean;
  flag: FollowUpFlag | null;
  nextDueAt: string | null;
}

export interface ContactRow {
  id: string;
  name: string;
  phone: string;
  address: string;
  savedStatus: SavedStatus;
  isStudent: boolean;
  school: string | null;
  level: string | null;
  worker: { id: string | null; name: string; photoUrl: string | null };
  outreach: { id: string; name: string } | null;
  contactDate: string;
  daysSinceContact: number;
  nextAction: NextAction | null;
  consent: boolean;
  status: ContactStatus;
  callBackAt: string | null;
  lastActionAt: string | null;
  windowEndsAt: string;
  reviewOutcome: ReviewOutcome | null;
  reviewedAt: string | null;
  closedAt: string | null;
  invitedAt: string | null;
  attendedAt: string | null;
  source: "FORM" | "DASHBOARD";
  activityCount: number;
  window: WindowState;
}

export interface ContactActivity {
  id: string;
  kind: "CREATED" | ActionKind | "STATUS" | "EDIT" | "REVIEW";
  outcome: string | null;
  note: string | null;
  statusFrom: ContactStatus | null;
  statusTo: ContactStatus | null;
  happenedAt: string;
  actor: { id: string | null; name: string };
}

export interface ContactDetail extends ContactRow {
  discussion: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  updatedAt: string;
  activities: ContactActivity[];
  tasks: {
    id: string;
    title: string;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt: string | null;
    overdue: boolean;
    assignees: { id: string; name: string }[];
  }[];
  testimonies: { id: string; title: string; date: string; approved: boolean }[];
}

export interface ContactFilters {
  search?: string;
  workerMemberId?: string;
  outreachId?: string;
  savedStatus?: SavedStatus | "";
  isStudent?: boolean;
  status?: ContactStatus | "";
  flag?: FollowUpFlag | "";
  mine?: boolean;
  from?: string;
  to?: string;
  take?: number;
  skip?: number;
}

export interface ContactInput {
  name: string;
  phone: string;
  address: string;
  savedStatus: SavedStatus;
  isStudent: boolean;
  school?: string;
  level?: string;
  discussion?: string;
  workerMemberId?: string;
  workerName?: string;
  outreachId?: string;
  contactDate?: string;
  nextAction?: NextAction;
  consent: boolean;
}

export interface EvangelismSummary {
  reached: number;
  reachedThisMonth: number;
  saved: number;
  savedThisMonth: number;
  pendingFollowUps: number;
  dueFollowUps: number;
  overdueFollowUps: number;
  awaitingReview: number;
  visitationsNeeded: number;
  invited: number;
  attended: number;
  mine: { inWindow: number; overdue: number; openTasks: number; overdueTasks: number };
}

export interface EvangelismTask {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  completedAt: string | null;
  overdue: boolean;
  contact: { id: string; name: string } | null;
  assignees: { id: string; name: string; photoUrl: string | null }[];
  createdBy: string | null;
  createdAt: string;
  notes: { id: string; body: string; author: { id: string | null; name: string }; createdAt: string }[];
}

export interface TaskInput {
  title: string;
  description?: string;
  contactId?: string;
  type: TaskType;
  dueAt?: string;
  priority?: TaskPriority;
  assigneeIds: string[];
}

export interface Tally {
  reached: number;
  saved: number;
  students: number;
}

export interface Outreach extends Tally {
  id: string;
  name: string;
  date: string;
  location: string | null;
  description: string | null;
  active: boolean;
  workers: { id: string; name: string }[];
}

export interface OutreachDetail extends Outreach {
  byWorker: { id: string | null; name: string; reached: number; saved: number; students: number }[];
  contacts: ContactRow[];
}

export interface OutreachInput {
  name: string;
  date: string;
  location?: string;
  description?: string;
  active?: boolean;
  workerIds?: string[];
}

export interface FieldTestimony {
  id: string;
  title: string;
  body: string;
  date: string;
  photoUrl: string | null;
  contact: { id: string; name: string } | null;
  outreach: { id: string; name: string } | null;
  worker: { id: string | null; name: string } | null;
  approved: boolean;
  approvedAt: string | null;
  approvedByName: string | null;
  submittedBy: { id: string | null; name: string };
  createdAt: string;
}

export interface TestimonyInput {
  title: string;
  body: string;
  date?: string;
  contactId?: string;
  outreachId?: string;
  workerMemberId?: string;
  photoUrl?: string;
}

export type PerformanceRange = "month" | "quarter" | "all";

export interface PerformanceRow {
  id: string;
  name: string;
  photoUrl: string | null;
  onTeam: boolean;
  preached: number;
  saved: number;
  followUpsDone: number;
  followUpsPending: number;
  tasksDone: number;
  tasksPending: number;
  outreaches: number;
}

export interface PublicFormOptions {
  workers: { id: string; name: string }[];
  outreaches: { id: string; name: string; date: string }[];
}

// ── Keys ──────────────────────────────────────────────────────────────────────

const ROOT = ["evangelism"] as const;
const K = {
  me: [...ROOT, "me"] as const,
  team: [...ROOT, "team"] as const,
  summary: [...ROOT, "summary"] as const,
  contacts: (f: ContactFilters) => [...ROOT, "contacts", f] as const,
  contact: (id: string) => [...ROOT, "contact", id] as const,
  tasks: (scope: string) => [...ROOT, "tasks", scope] as const,
  outreaches: [...ROOT, "outreaches"] as const,
  outreach: (id: string) => [...ROOT, "outreach", id] as const,
  testimonies: [...ROOT, "testimonies"] as const,
  performance: (range: PerformanceRange) => [...ROOT, "performance", range] as const,
};

/** Almost every change moves a number somewhere else on the page. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ROOT });
}

/** Drop empty filters so the query string (and the cache key) stays clean. */
function clean<T extends object>(f: T): Partial<T> {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== "" && v !== undefined && v !== null)) as Partial<T>;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useEvangelismMe() {
  return useQuery({ queryKey: K.me, queryFn: () => api.get<EvangelismMe>("/evangelism/me"), retry: false, staleTime: 5 * 60_000 });
}

export function useEvangelismTeam(enabled = true) {
  return useQuery({ queryKey: K.team, queryFn: () => api.get<TeamMember[]>("/evangelism/team"), enabled, staleTime: 60_000 });
}

export function useEvangelismSummary() {
  return useQuery({ queryKey: K.summary, queryFn: () => api.get<EvangelismSummary>("/evangelism/summary") });
}

export function useEvangelismContacts(filters: ContactFilters) {
  const params = clean(filters);
  return useQuery({
    queryKey: K.contacts(params),
    queryFn: () => api.get<{ data: ContactRow[]; total: number }>("/evangelism/contacts", params),
    placeholderData: keepPreviousData,
  });
}

/** Every matching row, for the CSV export. */
export function fetchAllContacts(filters: ContactFilters) {
  return api.get<{ data: ContactRow[]; total: number }>("/evangelism/contacts", clean({ ...filters, take: 5000, skip: 0 }));
}

export function useEvangelismContact(id: string | null) {
  return useQuery({
    queryKey: K.contact(id ?? ""),
    queryFn: () => api.get<ContactDetail>(`/evangelism/contacts/${id}`),
    enabled: !!id,
  });
}

export function useEvangelismTasks(scope: "mine" | "all", enabled = true) {
  return useQuery({
    queryKey: K.tasks(scope),
    queryFn: () => api.get<EvangelismTask[]>("/evangelism/tasks", { scope }),
    enabled,
  });
}

export function useOutreaches() {
  return useQuery({
    queryKey: K.outreaches,
    queryFn: () => api.get<{ outreaches: Outreach[]; personal: Tally }>("/evangelism/outreaches"),
  });
}

export function useOutreach(id: string | null) {
  return useQuery({
    queryKey: K.outreach(id ?? ""),
    queryFn: () => api.get<OutreachDetail>(`/evangelism/outreaches/${id}`),
    enabled: !!id,
  });
}

export function useFieldTestimonies() {
  return useQuery({ queryKey: K.testimonies, queryFn: () => api.get<FieldTestimony[]>("/evangelism/testimonies") });
}

export function usePerformance(range: PerformanceRange) {
  return useQuery({
    queryKey: K.performance(range),
    queryFn: () => api.get<PerformanceRow[]>("/evangelism/performance", { range }),
  });
}

export function usePublicFormOptions() {
  return useQuery({
    queryKey: [...ROOT, "form-options"],
    queryFn: () => api.get<PublicFormOptions>("/evangelism/form/options"),
    staleTime: 10 * 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useSubmitPublicContact() {
  return useMutation({
    mutationFn: (body: ContactInput & { website?: string }) => api.post<{ ok: true }>("/evangelism/form", body),
  });
}

export function useCreateContact() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (body: ContactInput) => api.post<{ id: string }>("/evangelism/contacts", body),
    onSuccess: invalidate,
  });
}

/** An edit: the optional fields can be cleared (null). */
export type ContactUpdate = Partial<
  Omit<ContactInput, "school" | "level" | "discussion" | "outreachId" | "workerMemberId" | "nextAction">
> & {
  school?: string | null;
  level?: string | null;
  discussion?: string | null;
  outreachId?: string | null;
  workerMemberId?: string | null;
  nextAction?: NextAction | null;
};

export function useUpdateContact() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, ...body }: ContactUpdate & { id: string }) => api.patch<ContactDetail>(`/evangelism/contacts/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteContact() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/evangelism/contacts/${id}`),
    onSuccess: invalidate,
  });
}

export interface ActionInput {
  kind?: ActionKind;
  outcome?: string;
  note?: string;
  status?: ContactStatus;
  callBackAt?: string;
  happenedAt?: string;
}

export function useLogContactAction() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, ...body }: ActionInput & { id: string }) => api.post<ContactDetail>(`/evangelism/contacts/${id}/actions`, clean(body)),
    onSuccess: invalidate,
  });
}

export function useReviewContact() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; outcome: ReviewOutcome; extendDays?: number; note?: string }) =>
      api.post<ContactDetail>(`/evangelism/contacts/${id}/review`, clean(body)),
    onSuccess: invalidate,
  });
}

export function useCreateTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (body: TaskInput) => api.post<EvangelismTask>("/evangelism/tasks", clean(body)),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<Omit<TaskInput, "dueAt" | "description" | "contactId">> & {
      status?: TaskStatus;
      dueAt?: string | null;
      description?: string | null;
      contactId?: string | null;
    }) => api.patch<EvangelismTask>(`/evangelism/tasks/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useAddTaskNote() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.post<EvangelismTask>(`/evangelism/tasks/${id}/notes`, { body }),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: string) => api.delete(`/evangelism/tasks/${id}`), onSuccess: invalidate });
}

export function useSaveOutreach() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, ...body }: OutreachInput & { id?: string }) =>
      id ? api.patch<{ id: string }>(`/evangelism/outreaches/${id}`, body) : api.post<{ id: string }>("/evangelism/outreaches", clean(body)),
    onSuccess: invalidate,
  });
}

export function useDeleteOutreach() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: string) => api.delete(`/evangelism/outreaches/${id}`), onSuccess: invalidate });
}

/** Create (no id) or edit; on an edit, links and the photo can be cleared (null). */
export type TestimonySave = Partial<Omit<TestimonyInput, "contactId" | "outreachId" | "workerMemberId" | "photoUrl">> & {
  id?: string;
  approved?: boolean;
  contactId?: string | null;
  outreachId?: string | null;
  workerMemberId?: string | null;
  photoUrl?: string | null;
};

export function useSaveTestimony() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, ...body }: TestimonySave) =>
      id
        ? api.patch<FieldTestimony>(`/evangelism/testimonies/${id}`, body)
        : api.post<FieldTestimony>("/evangelism/testimonies", clean(body)),
    onSuccess: invalidate,
  });
}

export function useDeleteTestimony() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: string) => api.delete(`/evangelism/testimonies/${id}`), onSuccess: invalidate });
}

export async function uploadTestimonyPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<{ url: string }>("/evangelism/testimonies/photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}
