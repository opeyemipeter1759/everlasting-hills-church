import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Passage } from "@/lib/api/reading-plan";
import { ChapterPassage } from "./ChapterPassage";

function verse(
  verseId: number,
  book: string,
  chapter: number,
  number: number,
  text: string,
): Passage["verses"][number] {
  return { verseId, book, chapter, verse: number, text };
}

describe("ChapterPassage", () => {
  it("separates chapters and different books with the same chapter number", () => {
    const { container } = render(
      <ChapterPassage verses={[
        verse(1, "Genesis", 1, 31, "The end of the first chapter."),
        verse(2, "Genesis", 2, 1, "The beginning of the next chapter."),
        verse(3, "Genesis", 2, 2, "The next verse stays in its chapter."),
        verse(4, "Exodus", 2, 1, "The beginning of another book."),
      ]} />,
    );

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent))
      .toEqual(["Genesis 1", "Genesis 2", "Exodus 2"]);
    expect(within(screen.getByRole("region", { name: "Genesis 2" })).getAllByRole("paragraph"))
      .toHaveLength(2);
    expect(screen.getByRole("region", { name: "Exodus 2" }))
      .toHaveTextContent("The beginning of another book.");
    expect(Array.from(container.querySelectorAll("p")).map((paragraph) => paragraph.lastChild?.textContent))
      .toEqual([
        "The end of the first chapter.",
        "The beginning of the next chapter.",
        "The next verse stays in its chapter.",
        "The beginning of another book.",
      ]);
  });

  it("preserves partial chapters, supplied verse order, and exact verse text", () => {
    const verses = [
      verse(11, "John", 3, 16, "For God so loved the world, that he gave his only begotten Son."),
      verse(12, "John", 3, 17, "For God sent not his Son into the world to condemn the world;"),
      verse(13, "John", 4, 2, "(Though Jesus himself baptized not, but his disciples,)"),
    ];
    const original = structuredClone(verses);
    const { container } = render(<ChapterPassage verses={verses} />);

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent))
      .toEqual(["John 3", "John 4"]);
    expect(Array.from(container.querySelectorAll("p > span[aria-hidden]")).map((number) => number.textContent))
      .toEqual(["16", "17", "2"]);
    expect(Array.from(container.querySelectorAll("p")).map((paragraph) => paragraph.lastChild?.textContent))
      .toEqual(verses.map((item) => item.text));
    expect(verses).toEqual(original);
  });

  it("gives repeated chapters across separate portions unique accessible headings", () => {
    const { container } = render(
      <>
        <ChapterPassage verses={[verse(1, "Psalms", 1, 1, "The first portion.")]} />
        <ChapterPassage verses={[verse(2, "Psalms", 1, 2, "The second portion.")]} />
      </>,
    );

    const regions = screen.getAllByRole("region", { name: "Psalms 1" });
    expect(regions).toHaveLength(2);
    const ids = Array.from(container.querySelectorAll("[id]")).map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const region of regions) {
      expect(within(region).getByRole("heading", { name: "Psalms 1" }).id)
        .toBe(region.getAttribute("aria-labelledby"));
    }
  });

  it("does not invent a chapter when no verses are available", () => {
    render(<ChapterPassage verses={[]} />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
