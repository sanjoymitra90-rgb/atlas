import { describe, it, expect } from 'vitest';
import { getGapBucketKey, getAutoBucketInterval, formatBucketLabel } from './buckets.js';

describe('getGapBucketKey', () => {
  it('returns null for null timestamp', () => {
    expect(getGapBucketKey(null, '1hour')).toBe(null);
  });

  it('returns null for invalid date', () => {
    expect(getGapBucketKey('not-a-date', '1hour')).toBe(null);
  });

  it('returns day key for 1day interval', () => {
    const ts = new Date('2024-01-15T10:30:00Z').getTime();
    expect(getGapBucketKey(ts, '1day')).toBe('2024-01-15');
  });

  it('returns hour key for 1hour interval', () => {
    const ts = new Date('2024-01-15T10:30:00Z').getTime();
    expect(getGapBucketKey(ts, '1hour')).toBe('2024-01-15T10');
  });

  it('returns 5min key for 5min interval', () => {
    const ts = new Date('2024-01-15T10:33:00Z').getTime();
    expect(getGapBucketKey(ts, '5min')).toBe('2024-01-15T10:30');
  });

  it('returns 1min key for 1min interval', () => {
    const ts = new Date('2024-01-15T10:30:45Z').getTime();
    expect(getGapBucketKey(ts, '1min')).toBe('2024-01-15T10:30');
  });
});

describe('getAutoBucketInterval', () => {
  it('returns 1min for range <= 1 hour', () => {
    const min = new Date('2024-01-15T10:00:00Z').getTime();
    const max = new Date('2024-01-15T11:00:00Z').getTime();
    expect(getAutoBucketInterval(min, max)).toBe('1min');
  });

  it('returns 5min for range <= 6 hours', () => {
    const min = new Date('2024-01-15T10:00:00Z').getTime();
    const max = new Date('2024-01-15T16:00:00Z').getTime();
    expect(getAutoBucketInterval(min, max)).toBe('5min');
  });

  it('returns 1hour for range <= 3 days', () => {
    const min = new Date('2024-01-15T00:00:00Z').getTime();
    const max = new Date('2024-01-18T00:00:00Z').getTime();
    expect(getAutoBucketInterval(min, max)).toBe('1hour');
  });

  it('returns 1day for range > 3 days', () => {
    const min = new Date('2024-01-01T00:00:00Z').getTime();
    const max = new Date('2024-01-15T00:00:00Z').getTime();
    expect(getAutoBucketInterval(min, max)).toBe('1day');
  });
});

describe('formatBucketLabel', () => {
  it('formats day label', () => {
    expect(formatBucketLabel('2024-01-15', '1day')).toBe('Jan 15');
  });

  it('formats hour label', () => {
    expect(formatBucketLabel('2024-01-15T10', '1hour')).toBe('Jan 15, 10:00');
  });

  it('formats 5min label', () => {
    expect(formatBucketLabel('2024-01-15T10:30', '5min')).toBe('10:30 AM');
  });

  it('formats 1min label', () => {
    expect(formatBucketLabel('2024-01-15T14:05', '1min')).toBe('2:05 PM');
  });
});
