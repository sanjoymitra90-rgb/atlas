// @ts-check
const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

test.describe('Phase 5A — Task B: toast must not cover the header Export button', () => {
  test('Export button is clickable while the toast is visible', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-invalid-reasons.csv');

    // The import toast fires in processGapData(), synchronously with the
    // export button being enabled. The toast has a 0.3s slide-in transition:
    // probing immediately measures a toast still sliding in from the right
    // edge of a 1440-wide viewport, where it does not yet overlap the button,
    // and the pointer-events assertion passes whether or not the property
    // exists. Wait on the real condition — the transition completing — by
    // polling for the finished transform (identity matrix). The 3s
    // auto-dismiss timer is still running after this wait.
    await page.waitForFunction(() => {
      const toast = document.getElementById('toast-msg');
      if (!toast || !toast.classList.contains('show')) return false;
      return getComputedStyle(toast).transform === 'matrix(1, 0, 0, 1, 0, 0)';
    });

    const whileToastVisible = await page.evaluate(() => {
      const toast = document.getElementById('toast-msg');
      const exportBtn = document.getElementById('gap-export-btn');
      const tr = toast.getBoundingClientRect();
      const r = exportBtn.getBoundingClientRect();
      const overlap =
        tr.left < r.right && tr.right > r.left &&
        tr.top < r.bottom && tr.bottom > r.top;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return {
        toastVisible: toast.classList.contains('show'),
        overlap,
        hitExport: hit === exportBtn || exportBtn.contains(hit)
      };
    });

    // The toast and the Export button must genuinely overlap at probe time.
    // Without this assertion the test can silently drift back to measuring a
    // moment when the two do not overlap, which is exactly the defect this
    // test was written to protect against.
    expect(whileToastVisible.toastVisible).toBe(true);
    expect(whileToastVisible.overlap).toBe(true);
    expect(whileToastVisible.hitExport).toBe(true);

    // Real click must open the export modal — not be swallowed by the toast.
    await page.getByTestId('gap-export-btn').click();
    await expect(page.locator('#gap-export-modal')).toBeVisible();
  });
});
