const constrainFeatureMovement = require('@mapbox/mapbox-gl-draw/src/lib/constrain_feature_movement');
const circle = require('@turf/circle').default;

function moveCircleFeatures(features, delta) {
  const constrainedDelta = constrainFeatureMovement(features.map(feature => feature.toGeoJSON()), delta);

  features.forEach((feature) => {
    const center = feature.properties.center;
    const radius = feature.properties.radiusInKm;
    center[0] += constrainedDelta.lng;
    center[1] += constrainedDelta.lat;
    const circleFeature = circle(center, radius);

    feature.incomingCoords(circleFeature.geometry.coordinates);
  });
}

module.exports = moveCircleFeatures;