import * as THREE from 'three';

/**
 * Queues procedural texture jobs onto a small pool of web workers.
 * Jobs can be re-prioritised (e.g. when the camera flies to a body) so the
 * thing you are looking at gets its detailed texture first.
 */
export class TextureFactory {
  constructor(workerCount = Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1))) {
    this.queue = [];
    this.pending = new Map();
    this.idle = [];
    for (let i = 0; i < workerCount; i++) {
      const w = new Worker(new URL('../workers/textureWorker.js', import.meta.url), { type: 'module' });
      w.onmessage = (e) => this.#onResult(w, e.data);
      this.idle.push(w);
    }
  }

  /** Request a texture. Returns a promise of { map, bumpMap }. */
  request(key, style, params, width, height, priority = 0) {
    if (this.pending.has(key)) return this.pending.get(key).promise;
    let resolve;
    const promise = new Promise((r) => (resolve = r));
    const job = { key, style, params, width, height, id: key, priority };
    this.pending.set(key, { promise, resolve, job });
    this.queue.push(job);
    this.#pump();
    return promise;
  }

  /** Raise the priority of a not-yet-started job. */
  bump(key, priority = 100) {
    const p = this.pending.get(key);
    if (p) p.job.priority = Math.max(p.job.priority, priority);
  }

  #pump() {
    while (this.idle.length && this.queue.length) {
      this.queue.sort((a, b) => b.priority - a.priority);
      const job = this.queue.shift();
      const w = this.idle.pop();
      const { priority, ...msg } = job;
      w.postMessage(msg);
    }
  }

  #onResult(worker, { key, width, height, color, bump }) {
    this.idle.push(worker);
    const entry = this.pending.get(key);
    const make = (buf) => {
      const t = new THREE.DataTexture(new Uint8Array(buf), width, height, THREE.RGBAFormat);
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 4;
      t.needsUpdate = true;
      return t;
    };
    const map = make(color);
    const bumpMap = bump ? make(bump) : null;
    if (bumpMap) bumpMap.colorSpace = THREE.NoColorSpace;
    entry?.resolve({ map, bumpMap });
    this.#pump();
  }
}

/** Soft radial gradient used for glows and distant star points. */
export function makeGlowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.25)', size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.2, mid);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 1D ring texture from [position 0..1, [r,g,b,a]] stops. */
export function makeRingTexture(bands, seed = 1) {
  const w = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = 4;
  const g = c.getContext('2d');
  const img = g.createImageData(w, 4);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const fine = Array.from({ length: w }, () => 0.75 + 0.25 * rnd());
  for (let i = 0; i < w; i++) {
    const x = i / (w - 1);
    let k = 0;
    while (k < bands.length - 2 && bands[k + 1][0] < x) k++;
    const [x0, c0] = bands[k];
    const [x1, c1] = bands[k + 1];
    const t = Math.min(1, Math.max(0, (x - x0) / (x1 - x0 || 1)));
    const f = fine[i];
    for (let row = 0; row < 4; row++) {
      const o = (row * w + i) * 4;
      img.data[o] = (c0[0] + (c1[0] - c0[0]) * t) * f;
      img.data[o + 1] = (c0[1] + (c1[1] - c0[1]) * t) * f;
      img.data[o + 2] = (c0[2] + (c1[2] - c0[2]) * t) * f;
      img.data[o + 3] = 255 * (c0[3] + (c1[3] - c0[3]) * t) * (0.6 + 0.4 * f);
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
