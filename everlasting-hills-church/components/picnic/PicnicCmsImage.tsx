"use client";

import Image, { type ImageProps } from "next/image";
import { usePicnicPhoto } from "@/lib/api/picnic";
import { atWidth, type PicnicPhotoKey } from "./picnic-photos";

/**
 * A picnic photo spot outside the picnic page itself (dashboard banners, the
 * member sign-up), showing whatever the CMS has for that spot. `width` sizes
 * stock Unsplash photos; uploads are used as they are.
 */
export default function PicnicCmsImage({ spot, width, alt = "", ...props }: { spot: PicnicPhotoKey; width: number; alt?: string } & Omit<ImageProps, "src" | "alt">) {
  const photo = usePicnicPhoto(spot);
  return <Image {...props} src={atWidth(photo.src, width)} alt={alt} />;
}
