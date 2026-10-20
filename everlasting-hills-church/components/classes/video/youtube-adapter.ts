import type { CreatePlayer, PlayerHandle, PlayerState } from "./player-adapter";

/* A slice of the YouTube IFrame Player API: only what the lesson player uses. */
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  getVolume(): number;
  setVolume(volume: number): void;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}
interface YTApi {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onPlaybackRateChange?: (e: { data: number }) => void;
        onError?: () => void;
      };
    },
  ) => YTPlayer;
}
/** The player API puts itself on `window`; another player in the app types the same globals differently, so this file keeps its own view of it. */
interface YTWindow {
  YT?: YTApi;
  onYouTubeIframeAPIReady?: () => void;
}
const ytWindow = () => window as unknown as YTWindow;

let apiLoading: Promise<void> | null = null;

/** Loads the YouTube player script. Called only when a learner presses play, never on page load. */
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (ytWindow().YT?.Player) return Promise.resolve();
  if (!apiLoading) {
    apiLoading = new Promise<void>((resolve, reject) => {
      const previous = ytWindow().onYouTubeIframeAPIReady;
      ytWindow().onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        apiLoading = null;
        reject(new Error("The video player could not load."));
      };
      document.head.appendChild(script);
    });
  }
  return apiLoading;
}

function toState(code: number): PlayerState {
  switch (code) {
    case 0:
      return "ended";
    case 1:
      return "playing";
    case 2:
      return "paused";
    case 3:
      return "buffering";
    case 5:
      return "cued";
    default:
      return "unstarted";
  }
}

/**
 * The YouTube adapter. The native controls, keyboard, fullscreen, captions,
 * annotations and related videos are all switched off; what YouTube still
 * draws is covered by the shield in LessonVideo, which this adapter relies on.
 */
export const createYouTubePlayer: CreatePlayer = async (mount, videoId, handlers) => {
  await loadYouTubeApi();
  const YT = ytWindow().YT;
  if (!YT) throw new Error("The video player could not load.");

  const player = await new Promise<YTPlayer>((resolve) => {
    const p: YTPlayer = new YT.Player(mount, {
      videoId,
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        iv_load_policy: 3,
        playsinline: 1,
        cc_load_policy: 0,
        enablejsapi: 1,
        autoplay: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          // Keep the host's frame out of the keyboard tab order and away from screen readers.
          const frame = p.getIframe();
          frame.setAttribute("tabindex", "-1");
          frame.setAttribute("aria-hidden", "true");
          handlers.onReady();
          resolve(p);
        },
        onStateChange: (e) => handlers.onState(toState(e.data)),
        onPlaybackRateChange: (e) => handlers.onRateChange(e.data),
        onError: () => handlers.onError(),
      },
    });
  });

  const handle: PlayerHandle = {
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    seekTo: (s) => player.seekTo(s, true),
    currentTime: () => player.getCurrentTime(),
    duration: () => player.getDuration(),
    state: () => toState(player.getPlayerState()),
    volume: () => player.getVolume(),
    setVolume: (v) => player.setVolume(Math.max(0, Math.min(100, v))),
    isMuted: () => player.isMuted(),
    setMuted: (m) => (m ? player.mute() : player.unMute()),
    rate: () => player.getPlaybackRate(),
    setRate: (r) => player.setPlaybackRate(r),
    frame: () => player.getIframe(),
    destroy: () => player.destroy(),
  };
  return handle;
};
