/**
 * Renders both pre-marital letters with made-up details into docs/samples/,
 * for checking the layout on the letterhead. No database, no real names.
 *
 *   cd ehc-backend && npx ts-node --transpile-only scripts/premarital/render-sample-letters.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_DOCUMENTS_CONFIG, valuesOf } from '../../src/premarital/documents/documents-config';
import { SAMPLE_VARS } from '../../src/premarital/documents/document-letters.service';
import { SEED_BODIES } from '../../src/premarital/documents/letter-blocks';
import { LetterRenderer } from '../../src/premarital/documents/letter-renderer';

async function main() {
  const s = valuesOf(DEFAULT_DOCUMENTS_CONFIG);
  const renderer = new LetterRenderer({ get: () => undefined } as never);
  const out = join(process.cwd(), '..', 'docs', 'samples');
  mkdirSync(out, { recursive: true });
  const letters = [
    { file: 'Parental-Consent.sample.pdf', kind: 'PARENTAL_CONSENT' as const, back: s.consentReturnInstructions },
    { file: 'Medical-Screening-Requirement.sample.pdf', kind: 'MEDICAL_SCREENING' as const, back: s.certReturnInstructions },
  ];
  for (const l of letters) {
    const r = await renderer.render({
      title: l.file,
      blocks: SEED_BODIES[l.kind],
      vars: { ...SAMPLE_VARS, returnInstructions: l.back },
      tests: s.screeningTests,
      labs: s.recommendedLabs,
    });
    writeFileSync(join(out, l.file), r.bytes);
    console.log(`${l.file}: ${r.pageCount} page(s), ${Math.round(r.bytes.length / 1024)} KB`);
  }
}

void main();
