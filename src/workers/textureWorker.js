/**
 * Procedural planet textures, generated off the main thread.
 *
 * Noise is sampled in 3D on the unit sphere, so textures have no seam at the
 * date line and no pinching at the poles.
 *
 * Add a new look by writing a function `(p, lat, lon, ctx) => [r,g,b,a,height]`
 * and registering it in STYLES. Body data selects it with `appearance.style`.
 */
import { createNoise3D } from 'simplex-noise';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const mix = (a, b, t) => a + (b - a) * t;
const mixc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function makeCtx(seed) {
  const rand = mulberry32(seed);
  const noise = createNoise3D(rand);
  const fbm = (x, y, z, octaves = 5, lac = 2, gain = 0.5) => {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise(x * freq, y * freq, z * freq);
      norm += amp;
      amp *= gain;
      freq *= lac;
    }
    return sum / norm; // ~[-1, 1]
  };
  const randomDir = () => {
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    return [r * Math.cos(th), u, r * Math.sin(th)];
  };
  return { rand, noise, fbm, randomDir };
}

// ---------------------------------------------------------------- styles ---

function rocky(params, ctx) {
  const {
    base = [140, 140, 140], dark = [80, 80, 80], light = [200, 200, 200],
    noiseScale = 2.5, craters = 50, craterMax = 0.1, contrast = 1,
    maria = 0, polarCaps = 0, capColor = [245, 245, 250], streaks = null,
    spots = 0, spotColor = [40, 30, 20], twoTone = false, heart = false, bigCrater = false,
  } = params;

  // Pre-place craters as (direction, angular radius).
  const craterList = [];
  for (let i = 0; i < craters; i++) {
    const r = craterMax * Math.pow(ctx.rand(), 3) + 0.008;
    craterList.push({ d: ctx.randomDir(), r, cosOuter: Math.cos(r * 1.4) });
  }
  if (bigCrater) craterList.push({ d: [1, 0.1, 0], r: 0.45, cosOuter: Math.cos(0.45 * 1.4) });
  const spotList = [];
  for (let i = 0; i < spots; i++) {
    const r = 0.02 + 0.05 * ctx.rand();
    spotList.push({ d: ctx.randomDir(), r, cosR: Math.cos(r) });
  }

  return (p, lat, lon) => {
    const [x, y, z] = p;
    let n = ctx.fbm(x * noiseScale, y * noiseScale, z * noiseScale, 6);
    let t = clamp01(0.5 + 0.5 * n * contrast);
    let h = t;
    let col = t < 0.5 ? mixc(dark, base, t * 2) : mixc(base, light, (t - 0.5) * 2);

    if (maria > 0) {
      const m = ctx.fbm(x * 1.3 + 7, y * 1.3, z * 1.3, 4);
      const k = smooth(0.05, 0.25, m) * maria;
      col = mixc(col, mixc(dark, [60, 60, 62], 0.5), k);
      h -= k * 0.3;
    }
    if (twoTone) {
      const k = smooth(-0.15, 0.15, x + 0.15 * n);
      col = mixc(col, dark, k * 0.9);
    }
    if (heart) {
      // A bright region roughly where Pluto's Tombaugh Regio is.
      const d = Math.hypot(lon - 0.3, (lat - 0.25) * 1.3);
      const k = 1 - smooth(0.35, 0.5, d + 0.05 * n);
      col = mixc(col, [245, 238, 225], k);
    }

    for (const c of craterList) {
      const dot = x * c.d[0] + y * c.d[1] + z * c.d[2];
      if (dot < c.cosOuter) continue;
      const a = Math.acos(Math.min(1, dot)) / c.r; // 0 at centre, 1 at rim
      if (a < 1) {
        const bowl = 1 - a * a;
        col = mixc(col, dark, 0.35 * bowl);
        h -= 0.5 * bowl;
      } else {
        const rim = 1 - (a - 1) / 0.4;
        col = mixc(col, light, 0.3 * rim);
        h += 0.25 * rim;
      }
    }
    for (const s of spotList) {
      const dot = x * s.d[0] + y * s.d[1] + z * s.d[2];
      if (dot > s.cosR) {
        const k = smooth(s.cosR, 1, dot);
        col = mixc(col, spotColor, 0.6 + 0.4 * k);
      }
    }
    if (streaks) {
      const s1 = Math.abs(ctx.noise(x * 4, y * 4, z * 4));
      const s2 = Math.abs(ctx.noise(x * 9 + 3, y * 9, z * 9));
      const k = (1 - smooth(0, 0.035, s1)) * 0.8 + (1 - smooth(0, 0.025, s2)) * 0.5;
      col = mixc(col, streaks, clamp01(k));
    }
    if (polarCaps > 0) {
      const edge = polarCaps + 4 * ctx.fbm(x * 6, y * 6, z * 6, 3);
      const k = smooth(edge - 1.5, edge + 1.5, Math.abs(lat) * (180 / Math.PI));
      col = mixc(col, capColor, k);
      h += k * 0.2;
    }
    return [col[0], col[1], col[2], 255, h];
  };
}

function gas(params, ctx) {
  const {
    bands = [[200, 180, 150], [170, 140, 110]], bandCount = 6, warp = 0.3,
    turbulence = 0.4, contrast = 1, spot = null,
  } = params;
  const pick = (v) => {
    const f = ((v % 1) + 1) % 1 * bands.length;
    const i = Math.floor(f);
    const t = smooth(0, 1, f - i);
    return mixc(bands[i], bands[(i + 1) % bands.length], t);
  };
  return (p, lat, lon) => {
    const [x, y, z] = p;
    const w = ctx.fbm(x * 2, y * 5, z * 2, 5) * warp;
    const fine = ctx.fbm(x * 6, y * 40, z * 6, 4) * turbulence * 0.035;
    const v = (y + w * 0.1 + fine) * bandCount * 0.5;
    let col = pick(v + 0.5);
    const shade = 1 + ctx.fbm(x * 5, y * 18, z * 5, 3) * 0.12 * contrast;
    col = col.map((c) => c * shade);
    if (spot) {
      const sl = (spot.lat * Math.PI) / 180, so = (spot.lon * Math.PI) / 180;
      let dl = lon - so;
      if (dl > Math.PI) dl -= 2 * Math.PI;
      if (dl < -Math.PI) dl += 2 * Math.PI;
      const d = Math.hypot(dl / (spot.width * Math.PI), (lat - sl) / (spot.height * Math.PI));
      if (d < 1.3) {
        const swirl = ctx.noise(dl * 8, (lat - sl) * 8, d * 3) * 0.15;
        const k = 1 - smooth(0.6, 1.0, d + swirl);
        col = mixc(col, spot.color, k * 0.9);
      }
    }
    return [col[0], col[1], col[2], 255, 0.5];
  };
}

function sun(params, ctx) {
  return (p) => {
    const [x, y, z] = p;
    const g = ctx.fbm(x * 30, y * 30, z * 30, 3);
    const big = ctx.fbm(x * 3, y * 3, z * 3, 4);
    const t = clamp01(0.55 + 0.35 * g + 0.25 * big);
    let col = mixc([255, 120, 20], [255, 235, 160], t);
    const spot = ctx.fbm(x * 7 + 11, y * 7, z * 7, 3);
    if (spot > 0.62 && Math.abs(y) < 0.45) col = mixc(col, [110, 40, 8], smooth(0.62, 0.7, spot));
    return [col[0], col[1], col[2], 255, 0.5];
  };
}

function clouds(params, ctx) {
  return (p, lat) => {
    const [x, y, z] = p;
    // Domain-warped noise gives streaky, swirling weather systems.
    const wx = ctx.fbm(x * 1.5 + 5, y * 1.5, z * 1.5, 3);
    const wy = ctx.fbm(x * 1.5, y * 1.5 + 9, z * 1.5, 3);
    const n = ctx.fbm(x * 3 + wx * 0.9, y * 6 + wy * 0.9, z * 3 + wx * 0.9, 6);
    const n2 = ctx.fbm(x * 14, y * 14, z * 14, 4);
    // Fewer clouds in the subtropical desert belts (~25°).
    const latDeg = Math.abs(lat) * (180 / Math.PI);
    const belt = 1 - 0.35 * Math.exp(-((latDeg - 25) ** 2) / 120);
    const a = smooth(0.05, 0.55, (n + 0.35 * n2) * belt);
    return [255, 255, 255, a * a * 230, 0];
  };
}

const STYLES = { rocky, gas, sun, clouds };

// ------------------------------------------------------------- generator ---

function generate({ id, style, params = {}, width, height }) {
  const ctx = makeCtx(seedFromString(id + ':' + style));
  const fn = (STYLES[style] || rocky)(params, ctx);
  const color = new Uint8ClampedArray(width * height * 4);
  const bump = style === 'rocky' ? new Uint8ClampedArray(width * height * 4) : null;
  for (let j = 0; j < height; j++) {
    // Row 0 is the bottom of a DataTexture (v = 0, south pole).
    const lat = -Math.PI / 2 + ((j + 0.5) / height) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < width; i++) {
      const lon = -Math.PI + ((i + 0.5) / width) * Math.PI * 2;
      // Same convention as THREE.SphereGeometry: lon 0 on +X, lon +90° on -Z.
      const p = [cl * Math.cos(lon), sl, -cl * Math.sin(lon)];
      const [r, g, b, a, h] = fn(p, lat, lon);
      const k = (j * width + i) * 4;
      color[k] = r; color[k + 1] = g; color[k + 2] = b; color[k + 3] = a;
      if (bump) {
        const v = clamp01(h) * 255;
        bump[k] = v; bump[k + 1] = v; bump[k + 2] = v; bump[k + 3] = 255;
      }
    }
  }
  return { color, bump };
}

self.onmessage = (e) => {
  const job = e.data;
  const { color, bump } = generate(job);
  const transfer = [color.buffer];
  if (bump) transfer.push(bump.buffer);
  self.postMessage({ key: job.key, width: job.width, height: job.height, color: color.buffer, bump: bump?.buffer ?? null }, transfer);
};
