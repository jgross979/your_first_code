import { SCALES } from '../scales/index.js';

/** Builds every registered scale level and links their focusables together. */
export class Universe {
  constructor(scene, env) {
    this.levels = SCALES.map((scale) => ({ scale, ...scale.build(env) }));
    this.byId = new Map();
    for (const level of this.levels) {
      scene.add(level.group);
      for (const f of level.focusables) {
        f.scale = level.scale;
        this.byId.set(f.id, f);
      }
    }
    for (const f of this.byId.values()) {
      const pid = f.def.focusParent ?? f.def.parent;
      f.focusParent = pid ? this.byId.get(pid) ?? null : null;
      f.focusParent?.focusChildren.push(f);
      if (f.def.zoomInTarget) f.zoomInTarget = this.byId.get(f.def.zoomInTarget);
    }
    this.all = [...this.byId.values()];
    this.bodies = this.all.filter((f) => !f.isRegion);
    this.root = this.all.find((f) => !f.focusParent);
  }

  get(id) {
    return this.byId.get(id);
  }

  update(frame) {
    for (const l of this.levels) l.update(frame);
  }

  syncPositions() {
    for (const f of this.all) f.updateWorldPosition();
  }

  afterUpdate(frame) {
    for (const l of this.levels) l.afterUpdate?.(frame);
    // Labels are HTML, so they don't get hidden by planets in front of them.
    // Check against the focused body and its parent, which are the big
    // spheres near the camera.
    const blockers = [frame.focus, frame.focus?.parent].filter((b) => b && b.radius > 0);
    if (!blockers.length) return;
    for (const b of this.bodies) {
      if (!b.labelVisible && !b.marker?.visible) continue;
      const hidden = blockers.some((o) => b.isOccludedBy(o, frame.cameraPos));
      if (hidden) {
        b.setLabelVisible(false);
        if (b.marker) b.marker.visible = false;
      }
    }
  }

  /** Path from the outermost region down to `f`, for breadcrumbs. */
  pathTo(f) {
    const path = [];
    for (let n = f; n; n = n.focusParent) path.unshift(n);
    return path;
  }
}
