import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/prisma";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/me";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create Profile + MEMBER RoleAssignment on first login (idempotent)
      const profile = await db.profile.upsert({
        where: { userId: data.user.id },
        update: {},
        create: {
          userId: data.user.id,
          tenantId: TENANT_ID,
          role: Role.MEMBER,
        },
      });

      await db.roleAssignment.upsert({
        where: {
          tenantId_profileId_role: {
            tenantId: TENANT_ID,
            profileId: profile.id,
            role: Role.MEMBER,
          },
        },
        update: {},
        create: {
          tenantId: TENANT_ID,
          profileId: profile.id,
          role: Role.MEMBER,
        },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
