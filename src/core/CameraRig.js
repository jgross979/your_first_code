import * as THREE from 'three';

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Spherical();

/**
 * Orbit camera that always circles a "focus" (a body or region).
 *
 * - Zoom is by altitude above the focus surface and is exponential, so you can
 *   go from 100 km up to light-years away with the same wheel.
 * - Close to a body the camera co-rotates with its surface, so the ground
 *   doesn't slide away underneath you.
 * - Changing focus without moving (`setFocus`) smoothly swings the view to the
 *   new centre; `flyTo` animates the camera over.
 */
export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.focus = null;
    this.offset = new THREE.Vector3(0, 0, 10);
    this.altitude = 10;
    this.targetAltitude = 10;
    this.lookOffset = new THREE.Vector3();
    this.lookPoint = new THREE.Vector3();
    this.prevSpin = new THREE.Quaternion();
    this.velocity = { x: 0, y: 0 };
    this.fly = null;
    this.lastZoomIn = 0;
    this.lastZoomOut = 0;
    this.pointers = new Map();
    this.dragDistance = 0;
    this.#bindPointer();
  }

  get flying() {
    return !!this.fly;
  }
  get distance() {
    return this.offset.length();
  }
  get zoomingIn() {
    return performance.now() - this.lastZoomIn < 350;
  }
  get zoomingOut() {
    return performance.now() - this.lastZoomOut < 350;
  }

  // --------------------------------------------------------------- focus --

  /** Change what we orbit without moving the camera. */
  setFocus(f) {
    if (this.focus === f) return;
    const cam = this.camera.position;
    this.offset.copy(cam).sub(f.worldPosition);
    this.lookOffset.copy(this.lookPoint).sub(f.worldPosition);
    this.focus = f;
    this.altitude = this.targetAltitude = Math.max(this.offset.length() - f.radius, 1e-6);
    f.getSpinQuaternion(this.prevSpin);
    this.onFocusChange?.(f);
  }

  /** Place the camera at a given offset from a focus (no animation). */
  jumpTo(f, offset) {
    this.focus = f;
    this.offset.copy(offset);
    this.lookOffset.set(0, 0, 0);
    this.altitude = this.targetAltitude = offset.length() - f.radius;
    f.getSpinQuaternion(this.prevSpin);
    this.onFocusChange?.(f);
  }

  flyTo(f, distance = f.viewDistance, duration = 1.8) {
    const from = this.camera.position.clone();
    const start = from.distanceTo(f.worldPosition);
    const dir = from.clone().sub(f.worldPosition).normalize();
    // Approaching a body from directly behind it (as seen from the Sun) puts
    // you on the night side. Nudge toward the lit side a little.
    if (f.radius > 0 && f.worldPosition.lengthSq() > 1) {
      const toSun = f.worldPosition.clone().negate().normalize();
      if (dir.dot(toSun) < -0.2) dir.lerp(toSun, 0.6).normalize();
    }
    // Regions are best seen from above their plane rather than edge-on.
    if (f.def.viewElevation != null) {
      const h = new THREE.Vector3(dir.x, 0, dir.z);
      if (h.lengthSq() < 1e-8) h.set(1, 0, 0);
      h.normalize();
      const el = THREE.MathUtils.degToRad(f.def.viewElevation);
      dir.copy(h.multiplyScalar(Math.cos(el))).add(new THREE.Vector3(0, Math.sin(el), 0));
    }
    this.fly = {
      target: f,
      from,
      fromLook: this.lookPoint.clone(),
      startDist: Math.max(start, distance * 1.001),
      endDist: distance,
      dir,
      t: 0,
      duration: Math.min(duration, 0.6 + Math.abs(Math.log(start / distance)) * 0.25),
    };
    f.requestDetail?.(100);
    this.onFlyStart?.(f);
  }

  // ---------------------------------------------------------------- zoom --

  zoomBy(factor) {
    if (!this.focus || this.fly) return;
    const f = this.focus;
    const minAlt = Math.max(f.minDistance - f.radius, 1e-6);
    const maxAlt = f.maxDistance - f.radius;
    this.targetAltitude = THREE.MathUtils.clamp(this.targetAltitude * factor, minAlt, maxAlt);
    if (factor < 1) this.lastZoomIn = performance.now();
    else this.lastZoomOut = performance.now();
  }

  // -------------------------------------------------------------- update --

  update(dt, viewportH) {
    const cam = this.camera;
    if (this.fly) {
      const fl = this.fly;
      fl.t = Math.min(1, fl.t + dt / fl.duration);
      const e = easeInOut(fl.t);
      const tp = fl.target.worldPosition;
      const d = Math.exp(THREE.MathUtils.lerp(Math.log(fl.startDist), Math.log(fl.endDist), e));
      // Blend from "where we started" to "on the approach line" for the first part.
      const onLine = tmpV.copy(tp).addScaledVector(fl.dir, d);
      cam.position.copy(fl.from).lerp(onLine, Math.min(1, e * 3));
      this.lookPoint.copy(fl.fromLook).lerp(tp, easeInOut(Math.min(1, fl.t * 1.6)));
      cam.lookAt(this.lookPoint);
      if (fl.t >= 1) {
        this.fly = null;
        this.focus = fl.target;
        this.offset.copy(cam.position).sub(tp);
        this.lookOffset.set(0, 0, 0);
        this.altitude = this.targetAltitude = Math.max(this.offset.length() - fl.target.radius, 1e-6);
        fl.target.getSpinQuaternion(this.prevSpin);
        this.velocity.x = this.velocity.y = 0;
        this.onFocusChange?.(fl.target);
        this.onFlyEnd?.(fl.target);
      }
      this.#updateClip();
      return;
    }

    const f = this.focus;
    if (!f) return;
    const R = f.radius;

    // Co-rotate with the surface when close.
    f.getSpinQuaternion(tmpQ);
    if (R > 0 && this.altitude < R * 3) {
      const delta = tmpQ.clone().multiply(this.prevSpin.clone().invert());
      this.offset.applyQuaternion(delta);
    }
    this.prevSpin.copy(tmpQ);

    // Inertial orbiting.
    if (!this.pointers.size) {
      const decay = Math.exp(-dt * 5);
      this.velocity.x *= decay;
      this.velocity.y *= decay;
    }
    if (!this.pointers.size && Math.abs(this.velocity.x) + Math.abs(this.velocity.y) > 1e-3) {
      this.#rotate(this.velocity.x * dt * 60, this.velocity.y * dt * 60, viewportH);
    }

    // Exponential (log-space) easing of altitude.
    const k = 1 - Math.exp(-dt * 8);
    this.altitude = Math.exp(THREE.MathUtils.lerp(Math.log(this.altitude), Math.log(this.targetAltitude), k));
    this.offset.setLength(R + this.altitude);

    this.lookOffset.multiplyScalar(Math.exp(-dt * 4));
    cam.position.copy(f.worldPosition).add(this.offset);
    this.lookPoint.copy(f.worldPosition).add(this.lookOffset);
    cam.lookAt(this.lookPoint);
    this.#updateClip();
  }

  #updateClip() {
    const alt = this.fly ? this.camera.position.distanceTo(this.fly.target.worldPosition) - this.fly.target.radius : this.altitude;
    const near = THREE.MathUtils.clamp(alt * 0.05, 1e-5, 5);
    if (Math.abs(near - this.camera.near) / this.camera.near > 0.05) {
      this.camera.near = near;
      this.camera.updateProjectionMatrix();
    }
  }

  /** Rotation in radians per pixel, so dragging feels like grabbing the surface. */
  #radPerPixel(viewportH) {
    const f = this.focus;
    if (!f || f.radius === 0) return 0.004;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return THREE.MathUtils.clamp((this.altitude * 2 * tanHalf) / (viewportH * f.radius), 1e-7, 0.006);
  }

  #rotate(dx, dy, viewportH) {
    const k = this.#radPerPixel(viewportH);
    tmpS.setFromVector3(this.offset);
    tmpS.theta -= dx * k;
    tmpS.phi = THREE.MathUtils.clamp(tmpS.phi - dy * k, 0.02, Math.PI - 0.02);
    this.offset.setFromSpherical(tmpS);
  }

  // ------------------------------------------------------------- pointer --

  #bindPointer() {
    const el = this.dom;
    let pinch = 0;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragDistance = 0;
      this.velocity.x = this.velocity.y = 0;
      if (this.pointers.size === 2) pinch = this.#pinchDist();
    });
    el.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (this.pointers.size === 1 && !this.fly) {
        this.dragDistance += Math.abs(dx) + Math.abs(dy);
        this.#rotate(dx, dy, el.clientHeight);
        this.velocity.x = dx;
        this.velocity.y = dy;
        this.lastMove = performance.now();
      } else if (this.pointers.size === 2) {
        const d = this.#pinchDist();
        if (pinch > 0 && d > 0) this.onPinch?.(pinch / d, this.#pinchCenter());
        pinch = d;
        this.dragDistance += 10;
      }
    });
    const up = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      pinch = 0;
      if (performance.now() - (this.lastMove || 0) > 80 || this.pointers.size) this.velocity.x = this.velocity.y = 0;
      if (this.pointers.size === 0 && this.dragDistance < 6) this.onTap?.(e.clientX, e.clientY);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  #pinchDist() {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  #pinchCenter() {
    const [a, b] = [...this.pointers.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}
