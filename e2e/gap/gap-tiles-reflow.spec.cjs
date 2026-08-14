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

    const byX = new Map();
    for (const b of boxes) {
      byX.set(b.x, (byX.get(b.x) || 0) + 1);
    }
    const xCounts = [...byX.values()].sort((a, b) => a - b);

    expect(xCounts).toEqual([2, 2, 2]);

    for (const b of boxes) expect(b.w).toBeGreaterThan(400);
  });

  test('tile click drill-down still applies its filter', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.getByTestId('gap-tile-signing').click();
    await expect(page.getByTestId('gap-filtered-strip')).toBeVisible();
    await expect(page.getByTestId('gap-service-filter')).toHaveValue('signing');
  });
});