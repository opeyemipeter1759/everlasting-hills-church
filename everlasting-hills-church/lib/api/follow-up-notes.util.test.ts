import { describe, expect, it } from "vitest";
import type { FollowUpNote } from "./follow-up-pipeline";
import { applyReaction, draftNote, isPending, markDeleted, replaceNote } from "./follow-up-notes.util";

const me = { profileId: "p1", member: { firstName: "Grace", lastName: "Ade", photoUrl: null } } as never;

function note(id: string, replies: FollowUpNote[] = []): FollowUpNote {
  return {
    id,
    body: id,
    createdAt: "2026-09-23T10:00:00.000Z",
    editedAt: null,
    author: { profileId: "p2", name: "John", photoUrl: null },
    reactions: [],
    replies,
    canEdit: false,
    canDelete: false,
  };
}

/**
 * These run on every keystroke of the thread's optimistic updates, so a
 * mistake here shows the wrong conversation until the server answers.
 */
describe("thread optimistic updates", () => {
  it("marks a just-sent message as pending and attributes it to you", () => {
    const draft = draftNote("Called her", me);

    expect(isPending(draft)).toBe(true);
    expect(draft.author.name).toBe("Grace Ade");
    expect(isPending(note("real-id"))).toBe(false);
  });

  it("changes a message wherever it sits, including inside replies", () => {
    const notes = [note("a", [note("a1")]), note("b")];

    const updated = replaceNote(notes, "a1", (n) => ({ ...n, body: "edited" }));

    expect(updated[0].replies[0].body).toBe("edited");
    expect(updated[1].body).toBe("b");
  });

  it("marks a deleted message without losing the replies under it", () => {
    const notes = [note("a", [note("a1"), note("a2")])];

    const updated = markDeleted(notes, "a");

    expect(updated[0]).toMatchObject({ deleted: true, body: "", canEdit: false, canDelete: false });
    expect(updated[0].replies.map((r) => r.id)).toEqual(["a1", "a2"]);
  });

  it("marks a deleted reply and leaves its parent alone", () => {
    const updated = markDeleted([note("a", [note("a1"), note("a2")])], "a1");

    expect(updated[0].deleted).toBeUndefined();
    expect(updated[0].replies.map((r) => [r.id, !!r.deleted])).toEqual([["a1", true], ["a2", false]]);
  });

  it("adds your emoji, then takes it back on a second tap", () => {
    const added = applyReaction(note("a"), "🙏", me);
    expect(added.reactions).toEqual([{ emoji: "🙏", count: 1, mine: true, names: ["Grace Ade"] }]);

    const removed = applyReaction(added, "🙏", me);
    expect(removed.reactions).toEqual([]);
  });

  it("joins someone else's emoji rather than starting a second pill", () => {
    const existing = { ...note("a"), reactions: [{ emoji: "👍", count: 1, mine: false, names: ["John"] }] };

    const joined = applyReaction(existing, "👍", me);

    expect(joined.reactions).toEqual([{ emoji: "👍", count: 2, mine: true, names: ["John", "Grace Ade"] }]);
  });
});
