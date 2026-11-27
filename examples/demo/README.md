# mapbox-gl-draw-circle demo

An app for trying every circle flow by hand. It also runs the automated browser tests. It uses the plugin source from this repository (`../../lib`), so edits there reload the page.

## Setup

You need Node 20 or newer. From the repository root:

```sh
npm ci                     # the plugin's own dependencies (turf)
cd examples/demo
npm ci
cp .env.example .env.local # then edit .env.local if needed
```

Pick an engine:

```sh
npm run dev:maplibre   # http://localhost:5174 — MapLibre, no token needed (recommended to start)
npm run dev            # http://localhost:5173 — mapbox-gl v3, needs VITE_MAPBOX_TOKEN
```

**mapbox-gl v3 needs a token to show anything.** Without `VITE_MAPBOX_TOKEN` it loads and drawing still works, but nothing is drawn on the canvas. The page then shows a notice. Get a free token at https://account.mapbox.com/access-tokens/ and put it in `.env.local`. On MapLibre the dev server uses [OpenFreeMap](https://openfreemap.org)'s streets basemap, which needs no key.

`.env.example` lists every setting: `VITE_MAPBOX_TOKEN`, `VITE_MAP_ENGINE` and `VITE_BASEMAP`.

## What's on the page

- **Toolbar:**
  - The draw modes: **Circle (click)**, **Circle (drag)**, **Polygon**, **Select**.
  - **Delete**, which deletes the selection.
  - **Clear all**.
  - **Radius km**, the radius used by **Circle (click)**.
- **Inspector (right):**
  - The current mode, the engine, and whether map panning is on.
  - Every feature with its radius, center and point count.
  - A live log of `draw.*` events.

  A circle always has **65 pts** (64 plus the closing point); any other count is shown in red.
- **Colours:** indigo for features at rest, rose for the one being drawn or edited. The plugin sets no colours. Apps style draw features through MapboxDraw's `styles` option, and the demo's palette is in [`src/theme.js`](src/theme.js).

## Manual test checklist

| # | Flow | Do | Expect |
|---|---|---|---|
| 1 | Circle by click | Set **Radius km**, press **Circle (click)**, click the map | One circle of that radius around the click, 65 pts. `draw.create` in the log, then the mode changes to `simple_select`. |
| 2 | Circle by drag | **Circle (drag)**, then press, drag and release | The circle follows the cursor and the map doesn't pan. On release: `draw.create`, the radius equals the drag distance, and pan is back to `on`. |
| 3 | Click in drag mode (#21) | **Circle (drag)**, click without dragging | Nothing is created, no errors, and you stay in `drag_circle`. A drag afterwards still works. |
| 4 | Cancel a drag | Start a drag, press **Escape** before releasing | Nothing is created. |
| 5 | Leave drag mode | **Circle (drag)**, then **Select** without drawing | Pan goes from `off` back to `on`, and the map can be dragged again. |
| 6 | Move a circle | **Select**, click a circle, drag it | Center and circle move together and the radius doesn't change. `draw.update` (move) appears. |
| 7 | Move far north or south (#24) | Zoom out to about zoom 3, then drag a large circle a long way north or south | It stays a circle and keeps its radius in km; it doesn't stretch into an ellipse. |
| 8 | Resize | Click a selected circle again to enter `direct_select`, then drag one of its 4 handles | The radius follows the cursor, the center stays put, and it still has 65 pts. |
| 9 | Delete | Select a circle and press **Delete** | `draw.delete` appears and the circle is gone. |
| 10 | Polygons unaffected (#5) | **Polygon**: click 3 or more points, then click the first point to close it. Then edit it in `direct_select`. | A normal polygon with no circle properties. Dragging a corner moves only that corner, and midpoints appear. |
| 11 | Map controls after drawing | After any of the above, drag the map and double-click it | Panning and double-click zoom work. |

The 4 resize handles appear only in `direct_select`. In `simple_select`, mapbox-gl-draw 1.5 shows no vertices, so a selected circle has no handles there. That's upstream behaviour, not a bug.

## Hosted demo (GitHub Pages)

`.github/workflows/pages.yml` publishes this app on every push to master that touches the plugin or the demo:

- https://iamanvesh.github.io/mapbox-gl-draw-circle/ runs on mapbox-gl and uses the `MAPBOX_DEMO_TOKEN` repository secret.
- https://iamanvesh.github.io/mapbox-gl-draw-circle/maplibre/ runs on MapLibre with the OpenFreeMap basemap and needs no token.

Without the secret, the root page is the MapLibre build.

**Hosted demo token.** A browser map token can't be hidden: it is part of the page's JavaScript, and anyone can read it. Make it safe to expose instead:
1. Create a dedicated token at https://account.mapbox.com/access-tokens/ for this site only. Use the default public scopes; never use a secret `sk.` token.
2. Under **URL restrictions**, add `https://iamanvesh.github.io`. Use the domain only: browsers usually send just the domain when the map requests tiles, so a restriction that includes the path could block your own page.
3. Save it as a repository secret: `gh secret set MAPBOX_DEMO_TOKEN`. The secret keeps the token out of git and makes rotation easy; it doesn't hide it on the page.
4. Set a usage alert in your Mapbox account. URL restrictions stop other websites from using the token, but a script outside the browser can fake the domain check. If the token is abused, rotate it and update the secret.

## Automated browser tests

```sh
npx playwright install chromium   # once
npm run test:e2e                  # mapbox-gl
npm run test:e2e:maplibre         # MapLibre
```

The tests build the demo with a blank offline basemap and ignore `.env.local`, so they need no token or network. Set `E2E_PORT` if port 4173 is busy. The same suite runs in CI against several mapbox-gl-draw versions. See [`e2e/BASELINE.md`](e2e/BASELINE.md) for how 2.0 compares with the last 1.x release.
