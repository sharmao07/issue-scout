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

  console.log('Navigating to https://issue-scout-chi.vercel.app/ ...');
  await page.goto('https://issue-scout-chi.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const title = await page.title();
  console.log('Page Title:', title);

  // Take initial screenshot
  await page.screenshot({ path: path.join(__dirname, 'capture/initial_page.png'), fullPage: true });
  console.log('Initial page screenshot saved.');

  // Scroll through page to trigger lazy loading
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  await page.waitForTimeout(2000);
  windowScrollTop = await page.evaluate(() => {
    window.scrollTo(0, 0);
    return true;
  });
  await page.waitForTimeout(1000);

  // Inspect elements on page
  const pageInfo = await page.evaluate(() => {
    const textContent = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.innerText.trim() : null;
    };

    const chips = Array.from(document.querySelectorAll('button, a, div[role="button"]'))
      .map(b => b.innerText.trim())
      .filter(t => t.length > 0 && t.length < 40);

    const issues = Array.from(document.querySelectorAll('article, [class*="card"], [class*="issue"]'))
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.innerText.slice(0, 150)
      }));

    return {
      chips,
      sampleCards: issues.slice(0, 5),
      bodyScrollHeight: document.body.scrollHeight
    };
  });

  console.log('Page info:', JSON.stringify(pageInfo, null, 2));

  // Check chips: beginner-friendly, documentation, bug fixes, python
  // Let's find Python chip or search input
  const pythonChip = page.locator('text="Python"').first();
  if (await pythonChip.isVisible()) {
    console.log('Found Python chip! Clicking...');
    await pythonChip.click();
  } else {
    console.log('Looking for search input...');
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i], input').first();
    await searchInput.fill('Python');
    const findBtn = page.locator('button:has-text("Find issues")').first();
    await findBtn.click();
  }

  console.log('Waiting for search results...');
  await page.waitForTimeout(4000);

  // Scroll down to load results if needed
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Take screenshot after python search
  await page.screenshot({ path: path.join(__dirname, 'capture/python_search.png'), fullPage: true });
  console.log('Python search full-page screenshot saved.');

  // Extract issue cards details
  const cardsDetails = await page.evaluate(() => {
    // Find all issue cards
    const articles = Array.from(document.querySelectorAll('article, a[href*="github.com"], div[class*="border"]'));
    return articles.map(a => ({
      tagName: a.tagName,
      className: a.className,
      text: a.innerText,
      rect: a.getBoundingClientRect()
    })).filter(a => a.text && a.text.includes('GitHub') || a.text.includes('#') || a.text.includes('ago') || a.text.includes('comments'));
  });

  console.log(`Found ${cardsDetails.length} potential card elements.`);
  fs.writeFileSync(path.join(__dirname, 'capture/cards_details.json'), JSON.stringify(cardsDetails, null, 2));

  await browser.close();
  console.log('Inspection complete.');
})();
