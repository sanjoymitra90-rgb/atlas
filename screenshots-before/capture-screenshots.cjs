const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  const screenshotDir = path.join(__dirname);
  
  // Navigate to the app
  await page.goto('file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/'));
  await page.waitForTimeout(1000);
  
  console.log('1. Capturing Gateway screen...');
  await page.screenshot({ path: path.join(screenshotDir, '01-gateway.png'), fullPage: false });
  
  // Click on Call Auditor
  console.log('2. Navigating to Call Auditor...');
  await page.click('text=Launch Analyzer');
  await page.waitForTimeout(500);
  
  console.log('3. Capturing Upload Prompt...');
  await page.screenshot({ path: path.join(screenshotDir, '02-upload-prompt.png'), fullPage: false });
  
  // Upload dummy CSV data
  console.log('4. Loading dummy data...');
  const dummyCSV = `Time,Service,From,To,Status,Customer,Source IP,Processing (ms),UK Valid
2024-01-15 10:00:01,signing,+447700900001,+447700900002,200,Acme Corp,192.168.1.1,45,Valid
2024-01-15 10:00:02,verify,+447700900001,+447700900002,200,Acme Corp,192.168.1.1,52,Valid
2024-01-15 10:00:05,signing,+447700900003,+447700900004,200,Beta Inc,192.168.1.2,38,Valid
2024-01-15 10:00:06,verify,+447700900003,+447700900004,200,Beta Inc,192.168.1.2,41,Valid
2024-01-15 10:00:10,signing,+447700900005,+447700900006,500,Gamma Ltd,192.168.1.3,120,Malformed
2024-01-15 10:00:12,signing,+447700900007,+447700900008,200,Delta Co,192.168.1.4,55,Valid
2024-01-15 10:00:13,verify,+447700900007,+447700900008,200,Delta Co,192.168.1.4,48,Valid
2024-01-15 10:00:15,signing,+447700900009,+447700900010,200,Epsilon SA,192.168.1.5,62,Valid
2024-01-15 10:00:18,verify,+447700900009,+447700900010,200,Epsilon SA,192.168.1.5,58,Valid
2024-01-15 10:00:20,signing,+447700900011,+447700900012,200,Zeta GmbH,192.168.1.6,42,Non-UK
2024-01-15 10:00:22,signing,+447700900013,+447700900014,200,Eta Corp,192.168.1.7,51,Valid
2024-01-15 10:00:23,verify,+447700900013,+447700900014,200,Eta Corp,192.168.1.7,49,Valid
2024-01-15 10:00:25,signing,+447700900015,+447700900016,200,Theta Ltd,192.168.1.8,155,Suspected Test
2024-01-15 10:00:28,signing,+447700900017,+447700900018,200,Iota Inc,192.168.1.9,39,Valid
2024-01-15 10:00:29,verify,+447700900017,+447700900018,200,Iota Inc,192.168.1.9,44,Valid
2024-01-15 10:00:30,signing,+447700900019,+447700900020,200,Kappa Co,192.168.1.10,58,Valid
2024-01-15 10:00:31,verify,+447700900019,+447700900020,200,Kappa Co,192.168.1.10,52,Valid
2024-01-15 10:00:35,signing,+447700900021,+447700900022,200,Lambda SA,192.168.1.11,47,Valid
2024-01-15 10:00:38,verify,+447700900021,+447700900022,200,Lambda SA,192.168.1.11,53,Valid
2024-01-15 10:00:40,signing,+447700900023,+447700900024,200,Mu GmbH,192.168.1.12,41,Valid`;
  
  // Upload the file
  const fileInput = page.locator('#gap-csv-upload');
  await fileInput.setInputFiles({
    name: 'gap-data.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(dummyCSV)
  });
  await page.waitForTimeout(1000);
  
  // Check if mapping modal appeared and confirm it
  const mappingModal = page.locator('#gap-column-modal');
  if (await mappingModal.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('   Mapping modal detected, confirming...');
    await page.screenshot({ path: path.join(screenshotDir, '03-mapping-modal.png'), fullPage: false });
    const confirmBtn = page.locator('#gap-column-modal button:has-text("Analyze"), #gap-column-modal button:has-text("Confirm")');
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
  }
  
  // Wait for dashboard to be visible
  await page.waitForSelector('#gap-dashboard:not(.hidden)', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  console.log('5. Capturing Dashboard with data...');
  await page.screenshot({ path: path.join(screenshotDir, '03-dashboard-metrics.png'), fullPage: false });
  
  // Scroll down to see charts
  console.log('6. Capturing Charts...');
  await page.evaluate(() => {
    const charts = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
    if (charts) charts.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '04-charts.png'), fullPage: false });
  
  // Scroll down to see table
  console.log('7. Capturing Data Table...');
  await page.evaluate(() => {
    const table = document.querySelector('[data-testid="gap-table"]');
    if (table) table.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '05-data-table.png'), fullPage: false });
  
  // Open Settings modal
  console.log('8. Capturing Settings/Mapping Modal...');
  await page.click('[data-testid="gap-settings-btn"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '06-settings-modal.png'), fullPage: false });
  await page.click('#gap-column-modal button[aria-label="Close modal"]');
  await page.waitForTimeout(300);
  
  // Open Export modal
  console.log('9. Capturing Export Modal...');
  await page.click('[data-testid="gap-export-btn"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '07-export-modal.png'), fullPage: false });
  await page.locator('#gap-export-modal button:has-text("Cancel")').click();
  await page.waitForTimeout(300);
  
  // Toggle group by pair
  console.log('10. Capturing Grouped View...');
  await page.evaluate(() => {
    const table = document.querySelector('[data-testid="gap-table"]');
    if (table) table.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(300);
  await page.locator('.gap-switch-track').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '08-grouped-view.png'), fullPage: false });
  
  // Scroll up to see Call Pairing panel
  console.log('11. Capturing Call Pairing Panel...');
  await page.evaluate(() => {
    const panel = document.querySelector('#gap-pair-panel');
    if (panel) panel.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '09-pair-panel.png'), fullPage: false });
  
  // Full page screenshot
  console.log('12. Capturing Full Page...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, '10-full-page.png'), fullPage: true });
  
  await browser.close();
  console.log('\nAll screenshots captured in:', screenshotDir);
})();
