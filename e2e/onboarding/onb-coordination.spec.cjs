// @ts-check
const { test, expect } = require('@playwright/test');
const { APP_URL } = require('../app-url.cjs');

test.describe('Phase 5A — Task A: coordination task is selected by stable id, not display name', () => {
  test('t9 is the coordination task in all three tier templates', async ({ page }) => {
    await page.goto(APP_URL);
    const result = await page.evaluate(() => {
      const names = [1, 2, 3].map(scope => {
        const t9 = getDefaultTemplate(scope).find(t => t.id === 't9');
        return t9 ? t9.name : null;
      });
      return names;
    });
    expect(result).toEqual(['Project Coordination', 'Project Coordination', 'Project Coordination']);
  });

  test('renaming the coordination task does not break the spans-whole-project behaviour', async ({ page }) => {
    await page.goto(APP_URL);
    const result = await page.evaluate(() => {
      const scope = 1;
      const renamed = getDefaultTemplate(scope).map(t =>
        t.id === 't9' ? Object.assign({}, t, { name: 'Something Else Entirely' }) : Object.assign({}, t)
      );
      generateGanttStateFromTasks(renamed);
      const t9 = renamed.find(t => t.id === 't9');
      const others = renamed.filter(t => t.id !== 't9');
      const maxOtherEnd = Math.max(...others.map(t => t.computed_end_days));
      return {
        t9Start: t9.computed_start_days,
        t9End: t9.computed_end_days,
        maxOtherEnd,
        t9Text: t9.name
      };
    });
    expect(result.t9Text).toBe('Something Else Entirely');
    expect(result.t9Start).toBe(1);
    expect(result.t9End).toBe(result.maxOtherEnd);
  });
});
