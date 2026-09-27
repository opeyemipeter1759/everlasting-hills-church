-- Deploy through prisma migrate deploy only.

-- Admins mark a testimony read to move it to the Read tab on the dashboard.
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "readByName" TEXT;
