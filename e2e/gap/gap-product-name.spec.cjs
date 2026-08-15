// @ts-check
const { test, expect } = require('@playwright/test');
const { APP_URL } = require('../_helpers.cjs');

const SHARED_PHRASE = 'Infrastructure Strategy & Operations';
const TAGLINE_EXACT = 'Infrastructure Strategy & Operations Suite';

test.describe('Phase 6.2 — product name is one product', () => {
  test('tagline, title and meta description all carry the shared phrase', async ({ page }) => {
    await page.goto(APP_URL);

    // Assert every element exists before asserting its content. A missing
    // element is a failure, not a branch — a test that skipped on a missing
    // tag would pass forever after someone deleted the meta tag.
    await expect(page.getByTestId('gateway-tagline')).toBeVisible();

    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveCount(1);

    const tagline = (await page.getByTestId('gateway-tagline').textContent()).trim();
    const title = await page.title();
    const description = await meta.getAttribute('content');

    // The tagline is the agreed string, exactly.
    expect(tagline).toBe(TAGLINE_EXACT);

    // The three strings are deliberately different lengths for different
    // contexts, so they cannot be asserted equal. The shared phrase is the
    // thing that must hold across all three.
    expect(tagline).toContain(SHARED_PHRASE);
    expect(title).toContain(SHARED_PHRASE);
    expect(description).toContain(SHARED_PHRASE);
  });
});
