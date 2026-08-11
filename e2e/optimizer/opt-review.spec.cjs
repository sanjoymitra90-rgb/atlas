// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { APP_URL } = require('../app-url.cjs');
const session34 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'fixtures', 'opt-session-34.json'), 'utf8'));

async function loadApp(page) {
  await page.goto(APP_URL);
  await page.waitForFunction(() => typeof window.computeCoverage === 'function');
}

test.describe('Review pass — optimizer tests', () => {

  // R5: Physics invariant — no matrix entry below light-in-fibre floor
  test('R5 — physics invariant: no matrix entry below distance × 0.01ms', async ({ page }) => {
    await loadApp(page);
    const result = await page.evaluate(() => {
      const regions = window._regions;
      const matrix = window._matrix;
      if (!regions || !matrix) return { error: 'regions or matrix not available', violations: [] };
      const violations = [];
      for (let i = 0; i < regions.length; i++) {
        for (let j = 0; j < regions.length; j++) {
          if (i === j) continue;
          const a = regions[i], b = regions[j];
          const R = 6371, toRad = x => x * Math.PI / 180;
          const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
          const aa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
          const floor = R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa)) * 0.01;
          if (matrix[i][j] < floor) {
            violations.push({ i, j, code: a.code + '→' + b.code, value: matrix[i][j], floor: Math.round(floor) });
          }
        }
      }
      return { regionCount: regions.length, violations };
    });
    expect(result.regionCount).toBeGreaterThan(0);
    expect(result.violations).toEqual([]);
  });

  // R13: Import with out-of-range region index drops it with toast
  test('R13 — import with out-of-range region index drops it', async ({ page }) => {
    await loadApp(page);
    // Craft a session with an out-of-range footprint entry
    const N = await page.evaluate(() => window._regions ? window._regions.length : 32);
    const badSession = {
      ...session34,
      selectedFootprint: [0, N + 5, 1] // N+5 is out of range
    };
    // Listen for toast
    const toastPromise = page.waitForEvent('console', {
      predicate: msg => msg.text().includes('dropped')
    }).catch(() => null);
    // Trigger import via file input
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles({
      name: 'test-session.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(badSession))
    });
    await page.waitForTimeout(1000);
    // Check that the footprint was filtered (only valid indices remain)
    const fp = await page.evaluate(() => window._selectedFootprint);
    expect(fp).toContain(0);
    expect(fp).toContain(1);
    expect(fp).not.toContain(N + 5);
  });

  // R4/R5 combined: region labels are correct (ap-southeast-5 is Kuala Lumpur)
  test('R4 — ap-southeast-5 is Kuala Lumpur, not Auckland', async ({ page }) => {
    await loadApp(page);
    const region = await page.evaluate(() => {
      const r = window._regions.find(r => r.code === 'ap-southeast-5');
      return r ? { name: r.name, lat: r.lat, lng: r.lng } : null;
    });
    expect(region).not.toBeNull();
    expect(region.name).toBe('Kuala Lumpur');
    expect(region.lat).toBeCloseTo(3.139, 1);
  });

});
