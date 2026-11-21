import * as THREE from 'three';
import { equatorialToScene } from './coords.js';

/**
 * Distant background stars on a huge sphere that follows the camera, so they
 * behave as if infinitely far away. Denser along the Milky Way's plane.
 */
export function createStarfield(count = 9000) {
  const galacticPole = equatorialToScene(12.857, 27.128); // RA 12h51m, Dec +27.1°
  let s = 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const R = 5e6;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  const c = new THREE.Color();
  const palette = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffd2a1', '#ffcc6f'];
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1;
    const t = rnd() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    v.set(r * Math.cos(t), u, r * Math.sin(t));
    if (i % 5 < 2) {
      // Squash toward the galactic plane.
      const h = v.dot(galacticPole);
      v.addScaledVector(galacticPole, -h * 0.88).normalize();
    }
    v.multiplyScalar(R);
    pos.set([v.x, v.y, v.z], i * 3);
    c.set(palette[Math.floor(rnd() * palette.length)]);
    const b = 0.25 + Math.pow(rnd(), 4) * 0.9;
    col.set([c.r * b, c.g * b, c.b * b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = -10;
  return pts;
}
