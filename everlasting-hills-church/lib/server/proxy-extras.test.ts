// @vitest-environment node
import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { addProxyHeaders, trustedClientIp } from "./proxy-extras";

const SECRET = "a-test-secret-that-is-long-enough-to-use";
const req = (path: string, headers: Record<string, string> = {}) => new NextRequest(`https://www.everlastinghills.church${path}`, { headers });

describe("the API proxy's extras", () => {
  it("trusts only the last X-Forwarded-For entry, the one Google's front end adds", () => {
    expect(trustedClientIp("6.6.6.6, 102.89.4.7")).toBe("102.89.4.7");
    expect(trustedClientIp("102.89.4.7")).toBe("102.89.4.7");
    expect(trustedClientIp("1.2.3.4, not-an-ip")).toBeNull();
    expect(trustedClientIp(null)).toBeNull();
  });

  it("signs the visitor IP with a timestamp, and adds nothing without the secret", () => {
    const h = new Headers();
    addProxyHeaders(req("/api/backend/public/premarital/applications", { "x-forwarded-for": "6.6.6.6, 102.89.4.7" }), h, SECRET, 1_790_000_000_000);
    expect(h.get("x-ehc-client-ip")).toBe("102.89.4.7");
    expect(h.get("x-ehc-client-ip-ts")).toBe("1790000000");
    expect(h.get("x-ehc-client-ip-sig")).toBe(createHmac("sha256", SECRET).update("102.89.4.7.1790000000").digest("hex"));
    const none = new Headers();
    addProxyHeaders(req("/api/backend/x", { "x-forwarded-for": "102.89.4.7" }), none, undefined);
    expect(none.get("x-ehc-client-ip")).toBeNull();
  });

  it("never forwards the browser's cookies to the API", () => {
    const h = new Headers();
    addProxyHeaders(req("/api/backend/counselling/me", { cookie: "ehc_access=secret; other=1" }), h, undefined);
    expect(h.get("cookie")).toBeNull();
  });
});
