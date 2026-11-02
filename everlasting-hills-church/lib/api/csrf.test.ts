import { describe, expect, it } from "vitest";
import { isUnsafeCrossSiteRequest } from "./csrf";

function headers(values: Record<string, string>): Pick<Headers, "get"> {
  return { get: (name) => values[name.toLowerCase()] ?? null };
}

describe("isUnsafeCrossSiteRequest", () => {
  it("allows same-origin browser requests when a reverse proxy changes the request origin", () => {
    expect(
      isUnsafeCrossSiteRequest(
        headers({
          origin: "https://everlastinghills.church",
          "sec-fetch-site": "same-origin",
        }),
        "https://internal.example",
      ),
    ).toBe(false);
  });

  it("rejects cross-site browser requests", () => {
    expect(isUnsafeCrossSiteRequest(headers({ "sec-fetch-site": "cross-site" }), "https://church.test")).toBe(true);
  });

  it("checks the origin when fetch metadata is unavailable", () => {
    expect(isUnsafeCrossSiteRequest(headers({ origin: "https://attacker.example" }), "https://church.test")).toBe(
      true,
    );
    expect(isUnsafeCrossSiteRequest(headers({ origin: "https://church.test" }), "https://church.test")).toBe(false);
  });

  it("falls back to the public host when the proxy hides it from the request origin", () => {
    expect(
      isUnsafeCrossSiteRequest(
        headers({ origin: "https://www.everlastinghills.church", host: "www.everlastinghills.church" }),
        "http://0.0.0.0:8080",
      ),
    ).toBe(false);
    expect(
      isUnsafeCrossSiteRequest(
        headers({ origin: "https://attacker.example", host: "www.everlastinghills.church" }),
        "http://0.0.0.0:8080",
      ),
    ).toBe(true);
  });
});
