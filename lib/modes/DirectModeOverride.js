import MapboxDraw from '@mapbox/mapbox-gl-draw';
import createSupplementaryPointsForCircle from '../utils/create_supplementary_points_circle.js';
import { captureCircles, redrawMovedCircles, setCircle, distanceInKm } from '../utils/circle.js';

const { constants: Constants } = MapboxDraw;
const upstream = MapboxDraw.modes.direct_select;

// A copy: MapboxDraw.modes.direct_select itself is left untouched.
const DirectModeOverride = { ...upstream };

DirectModeOverride.dragFeature = function(state, e, delta) {
  const circles = captureCircles(this.getSelected());
  upstream.dragFeature.call(this, state, e, delta);
  redrawMovedCircles(circles);
};

DirectModeOverride.dragVertex = function(state, e, delta) {
  if (!state.feature.properties.isCircle) {
    return upstream.dragVertex.call(this, state, e, delta);
  }
  // Any handle resizes the circle: the new radius is the distance from the center to the cursor.
  const { center } = state.feature.properties;
  const radiusInKm = distanceInKm(center, [e.lngLat.lng, e.lngLat.lat]);
  if (radiusInKm > 0) setCircle(state.feature, center, radiusInKm);
};

DirectModeOverride.toDisplayFeatures = function(state, geojson, push) {
  if (!geojson.properties.user_isCircle) {
    return upstream.toDisplayFeatures.call(this, state, geojson, push);
  }
  if (state.featureId === geojson.properties.id) {
    geojson.properties.active = Constants.activeStates.ACTIVE;
    push(geojson);
    createSupplementaryPointsForCircle(geojson).forEach(push);
  } else {
    geojson.properties.active = Constants.activeStates.INACTIVE;
    push(geojson);
  }
  this.fireActionable(state);
};

export default DirectModeOverride;
