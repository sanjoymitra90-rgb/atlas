const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, tileText, APP_URL } = require('../_helpers.cjs');

test.describe('Gap Analyzer', () => {

  test('P2.5 — privacy message shown before any upload', async ({ page }) => {
    await openGapAnalyzer(page);
    await expect(page.getByTestId('gap-privacy-note')).toBeVisible();
    await expect(page.getByTestId('gap-privacy-note')).toContainText('never sent');
  });

  test('data table is not visible before any CSV is uploaded', async ({ page }) => {
    await openGapAnalyzer(page);
    const table = page.locator('#gap-table-body');
    await expect(table).not.toBeVisible();
    const panel = page.locator('#gap-invalid-reason-panel');
    await expect(panel).not.toBeVisible();
  });

  test('core tiles after uploading gap-core.csv', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    expect(await tileText(page, 'total')).toBe('11');
    expect(await tileText(page, 'paired')).toBe('0');
    expect(await tileText(page, 'signing')).toBe('5');
    expect(await tileText(page, 'verify')).toBe('6');
    expect(await tileText(page, 'invalid')).toBe('6');
    expect(await tileText(page, 'slow')).toBe('1');
  });

  test('six metric tiles exist in correct 4+2 grid order', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const tileOrder = await page.evaluate(() => {
      const ids = [
        'gap-tile-total', 'gap-tile-paired', 'gap-tile-signing', 'gap-tile-verify',
        'gap-tile-invalid', 'gap-tile-slow'
      ];
      return ids.map(id => {
        const el = document.querySelector('[data-testid="' + id + '"]');
        return el ? el.closest('.bg-slate-900\\/50')?.querySelector('.text-xs.text-slate-400')?.textContent.trim() : null;
      });
    });
    expect(tileOrder).toEqual([
      'Total Records', 'Paired Calls', 'Signing Requests', 'Verification Requests',
      'Destination Issues', 'Slow Requests (>100ms)'
    ]);
  });

  test('P2.4 — filtered-view strip shows global counts', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.getByTestId('gap-service-filter').selectOption({ label: 'Signing Only' });
    await expect(page.getByTestId('gap-filtered-strip')).toBeVisible();
    await expect(page.getByTestId('gap-filtered-strip')).toContainText('5 of 11');
    expect(await tileText(page, 'total')).toBe('5');
  });

  test('P2.6 + Settings regression — threshold change updates Slow tile', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.getByTestId('gap-settings-btn').click();
    await expect(page.getByTestId('gap-settings-modal')).toBeVisible();
    await page.getByTestId('gap-threshold-input').fill('50');
    await page.getByTestId('gap-threshold-input').dispatchEvent('change');
    expect(await tileText(page, 'slow')).toBe('7'); // 51>50 counts
  });

  test('P2.3 — bucket drill-through filters the table', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.evaluate(() => window.toggleGapBucket('2026-08-01T11'));
    await expect(page.getByTestId('gap-bucket-chip')).toBeVisible();
    const rows = page.locator('[data-testid="gap-table"] tbody tr');
    await expect(rows).toHaveCount(4);
  });

  test('module display name is Call Auditor — gateway, header, help tab', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.locator('.gateway-card h2', { hasText: 'Call Auditor' })).toBeVisible();
    await expect(page.locator('.gateway-card p', { hasText: 'Reconcile signing vs verification' })).toBeVisible();
    await page.getByTestId('gap-launch').click();
    await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
    await expect(page.locator('.gap-heading')).toHaveText('Call Auditor');
    await page.locator('.help-fab').click();
    await expect(page.locator('#help-tab-gap')).toHaveText('Call Auditor');
    await page.locator('#help-tab-gap').click();
    await expect(page.locator('#gap-intro h3')).toContainText('Call Auditor');
    const noOldName = await page.locator('#help-content-gap').textContent();
    expect(noOldName).not.toContain('Gap Analyzer');
  });

});
