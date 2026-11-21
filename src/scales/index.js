/**
 * Registry of scale levels, from smallest to largest.
 *
 * A scale level contributes a group of 3D objects and a set of focusable
 * things (bodies or regions). Focusables are linked by `focusParent` ids, so
 * zooming out of one scale flows into the next.
 *
 * To add a bigger scale (e.g. the Milky Way):
 *   1. create src/scales/milkyWayScale.js exporting { id, name, build(env) }
 *      that returns { group, focusables, update(frame), afterUpdate(frame) }
 *      and includes a Region with id 'milky-way';
 *   2. set `focusParent: 'milky-way'` (and a finite zoomOutLimit) on the
 *      solar-neighbourhood region in src/data/stars.js;
 *   3. add it to this list.
 */
import solarSystem from './solarSystemScale.js';
import stellarNeighborhood from './stellarNeighborhoodScale.js';

export const SCALES = [solarSystem, stellarNeighborhood];
