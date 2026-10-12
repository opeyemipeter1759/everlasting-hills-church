import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BlogComment } from "@/lib/api/blog";
import ArticleComments from "./ArticleComments";
import ShareMenu from "@/components/medium/ShareMenu";

const state = vi.hoisted(() => ({ items: [] as BlogComment[] }));
const post = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/blog", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api/blog")>()),
  useArticleComments: () => ({ data: { items: state.items, total: state.items.length, page: 1, pageSize: 20 }, isLoading: false, isError: false, refetch: vi.fn() }),
  usePostArticleComment: () => ({ mutateAsync: post, isPending: false }),
  useDeleteArticleComment: () => ({ mutateAsync: remove, isPending: false }),
}));

const comment = (over: Partial<BlogComment> = {}): BlogComment => ({
  id: "c1",
  authorName: "Tunde Bakare",
  body: "This blessed me.",
  createdAt: "2026-10-12T10:00:00.000Z",
  isMember: false,
  memberId: null,
  photoUrl: null,
  ...over,
});

beforeEach(() => {
  state.items = [];
  post.mockReset().mockResolvedValue({ id: "c2" });
  remove.mockReset().mockResolvedValue({ ok: true });
  window.localStorage.clear();
});
afterEach(cleanup);

describe("responses on the public blog", () => {
  it("asks a visitor for their name and remembers it", async () => {
    render(<ArticleComments slug="a-word" asMember={false} />);
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Tunde" } });
    fireEvent.change(screen.getByLabelText("Your comment"), { target: { value: "Amen!" } });
    fireEvent.click(screen.getByRole("button", { name: "Respond" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith({ name: "Tunde", body: "Amen!" }));
    expect(await screen.findByText("Thank you, your response is up.")).toBeInTheDocument();
    expect(window.localStorage.getItem("ehc.blog.name")).toBe("Tunde");
  });

  it("does not post without a name", () => {
    render(<ArticleComments slug="a-word" asMember={false} />);
    fireEvent.change(screen.getByLabelText("Your comment"), { target: { value: "Amen!" } });
    fireEvent.click(screen.getByRole("button", { name: "Respond" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Tell us your name.");
    expect(post).not.toHaveBeenCalled();
  });

  it("lets a member respond as themselves, and remove what they may", async () => {
    state.items = [comment({ isMember: true, memberId: "m1", canDelete: true })];
    render(<ArticleComments slug="a-word" asMember />);
    expect(screen.getByRole("heading", { name: "Responses (1)" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tunde Bakare" })).toHaveAttribute("href", "/dashboard/family/m1");
    fireEvent.click(screen.getByRole("button", { name: "Remove Tunde Bakare's comment" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("c1"));
  });
});

describe("the share menu", () => {
  it("copies the link and offers WhatsApp, X, Facebook and LinkedIn", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const url = "https://www.everlastinghills.church/articles/a-word";
    render(<ShareMenu url={url} title="A word" />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Copy link/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(url));
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /WhatsApp/ }).getAttribute("href")).toContain(encodeURIComponent(url));
    expect(screen.getByRole("menuitem", { name: /Facebook/ })).toHaveAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    expect(screen.getByRole("menuitem", { name: /LinkedIn/ }).getAttribute("href")).toContain(encodeURIComponent(url));
  });
});
