const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Testing WebGL renderer in Headless Chrome...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--use-cmd-decoder=passthrough']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1152 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to http://127.0.0.1:3344/webgl_film.html ...');
  await page.goto('http://127.0.0.1:3344/webgl_film.html', { waitUntil: 'networkidle' });

  // Wait for window.cinemaReady
  console.log('Waiting for window.cinemaReady...');
  await page.waitForFunction(() => window.cinemaReady === true, { timeout: 15000 });
  console.log('Renderer is ready! Testing seek(0.0)...');

  await page.evaluate(() => window.seek(0.0));
  await page.waitForTimeout(500);

  const testPath = path.join(__dirname, 'capture/test_frame_0.png');
  await page.screenshot({ path: testPath });
  console.log('Saved test frame 0 to:', testPath);

  await browser.close();
  console.log('Test complete!');
})();
