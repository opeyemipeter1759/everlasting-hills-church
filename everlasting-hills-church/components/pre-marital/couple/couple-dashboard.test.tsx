import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CoupleOverview } from "@/lib/api/couple";
import CoupleDashboard from "./CoupleDashboard";

const get = vi.fn();
const post = vi.fn();
const upload = vi.fn();
vi.mock("@/lib/api/request", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
vi.mock("@/lib/api/axios", () => ({ apiClient: { post: (...a: unknown[]) => upload(...a), get: vi.fn() } }));

const wrap = (node: ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider>;

const overview = (more: Partial<CoupleOverview["documents"]> = {}): CoupleOverview => ({
  application: {
    reference: "PMC-7K4QH2",
    status: "ACCEPTED_FOR_COUNSELLING",
    message: "You have been accepted for counselling.",
    closed: false,
    submittedAt: "2026-11-20T10:00:00.000Z",
    weddingDate: "2027-03-12",
    you: { firstName: "Ada", role: "BRIDE" },
    partner: { firstName: "Tunde", role: "GROOM" },
    stages: [
      { label: "Application received", state: "DONE" },
      { label: "Reviewed by the pastors", state: "DONE" },
      { label: "Accepted for counselling", state: "CURRENT" },
      { label: "Counselling sessions", state: "UPCOMING" },
    ],
  },
  counsellors: [{ name: "Pastor Bola Ade", lead: true }],
  documents: {
    uploadsOpen: true,
    maxUploadMb: 10,
    medicalConsentWording: "I consent to Everlasting Hills Church securely storing this medical certificate.",
    neededBefore: "before the final review",
    lettersAvailable: true,
    items: [
      { kind: "PARENTAL_CONSENT_BRIDE", label: "Your parental consent letter", status: "PENDING", reuploadReason: null, canUpload: true, needsConsent: false },
      { kind: "MEDICAL_CERT_BRIDE", label: "Your medical certificate", status: "PENDING", reuploadReason: null, canUpload: true, needsConsent: true },
    ],
    ...more,
  },
});

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  upload.mockReset();
});
afterEach(cleanup);

describe("the couple dashboard", () => {
  it("shows where things are and this partner's own two documents, with no sessions or curriculum", async () => {
    get.mockResolvedValue(overview());
    render(wrap(<CoupleDashboard />));
    expect(await screen.findByRole("heading", { level: 1, name: "Ada and Tunde" })).toBeTruthy();
    expect(screen.getByText("PMC-7K4QH2")).toBeTruthy();
    expect(screen.getByText("12 March 2027")).toBeTruthy();
    expect(screen.getByText("You are here")).toBeTruthy();
    expect(screen.getByText("Pastor Bola Ade", { selector: "span" })).toBeTruthy();
    expect(screen.getByText("Your parental consent letter")).toBeTruthy();
    expect(screen.getByText("Your medical certificate")).toBeTruthy();
    expect(screen.getByText(/either your father or your mother, or a recognised guardian/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download your consent letter" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download your medical letter" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Choose a file" })).toHaveLength(2);
    expect(screen.queryByText(/session/i, { selector: "h2" })).toBeNull();
    expect(screen.queryByText("Materials")).toBeNull();
    expect(document.body.textContent?.toLowerCase()).not.toContain("church office");
  });

  it("needs the consent box ticked before a medical certificate can be chosen", async () => {
    get.mockResolvedValue(overview());
    render(wrap(<CoupleDashboard />));
    await screen.findByText("Your medical certificate");
    const [, medical] = screen.getAllByRole("button", { name: "Choose a file" }) as HTMLButtonElement[];
    expect(medical.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/I consent to Everlasting Hills Church/));
    expect(medical.disabled).toBe(false);
  });

  it("uploads to the dashboard route, recording consent first for a certificate", async () => {
    get.mockResolvedValue(overview());
    post.mockResolvedValue({ recorded: true });
    upload.mockResolvedValue({ data: { status: "UPLOADED" } });
    render(wrap(<CoupleDashboard />));
    await screen.findByText("Your medical certificate");
    fireEvent.click(screen.getByLabelText(/I consent to Everlasting Hills Church/));
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"][accept="application/pdf,image/jpeg,image/png"]');
    await act(async () => fireEvent.change(inputs[1], { target: { files: [new File(["%PDF-1.4"], "cert.pdf", { type: "application/pdf" })] } }));
    expect(post).toHaveBeenCalledWith("/counselling/me/documents/consent", { kind: "MEDICAL_CERT_BRIDE" });
    expect(upload.mock.calls[0][0]).toBe("/counselling/me/documents/MEDICAL_CERT_BRIDE/upload");
    expect(await screen.findByText(/We have received it/)).toBeTruthy();
  });

  it("explains when uploads are closed and offers no upload controls", async () => {
    get.mockResolvedValue(overview({ uploadsOpen: false }));
    render(wrap(<CoupleDashboard />));
    expect(await screen.findByText(/Online uploads are not open yet/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Choose a file" })).toBeNull();
  });

  it("explains plainly when this account has no application", async () => {
    get.mockRejectedValue({ status: 404, message: "Not found" });
    render(wrap(<CoupleDashboard />));
    expect(await screen.findByText("We could not find an application for this account")).toBeTruthy();
  });
});
