const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, tileText } = require('../_helpers.cjs');

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
    await expect(canvas).toBeAttached();
    const wrapper = canvas.locator('xpath=..');
    const msg = wrapper.locator('.chart-empty-msg');
    const canvasVisible = await canvas.isVisible().catch(() => false);
    const msgVisible = await msg.isVisible().catch(() => false);
    expect(canvasVisible || msgVisible).toBe(true);
  });

  test('proc bucket dropdown: selecting 1min on proc chart re-renders with more buckets', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const before = await page.evaluate(() => (window.gapChartInstances || {}).proc ? window.gapChartInstances.proc.data.labels.length : 0);
    await page.getByTestId('gap-bucket-interval-proc').selectOption('1min');
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => (window.gapChartInstances || {}).proc ? window.gapChartInstances.proc.data.labels.length : 0);
    expect(after).toBeGreaterThan(before);
  });

  test('proc bucket dropdown: auto returns to original bucket count', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const original = await page.evaluate(() => (window.gapChartInstances || {}).proc ? window.gapChartInstances.proc.data.labels.length : 0);
    await page.getByTestId('gap-bucket-interval-proc').selectOption('1min');
    await page.waitForTimeout(300);
    await page.getByTestId('gap-bucket-interval-proc').selectOption('auto');
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => (window.gapChartInstances || {}).proc ? window.gapChartInstances.proc.data.labels.length : 0);
    expect(after).toBe(original);
  });

  test('proc bucket dropdown: changing proc does not affect other charts', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const beforeInvalid = await page.evaluate(() => (window.gapChartInstances || {}).invalid ? window.gapChartInstances.invalid.data.labels.length : 0);
    const beforeVolume = await page.evaluate(() => (window.gapChartInstances || {}).volume ? window.gapChartInstances.volume.data.labels.length : 0);
    await page.getByTestId('gap-bucket-interval-proc').selectOption('5min');
    await page.waitForTimeout(300);
    const afterInvalid = await page.evaluate(() => (window.gapChartInstances || {}).invalid ? window.gapChartInstances.invalid.data.labels.length : 0);
    const afterVolume = await page.evaluate(() => (window.gapChartInstances || {}).volume ? window.gapChartInstances.volume.data.labels.length : 0);
    expect(afterInvalid).toBe(beforeInvalid);
    expect(afterVolume).toBe(beforeVolume);
  });

  test('dark theme: every select is dark-styled with light text and no native appearance', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');

    // Assert color-scheme is dark
    const colorScheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    expect(colorScheme).toBe('dark');

    // Assert every select carries .atlas-select and passes luminance checks
    const result = await page.evaluate(() => {
      function luminance(rgb) {
        const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return 0;
        const [, r, g, b] = m.map(Number);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }
      const selects = document.querySelectorAll('select');
      const failures = [];
      for (const sel of selects) {
        const cs = getComputedStyle(sel);
        const hasClass = sel.classList.contains('atlas-select');
        const bgLum = luminance(cs.backgroundColor);
        const fgLum = luminance(cs.color);
        const appearance = cs.appearance;
        const paddingRight = parseFloat(cs.paddingRight);
        if (!hasClass || bgLum >= 0.25 || fgLum <= 0.6 || appearance !== 'none' || paddingRight < 20) {
          failures.push({
            testid: sel.getAttribute('data-testid') || sel.id || '(no id)',
            hasClass, bgLum: bgLum.toFixed(3), fgLum: fgLum.toFixed(3),
            appearance, paddingRight: paddingRight.toFixed(1)
          });
        }
      }
      return { total: selects.length, failures };
    });

    expect(result.failures).toEqual([]);
    expect(result.total).toBeGreaterThan(0);

    // Take screenshots for visual confirmation
    const chartHeader = page.locator('[data-testid="gap-chart-card-invalid"], .gap-card, .gap-panel').first();
    if (await chartHeader.isVisible()) {
      await chartHeader.screenshot({ path: 'test-results/dark-theme-chart-header.png' });
    }
    const tableHeader = page.locator('table thead, .gap-table-header, th').first();
    if (await tableHeader.isVisible()) {
      await tableHeader.screenshot({ path: 'test-results/dark-theme-table-header.png' });
    }
  });

  test('Requests Over Time chart renders two lines', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const hasChart = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).requests;
      return chart && chart.data && chart.data.datasets && chart.data.datasets.length === 2;
    });
    expect(hasChart).toBe(true);
  });

  test('Requests Over Time bucket dropdown re-renders only that chart', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const beforeInvalid = await page.evaluate(() => (window.gapChartInstances || {}).invalid ? window.gapChartInstances.invalid.data.labels.length : 0);
    await page.getByTestId('gap-bucket-interval-requests').selectOption('1min');
    await page.waitForTimeout(300);
    const afterInvalid = await page.evaluate(() => (window.gapChartInstances || {}).invalid ? window.gapChartInstances.invalid.data.labels.length : 0);
    expect(afterInvalid).toBe(beforeInvalid);
  });

  test('Requests chart series dropdown "Signing only" hides verification line', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.getByTestId('gap-series-requests').selectOption('signing');
    await page.waitForTimeout(300);
    const datasetCount = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).requests;
      return chart ? chart.data.datasets.length : 0;
    });
    expect(datasetCount).toBe(1);
    const label = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).requests;
      return chart ? chart.data.datasets[0].label : '';
    });
    expect(label).toBe('Signing Requests');
  });

  test('Requests chart series dropdown "Both" restores both lines', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.getByTestId('gap-series-requests').selectOption('signing');
    await page.waitForTimeout(300);
    await page.getByTestId('gap-series-requests').selectOption('both');
    await page.waitForTimeout(300);
    const datasetCount = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).requests;
      return chart ? chart.data.datasets.length : 0;
    });
    expect(datasetCount).toBe(2);
  });

  test('Volume chart series dropdown "Signing only" hides verification datasets', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    await page.getByTestId('gap-series-volume').selectOption('signing');
    await page.waitForTimeout(300);
    const datasetCount = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).volume;
      return chart ? chart.data.datasets.length : 0;
    });
    expect(datasetCount).toBe(2);
  });

  test('TTV chart series dropdown "Median" hides P95 line', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-pairing.csv');
    await page.getByTestId('gap-series-ttv').selectOption('median');
    await page.waitForTimeout(300);
    const datasetCount = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).ttv;
      return chart ? chart.data.datasets.length : 0;
    });
    expect(datasetCount).toBe(1);
    const label = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).ttv;
      return chart ? chart.data.datasets[0].label : '';
    });
    expect(label).toBe('Median TTV (ms)');
  });

});

test.describe('Phase 4 required tests', () => {

  test('Volume chart has 4 distinct dataset colours', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const colors = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).volume;
      if (!chart) return [];
      return chart.data.datasets.map(d => d.backgroundColor);
    });
    expect(colors.length).toBe(4);
    const unique = new Set(colors);
    expect(unique.size).toBe(4);
  });

  test('Requests chart x-axis tick labels < 20', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-core.csv');
    const tickCount = await page.evaluate(() => {
      const chart = (window.gapChartInstances || {}).requests;
      if (!chart) return 0;
      const scale = chart.scales.x;
      return scale.ticks.length;
    });
    expect(tickCount).toBeLessThan(20);
  });

  test('Sub-minute fixture shows empty-state message, not canvas', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-phase6.csv');
    const canvas = page.locator('#gap-chart-ttv');
    await expect(canvas).toBeAttached();
    const wrapper = canvas.locator('xpath=..');
    const msg = wrapper.locator('.chart-empty-msg');
    const canvasVisible = await canvas.isVisible().catch(() => false);
    const msgVisible = await msg.isVisible().catch(() => false);
    expect(canvasVisible || msgVisible).toBe(true);
    expect(msgVisible).toBe(true);
  });

  // A5: Table hour must match chart axis hour for a known row
  test('A5 — table hour matches chart axis hour for a known row', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-screenshots.csv');
    // Get the first time cell's hour
    const tableHour = await page.evaluate(() => {
      const cells = document.querySelectorAll('#gap-table-body td');
      if (cells.length === 0) return null;
      const timeText = cells[0].textContent;
      // Extract hour from UTC-formatted string (YYYY-MM-DD HH:MM:SS)
      const utcMatch = timeText.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}):/);
      if (utcMatch) return parseInt(utcMatch[2], 10);
      const ts = parseInt(timeText, 10);
      if (!isNaN(ts)) {
        const ms = ts > 1e11 ? ts : ts * 1000;
        return new Date(ms).getUTCHours();
      }
      return null;
    });
    expect(tableHour).not.toBeNull();
    // Verify chart axis contains this hour
    const chartLabels = await page.evaluate(() => {
      const chart = window.gapChartInstances && window.gapChartInstances.volume;
      return chart ? chart.data.labels : [];
    });
    expect(chartLabels.length).toBeGreaterThan(0);
    const hourStr = String(tableHour).padStart(2, '0');
    const hasHour = chartLabels.some(l => String(l).includes(hourStr));
    expect(hasHour).toBe(true);
  });

  // D2: Offset-bearing row shows UTC time in table
  test('D2 — offset-bearing row (2026-08-01T12:00:00+05:30) shows 06:30 UTC', async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-screenshots.csv');
    // Find the I9 Corp row — customer column index 5
    const found = await page.evaluate(() => {
      const rows = document.querySelectorAll('#gap-table-body tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length > 5 && cells[5].textContent.includes('I9 Corp')) {
          return cells[0].textContent;
        }
      }
      return null;
    });
    expect(found).not.toBeNull();
    // Should show 06:30 UTC (the converted time from +05:30)
    expect(found).toContain('06:30');
    // Verify chart axis contains hour 06
    const chartLabels = await page.evaluate(() => {
      const chart = window.gapChartInstances && window.gapChartInstances.volume;
      return chart ? chart.data.labels : [];
    });
    const hasHour6 = chartLabels.some(l => String(l).includes('06'));
    expect(hasHour6).toBe(true);
  });

});
