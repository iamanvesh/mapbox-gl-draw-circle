import { jest } from '@jest/globals';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import DragCircleMode from '../../lib/modes/DragCircleMode.js';
import { bindMode, mouseEvent, expectCircleRing, distanceKm } from '../helpers.js';

const { constants: Constants } = MapboxDraw;
const center = [-73.9855, 40.758];
const edge = [-73.975, 40.762];

describe('DragCircleMode', () => {
  let mode;
  beforeEach(() => {
    mode = bindMode(DragCircleMode);
  });

  /** Press at center, drag to edge, release. */
  function drawCircle(state) {
    mode.onMouseDown(state, mouseEvent(center));
    mode.onDrag(state, mouseEvent(edge));
    mode.onMouseUp(state);
  }

  test('onSetup disables double-click zoom and drag pan, without creating a feature', () => {
    const disableZoom = jest.spyOn(MapboxDraw.lib.doubleClickZoom, 'disable').mockImplementation(() => {});
    const state = mode.onSetup();

    expect(state.circle).toBeNull();
    expect(state.initialDragPanState).toBe(true);
    expect(mode.addFeature).not.toHaveBeenCalled();
    expect(disableZoom).toHaveBeenCalledWith(mode);
    expect(mode.map.dragPan.disable).toHaveBeenCalled();
    expect(mode.updateUIClasses).toHaveBeenCalledWith({ mouse: Constants.cursors.ADD });
    expect(mode.setActionableState).toHaveBeenCalledWith({ trash: true });
  });

  test('mouse down creates the circle at the pressed point, once', () => {
    const state = mode.onSetup();
    mode.onMouseDown(state, mouseEvent(center));
    mode.onMouseDown(state, mouseEvent(edge));
    expect(mode.addFeature).toHaveBeenCalledTimes(1);
    expect(state.circle.properties.center).toEqual(center);
  });

  test('touch start, touch end and tap map to the mouse handlers', () => {
    expect(DragCircleMode.onTouchStart).toBe(DragCircleMode.onMouseDown);
    expect(DragCircleMode.onTouchEnd).toBe(DragCircleMode.onMouseUp);
    expect(DragCircleMode.onTap).toBe(DragCircleMode.onClick);
  });

  test('dragging sets the radius to the distance from the center', () => {
    const state = mode.onSetup();
    mode.onMouseDown(state, mouseEvent(center));
    mode.onDrag(state, mouseEvent(edge));

    const radius = distanceKm(center, edge);
    expect(state.circle.properties.radiusInKm).toBeCloseTo(radius, 6);
    expectCircleRing(state.circle.getCoordinates()[0], center, radius);
  });

  test('moving the mouse before pressing does nothing', () => {
    const state = mode.onSetup();
    mode.onMouseMove(state, mouseEvent(edge));
    expect(state.circle).toBeNull();
  });

  test('release after a drag selects the circle; onStop fires draw.create with all 65 points', () => {
    const state = mode.onSetup();
    drawCircle(state);
    expect(mode.changeMode).toHaveBeenCalledWith(Constants.modes.SIMPLE_SELECT, { featureIds: [state.circle.id] });

    mode.onStop(state);
    const [type, { features: [created] }] = mode.fire.mock.calls[0];
    expect(type).toBe(Constants.events.CREATE);
    expectCircleRing(created.geometry.coordinates[0], center, distanceKm(center, edge));
  });

  test('a click without dragging leaves no feature and stays in the mode (#11, #21)', () => {
    const state = mode.onSetup();
    mode.onMouseDown(state, mouseEvent(center));
    const pending = state.circle;
    mode.onClick(state);

    expect(mode.getFeature(pending.id)).toBeUndefined();
    expect(mode.deleteFeature).toHaveBeenCalledWith([pending.id], { silent: true });
    expect(state.circle).toBeNull();
    expect(mode.changeMode).not.toHaveBeenCalled();

    // The next drag still works.
    drawCircle(state);
    expect(mode.changeMode).toHaveBeenCalledTimes(1);
  });

  test('a release without movement reported as mouseup also discards the circle', () => {
    const state = mode.onSetup();
    mode.onMouseDown(state, mouseEvent(center));
    mode.onMouseUp(state);
    expect(state.circle).toBeNull();
    expect(mode.changeMode).not.toHaveBeenCalled();
  });

  describe('onStop', () => {
    test('restores drag pan, also when leaving without drawing', () => {
      const state = mode.onSetup();
      mode.onStop(state);
      expect(mode.map.dragPan.enable).toHaveBeenCalled();
      expect(mode.fire).not.toHaveBeenCalled();
    });

    test('keeps drag pan disabled when it was disabled before the mode started', () => {
      mode.map.dragPan.isEnabled.mockReturnValue(false);
      const state = mode.onSetup();
      drawCircle(state);
      mode.onStop(state);
      expect(mode.map.dragPan.enable).not.toHaveBeenCalled();
    });

    test('discards a circle that was pressed but never dragged', () => {
      const state = mode.onSetup();
      mode.onMouseDown(state, mouseEvent(center));
      const pending = state.circle;
      mode.onStop(state);
      expect(mode.getFeature(pending.id)).toBeUndefined();
      expect(mode.fire).not.toHaveBeenCalled();
    });
  });

  test('Escape discards the circle being drawn and leaves the mode', () => {
    const state = mode.onSetup();
    mode.onMouseDown(state, mouseEvent(center));
    mode.onDrag(state, mouseEvent(edge));
    const pending = state.circle;
    mode.onKeyUp(state, { key: 'Escape', keyCode: 27 });
    expect(mode.getFeature(pending.id)).toBeUndefined();
    expect(mode.changeMode).toHaveBeenCalledWith(Constants.modes.SIMPLE_SELECT);
  });

  test('toDisplayFeatures hides the circle until it has a radius, then shows it active', () => {
    const state = mode.onSetup();
    const display = jest.fn();
    mode.onMouseDown(state, mouseEvent(center));
    mode.toDisplayFeatures(state, { properties: { id: state.circle.id } }, display);
    expect(display).not.toHaveBeenCalled();

    mode.onDrag(state, mouseEvent(edge));
    const own = { properties: { id: state.circle.id } };
    const other = { properties: { id: 'other' } };
    mode.toDisplayFeatures(state, own, display);
    mode.toDisplayFeatures(state, other, display);
    expect(own.properties.active).toBe(Constants.activeStates.ACTIVE);
    expect(other.properties.active).toBe(Constants.activeStates.INACTIVE);
    expect(display).toHaveBeenCalledTimes(2);
  });
});
