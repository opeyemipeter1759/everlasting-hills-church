import { chooseOption } from "@/test/choose-option";
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

vi.mock("@/lib/api/daily-scripture", () => ({
  useDailyScripture: vi.fn(),
  useScriptureVersions: () => ({
    data: [
      { code: "WEB", name: "World English Bible", isDefault: true },
      { code: "KJV", name: "King James Version", isDefault: false },
    ],
  }),
}));
vi.mock("@/lib/sermon-digest", async (importOriginal) => ({
  // The real guard: it only inspects the answer, no network.
  readyWordOfTheDay: (await importOriginal<typeof import("@/lib/sermon-digest")>()).readyWordOfTheDay,
  useWordOfTheDay: vi.fn(() => ({ data: undefined })),
  serviceLabel: () => "Sunday service · 20 Sep",
}));
vi.mock("@/lib/scripture-share", () => ({
  createScriptureImage: vi.fn(),
  saveScriptureImage: vi.fn(),
  scriptureCaption: () => "Test scripture. https://everlastinghills.church",
  createConfessionImage: vi.fn(() => new Promise(() => undefined)),
  confessionCaption: () => "The Hills Confession. https://everlastinghills.church",
  scriptureAndConfessionCaption: () => "Test scripture. The Hills Confession. https://everlastinghills.church",
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
    isFetching: false,
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

/** The card opens on "Both"; these tests are about the scripture on its own. */
function renderSharingScripture() {
  const result = render(<DailyScriptureCard />);
  fireEvent.click(screen.getByRole("radio", { name: "Scripture" }));
  return result;
}

describe("DailyScriptureCard", () => {
  it("prepares the image without sharing until the member taps", async () => {
    renderSharingScripture();
    const button = await shareButton();
    expect(share).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(share).toHaveBeenCalledWith({
      files: [file],
      title: expect.stringContaining("Everlasting Hills Church"),
    });
    expect(screen.getByText("Test scripture.")).toBeInTheDocument();
  });

  it("speaks the Hills Confession after the scripture", () => {
    renderSharingScripture();
    const verse = screen.getByText("Test scripture.");
    const confession = screen.getByRole("group", { name: /The Hills Confession/ });

    expect(confession).toHaveTextContent("I am of the Everlasting Hills.");
    expect(confession).toHaveTextContent(/in Jesus’ name!/);
    // After the reading, never before it.
    expect(verse.compareDocumentPosition(confession) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("regenerates the status image in the Bible version the member chooses", async () => {
    vi.mocked(useDailyScripture).mockImplementation((translation) => ({
      data: translation === "KJV"
        ? {
            ...scripture,
            text: "The Lord is my shepherd; I shall not want.",
            translationCode: "KJV",
            translationName: "King James Version",
          }
        : scripture,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never));

    renderSharingScripture();
    chooseOption("Bible version for this status", /^KJV/);

    expect(useDailyScripture).toHaveBeenLastCalledWith("KJV");
    await waitFor(() =>
      expect(createScriptureImage).toHaveBeenLastCalledWith(
        expect.objectContaining({ translationCode: "KJV", translationName: "King James Version" }),
      ),
    );
    expect(screen.getByText("The Lord is my shepherd; I shall not want.")).toBeInTheDocument();
  });

  it("offers a downloaded image when native file sharing is unavailable", async () => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => false,
    });
    renderSharingScripture();
    fireEvent.click(await shareButton());
    expect(saveScriptureImage).toHaveBeenCalledWith(file);
    expect(share).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("My status");
  });

  it("respects cancellation without silently downloading or reporting failure", async () => {
    share.mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    renderSharingScripture();
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
    renderSharingScripture();
    expect(
      await screen.findByText(/status image couldn’t be prepared/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy text" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Share to WhatsApp Status" }),
    ).toBeDisabled();
  });

  it("releases the preview URL when leaving the dashboard", async () => {
    const { unmount } = renderSharingScripture();
    await shareButton();
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:scripture");
  });
});

describe("DailyScriptureCard sermon confession", () => {
  it("keeps the fixed Hills Confession until a sermon is ready", () => {
    render(<DailyScriptureCard />);
    expect(screen.getByText("I am fruitful. I am favoured. I flourish beyond limits.")).toBeTruthy();
  });

  it("updates the Hills Confession from the latest sermon", async () => {
    const { useWordOfTheDay } = await import("@/lib/sermon-digest");
    vi.mocked(useWordOfTheDay).mockReturnValue({
      data: {
        ready: true,
        word: "Endued",
        confession: ["I am endued with power from on high."],
        verse: { reference: "Luke 24:49", text: "" },
        sermonTitle: "Endued",
        watchUrl: "https://www.youtube.com/watch?v=x&t=1600s",
        serviceDay: "SUNDAY",
        serviceDate: "2026-09-20T08:00:00Z",
      },
    } as never);
    render(<DailyScriptureCard />);
    expect(screen.getByText("I am of the Everlasting Hills.")).toBeTruthy();
    expect(screen.getByText("I am endued with power from on high.")).toBeTruthy();
    expect(screen.getByText("Nothing can stop me — in Jesus’ name!")).toBeTruthy();
    expect(screen.queryByText("I am fruitful. I am favoured. I flourish beyond limits.")).toBeNull();
    expect(screen.getByRole("link", { name: /Watch “Endued”/ }).getAttribute("href")).toContain("t=1600s");
  });
});

describe("sharing the Hills Confession", () => {
  it("starts on Both, listed first, and switches everything to the confession", async () => {
    const { createConfessionImage } = await import("@/lib/scripture-share");
    render(<DailyScriptureCard />);
    const options = screen.getAllByRole("radio");
    expect(options[0]).toHaveAccessibleName("Both");
    expect(options[0]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Bible version for this status")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Confession" }));

    expect(screen.getByRole("radio", { name: "Confession" })).toHaveAttribute("aria-checked", "true");
    // The Bible version only applies to the scripture.
    expect(screen.queryByLabelText("Bible version for this status")).not.toBeInTheDocument();
    await waitFor(() => expect(createConfessionImage).toHaveBeenCalled());
  });

  it("copies the confession with the church website", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<DailyScriptureCard />);
    fireEvent.click(screen.getByRole("radio", { name: "Confession" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy text" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("The Hills Confession. https://everlastinghills.church"));
    expect(await screen.findByText(/Confession and church website copied/)).toBeInTheDocument();
  });

  it("saves and shares the confession image, not the scripture's", async () => {
    const { createConfessionImage } = await import("@/lib/scripture-share");
    const confessionImage = new File(["image"], "confession.png", { type: "image/png" });
    vi.mocked(createConfessionImage).mockResolvedValue(confessionImage);
    render(<DailyScriptureCard />);
    fireEvent.click(screen.getByRole("radio", { name: "Confession" }));

    fireEvent.click(await shareButton());
    expect(share).toHaveBeenCalledWith({ files: [confessionImage], title: expect.stringContaining("Hills Confession") });
    fireEvent.click(screen.getByRole("button", { name: "Save image" }));
    expect(saveScriptureImage).toHaveBeenCalledWith(confessionImage);
  });

  it("shares the scripture and the confession together", async () => {
    const { createConfessionImage } = await import("@/lib/scripture-share");
    const confessionImage = new File(["image"], "confession.png", { type: "image/png" });
    vi.mocked(createConfessionImage).mockResolvedValue(confessionImage);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<DailyScriptureCard />);

    // The Bible version still applies to the scripture image.
    expect(screen.getByLabelText("Bible version for this status")).toBeInTheDocument();
    fireEvent.click(await shareButton());
    expect(share).toHaveBeenCalledWith({ files: [file, confessionImage], title: expect.stringContaining("Hills Confession") });

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Save images" }));
    expect(saveScriptureImage).toHaveBeenCalledWith(file);
    vi.advanceTimersByTime(400);
    expect(saveScriptureImage).toHaveBeenCalledWith(confessionImage);
    vi.useRealTimers();

    fireEvent.click(screen.getByRole("button", { name: "Copy text" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("Test scripture. The Hills Confession. https://everlastinghills.church"),
    );
  });
});
