import { circle } from '@turf/circle';
import { distance } from '@turf/distance';
import { point } from '@turf/helpers';

/** Distance in km between two [lng, lat] positions. */
export function distanceInKm(from, to) {
  return distance(point(from), point(to), { units: 'kilometers' });
}

/** Sets a draw feature's geometry and properties to a circle around `center`. */
export function setCircle(feature, center, radiusInKm) {
  feature.incomingCoords(circle(center, radiusInKm).geometry.coordinates);
  feature.properties.center = center;
  feature.properties.radiusInKm = radiusInKm;
}

/** Circles among `features`, with their first ring vertex, captured before draw moves them. */
export function captureCircles(features) {
  return features
    .filter((f) => f.properties.isCircle && f.properties.center && f.properties.center.length === 2)
    .map((f) => ({ feature: f, anchor: [...f.getCoordinate('0.0')] }));
}

/**
 * After draw has moved features by shifting every vertex in lng/lat, redraws each captured circle
 * around its moved center with its original radius. A lng/lat shift alone turns the circle into an
 * ellipse when it moves north or south, because a degree of longitude shrinks with latitude (#24).
 * The applied delta is read back from the first vertex, so draw's own movement constraints
 * (e.g. at the poles) carry over to the center.
 */
export function redrawMovedCircles(captured) {
  for (const { feature, anchor } of captured) {
    const moved = feature.getCoordinate('0.0');
    const [lng, lat] = feature.properties.center;
    const center = [lng + (moved[0] - anchor[0]), lat + (moved[1] - anchor[1])];
    if (typeof feature.properties.radiusInKm === 'number') {
      setCircle(feature, center, feature.properties.radiusInKm);
    } else {
      feature.properties.center = center;
    }
  }
}

/** Fires a draw event from a mode: `this.fire` on mapbox-gl-draw >= 1.5, `this.map.fire` on 1.4. */
export function fireEvent(mode, type, payload) {
  if (typeof mode.fire === 'function') mode.fire(type, payload);
  else mode.map.fire(type, payload);
}
