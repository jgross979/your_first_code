import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SURFACE_MAPS } from '../data/mapLayers.js';

const EARTH_CIRCUMFERENCE_M = 40075016.686;

/**
 * Full-screen tiled map that takes over from the 3D globe when you get close
 * to the surface, and hands back when you zoom out past `exitZoom`.
 */
export class SurfaceMap {
  constructor(container, { onExit }) {
    this.container = container;
    this.onExit = onExit;
    this.active = false;
    this.map = null;
    this.configId = null;
    this.mapEl = container.querySelector('.map-canvas');
    container.querySelector('.map-exit').addEventListener('click', () => this.exit());
    // Capture-phase wheel listener runs before Leaflet's: scrolling out at the
    // minimum zoom leaves the map instead of doing nothing.
    container.addEventListener(
      'wheel',
      (e) => {
        if (!this.active || !this.map) return;
        // Swallow the tail of the scroll gesture that brought us here, so we
        // don't overshoot several zoom levels on arrival.
        if (performance.now() - this.enteredAt < 500) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (e.deltaY > 0 && this.map.getZoom() <= this.config.exitZoom + 0.05) {
          e.preventDefault();
          e.stopPropagation();
          this.exit();
        }
      },
      { capture: true, passive: false },
    );
  }

  get config() {
    return SURFACE_MAPS[this.configId];
  }

  /** Metres per CSS pixel at a Web-Mercator zoom level and latitude. */
  static metersPerPixel(zoom, latDeg) {
    return (EARTH_CIRCUMFERENCE_M * Math.cos((latDeg * Math.PI) / 180)) / (256 * Math.pow(2, zoom));
  }

  enter(configId, { lat, lon, zoom }) {
    if (this.configId !== configId) this.#build(configId);
    const cfg = this.config;
    zoom = Math.min(Math.max(zoom, cfg.exitZoom + 0.3), cfg.maxZoom);
    this.active = true;
    this.enteredAt = performance.now();
    this.container.classList.add('active');
    this.map.invalidateSize();
    this.map.setView([lat, lon], zoom, { animate: false });
    // Little "landing" zoom so the transition reads as continuous.
    requestAnimationFrame(() => this.map.setZoom(zoom + 0.5, { animate: true }));
    this.#updateCoords();
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.container.classList.remove('active');
    const c = this.map.getCenter();
    this.onExit?.({ lat: c.lat, lon: c.lng, zoom: this.config.exitZoom });
  }

  #build(configId) {
    this.configId = configId;
    const cfg = this.config;
    if (this.map) this.map.remove();
    this.map = L.map(this.mapEl, {
      zoomSnap: 0,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      minZoom: cfg.exitZoom - 0.5,
      maxZoom: cfg.maxZoom,
      worldCopyJump: true,
      zoomControl: false,
      attributionControl: true,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.control.scale({ position: 'bottomleft' }).addTo(this.map);
    const bases = {};
    cfg.baseLayers.forEach((b, i) => {
      const layers = [L.tileLayer(b.url, { maxZoom: cfg.maxZoom, ...b.options })];
      for (const o of b.overlays || []) layers.push(L.tileLayer(o.url, { maxZoom: cfg.maxZoom, ...o.options }));
      const group = L.layerGroup(layers);
      bases[b.name] = group;
      if (i === 0) group.addTo(this.map);
    });
    L.control.layers(bases, null, { position: 'topright', collapsed: false }).addTo(this.map);
    this.map.on('move', () => this.#updateCoords());
    this.map.on('zoomend', () => {
      if (this.active && this.map.getZoom() < cfg.exitZoom - 0.01) this.exit();
    });
  }

  #updateCoords() {
    const el = this.container.querySelector('.map-coords');
    if (!el || !this.map) return;
    const c = this.map.getCenter();
    const ns = c.lat >= 0 ? 'N' : 'S';
    const lng = ((((c.lng + 180) % 360) + 360) % 360) - 180;
    const ew = lng >= 0 ? 'E' : 'W';
    el.textContent = `${Math.abs(c.lat).toFixed(3)}° ${ns}, ${Math.abs(lng).toFixed(3)}° ${ew}`;
  }
}
