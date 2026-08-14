// @ts-check
const { test, expect } = require('@playwright/test');
const { APP_URL } = require('../_helpers.cjs');

test.describe('Help drawer — TOC chips resolve to existing sections', () => {
  test('every TOC chip target exists in the DOM', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => openHelp('optimizer'));
    await page.waitForSelector('#help-drawer.open');

    // Check Optimizer TOC
    const optimizerTargets = await page.evaluate(() => {
      const links = document.querySelectorAll('#help-content-optimizer .help-toc-link');
      return [...links].map(a => {
        const onclick = a.getAttribute('onclick') || '';
        const match = onclick.match(/scrollToSection\('([^']+)'\)/);
        return match ? match[1] : null;
      }).filter(Boolean);
    });
    for (const id of optimizerTargets) {
      const exists = await page.evaluate(id => !!document.getElementById(id), id);
      expect(exists, `Optimizer TOC chip "${id}" should resolve to an element`).toBe(true);
    }

    // Switch to Onboarding tab
    await page.click('#help-tab-onboarding');
    await page.waitForTimeout(200);

    const onboardingTargets = await page.evaluate(() => {
      const links = document.querySelectorAll('#help-content-onboarding .help-toc-link');
      return [...links].map(a => {
        const onclick = a.getAttribute('onclick') || '';
        const match = onclick.match(/scrollToSection\('([^']+)'\)/);
        return match ? match[1] : null;
      }).filter(Boolean);
    });
    for (const id of onboardingTargets) {
      const exists = await page.evaluate(id => !!document.getElementById(id), id);
      expect(exists, `Onboarding TOC chip "${id}" should resolve to an element`).toBe(true);
    }

    // Gap tab has no TOC chips — verify sections exist
    await page.click('#help-tab-gap');
    await page.waitForTimeout(200);
    const gapSectionIds = ['gap-intro', 'gap-upload', 'gap-metrics', 'gap-table', 'gap-pairing', 'gap-charts', 'gap-uk'];
    for (const id of gapSectionIds) {
      const exists = await page.evaluate(id => !!document.getElementById(id), id);
      expect(exists, `Gap section "${id}" should exist`).toBe(true);
    }
  });
});
