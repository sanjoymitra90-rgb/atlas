// @ts-check
const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, expandGapFilters } = require('../_helpers.cjs');

test.describe('Phase 5B — Task B: Status response-code tooltip', () => {
  test('the Status table header explains what the values are', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const th = page.locator('th[onclick="handleGapSort(\'status\')"]');
    await expect(th.locator('.fa-info-circle[title="service provider response code"]')).toHaveCount(1);
  });

  test('the filter-bar Status Code label carries the same tooltip', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await expandGapFilters(page);
    await expect(page.locator('#gap-filter-panel .fa-info-circle[title="service provider response code"]')).toHaveCount(1);
  });

  test('the column-header filter dropdown label does not carry the icon', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await expect(page.locator('#col-dd-status label .fa-info-circle')).toHaveCount(0);
  });
});