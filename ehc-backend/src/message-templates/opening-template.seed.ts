/**
 * Version 1 of the opening message, from the welcome email the church already
 * sends, rewritten as a note from a real person. Used by
 * scripts/followup-v2/seed-opening-template.ts. After that it is the first
 * version in the editor's history and nothing reads this file.
 */
export const OPENING_TEMPLATE_V1 = {
  whatsappBody: [
    'Hello {{firstName}}, this is {{contactName}} from {{churchName}}.',
    '',
    'Thank you so much for worshipping with us. It was a joy to have you, and we hope you felt at home.',
    '',
    'We meet {{serviceTimes}}, and there is always a seat for you. If you have a question, would like prayer, or just want to talk, reply here or call me on {{contactPhone}}.',
    '',
    'See you soon!',
  ].join('\n'),
  emailSubject: 'So glad you came, {{firstName}}',
  emailBody: [
    'Hello {{firstName}},',
    '',
    'Thank you for worshipping with us at {{churchName}}. It was a real joy to have you, and we hope you went home feeling lighter than when you came in.',
    '',
    'You are not here by accident. Whether this was your first step into a church in a long while, or you have been looking for a place to belong, there is a seat with your name on it here.',
    '',
    'We meet {{serviceTimes}}. Come as you are, and bring a friend if you like.',
    '',
    'If you have a question, would like someone to pray with you, or simply want to talk, reply to this email or call me on {{contactPhone}}. I would love to hear from you.',
    '',
    'With love,',
    '{{contactName}}',
    'for everyone at {{churchName}}',
  ].join('\n'),
};
