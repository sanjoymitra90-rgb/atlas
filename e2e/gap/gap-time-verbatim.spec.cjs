const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze, expandGapFilters } = require('../_helpers.cjs');

async function filterByCustomer(page, customer) {
  await expandGapFilters(page);
  await page.selectOption('#gap-filter-customer', customer);
  await page.waitForTimeout(400);
}

async function firstTimeCell(page) {
  return page.evaluate(() => {
    const tr = [...document.querySelectorAll('#gap-table-body tr')].find(
      r => !r.classList.contains('gap-pair-summary') && r.querySelector('td')
    );
    if (!tr) return null;
    const td = tr.querySelector('td');
    const span = td.querySelector('span');
    return {
      text: td.textContent.trim(),
      title: span ? span.getAttribute('title') : null,
      hasImg: td.querySelector('img, script, iframe') !== null
    };
  });
}

function expectVerbatim(cell, source) {
  expect(cell).not.toBeNull();
  expect(cell.text).toBe(source);
  expect(cell.title).toBeNull();
  expect(cell.hasImg).toBe(false);
}

function expectConverted(cell, source) {
  expect(cell).not.toBeNull();
  expect(cell.title).toBe('source: ' + source);
  expect(cell.hasImg).toBe(false);
}

for (const mode of ['grouped', 'flat']) {
  test.describe(`Phase 5A — Task H: Time column verbatim rule (${mode})`, () => {
    test.beforeEach(async ({ page }) => {
      await openGapAnalyzer(page);
      await uploadAndAnalyze(page, 'gap-screenshots.csv');
      if (mode === 'grouped') {
        await page.locator('.gap-switch-track').click();
        await page.waitForTimeout(300);
      }
    });

    test('Z-suffixed row renders the source verbatim with no tooltip', async ({ page }) => {
      await filterByCustomer(page, 'Acme Ltd');
      const cell = await firstTimeCell(page);
      expectVerbatim(cell, '2026-08-01T09:00:10Z');
    });

    test('offset-less row renders the source verbatim with no tooltip', async ({ page }) => {
      await filterByCustomer(page, 'J10 Ltd');
      const cell = await firstTimeCell(page);
      expectVerbatim(cell, '2026-08-01T12:05:00');
    });

    test('offset-bearing row converts to UTC and carries a source tooltip', async ({ page }) => {
      await filterByCustomer(page, 'I9 Corp');
      const cell = await firstTimeCell(page);
      expectConverted(cell, '2026-08-01T12:00:00+05:30');
      expect(cell.text).toContain('06:30');
      expect(cell.text).not.toContain('12:00');
    });

    test('epoch row converts to UTC and carries a source tooltip', async ({ page }) => {
      await filterByCustomer(page, 'K11 SA');
      const cell = await firstTimeCell(page);
      expectConverted(cell, '1785586200');
      expect(cell.text).toContain('2026-08-01 12:10:00');
    });
  });
}

for (const mode of ['grouped', 'flat']) {
  test.describe(`Phase 5A — Task H: XSS stays escaped (${mode})`, () => {
    test('XSS fixture time value stays escaped (verbatim or tooltip)', async ({ page }) => {
      await openGapAnalyzer(page);
      await uploadAndAnalyze(page, 'gap-xss-time.csv');
      if (mode === 'grouped') {
        await page.locator('.gap-switch-track').click();
        await page.waitForTimeout(300);
      }
      const result = await page.evaluate(() => {
        const cells = document.querySelectorAll('#gap-table-body td');
        if (cells.length === 0) return { error: 'no cells found' };
        const timeCell = cells[0];
        const span = timeCell.querySelector('span');
        return {
          hasElement: timeCell.querySelector('img, script, iframe') !== null,
          text: timeCell.textContent,
          tooltip: span ? span.getAttribute('title') : null,
        };
      });
      expect(result.hasElement).toBe(false);
      // The non-ISO XSS value parses via new Date() (local-time, documented), so
      // on a UTC runner it matches the source-as-UTC instant and renders verbatim
      // as escaped text; on other runners it converts to UTC with a source tooltip.
      if (result.tooltip === null) {
        expect(result.text).toContain('Jan 1 2025');
      } else {
        expect(result.text).not.toContain('<img');
        expect(result.tooltip).toContain('source:');
        expect(result.tooltip).toContain('<img');
      }
      const serialized = await page.evaluate(() => {
        const td = document.querySelector('#gap-table-body tr td');
        return td ? td.innerHTML : null;
      });
      expect(serialized).toContain('&lt;img');
      expect(serialized).not.toContain('<img');
    });
  });
}