const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 90000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], [require.resolve('./e2e/reporters/csv-reporter.cjs')]],
  globalSetup: require.resolve('./e2e/global-setup.cjs'),
  use: { headless: true, viewport: { width: 1440, height: 900 } },
  projects: [
    {
      name: 'gap',
      testDir: './e2e/gap',
      testMatch: '**/*.cjs',
    },
    {
      name: 'optimizer',
      testDir: './e2e/optimizer',
      testMatch: '**/*.cjs',
    },
    {
      name: 'onboarding',
      testDir: './e2e/onboarding',
      testMatch: '**/*.cjs',
    },
  ],
});
