import { jest } from '@jest/globals';

/**
 * Minimal stand-in for draw's internal Polygon feature (not exported by mapbox-gl-draw).
 * Like draw, it stores rings without the closing point and closes them in getCoordinates().
 */
export class FakePolygon {
  constructor({ id = 'feature-1', properties = {}, coordinates = [[]] } = {}) {
    this.id = id;
    this.type = 'Polygon';
    this.properties = properties;
    this.incomingCoords(coordinates);
  }

  incomingCoords(coords) {
    this.coordinates = coords.map((ring) => ring.slice(0, -1));
  }

  getCoordinates() {
    return this.coordinates.map((ring) => ring.concat(ring.length ? [ring[0]] : []));
  }

  getCoordinate(path) {
    const [ring, i] = path.split('.').map(Number);
    return this.coordinates[ring][i];
  }

  updateCoordinate(path, lng, lat) {
    const [ring, i] = path.split('.').map(Number);
    this.coordinates[ring][i] = [lng, lat];
  }

  removeCoordinate(path) {
    const [ring, i] = path.split('.').map(Number);
    this.coordinates[ring].splice(i, 1);
  }

  isValid() {
    return this.coordinates.every((ring) => ring.length > 2);
  }

  changed() {}

  toGeoJSON() {
    return {
      type: 'Feature',
      id: this.id,
      properties: this.properties,
      geometry: { type: 'Polygon', coordinates: this.getCoordinates() },
    };
  }
}

/** Draw's internal geojson for rendering: properties become user_* (userProperties: true). */
export function displayGeojson(feature, { active = 'false' } = {}) {
  const user = Object.fromEntries(Object.entries(feature.properties).map(([k, v]) => [`user_${k}`, v]));
  return {
    type: 'Feature',
    properties: { ...user, id: feature.id, meta: 'feature', active },
    geometry: { type: 'Polygon', coordinates: feature.getCoordinates() },
  };
}

/**
 * Binds a mode object the way draw's object_to_mode does: every key of the mode is copied onto
 * a mode-interface object, so `this` inside handlers is that object.
 */
export function bindMode(modeObject, { selected = [], features = {} } = {}) {
  const store = new Map(Object.entries(features));
  const ctx = {
    map: {
      fire: jest.fn(),
      dragPan: { enable: jest.fn(), disable: jest.fn(), isEnabled: jest.fn(() => true) },
      doubleClickZoom: { enable: jest.fn(), disable: jest.fn(), isEnabled: jest.fn(() => true) },
    },
    _ctx: { store: { getInitialConfigValue: jest.fn(() => true) } },
    drawConfig: {},
    newFeature: jest.fn((geojson) => new FakePolygon({
      properties: geojson.properties,
      coordinates: geojson.geometry.coordinates,
    })),
    addFeature: jest.fn((f) => store.set(f.id, f)),
    getFeature: jest.fn((id) => store.get(id)),
    deleteFeature: jest.fn((ids) => [].concat(ids).forEach((id) => store.delete(id))),
    clearSelectedFeatures: jest.fn(),
    updateUIClasses: jest.fn(),
    activateUIButton: jest.fn(),
    setActionableState: jest.fn(),
    changeMode: jest.fn(),
    fire: jest.fn(),
    fireActionable: jest.fn(),
    getSelected: jest.fn(() => selected),
    isSelected: jest.fn((id) => selected.some((f) => f.id === id)),
    isInstanceOf: (type, feature) => feature.type === type,
  };
  const mode = Object.assign(ctx, modeObject);
  // Modes define their own fireActionable; spy on whichever one ends up bound.
  jest.spyOn(mode, 'fireActionable');
  return mode;
}

/** Draw-style mouse event. */
export const mouseEvent = ([lng, lat]) => ({
  lngLat: { lng, lat },
  point: { x: 0, y: 0 },
  originalEvent: { stopPropagation: jest.fn(), button: 0 },
});

/** Great-circle distance in km (turf's earth radius). */
export function distanceKm([lng1, lat1], [lng2, lat2]) {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
}

/** Asserts a closed ring of 65 points (turf's 64 steps) all at radiusInKm around center. */
export function expectCircleRing(ring, center, radiusInKm) {
  expect(ring).toHaveLength(65);
  expect(ring[0]).toEqual(ring[64]);
  for (const pt of ring) expect(distanceKm(center, pt)).toBeCloseTo(radiusInKm, 3);
}
