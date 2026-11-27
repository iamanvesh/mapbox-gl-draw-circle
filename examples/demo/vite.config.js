import { defineConfig } from 'vite';

export default defineConfig({
  // Served from https://<user>.github.io/mapbox-gl-draw-circle/ when deployed to Pages.
  base: process.env.DEMO_BASE || '/',
  // Baseline only: draw 1.1.1's dependencies reference Node's `global` and crash in the browser
  // ("global is not defined"). Remove once the demo uses draw >= 1.4.
  define: { global: 'globalThis' },
});
