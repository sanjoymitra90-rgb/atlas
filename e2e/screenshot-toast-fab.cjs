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
    const toast = document.getElementById('toast-msg');
    return toast && toast.classList.contains('show');
  });
  const corner = await page.evaluate(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return { w, h };
  });
  const clipTopRight = { x: corner.w - 500, y: 0, width: 500, height: 140 };
  const clipBottomLeft = { x: 0, y: corner.h - 140, width: 500, height: 140 };
  const clipBottomRight = { x: corner.w - 220, y: corner.h - 220, width: 220, height: 220 };
  await page.screenshot({ path: path.resolve(outDir, 'toast-corner.png'), clip: clipTopRight });
  await page.screenshot({ path: path.resolve(outDir, 'toast-bottom-left.png'), clip: clipBottomLeft });
  await page.waitForTimeout(3500);
  const fabVisible = await page.evaluate(() => {
    const fab = document.querySelector('.help-fab');
    if (!fab) return 'absent';
    const s = getComputedStyle(fab);
    return s.display === 'none' ? 'hidden' : 'visible';
  });
  await page.screenshot({ path: path.resolve(outDir, 'fab-corner.png'), clip: clipBottomRight });
  console.log('fab state: ' + fabVisible + '; saved to ' + outDir);
  await browser.close();
})();