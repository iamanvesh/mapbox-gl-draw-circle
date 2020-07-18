
jest.mock('@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points');
jest.mock('@mapbox/mapbox-gl-draw/src/lib/move_features');
jest.mock('@mapbox/mapbox-gl-draw/src/lib/constrain_feature_movement', () => jest.fn((_, x) => x));
jest.mock('@turf/distance', () => ({ default: jest.fn() }));
jest.mock('@turf/helpers');
jest.mock('@turf/circle', () => ({ default: jest.fn() }));
jest.mock('../../lib/utils/create_supplementary_points_circle');

const createSupplementaryPoints = require('@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points');
const moveFeatures = require('@mapbox/mapbox-gl-draw/src/lib/move_features');
const Constants = require('@mapbox/mapbox-gl-draw/src/constants');
const distance = require('@turf/distance').default;
const circle = require('@turf/circle').default;
const createSupplementaryPointsForCircle = require('../../lib/utils/create_supplementary_points_circle');

let DirectMode = require('../../lib/modes/DirectModeOverride');

describe('DirectMode tests', () => {
  let mockState = {};
  let mockEvent = {};
  let mockDelta = {};
  let mockFeatures;

  beforeEach(() => {
    DirectMode = {
      ...DirectMode,
      getSelected: jest.fn(),
      fireActionable: jest.fn()
    };

    mockEvent = {
      lngLat: { lat: 0, lng: 0 }
    };

    mockDelta = {
      lat: 1,
      lng: 1
    };
    mockFeatures = [
      {
        properties: {
          isCircle: true,
          center: [0, 0]
        },
        geometry: {
          coordinates: []
        },
        incomingCoords: jest.fn(),
        toGeoJSON: function() { return this; }
      }
    ];
    mockState = {
      featureId: 1,
      feature: mockFeatures[0]
    };
    DirectMode.getSelected.mockReturnValue(mockFeatures);
  });

  afterEach(() => {
    createSupplementaryPoints.mockClear();
    createSupplementaryPointsForCircle.mockClear();
  });

  it('should move selected features when dragFeature is invoked', () => {
    circle.mockReturnValue(mockFeatures[0]);
    DirectMode.dragFeature(mockState, mockEvent, mockDelta);
    expect(mockState.feature.incomingCoords).toHaveBeenCalledWith(mockFeatures[0].geometry.coordinates);
    expect(moveFeatures).toHaveBeenCalledWith([], mockDelta);
  });

  it('should update the center of the selected feature if its a circle', () => {
    DirectMode.dragFeature(mockState, mockEvent, mockDelta);
    expect(mockFeatures[0].properties.center).toEqual([1, 1]);
  });

  it('should set dragMoveLocation to the event lngLat', () => {
    DirectMode.dragFeature(mockState, mockEvent, mockDelta);
    expect(mockState.dragMoveLocation).toEqual(mockEvent.lngLat);
  });

  it('should update the radius when dragVertex is invoked and the feature is a circle', () => {
    distance.mockReturnValue(1);
    circle.mockReturnValue(mockFeatures[0]);
    DirectMode.dragVertex(mockState, mockEvent, mockDelta);
    expect(mockState.feature.incomingCoords).toHaveBeenCalledWith(mockFeatures[0].geometry.coordinates);
    expect(mockState.feature.properties.radiusInKm).toEqual(1);
  });

  it(`should display points generated using 
        createSupplementaryPointsForCircle when the feature is a circle`, () => {
      const mockDisplayFn = jest.fn();
      const mockGeoJSON = {
        properties: {
          id: 1,
          user_isCircle: true
        }
      };
      createSupplementaryPointsForCircle.mockReturnValue([]);
      DirectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplayFn);
      expect(mockDisplayFn).toHaveBeenCalledWith(mockGeoJSON);
      expect(createSupplementaryPointsForCircle).toHaveBeenCalledWith(mockGeoJSON);
      expect(DirectMode.fireActionable).toHaveBeenCalled();
    });

    it(`should display points generated using createSupplementaryPoints
        when the feature is not a circle`, () => {
        createSupplementaryPoints.mockReturnValue([]);
        const mockDisplayFn = jest.fn();
        const mockGeoJSON = {
          properties: {
            id: 1,
            user_isCircle: false
          }
        };
        DirectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplayFn);
        expect(mockDisplayFn).toHaveBeenCalledWith(mockGeoJSON);
        expect(createSupplementaryPoints).toHaveBeenCalledWith(mockGeoJSON, {
          map: undefined, midpoints: true, selectedPaths: undefined
        });
        expect(DirectMode.fireActionable).toHaveBeenCalled();
      });

    it('should not create supplementary vertices if the feature is not selected', () => {
        const mockDisplayFn = jest.fn();
        const mockGeoJSON = {
          properties: {
            id: 2,
            user_isCircle: false
          }
        };
        DirectMode.toDisplayFeatures(mockState, mockGeoJSON, mockDisplayFn);
        expect(mockDisplayFn).toHaveBeenCalledWith(mockGeoJSON);
        expect(DirectMode.fireActionable).toHaveBeenCalled();
        expect(createSupplementaryPoints).not.toHaveBeenCalled();
    });
});