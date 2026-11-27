import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject, viewChild } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } from 'mapbox-gl-draw-circle';

declare global {
  interface Window { __demo?: { map: mapboxgl.Map; draw: MapboxDraw; ready: boolean } }
}

@Component({
  selector: 'app-root',
  template: '<div #map style="position: absolute; inset: 0"></div>',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private readonly zone = inject(NgZone);
  private map?: mapboxgl.Map;

  ngAfterViewInit(): void {
    // Map events don't need Angular change detection.
    this.zone.runOutsideAngular(() => {
      const map = new mapboxgl.Map({
        container: this.container().nativeElement,
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
      this.map = map;
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
