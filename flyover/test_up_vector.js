const fs = require('fs');

// Test lookAt with different up vectors
function testLookAt(eye, center, up) {
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

  console.log('Up:', up);
  console.log('Camera X axis (points right):', [x0, x1, x2]);
  console.log('Camera Y axis (points up on screen):', [y0, y1, y2]);
  console.log('Camera Z axis (points toward eye):', [z0, z1, z2]);
}

console.log('--- Case 1: Flight tilt = 56 deg ---');
// targetY = 420, dist = 1360, tilt = 56 deg
const tiltRad = 56 * Math.PI / 180;
const eye = [0, 420 - 1360 * Math.sin(tiltRad), 1360 * Math.cos(tiltRad)];
const center = [0, 420, 0];

// Let's test up = [0, 0, 1]
console.log('\nTesting up = [0, 0, 1]:');
testLookAt(eye, center, [0, 0, 1]);

// Let's test top-down overhead: tilt = 0
console.log('\n--- Case 2: Overhead tilt = 0 deg ---');
const eyeOverhead = [0, 3133.5, 11032];
const centerOverhead = [0, 3133.5, 0];
console.log('Testing overhead up = [0, -1, 0]:');
testLookAt(eyeOverhead, centerOverhead, [0, -1, 0]);
