import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleCard, MyArticle } from "@/lib/api/articles";
import { StoryRow } from "@/components/medium/parts";
import { compact, fromCard, storyDate } from "@/components/medium/story";
import ArticleFeed from "./ArticleFeed";
import ArticleEditor, { validateArticle } from "./ArticleEditor";
import MyArticles from "./MyArticles";

const nav = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn() }),
  usePathname: () => "/dashboard/articles",
  useSearchParams: () => nav.params,
}));

const api = vi.hoisted(() => ({
  feed: vi.fn(),
  like: vi.fn(),
  save: vi.fn(),
  create: vi.fn(),
  mine: [] as MyArticle[],
}));
vi.mock("@/lib/api/articles", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api/articles")>()),
  useArticleFeed: api.feed,
  useSetArticleLike: () => ({ mutate: api.like, isPending: false }),
  useSetArticleBookmark: () => ({ mutate: api.save, isPending: false }),
  useArticleReviewAccess: () => ({ data: { canReview: false, pending: 0 } }),
  useArticle: () => ({ data: undefined, isLoading: false, error: null }),
  useCreateArticle: () => ({ mutateAsync: api.create, isPending: false }),
  useUpdateArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMyArticles: () => ({ data: api.mine, isLoading: false, error: null, refetch: vi.fn() }),
}));

const card = (over: Partial<ArticleCard> = {}): ArticleCard => ({
  id: "a1",
  slug: "walking-in-faith",
  title: "Walking in faith",
  excerpt: "Lessons from Hebrews 11 for ordinary weeks.",
  subtitle: null,
  coverImageUrl: null,
  scriptureLabel: "Hebrews 11",
  readingMinutes: 4,
  likeCount: 8400,
  featuredAt: null,
  publishedAt: "2026-08-31T09:00:00.000Z",
  Author: { id: "p1", Member: { id: "m1", firstName: "Ada", lastName: "Obi", photoUrl: null } },
  likedByMe: false,
  bookmarkedByMe: false,
  commentCount: 314,
  ...over,
});

beforeEach(() => {
  nav.push.mockReset();
  nav.params = new URLSearchParams();
  api.like.mockReset();
  api.save.mockReset();
  api.create.mockReset();
  api.feed.mockReset().mockImplementation(() => ({
    data: { articles: [card()], meta: { page: 1, limit: 20, total: 1 } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }));
  api.mine = [];
  window.localStorage.clear();
});
afterEach(cleanup);

describe("Medium-style story rows", () => {
  it("formats counts and dates as Medium does", () => {
    expect(compact(8400)).toBe("8.4K");
    expect(compact(314)).toBe("314");
    expect(compact(12_400)).toBe("12K");
    expect(storyDate("2026-08-31T09:00:00.000Z", new Date("2026-10-12"))).toBe("Aug 31");
    expect(storyDate("2025-08-31T09:00:00.000Z", new Date("2026-10-12"))).toBe("Aug 31, 2025");
  });

  it("prefers the author's subtitle to the excerpt", () => {
    expect(fromCard(card()).subtitle).toBe("Lessons from Hebrews 11 for ordinary weeks.");
    expect(fromCard(card({ subtitle: "A short word" })).subtitle).toBe("A short word");
  });

  it("shows who wrote it, the counts, and like and save", () => {
    const like = vi.fn();
    const save = vi.fn();
    render(<StoryRow story={fromCard(card())} href="/dashboard/articles/walking-in-faith" authorHref="/dashboard/family/m1" onLike={like} onBookmark={save} />);
    expect(screen.getByRole("link", { name: "Ada Obi" })).toHaveAttribute("href", "/dashboard/family/m1");
    expect(screen.getByRole("heading", { name: "Walking in faith" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "314 responses" })).toHaveAttribute("href", "/dashboard/articles/walking-in-faith#comments");
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    fireEvent.click(screen.getByRole("button", { name: "Save for later" }));
    expect(like).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });
});

describe("the stories feed", () => {
  it("has For you, Featured and Saved, and likes and saves in place", () => {
    render(<ArticleFeed />);
    expect(screen.getByRole("tab", { name: "For you" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Saved" }));
    expect(api.feed).toHaveBeenCalledWith(1, undefined, { tab: "saved", q: "" });

    fireEvent.click(screen.getAllByRole("button", { name: "Like" })[0]);
    expect(api.like).toHaveBeenCalledWith({ id: "a1", liked: true, slug: "walking-in-faith" });
    fireEvent.click(screen.getAllByRole("button", { name: "Save for later" })[0]);
    expect(api.save).toHaveBeenCalledWith({ id: "a1", saved: true, slug: "walking-in-faith" });
  });

  it("says why a tab is empty", () => {
    api.feed.mockImplementation(() => ({ data: { articles: [], meta: { page: 1, limit: 20, total: 0 } }, isLoading: false, isError: false, refetch: vi.fn() }));
    render(<ArticleFeed />);
    fireEvent.click(screen.getByRole("tab", { name: "Saved" }));
    expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument();
  });
});

describe("writing a story", () => {
  it("checks the title and length before saving", () => {
    expect(validateArticle("Hi", "Long enough body for a story here.")).toMatch(/title/);
    expect(validateArticle("A proper title", "Too short")).toMatch(/more/);
    expect(validateArticle("A proper title", "Long enough body for a story here.")).toBeNull();
  });

  it("submits the title, subtitle and story for review", async () => {
    api.create.mockResolvedValue({ id: "a9", slug: "a-new-word", status: "PENDING_REVIEW" });
    render(<ArticleEditor />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "A new word" } });
    fireEvent.change(screen.getByLabelText("Subtitle"), { target: { value: "What Psalm 23 did" } });
    fireEvent.change(screen.getByLabelText("Your story"), { target: { value: "The Lord is my shepherd, and this week I learnt why." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "A new word", subtitle: "What Psalm 23 did", publish: true, coverImageUrl: null }),
      ),
    );
    expect(nav.push).toHaveBeenCalledWith("/dashboard/articles/a-new-word");
  });

  it("publishes what was learned from a Bible reading, with the passage attached", async () => {
    const label = "Deuteronomy 29 · Nehemiah 13 · Esther 1 · Ecclesiastes 12 · Song of Solomon 1-2 · Zechariah 8-9 · Revelation 16-17 · 2 Peter 3 · 1 John 1-2";
    nav.params = new URLSearchParams({ start: "5029001", end: "62002029", label });
    api.create.mockResolvedValue({ id: "a7", slug: "what-i-learned", status: "PENDING_REVIEW" });
    render(<ArticleEditor />);
    expect(screen.getByText(`About ${label}`)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "What I learned today" } });
    fireEvent.change(screen.getByLabelText("Your story"), { target: { value: "God keeps His covenant even when we forget ours." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({ scriptureLabel: label, startVerseId: 5029001, endVerseId: 62002029, publish: true }),
      ),
    );
  });

  it("offers back words left on this device", () => {
    window.localStorage.setItem(
      "ehc.article-draft.new",
      JSON.stringify({ title: "Lost words", subtitle: "", body: "Something I was writing before the network dropped.", coverImageUrl: null, savedAt: Date.now() }),
    );
    render(<ArticleEditor />);
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(screen.getByLabelText("Title")).toHaveValue("Lost words");
  });
});

describe("your stories", () => {
  it("groups them by status and shows a requested change", () => {
    api.mine = [
      { id: "d1", slug: "d1", title: "My draft", excerpt: null, status: "DRAFT", scriptureLabel: null, readingMinutes: 2, likeCount: 0, viewCount: 0, publishedAt: null, updatedAt: "2026-10-10T00:00:00.000Z", submittedAt: null, reviewedAt: null, reviewNote: "Add a verse" },
      { id: "p1", slug: "p1", title: "Live one", excerpt: null, status: "PUBLISHED", scriptureLabel: null, readingMinutes: 3, likeCount: 5, viewCount: 40, publishedAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", submittedAt: null, reviewedAt: null, reviewNote: null },
    ];
    render(<MyArticles />);
    expect(screen.getByText("My draft")).toBeInTheDocument();
    expect(screen.getByText("Changes requested: Add a verse")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Published 1" }));
    expect(screen.getByText("Live one")).toBeInTheDocument();
    expect(screen.queryByText("My draft")).not.toBeInTheDocument();
  });
});
