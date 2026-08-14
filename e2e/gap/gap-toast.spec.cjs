// @ts-check
const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

test.describe('Phase 5A — Task B: toast must not cover the header Export button', () => {
  test('Export button is clickable while the toast is visible', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-screenshots.csv');

    // The import toast fires in processGapData(), synchronously with the
    // export button being enabled. Capture the state quickly, while the
    // 3s timer is still running.
    const whileToastVisible = await page.evaluate(() => {
      const toast = document.getElementById('toast-msg');
      const exportBtn = document.getElementById('gap-export-btn');
      const r = exportBtn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return {
        toastVisible: toast.classList.contains('show'),
        hitExport: hit === exportBtn || exportBtn.contains(hit)
      };
    });

    expect(whileToastVisible.toastVisible).toBe(true);
    expect(whileToastVisible.hitExport).toBe(true);

    // Real click must open the export modal — not be swallowed by the toast.
    await page.getByTestId('gap-export-btn').click();
    await expect(page.locator('#gap-export-modal')).toBeVisible();
  });
});
