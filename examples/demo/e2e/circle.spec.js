import { test, expect, distanceKm } from './helpers.js';

const ringOf = (f) => f.geometry.coordinates[0];

// Known bugs in the published 1.1.2 (baseline, see e2e/BASELINE.md). Playwright reports an error
// once a fix makes one of these pass, so each marker has to be removed together with its fix.
const MISSING_VERTEX = 'baseline: every created circle loses ring point 1 (64 instead of 65 points)';
const knownBug = (reason) => test.fail(true, reason);

/** Checks the circle invariants every mode must keep. */
function expectValidCircle(f, { center, radiusInKm }, tol = 0.02) {
  expect.soft(f.geometry.type).toBe('Polygon');
  expect.soft(f.properties.isCircle).toBe(true);
  expect.soft(f.properties.center[0]).toBeCloseTo(center[0], 5);
  expect.soft(f.properties.center[1]).toBeCloseTo(center[1], 5);
  expect.soft(f.properties.radiusInKm).toBeGreaterThan(radiusInKm * (1 - tol));
  expect.soft(f.properties.radiusInKm).toBeLessThan(radiusInKm * (1 + tol));
  const ring = ringOf(f);
  expect.soft(ring.length).toBe(65); // turf default: 64 steps + closing point
  expect.soft(ring[0]).toEqual(ring[ring.length - 1]);
  // Every ring point sits on the stated radius around the stated center.
  for (const pt of ring) {
    expect.soft(distanceKm(f.properties.center, pt)).toBeCloseTo(f.properties.radiusInKm, 2);
  }
}

test.describe('draw_circle (click)', () => {
  test('one click creates a circle of initialRadiusInKm and returns to simple_select', async ({ demo }) => {
    knownBug(MISSING_VERTEX);
    await demo.changeMode('draw_circle', { initialRadiusInKm: 0.5 });
    const pt = await demo.mapPoint();
    const clicked = await demo.toLngLat(pt);
    await demo.click(pt);
    await demo.settle();

    const features = await demo.features();
    expect(features).toHaveLength(1);
    expectValidCircle(features[0], { center: clicked, radiusInKm: 0.5 });
    expect(await demo.mode()).toBe('simple_select');
    expect(await demo.events('draw.create')).toHaveLength(1);
  });

  test('defaults to a 2 km radius', async ({ demo }) => {
    knownBug(MISSING_VERTEX);
    await demo.changeMode('draw_circle');
    const pt = await demo.mapPoint();
    const clicked = await demo.toLngLat(pt);
    await demo.click(pt);
    await demo.settle();
    expectValidCircle((await demo.features())[0], { center: clicked, radiusInKm: 2 });
  });
});

test.describe('drag_circle', () => {
  test('press-drag-release creates a circle whose radius is the drag distance', async ({ demo }) => {
    knownBug(MISSING_VERTEX);
    await demo.changeMode('drag_circle');
    const from = await demo.mapPoint(-50, 0);
    const to = await demo.mapPoint(100, 0);
    const center = await demo.toLngLat(from);
    const edge = await demo.toLngLat(to);
    await demo.drag(from, to);
    await demo.settle();

    const features = await demo.features();
    expect(features).toHaveLength(1);
    expectValidCircle(features[0], { center, radiusInKm: distanceKm(center, edge) });
    expect(await demo.mode()).toBe('simple_select');
    expect(await demo.events('draw.create')).toHaveLength(1);
  });

  test('the map did not pan during the drag and panning is re-enabled afterwards', async ({ demo }) => {
    const before = await demo.page.evaluate(() => window.__demo.map.getCenter().toArray());
    await demo.changeMode('drag_circle');
    await demo.drag(await demo.mapPoint(-50, 0), await demo.mapPoint(100, 40));
    await demo.settle();
    const after = await demo.page.evaluate(() => window.__demo.map.getCenter().toArray());
    expect(after[0]).toBeCloseTo(before[0], 6);
    expect(after[1]).toBeCloseTo(before[1], 6);
    expect(await demo.dragPanEnabled()).toBe(true);
  });

  test('a click without dragging does not throw or leave an invalid feature (#11, #21)', async ({ demo }) => {
    knownBug('baseline: leaves a 1-point polygon behind (#11, #21)');
    await demo.changeMode('drag_circle');
    await demo.click(await demo.mapPoint());
    await demo.settle();
    for (const f of await demo.features()) {
      expect(ringOf(f).length).toBeGreaterThanOrEqual(4);
    }
  });
});

test.describe('editing a circle', () => {
  /** Creates a 0.5 km circle at the map center and returns it. */
  async function createCircle(demo) {
    await demo.changeMode('draw_circle', { initialRadiusInKm: 0.5 });
    await demo.click(await demo.mapPoint());
    await demo.settle();
    return (await demo.features())[0];
  }

  test('simple_select: dragging the circle moves center and ring together', async ({ demo }) => {
    knownBug(MISSING_VERTEX);
    const circle = await createCircle(demo);
    await demo.changeMode('simple_select', { featureIds: [circle.id] });
    const from = await demo.toPixel(circle.properties.center);
    const to = { x: from.x + 120, y: from.y + 60 };
    const newCenter = await demo.toLngLat(to);
    await demo.drag(from, to);
    await demo.settle();

    const moved = (await demo.features())[0];
    expectValidCircle(moved, { center: newCenter, radiusInKm: 0.5 }, 0.05);
    expect(await demo.dragPanEnabled()).toBe(true);
  });

  test('direct_select: dragging a handle resizes the circle and keeps the center', async ({ demo }) => {
    const circle = await createCircle(demo);
    await demo.changeMode('direct_select', { featureId: circle.id });
    await demo.settle();
    // Handle 0 is the northernmost ring point (turf starts at bearing 0).
    const handle = await demo.toPixel(ringOf(circle)[0]);
    const to = { x: handle.x, y: handle.y - 80 };
    const target = await demo.toLngLat(to);
    await demo.drag(handle, to);
    await demo.settle();

    const resized = (await demo.features())[0];
    expectValidCircle(resized, {
      center: circle.properties.center,
      radiusInKm: distanceKm(circle.properties.center, target),
    });
    expect(resized.properties.radiusInKm).toBeGreaterThan(0.5);
    expect(await demo.dragPanEnabled()).toBe(true);
  });

  test('direct_select: dragging the body moves the circle (#24)', async ({ demo }) => {
    knownBug(MISSING_VERTEX);
    const circle = await createCircle(demo);
    await demo.changeMode('direct_select', { featureId: circle.id });
    await demo.settle();
    const from = await demo.toPixel(circle.properties.center);
    const to = { x: from.x - 100, y: from.y + 50 };
    const newCenter = await demo.toLngLat(to);
    await demo.drag(from, to);
    await demo.settle();
    expectValidCircle((await demo.features())[0], { center: newCenter, radiusInKm: 0.5 }, 0.05);
  });

  test('trash deletes the selected circle', async ({ demo }) => {
    const circle = await createCircle(demo);
    await demo.changeMode('simple_select', { featureIds: [circle.id] });
    await demo.page.click('#trash');
    await demo.settle();
    expect(await demo.features()).toHaveLength(0);
    expect(await demo.events('draw.delete')).toHaveLength(1);
  });
});

test.describe('core draw modes are unaffected', () => {
  test('draw_polygon still draws a regular polygon (#5)', async ({ demo }) => {
    await demo.changeMode('draw_polygon');
    const pts = [await demo.mapPoint(-80, -60), await demo.mapPoint(80, -60), await demo.mapPoint(0, 80)];
    for (const p of pts) { await demo.click(p); await demo.settle(); }
    await demo.click(pts[0]); // close the ring
    await demo.settle();

    const features = await demo.features();
    expect(features).toHaveLength(1);
    expect(features[0].geometry.type).toBe('Polygon');
    expect(features[0].properties.isCircle).toBeUndefined();
    expect(ringOf(features[0])).toHaveLength(4);
  });

  test('direct_select on a polygon moves a single vertex', async ({ demo }) => {
    await demo.changeMode('draw_polygon');
    const pts = [await demo.mapPoint(-80, -60), await demo.mapPoint(80, -60), await demo.mapPoint(0, 80)];
    for (const p of pts) { await demo.click(p); await demo.settle(); }
    await demo.click(pts[0]);
    await demo.settle();
    const poly = (await demo.features())[0];

    await demo.changeMode('direct_select', { featureId: poly.id });
    await demo.settle();
    const to = { x: pts[2].x + 40, y: pts[2].y + 40 };
    const target = await demo.toLngLat(to);
    await demo.drag(pts[2], to);
    await demo.settle();

    const ring = ringOf((await demo.features())[0]);
    expect(ring[2][0]).toBeCloseTo(target[0], 4);
    expect(ring[2][1]).toBeCloseTo(target[1], 4);
    expect(ring[0]).toEqual(ringOf(poly)[0]);
  });
});
