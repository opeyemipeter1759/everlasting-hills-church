import { hasValidFileSignature } from './file-signature.util';

describe('hasValidFileSignature', () => {
  it('accepts data whose declared MIME matches its magic bytes', () => {
    expect(
      hasValidFileSignature({
        mimetype: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      }),
    ).toBe(true);
    expect(
      hasValidFileSignature({ mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.7') }),
    ).toBe(true);
  });

  it('rejects spoofed MIME types and executable markup', () => {
    expect(
      hasValidFileSignature({
        mimetype: 'image/jpeg',
        buffer: Buffer.from('<script>alert(1)</script>'),
      }),
    ).toBe(false);
    expect(
      hasValidFileSignature({
        mimetype: 'application/pdf',
        buffer: Buffer.from('MZ executable'),
      }),
    ).toBe(false);
  });
});
