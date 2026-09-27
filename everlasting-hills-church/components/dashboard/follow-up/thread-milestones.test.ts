import { describe, expect, it } from "vitest";
import type { FollowUpNote } from "@/lib/api/follow-up-pipeline";
import { buildThread } from "./thread-utils";

const note = (id: string, iso: string, author = "bola"): FollowUpNote =>
  ({ id, createdAt: iso, body: id, author: { profileId: author, name: author } }) as unknown as FollowUpNote;

const kinds = (items: ReturnType<typeof buildThread>) =>
  items.filter((i) => i.kind !== "day").map((i) => (i.kind === "message" ? i.note.id : `[${i.status}]`));

describe("the integrated line in a person's activity", () => {
  const notes = [
    note("called her", "2026-09-10T09:00:00Z"),
    note("she came Sunday", "2026-09-14T09:00:00Z"),
    note("welcome to the team", "2026-09-21T09:00:00Z"),
  ];

  it("sits where they were integrated: earlier activity above, the new conversation below", () => {
    const items = buildThread(notes, [{ status: "INTEGRATED", at: "2026-09-20T10:00:00Z" }]);
    expect(kinds(items)).toEqual(["called her", "she came Sunday", "[INTEGRATED]", "welcome to the team"]);
  });

  it("closes the thread when nothing has been said since", () => {
    const items = buildThread(notes, [{ status: "OPTED_OUT", at: "2026-09-25T10:00:00Z" }]);
    expect(kinds(items).at(-1)).toBe("[OPTED_OUT]");
  });

  it("keeps every past activity, and breaks a run of messages across the line", () => {
    const burst = [note("a", "2026-09-20T09:59:00Z"), note("b", "2026-09-20T10:01:00Z")];
    const items = buildThread(burst, [{ status: "INTEGRATED", at: "2026-09-20T10:00:00Z" }]);
    const b = items.find((i) => i.kind === "message" && i.note.id === "b");
    expect(b && b.kind === "message" && b.compact).toBe(false);
    expect(items.filter((i) => i.kind === "message")).toHaveLength(2);
  });

  it("is just the thread when they were never moved on", () => {
    expect(kinds(buildThread(notes))).toEqual(["called her", "she came Sunday", "welcome to the team"]);
  });
});
