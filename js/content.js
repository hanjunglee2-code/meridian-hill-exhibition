// Exhibition content. Factual statements live in research/provenance.json and are
// referenced here by claim id. Text in `text` is curatorial framing: it is labelled
// as such in the interface and introduces no facts beyond the cited claims.

export const ROOMS = [
  { id: 'entrance', num: '01', title: 'Entrance', sub: 'Meridian Hill Park / Malcolm X Park · Washington, DC',
    shape: { type: 'rect', x0: -8, x1: 8, z0: 13.8, z1: 46 }, spawn: { x: 0, z: 42, yaw: 0 } },
  { id: 'now', num: '02', title: 'The Park Now', sub: 'A central void around a model of the terraces',
    shape: { type: 'circle', cx: 0, cz: 0, r: 14 }, spawn: { x: 0, z: 10, yaw: 0 } },
  { id: 'built', num: '03', title: 'Who Built This Place?', sub: 'A rising ramp: planning, capital, design, labour, displacement',
    shape: { type: 'rect', x0: -28, x1: -13.8, z0: -44, z1: 6 }, spawn: { x: -22, z: 0, yaw: 0 } },
  { id: 'neighborhood', num: '04', title: 'The Neighborhood', sub: 'A map set into the floor; datasets as monoliths',
    shape: { type: 'rect', x0: -28, x1: 4, z0: -64, z1: -44 }, spawn: { x: -12, z: -46, yaw: 0 } },
  { id: 'border', num: '05', title: 'The Park as a Border', sub: 'Threshold, jurisdiction, contested ground',
    shape: { type: 'rect', x0: 4, x1: 34, z0: -64, z1: -44 }, spawn: { x: 7, z: -54, yaw: -Math.PI / 2 } },
  { id: 'malcolm', num: '06', title: 'Malcolm X Park', sub: 'Two names facing each other',
    shape: { type: 'rect', x0: 18, x1: 36, z0: -44, z1: 2 }, spawn: { x: 29, z: -16, yaw: Math.PI } },
  { id: 'sunday', num: '07', title: 'Sunday', sub: 'Gathering, play, rest, sound',
    shape: { type: 'rect', x0: 18, x1: 54, z0: 2, z1: 34 }, spawn: { x: 29, z: 6, yaw: Math.PI } },
  { id: 'drum', num: '08', title: 'The Drum Circle', sub: 'Documented · Reported · Interpreted',
    shape: { type: 'circle', cx: 46, cz: -8, r: 8.2 }, spawn: { x: 46, z: -3, yaw: 0 } },
  { id: 'material', num: '09', title: 'Material / Infrastructure', sub: 'Concrete, water, stairs, pipes, statues',
    shape: { type: 'rect', x0: 18, x1: 46, z0: 34, z1: 56 }, spawn: { x: 29, z: 37, yaw: Math.PI } },
  { id: 'u1968', num: '10', title: '1968', sub: 'A compressed corridor',
    shape: { type: 'rect', x0: 27.7, x1: 30.3, z0: 56, z1: 80 }, spawn: { x: 29, z: 58, yaw: Math.PI } },
  { id: 'restoration', num: '11', title: 'Restoration', sub: 'Preservation, repair, use, memory',
    shape: { type: 'rect', x0: 10, x1: 46, z0: 80, z1: 104 }, spawn: { x: 29, z: 83, yaw: Math.PI } },
  { id: 'archive', num: '12', title: 'Exit / Archive', sub: 'Sources, methodology, MCP provenance',
    shape: { type: 'rect', x0: -22, x1: 10, z0: 80, z1: 104 }, spawn: { x: 7, z: 92, yaw: Math.PI / 2 } },
];

// Doors: clicking one carries the visitor to the far side.
export const DOORS = [
  { id: 'd-ent', a: 'entrance', b: 'now', x: 0, z: 16, label: 'Enter the rotunda',
    toA: { x: 0, z: 21, yaw: Math.PI }, toB: { x: 0, z: 10, yaw: 0 } },
  { id: 'd-built', a: 'now', b: 'built', x: -16, z: 0, label: 'Enter: Who Built This Place?',
    toA: { x: -10, z: 0, yaw: -Math.PI / 2 }, toB: { x: -22, z: 0, yaw: 0 } },
  { id: 'd-border', a: 'neighborhood', b: 'border', x: 4, z: -54, label: 'Enter: The Park as a Border',
    toA: { x: 1, z: -54, yaw: Math.PI / 2 }, toB: { x: 7, z: -54, yaw: -Math.PI / 2 } },
  { id: 'd-sunday', a: 'malcolm', b: 'sunday', x: 29, z: 2, label: 'Enter: Sunday',
    toA: { x: 29, z: -1, yaw: 0 }, toB: { x: 29, z: 5, yaw: Math.PI } },
  { id: 'd-drum', a: 'sunday', b: 'drum', x: 46, z: 1, label: 'Enter: The Drum Circle',
    toA: { x: 46, z: 5, yaw: Math.PI }, toB: { x: 46, z: -3, yaw: 0 } },
  { id: 'd-material', a: 'sunday', b: 'material', x: 29, z: 34, label: 'Enter: Material / Infrastructure',
    toA: { x: 29, z: 31, yaw: 0 }, toB: { x: 29, z: 37, yaw: Math.PI } },
  { id: 'd-1968', a: 'material', b: 'u1968', x: 29, z: 56, label: 'Enter: 1968',
    toA: { x: 29, z: 53, yaw: 0 }, toB: { x: 29, z: 58, yaw: Math.PI } },
  { id: 'd-rest', a: 'u1968', b: 'restoration', x: 29, z: 80, label: 'Enter: Restoration',
    toA: { x: 29, z: 77, yaw: 0 }, toB: { x: 29, z: 83, yaw: Math.PI } },
  { id: 'd-archive', a: 'restoration', b: 'archive', x: 10, z: 92, label: 'Enter: Exit / Archive',
    toA: { x: 13, z: 92, yaw: -Math.PI / 2 }, toB: { x: 7, z: 92, yaw: Math.PI / 2 } },
];

export const EXHIBITS = {
  // 01 ENTRANCE
  'ent-statement': { room: 'entrance', title: 'The architecture is pristine. The history is not.', kicker: 'Curatorial statement',
    text: [
      'This building is clean, white and quiet on purpose. The place it describes is none of those things. It was assembled from land deals, designed as a showpiece for a wealthy neighborhood, and reclaimed as a stage for Black protest, music and memory.',
      'Move through the rooms in any order. Every factual statement you open carries its source, the tool that found it, and how confident this research is in it. Where the record is silent, the exhibition says so.'
    ], claims: [] },
  'ent-names': { room: 'entrance', title: 'Two names, one ground', kicker: 'Naming',
    text: ['The exhibition uses both names throughout. One is the official federal name. The other is a community name that the National Park Service itself now repeats in its own programming.'],
    claims: ['nps-web-07', 'nps-05'] },
  'ent-nps': { room: 'entrance', title: 'How the Park Service lists this place', kicker: 'MCP finding · National Parks',
    text: ['The park is federal land, but it is not a park in the National Park Service\'s own catalogue. It exists administratively inside Rock Creek Park, several kilometres away. This exhibition preserves that distinction everywhere.'],
    claims: ['nps-01', 'nps-02', 'nps-04'] },
  'ent-meridian': { room: 'entrance', title: 'The meridian line', kicker: 'Origin of a name',
    text: ['The bronze line set into this floor runs north through the rotunda. It stands for the longitude that gave the hill its name. The coordinates engraved beside it are the ones the NPS attaches to its 2026 ranger walk.'],
    claims: ['nps-web-01', 'nps-web-02', 'nps-05'] },

  // 02 THE PARK NOW
  'now-model': { room: 'now', title: 'Model of the terraces', kicker: 'Schematic, not to scale',
    text: ['The model shows the park\'s two worlds: a long, flat upper terrace, and a lower garden reached by a stepped cascade of thirteen basins. It is drawn for this exhibition from written descriptions, not from survey data.'],
    claims: ['tclf-01', 'nps-web-05'] },
  'now-status': { room: 'now', title: 'Condition, September 2026', kicker: 'Current',
    text: ['At the time this exhibition was made, water had returned to the cascade after years of dry basins, and parts of the park had been fenced off for months of work.'],
    claims: ['nps-web-11', 'web-03', 'nps-06'] },
  'now-uses': { room: 'now', title: 'What people do here', kicker: 'NPS description',
    text: ['The words circling this rotunda are taken from the Park Service\'s own list of what visitors do in the park.'],
    claims: ['nps-web-05'] },

  // 03 WHO BUILT THIS PLACE
  't-1791': { room: 'built', title: '1791 · A line is surveyed', kicker: 'Timeline', text: [], claims: ['nps-web-02'] },
  't-1819': { room: 'built', title: '1819 · A house called Meridian Hill', kicker: 'Timeline', text: [], claims: ['nps-web-01'] },
  't-1829': { room: 'built', title: '1829 · A president retires here', kicker: 'Timeline', text: [], claims: ['nps-web-03'] },
  't-1861': { room: 'built', title: '1861–65 · Union encampment', kicker: 'Timeline', text: [], claims: ['nps-web-03'] },
  't-1867': { room: 'built', title: '1867 · The estate is subdivided', kicker: 'Timeline', text: [], claims: ['web-10', 'web-11'] },
  't-1887': { room: 'built', title: '1887 · The Hendersons buy in', kicker: 'Timeline', text: [], claims: ['web-10', 'tclf-03'] },
  't-1910': { room: 'built', title: '1910 · The government purchases the grounds', kicker: 'Timeline', text: [], claims: ['nps-web-04'] },
  't-1912': { room: 'built', title: 'c.1912 · Residents displaced (reported)', kicker: 'Timeline · low confidence',
    text: ['This entry is shown at the same size as the others on purpose. It is the least documented claim in the room and potentially the most consequential.'],
    claims: ['web-11'] },
  't-1914': { room: 'built', title: '1914 · Design and construction begin', kicker: 'Timeline', text: [], claims: ['nps-web-04', 'tclf-02'] },
  't-1933': { room: 'built', title: '1933 · Transfer to the National Park Service', kicker: 'Timeline', text: [], claims: ['nps-web-04'] },
  't-1936': { room: 'built', title: '1936 · Completed', kicker: 'Timeline', text: [], claims: ['nps-web-04', 'web-01'] },
  'built-names': { room: 'built', title: 'Names in the record', kicker: 'Design and patronage',
    text: ['The names engraved on this wall are the ones the sources preserve: designers, a concrete craftsman, a patron and her architect.'],
    claims: ['nps-web-04', 'tclf-02', 'tclf-03', 'web-10'] },
  'built-labor': { room: 'built', title: 'The names that are missing', kicker: 'Gap in the record',
    text: [
      'The sources consulted name designers, patrons and officials. None of them names the labourers, masons, form-builders or concrete finishers who built these walls and basins over twenty-two years.',
      'This blank stretch of wall is left blank deliberately. The exhibition records the silence as a research gap rather than filling it with invention.'
    ], claims: ['nps-web-04'] },
  'built-henderson': { room: 'built', title: 'A park as real estate', kicker: 'Class and development',
    text: ['The park was lobbied for by a landowner whose holdings surrounded it. A formal public park raised the standing of the private lots around it. Read the Henderson claims beside the displacement claim, and note how differently each is documented.'],
    claims: ['tclf-03', 'web-10', 'web-11'] },

  // 04 NEIGHBORHOOD
  'nb-map': { room: 'neighborhood', title: 'The map in the floor', kicker: 'Schematic · positions approximate',
    text: [
      'The park sits on 16th Street NW between Euclid and W Streets. The neighborhood names set into the floor are placed only by approximate direction. DC neighborhood boundaries are informal, shifting and politically charged, and this exhibition does not draw them.',
      'U Street and Shaw appear to the southeast because the 1968 uprising and later protests link them to the park\'s story, not because of a surveyed boundary.'
    ], claims: ['web-12', 'nps-05', 'web-08', 'web-13'] },
  'nb-data': { room: 'neighborhood', title: 'Ten datasets, standing', kicker: 'Data.gov · spatial installation',
    text: [
      'Each monolith is one dataset found in the Data.gov catalogue. Its height encodes the year the record was last modified, from 1998 (shortest) to 2026 (tallest). Click any monolith for its metadata.',
      'The datasets were located but not analysed. No statistics in this exhibition are derived from them.'
    ], claims: ['dg-01', 'dg-00'] },

  // 05 BORDER
  'bd-units': { room: 'border', title: '36 units, and an absence', kicker: 'MCP finding · National Parks',
    text: ['The row of thin slabs stands for the 36 NPS units the API lists in Washington, DC. The gap in the row is where Meridian Hill Park would stand if it were listed as its own unit.'],
    claims: ['nps-01'] },
  'bd-99': { room: 'border', title: 'One of ninety-nine', kicker: 'MCP finding · National Parks',
    text: ['The grid of small blocks stands for the 99 neighborhood sites that Rock Creek Park administers. One block is lit. The API does not name the sites, so the lit block is symbolic rather than positional.'],
    claims: ['nps-04', 'nps-03'] },
  'bd-threshold': { room: 'border', title: 'Threshold', kicker: 'Interpretation',
    text: [
      'The dividing wall in this room has one narrow opening. The park works in a similar way. It is a change of level between an upper terrace and a lower garden, and a hinge between neighborhoods that are often described as separate places.',
      'It is also a jurisdictional border: federal ground, managed from elsewhere, set inside the city and used daily by people whose city does not govern it.'
    ], claims: ['tclf-01', 'web-12', 'nps-02'] },
  'bd-contested': { room: 'border', title: 'Contested ground', kicker: 'Public space',
    text: ['The Park Service calls the park a First Amendment space. In 2026 it also closed large parts of it for months. Park users described their fear that the closures would push people out. These statements sit side by side here without being reconciled.'],
    claims: ['nps-05', 'nps-web-11', 'web-04'] },
  'bd-alerts': { room: 'border', title: 'What the API reported that day', kicker: 'MCP snapshot · 29 Sept 2026',
    text: ['This is the snapshot of Rock Creek Park alerts and topics taken during research. The website never calls the NPS API. It shows only this dated record.'],
    claims: ['nps-06', 'nps-07'] },

  // 06 MALCOLM X PARK
  'mx-panel': { room: 'malcolm', title: '"Unofficially called Malcolm X Park"', kicker: 'NPS panel',
    text: ['The official reason the name cannot change is that a memorial already occupies the park. A president\'s memorial blocks the renaming for a Black revolutionary leader. The Park Service states this plainly.'],
    claims: ['nps-web-07'] },
  'mx-1969': { room: 'malcolm', title: 'When the name began', kicker: 'Dating the name',
    text: ['Sources disagree on timing. NPS says 1969, the Cultural Landscape Foundation points to the 1970s, and an architectural-history source names Angela Davis among those using the name by 1969. The disagreement is shown, not smoothed over.'],
    claims: ['nps-web-07', 'tclf-05', 'web-13'] },
  'mx-2026': { room: 'malcolm', title: 'The Park Service uses the name', kicker: 'MCP finding · National Parks',
    text: ['In a 2026 event listing returned by the National Parks MCP, the NPS itself writes "colloquially referred to as Malcolm X Park." The unofficial name has entered the official record without becoming official.'],
    claims: ['nps-05'] },
  'mx-meaning': { room: 'malcolm', title: 'What a name holds', kicker: 'Interpretation',
    text: [
      'An official name records who had the power to name. A community name records who used the place. The two names in this room face each other across the floor, and neither wall is taller.',
      'In 2026, users of the park tied the name "Malcolm X" to their fear of erasure during federal beautification.'
    ], claims: ['web-04'] },

  // 07 SUNDAY
  'su-uses': { room: 'sunday', title: 'Dogs, yoga, dancing, soccer, drums', kicker: 'NPS description',
    text: ['The marks on this floor are abstract footprints of the uses the NPS lists: a pitch, mats, a dance floor, a ring of drums, a path for dogs.'],
    claims: ['nps-web-05'] },
  'su-history': { room: 'sunday', title: 'A gathering place since 1936', kicker: 'History of use', text: [], claims: ['nps-web-08'] },
  'su-picnic': { room: 'sunday', title: 'Picnics and informal gathering', kicker: 'Curatorial observation · uncited',
    text: ['Picnics, and simply sitting on the grass, are not in the NPS list consulted. They appear on this floor as the curator\'s observation of common use, and are marked here as uncited.'],
    claims: [] },

  // 08 DRUM CIRCLE
  'dr-documented': { room: 'drum', title: 'Inner ring: documented', kicker: 'What official and current sources say',
    text: ['The inner ring holds what current sources state directly: the NPS lists drumming at a drum circle among visitor activities, and 2026 reporting describes a weekly tradition.'],
    claims: ['nps-web-05', 'web-05'] },
  'dr-reported': { room: 'drum', title: 'Middle ring: reported', kicker: 'Oral tradition and journalism',
    text: ['The origin story is carried by people and newspapers rather than by documents from the time. Two accounts differ, one pointing to 1965 and one to the late 1960s with a group formed in 1975. Both are kept.'],
    claims: ['web-06', 'web-07'] },
  'dr-interpretation': { room: 'drum', title: 'Outer ring: interpretation', kicker: 'Curatorial reading',
    text: [
      'A circle has no front row. The architecture of this room follows the form of the gathering it describes: people face each other, not a stage.',
      'The drum circle is a memorial that nobody installed. It has no plinth and no plaque, and it is renewed only by people turning up.'
    ], claims: [] },

  // 09 MATERIAL
  'ma-earley': { room: 'material', title: 'Exposed aggregate', kicker: 'Concrete',
    text: ['The wall panel beside you is a drawn impression of exposed-aggregate concrete: stones held in a matrix whose skin has been scraped away. It is an illustration, not a sample.'],
    claims: ['web-01', 'tclf-02'] },
  'ma-cascade': { room: 'material', title: 'Thirteen basins', kicker: 'Water',
    text: ['The section drawn on this wall steps down through thirteen basins into a reflecting pool. It is schematic, with no dimensions implied.'],
    claims: ['tclf-01', 'tclf-02'] },
  'ma-pipe': { room: 'material', title: 'Ninety feet of pipe', kicker: 'Infrastructure',
    text: ['The dark cylinder running along this wall is about 27 metres long, which is 90 feet. That is the length of cast-iron pipe reported replaced beneath the cascade. Hidden infrastructure decides whether the famous surface works at all.'],
    claims: ['web-02'] },
  'ma-joan': { room: 'material', title: 'Joan of Arc', kicker: 'Statue', text: [], claims: ['nps-web-06'] },
  'ma-dante': { room: 'material', title: 'Dante', kicker: 'Statue', text: [], claims: ['nps-web-06'] },
  'ma-buchanan': { room: 'material', title: 'James Buchanan Memorial', kicker: 'Memorial',
    text: ['This memorial is the reason, according to the NPS, that the park cannot officially carry another person\'s name.'],
    claims: ['nps-web-06', 'nps-web-07'] },
  'ma-serenity': { room: 'material', title: 'Serenity', kicker: 'Statue', text: [], claims: ['nps-web-06'] },
  'ma-armillary': { room: 'material', title: 'The empty plinth', kicker: 'Removed',
    text: ['The Noyes Armillary Sphere was vandalized and removed. This plinth stands empty to hold its absence.'],
    claims: ['nps-web-06'] },

  // 10 1968
  'u-days': { room: 'u1968', title: '4–8 April 1968', kicker: 'Uprising',
    text: ['The corridor is low and narrow on purpose. Its walls carry the dates and counts of the uprising that followed King\'s assassination along the corridors a few blocks from the park.'],
    claims: ['web-08'] },
  'u-summer': { room: 'u1968', title: 'Summer in the Parks', kicker: 'The park in the aftermath', text: [], claims: ['nps-web-09'] },
  'u-after': { room: 'u1968', title: 'After', kicker: 'What this research can and cannot say',
    text: [
      'Within a year, according to the NPS, residents were calling the park Malcolm X Park. By the 1980s it had a reputation for crime and neglect.',
      'This research did not locate sourced data on how 1968 changed the park\'s surrounding blocks, such as population, property or businesses. Those claims are left out rather than assumed.'
    ], claims: ['nps-web-07', 'web-13', 'web-09'] },

  // 11 RESTORATION
  'r-1990': { room: 'restoration', title: 'c.1990 · Friends of Meridian Hill', kicker: 'Community stewardship', text: [], claims: ['web-09'] },
  'r-1994': { room: 'restoration', title: '1994 · National Historic Landmark', kicker: 'Preservation', text: [], claims: ['tclf-04', 'web-09'] },
  'r-2018': { room: 'restoration', title: '2016–18 · Maintenance, budgets, pipes', kicker: 'Infrastructure', text: [], claims: ['web-02'] },
  'r-2020': { room: 'restoration', title: '2020 · Lower level rehabilitation announced', kicker: 'Rehabilitation', text: [], claims: ['nps-web-10'] },
  'r-2026c': { room: 'restoration', title: '2026 · Closure for rehabilitation', kicker: 'Rehabilitation', text: [], claims: ['nps-web-11'] },
  'r-2026w': { room: 'restoration', title: '2026 · Water returns, with a ceremony', kicker: 'Restoration and politics', text: [], claims: ['web-03'] },
  'r-afp': { room: 'restoration', title: '2026 · "Excluding its people"', kicker: 'Community response', text: [], claims: ['web-04', 'web-05'] },
  'r-tensions': { room: 'restoration', title: 'Four verbs', kicker: 'Interpretation',
    text: [
      'To preserve is to keep what survives. To restore is to return it to an earlier state. To use is to change it by living in it. To remember is to keep what the fabric does not record.',
      'Here the four pull against each other. A landmark restored to its 1936 image, with its water running, can also be a site where federal power stages itself. The same terraces carry decades of use that no restoration drawing shows.'
    ], claims: ['nps-web-11', 'web-03', 'web-04', 'tclf-04'] },
  'r-cascade': { room: 'restoration', title: 'The cascade, running', kicker: 'Schematic model',
    text: ['This basin sequence is modelled in the building\'s own stone. Its water is animated, which is the one indulgence of the room.'],
    claims: ['web-03', 'tclf-01'] },

  // 12 ARCHIVE
  'ar-archive': { room: 'archive', title: 'Open the archive', kicker: 'Sources', text: [], claims: [], action: 'archive' },
  'ar-method': { room: 'archive', title: 'Methodology', kicker: 'How this was made', text: [], claims: [], action: 'method' },
  'ar-mcp': { room: 'archive', title: 'MCP provenance', kicker: 'What the tools returned', text: [], claims: ['nps-01', 'nps-02', 'dg-00', 'dg-01'], action: 'mcp' },
  'ar-gaps': { room: 'archive', title: 'Gaps', kicker: 'What is not known', text: [], claims: [], action: 'gaps' },
  'ar-exit': { room: 'archive', title: 'Return to the entrance', kicker: 'Exit', text: [], claims: [], action: 'exit' },
};
