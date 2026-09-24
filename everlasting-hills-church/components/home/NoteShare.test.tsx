import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NoteShare from "./NoteShare";
import { saveScriptureImage } from "@/lib/scripture-share";

vi.mock("@/lib/scripture-share", () => ({ saveScriptureImage: vi.fn() }));

const image = new File(["image"], "scripture.png", { type: "image/png" });
const draw = vi.fn(async () => [image]);
const caption = () => "Psalm 40:1 — everlastinghills.church";

function renderShare() {
  render(
    <NoteShare
      what="today’s scripture"
      title="Share today’s scripture"
      preview={<p>I waited patiently for the LORD.</p>}
      drawKey="k1"
      draw={draw}
      caption={caption}
    />,
  );
}

function openPopup() {
  renderShare();
  fireEvent.click(screen.getByRole("button", { name: "Share today’s scripture" }));
  return screen.getByRole("dialog", { name: "Share today’s scripture" });
}

async function imageReady() {
  await waitFor(() => expect(screen.getByRole("button", { name: "Download today’s scripture image" })).toBeEnabled());
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
});
afterEach(cleanup);

describe("NoteShare", () => {
  it("opens a popup showing what will be shared, with WhatsApp, Download and Copy", () => {
    renderShare();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(draw).not.toHaveBeenCalled(); // nothing drawn until someone wants to share

    fireEvent.click(screen.getByRole("button", { name: "Share today’s scripture" }));

    const dialog = screen.getByRole("dialog", { name: "Share today’s scripture" });
    expect(dialog).toHaveTextContent("I waited patiently for the LORD.");
    expect(screen.getByRole("button", { name: "Share on WhatsApp" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Copy today’s scripture text" })).toBeInTheDocument();
    expect(draw).toHaveBeenCalled();
  });

  it("closes with the ✕, with Escape, and with a tap outside, handing focus back", () => {
    openPopup();
    fireEvent.click(screen.getByRole("button", { name: "Close sharing" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share today’s scripture" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Share today’s scripture" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Share today’s scripture" }));
    const backdrop = screen.getByRole("dialog").previousElementSibling as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sends the image through the phone's share sheet when it can", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    openPopup();
    await imageReady();
    fireEvent.click(screen.getByRole("button", { name: "Share on WhatsApp" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ files: [image], text: caption() }));
    expect(open).not.toHaveBeenCalled();
  });

  it("opens WhatsApp with the words where images can't be shared", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    openPopup();
    fireEvent.click(screen.getByRole("button", { name: "Share on WhatsApp" }));
    await waitFor(() =>
      expect(open).toHaveBeenCalledWith(`https://wa.me/?text=${encodeURIComponent(caption())}`, "_blank", "noopener,noreferrer"),
    );
  });

  it("downloads the image and copies the text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    openPopup();
    await imageReady();
    fireEvent.click(screen.getByRole("button", { name: "Download today’s scripture image" }));
    expect(saveScriptureImage).toHaveBeenCalledWith(image);
    fireEvent.click(screen.getByRole("button", { name: "Copy today’s scripture text" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(caption()));
    expect(await screen.findByText("Copied — paste it anywhere.")).toBeInTheDocument();
  });
});
