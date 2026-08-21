import { describe, expect, it } from "vitest";
import { orderGatherings } from "./ordering";

const g = (id: string, isLive: boolean, nextOccurrenceAt: string | null) => ({
  id,
  isLive,
  nextOccurrenceAt,
});

const ids = (list: { id: string }[]) => list.map((item) => item.id);

describe("orderGatherings", () => {
  it("puts live gatherings ahead of upcoming ones", () => {
    const ordered = orderGatherings([
      g("soon", false, "2026-08-19T06:00:00.000Z"),
      g("live", true, "2026-08-19T05:00:00.000Z"),
    ]);
    expect(ids(ordered)).toEqual(["live", "soon"]);
  });

  it("orders upcoming gatherings by how soon they start", () => {
    const ordered = orderGatherings([
      g("later", false, "2026-08-21T05:30:00.000Z"),
      g("sooner", false, "2026-08-19T18:00:00.000Z"),
      g("soonest", false, "2026-08-19T11:00:00.000Z"),
    ]);
    expect(ids(ordered)).toEqual(["soonest", "sooner", "later"]);
  });

  it("sorts a gathering with no next occurrence last rather than dropping it", () => {
    const ordered = orderGatherings([
      g("unscheduled", false, null),
      g("scheduled", false, "2026-08-19T11:00:00.000Z"),
    ]);
    expect(ids(ordered)).toEqual(["scheduled", "unscheduled"]);
  });

  it("keeps live first even when it has no next occurrence and others do", () => {
    const ordered = orderGatherings([
      g("scheduled", false, "2026-08-19T11:00:00.000Z"),
      g("live", true, null),
    ]);
    expect(ids(ordered)).toEqual(["live", "scheduled"]);
  });

  it("does not mutate the caller's array", () => {
    const input = [
      g("second", false, "2026-08-20T05:30:00.000Z"),
      g("first", true, "2026-08-19T05:30:00.000Z"),
    ];
    orderGatherings(input);
    expect(ids(input)).toEqual(["second", "first"]);
  });

  it("returns an empty array unchanged", () => {
    expect(orderGatherings([])).toEqual([]);
  });
});
