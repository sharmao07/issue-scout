const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1152 } });
  await page.goto('http://127.0.0.1:3344/webgl_film.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.cinemaReady === true);

  // Test reversing flight direction in camera
  await page.evaluate(() => {
    // Override evaluateCamera for test
    const origEval = window.evaluateCamera;
    const tiltDeg = 56.0;
    const tiltRad = tiltDeg * (Math.PI / 180.0);
    const sinTilt = Math.sin(tiltRad);
    const cosTilt = Math.cos(tiltRad);
    const targetY = 420.0;
    const dist = 1360.0;

    // Looking from larger Y toward smaller Y (facing the text upright)
    const eye = [0.0, targetY + dist * sinTilt, dist * cosTilt];
    const center = [0.0, targetY, 0.0];
    const up = [0.0, 0.0, 1.0];

    // Replace camera view matrix
    const near = 10.0, far = 35000.0;
    const projMat = Mat4.create();
    Mat4.perspective(projMat, FOV_Y, ASPECT, near, far);
    const viewMat = Mat4.create();
    Mat4.lookAt(viewMat, eye, center, up);

    // Render with standard uv
    window.cinemaEngine.seek(0.0);
  });

  await page.screenshot({ path: 'flyover/capture/test_face_camera.png' });
  console.log('Saved test_face_camera.png');
  await browser.close();
})();
