import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { setCircle, fireEvent } from '../utils/circle.js';

const { constants: Constants, lib: { doubleClickZoom, CommonSelectors } } = MapboxDraw;

const DEFAULT_RADIUS_IN_KM = 2;

/**
 * Click once to create a circle of `initialRadiusInKm` around the clicked point.
 *
 * A standalone mode rather than a copy of draw_polygon: draw_polygon's handlers assume a polygon
 * being built vertex by vertex. Its onMouseMove wrote the cursor into an empty ring (an invalid
 * `[[null]]` polygon) and its onStop removed ring point 1 of the finished circle.
 */
const CircleMode = {};

CircleMode.onSetup = function(opts = {}) {
  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POLYGON);
  this.setActionableState({ trash: true });

  return {
    initialRadiusInKm: opts.initialRadiusInKm || DEFAULT_RADIUS_IN_KM,
    circle: null,
  };
};

CircleMode.onClick = CircleMode.onTap = function(state, e) {
  if (state.circle) return;
  const center = [e.lngLat.lng, e.lngLat.lat];
  state.circle = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: { isCircle: true },
    geometry: { type: Constants.geojsonTypes.POLYGON, coordinates: [[]] },
  });
  setCircle(state.circle, center, state.initialRadiusInKm);
  this.addFeature(state.circle);
  this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.circle.id] });
};

CircleMode.onKeyUp = function(state, e) {
  if (CommonSelectors.isEscapeKey(e)) this.changeMode(Constants.modes.SIMPLE_SELECT);
};

CircleMode.onTrash = function() {
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

CircleMode.onStop = function(state) {
  this.updateUIClasses({ mouse: Constants.cursors.NONE });
  doubleClickZoom.enable(this);
  this.activateUIButton();
  if (state.circle && this.getFeature(state.circle.id)) {
    fireEvent(this, Constants.events.CREATE, { features: [state.circle.toGeoJSON()] });
  }
};

CircleMode.toDisplayFeatures = function(state, geojson, display) {
  geojson.properties.active = Constants.activeStates.INACTIVE;
  display(geojson);
};

export default CircleMode;
