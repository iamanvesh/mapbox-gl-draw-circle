import { jest } from '@jest/globals';
import { circle } from '@turf/circle';
import createSupplementaryPointsForCircle from '../../lib/utils/create_supplementary_points_circle.js';
import { captureCircles, redrawMovedCircles, fireEvent } from '../../lib/utils/circle.js';
import { FakePolygon, expectCircleRing } from '../helpers.js';

describe('createSupplementaryPointsForCircle', () => {
  const ring = circle([0, 0], 1).geometry.coordinates;

  test('returns 4 handle vertices at the quarter points of the ring', () => {
    const points = createSupplementaryPointsForCircle({
      properties: { id: 'c1', user_isCircle: true },
      geometry: { type: 'Polygon', coordinates: ring },
    });
    expect(points.map((p) => p.properties.coord_path)).toEqual(['0.0', '0.16', '0.32', '0.48']);
    expect(points.map((p) => p.geometry.coordinates)).toEqual([ring[0][0], ring[0][16], ring[0][32], ring[0][48]]);
    expect(points.every((p) => p.properties.parent === 'c1' && p.properties.meta === 'vertex')).toBe(true);
  });

  test('returns null for features that are not circles', () => {
    expect(createSupplementaryPointsForCircle({ properties: {}, geometry: { coordinates: ring } })).toBeNull();
  });
});

describe('captureCircles / redrawMovedCircles', () => {
  const makeCircle = (center, radiusInKm) => new FakePolygon({
    properties: { isCircle: true, center, radiusInKm },
    coordinates: circle(center, radiusInKm).geometry.coordinates,
  });
  const shift = (f, dLng, dLat) => f.incomingCoords(f.getCoordinates().map((r) => r.map(([x, y]) => [x + dLng, y + dLat])));

  test('ignores non-circles and circles without a center', () => {
    const square = new FakePolygon({ coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] });
    const legacy = new FakePolygon({ properties: { isCircle: true }, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] });
    expect(captureCircles([square, legacy])).toEqual([]);
  });

  test('redraws each circle around its center moved by the applied delta', () => {
    const c = makeCircle([2, 3], 5);
    const captured = captureCircles([c]);
    shift(c, 1, 20);
    redrawMovedCircles(captured);
    expect(c.properties.center[0]).toBeCloseTo(3, 10);
    expect(c.properties.center[1]).toBeCloseTo(23, 10);
    expectCircleRing(c.getCoordinates()[0], c.properties.center, 5);
  });

  test('moves only the center of a circle without a stored radius', () => {
    const c = makeCircle([2, 3], 5);
    delete c.properties.radiusInKm;
    const captured = captureCircles([c]);
    shift(c, 1, 1);
    redrawMovedCircles(captured);
    expect(c.properties.center[0]).toBeCloseTo(3, 10);
    expect(c.properties.center[1]).toBeCloseTo(4, 10);
  });
});

describe('fireEvent', () => {
  test('uses mode.fire when present (mapbox-gl-draw >= 1.5)', () => {
    const mode = { fire: jest.fn(), map: { fire: jest.fn() } };
    fireEvent(mode, 'draw.create', { features: [] });
    expect(mode.fire).toHaveBeenCalledWith('draw.create', { features: [] });
    expect(mode.map.fire).not.toHaveBeenCalled();
  });

  test('falls back to map.fire (mapbox-gl-draw 1.4)', () => {
    const mode = { map: { fire: jest.fn() } };
    fireEvent(mode, 'draw.create', { features: [] });
    expect(mode.map.fire).toHaveBeenCalledWith('draw.create', { features: [] });
  });
});
