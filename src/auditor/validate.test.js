import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, validateUKNumber, gapReasonBucket } from './validate.js';

describe('validateUKNumber', () => {
  it('accepts a well-formed UK mobile', () => {
    expect(validateUKNumber('+447305409280').category).toBe('valid');
  });
  it('categorises a non-UK country code separately from malformed', () => {
    expect(validateUKNumber('+33123456789').category).toBe('non-uk');
  });
  it('returns malformed for empty number', () => {
    expect(validateUKNumber('').category).toBe('malformed');
    expect(validateUKNumber('').reason).toBe('Empty number');
  });
  it('returns non-uk for non-UK country codes', () => {
    expect(validateUKNumber('+1234567890').category).toBe('non-uk');
  });
  it('returns malformed for invalid length', () => {
    expect(validateUKNumber('+44123').category).toBe('malformed');
    expect(validateUKNumber('+4412345678901234').category).toBe('malformed');
  });
  it('returns malformed for invalid prefix', () => {
    expect(validateUKNumber('+4407305409280').category).toBe('malformed');
  });
  it('returns suspected-test for all identical digits', () => {
    expect(validateUKNumber('+447777777777').category).toBe('suspected-test');
    expect(validateUKNumber('+447777777777').reason).toBe('All digits identical');
  });
  it('returns suspected-test for sequential digits', () => {
    expect(validateUKNumber('+447123456789').category).toBe('suspected-test');
    expect(validateUKNumber('+447123456789').reason).toBe('Sequential digits detected');
  });
});

describe('normalizePhoneNumber', () => {
  it('returns value unchanged if no scientific notation', () => {
    expect(normalizePhoneNumber('+447305409280')).toBe('+447305409280');
  });
  it('returns null/undefined unchanged', () => {
    expect(normalizePhoneNumber(null)).toBe(null);
    expect(normalizePhoneNumber(undefined)).toBe(undefined);
  });
  it('adds + prefix to bare 44 numbers', () => {
    expect(normalizePhoneNumber('447305409280')).toBe('+447305409280');
  });
  it('strips whitespace and dashes', () => {
    expect(normalizePhoneNumber('44 7305 409 280')).toBe('+447305409280');
    expect(normalizePhoneNumber('44-7305-409-280')).toBe('+447305409280');
  });
  it('rejects scientific notation with precision loss (44.7305E+10)', () => {
    expect(normalizePhoneNumber('44.7305E+10')).toBe('44.7305E+10');
  });
  it('rejects scientific notation with precision loss (4473054E+5)', () => {
    expect(normalizePhoneNumber('4473054E+5')).toBe('4473054E+5');
  });
  it('rejects scientific notation with leading + and precision loss (+4.47305E+11)', () => {
    expect(normalizePhoneNumber('+4.47305E+11')).toBe('+4.47305E+11');
  });
  it('rejects scientific notation with precision loss (4.47305E+11) — already correct', () => {
    expect(normalizePhoneNumber('4.47305E+11')).toBe('4.47305E+11');
  });
  it('non-scientific control: bare 44 number converts normally', () => {
    expect(normalizePhoneNumber('447305409280')).toBe('+447305409280');
  });
});

describe('gapReasonBucket', () => {
  it('returns other for null or Valid', () => {
    expect(gapReasonBucket(null)).toBe('other');
    expect(gapReasonBucket('Valid')).toBe('other');
  });
  it('returns empty for empty number', () => {
    expect(gapReasonBucket('Empty number')).toBe('empty');
  });
  it('returns non-uk for non-UK reasons', () => {
    expect(gapReasonBucket('Non-UK destination (+33)')).toBe('non-uk');
  });
  it('returns malformed for +44 reasons', () => {
    expect(gapReasonBucket('Does not start with +44')).toBe('malformed');
  });
  it('returns malformed for length reasons', () => {
    expect(gapReasonBucket('Invalid length')).toBe('malformed');
  });
  it('returns suspected-test for identical digits', () => {
    expect(gapReasonBucket('All digits identical')).toBe('suspected-test');
  });
  it('returns suspected-test for sequential digits', () => {
    expect(gapReasonBucket('Sequential digits detected')).toBe('suspected-test');
  });
  it('returns malformed for prefix reasons', () => {
    expect(gapReasonBucket('Invalid UK number prefix')).toBe('malformed');
  });
  it('returns truncated for truncated reasons', () => {
    expect(gapReasonBucket('Truncated value')).toBe('truncated');
  });
  it('returns other for unrecognized reasons', () => {
    expect(gapReasonBucket('Something else')).toBe('other');
  });
});
