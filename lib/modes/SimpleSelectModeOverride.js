const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const createSupplementaryPoints = require('@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points');
const moveFeatures = require('@mapbox/mapbox-gl-draw/src/lib/move_features').default;
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
