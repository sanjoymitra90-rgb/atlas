const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, tileText } = require('./helpers');

test.describe('Gap Analyzer', () => {

  test('P2.5 — privacy message shown before any upload', async ({ page }) => {
    await openGapAnalyzer(page);
    await expect(page.getByTestId('gap-privacy-note')).toBeVisible();
    await expect(page.getByTestId('gap-privacy-note')).toContainText('never sent');
  });

  test('core tiles after uploading test_gap_phase2a.csv', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    expect(await tileText(page, 'total')).toBe('11');
    expect(await tileText(page, 'signing')).toBe('5');
    expect(await tileText(page, 'verify')).toBe('6');
    expect(await tileText(page, 'gap')).toContain('1');
    expect(await tileText(page, 'invalid')).toBe('6');
    expect(await tileText(page, 'slow')).toBe('1');
  });

  test('P2.4 — filtered-view strip shows global counts', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    await page.getByTestId('gap-service-filter').selectOption({ label: 'Signing Only' });
    await expect(page.getByTestId('gap-filtered-strip')).toBeVisible();
    await expect(page.getByTestId('gap-filtered-strip')).toContainText('5 of 11');
    expect(await tileText(page, 'total')).toBe('5');
  });

  test('P2.6 + Settings regression — threshold change updates Slow tile', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    await page.getByTestId('gap-settings-btn').click();
    await expect(page.getByTestId('gap-settings-modal')).toBeVisible();
    await page.getByTestId('gap-threshold-input').fill('50');
    await page.getByTestId('gap-threshold-input').dispatchEvent('change');
    expect(await tileText(page, 'slow')).toBe('7'); // 51>50 counts
  });

  test('P2.3 — bucket drill-through filters the table', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    await page.evaluate(() => window.toggleGapBucket('2026-08-01T10'));
    await expect(page.getByTestId('gap-bucket-chip')).toBeVisible();
    const rows = page.locator('[data-testid="gap-table"] tbody tr');
    await expect(rows).toHaveCount(4);
  });

});
