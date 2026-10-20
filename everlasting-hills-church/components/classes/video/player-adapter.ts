/**
 * What the lesson player needs from a video host. The player and the page are
 * written against this, so moving the class videos off YouTube (to Cloudflare
 * Stream, or HLS from R2) means writing one more adapter, not changing them.
 */

export type PlayerState = "unstarted" | "cued" | "buffering" | "playing" | "paused" | "ended";

export interface PlayerHandle {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  currentTime(): number;
  duration(): number;
  state(): PlayerState;
  volume(): number;
  setVolume(volume: number): void;
  isMuted(): boolean;
  setMuted(muted: boolean): void;
  rate(): number;
  setRate(rate: number): void;
  /** The host's own frame, so the page can keep it out of the tab order. Null when the host has none. */
  frame(): HTMLElement | null;
  destroy(): void;
}

export interface PlayerHandlers {
  onReady(): void;
  onState(state: PlayerState): void;
  onRateChange(rate: number): void;
  onError(): void;
}

/** Builds a player inside `mount`. Nothing is downloaded from the host until this is called. */
export type CreatePlayer = (mount: HTMLElement, videoId: string, handlers: PlayerHandlers) => Promise<PlayerHandle>;
