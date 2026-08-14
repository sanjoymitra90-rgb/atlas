// @ts-check
const { test, expect } = require('@playwright/test');
const { APP_URL } = require('../_helpers.cjs');

test('FAB visible on Gateway, hidden in the three module views', async ({ page }) => {
  await page.goto(APP_URL);
  const onGateway = await page.evaluate(() => {
    const fab = document.querySelector('.help-fab');
    const cs = getComputedStyle(fab);
    return { display: cs.display, visible: fab.getBoundingClientRect().width > 0 };
  });
  expect(onGateway.display).not.toBe('none');
  expect(onGateway.visible).toBe(true);

  await page.getByTestId('gap-launch').click();
  await page.getByTestId('gap-upload-prompt').waitFor({ state: 'visible' });
  const inGap = await page.evaluate(() => {
    const fab = document.querySelector('.help-fab');
    const cs = getComputedStyle(fab);
    return { display: cs.display, visible: fab.getBoundingClientRect().width > 0 };
  });
  expect(inGap.display).toBe('none');

  await page.evaluate(() => window.showModule('onboarding'));
  const inOnboarding = await page.evaluate(() => {
    const fab = document.querySelector('.help-fab');
    return getComputedStyle(fab).display;
  });
  expect(inOnboarding).toBe('none');

  await page.evaluate(() => window.showModule('optimizer'));
  const inOptimizer = await page.evaluate(() => {
    const fab = document.querySelector('.help-fab');
    return getComputedStyle(fab).display;
  });
  expect(inOptimizer).toBe('none');

  await page.evaluate(() => window.showModule('gateway'));
  const backOnGateway = await page.evaluate(() => {
    const fab = document.querySelector('.help-fab');
    return getComputedStyle(fab).display;
  });
  expect(backOnGateway).not.toBe('none');
});