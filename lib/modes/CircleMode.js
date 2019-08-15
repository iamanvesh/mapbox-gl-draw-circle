const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const Constants = require('@mapbox/mapbox-gl-draw/src/constants');
const doubleClickZoom = require('@mapbox/mapbox-gl-draw/src/lib/double_click_zoom');
const circle = require('@turf/circle').default;
const distance = require('@turf/distance').default;
const turfHelpers = require('@turf/helpers');


const CircleMode = { ...MapboxDraw.modes.draw_polygon };

CircleMode.onSetup = function () {
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

CircleMode.onClick = function (state, e) {
  if (state.polygon.properties.center.length === 0) {
    const center = [e.lngLat.lng, e.lngLat.lat];
    state.polygon.properties.center = center;
  } else {
    return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
  }

};

CircleMode.onMouseMove = function (state, e) {
  const center = state.polygon.properties.center;
  if (center.length > 0) {
    const distanceInKm = distance(
      turfHelpers.point(center),
      turfHelpers.point([e.lngLat.lng, e.lngLat.lat]),
      { units: 'kilometers' });
    const circleFeature = circle(center, distanceInKm);
    state.polygon.incomingCoords(circleFeature.geometry.coordinates);
    state.polygon.properties.radiusInKm = distanceInKm;
  }
};

CircleMode.toDisplayFeatures = function (state, geojson, display) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = isActivePolygon ? "true" : "false";
  if (!isActivePolygon) return display(geojson);

  // Only render the circle if it has the center
  if (state.polygon.properties.center.length === 0) return;
  return display(geojson);
};

module.exports = CircleMode;