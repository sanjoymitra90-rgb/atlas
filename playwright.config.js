const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: { headless: true, viewport: { width: 1440, height: 900 } },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
