/**
 * Solar system data.
 *
 * Every entry is plain data: add a moon, a dwarf planet or a whole new fact
 * section here and the scene, navigator and info panel pick it up.
 *
 * Fields
 *  id, name, type            'star' | 'planet' | 'dwarf' | 'moon' | 'region'
 *  parent                    physical parent (what it orbits)
 *  focusParent               where the camera goes when you zoom out past
 *                            `zoomOutLimit` (defaults to `parent`)
 *  radiusKm                  real radius
 *  displayRadius             optional override of the scene radius
 *  tilt                      axial tilt in degrees (>90 means retrograde spin)
 *  rotationHours             sidereal rotation period
 *  orbit                     { au | km, periodDays, meanLongitudeJ2000?,
 *                              inclination?, node?, plane: 'ecliptic'|'equator' }
 *  appearance                how to draw it (see src/workers/textureWorker.js)
 *  surfaceMap                id of a tiled map in src/data/mapLayers.js
 *  info                      { subtitle, summary, facts, sections, funFacts }
 */

export const SOLAR_SYSTEM_REGION = {
  id: 'solar-system',
  name: 'Solar System',
  type: 'region',
  focusParent: 'local-neighborhood',
  minDistance: 120,
  zoomInTarget: 'sun',
  zoomOutLimit: 8000,
  viewDistance: 1500,
  viewElevation: 30,
  infoRange: 7000,
  info: {
    subtitle: 'One star, eight planets, and a lot of empty space',
    summary:
      'The Solar System formed about 4.6 billion years ago from a collapsing cloud of gas and dust. ' +
      'Almost all of its mass (99.86%) is in the Sun; the rest is spread among planets, moons, asteroids, comets and dust.',
    facts: [
      ['Age', '≈ 4.6 billion years'],
      ['Planets', '8'],
      ['Known moons', '400+ (and counting)'],
      ['Dwarf planets', '5 recognised (Pluto, Eris, Ceres, Haumea, Makemake)'],
      ['Size (to Neptune)', '≈ 60 AU across'],
      ['Location', 'Orion Arm of the Milky Way, ~26,000 light-years from the centre'],
    ],
    sections: [
      {
        title: 'Rocky inside, giant outside',
        text:
          'Close to the young Sun it was too hot for ice to survive, so only rock and metal could clump together: ' +
          'Mercury, Venus, Earth and Mars. Beyond the "frost line" ice was plentiful, letting cores grow big enough ' +
          'to sweep up hydrogen and helium gas — the giants Jupiter, Saturn, Uranus and Neptune.',
      },
      {
        title: 'About this map',
        text:
          'Real distances are so vast that the planets would be invisible specks. Here, distances between bodies are ' +
          'compressed (sizes of the planets relative to each other are true, the Sun is shrunk). Zoom into any body and ' +
          'the facts shown are the real ones.',
      },
    ],
    funFacts: [
      'Light from the Sun takes about 8 minutes to reach Earth and over 4 hours to reach Neptune.',
      'All the planets would fit, side by side, in the gap between Earth and the Moon.',
    ],
  },
};

export const SUN = {
  id: 'sun',
  name: 'Sun',
  type: 'star',
  focusParent: 'solar-system',
  radiusKm: 695700,
  displayRadius: 20,
  tilt: 7.25,
  rotationHours: 609.12,
  zoomOutLimit: 150,
  viewDistance: 90,
  infoRange: 150,
  appearance: { style: 'sun', size: 1024 },
  info: {
    subtitle: 'A G-type main-sequence star (G2V)',
    summary:
      'The Sun is a 4.6-billion-year-old ball of hot plasma. In its core, hydrogen nuclei fuse into helium, ' +
      'turning about 4 million tonnes of matter into energy every second. That energy takes up to 100,000 years ' +
      'to work its way out — then just 8 minutes to reach Earth.',
    facts: [
      ['Diameter', '1,392,700 km (109 × Earth)'],
      ['Mass', '1.989 × 10³⁰ kg (333,000 × Earth)'],
      ['Surface temperature', '≈ 5,500 °C'],
      ['Core temperature', '≈ 15 million °C'],
      ['Rotation', '≈ 25 days at equator, 35 at poles'],
      ['Composition', '73% hydrogen, 25% helium'],
    ],
    sections: [
      {
        title: 'Layers',
        text:
          'Core (fusion) → radiative zone (light bounces around for millennia) → convective zone (hot plasma rises ' +
          'like boiling water) → photosphere (the visible "surface") → chromosphere → corona, a million-degree ' +
          'outer atmosphere that streams away as the solar wind.',
      },
      {
        title: 'Sunspots and the solar cycle',
        text:
          'Twisted magnetic fields create cooler, darker sunspots. Their number rises and falls on an 11-year cycle. ' +
          'Around solar maximum, flares and coronal mass ejections can trigger auroras and disrupt satellites on Earth.',
      },
      {
        title: 'Its future',
        text:
          'In about 5 billion years the Sun will run low on hydrogen in its core, swell into a red giant and probably ' +
          'swallow Mercury and Venus. It will end as a white dwarf about the size of Earth.',
      },
    ],
    funFacts: [
      'About 1.3 million Earths could fit inside the Sun.',
      'The Sun is not yellow — its light is white; our atmosphere scatters blue light, making it look yellow.',
    ],
  },
};

const MOON_COLORS = {
  grey: { base: [150, 146, 140], dark: [80, 78, 75], light: [205, 200, 192] },
};

export const PLANETS = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'planet',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 2439.7,
    tilt: 0.03,
    rotationHours: 1407.6,
    orbit: { au: 0.387, periodDays: 87.969, meanLongitudeJ2000: 252.25, inclination: 7.0, node: 48.33 },
    color: '#b5aa9c',
    appearance: {
      style: 'rocky',
      base: [140, 132, 122], dark: [80, 74, 68], light: [190, 182, 170],
      noiseScale: 3, craters: 140, craterMax: 0.14,
    },
    info: {
      subtitle: 'The smallest planet and closest to the Sun',
      summary:
        'Mercury is a scorched, cratered world only slightly larger than our Moon. With almost no atmosphere to ' +
        'trap heat, it swings from 430 °C in daylight to −180 °C at night.',
      facts: [
        ['Diameter', '4,879 km'],
        ['Distance from Sun', '0.39 AU (58 million km)'],
        ['Year', '88 Earth days'],
        ['Day (sunrise to sunrise)', '176 Earth days'],
        ['Gravity', '0.38 g'],
        ['Moons', '0'],
      ],
      sections: [
        {
          title: 'An iron heart',
          text:
            'Mercury\'s metallic core takes up about 85% of its radius — proportionally the largest of any planet. ' +
            'As that core cooled, the whole planet shrank, wrinkling the crust into cliffs hundreds of km long.',
        },
        {
          title: 'Ice on the hottest planet?',
          text:
            'Craters near the poles are permanently shadowed. NASA\'s MESSENGER spacecraft found water ice hiding inside them.',
        },
      ],
      funFacts: ['Mercury is the fastest planet, racing around the Sun at about 47 km/s.'],
    },
    moons: [],
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 6051.8,
    tilt: 177.4,
    rotationHours: 5832.5,
    orbit: { au: 0.723, periodDays: 224.701, meanLongitudeJ2000: 181.98, inclination: 3.39, node: 76.68 },
    color: '#e8c98a',
    appearance: {
      style: 'gas',
      bands: [[230, 200, 140], [215, 180, 120], [240, 215, 165], [200, 165, 110]],
      bandCount: 3, warp: 1.2, turbulence: 0.9, contrast: 0.45,
    },
    info: {
      subtitle: 'Earth\'s scorching twin',
      summary:
        'Venus is almost the same size as Earth, but a runaway greenhouse effect has made it the hottest planet: ' +
        'about 465 °C everywhere, day and night — hot enough to melt lead. Thick clouds of sulfuric acid hide the surface.',
      facts: [
        ['Diameter', '12,104 km'],
        ['Distance from Sun', '0.72 AU (108 million km)'],
        ['Year', '225 Earth days'],
        ['Day (one spin)', '243 Earth days — longer than its year'],
        ['Surface pressure', '92 × Earth'],
        ['Moons', '0'],
      ],
      sections: [
        {
          title: 'Spinning backwards',
          text:
            'Venus rotates in the opposite direction to most planets, so the Sun rises in the west. It spins so slowly ' +
            'that a Venus day lasts longer than a Venus year.',
        },
        {
          title: 'Surface',
          text:
            'Radar from the Magellan orbiter revealed vast volcanic plains, pancake-shaped domes and mountains taller than ' +
            'Everest. Soviet Venera landers survived for up to two hours and sent back the only photos from the surface.',
        },
      ],
      funFacts: ['Venus is the brightest natural object in the night sky after the Moon.'],
    },
    moons: [],
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 6371,
    tilt: 23.44,
    rotationHours: 23.9345,
    orbit: { au: 1.0, periodDays: 365.256, meanLongitudeJ2000: 100.46, inclination: 0, node: 0 },
    color: '#6fa8ff',
    appearance: { style: 'earth', clouds: true },
    surfaceMap: 'earth',
    info: {
      subtitle: 'Our home — the only known world with life',
      summary:
        'Earth is the largest rocky planet and the only one with liquid water oceans on its surface. Its atmosphere of ' +
        'nitrogen and oxygen, its magnetic field and its moving tectonic plates all help keep it habitable. ' +
        'Keep scrolling in to drop down to a real map.',
      facts: [
        ['Diameter', '12,742 km'],
        ['Distance from Sun', '1 AU (149.6 million km)'],
        ['Year', '365.25 days'],
        ['Day', '23 h 56 min (sidereal)'],
        ['Surface covered by water', '71%'],
        ['Moons', '1'],
      ],
      sections: [
        {
          title: 'Why we have seasons',
          text:
            'Earth\'s axis is tilted 23.4°. For half the year the northern hemisphere leans toward the Sun (summer in the ' +
            'north), and for the other half the southern hemisphere does. It has nothing to do with our distance from the Sun — ' +
            'we are actually closest in early January.',
        },
        {
          title: 'Day and night on this globe',
          text:
            'The globe here is lit from the real direction of the Sun for the date shown below, so the day/night line ' +
            'matches reality. On the night side you can see city lights.',
        },
        {
          title: 'A shield around us',
          text:
            'Molten iron flowing in the outer core generates a magnetic field that deflects most of the solar wind. ' +
            'Particles that leak in near the poles light up the sky as auroras.',
        },
      ],
      funFacts: [
        'Earth is the densest planet in the Solar System.',
        'The Moon is slowly drifting away from Earth — about 3.8 cm every year.',
      ],
    },
    moons: [
      {
        id: 'moon',
        name: 'Moon',
        radiusKm: 1737.4,
        rotationHours: 655.72,
        tidallyLocked: true,
        orbit: { km: 384400, periodDays: 27.3217, meanLongitudeJ2000: 218.316, inclination: 5.14, plane: 'ecliptic' },
        appearance: {
          style: 'rocky', ...MOON_COLORS.grey, noiseScale: 2.5, craters: 120, craterMax: 0.12, maria: 0.55,
        },
        info: {
          subtitle: 'Earth\'s only natural satellite',
          summary:
            'The Moon probably formed when a Mars-sized body slammed into the young Earth about 4.5 billion years ago. ' +
            'The debris collected into the Moon. It is the only other world humans have walked on.',
          facts: [
            ['Diameter', '3,475 km (27% of Earth)'],
            ['Distance from Earth', '384,400 km'],
            ['Orbit', '27.3 days'],
            ['Gravity', '0.17 g'],
            ['Temperature', '−173 °C to 127 °C'],
          ],
          sections: [
            {
              title: 'Seas that aren\'t seas',
              text:
                'The dark patches ("maria", Latin for seas) are ancient lava flows that filled huge impact basins. ' +
                'The bright highlands are older and more heavily cratered.',
            },
            {
              title: 'Always the same face',
              text:
                'Earth\'s gravity has slowed the Moon\'s spin until one rotation takes exactly one orbit — so we always see ' +
                'the same side. This is called tidal locking.',
            },
            {
              title: 'Apollo',
              text: 'Between 1969 and 1972, twelve astronauts walked on the Moon and brought back 382 kg of rock and soil.',
            },
          ],
          funFacts: ['The Moon\'s gravity causes most of Earth\'s ocean tides.'],
        },
      },
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 3389.5,
    tilt: 25.19,
    rotationHours: 24.623,
    orbit: { au: 1.524, periodDays: 686.98, meanLongitudeJ2000: 355.45, inclination: 1.85, node: 49.56 },
    color: '#e0703a',
    appearance: {
      style: 'rocky',
      base: [190, 95, 50], dark: [110, 50, 30], light: [225, 140, 90],
      noiseScale: 2.2, craters: 40, craterMax: 0.08, polarCaps: 72, contrast: 1.4,
    },
    info: {
      subtitle: 'The Red Planet',
      summary:
        'Mars is a cold desert world with a thin carbon-dioxide atmosphere. Its red colour comes from iron oxide — rust — ' +
        'in its dust. Dried-up river valleys and lake beds show that liquid water once flowed here.',
      facts: [
        ['Diameter', '6,779 km'],
        ['Distance from Sun', '1.52 AU (228 million km)'],
        ['Year', '687 Earth days'],
        ['Day', '24 h 37 min'],
        ['Gravity', '0.38 g'],
        ['Moons', '2 (Phobos and Deimos)'],
      ],
      sections: [
        {
          title: 'Giant landscapes',
          text:
            'Olympus Mons is the largest volcano in the Solar System, about 22 km high — two and a half times Everest. ' +
            'Valles Marineris is a canyon system 4,000 km long; it would stretch across the United States.',
        },
        {
          title: 'Robot explorers',
          text:
            'Rovers such as Curiosity and Perseverance are studying ancient rocks for signs of past life. ' +
            'Perseverance carried the Ingenuity helicopter — the first powered flight on another planet.',
        },
      ],
      funFacts: ['Sunsets on Mars are blue, because fine dust scatters red light away from the Sun\'s direction.'],
    },
    moons: [
      {
        id: 'phobos', name: 'Phobos', radiusKm: 11.27, tidallyLocked: true,
        orbit: { km: 9376, periodDays: 0.31891, plane: 'equator' },
        appearance: { style: 'rocky', base: [120, 105, 95], dark: [70, 60, 55], light: [160, 145, 130], craters: 30, craterMax: 0.3 },
        info: {
          subtitle: 'Mars\'s larger, doomed moon',
          summary:
            'Phobos is a lumpy, 22-km-wide moon that orbits Mars three times a day. It is spiralling inward and will either ' +
            'crash into Mars or break up into a ring in about 50 million years.',
          facts: [['Size', '27 × 22 × 18 km'], ['Orbit', '7 h 39 min'], ['Distance from Mars', '9,376 km']],
          sections: [{ title: 'Origin', text: 'It may be a captured asteroid or debris from a giant impact on Mars.' }],
        },
      },
      {
        id: 'deimos', name: 'Deimos', radiusKm: 6.2, tidallyLocked: true,
        orbit: { km: 23463, periodDays: 1.26244, plane: 'equator' },
        appearance: { style: 'rocky', base: [140, 125, 110], dark: [90, 80, 70], light: [175, 160, 145], craters: 15, craterMax: 0.2 },
        info: {
          subtitle: 'Mars\'s small outer moon',
          summary: 'Deimos is only 12 km across, with a surface smoothed by a thick layer of dust. From Mars it looks like a bright star.',
          facts: [['Size', '15 × 12 × 11 km'], ['Orbit', '30.3 hours'], ['Distance from Mars', '23,463 km']],
        },
      },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 69911,
    tilt: 3.13,
    rotationHours: 9.925,
    orbit: { au: 5.203, periodDays: 4332.59, meanLongitudeJ2000: 34.40, inclination: 1.30, node: 100.46 },
    color: '#d8b48a',
    appearance: {
      style: 'gas', size: 1024,
      bands: [[235, 225, 210], [190, 140, 100], [225, 205, 180], [165, 115, 80], [240, 230, 215], [200, 160, 120]],
      bandCount: 7, warp: 0.35, turbulence: 0.5,
      spot: { lat: -22, lon: 40, width: 0.22, height: 0.11, color: [200, 100, 70] },
    },
    info: {
      subtitle: 'King of the planets',
      summary:
        'Jupiter is more than twice as massive as all the other planets combined. It is a gas giant made mostly of ' +
        'hydrogen and helium, with colourful cloud belts of ammonia ice wrapped around it by its 10-hour day.',
      facts: [
        ['Diameter', '139,820 km (11 × Earth)'],
        ['Distance from Sun', '5.2 AU (778 million km)'],
        ['Year', '11.9 Earth years'],
        ['Day', '9 h 56 min — the shortest of any planet'],
        ['Mass', '318 × Earth'],
        ['Moons', '95 known'],
      ],
      sections: [
        {
          title: 'The Great Red Spot',
          text:
            'A storm larger than Earth that has been raging for at least 190 years. Its winds reach about 430 km/h. ' +
            'It has been shrinking over the last century.',
        },
        {
          title: 'No surface to stand on',
          text:
            'Go down through Jupiter\'s clouds and the gas just gets thicker and hotter. Deep inside, hydrogen is squeezed ' +
            'into a liquid metal, which generates the strongest planetary magnetic field in the Solar System.',
        },
        {
          title: 'Galilean moons',
          text:
            'Galileo discovered Io, Europa, Ganymede and Callisto in 1610 — the first proof that not everything orbits Earth.',
        },
      ],
      funFacts: ['Jupiter\'s gravity has deflected many comets that might otherwise have hit the inner planets.'],
    },
    moons: [
      {
        id: 'io', name: 'Io', radiusKm: 1821.6, tidallyLocked: true,
        orbit: { km: 421700, periodDays: 1.769, plane: 'equator' },
        appearance: {
          style: 'rocky', base: [225, 200, 90], dark: [170, 120, 50], light: [245, 235, 160],
          noiseScale: 3, craters: 0, spots: 60, spotColor: [60, 30, 20],
        },
        info: {
          subtitle: 'The most volcanic world known',
          summary:
            'Io has over 400 active volcanoes, some blasting sulfur plumes 400 km into space. The heat comes from tides: ' +
            'Jupiter\'s gravity, plus tugs from Europa and Ganymede, constantly squeeze and flex Io\'s interior.',
          facts: [['Diameter', '3,643 km'], ['Orbit', '1.77 days'], ['Distance from Jupiter', '421,700 km']],
          sections: [{ title: 'Colourful sulfur', text: 'Its yellows, reds and whites are different forms of sulfur and sulfur dioxide frost.' }],
        },
      },
      {
        id: 'europa', name: 'Europa', radiusKm: 1560.8, tidallyLocked: true,
        orbit: { km: 671034, periodDays: 3.551, plane: 'equator' },
        appearance: {
          style: 'rocky', base: [220, 210, 195], dark: [170, 140, 110], light: [245, 240, 232],
          noiseScale: 2, craters: 4, craterMax: 0.05, streaks: [150, 90, 60],
        },
        info: {
          subtitle: 'An ocean under the ice',
          summary:
            'Beneath Europa\'s cracked icy shell lies a salty ocean holding perhaps twice as much water as all of Earth\'s ' +
            'oceans. It is one of the best places to search for life beyond Earth.',
          facts: [['Diameter', '3,122 km'], ['Orbit', '3.55 days'], ['Ice shell', '≈ 15–25 km thick']],
          sections: [{ title: 'Europa Clipper', text: 'NASA\'s Europa Clipper, launched in 2024, will fly past Europa dozens of times starting in 2030.' }],
        },
      },
      {
        id: 'ganymede', name: 'Ganymede', radiusKm: 2634.1, tidallyLocked: true,
        orbit: { km: 1070412, periodDays: 7.155, plane: 'equator' },
        appearance: {
          style: 'rocky', base: [150, 140, 125], dark: [95, 88, 78], light: [200, 195, 185],
          noiseScale: 2.5, craters: 60, craterMax: 0.06, contrast: 1.3,
        },
        info: {
          subtitle: 'The largest moon in the Solar System',
          summary: 'Ganymede is bigger than the planet Mercury and is the only moon with its own magnetic field.',
          facts: [['Diameter', '5,268 km'], ['Orbit', '7.15 days'], ['Distance from Jupiter', '1.07 million km']],
        },
      },
      {
        id: 'callisto', name: 'Callisto', radiusKm: 2410.3, tidallyLocked: true,
        orbit: { km: 1882709, periodDays: 16.689, plane: 'equator' },
        appearance: {
          style: 'rocky', base: [100, 90, 78], dark: [55, 50, 44], light: [170, 160, 145],
          noiseScale: 3, craters: 200, craterMax: 0.07,
        },
        info: {
          subtitle: 'The most heavily cratered object known',
          summary: 'Callisto\'s ancient surface has barely changed in 4 billion years — it is covered in craters from edge to edge.',
          facts: [['Diameter', '4,821 km'], ['Orbit', '16.7 days'], ['Distance from Jupiter', '1.88 million km']],
        },
      },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 58232,
    tilt: 26.73,
    rotationHours: 10.656,
    orbit: { au: 9.537, periodDays: 10759.22, meanLongitudeJ2000: 49.94, inclination: 2.49, node: 113.67 },
    color: '#e3cf9c',
    appearance: {
      style: 'gas', size: 1024,
      bands: [[230, 210, 160], [210, 185, 135], [240, 225, 185], [195, 170, 120]],
      bandCount: 8, warp: 0.2, turbulence: 0.25, contrast: 0.6,
    },
    rings: {
      innerKm: 66900, outerKm: 136775,
      bands: [
        [0.00, [60, 55, 50, 0.05]], [0.15, [130, 115, 95, 0.35]], [0.28, [170, 155, 130, 0.55]],
        [0.42, [225, 205, 170, 0.95]], [0.62, [235, 215, 180, 0.9]], [0.64, [20, 20, 20, 0.05]],
        [0.70, [20, 20, 20, 0.05]], [0.72, [200, 185, 155, 0.7]], [0.90, [190, 175, 150, 0.6]],
        [0.92, [40, 40, 40, 0.1]], [0.94, [180, 165, 140, 0.5]], [1.00, [150, 140, 120, 0.2]],
      ],
    },
    info: {
      subtitle: 'The ringed jewel',
      summary:
        'Saturn is a gas giant famous for its spectacular rings. It is the least dense planet — on average lighter ' +
        'than water — so in a big enough bathtub it would float.',
      facts: [
        ['Diameter', '116,460 km (9 × Earth)'],
        ['Distance from Sun', '9.5 AU (1.43 billion km)'],
        ['Year', '29.5 Earth years'],
        ['Day', '10 h 34 min'],
        ['Ring span', '≈ 280,000 km, but often only ~10 m thick'],
        ['Moons', '274 known — the most of any planet'],
      ],
      sections: [
        {
          title: 'What the rings are made of',
          text:
            'Billions of chunks of water ice, from grains of dust to pieces the size of houses. The big gap between the ' +
            'two brightest rings is the Cassini Division, cleared by the gravity of the moon Mimas.',
        },
        {
          title: 'Cassini',
          text:
            'The Cassini spacecraft orbited Saturn for 13 years, dropped the Huygens probe onto Titan, and finished in 2017 ' +
            'by diving into Saturn\'s atmosphere.',
        },
      ],
      funFacts: ['A hexagon-shaped jet stream, wider than Earth, swirls around Saturn\'s north pole.'],
    },
    moons: [
      {
        id: 'mimas', name: 'Mimas', radiusKm: 198.2, tidallyLocked: true,
        orbit: { km: 185539, periodDays: 0.942, plane: 'equator' },
        appearance: { style: 'rocky', ...MOON_COLORS.grey, craters: 60, craterMax: 0.12, bigCrater: true },
        info: { subtitle: 'The "Death Star" moon', summary: 'A giant crater, Herschel, a third of Mimas\'s width, gives it a famous sci-fi look.', facts: [['Diameter', '396 km'], ['Orbit', '22.6 hours']] },
      },
      {
        id: 'enceladus', name: 'Enceladus', radiusKm: 252.1, tidallyLocked: true,
        orbit: { km: 237948, periodDays: 1.370, plane: 'equator' },
        appearance: { style: 'rocky', base: [235, 240, 245], dark: [190, 205, 220], light: [255, 255, 255], craters: 15, craterMax: 0.06, streaks: [160, 190, 220] },
        info: {
          subtitle: 'Geysers of ice',
          summary: 'Enceladus shoots jets of water vapour and ice from cracks near its south pole, fed by an underground ocean. The spray forms Saturn\'s E ring.',
          facts: [['Diameter', '504 km'], ['Orbit', '1.37 days'], ['Reflectivity', 'The most reflective body in the Solar System']],
        },
      },
      {
        id: 'tethys', name: 'Tethys', radiusKm: 531.1, tidallyLocked: true,
        orbit: { km: 294619, periodDays: 1.888, plane: 'equator' },
        appearance: { style: 'rocky', base: [210, 210, 205], dark: [150, 150, 148], light: [240, 240, 235], craters: 50, craterMax: 0.1 },
        info: { subtitle: 'An icy moon with a giant canyon', summary: 'Tethys is made almost entirely of water ice. Ithaca Chasma stretches three-quarters of the way around it.', facts: [['Diameter', '1,062 km'], ['Orbit', '1.89 days']] },
      },
      {
        id: 'dione', name: 'Dione', radiusKm: 561.4, tidallyLocked: true,
        orbit: { km: 377396, periodDays: 2.737, plane: 'equator' },
        appearance: { style: 'rocky', base: [195, 195, 192], dark: [130, 130, 128], light: [235, 235, 232], craters: 60, craterMax: 0.08, streaks: [240, 240, 240] },
        info: { subtitle: 'Wispy ice cliffs', summary: 'Bright streaks on Dione turned out to be ice cliffs hundreds of metres high.', facts: [['Diameter', '1,123 km'], ['Orbit', '2.74 days']] },
      },
      {
        id: 'rhea', name: 'Rhea', radiusKm: 763.8, tidallyLocked: true,
        orbit: { km: 527108, periodDays: 4.518, plane: 'equator' },
        appearance: { style: 'rocky', base: [190, 188, 182], dark: [120, 118, 112], light: [230, 228, 222], craters: 120, craterMax: 0.08 },
        info: { subtitle: 'Saturn\'s second-largest moon', summary: 'Rhea is a cold, airless ball of ice and rock, heavily cratered.', facts: [['Diameter', '1,527 km'], ['Orbit', '4.52 days']] },
      },
      {
        id: 'titan', name: 'Titan', radiusKm: 2574.7, tidallyLocked: true,
        orbit: { km: 1221870, periodDays: 15.945, plane: 'equator' },
        appearance: { style: 'gas', bands: [[215, 160, 70], [200, 145, 60], [225, 175, 85]], bandCount: 2, warp: 0.6, turbulence: 0.3, contrast: 0.25 },
        info: {
          subtitle: 'A moon with lakes, rivers and rain — of methane',
          summary:
            'Titan is the only moon with a thick atmosphere (denser than Earth\'s) and the only place besides Earth known ' +
            'to have liquid on its surface: lakes and seas of liquid methane and ethane.',
          facts: [['Diameter', '5,150 km'], ['Orbit', '15.9 days'], ['Surface temperature', '−179 °C']],
          sections: [{ title: 'Dragonfly', text: 'NASA\'s Dragonfly, a nuclear-powered drone, is due to launch in 2028 to fly between sites on Titan.' }],
        },
      },
      {
        id: 'iapetus', name: 'Iapetus', radiusKm: 734.5, tidallyLocked: true,
        orbit: { km: 3560820, periodDays: 79.32, plane: 'equator' },
        appearance: { style: 'rocky', base: [150, 140, 125], dark: [45, 35, 28], light: [225, 220, 210], craters: 50, craterMax: 0.08, twoTone: true },
        info: { subtitle: 'The two-faced moon', summary: 'One hemisphere of Iapetus is as dark as coal, the other bright as snow.', facts: [['Diameter', '1,469 km'], ['Orbit', '79 days']] },
      },
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'planet',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 25362,
    tilt: 97.77,
    rotationHours: 17.24,
    orbit: { au: 19.19, periodDays: 30688.5, meanLongitudeJ2000: 313.23, inclination: 0.77, node: 74.01 },
    color: '#9fdde6',
    appearance: {
      style: 'gas',
      bands: [[170, 220, 228], [160, 212, 222], [180, 228, 234]],
      bandCount: 4, warp: 0.1, turbulence: 0.1, contrast: 0.3,
    },
    rings: {
      innerKm: 41837, outerKm: 51149,
      bands: [[0, [80, 90, 100, 0.0]], [0.3, [120, 130, 140, 0.15]], [0.32, [0, 0, 0, 0]], [0.6, [130, 140, 150, 0.2]], [0.62, [0, 0, 0, 0]], [0.97, [170, 180, 190, 0.5]], [1, [0, 0, 0, 0]]],
    },
    info: {
      subtitle: 'The sideways ice giant',
      summary:
        'Uranus spins tipped over on its side, probably knocked over by a giant collision long ago. Methane in its ' +
        'atmosphere absorbs red light, giving it a pale cyan colour.',
      facts: [
        ['Diameter', '50,724 km (4 × Earth)'],
        ['Distance from Sun', '19.2 AU (2.9 billion km)'],
        ['Year', '84 Earth years'],
        ['Day', '17 h 14 min'],
        ['Axial tilt', '98°'],
        ['Moons', '28 known'],
      ],
      sections: [
        {
          title: 'Extreme seasons',
          text: 'Because of its tilt, each pole gets about 42 years of continuous sunlight followed by 42 years of darkness.',
        },
        {
          title: 'Ice giant',
          text:
            'Uranus and Neptune are "ice giants": beneath a hydrogen-helium atmosphere they are mostly a hot, dense fluid of ' +
            'water, methane and ammonia around a rocky core.',
        },
      ],
      funFacts: ['Uranus was the first planet discovered with a telescope, by William Herschel in 1781.'],
    },
    moons: [
      { id: 'miranda', name: 'Miranda', radiusKm: 235.8, tidallyLocked: true, orbit: { km: 129390, periodDays: 1.413, plane: 'equator' },
        appearance: { style: 'rocky', base: [170, 170, 170], dark: [100, 100, 100], light: [220, 220, 220], craters: 20, streaks: [120, 120, 120] },
        info: { subtitle: 'A patchwork moon', summary: 'Miranda has cliffs up to 20 km high — Verona Rupes may be the tallest cliff in the Solar System.', facts: [['Diameter', '472 km'], ['Orbit', '1.41 days']] } },
      { id: 'ariel', name: 'Ariel', radiusKm: 578.9, tidallyLocked: true, orbit: { km: 191020, periodDays: 2.520, plane: 'equator' },
        appearance: { style: 'rocky', base: [175, 170, 165], dark: [110, 105, 100], light: [215, 210, 205], craters: 30 },
        info: { subtitle: 'The brightest moon of Uranus', summary: 'Ariel\'s surface is crossed by valleys that suggest it was geologically active.', facts: [['Diameter', '1,158 km'], ['Orbit', '2.52 days']] } },
      { id: 'umbriel', name: 'Umbriel', radiusKm: 584.7, tidallyLocked: true, orbit: { km: 266000, periodDays: 4.144, plane: 'equator' },
        appearance: { style: 'rocky', base: [95, 92, 90], dark: [55, 53, 52], light: [130, 128, 125], craters: 80 },
        info: { subtitle: 'The darkest of Uranus\'s large moons', summary: 'Umbriel is ancient and heavily cratered, with a mysterious bright ring called Wunda.', facts: [['Diameter', '1,169 km'], ['Orbit', '4.14 days']] } },
      { id: 'titania', name: 'Titania', radiusKm: 788.4, tidallyLocked: true, orbit: { km: 435910, periodDays: 8.706, plane: 'equator' },
        appearance: { style: 'rocky', base: [165, 155, 145], dark: [100, 95, 88], light: [205, 198, 188], craters: 60 },
        info: { subtitle: 'The largest moon of Uranus', summary: 'Titania has huge canyons and faults, signs that its interior once expanded.', facts: [['Diameter', '1,577 km'], ['Orbit', '8.71 days']] } },
      { id: 'oberon', name: 'Oberon', radiusKm: 761.4, tidallyLocked: true, orbit: { km: 583520, periodDays: 13.46, plane: 'equator' },
        appearance: { style: 'rocky', base: [150, 135, 125], dark: [90, 80, 72], light: [190, 175, 160], craters: 90 },
        info: { subtitle: 'The outermost large moon of Uranus', summary: 'Oberon is old and cratered, with a mountain about 11 km high.', facts: [['Diameter', '1,523 km'], ['Orbit', '13.5 days']] } },
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'planet',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 24622,
    tilt: 28.32,
    rotationHours: 16.11,
    orbit: { au: 30.07, periodDays: 60182, meanLongitudeJ2000: 304.88, inclination: 1.77, node: 131.78 },
    color: '#4b70dd',
    appearance: {
      style: 'gas',
      bands: [[60, 100, 210], [50, 85, 190], [80, 125, 225], [45, 75, 170]],
      bandCount: 5, warp: 0.3, turbulence: 0.35, contrast: 0.5,
      spot: { lat: -20, lon: -60, width: 0.12, height: 0.06, color: [30, 45, 120] },
    },
    info: {
      subtitle: 'The windy blue world at the edge',
      summary:
        'Neptune is the farthest planet from the Sun. It has the fastest winds in the Solar System — over 2,000 km/h — ' +
        'driven by an internal heat source that is still not fully understood.',
      facts: [
        ['Diameter', '49,244 km (3.9 × Earth)'],
        ['Distance from Sun', '30 AU (4.5 billion km)'],
        ['Year', '165 Earth years'],
        ['Day', '16 h 6 min'],
        ['Moons', '16 known'],
      ],
      sections: [
        {
          title: 'Found with mathematics',
          text:
            'Astronomers noticed Uranus drifting from its predicted path and calculated where an unseen planet must be. ' +
            'In 1846 Johann Galle pointed a telescope there and found Neptune within 1° of the prediction.',
        },
        {
          title: 'Only one visitor',
          text: 'Voyager 2 flew past in 1989 — the only spacecraft ever to visit. It spotted a huge storm, the Great Dark Spot.',
        },
      ],
      funFacts: ['Since its discovery, Neptune completed its first full orbit only in 2011.'],
    },
    moons: [
      { id: 'proteus', name: 'Proteus', radiusKm: 210, tidallyLocked: true, orbit: { km: 117647, periodDays: 1.122, plane: 'equator' },
        appearance: { style: 'rocky', base: [90, 88, 85], dark: [50, 48, 46], light: [125, 122, 118], craters: 25, craterMax: 0.2 },
        info: { subtitle: 'A dark, boxy moon', summary: 'Proteus is about as large as a body can be without gravity pulling it into a sphere.', facts: [['Diameter', '≈ 420 km'], ['Orbit', '1.12 days']] } },
      { id: 'triton', name: 'Triton', radiusKm: 1353.4, tidallyLocked: true, orbit: { km: 354759, periodDays: -5.877, plane: 'equator' },
        appearance: { style: 'rocky', base: [210, 195, 185], dark: [160, 130, 120], light: [240, 235, 230], noiseScale: 4, craters: 5, polarCaps: 50, capColor: [235, 215, 210] },
        info: {
          subtitle: 'A captured world orbiting backwards',
          summary:
            'Triton orbits Neptune in the opposite direction to Neptune\'s spin — a sign it was captured from the Kuiper Belt. ' +
            'Voyager 2 saw geysers of nitrogen gas erupting from its frozen surface.',
          facts: [['Diameter', '2,707 km'], ['Orbit', '5.88 days (retrograde)'], ['Surface temperature', '−235 °C']],
        } },
      { id: 'nereid', name: 'Nereid', radiusKm: 170, tidallyLocked: false, rotationHours: 11.6, orbit: { km: 5513818, periodDays: 360.13, plane: 'equator' },
        appearance: { style: 'rocky', base: [120, 118, 115], dark: [70, 68, 66], light: [160, 158, 154], craters: 10 },
        info: { subtitle: 'The moon on a stretched orbit', summary: 'Nereid has one of the most eccentric orbits of any moon, swinging between 1.4 and 9.7 million km from Neptune.', facts: [['Diameter', '≈ 340 km'], ['Orbit', '360 days']] } },
    ],
  },
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'dwarf',
    parent: 'sun',
    focusParent: 'solar-system',
    radiusKm: 1188.3,
    tilt: 122.53,
    rotationHours: 153.29,
    orbit: { au: 39.48, periodDays: 90560, meanLongitudeJ2000: 238.93, inclination: 17.14, node: 110.30 },
    color: '#d9c4a8',
    appearance: {
      style: 'rocky', base: [200, 170, 140], dark: [110, 70, 50], light: [240, 230, 215],
      noiseScale: 1.6, craters: 20, contrast: 1.6, heart: true,
    },
    info: {
      subtitle: 'Dwarf planet of the Kuiper Belt',
      summary:
        'Pluto was called the ninth planet from its discovery in 1930 until 2006, when astronomers reclassified it as a dwarf ' +
        'planet: it shares its orbit with many other Kuiper Belt objects. In 2015 New Horizons revealed a surprisingly active world.',
      facts: [
        ['Diameter', '2,377 km (smaller than our Moon)'],
        ['Distance from Sun', '30–49 AU'],
        ['Year', '248 Earth years'],
        ['Day', '6.4 Earth days'],
        ['Moons', '5 (largest: Charon)'],
      ],
      sections: [
        {
          title: 'The heart',
          text:
            'Tombaugh Regio, the bright heart-shaped region, includes Sputnik Planitia — a vast glacier of nitrogen ice that ' +
            'slowly churns like a lava lamp.',
        },
      ],
      funFacts: ['Pluto and Charon are tidally locked to each other — each always shows the other the same face.'],
    },
    moons: [
      { id: 'charon', name: 'Charon', radiusKm: 606, tidallyLocked: true, orbit: { km: 19591, periodDays: 6.387, plane: 'equator' },
        appearance: { style: 'rocky', base: [150, 145, 140], dark: [90, 85, 80], light: [190, 185, 180], craters: 30, polarCaps: 70, capColor: [120, 60, 50] },
        info: { subtitle: 'Pluto\'s giant companion', summary: 'Charon is half Pluto\'s size. Its north pole is stained red by material escaping from Pluto\'s atmosphere.', facts: [['Diameter', '1,212 km'], ['Orbit', '6.39 days']] } },
    ],
  },
];

/** Flatten the planet/moon tree into a list of body definitions with `parent` set. */
export function solarSystemBodies() {
  const list = [SUN];
  for (const planet of PLANETS) {
    const { moons = [], ...p } = planet;
    list.push(p);
    for (const moon of moons) {
      list.push({ type: 'moon', parent: planet.id, color: '#cfcfcf', ...moon });
    }
  }
  return list;
}
