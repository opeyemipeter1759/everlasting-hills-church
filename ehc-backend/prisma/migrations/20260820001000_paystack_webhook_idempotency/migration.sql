-- Existing production databases will record the schema baseline as applied, so
-- this post-baseline migration carries the idempotency constraint forward.
-- Fail without modifying the schema if historical duplicates need remediation.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PaystackWebhookLog"
    GROUP BY "tenantId", "event", "reference"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create Paystack webhook idempotency index: duplicate tenant/event/reference rows exist';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "PaystackWebhookLog_tenantId_event_reference_key"
ON "PaystackWebhookLog" ("tenantId", "event", "reference");
