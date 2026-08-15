// @ts-check
const { test, expect } = require('@playwright/test');
const { APP_URL } = require('../_helpers.cjs');

const TABS = [
  { tabBtn: '#help-tab-optimizer', contentId: '#help-content-optimizer', name: 'Optimizer' },
  { tabBtn: '#help-tab-onboarding', contentId: '#help-content-onboarding', name: 'Onboarding' },
  { tabBtn: '#help-tab-gap', contentId: '#help-content-gap', name: 'Call Auditor' }
];

async function chipTargets(page, contentId) {
  return page.evaluate((id) => {
    const links = document.querySelectorAll(id + ' .help-toc-link');
    return [...links].map(a => {
      const onclick = a.getAttribute('onclick') || '';
      const match = onclick.match(/scrollToSection\('([^']+)'\)/);
      return match ? match[1] : null;
    }).filter(Boolean);
  }, contentId);
}

test.describe('Help drawer — TOC chips resolve to existing sections', () => {
  test('every tab has a non-zero number of chips, all resolving to the DOM', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => openHelp('optimizer'));
    await page.waitForSelector('#help-drawer.open');

    for (const tab of TABS) {
      await page.click(tab.tabBtn);
      await page.waitForTimeout(200);

      const targets = await chipTargets(page, tab.contentId);

      // A DOM-derived list that silently comes back empty passes every
      // assertion in a loop that never runs. Assert a non-zero chip count
      // so the loop provably ran.
      expect(targets.length, `${tab.name} tab must expose a non-zero number of TOC chips`).toBeGreaterThan(0);

      for (const id of targets) {
        const exists = await page.evaluate(id => !!document.getElementById(id), id);
        expect(exists, `${tab.name} TOC chip "${id}" should resolve to an element`).toBe(true);
      }
    }
  });
});
