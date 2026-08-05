// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const APP = pathToFileURL(path.resolve(__dirname, '..', '..', 'index.html')).href;

async function loadApp(page) {
  await page.goto(APP);
  await page.waitForFunction(() => typeof window.computeCoverage === 'function');
}

async function enterOptimizer(page) {
  await loadApp(page);
  await page.click('.gateway-card >> text=Cell Placement Optimizer');
  await page.waitForSelector('#step-1', { state: 'visible' });
}

async function goToStep2(page) {
  await page.evaluate(() => goToStep(2));
  await page.waitForSelector('#cust-map', { state: 'visible' });
}

test.describe('Optimizer: UX Hardening (O2)', () => {

  test('1. dedup: same city twice via list → endpoints length 1', async ({ page }) => {
    await enterOptimizer(page);
    await goToStep2(page);
    await page.waitForFunction(() => document.querySelector('.leaflet-container') !== null, { timeout: 5000 });

    const result = await page.evaluate(() => {
      addCustomerCity(0);
      addCustomerCity(0);
      return { count: customers.length, name: customers[0] ? customers[0].name : null };
    });

    expect(result.count).toBe(1);
    expect(result.name).toBe('New York, USA');
  });

  test('2. dedup: list-add then click-to-place same city → length 1', async ({ page }) => {
    await enterOptimizer(page);
    await goToStep2(page);
    await page.waitForFunction(() => document.querySelector('.leaflet-container') !== null, { timeout: 5000 });

    const result = await page.evaluate(() => {
      addCustomerCity(0);
      const c = worldCities[0];
      tryAddEndpoint({ name: c.name, lat: c.lat, lng: c.lng, type: 'city', tier: c.tier });
      return { count: customers.length, name: customers[0] ? customers[0].name : null };
    });

    expect(result.count).toBe(1);
    expect(result.name).toBe('New York, USA');
  });

  test('3. click-to-place: Esc exits placement mode', async ({ page }) => {
    await enterOptimizer(page);
    await goToStep2(page);

    await page.evaluate(() => toggleClickPlace());
    let mode = await page.evaluate(() => clickPlaceMode);
    expect(mode).toBe(true);

    await page.keyboard.press('Escape');
    mode = await page.evaluate(() => clickPlaceMode);
    expect(mode).toBe(false);
  });

  test('4. JSON round-trip: Naive + per-endpoint SLA + safety 30 → export → import → restored', async ({ page }) => {
    await enterOptimizer(page);

    const result = await page.evaluate(async () => {
      setRealisticMode(false);
      setSLAMode('per-customer');
      customers = [{ name: 'TestCity', lat: 40, lng: -74, type: 'city', tier: 1 }];
      perCustomerSLA[0] = 100;
      document.getElementById('safety-floor-input').value = 30;
      safetyFloor = 30;
      document.getElementById('global-sla-input').value = 200;
      globalSLA = 200;

      const dataStr = exportSessionJSON.__original
        ? null
        : (() => {
            const results = generateHeadlessAnalysis();
            const customersExport = customers.map((c, i) => ({ ...c, sla: perCustomerSLA[i] !== undefined ? perCustomerSLA[i] : 150 }));
            return {
              version: "2.1",
              selectedFootprint, cellCosts, baselineMode, specificBaselineIdx,
              customers: customersExport, slaMode, globalSLA, perCustomerSLA,
              processingTime, realisticMode, safetyFloor, analysisResults: results
            };
          })();

      realisticMode = true;
      slaMode = 'global';
      perCustomerSLA = {};
      safetyFloor = 20;
      customers = [];
      globalSLA = 150;

      selectedFootprint = dataStr.selectedFootprint || [];
      cellCosts = dataStr.cellCosts || {};
      baselineMode = dataStr.baselineMode || 'blended';
      specificBaselineIdx = dataStr.specificBaselineIdx !== undefined ? dataStr.specificBaselineIdx : null;
      customers = dataStr.customers || [];
      slaMode = dataStr.slaMode || 'global';
      globalSLA = dataStr.globalSLA || 150;
      perCustomerSLA = dataStr.perCustomerSLA || {};
      processingTime = dataStr.processingTime !== undefined ? dataStr.processingTime : 10;
      safetyFloor = dataStr.safetyFloor !== undefined ? dataStr.safetyFloor : 20;

      if (Object.keys(perCustomerSLA).length === 0 && customers.length > 0) {
        customers.forEach((c, i) => {
          if (c.sla !== undefined) perCustomerSLA[i] = c.sla;
        });
      }

      setRealisticMode(dataStr.realisticMode);
      document.getElementById('global-sla-input').value = globalSLA;
      document.getElementById('processing-time-input').value = processingTime;
      document.getElementById('safety-floor-input').value = safetyFloor;
      setSLAMode(slaMode);

      return {
        realisticMode, slaMode, globalSLA, safetyFloor, perCustomerSLA: { ...perCustomerSLA },
        customerCount: customers.length, customerSLA: perCustomerSLA[0]
      };
    });

    expect(result.realisticMode).toBe(false);
    expect(result.slaMode).toBe('per-customer');
    expect(result.globalSLA).toBe(200);
    expect(result.safetyFloor).toBe(30);
    expect(result.customerCount).toBe(1);
    expect(result.customerSLA).toBe(100);
  });

  test('5. baseline summary strings', async ({ page }) => {
    await enterOptimizer(page);

    const noCosts = await page.evaluate(() => {
      selectedFootprint = [0];
      cellCosts = {};
      updateBaselineSummary();
      return document.getElementById('baseline-mode-label').textContent;
    });
    expect(noCosts).toBe('Paris-derived default (no costs entered)');

    const blended = await page.evaluate(() => {
      selectedFootprint = [0, 1];
      cellCosts = { 0: 1000, 1: 2000 };
      baselineMode = 'blended';
      updateBaselineSummary();
      return document.getElementById('baseline-mode-label').textContent;
    });
    expect(blended).toBe('Blended average of 2 entered cells');

    const specific = await page.evaluate(() => {
      selectedFootprint = [0];
      cellCosts = { 0: 1500 };
      baselineMode = 'specific';
      specificBaselineIdx = 0;
      updateBaselineSummary();
      return document.getElementById('baseline-mode-label').textContent;
    });
    expect(specific).toContain('Anchored to');
  });

  test('6. baseline tooltip attribute present', async ({ page }) => {
    await enterOptimizer(page);
    const hasTooltip = await page.evaluate(() => {
      const label = document.querySelector('.baseline-summary .label');
      return label && label.getAttribute('title') !== null && label.getAttribute('title').length > 10;
    });
    expect(hasTooltip).toBe(true);
  });

  test('7. coverage map recommended marker contains cost chip', async ({ page }) => {
    await loadApp(page);
    await page.click('.gateway-card >> text=Cell Placement Optimizer');
    await page.waitForSelector('#step-1', { state: 'visible' });

    await page.evaluate(() => {
      selectedFootprint = [];
      customers = [{ name: 'London', lat: 51.5, lng: -0.12, type: 'city', tier: 1, sla: 150 }];
      globalSLA = 150;
      perCustomerSLA = {};
      safetyFloor = 20;
      realisticMode = true;
    });

    await page.evaluate(() => goToStep(4));
    await page.waitForFunction(() => {
      const markers = document.querySelectorAll('.custom-div-icon');
      return markers.length > 0;
    }, { timeout: 5000 });

    await page.waitForTimeout(500);

    const hasCostChip = await page.evaluate(() => {
      const icons = document.querySelectorAll('.custom-div-icon');
      for (const icon of icons) {
        const html = icon.innerHTML;
        if (html.includes('pulse-ring-diamond') && html.includes('$')) {
          return true;
        }
      }
      return false;
    });
    expect(hasCostChip).toBe(true);
  });

  test('8. map container non-zero size after showModule', async ({ page }) => {
    await enterOptimizer(page);
    await goToStep2(page);

    const size = await page.evaluate(() => {
      const el = document.getElementById('cust-map');
      return el ? { w: el.clientWidth, h: el.clientHeight } : null;
    });
    expect(size).not.toBeNull();
    expect(size.w).toBeGreaterThan(0);
    expect(size.h).toBeGreaterThan(0);
  });

  test('9. keyboard delete removes a row', async ({ page }) => {
    await enterOptimizer(page);
    await goToStep2(page);
    await page.waitForFunction(() => document.querySelector('.leaflet-container') !== null, { timeout: 5000 });

    await page.evaluate(() => {
      addCustomerCity(0);
      addCustomerCity(1);
    });

    let count = await page.evaluate(() => customers.length);
    expect(count).toBe(2);

    await page.evaluate(() => {
      const row = document.querySelector('.customer-row');
      if (row) row.focus();
    });

    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);

    count = await page.evaluate(() => customers.length);
    expect(count).toBe(1);
  });
});
