"use client";
import Image from "next/image";

interface Props {
  name: string;
  photoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE = { xs: "w-6 h-6 text-[9px]", sm: "w-7 h-7 text-[10px]", md: "w-9 h-9 text-xs", lg: "w-11 h-11 text-sm" };
const PX   = { xs: 24, sm: 28, md: 36, lg: 44 };

export function MemberAvatar({ name, photoUrl, size = "sm", className = "" }: Props) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const base = `${SIZE[size]} rounded-full shrink-0 overflow-hidden ${className}`;

  if (photoUrl) {
    return (
      <div className={base}>
        <Image
          src={photoUrl}
          alt={name}
          width={PX[size]}
          height={PX[size]}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className={`${base} bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center font-black text-[#87102C]`}>
      {initials}
    </div>
  );
}
