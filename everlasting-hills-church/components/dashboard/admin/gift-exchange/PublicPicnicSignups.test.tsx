import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import PublicPicnicSignups from "./PublicPicnicSignups";

const get = vi.fn();
vi.mock("@/lib/api/axios", () => ({ apiClient: { get: (url: string) => get(url) } }));

const rsvp = (over: Record<string, unknown>) => ({
  id: "r1", eventId: "ev1", fullName: "Ada Obi", email: "ada@x.com", phone: "0803", attendees: 1,
  message: null, createdAt: "2026-11-25T10:00:00Z", isMember: false, checkedIn: false, checkedInAt: null, ...over,
});

function renderIt() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><PublicPicnicSignups /></QueryClientProvider>);
}

afterEach(() => {
  cleanup();
  get.mockReset();
});

describe("public picnic sign-ups", () => {
  it("lists the picnic event's RSVPs with the headcount", async () => {
    get.mockImplementation(async (url: string) =>
      url === "/events/admin"
        ? { data: [{ id: "other", slug: "carol-night" }, { id: "ev1", slug: "ehc-picnic" }] }
        : { data: [rsvp({}), rsvp({ id: "r2", fullName: "Tunde Bello", email: "tunde@x.com", phone: "0812", attendees: 4, isMember: true })] },
    );
    renderIt();
    expect(await screen.findByText("Tunde Bello")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/events/admin/ev1/rsvps");
    expect(screen.getByText(/2 registrations, 5 people in total/)).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search public sign-ups"), { target: { value: "ada" } });
    expect(screen.queryByText("Tunde Bello")).not.toBeInTheDocument();
    expect(screen.getByText("Ada Obi")).toBeInTheDocument();
  });

  it("explains when the picnic event is missing", async () => {
    get.mockResolvedValue({ data: [] });
    renderIt();
    expect(await screen.findByText(/was not found in Events/)).toBeInTheDocument();
  });
});
