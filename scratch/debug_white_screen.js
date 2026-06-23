import puppeteer from 'puppeteer-core';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\shice\\.gemini\\antigravity\\brain\\814cde3a-c187-4959-82f8-dc2713785b5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runDebug() {
  console.log('Starting white screen debug diagnostics...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Listen for uncaught JavaScript exceptions
  page.on('pageerror', err => {
    console.error('[PAGE ERROR EXCEPTION]:', err.toString());
  });

  // Listen for failed network requests
  page.on('requestfailed', request => {
    console.warn(`[REQUEST FAILED]: ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'load' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s for rendering
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'white_screen_debug.png') });
    console.log('Screenshot saved to white_screen_debug.png');
    
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    console.log('Body HTML length:', bodyHtml.length);
    console.log('Body HTML snippet:', bodyHtml.substring(0, 500));
    
  } catch (error) {
    console.error('Debug test ran into an error:', error);
  } finally {
    await browser.close();
  }
}

runDebug();
