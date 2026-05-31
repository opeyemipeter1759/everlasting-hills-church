"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

/**
 * Animated WebGL globe with a pin on Ibadan. Built on cobe (~5 KB, used by Stripe).
 *
 * - Auto-rotates slowly
 * - Burgundy marker dot pulses at the church's coordinates
 * - Responsive: respects parent container size
 * - Cleans up the GL context on unmount
 *
 * Dropped into the /contact and /find-us hero sections.
 */

export interface GlobeProps {
  /** Marker pin location — defaults to Everlasting Hills, Ibadan. */
  pin?: { lat: number; lng: number };
  /** Canvas height in px; width fills the container. */
  size?: number;
  /** Show the city label under the canvas. */
  label?: string;
  className?: string;
}

// Burgundy color decomposed into RGB 0-1 floats for cobe
const BURGUNDY: [number, number, number] = [0.529, 0.063, 0.173];

export default function Globe({
  pin = { lat: 7.3775, lng: 3.947 },
  size = 600,
  label,
  className = "",
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const widthRef = useRef(size);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    // Match canvas pixel size to container width
    const onResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) widthRef.current = container.clientWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    // Cobe's TypeScript types don't include onRender in COBEOptions in some versions
    // (it's accepted at runtime but missing from the public type). Cast at the call site.
    const opts = {
      devicePixelRatio: 2,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3] as [number, number, number],
      markerColor: BURGUNDY,
      glowColor: BURGUNDY,
      markers: [{ location: [pin.lat, pin.lng] as [number, number], size: 0.1 }],
      onRender: (state: Record<string, number>) => {
        // Auto-rotate; speed tuned to feel alive but not distracting
        state.phi = phiRef.current;
        phiRef.current += 0.003;
        state.width = widthRef.current * 2;
        state.height = widthRef.current * 2;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globe = createGlobe(canvasRef.current, opts as any);

    // Tiny fade-in to avoid the harsh first-frame pop
    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    }, 100);

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [mounted, pin.lat, pin.lng]);

  return (
    <div className={`relative w-full ${className}`} style={{ maxWidth: size }}>
      <div
        className="aspect-square w-full relative"
        style={{ maxWidth: size, margin: "0 auto" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full opacity-0 transition-opacity duration-1000"
          style={{ contain: "layout paint size" }}
        />
      </div>
      {label && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-white/8 backdrop-blur-md border border-white/15 px-4 py-2 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-[#87102C] animate-pulse" />
          <span className="text-xs font-semibold text-white">{label}</span>
        </div>
      )}
    </div>
  );
}
