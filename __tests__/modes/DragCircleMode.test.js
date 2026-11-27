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
    jest.useFakeTimers();
    mode = bindMode(DragCircleMode);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('onSetup adds an empty circle feature and disables double-click zoom and drag pan', () => {
    const disableZoom = jest.spyOn(MapboxDraw.lib.doubleClickZoom, 'disable').mockImplementation(() => {});
    const state = mode.onSetup({});
    jest.runAllTimers();

    expect(state.polygon.properties).toEqual({ isCircle: true, center: [] });
    expect(mode.addFeature).toHaveBeenCalledWith(state.polygon);
    expect(disableZoom).toHaveBeenCalledWith(mode);
    expect(mode.map.dragPan.disable).toHaveBeenCalled();
    expect(mode.updateUIClasses).toHaveBeenCalledWith({ mouse: Constants.cursors.ADD });
    expect(mode.setActionableState).toHaveBeenCalledWith({ trash: true });
  });

  test('mouse down sets the center once', () => {
    const state = mode.onSetup({});
    mode.onMouseDown(state, mouseEvent(center));
    mode.onMouseDown(state, mouseEvent(edge));
    expect(state.polygon.properties.center).toEqual(center);
  });

  test('touch start behaves like mouse down', () => {
    expect(DragCircleMode.onTouchStart).toBe(DragCircleMode.onMouseDown);
  });

  test('dragging sets the radius to the distance from the center', () => {
    const state = mode.onSetup({});
    mode.onMouseDown(state, mouseEvent(center));
    mode.onDrag(state, mouseEvent(edge));

    const radius = distanceKm(center, edge);
    expect(state.polygon.properties.radiusInKm).toBeCloseTo(radius, 6);
    expectCircleRing(state.polygon.getCoordinates()[0], center, radius);
  });

  test('moving the mouse before pressing does nothing', () => {
    const state = mode.onSetup({});
    mode.onMouseMove(state, mouseEvent(edge));
    expect(state.polygon.properties.radiusInKm).toBeUndefined();
    expect(state.polygon.getCoordinates()).toEqual([[]]);
  });

  test('mouse up re-enables drag pan and selects the circle', () => {
    const state = mode.onSetup({});
    jest.runAllTimers();
    mode.onMouseDown(state, mouseEvent(center));
    mode.onDrag(state, mouseEvent(edge));
    mode.onMouseUp(state);
    jest.runAllTimers();

    expect(mode.map.dragPan.enable).toHaveBeenCalled();
    expect(mode.changeMode).toHaveBeenCalledWith(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
  });

  test('mouse up leaves drag pan disabled when draw was configured with dragPan: false', () => {
    const state = mode.onSetup({});
    mode._ctx.store.getInitialConfigValue.mockReturnValue(false);
    mode.onMouseUp(state);
    jest.runAllTimers();
    expect(mode.map.dragPan.enable).not.toHaveBeenCalled();
  });

  test('a click resets the center', () => {
    const state = mode.onSetup({});
    mode.onMouseDown(state, mouseEvent(center));
    mode.onClick(state);
    expect(state.polygon.properties.center).toEqual([]);
  });

  test('toDisplayFeatures marks only the circle being drawn as active', () => {
    const state = mode.onSetup({});
    const display = jest.fn();
    const own = { properties: { id: state.polygon.id } };
    const other = { properties: { id: 'other' } };
    mode.toDisplayFeatures(state, own, display);
    mode.toDisplayFeatures(state, other, display);
    expect(own.properties.active).toBe(Constants.activeStates.ACTIVE);
    expect(other.properties.active).toBe(Constants.activeStates.INACTIVE);
    expect(display).toHaveBeenCalledTimes(2);
  });

  // Known bug, see examples/demo/e2e/BASELINE.md (same cause as CircleMode).
  test.failing('the finished circle keeps all 65 ring points after onStop', () => {
    const state = mode.onSetup({});
    mode.onMouseDown(state, mouseEvent(center));
    mode.onDrag(state, mouseEvent(edge));
    mode.onMouseUp(state);
    mode.onStop(state);
    expectCircleRing(state.polygon.getCoordinates()[0], center, distanceKm(center, edge));
  });

  test('a click without dragging deletes the empty feature on stop (#11, #21)', () => {
    const state = mode.onSetup({});
    mode.onMouseDown(state, mouseEvent(center));
    mode.onMouseUp(state);
    mode.onStop(state);
    expect(mode.getFeature(state.polygon.id)).toBeUndefined();
    expect(mode.fire).not.toHaveBeenCalledWith(Constants.events.CREATE, expect.anything());
  });
});
