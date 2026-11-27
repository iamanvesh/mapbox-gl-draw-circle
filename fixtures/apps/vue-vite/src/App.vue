<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } from 'mapbox-gl-draw-circle';

const container = ref(null);
// Keep map and draw out of Vue's reactivity: proxying them breaks mapbox-gl internals.
let map;

onMounted(() => {
  map = new mapboxgl.Map({
    container: container.value,
    style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eee' } }] },
    center: [-73.9855, 40.758],
    zoom: 13,
  });
  const draw = new MapboxDraw({
    displayControlsDefault: false,
    userProperties: true,
    modes: {
      ...MapboxDraw.modes,
      draw_circle: CircleMode,
      drag_circle: DragCircleMode,
      direct_select: DirectMode,
      simple_select: SimpleSelectMode,
    },
  });
  map.on('load', () => {
    map.addControl(draw);
    window.__demo = { map, draw, ready: true };
  });
});

onBeforeUnmount(() => map?.remove());
</script>

<template>
  <div ref="container" style="position: absolute; inset: 0" />
</template>
