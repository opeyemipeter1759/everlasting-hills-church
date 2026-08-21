import { describe, expect, it, vi } from "vitest";
import { resolveTrustedRoutingRole } from "./routing-role";

describe("middleware routing role source", () => {
  it("resolves a forged elevated hint to authenticated backend truth", async () => {
    const loadBackendRole = vi.fn().mockResolvedValue("MEMBER");
    await expect(
      resolveTrustedRoutingRole({
        signedRole: "MEMBER",
        untrustedRoleHint: "SUPER_ADMIN",
        loadBackendRole,
      }),
    ).resolves.toBe("MEMBER");
    expect(loadBackendRole).toHaveBeenCalledOnce();
  });

  it("uses authenticated /auth/me for a valid signed JWT with no role claim", async () => {
    const loadBackendRole = vi.fn().mockResolvedValue("MEMBER");
    await expect(
      resolveTrustedRoutingRole({
        signedRole: null,
        untrustedRoleHint: "MEMBER",
        loadBackendRole,
      }),
    ).resolves.toBe("MEMBER");
  });

  it("uses the backend when a live hint signals promotion or demotion", async () => {
    const loadBackendRole = vi.fn().mockResolvedValue("ADMIN_HEAD");
    await expect(
      resolveTrustedRoutingRole({
        signedRole: "MEMBER",
        untrustedRoleHint: "ADMIN_HEAD",
        loadBackendRole,
      }),
    ).resolves.toBe("ADMIN_HEAD");
  });

  it("uses live backend truth even when the writable hint matches a signed claim", async () => {
    const loadBackendRole = vi.fn().mockResolvedValue("MEMBER");
    await expect(
      resolveTrustedRoutingRole({
        signedRole: "ADMIN_HEAD",
        untrustedRoleHint: "ADMIN_HEAD",
        loadBackendRole,
      }),
    ).resolves.toBe("MEMBER");
    expect(loadBackendRole).toHaveBeenCalledOnce();
  });

  it("uses a verified signed claim only when no live backend loader exists", async () => {
    await expect(
      resolveTrustedRoutingRole({ signedRole: "MEMBER", untrustedRoleHint: "SUPER_ADMIN" }),
    ).resolves.toBe("MEMBER");
  });

  it("prefers a successful backend refresh and fails closed on fallback failure", async () => {
    await expect(
      resolveTrustedRoutingRole({
        hasRefreshedSession: true,
        refreshedRole: "ADMIN_HEAD",
        signedRole: "MEMBER",
        untrustedRoleHint: "SUPER_ADMIN",
      }),
    ).resolves.toBe("ADMIN_HEAD");
    await expect(
      resolveTrustedRoutingRole({
        signedRole: null,
        untrustedRoleHint: "SUPER_ADMIN",
        loadBackendRole: async () => null,
      }),
    ).resolves.toBeNull();
  });
});
