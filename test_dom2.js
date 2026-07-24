import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/habits', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.evaluate(() => {
    return document.getElementById('root')?.innerHTML;
  });
  
  fs.writeFileSync('dom_output.txt', content || '');
  console.log('Saved DOM to dom_output.txt');
  
  await browser.close();
})();
