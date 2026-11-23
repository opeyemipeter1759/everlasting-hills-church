import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CasesClient from "./CasesClient";
import { AdminPanel } from "./case/AdminPanel";
import type { CaseDetail } from "@/lib/api/premarital";

const get = vi.fn();
const post = vi.fn();
const replace = vi.fn();
vi.mock("@/lib/api/request", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ replace }) }));

const wrap = (node: ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider>;
const row = (id: string, ref: string, first: string) => ({
  id, referenceCode: ref, applicantFirstName: first, applicantLastName: "Test", partnerFirstName: "Partner", partnerLastName: "Test",
  status: "SUBMITTED", submittedAt: "2026-11-20T09:00:00.000Z", safeguardingFlaggedAt: null, counsellors: [],
});
const list = { items: [row("a1", "PMC-AAAAAA", "Ada"), row("b2", "PMC-BBBBBB", "Bola"), row("c3", "PMC-CCCCCC", "Chidi")], nextCursor: null };
const access = (canDelete: boolean) => ({ tier: canDelete ? "SUPER_ADMIN" : "MINISTRY", counsellor: false, couple: false, can: { triage: true, assign: canDelete, policy: true, settings: false, wedding: false, delete: canDelete } });
const serve = (canDelete: boolean) => get.mockImplementation(async (url: string) => (url === "/premarital/access" ? access(canDelete) : list));

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  replace.mockReset();
});
afterEach(cleanup);

describe("deleting pre-marital applications", () => {
  it("lets a Super Admin tick several cases and delete them, only after typing DELETE", async () => {
    serve(true);
    post.mockResolvedValue({ deleted: 2, accountsRemoved: 4 });
    render(wrap(<CasesClient />));
    fireEvent.click(await screen.findByRole("checkbox", { name: "Select Ada Test & Partner Test, PMC-AAAAAA" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Chidi Test & Partner Test, PMC-CCCCCC" }));
    expect(screen.getByText("2 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    expect(screen.getByText("Delete 2 applications for good?")).toBeTruthy();
    const confirm = screen.getByRole("button", { name: "Delete for good" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "delete" } });
    expect(confirm.disabled).toBe(false);
    await act(async () => fireEvent.click(confirm));
    expect(post).toHaveBeenCalledWith("/premarital/applications/bulk-delete", { ids: ["a1", "c3"] });
    expect(screen.queryByText("2 selected")).toBeNull();
  });

  it("ticks every case on the page at once", async () => {
    serve(true);
    render(wrap(<CasesClient />));
    fireEvent.click(await screen.findByRole("checkbox", { name: "Select all on this page" }));
    expect(screen.getByText("3 selected")).toBeTruthy();
  });

  it("offers no ticking or deleting to the marriage ministry", async () => {
    serve(false);
    render(wrap(<CasesClient />));
    expect(await screen.findByText("Ada Test & Partner Test")).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
  });

  it("deletes one case from its page and goes back to the list", async () => {
    post.mockResolvedValue({ deleted: 1, accountsRemoved: 2 });
    const c = { id: "a1", adminNote: null, archivedAt: null, safeguardingFlaggedAt: null, WeddingApproval: null, can: { admin: false, safeguarding: false, archive: true, delete: true, wedding: false } } as unknown as CaseDetail;
    render(wrap(<AdminPanel c={c} />));
    fireEvent.click(screen.getByRole("button", { name: "Delete for good" }));
    expect(screen.getByText("Delete this application for good?")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    const [, confirm] = screen.getAllByRole("button", { name: "Delete for good" });
    await act(async () => fireEvent.click(confirm));
    expect(post).toHaveBeenCalledWith("/premarital/applications/bulk-delete", { ids: ["a1"] });
    expect(replace).toHaveBeenCalledWith("/dashboard/marriage/applications");
  });
});
