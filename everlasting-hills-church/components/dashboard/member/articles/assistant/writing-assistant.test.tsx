import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ArticleEditor from "../ArticleEditor";

const assist = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/writing-assist", () => ({ assistWriting: assist }));
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

beforeEach(() => {
  assist.mockReset();
  window.localStorage.clear();
});
afterEach(cleanup);

function writeInMarkdown(text: string) {
  render(<ArticleEditor />);
  fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
  fireEvent.change(screen.getByLabelText("Your story"), { target: { value: text } });
}

function pick(action: RegExp) {
  fireEvent.click(screen.getByRole("button", { name: /AI assist/ }));
  fireEvent.click(screen.getByRole("menuitem", { name: action }));
}

describe("the writing assistant", () => {
  it("fixes the English of the whole story, showing what changed before replacing it", async () => {
    assist.mockResolvedValue({ action: "fix", text: "I have a story to tell about grace.", notes: ["Corrected the verb"] });
    writeInMarkdown("i has a story to tell about grace.");
    pick(/Fix spelling & grammar/);

    expect(assist).toHaveBeenCalledWith("fix", "i has a story to tell about grace.", { title: undefined, subtitle: undefined }, expect.any(AbortSignal));
    const panel = await screen.findByRole("dialog", { name: /Fix spelling & grammar/ });
    expect(panel.querySelector("del")).toHaveTextContent("i has");
    expect(panel.querySelector("ins")).toHaveTextContent("I have");
    expect(screen.getByText("Corrected the verb")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Replace story/ }));
    expect(screen.getByLabelText("Your story")).toHaveValue("I have a story to tell about grace.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains a failure instead of changing anything", async () => {
    assist.mockRejectedValue({ status: 429, message: "Too many requests" });
    writeInMarkdown("Some words that need help.");
    pick(/Paraphrase/);
    expect(await screen.findByText(/used the writing assistant a lot/)).toBeInTheDocument();
    expect(screen.getByLabelText("Your story")).toHaveValue("Some words that need help.");
  });

  it("suggests titles and fills in the one picked", async () => {
    assist.mockResolvedValue({
      action: "titles",
      titles: [{ title: "When God Keeps His Word", subtitle: "What Joshua 21 taught me about promises" }],
    });
    writeInMarkdown(Array.from({ length: 30 }, (_, i) => `word${i}`).join(" "));
    pick(/Suggest a title/);
    fireEvent.click(await screen.findByRole("button", { name: /When God Keeps His Word/ }));
    expect(screen.getByLabelText("Title")).toHaveValue("When God Keeps His Word");
    expect(screen.getByLabelText("Subtitle")).toHaveValue("What Joshua 21 taught me about promises");
  });
});
