import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CameraRig } from './CameraRig.js';
import { SimClock } from './SimClock.js';
import { Universe } from '../scene/Universe.js';
import { TextureFactory, makeGlowTexture } from '../scene/TextureFactory.js';
import { createStarfield } from '../scene/Starfield.js';
import { SurfaceMap } from '../map/SurfaceMap.js';
import { SURFACE_MAPS } from '../data/mapLayers.js';
import { InfoPanel } from '../ui/InfoPanel.js';
import { Hud } from '../ui/Hud.js';

const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();

export class App {
  constructor(root) {
    this.root = root;
    const stage = root.querySelector('#stage');

    // --- rendering ---------------------------------------------------------
    this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    stage.appendChild(this.renderer.domElement);
    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'label-layer';
    stage.appendChild(this.labels.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1e8);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.05));
    this.starfield = createStarfield();
    this.scene.add(this.starfield);

    // --- world -------------------------------------------------------------
    this.clock = new SimClock(3600);
    this.textures = new TextureFactory();
    this.universe = new Universe(this.scene, {
      textures: this.textures,
      glowTexture: makeGlowTexture(),
      dotTexture: makeGlowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.9)', 64),
      onLabelClick: (f) => this.goTo(f),
      onEarthReady: () => root.querySelector('#loading')?.classList.add('done'),
    });
    for (const b of this.universe.bodies) {
      const pr = b.id === 'sun' ? 30 : b.type === 'planet' || b.type === 'dwarf' ? 10 : b.parent?.id === 'earth' ? 8 : 1;
      b.requestDetail(pr);
    }

    // --- controls & UI -----------------------------------------------------
    this.rig = new CameraRig(this.camera, this.renderer.domElement);
    this.rig.onTap = (x, y) => {
      const hit = this.pick(x, y);
      if (hit) this.goTo(hit);
    };
    this.rig.onPinch = (ratio) => this.rig.zoomBy(ratio);
    stage.addEventListener('wheel', (e) => this.#onWheel(e), { passive: false });
    window.addEventListener('keydown', (e) => this.#onKey(e));

    this.panel = new InfoPanel(root.querySelector('#info-panel'), { onNavigate: (id) => this.goTo(this.universe.get(id)) });
    this.hud = new Hud(root, { clock: this.clock, onNavigate: (id) => this.goTo(this.universe.get(id)) });
    this.hud.buildNavigator(this.universe);
    root.querySelector('#info-toggle').addEventListener('click', () => this.panel.reopen(this.rig.focus));

    this.map = new SurfaceMap(root.querySelector('#surface-map'), { onExit: (s) => this.#exitMap(s) });
    this.mapActive = false;
    this.mapEnteredAt = 0;

    window.addEventListener('resize', () => this.#resize());
    this.#resize();
    this.#placeInitialCamera();
    this.last = performance.now();
    this.renderer.setAnimationLoop(() => this.#frame());
  }

  // ------------------------------------------------------------ navigation --

  goTo(f) {
    if (!f) return;
    if (this.mapActive) this.map.exit();
    this.rig.flyTo(f);
  }

  /** The focusable under a screen point, if any. */
  pick(x, y) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const px = x - rect.left, py = y - rect.top;
    const cam = this.camera;
    const pxPerRad = this.pxPerRadian;
    let onDisc = null, onDiscDist = Infinity;
    let near = null, nearScore = Infinity;
    for (const b of this.universe.bodies) {
      tmpV.copy(b.worldPosition).project(cam);
      if (tmpV.z > 1 || tmpV.z < -1) continue;
      const sx = (tmpV.x * 0.5 + 0.5) * W;
      const sy = (-tmpV.y * 0.5 + 0.5) * H;
      const dCam = cam.position.distanceTo(b.worldPosition);
      const pxR = (b.radius / dCam) * pxPerRad;
      if (!b.labelVisible && pxR < 2 && b !== this.rig.focus) continue;
      const d = Math.hypot(sx - px, sy - py);
      if (d <= pxR) {
        if (dCam < onDiscDist) (onDisc = b), (onDiscDist = dCam);
      } else {
        const thresh = Math.max(pxR * 1.15, 16);
        if (d < thresh && d / thresh < nearScore) (near = b), (nearScore = d / thresh);
      }
    }
    return onDisc || near;
  }

  #onWheel(e) {
    e.preventDefault();
    if (this.rig.flying) return;
    let dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    dy = THREE.MathUtils.clamp(dy, -250, 250);
    if (dy < 0) {
      const hit = this.pick(e.clientX, e.clientY);
      if (hit && hit !== this.rig.focus) return this.goTo(hit);
    }
    this.rig.zoomBy(Math.exp(dy * 0.0018));
  }

  #onKey(e) {
    if (e.target.closest?.('input, textarea')) return;
    if (e.key === 'Escape') {
      if (this.mapActive) this.map.exit();
      else this.goTo(this.rig.focus?.focusParent);
    } else if (e.key === ' ') {
      e.preventDefault();
      this.hud.setRate(this.clock.rate ? 0 : 3600);
    } else if (e.key === '+' || e.key === '=') this.rig.zoomBy(0.7);
    else if (e.key === '-' || e.key === '_') this.rig.zoomBy(1.4);
    else if (e.key === ']') this.hud.cycleRate(1);
    else if (e.key === '[') this.hud.cycleRate(-1);
  }

  // ------------------------------------------------------------ surface map --

  get pxPerRadian() {
    return this.viewH / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
  }

  /** Lat/lon (degrees) directly beneath the camera on a body. */
  #subCameraLatLon(body) {
    tmpV.copy(this.camera.position).sub(body.worldPosition).normalize();
    body.getSpinQuaternion(tmpQ);
    tmpV.applyQuaternion(tmpQ.invert());
    return {
      lat: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(tmpV.y, -1, 1))),
      lon: THREE.MathUtils.radToDeg(Math.atan2(-tmpV.z, tmpV.x)),
    };
  }

  /** Camera altitude (scene units) that shows the same ground width as a map zoom level. */
  #altitudeForZoom(body, zoom, lat) {
    const mpp = SurfaceMap.metersPerPixel(zoom, Math.min(Math.abs(lat), 75));
    const widthKm = (mpp * this.viewW) / 1000;
    const tanHalfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
    return widthKm / (2 * tanHalfH) / body.kmPerUnit;
  }

  #zoomForAltitude(body, alt, lat) {
    const tanHalfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
    const widthM = alt * body.kmPerUnit * 2 * tanHalfH * 1000;
    const mpp = widthM / this.viewW;
    return Math.log2(SurfaceMap.metersPerPixel(0, Math.min(Math.abs(lat), 75)) / mpp);
  }

  #maybeEnterMap() {
    const f = this.rig.focus;
    const mapId = f?.def.surfaceMap;
    if (!mapId || this.mapActive || this.rig.flying || !this.rig.zoomingIn) return;
    const { lat, lon } = this.#subCameraLatLon(f);
    const cfg = SURFACE_MAPS[mapId];
    if (this.rig.altitude > this.#altitudeForZoom(f, cfg.enterZoom, lat)) return;
    this.mapActive = true;
    this.mapEnteredAt = performance.now();
    this.mapBody = f;
    this.map.enter(mapId, { lat, lon, zoom: this.#zoomForAltitude(f, this.rig.altitude, lat) });
  }

  #exitMap({ lat, lon, zoom }) {
    const body = this.mapBody;
    this.mapActive = false;
    const alt = this.#altitudeForZoom(body, zoom, lat);
    const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
    const dir = new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo));
    dir.applyQuaternion(body.getSpinQuaternion(tmpQ));
    this.rig.fly = null;
    this.rig.jumpTo(body, dir.multiplyScalar(body.radius + alt));
    this.rig.lookPoint.copy(body.worldPosition);
  }

  // ------------------------------------------------------------------ loop --

  #placeInitialCamera() {
    this.clock.tick(0);
    this.universe.update({ days: this.clock.daysSinceJ2000 });
    this.scene.updateMatrixWorld();
    this.universe.syncPositions();
    const earth = this.universe.get('earth');
    // Start on the day side, looking at Earth with the Sun off to one side.
    const toSun = earth.worldPosition.clone().negate().normalize();
    const side = new THREE.Vector3(0, 1, 0).cross(toSun).normalize();
    const offset = toSun.multiplyScalar(0.8).add(side.multiplyScalar(0.6)).add(new THREE.Vector3(0, 0.25, 0)).setLength(3.6);
    this.rig.jumpTo(earth, offset);
    this.rig.lookPoint.copy(earth.worldPosition);
  }

  #resize() {
    const stage = this.root.querySelector('#stage');
    this.viewW = stage.clientWidth;
    this.viewH = stage.clientHeight;
    this.renderer.setSize(this.viewW, this.viewH);
    this.labels.setSize(this.viewW, this.viewH);
    this.camera.aspect = this.viewW / this.viewH;
    this.camera.updateProjectionMatrix();
  }

  #frame() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;

    this.clock.tick(dt);
    const frame = { days: this.clock.daysSinceJ2000, dt };
    this.universe.update(frame);
    this.scene.updateMatrixWorld();
    this.universe.syncPositions();

    if (!this.mapActive) this.rig.update(dt, this.viewH);
    this.camera.updateMatrixWorld();
    this.#transitions();

    const focus = this.rig.fly?.target ?? this.rig.focus;
    Object.assign(frame, { cameraPos: this.camera.position, camera: this.camera, focus, pxPerRadian: this.pxPerRadian });
    this.universe.afterUpdate(frame);
    this.starfield.position.copy(this.camera.position);

    const showInfo = !this.rig.flying && !this.mapActive && this.rig.distance < focus.infoRange;
    this.panel.update(showInfo ? focus : null);
    this.hud.update({ path: this.universe.pathTo(focus), focus, rig: this.rig, mapActive: this.mapActive });

    // Once the map has fully covered the screen there's no need to draw space.
    if (!this.mapActive || now - this.mapEnteredAt < 800) {
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    }
  }

  /** Hand the focus up/down the hierarchy as you zoom out/in. */
  #transitions() {
    const rig = this.rig;
    const f = rig.focus;
    if (!f || rig.flying || this.mapActive) return;
    if (f.focusParent && rig.distance > f.zoomOutLimit) {
      rig.setFocus(f.focusParent);
      return;
    }
    if (f.zoomInTarget && rig.zoomingIn && rig.distance < f.minDistance * 1.06) {
      rig.setFocus(f.zoomInTarget);
      f.zoomInTarget.requestDetail?.(100);
      return;
    }
    this.#maybeEnterMap();
  }
}
