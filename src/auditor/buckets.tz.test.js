import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';

// Timezone-independence tests for buckets.js, mirroring the child-process harness
// already used by src/auditor/time.test.js. Each case runs the module under a forced
// TZ and compares results, so the suite genuinely evaluates both zones regardless of
// the machine that happens to run it. getGapBucketKey() and formatBucketLabel() must
// stay UTC-based; a regressed getHours()/getMonth() change would only be caught here
// (and under TZ=Asia/Dhaka), never under a plain TZ=UTC run.

function bucketsInTimezone(tz, expr) {
  const moduleUrl = new URL('./buckets.js', import.meta.url).href;
  const code = `import * as b from ${JSON.stringify(moduleUrl)}; process.stdout.write(JSON.stringify(${expr}));`;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
    env: { ...process.env, TZ: tz }
  });
  if (res.status !== 0) throw new Error(`child failed under TZ=${tz}: ${res.stderr}`);
  return JSON.parse(res.stdout);
}

function bucketKeyInTimezone(tz, ts, interval) {
  return bucketsInTimezone(tz, `b.getGapBucketKey(${ts}, ${JSON.stringify(interval)})`);
}

function bucketLabelInTimezone(tz, key, interval) {
  return bucketsInTimezone(tz, `b.formatBucketLabel(${JSON.stringify(key)}, ${JSON.stringify(interval)})`);
}

// A 18:30Z instant: UTC keeps it on 2024-01-15, but Asia/Dhaka (+06:00) pushes it to
// 00:30 on 2024-01-16. If any bucket code used local-time methods, the day/hour keys
// and labels would diverge between the zones — the exact class of bug Phase 4.8 fixed
// in time.js and this file guards in buckets.js.
const MIDNIGHT_CROSSING = new Date('2024-01-15T18:30:00Z').getTime();

describe('getGapBucketKey timezone-independence', () => {
  const inputs = {
    '1min': [MIDNIGHT_CROSSING, new Date('2024-01-15T10:30:45Z').getTime()],
    '5min': [MIDNIGHT_CROSSING, new Date('2024-01-15T10:33:00Z').getTime()],
    '1hour': [MIDNIGHT_CROSSING, new Date('2024-01-15T10:30:00Z').getTime()],
    '1day': [MIDNIGHT_CROSSING, new Date('2024-01-15T10:30:00Z').getTime()]
  };

  for (const [interval, timestamps] of Object.entries(inputs)) {
    it(`produces identical bucket keys under UTC and Asia/Dhaka (${interval})`, () => {
      for (const ts of timestamps) {
        const utc = bucketKeyInTimezone('UTC', ts, interval);
        const dhaka = bucketKeyInTimezone('Asia/Dhaka', ts, interval);
        expect(utc).toBe(dhaka);
        expect(utc).not.toBeNull();
      }
    });
  }
});

describe('formatBucketLabel timezone-independence', () => {
  const cases = {
    '1day': ['2024-01-15', '2024-01-16'],
    '1hour': ['2024-01-15T18', '2024-01-15T10', '2024-01-16T00'],
    '5min': ['2024-01-15T18:30', '2024-01-15T10:30'],
    '1min': ['2024-01-15T18:30', '2024-01-15T14:05']
  };

  for (const [interval, keys] of Object.entries(cases)) {
    it(`produces identical labels under UTC and Asia/Dhaka (${interval})`, () => {
      for (const key of keys) {
        const utc = bucketLabelInTimezone('UTC', key, interval);
        const dhaka = bucketLabelInTimezone('Asia/Dhaka', key, interval);
        expect(utc).toBe(dhaka);
      }
    });
  }
});

it('self-verifies: the harness genuinely varies the timezone', () => {
  // A local-time read of an 18:30Z instant is 18:00 in UTC but 00:00 the next day in
  // Asia/Dhaka. If the harness stopped actually changing TZ, these two would become
  // equal and this assertion goes red instead of passing vacuously.
  const utcHour = bucketsInTimezone('UTC', `new Date(${MIDNIGHT_CROSSING}).getHours()`);
  const dhakaHour = bucketsInTimezone('Asia/Dhaka', `new Date(${MIDNIGHT_CROSSING}).getHours()`);
  expect(utcHour).not.toBe(dhakaHour);
  expect(dhakaHour).toBe(0);
});