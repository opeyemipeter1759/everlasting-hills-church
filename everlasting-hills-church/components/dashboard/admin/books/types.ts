export type BookStatus = "DRAFT" | "PUBLISHED";

export interface BookCollection {
  id: string;
  name: string;
  order: number;
  _count: { Book: number };
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverUrl: string | null;
  fileUrl: string;
  status: BookStatus;
  collectionId: string | null;
  Collection: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookFormValues {
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  fileUrl: string;
  collectionId: string;
}

export const EMPTY_FORM: BookFormValues = {
  title: "",
  author: "",
  description: "",
  coverUrl: "",
  fileUrl: "",
  collectionId: "",
};

export type BookFilter = "ALL" | BookStatus;
