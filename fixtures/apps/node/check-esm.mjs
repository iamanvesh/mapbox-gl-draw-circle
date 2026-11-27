// Node ESM consumer (also what SSR frameworks do on the server): import must succeed without a DOM.
import assert from 'node:assert/strict';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

const before = { ...MapboxDraw.modes.simple_select };
const plugin = await import('mapbox-gl-draw-circle');

assert.deepEqual(Object.keys(plugin).sort(), ['CircleMode', 'DirectMode', 'DragCircleMode', 'SimpleSelectMode']);
for (const mode of Object.values(plugin)) assert.equal(typeof mode.onSetup, 'function');
assert.deepEqual({ ...MapboxDraw.modes.simple_select }, before, 'plugin must not mutate MapboxDraw.modes');

// Only the documented entry points are exported.
await assert.rejects(import('mapbox-gl-draw-circle/lib/modes/CircleMode.js'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
console.log('node ESM import: ok');
