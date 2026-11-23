import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { apiClient } from "@/lib/api/axios";
import { uploadDocument } from "@/lib/api/couple";

/**
 * Runs the real axios client up to the network, so the request the server
 * would receive is what is checked. The client defaults to JSON; a document
 * must still leave the browser as a file upload, not as JSON.
 */
const original = apiClient.defaults.adapter;
afterEach(() => {
  apiClient.defaults.adapter = original;
});

describe("uploading a counselling document", () => {
  it("sends the file as multipart form data, not JSON, with time for a slow connection", async () => {
    let sent: InternalAxiosRequestConfig | undefined;
    apiClient.defaults.adapter = async (config) => {
      sent = config;
      return { data: { data: { status: "UPLOADED" } }, status: 200, statusText: "OK", headers: {}, config };
    };
    const file = new File(["%PDF-1.4"], "consent.pdf", { type: "application/pdf" });
    await uploadDocument("PARENTAL_CONSENT_GROOM", file, () => undefined);

    expect(sent?.url).toBe("/counselling/me/documents/PARENTAL_CONSENT_GROOM/upload");
    expect(sent?.data).toBeInstanceOf(FormData);
    expect((sent?.data as FormData).get("file")).toBeInstanceOf(File);
    expect(String(sent?.headers.getContentType() ?? "")).not.toContain("application/json");
    expect(sent?.timeout).toBeGreaterThanOrEqual(120_000);
  });
});
