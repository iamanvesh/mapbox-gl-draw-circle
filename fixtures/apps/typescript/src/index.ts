// Type-checks typical usage against index.d.ts (fixes "Could not find a declaration file", #8).
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {
  CircleMode,
  DragCircleMode,
  DirectMode,
  SimpleSelectMode,
  type CircleModeOptions,
  type CircleProperties,
} from 'mapbox-gl-draw-circle';

const map = new mapboxgl.Map({ container: 'map', style: { version: 8, sources: {}, layers: [] } });

const draw = new MapboxDraw({
  userProperties: true,
  modes: {
    ...MapboxDraw.modes,
    draw_circle: CircleMode,
    drag_circle: DragCircleMode,
    direct_select: DirectMode,
    simple_select: SimpleSelectMode,
  },
});
map.addControl(draw);

const options: CircleModeOptions = { initialRadiusInKm: 0.5 };
draw.changeMode('draw_circle' as never, options as never);

map.on('draw.create', (e: { features: GeoJSON.Feature[] }) => {
  const props = e.features[0].properties as CircleProperties;
  const [lng, lat]: [number, number] = props.center;
  const km: number = props.radiusInKm;
  console.log(lng, lat, km, props.isCircle satisfies true);
});

// @ts-expect-error: initialRadiusInKm must be a number
const bad: CircleModeOptions = { initialRadiusInKm: '2' };
void bad;
