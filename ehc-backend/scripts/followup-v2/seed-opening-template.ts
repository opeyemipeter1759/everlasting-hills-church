/**
 * Follow-up v2, data step 8: version 1 of the opening message
 * (first_timer.opening), from the welcome email the church already sends,
 * rewritten as a warm note from a real person.
 *
 * Writes nothing when the church already has a version: from then on the
 * first-timer contact edits it in the app. Idempotent.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/seed-opening-template.ts            (dry run)
 *   npx ts-node --transpile-only scripts/followup-v2/seed-opening-template.ts --apply
 * Tenant: DEFAULT_TENANT_ID, or --tenant=<id>. Optional --editor=<profileId> records who it is from.
 */
import { randomUUID } from 'crypto';
import { OPENING_TEMPLATE_V1 } from '../../src/message-templates/opening-template.seed';
import { churchValues, renderWhatsApp, valuesFor } from '../../src/message-templates/opening-message.render';
import { OPENING_KEY, WHATSAPP_MAX, longestRenderedLength, unknownPlaceholders } from '../../src/message-templates/template-variables';
import { runDataScript } from './data-script';

if (require.main === module) {
  runDataScript('seed-opening-template', async ({ prisma, tenantId, apply }) => {
    const editor = process.argv.find((a) => a.startsWith('--editor='))?.slice('--editor='.length) ?? null;
    const unknown = unknownPlaceholders(OPENING_TEMPLATE_V1.whatsappBody, OPENING_TEMPLATE_V1.emailSubject, OPENING_TEMPLATE_V1.emailBody);
    if (unknown.length) throw new Error(`The seed copy uses unknown placeholders: ${unknown.join(', ')}`);
    const longest = longestRenderedLength(OPENING_TEMPLATE_V1.whatsappBody, churchValues());
    if (longest > WHATSAPP_MAX) throw new Error(`The seed WhatsApp message can reach ${longest} characters`);

    const existing = await prisma.messageTemplate.findFirst({ where: { tenantId, key: OPENING_KEY }, orderBy: { version: 'desc' } });
    if (existing) {
      console.log(`${OPENING_KEY} already has version ${existing.version} in use. Nothing to do.`);
      return;
    }

    const sample = renderWhatsApp(OPENING_TEMPLATE_V1, valuesFor('Ada', { name: 'Arewa', phone: '08031234567' }));
    console.log(`Will create ${OPENING_KEY} version 1 (WhatsApp at most ${longest} of ${WHATSAPP_MAX} characters).\n`);
    console.log('WhatsApp, filled in for "Ada" from "Arewa":\n');
    console.log(sample.replace(/^/gm, '  '));
    console.log(`\nEmail subject: ${OPENING_TEMPLATE_V1.emailSubject}\n`);
    console.log(OPENING_TEMPLATE_V1.emailBody.replace(/^/gm, '  '));
    if (!apply) return;

    await prisma.messageTemplate.create({
      data: { id: randomUUID(), tenantId, key: OPENING_KEY, version: 1, ...OPENING_TEMPLATE_V1, editedById: editor },
    });
    console.log(`\nCreated ${OPENING_KEY} version 1.`);
  });
}
