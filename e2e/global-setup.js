// @ts-check
// Global setup: fails fast with a clear message if any CDN dependency is missing.
const { chromium } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const APP = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(APP, { timeout: 30000 });
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });

    const deps = await page.evaluate(() => ({
      chart: typeof Chart !== 'undefined',
      leaflet: typeof L !== 'undefined',
      html2pdf: typeof html2pdf !== 'undefined',
      gantt: typeof gantt !== 'undefined'
    }));

    const missing = Object.entries(deps).filter(([, ok]) => !ok).map(([n]) => n);
    if (missing.length > 0) {
      throw new Error('Dependency unavailable: ' + missing.join(', ') + '. Check CDN or network.');
    }
    console.log(' CDN dependency check passed');
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
