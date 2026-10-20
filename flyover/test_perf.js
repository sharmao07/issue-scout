const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--use-cmd-decoder=passthrough']
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1152 },
    deviceScaleFactor: 1
  });

  await page.goto('http://127.0.0.1:3344/webgl_film.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.cinemaReady === true);

  const t0 = Date.now();
  for (let i = 0; i < 10; i++) {
    const t = i / 60.0;
    await page.evaluate((timestamp) => window.seek(timestamp), t);
    const buf = await page.screenshot({ type: 'png' });
  }
  const elapsed = Date.now() - t0;
  console.log(`10 frames took ${elapsed} ms (${(elapsed / 10).toFixed(1)} ms/frame)`);
  await browser.close();
})();
