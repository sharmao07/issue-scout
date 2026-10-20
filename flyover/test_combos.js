const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1152 } });
  await page.goto('http://127.0.0.1:3344/webgl_film.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.cinemaReady === true);

  const tests = [
    { name: 'flip_none', expr: 'vec2 uv = vTexCoord;' },
    { name: 'flip_y',    expr: 'vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);' },
    { name: 'flip_x',    expr: 'vec2 uv = vec2(1.0 - vTexCoord.x, vTexCoord.y);' },
    { name: 'flip_xy',   expr: 'vec2 uv = vec2(1.0 - vTexCoord.x, 1.0 - vTexCoord.y);' }
  ];

  for (const t of tests) {
    await page.evaluate((testExpr) => {
      const gl = window.cinemaEngine.gl;
      // Recompile webpage shader with testExpr
      const vsSource = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
out vec2 vTexCoord;
out vec3 vWorldPos;
void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;
  vTexCoord = aTexCoord;
  gl_Position = uProjection * uView * worldPos;
}
`;
      const fsSource = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in vec3 vWorldPos;
uniform sampler2D uTexture;
uniform vec2 uPageSize;
uniform float uCornerRadius;
uniform float uClipBottom;
uniform float uHazeFade;
out vec4 fragColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  vec2 halfSize = vec2(uPageSize.x * 0.5, uClipBottom * 0.5);
  vec2 center = vec2(0.0, halfSize.y);
  vec2 p = vWorldPos.xy - center;
  float d = sdRoundedBox(p, halfSize, uCornerRadius);
  float alpha = 1.0 - smoothstep(0.0, 1.5, d);
  if (alpha <= 0.0) discard;

  ${testExpr}
  vec4 tex = texture(uTexture, uv);
  fragColor = vec4(tex.rgb, tex.a * alpha);
}
`;
      function compile(type, source) {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        return s;
      }
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSource));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSource));
      gl.linkProgram(p);
      window.cinemaEngine.programs.webpage = p;
    }, t.expr);

    await page.evaluate(() => window.seek(0.0));
    await page.screenshot({ path: `flyover/capture/test_${t.name}.png` });
    console.log(`Saved test_${t.name}.png`);
  }

  await browser.close();
})();
