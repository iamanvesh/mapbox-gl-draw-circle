# Consumer fixtures

These check that the package as published works in real apps. `run.mjs` does this for each app in `apps/`:

1. Packs the repo with `npm pack`.
2. Installs the tarball into a fresh copy of the app. This is a plain `npm install`, with no workspace links.
3. Builds the app with its own toolchain.
4. For browser apps, runs `smoke.spec.js` against the built output: it opens the page and draws one circle.

| App | What it covers |
|---|---|
| `node` | Node ESM `import` and CommonJS `require()` (Node ≥ 20.19 / 22.12). Checks that `MapboxDraw.modes` is not changed and that only the documented entry points are exported. |
| `typescript` | Strict type-check of typical usage against `index.d.ts`, with `bundler` and `NodeNext` module resolution and `skipLibCheck: false`. |
| `webpack` | webpack 5 with no Node polyfills. Any build warning fails the fixture. Before 2.0 this failed with `Can't resolve 'fs'` (#40, #52). |
| `react-vite` | React 19 + Vite, inside `StrictMode`. |
| `vue-vite` | Vue 3 + Vite. |
| `angular` | Angular 22 CLI, `@angular/build:application`. Any build warning fails the fixture. |
| `next` | Next.js 16 App Router with static export. The page is prerendered on the server, so importing the package without `window` is covered. |

To run them:

```sh
cd fixtures && npm ci && npx playwright install chromium
node run.mjs                 # all fixtures
node run.mjs angular next    # only some
KEEP_FIXTURES=1 node run.mjs webpack                # keep the temp build directory for debugging
FIXTURE_DRAW_VERSION=1.4.3 node run.mjs react-vite  # run against another @mapbox/mapbox-gl-draw version
```

The full behaviour suite runs once, against `examples/demo` (see `examples/demo/e2e`).
