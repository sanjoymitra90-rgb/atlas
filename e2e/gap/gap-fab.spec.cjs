// @ts-check
const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

test.describe('Phase 5A — Task C: no fixed element sits on the Call Pairing data', () => {
  test('no visible fixed element overlaps the Call Pairing blocks at default scroll (1440x900)', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-screenshots.csv');

    // The import toast is a transient overlay (bottom-left, 3s auto-hide).
    // Wait until it has actually left the viewport (class removal alone only
    // starts its 0.3s off-screen transition) before checking overlays.
    await expect(page.locator('#toast-msg')).not.toBeInViewport();

    const result = await page.evaluate(() => {
      function overlaps(a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      }
      const blockEls = Array.from(document.querySelectorAll('#gap-pair-panel .bg-slate-800\\/50')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const blocks = blockEls.map(el => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      const fixed = Array.from(document.querySelectorAll('*')).filter(el => {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') return false;
        if (el.classList.contains('hidden') || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        // Fully off-screen fixed elements (e.g. the closed help drawer,
        // translateX(100%)) cannot sit on visible data; skip them.
        if (r.right <= 0 || r.left >= window.innerWidth || r.bottom <= 0 || r.top >= window.innerHeight) return false;
        return true;
      });
      const offenders = [];
      for (const b of blocks) {
        for (const el of fixed) {
          const r = el.getBoundingClientRect();
          const rect = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
          if (overlaps(rect, b)) {
            offenders.push({ element: el.className || el.tagName, block: b });
          }
        }
      }
      return { blockCount: blocks.length, fixedCount: fixed.length, offenders };
    });

    expect(result.blockCount).toBeGreaterThanOrEqual(4);
    expect(result.offenders).toEqual([]);
  });
});
