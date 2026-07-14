"use client";

// Frontend-only enrollment tracking (localStorage) — swap for a real mutation
// once the courses backend ships. Kept isolated here so that swap only touches
// this one file.
const STORAGE_KEY = "ehc-enrolled-courses";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function getEnrolledIds(): Set<string> {
  return new Set(readIds());
}

export function isEnrolled(courseId: string): boolean {
  return readIds().includes(courseId);
}

export function enrollInCourse(courseId: string): void {
  if (typeof window === "undefined") return;
  const ids = new Set(readIds());
  ids.add(courseId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}
