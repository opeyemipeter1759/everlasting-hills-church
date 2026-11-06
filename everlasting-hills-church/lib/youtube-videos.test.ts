import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchChannelVideos, YouTubeConfigError } from "./youtube-videos";

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("fetchChannelVideos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("reads the key at runtime from the service's NEXT_PUBLIC_ name", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_YOUTUBE_API_KEY", "runtime-key");
    vi.stubEnv("NEXT_PUBLIC_YOUTUBE_CHANNEL_ID", "UC123");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { relatedPlaylists: { uploads: "UU123" } } }] }))
      .mockResolvedValueOnce(json({ items: [{ snippet: { resourceId: { videoId: "v1" } } }] }))
      .mockResolvedValueOnce(
        json({
          items: [
            {
              id: "v1",
              snippet: {
                title: "Sunday Service",
                description: "",
                publishedAt: "2026-11-01T09:00:00Z",
                channelTitle: "EHC",
                thumbnails: { high: { url: "https://img/v1.jpg" } },
              },
              contentDetails: { duration: "PT1H30M" },
              statistics: { viewCount: "1200", likeCount: "40", commentCount: "3" },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const videos = await fetchChannelVideos();

    expect(fetchMock.mock.calls[0][0]).toContain("key=runtime-key");
    expect(videos).toHaveLength(1);
    expect(videos[0]).toMatchObject({ id: "v1", category: "Sunday", duration: "1h 30m", viewCount: "1.2K" });
  });

  it("raises a config error, without calling YouTube, when the key is missing", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_YOUTUBE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_YOUTUBE_CHANNEL_ID", "UC123");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchChannelVideos()).rejects.toBeInstanceOf(YouTubeConfigError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
