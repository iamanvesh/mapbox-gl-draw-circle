import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  CircleMode,
  DragCircleMode,
  DirectMode,
  SimpleSelectMode,
} from 'mapbox-gl-draw-circle';
import { drawStyles } from './theme.js';

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

// mapbox-gl v3 needs a valid token to paint anything, even an inline style. Without one, the map
// still loads and draw still works (the E2E tests rely on that), but the canvas stays blank.
if (engine === 'mapbox' && !token) {
  const notice = document.getElementById('notice');
  notice.innerHTML = 'No Mapbox token: mapbox-gl v3 won\'t paint the map, but drawing still works '
    + '(see the inspector). Put <code>VITE_MAPBOX_TOKEN=pk...</code> in <code>examples/demo/.env.local</code>, '
    + 'or run with <code>VITE_MAP_ENGINE=maplibre</code>, which needs no token.';
  notice.hidden = false;
}

const blankStyle = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f4f1ea' } }],
};

// Basemap: a real one when available, otherwise the blank offline style.
// - mapbox-gl with a token: Mapbox Streets.
// - maplibre in `npm run dev`: OpenFreeMap's free, token-less streets style, for manual testing.
// - E2E tests (production build) always get the blank style, so they need no network.
// VITE_BASEMAP=blank forces the blank style; VITE_BASEMAP=<style URL> picks another one.
function basemap() {
  const override = import.meta.env.VITE_BASEMAP;
  if (override) return override === 'blank' ? blankStyle : override;
  if (token) return 'mapbox://styles/mapbox/streets-v12';
  if (engine === 'maplibre' && import.meta.env.DEV) return 'https://tiles.openfreemap.org/styles/liberty';
  return blankStyle;
}

const map = new gl.Map({
  container: 'map',
  style: basemap(),
  center: [-73.9855, 40.758],
  zoom: 13,
  // Keeps the WebGL buffer readable for screenshot comparisons in tests
  // (mapbox-gl option; maplibre-gl takes it under canvasContextAttributes).
  preserveDrawingBuffer: true,
  canvasContextAttributes: { preserveDrawingBuffer: true },
});

const draw = new MapboxDraw({
  displayControlsDefault: false,
  styles: drawStyles,
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
const radiusInput = document.getElementById('radius');
buttons.forEach((b) => b.addEventListener('click', () => {
  const opts = b.dataset.mode === 'draw_circle' ? { initialRadiusInKm: Number(radiusInput.value) || 2 } : undefined;
  draw.changeMode(b.dataset.mode, opts);
  syncButtons();
}));
document.getElementById('trash').addEventListener('click', () => draw.trash());
document.getElementById('clear').addEventListener('click', () => { draw.deleteAll(); render(); });
map.on('draw.modechange', syncButtons);

// Inspector: a manual-testing aid that shows what each action did to the features.
const $ = (id) => document.getElementById(id);
$('engine').textContent = engine === 'maplibre' ? 'MapLibre' : 'mapbox-gl';
const fmt = (n, d = 5) => (typeof n === 'number' ? n.toFixed(d) : String(n));

function describe(f) {
  const ring = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : [];
  if (!f.properties.isCircle) return `${f.geometry.type}, ${ring.length || '-'} pts`;
  const [lng, lat] = f.properties.center || [];
  // A full circle ring has 65 positions (64 + closing point); flag anything else.
  const pts = ring.length === 65 ? '65 pts' : `<span class="warn">${ring.length} pts</span>`;
  return `circle r=${fmt(f.properties.radiusInKm, 3)} km, c=[${fmt(lng)}, ${fmt(lat)}], ${pts}`;
}

function render() {
  if (!window.__demo.ready) return;
  const features = draw.getAll().features;
  $('mode').textContent = draw.getMode();
  $('pan').textContent = map.dragPan.isEnabled() ? 'on' : 'off';
  $('count').textContent = features.length;
  const selected = new Set(draw.getSelectedIds());
  $('feature-list').innerHTML = features
    .map((f) => `<li>${selected.has(f.id) ? '<b>' : ''}${describe(f)}${selected.has(f.id) ? '</b>' : ''}</li>`)
    .join('');
}

let logged = 0;
function renderLog() {
  for (const e of events.slice(logged)) {
    const li = document.createElement('li');
    li.className = e.type.replace('draw.', '');
    const detail = e.mode ? e.mode
      : e.features ? e.features.map((f) => (f.properties.isCircle ? `circle ${fmt(f.properties.radiusInKm, 3)} km` : f.geometry.type)).join(', ')
      : '';
    li.textContent = `${new Date().toLocaleTimeString()} ${e.type}${e.action ? ` (${e.action})` : ''} ${detail}`;
    $('log').prepend(li);
  }
  logged = events.length;
}

map.on('load', () => {
  // Re-render on anything that can change features, mode or drag-pan state.
  for (const type of ['draw.create', 'draw.update', 'draw.delete', 'draw.modechange', 'draw.selectionchange', 'draw.render', 'mouseup', 'touchend']) {
    map.on(type, () => { render(); renderLog(); });
  }
  render();
});
