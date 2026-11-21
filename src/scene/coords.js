import * as THREE from 'three';

const DEG = Math.PI / 180;
const OBLIQUITY = 23.4393 * DEG;

/**
 * Scene axes: the ecliptic is the XZ plane, +Y is ecliptic north and +X points
 * to the vernal equinox. Ecliptic longitude λ is at (cos λ, 0, −sin λ).
 */
export function eclipticToScene(x, y, z, target = new THREE.Vector3()) {
  return target.set(x, z, -y);
}

/** Right ascension (hours) / declination (degrees) → unit vector in scene space. */
export function equatorialToScene(raHours, decDeg, target = new THREE.Vector3()) {
  const a = raHours * 15 * DEG;
  const d = decDeg * DEG;
  const xe = Math.cos(d) * Math.cos(a);
  const ye = Math.cos(d) * Math.sin(a);
  const ze = Math.sin(d);
  const yk = Math.cos(OBLIQUITY) * ye + Math.sin(OBLIQUITY) * ze;
  const zk = -Math.sin(OBLIQUITY) * ye + Math.cos(OBLIQUITY) * ze;
  return eclipticToScene(xe, yk, zk, target);
}

/** Compressed interstellar distance: light-years → scene units. */
export function lightYearsToScene(ly) {
  return 6000 + 4000 * ly;
}

export const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
