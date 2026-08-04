const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, tileText } = require('./helpers');

test.describe('Gap Analyzer — Duplicate Detection', () => {

  test('duplicate signing detected', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_dup.csv');
    expect(await tileText(page, 'total')).toBe('5');
    expect(await tileText(page, 'signing')).toBe('3');
    expect(await tileText(page, 'verify')).toBe('2');
    const panel = page.getByTestId('gap-pair-panel');
    await expect(panel).toBeVisible();
    expect(await panel.getByTestId('gap-pair-duplicates').textContent()).toBe('1');
    expect(await panel.getByTestId('gap-pair-unverified').textContent()).toBe('0');
    expect(await panel.getByTestId('gap-pair-unsigned').textContent()).toBe('0');
    expect(await panel.getByTestId('gap-pair-unpairable').textContent()).toBe('0');
  });

  test('duplicate pill shown in table', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_dup.csv');
    const pill = page.locator('[data-pair-status="duplicate"]');
    await expect(pill).toHaveCount(1);
    await expect(pill).toHaveText('Duplicate');
  });

  test('pair status filter includes duplicate option', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_dup.csv');
    const select = page.getByTestId('gap-filter-pair');
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Duplicates');
  });

  test('drillDownPair shows duplicate rows', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_dup.csv');
    await page.evaluate(() => window.drillDownPair('duplicate'));
    const rows = page.locator('[data-testid="gap-table"] tbody tr');
    await expect(rows).toHaveCount(1);
  });

  test('export CSV includes duplicate in pairing summary', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_dup.csv');
    const download = page.waitForEvent('download');
    await page.evaluate(() => {
      window.gapExportAllData = true;
      window.exportGapData();
    });
    const dl = await download;
    const path = await dl.path();
    const content = require('fs').readFileSync(path, 'utf8');
    expect(content).toContain('1 duplicates');
  });

});
