import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import EventSectionsRenderer from "./EventSectionsRenderer";
import type { EventDetail, EventSection } from "@/types";

const event = (over: Partial<EventDetail> = {}): EventDetail =>
  ({
    id: "e1",
    slug: "furnace-2026",
    title: "Furnace 2026",
    startAt: "2026-10-02T05:00:00.000Z",
    endAt: "2026-10-31T05:00:00.000Z",
    timezone: "Africa/Lagos",
    locationType: "ONLINE",
    liveUrl: null,
    testimonyUrl: null,
    primaryCtaUrl: null,
    Schedules: [],
    Sections: [],
    ...over,
  }) as unknown as EventDetail;

const section = (over: Partial<EventSection> = {}): EventSection =>
  ({ id: "s1", isVisible: true, sortOrder: 0, title: null, subtitle: null, ...over }) as EventSection;

afterEach(cleanup);

describe("EventSectionsRenderer", () => {
  it("renders nothing when an event has no sections", () => {
    const { container } = render(<EventSectionsRenderer event={event()} />);

    expect(container).toBeEmptyDOMElement();
  });

  // Hiding a section in the builder is how an admin parks unfinished content —
  // Furnace ships with its prayer focus hidden until the church supplies it.
  it("leaves a hidden section off the page entirely", () => {
    const sections = [
      section({ type: "RICH_TEXT", title: "Shown", content: { body: "Visible copy" } }),
      section({ id: "s2", type: "RICH_TEXT", title: "Hidden", isVisible: false, content: { body: "Parked copy" } }),
    ] as EventSection[];

    render(<EventSectionsRenderer event={event({ Sections: sections })} />);

    expect(screen.getByText("Visible copy")).toBeInTheDocument();
    expect(screen.queryByText("Parked copy")).toBeNull();
  });

  it("renders each section type the builder can create", () => {
    const sections = [
      section({ type: "EXPECTATIONS", title: "Our Expectations", content: { items: [{ title: "Restoration", description: "Renewed hunger" }] } }),
      section({ id: "s2", type: "FAQ", title: "FAQ", content: { items: [{ question: "Do I register?", answer: "No." }] } }),
      section({ id: "s3", type: "PRAYER_FOCUS", title: "Prayer Focus", content: { focuses: [{ title: "Fervency", scriptures: ["Romans 12:11"], prayerPoints: ["Pray for hunger"] }] } }),
    ] as EventSection[];

    render(<EventSectionsRenderer event={event({ Sections: sections })} />);

    expect(screen.getByText("Restoration")).toBeInTheDocument();
    expect(screen.getByText("Do I register?")).toBeInTheDocument();
    expect(screen.getByText("Romans 12:11")).toBeInTheDocument();
  });

  // A CTA with nowhere to go must not render a dead button — Furnace ships
  // without a Join Live URL until the church publishes one.
  it("omits the button when a call to action has no destination", () => {
    const sections = [
      section({ type: "CTA", title: "Join Us", content: { body: "Thirty days", buttonLabel: "Join Live", url: "" } }),
    ] as EventSection[];

    render(<EventSectionsRenderer event={event()} />);
    cleanup();
    render(<EventSectionsRenderer event={event({ Sections: sections })} />);

    expect(screen.getByText("Join Us")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /join live/i })).toBeNull();
  });

  it("falls back to the event's live URL when the CTA carries none", () => {
    const sections = [
      section({ type: "CTA", title: "Join Us", content: { body: "", buttonLabel: "Join Live", url: "" } }),
    ] as EventSection[];

    render(<EventSectionsRenderer event={event({ Sections: sections, liveUrl: "https://youtube.com/live" })} />);

    const link = screen.getByRole("link", { name: /join live/i });
    expect(link).toHaveAttribute("href", "https://youtube.com/live");
    // An external destination opened in a new tab needs the opener severed.
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  // Furnace parks its prayer focus empty until the church supplies the
  // scriptures and points. A heading over nothing looks broken.
  it("renders nothing for a visible section with no content in it", () => {
    const sections = [
      section({ type: "PRAYER_FOCUS", title: "Prayer Focus", content: { focuses: [] } }),
    ] as EventSection[];

    render(<EventSectionsRenderer event={event({ Sections: sections })} />);

    expect(screen.queryByText("Prayer Focus")).toBeNull();
  });

  it("shows each way to respond side by side", () => {
    const sections = [
      section({
        type: "RESPONSE",
        title: "Respond",
        content: {
          actions: [
            { heading: "Have a Testimony?", buttonLabel: "Share", url: "/testimony", note: "You choose what may be shared." },
            { heading: "Giving Your Life to Christ?", buttonLabel: "Tell us", url: "/first-timer" },
          ],
        },
      }),
    ] as EventSection[];

    render(<EventSectionsRenderer event={event({ Sections: sections })} />);

    expect(screen.getByRole("link", { name: /share/i })).toHaveAttribute("href", "/testimony");
    expect(screen.getByRole("link", { name: /tell us/i })).toHaveAttribute("href", "/first-timer");
    // The consent line belongs on the card, before the form is opened.
    expect(screen.getByText(/you choose what may be shared/i)).toBeInTheDocument();
  });

  it("says a response link is coming rather than rendering a dead button", () => {
    const sections = [
      section({ type: "RESPONSE", title: "Respond", content: { actions: [{ heading: "Have a Testimony?", buttonLabel: "Share", url: "" }] } }),
    ] as EventSection[];

    render(<EventSectionsRenderer event={event({ Sections: sections })} />);

    expect(screen.queryByRole("link", { name: /share/i })).toBeNull();
    expect(screen.getByText(/link coming soon/i)).toBeInTheDocument();
  });

  it("keeps an internal destination in the same tab", () => {
    const sections = [
      section({ type: "TESTIMONY", title: "Have a Testimony?", content: { body: "", buttonLabel: "Share", url: "/testimony" } }),
    ] as EventSection[];

    render(<EventSectionsRenderer event={event({ Sections: sections })} />);

    const link = screen.getByRole("link", { name: /share/i });
    expect(link).toHaveAttribute("href", "/testimony");
    expect(link).not.toHaveAttribute("target");
  });
});
