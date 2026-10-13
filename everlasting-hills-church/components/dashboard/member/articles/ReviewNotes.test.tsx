import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReviewNote } from "@/lib/api/articles";
import ReviewNotes, { applySuggestion, findQuoteRange } from "./ReviewNotes";

const state = vi.hoisted(() => ({ notes: [] as ReviewNote[], isReviewer: true }));
const add = vi.hoisted(() => vi.fn());
const resolve = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/articles", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api/articles")>()),
  useReviewNotes: () => ({ data: { isAuthor: !state.isReviewer, isReviewer: state.isReviewer, notes: state.notes }, isError: false }),
  useAddReviewNote: () => ({ mutateAsync: add, isPending: false }),
  useResolveReviewNote: () => ({ mutate: resolve, isPending: false }),
  useDeleteReviewNote: () => ({ mutate: vi.fn(), isPending: false }),
}));

const note = (over: Partial<ReviewNote> = {}): ReviewNote => ({
  id: "n1",
  authorName: "Pastor Ade",
  fromReviewer: true,
  body: "Say it more simply?",
  quote: "the Lord is good",
  suggestion: "the LORD is good",
  resolvedAt: null,
  createdAt: "2026-10-13T09:00:00.000Z",
  mine: false,
  ...over,
});

beforeEach(() => {
  state.notes = [];
  state.isReviewer = true;
  add.mockReset().mockResolvedValue({});
  resolve.mockReset();
});
afterEach(cleanup);

describe("finding a highlighted passage", () => {
  it("matches across paragraphs and spacing", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>Taste and see that</p><p>the Lord   is good.</p>";
    document.body.appendChild(root);
    const range = findQuoteRange(root, "see that\nthe Lord is good");
    expect(range?.toString()).toBe("see thatthe Lord   is good");
    expect(findQuoteRange(root, "not in the text")).toBeNull();
    root.remove();
  });

  it("applies a suggestion to the draft, even when the words were in bold", () => {
    expect(applySuggestion("I know the Lord is good to me.", "the Lord is good", "the LORD is good")).toBe("I know the LORD is good to me.");
    expect(applySuggestion("I know **the Lord** is good.", "the Lord is good", "God is good")).toBe("I know God is good.");
    expect(applySuggestion("Nothing here.", "the Lord", "God")).toBeNull();
  });
});

describe("review notes", () => {
  it("lets a reviewer highlight words and comment with a suggestion, without deciding", async () => {
    document.body.insertAdjacentHTML("beforeend", '<div id="body-under-test"><p>I know the Lord is good to me.</p></div>');
    render(<ReviewNotes articleId="a-1" bodyId="body-under-test" enabled />);
    const text = document.querySelector("#body-under-test p")!.firstChild as Text;
    const range = document.createRange();
    range.setStart(text, 7);
    range.setEnd(text, 23);
    range.getBoundingClientRect = () => ({ left: 10, top: 100, width: 50, height: 10 }) as DOMRect;
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup"));
    });

    fireEvent.click(await screen.findByRole("button", { name: "Comment" }));
    expect(screen.getByText("“the Lord is good”")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your comment on this passage"), { target: { value: "Use small capitals for LORD" } });
    fireEvent.click(screen.getByLabelText("Suggest new wording"));
    fireEvent.change(screen.getByLabelText("Suggested wording"), { target: { value: "the LORD is good" } });
    fireEvent.click(screen.getByRole("button", { name: "Send comment" }));
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith({ body: "Use small capitals for LORD", quote: "the Lord is good", suggestion: "the LORD is good" }),
    );
    document.getElementById("body-under-test")!.remove();
  });

  it("lets a reviewer comment on the whole story", async () => {
    render(<ReviewNotes articleId="a-1" enabled />);
    fireEvent.click(screen.getByRole("button", { name: /Comment on the whole story/ }));
    fireEvent.change(screen.getByLabelText("Your comment"), { target: { value: "Lovely. One small fix." } });
    fireEvent.click(screen.getByRole("button", { name: "Send comment" }));
    await waitFor(() => expect(add).toHaveBeenCalledWith({ body: "Lovely. One small fix.", quote: null, suggestion: null }));
  });

  it("lets the author apply a suggestion, which resolves it", () => {
    state.isReviewer = false;
    state.notes = [note()];
    const onApply = vi.fn().mockReturnValue(true);
    render(<ReviewNotes articleId="a-1" enabled onApply={onApply} />);
    expect(screen.getByText("Private notes from your reviewers. Only you and the reviewers see them.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Apply suggestion/ }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ id: "n1" }));
    expect(resolve).toHaveBeenCalledWith({ noteId: "n1", resolved: true });
  });
});
