const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const createSupplementaryPoints = require('@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points');
const moveFeatures = require('@mapbox/mapbox-gl-draw/src/lib/move_features');
const moveCircleFeatures = require('../utils/move_circle_features');
const Constants = require('@mapbox/mapbox-gl-draw/src/constants');
const createSupplementaryPointsForCircle = require('../utils/create_supplementary_points_circle');


const SimpleSelectModeOverride = MapboxDraw.modes.simple_select;

SimpleSelectModeOverride.dragMove = function(state, e) {
  // Dragging when drag move is enabled
  state.dragMoving = true;
  e.originalEvent.stopPropagation();

  const delta = {
    lng: e.lngLat.lng - state.dragMoveLocation.lng,
    lat: e.lngLat.lat - state.dragMoveLocation.lat
  };

  const features = this.getSelected().filter(feature => !feature.properties.isCircle);
  const circleFeatures = this.getSelected().filter(feature => feature.properties.isCircle);
  moveFeatures(features, delta);
  moveCircleFeatures(circleFeatures, delta);

  state.dragMoveLocation = e.lngLat;
};

SimpleSelectModeOverride.toDisplayFeatures = function(state, geojson, display) {
    geojson.properties.active = (this.isSelected(geojson.properties.id)) ?
      Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    display(geojson);
    this.fireActionable();
    if (geojson.properties.active !== Constants.activeStates.ACTIVE ||
      geojson.geometry.type === Constants.geojsonTypes.POINT) return;
    const supplementaryPoints = geojson.properties.user_isCircle ?
      createSupplementaryPointsForCircle(geojson) : createSupplementaryPoints(geojson);
    supplementaryPoints.forEach(display);
};
  
module.exports = SimpleSelectModeOverride;