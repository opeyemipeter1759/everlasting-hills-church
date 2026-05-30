export function formatDate(value: string | undefined | null) {
  try {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return String(value ?? "");
  }
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "";
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins}m`;
}

import type { LatestSermon } from "@/types";
export function getTypeLabel(item: LatestSermon) {
  if (item.videoUrl) return "Video";
  if (item.audioUrl) return "Audio";
  return "Sermon";
}

export function getSeriesName(item: LatestSermon) {
  return item.series ?? "Standalone";
}
