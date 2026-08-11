const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

const FILTER_COLS = ['time', 'service', 'from', 'to', 'status', 'customer', 'sourceIP', 'processingTime', 'ukCategory', 'pairStatus'];

test.describe('Gap Analyzer — Column Header Filters', () => {

  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
  });

  test('all 10 column filter icons exist', async ({ page }) => {
    const icons = page.locator('.gap-col-filter');
    await expect(icons).toHaveCount(10);
    for (const col of FILTER_COLS) {
      await expect(page.locator(`.gap-col-filter[data-col="${col}"]`)).toBeVisible();
    }
  });

  test('clicking each filter icon opens its dropdown', async ({ page }) => {
    for (const col of FILTER_COLS) {
      await page.locator(`.gap-col-filter[data-col="${col}"]`).click();
      const dd = page.locator(`#col-dd-${col}`);
      await expect(dd).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dd).toBeHidden();
    }
  });

  test('clicking outside closes open dropdown', async ({ page }) => {
    await page.locator('.gap-col-filter[data-col="service"]').click();
    await expect(page.locator('#col-dd-service')).toBeVisible();
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(page.locator('#col-dd-service')).toBeHidden();
  });

  test('Esc closes open dropdown', async ({ page }) => {
    await page.locator('.gap-col-filter[data-col="status"]').click();
    await expect(page.locator('#col-dd-status')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#col-dd-status')).toBeHidden();
  });

  test('Service filter: selecting Signing Only filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="service"]').click();
    await page.locator('#col-filter-service').selectOption('signing');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Service filter syncs with filter bar', async ({ page }) => {
    await page.locator('.gap-col-filter[data-col="service"]').click();
    await page.locator('#col-filter-service').selectOption('verify');
    const barValue = await page.locator('#gap-filter-service').inputValue();
    expect(barValue).toBe('verify');
  });

  test('From filter: typing text filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="from"]').click();
    await page.locator('#col-filter-from').fill('+447911000001');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('To filter: typing text filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="to"]').click();
    await page.locator('#col-filter-to').fill('+447911223344');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Status filter: selecting 500 filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="status"]').click();
    await page.locator('#col-filter-status').selectOption('500');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Customer filter: selecting a customer filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="customer"]').click();
    await page.locator('#col-filter-customer').selectOption('Acme Ltd');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Source IP filter: typing IP filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="sourceIP"]').click();
    await page.locator('#col-filter-ip').fill('10.0.0.1');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Proc Time filter: Min filters out low values', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="processingTime"]').click();
    await page.locator('#col-filter-proc-min').fill('100');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Proc Time filter: Max filters out high values', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="processingTime"]').click();
    await page.locator('#col-filter-proc-max').fill('50');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('UK Valid filter: selecting Valid filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="ukCategory"]').click();
    await page.locator('#col-filter-validation').selectOption('valid');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Pair filter: selecting Paired filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="pairStatus"]').click();
    await page.locator('#col-filter-pair').selectOption('paired');
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Time filter: setting a range filters table', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="time"]').click();
    await page.evaluate(() => {
      document.getElementById('col-filter-time-from').value = '2026-08-01T10:00';
      document.getElementById('col-filter-time-to').value = '2026-08-01T11:00';
      syncFromColFilter('time');
    });
    const filteredCount = await page.locator('#gap-table-body tr').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Reset All clears all column filters', async ({ page }) => {
    await page.locator('.gap-col-filter[data-col="service"]').click();
    await page.locator('#col-filter-service').selectOption('signing');
    await page.locator('.gap-col-filter[data-col="status"]').click();
    await page.locator('#col-filter-status').selectOption('500');
    await page.locator('[data-testid="gap-reset-btn"]').click();
    const serviceVal = await page.locator('#gap-filter-service').inputValue();
    const statusVal = await page.locator('#gap-filter-status').inputValue();
    expect(serviceVal).toBe('all');
    expect(statusVal).toBe('all');
  });

  test('active filter icon turns violet', async ({ page }) => {
    const icon = page.locator('.gap-col-filter[data-col="service"]');
    await expect(icon).not.toHaveClass(/active/);
    await icon.click();
    await page.locator('#col-filter-service').selectOption('signing');
    await expect(icon).toHaveClass(/active/);
  });

  test('multiple filters combine (AND logic)', async ({ page }) => {
    const initialCount = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="service"]').click();
    await page.locator('#col-filter-service').selectOption('signing');
    const afterService = await page.locator('#gap-table-body tr').count();
    await page.locator('.gap-col-filter[data-col="customer"]').click();
    await page.locator('#col-filter-customer').selectOption('Acme Ltd');
    const afterCustomer = await page.locator('#gap-table-body tr').count();
    expect(afterService).toBeLessThan(initialCount);
    expect(afterCustomer).toBeLessThanOrEqual(afterService);
    expect(afterCustomer).toBeGreaterThan(0);
  });

  test('dropdown width matches column header width', async ({ page }) => {
    for (const col of ['service', 'status', 'customer']) {
      await page.locator(`.gap-col-filter[data-col="${col}"]`).click();
      const dd = page.locator(`#col-dd-${col}`);
      await expect(dd).toBeVisible();
      const ddBox = await dd.boundingBox();
      const th = page.locator(`th:has(.gap-col-filter[data-col="${col}"])`);
      const thBox = await th.boundingBox();
      expect(ddBox.width).toBeGreaterThanOrEqual(thBox.width - 5);
      expect(ddBox.width).toBeLessThanOrEqual(Math.max(thBox.width, 160) + 10);
      await page.keyboard.press('Escape');
    }
  });

  test('dropdown is anchored directly below its header cell', async ({ page }) => {
    await page.locator('.gap-col-filter[data-col="service"]').click();
    const dd = page.locator('#col-dd-service');
    await expect(dd).toBeVisible();
    const ddBox = await dd.boundingBox();
    const th = page.locator('th:has(.gap-col-filter[data-col="service"])');
    const thBox = await th.boundingBox();
    expect(ddBox.y).toBeGreaterThanOrEqual(thBox.y + thBox.height);
    expect(ddBox.y).toBeLessThanOrEqual(thBox.y + thBox.height + 10);
    expect(Math.abs(ddBox.x - thBox.x)).toBeLessThanOrEqual(2);
  });

  test('dropdown does not extend past viewport bottom', async ({ page }) => {
    const viewport = page.viewportSize();
    await page.locator('.gap-col-filter[data-col="service"]').click();
    const dd = page.locator('#col-dd-service');
    await expect(dd).toBeVisible();
    const ddBox = await dd.boundingBox();
    expect(ddBox.y + ddBox.height).toBeLessThanOrEqual(viewport.height);
  });

  test('Time dropdown has max-height and scrolls if needed', async ({ page }) => {
    await page.locator('.gap-col-filter[data-col="time"]').click();
    const dd = page.locator('#col-dd-time');
    await expect(dd).toBeVisible();
    const maxHeight = await dd.evaluate(el => parseInt(getComputedStyle(el).maxHeight));
    expect(maxHeight).toBeGreaterThan(0);
    expect(maxHeight).toBeLessThanOrEqual(250);
  });

  test('no horizontal scrollbar in any dropdown', async ({ page }) => {
    for (const col of FILTER_COLS) {
      await page.locator(`.gap-col-filter[data-col="${col}"]`).click();
      const dd = page.locator(`#col-dd-${col}`);
      await expect(dd).toBeVisible();
      const ok = await dd.evaluate(el => el.scrollWidth <= el.clientWidth + 20);
      expect(ok).toBeTruthy();
      await page.keyboard.press('Escape');
    }
  });

  test('vertical scroll closes open dropdown', async ({ page }) => {
    await page.locator('.gap-col-filter[data-col="service"]').click();
    await expect(page.locator('#col-dd-service')).toBeVisible();
    await page.mouse.wheel(0, 150);
    await expect(page.locator('#col-dd-service')).toBeHidden();
  });

  test('horizontal scroll closes open dropdown', async ({ page }) => {
    await page.locator('.gap-col-filter[data-col="service"]').click();
    await expect(page.locator('#col-dd-service')).toBeVisible();
    await page.evaluate(() => {
      const table = document.querySelector('[data-testid="gap-table"]');
      const wrapper = table && table.closest('.overflow-x-auto');
      if (wrapper) {
        wrapper.scrollLeft = 300;
        wrapper.dispatchEvent(new Event('scroll', { bubbles: false }));
      }
    });
    await expect(page.locator('#col-dd-service')).toBeHidden();
  });

  test('header From filter syncs with filter bar', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.locator('.gap-col-filter[data-col="from"]').click();
    await expect(page.locator('#col-dd-from')).toBeVisible();
    await page.locator('#col-filter-from').fill('test');
    await page.waitForTimeout(200);
    const barValue = await page.locator('#gap-filter-from').inputValue();
    expect(barValue).toBe('test');
  });

  test('header filter typing filters the table', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const beforeRows = await page.locator('[data-testid="gap-table"] tbody tr').count();
    await page.locator('.gap-col-filter[data-col="from"]').click();
    await page.locator('#col-filter-from').fill('nonexistent-number-12345');
    await page.waitForTimeout(300);
    const afterRows = await page.locator('[data-testid="gap-table"] tbody tr').count();
    expect(afterRows).toBeLessThan(beforeRows);
  });

  test('Reset All clears both filter bar and column header inputs', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.locator('.gap-col-filter[data-col="from"]').click();
    await page.locator('#col-filter-from').fill('test');
    await page.waitForTimeout(200);
    await page.getByTestId('gap-reset-btn').click();
    await page.waitForTimeout(200);
    const barValue = await page.locator('#gap-filter-from').inputValue();
    expect(barValue).toBe('');
    const colValue = await page.locator('#col-filter-from').inputValue();
    expect(colValue).toBe('');
  });
});
