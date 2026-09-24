import axios from "axios";
import { apiClient } from "./axios";

/** Largest recording accepted — matches MAX_DIRECT_AUDIO_BYTES on the API. */
export const MAX_AUDIO_UPLOAD_BYTES = 1024 * 1024 * 1024;

const TYPE_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
};

// Browsers and operating systems disagree on audio MIME names; the API only
// signs links for the canonical ones.
const TYPE_ALIASES: Record<string, string> = {
  "audio/mp3": "audio/mpeg",
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/vnd.wave": "audio/wav",
  "audio/x-aac": "audio/aac",
};

/** The canonical audio type for a file, or null when it isn't a supported recording. */
export function audioContentType(file: Pick<File, "name" | "type">): string | null {
  const declared = file.type.toLowerCase();
  const canonical = TYPE_ALIASES[declared] ?? declared;
  if (Object.values(TYPE_BY_EXTENSION).includes(canonical)) return canonical;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPE_BY_EXTENSION[ext] ?? null;
}

interface UploadLink {
  uploadUrl: string;
  headers: Record<string, string>;
  audioUrl: string;
}

/**
 * Uploads a sermon recording straight to storage and returns its public URL.
 *
 * Recordings are far larger than a request through the website or the API
 * may be, so the API only issues a one-time link (signed for this file's type
 * and size) and the browser sends the file to storage itself.
 */
export async function uploadAudioDirect(
  file: File,
  linkEndpoint: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  const contentType = audioContentType(file);
  if (!contentType) throw new Error("Unsupported audio format. Use MP3, M4A, WAV, OGG or AAC.");
  if (file.size > MAX_AUDIO_UPLOAD_BYTES) throw new Error("That recording is over 1 GB. Choose a smaller file.");

  const { data: link } = await apiClient.post<UploadLink>(linkEndpoint, { contentType, size: file.size });

  try {
    // A bare axios call, not apiClient: this goes to storage, not our API,
    // must not carry our cookies, and a large file needs as long as it takes.
    await axios.put(link.uploadUrl, file, {
      headers: link.headers,
      timeout: 0,
      withCredentials: false,
      onUploadProgress: (evt) => {
        if (evt.total) onProgress(Math.round((evt.loaded * 100) / evt.total));
      },
    });
  } catch {
    throw new Error("The recording couldn't be sent to storage. Check your connection and try again.");
  }
  return link.audioUrl;
}
