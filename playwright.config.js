const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: { headless: true, viewport: { width: 1440, height: 900 } },
  projects: [
    {
      name: 'gap',
      testDir: './e2e/gap',
    },
    {
      name: 'optimizer',
      testDir: './e2e/optimizer',
    },
  ],
});
