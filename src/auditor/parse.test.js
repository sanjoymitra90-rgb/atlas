import { describe, it, expect } from 'vitest';
import { parseGapCSV, dedupHeaders } from './parse.js';

describe('parseGapCSV', () => {
  it('returns empty for null/empty input', () => {
    expect(parseGapCSV(null)).toEqual({ headers: [], rows: [], errors: [] });
    expect(parseGapCSV('')).toEqual({ headers: [], rows: [], errors: [] });
  });

  it('parses simple CSV', () => {
    const result = parseGapCSV('A,B,C\n1,2,3\n4,5,6');
    expect(result.headers).toEqual(['A', 'B', 'C']);
    expect(result.rows).toEqual([['1', '2', '3'], ['4', '5', '6']]);
    expect(result.errors).toEqual([]);
  });

  it('handles quoted commas', () => {
    const result = parseGapCSV('A,B\n"hello, world",2');
    expect(result.rows).toEqual([['hello, world', '2']]);
  });

  it('handles quoted newlines', () => {
    const result = parseGapCSV('A,B\n"line1\nline2",2');
    expect(result.rows).toEqual([['line1\nline2', '2']]);
  });

  it('handles CRLF', () => {
    const result = parseGapCSV('A,B\r\n1,2\r\n3,4');
    expect(result.headers).toEqual(['A', 'B']);
    expect(result.rows).toEqual([['1', '2'], ['3', '4']]);
  });

  it('handles BOM', () => {
    const result = parseGapCSV('\uFEFFA,B\n1,2');
    expect(result.headers).toEqual(['A', 'B']);
    expect(result.rows).toEqual([['1', '2']]);
  });

  it('handles double-quote escapes', () => {
    const result = parseGapCSV('A\n"hello ""world"""');
    expect(result.rows).toEqual([['hello "world"']]);
  });

  it('pads short rows', () => {
    const result = parseGapCSV('A,B,C\n1,2');
    expect(result.rows).toEqual([['1', '2', '']]);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].reason).toContain('short row');
  });

  it('skips empty rows', () => {
    const result = parseGapCSV('A,B\n1,2\n\n3,4');
    expect(result.rows).toEqual([['1', '2'], ['3', '4']]);
  });
});

describe('dedupHeaders', () => {
  it('returns unchanged headers when no duplicates', () => {
    expect(dedupHeaders(['A', 'B', 'C'])).toEqual({ headers: ['A', 'B', 'C'], duped: 0 });
  });

  it('deduplicates two identical headers', () => {
    expect(dedupHeaders(['A', 'A'])).toEqual({ headers: ['A', 'A (2)'], duped: 1 });
  });

  it('deduplicates three identical headers', () => {
    expect(dedupHeaders(['A', 'A', 'A'])).toEqual({ headers: ['A', 'A (2)', 'A (3)'], duped: 2 });
  });

  it('handles duplicates of two different names', () => {
    const result = dedupHeaders(['A', 'B', 'A', 'B']);
    expect(result.headers).toEqual(['A', 'B', 'A (2)', 'B (2)']);
    expect(result.duped).toBe(2);
  });

  it('handles empty header name', () => {
    const result = dedupHeaders(['', 'A', '']);
    expect(result.headers).toEqual(['', 'A', ' (2)']);
    expect(result.duped).toBe(1);
  });

  it('handles header name that collides with generated suffix', () => {
    const result = dedupHeaders(['A', 'A', 'A (2)']);
    expect(result.headers).toEqual(['A', 'A (2)', 'A (2)']);
    expect(result.duped).toBe(1);
  });
});
