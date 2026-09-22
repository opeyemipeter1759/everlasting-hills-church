import { describe, expect, it, vi } from "vitest";
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";

vi.mock("@/lib/pwa/service-worker", () => ({ clearServiceWorkerCaches: vi.fn() }));

import { apiClient } from "./axios";

/** An adapter that answers every request with `status` and an API error envelope. */
function failWith(status: number, message: string): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    const response = {
      status,
      statusText: "",
      headers: {},
      config,
      data: { error: { statusCode: status, code: "UNAUTHORIZED", message } },
    };
    throw new AxiosError(message, String(status), config, null, response);
  };
}

describe("apiClient error messages", () => {
  it("tells someone with a wrong password that the details don't match, not that a session expired", async () => {
    await expect(
      apiClient.post("/auth/login", {}, { adapter: failWith(401, "Invalid email or password") }),
    ).rejects.toMatchObject({
      status: 401,
      message: "That email and password don't match. Check them and try again, or use Forgot password to reset it.",
    });
  });

  it("shows the API's own reason when sign-in is refused for another cause", async () => {
    const optedOut = "This account has been opted out. Contact your team leader to be restored.";
    await expect(
      apiClient.post("/auth/login", {}, { adapter: failWith(401, optedOut) }),
    ).rejects.toMatchObject({ status: 401, message: optedOut });
  });

  it("still reports an expired session for a 401 on any other request", async () => {
    await expect(
      apiClient.get("/members/me", { adapter: failWith(401, "Unauthorized") }),
    ).rejects.toMatchObject({
      status: 401,
      message: "Your session has expired. Please sign in again and retry.",
    });
  });
});
