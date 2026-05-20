import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Unauthenticated → protect dashboard and member portal
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/me"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Authenticated → skip auth pages (redirect to member portal; /me will bounce admins to /dashboard)
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/me", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/me", "/me/:path*", "/login", "/register"],
};
