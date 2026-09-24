import { describe, expect, it } from "vitest";
import type { FollowUpNote } from "./follow-up-pipeline";
import { applyReaction, draftNote, isPending, replaceNote, withoutNote } from "./follow-up-notes.util";

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

  it("removes a reply without touching its parent", () => {
    const notes = [note("a", [note("a1"), note("a2")])];

    const updated = withoutNote(notes, "a1");

    expect(updated[0].replies.map((r) => r.id)).toEqual(["a2"]);
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
