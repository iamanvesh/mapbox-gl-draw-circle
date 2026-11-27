import MapboxDraw from '@mapbox/mapbox-gl-draw';
import createSupplementaryPointsForCircle from '../utils/create_supplementary_points_circle.js';
import { captureCircles, redrawMovedCircles } from '../utils/circle.js';

const { constants: Constants } = MapboxDraw;
const upstream = MapboxDraw.modes.simple_select;

// A copy: MapboxDraw.modes.simple_select itself is left untouched.
const SimpleSelectModeOverride = { ...upstream };

SimpleSelectModeOverride.dragMove = function(state, e) {
  const circles = captureCircles(this.getSelected());
  upstream.dragMove.call(this, state, e);
  redrawMovedCircles(circles);
};

SimpleSelectModeOverride.toDisplayFeatures = function(state, geojson, display) {
  if (!geojson.properties.user_isCircle) {
    return upstream.toDisplayFeatures.call(this, state, geojson, display);
  }
  geojson.properties.active = this.isSelected(geojson.properties.id) ?
    Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  display(geojson);
  this.fireActionable();
  if (geojson.properties.active !== Constants.activeStates.ACTIVE) return;
  createSupplementaryPointsForCircle(geojson).forEach(display);
};

export default SimpleSelectModeOverride;
