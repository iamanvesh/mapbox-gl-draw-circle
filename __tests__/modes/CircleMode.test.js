import { jest } from '@jest/globals';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import CircleMode from '../../lib/modes/CircleMode.js';
import { bindMode, mouseEvent, expectCircleRing } from '../helpers.js';

const { constants: Constants } = MapboxDraw;
const center = [-73.9855, 40.758];

describe('CircleMode', () => {
  let mode;
  beforeEach(() => {
    mode = bindMode(CircleMode);
  });

  describe('onSetup', () => {
    test('adds an empty circle feature and prepares the UI', () => {
      const disableZoom = jest.spyOn(MapboxDraw.lib.doubleClickZoom, 'disable').mockImplementation(() => {});
      const state = mode.onSetup({});

      expect(mode.newFeature).toHaveBeenCalledWith({
        type: 'Feature',
        properties: { isCircle: true, center: [] },
        geometry: { type: 'Polygon', coordinates: [[]] },
      });
      expect(mode.addFeature).toHaveBeenCalledWith(state.polygon);
      expect(mode.clearSelectedFeatures).toHaveBeenCalled();
      expect(disableZoom).toHaveBeenCalledWith(mode);
      expect(mode.updateUIClasses).toHaveBeenCalledWith({ mouse: Constants.cursors.ADD });
      expect(mode.activateUIButton).toHaveBeenCalledWith(Constants.types.POLYGON);
      expect(mode.setActionableState).toHaveBeenCalledWith({ trash: true });
      expect(state.currentVertexPosition).toBe(0);
    });

    test('defaults the radius to 2 km', () => {
      expect(mode.onSetup({}).initialRadiusInKm).toBe(2);
    });

    test('takes initialRadiusInKm from the options', () => {
      expect(mode.onSetup({ initialRadiusInKm: 0.5 }).initialRadiusInKm).toBe(0.5);
    });
  });

  describe('clickAnywhere', () => {
    test('draws a circle of the initial radius around the click and switches to simple_select', () => {
      const state = mode.onSetup({ initialRadiusInKm: 0.5 });
      mode.clickAnywhere(state, mouseEvent(center));

      expect(state.polygon.properties).toEqual({ isCircle: true, center, radiusInKm: 0.5 });
      expectCircleRing(state.polygon.getCoordinates()[0], center, 0.5);
      expect(mode.changeMode).toHaveBeenCalledWith(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
    });

    test('a second click does not redraw the circle', () => {
      const state = mode.onSetup({ initialRadiusInKm: 0.5 });
      mode.clickAnywhere(state, mouseEvent(center));
      mode.clickAnywhere(state, mouseEvent([0, 0]));
      expect(state.polygon.properties.center).toEqual(center);
    });
  });

  describe('onStop (inherited from draw_polygon)', () => {
    // Known bug, see examples/demo/e2e/BASELINE.md: draw_polygon's onStop removes
    // coordinate `0.${currentVertexPosition}`, which is ring point 1 of a finished circle.
    test.failing('keeps all 65 ring points of the created circle', () => {
      const state = mode.onSetup({ initialRadiusInKm: 0.5 });
      mode.addFeature(state.polygon);
      mode.clickAnywhere(state, mouseEvent(center));
      mode.onStop(state);
      expectCircleRing(state.polygon.getCoordinates()[0], center, 0.5);
    });
  });
});
