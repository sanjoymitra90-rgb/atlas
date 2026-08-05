const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 90000,
  retries: process.env.CI ? 1 : 0,
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
