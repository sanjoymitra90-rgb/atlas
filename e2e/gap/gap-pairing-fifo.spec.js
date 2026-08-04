const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('./helpers');

test.describe('Gap Analyzer — Phase 3 (event pairing)', () => {

  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-pairing.csv');
  });

  test('pairing summary at default 1000ms window', async ({ page }) => {
    await expect(page.getByTestId('gap-pair-matchrate')).toContainText('37.5');
    await expect(page.getByTestId('gap-pair-unverified')).toHaveText('2');
    await expect(page.getByTestId('gap-pair-unsigned')).toHaveText('2');
    await expect(page.getByTestId('gap-pair-duplicates')).toHaveText('1');
    await expect(page.getByTestId('gap-pair-unpairable')).toHaveText('1');
    await expect(page.getByTestId('gap-pair-ttv')).toContainText('600');
  });

  test('correlation line crosses pairing with UK validity', async ({ page }) => {
    const corr = page.getByTestId('gap-pair-correlation');
    await expect(corr).toContainText('Of 2 signed-but-not-verified, 1 had an invalid destination');
    await expect(corr).toContainText('of 3 pairs, 1 had an invalid destination');
  });

  test('pair status pills: 6 paired, 2 unverified, 2 unsigned, 1 duplicate, 1 unpairable', async ({ page }) => {
    await expect(page.locator('[data-pair-status="paired"]')).toHaveCount(6);
    await expect(page.locator('[data-pair-status="unverified"]')).toHaveCount(2);
    await expect(page.locator('[data-pair-status="unsigned"]')).toHaveCount(2);
    await expect(page.locator('[data-pair-status="duplicate"]')).toHaveCount(1);
    await expect(page.locator('[data-pair-status="unpairable"]')).toHaveCount(1);
  });

  test('retry is first-in-wins: one duplicate, two paired among the three retry rows', async ({ page }) => {
    const retryRows = page.locator('[data-testid="gap-table"] tbody tr', { hasText: '447911000105' });
    await expect(retryRows.locator('[data-pair-status="duplicate"]')).toHaveCount(1);
    await expect(retryRows.locator('[data-pair-status="paired"]')).toHaveCount(2);
  });

  test('widening window to 2000ms pairs the near-miss', async ({ page }) => {
    await page.getByTestId('gap-settings-btn').click();
    const input = page.getByTestId('gap-pair-window-input');
    await input.fill('2000');
    await input.dispatchEvent('change');
    await expect(page.getByTestId('gap-pair-matchrate')).toContainText('57.1');
    await expect(page.getByTestId('gap-pair-unverified')).toHaveText('1');
    await expect(page.getByTestId('gap-pair-unsigned')).toHaveText('1');
    await expect(page.getByTestId('gap-pair-ttv')).toContainText('800');
  });

  test('clicking signed-but-not-verified filters the table to those 2 rows', async ({ page }) => {
    await page.getByTestId('gap-pair-unverified').click();
    const rows = page.locator('[data-testid="gap-table"] tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.locator('[data-pair-status="unverified"]')).toHaveCount(2);
  });

});
