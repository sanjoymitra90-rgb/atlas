import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { parseGapTimestamp } from './time.js';

// Runs the module in a fresh child process under a forced TZ, so the test genuinely
// evaluates parsing under more than one timezone regardless of the machine that
// happens to run the suite.
function parseInTimezone(tz, raw) {
  const moduleUrl = new URL('./time.js', import.meta.url).href;
  const code = `import { parseGapTimestamp as p } from ${JSON.stringify(moduleUrl)}; process.stdout.write(JSON.stringify(p(${JSON.stringify(raw)})));`;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
    env: { ...process.env, TZ: tz }
  });
  if (res.status !== 0) throw new Error(`child failed under TZ=${tz}: ${res.stderr}`);
  return JSON.parse(res.stdout);
}

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

  it('epoch values report timeHadOffset true (unambiguous, no assumption)', () => {
    expect(parseGapTimestamp('1706140800').timeHadOffset).toBe(true);
    expect(parseGapTimestamp('1706140800000').timeHadOffset).toBe(true);
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

  it('offset-less ISO timestamp parses as UTC, matching the Z-suffixed equivalent', () => {
    const offsetLess = parseGapTimestamp('2026-01-15T10:30:00');
    const withZ = parseGapTimestamp('2026-01-15T10:30:00Z');
    expect(offsetLess.timestamp).toBe(withZ.timestamp);
  });

  it('parsing is timezone-independent: identical results under TZ=UTC and TZ=Asia/Dhaka', () => {
    // Every branch that must be environment-independent — offset-less ISO (the
    // Phase 4.8 case), Z-suffixed, explicit offset, D/M/YYYY via Date.UTC, and
    // epochs — produces the same instant under two different forced timezones.
    const inputs = [
      '2026-01-15T10:30:00',
      '2026-01-15T10:30:00Z',
      '2026-01-15T10:30:00+05:30',
      '15/01/2026 10:30',
      '1706140800',
      '1706140800000'
    ];
    for (const input of inputs) {
      const utc = parseInTimezone('UTC', input);
      const dhaka = parseInTimezone('Asia/Dhaka', input);
      expect(utc.timeValid).toBe(true);
      expect(dhaka.timestamp).toBe(utc.timestamp);
    }
    // The child harness genuinely varies the timezone: a non-ISO value that is
    // documented to reach new Date() must differ between the two zones. This
    // guards against a test that appears to vary TZ but does not.
    const utcNonIso = parseInTimezone('UTC', 'Jan 1 2025 (test)');
    const dhakaNonIso = parseInTimezone('Asia/Dhaka', 'Jan 1 2025 (test)');
    expect(dhakaNonIso.timestamp).not.toBe(utcNonIso.timestamp);
  });

  it('non-ISO formats still parse via new Date() (not broken by UTC fix)', () => {
    const r = parseGapTimestamp('Jan 1 2025 (test)');
    expect(r.timeValid).toBe(true);
    // Non-ISO input reaches new Date(), which interprets it in the machine's local
    // timezone — so the instant is environment-dependent and must not be hardcoded.
    // Assert the property under test (that it still parses) and derive the expected
    // value from the environment exactly as the function does.
    expect(r.timestamp).toBe(new Date('Jan 1 2025 (test)').getTime());
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
