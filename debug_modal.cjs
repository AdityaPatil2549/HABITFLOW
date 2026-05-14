const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  
  // Wait for the New Entry button
  await page.waitForSelector('.w-14.h-14.cursor-pointer.bg-gradient-to-r');
  
  // Click the New Entry button
  await page.click('.w-14.h-14.cursor-pointer.bg-gradient-to-r');
  
  // Wait a bit for modal to animate in
  await new Promise(r => setTimeout(r, 1000));
  
  // Query the modal content wrapper
  const style = await page.evaluate(() => {
    const modal = document.querySelector('.mx-4.overflow-hidden.relative.rounded-3xl');
    if (!modal) return 'Not found';
    const rect = modal.getBoundingClientRect();
    const style = window.getComputedStyle(modal);
    return {
      width: rect.width,
      height: rect.height,
      opacity: style.opacity,
      display: style.display,
      visibility: style.visibility,
      zIndex: style.zIndex,
      backgroundColor: style.backgroundColor
    };
  });
  
  console.log('Modal style:', style);
  await browser.close();
})();
