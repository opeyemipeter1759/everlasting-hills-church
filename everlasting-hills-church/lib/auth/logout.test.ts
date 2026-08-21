import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_CLEARED_EVENT } from "./frontend-session";
import { LOGOUT_PENDING_COOKIE } from "./session-constants";

const { clearCachesMock } = vi.hoisted(() => ({ clearCachesMock: vi.fn() }));
vi.mock("@/lib/pwa/service-worker", () => ({ clearServiceWorkerCaches: clearCachesMock }));

import { logoutFrontendSession } from "./logout";

describe("central frontend logout", () => {
  beforeEach(() => {
    clearCachesMock.mockReset();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("purges client state immediately and still resolves when offline", async () => {
    const sessionCleared = vi.fn();
    window.addEventListener(SESSION_CLEARED_EVENT, sessionCleared);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    window.localStorage.setItem("ehc:registered-events", '["event-1"]');
    window.localStorage.setItem("ehc:last-seen-announcement-at", "123");
    window.localStorage.setItem("starredMessages", '["message-1"]');
    window.localStorage.setItem("streak-level-seen:member-1", "4");
    window.localStorage.setItem("ehc-theme", "dark");

    const logout = logoutFrontendSession();

    expect(clearCachesMock).toHaveBeenCalledTimes(1);
    expect(sessionCleared).toHaveBeenCalledTimes(1);
    expect(document.cookie).toContain(`${LOGOUT_PENDING_COOKIE}=1`);
    expect(window.localStorage.getItem("ehc:registered-events")).toBeNull();
    expect(window.localStorage.getItem("ehc:last-seen-announcement-at")).toBeNull();
    expect(window.localStorage.getItem("starredMessages")).toBeNull();
    expect(window.localStorage.getItem("streak-level-seen:member-1")).toBeNull();
    expect(window.localStorage.getItem("ehc-theme")).toBe("dark");
    await expect(logout).resolves.toBeUndefined();
    // The finally cleanup is intentionally idempotent.
    expect(clearCachesMock).toHaveBeenCalledTimes(2);
    window.removeEventListener(SESSION_CLEARED_EVENT, sessionCleared);
    vi.unstubAllGlobals();
  });
});
