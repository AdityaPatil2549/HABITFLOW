const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROUTES = [
  'dashboard',
  'habits',
  'tasks',
  'analytics',
  'settings',
  'profile',
  'review',
  'shop',
  'squad'
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[${page.url()}] Console Error: ${msg.text()}`);
  });
  page.on('pageerror', error => errors.push(`[${page.url()}] Page Error: ${error.message}`));
  
  const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\f740ed40-b759-47be-b490-7b19033d553b';
  
  console.log('Starting site-wide test...');
  
  for (const route of ROUTES) {
    console.log(`\nNavigating to /${route}...`);
    try {
      await page.goto(`http://localhost:5175/${route}`, { waitUntil: 'load', timeout: 10000 });
      await new Promise(r => setTimeout(r, 1500)); // wait for animations/particles
      
      const screenshotPath = path.join(artifactDir, `glass_test_${route}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot to ${screenshotPath}`);
      
      const targets = await page.$$eval('.glass-card, .glass-card-3d', els => els.length);
      console.log(`Found ${targets} CSS glassmorphism elements on /${route}.`);
    } catch (e) {
      console.log(`Failed to test /${route}:`, e.message);
    }
  }
  
  console.log('\n--- Test Summary ---');
  if (errors.length > 0) {
    console.log(`Found ${errors.length} errors during testing:`);
    errors.forEach(e => console.log(e));
  } else {
    console.log('No console errors detected across any page.');
  }
  
  await browser.close();
})();
