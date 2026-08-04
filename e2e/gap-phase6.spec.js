import { test, expect } from '@playwright/test';
import { openGapAnalyzer, uploadAndAnalyze } from './helpers.js';
const fs = require('fs');

const TEST_CSV = 'test_gap_phase6.csv';

test.describe('Gap Analyzer — Phase 6 (Data Flexibility)', () => {
  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
  });

  test('1. Table has horizontal scroll on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(300);
    const container = page.locator('[data-testid="gap-table-wrap"], .overflow-x-auto').first();
    const overflow = await container.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflow).toBe('auto');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('2. Settings modal has additional columns section', async ({ page }) => {
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const addColBtn = page.locator('#gap-column-modal button:has-text("Add Column")');
    await expect(addColBtn).toBeVisible();
    await page.click('button[aria-label="Close modal"]');
  });

  test('3. Add custom column renders in table header and cells', async ({ page }) => {
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    await page.click('#gap-column-modal button:has-text("Add Column")');
    await page.waitForTimeout(200);
    await page.selectOption('.gap-add-col-header[data-idx="0"]', 'Request ID');
    await page.fill('.gap-add-col-name[data-idx="0"]', 'Req ID');
    await page.click('[data-testid="gap-analyze-btn"]');
    await page.waitForTimeout(500);
    const header = page.locator('th.gap-custom-col-th:has-text("Req ID")');
    await expect(header).toBeVisible();
    const cell = page.locator('#gap-dashboard td:has-text("REQ-001")');
    await expect(cell.first()).toBeVisible();
  });

  test('4. Mapping preview updates live on dropdown change', async ({ page }) => {
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    await page.selectOption('#gap-map-time', 'Time');
    await page.waitForTimeout(200);
    const preview = page.locator('#gap-mapping-preview');
    await expect(preview).toBeVisible();
    await page.click('button[aria-label="Close modal"]');
  });

  test('5. Pairing key section exists with add button', async ({ page }) => {
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const pairingSection = page.locator('#gap-column-modal h3:has-text("Pairing Key")');
    await expect(pairingSection).toBeVisible();
    const addKeyBtn = page.getByRole('button', { name: '+ Add', exact: true });
    await expect(addKeyBtn).toBeVisible();
    await page.click('button[aria-label="Close modal"]');
  });

  test('6. Custom columns appear in CSV export', async ({ page }) => {
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    await page.click('#gap-column-modal button:has-text("Add Column")');
    await page.waitForTimeout(200);
    await page.selectOption('.gap-add-col-header[data-idx="0"]', 'Request ID');
    await page.fill('.gap-add-col-name[data-idx="0"]', 'Req ID');
    await page.click('[data-testid="gap-analyze-btn"]');
    await page.waitForTimeout(500);
    const download = page.waitForEvent('download');
    await page.click('[data-testid="gap-export-btn"]');
    await page.click('#gap-export-modal button:has-text("All Results")');
    const dl = await download;
    const content = fs.readFileSync(await dl.path(), 'utf8');
    expect(content).toContain('Req ID');
    expect(content).toContain('REQ-001');
  });

  test('7. TTV chart canvas exists in DOM', async ({ page }) => {
    const canvas = page.locator('#gap-chart-ttv');
    await expect(canvas).toBeVisible();
  });
});
