"use client";

import { useEffect, useState } from "react";
import { getEnrolledIds } from "@/lib/courses-store";

/** Empty on the server/first paint (hydration-safe), populated from localStorage after mount. */
export function useEnrolledCourses() {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setIds(getEnrolledIds());
  }, []);

  return { enrolledIds: ids, markEnrolled: (id: string) => setIds((prev) => new Set(prev).add(id)) };
}
