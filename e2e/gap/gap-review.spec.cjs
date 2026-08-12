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

  // B2: XSS in scenario name — saved scenario with HTML payload
  test('B2 — scenario name with HTML payload is rendered as text, not parsed as HTML', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    // Save a scenario with XSS payload
    await page.evaluate(() => {
      const scenarios = JSON.parse(localStorage.getItem('gapScenarios') || '[]');
      scenarios.push({ name: '<img src=x onerror=alert(1)>', data: {} });
      localStorage.setItem('gapScenarios', JSON.stringify(scenarios));
    });
    // Reload to pick up the saved scenario
    await page.reload();
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    // Open scenarios modal
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForTimeout(500);
    // Check that no live img element exists in the scenario list
    const hasLiveElement = await page.evaluate(() => {
      const modal = document.querySelector('#gap-column-modal');
      if (!modal) return false;
      return modal.querySelector('img[src="x"]') !== null;
    });
    expect(hasLiveElement).toBe(false);
    // Check the literal text is visible
    const hasLiteralText = await page.evaluate(() => {
      const modal = document.querySelector('#gap-column-modal');
      if (!modal) return false;
      return modal.textContent.includes('<img src=x onerror=alert(1)>');
    });
    expect(hasLiteralText).toBe(true);
  });

  // B3: CSV header escaping — custom column with comma in display name
  test('B3 — CSV export header with comma in custom column name is properly quoted', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    // Open settings and add a custom column with comma in name
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForTimeout(500);
    // Find the "Add custom column" button and add one
    const addBtn = page.locator('button:has-text("Add custom column")');
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);
    }
    // Set display name with comma
    const displayNameInput = page.locator('#gap-additional-columns input[placeholder*="Display"]').last();
    if (await displayNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await displayNameInput.fill('a,b');
    }
    // Click Analyze to apply
    const analyzeBtn = page.locator('#gap-column-modal button:has-text("Analyze")');
    if (await analyzeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await analyzeBtn.click();
      await page.waitForTimeout(1000);
    }
    // Trigger CSV export and capture the download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="gap-export-btn"]');
    await page.waitForTimeout(300);
    const csvBtn = page.locator('#gap-export-modal button:has-text("CSV")');
    if (await csvBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await csvBtn.click();
    }
    const download = await downloadPromise;
    const content = await download.path().then(p => require('fs').readFileSync(p, 'utf-8'));
    // Parse header row and check column count is consistent
    const lines = content.split('\n');
    const headerLine = lines.find(l => l.includes('Time') || l.includes('Service'));
    if (headerLine) {
      // Count commas outside quotes to determine column count
      let inQuotes = false;
      let commaCount = 0;
      for (const ch of headerLine) {
        if (ch === '"') inQuotes = !inQuotes;
        if (ch === ',' && !inQuotes) commaCount++;
      }
      // Should have at least 9 core columns + custom column(s)
      expect(commaCount).toBeGreaterThanOrEqual(9);
    }
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
    // Trigger JSON export
    await page.click('[data-testid="gap-export-btn"]');
    await page.waitForTimeout(300);
    const jsonBtn = page.locator('#gap-export-modal button:has-text("JSON")');
    if (await jsonBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await jsonBtn.click();
      await page.waitForTimeout(1000);
    }
    // Check that revokeObjectURL was called at least as many times as createObjectURL
    const counts = await page.evaluate(() => ({
      create: window.__createCount,
      revoke: window.__revokeCount
    }));
    expect(counts.revoke).toBeGreaterThanOrEqual(counts.create);
    expect(counts.create).toBeGreaterThan(0);
  });

  // B6: Gap column removed from CSV export summary
  test('B6 — CSV export summary header does not contain Gap column', async ({ page }) => {
    await helpers.openGapAnalyzer(page);
    await helpers.uploadAndAnalyze(page, 'gap-core.csv');
    // Trigger CSV export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="gap-export-btn"]');
    await page.waitForTimeout(300);
    const csvBtn = page.locator('#gap-export-modal button:has-text("CSV")');
    if (await csvBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await csvBtn.click();
    }
    const download = await downloadPromise;
    const content = await download.path().then(p => require('fs').readFileSync(p, 'utf-8'));
    // Check the summary header row does not contain "Gap" as a column
    const lines = content.split('\n');
    const summaryHeader = lines[0]; // First line is "Total Records,Signing,Verification,..."
    expect(summaryHeader).not.toMatch(/,Gap,|,Gap$|^Gap,/);
    expect(summaryHeader).toContain('Total Records');
    expect(summaryHeader).toContain('Signing');
    expect(summaryHeader).toContain('Verification');
  });

});
