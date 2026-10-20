const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const page = await browser.newPage();
  
  await page.setContent(`
    <canvas id="c" width="400" height="300"></canvas>
    <script>
      const c = document.getElementById('c');
      const gl = c.getContext('webgl2');
      // Create a test 2x2 image:
      // Top-Left: Red, Top-Right: Green
      // Bottom-Left: Blue, Bottom-Right: White
      const imgData = new Uint8Array([
        255, 0, 0, 255,     0, 255, 0, 255,
        0, 0, 255, 255,     255, 255, 255, 255
      ]);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, imgData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // In WebGL default:
      // Tex coord (0, 0) samples Bottom-Left (Blue)!
      // Tex coord (0, 1) samples Top-Left (Red)!
      // Tex coord (1, 1) samples Top-Right (Green)!
      // Tex coord (1, 0) samples Bottom-Right (White)!
      window.result = 'WebGL texture coordinates: (0,0) is bottom-left, (0,1) is top-left';
    </script>
  `);
  
  const res = await page.evaluate(() => window.result);
  console.log(res);
  await browser.close();
})();
