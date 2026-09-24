#!/usr/bin/env bash
# Create (or update) one Cloud Scheduler job per backend job, each POSTing
# /jobs/<name> with the X-Cron-Secret header, in Africa/Lagos time.
#
# Unlike cloud-run-cron-setup.sh this never touches the Cloud Run service's
# env vars: it reads the CRON_SECRET already set on ehc-backend-api and only
# manages the scheduler jobs. Re-runnable.
#
# Usage (Git Bash / WSL, gcloud already authenticated):
#   bash ehc-backend/scripts/cloud-scheduler-jobs.sh
set -euo pipefail

PROJECT="everlasting-hills"
REGION="europe-west1"
SERVICE="ehc-backend-api"
TZ_NAME="Africa/Lagos"

BASE_URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT" --format='value(status.url)')
SECRET=$(gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT" --format=json |
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const e=(JSON.parse(s).spec.template.spec.containers[0].env||[]).find(x=>x.name==="CRON_SECRET");if(!e||!e.value){console.error("CRON_SECRET is not set on the service");process.exit(1)}process.stdout.write(e.value)})')

echo -n "GET $BASE_URL/jobs with the secret -> "
curl -s -o /dev/null -w "%{http_code}\n" -H "X-Cron-Secret: $SECRET" "$BASE_URL/jobs"

gcloud services enable cloudscheduler.googleapis.com --project "$PROJECT" >/dev/null

# name|cron (in $TZ_NAME)|description
JOBS=(
  "birthday-greetings|0 8 * * *|Birthday emails to members whose birthday is today"
  "anniversary-greetings|0 8 * * *|Wedding-anniversary emails"
  "follow-up-auto-surface|0 9 * * *|Create follow-up entries for absentees and new visitors"
  "follow-up-reminders|30 9 * * *|48h reminders, 5-day escalations, they're-back prompts"
  "attendance-absentee-emails|*/30 * * * *|We-missed-you emails to absent members once attendance closes (self-checks which service is due, catches up for 48h)"
  "google-calendar-sync|0 */6 * * *|Push services/events/gatherings to Google Calendar"
  "push-service-reminder|0 * * * *|Push: upcoming service reminders"
  "push-serving-reminder|0 * * * *|Push: serving-roster reminders"
  "push-prayer-meeting|*/5 * * * *|Push: prayer-meeting starting soon"
  "sermon-digest|15 */3 * * *|Sermon summary + Word of the Day from the newest YouTube service (Gemini)"
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
gcloud scheduler jobs list --location "$REGION" --project "$PROJECT" --format='table(name.basename(), schedule, timeZone, state)'
