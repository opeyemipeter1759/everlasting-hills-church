import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { firstTimerSchema } from "@/lib/validations/connect.schema";
import { submitFirstTimer } from "@/services/connect.service";

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
    const result = firstTimerSchema.safeParse(body);
    if (!result.success) {
      return apiError(result.error.issues[0].message, 400);
    }

    console.info(`[api/first-timer] ip=${ip} ua="${ua}"`);
    await submitFirstTimer(result.data);
    return apiSuccess(undefined, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode);
    }
    console.error("[api/first-timer] error:", err);
    return apiError("Failed to save. Please try again.", 500);
  }
}
