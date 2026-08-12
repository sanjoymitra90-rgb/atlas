import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, validateUKNumber, bucketLabels } from './validate.js';

describe('validateUKNumber', () => {
  it('accepts a well-formed UK mobile', () => {
    expect(validateUKNumber('+447305409280').category).toBe('valid');
  });
  it('categorises a non-UK country code separately from malformed', () => {
    expect(validateUKNumber('+33123456789').category).toBe('non-uk');
  });
  it('extracts correct country codes for one-, two- and three-digit codes', () => {
    // One-digit: US +1
    expect(validateUKNumber('+12125551234').countryCode).toBe('+1');
    expect(validateUKNumber('+14155552671').countryCode).toBe('+1');
    // Two-digit: France +33, Germany +49, Australia +61
    expect(validateUKNumber('+33123456789').countryCode).toBe('+33');
    expect(validateUKNumber('+4915112345678').countryCode).toBe('+49');
    expect(validateUKNumber('+61412345678').countryCode).toBe('+61');
    // Three-digit: Bangladesh +880, Portugal +351
    expect(validateUKNumber('+8801712345678').countryCode).toBe('+880');
    expect(validateUKNumber('+351912345678').countryCode).toBe('+351');
    // UK numbers have no countryCode
    expect(validateUKNumber('+447305409280').countryCode).toBeUndefined();
  });
  it('returns malformed for empty number', () => {
    expect(validateUKNumber('').category).toBe('malformed');
    expect(validateUKNumber('').bucket).toBe('empty');
    expect(validateUKNumber('').reason).toBe('Empty number');
  });
  it('returns non-uk for non-UK country codes', () => {
    expect(validateUKNumber('+1234567890').category).toBe('non-uk');
    expect(validateUKNumber('+1234567890').bucket).toBe('non-uk');
  });
  it('returns malformed for invalid length', () => {
    expect(validateUKNumber('+44123').category).toBe('malformed');
    expect(validateUKNumber('+44123').bucket).toBe('wrong-length');
    expect(validateUKNumber('+4412345678901234').category).toBe('malformed');
    expect(validateUKNumber('+4412345678901234').bucket).toBe('wrong-length');
  });
  it('returns malformed for invalid prefix', () => {
    expect(validateUKNumber('+4407305409280').category).toBe('malformed');
    expect(validateUKNumber('+4407305409280').bucket).toBe('bad-prefix');
  });
  it('returns suspected-test for all identical digits', () => {
    expect(validateUKNumber('+447777777777').category).toBe('suspected-test');
    expect(validateUKNumber('+447777777777').bucket).toBe('identical-digits');
    expect(validateUKNumber('+447777777777').reason).toBe('All digits identical');
  });
  it('returns suspected-test for sequential digits', () => {
    expect(validateUKNumber('+447123456789').category).toBe('suspected-test');
    expect(validateUKNumber('+447123456789').bucket).toBe('sequential-run');
    expect(validateUKNumber('+447123456789').reason).toBe('Sequential digits detected');
  });
  it('returns bucket for not-plus-44', () => {
    expect(validateUKNumber('07305409280').bucket).toBe('not-plus-44');
  });
  it('valid number returns bucket valid', () => {
    expect(validateUKNumber('+447305409280').bucket).toBe('valid');
  });
});

describe('bucketLabels', () => {
  it('has labels for all seven buckets plus other', () => {
    expect(Object.keys(bucketLabels)).toEqual(
      expect.arrayContaining(['empty', 'non-uk', 'not-plus-44', 'wrong-length', 'bad-prefix', 'identical-digits', 'sequential-run', 'other'])
    );
  });
  it('labels are user-friendly sentence case', () => {
    expect(bucketLabels['wrong-length']).toBe('Wrong length');
    expect(bucketLabels['sequential-run']).toBe('Sequential run');
    expect(bucketLabels['not-plus-44']).toBe('Not +44');
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
