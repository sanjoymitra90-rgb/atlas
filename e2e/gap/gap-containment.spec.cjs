const { test, expect } = require('@playwright/test');
const { APP_URL, openGapAnalyzer } = require('../_helpers.cjs');

test.describe('Phase 5A — containment: gap layout stays inside #gap-dashboard', () => {
  test('every dashboard section is a descendant of #gap-dashboard in the built HTML', async ({ page }) => {
    await page.goto(APP_URL);
    const result = await page.evaluate(() => {
      function isDescendant(descendantId, ancestorId) {
        const el = document.getElementById(descendantId);
        if (!el) return { found: false, contained: false };
        return { found: true, contained: !!el.closest('#' + ancestorId) };
      }
      function isDescendantOfQuery(child, ancestorId) {
        const el = document.querySelector(child);
        if (!el) return { found: false, contained: false };
        return { found: true, contained: !!el.closest('#' + ancestorId) };
      }
      const tableWrapper = document.querySelector('[data-testid="gap-table"]');
      return {
        tableBody: isDescendant('gap-table-body', 'gap-dashboard'),
        tableWrapper: tableWrapper
          ? { found: true, contained: !!tableWrapper.closest('#gap-dashboard') }
          : { found: false, contained: false },
        metricTileGrid: isDescendantOfQuery('[data-testid="gap-tile-total"]', 'gap-dashboard'),
        reasonPanel: isDescendant('gap-invalid-reason-panel', 'gap-dashboard'),
        chartsGrid: isDescendantOfQuery('[data-testid="gap-charts-grid"]', 'gap-dashboard')
      };
    });
    expect(result.tableBody.found).toBe(true);
    expect(result.tableBody.contained).toBe(true);
    expect(result.tableWrapper.found).toBe(true);
    expect(result.tableWrapper.contained).toBe(true);
    expect(result.metricTileGrid.found).toBe(true);
    expect(result.metricTileGrid.contained).toBe(true);
    expect(result.reasonPanel.found).toBe(true);
    expect(result.reasonPanel.contained).toBe(true);
    expect(result.chartsGrid.found).toBe(true);
    expect(result.chartsGrid.contained).toBe(true);
  });

  test('no table is visible before a file is uploaded', async ({ page }) => {
    await openGapAnalyzer(page);
    await expect(page.locator('#gap-table-body')).not.toBeVisible();
    await expect(page.locator('[data-testid="gap-table"]')).not.toBeVisible();
  });
});
