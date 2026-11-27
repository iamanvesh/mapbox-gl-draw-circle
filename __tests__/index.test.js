import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

const root = join(import.meta.dirname, '..');

const listJs = (dir) => readdirSync(join(root, dir), { recursive: true })
  .filter((f) => f.endsWith('.js'))
  .map((f) => join(dir, f));

describe('package entry', () => {
  test('exports the four modes', async () => {
    const mod = await import('../index.js');
    expect(Object.keys(mod).sort()).toEqual(['CircleMode', 'DirectMode', 'DragCircleMode', 'SimpleSelectMode']);
    for (const mode of Object.values(mod)) expect(typeof mode.onSetup).toBe('function');
  });

  test('importing the plugin leaves MapboxDraw.modes untouched', async () => {
    const before = Object.fromEntries(
      Object.entries(MapboxDraw.modes).map(([name, mode]) => [name, { ...mode }]),
    );
    const { SimpleSelectMode, DirectMode, CircleMode, DragCircleMode } = await import('../index.js');

    for (const [name, mode] of Object.entries(MapboxDraw.modes)) {
      expect(mode).toEqual(before[name]);
    }
    expect(SimpleSelectMode).not.toBe(MapboxDraw.modes.simple_select);
    expect(DirectMode).not.toBe(MapboxDraw.modes.direct_select);
    expect(CircleMode).not.toBe(MapboxDraw.modes.draw_polygon);
    expect(DragCircleMode).not.toBe(MapboxDraw.modes.draw_polygon);
  });

  test('source only uses the public mapbox-gl-draw entry point (no src/ deep imports)', () => {
    for (const file of ['index.js', ...listJs('lib')]) {
      const source = readFileSync(join(root, file), 'utf8');
      expect({ file, deepImports: source.match(/@mapbox\/mapbox-gl-draw\/[^'"]*/g) }).toEqual({ file, deepImports: null });
    }
  });
});
