import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CaseDetail } from "@/lib/api/premarital";
import { DocumentsPanel } from "./DocumentsPanel";
import { StatusPanel } from "./StatusPanel";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/request", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const wrap = (node: ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider>;
const can = { view: false, verify: false, reupload: false, reopen: false };
const row = (kind: string, extra: object = {}) => ({
  id: `r-${kind}`, kind, status: "UPLOADED", uploadedAt: "2026-11-19T09:00:00.000Z", verifiedAt: null, verifiedBy: null,
  testDate: null, reuploadReason: null, storageConsentGiven: true, newUpload: true, hasFile: true, fileType: null, can, ...extra,
});
const docs = (requirements: object[], more: object = {}) => ({
  applicantRole: "GROOM", validFrom: "2026-10-19", requirements, dispatches: [], storedFiles: 3,
  accounts: [
    { side: "APPLICANT", role: "GROOM", firstName: "Tunde", kind: "COUPLE", signInSentAt: "2026-11-20T10:00:00.000Z" },
    { side: "PARTNER", role: "BRIDE", firstName: "Ada", kind: null, signInSentAt: null },
  ],
  can: { setRole: false, send: true, resendSignIn: true, downloadLetters: true, deleteStored: false }, ...more,
});
const c = { id: "c1", applicantFirstName: "Tunde", status: "IN_COUNSELLING" } as unknown as CaseDetail;

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});
afterEach(cleanup);

describe("the documents panel", () => {
  it("offers View and Accept on a medical certificate only to someone allowed (the API says so per row)", async () => {
    get.mockResolvedValue(
      docs([
        row("PARENTAL_CONSENT_GROOM", { can: { ...can, view: true, verify: true } }),
        row("MEDICAL_CERT_GROOM"),
        row("MEDICAL_CERT_BRIDE", { status: "PENDING", hasFile: false, newUpload: false }),
      ]),
    );
    render(wrap(<DocumentsPanel c={c} />));
    expect(await screen.findByText("Intending groom's medical certificate")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "View" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Accept" })).toHaveLength(1);
    expect(screen.getAllByText("New upload")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Send documents" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete stored documents" })).toBeNull();
    expect(screen.queryByRole("button", { name: /received in person/i })).toBeNull();
    for (const name of ["Groom's consent letter", "Groom's medical letter", "Bride's consent letter", "Bride's medical letter"])
      expect(screen.getByRole("button", { name })).toBeTruthy();
  });

  it("shows each partner's dashboard sign-in, and resends the details to both", async () => {
    get.mockResolvedValue(docs([row("PARENTAL_CONSENT_BRIDE")]));
    post.mockResolvedValue({ email: "SENT" });
    render(wrap(<DocumentsPanel c={c} />));
    expect(await screen.findByText(/Tunde \(groom\): own sign-in, details sent 20 Nov/)).toBeTruthy();
    expect(screen.getByText(/Ada \(bride\): no sign-in yet/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Resend sign-in details" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/premarital/applications/c1/sign-in", {}));
  });

  it("asks for the test date when a Pastor accepts a medical certificate, and warns when it is outside the window", async () => {
    get.mockResolvedValue(docs([row("MEDICAL_CERT_GROOM", { can: { ...can, view: true, verify: true, reupload: true } })]));
    render(wrap(<DocumentsPanel c={c} />));
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    const date = screen.getByLabelText("Test date on the certificate");
    expect((screen.getByRole("button", { name: "Accept document" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(date, { target: { value: "2026-09-01" } });
    expect(screen.getByRole("alert").textContent).toMatch(/outside the window/);
  });

  it("asks who applied when an older application has no role, and offers deletion only when the API allows it", async () => {
    get.mockResolvedValue(docs([], { applicantRole: null, can: { setRole: true, send: false, resendSignIn: false, downloadLetters: false, deleteStored: true } }));
    render(wrap(<DocumentsPanel c={c} />));
    expect(await screen.findByText("Role not set: who applied?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tunde is the intending bride" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete stored documents" }));
    expect(await screen.findByText(/deletes the 3 stored files for good/)).toBeTruthy();
  });
});

describe("the documents check when moving a case on", () => {
  const detail = (canOverride: boolean) =>
    ({
      id: "c1", status: "IN_COUNSELLING", can: { transitions: ["FINAL_REVIEW", "CLOSED"], requestInfo: false },
      documentsGate: { status: "FINAL_REVIEW", satisfied: false, canOverride, reasons: canOverride ? [{ code: "PASTORAL_DISCRETION", label: "Pastoral discretion" }] : [] },
    }) as unknown as CaseDetail;

  const pick = async (label: string) => {
    fireEvent.click(screen.getByRole("combobox", { name: "Next status" }));
    fireEvent.click(await screen.findByRole("option", { name: label }));
  };

  it("holds a non-Pastor back with a plain explanation", async () => {
    render(wrap(<StatusPanel c={detail(false)} />));
    await pick("Final review");
    expect(screen.getByText("All three documents must be accepted before final review.")).toBeTruthy();
    expect(screen.getByText("Only a Pastor can override this.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Override and move" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("lets a Pastor override with one of the listed reasons", async () => {
    render(wrap(<StatusPanel c={detail(true)} />));
    await pick("Final review");
    expect((screen.getByRole("button", { name: "Override and move" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("combobox", { name: "Reason for overriding the documents check" }));
    fireEvent.click(await screen.findByRole("option", { name: "Pastoral discretion" }));
    expect((screen.getByRole("button", { name: "Override and move" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
