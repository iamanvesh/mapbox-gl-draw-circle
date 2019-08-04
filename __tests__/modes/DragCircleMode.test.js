jest.mock('@mapbox/mapbox-gl-draw/src/lib/double_click_zoom', () => ({
  enable: jest.fn(),
  disable: jest.fn()
}));

jest.mock('@turf/circle', () => ({
  default: jest.fn()
}));

jest.mock('@turf/distance', () => ({
  default: jest.fn()
}));

jest.mock('../../lib/utils/drag_pan', () => ({
  enable: jest.fn(),
  disable: jest.fn()
}));

let DragCircleMode = require('../../lib/modes/DragCircleMode');
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
const dragPan = require('../../lib/utils/drag_pan');
const distance = require('@turf/distance');

describe('DragCircleMode', function () {


  beforeEach(() => {
    DragCircleMode = {
      ...DragCircleMode,
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
    DragCircleMode.changeMode.mockClear();
  });

  it('should setup state with a polygon', () => {
    DragCircleMode.newFeature.mockReturnValue(mockFeature);
    expect(DragCircleMode.onSetup({})).toEqual({
      polygon: mockFeature,
      currentVertexPosition: 0
    });
    expect(DragCircleMode.addFeature).toHaveBeenCalledWith(mockFeature);
  });

  it('should clear selected features on setup', () => {
    DragCircleMode.onSetup({});
    expect(DragCircleMode.clearSelectedFeatures).toHaveBeenCalled();
  });

  it('should disable double click zoom on setup', () => {
    DragCircleMode.onSetup({});
    expect(doubleClickZoom.disable).toHaveBeenCalled();
  });

  it('should disable dragPan on setup', function () {
    DragCircleMode.onSetup({});
    expect(dragPan.disable).toHaveBeenCalled();
  });

  it('should update the center when onMouseDown is fired', function () {
    const state = {
      polygon: {
        properties: {
          center: []
        }
      }
    };

    const e = {
      lngLat: {
        lat: 1,
        lng: 2
      }
    };
    DragCircleMode.onMouseDown(state, e);
    expect(state).toEqual({
      polygon: {
        properties: {
          center: [2, 1]
        }
      }
    })
  });

  it('should update the center when onTouchStart is fired', function () {
    const state = {
      polygon: {
        properties: {
          center: []
        }
      }
    };

    const e = {
      lngLat: {
        lat: 1,
        lng: 2
      }
    };
    DragCircleMode.onTouchStart(state, e);
    expect(state).toEqual({
      polygon: {
        properties: {
          center: [2, 1]
        }
      }
    })
  });

  it('should discard the circle if its a click event', function () {
    const state = {
      polygon: {
        properties: {
          center: [2, 1]
        }
      }
    };
    DragCircleMode.onClick(state, {});
    expect(state).toEqual({
      polygon: {
        properties: {
          center: []
        }
      }
    })
  });

  it('should discard the circle if its a tap event', function () {
    const state = {
      polygon: {
        properties: {
          center: [2, 1]
        }
      }
    };
    DragCircleMode.onTap(state, {});
    expect(state).toEqual({
      polygon: {
        properties: {
          center: []
        }
      }
    })
  });

  it('should finish drawing if onMouseUp is fired', function () {
    const state = {
      polygon: {
        id: 'test-id',
      }
    };
    DragCircleMode.onMouseUp(state, {});
    expect(dragPan.disable).toHaveBeenCalled();
    expect(DragCircleMode.changeMode).toHaveBeenCalledWith(Constants.modes.SIMPLE_SELECT,
      {featureIds: ['test-id']})
  });

  it('should finish drawing if onTouchEnd is fired', function () {
    const state = {
      polygon: {
        id: 'test-id',
      }
    };
    DragCircleMode.onTouchEnd(state, {});
    expect(dragPan.disable).toHaveBeenCalled();
    expect(DragCircleMode.changeMode).toHaveBeenCalledWith(Constants.modes.SIMPLE_SELECT,
      {featureIds: ['test-id']})
  });

  it('should should set active state and display features', function () {
    const state = {
      polygon: {
        id: 'test-id'
      }
    };

    const geojson = {
      properties: {
        id: 'test-id'
      }
    };

    const display = jest.fn();

    DragCircleMode.toDisplayFeatures(state, geojson, display);
    expect(geojson.properties.active).toEqual(Constants.activeStates.ACTIVE);
    expect(display).toHaveBeenCalledWith(geojson);
  });

  it('should adjust the geometry when onDrag is fired', function () {
    distance.default.mockReturnValue(2);
    circle.default.mockReturnValue({
      geometry: {
        coordinates: [12, 2]
      }
    });
    const state = {
      polygon: {
        properties: {
          center: [1, 2],
          radiusInKm: 1
        },
        incomingCoords: jest.fn()
      }
    };
    DragCircleMode.onDrag(state, { lngLat: { lat: 1, lng: 2}});
    expect(state.polygon.incomingCoords).toHaveBeenCalledWith([12, 2])
    expect(state.polygon.properties.radiusInKm).toEqual(2);
  });

  it('should adjust the geometry when onMouseMove is fired', function () {
    distance.default.mockReturnValue(2);
    circle.default.mockReturnValue({
      geometry: {
        coordinates: [12, 2]
      }
    });
    const state = {
      polygon: {
        properties: {
          center: [1, 2],
          radiusInKm: 1
        },
        incomingCoords: jest.fn()
      }
    };
    DragCircleMode.onMouseMove(state, { lngLat: { lat: 1, lng: 2}});
    expect(state.polygon.incomingCoords).toHaveBeenCalledWith([12, 2])
    expect(state.polygon.properties.radiusInKm).toEqual(2);
  });
});