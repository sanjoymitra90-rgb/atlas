const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

test.describe('Phase 5A — Task F: table density', () => {
  test('denser rows fit the full page in one viewport without clipping markers', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-screenshots.csv');

    await page.getByTestId('gap-table').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const m = await page.evaluate(() => {
      const body = document.getElementById('gap-table-body');
      const rows = body.querySelectorAll('tr');
      if (!rows.length) return null;
      const rowH = rows[0].getBoundingClientRect().height;
      const pills = body.querySelectorAll('[data-pair-status]');
      const pillH = pills.length ? pills[0].getBoundingClientRect().height : 0;
      return {
        rowH: Math.round(rowH),
        total: rows.length,
        pillH: Math.round(pillH),
        overflow: body.scrollWidth > body.clientWidth
      };
    });

    expect(m).not.toBeNull();
    expect(m.rowH).toBeLessThan(45);
    expect(m.total).toBe(25);
    expect(m.rowH * m.total).toBeLessThanOrEqual(900);
    expect(m.pillH).toBeGreaterThan(18);
    expect(m.overflow).toBe(false);
  });

  test('amber invalid-timestamp marker remains visible and legible', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-invalid-only.csv');
    await page.getByTestId('gap-table').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const amber = page.locator('#gap-table-body .fa-exclamation-triangle').first();
    await expect(amber).toBeVisible();
    const box = await amber.boundingBox();
    expect(box.width).toBeGreaterThan(10);
    expect(box.height).toBeGreaterThan(10);
  });
});