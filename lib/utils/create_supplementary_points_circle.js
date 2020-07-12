const createVertex = require('@mapbox/mapbox-gl-draw/src/lib/create_vertex');
const maxBy = require('lodash.maxby');
const minBy = require('lodash.minby');

function createSupplementaryPointsForCircle(geojson) {
  const { properties, geometry } = geojson;

  if (!properties.user_isCircle) return null;

  const supplementaryPoints = [];
  const vertices = geometry.coordinates[0].slice(0, -1);
  const northVertex = maxBy(vertices, (vertex) => vertex[0]);
  const southVertex = minBy(vertices, (vertex) => vertex[0]);
  const eastVertex = maxBy(vertices, (vertex) => vertex[1]);
  const westVertex = minBy(vertices, (vertex) => vertex[1]);
  supplementaryPoints.push(createVertex(properties.id, northVertex, `0.${vertices.indexOf(northVertex)}`, false));
  supplementaryPoints.push(createVertex(properties.id, southVertex, `0.${vertices.indexOf(southVertex)}`, false));
  supplementaryPoints.push(createVertex(properties.id, eastVertex, `0.${vertices.indexOf(eastVertex)}`, false));
  supplementaryPoints.push(createVertex(properties.id, westVertex, `0.${vertices.indexOf(westVertex)}`, false));
  return supplementaryPoints;
}

module.exports = createSupplementaryPointsForCircle;