# mapbox-gl-draw-circle

Adds support for drawing and editing a circle feature using [mapbox-gl-draw](https://github.com/mapbox/mapbox-gl-draw) library.

## Demo

##### Circle mode
![Circle Mode Demo](demo/CircleModeDemo.gif)

##### Drag Circle mode
![Drag Circle Mode Demo](demo/DragCircleDemo.gif)


## Usage

### Installation

```
npm install mapbox-gl-draw-circle
```

```
import {
    CircleMode,
    DragCircleMode,
    DirectMode,
    SimpleSelectMode
} from 'mapbox-gl-draw-circle';


// userProperties has to be enabled
const draw = new MapboxDraw({
  defaultMode: "draw_circle",
  userProperties: true,
  modes: {
    ...MapboxDraw.modes,
    draw_circle  : CircleMode,
    drag_circle  : DragCircleMode,
    direct_select: DirectMode,
    simple_select: SimpleSelectMode
  }
});

// Add this draw object to the map when map loads
map.addControl(draw);
```

The default radius units are in **kilometers** and initial radius is **2km**.

```
// Provide the default radius as an option to CircleMode
draw.changeMode('draw_circle', { initialRadiusInKm: 0.5 });
```

It fires the same events as the mapbox-gl-draw library. For more information follow this [link](https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#events).

Sample feature object returned in `draw.create` event
```
{
  "id": "e184898e58feaa5c2c56f20a178ffe2c",
  "type": "Feature",
  "properties": {
    "isCircle": true,
    "center": [
      -0.2472604947478203,
      51.53200220026099
    ],
    "radiusInKm": 2
  },
  "geometry": {
    "coordinates": [], // populated with 64 vertices used to render the circle
    "type": "Polygon"
  }
}
```

## Changelog

### v1.1.2

* 开启定制化维护
* 增加鼠标移出地图时执行绘制完成操作

### v1.1.0

* Added a new DragCircle mode.
* Fixed issue (#5), where the polygon mode was not working when used along with CircleMode.