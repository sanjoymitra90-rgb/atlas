// @ts-check
// Global setup: fails fast with a clear message if build is stale or CDN deps are missing.
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const DIST_INDEX = path.join(ROOT, 'dist', 'index.html');
const APP = pathToFileURL(DIST_INDEX).href;

function getNewestMtimeMs(dir) {
  let max = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = getNewestMtimeMs(full);
      if (sub > max) max = sub;
    } else if (/\.(js|css)$/.test(entry.name)) {
      const st = fs.statSync(full);
      if (st.mtimeMs > max) max = st.mtimeMs;
    }
  }
  return max;
}

async function globalSetup() {
  // B1: Fail if dist/index.html is missing or stale
  if (!fs.existsSync(DIST_INDEX)) {
    throw new Error('dist/index.html does not exist; run npm run build');
  }
  const distMtime = fs.statSync(DIST_INDEX).mtimeMs;
  const srcNewest = getNewestMtimeMs(path.join(ROOT, 'src'));
  const rootIndexMtime = fs.statSync(path.join(ROOT, 'index.html')).mtimeMs;
  const sourceNewest = Math.max(srcNewest, rootIndexMtime);
  if (sourceNewest > distMtime) {
    // Find which file is newer for the error message
    const srcFiles = [];
    function collect(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collect(full);
        else if (/\.(js|css)$/.test(entry.name) && fs.statSync(full).mtimeMs > distMtime) {
          srcFiles.push(path.relative(ROOT, full).replace(/\\/g, '/'));
        }
      }
    }
    collect(path.join(ROOT, 'src'));
    if (fs.statSync(path.join(ROOT, 'index.html')).mtimeMs > distMtime) {
      srcFiles.unshift('index.html');
    }
    throw new Error('dist/index.html is stale (' + srcFiles[0] + ' is newer); run npm run build');
  }

  // CDN dependency check
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
