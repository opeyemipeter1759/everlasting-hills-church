-- Follow-up v2: approvals that carry more than their subject (a proposed assignee).
ALTER TABLE "ApprovalRequest" ADD COLUMN "payload" JSONB;
