import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DailyScriptureCard from "./DailyScriptureCard";
import { useDailyScripture } from "@/lib/api/daily-scripture";
import {
  createScriptureImage,
  saveScriptureImage,
} from "@/lib/scripture-share";

vi.mock("@/lib/api/daily-scripture", () => ({ useDailyScripture: vi.fn() }));
vi.mock("@/lib/scripture-share", () => ({
  createScriptureImage: vi.fn(),
  saveScriptureImage: vi.fn(),
  scriptureCaption: () => "Test scripture. https://everlastinghills.church",
}));

const scripture = {
  date: "2026-09-12",
  timezone: "Africa/Lagos",
  reference: "Psalm 23:1",
  text: "Test scripture.",
  translationCode: "WEB",
  translationName: "World English Bible",
};
const file = new File(["image"], "scripture.png", { type: "image/png" });
const share = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useDailyScripture).mockReturnValue({
    data: scripture,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);
  vi.mocked(createScriptureImage).mockResolvedValue(file);
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:scripture"),
      revokeObjectURL: vi.fn(),
    }),
  );
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: vi.fn(() => true),
  });
  share.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function shareButton() {
  const button = screen.getByRole("button", {
    name: "Share to WhatsApp Status",
  });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}

describe("DailyScriptureCard", () => {
  it("prepares the image without sharing until the member taps", async () => {
    render(<DailyScriptureCard />);
    const button = await shareButton();
    expect(share).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(share).toHaveBeenCalledWith({
      files: [file],
      title: expect.stringContaining("Everlasting Hills Church"),
    });
    expect(screen.getByText("Test scripture.")).toBeInTheDocument();
  });

  it("offers a downloaded image when native file sharing is unavailable", async () => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => false,
    });
    render(<DailyScriptureCard />);
    fireEvent.click(await shareButton());
    expect(saveScriptureImage).toHaveBeenCalledWith(file);
    expect(share).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("My status");
  });

  it("respects cancellation without silently downloading or reporting failure", async () => {
    share.mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    render(<DailyScriptureCard />);
    fireEvent.click(await shareButton());
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Share to WhatsApp Status" }),
      ).toBeEnabled(),
    );
    expect(saveScriptureImage).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps text sharing available when image creation fails", async () => {
    vi.mocked(createScriptureImage).mockRejectedValue(
      new Error("Canvas unavailable"),
    );
    render(<DailyScriptureCard />);
    expect(
      await screen.findByText(/status image couldn’t be prepared/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy text" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Share to WhatsApp Status" }),
    ).toBeDisabled();
  });

  it("releases the preview URL when leaving the dashboard", async () => {
    const { unmount } = render(<DailyScriptureCard />);
    await shareButton();
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:scripture");
  });
});
