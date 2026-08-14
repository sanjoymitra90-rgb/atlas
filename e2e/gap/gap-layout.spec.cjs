const { test, expect } = require('@playwright/test');
const { openGapAnalyzer, uploadAndAnalyze } = require('../_helpers.cjs');

test.describe('Gap Analyzer — Phase 4 (layout + pair legibility)', () => {
  test.beforeEach(async ({ page }) => {
    await openGapAnalyzer(page);
    await uploadAndAnalyze(page, 'gap-pairing.csv');
  });

  test('workspace is widened (>= 1320px at 1440 viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const w = await page.getByTestId('gap-workspace').evaluate(el => el.getBoundingClientRect().width);
    expect(w).toBeGreaterThanOrEqual(1320);
  });

  test('time-to-verify tile explains itself', async ({ page }) => {
    const t = await page.getByTestId('gap-pair-ttv').getAttribute('title');
    expect(t || '').toMatch(/calibrat/i);
  });

  test('Idea A — paired pills carry a pair ID, orphans do not', async ({ page }) => {
    const pairedIds = await page.locator('[data-pair-id]').allTextContents();
    expect(pairedIds.length).toBe(6);
    pairedIds.forEach(t => expect(t).toMatch(/P\d+\s*·\s*Paired/));
    await expect(page.locator('[data-pair-status="unverified"]')).toHaveCount(2);
    await expect(page.locator('[data-pair-status="unverified"][data-pair-id]')).toHaveCount(0);
  });

  test('Group-by-pair switch: track visible, knob slides on toggle', async ({ page }) => {
    const input = page.getByTestId('gap-group-toggle');
    const track = page.locator('.gap-switch-track');
    await expect(track).toBeVisible();
    await expect(input).toHaveAttribute('class', /gap-switch-input/);
    // Before toggle: knob at default position
    const beforeTransform = await track.evaluate(el => getComputedStyle(el, '::after').transform);
    // Click track to toggle on
    await track.click();
    await expect(input).toBeChecked();
    const afterTransform = await track.evaluate(el => getComputedStyle(el, '::after').transform);
    expect(afterTransform).not.toBe(beforeTransform);
    // Click again to toggle off
    await track.click();
    await expect(input).not.toBeChecked();
  });

  test('Idea C — grouping yields 9 contiguous groups (3 pairs + 6 orphans)', async ({ page }) => {
    await page.locator('.gap-switch-track').click();
    const groups = await page.locator('[data-testid="gap-table"] tbody tr[data-pair-group]')
      .evaluateAll(rows => {
        const seq = rows.map(r => r.getAttribute('data-pair-group'));
        const out = [];
        seq.forEach(k => { if (out.length && out[out.length-1].key === k) out[out.length-1].size++; else out.push({key:k,size:1}); });
        return out;
      });
    expect(groups.length).toBe(9);
    const pairGroups = groups.filter(g => g.key.startsWith('g-P'));
    const orphanGroups = groups.filter(g => g.key.startsWith('g-o-'));
    expect(pairGroups.length).toBe(3);
    expect(pairGroups.every(g => g.size === 2)).toBe(true);
    expect(orphanGroups.length).toBe(6);
    expect(orphanGroups.every(g => g.size === 1)).toBe(true);
  });

  test('page-size label switches to "Groups per page" when grouped', async ({ page }) => {
    const label = page.getByTestId('gap-pagesize-label');
    await expect(label).toHaveText('Rows per page:');
    await page.locator('.gap-switch-track').click();
    await expect(label).toHaveText('Groups per page:');
    const title = await label.getAttribute('title');
    expect(title || '').toMatch(/group is one call/i);
    // Uncheck — reverts
    await page.locator('.gap-switch-track').click();
    await expect(label).toHaveText('Rows per page:');
    expect(await label.getAttribute('title')).toBe('');
  });

  test('Idea C — grouped + sorted by Proc Time keeps groups monotonic by representative', async ({ page }) => {
    await page.locator('.gap-switch-track').click();
    await page.locator('[data-testid="gap-table"] thead th', { hasText: 'Proc. Time' }).click();
    const reps = await page.locator('[data-testid="gap-table"] tbody tr[data-pair-group]')
      .evaluateAll(rows => {
        const byGroup = {};
        const order = [];
        rows.forEach(r => {
          const k = r.getAttribute('data-pair-group');
          if (!byGroup[k]) { byGroup[k] = []; order.push(k); }
          byGroup[k].push(r);
        });
        return order.map(k => {
          const g = byGroup[k];
          const rep = g.find(r => /signing/i.test(r.children[1]?.textContent || '')) || g[0];
          const procTime = parseInt((rep.children[7]?.textContent || '0').replace(/\D/g,''), 10);
          const timeCell = rep.children[0];
          const hasInvalidTimestamp = !!(timeCell && timeCell.querySelector('.fa-exclamation-triangle'));
          return { procTime, hasInvalidTimestamp };
        });
      });
    const validReps = reps.filter(r => !r.hasInvalidTimestamp);
    const invalidCount = reps.filter(r => r.hasInvalidTimestamp).length;
    // Invalid-timestamp groups must be at the bottom (invariant 8: timeValid sorts last)
    // Guard: slice(-0) returns the whole array, so only assert when there are invalid rows
    if (invalidCount > 0) {
      expect(reps.slice(-invalidCount).every(r => r.hasInvalidTimestamp)).toBe(true);
    }
    // Valid-timestamp groups must be monotonic by representative proc time
    const asc = validReps.every((v,i) => i===0 || validReps[i-1].procTime <= v.procTime);
    const desc = validReps.every((v,i) => i===0 || validReps[i-1].procTime >= v.procTime);
    expect(asc || desc).toBe(true);
  });

  test('Idea B — hovering a paired row highlights its partner', async ({ page }) => {
    const firstPill = page.locator('[data-pair-id]').first();
    const id = await firstPill.getAttribute('data-pair-id');
    const row = firstPill.locator('xpath=ancestor::tr');
    await row.hover();
    await page.waitForTimeout(200);
    const highlighted = page.locator(`tr.gap-pair-highlight [data-pair-id="${id}"]`);
    await expect(highlighted).toHaveCount(1);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    await expect(page.locator('tr.gap-pair-highlight')).toHaveCount(0);
    await expect(page.locator('tr.gap-pair-dim')).toHaveCount(0);
  });

  test('Banding: no spines, alt-zebra alternates, 9 groups with correct sizes', async ({ page }) => {
    await page.locator('.gap-switch-track').click();
    const results = await page.locator('[data-testid="gap-table"] tbody tr[data-pair-group]').evaluateAll(rows => {
      const out = [];
      rows.forEach(r => {
        const hasAlt = r.classList.contains('gap-group-alt');
        const hasSeam = r.classList.contains('gap-group-seam');
        const groupKey = r.getAttribute('data-pair-group') || '';
        const inlineBorder = r.style.borderLeftColor;
        out.push({ hasAlt, hasSeam, groupKey, inlineBorder });
      });
      return out;
    });
    // 1. No row has an inline border-left-color (spines removed)
    results.forEach(r => expect(r.inlineBorder || '').toBe(''));
    // 2. gap-group-alt alternates between consecutive groups
    const groupKeys = [];
    results.forEach(r => {
      if (groupKeys.length === 0 || groupKeys[groupKeys.length-1] !== r.groupKey) groupKeys.push(r.groupKey);
    });
    const altByGroup = {};
    results.forEach(r => {
      if (!(r.groupKey in altByGroup)) altByGroup[r.groupKey] = r.hasAlt;
    });
    const altVals = groupKeys.map(gk => altByGroup[gk]);
    for (let i = 1; i < altVals.length; i++) {
      expect(altVals[i]).not.toBe(altVals[i-1]);
    }
    // 3. 9 groups with correct sizes
    const groupSizes = {};
    results.forEach(r => { groupSizes[r.groupKey] = (groupSizes[r.groupKey] || 0) + 1; });
    expect(Object.keys(groupSizes).length).toBe(9);
    const pairGroups = Object.entries(groupSizes).filter(([k]) => k.startsWith('g-P'));
    const orphanGroups = Object.entries(groupSizes).filter(([k]) => k.startsWith('g-o-'));
    expect(pairGroups.length).toBe(3);
    expect(pairGroups.every(([,s]) => s === 2)).toBe(true);
    expect(orphanGroups.length).toBe(6);
    expect(orphanGroups.every(([,s]) => s === 1)).toBe(true);
  });

});
