import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventTicketCard from "./EventTicketCard";
import type { EventSummary } from "@/types";

vi.mock("./useEventShare", () => ({
  useEventShare: () => ({ copied: false, handleShareLink: vi.fn(), handleWhatsApp: vi.fn() }),
}));
vi.mock("./useEventRegistration", () => ({
  useEventRegistration: () => ({
    registering: false,
    registered: false,
    handleRegisterClick: vi.fn(),
  }),
}));

const event = (over: Partial<EventSummary> = {}): EventSummary => ({
  id: "e1",
  slug: "furnace-2026",
  title: "Furnace 2026",
  tagline: "Dominion",
  theme: "Dominion",
  shortDescription: null,
  startAt: "2026-10-02T05:00:00.000Z",
  endAt: null,
  timezone: "Africa/Lagos",
  locationType: "ONLINE",
  venueName: "Youtube Channel",
  flyerImageUrl: null,
  coverImageUrl: null,
  heroImageUrl: null,
  socialImageUrl: null,
  liveUrl: null,
  registrationUrl: null,
  primaryCtaLabel: null,
  primaryCtaUrl: null,
  featured: false,
  customPath: null,
  rsvpEnabled: true,
  registrationRequired: true,
  Schedules: [],
  ...over,
});

const registeredEvents = { isRegistered: () => false, markRegistered: vi.fn() };

function renderCard(over: Partial<EventSummary> = {}) {
  return render(
    <EventTicketCard event={event(over)} onNeedsRsvpModal={vi.fn()} registeredEvents={registeredEvents} />,
  );
}

afterEach(cleanup);

describe("EventTicketCard", () => {
  // An event created without RSVPs has nothing to register for.
  it("offers the event's page instead of Register when RSVPs are off", () => {
    renderCard({ rsvpEnabled: false });

    expect(screen.queryByRole("button", { name: /register/i })).toBeNull();
    expect(screen.getByRole("link", { name: /see details/i })).toHaveAttribute(
      "href",
      "/events/furnace-2026",
    );
  });

  it("keeps Register and still offers a way into the event's page", () => {
    renderCard({ rsvpEnabled: true });

    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /details/i })).toHaveAttribute(
      "href",
      "/events/furnace-2026",
    );
  });

  // rsvpEnabled only reaches the summary payload once the API shipping it is
  // deployed. Until then a missing value must not hide Register everywhere.
  it("keeps Register when the API has not sent the flag yet", () => {
    const { rsvpEnabled: _omitted, ...withoutFlag } = event();
    render(
      <EventTicketCard
        event={withoutFlag as EventSummary}
        onNeedsRsvpModal={vi.fn()}
        registeredEvents={registeredEvents}
      />,
    );

    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("sends a custom-path event to its own page", () => {
    renderCard({ rsvpEnabled: false, customPath: "/events/special" });

    expect(screen.getByRole("link", { name: /see details/i })).toHaveAttribute(
      "href",
      "/events/special",
    );
  });
});
