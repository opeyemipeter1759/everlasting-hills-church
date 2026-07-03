import { describe, expect, it } from "vitest";
import {
  SERMON_STATUSES,
  toUiCount,
  toUiSermon,
  type SermonListItemRaw,
} from "./sermon-types";

/**
 * The sermon types module is a thin adapter between the Prisma-leaky API shape
 * (`_count.SermonReaction`) and the UI-friendly shape (`_count.reactions`).
 * Easy to break with a typo; cheap to test.
 */

describe("SERMON_STATUSES", () => {
  it("contains exactly the three Prisma SermonStatus literals", () => {
    expect(SERMON_STATUSES).toEqual(["DRAFT", "PUBLISHED", "SCHEDULED"]);
  });
});

describe("toUiCount", () => {
  it("aliases Prisma relation names to UI-friendly names", () => {
    expect(toUiCount({ SermonReaction: 5, SermonBookmark: 12, SermonComment: 7 })).toEqual({
      reactions: 5,
      bookmarks: 12,
      comments: 7,
    });
  });

  it("handles zero counts", () => {
    expect(toUiCount({ SermonReaction: 0, SermonBookmark: 0, SermonComment: 0 })).toEqual({
      reactions: 0,
      bookmarks: 0,
      comments: 0,
    });
  });
});

describe("toUiSermon", () => {
  const raw: SermonListItemRaw = {
    id: "s1",
    title: "The Power of Faith",
    slug: "power-of-faith-2026-05",
    speaker: "Pastor John",
    date: "2026-05-25T09:00:00.000Z",
    type: "SINGLE",
    scriptureRef: "Hebrews 11:1",
    series: "Faith",
    seriesSlug: "faith",
    description: "A message on trusting God",
    audioUrl: "https://cdn.example.com/audio.mp3",
    audioDuration: 1800,
    videoUrl: null,
    thumbnailUrl: null,
    playCount: 42,
    tags: ["faith", "hope"],
    status: "PUBLISHED",
    _count: { SermonReaction: 8, SermonBookmark: 3, SermonComment: 4 },
  };

  it("preserves identity fields verbatim", () => {
    const ui = toUiSermon(raw);
    expect(ui.id).toBe(raw.id);
    expect(ui.title).toBe(raw.title);
    expect(ui.slug).toBe(raw.slug);
    expect(ui.speaker).toBe(raw.speaker);
    expect(ui.date).toBe(raw.date);
  });

  it("maps _count via toUiCount", () => {
    expect(toUiSermon(raw)._count).toEqual({ reactions: 8, bookmarks: 3, comments: 4 });
  });

  it("preserves tags array reference content (no shuffle)", () => {
    expect(toUiSermon(raw).tags).toEqual(["faith", "hope"]);
  });

  it("does NOT expose the raw status field unless explicitly mapped (UI shouldn't render DRAFT etc.)", () => {
    // SermonListItemUi intentionally omits `status` — it's only set on admin-list responses.
    const ui = toUiSermon(raw);
    expect("status" in ui).toBe(false);
  });
});
