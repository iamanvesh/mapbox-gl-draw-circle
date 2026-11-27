import MapboxDraw from '@mapbox/mapbox-gl-draw';

/**
 * Demo palette for mapbox-gl-draw. The plugin itself sets no colours: apps style circles (and all
 * other draw features) through MapboxDraw's `styles` option. This recolours draw's own default
 * theme instead of redefining its layers, so it follows whichever draw version is installed.
 */
export const palette = {
  idle: '#4F46E5', // indigo: features at rest
  active: '#F43F5E', // rose: the feature being drawn or edited
  halo: '#FFFFFF',
};

const DRAW_BLUE = '#3bb2d0';
const DRAW_ORANGE = '#fbb03b';

const recolour = (value) => {
  if (typeof value === 'string') {
    const v = value.toLowerCase();
    if (v === DRAW_BLUE) return palette.idle;
    if (v === DRAW_ORANGE) return palette.active;
    return value;
  }
  return Array.isArray(value) ? value.map(recolour) : value;
};

const isActive = ['==', ['get', 'active'], 'true'];

export const drawStyles = MapboxDraw.lib.theme.map((layer) => {
  const paint = Object.fromEntries(Object.entries(layer.paint || {}).map(([k, v]) => [k, recolour(v)]));
  if (layer.type === 'fill') {
    paint['fill-opacity'] = ['case', isActive, 0.22, 0.14];
  }
  if (layer.type === 'line' && 'line-width' in paint) {
    paint['line-width'] = ['case', isActive, 3, 2.5];
  }
  return { ...layer, paint };
});
