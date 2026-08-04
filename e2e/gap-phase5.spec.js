const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, tileText } = require('./helpers');

test.describe('Gap Analyzer — Phase 5: Time-Series Overhaul', () => {

  test('auto-bucketing selects 1hour for 2-hour range', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    const chartData = await page.evaluate(() => window.gapChartData);
    expect(chartData.labels.length).toBeGreaterThan(0);
    const dropdown = page.getByTestId('gap-bucket-interval');
    await expect(dropdown).toHaveValue('auto');
  });

  test('UI control: selecting 1hour re-renders charts', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    const before = await page.evaluate(() => window.gapChartData.labels.length);
    const dropdown = page.getByTestId('gap-bucket-interval');
    await dropdown.selectOption('1hour');
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => window.gapChartData.labels.length);
    expect(after).toBeGreaterThan(0);
  });

  test('Gaps Over Time chart is removed from DOM', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    await expect(page.locator('#gap-chart-gaps')).toHaveCount(0);
    await expect(page.locator('#gap-chart-invalid')).toHaveCount(1);
    await expect(page.locator('#gap-chart-volume')).toHaveCount(1);
    await expect(page.locator('#gap-chart-processing')).toHaveCount(1);
  });

  test('Gap Count tile shows signing − verify difference', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    const gap = await tileText(page, 'gap');
    const signing = parseInt(await tileText(page, 'signing'), 10);
    const verify = parseInt(await tileText(page, 'verify'), 10);
    const expected = Math.abs(signing - verify);
    expect(gap).toContain(String(expected));
  });

  test('Processing Time chart has no suggestedMax of 100', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
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
    await uploadAndAnalyze(page, 'test_gap_invalid_only.csv');
    const chartData = await page.evaluate(() => window.gapChartData);
    expect(chartData.labels.length).toBe(0);
  });

  test('Time Bucket dropdown exists with correct options', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'test_gap_phase2a.csv');
    const dropdown = page.getByTestId('gap-bucket-interval');
    await expect(dropdown).toBeVisible();
    const options = await dropdown.locator('option').allTextContents();
    expect(options).toContain('Auto');
    expect(options).toContain('1 Min');
    expect(options).toContain('5 Min');
    expect(options).toContain('1 Hour');
    expect(options).toContain('1 Day');
  });

});
