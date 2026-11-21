/**
 * Nearby stars, placed by their real sky position (RA/Dec) and distance.
 * Add more entries to fill in the neighbourhood.
 */

export const LOCAL_NEIGHBORHOOD_REGION = {
  id: 'local-neighborhood',
  name: 'Solar Neighbourhood',
  type: 'region',
  // focusParent: 'milky-way',   <- set this when a galaxy scale is added
  minDistance: 6000,
  zoomInTarget: 'solar-system',
  zoomOutLimit: Infinity,
  viewDistance: 90000,
  viewElevation: 20,
  maxDistance: 220000,
  infoRange: Infinity,
  info: {
    subtitle: 'Our stellar neighbours within ~25 light-years',
    summary:
      'Zoomed out this far, the whole Solar System shrinks to a single point of light — the Sun. ' +
      'The nearest other stars are light-years away: so far that their light, travelling 300,000 km every second, ' +
      'takes years to reach us.',
    facts: [
      ['Nearest star', 'Proxima Centauri, 4.24 light-years'],
      ['1 light-year', '≈ 9.46 trillion km (63,000 AU)'],
      ['Stars within 20 ly', '≈ 130 (most are faint red dwarfs)'],
    ],
    sections: [
      {
        title: 'Mostly red dwarfs',
        text:
          'Most stars near us are small, cool red dwarfs — too faint to see without a telescope. ' +
          'Bright stars like Sirius and Vega are rarer, but easy to spot.',
      },
      {
        title: 'About this map',
        text:
          'Star directions are real, but distances are compressed so the Solar System and its neighbours fit on screen ' +
          'together. Zoom into a star to learn about it.',
      },
    ],
    funFacts: ['If the Sun were a grain of sand, Proxima Centauri would be another grain about 6 km away.'],
  },
};

const s = (o) => ({ type: 'star', parent: null, focusParent: 'local-neighborhood', ...o });

export const STARS = [
  s({
    id: 'proxima', name: 'Proxima Centauri', labelBelow: true, ra: 14.495, dec: -62.68, ly: 4.246, solarRadii: 0.154, color: '#ff8a5c',
    info: {
      subtitle: 'The closest star to the Sun (red dwarf, M5.5V)',
      summary: 'A small, cool red dwarf orbiting the bright pair Alpha Centauri A and B. Too faint to see with the naked eye.',
      facts: [['Distance', '4.24 ly'], ['Mass', '0.12 Suns'], ['Temperature', '≈ 2,700 °C'], ['Planets', 'At least 2, incl. Proxima b in the habitable zone']],
      sections: [{ title: 'Flare star', text: 'Proxima often erupts in powerful flares, which may strip the atmospheres of its planets.' }],
    },
  }),
  s({
    id: 'alpha-centauri', name: 'Alpha Centauri A & B', ra: 14.660, dec: -60.835, ly: 4.37, solarRadii: 1.22, color: '#fff4dd',
    info: {
      subtitle: 'A Sun-like double star (G2V + K1V)',
      summary: 'Two stars, one a near-twin of the Sun, orbiting each other every 80 years. Together they are the third-brightest star in our sky.',
      facts: [['Distance', '4.37 ly'], ['Visible from', 'Southern hemisphere'], ['Constellation', 'Centaurus']],
      sections: [{ title: 'Breakthrough Starshot', text: 'A proposed project to send tiny light-sail probes here at 20% of the speed of light — a 20-year trip.' }],
    },
  }),
  s({
    id: 'barnards-star', name: 'Barnard\'s Star', ra: 17.963, dec: 4.69, ly: 5.96, solarRadii: 0.196, color: '#ff8050',
    info: {
      subtitle: 'The fastest-moving star in our sky (red dwarf, M4V)',
      summary: 'Barnard\'s Star moves across the sky by half a Moon-width every 180 years — faster than any other star.',
      facts: [['Distance', '5.96 ly'], ['Age', '≈ 10 billion years'], ['Constellation', 'Ophiuchus']],
    },
  }),
  s({
    id: 'wolf-359', name: 'Wolf 359', ra: 10.941, dec: 7.01, ly: 7.86, solarRadii: 0.16, color: '#ff7048',
    info: { subtitle: 'A dim red dwarf (M6V)', summary: 'One of the faintest and lowest-mass stars known; its light is mostly infrared.', facts: [['Distance', '7.86 ly'], ['Constellation', 'Leo']] },
  }),
  s({
    id: 'lalande-21185', name: 'Lalande 21185', ra: 11.056, dec: 35.97, ly: 8.31, solarRadii: 0.39, color: '#ff9a66',
    info: { subtitle: 'A red dwarf with planets (M2V)', summary: 'The brightest red dwarf in the northern sky, with at least two known planets.', facts: [['Distance', '8.31 ly'], ['Constellation', 'Ursa Major']] },
  }),
  s({
    id: 'sirius', name: 'Sirius', ra: 6.752, dec: -16.716, ly: 8.6, solarRadii: 1.71, color: '#cfe0ff',
    info: {
      subtitle: 'The brightest star in the night sky (A1V)',
      summary: 'Sirius, the "Dog Star", is about 25 times more luminous than the Sun. It has a tiny companion, Sirius B — a white dwarf the size of Earth.',
      facts: [['Distance', '8.6 ly'], ['Mass', '2.1 Suns'], ['Temperature', '≈ 9,700 °C'], ['Constellation', 'Canis Major']],
      sections: [{ title: 'Ancient calendar', text: 'Ancient Egyptians timed their calendar by the first dawn appearance of Sirius, which came just before the Nile flooded.' }],
    },
  }),
  s({
    id: 'epsilon-eridani', name: 'Epsilon Eridani', ra: 3.549, dec: -9.458, ly: 10.5, solarRadii: 0.735, color: '#ffc78a',
    info: { subtitle: 'A young star with a dusty disc (K2V)', summary: 'Younger than the Sun, with debris belts like our asteroid and Kuiper belts, and at least one giant planet.', facts: [['Distance', '10.5 ly'], ['Age', '≈ 0.5 billion years']] },
  }),
  s({
    id: 'procyon', name: 'Procyon', ra: 7.655, dec: 5.225, ly: 11.46, solarRadii: 2.05, color: '#fff6e8',
    info: { subtitle: 'The "Little Dog" star (F5IV)', summary: 'A bright star beginning to swell as it runs out of hydrogen in its core, with a white-dwarf companion.', facts: [['Distance', '11.5 ly'], ['Constellation', 'Canis Minor']] },
  }),
  s({
    id: 'tau-ceti', name: 'Tau Ceti', ra: 1.734, dec: -15.94, ly: 11.9, solarRadii: 0.79, color: '#ffe8c4',
    info: { subtitle: 'A nearby Sun-like star (G8V)', summary: 'Similar to the Sun and stable for billions of years, it is a favourite target in the search for habitable planets.', facts: [['Distance', '11.9 ly'], ['Constellation', 'Cetus']] },
  }),
  s({
    id: 'altair', name: 'Altair', ra: 19.846, dec: 8.868, ly: 16.7, solarRadii: 1.8, color: '#eaf0ff',
    info: { subtitle: 'A fast-spinning star (A7V)', summary: 'Altair rotates once every 9 hours, so fast that it bulges at its equator.', facts: [['Distance', '16.7 ly'], ['Constellation', 'Aquila']] },
  }),
  s({
    id: 'vega', name: 'Vega', ra: 18.616, dec: 38.78, ly: 25.0, solarRadii: 2.36, color: '#d6e4ff',
    info: {
      subtitle: 'The future North Star (A0V)',
      summary: 'Vega was the North Star 12,000 years ago and will be again around the year 13,700, as Earth\'s axis slowly wobbles.',
      facts: [['Distance', '25 ly'], ['Constellation', 'Lyra'], ['Luminosity', '40 × Sun']],
    },
  }),
];
