import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomeAnnouncementBar from "./HomeAnnouncementBar";

const feed = vi.hoisted(() => ({ signedIn: true, announcements: [] as { id: string; title: string; body: string; imageUrl: null; createdAt: string }[] }));
vi.mock("@/hooks", () => ({
  useSessionReady: () => ({ user: feed.signedIn ? { loggedIn: true } : null, ready: true }),
  useAnnouncementsFeed: (enabled: boolean) => ({ announcements: enabled ? feed.announcements : [], loading: false }),
}));

afterEach(() => {
  cleanup();
  feed.announcements = [];
  feed.signedIn = true;
});

describe("the announcement bar before Sacrificial giving on the homepage", () => {
  it("runs the signed-in member's announcements as a bar across the whole screen", () => {
    feed.announcements = [{ id: "a1", title: "Picnic this Saturday", body: "Bring a plate.", imageUrl: null, createdAt: "2026-11-26T09:00:00.000Z" }];
    render(<HomeAnnouncementBar />);
    const bar = screen.getByRole("region", { name: "Announcements" });
    expect(bar.className).toContain("w-full");
    expect(bar.className).not.toContain("rounded-2xl");
    expect(screen.getByRole("button", { name: /Picnic this Saturday/ })).toBeTruthy();
  });

  it("shows nothing to a visitor who is not signed in", () => {
    feed.signedIn = false;
    feed.announcements = [{ id: "a1", title: "Picnic", body: "", imageUrl: null, createdAt: "2026-11-26T09:00:00.000Z" }];
    const { container } = render(<HomeAnnouncementBar />);
    expect(container.textContent).toBe("");
  });

  it("shows nothing while there are no announcements", () => {
    const { container } = render(<HomeAnnouncementBar />);
    expect(container.textContent).toBe("");
  });
});
