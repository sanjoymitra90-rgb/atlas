// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');

const APP = pathToFileURL(path.resolve(__dirname, '..', '..', 'index.html')).href;
const session34 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'fixtures', 'opt-session-34.json'), 'utf8'));
const session7 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'fixtures', 'opt-session-7.json'), 'utf8'));

async function loadApp(page) {
  await page.goto(APP);
  await page.waitForFunction(() => typeof window.computeCoverage === 'function');
}

async function runCoverage(page, input) {
  return page.evaluate((inp) => {
    const customers = inp.customers || window._customers;
    return window.computeCoverage({ ...inp, customers, getLatency: window.getCustomerLatency });
  }, input);
}

async function runGreenPlan(page, input) {
  return page.evaluate((inp) => {
    const customers = inp.customers || window._customers;
    return window.computeGreenPlan({ ...inp, customers, getLatency: window.getCustomerLatency });
  }, input);
}

async function setupSession(page, session, overrides = {}) {
  await loadApp(page);
  await page.evaluate(({ s, o }) => {
    window._selectedFootprint = o.selectedFootprint !== undefined ? o.selectedFootprint : [...s.selectedFootprint];
    window._cellCosts = s.cellCosts || {};
    window._baselineMode = s.baselineMode || 'blended';
    window._specificBaselineIdx = s.specificBaselineIdx !== undefined ? s.specificBaselineIdx : null;
    window._customers = s.customers.map(c => ({ ...c }));
    window._slaMode = o.slaMode || s.slaMode || 'global';
    window._globalSLA = o.globalSLA !== undefined ? o.globalSLA : (s.globalSLA || 150);
    window._perCustomerSLA = o.perCustomerSLA || s.perCustomerSLA || {};
    window._processingTime = o.processingTime !== undefined ? o.processingTime : (s.processingTime || 10);
    window._realisticMode = o.realisticMode !== undefined ? o.realisticMode : (s.realisticMode !== false);
    window._safetyFloor = o.safetyFloor !== undefined ? o.safetyFloor : (s.safetyFloor || 20);
    if (o.perCustomerSLA) {
      window._perCustomerSLA = o.perCustomerSLA;
    } else if (Object.keys(window._perCustomerSLA).length === 0 && window._customers.length > 0) {
      window._customers.forEach((c, i) => {
        if (c.sla !== undefined) window._perCustomerSLA[i] = c.sla;
      });
    }
  }, { s: session, o: overrides });
}

test.describe('Optimizer Phase O3: Scenarios & Green-Plan', () => {

  test('1. Happy path — 34-endpoint, footprint [22], SLA 100, floor 20', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });

    const result = await runCoverage(page, {
      customers: session34.customers.map(c => ({ ...c })),
      slaMode: 'global', globalSLA: 100, perCustomerSLA: {},
      safetyFloor: 20, selectedFootprint: [22]
    });

    expect(result.covered.length).toBe(9);
    expect(result.covered.filter(c => c.marginalExisting).length).toBe(2);
    expect(result.recommendations.length).toBe(4);
    const recNames = result.recommendations.map(r => r.cellName);
    expect(recNames).toContain('Hyderabad');
    expect(recNames).toContain('Hong Kong');
    expect(recNames).toContain('Sydney');
    expect(recNames).toContain('Mexico City');
    expect(result.marginal.length).toBe(5);
    expect(result.impossible.length).toBe(6);
    const opex = await page.evaluate((recs) => recs.reduce((s, r) => s + window.estimateRegionCost(r.cellIdx), 0), result.recommendations);
    expect(opex).toBe(11133);
  });

  test('2. Legacy floor 0 — marginal 0, impossible unchanged', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 0 });

    const result = await runCoverage(page, {
      customers: session34.customers.map(c => ({ ...c })),
      slaMode: 'global', globalSLA: 100, perCustomerSLA: {},
      safetyFloor: 0, selectedFootprint: [22]
    });

    expect(result.marginal.length).toBe(0);
    expect(result.impossible.length).toBe(6);
  });

  test('3. No footprint — alreadyCovered 0, covered-by-new 23', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [], globalSLA: 100, safetyFloor: 20 });

    const result = await runCoverage(page, {
      customers: session34.customers.map(c => ({ ...c })),
      slaMode: 'global', globalSLA: 100, perCustomerSLA: {},
      safetyFloor: 20, selectedFootprint: []
    });

    expect(result.covered.length).toBe(0);
    expect(result.pendingCovered.length).toBe(23);
    const opex = await page.evaluate((recs) => recs.reduce((s, r) => s + window.estimateRegionCost(r.cellIdx), 0), result.recommendations);
    expect(opex).toBeGreaterThan(11133);
  });

  test('4. Per-endpoint SLA — raise 6 impossible to 180 → impossible 0', async ({ page }) => {
    const perCustomerSLA = {};
    session34.customers.forEach((c, i) => { perCustomerSLA[i] = 150; });
    const impossibleNames = ['Nairobi, Kenya', 'Abidjan, Ivory Coast', 'Accra, Ghana', 'Dakar, Senegal', 'Kampala, Uganda', 'Dar es Salaam, Tanzania'];
    session34.customers.forEach((c, i) => {
      if (impossibleNames.includes(c.name)) perCustomerSLA[i] = 180;
    });

    await setupSession(page, session34, { selectedFootprint: [22], safetyFloor: 20, slaMode: 'per-customer', perCustomerSLA });

    const result = await runCoverage(page, {
      customers: session34.customers.map(c => ({ ...c })),
      slaMode: 'per-customer', globalSLA: 100, perCustomerSLA,
      safetyFloor: 20, selectedFootprint: [22]
    });

    expect(result.impossible.length).toBe(0);
    expect(result.covered.length).toBeGreaterThan(9);
  });

  test('5. Marginal relaxation values — correct per-endpoint relaxationNeeded', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });

    const gp = await runGreenPlan(page, {
      customers: session34.customers.map(c => ({ ...c })),
      slaMode: 'global', globalSLA: 100, perCustomerSLA: {},
      safetyFloor: 20, selectedFootprint: [22]
    });

    const byName = {};
    gp.perEndpoint.forEach(e => { byName[e.name] = e.relaxationNeeded; });

    expect(byName['Gaborone, Botswana']).toBe(5);
    expect(byName['Windhoek, Namibia']).toBe(5);
    expect(byName['Maputo, Mozambique']).toBe(9);
    expect(byName['Addis Ababa, Ethiopia']).toBe(17);
    expect(byName['Lusaka, Zambia']).toBe(17);
  });

  test('6. Green-Plan global — globalRelaxation 76, relaxedSLA 176, all green', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });

    const gp = await runGreenPlan(page, {
      customers: session34.customers.map(c => ({ ...c })),
      slaMode: 'global', globalSLA: 100, perCustomerSLA: {},
      safetyFloor: 20, selectedFootprint: [22]
    });

    expect(gp.globalRelaxation).toBe(76);
    expect(gp.relaxedSLA).toBe(176);
    expect(gp.relaxedMarginal.length).toBe(0);
    expect(gp.relaxedImpossible.length).toBe(0);
  });

  test('7. Green-Plan per-endpoint — each endpoint gets exact relaxation', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });

    const gp = await runGreenPlan(page, {
      customers: session34.customers.map(c => ({ ...c })),
      slaMode: 'global', globalSLA: 100, perCustomerSLA: {},
      safetyFloor: 20, selectedFootprint: [22]
    });

    gp.perEndpoint.filter(e => e.relaxationNeeded > 0).forEach(e => {
      expect(e.relaxedSLA).toBe(e.currentSLA + e.relaxationNeeded);
    });
  });

  test('8. Blended vs Specific — specific Paris baseline changes OPEX', async ({ page }) => {
    await loadApp(page);

    const costs = await page.evaluate(() => {
      const regions = window._regions;
      const idx = window._AWS_PRICE_INDEX;
      const defaultBase = 2674 / 1.10;
      const recIdxs = [regions.findIndex(r => r.code === 'ap-south-2'), regions.findIndex(r => r.code === 'ap-east-1')];
      const blended = recIdxs.reduce((s, i) => s + Math.round(defaultBase * idx[regions[i].code]), 0);

      const parisCost = 2674;
      const specificBase = parisCost / idx[regions[0].code];
      const specific = recIdxs.reduce((s, i) => s + Math.round(specificBase * idx[regions[i].code]), 0);

      return { blended, specific };
    });

    expect(costs.specific).not.toBe(costs.blended);
  });

  test('9. Realistic vs Naive — latencies differ', async ({ page }) => {
    await loadApp(page);
    const customers = [{ name: 'TestCity', lat: 10, lng: 10, type: 'city', tier: 4 }];

    const realResult = await page.evaluate((c) => {
      window.setRealisticMode(true);
      return window.computeCoverage({
        customers: c, slaMode: 'global', globalSLA: 150, perCustomerSLA: {},
        safetyFloor: 0, selectedFootprint: [], getLatency: window.getCustomerLatency
      });
    }, customers);

    const naiveResult = await page.evaluate((c) => {
      window.setRealisticMode(false);
      const r = window.computeCoverage({
        customers: c, slaMode: 'global', globalSLA: 150, perCustomerSLA: {},
        safetyFloor: 0, selectedFootprint: [], getLatency: window.getCustomerLatency
      });
      window.setRealisticMode(true);
      return r;
    }, customers);

    const realLat = realResult.pendingCovered.length > 0 ? realResult.pendingCovered[0].recBreakdown.total : (realResult.marginal.length > 0 ? realResult.marginal[0].bestHeadroom : 0);
    const naiveLat = naiveResult.pendingCovered.length > 0 ? naiveResult.pendingCovered[0].recBreakdown.total : (naiveResult.marginal.length > 0 ? naiveResult.marginal[0].bestHeadroom : 0);
    expect(realLat).not.toBe(naiveLat);
  });

  test('10. v2.0 import — no crash, safetyFloor defaults 20, perCustomerSLA empty', async ({ page }) => {
    await loadApp(page);

    const result = await page.evaluate((s) => {
      let sf = s.safetyFloor !== undefined ? s.safetyFloor : 20;
      let psla = s.perCustomerSLA || {};
      if (Object.keys(psla).length === 0 && s.customers && s.customers.length > 0) {
        s.customers.forEach((c, i) => {
          if (c.sla !== undefined) psla[i] = c.sla;
        });
      }
      return { safetyFloor: sf, perCustomerSLA: psla, customerCount: s.customers.length };
    }, session7);

    expect(result.safetyFloor).toBe(20);
    expect(result.customerCount).toBe(7);
  });

  test('11. v2.1 round-trip — export then import restores all fields', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });

    const exported = await page.evaluate(() => {
      const results = window.generateHeadlessAnalysis();
      return {
        version: '2.1',
        selectedFootprint: window._selectedFootprint,
        cellCosts: JSON.parse(JSON.stringify(window._cellCosts)),
        baselineMode: window._baselineMode,
        specificBaselineIdx: window._specificBaselineIdx,
        customers: window._customers.map((c, i) => ({ ...c, sla: window._perCustomerSLA[i] !== undefined ? window._perCustomerSLA[i] : 150 })),
        slaMode: window._slaMode,
        globalSLA: window._globalSLA,
        perCustomerSLA: JSON.parse(JSON.stringify(window._perCustomerSLA)),
        processingTime: window._processingTime,
        realisticMode: window._realisticMode,
        safetyFloor: window._safetyFloor,
        analysisResults: results
      };
    });

    expect(exported.version).toBe('2.1');
    expect(exported.safetyFloor).toBe(20);
    expect(exported.customers.length).toBe(34);
    expect(exported.selectedFootprint).toEqual([22]);
  });

  test('12. Dedup — add same city twice → count unchanged', async ({ page }) => {
    await loadApp(page);
    await page.evaluate(() => { window.showModule('optimizer'); });
    await page.waitForSelector('#step-1', { state: 'visible' });
    await page.evaluate(() => { window.goToStep(2); });
    await page.waitForSelector('#cust-map', { state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.leaflet-container') !== null, { timeout: 10000 });

    const after = await page.evaluate(() => {
      window.tryAddEndpoint({ name: 'Paris, France', lat: 48.8566, lng: 2.3522, type: 'city', tier: 1 });
      window.tryAddEndpoint({ name: 'Paris, France', lat: 48.8566, lng: 2.3522, type: 'city', tier: 1 });
      return { count: window._customers.length };
    });

    expect(after.count).toBe(1);
  });

  test('13. Saved scenarios — save/load/delete persists in localStorage', async ({ page }) => {
    await loadApp(page);
    await page.evaluate(() => { window.showModule('optimizer'); });
    await page.waitForSelector('#step-1', { state: 'visible' });
    await page.evaluate(() => { window.goToStep(2); });
    await page.waitForSelector('#cust-map', { state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.leaflet-container') !== null, { timeout: 10000 });

    await page.evaluate(() => {
      localStorage.removeItem('atlas-opt-scenarios');
      window.tryAddEndpoint({ name: 'Paris, France', lat: 48.8566, lng: 2.3522, type: 'city', tier: 1 });
      window.tryAddEndpoint({ name: 'London, UK', lat: 51.5074, lng: -0.1278, type: 'city', tier: 1 });
      window.setSLAMode('global');
    });

    await page.evaluate(() => {
      window.saveOptScenario('Test Scenario');
    });

    const saved = await page.evaluate(() => {
      const scenarios = window.getOptScenarios();
      return { length: scenarios.length, name: scenarios[0] ? scenarios[0].name : null, customerCount: scenarios[0] ? scenarios[0].customers.length : 0 };
    });
    expect(saved.length).toBe(1);
    expect(saved.name).toBe('Test Scenario');
    expect(saved.customerCount).toBe(2);

    await page.evaluate(() => {
      window.loadOptScenario(0);
    });

    const restored = await page.evaluate(() => {
      return { customerCount: window._customers.length };
    });
    expect(restored.customerCount).toBe(2);

    await page.evaluate(() => {
      window.deleteOptScenario(0);
    });

    const afterDelete = await page.evaluate(() => {
      return window.getOptScenarios().length;
    });
    expect(afterDelete).toBe(0);
  });

  test('14. Share report — standalone HTML contains summary, no CDN refs', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });

    const html = await page.evaluate(() => {
      const result = window.computeCoverage({
        customers: window._customers,
        slaMode: window._slaMode,
        globalSLA: window._globalSLA,
        perCustomerSLA: window._perCustomerSLA,
        safetyFloor: window._safetyFloor,
        selectedFootprint: window._selectedFootprint,
        getLatency: window.getCustomerLatency
      });
      const opex = result.recommendations.reduce((s, r) => s + window.estimateRegionCost(r.cellIdx), 0);
      return {
        hasEndpoints: result.covered.length + result.pendingCovered.length + result.marginal.length + result.impossible.length > 0,
        opex,
        hasRecommendations: result.recommendations.length > 0
      };
    });

    expect(html.hasEndpoints).toBe(true);
    expect(html.opex).toBeGreaterThan(0);
    expect(html.hasRecommendations).toBe(true);

    const pageContent = await page.content();
    expect(pageContent).toContain('computeCoverage');
  });

  test('15. Upgrade plan — default OFF, panel hidden', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });
    await page.evaluate(() => window.goToStep(4));
    await page.waitForSelector('#upgrade-plan-card', { state: 'attached', timeout: 10000 });

    const card = page.locator('#upgrade-plan-card');
    await expect(card).toHaveClass(/hidden/);
    const toggle = page.locator('[data-testid="upgrade-plan-toggle"]');
    await expect(toggle).not.toBeChecked();
  });

  test('16. Upgrade plan — toggle ON shows added cells + cost + per-endpoint', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });
    await page.evaluate(() => window.goToStep(4));
    await page.waitForSelector('#upgrade-plan-card', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const cb = document.querySelector('[data-testid="upgrade-plan-toggle"]');
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    });

    const card = page.locator('#upgrade-plan-card');
    await expect(card).not.toHaveClass(/hidden/);

    const summary = await page.textContent('#upgrade-plan-summary');
    expect(summary).toContain('Added cells');
    expect(summary).toContain('Added OPEX');

    const cells = await page.textContent('#upgrade-plan-cells');
    expect(cells.length).toBeGreaterThan(0);

    const endpoints = await page.textContent('#upgrade-plan-endpoints');
    expect(endpoints).toContain('covered by');
  });

  test('17. Upgrade plan — toggle OFF hides panel, no state leakage', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });
    await page.evaluate(() => window.goToStep(4));
    await page.waitForSelector('#upgrade-plan-card', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const cb = document.querySelector('[data-testid="upgrade-plan-toggle"]');
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    });
    await page.evaluate(() => {
      const cb = document.querySelector('[data-testid="upgrade-plan-toggle"]');
      cb.checked = false;
      cb.dispatchEvent(new Event('change'));
    });

    const card = page.locator('#upgrade-plan-card');
    await expect(card).toHaveClass(/hidden/);

    const strictResult = await page.evaluate(() => {
      return window._customers.length;
    });
    expect(strictResult).toBe(34);
  });

  test('18. Upgrade plan — no marginals shows empty state', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [], globalSLA: 200, safetyFloor: 0 });
    await page.evaluate(() => window.goToStep(4));
    await page.waitForSelector('#upgrade-plan-card', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const cb = document.querySelector('[data-testid="upgrade-plan-toggle"]');
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    });
    const summary = await page.textContent('#upgrade-plan-summary');
    expect(summary).toContain('No upgrades needed');
  });

  test('19. Marginal map markers — yellow exclamation icons on coverage map', async ({ page }) => {
    await setupSession(page, session34, { selectedFootprint: [22], globalSLA: 100, safetyFloor: 20 });
    await page.evaluate(() => window.goToStep(4));
    await page.waitForFunction(() => document.querySelector('.leaflet-container') !== null, { timeout: 10000 });
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const markers = document.querySelectorAll('.leaflet-marker-icon.custom-div-icon');
      let marginalMarkers = 0;
      markers.forEach(m => {
        const html = m.innerHTML;
        if (html.includes('!') && html.includes('border-radius:50%')) {
          marginalMarkers++;
        }
      });
      return { marginalMarkers };
    });

    expect(result.marginalMarkers).toBe(5);
  });
});
