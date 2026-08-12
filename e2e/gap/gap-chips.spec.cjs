// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const { APP_URL } = require('../app-url.cjs');

test.describe('Destination Issues chips (Phase 3 Task A)', () => {

  test('panel is visible when file contains invalid destinations', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByTestId('gap-launch').click();
    await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
    const csvPath = path.resolve(__dirname, '../../fixtures/gap-invalid-reasons.csv');
    await page.getByTestId('gap-upload-input').setInputFiles(csvPath);
    await page.getByTestId('gap-analyze-btn').click();
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="gap-tile-total"]');
      return el && parseInt(el.textContent, 10) > 0;
    });
    const panel = page.locator('#gap-invalid-reason-panel');
    await expect(panel).toBeVisible();
  });

  test('no chip text contains a bucket identifier (regression guard)', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByTestId('gap-launch').click();
    await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
    const csvPath = path.resolve(__dirname, '../../fixtures/gap-invalid-reasons.csv');
    await page.getByTestId('gap-upload-input').setInputFiles(csvPath);
    await page.getByTestId('gap-analyze-btn').click();
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="gap-tile-total"]');
      return el && parseInt(el.textContent, 10) > 0;
    });
    const bucketIds = ['empty', 'non-uk', 'not-plus-44', 'wrong-length', 'bad-prefix', 'identical-digits', 'sequential-run', 'other'];
    const chips = page.locator('#gap-invalid-reason-panel .gap-reason-chips button');
    const count = await chips.count();
    for (let i = 0; i < count; i++) {
      const text = await chips.nth(i).textContent();
      for (const id of bucketIds) {
        expect(text.toLowerCase()).not.toBe(id);
      }
    }
  });

  test('clicking a chip filters the table, clicking again clears', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByTestId('gap-launch').click();
    await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
    const csvPath = path.resolve(__dirname, '../../fixtures/gap-invalid-reasons.csv');
    await page.getByTestId('gap-upload-input').setInputFiles(csvPath);
    await page.getByTestId('gap-analyze-btn').click();
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="gap-tile-total"]');
      return el && parseInt(el.textContent, 10) > 0;
    });
    const firstChip = page.locator('#gap-invalid-reason-panel .gap-reason-chips button').first();
    const chipText = await firstChip.textContent();
    const countMatch = chipText.match(/\u00d7(\d+)/);
    const chipCount = countMatch ? parseInt(countMatch[1], 10) : 0;
    await firstChip.click();
    await page.waitForTimeout(300);
    const visibleRows = page.locator('#gap-table-body tr:not(.hidden)');
    await expect(visibleRows).toHaveCount(chipCount);
    await firstChip.click();
    await page.waitForTimeout(300);
    const allRows = page.locator('#gap-table-body tr');
    const totalCount = await allRows.count();
    expect(totalCount).toBeGreaterThan(chipCount);
  });
});
