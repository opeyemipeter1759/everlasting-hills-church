"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface AdminTestimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorPhotoUrl: string | null;
  content: string;
  /** Submitter's email/phone from the public testimony form — admin-only, for
   * pastoral follow-up. Never shown on the public homepage. Null for
   * admin-authored testimonials. */
  submitterContact: string | null;
  /** Submitter's stated preference from the public form — never auto-applied,
   * for the moderator to see and respect when publishing. */
  isAnonymous: boolean;
  /** Willing to share this testimony physically/in-person at a service.
   * Null = not asked (admin-authored, or submitted before this field existed). */
  sharePhysically: boolean | null;
  /** Set only when the submitter was signed in when they submitted — kept even
   * when isAnonymous (anonymous only hides the free-text name shown publicly). */
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    photoUrl: string | null;
  } | null;
  published: boolean;
  publishedAt: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const KEY = ["testimonials", "admin"] as const;

/** ADMIN+ view — every testimonial including unpublished drafts submitted via
 * the public form (matches the PASTOR-only CMS at /dashboard/pastor/testimonials). */
export function useAdminTestimonials() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<AdminTestimonial[]>("/testimonials"),
  });
}

export function useDeleteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/testimonials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Backend gates this at PASTOR+ (see TestimonialsController) — only render
 * the toggle for users who actually clear that bar, an ADMIN-only user will
 * get a 403 if they call it. */
export function useTogglePublishTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      api.patch(`/testimonials/${id}`, { published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
