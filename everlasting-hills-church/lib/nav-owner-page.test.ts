import { describe, expect, it } from "vitest";
import { ownerPageFor } from "./nav-owner-page";

const items = [
  { href: "/dashboard/cms", minRole: "PASTOR" },
  { href: "/dashboard/admin", minRole: "ADMIN" },
];

describe("ownerPageFor", () => {
  it("puts the homepage editor under the CMS page", () => {
    expect(ownerPageFor("/dashboard/settings/homepage", items)?.href).toBe("/dashboard/cms");
  });

  it("leaves every other screen alone", () => {
    expect(ownerPageFor("/dashboard/admin/members", items)).toBeNull();
    expect(ownerPageFor("/dashboard/settings/homepage-x", items)).toBeNull();
  });
});
