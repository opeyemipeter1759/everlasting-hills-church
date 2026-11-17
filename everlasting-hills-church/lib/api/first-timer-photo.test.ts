import { beforeEach, describe, expect, it, vi } from "vitest";

const { post, del, put } = vi.hoisted(() => ({ post: vi.fn(), del: vi.fn(), put: vi.fn() }));
vi.mock("./request", () => ({ api: { post, delete: del } }));
vi.mock("axios", () => ({ default: { put } }));

import { photoErrorMessage, removeFirstTimerPhoto, uploadFirstTimerPhoto } from "./first-timer-photo";

const webp = (bytes = 2000) => new Blob([new Uint8Array(bytes)], { type: "image/webp" });
const link = { uploadUrl: "https://storage.test/upload?token=t", headers: { "content-type": "image/webp", "x-upsert": "false" }, key: "t1/first-timers/v1/k.webp" };

beforeEach(() => {
  post.mockReset();
  put.mockReset();
  del.mockReset();
});

describe("uploadFirstTimerPhoto", () => {
  it("refuses without consent, before asking for a link", async () => {
    await expect(uploadFirstTimerPhoto("v1", webp(), false)).rejects.toThrow(/agreed to this photo/);
    expect(post).not.toHaveBeenCalled();
  });

  it("refuses anything that is not a photo", async () => {
    const pdf = new Blob(["%PDF"], { type: "application/pdf" });
    await expect(uploadFirstTimerPhoto("v1", pdf, true)).rejects.toThrow(/Only a photo/);
    expect(post).not.toHaveBeenCalled();
  });

  it("refuses a photo over 5 MB", async () => {
    await expect(uploadFirstTimerPhoto("v1", webp(5 * 1024 * 1024 + 1), true)).rejects.toThrow(/5 MB/);
    expect(post).not.toHaveBeenCalled();
  });

  it("asks for a link, sends the photo straight to storage without our cookies, then confirms the key", async () => {
    post.mockResolvedValueOnce(link).mockResolvedValueOnce({ photoUrl: "https://storage.test/read" });
    put.mockResolvedValueOnce({});
    const photo = webp();

    await uploadFirstTimerPhoto("v1", photo, true);

    expect(post).toHaveBeenNthCalledWith(1, "/follow-up/first-timers/v1/photo/upload-url", { contentType: "image/webp", size: 2000, consent: true });
    expect(put).toHaveBeenCalledWith(link.uploadUrl, photo, expect.objectContaining({ headers: link.headers, withCredentials: false }));
    expect(post).toHaveBeenNthCalledWith(2, "/follow-up/first-timers/v1/photo", { key: link.key });
  });

  it("does not confirm an upload that failed", async () => {
    post.mockResolvedValueOnce(link);
    put.mockRejectedValueOnce(new Error("Network Error"));

    await expect(uploadFirstTimerPhoto("v1", webp(), true)).rejects.toThrow("The photo did not upload. Check your connection and try again.");
    expect(post).toHaveBeenCalledTimes(1);
  });
});

describe("removeFirstTimerPhoto", () => {
  it("deletes their photo", async () => {
    del.mockResolvedValueOnce({ removed: true });
    await expect(removeFirstTimerPhoto("v 1")).resolves.toEqual({ removed: true });
    expect(del).toHaveBeenCalledWith("/follow-up/first-timers/v%201/photo");
  });
});

describe("photoErrorMessage", () => {
  it("shows the API's message, or a plain fallback", () => {
    expect(photoErrorMessage({ message: "First-timer not found" })).toBe("First-timer not found");
    expect(photoErrorMessage(null)).toBe("Something went wrong with the photo. Try again.");
  });
});
