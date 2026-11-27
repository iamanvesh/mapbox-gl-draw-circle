import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  CircleMode,
  DragCircleMode,
  DirectMode,
  SimpleSelectMode,
} from 'mapbox-gl-draw-circle';

// With a token (VITE_MAPBOX_TOKEN) the demo shows a real basemap.
// Without one it uses an inline blank style, which needs no token: this is what the E2E tests run on.
const token = import.meta.env.VITE_MAPBOX_TOKEN;
if (token) mapboxgl.accessToken = token;

const blankStyle = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f4f1ea' } }],
};

const map = new mapboxgl.Map({
  container: 'map',
  style: token ? 'mapbox://styles/mapbox/streets-v12' : blankStyle,
  center: [-73.9855, 40.758],
  zoom: 13,
  // Keeps the WebGL buffer readable for screenshot comparisons in tests.
  preserveDrawingBuffer: true,
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
