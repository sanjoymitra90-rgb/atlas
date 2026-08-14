// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { APP_URL, openGapAnalyzer, uploadAndAnalyze, expandGapFilters } = require('../_helpers.cjs');

test.describe('Phase 5B — Task A: Customer → Service Provider', () => {
  test('table header and filter render Service Provider, not Customer', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const th = page.locator('th[onclick="handleGapSort(\'customer\')"]');
    await expect(th).toContainText('Service Provider');
    await expect(th).not.toContainText('Customer');
    await expandGapFilters(page);
    await expect(page.locator('#gap-filter-customer')).toBeVisible();
    await expect(page.locator('#gap-filter-customer option[value="all"]')).toHaveText('All Service Providers');
    await expect(page.locator('#gap-filter-panel').getByText('Service Provider', { exact: true })).toBeVisible();
  });

  test('filter still works by value after the rename', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await expandGapFilters(page);
    await page.selectOption('#gap-filter-customer', 'Acme Ltd');
    await page.waitForTimeout(300);
    const cells = await page.evaluate(() =>
      [...document.querySelectorAll('#gap-table-body tr')]
        .filter(tr => !tr.classList.contains('gap-pair-summary') && tr.querySelector('td'))
        .map(tr => tr.children[5] && tr.children[5].textContent.trim())
    );
    expect(cells.length).toBeGreaterThan(0);
    for (const c of cells) expect(c).toBe('Acme Ltd');
  });

  test('export header row carries Service Provider, not Customer', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const download = page.waitForEvent('download');
    await page.evaluate(() => { window.gapExportAllData = true; window.exportGapData(); });
    const dl = await download;
    const content = fs.readFileSync(await dl.path(), 'utf8');
    const lines = content.split('\n');
    const headerLine = lines.find(l => l.startsWith('"Time (UTC)"'));
    expect(headerLine).toBeDefined();
    expect(headerLine).toContain('Service Provider');
    expect(headerLine).not.toContain('Customer');
  });

  test('Onboarding still says customer where it means customers', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => showModule('onboarding'));
    await expect(page.locator('body')).toContainText('Customer Price');
    await expect(page.locator('#ob-customer-price')).toBeVisible();
  });
});
