// @ts-check
const { test, expect } = require('@playwright/test');
const { APP_URL } = require('../_helpers.cjs');

test.describe('Phase 6.1 Task C — console.warn proof', () => {
  test('scrollToSection warns for a missing id', async ({ page }) => {
    const warnings = [];
    page.on('console', (msg) => { if (msg.type() === 'warning') warnings.push(msg.text()); });
    await page.goto(APP_URL);
    await page.evaluate(() => openHelp('gap'));
    await page.waitForSelector('#help-drawer.open');
    await page.evaluate(() => scrollToSection('gap-does-not-exist'));
    await page.waitForTimeout(300);
    expect(warnings.some(w => w.includes('gap-does-not-exist'))).toBe(true);
  });
});
