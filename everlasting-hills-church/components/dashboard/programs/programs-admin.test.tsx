import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminProgram, AdminProgramRow } from "@/lib/api/programs-admin";
import { toHtml, toText } from "./BasicsSection";
import ProgramsListClient from "./ProgramsListClient";
import { useProgramDraft } from "./useProgramDraft";

const get = vi.fn();
const patch = vi.fn();
const put = vi.fn();
vi.mock("@/lib/api/request", () => ({ api: { get: (...a: unknown[]) => get(...a), post: vi.fn(), patch: (...a: unknown[]) => patch(...a), put: (...a: unknown[]) => put(...a), delete: vi.fn() } }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = (qc: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
beforeEach(() => [get, patch, put].forEach((m) => m.mockReset()));
afterEach(cleanup);

const row = (id: string, name: string, attention: string[] = []): AdminProgramRow => ({
  id, slug: id, name, status: "PUBLISHED", featured: false, sortOrder: 1, cadence: "WEEKLY", programType: "PRAYER", accent: "BURGUNDY", logoUrl: null,
  shortDescription: "x", eyebrow: "WEEKLY WATCH", schedule: "Every Monday", attention, updatedAt: "2026-11-24T10:00:00Z",
});

describe("the programs list", () => {
  it("shows what needs attention and saves a new order when a row is moved", async () => {
    get.mockResolvedValue([row("a", "Prayer Watch"), row("b", "Homecoming Conference", ["Date to be announced", "Name not final"])]);
    patch.mockResolvedValue([row("b", "Homecoming Conference"), row("a", "Prayer Watch")]);
    render(<ProgramsListClient />, { wrapper: wrap(client()) });
    expect(await screen.findByText("Name not final")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Move Homecoming Conference up" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/programs/order", { ids: ["b", "a"] }));
  });
});

const program: AdminProgram = {
  id: "p1", slug: "prayer-watch", name: "Prayer Watch", nameStatus: "FINAL", eyebrow: null, shortDescription: "Watchmen.", longDescription: "<p>One</p>",
  programType: "PRAYER", cadence: "WEEKLY", recurrenceRule: "FREQ=WEEKLY;BYDAY=MO", startTime: "22:00", durationMinutes: 480, startOffsetDays: 0, timezone: "Africa/Lagos",
  dateStatus: "CONFIRMED", format: "HYBRID", venue: null, streamUrl: null, logoUrl: null, coverUrl: null, accent: "BURGUNDY", ctaLabel: "Join a watch", ctaUrl: "/prayer-watch",
  featured: true, status: "PUBLISHED", scriptures: [{ reference: "Isaiah 62:6-7", status: "CONFIRMED", text: "x", translation: "WEB" }],
  sessions: [{ name: "The Seers", startTime: "22:00", endTime: "00:00", description: null }], editions: [], schedule: "Every Monday", generatedEyebrow: "WEEKLY WATCH · MON",
  next: [], attention: [], updatedAt: "2026-11-24T10:00:00Z",
};

describe("saving a program", () => {
  it("sends only the fields that changed, and leaves untouched lists alone", async () => {
    patch.mockResolvedValue({ ...program, name: "The Prayer Watch" });
    const { result } = renderHook(() => useProgramDraft(program), { wrapper: wrap(client()) });
    expect(result.current.dirty).toBe(false);
    act(() => result.current.set("name", "The Prayer Watch"));
    expect(result.current.dirty).toBe(true);
    await act(() => result.current.save());
    expect(patch).toHaveBeenCalledWith("/programs/p1", { name: "The Prayer Watch" });
    expect(put).not.toHaveBeenCalled();
    expect(result.current.dirty).toBe(false);
  });

  it("replaces a list only when it changed", async () => {
    put.mockResolvedValue({ ...program, sessions: [] });
    const { result } = renderHook(() => useProgramDraft(program), { wrapper: wrap(client()) });
    act(() => result.current.setSessions([]));
    await act(() => result.current.save());
    expect(patch).not.toHaveBeenCalled();
    expect(put).toHaveBeenCalledWith("/programs/p1/sessions", { sessions: [] });
  });
});

describe("the story box", () => {
  it("turns blank-line paragraphs into simple HTML and back, escaping anything else", () => {
    expect(toHtml("First line.\n\nSecond <b>bold</b> & more")).toBe("<p>First line.</p><p>Second &lt;b&gt;bold&lt;/b&gt; &amp; more</p>");
    expect(toText("<p>First line.</p><p>Second &amp; more</p>")).toBe("First line.\n\nSecond & more");
  });
});
