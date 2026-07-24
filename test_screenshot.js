import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to http://localhost:5173/habits...');
  await page.goto('http://localhost:5173/habits', { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait a bit to ensure animations finish
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'habit_page_screenshot.png' });
  console.log('Screenshot saved to habit_page_screenshot.png');
  
  await browser.close();
})();
