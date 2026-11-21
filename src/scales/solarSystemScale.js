import * as THREE from 'three';
import { Body, Region } from '../scene/Body.js';
import { SOLAR_SYSTEM_REGION, solarSystemBodies } from '../data/solarSystem.js';
import { smoothstep } from '../scene/coords.js';

/**
 * Scale level: the Sun, planets, moons, and the asteroid & Kuiper belts.
 * Everything inside is positioned in compressed "scene units" (Earth radius = 1).
 */
export default {
  id: 'solar-system',
  name: 'Solar System',

  build(env) {
    const group = new THREE.Group();
    const region = new Region(SOLAR_SYSTEM_REGION);
    const bodies = new Map();
    for (const def of solarSystemBodies()) {
      const b = new Body(def, env);
      bodies.set(def.id, b);
      if (def.parent) b.attachTo(bodies.get(def.parent));
      else group.add(b.root);
    }
    const sun = bodies.get('sun');
    const belts = [
      makeBelt(300, 420, 4000, 6, 0x9a8f80, 0.45, 1),
      makeBelt(1750, 2300, 6000, 40, 0x8090a8, 0.35, 2),
    ];
    belts.forEach((b) => group.add(b));

    const list = [...bodies.values()];
    const planets = list.filter((b) => b.parent === sun);
    const moons = list.filter((b) => b.def.type === 'moon');
    const tmp = new THREE.Vector3();

    return {
      group,
      focusables: [region, ...list],

      update(frame) {
        for (const b of list) b.update(frame.days);
        belts[0].rotation.y = frame.days * 0.0006;
        belts[1].rotation.y = frame.days * 0.00005;
      },

      /** Runs after world matrices are current: visibility and fades. */
      afterUpdate(frame) {
        const { cameraPos, focus, pxPerRadian } = frame;
        const dO = cameraPos.length();
        const systemFade = 1 - smoothstep(3500, 8000, dO);
        const sunPos = sun.worldPosition;

        for (const b of list) b.syncUniforms(sunPos);
        belts.forEach((b) => {
          b.material.opacity = b.userData.baseOpacity * systemFade;
          b.visible = systemFade > 0.01;
        });

        for (const p of planets) {
          const d = cameraPos.distanceTo(p.worldPosition);
          const pxR = (p.radius / d) * pxPerRadian;
          const closeFocus = focus === p && d < p.radius * 12;
          p.orbitMaterial.opacity = 0.35 * systemFade * (focus === p ? smoothstep(p.radius * 5, p.radius * 40, d) : 1);
          p.orbitLine.visible = p.orbitMaterial.opacity > 0.01;
          p.setLabelVisible(systemFade > 0.3 && !closeFocus);
          p.marker.visible = pxR < 2.5 && systemFade > 0.05;
          p.marker.material.opacity = systemFade;
        }

        for (const m of moons) {
          const parent = m.parent;
          const dParent = cameraPos.distanceTo(parent.worldPosition);
          const sepPx = (m.orbitRadius / dParent) * pxPerRadian;
          const near = 1 - smoothstep(parent.zoomOutLimit * 1.2, parent.zoomOutLimit * 2.5, dParent);
          const d = cameraPos.distanceTo(m.worldPosition);
          const pxR = (m.radius / d) * pxPerRadian;
          const closeFocus = focus === m && d < m.radius * 12;
          m.orbitMaterial.opacity = 0.28 * near * smoothstep(15, 60, sepPx);
          m.orbitLine.visible = m.orbitMaterial.opacity > 0.01;
          m.setLabelVisible(near > 0.5 && sepPx > 30 && !closeFocus && (focus !== parent || d < parent.zoomOutLimit * 2));
          m.marker.visible = near > 0.05 && pxR < 2.5 && sepPx > 6;
          m.marker.material.opacity = near;
        }

        // The Sun: a disc up close, a bright point from interstellar distances.
        const dSun = cameraPos.distanceTo(sunPos);
        sun.setLabelVisible(dSun > sun.zoomOutLimit * 1.5);
        sun.farPoint.material.opacity = smoothstep(1500, 6000, dO);
        sun.farPoint.visible = sun.farPoint.material.opacity > 0.01;
        sun.light.intensity = 3.2;
        tmp.copy(sunPos);
      },
    };
  },
};

function makeBelt(inner, outer, count, thickness, color, opacity, seed) {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = inner + (outer - inner) * Math.sqrt(rnd());
    const t = rnd() * Math.PI * 2;
    pos[i * 3] = Math.cos(t) * r;
    pos[i * 3 + 1] = (rnd() - 0.5) * thickness * (0.3 + rnd());
    pos[i * 3 + 2] = Math.sin(t) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size: 1.3, sizeAttenuation: false, transparent: true, opacity, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.userData.baseOpacity = opacity;
  return pts;
}
