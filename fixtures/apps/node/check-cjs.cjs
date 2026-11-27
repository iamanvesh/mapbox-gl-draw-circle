// CommonJS consumer: works through Node's require(esm), available from Node 20.19 / 22.12.
const assert = require('node:assert/strict');

const [major, minor] = process.versions.node.split('.').map(Number);
const hasRequireEsm = major > 22 || (major === 22 && minor >= 12) || (major === 20 && minor >= 19);
if (!hasRequireEsm) {
  console.log(`node CJS require: skipped (Node ${process.versions.node} has no require(esm))`);
  process.exit(0);
}

const { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } = require('mapbox-gl-draw-circle');
for (const mode of [CircleMode, DragCircleMode, DirectMode, SimpleSelectMode]) {
  assert.equal(typeof mode.onSetup, 'function');
}
console.log('node CJS require: ok');
