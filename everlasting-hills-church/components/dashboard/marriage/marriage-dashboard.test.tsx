import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OverviewClient from "./OverviewClient";
import CaseClient from "./case/CaseClient";
import { QueryState } from "./ui";

const get = vi.fn();
vi.mock("@/lib/api/request", () => ({ api: { get: (...a: unknown[]) => get(...a), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const wrap = (node: ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider>;

const base = {
  id: "c1", referenceCode: "PMC-7K4QH2", applicantFirstName: "Tunde", applicantLastName: "Adeyemi", partnerFirstName: "Ada", partnerLastName: "Eze",
  status: "UNDER_REVIEW", submittedAt: "2026-11-18T09:00:00.000Z", weddingDate: null, safeguardingFlaggedAt: null, applicantEmail: "t@example.com",
  applicantPhone: "0803", partnerEmail: null, partnerPhone: "0809", membership: "ONE_MEMBER", preferredContact: "WHATSAPP", intro: "Hello",
  archivedAt: null, member: null, assignments: [], sessions: [], Progress: [], WeddingApproval: null,
  timeline: [{ id: "e1", from: null, to: "SUBMITTED", reason: null, at: "2026-11-18T09:00:00.000Z", by: null }],
};
const none = { transitions: [], requestInfo: false, admin: false, assign: false, archive: false, safeguarding: false, wedding: false, sessions: false, progress: false };

beforeEach(() => get.mockReset());
afterEach(cleanup);

describe("the Marriage dashboard", () => {
  it("shows counts only on the overview", async () => {
    get.mockResolvedValue({ total: 5, new: 2, awaitingReview: 1, inCounselling: 1, upcomingSessions: 3, needsAttention: 0, completed: 1 });
    render(wrap(<OverviewClient />));
    expect(await screen.findByText("Total applications")).toBeTruthy();
    expect(screen.queryByText(/Tunde/)).toBeNull();
  });

  it("gives the marriage ministry the next steps but not assignment, safeguarding or wedding approval", async () => {
    get.mockImplementation(async (url?: string) => (String(url).includes("/modules") ? [] : { ...base, tier: "MINISTRY", adminNote: null, can: { ...none, transitions: ["ADDITIONAL_INFORMATION_REQUIRED", "ACCEPTED_FOR_COUNSELLING", "CLOSED"], requestInfo: true, admin: true } }));
    render(wrap(<CaseClient id="c1" />));
    expect(await screen.findByText("Tunde Adeyemi & Ada Eze")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Next status" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ask the couple for more information" })).toBeTruthy();
    expect(screen.getByText(/Never record anything the couple disclosed/)).toBeTruthy();
    expect(screen.queryByPlaceholderText("Find a counsellor by name")).toBeNull();
    expect(screen.queryByRole("button", { name: /safeguarding/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Approve the wedding" })).toBeNull();
  });

  it("gives a counsellor the case without the team's note or the next steps", async () => {
    get.mockImplementation(async (url?: string) => (String(url).includes("/modules") ? [] : { ...base, tier: "COUNSELLOR", can: { ...none, sessions: true, progress: true } }));
    render(wrap(<CaseClient id="c1" />));
    expect(await screen.findByText("Tunde Adeyemi & Ada Eze")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Next status" })).toBeNull();
    expect(screen.queryByText("Logistics note")).toBeNull();
  });

  it("tells someone outside the team there is nothing here (the API answers 404)", () => {
    render(<QueryState isLoading={false} error={{ status: 404, message: "Not found" }} />);
    expect(screen.getByText(/There is nothing here for you/)).toBeTruthy();
  });
});
