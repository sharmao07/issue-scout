const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--use-cmd-decoder=passthrough']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1152 } });
  await page.goto('http://127.0.0.1:3344/webgl_film.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.cinemaReady === true);

  // We can test modifying shader or mesh in the page
  await page.evaluate(() => {
    const gl = window.cinemaEngine.gl;

    // Test updating the quad buffer with:
    // y = -0.5 (top), v = 1.0 (or v = 0.0)
    // Let's test standard quad:
    // [-0.5, -0.5, 0, 0, 0]
    // [0.5, -0.5, 0, 1, 0]
    // [0.5, 0.5, 0, 1, 1]
    // [-0.5, 0.5, 0, 0, 1]
  });

  await page.evaluate(() => window.seek(0.0));
  await page.screenshot({ path: 'flyover/capture/orient_test.png' });
  console.log('Saved orient_test.png');
  await browser.close();
})();
