// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { openGapAnalyzer, uploadAndAnalyze, expandGapFilters } = require('../_helpers.cjs');

test.describe('Phase 5B — Task C: copy sweep', () => {
  test('F2: export breakdown uses reason labels and the Destination Issues vocabulary', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-invalid-reasons.csv');
    const download = page.waitForEvent('download');
    await page.evaluate(() => { window.gapExportAllData = true; window.exportGapData(); });
    const dl = await download;
    const content = fs.readFileSync(await dl.path(), 'utf8');
    expect(content).toContain('Destination issues breakdown:');
    expect(content).not.toContain('Invalid breakdown:');
    expect(content).toContain('Bad prefix \u00d71');
    expect(content).toContain('Not +44 \u00d71');
    expect(content).not.toMatch(/(empty|non-uk|not-plus-44|wrong-length|bad-prefix|identical-digits|sequential-run|other) \u00d7/);
  });

  test('F3: filtering everything out says to adjust the filters, not to upload', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await expandGapFilters(page);
    await page.fill('#gap-filter-from', 'ZZZZ-nomatch');
    await expect(page.locator('#gap-table-body')).toContainText('No records match the current filters. Adjust or clear the filters.');
    await page.fill('#gap-filter-from', '');
    await expect(page.locator('#gap-table-body')).not.toContainText('No records match');
    await expect(page.locator('#gap-table-body tr').first()).toBeVisible();
  });

  test('F3: exporting nothing says what to do next', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await expandGapFilters(page);
    await page.fill('#gap-filter-from', 'ZZZZ-nomatch');
    const toast = await page.evaluate(() => {
      window.exportGapData();
      return {
        show: document.getElementById('toast-msg').classList.contains('show'),
        text: document.getElementById('toast-msg').textContent
      };
    });
    expect(toast.show).toBe(true);
    expect(toast.text).toContain('Adjust or clear the filters');
  });

  test('F4: a clean import shows no toast', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-clean.csv');
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => {
      const toast = document.getElementById('toast-msg');
      return { show: toast.classList.contains('show'), text: toast.textContent };
    });
    expect(state.show).toBe(false);
  });
});
