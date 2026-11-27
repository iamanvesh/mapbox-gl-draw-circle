import { circle } from '@turf/circle';
import createSupplementaryPointsForCircle from '../../lib/utils/create_supplementary_points_circle.js';
import shiftCircleCenters from '../../lib/utils/shift_circle_centers.js';

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

describe('shiftCircleCenters', () => {
  test('shifts circle centers and ignores other features', () => {
    const c = { properties: { isCircle: true, center: [1, 2] } };
    const p = { properties: { center: [1, 2] } };
    const empty = { properties: { isCircle: true, center: [] } };
    shiftCircleCenters([c, p, empty], { lng: 0.5, lat: -1 });
    expect(c.properties.center).toEqual([1.5, 1]);
    expect(p.properties.center).toEqual([1, 2]);
    expect(empty.properties.center).toEqual([]);
  });
});
