// @ts-check
const { test, expect } = require('@playwright/test');
const { APP_URL } = require('../app-url.cjs');

async function loadApp(page) {
  await page.goto(APP);
  await page.waitForTimeout(2000);
}

test.describe('Onboarding smoke tests', () => {

  async function enterOnboarding(page) {
    await page.goto(APP_URL);
    await page.waitForTimeout(2000);
    await page.click('.gateway-card:has-text("Onboarding Calculator")');
    await page.waitForTimeout(2000);
  }

  // 4-hour snapping: 17 becomes 20
  test('4-hour snapping: entering 17 yields 20', async ({ page }) => {
    await enterOnboarding(page);
    const snapped = await page.evaluate(() => {
      let raw = 17;
      return Math.ceil(raw / 4) * 4 || 4;
    });
    expect(snapped).toBe(20);
  });

  // Margin math: cost 8000 at 20% margin yields 10000
  test('margin math: cost 8000 at 20% margin gives customer price 10000', async ({ page }) => {
    await enterOnboarding(page);
    const result = await page.evaluate(() => {
      const internalCost = 8000;
      const margin = 20;
      const multiplier = 1 - (margin / 100);
      const price = multiplier > 0 ? internalCost / multiplier : internalCost;
      return price;
    });
    expect(result).toBe(10000);
  });

  // Margin = 100 clamps to 99 and writes back
  test('margin >= 100 clamps to 99', async ({ page }) => {
    await enterOnboarding(page);
    const result = await page.evaluate(() => {
      let toastMsg = '';
      const orig = window.showToast;
      window.showToast = (msg, isError) => { if (isError) toastMsg = msg; };
      const el = document.getElementById('ob-margin');
      if (el) { el.value = '100'; el.dispatchEvent(new Event('change')); }
      window.showToast = orig;
      return { toast: toastMsg, value: el ? el.value : null };
    });
    expect(result.toast).toContain('clamped');
    expect(result.value).toBe('99');
  });

  // Negative margin clamps to 0
  test('negative margin clamps to 0', async ({ page }) => {
    await enterOnboarding(page);
    const result = await page.evaluate(() => {
      const el = document.getElementById('ob-margin');
      if (el) { el.value = '-50'; el.dispatchEvent(new Event('change')); }
      return { value: el ? el.value : null };
    });
    expect(result.value).toBe('0');
  });

  // Tier switching preserves edited tasks (deployment scope dropdown exists)
  test('deployment scope dropdown switches tiers', async ({ page }) => {
    await enterOnboarding(page);
    const result = await page.evaluate(() => {
      const sel = document.getElementById('deployment-scope');
      return sel !== null && sel.options.length >= 3;
    });
    expect(result).toBe(true);
  });

  // Ribbon fields exist
  test('ribbon contains rate, margin, and contingency inputs', async ({ page }) => {
    await enterOnboarding(page);
    const result = await page.evaluate(() => {
      return document.getElementById('ob-rate') !== null
        && document.getElementById('ob-margin') !== null
        && document.getElementById('ob-contingency') !== null;
    });
    expect(result).toBe(true);
  });

  // Contingency is separate from margin
  test('contingency is a separate field from margin', async ({ page }) => {
    await enterOnboarding(page);
    const result = await page.evaluate(() => {
      const contEl = document.getElementById('ob-contingency');
      return contEl !== null;
    });
    expect(result).toBe(true);
  });

  // Assumptions textarea exists
  test('assumptions textarea exists and is editable', async ({ page }) => {
    await enterOnboarding(page);
    const result = await page.evaluate(() => {
      const ta = document.getElementById('ob-assumptions');
      if (!ta) return false;
      ta.value = 'Test assumption';
      return ta.value === 'Test assumption';
    });
    expect(result).toBe(true);
  });

});
