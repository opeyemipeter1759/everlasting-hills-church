-- Each partner now has their own consent letter, signed by one of their own
-- parents or a recognised guardian (2026-11-21). The shared letter becomes
-- the groom's; the bride's is a new kind. Its rows are added in the next
-- migration, because a new enum value cannot be used in the transaction that
-- adds it.
ALTER TYPE "CounsellingRequirementKind" RENAME VALUE 'PARENTAL_CONSENT' TO 'PARENTAL_CONSENT_GROOM';
ALTER TYPE "CounsellingRequirementKind" ADD VALUE 'PARENTAL_CONSENT_BRIDE';
