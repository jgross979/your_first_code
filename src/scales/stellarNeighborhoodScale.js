import * as THREE from 'three';
import { Body, Region } from '../scene/Body.js';
import { LOCAL_NEIGHBORHOOD_REGION, STARS } from '../data/stars.js';
import { equatorialToScene, lightYearsToScene, smoothstep } from '../scene/coords.js';

/**
 * Scale level: the nearest stars, at their real directions with compressed
 * distances. The Sun (from the solar-system scale) sits at the origin.
 */
export default {
  id: 'local-neighborhood',
  name: 'Solar Neighbourhood',

  build(env) {
    const group = new THREE.Group();
    const region = new Region(LOCAL_NEIGHBORHOOD_REGION);
    const stars = STARS.map((def) => {
      const b = new Body({ zoomOutLimit: 2500, ...def }, env);
      equatorialToScene(def.ra, def.dec, b.root.position).multiplyScalar(lightYearsToScene(def.ly));
      b.distanceLabel = `${def.ly} ly`;
      group.add(b.root);
      return b;
    });

    // Faint lines from the Sun to each star, to show how far away they are.
    const linePos = new Float32Array(stars.length * 6);
    stars.forEach((s, i) => linePos.set([0, 0, 0, ...s.root.position.toArray()], i * 6));
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineDashedMaterial({ color: 0x6688aa, transparent: true, opacity: 0, dashSize: 1500, gapSize: 1200, depthWrite: false });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    lines.computeLineDistances();
    group.add(lines);

    // A faint ecliptic-plane grid for orientation.
    const grid = new THREE.PolarGridHelper(120000, 12, 6, 128, 0x335577, 0x223344);
    grid.material.transparent = true;
    grid.material.depthWrite = false;
    group.add(grid);

    for (const s of stars) s.labelEl.dataset.sub = s.distanceLabel;

    return {
      group,
      focusables: [region, ...stars],
      update() {},
      afterUpdate({ cameraPos, focus }) {
        const dO = cameraPos.length();
        const fade = smoothstep(4000, 15000, dO);
        lineMat.opacity = 0.35 * fade;
        lines.visible = fade > 0.01;
        grid.material.opacity = 0.18 * fade;
        grid.visible = fade > 0.01;
        for (const s of stars) {
          const d = cameraPos.distanceTo(s.worldPosition);
          s.setLabelVisible((fade > 0.3 || focus === s) && d > s.radius * 12);
          s.farPoint.scale.setScalar(0.015 + 0.03 * fade);
        }
      },
    };
  },
};
