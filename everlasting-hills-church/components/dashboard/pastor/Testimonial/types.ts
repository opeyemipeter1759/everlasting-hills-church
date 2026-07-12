export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorPhotoUrl: string | null;
  content: string;
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
