const TYPE_LABEL = { star: 'Star', planet: 'Planet', dwarf: 'Dwarf planet', moon: 'Moon', region: 'Region' };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * Slide-in panel that teaches about whatever you are focused on.
 * Content comes from each body's `info` block (see src/data).
 */
export class InfoPanel {
  constructor(el, { onNavigate }) {
    this.el = el;
    this.onNavigate = onNavigate;
    this.current = null;
    this.dismissed = null;
    this.shown = false;
    el.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav) this.onNavigate?.(nav.dataset.nav);
      if (e.target.closest('.panel-close')) {
        this.dismissed = this.current;
        this.hide();
      }
    });
    for (const ev of ['pointerdown', 'wheel']) el.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
  }

  /** Called every frame with the focus that should be shown (or null). */
  update(focusable) {
    if (focusable && focusable === this.dismissed) focusable = null;
    if (!focusable) return this.hide();
    if (focusable !== this.current) this.#render(focusable);
    this.show();
  }

  reopen(f) {
    this.dismissed = null;
    this.#render(f);
    this.show();
  }

  show() {
    if (this.shown) return;
    this.shown = true;
    this.el.classList.add('open');
  }

  hide() {
    if (!this.shown) return;
    this.shown = false;
    this.el.classList.remove('open');
  }

  #render(f) {
    this.current = f;
    const info = f.info || {};
    const parent = f.focusParent;
    const kids = f.focusChildren.filter((c) => c.info);
    const facts = (info.facts || [])
      .map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join('');
    const sections = (info.sections || [])
      .map((s) => `<section><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></section>`)
      .join('');
    const fun = (info.funFacts || []).map((t) => `<li>${esc(t)}</li>`).join('');
    const kidLabel = f.id === 'solar-system' ? 'Planets & dwarf planets' : f.type === 'region' ? 'Explore' : 'Moons';
    const swatch = f.def.color ? `<span class="swatch" style="background:${esc(f.def.color)}"></span>` : '';
    this.el.innerHTML = `
      <button class="panel-close" aria-label="Close">×</button>
      <div class="panel-scroll">
        <div class="panel-type">${swatch}${esc(TYPE_LABEL[f.type] || f.type)}${parent ? ` · <button class="link" data-nav="${esc(parent.id)}">${esc(parent.name)}</button>` : ''}</div>
        <h2>${esc(f.name)}</h2>
        ${info.subtitle ? `<p class="subtitle">${esc(info.subtitle)}</p>` : ''}
        ${info.summary ? `<p class="summary">${esc(info.summary)}</p>` : ''}
        ${facts ? `<dl class="facts">${facts}</dl>` : ''}
        ${sections}
        ${fun ? `<section class="fun"><h3>Did you know?</h3><ul>${fun}</ul></section>` : ''}
        ${kids.length ? `<section><h3>${kidLabel}</h3><div class="chips">${kids.map((c) => `<button class="chip" data-nav="${esc(c.id)}">${esc(c.name)}</button>`).join('')}</div></section>` : ''}
      </div>`;
    this.el.querySelector('.panel-scroll').scrollTop = 0;
  }
}
