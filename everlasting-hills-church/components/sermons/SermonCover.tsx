"use client";

import Image from "next/image";

/**
 * A sermon thumbnail that never crops.
 *
 * Covers are uploaded at whatever ratio the designer used — square flier,
 * portrait story graphic, 16/9 stream still — but every card on the site lays
 * them out in a fixed box (usually `aspect-video`). `object-cover` therefore
 * sliced the title text off most fliers.
 *
 * So the real image is `object-contain` (whole cover, always) over a blurred,
 * over-scaled copy of itself that fills the rest of the box. Same URL and
 * `sizes` for both, so the browser paints twice from a single download.
 */
export default function SermonCover({
  src,
  alt,
  sizes,
  className = "",
  /** Applied to the foreground image only — hover transforms, etc. */
  imageClassName = "",
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={`absolute inset-0 block overflow-hidden ${className}`}>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        priority={priority}
        className="scale-150 object-cover blur-xl saturate-150"
      />
      {/* Keeps the blur from washing the foreground out in light mode. */}
      <span className="absolute inset-0 bg-black/15" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain ${imageClassName}`}
      />
    </span>
  );
}
