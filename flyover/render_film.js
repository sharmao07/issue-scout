const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOTAL_FRAMES = 870; // 14.5s * 60fps
const FPS = 60;
const FRAMES_DIR = path.join(__dirname, 'frames');
const OUTPUT_DIR = path.join(__dirname, 'output');
const AUDIO_PATH = path.join(__dirname, 'audio.wav');
const FINAL_MP4 = path.join(OUTPUT_DIR, 'issue_scout_flyover.mp4');

if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}
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
  console.log('====================================================');
  console.log('  ISSUE SCOUT — CINEMATIC 3D FLY-OVER FILM RENDER');
  console.log('  Target: 1440x1152 @ 60fps, 14.5s (870 frames)');
  console.log('====================================================');

  console.log('Starting Embedded Film Server on port 3344...');
  const server = await startServer(3344);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--use-cmd-decoder=passthrough',
      '--enable-accelerated-2d-canvas'
    ]
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1152 },
    deviceScaleFactor: 1
  });

  console.log('Loading WebGL composition from local server...');
  await page.goto('http://127.0.0.1:3344/webgl_film.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.cinemaReady === true, { timeout: 20000 });
  console.log('WebGL Scene & Shaders Initialized Successfully.');

  const startTime = Date.now();

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const t = frame / FPS;
    await page.evaluate((timestamp) => {
      window.seek(timestamp);
      return new Promise(resolve => requestAnimationFrame(resolve));
    }, t);

    const frameFile = path.join(FRAMES_DIR, `frame_${String(frame).padStart(4, '0')}.png`);
    await page.screenshot({ path: frameFile, type: 'png' });

    if (frame % 30 === 0 || frame === TOTAL_FRAMES - 1) {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = ((frame + 1) / TOTAL_FRAMES) * 100;
      const fpsRender = ((frame + 1) / elapsed).toFixed(1);
      const estTotal = (elapsed / (frame + 1)) * TOTAL_FRAMES;
      const estRemaining = Math.max(0, estTotal - elapsed).toFixed(0);
      console.log(`[RENDER] Frame ${frame + 1}/${TOTAL_FRAMES} (${t.toFixed(2)}s) — ${progress.toFixed(1)}% | ${fpsRender} fps | ETA: ${estRemaining}s`);
    }
  }

  const renderElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`All ${TOTAL_FRAMES} frames rendered in ${renderElapsed}s.`);
  await browser.close();

  // FFmpeg Encoding to broadcast-quality H.264 MP4 with master audio
  console.log('--- Encoding Final H.264 MP4 Video with FFmpeg ---');
  const ffmpegCmd = `/opt/homebrew/bin/ffmpeg -y -r ${FPS} -i "${path.join(FRAMES_DIR, 'frame_%04d.png')}" -i "${AUDIO_PATH}" -c:v libx264 -pix_fmt yuv420p -crf 17 -preset slow -c:a aac -b:a 320k -movflags +faststart "${FINAL_MP4}"`;

  console.log('Running:', ffmpegCmd);
  execSync(ffmpegCmd, { stdio: 'inherit' });

  console.log('--- Video Encoding Complete ---');
  console.log(`Output File: ${FINAL_MP4}`);

  // Probe output video to verify integrity
  const probeCmd = `/opt/homebrew/bin/ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 "${FINAL_MP4}"`;
  const probeOutput = execSync(probeCmd).toString();
  console.log('--- FFprobe Video Verification ---');
  console.log(probeOutput);

  // Copy to Brain Artifacts directory for immediate presentation
  const artifactDir = '/Users/ojussharma/.gemini/antigravity/brain/9486a510-2e48-4817-ad85-162bc06a03f3';
  const artifactVideoPath = path.join(artifactDir, 'issue_scout_flyover.mp4');
  fs.copyFileSync(FINAL_MP4, artifactVideoPath);
  console.log(`Copied final MP4 to artifacts: ${artifactVideoPath}`);

  server.close();
})();
