const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const createSupplementaryPoints = require('@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points');
const moveFeatures = require('@mapbox/mapbox-gl-draw/src/lib/move_features');
const Constants = require('@mapbox/mapbox-gl-draw/src/constants');
const constrainFeatureMovement = require('@mapbox/mapbox-gl-draw/src/lib/constrain_feature_movement');
const distance = require('@turf/distance').default;
const turfHelpers = require('@turf/helpers');
const circle = require('@turf/circle').default;
const createSupplementaryPointsForCircle = require('../utils/create_supplementary_points_circle');


const DirectModeOverride = MapboxDraw.modes.direct_select;

DirectModeOverride.dragFeature = function(state, e, delta) {
  moveFeatures(this.getSelected(), delta);
  this.getSelected()
      .filter(feature => feature.properties.isCircle)
      .map(circle => circle.properties.center)
      .forEach(center => {
        center[0] += delta.lng;
        center[1] += delta.lat;
      });
  state.dragMoveLocation = e.lngLat;
};

DirectModeOverride.dragVertex = function(state, e, delta) {
  if (state.feature.properties.isCircle) {
    const center = state.feature.properties.center;
    const movedVertex = [e.lngLat.lng, e.lngLat.lat];
    const radius = distance(turfHelpers.point(center), turfHelpers.point(movedVertex), {units: 'kilometers'});
    const circleFeature = circle(center, radius);
    state.feature.incomingCoords(circleFeature.geometry.coordinates);
    state.feature.properties.radiusInKm = radius;
  } else {
    const selectedCoords = state.selectedCoordPaths.map(coord_path => state.feature.getCoordinate(coord_path));
    const selectedCoordPoints = selectedCoords.map(coords => ({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: coords
      }
    }));

    const constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);
    for (let i = 0; i < selectedCoords.length; i++) {
      const coord = selectedCoords[i];
      state.feature.updateCoordinate(state.selectedCoordPaths[i], coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat);
    }
  }
};

DirectModeOverride.toDisplayFeatures = function (state, geojson, push) {
  if (state.featureId === geojson.properties.id) {
    geojson.properties.active = Constants.activeStates.ACTIVE;
    push(geojson);
    const supplementaryPoints = geojson.properties.user_isCircle ? createSupplementaryPointsForCircle(geojson)
        : createSupplementaryPoints(geojson, {
          map: this.map,
          midpoints: true,
          selectedPaths: state.selectedCoordPaths
        });
    supplementaryPoints.forEach(push);
  } else {
    geojson.properties.active = Constants.activeStates.INACTIVE;
    push(geojson);
  }
  this.fireActionable(state);

}

module.exports = DirectModeOverride;
