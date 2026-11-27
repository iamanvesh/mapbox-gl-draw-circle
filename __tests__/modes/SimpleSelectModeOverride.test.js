import { jest } from '@jest/globals';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { circle } from '@turf/circle';
import SimpleSelectMode from '../../lib/modes/SimpleSelectModeOverride.js';
import { bindMode, mouseEvent, FakePolygon, displayGeojson, expectCircleRing } from '../helpers.js';

const { constants: Constants } = MapboxDraw;
const center = [-73.9855, 40.758];

const makeCircle = (id = 'c1') => new FakePolygon({
  id,
  properties: { isCircle: true, center: [...center], radiusInKm: 0.5 },
  coordinates: circle(center, 0.5).geometry.coordinates,
});

const makeSquare = () => new FakePolygon({
  id: 'p1',
  properties: {},
  coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
});

describe('SimpleSelectModeOverride', () => {
  describe('dragMove', () => {
    test('moves a selected circle and its stored center by the drag delta', () => {
      const c = makeCircle();
      const mode = bindMode(SimpleSelectMode, { selected: [c] });
      const state = { dragMoveLocation: { lng: center[0], lat: center[1] } };
      const to = [center[0] + 0.01, center[1] + 0.005];
      mode.dragMove(state, mouseEvent(to));

      expect(c.properties.center[0]).toBeCloseTo(to[0], 10);
      expect(c.properties.center[1]).toBeCloseTo(to[1], 10);
      // Translating in lng/lat keeps the ring centered; distances stay within 0.5%.
      const ring = c.getCoordinates()[0];
      expect(ring).toHaveLength(65);
      expect(state.dragMoving).toBe(true);
      expect(state.dragMoveLocation).toEqual({ lng: to[0], lat: to[1] });
    });

    test('moves non-circle features without touching properties', () => {
      const p = makeSquare();
      const mode = bindMode(SimpleSelectMode, { selected: [p] });
      mode.dragMove({ dragMoveLocation: { lng: 0, lat: 0 } }, mouseEvent([1, 1]));
      expect(p.getCoordinates()[0]).toEqual([[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]);
      expect(p.properties).toEqual({});
    });
  });

  describe('toDisplayFeatures', () => {
    test('a selected circle is shown active with 4 resize handles', () => {
      const c = makeCircle();
      const mode = bindMode(SimpleSelectMode, { selected: [c] });
      const display = jest.fn();
      const geojson = displayGeojson(c);
      mode.toDisplayFeatures({}, geojson, display);

      expect(geojson.properties.active).toBe(Constants.activeStates.ACTIVE);
      const [shown, ...handles] = display.mock.calls.map(([f]) => f);
      expect(shown).toBe(geojson);
      expect(handles.map((h) => h.properties.coord_path)).toEqual(['0.0', '0.16', '0.32', '0.48']);
      expect(handles.every((h) => h.properties.meta === Constants.meta.VERTEX)).toBe(true);
      expect(mode.fireActionable).toHaveBeenCalled();
    });

    test('an unselected circle is shown inactive without handles', () => {
      const mode = bindMode(SimpleSelectMode);
      const display = jest.fn();
      const geojson = displayGeojson(makeCircle());
      mode.toDisplayFeatures({}, geojson, display);
      expect(geojson.properties.active).toBe(Constants.activeStates.INACTIVE);
      expect(display).toHaveBeenCalledTimes(1);
    });

    test('non-circle features render exactly as upstream simple_select does', () => {
      const p = makeSquare();
      const ours = jest.fn();
      const theirs = jest.fn();
      bindMode(SimpleSelectMode, { selected: [p] }).toDisplayFeatures({}, displayGeojson(p), ours);
      bindMode(MapboxDraw.modes.simple_select, { selected: [p] }).toDisplayFeatures({}, displayGeojson(p), theirs);
      expect(ours.mock.calls).toEqual(theirs.mock.calls);
      expect(ours.mock.calls.length).toBeGreaterThan(1);
    });
  });

  test('a moved circle is still a valid circle around its new center', () => {
    const c = makeCircle();
    const mode = bindMode(SimpleSelectMode, { selected: [c] });
    // Small move: lng/lat translation keeps distances within the 3-decimal tolerance.
    mode.dragMove({ dragMoveLocation: { lng: center[0], lat: center[1] } }, mouseEvent([center[0] + 0.001, center[1]]));
    expectCircleRing(c.getCoordinates()[0], c.properties.center, 0.5);
  });
});
