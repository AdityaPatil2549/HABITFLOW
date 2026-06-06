import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR STACK:', err.stack || err);
  });

  try {
    await page.goto('http://localhost:5173/garden', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    const html = await page.evaluate(() => document.body.innerHTML);
    console.log('HTML CONTENT:', html.substring(0, 1000));
  } catch (e) {
    console.log('Nav error:', e);
  }

  await browser.close();
})();
