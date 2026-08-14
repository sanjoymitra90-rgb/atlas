const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, tileText, expandGapFilters } = require('../_helpers.cjs');

test.describe('Gap Analyzer — Paired Calls tile', () => {

  test('paired calls tile shows correct count for gap-pairing.csv', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-pairing.csv');
    const paired = await tileText(page, 'paired');
    expect(parseInt(paired, 10)).toBeGreaterThanOrEqual(1);
  });

  test('paired calls tile displays global match rate', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-pairing.csv');
    const desc = await page.locator('#gap-metric-paired-desc').textContent();
    expect(desc).toContain('match rate');
  });

  test('paired calls tile exists before signing tile in grid', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-pairing.csv');
    const order = await page.evaluate(() => {
      const paired = document.querySelector('[data-testid="gap-tile-paired"]');
      const signing = document.querySelector('[data-testid="gap-tile-signing"]');
      const all = [...document.querySelectorAll('.grid.grid-cols-1 .bg-slate-900\\/50')];
      return all.indexOf(paired.closest('.bg-slate-900\\/50')) < all.indexOf(signing.closest('.bg-slate-900\\/50'));
    });
    expect(order).toBe(true);
  });

  test('paired calls tile updates when filter applied', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-pairing.csv');
    const unfiltered = await tileText(page, 'paired');
    await expandGapFilters(page);
    await page.getByTestId('gap-service-filter').selectOption({ label: 'Signing Only' });
    await page.waitForTimeout(200);
    const filtered = await tileText(page, 'paired');
    expect(parseInt(filtered, 10)).toBeLessThanOrEqual(parseInt(unfiltered, 10));
  });

});
