"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

export default function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className={className ?? "text-sm text-white/50 hover:text-white transition-colors"}
    >
      {children ?? "Sign out"}
    </button>
  );
}
