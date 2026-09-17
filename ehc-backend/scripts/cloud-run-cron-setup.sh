#!/usr/bin/env bash
# One-time setup: move the backend's scheduled jobs onto Cloud Scheduler.
#
#   1. Restores the FULL env-var set on the Cloud Run service from the last
#      healthy revision and adds CRON_SECRET + CRON_ENABLED=false.
#      (A previous `--env-vars-file` call replaced the whole set with just two
#      vars, producing a revision that could not start. Traffic never moved to
#      it, but the service template is currently wrong — this fixes it.)
#   2. Creates one Cloud Scheduler job per backend job, each POSTing
#      /jobs/<name> with the X-Cron-Secret header, in Africa/Lagos time.
#
# Usage (Git Bash / WSL, gcloud already authenticated):
#   bash ehc-backend/scripts/cloud-run-cron-setup.sh
#
# Re-runnable: scheduler jobs are updated if they already exist.
set -euo pipefail

PROJECT="everlasting-hills"
REGION="europe-west1"
SERVICE="ehc-backend-api"
# The revision currently taking traffic is by definition one that started, so
# its env set is complete. Override with GOOD_REVISION=... if needed.
GOOD_REVISION="${GOOD_REVISION:-$(gcloud run services describe ehc-backend-api --region europe-west1 --project everlasting-hills --format='value(status.traffic[0].revisionName)')}"
echo "Restoring env from revision: $GOOD_REVISION"
BASE_URL="https://ehc-backend-api-886498964135.europe-west1.run.app"
TZ_NAME="Africa/Lagos"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ── 1. Secret ────────────────────────────────────────────────────────────────
# Reuse an existing CRON_SECRET on the service if one is set, else generate.
EXISTING=$(gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT" \
  --format='value(spec.template.spec.containers[0].env)' 2>/dev/null | tr ';' '\n' | sed -n "s/.*'name': 'CRON_SECRET', 'value': '\([^']*\)'.*/\1/p" | head -1)
SECRET="${EXISTING:-$(openssl rand -hex 32)}"
echo "CRON_SECRET: ${EXISTING:+reusing existing}${EXISTING:-generated new}"

# ── 2. Rebuild the complete env set from the healthy revision ───────────────
gcloud run revisions describe "$GOOD_REVISION" --region "$REGION" --project "$PROJECT" --format=json > "$WORK/rev.json"
node - "$WORK/rev.json" "$WORK/env.yaml" "$SECRET" <<'EOF'
const fs = require("fs");
const [revPath, outPath, secret] = process.argv.slice(2);
const rev = JSON.parse(fs.readFileSync(revPath, "utf8"));
const env = rev.spec.containers[0].env || [];
const map = new Map();
for (const e of env) {
  if ("value" in e) map.set(e.name, e.value);
  else { console.error(`ENV ${e.name} is a secret reference, not a literal — add it back manually with --update-secrets`); process.exit(1); }
}
map.set("CRON_SECRET", secret);
map.set("CRON_ENABLED", "false");
fs.writeFileSync(outPath, [...map].map(([k, v]) => `${k}: ${JSON.stringify(String(v))}`).join("\n") + "\n");
console.log(`env file: ${map.size} vars (${env.length} restored from ${rev.metadata.name} + CRON_SECRET + CRON_ENABLED)`);
EOF

gcloud run services update "$SERVICE" --region "$REGION" --project "$PROJECT" \
  --env-vars-file "$WORK/env.yaml" --quiet
echo "Cloud Run service updated with the full env set."

# ── 3. Verify the endpoint answers with the secret ───────────────────────────
echo -n "GET /jobs -> "
curl -s -o /dev/null -w "%{http_code}\n" -H "X-Cron-Secret: $SECRET" "$BASE_URL/jobs"

# ── 4. Cloud Scheduler jobs ─────────────────────────────────────────────────
gcloud services enable cloudscheduler.googleapis.com --project "$PROJECT" >/dev/null

# name|cron (in $TZ_NAME)|description
JOBS=(
  "birthday-greetings|0 8 * * *|Birthday emails to members whose birthday is today"
  "anniversary-greetings|0 8 * * *|Wedding-anniversary emails"
  "follow-up-auto-surface|0 9 * * *|Create follow-up entries for absentees and new visitors"
  "follow-up-reminders|30 9 * * *|48h reminders, 5-day escalations, they're-back prompts"
  "attendance-absentee-emails|*/30 * * * 0,3|We-missed-you emails to absent members once attendance closes (Sun/Wed, self-checks the window)"
  "google-calendar-sync|0 */6 * * *|Push services/events/gatherings to Google Calendar"
  "push-service-reminder|0 * * * *|Push: upcoming service reminders"
  "push-serving-reminder|0 * * * *|Push: serving-roster reminders"
  "push-prayer-meeting|*/5 * * * *|Push: prayer-meeting starting soon"
)

for spec in "${JOBS[@]}"; do
  IFS='|' read -r name cron desc <<<"$spec"
  job="ehc-$name"
  common=(
    --location "$REGION" --project "$PROJECT"
    --schedule "$cron" --time-zone "$TZ_NAME"
    --uri "$BASE_URL/jobs/$name" --http-method POST
    --headers "X-Cron-Secret=$SECRET,Content-Type=application/json"
    --attempt-deadline 300s
    --max-retry-attempts 2 --min-backoff 30s --max-backoff 300s
    --description "$desc"
  )
  if gcloud scheduler jobs describe "$job" --location "$REGION" --project "$PROJECT" >/dev/null 2>&1; then
    gcloud scheduler jobs update http "$job" "${common[@]}" --quiet >/dev/null && echo "updated  $job  ($cron $TZ_NAME)"
  else
    gcloud scheduler jobs create http "$job" "${common[@]}" --quiet >/dev/null && echo "created  $job  ($cron $TZ_NAME)"
  fi
done

echo
echo "Smoke test — running the harmless stub job through Scheduler now:"
gcloud scheduler jobs create http ehc-weekly-digest --location "$REGION" --project "$PROJECT" \
  --schedule "0 7 * * 1" --time-zone "$TZ_NAME" --uri "$BASE_URL/jobs/weekly-digest" --http-method POST \
  --headers "X-Cron-Secret=$SECRET" --description "Weekly digest (stub)" --quiet >/dev/null 2>&1 || true
gcloud scheduler jobs run ehc-weekly-digest --location "$REGION" --project "$PROJECT" --quiet
sleep 5
gcloud scheduler jobs describe ehc-weekly-digest --location "$REGION" --project "$PROJECT" \
  --format='value(status.lastAttemptTime, lastAttemptTime, status.code)'
echo
echo "Done. Jobs:"; gcloud scheduler jobs list --location "$REGION" --project "$PROJECT" --format='table(name.basename(), schedule, timeZone, state, lastAttemptTime)'
