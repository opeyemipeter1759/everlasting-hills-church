import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BookShareButton from "./BookShareButton";

const success = vi.fn();
const error = vi.fn();
vi.mock("@/components/ui/toast/toast", () => ({
  showToast: {
    success: (m: string) => success(m),
    error: (m: string) => error(m),
  },
}));

const book = {
  id: "bk_1",
  title: "The Pursuit of God",
  author: "A.W. Tozer",
  coverUrl: null,
};

const share = vi.fn();
const writeText = vi.fn();

function setShareSupport(supported: boolean) {
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: supported ? share : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  share.mockResolvedValue(undefined);
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "https://everlastinghills.church" },
  });
});

afterEach(cleanup);

describe("BookShareButton", () => {
  it("hands the book's own page to the OS share sheet", async () => {
    setShareSupport(true);
    render(<BookShareButton book={book} />);

    await userEvent.click(screen.getByRole("button", { name: /share the pursuit of god/i }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const payload = share.mock.calls[0][0];
    expect(payload.title).toBe("The Pursuit of God");
    expect(payload.url).toBe("https://everlastinghills.church/dashboard/books/bk_1");
    expect(payload.text).toContain("A.W. Tozer");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the link when the browser has no share sheet", async () => {
    setShareSupport(false);
    render(<BookShareButton book={book} variant="button" />);

    await userEvent.click(screen.getByRole("button", { name: /share/i }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("https://everlastinghills.church/dashboard/books/bk_1"),
      ),
    );
    expect(success).toHaveBeenCalledWith("Book link copied");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  // The library grid nests this button inside the card's <Link>, so a share
  // must not also navigate to the reader.
  it("does not trigger the enclosing link", async () => {
    setShareSupport(true);
    const onClick = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      <a href="/dashboard/books/bk_1" onClick={onClick}>
        <BookShareButton book={book} />
      </a>,
    );

    await userEvent.click(screen.getByRole("button", { name: /share the pursuit of god/i }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(onClick).not.toHaveBeenCalled();
  });
});
