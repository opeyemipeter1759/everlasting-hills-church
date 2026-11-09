import { afterEach, describe, expect, it, vi } from "vitest";
import { openRecoveryLink } from "./recovery-link";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function visit(url: string) {
  window.history.replaceState(null, "", url);
}

afterEach(() => {
  fetchMock.mockReset();
  visit("/");
});

describe("opening a password-reset link", () => {
  it("exchanges the token_hash from our email and wipes it from the address bar", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    visit("/change-password?token_hash=abc123&type=recovery");

    await expect(openRecoveryLink()).resolves.toBe(true);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ tokenHash: "abc123" });
    expect(window.location.search).toBe("");
  });

  it("still accepts the access token Supabase's older email put after the #", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    visit("/change-password#access_token=jwt&type=recovery");

    await expect(openRecoveryLink()).resolves.toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ accessToken: "jwt" });
    expect(window.location.hash).toBe("");
  });

  it("says to request a new link when it has been used or has expired", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    visit("/change-password?token_hash=old&type=recovery");

    await expect(openRecoveryLink()).rejects.toThrow(/Request a new one/);
  });

  it("does nothing when the page was not opened from a reset link", async () => {
    visit("/change-password");

    await expect(openRecoveryLink()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
