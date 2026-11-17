/**
 * Creates the private Supabase Storage bucket for first-timer photos, or
 * brings an existing one into line: private, photos only (WebP, JPEG, PNG),
 * 5 MB at most. The bucket enforces these itself, because a signed upload
 * link does not bind what a browser actually sends.
 *
 * Idempotent. Dry run by default: it only reads the bucket and says what it
 * would change.
 *   npx ts-node --transpile-only scripts/followup-v2/create-photo-bucket.ts
 * Apply:
 *   npx ts-node --transpile-only scripts/followup-v2/create-photo-bucket.ts --apply
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import ws from 'ws';
import { PHOTO_BUCKET, PHOTO_MAX_BYTES, PHOTO_TYPES } from '../../src/follow-up/photos/first-timer-photo.schema';

const wanted = { public: false, fileSizeLimit: PHOTO_MAX_BYTES, allowedMimeTypes: [...PHOTO_TYPES] };

const sameTypes = (a: string[] | null | undefined, b: string[]) =>
  !!a && a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');

async function main() {
  const apply = process.argv.includes('--apply');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as WebSocketLikeConstructor },
  });
  console.log(`Project: ${new URL(url).host}`);
  console.log(`Bucket:  ${PHOTO_BUCKET}`);
  console.log(`Wanted:  private, ${PHOTO_MAX_BYTES} bytes max, ${wanted.allowedMimeTypes.join(', ')}\n`);

  const { data: bucket } = await supabase.storage.getBucket(PHOTO_BUCKET);

  if (!bucket) {
    console.log('The bucket does not exist yet. It would be created.');
    if (!apply) return console.log('Dry run. Re-run with --apply to create it.');
    const { error } = await supabase.storage.createBucket(PHOTO_BUCKET, wanted);
    if (error) throw new Error(`Could not create the bucket: ${error.message}`);
    return console.log('Created.');
  }

  const limit = bucket.file_size_limit == null ? null : Number(bucket.file_size_limit);
  const changes: string[] = [];
  if (bucket.public) changes.push('make it private (it is public now)');
  if (limit !== PHOTO_MAX_BYTES) changes.push(`set the size limit to ${PHOTO_MAX_BYTES} bytes (now ${limit ?? 'none'})`);
  if (!sameTypes(bucket.allowed_mime_types, wanted.allowedMimeTypes)) {
    changes.push(`allow only ${wanted.allowedMimeTypes.join(', ')} (now ${bucket.allowed_mime_types?.join(', ') || 'any type'})`);
  }

  if (changes.length === 0) return console.log('The bucket already matches. Nothing to do.');
  console.log('The bucket exists. It would be changed to:');
  for (const change of changes) console.log(`  - ${change}`);
  if (!apply) return console.log('\nDry run. Re-run with --apply to change it.');

  const { error } = await supabase.storage.updateBucket(PHOTO_BUCKET, wanted);
  if (error) throw new Error(`Could not update the bucket: ${error.message}`);
  console.log('\nUpdated.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
