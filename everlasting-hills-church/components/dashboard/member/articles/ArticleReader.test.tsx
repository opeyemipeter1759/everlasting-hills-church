import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Article } from "@/lib/api/articles";
import ArticleReader from "./ArticleReader";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/dashboard/articles/a-word" }));
const role = vi.hoisted(() => ({ value: "SUPER_ADMIN" }));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ role: role.value, loggedIn: true }) }));
vi.mock("@/components/blog/ArticleComments", () => ({ default: () => null }));
vi.mock("./ReviewNotes", () => ({ default: () => null, applySuggestion: vi.fn() }));

const remove = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const article: Article = {
  id: "a-1",
  slug: "a-word",
  title: "A word",
  excerpt: null,
  subtitle: null,
  coverImageUrl: null,
  scriptureLabel: null,
  readingMinutes: 2,
  likeCount: 0,
  featuredAt: null,
  publishedAt: "2026-10-12T10:00:00.000Z",
  Author: { id: "p-9", Member: { id: "m-9", firstName: "Bayo", lastName: "Ade", photoUrl: null } },
  likedByMe: false,
  revision: 3,
  canReview: false,
  submittedAt: null,
  reviewedAt: null,
  reviewNote: null,
  body: "A body that is long enough to read.",
  status: "PUBLISHED",
  startVerseId: null,
  endVerseId: null,
  viewCount: 4,
  createdAt: "2026-10-12T09:00:00.000Z",
  updatedAt: "2026-10-12T10:00:00.000Z",
  isAuthor: false,
};
vi.mock("@/lib/api/articles", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api/articles")>()),
  useArticle: () => ({ data: article, isLoading: false, error: null }),
  useArticleFeed: () => ({ data: { articles: [], meta: { page: 1, limit: 20, total: 0 } } }),
  useSetArticleLike: () => ({ mutate: vi.fn(), isPending: false }),
  useSetArticleBookmark: () => ({ mutate: vi.fn(), isPending: false }),
  useSetArticleFeatured: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteArticle: () => ({ mutateAsync: remove, isPending: false }),
  useUpdateArticle: () => ({ mutateAsync: update, isPending: false }),
}));

beforeEach(() => {
  push.mockReset();
  remove.mockReset().mockResolvedValue({ id: "a-1" });
  update.mockReset().mockResolvedValue({ id: "a-1" });
  role.value = "SUPER_ADMIN";
});
afterEach(cleanup);

describe("moderating somebody else's story", () => {
  it("lets a super admin delete it after confirming", async () => {
    render(<ArticleReader slug="a-word" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" }).at(-1)!);
    await waitFor(() => expect(remove).toHaveBeenCalledWith("a-1"));
    expect(push).toHaveBeenCalledWith("/dashboard/articles");
  });

  it("lets a super admin take it down", async () => {
    render(<ArticleReader slug="a-word" />);
    fireEvent.click(screen.getByRole("button", { name: "Take down" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Take down" }).at(-1)!);
    await waitFor(() => expect(update).toHaveBeenCalledWith({ id: "a-1", revision: 3, status: "PENDING_REVIEW" }));
  });

  it("says why when the server refuses", async () => {
    remove.mockRejectedValue({ message: "Only the author, a pastor or an admin can delete an article." });
    render(<ArticleReader slug="a-word" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" }).at(-1)!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Only the author, a pastor or an admin");
  });

  it("offers no delete to an ordinary reader", () => {
    role.value = "MEMBER";
    render(<ArticleReader slug="a-word" />);
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
