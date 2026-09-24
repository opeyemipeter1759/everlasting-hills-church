import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pwa/service-worker", () => ({ clearServiceWorkerCaches: vi.fn() }));

import { audioContentType, uploadAudioDirect } from "./direct-audio-upload";

const file = (name: string, type: string, size = 10) =>
  ({ name, type, size }) as unknown as File;

describe("audioContentType", () => {
  it.each([
    ["sermon.mp3", "audio/mpeg", "audio/mpeg"],
    ["sermon.mp3", "audio/mp3", "audio/mpeg"],
    ["sermon.m4a", "audio/x-m4a", "audio/mp4"],
    ["sermon.wav", "audio/x-wav", "audio/wav"],
    ["sermon.wav", "audio/wave", "audio/wav"],
    ["sermon.ogg", "audio/ogg", "audio/ogg"],
    // Some systems report no type at all — fall back to the extension.
    ["sermon.M4A", "", "audio/mp4"],
    ["sermon.aac", "application/octet-stream", "audio/aac"],
  ])("%s declared %j → %s", (name, type, expected) => {
    expect(audioContentType(file(name, type))).toBe(expected);
  });

  it("rejects files that aren't a supported recording", () => {
    expect(audioContentType(file("notes.pdf", "application/pdf"))).toBeNull();
    expect(audioContentType(file("clip.flac", "audio/flac"))).toBeNull();
  });
});

describe("uploadAudioDirect", () => {
  it("refuses a recording over 1 GB before asking for a link", async () => {
    const huge = file("service.wav", "audio/wav", 1024 * 1024 * 1024 + 1);
    await expect(uploadAudioDirect(huge, "/sermons/audio-upload-url", () => {})).rejects.toThrow(
      "That recording is over 1 GB. Choose a smaller file.",
    );
  });
});
