import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * verify-jwt tests.
 *
 * We mock `jose` so we never actually hit Supabase's JWKS endpoint. The point is to verify
 * our wrapper's contract: returns claims on success, null on any verification failure,
 * throws when env is missing.
 */

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => ({ kind: "mocked-jwks" })),
  jwtVerify: vi.fn(),
}));

let jwtVerifyMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  // Reset module state between tests so the cached JWKS doesn't leak across cases
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  const jose = await import("jose");
  jwtVerifyMock = vi.mocked(jose.jwtVerify);
  jwtVerifyMock.mockReset();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
});

describe("verifySupabaseJwt", () => {
  it("returns null for empty/missing token without calling jose", async () => {
    const { verifySupabaseJwt } = await import("./verify-jwt");
    expect(await verifySupabaseJwt("")).toBeNull();
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  it("returns the payload when jose.jwtVerify resolves", async () => {
    const claims = { sub: "user-1", email: "u@x.com", exp: 9999999999, iat: 1, aud: "authenticated" };
    jwtVerifyMock.mockResolvedValue({ payload: claims } as never);

    const { verifySupabaseJwt } = await import("./verify-jwt");
    const result = await verifySupabaseJwt("real.jwt.token");

    expect(result).toEqual(claims);
  });

  it("returns null when jose throws (bad signature, expired, etc.)", async () => {
    jwtVerifyMock.mockRejectedValue(new Error("JWSSignatureVerificationFailed"));

    const { verifySupabaseJwt } = await import("./verify-jwt");
    expect(await verifySupabaseJwt("tampered.jwt.token")).toBeNull();
  });

  it("calls jose with the correct algorithms + audience + issuer", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: { sub: "u", exp: 0, iat: 0 },
    } as never);

    const { verifySupabaseJwt } = await import("./verify-jwt");
    await verifySupabaseJwt("token");

    expect(jwtVerifyMock).toHaveBeenCalledWith(
      "token",
      { kind: "mocked-jwks" },
      {
        algorithms: ["ES256"],
        audience: "authenticated",
        issuer: "https://test.supabase.co/auth/v1",
      },
    );
  });

  it("fails closed (returns null) when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    // verify-jwt's try/catch deliberately swallows config errors and returns null. The
    // caller (middleware) then treats the request as unauthenticated — fail-closed semantics,
    // never accidentally treat a misconfigured server as "logged in".
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { verifySupabaseJwt } = await import("./verify-jwt");
    expect(await verifySupabaseJwt("some.token")).toBeNull();
  });
});
