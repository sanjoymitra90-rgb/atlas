// @ts-check
const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

test.describe('Phase 5A — Task D: collapsible filter panel', () => {
  test('collapsed by default after upload; toggle expands and survives a filter change', async ({ page }) => {
    await openGapAnalyzer(page);
    // Pre-upload the panel is expanded (the dashboard itself is hidden, so
    // check state rather than visibility).
    await expect(page.getByTestId('gap-filter-toggle')).toHaveAttribute('aria-expanded', 'true');
    const gridStyle = await page.getByTestId('gap-filter-grid').getAttribute('style');
    expect(gridStyle || '').not.toContain('display: none');

    await uploadAndAnalyze(page, 'gap-screenshots.csv');
    await expect(page.getByTestId('gap-filter-grid')).not.toBeVisible();
    await expect(page.getByTestId('gap-filter-toggle')).toHaveAttribute('aria-expanded', 'false');

    await page.getByTestId('gap-filter-toggle').click();
    await expect(page.getByTestId('gap-filter-grid')).toBeVisible();
    await expect(page.getByTestId('gap-filter-toggle')).toHaveAttribute('aria-expanded', 'true');

    await page.getByTestId('gap-service-filter').selectOption('signing');
    await expect(page.getByTestId('gap-filter-grid')).toBeVisible();
  });

  test('active-filter count is correct for zero, one and several filters, and returns to zero after reset', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-screenshots.csv');

    const count = async () => (await page.getByTestId('gap-filter-count').textContent()).trim();

    await expect.poll(count).toBe('0 active');

    await page.getByTestId('gap-filter-toggle').click();
    await page.getByTestId('gap-service-filter').selectOption('signing');
    await expect.poll(count).toBe('1 active');

    await page.locator('#gap-filter-from').fill('4479');
    await expect.poll(count).toBe('2 active');

    await page.locator('#gap-filter-validation').selectOption('invalid');
    await expect.poll(count).toBe('3 active');

    await page.getByTestId('gap-reset-btn').click();
    await expect.poll(count).toBe('0 active');
  });

  test('collapsing does not change gapFilteredData — a fold is presentation, never data', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-screenshots.csv');

    // Expand the collapsed panel before interacting with its controls.
    await page.getByTestId('gap-filter-toggle').click();
    await expect(page.getByTestId('gap-filter-grid')).toBeVisible();

    const snapshot = async () => page.evaluate(() => {
      return { len: gapFilteredData.length, firstTime: gapFilteredData[0] ? gapFilteredData[0].time : null };
    });

    await page.getByTestId('gap-service-filter').selectOption('signing');
    const beforeCollapse = await snapshot();

    await page.getByTestId('gap-filter-toggle').click();
    const collapsed = await snapshot();

    await page.getByTestId('gap-filter-toggle').click();
    const reexpanded = await snapshot();

    expect(collapsed).toEqual(beforeCollapse);
    expect(reexpanded).toEqual(beforeCollapse);
  });
});