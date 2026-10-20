const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CAPTURE_DIR = path.join(__dirname, 'capture');
if (!fs.existsSync(CAPTURE_DIR)) {
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
}

(async () => {
  console.log('--- Starting Precise Browser Capture Pipeline ---');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--use-cmd-decoder=passthrough']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  console.log('1. Navigating to https://issue-scout-chi.vercel.app/ ...');
  await page.goto('https://issue-scout-chi.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 2. Click Python chip
  console.log('2. Applying Python quick-start...');
  await page.click('button:has-text("Python")');
  await page.waitForTimeout(1000);

  // 3. Click Find issues button
  console.log('3. Triggering search via Find issues button...');
  await page.click('button[type="submit"]:has-text("Find issues")');
  
  // Wait for /api/issues response
  await page.waitForResponse(res => res.url().includes('/api/issues'), { timeout: 20000 });
  console.log('4. Received genuine API response! Waiting for DOM stability...');
  await page.waitForTimeout(4000);

  // Ensure fonts are loaded
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  // Keep first 12 cards for mathematically aligned cruising flight & pagination reveal
  await page.evaluate(() => {
    const articles = document.querySelectorAll('article');
    for (let i = 12; i < articles.length; i++) {
      articles[i].remove();
    }
  });

  await page.waitForTimeout(1000);

  // Scroll to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Measure all elements
  const metadata = await page.evaluate(() => {
    const getBox = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.x + window.scrollX,
        y: r.y + window.scrollY,
        width: r.width,
        height: r.height,
        padding: 28
      };
    };

    // 1. Search button
    const findBtn = document.querySelector('button[type="submit"]');

    // 2. Chips
    const chipsContainer = document.querySelector('div.mt-4.flex.flex-wrap.items-center');
    const chipButtons = Array.from(chipsContainer.querySelectorAll('button'));

    // 3. Filters
    const filterGrid = document.querySelector('div.grid.grid-cols-1');
    const filterItems = Array.from(filterGrid.children);

    // 4. Hero section & form
    const heroSection = document.querySelector('section');
    const searchForm = document.querySelector('form');
    const header = document.querySelector('header');

    // 5. Cards
    const cards = Array.from(document.querySelectorAll('article')).map((art, idx) => ({
      idx,
      box: getBox(art),
      repo: art.querySelector('a')?.innerText.trim(),
      title: art.querySelector('a.block, a[href*="/issues/"]')?.innerText.trim()
    }));

    // 6. Pagination
    const pagination = document.querySelector('nav[aria-label="Issue result pages"]');
    const footer = document.querySelector('footer');

    return {
      page: {
        width: 1440,
        height: document.body.scrollHeight
      },
      header: getBox(header),
      heroSection: getBox(heroSection),
      searchForm: getBox(searchForm),
      findButton: getBox(findBtn),
      chips: chipButtons.map(c => ({
        text: c.innerText.trim(),
        box: getBox(c)
      })),
      filters: filterItems.map(f => ({
        label: f.querySelector('label')?.innerText.trim(),
        box: getBox(f)
      })),
      cards,
      pagination: pagination ? getBox(pagination) : null,
      footer: footer ? getBox(footer) : null
    };
  });

  console.log(`Page dimensions: ${metadata.page.width}x${metadata.page.height}`);

  // Take the locked full-page screenshot
  const fullPagePath = path.join(CAPTURE_DIR, 'webpage_full.png');
  await page.screenshot({ path: fullPagePath, fullPage: true });
  console.log(`Saved full page texture to: ${fullPagePath}`);

  // Capture individual elements
  console.log('Capturing individual elements with omitBackground...');

  // 1. Search Button
  const btnLocator = page.locator('button[type="submit"]').first();
  await btnLocator.screenshot({ path: path.join(CAPTURE_DIR, 'raw_btn_find.png'), omitBackground: true });

  // 2. Chips
  const chipsLocators = page.locator('div.mt-4.flex.flex-wrap.items-center button');
  const chipCount = await chipsLocators.count();
  for (let i = 0; i < chipCount; i++) {
    await chipsLocators.nth(i).screenshot({
      path: path.join(CAPTURE_DIR, `raw_chip_${i}.png`),
      omitBackground: true
    });
  }

  // 3. Filters
  const filterLocators = page.locator('div.grid.grid-cols-1 > div');
  const filterCount = await filterLocators.count();
  for (let i = 0; i < filterCount; i++) {
    await filterLocators.nth(i).screenshot({
      path: path.join(CAPTURE_DIR, `raw_filter_${i}.png`),
      omitBackground: true
    });
  }

  // 4. Featured Card (Card #5)
  const cardLocator = page.locator('article').nth(5);
  await cardLocator.scrollIntoViewIfNeeded();
  await cardLocator.screenshot({
    path: path.join(CAPTURE_DIR, 'raw_card_featured.png'),
    omitBackground: true
  });

  // 5. Four Typographic Brand Tiles
  // Genuine brand wordmark: ISSUE SCOUT (ISSUE in light-colored, SCOUT in cyan)
  // Dark interface panel #0d1220, border border-white/10, rounded-xl
  console.log('Generating 4 small typographic brand tiles...');
  await page.evaluate(() => {
    const container = document.createElement('div');
    container.id = 'brand-tiles-container';
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.zIndex = '999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '20px';
    container.style.background = 'transparent';

    const tilesData = [
      { html: 'ISSUE<span style="color:#67e8f9">SCOUT</span>' },
      { html: '<span style="font-size:11px;letter-spacing:0.18em;color:#94a3b8;font-weight:600">OPEN SOURCE DISCOVERY</span>' },
      { html: 'FIND <span style="color:#67e8f9">ISSUES</span>' },
      { html: 'BUILD <span style="color:#67e8f9">REAL.</span>' }
    ];

    tilesData.forEach((td, idx) => {
      const tile = document.createElement('div');
      tile.id = `brand-tile-${idx}`;
      tile.style.padding = '12px 20px';
      tile.style.borderRadius = '14px';
      tile.style.background = '#0d1220';
      tile.style.border = '1px solid rgba(255,255,255,0.14)';
      tile.style.boxShadow = '0 12px 30px -6px rgba(0,0,0,0.6)';
      tile.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      tile.style.fontSize = '14px';
      tile.style.fontWeight = '900';
      tile.style.color = '#f8fafc';
      tile.style.display = 'inline-flex';
      tile.style.alignItems = 'center';
      tile.style.justifyContent = 'center';
      tile.style.width = '196px';
      tile.style.height = '48px';
      tile.style.boxSizing = 'border-box';
      tile.innerHTML = td.html;
      container.appendChild(tile);
    });

    document.body.appendChild(container);
  });

  for (let i = 0; i < 4; i++) {
    const tileEl = page.locator(`#brand-tile-${i}`);
    await tileEl.screenshot({
      path: path.join(CAPTURE_DIR, `raw_brand_tile_${i}.png`),
      omitBackground: true
    });
  }

  // 6. Hero Card Quad Box
  const heroCardBox = {
    x: (1440 - 1018) / 2, // 211
    y: metadata.heroSection.y,
    width: 1018,
    height: metadata.searchForm.y + metadata.searchForm.height - metadata.heroSection.y + 40
  };
  metadata.heroCardBox = heroCardBox;

  // Save locked metadata JSON
  fs.writeFileSync(path.join(CAPTURE_DIR, 'locked_metadata.json'), JSON.stringify(metadata, null, 2));
  console.log('Saved locked_metadata.json');

  await browser.close();

  // Run Python script to add exact 28px (56px in 2x) transparent padding to all raw layers
  console.log('Adding 28px transparent padding to layers via Python PIL...');
  execSync(`python3 -c "
import os
from PIL import Image, ImageOps

capture_dir = '${CAPTURE_DIR}'
pad_px = int(28 * 2) # deviceScaleFactor is 2

files = [
    ('raw_btn_find.png', 'layer_btn_find.png'),
    ('raw_card_featured.png', 'layer_card_featured.png')
]
for i in range(4):
    files.append((f'raw_chip_{i}.png', f'layer_chip_{i}.png'))
    files.append((f'raw_brand_tile_{i}.png', f'layer_brand_tile_{i}.png'))
for i in range(5):
    files.append((f'raw_filter_{i}.png', f'layer_filter_{i}.png'))

for raw_name, out_name in files:
    raw_path = os.path.join(capture_dir, raw_name)
    out_path = os.path.join(capture_dir, out_name)
    if os.path.exists(raw_path):
        img = Image.open(raw_path).convert('RGBA')
        padded = ImageOps.expand(img, border=pad_px, fill=(0, 0, 0, 0))
        padded.save(out_path)
        print(f'Padded {out_name}: {img.size} -> {padded.size}')
"`, { stdio: 'inherit' });

  console.log('--- All assets extracted and locked successfully! ---');
})();
