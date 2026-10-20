// Issue Scout — Cinematic 3D Website Fly-Over
// WebGL2 Deterministic Rendering Engine

const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 1152;
const FOCAL_LENGTH = 1880.0;
const CRUISE_SPEED = 770.0;

// Camera FOV
const FOV_Y = 2.0 * Math.atan((CANVAS_HEIGHT * 0.5) / FOCAL_LENGTH); // ~34.07 deg
const ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT;

// Locked Layout Geometry from Live Capture
const LAYOUT = {
  pageWidth: 1440,
  pageHeight: 6267,
  header: { x: 120, y: 24, width: 1200, height: 63 },
  heroSection: { x: 120, y: 87, width: 1200, height: 6087 },
  searchForm: { x: 120, y: 501, width: 1200, height: 459 },
  findButton: { x: 1131, y: 560, width: 160, height: 58, pad: 28 },
  chips: [
    { x: 221.7, y: 634, width: 116.7, height: 34, pad: 28 }, // Beginner-friendly
    { x: 346.4, y: 634, width: 106.7, height: 34, pad: 28 }, // Documentation
    { x: 461.1, y: 634, width: 75.4, height: 34, pad: 28 },  // Bug fixes
    { x: 544.5, y: 634, width: 63.4, height: 34, pad: 28 }   // Python
  ],
  filters: [
    { x: 149.0, y: 813, width: 212.4, height: 78, pad: 28 }, // Programming language
    { x: 381.4, y: 813, width: 212.4, height: 78, pad: 28 }, // Issue label
    { x: 613.8, y: 813, width: 212.4, height: 78, pad: 28 }, // Suggested skill level
    { x: 846.2, y: 813, width: 212.4, height: 78, pad: 28 }, // Creation date
    { x: 1078.6, y: 813, width: 212.4, height: 78, pad: 28 } // Issue status
  ],
  brandTiles: [
    { x: 920, y: 500, width: 112, height: 112, pad: 28 },  // Beside search button 1
    { x: 1045, y: 500, width: 112, height: 112, pad: 28 }, // Beside search button 2
    { x: 920, y: 625, width: 112, height: 112, pad: 28 },  // Beside search button 3
    { x: 1045, y: 625, width: 112, height: 112, pad: 28 }  // Beside search button 4
  ],
  featuredCard: { x: 120, y: 3325, width: 1200, height: 417, pad: 28 }, // Card 5
  heroCardBox: { x: 211, y: 87, width: 1018, height: 913 },
  pagination: { x: 120, y: 5966, width: 1200, height: 72 }
};

// Math Helpers
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function smoothstep(min, max, val) {
  const x = clamp((val - min) / (max - min), 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}
function lerp(a, b, t) { return a + (b - a) * t; }

// --- Deterministic Flight Speed Integration ---
const DT = 0.001;
const FLIGHT_SAMPLES = Math.floor(8.65 / DT) + 1;
const flightYTable = new Float64Array(FLIGHT_SAMPLES);
flightYTable[0] = 660.0; // Start centered on Hero (y = 660) to frame header, headline, and search

function getFlightSpeedNorm(t) {
  if (t < 0) return 0.0;
  if (t <= 0.6) {
    const s = t / 0.6;
    return 0.5 * (3.0 * s * s - 2.0 * s * s * s);
  }
  if (t <= 1.25) return 0.5;
  if (t <= 1.6) {
    const s = (t - 1.25) / (1.6 - 1.25);
    return 0.5 + 0.5 * (3.0 * s * s - 2.0 * s * s * s);
  }
  if (t <= 7.3) {
    const varSpeed = 0.04 * Math.sin((t - 1.6) * 1.5);
    return 1.0 + varSpeed;
  }
  if (t <= 8.3) {
    const s = (t - 7.3) / (8.3 - 7.3);
    return 1.0 - (1.0 - 0.12) * (3.0 * s * s - 2.0 * s * s * s);
  }
  if (t <= 8.65) {
    const s = (t - 8.3) / (8.65 - 8.3);
    return 0.12 * (1.0 - (3.0 * s * s - 2.0 * s * s * s));
  }
  return 0.0;
}

// Pre-integrate flight Y position
for (let i = 1; i < FLIGHT_SAMPLES; i++) {
  const t = i * DT;
  const spd = getFlightSpeedNorm(t) * CRUISE_SPEED;
  flightYTable[i] = flightYTable[i - 1] + spd * DT;
}

function getIntegratedFlightY(t) {
  const idx = Math.round(t / DT);
  if (idx < 0) return flightYTable[0];
  if (idx >= FLIGHT_SAMPLES) return flightYTable[FLIGHT_SAMPLES - 1];
  return flightYTable[idx];
}

// --- Overhead Rise Logarithmic Zoom Profile (7.75s to 9.25s) ---
const DIST_FLIGHT_END = 1700.0;
const DIST_OVERHEAD = 11032.0; // Puts bottom edge exactly at 42px above frame bottom
const LN_DIST_START = Math.log(DIST_FLIGHT_END);
const LN_DIST_END = Math.log(DIST_OVERHEAD);
const TOTAL_DELTA_LN = LN_DIST_END - LN_DIST_START;
const TRAP_AREA_FACTOR = 0.5 * 0.60 + 0.60 + 0.5 * 0.30; // 1.05
const V_MAX_LOG = TOTAL_DELTA_LN / TRAP_AREA_FACTOR;

function getOverheadLogDist(t) {
  if (t <= 7.75) return LN_DIST_START;
  if (t <= 8.35) {
    const s = (t - 7.75) / 0.60;
    return LN_DIST_START + 0.5 * 0.60 * V_MAX_LOG * (s * s);
  }
  if (t <= 8.95) {
    const s = t - 8.35;
    const areaAcc = 0.5 * 0.60 * V_MAX_LOG;
    return LN_DIST_START + areaAcc + V_MAX_LOG * s;
  }
  if (t <= 9.25) {
    const s = (t - 8.95) / 0.30;
    const areaAcc = 0.5 * 0.60 * V_MAX_LOG;
    const areaConst = 0.60 * V_MAX_LOG;
    return LN_DIST_START + areaAcc + areaConst + V_MAX_LOG * 0.30 * (s - 0.5 * s * s);
  }
  return LN_DIST_END;
}

// --- Full Camera State Evaluator at time t ---
function evaluateCamera(t) {
  let targetY, dist, tiltDeg;

  if (t <= 7.75) {
    targetY = getIntegratedFlightY(t);
    const sDist = smoothstep(0.0, 7.75, t);
    dist = lerp(1360.0, 1700.0, sDist);
    tiltDeg = 56.0;
  } else if (t <= 9.25) {
    const flightY = getIntegratedFlightY(7.75);
    const overheadCenterY = LAYOUT.pageHeight * 0.5; // 3133.5
    const sBlend = smoothstep(7.75, 9.25, t);
    targetY = lerp(flightY, overheadCenterY, sBlend);
    dist = Math.exp(getOverheadLogDist(t));
    const sTilt = smoothstep(7.75, 9.25, t);
    tiltDeg = lerp(56.0, 0.0, sTilt);
  } else if (t <= 9.47) {
    const sHold = (t - 9.25) / (9.47 - 9.25);
    targetY = LAYOUT.pageHeight * 0.5 + 40.0 * sHold;
    dist = DIST_OVERHEAD * (1.0 - 0.035 * sHold);
    tiltDeg = 0.0;
  } else if (t <= 9.97) {
    const sDive = (t - 9.47) / (9.97 - 9.47);
    const easeDive = sDive < 0.5 ? 2.0 * sDive * sDive : 1.0 - Math.pow(-2.0 * sDive + 2.0, 2.0) * 0.5;
    const DIST_HERO = (1200.0 / 1018.0) * FOCAL_LENGTH;
    const lnDist = lerp(Math.log(DIST_OVERHEAD * 0.965), Math.log(DIST_HERO), easeDive);
    dist = Math.exp(lnDist);
    tiltDeg = 0.0;
    const screenYTop = lerp(42.0, 290.0, easeDive);
    const heroWorldYTop = lerp(0.0, 24.0, easeDive);
    targetY = heroWorldYTop + (CANVAS_HEIGHT * 0.5 - screenYTop) * (dist / FOCAL_LENGTH);
  } else {
    const DIST_HERO = (1200.0 / 1018.0) * FOCAL_LENGTH;
    const sFinal = clamp((t - 9.97) / (14.5 - 9.97), 0.0, 1.0);
    dist = DIST_HERO * (1.0 - 0.02 * sFinal);
    tiltDeg = 0.0;
    const screenYTop = 290.0;
    const heroWorldYTop = 24.0;
    targetY = heroWorldYTop + (CANVAS_HEIGHT * 0.5 - screenYTop) * (dist / FOCAL_LENGTH);
  }

  const tiltRad = tiltDeg * (Math.PI / 180.0);
  const sinTilt = Math.sin(tiltRad);
  const cosTilt = Math.cos(tiltRad);

  // Looking toward text origin (up the page) to ensure text reads upright:
  // eye is at targetY + dist*sinTilt, center is at targetY
  const eye = [
    0.0,
    targetY + dist * sinTilt,
    dist * cosTilt
  ];
  const center = [0.0, targetY, 0.0];

  // Up vector: [0, -cos(tilt), sin(tilt)] guarantees constant Cam X = [-1, 0, 0] across all tilts
  let up;
  if (tiltDeg > 0.05) {
    up = [0.0, -cosTilt, sinTilt];
  } else {
    up = [0.0, -1.0, 0.0];
  }
  const upLen = Math.hypot(up[0], up[1], up[2]);
  up[0] /= upLen; up[1] /= upLen; up[2] /= upLen;

  return { eye, center, up, dist, tiltDeg, targetY };
}

// --- Floating Elements Animation Evaluator ---
function evaluateLiftElements(t) {
  let chipLift = 0.0, chipTilt = 0.0;
  if (t >= 0.10 && t <= 1.45) {
    if (t < 0.45) {
      const s = smoothstep(0.10, 0.45, t);
      chipLift = 30.0 * s;
      chipTilt = 18.0 * s;
    } else if (t <= 1.15) {
      chipLift = 30.0;
      chipTilt = 18.0;
    } else {
      const s = smoothstep(1.15, 1.45, t);
      chipLift = 30.0 * (1.0 - s);
      chipTilt = 18.0 * (1.0 - s);
    }
  }

  let btnLift = 0.0, btnTilt = 0.0;
  if (t >= 0.10 && t <= 1.45) {
    if (t < 0.45) {
      const s = smoothstep(0.10, 0.45, t);
      btnLift = 26.0 * s;
      btnTilt = 12.0 * s;
    } else if (t <= 1.15) {
      btnLift = 26.0;
      btnTilt = 12.0;
    } else {
      const s = smoothstep(1.15, 1.45, t);
      btnLift = 26.0 * (1.0 - s);
      btnTilt = 12.0 * (1.0 - s);
    }
  }

  let tileLifts = [0, 0, 0, 0];
  let tileTilts = [0, 0, 0, 0];
  let tileDrifts = [0, 0, 0, 0];
  if (t >= 0.10 && t <= 1.45) {
    let s;
    if (t < 0.45) {
      s = smoothstep(0.10, 0.45, t);
    } else if (t <= 1.15) {
      s = 1.0;
    } else {
      s = 1.0 - smoothstep(1.15, 1.45, t);
    }
    for (let i = 0; i < 4; i++) {
      tileLifts[i] = 32.0 * s;
      tileTilts[i] = 14.0 * s;
      tileDrifts[i] = 0.0;
    }
  } else if (t >= 9.97) {
    const sDrift = clamp((t - 9.97) / (14.5 - 9.97), 0.0, 1.0);
    const driftVal = 4.0 * Math.sin(sDrift * Math.PI);
    tileLifts[0] = 18.0; tileTilts[0] = 0.0; tileDrifts[0] = -driftVal;
    tileLifts[1] = 18.0; tileTilts[1] = 0.0; tileDrifts[1] = driftVal;
  }

  const filterLifts = [0, 0, 0, 0, 0];
  const filterTilts = [0, 0, 0, 0, 0];
  if (t >= 1.55 && t <= 2.90) {
    for (let i = 0; i < 5; i++) {
      const delay = i * 0.06;
      const tStart = 1.55 + delay;
      const tPeak = tStart + 0.35;
      const tHold = tPeak + 0.40;
      const tEnd = tHold + 0.35;
      const maxLift = 26.0 + i * 2.5;
      const maxTilt = 24.0 + (i % 2) * 4.0;
      if (t >= tStart && t <= tEnd) {
        if (t < tPeak) {
          const s = smoothstep(tStart, tPeak, t);
          filterLifts[i] = maxLift * s;
          filterTilts[i] = maxTilt * s;
        } else if (t <= tHold) {
          filterLifts[i] = maxLift;
          filterTilts[i] = maxTilt;
        } else {
          const s = smoothstep(tHold, tEnd, t);
          filterLifts[i] = maxLift * (1.0 - s);
          filterTilts[i] = maxTilt * (1.0 - s);
        }
      }
    }
  }

  let cardLift = 0.0, cardTilt = 0.0;
  if (t >= 4.95 && t <= 6.35) {
    if (t < 5.45) {
      const s = smoothstep(4.95, 5.45, t);
      cardLift = 85.0 * s;
      cardTilt = 28.0 * s;
    } else if (t <= 5.85) {
      cardLift = 85.0;
      cardTilt = 28.0;
    } else {
      const s = smoothstep(5.85, 6.35, t);
      cardLift = 85.0 * (1.0 - s);
      cardTilt = 28.0 * (1.0 - s);
    }
  }

  return {
    chipLift, chipTilt,
    btnLift, btnTilt,
    tileLifts, tileTilts, tileDrifts,
    filterLifts, filterTilts,
    cardLift, cardTilt
  };
}

// --- 4x4 Matrix Utilities ---
const Mat4 = {
  create: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
  perspective: (out, fovy, aspect, near, far) => {
    const f = 1.0 / Math.tan(fovy / 2.0);
    const nf = 1.0 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = (2.0 * far * near) * nf; out[15] = 0;
    return out;
  },
  lookAt: (out, eye, center, up) => {
    let z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
    let len = 1.0 / Math.hypot(z0, z1, z2);
    z0 *= len; z1 *= len; z2 *= len;

    let x0 = up[1] * z2 - up[2] * z1;
    let x1 = up[2] * z0 - up[0] * z2;
    let x2 = up[0] * z1 - up[1] * z0;
    len = 1.0 / Math.hypot(x0, x1, x2);
    x0 *= len; x1 *= len; x2 *= len;

    let y0 = z1 * x2 - z2 * x1;
    let y1 = z2 * x0 - z0 * x2;
    let y2 = z0 * x1 - z1 * x0;
    len = 1.0 / Math.hypot(y0, y1, y2);
    y0 *= len; y1 *= len; y2 *= len;

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
    out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
    out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
    out[15] = 1;
    return out;
  },
  translate: (out, a, v) => {
    const x = v[0], y = v[1], z = v[2];
    out[12] = a[0]*x + a[4]*y + a[8]*z + a[12];
    out[13] = a[1]*x + a[5]*y + a[9]*z + a[13];
    out[14] = a[2]*x + a[6]*y + a[10]*z + a[14];
    out[15] = a[3]*x + a[7]*y + a[11]*z + a[15];
    return out;
  },
  rotateX: (out, a, rad) => {
    const s = Math.sin(rad), c = Math.cos(rad);
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
  },
  rotateZ: (out, a, rad) => {
    const s = Math.sin(rad), c = Math.cos(rad);
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
  }
};

// --- WebGL Shaders ---

const VS_SCENE = `#version 300 es
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

const FS_FLOOR = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in vec3 vWorldPos;
out vec4 fragColor;

void main() {
  vec2 screenUV = gl_FragCoord.xy / vec2(1440.0, 1152.0);
  vec2 d = screenUV - vec2(0.5, 0.5);
  float dist = length(d);
  
  // Refined studio cyclorama: soft silver-slate gradient with subtle cyan aura
  vec3 centerCol = vec3(0.910, 0.930, 0.960); // #e8ecf5
  vec3 cornerCol = vec3(0.770, 0.820, 0.880); // #c4d1e0
  
  float s = smoothstep(0.0, 0.75, dist);
  vec3 col = mix(centerCol, cornerCol, s);
  
  // Subtle radial cyan atmospheric bloom complementing brand colors
  float aura = max(0.0, 1.0 - dist / 0.65) * 0.07;
  vec3 cyanTone = vec3(0.40, 0.86, 0.96);
  col = mix(col, cyanTone, aura);

  // Very subtle tactile floor perspective grid lines
  vec2 gridCoord = vWorldPos.xy * 0.008;
  vec2 grid = abs(fract(gridCoord - 0.5) - 0.5) / fwidth(gridCoord);
  float line = min(grid.x, grid.y);
  float gridPattern = 1.0 - min(line, 1.0);
  col = mix(col, col * 0.96, gridPattern * 0.12);

  fragColor = vec4(col, 1.0);
}
`;

const FS_PAGE_SHADOW = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in vec3 vWorldPos;
uniform vec4 uCardBounds; // left, top, right, bottom
uniform float uRadius;
uniform float uOpacity;
out vec4 fragColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  vec2 cardSize = vec2(uCardBounds.z - uCardBounds.x, uCardBounds.w - uCardBounds.y);
  vec2 cardCenter = vec2((uCardBounds.x + uCardBounds.z) * 0.5, (uCardBounds.y + uCardBounds.w) * 0.5);
  vec2 p = vWorldPos.xy - (cardCenter + vec2(0.0, 16.0));
  float d = sdRoundedBox(p, cardSize * 0.5, uRadius);
  float shadow = 1.0 - smoothstep(-32.0, 48.0, d);
  vec3 shadowCol = vec3(0.102, 0.129, 0.200);
  fragColor = vec4(shadowCol, shadow * uOpacity);
}
`;

const FS_WEBPAGE = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in vec3 vWorldPos;
uniform sampler2D uTexture;
uniform vec4 uCardBounds; // left, top, right, bottom
uniform float uCornerRadius;
uniform float uHazeFade;
out vec4 fragColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  vec2 cardSize = vec2(uCardBounds.z - uCardBounds.x, uCardBounds.w - uCardBounds.y);
  vec2 cardCenter = vec2((uCardBounds.x + uCardBounds.z) * 0.5, (uCardBounds.y + uCardBounds.w) * 0.5);
  vec2 p = vWorldPos.xy - cardCenter;
  
  float d = sdRoundedBox(p, cardSize * 0.5, uCornerRadius);
  float alpha = 1.0 - smoothstep(0.0, 1.5, d);
  if (alpha <= 0.0) discard;

  vec4 tex = texture(uTexture, vTexCoord);
  
  // Studio haze blending at fading bottom edge during dive
  if (uHazeFade > 0.0) {
    float fadeStart = uCardBounds.w - 100.0 * uHazeFade;
    if (vWorldPos.y > fadeStart) {
      float f = smoothstep(fadeStart, uCardBounds.w, vWorldPos.y);
      vec3 studioHaze = vec3(0.910, 0.930, 0.960);
      tex.rgb = mix(tex.rgb, studioHaze, f * uHazeFade);
      alpha *= (1.0 - f * uHazeFade);
    }
  }

  fragColor = vec4(tex.rgb, tex.a * alpha);
}
`;

const FS_LAYER_QUAD = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in vec3 vWorldPos;
uniform sampler2D uTexture;
uniform float uOpacity;
out vec4 fragColor;

void main() {
  vec4 tex = texture(uTexture, vTexCoord);
  fragColor = vec4(tex.rgb, tex.a * uOpacity);
}
`;

const FS_LAYER_SHADOW = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in vec3 vWorldPos;
uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uBlurRadius;
uniform vec2 uTexelSize;
out vec4 fragColor;

void main() {
  float alphaAccum = 0.0;
  float totalWeight = 0.0;
  
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      vec2 offset = vec2(float(x), float(y)) * (uBlurRadius * 0.4) * uTexelSize;
      float w = exp(-float(x * x + y * y) / 2.5);
      alphaAccum += texture(uTexture, vTexCoord + offset).a * w;
      totalWeight += w;
    }
  }
  
  float a = (alphaAccum / max(totalWeight, 0.001)) * uOpacity;
  if (a <= 0.002) discard;
  vec3 shadowCol = vec3(0.102, 0.129, 0.200);
  fragColor = vec4(shadowCol, a);
}
`;

// --- Post-Processing Depth of Field (DoF) Shaders ---
const VS_POST = `#version 300 es
layout(location = 0) in vec2 aPosition;
out vec2 vUV;
void main() {
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FS_DOF = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uColorTex;
uniform sampler2D uDepthTex;
uniform float uNear;
uniform float uFar;
uniform float uFocusDist;
uniform float uDofStrength;
out vec4 fragColor;

const int TAPS = 40;
const float GOLDEN_ANGLE = 2.39996323;

float linearizeDepth(float d) {
  return (2.0 * uNear * uFar) / (uFar + uNear - (d * 2.0 - 1.0) * (uFar - uNear));
}

void main() {
  float rawDepth = texture(uDepthTex, vUV).r;
  float depth = linearizeDepth(rawDepth);
  
  float blurRadius = 0.0;
  if (depth < uFocusDist) {
    blurRadius = 75.0 * (uFocusDist - depth) / max(depth, 1.0);
  } else {
    blurRadius = 6.0 * (depth - uFocusDist) / max(depth, 1.0);
  }
  blurRadius = clamp(blurRadius * uDofStrength, 0.0, 120.0);

  if (blurRadius < 0.5) {
    fragColor = texture(uColorTex, vUV);
    return;
  }

  vec4 accum = vec4(0.0);
  float totalWeight = 0.0;
  vec2 texelSize = vec2(1.0 / 1440.0, 1.0 / 1152.0);

  for (int i = 0; i < TAPS; i++) {
    float fi = float(i);
    float theta = fi * GOLDEN_ANGLE;
    float r = sqrt((fi + 0.5) / float(TAPS)) * blurRadius;
    vec2 offset = vec2(cos(theta), sin(theta)) * r * texelSize;
    
    vec4 tapColor = texture(uColorTex, vUV + offset);
    float tapDepth = linearizeDepth(texture(uDepthTex, vUV + offset).r);
    
    float tapBlur = 0.0;
    if (tapDepth < uFocusDist) {
      tapBlur = 75.0 * (uFocusDist - tapDepth) / max(tapDepth, 1.0);
    } else {
      tapBlur = 6.0 * (tapDepth - uFocusDist) / max(tapDepth, 1.0);
    }
    float w = clamp(tapBlur + 0.2, 0.1, 1.0);
    accum += tapColor * w;
    totalWeight += w;
  }

  fragColor = accum / max(totalWeight, 0.001);
}
`;

function createProgram(gl, vsSource, fsSource) {
  function compile(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, vsSource);
  const fs = compile(gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

// --- Main Engine Application ---
class IssueScoutCinemaEngine {
  constructor() {
    this.glCanvas = document.getElementById('glCanvas');
    this.overlayCanvas = document.getElementById('overlayCanvas');
    this.gl = this.glCanvas.getContext('webgl2', {
      antialias: true,
      depth: true,
      preserveDrawingBuffer: true
    });
    this.ctx = this.overlayCanvas.getContext('2d');

    this.extAniso = this.gl.getExtension('EXT_texture_filter_anisotropic');
    this.maxAniso = this.extAniso ? this.gl.getParameter(this.extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;

    this.programs = {};
    this.textures = {};
    this.buffers = {};
    this.fbo = null;
    this.isLoaded = false;
  }

  async init() {
    const gl = this.gl;

    this.programs.floor = createProgram(gl, VS_SCENE, FS_FLOOR);
    this.programs.pageShadow = createProgram(gl, VS_SCENE, FS_PAGE_SHADOW);
    this.programs.webpage = createProgram(gl, VS_SCENE, FS_WEBPAGE);
    this.programs.layer = createProgram(gl, VS_SCENE, FS_LAYER_QUAD);
    this.programs.layerShadow = createProgram(gl, VS_SCENE, FS_LAYER_SHADOW);
    this.programs.dof = createProgram(gl, VS_POST, FS_DOF);

    this.setupMeshBuffers();
    this.setupFramebuffer();
    await this.loadAllTextures();

    this.isLoaded = true;
    console.log('--- Issue Scout Cinema Engine Initialized Successfully ---');
  }

  setupMeshBuffers() {
    const gl = this.gl;

    // Unit Quad: [-0.5, -0.5] to [0.5, 0.5]
    // U is 1.0 on left and 0.0 on right to compensate for negative Cam X
    // V is 0.0 at top (y=-0.5) and 1.0 at bottom (y=0.5)
    const quadVertices = new Float32Array([
      -0.5, -0.5, 0.0,  1.0, 0.0, // top-left
       0.5, -0.5, 0.0,  0.0, 0.0, // top-right
       0.5,  0.5, 0.0,  0.0, 1.0, // bottom-right
      -0.5, -0.5, 0.0,  1.0, 0.0,
       0.5,  0.5, 0.0,  0.0, 1.0,
      -0.5,  0.5, 0.0,  1.0, 1.0  // bottom-left
    ]);

    this.buffers.quadVao = gl.createVertexArray();
    gl.bindVertexArray(this.buffers.quadVao);

    const quadVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);

    gl.bindVertexArray(null);

    // Fullscreen Post-Processing Quad
    const postVertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0
    ]);

    this.buffers.postVao = gl.createVertexArray();
    gl.bindVertexArray(this.buffers.postVao);

    const postVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, postVbo);
    gl.bufferData(gl.ARRAY_BUFFER, postVertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);

    gl.bindVertexArray(null);
  }

  setupFramebuffer() {
    const gl = this.gl;
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

    this.fboColorTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.fboColorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboColorTex, 0);

    this.fboDepthTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.fboDepthTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.fboDepthTex, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  loadTexture(src, generateMipmaps = true) {
    const gl = this.gl;
    const tex = gl.createTexture();
    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        if (generateMipmaps) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          if (this.extAniso) {
            gl.texParameterf(gl.TEXTURE_2D, this.extAniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, this.maxAniso));
          }
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        resolve(tex);
      };
      img.onerror = () => reject(new Error('Failed to load image: ' + src));
      img.src = src;
    });
  }

  async loadAllTextures() {
    this.textures.webpage = await this.loadTexture('capture/webpage_full.png', true);
    this.textures.btnFind = await this.loadTexture('capture/layer_btn_find.png', true);
    this.textures.cardFeatured = await this.loadTexture('capture/layer_card_featured.png', true);

    this.textures.chips = [];
    for (let i = 0; i < 4; i++) {
      this.textures.chips.push(await this.loadTexture(`capture/layer_chip_${i}.png`, true));
    }

    this.textures.filters = [];
    for (let i = 0; i < 5; i++) {
      this.textures.filters.push(await this.loadTexture(`capture/layer_filter_${i}.png`, true));
    }

    this.textures.brandTiles = [];
    for (let i = 0; i < 4; i++) {
      this.textures.brandTiles.push(await this.loadTexture(`capture/layer_brand_tile_${i}.png`, true));
    }
  }

  // --- Main Deterministic Render Function seek(t) ---
  seek(t) {
    if (!this.isLoaded) return;
    const gl = this.gl;
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    const cam = evaluateCamera(t);
    const lift = evaluateLiftElements(t);

    const near = Math.max(50.0, cam.dist * 0.05);
    const far = Math.max(35000.0, cam.dist * 3.5);
    const projMat = Mat4.create();
    Mat4.perspective(projMat, FOV_Y, ASPECT, near, far);

    const viewMat = Mat4.create();
    Mat4.lookAt(viewMat, cam.eye, cam.center, cam.up);

    // --- Pass 1: Render 3D Scene into FBO ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.910, 0.930, 0.960, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindVertexArray(this.buffers.quadVao);

    // A. Render Studio Floor Plane (Z = -4.0, depthMask false to eliminate any Z-fighting)
    {
      gl.useProgram(this.programs.floor);
      gl.depthMask(false);
      const model = Mat4.create();
      Mat4.translate(model, model, [0.0, LAYOUT.pageHeight * 0.5, -4.0]);
      model[0] = 60000.0; model[5] = 60000.0;
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.floor, 'uProjection'), false, projMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.floor, 'uView'), false, viewMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.floor, 'uModel'), false, model);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true);
    }

    // Compute animated card bounds for webpage and shadow
    let cardLeft = -LAYOUT.pageWidth * 0.5;
    let cardRight = LAYOUT.pageWidth * 0.5;
    let cardTop = 0.0;
    let cardBottom = LAYOUT.pageHeight;
    let cornerRadius = 24.0;
    let hazeFade = 0.0;

    if (t >= 9.47) {
      const s = smoothstep(9.47, 9.97, t);
      cardLeft = lerp(-LAYOUT.pageWidth * 0.5, -600.0, s);
      cardRight = lerp(LAYOUT.pageWidth * 0.5, 600.0, s);
      cardTop = lerp(0.0, 24.0, s);
      cardBottom = lerp(LAYOUT.pageHeight, 820.0, s);
      cornerRadius = lerp(24.0, 38.0, s);
      hazeFade = s;
    }

    // B. Render Full Webpage Contact Shadow on Floor (Z = -0.2)
    {
      gl.useProgram(this.programs.pageShadow);
      const model = Mat4.create();
      Mat4.translate(model, model, [0.0, LAYOUT.pageHeight * 0.5, -0.2]);
      model[0] = LAYOUT.pageWidth + 120.0;
      model[5] = LAYOUT.pageHeight + 120.0;

      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.pageShadow, 'uProjection'), false, projMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.pageShadow, 'uView'), false, viewMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.pageShadow, 'uModel'), false, model);
      gl.uniform4f(gl.getUniformLocation(this.programs.pageShadow, 'uCardBounds'), cardLeft, cardTop, cardRight, cardBottom);
      gl.uniform1f(gl.getUniformLocation(this.programs.pageShadow, 'uRadius'), cornerRadius);
      gl.uniform1f(gl.getUniformLocation(this.programs.pageShadow, 'uOpacity'), 0.32);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // C. Render Main Webpage Quad (Z = 0.0)
    {
      gl.useProgram(this.programs.webpage);
      const model = Mat4.create();
      Mat4.translate(model, model, [0.0, LAYOUT.pageHeight * 0.5, 0.0]);
      model[0] = LAYOUT.pageWidth;
      model[5] = LAYOUT.pageHeight;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.textures.webpage);
      gl.uniform1i(gl.getUniformLocation(this.programs.webpage, 'uTexture'), 0);

      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.webpage, 'uProjection'), false, projMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.webpage, 'uView'), false, viewMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.webpage, 'uModel'), false, model);
      gl.uniform4f(gl.getUniformLocation(this.programs.webpage, 'uCardBounds'), cardLeft, cardTop, cardRight, cardBottom);
      gl.uniform1f(gl.getUniformLocation(this.programs.webpage, 'uCornerRadius'), cornerRadius);
      gl.uniform1f(gl.getUniformLocation(this.programs.webpage, 'uHazeFade'), hazeFade);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // D. Helper to render floating element + shadow
    const renderFloatingElement = (tex, box, z, tiltDeg = 0.0, tiltZDeg = 0.0, driftX = 0, driftY = 0, customPos = null) => {
      if (z <= 0.001 || !box) return;

      const pad = box.pad || 28;
      const quadW = box.width + 2 * pad;
      const quadH = box.height + 2 * pad;
      
      let cx, cy;
      if (customPos) {
        cx = customPos.x;
        cy = customPos.y;
      } else {
        cx = -(box.x + box.width * 0.5 - LAYOUT.pageWidth * 0.5) - driftX;
        cy = (box.y + box.height * 0.5) + driftY;
      }

      // 1. Soft Shadow on webpage surface / floor (Z = 0.05)
      const shdx = -0.10 * z;
      const shdy = 4.0 + 0.36 * z;
      const shdModel = Mat4.create();
      Mat4.translate(shdModel, shdModel, [cx + shdx, cy + shdy, 0.05]);
      if (tiltZDeg !== 0.0) {
        Mat4.rotateZ(shdModel, shdModel, tiltZDeg * (Math.PI / 180.0));
      }
      shdModel[0] = quadW;
      shdModel[5] = quadH;

      gl.useProgram(this.programs.layerShadow);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(this.programs.layerShadow, 'uTexture'), 0);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.layerShadow, 'uProjection'), false, projMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.layerShadow, 'uView'), false, viewMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.layerShadow, 'uModel'), false, shdModel);
      gl.uniform1f(gl.getUniformLocation(this.programs.layerShadow, 'uOpacity'), 0.28);
      gl.uniform1f(gl.getUniformLocation(this.programs.layerShadow, 'uBlurRadius'), 7.0 + 0.5 * z);
      gl.uniform2f(gl.getUniformLocation(this.programs.layerShadow, 'uTexelSize'), 1.0 / quadW, 1.0 / quadH);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // 2. Lifted Quad
      const quadModel = Mat4.create();
      Mat4.translate(quadModel, quadModel, [cx, cy, z]);
      if (tiltZDeg !== 0.0) {
        Mat4.rotateZ(quadModel, quadModel, tiltZDeg * (Math.PI / 180.0));
      }
      if (tiltDeg !== 0.0) {
        Mat4.rotateX(quadModel, quadModel, tiltDeg * (Math.PI / 180.0));
      }
      quadModel[0] = quadW;
      quadModel[5] = quadH;

      gl.useProgram(this.programs.layer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(this.programs.layer, 'uTexture'), 0);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.layer, 'uProjection'), false, projMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.layer, 'uView'), false, viewMat);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.layer, 'uModel'), false, quadModel);
      gl.uniform1f(gl.getUniformLocation(this.programs.layer, 'uOpacity'), 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    // Render Floating Elements:
    renderFloatingElement(this.textures.btnFind, LAYOUT.findButton, lift.btnLift, lift.btnTilt);

    for (let i = 0; i < 4; i++) {
      renderFloatingElement(this.textures.chips[i], LAYOUT.chips[i], lift.chipLift, lift.chipTilt);
    }

    for (let i = 0; i < 5; i++) {
      renderFloatingElement(this.textures.filters[i], LAYOUT.filters[i], lift.filterLifts[i], lift.filterTilts[i]);
    }

    renderFloatingElement(this.textures.cardFeatured, LAYOUT.featuredCard, lift.cardLift, lift.cardTilt);

    // Render 4 Squircle Brand Tiles:
    if (t < 8.8) {
      // Phase 1: Hero flight lift (0.10s to 1.45s)
      for (let i = 0; i < 4; i++) {
        if (lift.tileLifts[i] > 0.001) {
          renderFloatingElement(
            this.textures.brandTiles[i],
            LAYOUT.brandTiles[i],
            lift.tileLifts[i],
            lift.tileTilts[i],
            (i % 2 === 0 ? -6.0 : 6.0)
          );
        }
      }
    } else if (t < 9.47) {
      // Phase 2: Overhead hold (8.8s to 9.47s) - tiles sit at top corners of page
      const sOverhead = smoothstep(8.8, 9.25, t);
      const overheadTiles = [
        { x: 520.0, y: 80.0, rotZ: -8.0 },
        { x: 400.0, y: 80.0, rotZ: 5.0 },
        { x: -400.0, y: 80.0, rotZ: -5.0 },
        { x: -520.0, y: 80.0, rotZ: 8.0 }
      ];
      for (let i = 0; i < 4; i++) {
        const ot = overheadTiles[i];
        renderFloatingElement(
          this.textures.brandTiles[i],
          LAYOUT.brandTiles[i],
          14.0 * sOverhead,
          0.0,
          ot.rotZ,
          0, 0,
          { x: ot.x, y: ot.y }
        );
      }
    } else {
      // Phase 3: Dive & End Card (9.47s to 14.50s)
      const sEnd = smoothstep(9.47, 9.97, t);
      const sDrift = clamp((t - 9.97) / (14.5 - 9.97), 0.0, 1.0);
      const driftX = 6.0 * Math.sin(sDrift * Math.PI);
      const driftY = 4.0 * Math.cos(sDrift * Math.PI * 0.5);

      const endTiles = [
        // Tile 0: Top-Left (tilted -14deg, z=24, completely clear of header)
        { x: 740.0 + driftX, y: 30.0 + driftY, z: 24.0, rotX: 6.0, rotZ: -14.0 },
        // Tile 1: Top-Right (tilted +16deg, z=24, completely clear of header)
        { x: -740.0 - driftX, y: 30.0 + driftY, z: 24.0, rotX: 6.0, rotZ: 16.0 },
        // Tile 2: Bottom-Right (tilted -12deg, z=28)
        { x: -740.0 - driftX, y: 460.1 - driftY, z: 28.0, rotX: 8.0, rotZ: -12.0 },
        // Tile 3: Bottom-Left (foreground bokeh: z=90, tilted +10deg)
        { x: 720.0 + driftX, y: 695.9 - driftY, z: 90.0, rotX: 14.0, rotZ: 10.0 }
      ];

      for (let i = 0; i < 4; i++) {
        const et = endTiles[i];
        renderFloatingElement(
          this.textures.brandTiles[i],
          LAYOUT.brandTiles[i],
          et.z * sEnd,
          et.rotX,
          et.rotZ,
          0, 0,
          { x: et.x, y: et.y }
        );
      }
    }

    // --- Pass 2: Post-Processing Depth of Field (DoF) to Screen ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    gl.useProgram(this.programs.dof);
    gl.bindVertexArray(this.buffers.postVao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboColorTex);
    gl.uniform1i(gl.getUniformLocation(this.programs.dof, 'uColorTex'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fboDepthTex);
    gl.uniform1i(gl.getUniformLocation(this.programs.dof, 'uDepthTex'), 1);

    const dx = cam.eye[0] - cam.center[0];
    const dy = cam.eye[1] - cam.center[1];
    const dz = cam.eye[2] - cam.center[2];
    const focusDist = Math.hypot(dx, dy, dz);

    let dofStrength = 1.0;
    if (t >= 7.75 && t < 9.47) {
      dofStrength = 1.0 - smoothstep(7.75, 8.65, t);
    } else if (t >= 9.47) {
      dofStrength = smoothstep(9.47, 9.97, t) * 0.85;
    }

    gl.uniform1f(gl.getUniformLocation(this.programs.dof, 'uNear'), near);
    gl.uniform1f(gl.getUniformLocation(this.programs.dof, 'uFar'), far);
    gl.uniform1f(gl.getUniformLocation(this.programs.dof, 'uFocusDist'), focusDist);
    gl.uniform1f(gl.getUniformLocation(this.programs.dof, 'uDofStrength'), dofStrength);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- Pass 3: End-Card 2D Typography & Badge Overlay ---
    this.renderOverlay(t);

    // Guaranteed Synchronous GPU Readback Barrier
    gl.flush();
    gl.finish();
    const syncPix = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, syncPix);
  }

  renderOverlay(t) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 2880, 2304);

    // Overhead hold label (8.8s to 9.5s)
    if (t >= 8.8 && t <= 9.5) {
      const sOverhead = smoothstep(8.8, 9.2, t) * (1.0 - smoothstep(9.38, 9.5, t));
      ctx.save();
      ctx.scale(2.0, 2.0);
      ctx.globalAlpha = sOverhead;
      ctx.font = '700 28px Geist, system-ui, sans-serif';
      ctx.letterSpacing = '0.06em';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('ISSUE', 720 - 46, 1100);
      ctx.fillStyle = '#0891b2';
      ctx.fillText('SCOUT', 720 + 46, 1100);
      ctx.restore();
    }

    if (t < 9.97) return;

    ctx.save();
    ctx.scale(2.0, 2.0);

    // 1. Restrained White Badge Pill at y ≈ 46 (height ≈ 24px)
    if (t >= 9.97) {
      const sBadge = smoothstep(9.97, 10.15, t);
      ctx.save();
      ctx.globalAlpha = sBadge;

      const badgeY = lerp(36.0, 46.0, sBadge);
      const badgeW = 148.0;
      const badgeH = 24.0;
      const badgeX = (1440.0 - badgeW) * 0.5;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12.0);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '700 11px Geist, system-ui, sans-serif';
      ctx.letterSpacing = '0.08em';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textY = badgeY + badgeH * 0.5 + 0.5;
      ctx.fillStyle = '#0f172a';
      ctx.fillText('ISSUE', badgeX + 52.0, textY);
      ctx.fillStyle = '#0891b2';
      ctx.fillText('SCOUT', badgeX + 96.0, textY);

      ctx.restore();
    }

    // 2. Main Title: "Find issues." (Geist 500, 74px, color #0f172a)
    if (t >= 10.12) {
      ctx.save();
      ctx.font = '500 74px Geist, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#0f172a';

      const titleY = 135.0;

      const sFind = smoothstep(10.12, 10.28, t);
      const sIssues = smoothstep(10.18, 10.34, t);

      const wFind = ctx.measureText('Find ').width;
      const wIssues = ctx.measureText('issues.').width;
      const totalW = wFind + wIssues;
      const startX = (1440.0 - totalW) * 0.5;

      if (sFind > 0.0) {
        ctx.save();
        ctx.globalAlpha = sFind;
        const yOff = (1.0 - sFind) * 12.0;
        ctx.fillText('Find ', startX + wFind * 0.5, titleY + yOff);
        ctx.restore();
      }

      if (sIssues > 0.0) {
        ctx.save();
        ctx.globalAlpha = sIssues;
        const yOff = (1.0 - sIssues) * 12.0;
        ctx.fillText('issues.', startX + wFind + wIssues * 0.5, titleY + yOff);
        ctx.restore();
      }

      ctx.restore();
    }

    // 3. Italic Tail: "Build something real." (Instrument Serif italic, 82px, #8b8b92)
    if (t >= 10.36) {
      ctx.save();
      ctx.font = 'italic 400 82px "Instrument Serif", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#8b8b92';

      const tailY = 222.0;

      const words = [
        { text: 'Build ', tStart: 10.36 },
        { text: 'something ', tStart: 10.41 },
        { text: 'real.', tStart: 10.46 }
      ];

      let totalTailW = 0;
      const wordMetrics = words.map(w => {
        const width = ctx.measureText(w.text).width;
        totalTailW += width;
        return { ...w, width };
      });

      let currentX = (1440.0 - totalTailW) * 0.5;

      for (const wm of wordMetrics) {
        if (t >= wm.tStart) {
          const s = clamp((t - wm.tStart) / 0.34, 0.0, 1.0);
          const ease = s * s * (3.0 - 2.0 * s);
          
          ctx.save();
          ctx.globalAlpha = ease;
          const yOff = (1.0 - ease) * 16.0;
          const blurVal = (1.0 - ease) * 12.0;
          if (blurVal > 0.5) {
            ctx.filter = `blur(${blurVal.toFixed(1)}px)`;
          }

          ctx.fillText(wm.text, currentX + wm.width * 0.5, tailY + yOff);
          ctx.restore();
        }
        currentX += wm.width;
      }

      ctx.restore();
    }

    ctx.restore();
  }
}

window.cinemaEngine = new IssueScoutCinemaEngine();
window.cinemaEngine.init().then(() => {
  window.cinemaReady = true;
  console.log('--- window.cinemaReady = true ---');
});

window.seek = function(t) {
  if (window.cinemaEngine && window.cinemaEngine.isLoaded) {
    window.cinemaEngine.seek(t);
  }
};
