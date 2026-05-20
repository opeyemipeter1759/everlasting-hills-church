import { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import {
  firstTimerSchema,
  prayerRequestSchema,
  testimonySchema,
} from "@/lib/validations/connect.schema";
import {
  submitFirstTimer,
  submitPrayerRequest,
  submitTestimony,
} from "@/services/connect.service";

const typeSchema = z.enum(["FIRST_TIMER", "PRAYER_REQUEST", "TESTIMONY"]);

function getIP(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const ua = req.headers.get("user-agent") ?? "unknown";

  try {
    rateLimit(`connect:${ip}`, { limit: 5, windowMs: 60_000 });

    const body = await req.json();

    const typeResult = typeSchema.safeParse(body?.type);
    if (!typeResult.success) {
      return apiError("type must be FIRST_TIMER, PRAYER_REQUEST, or TESTIMONY", 400);
    }

    const type = typeResult.data;
    console.info(`[api/connect] type=${type} ip=${ip} ua="${ua}"`);

    if (type === "FIRST_TIMER") {
      const result = firstTimerSchema.safeParse(body);
      if (!result.success) {
        return apiError(result.error.issues[0].message, 400);
      }
      await submitFirstTimer(result.data);
      return apiSuccess(undefined, 201);
    }

    if (type === "PRAYER_REQUEST") {
      const result = prayerRequestSchema.safeParse(body);
      if (!result.success) {
        return apiError(result.error.issues[0].message, 400);
      }
      await submitPrayerRequest(result.data);
      return apiSuccess(undefined, 201);
    }

    // TESTIMONY
    const result = testimonySchema.safeParse(body);
    if (!result.success) {
      return apiError(result.error.issues[0].message, 400);
    }
    await submitTestimony(result.data);
    return apiSuccess(undefined, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode);
    }
    console.error("[api/connect] error:", err);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
