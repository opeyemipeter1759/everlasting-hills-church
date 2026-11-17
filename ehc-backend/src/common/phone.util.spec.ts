import { normalizeNigerianPhone } from './phone.util';

describe('normalizeNigerianPhone', () => {
  it('turns every usual way of typing a Nigerian mobile into 234XXXXXXXXXX', () => {
    expect(normalizeNigerianPhone('08031234567')).toBe('2348031234567');
    expect(normalizeNigerianPhone('+234 803 123 4567')).toBe('2348031234567');
    expect(normalizeNigerianPhone('2348031234567')).toBe('2348031234567');
    expect(normalizeNigerianPhone('8104398529')).toBe('2348104398529');
    expect(normalizeNigerianPhone(' 0905-891-3298 ')).toBe('2349058913298');
  });

  it('leaves anything else as it was typed, trimmed', () => {
    expect(normalizeNigerianPhone('+44 7700 900123')).toBe('+44 7700 900123');
    expect(normalizeNigerianPhone('12345')).toBe('12345');
    expect(normalizeNigerianPhone('   ')).toBeNull();
    expect(normalizeNigerianPhone(null)).toBeNull();
  });
});
