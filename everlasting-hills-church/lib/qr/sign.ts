import { createHmac } from "crypto";

const QR_SECRET = process.env.QR_SECRET ?? "change-me-in-production";

export function signServiceId(serviceId: string): string {
  return createHmac("sha256", QR_SECRET).update(serviceId).digest("hex");
}
