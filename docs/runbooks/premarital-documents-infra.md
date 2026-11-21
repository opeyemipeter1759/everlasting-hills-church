# Pre-marital documents: production setup

For whoever runs this in Google Cloud Shell, logged in as a project owner of `everlasting-hills`.

Couples upload their signed consent letter and medical certificates. The
backend encrypts each file before storing it. This runbook sets up the two
things it needs, plus the website's rate-limit secret:

1. A **master encryption key** in Secret Manager (`counselling-documents-kek`).
2. A **private storage bucket** for the encrypted files.
3. A **signing secret** shared by the website and the API, so rate limits count per visitor (`client-ip-signing-secret`).

There are no scheduled jobs. Nothing deletes documents automatically.

Until these steps are done, the site stays safe but limited:

- the letters email still goes out;
- the upload page and file viewing answer "not set up yet";
- rate limits stay shared.

Run one step at a time. Each step ends with a check. Do not continue past a check that fails.

> The keys are generated inside Cloud Shell and piped straight into Secret
> Manager. They are never printed, logged or saved to a file. Nobody, including
> you, needs to see their values.

---

## Step 0. Set the names

```bash
gcloud config set project everlasting-hills
REGION=europe-west1
BACKEND=ehc-backend-api
BUCKET=everlasting-hills-counselling-documents
BACKEND_SA=$(gcloud run services describe "$BACKEND" --region="$REGION" --format='value(spec.template.spec.serviceAccountName)')
echo "Backend runs as: $BACKEND_SA"
```

**Check:** the last line shows an email address ending in `.iam.gserviceaccount.com`.

> If it is `<number>-compute@developer.gserviceaccount.com` (the default
> compute account), it works, but that account usually has broad project
> rights. Moving the backend to its own service account is worth doing
> separately. The grants below stay the same.

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
```

The role lists exactly the three permissions. The bucket policy shows the custom role for the backend account. The website account is not listed.

---

## Step 7. Give the backend the key, the bucket and the signing secret

This makes a new backend revision. The secrets are mounted from Secret Manager; the bucket name and key version are plain settings.

```bash
gcloud run services update "$BACKEND" --region="$REGION" \
  --update-secrets=COUNSELLING_DOC_KEK_V1=counselling-documents-kek:1,CLIENT_IP_SIGNING_SECRET=client-ip-signing-secret:1 \
  --update-env-vars=COUNSELLING_DOC_KEK_CURRENT=1,COUNSELLING_DOCS_BUCKET="$BUCKET"
```

**Check 1.** The settings are there. Only names are printed:

```bash
gcloud run services describe "$BACKEND" --region="$REGION" --format=json | \
  python3 -c "import json,sys; e=json.load(sys.stdin)['spec']['template']['spec']['containers'][0]['env']; print([x['name'] for x in e if x['name'].startswith(('COUNSELLING_DOC','CLIENT_IP'))])"
```

The four names are listed: `COUNSELLING_DOC_KEK_V1`, `CLIENT_IP_SIGNING_SECRET`, `COUNSELLING_DOC_KEK_CURRENT` and `COUNSELLING_DOCS_BUCKET`.

**Check 2.** Sign in to a test couple dashboard (see Step 9). The yellow "Uploading opens shortly" note is gone and each document has a **Choose a file** button. If the note is still there, `COUNSELLING_DOC_KEK_V1` is missing from Check 1: run the `--update-secrets` part of this step again.

**Careful later:** a `gcloud run services update` that uses `--set-secrets` replaces every mounted secret. Use `--update-secrets` to add one, or the key mount disappears and uploads close again (this happened once on 2026-11-20).

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

1. Apply on https://www.everlastinghills.church/pre-marital-counselling with two email addresses you can read (one for each partner) and two different phone numbers.
2. Open both emails. Each has that partner's own two letters attached and explains how to sign in.
3. Sign in as one partner with the phone number (digits only), choose a new password, then on the dashboard tick the consent box and upload a photo of a certificate and the signed consent letter.
4. In the office dashboard, on that application, those documents show "New upload". Only an account with the Pastor role sees **View** on a medical certificate.
5. Close the test application, then use **Delete stored documents** (Pastor only) to remove its files.

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

```bash
gcloud run services update "$BACKEND" --region="$REGION" --remove-secrets=COUNSELLING_DOC_KEK_V1
```

Uploads and viewing then answer "not set up yet", and nothing is ever stored unencrypted. Re-run step 7 to turn them back on.

## The letterhead

The letters use `ehc-backend/assets/letterhead/ehc-letterhead-a4.jpg`. To use a sharper version, replace that file in the repository with one of the same name (PNG or JPEG, A4 portrait), or point `LETTERHEAD_PATH` at another file in the image. No code change is needed.

If the new file's header or footer sits in a different place, the safe text area (`SAFE` in `letter-renderer.ts`) needs measuring again.
