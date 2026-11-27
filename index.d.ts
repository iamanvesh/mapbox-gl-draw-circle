// Types build on the community typings for mapbox-gl-draw: npm i -D @types/mapbox__mapbox-gl-draw
import type { DrawCustomMode } from '@mapbox/mapbox-gl-draw';

/** Options for `draw.changeMode('draw_circle', options)`. */
export interface CircleModeOptions {
  /** Radius of the circle created on click, in kilometers. Defaults to 2. */
  initialRadiusInKm?: number;
}

/**
 * Properties of a circle feature as returned by `draw.getAll()` and the `draw.*` events.
 * A circle is a regular GeoJSON Polygon whose ring approximates the circle.
 */
export interface CircleProperties {
  isCircle: true;
  /** [lng, lat] of the circle center. */
  center: [number, number];
  radiusInKm: number;
}

/** Click once to draw a circle of `initialRadiusInKm`. Register it as e.g. `draw_circle`. */
export declare const CircleMode: DrawCustomMode<any, CircleModeOptions>;

/** Press, drag and release to draw a circle. Register it as e.g. `drag_circle`. */
export declare const DragCircleMode: DrawCustomMode;

/** Replacement for `direct_select` that resizes circles from their handles. Register it as `direct_select`. */
export declare const DirectMode: DrawCustomMode;

/** Replacement for `simple_select` that moves circles together with their center. Register it as `simple_select`. */
export declare const SimpleSelectMode: DrawCustomMode;
