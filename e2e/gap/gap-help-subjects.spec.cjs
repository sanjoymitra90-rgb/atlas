// @ts-check
const { test, expect } = require('@playwright/test');
const { APP_URL } = require('../_helpers.cjs');

test.describe('Phase 6.1 Task B — help drawer subjects', () => {
  test('new sections exist and state the subjects', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => openHelp('gap'));
    await page.waitForSelector('#help-drawer.open');

    const gapSections = await page.evaluate(() => {
      const body = document.getElementById('help-body-gap');
      const ids = [...body.querySelectorAll('section')].map(s => s.id);
      const text = body.textContent;
      return { ids, text };
    });

    expect(gapSections.ids).toContain('gap-times');
    expect(gapSections.text).toContain('UTC');
    expect(gapSections.text).toContain('source text, unchanged');
    expect(gapSections.text).toContain('warning marker');
    expect(gapSections.text).toContain('sorts to the bottom');
    expect(gapSections.text).toContain('collapsed by default');
    expect(gapSections.text).toContain('active');
    expect(gapSections.text).toContain('response code');
    expect(gapSections.text).toContain('service provider');

    // No code identifiers leaked into the new prose
    expect(gapSections.text).not.toContain('getBoundingClientRect');
    expect(gapSections.text).not.toContain('parseGapTimestamp');
    expect(gapSections.text).not.toContain('timeHadOffset');
    expect(gapSections.text).not.toContain('gap-filter-');
  });
});
