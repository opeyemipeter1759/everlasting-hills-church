import { CHURCH } from "@/config/config";
import type { DailyScripture } from "@/lib/api/daily-scripture";

export const CHURCH_WEBSITE = "https://everlastinghills.church";

export function scriptureCaption(scripture: DailyScripture) {
  return `${scripture.text}\n\n${scripture.reference} (${scripture.translationCode})\n\n${CHURCH.name}\nWorship with us: ${CHURCH_WEBSITE}`;
}

export function wrapScripture(
  text: string,
  maxWidth: number,
  measure: (text: string) => number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Prepare before the share click so native file sharing keeps user activation. */
export async function createScriptureImage(
  scripture: DailyScripture,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser");

  const background = ctx.createLinearGradient(0, 0, 1080, 1920);
  background.addColorStop(0, "#170c20");
  background.addColorStop(0.6, "#490c29");
  background.addColorStop(1, "#87102c");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.strokeStyle = "rgba(245, 212, 154, 0.13)";
  ctx.lineWidth = 2;
  for (let radius = 160; radius <= 1250; radius += 115) {
    ctx.beginPath();
    ctx.arc(1080, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(245, 212, 154, 0.45)";
  ctx.strokeRect(44, 44, 992, 1832);

  // A text brand remains available even if the optional local logo fails to load.
  try {
    const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const timeout = window.setTimeout(
        () => reject(new Error("Logo unavailable")),
        4000,
      );
      img.onload = () => {
        window.clearTimeout(timeout);
        resolve(img);
      };
      img.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Logo unavailable"));
      };
      img.src = "/logo.png";
    });
    const logoHeight = Math.min(120, (220 * logo.height) / logo.width);
    const logoWidth = (logoHeight * logo.width) / logo.height;
    ctx.drawImage(logo, (1080 - logoWidth) / 2, 135, logoWidth, logoHeight);
  } catch {
    // The church name below is always included in the exported image.
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff6e7";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText(CHURCH.name, 540, 305, 870);
  ctx.fillStyle = "#edc689";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("SCRIPTURE FOR TODAY", 540, 397);
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${scripture.date}T12:00:00Z`));
  ctx.fillStyle = "#e6cbd3";
  ctx.font = "26px Arial, sans-serif";
  ctx.fillText(dateLabel, 540, 447);

  let fontSize = 72;
  let lines: string[] = [];
  do {
    ctx.font = `${fontSize}px Georgia, serif`;
    lines = wrapScripture(
      scripture.text,
      850,
      (line) => ctx.measureText(line).width,
    );
    if (lines.length * fontSize * 1.4 <= 760) break;
    fontSize -= 2;
  } while (fontSize >= 30);
  if (lines.length * fontSize * 1.4 > 760) {
    throw new Error("This passage is too long for the status image");
  }

  ctx.fillStyle = "#fffaf2";
  const lineHeight = fontSize * 1.4;
  const firstLine = 550 + (760 - lines.length * lineHeight) / 2 + fontSize;
  lines.forEach((line, index) =>
    ctx.fillText(line, 540, firstLine + index * lineHeight),
  );
  ctx.fillStyle = "#f5d49a";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText(scripture.reference, 540, 1410);
  ctx.fillStyle = "#e6cbd3";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText(scripture.translationName, 540, 1455, 860);

  ctx.fillStyle = "#f5d49a";
  ctx.fillRect(450, 1550, 180, 2);
  ctx.fillStyle = "#fffaf2";
  ctx.font = "32px Georgia, serif";
  ctx.fillText("You are welcome here.", 540, 1640);
  ctx.font = "bold 34px Arial, sans-serif";
  ctx.fillText("everlastinghills.church", 540, 1710);
  ctx.fillStyle = "#e6cbd3";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("Worship with us in Ibadan", 540, 1770);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("Could not create image")),
      "image/png",
    );
  });
  return new File([blob], `everlasting-hills-scripture-${scripture.date}.png`, {
    type: "image/png",
  });
}

export function saveScriptureImage(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
