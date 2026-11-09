import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("./request", () => ({ api: { get } }));

import { useAnalyticsLeaderboard, useAnalyticsOverview, useAnalyticsSplit, useAnalyticsTrend } from "./analytics";

const row = (n: number) => ({ userId: `u${n}`, name: `P${n}`, photoUrl: null, rate: 90, attended: 9, total: 10, currentStreak: 2 });
const page = {
  overview: { attendanceRate: 82 }, trend: [], split: { present: 8, absent: 2, total: 10, rate: 80 }, rateTrend: [],
  absenteeTrend: [], serviceComparison: [], memberGrowth: [], leaderboard: Array.from({ length: 10 }, (_, i) => row(i)),
  firstTimers: [], retention: null, peakHours: [], consistency: [], serviceHealth: [], alerts: [], unavailable: [] as string[],
};
const filter = { period: "week" as const, serviceType: "all" as const };

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("attendance analytics hooks", () => {
  beforeEach(() => get.mockReset());

  it("serve every chart from one /analytics/attendance-page request", async () => {
    get.mockResolvedValue(page);
    const Wrapper = wrapper();
    const overview = renderHook(() => useAnalyticsOverview(filter), { wrapper: Wrapper });
    const split = renderHook(() => useAnalyticsSplit(filter), { wrapper: Wrapper });

    await waitFor(() => expect(split.result.current.isSuccess).toBe(true));
    expect(overview.result.current.data).toEqual({ attendanceRate: 82 });
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/analytics/attendance-page", { period: "week" });
  });

  it("trims the leaderboard to the chosen size without another request", async () => {
    get.mockResolvedValue(page);
    const Wrapper = wrapper();
    const top3 = renderHook(() => useAnalyticsLeaderboard(filter, 3), { wrapper: Wrapper });
    const top5 = renderHook(() => useAnalyticsLeaderboard(filter, 5), { wrapper: Wrapper });

    await waitFor(() => expect(top5.result.current.isSuccess).toBe(true));
    expect(top3.result.current.data).toHaveLength(3);
    expect(top5.result.current.data).toHaveLength(5);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("shows a part the server could not load as that chart's error", async () => {
    get.mockResolvedValue({ ...page, trend: null, unavailable: ["trend"] });
    const Wrapper = wrapper();
    const trend = renderHook(() => useAnalyticsTrend(filter), { wrapper: Wrapper });
    const split = renderHook(() => useAnalyticsSplit(filter), { wrapper: Wrapper });

    await waitFor(() => expect(trend.result.current.isError).toBe(true));
    expect(split.result.current.isSuccess).toBe(true);
  });
});
