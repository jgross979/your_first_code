/**
 * Tiled surface maps shown when you zoom close enough to a body that has a
 * `surfaceMap` id. Each map lists Leaflet tile layers; the first base layer is
 * the default.
 *
 * To give another body a map, add an entry here and set `surfaceMap` on the
 * body. (Non-Earth maps typically use an equirectangular CRS — set `crs`.)
 */
export const SURFACE_MAPS = {
  earth: {
    // Leaflet zoom used when dropping from the globe into the map, and the
    // zoom at which scrolling further out returns to the globe.
    enterZoom: 5.5,
    exitZoom: 4.75,
    maxZoom: 19,
    baseLayers: [
      {
        name: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
          maxNativeZoom: 18,
          attribution: 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        },
        overlays: [
          {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            options: { maxNativeZoom: 18 },
          },
        ],
      },
      {
        name: 'Streets',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
          maxNativeZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      },
    ],
  },
};
