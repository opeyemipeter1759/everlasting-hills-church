import { describe, expect, it } from "vitest";
import { noteSnippet } from "./HeroWordNotes";

describe("noteSnippet", () => {
  it("keeps a short verse whole", () => {
    expect(noteSnippet("Jesus wept.")).toBe("Jesus wept.");
  });

  it("shortens a long verse at a word, never mid-word", () => {
    const text = "For the Chief Musician. A Psalm by David. I waited patiently for the LORD. He turned to me, and heard my cry.";
    const note = noteSnippet(text, 60);
    expect(note.endsWith("…")).toBe(true);
    expect(note.length).toBeLessThanOrEqual(61);
    expect(text.startsWith(note.slice(0, -1))).toBe(true);
    expect(text.charAt(note.length - 1)).toBe(" ");
  });
});
