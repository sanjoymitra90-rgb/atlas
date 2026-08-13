const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

test.describe('Gap Analyzer — Phase 4.9 Task A (invalid timestamps sink in group mode)', () => {
  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
  });

  test('grouped mode: sorting time ascending keeps amber invalid rows last', async ({ page }) => {
    await page.locator('.gap-switch-track').click();
    await expect(page.getByTestId('gap-group-toggle')).toBeChecked();
    // Default sort is time descending; one more click flips to ascending
    await page.locator('[data-testid="gap-table"] thead th', { hasText: 'Time (UTC)' }).click();

    const rows = await page.locator('[data-testid="gap-table"] tbody tr[data-pair-group]').evaluateAll(trs => {
      return trs.map(tr => {
        const timeCell = tr.querySelector('td:first-child');
        const isInvalid = !!timeCell && !!timeCell.querySelector('.fa-exclamation-triangle');
        return { isInvalid, text: (timeCell && timeCell.textContent || '').trim() };
      });
    });

    expect(rows.length).toBeGreaterThan(1);
    const invalidIdx = rows.map(r => r.isInvalid);
    const lastInvalid = invalidIdx.lastIndexOf(true);
    // At least one invalid row exists and it is the last row
    expect(lastInvalid).toBeGreaterThanOrEqual(0);
    expect(lastInvalid).toBe(rows.length - 1);
    // No valid row appears after the first invalid one in ascending order
    invalidIdx.forEach((isInv, i) => {
      if (isInv) {
        for (let j = i + 1; j < invalidIdx.length; j++) expect(invalidIdx[j]).toBe(true);
      }
    });
  });
});