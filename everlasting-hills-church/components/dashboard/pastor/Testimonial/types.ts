export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorPhotoUrl: string | null;
  content: string;
  /** Submitter's email/phone from the public testimony form — admin-only, for
   * pastoral follow-up. Never shown on the public homepage. Null for
   * admin-authored testimonials. */
  submitterContact: string | null;
  published: boolean;
  publishedAt: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type EditingState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; testimonial: Testimonial };
