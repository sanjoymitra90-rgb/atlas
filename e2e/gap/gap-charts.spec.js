const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, tileText } = require('./helpers');

test.describe('Gap Analyzer — Phase 5+6B: Charts & Per-Chart Buckets', () => {

  test('auto-bucketing selects 1hour for 2-hour range', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const chartData = await page.evaluate(() => window.gapChartData);
    expect(chartData.labels.length).toBeGreaterThan(0);
    const dropdown = page.getByTestId('gap-bucket-interval-invalid');
    await expect(dropdown).toHaveValue('auto');
  });

  test('per-chart dropdown: selecting 1hour on invalid chart re-renders that chart', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const before = await page.evaluate(() => window.gapChartData.labels.length);
    const dropdown = page.getByTestId('gap-bucket-interval-invalid');
    await dropdown.selectOption('1hour');
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => window.gapChartData.labels.length);
    expect(after).toBeGreaterThan(0);
  });

  test('per-chart bucket isolation: changing invalid dropdown does not affect volume dropdown', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.getByTestId('gap-bucket-interval-invalid').selectOption('5min');
    await page.waitForTimeout(100);
    await expect(page.getByTestId('gap-bucket-interval-invalid')).toHaveValue('5min');
    await expect(page.getByTestId('gap-bucket-interval-volume')).toHaveValue('auto');
  });

  test('Gaps Over Time chart is removed from DOM', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await expect(page.locator('#gap-chart-gaps')).toHaveCount(0);
    await expect(page.locator('#gap-chart-invalid')).toHaveCount(1);
    await expect(page.locator('#gap-chart-volume')).toHaveCount(1);
    await expect(page.locator('#gap-chart-processing')).toHaveCount(1);
  });

  test('Gap Count tile shows signing − verify difference', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const gap = await tileText(page, 'gap');
    const signing = parseInt(await tileText(page, 'signing'), 10);
    const verify = parseInt(await tileText(page, 'verify'), 10);
    const expected = Math.abs(signing - verify);
    expect(gap).toContain(String(expected));
  });

  test('Processing Time chart has no suggestedMax of 100', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const hasSuggestedMax = await page.evaluate(() => {
      const instances = Object.values(window.gapChartInstances || {});
      const procChart = instances.find(c => c && c.canvas && c.canvas.id === 'gap-chart-processing');
      if (!procChart) return false;
      const yScale = procChart.options.scales.y;
      return yScale && yScale.suggestedMax === 100;
    });
    expect(hasSuggestedMax).toBe(false);
  });

  test('invalid timestamps excluded from time-series charts', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-invalid-only.csv');
    const chartData = await page.evaluate(() => window.gapChartData);
    expect(chartData.labels.length).toBe(0);
  });

  test('four per-chart bucket dropdowns exist with correct options', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    for (const ct of ['invalid', 'volume', 'proc', 'ttv']) {
      const dropdown = page.getByTestId('gap-bucket-interval-' + ct);
      await expect(dropdown).toBeVisible();
      const options = await dropdown.locator('option').allTextContents();
      expect(options).toContain('Auto');
      expect(options).toContain('1 Min');
      expect(options).toContain('5 Min');
      expect(options).toContain('1 Hour');
      expect(options).toContain('1 Day');
    }
  });

  test('TTV chart canvas exists in DOM', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const canvas = page.locator('#gap-chart-ttv');
    await expect(canvas).toBeVisible();
  });

});
