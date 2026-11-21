import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CoupleDocument } from "@/lib/api/premarital-documents";
import { DocumentCard } from "./DocumentCard";
import DocumentsClient, { takeTokenFromAddress } from "./DocumentsClient";

const calls: string[] = [];
const exchangeToken = vi.fn();
const loadPage = vi.fn();
vi.mock("@/lib/api/premarital-documents", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/premarital-documents")>()),
  exchangeToken: (t: string) => (calls.push(`exchange:${window.location.hash}`), exchangeToken(t)),
  loadPage: () => loadPage(),
  sendCode: vi.fn(async () => undefined),
  verifyCode: vi.fn(async () => undefined),
  recordConsent: vi.fn(async () => undefined),
  uploadDocument: vi.fn(async () => undefined),
}));

const TOKEN = "aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789_-abcd";

beforeEach(() => {
  calls.length = 0;
  exchangeToken.mockReset();
  loadPage.mockReset();
  window.history.replaceState(null, "", "/pre-marital-counselling/documents");
});
afterEach(cleanup);

describe("the couple's documents page", () => {
  it("takes the token from after #, and wipes it from the address bar before anything is sent", async () => {
    window.history.replaceState(null, "", `/pre-marital-counselling/documents#t=${TOKEN}`);
    exchangeToken.mockResolvedValue("CODE");
    render(<DocumentsClient />);
    expect(await screen.findByRole("button", { name: "Email me a code" })).toBeTruthy();
    expect(exchangeToken).toHaveBeenCalledWith(TOKEN);
    expect(calls).toEqual(["exchange:"]);
    expect(window.location.hash).toBe("");
    expect(window.location.href).not.toContain(TOKEN);
  });

  it("without a link or session, explains how to get in rather than showing anything", async () => {
    loadPage.mockRejectedValue({ status: 404, message: "This link isn't working." });
    render(<DocumentsClient />);
    expect(await screen.findByText("We could not open your documents page")).toBeTruthy();
    expect(exchangeToken).not.toHaveBeenCalled();
  });

  it("greets with first names and shows a card per document, status only", async () => {
    loadPage.mockResolvedValue({
      firstNames: ["Tunde", "Ada"], reference: "PMC-7K4QH2", maxUploadMb: 10, uploadsEnabled: true, medicalConsentWording: "I consent.",
      documents: [{ kind: "PARENTAL_CONSENT", label: "Parental consent letter", status: "PENDING", reuploadReason: null, canUpload: true, needsConsent: false }],
    });
    render(<DocumentsClient />);
    expect(await screen.findByText("Hello Tunde and Ada")).toBeTruthy();
    expect(screen.getByText("PMC-7K4QH2")).toBeTruthy();
    expect(screen.getByText("Not uploaded")).toBeTruthy();
  });

  it("explains when uploads are closed and does not show upload controls", async () => {
    loadPage.mockResolvedValue({
      firstNames: ["Tunde"], reference: "PMC-7K4QH2", maxUploadMb: 10, uploadsEnabled: false, medicalConsentWording: "I consent.",
      documents: [{ kind: "PARENTAL_CONSENT", label: "Parental consent letter", status: "PENDING", reuploadReason: null, canUpload: false, needsConsent: false }],
    });
    render(<DocumentsClient />);
    expect(await screen.findByText(/Online uploads are not open yet/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Choose a file" })).toBeNull();
  });

  it("reads the token helper alone: returns it and clears the hash; no hash means no token", () => {
    window.history.replaceState(null, "", `/x#t=${TOKEN}`);
    expect(takeTokenFromAddress()).toBe(TOKEN);
    expect(window.location.hash).toBe("");
    expect(takeTokenFromAddress()).toBeNull();
  });
});

describe("a document card", () => {
  const doc = (extra: Partial<CoupleDocument>): CoupleDocument => ({
    kind: "MEDICAL_CERT_GROOM", label: "Intending groom's medical certificate", status: "PENDING", reuploadReason: null, canUpload: true, needsConsent: true, ...extra,
  });

  it("keeps the upload buttons shut until the consent box is ticked", async () => {
    render(<DocumentCard doc={doc({})} consentWording="I consent to storing this." maxMb={10} onChanged={() => undefined} />);
    const choose = screen.getByRole("button", { name: "Choose a file" }) as HTMLButtonElement;
    expect(choose.disabled).toBe(true);
    await act(async () => fireEvent.click(screen.getByLabelText("I consent to storing this.")));
    await waitFor(() => expect(choose.disabled).toBe(false));
    expect((screen.getByRole("button", { name: "Take a photo" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows why a document is wanted again, and locks an accepted one", () => {
    const { rerender } = render(<DocumentCard doc={doc({ status: "NEEDS_REUPLOAD", reuploadReason: "UNREADABLE", needsConsent: false })} consentWording="" maxMb={10} onChanged={() => undefined} />);
    expect(screen.getByText("Please upload again")).toBeTruthy();
    expect(screen.getByText(/could not read it clearly/)).toBeTruthy();
    rerender(<DocumentCard doc={doc({ status: "VERIFIED", canUpload: false, needsConsent: false })} consentWording="" maxMb={10} onChanged={() => undefined} />);
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Choose a file|Replace/ })).toBeNull();
  });

  it("refuses a file over the limit before sending anything", async () => {
    const { container } = render(<DocumentCard doc={doc({ needsConsent: false })} consentWording="" maxMb={1} onChanged={() => undefined} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const big = new File([new Uint8Array(2 * 1024 * 1024)], "scan.pdf", { type: "application/pdf" });
    await act(async () => fireEvent.change(input, { target: { files: [big] } }));
    expect(screen.getByRole("alert").textContent).toMatch(/bigger than 1 MB/);
  });
});
