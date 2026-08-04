const path = require('path');
const { pathToFileURL } = require('url');

const APP_URL = pathToFileURL(path.resolve(__dirname, '..', '..', 'index.html')).href;

async function openGapAnalyzer(page) {
  await page.goto(APP_URL);
  await page.getByTestId('gap-launch').click();
  await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
}

async function uploadAndAnalyze(page, csvName) {
  const csvPath = path.resolve(__dirname, '..', '..', 'fixtures', csvName);
  await page.getByTestId('gap-upload-input').setInputFiles(csvPath);
  await page.getByTestId('gap-analyze-btn').click();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="gap-tile-total"]');
    return el && parseInt(el.textContent, 10) > 0;
  });
}

async function tileText(page, name) {
  return (await page.getByTestId('gap-tile-' + name).textContent()).trim();
}

module.exports = { APP_URL, openGapAnalyzer, uploadAndAnalyze, tileText };
