import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.log(`[Browser Error] ${error.message}`));
  
  console.log('Navigating to http://localhost:5173...');
  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000); // wait for 5 seconds for things to load
  } catch (err) {
    console.error('Failed to load page:', err);
  }
  
  await browser.close();
})();
