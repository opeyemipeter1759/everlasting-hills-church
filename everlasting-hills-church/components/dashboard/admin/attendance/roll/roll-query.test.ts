import { describe, expect, it } from "vitest";
import { isOneService, rollQuery, scopeOptions, type RollState } from "./roll-query";

const base: RollState = { scope: "svc-1", status: undefined, gender: undefined, name: "", sort: null, page: 1, limit: 20 };

describe("rollQuery", () => {
  it("reads one service as an alphabetical roll", () => {
    expect(rollQuery(base)).toEqual({ page: 1, limit: 20, serviceId: "svc-1", sortBy: "name", sortOrder: "ASC" });
  });

  it("reads a wider scope newest first", () => {
    expect(rollQuery({ ...base, scope: "sunday" })).toEqual({ page: 1, limit: 20, serviceKey: "sunday", sortBy: "date", sortOrder: "DESC" });
    expect(rollQuery({ ...base, scope: "all" })).toEqual({ page: 1, limit: 20, sortBy: "date", sortOrder: "DESC" });
  });

  it("passes the filters and the chosen sort", () => {
    const q = rollQuery({ ...base, status: "ABSENT", gender: "female", name: "  ada ", sort: { col: "markedBy", dir: "desc" }, page: 3, limit: 50 });
    expect(q).toEqual({ page: 3, limit: 50, serviceId: "svc-1", status: "ABSENT", gender: "female", name: "ada", sortBy: "markedAt", sortOrder: "DESC" });
  });

  it("tells a service id from a wider scope", () => {
    expect(isOneService("svc-1")).toBe(true);
    expect(isOneService("wednesday")).toBe(false);
  });

  it("lists recent services first, then the wider scopes", () => {
    const options = scopeOptions([
      { id: "s1", name: "x", serviceType: "SUNDAY", date: "2026-11-08", headcount: null, checkedIn: 43, checkedInByGender: { men: 20, women: 23, unknown: 0 }, absent: 38 },
    ]);
    expect(options[0]).toEqual({ value: "s1", label: "Sunday, 8 Nov", group: "Recent services", hint: "43 in" });
    expect(options.slice(1).map((o) => o.value)).toEqual(["all", "sunday", "wednesday"]);
  });
});
