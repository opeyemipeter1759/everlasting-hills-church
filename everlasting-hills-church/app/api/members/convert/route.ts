import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { isAdmin } from "@/lib/auth/rbac";
import { convertVisitorToMember } from "@/services/member.service";

async function getAdminProfile() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return db.profile.findUnique({ where: { userId: user.id } });
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getAdminProfile();
    if (!profile) return apiError("Unauthorized", 401);
    if (!isAdmin(profile.role)) return apiError("Forbidden — admin access required", 403);

    const body = await req.json().catch(() => ({}));
    const { visitorId } = body as { visitorId?: string };
    if (!visitorId || typeof visitorId !== "string") {
      return apiError("visitorId is required", 400);
    }

    const member = await convertVisitorToMember(visitorId);
    return apiSuccess({ memberId: member.id }, 201);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.message, err.statusCode);
    if (err instanceof Error) return apiError(err.message, 400);
    console.error("[api/members/convert] unexpected error:", err);
    return apiError("Something went wrong", 500);
  }
}
