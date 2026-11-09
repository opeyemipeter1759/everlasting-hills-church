import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/api/axios", () => ({ apiClient: { get } }));

import { useAdminDashboardData } from "./useAdminDashboardData";

function home(overrides: Record<string, unknown> = {}) {
  return {
    summary: { stats: [{ key: "members", label: "Members", value: 12 }] },
    attendanceTrend: { points: [] },
    upcomingBirthdays: [{ id: "b1", firstName: "Ada", lastName: "Obi", photoUrl: null, daysUntil: 0 }],
    anniversariesToday: [],
    givingSummary: { thisMonthNaira: 5000, momChange: -3 },
    givingCategories: [{ category: "Tithe", amountNaira: 5000 }],
    unassignedFollowUps: 4,
    analytics: { pendingPrayers: 2 },
    openFollowUpTasks: 1,
    atRisk: { absentConsecutiveWeeks: [], neverAttended: [], belowFiftyPercent: [] },
    units: [],
    recentActivity: [],
    absentMembers: [],
    calendar: { upcoming: [], counts: { thisWeek: 0, thisMonth: 0, drafts: 0 } },
    unavailable: [],
    ...overrides,
  };
}

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useAdminDashboardData", () => {
  beforeEach(() => get.mockReset());

  it("loads the whole dashboard from one /admin/home request", async () => {
    get.mockResolvedValue({ data: home() });
    const { result } = renderHook(() => useAdminDashboardData(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/admin/home");
    expect(result.current.data?.giving).toMatchObject({ thisMonth: 5000, trend: { value: 3, direction: "down" } });
    expect(result.current.data?.aiInsights.membersNeedingFollowUp).toBe(4);
    expect(result.current.data?.celebrations.birthdaysToday).toBe(1);
  });

  it("leaves giving and recent activity out when the server withholds them", async () => {
    get.mockResolvedValue({ data: home({ givingSummary: null, givingCategories: null, recentActivity: null }) });
    const { result } = renderHook(() => useAdminDashboardData(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data?.giving).toBeNull();
    expect(result.current.data?.recentActivities).toBeNull();
  });

  it("shows the error state only when the stat cards could not load", async () => {
    get.mockResolvedValue({ data: home({ summary: null, unavailable: ["summary"] }) });
    const { result } = renderHook(() => useAdminDashboardData(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});
