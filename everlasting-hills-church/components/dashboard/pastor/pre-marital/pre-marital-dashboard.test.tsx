import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApplicationsClient from "./ApplicationsClient";
import ApplicationDetail from "./ApplicationDetail";

const get = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/request", () => ({ api: { get: (...a: unknown[]) => get(...a), patch: (...a: unknown[]) => patch(...a) } }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const summary = {
  id: "a1", referenceCode: "PMC-7K4QH2", groomFirstName: "Tunde", groomLastName: "Adeyemi",
  brideFirstName: "Ada", brideLastName: "Eze", submittedAt: "2026-11-18T09:00:00.000Z", status: "NEW",
};
const full = {
  ...summary, groomPhone: "0803 123 4567", groomEmail: "tunde@example.com", groomIsMember: true,
  bridePhone: "0809 765 4321", brideEmail: "ada@example.com", brideIsMember: false, weddingDate: "2027-04-10",
  relationshipLength: "1_TO_2_YEARS", message: "We hope to marry in April.", statusUpdatedAt: null, statusUpdatedById: null, statusUpdatedByName: null,
};

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  get.mockReset();
  patch.mockReset();
});
afterEach(cleanup);

describe("Pastoral → Pre-Marital Counselling", () => {
  it("lists new applications with the couple, the date and the status, and counts by status", async () => {
    get.mockResolvedValue({ items: [summary], counts: { NEW: 1, IN_REVIEW: 2, CLOSED: 0 } });
    render(wrap(<ApplicationsClient />));
    expect(await screen.findByText("Tunde Adeyemi & Ada Eze")).toBeTruthy();
    expect(screen.getByText(/Applied 18 Nov 2026 · PMC-7K4QH2/)).toBeTruthy();
    expect(screen.getAllByText("New").length).toBeGreaterThan(0);
    expect(get).toHaveBeenCalledWith("/pre-marital-counselling/applications", { status: "NEW" });
    expect(screen.getByRole("link", { name: /Tunde Adeyemi/ }).getAttribute("href")).toBe("/dashboard/pastor/pre-marital-counselling/a1");
  });

  it("tells someone outside the pastoral team they cannot see the applications", async () => {
    get.mockRejectedValue({ status: 403, message: "Forbidden" });
    render(wrap(<ApplicationsClient />));
    expect(await screen.findByText("Only the pastoral team can see these applications.")).toBeTruthy();
  });

  it("opens an application in full and moves it into review", async () => {
    get.mockResolvedValue(full);
    patch.mockResolvedValue({ ...full, status: "IN_REVIEW", statusUpdatedAt: "2026-11-19T10:00:00.000Z", statusUpdatedByName: "Okunola Peter" });
    render(wrap(<ApplicationDetail id="a1" />));

    expect(await screen.findByText("tunde@example.com")).toBeTruthy();
    expect(screen.getByText("We hope to marry in April.")).toBeTruthy();
    expect(screen.getByText("1 to 2 years")).toBeTruthy();
    expect(screen.getByText("10 Apr 2027")).toBeTruthy();

    fireEvent.click(screen.getByRole("combobox", { name: "Application status" }));
    await act(async () => fireEvent.click(await screen.findByRole("option", { name: "In review" })));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/pre-marital-counselling/applications/a1/status", { status: "IN_REVIEW" }));
    expect(await screen.findByText(/Status set by Okunola Peter/)).toBeTruthy();
  });
});
