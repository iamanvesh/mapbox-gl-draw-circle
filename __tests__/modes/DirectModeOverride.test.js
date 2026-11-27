import { jest } from '@jest/globals';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { circle } from '@turf/circle';
import DirectMode from '../../lib/modes/DirectModeOverride.js';
import { bindMode, mouseEvent, FakePolygon, displayGeojson, expectCircleRing, distanceKm } from '../helpers.js';

const { constants: Constants } = MapboxDraw;
const center = [-73.9855, 40.758];

const makeCircle = () => new FakePolygon({
  id: 'c1',
  properties: { isCircle: true, center: [...center], radiusInKm: 0.5 },
  coordinates: circle(center, 0.5).geometry.coordinates,
});

const makeSquare = () => new FakePolygon({
  id: 'p1',
  properties: {},
  coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
});

describe('DirectModeOverride', () => {
  describe('dragFeature', () => {
    test('moves the circle and its stored center by delta', () => {
      const c = makeCircle();
      const mode = bindMode(DirectMode, { selected: [c] });
      const state = {};
      const delta = { lng: 0.001, lat: 0.0005 };
      const e = mouseEvent([center[0] + delta.lng, center[1] + delta.lat]);
      mode.dragFeature(state, e, delta);

      expect(c.properties.center[0]).toBeCloseTo(center[0] + delta.lng, 10);
      expect(c.properties.center[1]).toBeCloseTo(center[1] + delta.lat, 10);
      expect(c.getCoordinates()[0][0][0]).toBeCloseTo(circle(center, 0.5).geometry.coordinates[0][0][0] + delta.lng, 10);
      expect(state.dragMoveLocation).toBe(e.lngLat);
    });
  });

  describe('dragVertex', () => {
    test('on a circle: resizes to the cursor distance and keeps the center', () => {
      const c = makeCircle();
      const mode = bindMode(DirectMode, { selected: [c] });
      const cursor = [center[0], center[1] + 0.01];
      mode.dragVertex({ feature: c }, mouseEvent(cursor), { lng: 0, lat: 0.005 });

      const radius = distanceKm(center, cursor);
      expect(c.properties.radiusInKm).toBeCloseTo(radius, 6);
      expect(c.properties.center).toEqual(center);
      expectCircleRing(c.getCoordinates()[0], center, radius);
    });

    test('on a polygon: moves the selected vertices like upstream direct_select', () => {
      const p = makeSquare();
      const mode = bindMode(DirectMode, { selected: [p] });
      mode.dragVertex({ feature: p, selectedCoordPaths: ['0.2'] }, mouseEvent([1.5, 1.5]), { lng: 0.5, lat: 0.5 });
      expect(p.getCoordinates()[0]).toEqual([[0, 0], [1, 0], [1.5, 1.5], [0, 1], [0, 0]]);
    });
  });

  describe('toDisplayFeatures', () => {
    test('the edited circle is shown active with 4 resize handles, without midpoints', () => {
      const c = makeCircle();
      const mode = bindMode(DirectMode, { selected: [c] });
      const push = jest.fn();
      const geojson = displayGeojson(c);
      mode.toDisplayFeatures({ featureId: c.id, feature: c, selectedCoordPaths: [] }, geojson, push);

      expect(geojson.properties.active).toBe(Constants.activeStates.ACTIVE);
      const [shown, ...handles] = push.mock.calls.map(([f]) => f);
      expect(shown).toBe(geojson);
      expect(handles.map((h) => h.properties.coord_path)).toEqual(['0.0', '0.16', '0.32', '0.48']);
      expect(handles.some((h) => h.properties.meta === Constants.meta.MIDPOINT)).toBe(false);
      expect(mode.fireActionable).toHaveBeenCalled();
    });

    test('other circles are shown inactive', () => {
      const mode = bindMode(DirectMode);
      const push = jest.fn();
      const geojson = displayGeojson(makeCircle());
      mode.toDisplayFeatures({ featureId: 'someone-else', selectedCoordPaths: [] }, geojson, push);
      expect(geojson.properties.active).toBe(Constants.activeStates.INACTIVE);
      expect(push).toHaveBeenCalledTimes(1);
    });

    test('non-circle features render exactly as upstream direct_select does', () => {
      const p = makeSquare();
      const state = { featureId: p.id, feature: p, selectedCoordPaths: ['0.1'] };
      const ours = jest.fn();
      const theirs = jest.fn();
      bindMode(DirectMode).toDisplayFeatures(state, displayGeojson(p), ours);
      bindMode(MapboxDraw.modes.direct_select).toDisplayFeatures(state, displayGeojson(p), theirs);
      expect(ours.mock.calls).toEqual(theirs.mock.calls);
      expect(ours.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
