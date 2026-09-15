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

// ── Designs ──────────────────────────────────────────────────────────────────
//
// Each day's status image has its own design, so a member who shares every
// morning isn't posting the same picture to the same friends. The design is
// picked from the date, so everyone who shares on a given day posts the same
// one, and it changes at midnight with the verse.

const W = 1080;
const H = 1920;

type Ctx = CanvasRenderingContext2D;

interface Ink {
  name: string;
  label: string;
  date: string;
  verse: string;
  reference: string;
  translation: string;
  rule: string;
  footer: string;
  footerMuted: string;
}

export interface ScriptureTheme {
  key: string;
  /** What a member would call it. */
  name: string;
  /** The white logo on dark grounds, the dark one on light grounds. */
  logo: "light" | "dark";
  align: "center" | "left";
  ink: Ink;
  verseFont: (size: number) => string;
  /** Where the verse is fitted. The reference sits 100px below it. */
  verseBox?: { top: number; height: number; width?: number };
  lineHeight?: number;
  /** Top of the welcome line and website. */
  footerTop?: number;
  paint: (ctx: Ctx, random: () => number) => void;
}

function linear(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([at, color]) => gradient.addColorStop(at, color));
  return gradient;
}

function dot(ctx: Ctx, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const serif = (size: number) => `${size}px Georgia, "Noto Serif", serif`;
const italicSerif = (size: number) => `italic ${size}px Georgia, "Noto Serif", serif`;

export const SCRIPTURE_THEMES: readonly ScriptureTheme[] = [
  {
    key: "wine",
    name: "Wine and gold",
    logo: "light",
    align: "center",
    verseFont: serif,
    ink: {
      name: "#fff6e7", label: "#edc689", date: "#e6cbd3", verse: "#fffaf2", reference: "#f5d49a",
      translation: "#e6cbd3", rule: "#f5d49a", footer: "#fffaf2", footerMuted: "#e6cbd3",
    },
    paint(ctx) {
      ctx.fillStyle = linear(ctx, 0, 0, W, H, [[0, "#170c20"], [0.6, "#490c29"], [1, "#87102c"]]);
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(245, 212, 154, 0.13)";
      ctx.lineWidth = 2;
      for (let radius = 160; radius <= 1250; radius += 115) {
        ctx.beginPath();
        ctx.arc(W, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(245, 212, 154, 0.45)";
      ctx.strokeRect(44, 44, 992, 1832);
    },
  },
  {
    key: "dawn",
    name: "Sunrise",
    logo: "dark",
    align: "center",
    verseFont: italicSerif,
    ink: {
      name: "#3d0b1c", label: "#a8431f", date: "#7c4b3e", verse: "#2b0c15", reference: "#87102c",
      translation: "#6f3a2e", rule: "#87102c", footer: "#2b0c15", footerMuted: "#5e2c22",
    },
    paint(ctx) {
      ctx.fillStyle = linear(ctx, 0, 0, 0, H, [[0, "#fff8ee"], [0.55, "#ffe3c4"], [1, "#f6a57f"]]);
      ctx.fillRect(0, 0, W, H);
      const sun = ctx.createRadialGradient(540, H + 80, 60, 540, H + 80, 900);
      sun.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      sun.addColorStop(0.35, "rgba(255, 220, 170, 0.55)");
      sun.addColorStop(1, "rgba(255, 220, 170, 0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(135, 16, 44, 0.10)";
      ctx.lineWidth = 3;
      for (let radius = 260; radius <= 1180; radius += 115) {
        ctx.beginPath();
        ctx.arc(540, H + 80, radius, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
    },
  },
  {
    key: "hills",
    name: "Dusk over the hills",
    logo: "light",
    align: "center",
    verseFont: serif,
    verseBox: { top: 500, height: 680 },
    footerTop: 1560,
    ink: {
      name: "#fdf3ff", label: "#f6c28b", date: "#cdbfe6", verse: "#fff8f0", reference: "#ffd49a",
      translation: "#e3d3f0", rule: "#ffd49a", footer: "#fff8f0", footerMuted: "#cdbfe6",
    },
    paint(ctx, random) {
      ctx.fillStyle = linear(ctx, 0, 0, 0, H, [
        [0, "#0c1836"], [0.5, "#34285a"], [0.72, "#9b5a7c"], [0.84, "#eea27c"],
      ]);
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i += 1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + random() * 0.5})`;
        dot(ctx, random() * W, random() * 640, 1 + random() * 1.8);
      }
      const glow = ctx.createRadialGradient(820, 1600, 20, 820, 1600, 380);
      glow.addColorStop(0, "rgba(255, 226, 170, 0.95)");
      glow.addColorStop(1, "rgba(255, 226, 170, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 1150, W, 770);
      // The everlasting hills, far to near.
      const ridges = [
        { base: 1500, amp: 60, freq: 1.6, phase: 0.4, color: "#4a2f5e" },
        { base: 1590, amp: 80, freq: 1.1, phase: 2.1, color: "#2d1d45" },
        { base: 1690, amp: 55, freq: 2.2, phase: 1.2, color: "#170f2b" },
      ];
      for (const ridge of ridges) {
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 12) {
          const t = (x / W) * Math.PI;
          ctx.lineTo(
            x,
            ridge.base -
              ridge.amp * Math.sin(t * ridge.freq + ridge.phase) -
              0.35 * ridge.amp * Math.sin(t * ridge.freq * 2.7 + ridge.phase * 1.7),
          );
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = ridge.color;
        ctx.fill();
      }
    },
  },
  {
    key: "parchment",
    name: "Parchment",
    logo: "dark",
    align: "left",
    verseFont: serif,
    verseBox: { top: 720, height: 600 },
    ink: {
      name: "#3a0d1b", label: "#87102c", date: "#6e5a50", verse: "#26140f", reference: "#87102c",
      translation: "#6e5a50", rule: "#87102c", footer: "#26140f", footerMuted: "#6e5a50",
    },
    paint(ctx, random) {
      ctx.fillStyle = "#f7efe3";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 2600; i += 1) {
        ctx.fillStyle = `rgba(90, 60, 30, ${random() * 0.05})`;
        ctx.fillRect(random() * W, random() * H, 2, 2);
      }
      ctx.fillStyle = "#87102c";
      ctx.fillRect(0, 0, 26, H);
      ctx.strokeStyle = "rgba(135, 16, 44, 0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 70, 940, 1780);
      ctx.fillStyle = "rgba(135, 16, 44, 0.9)";
      ctx.font = "bold 300px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText("“", 104, 820);
    },
  },
  {
    key: "starlight",
    name: "Starlight",
    logo: "light",
    align: "center",
    verseFont: italicSerif,
    ink: {
      name: "#eef1ff", label: "#f3d38b", date: "#aeb9e6", verse: "#f8f6ff", reference: "#f3d38b",
      translation: "#aeb9e6", rule: "#f3d38b", footer: "#f8f6ff", footerMuted: "#aeb9e6",
    },
    paint(ctx, random) {
      const sky = ctx.createRadialGradient(540, 820, 80, 540, 820, 1300);
      sky.addColorStop(0, "#22346e");
      sky.addColorStop(0.5, "#0d1640");
      sky.addColorStop(1, "#040716");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 220; i += 1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + random() * 0.6})`;
        dot(ctx, random() * W, random() * H, 0.8 + random() * 1.6);
      }
      // A few bright stars, kept to the margins so they never cross the words.
      ctx.strokeStyle = "rgba(255, 240, 205, 0.85)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const x = i % 2 ? 900 + random() * 110 : 70 + random() * 110;
        const y = 120 + random() * 1680;
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x + 20, y);
        ctx.moveTo(x, y - 20);
        ctx.lineTo(x, y + 20);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 240, 205, 0.95)";
        dot(ctx, x, y, 3);
      }
    },
  },
  {
    key: "emerald",
    name: "Light from above",
    logo: "light",
    align: "center",
    verseFont: (size) => `${size}px "Helvetica Neue", Roboto, Arial, sans-serif`,
    ink: {
      name: "#f4fff9", label: "#e9c46a", date: "#a7d8c6", verse: "#fffbef", reference: "#f0cf7a",
      translation: "#a7d8c6", rule: "#e9c46a", footer: "#fffbef", footerMuted: "#a7d8c6",
    },
    paint(ctx) {
      ctx.fillStyle = linear(ctx, 0, 0, W, H, [[0, "#03322b"], [0.55, "#075446"], [1, "#0c7359"]]);
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i += 1) {
        const angle = 0.35 + i * 0.13;
        ctx.beginPath();
        ctx.moveTo(180, -120);
        ctx.lineTo(180 + Math.cos(angle) * 2800, -120 + Math.sin(angle) * 2800);
        ctx.lineTo(180 + Math.cos(angle + 0.05) * 2800, -120 + Math.sin(angle + 0.05) * 2800);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 248, 220, ${i % 2 ? 0.035 : 0.06})`;
        ctx.fill();
      }
      ctx.strokeStyle = "#e9c46a";
      ctx.lineWidth = 4;
      const corners: [number, number, number, number][] = [
        [60, 60, 1, 1], [W - 60, 60, -1, 1], [60, H - 60, 1, -1], [W - 60, H - 60, -1, -1],
      ];
      for (const [x, y, dx, dy] of corners) {
        ctx.beginPath();
        ctx.moveTo(x + dx * 90, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy * 90);
        ctx.stroke();
      }
    },
  },
  {
    key: "adire",
    name: "Adire",
    logo: "light",
    align: "center",
    verseFont: serif,
    verseBox: { top: 560, height: 700, width: 800 },
    footerTop: 1610,
    ink: {
      name: "#f2f5ff", label: "#ffd27a", date: "#c3cdf5", verse: "#ffffff", reference: "#ffd27a",
      translation: "#c3cdf5", rule: "#ffd27a", footer: "#ffffff", footerMuted: "#c3cdf5",
    },
    // After the indigo resist-dyed cloth of Yorubaland, Ibadan's own.
    paint(ctx) {
      ctx.fillStyle = linear(ctx, 0, 0, 0, H, [[0, "#1b2766"], [1, "#0f1744"]]);
      ctx.fillRect(0, 0, W, H);
      const tile = 180;
      ctx.strokeStyle = "rgba(196, 210, 255, 0.16)";
      ctx.fillStyle = "rgba(196, 210, 255, 0.16)";
      ctx.lineWidth = 4;
      for (let row = 0; row * tile < H; row += 1) {
        for (let col = 0; col * tile < W; col += 1) {
          const x = col * tile + tile / 2;
          const y = row * tile + tile / 2;
          switch ((row + col * 2) % 4) {
            case 0:
              for (const radius of [22, 46, 70]) {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
              }
              break;
            case 1:
              for (let i = -1; i <= 1; i += 1) for (let j = -1; j <= 1; j += 1) dot(ctx, x + i * 45, y + j * 45, 8);
              break;
            case 2:
              ctx.beginPath();
              for (let i = -60; i <= 60; i += 30) {
                ctx.moveTo(x - 70, y + i);
                ctx.lineTo(x + 70, y + i);
              }
              ctx.stroke();
              break;
            default:
              for (const half of [24, 48, 72]) ctx.strokeRect(x - half, y - half, half * 2, half * 2);
          }
        }
      }
      roundedRect(ctx, 70, 500, 940, 1040, 36);
      ctx.fillStyle = "rgba(12, 18, 56, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(214, 224, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  },
  {
    key: "poster",
    name: "Poster",
    logo: "light",
    align: "center",
    verseFont: (size) => `bold ${size}px Arial, Roboto, sans-serif`,
    lineHeight: 1.3,
    verseBox: { top: 620, height: 680 },
    footerTop: 1600,
    ink: {
      name: "#fff4ea", label: "#ffd98a", date: "#f3c9d2", verse: "#1c0b12", reference: "#87102c",
      translation: "#6d5860", rule: "#f2b84b", footer: "#fff4ea", footerMuted: "#d9c2c9",
    },
    paint(ctx) {
      ctx.fillStyle = "#87102c";
      ctx.fillRect(0, 0, W, 560);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, 560);
      ctx.clip();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 26;
      for (let x = -600; x < W + 600; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 560, 560);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "#fffaf4";
      ctx.fillRect(0, 560, W, 960);
      ctx.fillStyle = "#1c0b12";
      ctx.fillRect(0, 1520, W, 400);
      ctx.fillStyle = "#f2b84b";
      ctx.fillRect(0, 552, W, 12);
      ctx.fillStyle = "rgba(135, 16, 44, 0.07)";
      ctx.font = "bold 900px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("“", 540, 1400);
    },
  },
];

const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T12:00:00Z`) / 86_400_000);

/** The design for a date. Neighbouring days never share one. */
export function scriptureThemeFor(date: string): ScriptureTheme {
  const count = SCRIPTURE_THEMES.length;
  const day = dayNumber(date);
  return SCRIPTURE_THEMES[Number.isFinite(day) ? ((day % count) + count) % count : 0];
}

/** Seeded so a day's stars and paper grain are the same each time it is drawn. */
function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let r = Math.imul(state ^ (state >>> 15), 1 | state);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const timeout = window.setTimeout(() => reject(new Error("Logo unavailable")), 4000);
    img.onload = () => {
      window.clearTimeout(timeout);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Logo unavailable"));
    };
    img.src = src;
  });
}

/** Prepare before the share click so native file sharing keeps user activation. */
export async function createScriptureImage(
  scripture: DailyScripture,
  theme: ScriptureTheme = scriptureThemeFor(scripture.date),
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser");

  ctx.save();
  theme.paint(ctx, seededRandom(dayNumber(scripture.date)));
  ctx.restore();

  const { ink } = theme;
  const left = theme.align === "left";
  const x = left ? 130 : W / 2;
  const measureWidth = left ? 820 : 870;
  ctx.textAlign = left ? "left" : "center";

  // A text brand remains available even if the optional local logo fails to load.
  try {
    const logo = await loadImage(theme.logo === "dark" ? "/logoblack.png" : "/logo.png");
    const logoHeight = Math.min(120, (220 * logo.height) / logo.width);
    const logoWidth = (logoHeight * logo.width) / logo.height;
    ctx.drawImage(logo, left ? x : (W - logoWidth) / 2, 135, logoWidth, logoHeight);
  } catch {
    // The church name below is always included in the exported image.
  }

  const write = (value: string, y: number, font: string, color: string) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y, measureWidth);
  };

  write(CHURCH.name, 305, "bold 38px Arial, sans-serif", ink.name);
  write("SCRIPTURE FOR TODAY", 397, "24px Arial, sans-serif", ink.label);
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${scripture.date}T12:00:00Z`));
  write(dateLabel, 447, "26px Arial, sans-serif", ink.date);

  const box = { top: 550, height: 760, width: left ? 820 : 850, ...theme.verseBox };
  const ratio = theme.lineHeight ?? 1.4;
  let fontSize = 72;
  let lines: string[] = [];
  do {
    ctx.font = theme.verseFont(fontSize);
    lines = wrapScripture(scripture.text, box.width, (line) => ctx.measureText(line).width);
    if (lines.length * fontSize * ratio <= box.height) break;
    fontSize -= 2;
  } while (fontSize >= 30);
  if (lines.length * fontSize * ratio > box.height) {
    throw new Error("This passage is too long for the status image");
  }

  ctx.fillStyle = ink.verse;
  const lineHeight = fontSize * ratio;
  const firstLine = box.top + (box.height - lines.length * lineHeight) / 2 + fontSize;
  lines.forEach((line, index) => ctx.fillText(line, x, firstLine + index * lineHeight));

  const referenceY = box.top + box.height + 100;
  write(scripture.reference, referenceY, "bold 38px Arial, sans-serif", ink.reference);
  write(scripture.translationName, referenceY + 45, "24px Arial, sans-serif", ink.translation);

  const footerTop = theme.footerTop ?? 1550;
  ctx.fillStyle = ink.rule;
  ctx.fillRect(left ? x : 450, footerTop, 180, 2);
  write("You are welcome here.", footerTop + 90, "32px Georgia, serif", ink.footer);
  write("everlastinghills.church", footerTop + 160, "bold 34px Arial, sans-serif", ink.footer);
  write("Worship with us in Ibadan", footerTop + 220, "24px Arial, sans-serif", ink.footerMuted);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Could not create image"))),
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
