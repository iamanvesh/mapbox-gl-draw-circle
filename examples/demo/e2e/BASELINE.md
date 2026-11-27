# E2E baseline: published mapbox-gl-draw-circle 1.1.2

Recorded 2026-11-27, before the 2.0 upgrade. The demo installed `mapbox-gl-draw-circle@1.1.2` from npm, which uses `@mapbox/mapbox-gl-draw@1.1.1`, on `mapbox-gl@3.36` with Vite 8 and headless Chromium.

## Setup needed just to run 1.1.2

These are the workarounds users of 1.1.2 need today. Remove both once the demo uses the local package on draw ≥ 1.4.

- **`legacy-peer-deps` in `.npmrc`.** draw 1.1.1 declares `mapbox-gl >=0.27.0 <=0.51.0`, so `npm install` fails with `ERESOLVE`.
- **`define: { global: 'globalThis' }` in `vite.config.js`.** Without it the page crashes with `global is not defined`; this is the Vite problem behind PR #62.
- **Build warnings.** Vite warns that `fs` and `path` were externalized for `jsonlint-lines`, which draw 1.1.1 pulls in through `geojsonhint`. Webpack 5 turns the same imports into hard errors (#40, #31, #52).

## Results

Of 11 tests, 5 pass. The other 6 fail because of 2 real bugs and are marked `knownBug(...)`, so CI stays green on the baseline.

**Pass:**
- Map panning is blocked during `drag_circle` and turned back on afterwards.
- `direct_select` handle drag resizes the circle and keeps its center.
- Trash deletes the selected circle.
- `draw_polygon` still draws regular polygons (#5).
- `direct_select` on a polygon moves a single vertex.

**Bug 1: every created circle is missing ring point 1.** It has 64 points instead of 65; the point at bearing −5.6° is dropped. Center, radius and the other points are correct. Affected tests:
- the `draw_circle` click test
- the `draw_circle` default-radius test
- the `drag_circle` create test
- the `simple_select` move test
- the `direct_select` body-move test

A resize regenerates the full ring, so the resize test passes.

**Bug 2: a click in `drag_circle` without dragging leaves a 1-point polygon behind** (#11, #21).

## What this means for the upgrade

Any test outside the `knownBug` set that fails after the upgrade is a regression. A `knownBug` test that starts passing makes Playwright report an error; remove its marker in the same change as the fix.
