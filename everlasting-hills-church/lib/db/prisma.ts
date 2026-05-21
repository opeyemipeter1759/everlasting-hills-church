import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Always reuse a single PrismaClient across hot-reloads (dev) and invocations (prod).
// Without this, every serverless request creates a new client and exhausts the pool.
export const db =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  }));
