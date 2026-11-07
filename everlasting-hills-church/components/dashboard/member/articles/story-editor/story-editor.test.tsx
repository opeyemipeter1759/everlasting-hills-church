import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ArticleEditor from "../ArticleEditor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/articles/write",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/articles", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api/articles")>()),
  useArticle: () => ({ data: undefined, isLoading: false, error: null }),
  useCreateArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function restoreDraft(body: string) {
  window.localStorage.setItem(
    "ehc.article-draft.new",
    JSON.stringify({ title: "Formatted", subtitle: "", body, coverImageUrl: null, savedAt: Date.now() }),
  );
  render(<ArticleEditor />);
  fireEvent.click(screen.getByRole("button", { name: "Restore" }));
}

describe("the story editor", () => {
  it("shows the story formatted, not as Markdown", async () => {
    restoreDraft("## Grace\n\nSome **bold** words.\n\n- one\n- two");
    const story = await screen.findByRole("textbox", { name: "Your story" });
    await waitFor(() => expect(story.querySelector("h2")).toHaveTextContent("Grace"));
    expect(story.querySelector("strong")).toHaveTextContent("bold");
    expect(story.querySelectorAll("li")).toHaveLength(2);
    expect(story).not.toHaveTextContent("**");
  });

  it("switches to the Markdown source and remembers the choice", () => {
    restoreDraft("Some **bold** words.");
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    expect(screen.getByLabelText("Your story")).toHaveValue("Some **bold** words.");
    expect(window.localStorage.getItem("ehc.article-editor-mode")).toBe("markdown");
  });
});
