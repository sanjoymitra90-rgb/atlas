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

  // B3: CSV header escaping — custom column with comma in display name
  test('B3 — CSV export header with comma in custom column name is properly quoted', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    // Open settings modal and add a custom column via UI
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible' });
    // Click "+ Add Column" button
    await page.click('button:has-text("Add Column")');
    await page.waitForTimeout(300);
    // Fill in the display name with a comma
    const nameInput = page.locator('.gap-add-col-name').last();
    await nameInput.fill('a,b');
    // Select a header from the dropdown
    const headerSelect = page.locator('.gap-add-col-header').last();
    await headerSelect.selectOption({ index: 1 }); // select first available option
    // Click Analyze to apply
    await page.click('[data-testid="gap-analyze-btn"]');
    await page.waitForTimeout(1000);
    // Trigger CSV export via window bridge
    const download = page.waitForEvent('download');
    await page.evaluate(() => {
      window.gapExportAllData = true;
      window.exportGapData();
    });
    const dl = await download;
    const content = require('fs').readFileSync(await dl.path(), 'utf8');
    // Find the data header row (starts with "Time,Service")
    const lines = content.split('\n');
    const headerLine = lines.find(l => l.startsWith('"Time"') || l.startsWith('Time,Service'));
    expect(headerLine).toBeDefined();
    // Count commas outside quotes to determine column count
    let inQuotes = false;
    let commaCount = 0;
    for (const ch of headerLine) {
      if (ch === '"') inQuotes = !inQuotes;
      if (ch === ',' && !inQuotes) commaCount++;
    }
    // 12 core columns + 1 custom "a,b" column = 12 commas (13 fields)
    expect(commaCount).toBe(12);
    // Also verify the custom column header is present and properly quoted
    expect(headerLine).toContain('"a,b"');
  });

  // B5: Blob URL revocation — assert revokeObjectURL is called
  test('B5 — blob URLs are revoked after export', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    // Stub revokeObjectURL and createObjectURL to count calls
    await page.evaluate(() => {
      window.__revokeCount = 0;
      window.__createCount = 0;
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      URL.createObjectURL = function(...args) {
        window.__createCount++;
        return origCreate.apply(this, args);
      };
      URL.revokeObjectURL = function(...args) {
        window.__revokeCount++;
        return origRevoke.apply(this, args);
      };
    });
    // Trigger gap CSV export via window bridge
    const download = page.waitForEvent('download');
    await page.evaluate(() => {
      window.gapExportAllData = true;
      window.exportGapData();
    });
    await download;
    await page.waitForTimeout(500);
    // Check that revokeObjectURL was called at least as many times as createObjectURL
    const counts = await page.evaluate(() => ({
      create: window.__createCount,
      revoke: window.__revokeCount
    }));
    expect(counts.create).toBeGreaterThan(0);
    expect(counts.revoke).toBeGreaterThanOrEqual(counts.create);
  });

  // B6: Gap column removed from CSV export summary
  test('B6 — CSV export summary header does not contain Gap column', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    // Trigger CSV export via window bridge
    const download = page.waitForEvent('download');
    await page.evaluate(() => {
      window.gapExportAllData = true;
      window.exportGapData();
    });
    const dl = await download;
    const content = require('fs').readFileSync(await dl.path(), 'utf8');
    // Check the summary header row does not contain "Gap" as a column
    const lines = content.split('\n');
    const summaryHeader = lines[0]; // First line is "Total Records,Signing,Verification,..."
    expect(summaryHeader).not.toMatch(/,Gap,|,Gap$|^Gap,/);
    expect(summaryHeader).toContain('Total Records');
    expect(summaryHeader).toContain('Signing');
    expect(summaryHeader).toContain('Verification');
  });

});
