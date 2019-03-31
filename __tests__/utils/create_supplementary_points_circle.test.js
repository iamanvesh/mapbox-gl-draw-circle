jest.mock('@mapbox/mapbox-gl-draw/src/lib/create_vertex');

describe('CreateSupplementaryPointsForCircle tests', () => {
  const createSupplementaryPointsForCircle = require('../../lib/utils/create_supplementary_points_circle');
  const createVertex = require('@mapbox/mapbox-gl-draw/src/lib/create_vertex');

  it('should generate four supplementary points when the feature is a circle', () => {
    const mockGeoJSON = {
      properties: {
        user_isCircle: true
      },
      geometry: {
        coordinates: [[ {}, {}, {}, {}, {} ]] // 64 vertices will be present for the circle
      }
    }
    createVertex.mockReturnValue({});
    expect(createSupplementaryPointsForCircle(mockGeoJSON).length).toEqual(4);
  });

  it('should return null if the feature is not a circle', () => {
    const mockGeoJSON = {
      properties: {
        user_isCircle: false
      }
    }
    expect(createSupplementaryPointsForCircle(mockGeoJSON)).toEqual(null);
  });
});