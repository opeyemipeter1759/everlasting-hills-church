"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { apiClient } from "@/lib/api/axios";

export type MaritalStatus = "SINGLE" | "MARRIED";

export interface FamilyPerson {
  id: string;
  name: string;
  photoUrl: string | null;
}

/** My marital status, my spouse once they have agreed, and requests either way. */
export interface MySpouse {
  maritalStatus: MaritalStatus;
  spouse: FamilyPerson | null;
  spouseName: string | null;
  pendingSent: { id: string; createdAt: string; to: FamilyPerson } | null;
  pendingReceived: { id: string; createdAt: string; from: FamilyPerson }[];
}

export interface FamilyDirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  units: string[];
}

export interface FamilyDirectoryPage {
  items: FamilyDirectoryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

type DayMonth = { day: number; month: number };

/** A member's profile as the church family sees it: no phone, email or address. */
export interface FamilyProfile {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  bio: string | null;
  gender: string | null;
  joinedAt: string;
  birthday: DayMonth | null;
  maritalStatus: MaritalStatus;
  anniversary: DayMonth | null;
  spouse: FamilyPerson | null;
  spouseName: string | null;
  socials: {
    instagram: string | null;
    facebook: string | null;
    twitter: string | null;
    linkedin: string | null;
    tiktok: string | null;
  };
  units: { id: string; name: string; description: string | null; isLead: boolean; isAssistant: boolean }[];
  stats: ProfileStats;
  badges: ProfileBadge[];
  progress: BadgeProgress[];
  articles: ProfileArticle[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  isMe: boolean;
  restricted?: false;
  /** What the member wrote about themselves, filtered to what this viewer may see. */
  headline: string | null;
  roles: ProfileRole[];
  coverUrl: string | null;
  favouriteVerse: string | null;
  favouriteVerseRef: string | null;
  journey: {
    bornAgainYear: number | null;
    waterBaptismYear: number | null;
    holySpiritYear: number | null;
    membershipClassYear: number | null;
  } | null;
  career: { occupation: string | null; employer: string | null; industry: string | null; skills: string[] } | null;
  gifts: string[];
  interests: string[];
  languages: string[];
  prayerFocus: string | null;
  testimony: string | null;
  openTo: OpenTo[];
  phone: string | null;
}

/** A member who keeps their profile private: only who they are. */
export interface RestrictedProfile {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  headline: string | null;
  roles?: ProfileRole[];
  coverUrl: string | null;
  restricted: true;
  isMe: boolean;
}

/** One thing a member does: "CEO" at "sparkpayhq", shown as CEO @sparkpayhq. */
export interface ProfileRole {
  title: string;
  org: string | null;
  url: string | null;
}

export type OpenTo = "PRAYER_PARTNER" | "MENTOR" | "MENTEE" | "FELLOWSHIP" | "NETWORKING" | "VOLUNTEERING";
export type Visible = "MEMBERS" | "PRIVATE";
export type Visibility = Record<VisibilityKey, Visible>;
export type VisibilityKey = "profile" | "career" | "testimony" | "journey" | "birthday" | "socials" | "phone";

/** My spiritual and career profile, as I edit it. */
export interface ProfileDetails {
  headline: string | null;
  roles: ProfileRole[];
  coverUrl: string | null;
  favouriteVerse: string | null;
  favouriteVerseRef: string | null;
  bornAgainYear: number | null;
  waterBaptismYear: number | null;
  holySpiritYear: number | null;
  membershipClassYear: number | null;
  occupation: string | null;
  employer: string | null;
  industry: string | null;
  skills: string[];
  gifts: string[];
  interests: string[];
  languages: string[];
  prayerFocus: string | null;
  testimony: string | null;
  openTo: OpenTo[];
  visibility: Record<VisibilityKey, Visible>;
}

export interface ProfileStats {
  servicesAttended: number;
  daysInTheWord: number;
  plansFinished: number;
  peopleReached: number;
  soulsWon: number;
  booksRead: number;
  articlesPublished: number;
  coursesCompleted: number;
  badges: number;
  likesReceived: number;
  commentsReceived: number;
}

export type BadgeLevel = "bronze" | "silver" | "gold" | "platinum" | "diamond";
export type BadgeTrack =
  | "attendance"
  | "bibleDays"
  | "plansFinished"
  | "reached"
  | "saved"
  | "salvation"
  | "books"
  | "birthdays"
  | "likes"
  | "comments"
  | "articles"
  | "courses";

export interface ProfileBadge {
  id: string;
  track: BadgeTrack;
  name: string;
  description: string;
  level: BadgeLevel;
  earnedAt: string;
}

export interface BadgeProgress {
  track: BadgeTrack;
  count: number;
  next: { name: string; at: number; description: string } | null;
}

export interface ProfileArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  readingMinutes: number;
  likeCount: number;
  publishedAt: string | null;
}

export interface ProfileComment {
  id: string;
  body: string;
  createdAt: string;
  author: FamilyPerson;
}

export interface ProfileCommentsPage {
  items: ProfileComment[];
  total: number;
  page: number;
  pageSize: number;
}

const SPOUSE_KEY = ["members", "me", "spouse"] as const;

export function useMySpouse() {
  return useQuery({
    queryKey: SPOUSE_KEY,
    queryFn: () => api.get<MySpouse>("/members/me/spouse"),
  });
}

function useSpouseMutation<TArg>(fn: (arg: TArg) => Promise<MySpouse>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      client.setQueryData(SPOUSE_KEY, data);
      client.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useRequestSpouse() {
  return useSpouseMutation((memberId: string) => api.post<MySpouse>("/members/me/spouse-requests", { memberId }));
}

export function useCancelSpouseRequest() {
  return useSpouseMutation<void>(() => api.delete<MySpouse>("/members/me/spouse-requests"));
}

export function useRespondToSpouse() {
  return useSpouseMutation(({ id, accept }: { id: string; accept: boolean }) =>
    api.post<MySpouse>(`/members/me/spouse-requests/${id}/${accept ? "accept" : "decline"}`, {}),
  );
}

export function useUnlinkSpouse() {
  return useSpouseMutation<void>(() => api.delete<MySpouse>("/members/me/spouse"));
}

export function useFamilyDirectory(q: string, page: number) {
  return useQuery({
    queryKey: ["members", "family", q.trim().toLowerCase(), page],
    queryFn: () => api.get<FamilyDirectoryPage>("/members/family", { q: q.trim() || undefined, page }),
    placeholderData: keepPreviousData,
  });
}

export function useFamilyProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["members", "family", "profile", id],
    queryFn: () => api.get<FamilyProfile | RestrictedProfile>(`/members/${id}/profile`),
    enabled: !!id,
  });
}

type SocialSummary = { likeCount: number; commentCount: number; likedByMe: boolean };

export function useLikeProfile(memberId: string) {
  const client = useQueryClient();
  const key = ["members", "family", "profile", memberId];
  return useMutation({
    mutationFn: (like: boolean) =>
      like
        ? api.post<SocialSummary>(`/members/${memberId}/like`, {})
        : api.delete<SocialSummary>(`/members/${memberId}/like`),
    onSuccess: (summary) =>
      client.setQueryData<FamilyProfile | RestrictedProfile>(key, (old) => (old && !old.restricted ? { ...old, ...summary } : old)),
  });
}

export function useProfileComments(memberId: string, page: number) {
  return useQuery({
    queryKey: ["members", "family", "comments", memberId, page],
    queryFn: () => api.get<ProfileCommentsPage>(`/members/${memberId}/comments`, { page }),
    placeholderData: keepPreviousData,
  });
}

function useCommentsChanged(memberId: string) {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: ["members", "family", "comments", memberId] });
    client.invalidateQueries({ queryKey: ["members", "family", "profile", memberId] });
  };
}

export function useAddProfileComment(memberId: string) {
  const changed = useCommentsChanged(memberId);
  return useMutation({
    mutationFn: (body: string) => api.post<{ id: string }>(`/members/${memberId}/comments`, { body }),
    onSuccess: changed,
  });
}

export function useDeleteProfileComment(memberId: string) {
  const changed = useCommentsChanged(memberId);
  return useMutation({
    mutationFn: (commentId: string) => api.delete(`/members/${memberId}/comments/${commentId}`),
    onSuccess: changed,
  });
}

const DETAILS_KEY = ["members", "me", "profile-details"] as const;

export function useMyProfileDetails() {
  return useQuery({ queryKey: DETAILS_KEY, queryFn: () => api.get<ProfileDetails>("/members/me/profile-details") });
}

function useProfileChanged() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["members", "family", "profile"] });
}

export function useUpdateProfileDetails() {
  const client = useQueryClient();
  const changed = useProfileChanged();
  return useMutation({
    mutationFn: (body: Partial<Omit<ProfileDetails, "coverUrl" | "visibility">> & { visibility?: Partial<Record<VisibilityKey, Visible>> }) =>
      api.put<ProfileDetails>("/members/me/profile-details", body),
    onSuccess: (data) => {
      client.setQueryData(DETAILS_KEY, data);
      changed();
    },
  });
}

/** The banner across the top of my profile. */
export function useProfileCover() {
  const client = useQueryClient();
  const changed = useProfileChanged();
  const done = () => {
    client.invalidateQueries({ queryKey: DETAILS_KEY });
    changed();
  };
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient.post<{ coverUrl: string }>("/members/me/cover", fd, {
        headers: { "Content-Type": undefined as unknown as string },
      });
      return res.data;
    },
    onSuccess: done,
  });
  const remove = useMutation({ mutationFn: () => api.delete("/members/me/cover"), onSuccess: done });
  return { upload, remove };
}
