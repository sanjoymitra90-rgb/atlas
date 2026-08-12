import { describe, it, expect } from 'vitest';
import { escapeHtml, csvCell, formatMoney } from './format.js';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('converts to string', () => {
    expect(escapeHtml(123)).toBe('123');
    expect(escapeHtml(null)).toBe('null');
  });
});

describe('csvCell', () => {
  it('wraps value in double quotes', () => {
    expect(csvCell('hello')).toBe('"hello"');
  });

  it('escapes internal double quotes', () => {
    expect(csvCell('say "hello"')).toBe('"say ""hello"""');
  });

  it('guards formula injection', () => {
    expect(csvCell('=cmd')).toBe('"\'=cmd"');
    expect(csvCell('+cmd')).toBe("\"'+cmd\"");
    expect(csvCell('-cmd')).toBe('"\'-cmd"');
    expect(csvCell('@cmd')).toBe('"\'@cmd"');
  });

  it('does not guard numeric phone numbers starting with + or -', () => {
    expect(csvCell('+447700900123')).toBe('"\\+447700900123"'.replace('\\', ''));
    expect(csvCell('+447700900123')).toBe('"+447700900123"');
    expect(csvCell('-5')).toBe('"-5"');
  });

  it('handles null/undefined', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });
});

describe('formatMoney', () => {
  it('formats with dollar sign and commas', () => {
    expect(formatMoney(1000)).toBe('$1,000');
    expect(formatMoney(1234567)).toBe('$1,234,567');
  });

  it('handles zero', () => {
    expect(formatMoney(0)).toBe('$0');
  });
});
