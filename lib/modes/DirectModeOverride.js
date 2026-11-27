import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { circle } from '@turf/circle';
import { distance } from '@turf/distance';
import { point } from '@turf/helpers';
import createSupplementaryPointsForCircle from '../utils/create_supplementary_points_circle.js';
import shiftCircleCenters from '../utils/shift_circle_centers.js';

const { constants: Constants } = MapboxDraw;
const upstream = MapboxDraw.modes.direct_select;

// A copy: MapboxDraw.modes.direct_select itself is left untouched.
const DirectModeOverride = { ...upstream };

DirectModeOverride.dragFeature = function(state, e, delta) {
  upstream.dragFeature.call(this, state, e, delta);
  shiftCircleCenters(this.getSelected(), delta);
};

DirectModeOverride.dragVertex = function(state, e, delta) {
  if (!state.feature.properties.isCircle) {
    return upstream.dragVertex.call(this, state, e, delta);
  }
  const center = state.feature.properties.center;
  const movedVertex = [e.lngLat.lng, e.lngLat.lat];
  const radius = distance(point(center), point(movedVertex), { units: 'kilometers' });
  const circleFeature = circle(center, radius);
  state.feature.incomingCoords(circleFeature.geometry.coordinates);
  state.feature.properties.radiusInKm = radius;
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
