jest.mock('@mapbox/mapbox-gl-draw/src/lib/double_click_zoom', () => ({
  enable: jest.fn(),
  disable: jest.fn()
}));

jest.mock('@turf/circle', () => ({
  default: jest.fn()
}));

let CircleMode = require('../../lib/modes/CircleMode');
const mockFeature = {
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": []
  }
};
const doubleClickZoom = require('@mapbox/mapbox-gl-draw/src/lib/double_click_zoom');
const Constants = require('@mapbox/mapbox-gl-draw/src/constants');
const circle = require('@turf/circle');

describe('CircleMode tests', () => {
  beforeEach(() => {
    CircleMode = {
      ...CircleMode,
      addFeature: jest.fn(),
      newFeature: jest.fn(),
      clearSelectedFeatures: jest.fn(),
      updateUIClasses: jest.fn(),
      activateUIButton: jest.fn(),
      setActionableState: jest.fn(),
      changeMode: jest.fn()
    }
  });

  afterEach(() => {
    CircleMode.changeMode.mockClear();
  });

  it('should setup state with a polygon and initialRadius', () => {
    CircleMode.newFeature.mockReturnValue(mockFeature);
    expect(CircleMode.onSetup({})).toEqual({
      initialRadiusInKm: 2,
      polygon: mockFeature,
      currentVertexPosition: 0
    });
    expect(CircleMode.newFeature).toHaveBeenCalled();
  });

  it('should setup state with initialRadius as given in options', () => {
    CircleMode.newFeature.mockReturnValue(mockFeature);
    expect(CircleMode.onSetup({ initialRadiusInKm: 1 })).toEqual({
      initialRadiusInKm: 1,
      polygon: mockFeature,
      currentVertexPosition: 0
    });
    expect(CircleMode.newFeature).toHaveBeenCalled();
  });

  it('should add feature onSetup', () => {
    CircleMode.newFeature.mockReturnValue(mockFeature);
    CircleMode.onSetup({});
    expect(CircleMode.addFeature).toHaveBeenCalledWith(mockFeature);
  });

  it('should clear selected features on setup', () => {
    CircleMode.onSetup({});
    expect(CircleMode.clearSelectedFeatures).toHaveBeenCalled();
  });

  it('should disable double click zoom on setup', () => {
    CircleMode.onSetup({});
    expect(doubleClickZoom.disable).toHaveBeenCalled();
  });

  it('should set the cursor to "add" button', () => {
    CircleMode.onSetup({});
    expect(CircleMode.updateUIClasses).toHaveBeenCalledWith({
      mouse: Constants.cursors.ADD
    });
  });

  it('should activate the polygon button on ui', () => {
    CircleMode.onSetup({});
    expect(CircleMode.activateUIButton).toHaveBeenCalledWith(Constants.types.POLYGON);
  });

  it('should set actionable state by enabling trash', () => {
    CircleMode.onSetup({});
    expect(CircleMode.setActionableState).toHaveBeenCalledWith({
      trash: true
    });
  });

  it('should generate a circle feature and change mode to simple select when clickAnywhere is invoked', () => {
    circle.default.mockReturnValue({
      geometry: {
        coordinates: []
      }
    });
    const mockState = {
      currentVertexPosition: 0,
      initialRadiusInKm: 1,
      polygon: {
        id: 'random_id',
        incomingCoords: jest.fn(),
        properties: {}
      }
    };
    const mockEvent = {
      lngLat: { lat: 0, lng: 0 }
    };

    CircleMode.clickAnywhere(mockState, mockEvent);
    expect(mockState.currentVertexPosition).toBe(1);
    expect(circle.default).toHaveBeenCalledWith([0, 0], 1);
    expect(CircleMode.changeMode).toHaveBeenCalledWith(
      Constants.modes.SIMPLE_SELECT, { featureIds: [mockState.polygon.id] }
    );
  });

  it('should change mode to simple_select without adding a polygon to state if currentVertexPosition is not 0', () => {
    const mockState = {
      currentVertexPosition: 1,
      polygon: {}
    };
    const mockEvent = {
      lngLat: { lat: 0, lng: 0 }
    };

    CircleMode.clickAnywhere(mockState, mockEvent);
    expect(mockState.currentVertexPosition).toBe(1);
    expect(CircleMode.changeMode).toHaveBeenCalledWith(
      Constants.modes.SIMPLE_SELECT, { featureIds: [mockState.polygon.id] }
    )
  });
});