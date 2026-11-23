# Pre-marital documents: production setup

For whoever runs this in Google Cloud Shell, logged in as a project owner of `everlasting-hills`.

Couples upload their signed consent letter and medical certificates. The
backend encrypts each file before storing it. This runbook sets up the two
things it needs, plus the website's rate-limit secret:

1. A **master encryption key** in Secret Manager (`counselling-documents-kek`).
2. A **private storage bucket** for the encrypted files.
3. A **signing secret** shared by the website and the API, so rate limits count per visitor (`client-ip-signing-secret`).
4. A **default-off upload switch** (`DOCUMENT_UPLOADS_ENABLED`), enabled only after pastoral approval.

There are no scheduled jobs. Nothing deletes documents automatically.

Until the key, bucket and approval switch are configured, the site stays safe but limited:

- the letters email still goes out;
- couples can sign in and prepare their documents, but cannot upload them;
- staff file viewing remains unavailable without the master key;
- rate limits stay shared.

Even after storage is configured, couple uploads remain closed until
`DOCUMENT_UPLOADS_ENABLED=true`. Existing stored files can still be reviewed
by staff while this switch is false.

Run one step at a time. Each step ends with a check. Do not continue past a check that fails.

> The keys are generated inside Cloud Shell and piped straight into Secret
> Manager. The backup below is also piped directly between Secret Manager
> projects; the key is never printed or saved to a local file.

---

## Step 0. Set the names

```bash
gcloud config set project everlasting-hills
PROJECT_ID=everlasting-hills
REGION=europe-west1
BACKEND=ehc-backend-api
BUCKET=everlasting-hills-counselling-documents
BACKEND_SA=$(gcloud run services describe "$BACKEND" --region="$REGION" --format='value(spec.template.spec.serviceAccountName)')
echo "Backend runs as: $BACKEND_SA"
```

**Check:** the last line shows an email address ending in `.iam.gserviceaccount.com`.

Do not continue if this is the default Compute Engine account. Use a dedicated
backend service account instead. Before changing either Cloud Run identity,
inventory and preserve its other required permissions; changing identities
without that review can break unrelated backend or website features.

Now find the website's Cloud Run service (the one behind www):

```bash
gcloud beta run domain-mappings list --region="$REGION" --format='table(metadata.name,spec.routeName)'
```

Set `FRONTEND` to the `routeName` shown for `www.everlastinghills.church`. If the list is empty, use `everlasting-hills-church-git`.

```bash
FRONTEND=everlasting-hills-church-git   # change if the list above says otherwise
FRONTEND_SA=$(gcloud run services describe "$FRONTEND" --region="$REGION" --format='value(spec.template.spec.serviceAccountName)')
echo "Website runs as: $FRONTEND_SA"
```

**Check:** an email address is printed.

The backend and website service accounts must be different and neither may be
the default Compute Engine account. If they are shared or default accounts,
stop here: create dedicated identities, migrate the permissions each service
actually needs, update the Cloud Run services, and verify both services before
continuing. The document key and bucket permissions below belong only to the
backend identity.

```bash
if [ -z "$BACKEND_SA" ] || [ -z "$FRONTEND_SA" ]; then
  echo "STOP: could not determine both Cloud Run service accounts." >&2
  exit 1
fi
if [ "$BACKEND_SA" = "$FRONTEND_SA" ]; then
  echo "STOP: backend and website share a service account." >&2
  exit 1
fi
case "$BACKEND_SA $FRONTEND_SA" in
  *-compute@developer.gserviceaccount.com*)
    echo "STOP: use dedicated service accounts, not the default compute account." >&2
    exit 1
    ;;
esac
```

---

## Step 1. Switch on the two APIs

```bash
gcloud services enable secretmanager.googleapis.com storage.googleapis.com
```

**Check:**

```bash
gcloud services list --enabled --filter="config.name:(secretmanager.googleapis.com storage.googleapis.com)" --format='value(config.name)'
```

Both names are listed.

---

## Step 2. Create the master encryption key (never shown)

```bash
openssl rand -base64 32 | tr -d '\n' | \
  gcloud secrets create counselling-documents-kek \
    --replication-policy=user-managed --locations="$REGION" --data-file=-
```

**Check** that version 1 exists, and that it decodes to exactly 32 bytes. Only the byte count is printed, never the key:

```bash
gcloud secrets versions list counselling-documents-kek --format='table(name,state)'
gcloud secrets versions access 1 --secret=counselling-documents-kek | base64 -d | wc -c
```

The first command shows version `1` as `ENABLED`. The second prints `32`.

### Back up the key without displaying it

Use a separate, access-restricted project for recovery. Do not grant either
runtime service account access to this backup. The key is streamed directly
between Secret Manager projects; it is not printed or written to disk.

```bash
BACKUP_PROJECT=replace-with-approved-backup-project
BACKUP_REGION=europe-west1
if [ "$BACKUP_PROJECT" = "replace-with-approved-backup-project" ]; then
  echo "Set BACKUP_PROJECT to the approved, separate backup project." >&2
  exit 1
fi
set -o pipefail
gcloud secrets versions access 1 --project="$PROJECT_ID" --secret=counselling-documents-kek | \
  gcloud secrets create counselling-documents-kek \
    --project="$BACKUP_PROJECT" \
    --replication-policy=user-managed --locations="$BACKUP_REGION" --data-file=-
```

**Check:** version `1` exists in the backup project, and the backup secret's
IAM policy grants access only to designated custodians:

```bash
gcloud secrets versions list counselling-documents-kek --project="$BACKUP_PROJECT" --format='table(name,state)'
gcloud secrets get-iam-policy counselling-documents-kek --project="$BACKUP_PROJECT" --format='table(bindings.role,bindings.members)'
gcloud projects get-iam-policy "$BACKUP_PROJECT" \
  --flatten='bindings[].members' \
  --filter='bindings.role:roles/secretmanager.*' \
  --format='table(bindings.role,bindings.members)'
cmp <(gcloud secrets versions access 1 --project="$PROJECT_ID" --secret=counselling-documents-kek) \
  <(gcloud secrets versions access 1 --project="$BACKUP_PROJECT" --secret=counselling-documents-kek)
```

The `cmp` command prints nothing and exits successfully only if the two secret
values match. Also check any folder- or organization-level grants on the
backup project. No runtime service account or group that contains one may read
the backup. Do not proceed until the backup exists, matches, and recovery
access has been reviewed.

---

## Step 3. Create the rate-limit signing secret (never shown)

```bash
openssl rand -base64 48 | tr -d '\n' | \
  gcloud secrets create client-ip-signing-secret \
    --replication-policy=user-managed --locations="$REGION" --data-file=-
```

**Check** (only the length is printed):

```bash
gcloud secrets versions list client-ip-signing-secret --format='table(name,state)'
gcloud secrets versions access 1 --secret=client-ip-signing-secret | wc -c
```

Version `1` is `ENABLED`, and the length is `64`.

---

## Step 4. Let only the right services read each secret

Each grant is on one secret, not the whole project:

- The backend may read both secrets.
- The website may read only the signing secret.

```bash
gcloud secrets add-iam-policy-binding counselling-documents-kek \
  --member="serviceAccount:$BACKEND_SA" --role=roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding client-ip-signing-secret \
  --member="serviceAccount:$BACKEND_SA" --role=roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding client-ip-signing-secret \
  --member="serviceAccount:$FRONTEND_SA" --role=roles/secretmanager.secretAccessor
```

**Check:**

```bash
gcloud secrets get-iam-policy counselling-documents-kek --format='table(bindings.role,bindings.members)'
gcloud secrets get-iam-policy client-ip-signing-secret --format='table(bindings.role,bindings.members)'
```

The key lists only the backend account. The signing secret lists the backend and the website accounts.

---

## Step 5. Create the private bucket

The bucket has these settings:

- in Europe (same region as the API);
- no public access, ever;
- one access policy for the whole bucket;
- **soft delete off**, so that when a couple replaces a file, or a Pastor deletes a closed case's documents, the file is really gone and not kept for 7 days.

```bash
gcloud storage buckets create "gs://$BUCKET" \
  --location="$REGION" \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access \
  --public-access-prevention \
  --soft-delete-duration=0s
```

**Check:**

```bash
gcloud storage buckets describe "gs://$BUCKET" \
  --format='yaml(location,iamConfiguration.publicAccessPrevention,iamConfiguration.uniformBucketLevelAccess.enabled,softDeletePolicy,versioning)'
```

You should see:

- `location: EUROPE-WEST1`
- `publicAccessPrevention: enforced`
- `enabled: true` (under `uniformBucketLevelAccess`)
- a soft delete retention of `0`
- no versioning enabled

---

## Step 6. Give the backend only what it uses on that bucket

The backend needs to do exactly three things to objects in this one bucket:

- create new ones
- read them
- delete them

It never lists the bucket, changes objects or changes permissions. A small custom role grants just those three permissions, on this bucket only.

```bash
gcloud iam roles create counsellingDocumentsObjects --project=everlasting-hills \
  --title="Counselling documents objects" \
  --description="Create, read and delete objects in the counselling documents bucket only" \
  --permissions=storage.objects.create,storage.objects.get,storage.objects.delete \
  --stage=GA

gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$BACKEND_SA" \
  --role="projects/everlasting-hills/roles/counsellingDocumentsObjects"
```

**Check:**

```bash
gcloud iam roles describe counsellingDocumentsObjects --project=everlasting-hills --format='value(includedPermissions)'
gcloud storage buckets get-iam-policy "gs://$BUCKET" --format='table(bindings.role,bindings.members)'
gcloud projects get-iam-policy "$PROJECT_ID" \
  --flatten='bindings[].members' \
  --filter='bindings.role:roles/storage.*' \
  --format='table(bindings.role,bindings.members)'
```

The custom role lists exactly the three permissions. The bucket policy shows
the custom role for the backend account, and the website account is not listed.
Review the project-level output for broad roles such as `roles/storage.admin`
or `roles/storage.objectAdmin`; also check any folder- or organization-level
grants. Remove broad access only after confirming which service depends on it.

---

## Step 6a. Enable Data Access audit logs

In Google Cloud Console, open **IAM & Admin → Audit Logs** for this project.
Enable **Data Read** and **Data Write** for **Cloud Storage** and **Secret
Manager**, then save. Data Access logs can incur logging charges; confirm the
expected volume and retention with the project owner.

**Check:** the project policy lists both services and both log types:

```bash
gcloud projects get-iam-policy "$PROJECT_ID" --format='yaml(auditConfigs)'
```

After the dummy-document test in Step 9, use Logs Explorer to confirm the
storage object read/write events are present. Do not log or paste document
contents, access tokens, or key values.

---

## Step 7. Configure the routes with uploads closed and the key unmounted

This makes a new backend revision with the upload switch explicitly off. Keep
the encryption key unmounted for this route and switch check; the authenticated
dashboard and disabled response do not require it.

Before running the update, inspect the current secret names. If a
`COUNSELLING_DOC_KEK_V<n>` secret is already mounted, stop and confirm that no
stored documents need it before taking any action to unmount it.

```bash
gcloud run services update "$BACKEND" --region="$REGION" \
  --update-secrets=CLIENT_IP_SIGNING_SECRET=client-ip-signing-secret:1 \
  --update-env-vars=COUNSELLING_DOCS_BUCKET="$BUCKET",DOCUMENT_UPLOADS_ENABLED=false
```

**Check 1.** The settings are there. Only names are printed:

```bash
gcloud run services describe "$BACKEND" --region="$REGION" --format=json | \
  python3 -c "import json,sys; e=json.load(sys.stdin)['spec']['template']['spec']['containers'][0]['env']; print([x['name'] for x in e if x['name'].startswith(('COUNSELLING_DOC','CLIENT_IP')) or x['name']=='DOCUMENT_UPLOADS_ENABLED'])"
```

Expect `CLIENT_IP_SIGNING_SECRET`, `COUNSELLING_DOCS_BUCKET` and
`DOCUMENT_UPLOADS_ENABLED`. Confirm that no `COUNSELLING_DOC_KEK_V<n>` secret
is mounted yet and that the switch is `false`.

**Check 2.** Use the signed-in test partner from Step 9, not a fabricated
token or the retired public-link endpoint. The authenticated
`GET /counselling/me` call should return `200`, with `documents.uploadsOpen`
false and all `canUpload` values false. The page should say online uploads
are not open and show no upload controls.

For a direct Cloud Shell check, use a short-lived access token from that
signed-in test account (never a made-up token). The GET output is limited to
upload flags, not the dashboard's personal data. Set `UPLOAD_KIND` to a
requirement belonging to that test account:

```bash
API_URL=$(gcloud run services describe "$BACKEND" --region="$REGION" --format='value(status.url)')
UPLOAD_KIND=PARENTAL_CONSENT_GROOM  # use a kind belonging to the signed-in test partner
read -r -s -p "Short-lived access token for the signed-in test partner: " COUPLE_TOKEN; printf '\n'

curl -sS -w '\nHTTP %{http_code}\n' "$API_URL/counselling/me" \
  -H "Authorization: Bearer $COUPLE_TOKEN" | \
  python3 -c "import json,sys; body,status=sys.stdin.read().rsplit('\nHTTP ',1); print('GET HTTP',status.strip()); d=json.loads(body)['data']['documents']; print({'uploadsOpen':d['uploadsOpen'],'canUpload':[x['canUpload'] for x in d['items']]})"

curl -sS -w '\nHTTP %{http_code}\n' -X POST \
  "$API_URL/counselling/me/documents/$UPLOAD_KIND/upload" \
  -H "Authorization: Bearer $COUPLE_TOKEN" | \
  python3 -c "import json,sys; body,status=sys.stdin.read().rsplit('\nHTTP ',1); print('Upload HTTP',status.strip()); print(json.loads(body).get('message'))"
unset COUPLE_TOKEN
```

The GET should report `uploadsOpen: False` and all `canUpload` values false;
the POST should report HTTP `503`. Do not add a file to this POST.

The current routes are:

| Purpose | Route |
| --- | --- |
| Couple dashboard and document statuses | `GET /counselling/me` |
| Record medical-document consent | `POST /counselling/me/documents/consent` |
| Upload or replace an owned document | `POST /counselling/me/documents/:kind/upload` |
| Download a partner's letter | `GET /counselling/me/letters/:kind` |
| Staff: request a one-use viewing ticket | `POST /premarital/documents/:requirementId/view-ticket` |
| Staff: open a file using that ticket | `POST /premarital/documents/view` |
| Pastor: delete files for a closed case | `POST /premarital/applications/:id/documents/delete-stored` |

These routes are on the backend URL without an `/api` prefix. Couple routes
require a signed-in account linked to the application. Couples see status
only, never the uploaded file. Staff viewing still requires the encryption
key; the upload switch does not disable staff viewing.

**Careful later:** a `gcloud run services update` that uses `--set-secrets`
replaces every mounted secret. Use `--update-secrets` to add one, or the key
mount disappears and uploads close again (this happened once on 2026-11-20).

---

## Step 8. Give the website the signing secret

```bash
gcloud run services update "$FRONTEND" --region="$REGION" \
  --update-secrets=CLIENT_IP_SIGNING_SECRET=client-ip-signing-secret:1
```

**Check:**

```bash
gcloud run services describe "$FRONTEND" --region="$REGION" --format=json | \
  python3 -c "import json,sys; e=json.load(sys.stdin)['spec']['template']['spec']['containers'][0]['env']; print([x['name'] for x in e if x['name']=='CLIENT_IP_SIGNING_SECRET'])"
```

It prints `['CLIENT_IP_SIGNING_SECRET']`.

**Check after the next deploy of each service:** run the Step 7 Check 1 and the Step 8 check again. Deploys from GitHub keep settings they are not told to change, but confirm it once.

---

## Step 9. Try it end to end

### Verify the authenticated routes while the key is unmounted

1. Apply on https://www.everlastinghills.church/pre-marital-counselling with two test email addresses and two different phone numbers.
2. Open both emails and sign in as one test partner.
3. Confirm the dashboard's authenticated `GET /counselling/me` succeeds and shows uploads as closed.
4. With the same signed-in test account, attempt that partner's own `POST /counselling/me/documents/:kind/upload` route while the switch is false. It should return `503` with "Uploading is not open yet." Do not send a file. Do not use a fabricated token or the retired `/public/premarital/documents/access` route.

If either route is missing or the switch does not return the expected response,
stop. Leave the key unmounted and do not send couples upload instructions.

### Mount the key, then test only after pastoral approval

After the route/switch check and the hardening checks above pass, mount the
key while leaving uploads disabled. This makes secure staff review available
without opening couple uploads:

```bash
gcloud run services update "$BACKEND" --region="$REGION" \
  --update-secrets=COUNSELLING_DOC_KEK_V1=counselling-documents-kek:1 \
  --update-env-vars=COUNSELLING_DOC_KEK_CURRENT=1,DOCUMENT_UPLOADS_ENABLED=false
```

Only after the Pastor approves opening online uploads, enable them:

```bash
gcloud run services update "$BACKEND" --region="$REGION" \
  --update-env-vars=DOCUMENT_UPLOADS_ENABLED=true
```

This makes a new backend revision. If approval has not been given, leave the
switch false and stop here.

Create a clearly marked dummy PDF with no personal information. For a test
application with a groom account, run these calls using that signed-in test
user's short-lived access token. For a bride account, use the corresponding
`*_BRIDE` document kinds instead.

```bash
API_URL=$(gcloud run services describe "$BACKEND" --region="$REGION" --format='value(status.url)')
UPLOAD_FILE=./ehc-test-medical-certificate.pdf
test -f "$UPLOAD_FILE" || { echo "Create or upload the marked dummy PDF first." >&2; exit 1; }
read -r -s -p "Short-lived access token for the signed-in test partner: " COUPLE_TOKEN; printf '\n'

curl -sS -o /dev/null -w 'Consent HTTP %{http_code}\n' -X POST \
  "$API_URL/counselling/me/documents/consent" \
  -H "Authorization: Bearer $COUPLE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"kind":"MEDICAL_CERT_GROOM"}'

curl -sS -o /dev/null -w 'Dummy upload HTTP %{http_code}\n' \
  "$API_URL/counselling/me/documents/MEDICAL_CERT_GROOM/upload" \
  -H "Authorization: Bearer $COUPLE_TOKEN" \
  -F "file=@$UPLOAD_FILE;type=application/pdf"
unset COUPLE_TOKEN
```

Both calls should return HTTP `200`. Then:

1. Confirm the couple dashboard shows the upload awaiting review and provides no file preview.
2. In the office dashboard, confirm the application shows "New upload". Only a Pastor can view a medical certificate; use the one-use view-ticket flow and confirm the document is readable.
3. Close the test application, then use **Delete stored documents** (Pastor only) to remove its files. Verify the file count is zero and confirm the audit events are present.

---

## Later: rotating the master key

Files stay readable with the key version they were sealed with, so rotation is additive.

1. Add version 2, never shown:

   ```bash
   openssl rand -base64 32 | tr -d '\n' | gcloud secrets versions add counselling-documents-kek --data-file=-
   ```

2. Mount it alongside version 1, and make it the current one:

   ```bash
   gcloud run services update "$BACKEND" --region="$REGION" \
     --update-secrets=COUNSELLING_DOC_KEK_V2=counselling-documents-kek:2 \
     --update-env-vars=COUNSELLING_DOC_KEK_CURRENT=2
   ```

3. New uploads now use version 2. **Keep `COUNSELLING_DOC_KEK_V1` mounted** while any stored file still uses it. To see how many do, run this in the Supabase SQL editor (it shows counts only, no personal data):

   ```sql
   select "encryptionKeyVersion", count(*) from "CounsellingDocumentFile"
    where "purgedAt" is null group by 1;
   ```

4. Only when version 1 shows no files: remove the V1 mount (`--remove-secrets=COUNSELLING_DOC_KEK_V1`), then disable the old version (`gcloud secrets versions disable 1 --secret=counselling-documents-kek`).

The code supports versions 1 to 3. A fourth needs one line added to `ehc-backend/src/config/env.validation.ts`.

## Turning uploads off in an emergency

To stop new couple uploads while leaving the key mounted for staff review:

```bash
gcloud run services update "$BACKEND" --region="$REGION" \
  --update-env-vars=DOCUMENT_UPLOADS_ENABLED=false
```

To disable all document storage access as well, remove the mounted key:

```bash
gcloud run services update "$BACKEND" --region="$REGION" --remove-secrets=COUNSELLING_DOC_KEK_V1
```

Couple uploads then remain closed, and staff file viewing answers "not set up yet". Nothing is ever stored unencrypted. Re-run step 7 to restore the key, then enable uploads only after pastoral approval.

## The letterhead

The letters use `ehc-backend/assets/letterhead/ehc-letterhead-a4.jpg`. To use a sharper version, replace that file in the repository with one of the same name (PNG or JPEG, A4 portrait), or point `LETTERHEAD_PATH` at another file in the image. No code change is needed.

If the new file's header or footer sits in a different place, the safe text area (`SAFE` in `letter-renderer.ts`) needs measuring again.
