const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, APP_URL } = require('../_helpers.cjs');

test.describe('Phase 5A — Task G: theme toggle is gone and persisted light is inert', () => {
  test('no theme control is reachable anywhere in the header', async ({ page }) => {
    await openGapAnalyzer(page);
    await expect(page.locator('[data-testid="gap-theme-toggle"]')).toHaveCount(0);
    await expect(page.locator('#gap-theme-icon')).toHaveCount(0);
    const headerText = await page.locator('.gap-header').innerText();
    expect(headerText.toLowerCase()).not.toContain('theme');
    expect(headerText.toLowerCase()).not.toContain('light');
  });

  test('persisted light theme is inert: app still renders dark', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('atlas-gap-theme', 'light');
    });
    await openGapAnalyzer(page);
    await expect(page.locator('#main-content')).not.toHaveAttribute('data-theme', 'light');
    const root = page.locator('#main-content');
    expect(await root.getAttribute('data-theme')).toBeNull();
    const saved = await page.evaluate(() => localStorage.getItem('atlas-gap-theme'));
    expect(saved).toBe('light');
  });

  test('persisted light leaves the Call Auditor dark after analysis', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('atlas-gap-theme', 'light');
    });
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-screenshots.csv');
    const bg = await page.evaluate(() => {
      const el = document.getElementById('main-content');
      return el ? getComputedStyle(el).getPropertyValue('--atlas-canvas').trim() : null;
    });
    expect(bg).not.toBe('#f8fafc');
    await expect(page.locator('[data-testid="gap-theme-toggle"]')).toHaveCount(0);
  });
});