import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { updateMemberProfile } from "@/services/member.service";

const patchSchema = z.object({
  phone: z.string().min(1).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return apiError(result.error.issues[0].message, 400);
    }

    const member = await updateMemberProfile(user.id, result.data);
    return apiSuccess({ memberId: member.id });
  } catch (err) {
    if (err instanceof AppError) return apiError(err.message, err.statusCode);
    if (err instanceof Error) return apiError(err.message, 400);
    return apiError("Failed to update profile", 500);
  }
}
