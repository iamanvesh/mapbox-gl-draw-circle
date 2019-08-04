const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const Constants = require('@mapbox/mapbox-gl-draw/src/constants');
const doubleClickZoom = require('@mapbox/mapbox-gl-draw/src/lib/double_click_zoom');
const dragPan = require('../utils/drag_pan');
const circle = require('@turf/circle').default;
const distance = require('@turf/distance').default;
const turfHelpers = require('@turf/helpers');

const DragCircleMode = {...MapboxDraw.modes.draw_polygon};

DragCircleMode.onSetup = function(opts) {
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
  dragPan.disable(this);
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

DragCircleMode.onMouseDown = DragCircleMode.onTouchStart = function (state, e) {
  const currentCenter = state.polygon.properties.center;
  if (currentCenter.length === 0) {
    state.polygon.properties.center = [e.lngLat.lng, e.lngLat.lat];
  }
};

DragCircleMode.onDrag = DragCircleMode.onMouseMove = function (state, e) {
  const center = state.polygon.properties.center;
  if (center.length > 0) {
    const distanceInKm = distance(
      turfHelpers.point(center),
      turfHelpers.point([e.lngLat.lng, e.lngLat.lat]),
      { units : 'kilometers'});
    const circleFeature = circle(center, distanceInKm);
    state.polygon.incomingCoords(circleFeature.geometry.coordinates);
    state.polygon.properties.radiusInKm = distanceInKm;
  }
};

DragCircleMode.onMouseUp = DragCircleMode.onTouchEnd = function (state, e) {
  dragPan.enable(this);
  return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
};

DragCircleMode.onClick = DragCircleMode.onTap = function (state, e) {
  // don't draw the circle if its a tap or click event
  state.polygon.properties.center = [];
};

DragCircleMode.toDisplayFeatures = function(state, geojson, display) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = (isActivePolygon) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  return display(geojson);
};

module.exports = DragCircleMode;