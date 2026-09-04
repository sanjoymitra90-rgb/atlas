// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', '..', 'dist', 'index.html');

test.describe('CARTO tile key injection', () => {
  let html;

  test.beforeAll(() => {
    html = fs.readFileSync(DIST, 'utf8');
  });

  test('built file contains ?key= on the CARTO tile URL', () => {
    expect(html).toContain('?key=');
  });

  test('built file does not contain key=undefined', () => {
    expect(html).not.toMatch(/key=undefined/);
  });

  test('built file does not contain empty key=', () => {
    expect(html).not.toMatch(/key=""|\?key=&|\?key=\s/);
  });

  test('built file does not contain the literal env var name', () => {
    expect(html).not.toContain('VITE_CARTO_KEY');
  });
});
