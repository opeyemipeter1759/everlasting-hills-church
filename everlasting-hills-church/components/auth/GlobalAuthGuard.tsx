"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ERROR_EVENT } from "@/lib/auth/frontend-session";
import { auth } from "@/lib/api";

export function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleAuthError = async () => {
      try {
        await auth.logout();
      } catch {
        // session already cleared by the axios interceptor; ignore logout API failures
      }
      router.push("/login");
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, [router]);

  return <>{children}</>;
}
