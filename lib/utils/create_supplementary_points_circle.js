const createVertex = require('@mapbox/mapbox-gl-draw/src/lib/create_vertex').default;

function createSupplementaryPointsForCircle(geojson) {
  const { properties, geometry } = geojson;

  if (!properties.user_isCircle) return null;

  const supplementaryPoints = [];
  const vertices = geometry.coordinates[0].slice(0, -1);
  for (let index = 0; index < vertices.length; index += Math.round((vertices.length / 4))) {
    supplementaryPoints.push(createVertex(properties.id, vertices[index], `0.${index}`, false));
  }
  return supplementaryPoints;
}

module.exports = createSupplementaryPointsForCircle;
