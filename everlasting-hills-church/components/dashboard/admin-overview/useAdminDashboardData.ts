"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminDashboardMock,
  type AdminDashboardData,
  type AttendancePoint,
  type SummaryStat,
} from "@/lib/mock/admin-dashboard.mock";
import { apiClient } from "@/lib/api/axios";

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
      const mock = await getAdminDashboardMock();

      // Real stat cards from the backend. The remaining sections (giving,
      // funnel, etc.) still come from the mock until their endpoints land.
      let stats = mock.stats;
      let attendanceTrend = mock.attendanceTrend;
      try {
        const [summary, trend] = await Promise.all([
          apiClient.get<{ stats: SummaryStat[] }>("/admin/dashboard-summary"),
          apiClient
            .get<{ points: AttendancePoint[] }>("/admin/attendance-trend")
            .catch(() => null),
        ]);
        if (summary.data?.stats?.length) stats = summary.data.stats;
        if (trend?.data?.points?.length) attendanceTrend = trend.data.points;
      } catch {
        // Backend unavailable → keep mock data so the dashboard still renders.
      }

      const data: AdminDashboardData = { ...mock, stats, attendanceTrend };
      if (!data.stats.length) {
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
