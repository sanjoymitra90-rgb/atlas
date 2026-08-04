const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, tileText } = require('./helpers');

test.describe('Gap Analyzer — pairing-derived gap chart + tile', () => {

  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_pairing_chart.csv');
  });

  test('Gap Count tile uses simple signing − verify difference', async ({ page }) => {
    expect(await tileText(page, 'total')).toBe('6');
    expect(await tileText(page, 'signing')).toBe('4');
    expect(await tileText(page, 'verify')).toBe('2');
    expect(await tileText(page, 'gap')).toContain('2');
    const desc = await page.locator('#gap-metric-gap-desc').textContent();
    expect(desc).toContain('net');
  });

  test('Gaps Over Time chart no longer exists', async ({ page }) => {
    await expect(page.locator('#gap-chart-gaps')).toHaveCount(0);
  });

});
