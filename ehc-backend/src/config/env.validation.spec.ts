import { validateEnv } from './env.validation';

const valid = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/church',
  DIRECT_URL: 'postgresql://user:pass@localhost:5432/church',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  DEFAULT_TENANT_ID: 'ehc_12345678',
  CMS_PREVIEW_SECRET: 'p'.repeat(32),
  CMS_REVALIDATE_SECRET: 'r'.repeat(32),
};

describe('CMS environment secrets', () => {
  it('accepts independently configured strong secrets', () => {
    expect(validateEnv(valid)).toMatchObject({
      CMS_PREVIEW_SECRET: valid.CMS_PREVIEW_SECRET,
      CMS_REVALIDATE_SECRET: valid.CMS_REVALIDATE_SECRET,
    });
  });

  it.each(['CMS_PREVIEW_SECRET', 'CMS_REVALIDATE_SECRET'] as const)(
    'fails startup when %s is absent',
    (key) => {
      const missing: Record<string, unknown> = { ...valid };
      delete missing[key];
      expect(() => validateEnv(missing)).toThrow(key);
    },
  );
});

describe('document uploads environment', () => {
  it('defaults closed', () => {
    expect(validateEnv(valid).DOCUMENT_UPLOADS_ENABLED).toBe(false);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('parses %s explicitly', (value, expected) => {
    expect(validateEnv({ ...valid, DOCUMENT_UPLOADS_ENABLED: value }).DOCUMENT_UPLOADS_ENABLED).toBe(expected);
  });

  it('rejects values other than true or false', () => {
    expect(() => validateEnv({ ...valid, DOCUMENT_UPLOADS_ENABLED: 'yes' })).toThrow('DOCUMENT_UPLOADS_ENABLED');
  });
});
