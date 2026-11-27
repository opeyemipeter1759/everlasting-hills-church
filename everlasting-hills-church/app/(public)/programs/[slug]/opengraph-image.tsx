import { ImageResponse } from "next/og";
import { ACCENT } from "@/components/programs/accents";
import { getProgram } from "@/lib/programs";

export const alt = "A program of Everlasting Hills Church";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

/** Each program's share image: its name on black, lit by its accent, with its rhythm underneath. */
export default async function Image({ params }: { params: { slug: string } }) {
  const p = await getProgram(params.slug).catch(() => null);
  const glow = ACCENT[p?.accent ?? "BURGUNDY"].glow;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: `radial-gradient(80% 90% at 85% 15%, rgba(${glow},0.75), rgba(8,8,8,1) 70%)`,
          color: "white",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 4, color: "rgba(255,255,255,0.7)", fontFamily: "sans-serif" }}>{p?.eyebrow ?? "PROGRAMS"}</div>
        <div style={{ fontSize: 120, lineHeight: 1, marginTop: 18 }}>{p?.name ?? "Our appointed times"}</div>
        <div style={{ fontSize: 30, marginTop: 28, color: "rgba(255,255,255,0.8)", fontFamily: "sans-serif" }}>{p?.schedule ?? "Everlasting Hills Church"}</div>
        <div style={{ fontSize: 24, marginTop: 36, color: "#C8A04A", fontFamily: "sans-serif" }}>Everlasting Hills Church, Ibadan</div>
      </div>
    ),
    size,
  );
}
