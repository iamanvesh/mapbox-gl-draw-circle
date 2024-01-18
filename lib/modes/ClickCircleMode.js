const MapboxDraw = require("@mapbox/mapbox-gl-draw");
const Constants = require("@mapbox/mapbox-gl-draw/src/constants");
const doubleClickZoom = require("@mapbox/mapbox-gl-draw/src/lib/double_click_zoom");
const dragPan = require("../utils/drag_pan");
const circle = require("@turf/circle").default;
const distance = require("@turf/distance").default;
const turfHelpers = require("@turf/helpers");

const ClickCircleMode = { ...MapboxDraw.modes.draw_polygon };

ClickCircleMode.onSetup = function (opts) {
  const polygon = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      isCircle: true,
      center: [],
      radiusInKm: null,
    },
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [[]],
    },
  });

  this.addFeature(polygon);

  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  dragPan.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POLYGON);
  this.setActionableState({
    trash: true,
  });

  return {
    circleDrawing: false,
    polygon,
  };
};

ClickCircleMode.onMouseDown = ClickCircleMode.onTouchStart = function (state, e) {
  if (!state.circleDrawing) {
    // First click: Set the center and mark circleDrawing as true
    state.polygon.properties.center = [e.lngLat.lng, e.lngLat.lat];
    state.circleDrawing = true;
  } else {
    // Second click: Draw the circle
    const center = state.polygon.properties.center;
    const distanceInKm = distance(
      turfHelpers.point(center),
      turfHelpers.point([e.lngLat.lng, e.lngLat.lat]),
      { units: "kilometers" }
    );

    // Create a circle feature
    const circleFeature = circle(center, distanceInKm, { steps: 64 });
    state.polygon.incomingCoords(circleFeature.geometry.coordinates);
    state.polygon.properties.radiusInKm = distanceInKm;

    // Switch to the select mode
    return this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.polygon.id],
    });
  }
};

ClickCircleMode.onMouseUp = ClickCircleMode.onTouchEnd = function (state, e) {
  if (state.polygon) {
    // Unset the circleDrawing flag after mouseUp
    state.circleDrawing = false;
  }
  // Enable panning after drawing the circle
  dragPan.enable(this);
};

ClickCircleMode.onDrag = function (state, e) {
  // don't draw the circle if its a drag event
  state.polygon.properties.center = [];
};

ClickCircleMode.toDisplayFeatures = function (state, geojson, display) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = isActivePolygon
    ? Constants.activeStates.ACTIVE
    : Constants.activeStates.INACTIVE;
  return display(geojson);
};

module.exports = ClickCircleMode;
