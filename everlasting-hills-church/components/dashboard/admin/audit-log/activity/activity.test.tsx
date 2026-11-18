import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AuditItem } from "@/lib/api/audit-trail";
import { areaLabel, fieldLabel, plainValue, toneOf } from "@/lib/audit/format";
import { ActivityRow } from "./ActivityRow";

const base: AuditItem = {
  id: "a1",
  at: "2026-11-18T08:51:00.000Z",
  actorId: "auth-1",
  actorName: "Okunola Peter",
  kind: "request",
  area: "users",
  summary: "Grant a global role",
  method: "POST",
  targets: [{ kind: "Person", name: "Ada Eze" }],
  params: { profileId: "p1" },
  body: { role: "ADMIN", password: "[hidden]" },
  bodyHidden: false,
  records: [{ id: "r1", action: "GRANT", entity: "RoleGrant", entityId: "p1", before: null, after: { role: "ADMIN" }, at: "2026-11-18T08:51:00.000Z" }],
};

afterEach(cleanup);

describe("a line in the audit trail", () => {
  it("says who did what to whom, where and when, and opens to the details", () => {
    render(<ul><ActivityRow item={base} /></ul>);
    expect(screen.getByText("Okunola Peter")).toBeTruthy();
    expect(screen.getByText("Grant a global role")).toBeTruthy();
    expect(screen.getByText("Person: Ada Eze")).toBeTruthy();
    expect(screen.getByText(/People and roles · 18 Nov 2026, 09:51/)).toBeTruthy();
    expect(screen.queryByText("What they entered")).toBeNull();

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(screen.getByText("What they entered")).toBeTruthy();
    expect(screen.getByText("[hidden]")).toBeTruthy();
    expect(screen.getByText("What changed on record")).toBeTruthy();
    expect(screen.getAllByText("ADMIN")).toHaveLength(2);
  });

  it("keeps a private message's words out, and says so", () => {
    render(<ul><ActivityRow item={{ ...base, body: null, bodyHidden: true, records: [] }} /></ul>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/the words are not/)).toBeTruthy();
  });

  it("names the system for changes nobody made by hand", () => {
    render(<ul><ActivityRow item={{ ...base, actorId: null, actorName: null, kind: "record", method: null, targets: [] }} /></ul>);
    expect(screen.getByText("The system")).toBeTruthy();
  });
});

describe("audit trail words", () => {
  it("names sections and fields in plain words", () => {
    expect(areaLabel("cms")).toBe("Public site (CMS)");
    expect(areaLabel("service-teams")).toBe("Service teams");
    expect(fieldLabel("firstName")).toBe("First name");
  });

  it("colours by what the change did", () => {
    expect(toneOf("DELETE")).toBe("remove");
    expect(toneOf("PATCH")).toBe("change");
    expect(toneOf(null, "CREATE")).toBe("add");
  });

  it("shows simple values on one line", () => {
    expect(plainValue(true)).toBe("Yes");
    expect(plainValue(["a", "b"])).toBe("a, b");
    expect(plainValue({ a: 1 })).toBeNull();
  });
});
