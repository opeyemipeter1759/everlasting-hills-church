"use client";

import { useCallback, useEffect, useState } from "react";
import { getProgressMap, type ProgressMap } from "@/lib/courses-store";

/** Empty on the server/first paint (hydration-safe), populated from localStorage after mount. */
export function useCourseProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});

  const refresh = useCallback(() => setProgress(getProgressMap()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progress, refresh };
}
