const RATES = [
  { label: 'Pause', rate: 0 },
  { label: 'Real time', rate: 1 },
  { label: '1 min/s', rate: 60 },
  { label: '1 hr/s', rate: 3600 },
  { label: '1 day/s', rate: 86400 },
  { label: '1 wk/s', rate: 604800 },
  { label: '1 mo/s', rate: 2629800 },
];

const fmtKm = (km) => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 1e6) return `${Math.round(km).toLocaleString()} km`;
  if (km < 1e9) return `${(km / 1e6).toFixed(km < 1e7 ? 2 : 1)} million km`;
  return `${(km / 1e9).toFixed(2)} billion km`;
};

/** Breadcrumb, altitude readout, time controls and the body navigator. */
export class Hud {
  constructor(root, { clock, onNavigate }) {
    this.clock = clock;
    this.onNavigate = onNavigate;
    this.crumbs = root.querySelector('#breadcrumb');
    this.readout = root.querySelector('#readout');
    this.dateEl = root.querySelector('#sim-date');
    this.rateEl = root.querySelector('#rates');
    this.nav = root.querySelector('#navigator');
    this.navList = root.querySelector('#nav-list');
    this.lastCrumbKey = '';

    RATES.forEach((r) => {
      const b = document.createElement('button');
      b.textContent = r.label;
      b.dataset.rate = r.rate;
      b.addEventListener('click', () => this.setRate(r.rate));
      this.rateEl.appendChild(b);
    });
    root.querySelector('#now-btn').addEventListener('click', () => clock.resetToNow());
    root.querySelector('#nav-toggle').addEventListener('click', () => this.nav.classList.toggle('open'));
    this.crumbs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav]');
      if (b) this.onNavigate(b.dataset.nav);
    });
    this.navList.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav]');
      if (!b) return;
      this.onNavigate(b.dataset.nav);
      if (window.innerWidth < 800) this.nav.classList.remove('open');
    });
    for (const el of [this.nav, root.querySelector('#timebar'), this.crumbs])
      for (const ev of ['pointerdown', 'wheel']) el.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
    this.setRate(clock.rate);
  }

  setRate(rate) {
    this.clock.rate = rate;
    for (const b of this.rateEl.children) b.classList.toggle('on', Number(b.dataset.rate) === rate);
  }

  cycleRate(dir) {
    const i = RATES.findIndex((r) => r.rate === this.clock.rate);
    const n = Math.min(RATES.length - 1, Math.max(0, (i < 0 ? 3 : i) + dir));
    this.setRate(RATES[n].rate);
  }

  buildNavigator(universe) {
    const item = (f, depth) => {
      const kids = f.focusChildren.filter((c) => !c.isRegion || c.focusChildren.length);
      // Show physical children (moons) under planets, regions' members under regions.
      const ordered = [...kids].sort((a, b) => (a.orbitRadius ?? 0) - (b.orbitRadius ?? 0) || (a.def.ly ?? 0) - (b.def.ly ?? 0));
      const inner = ordered.map((c) => item(c, depth + 1)).join('');
      return `<li class="d${depth} t-${f.type}"><button data-nav="${f.id}">${f.name}</button>${inner ? `<ul>${inner}</ul>` : ''}</li>`;
    };
    this.navList.innerHTML = `<ul>${item(universe.root, 0)}</ul>`;
  }

  update({ path, focus, rig, mapActive }) {
    const key = path.map((p) => p.id).join('/') + (mapActive ? '/map' : '');
    if (key !== this.lastCrumbKey) {
      this.lastCrumbKey = key;
      this.crumbs.innerHTML =
        path.map((p, i) => `<button data-nav="${p.id}" class="${i === path.length - 1 && !mapActive ? 'cur' : ''}">${p.name}</button>`).join('<span>›</span>') +
        (mapActive ? '<span>›</span><button class="cur">Surface map</button>' : '');
      for (const b of this.navList.querySelectorAll('button')) b.classList.toggle('cur', b.dataset.nav === focus.id);
    }
    const d = this.clock.date();
    this.dateEl.textContent = d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    let text = '';
    if (rig.flying) text = 'Travelling…';
    else if (focus.kmPerUnit) text = `Altitude above ${focus.name}: ${fmtKm(rig.altitude * focus.kmPerUnit)}`;
    else text = focus.id === 'local-neighborhood' ? 'Distances compressed · directions are real' : 'Distances compressed so everything fits';
    if (this.readout.textContent !== text) this.readout.textContent = text;
  }
}
