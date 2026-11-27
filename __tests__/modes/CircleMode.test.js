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
    test('prepares the UI without creating a feature yet', () => {
      const disableZoom = jest.spyOn(MapboxDraw.lib.doubleClickZoom, 'disable').mockImplementation(() => {});
      mode.onSetup({});

      expect(mode.newFeature).not.toHaveBeenCalled();
      expect(mode.addFeature).not.toHaveBeenCalled();
      expect(mode.clearSelectedFeatures).toHaveBeenCalled();
      expect(disableZoom).toHaveBeenCalledWith(mode);
      expect(mode.updateUIClasses).toHaveBeenCalledWith({ mouse: Constants.cursors.ADD });
      expect(mode.activateUIButton).toHaveBeenCalledWith(Constants.types.POLYGON);
      expect(mode.setActionableState).toHaveBeenCalledWith({ trash: true });
    });

    test('defaults the radius to 2 km', () => {
      expect(mode.onSetup({}).initialRadiusInKm).toBe(2);
      expect(mode.onSetup().initialRadiusInKm).toBe(2);
    });

    test('takes initialRadiusInKm from the options', () => {
      expect(mode.onSetup({ initialRadiusInKm: 0.5 }).initialRadiusInKm).toBe(0.5);
    });
  });

  describe('click', () => {
    test('creates a circle of the initial radius around the click and switches to simple_select', () => {
      const state = mode.onSetup({ initialRadiusInKm: 0.5 });
      mode.onClick(state, mouseEvent(center));

      expect(state.circle.properties).toEqual({ isCircle: true, center, radiusInKm: 0.5 });
      expectCircleRing(state.circle.getCoordinates()[0], center, 0.5);
      expect(mode.addFeature).toHaveBeenCalledWith(state.circle);
      expect(mode.changeMode).toHaveBeenCalledWith(Constants.modes.SIMPLE_SELECT, { featureIds: [state.circle.id] });
    });

    test('tap behaves like click', () => {
      expect(CircleMode.onTap).toBe(CircleMode.onClick);
    });

    test('a second click does not create another circle', () => {
      const state = mode.onSetup({});
      mode.onClick(state, mouseEvent(center));
      mode.onClick(state, mouseEvent([0, 0]));
      expect(mode.addFeature).toHaveBeenCalledTimes(1);
    });
  });

  describe('onStop', () => {
    test('fires draw.create with the full 65-point circle', () => {
      const enableZoom = jest.spyOn(MapboxDraw.lib.doubleClickZoom, 'enable').mockImplementation(() => {});
      const state = mode.onSetup({ initialRadiusInKm: 0.5 });
      mode.onClick(state, mouseEvent(center));
      mode.onStop(state);

      expect(mode.fire).toHaveBeenCalledTimes(1);
      const [type, { features: [created] }] = mode.fire.mock.calls[0];
      expect(type).toBe(Constants.events.CREATE);
      expectCircleRing(created.geometry.coordinates[0], center, 0.5);
      expect(created.properties).toEqual({ isCircle: true, center, radiusInKm: 0.5 });
      expect(enableZoom).toHaveBeenCalledWith(mode);
      expect(mode.updateUIClasses).toHaveBeenLastCalledWith({ mouse: Constants.cursors.NONE });
    });

    test('fires nothing when the mode is left without a click', () => {
      const state = mode.onSetup({});
      mode.onStop(state);
      expect(mode.fire).not.toHaveBeenCalled();
    });

    test('fires through map.fire on mapbox-gl-draw 1.4, which has no mode.fire', () => {
      delete mode.fire;
      const state = mode.onSetup({});
      mode.onClick(state, mouseEvent(center));
      mode.onStop(state);
      expect(mode.map.fire).toHaveBeenCalledWith(Constants.events.CREATE, expect.objectContaining({ features: expect.any(Array) }));
    });
  });

  test('Escape and trash leave the mode without creating anything', () => {
    const state = mode.onSetup({});
    mode.onKeyUp(state, { key: 'Escape', keyCode: 27 });
    mode.onTrash(state);
    expect(mode.changeMode).toHaveBeenCalledTimes(2);
    expect(mode.changeMode).toHaveBeenCalledWith(Constants.modes.SIMPLE_SELECT);
    expect(mode.addFeature).not.toHaveBeenCalled();
  });
});
