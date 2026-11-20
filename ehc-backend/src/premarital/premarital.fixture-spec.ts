/** A complete, valid public application for the counselling tests. */
export const validApplication = () => ({
  submissionKey: '6f1c1b1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e',
  applicantFirstName: 'Tunde',
  applicantLastName: 'Adeyemi',
  applicantEmail: 'Tunde@Example.com',
  applicantPhone: '0803 123 4567',
  partnerFirstName: 'Ada',
  partnerLastName: 'Eze',
  partnerEmail: '',
  partnerPhone: '+234 809 765 4321',
  partnerConsentToContact: true,
  membership: 'ONE_MEMBER',
  weddingDate: null as string | null,
  preferredContact: 'WHATSAPP',
  intro: 'We met at university and hope to marry next year.',
  privacyAcknowledged: true,
});
