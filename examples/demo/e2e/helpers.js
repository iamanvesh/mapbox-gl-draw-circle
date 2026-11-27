import { test as base, expect } from '@playwright/test';

/**
 * Fixture that opens the demo, waits for the map + draw control, and fails the test
 * on any uncaught page error (e.g. "not a valid GeoJSON object" from issue #21).
 */
export const test = base.extend({
  demo: async ({ page }, use) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));
    await page.goto('/');
    await page.waitForFunction(() => window.__demo && window.__demo.ready && window.__demo.map.loaded());
    await use(new Demo(page));
    expect(pageErrors.map(String), 'uncaught page errors').toEqual([]);
  },
});

export { expect };

class Demo {
  constructor(page) {
    this.page = page;
  }

  changeMode(mode, opts) {
    return this.page.evaluate(([m, o]) => window.__demo.draw.changeMode(m, o), [mode, opts]);
  }

  mode() {
    return this.page.evaluate(() => window.__demo.draw.getMode());
  }

  features() {
    return this.page.evaluate(() => window.__demo.draw.getAll().features);
  }

  events(type) {
    return this.page.evaluate((t) => window.__demo.events.filter((e) => !t || e.type === t), type);
  }

  dragPanEnabled() {
    return this.page.evaluate(() => window.__demo.map.dragPan.isEnabled());
  }

  /** Page (viewport) pixel position of a [lng, lat]. */
  async toPixel(lngLat) {
    return this.page.evaluate((ll) => {
      const { map } = window.__demo;
      const p = map.project(ll);
      const r = map.getCanvas().getBoundingClientRect();
      return { x: r.left + p.x, y: r.top + p.y };
    }, lngLat);
  }

  /** [lng, lat] at a page pixel position. */
  async toLngLat({ x, y }) {
    return this.page.evaluate(([px, py]) => {
      const { map } = window.__demo;
      const r = map.getCanvas().getBoundingClientRect();
      return map.unproject([px - r.left, py - r.top]).toArray();
    }, [x, y]);
  }

  /** Pixel near the middle of the map, clear of the toolbar. */
  async mapPoint(dx = 0, dy = 0) {
    const box = await this.page.locator('#map canvas').boundingBox();
    return { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy };
  }

  async click(pt) {
    await this.page.mouse.click(pt.x, pt.y);
  }

  async drag(from, to, steps = 15) {
    const { mouse } = this.page;
    await mouse.move(from.x, from.y);
    await mouse.down();
    await mouse.move(to.x, to.y, { steps });
    await mouse.up();
  }

  /**
   * Let draw's setTimeout(0) handlers (dragPan / doubleClickZoom toggles) run and the map render,
   * so the next pointer event can hit-test the vertices that were just drawn.
   */
  async settle() {
    await this.page.evaluate(() => new Promise((resolve) => {
      setTimeout(() => {
        const { map } = window.__demo;
        map.triggerRepaint();
        map.once('idle', resolve);
      }, 50);
    }));
  }
}

/** Great-circle distance in km (same model turf uses: earth radius 6371.0088 km). */
export function distanceKm([lng1, lat1], [lng2, lat2]) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
}
