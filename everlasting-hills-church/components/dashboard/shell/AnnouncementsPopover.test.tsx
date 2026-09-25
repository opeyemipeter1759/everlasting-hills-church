import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnnouncementsPopover from "./AnnouncementsPopover";
import { useAnnouncementsFeed, type AnnouncementFeedItem } from "@/lib/api/announcements";

vi.mock("@/lib/api/announcements", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/announcements")>(
    "@/lib/api/announcements",
  );
  return { ...actual, useAnnouncementsFeed: vi.fn() };
});

const item = (over: Partial<AnnouncementFeedItem> = {}): AnnouncementFeedItem => ({
  id: "a1",
  title: "Furnace 2026",
  body: "Dominion",
  imageUrl: null,
  createdAt: new Date().toISOString(),
  eventTime: null,
  venue: null,
  eventId: null,
  Event: null,
  ...over,
});

function feed(items: AnnouncementFeedItem[]) {
  vi.mocked(useAnnouncementsFeed).mockReturnValue({ data: items } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});
afterEach(cleanup);

describe("AnnouncementsPopover", () => {
  it("greets a member with what the church has said", () => {
    feed([item()]);
    render(<AnnouncementsPopover />);

    expect(screen.getByRole("dialog", { name: /announcements/i })).toBeInTheDocument();
    expect(screen.getByText("Furnace 2026")).toBeInTheDocument();
  });

  // It must not nag on every navigation — only genuinely new news reopens it.
  it("stays shut once the newest has been seen", () => {
    feed([item({ id: "seen-1" })]);
    const first = render(<AnnouncementsPopover />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    first.unmount();

    window.localStorage.setItem("ehc-announcements-seen", "seen-1");
    render(<AnnouncementsPopover />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens again when something newer arrives", () => {
    window.localStorage.setItem("ehc-announcements-seen", "old-1");
    feed([item({ id: "new-2", title: "Workers Meeting" })]);
    render(<AnnouncementsPopover />);

    expect(screen.getByText("Workers Meeting")).toBeInTheDocument();
  });

  it("remembers the newest when dismissed", async () => {
    feed([item({ id: "a9" })]);
    render(<AnnouncementsPopover />);

    await userEvent.click(screen.getByRole("button", { name: /got it/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.localStorage.getItem("ehc-announcements-seen")).toBe("a9");
  });

  // An announcement raised from an event should lead to the event itself.
  it("links an event announcement to its page", () => {
    feed([item({ eventId: "e1", Event: { slug: "furnace-2026", customPath: null } })]);
    render(<AnnouncementsPopover />);

    expect(screen.getByRole("link", { name: /furnace 2026/i })).toHaveAttribute(
      "href",
      "/events/furnace-2026",
    );
  });

  it("honours an event's custom path over its slug", () => {
    feed([item({ eventId: "e1", Event: { slug: "furnace-2026", customPath: "/events/special" } })]);
    render(<AnnouncementsPopover />);

    expect(screen.getByRole("link", { name: /furnace 2026/i })).toHaveAttribute(
      "href",
      "/events/special",
    );
  });

  it("shows nothing at all when there are no announcements", () => {
    feed([]);
    render(<AnnouncementsPopover />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
