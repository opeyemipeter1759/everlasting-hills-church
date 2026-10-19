-- Deploy through prisma migrate deploy only.
-- Membership classes: the class engine (cohorts, sessions, lesson anatomy, quiz items,
-- progress, action steps), membership status with its audit trail, and the
-- ready-for-membership approval queue. Every new table has row level security on,
-- with no policies: deny-all to the Supabase data API, like every other table.

DO $$ BEGIN
  CREATE TYPE "MembershipStatus" AS ENUM ('IN_TRAINING', 'FULL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnrollmentStatus" AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActionVerification" AS ENUM ('SELF', 'LEADER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MembershipApprovalStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "eligibilitySundays" SMALLINT,
ADD COLUMN IF NOT EXISTS "grantsMembership" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isClass" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "requiresFullMembership" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CourseEnrollment" ADD COLUMN IF NOT EXISTS "cohortId" TEXT,
ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "stalledNotifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "CourseLesson" ADD COLUMN IF NOT EXISTS "actionStep" TEXT,
ADD COLUMN IF NOT EXISTS "actionVerification" "ActionVerification" NOT NULL DEFAULT 'SELF',
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "outcome" TEXT,
ADD COLUMN IF NOT EXISTS "reflectionPrompt" TEXT,
ADD COLUMN IF NOT EXISTS "scriptures" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "slug" TEXT,
ADD COLUMN IF NOT EXISTS "summary" TEXT;

ALTER TABLE "CourseModule" ADD COLUMN IF NOT EXISTS "stage" TEXT,
ADD COLUMN IF NOT EXISTS "subtitle" TEXT;

ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "creditedSundays" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "membershipConfirmedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'IN_TRAINING';

CREATE TABLE IF NOT EXISTS "LessonQuizItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LessonQuizItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LessonQuizItem" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "ClassCohort" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "minSessions" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassCohort_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ClassCohort" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "CohortSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekNumber" SMALLINT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,

    CONSTRAINT "CohortSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CohortSession" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "SessionAttendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "markedById" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAttendance_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SessionAttendance" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "CohortFacilitator" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "CohortFacilitator_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CohortFacilitator" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "LessonProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "videoDoneAt" TIMESTAMP(3),
    "quizScorePct" SMALLINT,
    "quizPassedAt" TIMESTAMP(3),
    "quizAttempts" SMALLINT NOT NULL DEFAULT 0,
    "reflection" TEXT,
    "reflectionAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LessonProgress" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "ActionCompletion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "ActionCompletion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ActionCompletion" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "MembershipApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "MembershipApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "note" TEXT,

    CONSTRAINT "MembershipApproval_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MembershipApproval" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "MembershipEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "reason" TEXT,
    "actorProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MembershipEvent" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "LessonQuizItem_lessonId_idx" ON "LessonQuizItem"("lessonId");

CREATE INDEX IF NOT EXISTS "ClassCohort_tenantId_courseId_startsOn_idx" ON "ClassCohort"("tenantId", "courseId", "startsOn");

CREATE INDEX IF NOT EXISTS "CohortSession_cohortId_startsAt_idx" ON "CohortSession"("cohortId", "startsAt");

CREATE INDEX IF NOT EXISTS "SessionAttendance_memberId_idx" ON "SessionAttendance"("memberId");

CREATE UNIQUE INDEX IF NOT EXISTS "SessionAttendance_sessionId_memberId_key" ON "SessionAttendance"("sessionId", "memberId");

CREATE INDEX IF NOT EXISTS "CohortFacilitator_memberId_idx" ON "CohortFacilitator"("memberId");

CREATE UNIQUE INDEX IF NOT EXISTS "CohortFacilitator_cohortId_memberId_key" ON "CohortFacilitator"("cohortId", "memberId");

CREATE UNIQUE INDEX IF NOT EXISTS "LessonProgress_enrollmentId_lessonId_key" ON "LessonProgress"("enrollmentId", "lessonId");

CREATE UNIQUE INDEX IF NOT EXISTS "ActionCompletion_enrollmentId_lessonId_key" ON "ActionCompletion"("enrollmentId", "lessonId");

CREATE UNIQUE INDEX IF NOT EXISTS "MembershipApproval_enrollmentId_key" ON "MembershipApproval"("enrollmentId");

CREATE INDEX IF NOT EXISTS "MembershipApproval_tenantId_status_idx" ON "MembershipApproval"("tenantId", "status");

CREATE INDEX IF NOT EXISTS "MembershipEvent_memberId_createdAt_idx" ON "MembershipEvent"("memberId", "createdAt");

CREATE INDEX IF NOT EXISTS "CourseEnrollment_cohortId_idx" ON "CourseEnrollment"("cohortId");

DO $$ BEGIN
  ALTER TABLE "LessonQuizItem" ADD CONSTRAINT "LessonQuizItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CourseLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ClassCohort" ADD CONSTRAINT "ClassCohort_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CohortSession" ADD CONSTRAINT "CohortSession_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "ClassCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CohortSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CohortFacilitator" ADD CONSTRAINT "CohortFacilitator_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "ClassCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CohortFacilitator" ADD CONSTRAINT "CohortFacilitator_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CourseLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ActionCompletion" ADD CONSTRAINT "ActionCompletion_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ActionCompletion" ADD CONSTRAINT "ActionCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CourseLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MembershipApproval" ADD CONSTRAINT "MembershipApproval_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MembershipApproval" ADD CONSTRAINT "MembershipApproval_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MembershipEvent" ADD CONSTRAINT "MembershipEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "ClassCohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill: everyone who is already a member was a member before the Membership Class
-- existed, so they are full members. People created from now on start IN_TRAINING.
-- Runs once: only rows still at the column default and not yet confirmed are touched.
UPDATE "Member"
SET "membershipStatus" = 'FULL', "membershipConfirmedAt" = COALESCE("membershipConfirmedAt", "joinedAt")
WHERE "membershipStatus" = 'IN_TRAINING' AND "membershipConfirmedAt" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "MembershipEvent" e WHERE e."memberId" = "Member"."id");

INSERT INTO "MembershipEvent" ("id", "tenantId", "memberId", "fromStatus", "toStatus", "method", "reason", "createdAt")
SELECT gen_random_uuid()::text, m."tenantId", m."id", NULL, 'FULL', 'BACKFILL',
       'Member before the Membership Class began', CURRENT_TIMESTAMP
FROM "Member" m
WHERE m."membershipStatus" = 'FULL'
  AND NOT EXISTS (SELECT 1 FROM "MembershipEvent" e WHERE e."memberId" = m."id");

-- Rollback notes (manual, only if this migration must be undone):
--   DROP TABLE "MembershipEvent", "MembershipApproval", "ActionCompletion", "LessonProgress",
--     "CohortFacilitator", "SessionAttendance", "CohortSession", "ClassCohort", "LessonQuizItem";
--   ALTER TABLE "CourseEnrollment" DROP COLUMN "cohortId", DROP COLUMN "status",
--     DROP COLUMN "lastActivityAt", DROP COLUMN "stalledNotifiedAt";
--   ALTER TABLE "CourseLesson" DROP COLUMN "slug", ... (the eight lesson-anatomy columns);
--   ALTER TABLE "CourseModule" DROP COLUMN "subtitle", DROP COLUMN "stage";
--   ALTER TABLE "Course" DROP COLUMN "isClass", DROP COLUMN "eligibilitySundays",
--     DROP COLUMN "requiresFullMembership", DROP COLUMN "grantsMembership";
--   ALTER TABLE "Member" DROP COLUMN "membershipStatus", DROP COLUMN "creditedSundays",
--     DROP COLUMN "membershipConfirmedAt";
--   DROP TYPE "MembershipStatus", "EnrollmentStatus", "ActionVerification", "MembershipApprovalStatus";
