import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // In Server Components cookies are read-only. We swallow both
            // synchronous throws and async rejections so they never surface
            // as unhandledRejection. The middleware handles all token writes.
            void Promise.resolve(cookieStore.set(name, value, options)).catch(() => {});
          });
        },
      },
    }
  );
}
