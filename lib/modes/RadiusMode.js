/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
const MapboxDraw = require("@mapbox/mapbox-gl-draw");
const numeral = require("numeral");
const _ = require("lodash");
const lineDistance = require("@turf/length").default;

const RadiusMode = _.extend({}, MapboxDraw.modes.draw_line_string);

function createVertex(parentId, coordinates, path, selected) {
  return {
    type: "Feature",
    properties: {
      meta: "vertex",
      parent: parentId,
      coord_path: path,
      active: selected ? "true" : "false",
    },
    geometry: {
      type: "Point",
      coordinates,
    },
  };
}

function createGeoJSONCircle(center, radiusInKm, parentId, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0],
  };

  const km = radiusInKm;

  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  let theta;
  let x;
  let y;
  for (let i = 0; i < points; i += 1) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [ret],
    },
    properties: {
      parent: parentId,
    },
  };
}

function getDisplayMeasurements(feature) {
  // should log both metric and standard display strings for the current drawn feature

  // metric calculation
  const drawnLength = lineDistance(feature) * 1000; // meters

  let metricUnits = "m";
  let metricFormat = "0,0";
  let metricMeasurement;

  let standardUnits = "feet";
  let standardFormat = "0,0";
  let standardMeasurement;

  metricMeasurement = drawnLength;
  if (drawnLength >= 1000) {
    // if over 1000 meters, upgrade metric
    metricMeasurement = drawnLength / 1000;
    metricUnits = "km";
    metricFormat = "0.00";
  }

  standardMeasurement = drawnLength * 3.28084;
  if (standardMeasurement >= 5280) {
    // if over 5280 feet, upgrade standard
    standardMeasurement /= 5280;
    standardUnits = "mi";
    standardFormat = "0.00";
  }

  const displayMeasurements = {
    metric: `${numeral(metricMeasurement).format(metricFormat)} ${metricUnits}`,
    standard: `${numeral(standardMeasurement).format(
      standardFormat
    )} ${standardUnits}`,
  };

  return displayMeasurements;
}

const doubleClickZoom = {
  enable: (ctx) => {
    setTimeout(() => {
      // First check we've got a map and some context.
      if (
        !ctx.map ||
        !ctx.map.doubleClickZoom ||
        !ctx._ctx ||
        !ctx._ctx.store ||
        !ctx._ctx.store.getInitialConfigValue
      )
        return;
      // Now check initial state wasn't false (we leave it disabled if so)
      if (!ctx._ctx.store.getInitialConfigValue("doubleClickZoom")) return;
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
};
RadiusMode.onSetup = function (opts) {
  const props = MapboxDraw.modes.draw_line_string.onSetup.call(this, opts);
  const circle = this.newFeature({
    type: "Feature",
    properties: {
      meta: "radius",
    },
    geometry: {
      type: "Polygon",
      coordinates: [[]],
    },
  });
  this.addFeature(circle);

  return {
    ...props,
    circle,
  };
};

RadiusMode.clickAnywhere = function (state, e) {
  // this ends the drawing after the user creates a second point, triggering this.onStop
  if (state.currentVertexPosition === 1) {
    state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    return this.changeMode("simple_select", { featureIds: [state.line.id] });
  }
  this.updateUIClasses({ mouse: "add" });
  state.line.updateCoordinate(
    state.currentVertexPosition,
    e.lngLat.lng,
    e.lngLat.lat
  );
  if (state.direction === "forward") {
    state.currentVertexPosition += 1; // eslint-disable-line
    state.line.updateCoordinate(
      state.currentVertexPosition,
      e.lngLat.lng,
      e.lngLat.lat
    );
  } else {
    state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
  }

  return null;
};

RadiusMode.onMouseMove = function (state, e) {
  MapboxDraw.modes.draw_line_string.onMouseMove.call(this, state, e);
  const geojson = state.line.toGeoJSON();
  const center = geojson.geometry.coordinates[0];
  const radiusInKm = lineDistance(geojson, "kilometers");
  const circleFeature = createGeoJSONCircle(center, radiusInKm, state.line.id);
  circleFeature.properties.meta = "radius";
  state.circle.setCoordinates(circleFeature.geometry.coordinates);
};

// creates the final geojson point feature with a radius property
// triggers draw.create
RadiusMode.onStop = function (state) {
  doubleClickZoom.enable(this);

  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.line.id) === undefined) return;

  // remove last added coordinate
  state.line.removeCoordinate("0");
  if (state.line.isValid()) {
    const geojson = state.line.toGeoJSON();
    this.deleteFeature([state.line.id], { silent: true });

    this.map.fire("draw.create", {
      features: [state.circle.toGeoJSON()],
    });
  } else {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode("simple_select", {}, { silent: true });
  }
};

RadiusMode.toDisplayFeatures = function (state, geojson, display) {
  const isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = isActiveLine ? "true" : "false";
  if (!isActiveLine) return display(geojson);

  // Only render the line if it has at least one real coordinate
  if (geojson.geometry.coordinates.length < 2) return null;
  geojson.properties.meta = "feature";

  // displays center vertex as a point feature
  display(
    createVertex(
      state.line.id,
      geojson.geometry.coordinates[
        state.direction === "forward"
          ? geojson.geometry.coordinates.length - 2
          : 1
      ],
      `${
        state.direction === "forward"
          ? geojson.geometry.coordinates.length - 2
          : 1
      }`,
      false
    )
  );

  // displays the line as it is drawn
  display(geojson);

  const displayMeasurements = getDisplayMeasurements(geojson);

  // create custom feature for the current pointer position
  const currentVertex = {
    type: "Feature",
    properties: {
      meta: "currentPosition",
      radiusMetric: displayMeasurements.metric,
      radiusStandard: displayMeasurements.standard,
      parent: state.line.id,
    },
    geometry: {
      type: "Point",
      coordinates: geojson.geometry.coordinates[1],
    },
  };
  display(currentVertex);

  return null;
};

export default RadiusMode;
