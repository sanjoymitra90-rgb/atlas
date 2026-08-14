const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { APP_URL } = require('./app-url.cjs');

const outDir = process.argv[2] || 'screenshots';
const distPath = path.resolve(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(distPath)) {
  console.error('dist/index.html not found; run npm run build first');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(APP_URL);
  await page.getByTestId('gap-launch').click();
  await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
  const csvPath = path.resolve(__dirname, '..', 'fixtures', 'gap-screenshots.csv');
  await page.getByTestId('gap-upload-input').setInputFiles(csvPath);
  await page.getByTestId('gap-analyze-btn').click();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="gap-tile-total"]');
    return el && parseInt(el.textContent, 10) > 0;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve(outDir, 'dashboard.png'), fullPage: true });
  const tiles = page.locator('#gap-metric-total').locator('xpath=ancestor::div[contains(@class,"grid")][1]');
  await tiles.screenshot({ path: path.resolve(outDir, 'tiles.png') });
  const table = page.locator('[data-testid="gap-table"]');
  await table.screenshot({ path: path.resolve(outDir, 'table.png') });
  const panel = page.locator('#gap-filter-panel');
  if (await panel.count()) {
    if (await page.getByTestId('gap-filter-toggle').count()) {
      await page.getByTestId('gap-filter-toggle').click();
      await page.waitForTimeout(200);
    }
    await panel.screenshot({ path: path.resolve(outDir, 'filters-expanded.png') });
    if (await page.getByTestId('gap-filter-toggle').count()) {
      await page.getByTestId('gap-filter-toggle').click();
      await page.waitForTimeout(200);
      await panel.screenshot({ path: path.resolve(outDir, 'filters-collapsed.png') });
    }
  }
  await browser.close();
  console.log('Saved to ' + outDir);
})();