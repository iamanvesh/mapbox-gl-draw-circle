# Changelog

This project follows [Semantic Versioning](https://semver.org/). The release workflow publishes the section for the version being released as the GitHub release notes, so every version needs a `## [x.y.z]` heading here.

## [2.0.0] - 2026-11-27

Works with `@mapbox/mapbox-gl-draw` 1.4 and 1.5 and mapbox-gl v3. See [Migrating from 1.x](README.md#migrating-from-1x).

### Breaking changes

- **`@mapbox/mapbox-gl-draw` is now a peer dependency (`>=1.4.0`).** Install it yourself. 1.x bundled draw 1.1.1, which failed with mapbox-gl ≥ 0.52 and with newer draw versions (#26, #41, #57).
- **ESM only.** The package has `"type": "module"` and an `exports` map. It works with bundlers and Node `import`, and with `require()` on Node 20.19+ / 22.12+.
- **Only the package entry point can be imported.** Internal paths such as `mapbox-gl-draw-circle/lib/modes/CircleMode` are no longer importable.
- **Importing the plugin no longer changes `MapboxDraw.modes`.** 1.x overwrote parts of the built-in `simple_select` and `direct_select` modes for the whole page. Circle-aware moving and resizing now apply only where you register `SimpleSelectMode` and `DirectMode`, as the README's usage example shows.

### Fixed

- **Build errors from draw 1.1.1's dependencies:**
  - `Can't resolve 'fs'` / `'path'` (`jsonlint-lines`) with webpack 5, Angular and Create React App (#31, #40, #44, #52).
  - `global is not defined` with Vite.
- **Circles were missing a point.** Every created circle lost ring point 1 (64 positions instead of 65).
- **A click without dragging in `drag_circle`** left an empty, invalid polygon (`[[null]]`) behind. That polygon caused "not a valid GeoJSON object" errors (#11, #21).
- **Moving a circle a long way north or south distorted it** into an ellipse. It is now redrawn around its new center with the same radius (#24).
- **Leaving `drag_circle` without drawing** left map panning disabled.

### Added

- **TypeScript types (`index.d.ts`, #8):** `CircleMode`, `DragCircleMode`, `DirectMode`, `SimpleSelectMode`, `CircleModeOptions` and `CircleProperties`. They build on `@types/mapbox__mapbox-gl-draw`, an optional peer dependency.
- **Escape or `draw.trash()` in `drag_circle`** cancels the circle being drawn.
- **A MapLibre workaround** in the README. MapLibre support is best effort; mapbox-gl-draw doesn't officially support it.

### Changed

- **`draw_circle` and `drag_circle` create their feature only when the circle is drawn.** No empty placeholder feature shows up in `draw.getAll()` while either mode is active. Enter in `draw_circle` before clicking no longer switches to `simple_select`; Escape still leaves the mode.
- **When a circle moves, `center` is replaced with a new array.** It used to be edited in place.
- **Dependencies:**
  - turf is now 7.x.
  - The unused `@turf/along` and `@turf/length` were removed.

### Internal

- A Playwright browser suite runs on a demo app. It replaces the separate `mapbox-gl-draw-circle-test` repository.
- Unit tests run on Jest 30 against the real mapbox-gl-draw code.
- Build fixtures cover Node, TypeScript, webpack, React, Vue, Angular and Next.js.
- CI runs across Node 20–24 and mapbox-gl-draw 1.4.0–latest, plus a weekly run against the latest draw.
- Releases go through a manual GitHub Actions workflow. It uses npm trusted publishing with provenance and staged publishing, so CI only stages a version and the maintainer approves it with npm 2FA.

## [1.1.2] - 2020-07-16

### Fixed

- Pinned `@mapbox/mapbox-gl-draw` to 1.1.1 to avoid `Cannot read property 'draw_polygon' of undefined` with draw 1.2.0 (#26).

## [1.1.1] - 2019-08-04

### Changed

- Repository metadata and README updates.

## [1.1.0] - 2019-08-04

### Added

- `DragCircleMode`: press, drag and release to draw a circle.

### Fixed

- `draw_polygon` drew circles after `CircleMode` was registered (#5).

## [1.0.1] - 2019-04-08

### Changed

- README and package metadata updates.

## [1.0.0] - 2019-04-01

### Added

- Initial release: `CircleMode`, `DirectMode` and `SimpleSelectMode`.
