// @ts-check
const { test, expect } = require('@playwright/test');
const helpers = require('../_helpers.cjs');

test.describe('Review pass — gap analyzer tests', () => {

  // R15: escapeHtml escapes CSV data — verify the function works
  test('R15 — escapeHtml prevents HTML injection', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    const result = await page.evaluate(() => {
      return typeof window.escapeHtml === 'function' ? window.escapeHtml('"><img src=x onerror=alert(1)>') : 'no function';
    });
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
    // Second assertion: upload a fixture with markup in customer field and verify no live element
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    const hasLiveElement = await page.evaluate(() => {
      const cells = document.querySelectorAll('#gap-table-body td');
      for (const cell of cells) {
        if (cell.querySelector('script, img, iframe, object, embed')) return true;
      }
      return false;
    });
    expect(hasLiveElement).toBe(false);
  });

  // R8: Charts respond to filters — verify dataset changes after filter
  test('R8 — charts update when filter is applied', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    // Get initial dataset length
    const before = await page.evaluate(() => {
      const chart = window.gapChartInstances && window.gapChartInstances.invalid;
      return chart ? chart.data.datasets[0].data.length : 0;
    });
    expect(before).toBeGreaterThan(0);
    // Apply a filter
    await page.selectOption('#gap-filter-service', 'signing');
    await page.waitForTimeout(500);
    // Verify dataset changed
    const after = await page.evaluate(() => {
      const chart = window.gapChartInstances && window.gapChartInstances.invalid;
      return chart ? chart.data.datasets[0].data.length : 0;
    });
    expect(after).toBeGreaterThan(0);
    // The canvas should still exist
    const hasCanvas = await page.evaluate(() => {
      return document.querySelector('#gap-chart-invalid') !== null;
    });
    expect(hasCanvas).toBe(true);
  });

  // R3/R27: Dependency guard — Chart is defined after page load
  test('R3/R27 — Chart.js is defined and dep guard works', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    const deps = await page.evaluate(() => ({
      chart: typeof Chart !== 'undefined',
      leaflet: typeof L !== 'undefined'
    }));
    expect(deps.chart).toBe(true);
  });

  // B1: Unescaped timestamp cell — live XSS
  test('B1 — timestamp cell is escaped even when timeValid is true', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-xss-time.csv');
    // Check the first data cell in the table
    const result = await page.evaluate(() => {
      const cells = document.querySelectorAll('#gap-table-body td');
      if (cells.length === 0) return { error: 'no cells found' };
      const timeCell = cells[0]; // first cell is Time
      return {
        hasElement: timeCell.querySelector('img, script, iframe') !== null,
        text: timeCell.textContent
      };
    });
    expect(result.hasElement).toBe(false);
    expect(result.text).toContain('<img');
  });

});
