/** A complete, valid application for the pre-marital counselling tests. */
export const validApplication = () => ({
  submissionKey: '6f1c1b1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e',
  groomFirstName: 'Tunde',
  groomLastName: 'Adeyemi',
  groomPhone: '0803 123 4567',
  groomEmail: 'Tunde@Example.com',
  groomIsMember: true,
  brideFirstName: 'Ada',
  brideLastName: 'Eze',
  bridePhone: '+234 809 765 4321',
  brideEmail: 'ada@example.com',
  brideIsMember: false,
  weddingDate: null as string | null,
  relationshipLength: '1_TO_2_YEARS',
  message: 'We hope to marry next year.',
  consent: true,
});
