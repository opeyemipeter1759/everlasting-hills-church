import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardAnnouncementBar from "./DashboardAnnouncementBar";

const nav = vi.hoisted(() => ({ path: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path }));
vi.mock("@/lib/api/announcements", () => ({
  useAnnouncementsFeed: () => ({ data: [{ id: "a1", title: "Picnic on Saturday", body: "Bring a friend", createdAt: "2026-11-27T09:00:00Z" }] }),
}));
vi.mock("@/components/announcements/AnnouncementTicker", () => ({ AnnouncementTicker: () => <div>announcements bar</div> }));

afterEach(cleanup);

describe("the dashboard announcements bar", () => {
  it("shows on the dashboard home", () => {
    nav.path = "/dashboard";
    render(<DashboardAnnouncementBar />);
    expect(screen.getByText("announcements bar")).toBeTruthy();
  });

  it("stays off every other dashboard page", () => {
    for (const path of ["/dashboard/follow-up/approvals", "/dashboard/attendance", "/dashboard/membership-assimilation/u1"]) {
      nav.path = path;
      const { container } = render(<DashboardAnnouncementBar />);
      expect(container.textContent).toBe("");
      cleanup();
    }
  });
});
