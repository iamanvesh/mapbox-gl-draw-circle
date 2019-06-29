jest.mock('@mapbox/mapbox-gl-draw/src/lib/double_click_zoom', () => ({
  enable: jest.fn(),
  disable: jest.fn()
}));

jest.mock('@turf/circle', () => ({
  default: jest.fn()
}));

let CircleMode = require('../../lib/modes/ScaleCircleMode');
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

  xit('should setup state with a polygon and initialRadius', () => {
    CircleMode.newFeature.mockReturnValue(mockFeature);
    expect(CircleMode.onSetup({})).toEqual({
      initialRadiusInKm: 2,
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
});