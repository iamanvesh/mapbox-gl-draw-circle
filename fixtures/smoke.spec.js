// Same smoke test for every framework fixture. Each app exposes window.__demo = { map, draw, ready }
// once the draw control is added. The full behaviour suite lives in examples/demo/e2e.
import { test, expect } from '@playwright/test';

test(`${process.env.SMOKE_NAME}: draws a circle with the packed package`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/');
  await page.waitForFunction(() => window.__demo?.ready && window.__demo.map.loaded(), null, { timeout: 20_000 });

  await page.evaluate(() => window.__demo.draw.changeMode('draw_circle', { initialRadiusInKm: 1 }));
  const box = await page.locator('.mapboxgl-canvas').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await expect.poll(() => page.evaluate(() => window.__demo.draw.getAll().features.length)).toBe(1);
  const feature = await page.evaluate(() => window.__demo.draw.getAll().features[0]);
  expect(feature.geometry.type).toBe('Polygon');
  expect(feature.properties).toMatchObject({ isCircle: true, radiusInKm: 1 });
  expect(feature.properties.center).toHaveLength(2);
  expect(await page.evaluate(() => window.__demo.draw.getMode())).toBe('simple_select');
  expect(errors).toEqual([]);
});
