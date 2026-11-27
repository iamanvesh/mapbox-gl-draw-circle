/**
 * Moves the stored `center` of every circle in `features` by `delta`, after draw has moved
 * the features' coordinates. Non-circle features are ignored.
 */
export default function shiftCircleCenters(features, delta) {
  for (const feature of features) {
    const center = feature.properties.isCircle && feature.properties.center;
    if (center && center.length === 2) {
      center[0] += delta.lng;
      center[1] += delta.lat;
    }
  }
}
