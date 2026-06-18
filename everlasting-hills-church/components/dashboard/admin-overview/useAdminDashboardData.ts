"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminDashboardMock,
  type AdminDashboardData,
} from "@/lib/mock/admin-dashboard.mock";

export type DataStatus = "loading" | "error" | "empty" | "success";

interface State {
  status: DataStatus;
  data: AdminDashboardData | null;
  error: string | null;
}

/**
 * Loads the admin dashboard payload and models the four UI states
 * (loading → error → empty → success). Swap `getAdminDashboardMock()` for
 * `apiClient.get('/admin/dashboard').then(r => r.data)` when the API lands —
 * the state machine and consumers stay the same.
 */
export function useAdminDashboardData() {
  const [state, setState] = useState<State>({ status: "loading", data: null, error: null });

  const load = useCallback(async () => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await getAdminDashboardMock();
      if (!data || data.stats.length === 0) {
        setState({ status: "empty", data: null, error: null });
        return;
      }
      setState({ status: "success", data, error: null });
    } catch (err) {
      setState({
        status: "error",
        data: null,
        error: (err as { message?: string }).message ?? "Could not load the dashboard.",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
