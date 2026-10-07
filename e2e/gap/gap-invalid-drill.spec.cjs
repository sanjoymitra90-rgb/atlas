const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

// Fixture gap-invalid-drill.csv spans 2026-09-19 .. 2026-09-22 (auto → 1-day
// buckets). Days 19-21 contain only valid destinations; only Sep 22 has invalid
// numbers. The Invalid Numbers chart therefore renders a single sparse bar
// ("Sep 22") while the full bucket order starts at Sep 19 — clicking the bar
// must resolve to 2026-09-22, not the earlier bucket at full-array index 0.
test.describe('Gap Analyzer — Invalid Numbers chart drill-through', () => {

  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-invalid-drill.csv');
  });

  async function clickInvalidBar(page, idx) {
    await page.evaluate((i) => {
      const chart = window.gapChartInstances.invalid;
      window.makeChartClickHandler('invalid')(null, [{ index: i }], chart);
    }, idx);
  }

  test('chart renders only the Sep 22 bar under auto (1-day) interval', async ({ page }) => {
    const labels = await page.evaluate(() => window.gapChartInstances.invalid.data.labels);
    expect(labels).toEqual(['Sep 22']);
    await expect(page.getByTestId('gap-bucket-interval-invalid')).toHaveValue('auto');
  });

  test('clicking the Sep 22 bar filters the table to Sep 22, not Sep 19', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    expect(initialCount).toBe(10);
    await clickInvalidBar(page, 0);
    await expect(page.getByTestId('gap-bucket-chip')).toBeVisible();
    await expect(page.getByTestId('gap-bucket-chip')).toContainText('Sep 22');
    const rows = await page.locator('#gap-table-body tr').count();
    expect(rows).toBe(4);
    const firstCells = await page.locator('#gap-table-body tr td:first-child').allInnerTexts();
    expect(firstCells.length).toBe(4);
    for (const text of firstCells) {
      expect(text).toContain('2026-09-22');
    }
  });

  test('clearing the bucket chip restores all rows', async ({ page }) => {
    await clickInvalidBar(page, 0);
    await expect(page.getByTestId('gap-bucket-chip')).toBeVisible();
    await page.getByTestId('gap-bucket-chip').locator('button').click();
    await expect(page.getByTestId('gap-bucket-chip')).toBeHidden();
    const rows = await page.locator('#gap-table-body tr').count();
    expect(rows).toBe(10);
  });

  test('per-chart interval dropdown path: re-rendered chart still maps click to Sep 22', async ({ page }) => {
    await page.getByTestId('gap-bucket-interval-invalid').selectOption('1day');
    await page.waitForTimeout(200);
    const labels = await page.evaluate(() => window.gapChartInstances.invalid.data.labels);
    expect(labels).toEqual(['Sep 22']);
    await clickInvalidBar(page, 0);
    await expect(page.getByTestId('gap-bucket-chip')).toContainText('Sep 22');
    const rows = await page.locator('#gap-table-body tr').count();
    expect(rows).toBe(4);
    const firstCells = await page.locator('#gap-table-body tr td:first-child').allInnerTexts();
    for (const text of firstCells) {
      expect(text).toContain('2026-09-22');
    }
  });

  test('bucket filter uses the source chart interval (1-day keys)', async ({ page }) => {
    await clickInvalidBar(page, 0);
    const onlyBucketMatch = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#gap-table-body tr'));
      return rows.length > 0 && rows.every(r => r.cells[0].textContent.includes('2026-09-22'));
    });
    expect(onlyBucketMatch).toBe(true);
  });
});
