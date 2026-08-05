const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

const APP_URL = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(APP_URL);
  await page.getByTestId('gap-launch').click();
  await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
  const csvPath = path.resolve(__dirname, '..', 'test_gap_phase2a.csv');
  await page.getByTestId('gap-upload-input').setInputFiles(csvPath);
  await page.getByTestId('gap-analyze-btn').click();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="gap-tile-total"]');
    return el && parseInt(el.textContent, 10) > 0;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'screenshot-gap-dark.png'), fullPage: true });
  await page.getByTestId('gap-theme-toggle').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'screenshot-gap-light.png'), fullPage: true });
  await browser.close();
  console.log('Screenshots saved: screenshot-gap-dark.png, screenshot-gap-light.png');
})();
