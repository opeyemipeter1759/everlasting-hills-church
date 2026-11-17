import {
  WHATSAPP_MAX,
  longestRenderedLength,
  placeholdersIn,
  renderTemplate,
  unknownPlaceholders,
  type TemplateValues,
} from './template-variables';
import { churchValues, displayPhone, renderOpeningEmail, renderWhatsApp, serviceTimesText, valuesFor, waMeLink } from './opening-message.render';
import { OPENING_TEMPLATE_V1 } from './opening-template.seed';

const values: TemplateValues = {
  firstName: 'Ada',
  churchName: 'Everlasting Hills Church',
  serviceTimes: 'Sundays at 9:00 AM',
  contactName: 'Arewa',
  contactPhone: '0803 123 4567',
};

describe('template placeholders', () => {
  it('accepts only the five whitelisted names, spaces inside the braces allowed', () => {
    expect(unknownPlaceholders('Hi {{firstName}}, I am {{ contactName }} on {{contactPhone}}. {{churchName}} {{serviceTimes}}')).toEqual([]);
  });

  it('names every unknown placeholder, once each', () => {
    expect(unknownPlaceholders('Hi {{name}} {{surname}}', 'Dear {{name}}')).toEqual(['name', 'surname']);
    expect(unknownPlaceholders('{{firstname}}')).toEqual(['firstname']);
  });

  it('refuses braces left open, which would otherwise go out as typed', () => {
    expect(unknownPlaceholders('Hi {{firstName')).toEqual(['unclosed braces']);
    expect(unknownPlaceholders('Hi {{}}')).toEqual(['(empty)']);
  });

  it('fills every placeholder and leaves the rest of the text alone', () => {
    expect(renderTemplate('Hi {{firstName}}, this is {{ contactName }}.', values)).toBe('Hi Ada, this is Arewa.');
    expect(placeholdersIn('{{a}} {{b}} {{a}}')).toEqual(['a', 'b']);
  });
});

describe('the WhatsApp cap', () => {
  it('keeps the rendered text within the cap, even with very long names', () => {
    const body = 'x'.repeat(900) + ' {{firstName}} {{contactName}} {{contactPhone}}';
    expect(longestRenderedLength(body, churchValues())).toBeLessThanOrEqual(WHATSAPP_MAX);
    const long = valuesFor('Oluwatobiloba'.repeat(5), { name: 'Arewa'.repeat(20), phone: '0803'.repeat(10) });
    expect(renderWhatsApp({ whatsappBody: body }, long).length).toBeLessThanOrEqual(WHATSAPP_MAX);
  });

  it('works out the longest a body can get once names are filled in', () => {
    expect(longestRenderedLength('{{firstName}}', churchValues())).toBe(30);
    expect(longestRenderedLength('{{churchName}}', churchValues())).toBe(churchValues().churchName.length);
  });

  it('lets the seeded opening message fit with room to spare', () => {
    expect(unknownPlaceholders(OPENING_TEMPLATE_V1.whatsappBody, OPENING_TEMPLATE_V1.emailSubject, OPENING_TEMPLATE_V1.emailBody)).toEqual([]);
    expect(longestRenderedLength(OPENING_TEMPLATE_V1.whatsappBody, churchValues())).toBeLessThan(WHATSAPP_MAX);
    expect(JSON.stringify(OPENING_TEMPLATE_V1)).not.toContain(String.fromCharCode(0x2014));
  });
});

describe('rendering for a real person', () => {
  it('reads the service times as a sentence', () => {
    expect(serviceTimesText()).toBe('Sundays at 9:00 AM and Wednesdays at 5:30 PM');
  });

  it('shows a Nigerian number the way people write it, and links it as 234', () => {
    expect(displayPhone('+234 803 123 4567')).toBe('0803 123 4567');
    expect(waMeLink('0803 123 4567', 'Hi Ada & co')).toBe('https://wa.me/2348031234567?text=Hi%20Ada%20%26%20co');
    expect(waMeLink(null, 'Hi')).toBeNull();
  });

  it('never leaves a blank where the sender would be', () => {
    const v = valuesFor('  ada grace ', { name: null, phone: null });
    expect(v.firstName).toBe('Ada');
    expect(v.contactName).toBe('the welcome team');
    expect(v.contactPhone).toMatch(/\d/);
  });

  it('puts the email in the church layout with its words escaped', () => {
    const email = renderOpeningEmail({
      content: { emailSubject: 'Welcome, {{firstName}}', emailBody: 'Hello {{firstName}},\n\nWe <3 you.\nSee you.' },
      values: { ...values, firstName: 'Ada' },
      to: 'ada@example.com',
      appUrl: 'https://example.org/',
    });
    expect(email.subject).toBe('Welcome, Ada');
    expect(email.text).toBe('Hello Ada,\n\nWe <3 you.\nSee you.');
    expect(email.html).toContain('We &lt;3 you.<br/>See you.');
    expect(email.html).toContain('https://example.org/visit');
  });
});
