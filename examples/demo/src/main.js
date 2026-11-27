import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  CircleMode,
  DragCircleMode,
  DirectMode,
  SimpleSelectMode,
} from 'mapbox-gl-draw-circle';

// Map engine is chosen at build time: VITE_MAP_ENGINE=maplibre builds the demo on maplibre-gl
// (best effort; mapbox-gl-draw only officially supports mapbox-gl). Each engine lives in its own
// module, so the default mapbox build doesn't bundle maplibre-gl and vice versa.
const engine = import.meta.env.VITE_MAP_ENGINE === 'maplibre' ? 'maplibre' : 'mapbox';
const { default: gl } = engine === 'maplibre'
  ? await import('./engine-maplibre.js')
  : await import('./engine-mapbox.js');

if (engine === 'maplibre') {
  // mapbox-gl-draw hard-codes mapbox-gl class names; point them at MapLibre's (see README).
  Object.assign(MapboxDraw.constants.classes, {
    CANVAS: 'maplibregl-canvas',
    CONTROL_BASE: 'maplibregl-ctrl',
    CONTROL_PREFIX: 'maplibregl-ctrl-',
    CONTROL_GROUP: 'maplibregl-ctrl-group',
  });
}

// With a token (VITE_MAPBOX_TOKEN) the mapbox demo shows a real basemap.
// Without one it uses an inline blank style, which needs no token: this is what the E2E tests run on.
const token = engine === 'mapbox' ? import.meta.env.VITE_MAPBOX_TOKEN : undefined;
if (token) gl.accessToken = token;

const blankStyle = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f4f1ea' } }],
};

const map = new gl.Map({
  container: 'map',
  style: token ? 'mapbox://styles/mapbox/streets-v12' : blankStyle,
  center: [-73.9855, 40.758],
  zoom: 13,
  // Keeps the WebGL buffer readable for screenshot comparisons in tests
  // (mapbox-gl option; maplibre-gl takes it under canvasContextAttributes).
  preserveDrawingBuffer: true,
  canvasContextAttributes: { preserveDrawingBuffer: true },
});

const draw = new MapboxDraw({
  displayControlsDefault: false,
  userProperties: true,
  modes: {
    ...MapboxDraw.modes,
    draw_circle: CircleMode,
    drag_circle: DragCircleMode,
    direct_select: DirectMode,
    simple_select: SimpleSelectMode,
  },
});

// Test hooks: E2E tests read these instead of scraping the canvas.
const events = [];
window.__demo = { map, draw, events, MapboxDraw, ready: false };

map.on('load', () => {
  map.addControl(draw);
  for (const type of ['draw.create', 'draw.update', 'draw.delete', 'draw.modechange', 'draw.selectionchange']) {
    map.on(type, (e) => events.push({ type, features: e.features, mode: e.mode, action: e.action }));
  }
  window.__demo.ready = true;
});

const buttons = document.querySelectorAll('#toolbar [data-mode]');
const syncButtons = () => {
  const current = window.__demo.ready ? draw.getMode() : null;
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === current)));
};
buttons.forEach((b) => b.addEventListener('click', () => {
  draw.changeMode(b.dataset.mode);
  syncButtons();
}));
document.getElementById('trash').addEventListener('click', () => draw.trash());
map.on('draw.modechange', syncButtons);
