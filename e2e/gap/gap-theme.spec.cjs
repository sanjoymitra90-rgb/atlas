const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

test.describe('Gap Analyzer — Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
  });

  test('toggle button is visible in the header', async ({ page }) => {
    const btn = page.getByTestId('gap-theme-toggle');
    await expect(btn).toBeVisible();
  });

  test('clicking toggle switches to light theme (data-theme="light")', async ({ page }) => {
    await page.getByTestId('gap-theme-toggle').click();
    const root = page.locator('#main-content');
    await expect(root).toHaveAttribute('data-theme', 'light');
  });

  test('clicking toggle again switches back to dark (no data-theme)', async ({ page }) => {
    await page.getByTestId('gap-theme-toggle').click();
    await expect(page.locator('#main-content')).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('gap-theme-toggle').click();
    await expect(page.locator('#main-content')).not.toHaveAttribute('data-theme', 'light');
  });

  test('icon changes from sun to moon in light mode', async ({ page }) => {
    const icon = page.locator('#gap-theme-icon');
    await expect(icon).toHaveClass(/fa-sun/);
    await page.getByTestId('gap-theme-toggle').click();
    await expect(icon).toHaveClass(/fa-moon/);
  });

  test('localStorage persists theme across navigation', async ({ page }) => {
    await page.getByTestId('gap-theme-toggle').click();
    await expect(page.locator('#main-content')).toHaveAttribute('data-theme', 'light');
    // Re-navigate
    await page.goto(page.url());
    await page.getByTestId('gap-launch').click();
    await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
    await expect(page.locator('#main-content')).toHaveAttribute('data-theme', 'light');
  });

  test('charts re-render without errors on theme toggle', async ({ page }) => {
    await uploadAndAnalyze(page, 'gap-screenshots.csv');
    // Toggle theme
    await page.getByTestId('gap-theme-toggle').click();
    await expect(page.locator('#main-content')).toHaveAttribute('data-theme', 'light');
    // All seven charts should still be present
    await expect(page.locator('#gap-chart-invalid')).toBeVisible();
    await expect(page.locator('#gap-chart-volume')).toBeVisible();
    await expect(page.locator('#gap-chart-processing')).toBeVisible();
    await expect(page.locator('#gap-chart-requests')).toBeVisible();
    await expect(page.locator('#gap-chart-ttv')).toBeVisible();
    await expect(page.locator('#gap-chart-pairproc')).toBeVisible();
    await expect(page.locator('#gap-chart-e2e')).toBeVisible();
  });

  test('light theme: canvas background is light', async ({ page }) => {
    await page.getByTestId('gap-theme-toggle').click();
    const bg = await page.evaluate(() => {
      const el = document.getElementById('main-content');
      return el ? getComputedStyle(el).getPropertyValue('--gap-canvas').trim() : null;
    });
    expect(bg).toBe('#f8fafc');
  });
});
