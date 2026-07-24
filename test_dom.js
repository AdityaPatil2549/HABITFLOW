import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/habits', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.evaluate(() => {
    return document.getElementById('root')?.innerHTML;
  });
  
  console.log(content?.substring(0, 5000));
  
  await browser.close();
})();
