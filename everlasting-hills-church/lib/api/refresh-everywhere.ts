"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * After someone is deleted or deactivated, everything that might still show
 * them is refreshed: the page that's open straight away, and every other page
 * the moment it is opened. A person can be on the People list, the Follow Up
 * and Integration lists, the attendance roll, service teams and the counts
 * above each, and no single cache key covers all of them.
 */
export function useRefreshEverywhere() {
  const queryClient = useQueryClient();
  return useCallback(() => queryClient.invalidateQueries(), [queryClient]);
}
