# Cosmic Zoom

An interactive, zoomable universe in the browser. Start at a spinning Earth, scroll in until
the globe turns into a real satellite/street map, or scroll out to see the whole solar system —
every planet, its major moons, the asteroid and Kuiper belts — and keep going until the Sun is
just one star among its neighbours. Zoom into any planet, moon or star and an info panel
teaches you about it.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
```

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) publishes `dist/` to
GitHub Pages on every push to `master` (or `main`) (enable Pages → "GitHub Actions" in the repo settings).

## Controls

| Action | Mouse / keyboard | Touch |
| --- | --- | --- |
| Spin / orbit | drag | one-finger drag |
| Zoom | scroll wheel, `+` / `-` | pinch |
| Zoom *into* something | scroll with the pointer on it | tap it |
| Fly to anything | click a name, or ☰ Explore | tap |
| Zoom out one level | `Esc`, or the breadcrumb at the top | breadcrumb |
| Time speed | bottom bar, `[` / `]`, `Space` to pause | bottom bar |

## What's real

* **Positions and lighting.** The clock starts at the current date. Planets are placed by
  their real mean orbital longitudes, Earth's rotation uses sidereal time, and the Sun lights
  everything from the right direction — so day and night on the globe match reality.
* **Sizes** of planets and moons relative to each other are true (the Sun is shrunk).
* **Distances are compressed** (otherwise everything would be an invisible dot). Orbits use
  `40 + 150·AU^0.7` scene units; moons are spaced by the square root of their real distance;
  stars use `6000 + 4000·light-years`. Star *directions* are real (RA/Dec).
* **Altitude readouts and facts** in the panels are real values.

Earth imagery is NASA Blue Marble / Black Marble (public domain, via the MIT-licensed
`three-globe` examples). Other bodies are procedurally generated in a web worker.
Map tiles: Esri World Imagery and OpenStreetMap.

## How it's built (and how to extend it)

```
src/
  data/            ← plain data: bodies, facts, info text, stars, map tile sources
    solarSystem.js   Sun, planets, moons + all the info-panel content
    stars.js         nearby stars + the "Solar Neighbourhood" region
    mapLayers.js     tiled surface maps (Leaflet)
  scales/          ← one module per zoom scale, registered in scales/index.js
    solarSystemScale.js
    stellarNeighborhoodScale.js
  scene/           ← Three.js building blocks
    Body.js          a focusable body (mesh, orbit, label, marker) / Region
    Universe.js      builds all scales and links them into one hierarchy
    TextureFactory.js + workers/textureWorker.js   procedural textures
    earthMaterials.js  day/night Earth shader + atmosphere
  core/
    App.js           render loop, picking, scale transitions, map hand-off
    CameraRig.js     focus-based orbit camera with exponential zoom & fly-to
  map/SurfaceMap.js  Leaflet map that takes over close to the surface
  ui/              ← breadcrumb, time bar, navigator, info panel
```

### The zoom hierarchy

Everything the camera can centre on is a **focusable**: a body (star, planet, moon) or an
abstract **region** (`solar-system`, `local-neighborhood`). Each one has a `focusParent`.
Zooming out past a focusable's `zoomOutLimit` hands the camera to its parent; regions have a
`zoomInTarget` that takes over when you zoom all the way in. Scrolling with the pointer on a
body flies to it.

```
Solar Neighbourhood ─┬─ Solar System ─┬─ Sun
                     │                ├─ Earth ─ Moon        (→ surface map)
                     │                ├─ Jupiter ─ Io, Europa, …
                     │                └─ …
                     └─ Proxima Centauri, Sirius, Vega, …
```

### Recipes

* **Add a moon / fact / section** – edit `src/data/solarSystem.js`. The info panel renders
  `info.subtitle`, `summary`, `facts`, `sections` and `funFacts` automatically.
* **Use a real texture for a body** – replace its `appearance` with a new style, or load an
  image the way `Body.#loadEarth` does.
* **Add a new procedural look** – add a function to `STYLES` in `workers/textureWorker.js`.
* **Give another body a surface map** – add an entry to `src/data/mapLayers.js` and set
  `surfaceMap: '<id>'` on the body.
* **Add a bigger scale (e.g. the Milky Way)** – create `src/scales/milkyWayScale.js` returning
  `{ group, focusables, update, afterUpdate }` with a `milky-way` region, set
  `focusParent: 'milky-way'` and a finite `zoomOutLimit` on the `local-neighborhood` region,
  and register it in `src/scales/index.js`. For very large scales, consider placing the scale's
  content relative to the camera (floating origin) to keep float precision.
