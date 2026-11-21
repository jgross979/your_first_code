const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

/** Simulation clock. Starts at the real current time; `rate` is sim-seconds per real second. */
export class SimClock {
  constructor(rate = 3600) {
    this.time = Date.now();
    this.rate = rate;
  }
  tick(dtSeconds) {
    this.time += dtSeconds * 1000 * this.rate;
  }
  resetToNow() {
    this.time = Date.now();
  }
  get daysSinceJ2000() {
    return (this.time - J2000_MS) / 86400000;
  }
  date() {
    return new Date(this.time);
  }
}
