import { defineConfig } from 'vite';

export default defineConfig({
  // Served from https://<user>.github.io/mapbox-gl-draw-circle/ when deployed to Pages.
  base: process.env.DEMO_BASE || '/',
  resolve: {
    // The plugin is linked from ../.. and would otherwise resolve its own copy of draw from the
    // repo root's node_modules. Apps get a single copy from npm; mirror that here.
    dedupe: ['@mapbox/mapbox-gl-draw'],
  },
});
