const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');
const fs = require('fs');

const TEST_CSV = 'gap-phase6.csv';

test.describe('Gap Analyzer — Phase 6 (Data Flexibility)', () => {
  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
  });

  test('1. Table wrapper has overflow-x-auto on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(300);
    const container = page.locator('[data-testid="gap-table-wrap"], .overflow-x-auto').first();
    const overflow = await container.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflow).toBe('auto');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('2. Table does not have min-w-[1200px] class', async ({ page }) => {
    const tableClass = await page.locator('[data-testid="gap-table"]').getAttribute('class');
    expect(tableClass).not.toContain('min-w-[1200px]');
  });

  test('3. Table th elements have whitespace-nowrap', async ({ page }) => {
    const th = page.locator('[data-testid="gap-table"] thead th').first();
    const classes = await th.getAttribute('class');
    expect(classes).toContain('whitespace-nowrap');
  });

  test('4. Table td elements have whitespace-nowrap', async ({ page }) => {
    const td = page.locator('[data-testid="gap-table"] tbody tr:first-child td').first();
    const classes = await td.getAttribute('class');
    expect(classes).toContain('whitespace-nowrap');
  });

  test('5. Table th elements have min-width style', async ({ page }) => {
    const th = page.locator('[data-testid="gap-table"] thead th').first();
    const style = await th.getAttribute('style');
    expect(style).toContain('min-width');
  });
});

test.describe('Gap Analyzer — Phase 6B: UX Hardening', () => {

  test('1. Settings modal inner dialog is max-w-4xl wide', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const innerDialog = page.locator('#gap-column-modal > div');
    const classes = await innerDialog.getAttribute('class');
    expect(classes).toContain('max-w-6xl');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('2. Pairing key section shows From/To defaults', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const pairingSection = page.locator('#gap-column-modal h3:has-text("Pairing Key")');
    await expect(pairingSection).toBeVisible();
    const fromLabel = page.locator('#gap-column-modal label:has-text("From")');
    const toLabel = page.locator('#gap-column-modal label:has-text("To")');
    await expect(fromLabel.first()).toBeVisible();
    await expect(toLabel.first()).toBeVisible();
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('3. Pairing key From/To are pre-selected from mapping', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const fromSelect = page.locator('#gap-column-modal select').first();
    const fromVal = await fromSelect.inputValue();
    expect(fromVal.length).toBeGreaterThan(0);
    expect(fromVal).not.toBe('');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('4. Settings modal has additional columns section', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const addColBtn = page.locator('#gap-column-modal button[onclick="addGapAdditionalColumn()"]');
    await expect(addColBtn).toBeVisible();
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('5. Add custom column renders in table header and cells', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
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

  test('6. Mapping preview updates live on dropdown change', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    await page.selectOption('#gap-map-time', 'Time');
    await page.waitForTimeout(200);
    const preview = page.locator('#gap-mapping-preview');
    await expect(preview).toBeVisible();
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('7. Pairing key section exists with add button', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const pairingSection = page.locator('#gap-column-modal h3:has-text("Pairing Key")');
    await expect(pairingSection).toBeVisible();
    const addKeyBtn = page.locator('#gap-column-modal button[onclick="addGapPairingKey()"]');
    await expect(addKeyBtn).toBeVisible();
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('8. Custom columns appear in CSV export', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
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

  test('9. TTV chart canvas exists in DOM', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    const canvas = page.locator('#gap-chart-ttv');
    await expect(canvas).toBeVisible();
  });

});

test.describe('Gap Analyzer — Phase 6C: Mapping Modal Layout Refinements', () => {

  test('1. Pairing key dropdowns render horizontally with flex-wrap', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const container = page.locator('#gap-pairing-keys');
    const classes = await container.getAttribute('class');
    expect(classes).toContain('flex');
    expect(classes).toContain('flex-wrap');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('2. Pairing key section shows muted + separators between dropdowns', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const separators = page.locator('#gap-pairing-keys > span.text-slate-500');
    const count = await separators.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const text = await separators.first().textContent();
    expect(text.trim()).toBe('+');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('3. Pairing key add button reads "+ Add pairing component"', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const addBtn = page.locator('#gap-add-pair-key-btn');
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toHaveText('+ Add pairing component');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('4. Pairing key add button hidden at 4 components', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const addBtn = page.locator('#gap-add-pair-key-btn');
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.waitForTimeout(100);
    await addBtn.click();
    await page.waitForTimeout(100);
    await expect(addBtn).toBeHidden();
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('5. Pairing key remove button hidden when only 1 component remains', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const selects = page.locator('#gap-pairing-keys select.gap-pair-key');
    const count = await selects.count();
    expect(count).toBe(2);
    const removeBtns = page.locator('#gap-pairing-keys button[title="Remove component"]');
    const removeCount = await removeBtns.count();
    expect(removeCount).toBe(2);
    await removeBtns.first().click();
    await page.waitForTimeout(100);
    const removeCountAfter = await page.locator('#gap-pairing-keys button[title="Remove component"]').count();
    expect(removeCountAfter).toBe(0);
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('6. Additional columns render in a grid grid-cols-2 container', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const container = page.locator('#gap-additional-columns');
    const classes = await container.getAttribute('class');
    expect(classes).toContain('grid');
    expect(classes).toContain('grid-cols-2');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('7. Additional column entries are grouped in bordered containers', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    await page.click('#gap-column-modal button[onclick="addGapAdditionalColumn()"]');
    await page.waitForTimeout(200);
    const entry = page.locator('#gap-additional-columns > div').first();
    const classes = await entry.getAttribute('class');
    expect(classes).toContain('border');
    expect(classes).toContain('rounded-lg');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('8. Additional column grouped unit contains header dropdown + display name input', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    await page.click('#gap-column-modal button[onclick="addGapAdditionalColumn()"]');
    await page.waitForTimeout(200);
    const entry = page.locator('#gap-additional-columns > div').first();
    await expect(entry.locator('select.gap-add-col-header')).toBeVisible();
    await expect(entry.locator('input.gap-add-col-name')).toBeVisible();
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('9. Mapping grid uses 4-column layout', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const grid = page.locator('#gap-column-mappings');
    const classes = await grid.getAttribute('class');
    expect(classes).toContain('grid-cols-4');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('10. Mapping selects have atlas-select class for chevron spacing', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const sel = page.locator('#gap-column-mappings select').first();
    const classes = await sel.getAttribute('class');
    expect(classes).toContain('atlas-select');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('11. Pairing key X button is positioned above dropdown', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const xBtn = page.locator('#gap-pairing-keys button[title="Remove component"]').first();
    const classes = await xBtn.getAttribute('class');
    expect(classes).toContain('absolute');
    expect(classes).toContain('-top-');
    expect(classes).toContain('-right-');
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('12. Pairing Key section appears before column mappings', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const pairingBox = await page.locator('#gap-pairing-keys').boundingBox();
    const mappingsBox = await page.locator('#gap-column-mappings').boundingBox();
    expect(pairingBox.y).toBeLessThan(mappingsBox.y);
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('13. Map Columns section header exists above the mappings grid', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const header = page.locator('#gap-column-modal h3:has-text("Map Columns")');
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    const mappingsBox = await page.locator('#gap-column-mappings').boundingBox();
    expect(headerBox.y).toBeLessThan(mappingsBox.y);
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('14. Settings modal state resets on cancel — added pairing key disappears', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const initialCount = await page.locator('#gap-pairing-keys .gap-pair-key').count();
    await page.click('#gap-add-pair-key-btn');
    await page.waitForTimeout(200);
    const afterAddCount = await page.locator('#gap-pairing-keys .gap-pair-key').count();
    expect(afterAddCount).toBe(initialCount + 1);
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const reopenedCount = await page.locator('#gap-pairing-keys .gap-pair-key').count();
    expect(reopenedCount).toBe(initialCount);
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

  test('15. Settings modal state persists after Analyze — added pairing key remains', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, TEST_CSV);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const initialCount = await page.locator('#gap-pairing-keys .gap-pair-key').count();
    await page.click('#gap-add-pair-key-btn');
    await page.waitForTimeout(200);
    const newKeySelect = page.locator('#gap-pairing-keys .gap-pair-key').last();
    await newKeySelect.selectOption('Request ID');
    await page.waitForTimeout(200);
    const afterAddCount = await page.locator('#gap-pairing-keys .gap-pair-key').count();
    expect(afterAddCount).toBe(initialCount + 1);
    await page.click('[data-testid="gap-analyze-btn"]');
    await page.waitForTimeout(1000);
    await page.click('[data-testid="gap-settings-btn"]');
    await page.waitForSelector('#gap-column-modal', { state: 'visible', timeout: 5000 });
    const reopenedCount = await page.locator('#gap-pairing-keys .gap-pair-key').count();
    expect(reopenedCount).toBe(afterAddCount);
    await page.click('#gap-column-modal button[aria-label="Close modal"]');
  });

});
