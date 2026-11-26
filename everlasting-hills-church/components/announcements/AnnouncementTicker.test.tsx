import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AnnouncementTicker } from "./AnnouncementTicker";

afterEach(cleanup);

const at = "2026-11-26T09:00:00.000Z";
const items = [
  { id: "a1", title: "Picnic this Saturday", body: "Bring a **friend** and a plate.", createdAt: at },
  { id: "a2", title: "Choir rehearsal moved", body: "Now at 5pm.", createdAt: at },
];

describe("the announcements strip on the dashboard", () => {
  it("shows nothing when there are no announcements", () => {
    const { container } = render(<AnnouncementTicker announcements={[]} />);
    expect(container.textContent).toBe("");
  });

  it("runs each announcement across the strip, with the snippet in plain text, and opens one in full", () => {
    render(<AnnouncementTicker announcements={items} />);
    const buttons = screen.getAllByRole("button");
    // Screen readers and the keyboard get each announcement once; the loop's copy is hidden.
    expect(buttons.map((b) => b.textContent)).toEqual(["Picnic this SaturdayBring a friend and a plate.", "Choir rehearsal movedNow at 5pm."]);
    expect(screen.getByRole("region", { name: "Announcements" })).toBeTruthy();
    fireEvent.click(buttons[1]);
    expect(screen.getByText("Announcement")).toBeTruthy();
    expect(screen.getAllByText("Choir rehearsal moved").length).toBeGreaterThan(1);
  });

  it("scrolls at the same reading speed however many there are", () => {
    const { container } = render(<AnnouncementTicker announcements={[...items, { id: "a3", title: "T", body: "", createdAt: at }]} />);
    const track = container.querySelector(".motion-safe\\:animate-marquee") as HTMLElement;
    expect(track.style.animationDuration).toBe("27s");
  });
});
