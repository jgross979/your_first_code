import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createEarthMaterial, createAtmosphereMaterial } from './earthMaterials.js';
import { makeRingTexture } from './TextureFactory.js';

const DEG = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const SUN_DISPLAY_RADIUS = 20;

/**
 * Anything the camera can focus on: a star, planet, moon, or an abstract
 * region (the Solar System, the solar neighbourhood, …).
 *
 * Scene graph for a body:
 *   orbitFrame        (child of parent's root, oriented to the orbital plane)
 *     orbitLine
 *     root            (moves along the orbit, never rotates)
 *       tiltGroup     (axial tilt)
 *         spinGroup   (daily rotation) -> surface mesh, clouds
 *         rings, atmosphere
 *       label, marker, glow sprites
 */
export class Focusable {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.type = def.type;
    this.info = def.info;
    this.parent = null; // physical parent (Focusable)
    this.focusParent = null; // where zooming out goes
    this.children = []; // physical children
    this.focusChildren = [];
    this.root = new THREE.Object3D();
    this.root.name = def.id;
    this.radius = 0;
    this.worldPosition = new THREE.Vector3();
    this.labelVisible = false;
  }
  get minDistance() { return this.def.minDistance ?? this.radius * 1.03; }
  get zoomOutLimit() { return this.def.zoomOutLimit ?? this.radius * 40; }
  get viewDistance() { return this.def.viewDistance ?? this.radius * 4; }
  get maxDistance() { return this.def.maxDistance ?? Infinity; }
  get infoRange() { return this.def.infoRange ?? this.radius * 14; }
  get isRegion() { return this.type === 'region'; }
  update() {}
  updateWorldPosition() { this.root.getWorldPosition(this.worldPosition); }
  /** km per scene unit near this body, for altitude readouts. */
  get kmPerUnit() { return this.def.radiusKm && this.radius ? this.def.radiusKm / this.radius : null; }
  getSpinQuaternion(target) { return target.identity(); }
  requestDetail() {}
}

/** A focus point with no geometry of its own. */
export class Region extends Focusable {}

export class Body extends Focusable {
  /**
   * @param def  body definition (see src/data)
   * @param env  { textures: TextureFactory, glowTexture, dotTexture, onLabelClick }
   */
  constructor(def, env) {
    super(def);
    this.env = env;
    this.radius = Body.displayRadius(def);
    this.orbitFrame = new THREE.Object3D();
    this.orbitRadius = 0;
    this.tiltGroup = new THREE.Object3D();
    this.spinGroup = new THREE.Object3D();
    this.root.add(this.tiltGroup);
    this.tiltGroup.add(this.spinGroup);
    this.tiltGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -(def.tilt ?? 0) * DEG);
    this.phase0 = hashAngle(def.id);
    this.detailRequested = false;

    this.#buildMesh();
    this.#buildLabel();
    this.#buildMarker();
  }

  static displayRadius(def) {
    if (def.displayRadius) return def.displayRadius;
    if (def.type === 'star') return (def.solarRadii ?? 1) * SUN_DISPLAY_RADIUS;
    const r = def.radiusKm / EARTH_RADIUS_KM;
    return def.type === 'moon' ? Math.max(r, 0.03) : r;
  }

  /** Compressed orbital radius in scene units (see README: "scales"). */
  static displayOrbitRadius(def, parent) {
    const o = def.orbit;
    if (!o) return 0;
    if (o.displayRadius) return o.displayRadius;
    if (o.au) return 40 + 150 * Math.pow(o.au, 0.7);
    const ratio = o.km / parent.def.radiusKm;
    return parent.radius * (2 + 1.2 * Math.sqrt(ratio));
  }

  attachTo(parent) {
    this.parent = parent;
    parent.children.push(this);
    parent.root.add(this.orbitFrame);
    this.orbitFrame.add(this.root);
    this.orbitRadius = Body.displayOrbitRadius(this.def, parent);
    const o = this.def.orbit || {};
    if (o.plane === 'equator' && parent.tiltGroup) {
      this.orbitFrame.quaternion.copy(parent.tiltGroup.quaternion);
    } else {
      const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (o.node ?? 0) * DEG);
      const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -(o.inclination ?? 0) * DEG);
      this.orbitFrame.quaternion.copy(q1).multiply(q2);
    }
    this.#buildOrbitLine();
  }

  // ---------------------------------------------------------------- build --

  #buildMesh() {
    const def = this.def;
    const a = def.appearance || {};
    const R = this.radius;
    const isPlanet = def.type === 'planet' || def.type === 'dwarf';
    const segs = def.id === 'earth' ? [160, 96] : isPlanet || def.id === 'sun' ? [128, 64] : [96, 48];
    const geo = new THREE.SphereGeometry(R, segs[0], segs[1]);

    if (def.type === 'star') {
      this.material = new THREE.MeshBasicMaterial({ color: def.id === 'sun' ? 0xffffff : new THREE.Color(def.color) });
      this.mesh = new THREE.Mesh(geo, this.material);
      this.spinGroup.add(this.mesh);
      const color = new THREE.Color(def.id === 'sun' ? '#ffd27a' : def.color);
      this.glow = makeSprite(this.env.glowTexture, color, R * 7, 0.9);
      this.root.add(this.glow);
      // Screen-space point so the star stays visible from very far away.
      this.farPoint = makeSprite(this.env.glowTexture, color, 0.05, 1, false);
      this.root.add(this.farPoint);
      if (def.id === 'sun') {
        this.light = new THREE.PointLight(0xfff4e6, 3.2, 0, 0);
        this.root.add(this.light);
      }
    } else if (a.style === 'earth') {
      this.material = new THREE.MeshStandardMaterial({ color: 0x2a5599, roughness: 1 });
      this.mesh = new THREE.Mesh(geo, this.material);
      this.spinGroup.add(this.mesh);
      this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 96, 64), createAtmosphereMaterial());
      this.tiltGroup.add(this.atmosphere);
      this.#loadEarth(geo);
    } else {
      this.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(...(a.base || a.bands?.[0] || [160, 160, 160]).map((c) => c / 255)),
        roughness: 1,
        metalness: 0,
      });
      this.mesh = new THREE.Mesh(geo, this.material);
      this.spinGroup.add(this.mesh);
      const atmo = { venus: [1.0, 0.85, 0.55], titan: [1.0, 0.7, 0.35], jupiter: [0.9, 0.8, 0.7], saturn: [0.95, 0.88, 0.7], uranus: [0.6, 0.9, 1.0], neptune: [0.4, 0.6, 1.0], mars: [1.0, 0.6, 0.45] }[def.id];
      if (atmo) {
        this.atmosphere = new THREE.Mesh(
          new THREE.SphereGeometry(R * 1.06, 64, 32),
          createAtmosphereMaterial(new THREE.Color(...atmo), def.id === 'mars' ? 0.35 : 0.7),
        );
        this.tiltGroup.add(this.atmosphere);
      }
    }
    this.mesh.userData.focusable = this;

    if (def.rings) {
      const inner = (def.rings.innerKm / def.radiusKm) * R;
      const outer = (def.rings.outerKm / def.radiusKm) * R;
      const rg = new THREE.RingGeometry(inner, outer, 256, 1);
      const pos = rg.attributes.position;
      const uv = rg.attributes.uv;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
      }
      const rm = new THREE.MeshStandardMaterial({
        map: makeRingTexture(def.rings.bands, def.id.length * 7919),
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
      });
      this.rings = new THREE.Mesh(rg, rm);
      this.rings.rotation.x = -Math.PI / 2; // RingGeometry is in XY; put it in the equatorial (XZ) plane
      this.tiltGroup.add(this.rings);
    }
  }

  async #loadEarth() {
    const loader = new THREE.TextureLoader();
    const base = import.meta.env.BASE_URL + 'textures/earth/';
    const load = (f, srgb = true) =>
      loader.loadAsync(base + f).then((t) => {
        t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.anisotropy = 8;
        return t;
      });
    try {
      const [day, night, water] = await Promise.all([load('day.jpg'), load('night.jpg'), load('water.png', false)]);
      this.material = createEarthMaterial({ day, night, water });
      this.mesh.material = this.material;
    } catch (e) {
      console.warn('Earth textures failed to load', e);
    }
    this.env.onEarthReady?.();
    const { map } = await this.env.textures.request('earth:clouds', 'clouds', {}, 2048, 1024, 50);
    this.clouds = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius * 1.006, 160, 96),
      new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 1, metalness: 0 }),
    );
    this.spinGroup.add(this.clouds);
  }

  #buildOrbitLine() {
    const N = 360;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * this.orbitRadius, 0, -Math.sin(t) * this.orbitRadius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    this.orbitMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(this.def.color || '#8899aa'),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.orbitLine = new THREE.LineLoop(geo, this.orbitMaterial);
    this.orbitFrame.add(this.orbitLine);
  }

  #buildLabel() {
    const el = document.createElement('button');
    el.className = `label label-${this.def.type} hidden`;
    el.textContent = this.def.name;
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.env.onLabelClick?.(this);
    });
    this.labelEl = el;
    this.label = new CSS2DObject(el);
    this.label.center.set(-0.08, this.def.labelBelow ? -0.4 : 0.5);
    this.root.add(this.label);
  }

  #buildMarker() {
    if (this.def.type === 'star') return;
    this.marker = makeSprite(this.env.dotTexture, new THREE.Color(this.def.color || '#ffffff'), 0.012, 1, false);
    this.marker.material.depthTest = true;
    this.root.add(this.marker);
  }

  /** Kick off the procedural texture (once). Higher priority jumps the queue. */
  requestDetail(priority = 0) {
    const a = this.def.appearance;
    if (!a || a.style === 'earth') return;
    const key = `${this.id}:${a.style}`;
    if (this.detailRequested) {
      this.env.textures.bump(key, priority);
      return;
    }
    this.detailRequested = true;
    const big = this.def.type === 'planet' || this.def.type === 'dwarf' || this.def.id === 'sun';
    const w = a.size || (big ? 1024 : 512);
    this.env.textures.request(key, a.style, a, w, w / 2, priority).then(({ map, bumpMap }) => {
      this.material.map = map;
      this.material.color.set(0xffffff);
      if (bumpMap && this.material.isMeshStandardMaterial) {
        this.material.bumpMap = bumpMap;
        this.material.bumpScale = 1.2;
      }
      this.material.needsUpdate = true;
    });
  }

  // --------------------------------------------------------------- update --

  /** Place on orbit and spin, for `days` since J2000. */
  update(days) {
    const o = this.def.orbit;
    if (o && this.parent) {
      const L = o.meanLongitudeJ2000 != null ? o.meanLongitudeJ2000 * DEG : this.phase0;
      const theta = L + (2 * Math.PI * days) / o.periodDays;
      this.orbitAngle = theta;
      this.root.position.set(Math.cos(theta) * this.orbitRadius, 0, -Math.sin(theta) * this.orbitRadius);
    }
    if (this.id === 'earth') {
      // Greenwich Mean Sidereal Time: lines the real day/night up with the texture.
      this.spinGroup.rotation.y = (280.46061837 + 360.98564736629 * days) * DEG;
      if (this.clouds) this.clouds.rotation.y = days * 0.6;
    } else if (this.def.tidallyLocked && this.orbitAngle != null) {
      this.spinGroup.rotation.y = this.orbitAngle + Math.PI;
    } else if (this.def.rotationHours) {
      this.spinGroup.rotation.y = this.phase0 + (2 * Math.PI * days * 24) / this.def.rotationHours;
    }
  }

  /** Call after the scene's world matrices are updated. */
  syncUniforms(sunPos) {
    if (this.material?.uniforms?.sunPosition) this.material.uniforms.sunPosition.value.copy(sunPos);
    if (this.atmosphere) this.atmosphere.material.uniforms.sunPosition.value.copy(sunPos);
  }

  getSpinQuaternion(target) {
    return this.spinGroup.getWorldQuaternion(target);
  }

  setLabelVisible(v) {
    if (v === this.labelVisible) return;
    this.labelVisible = v;
    this.labelEl.classList.toggle('hidden', !v);
  }

  /** Is the straight line from `from` to this body blocked by `other`'s sphere? */
  isOccludedBy(other, from) {
    if (!other || other === this || other.radius <= 0) return false;
    const c = other.worldPosition, p = this.worldPosition;
    const dx = p.x - from.x, dy = p.y - from.y, dz = p.z - from.z;
    const len = Math.hypot(dx, dy, dz);
    const ux = dx / len, uy = dy / len, uz = dz / len;
    const ox = c.x - from.x, oy = c.y - from.y, oz = c.z - from.z;
    const t = ox * ux + oy * uy + oz * uz;
    if (t < 0 || t > len) return false;
    const d2 = ox * ox + oy * oy + oz * oz - t * t;
    return d2 < other.radius * other.radius * 0.98;
  }
}

function makeSprite(texture, color, scale, opacity = 1, sizeAttenuation = true) {
  const m = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}

function hashAngle(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return ((h >>> 0) % 3600) / 3600 * Math.PI * 2;
}
