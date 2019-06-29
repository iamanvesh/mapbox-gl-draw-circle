const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const Constants = require('@mapbox/mapbox-gl-draw/src/constants');
const doubleClickZoom = require('@mapbox/mapbox-gl-draw/src/lib/double_click_zoom');

const turf = require('@turf/turf')

const ScaleCircleMode = MapboxDraw.modes.draw_polygon;

ScaleCircleMode.onSetup = function() {
    const polygon = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {
            isCircle: true,
            center: []
        },
        geometry: {
            type: Constants.geojsonTypes.POLYGON,
            coordinates: [[]]
        }
    });

    this.addFeature(polygon);

    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POLYGON);
    this.setActionableState({
        trash: true
    });

    return {
        polygon,
        currentVertexPosition: 0
    };
};

ScaleCircleMode.onClick = function(state, e) {
    // First click
    if (state.currentVertexPosition === 0) {
        state.currentVertexPosition++;
        state.startLngLat = e.lngLat
        state.startPoint = turf.point([e.lngLat.lng, e.lngLat.lat])
    }
    // Second click
    else {
        return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
    }
}

ScaleCircleMode.onMouseMove = function(state, e) {
    if (state.currentVertexPosition === 0) {
        return
    }
    // Get key points
    const currentPoint = turf.point([e.lngLat.lng, e.lngLat.lat])
    const startPoint = state.startPoint

    // Compute circle attributes
    const radius = turf.distance(startPoint, currentPoint) / 2
    const midPoint = turf.midpoint(startPoint, currentPoint)

    // Handle radius == 0 error
    if (radius === 0) {
        return
    }

    // Make a circle
    const circleFeature = turf.circle(midPoint.geometry.coordinates, radius);

    // Reset circle
    state.polygon.incomingCoords(circleFeature.geometry.coordinates);
    state.polygon.properties.center = midPoint.geometry.coordinates
};

module.exports = ScaleCircleMode
