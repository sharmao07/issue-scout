const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TIMESTAMPS = [
  { t: 0.0, name: 'still_01_0.0s' },
  { t: 1.6, name: 'still_02_1.6s' },
  { t: 2.5, name: 'still_03_2.5s' },
  { t: 5.0, name: 'still_04_5.0s' },
  { t: 6.5, name: 'still_05_6.5s' },
  { t: 9.3, name: 'still_06_9.3s' },
  { t: 11.0, name: 'still_07_11.0s' }
];

const OUTPUT_DIR = path.join(__dirname, 'stills');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const http = require('http');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4'
};

function startServer(port = 3344) {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/webgl_film.html';
    const filePath = path.join(__dirname, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  console.log('--- Starting Embedded Film Server ---');
  const server = await startServer(3344);

  console.log('--- Capturing 7 Mandatory Still Frames from WebGL Scene ---');
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
  await page.waitForFunction(() => window.cinemaReady === true, { timeout: 15000 });

  for (const item of TIMESTAMPS) {
    console.log(`Rendering t=${item.t.toFixed(1)}s (${item.name})...`);
    await page.evaluate((timestamp) => {
      window.seek(timestamp);
      return new Promise(resolve => requestAnimationFrame(resolve));
    }, item.t);
    await page.waitForTimeout(50);

    const outPath = path.join(OUTPUT_DIR, `${item.name}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved ${outPath}`);
  }

  await browser.close();
  server.close();

  // Generate Contact Sheet using Python PIL
  console.log('Assembling Contact Sheet with Python PIL...');
  execSync(`python3 -c "
import os
from PIL import Image, ImageDraw, ImageFont

stills_dir = '${OUTPUT_DIR}'
images = [
    ('0.0s — Initial Glide', 'still_01_0.0s.png'),
    ('1.6s — Filter Choreography', 'still_02_1.6s.png'),
    ('2.5s — Issue Discovery', 'still_03_2.5s.png'),
    ('5.0s — Featured Issue Card', 'still_04_5.0s.png'),
    ('6.5s — Results Passage', 'still_05_6.5s.png'),
    ('9.3s — Overhead View', 'still_06_9.3s.png'),
    ('11.0s — End-Card Reveal & Hold', 'still_07_11.0s.png')
]

# Grid: 4 columns x 2 rows (cell size: 720x576)
cell_w, cell_h = 720, 576
sheet_w = cell_w * 4
sheet_h = cell_h * 2
sheet = Image.new('RGB', (sheet_w, sheet_h), (15, 23, 42))
draw = ImageDraw.Draw(sheet)

for idx, (label, fname) in enumerate(images):
    row = idx // 4
    col = idx % 4
    img_path = os.path.join(stills_dir, fname)
    if os.path.exists(img_path):
        img = Image.open(img_path).resize((cell_w, cell_h), Image.Resampling.LANCZOS)
        x = col * cell_w
        y = row * cell_h
        sheet.paste(img, (x, y))
        # Label overlay
        draw.rectangle([x + 16, y + 16, x + 340, y + 54], fill=(8, 11, 22, 220))
        draw.text((x + 26, y + 26), label, fill=(103, 232, 249))

sheet_path = os.path.join(stills_dir, 'contact_sheet.png')
sheet.save(sheet_path, quality=95)
print(f'Contact sheet saved to: {sheet_path}')
"`, { stdio: 'inherit' });

  console.log('--- Stills and Contact Sheet Generation Complete ---');
})();
