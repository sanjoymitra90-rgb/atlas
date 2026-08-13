import { describe, it, expect } from 'vitest';
import { parseGapTimestamp } from './time.js';

describe('parseGapTimestamp', () => {
  it('parses a 10-digit epoch seconds string, multiplying by 1000', () => {
    const r = parseGapTimestamp('1706140800');
    expect(r.timestamp).toBe(1706140800000);
    expect(r.timeValid).toBe(true);
  });

  it('parses a 13-digit epoch milliseconds string without multiplying', () => {
    const r = parseGapTimestamp('1706140800000');
    expect(r.timestamp).toBe(1706140800000);
    expect(r.timeValid).toBe(true);
  });

  it('parses ISO timestamp with Z offset, reporting timeHadOffset true', () => {
    const r = parseGapTimestamp('2026-01-15T10:30:00Z');
    expect(r.timeValid).toBe(true);
    expect(r.timeHadOffset).toBe(true);
  });

  it('parses ISO timestamp with +05:30 offset, reporting timeHadOffset true', () => {
    const r = parseGapTimestamp('2026-01-15T10:30:00+05:30');
    expect(r.timeValid).toBe(true);
    expect(r.timeHadOffset).toBe(true);
  });

  it('parses ISO timestamp without offset, reporting timeHadOffset false', () => {
    const r = parseGapTimestamp('2026-01-15T10:30:00');
    expect(r.timeValid).toBe(true);
    expect(r.timeHadOffset).toBe(false);
  });

  it('parses D/M/YYYY H:MM format via Date.UTC', () => {
    const r = parseGapTimestamp('15/01/2026 10:30');
    expect(r.timeValid).toBe(true);
    expect(r.timeHadOffset).toBe(false);
    // Should match the same UTC instant as the ISO equivalent
    const iso = parseGapTimestamp('2026-01-15T10:30:00Z');
    expect(r.timestamp).toBe(iso.timestamp);
  });

  it('parses D/M/YYYY H:MM:SS format with seconds', () => {
    const r = parseGapTimestamp('15/01/2026 10:30:45');
    expect(r.timeValid).toBe(true);
    expect(r.timestamp).toBe(1768473045000);
  });

  it('returns timeValid false for unparseable values without throwing', () => {
    const r = parseGapTimestamp('not-a-date');
    expect(r.timeValid).toBe(false);
    expect(r.timestamp).toBeNull();
  });

  it('returns timeValid false for empty string', () => {
    const r = parseGapTimestamp('');
    expect(r.timeValid).toBe(false);
  });

  it('returns timeValid false for null', () => {
    const r = parseGapTimestamp(null);
    expect(r.timeValid).toBe(false);
  });
});
