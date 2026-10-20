const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  page.on('response', async (res) => {
    if (res.url().includes('/api/issues')) {
      console.log('API /api/issues status:', res.status());
      try {
        const text = await res.text();
        console.log('API response length:', text.length, 'preview:', text.slice(0, 300));
      } catch (e) {
        console.log('Could not read api response body:', e.message);
      }
    }
  });

  console.log('Navigating to https://issue-scout-chi.vercel.app/ ...');
  await page.goto('https://issue-scout-chi.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click Python chip
  console.log('Clicking Python chip...');
  await page.click('button:has-text("Python")');
  await page.waitForTimeout(1000);

  // Now click "Find issues →" button
  console.log('Clicking Find issues button...');
  await page.click('button[type="submit"]:has-text("Find issues")');

  // Wait for results to load
  console.log('Waiting for search response and cards...');
  try {
    await page.waitForResponse(res => res.url().includes('/api/issues'), { timeout: 15000 });
  } catch (e) {
    console.log('Response wait timed out or finished:', e.message);
  }

  // Wait for DOM to stabilize
  await page.waitForTimeout(5000);

  // Check card elements
  const cards = await page.evaluate(() => {
    // Look for issue card links or titles
    const links = Array.from(document.querySelectorAll('a[href*="github.com/"]'));
    return links.map(l => ({
      href: l.href,
      text: l.innerText.replace(/\n+/g, ' | ')
    })).filter(l => !l.href.includes('sharmao07/issue-scout'));
  });

  console.log('Found issue card links:', cards.length);
  cards.slice(0, 5).forEach((c, i) => console.log(`Card ${i + 1}: ${c.text} -> ${c.href}`));

  // Check page height
  const height = await page.evaluate(() => document.body.scrollHeight);
  console.log('Body scroll height:', height);

  // Capture full page screenshot of this genuine search state
  await page.screenshot({ path: path.join(__dirname, 'capture/python_search_stable.png'), fullPage: true });
  console.log('Saved python_search_stable.png');

  await browser.close();
})();
