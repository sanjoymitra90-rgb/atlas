const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

const TILE_IDS = [
  'gap-tile-total', 'gap-tile-paired', 'gap-tile-signing', 'gap-tile-verify',
  'gap-tile-invalid', 'gap-tile-slow'
];

test.describe('Phase 5A — Task E: metric tile grid reflow', () => {
  test('six tiles render as two full rows of three (no half-empty row)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');

    const boxes = await page.evaluate((ids) => {
      return ids.map(id => {
        const el = document.querySelector('[data-testid="' + id + '"]');
        if (!el) return { id, missing: true };
        const r = el.closest('.bg-slate-900\\/50').getBoundingClientRect();
        return { id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
      });
    }, TILE_IDS);

    expect(boxes.every(b => !b.missing)).toBe(true);

    const byY = new Map();
    for (const b of boxes) {
      const key = b.y;
      byY.set(key, (byY.get(key) || 0) + 1);
    }
    const counts = [...byY.values()].sort((a, b) => b - a);

    expect(counts).toEqual([3, 3]);

    const row1 = boxes.filter(b => b.y === Math.min(...boxes.map(x => x.y)));
    const row2 = boxes.filter(b => b.y === Math.max(...boxes.map(x => x.y)));
    expect(row1.length).toBe(3);
    expect(row2.length).toBe(3);

    for (const b of row1) expect(b.w).toBeGreaterThan(400);
    for (const b of row2) expect(b.w).toBeGreaterThan(400);

    const xs1 = row1.map(b => b.x).sort((a, b) => a - b);
    const xs2 = row2.map(b => b.x).sort((a, b) => a - b);
    expect(xs1).toEqual(xs2);
  });

  test('tile click drill-down still applies its filter', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.getByTestId('gap-tile-signing').click();
    await expect(page.getByTestId('gap-filtered-strip')).toBeVisible();
    await expect(page.getByTestId('gap-service-filter')).toHaveValue('signing');
  });
});