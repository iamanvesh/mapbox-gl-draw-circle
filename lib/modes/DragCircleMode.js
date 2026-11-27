import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { setCircle, distanceInKm, fireEvent } from '../utils/circle.js';

const { constants: Constants, lib: { doubleClickZoom, CommonSelectors } } = MapboxDraw;

/**
 * Press to set the center, drag to set the radius, release to create the circle.
 *
 * A standalone mode rather than a copy of draw_polygon (see CircleMode). The feature only exists
 * between press and release, so a click without dragging leaves nothing behind (#11, #21).
 */
const DragCircleMode = {};

DragCircleMode.onSetup = function() {
  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  // Same pattern as draw's own select modes: remember drag-pan and restore it on stop.
  const initialDragPanState = this.map.dragPan.isEnabled();
  this.map.dragPan.disable();
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POLYGON);
  this.setActionableState({ trash: true });

  return { circle: null, initialDragPanState };
};

function discardCircle(mode, state) {
  if (state.circle && mode.getFeature(state.circle.id)) {
    mode.deleteFeature([state.circle.id], { silent: true });
  }
  state.circle = null;
}

DragCircleMode.onMouseDown = DragCircleMode.onTouchStart = function(state, e) {
  if (state.circle) return;
  state.circle = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: { isCircle: true, center: [e.lngLat.lng, e.lngLat.lat] },
    geometry: { type: Constants.geojsonTypes.POLYGON, coordinates: [[]] },
  });
  this.addFeature(state.circle);
};

DragCircleMode.onDrag = DragCircleMode.onMouseMove = function(state, e) {
  if (!state.circle) return;
  const { center } = state.circle.properties;
  const radiusInKm = distanceInKm(center, [e.lngLat.lng, e.lngLat.lat]);
  if (radiusInKm > 0) setCircle(state.circle, center, radiusInKm);
};

DragCircleMode.onMouseUp = DragCircleMode.onTouchEnd = function(state) {
  if (!state.circle) return;
  if (!state.circle.isValid()) {
    discardCircle(this, state);
    return;
  }
  this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.circle.id] });
};

// Draw reports a press and release without movement as a click/tap instead of mouseup/touchend.
DragCircleMode.onClick = DragCircleMode.onTap = function(state) {
  discardCircle(this, state);
};

DragCircleMode.onKeyUp = function(state, e) {
  if (CommonSelectors.isEscapeKey(e)) {
    discardCircle(this, state);
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }
};

DragCircleMode.onTrash = function(state) {
  discardCircle(this, state);
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DragCircleMode.onStop = function(state) {
  this.updateUIClasses({ mouse: Constants.cursors.NONE });
  doubleClickZoom.enable(this);
  this.activateUIButton();
  if (state.initialDragPanState) this.map.dragPan.enable();

  if (!state.circle || !this.getFeature(state.circle.id)) return;
  if (state.circle.isValid()) {
    fireEvent(this, Constants.events.CREATE, { features: [state.circle.toGeoJSON()] });
  } else {
    discardCircle(this, state);
  }
};

DragCircleMode.toDisplayFeatures = function(state, geojson, display) {
  const isDrawing = state.circle && geojson.properties.id === state.circle.id;
  // The circle has no geometry until the first drag; rendering it would be invalid GeoJSON.
  if (isDrawing && !state.circle.isValid()) return;
  geojson.properties.active = isDrawing ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  display(geojson);
};

export default DragCircleMode;
