import * as THREE from 'three';
import { textPlane, curvedText, drawingPlane, aggregateTexture, FONT_SANS, FONT_SERIF } from './textures.js';
import { heightAt, LEVEL1 } from './world.js';
import { EXHIBITS, DOORS } from './content.js';

const INK = '#23211e', MUTED = '#6d675e', PALE = '#ece7de', BRASS = '#8a6d3f';
const PI = Math.PI;

export function buildExhibits(world, data) {
  const S = world.scene, M = world.mat;

  // ---------- helpers ----------
  const put = (mesh, x, y, z, rotY = 0) => { mesh.position.set(x, y, z); mesh.rotation.y = rotY; S.add(mesh); mesh.receiveShadow = true; return mesh; };
  const text = (lines, x, y, z, rotY, opts) => put(textPlane(lines, opts), x, y, z, rotY);
  const tagged = (mesh, id) => world.interactive(mesh, { type: 'exhibit', id });

  // Wall plate: paper panel with kicker + title, clickable.
  function plate(id, x, y, z, rotY, { w = 2.4, h = 1.4, big = null, dark = false } = {}) {
    const ex = EXHIBITS[id];
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), dark ? new THREE.MeshStandardMaterial({ color: 0x3a3733, roughness: 0.9 }) : M.paper);
    put(panel, x, y, z, rotY); panel.castShadow = true;
    const lines = [];
    if (big) lines.push({ t: big, size: Math.min(0.42, h * 0.3), weight: 300, lh: 1.1, color: dark ? PALE : INK });
    lines.push({ t: ex.kicker, size: 0.075, weight: 600, upper: true, tracking: 0.12, color: dark ? '#b9b2a6' : MUTED, lh: 1.8 });
    const ttl = big && ex.title.startsWith(big) ? ex.title.slice(big.length).replace(/^\s*·\s*/, '') : ex.title;
    lines.push({ t: ttl, size: 0.13, weight: 500, color: dark ? PALE : INK, lh: 1.25 });
    const t = textPlane(lines, { w: w - 0.2, h: h - 0.16, padding: 0.02 });
    const off = new THREE.Vector3(0, 0, 0.025).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    put(t, x + off.x, y, z + off.z, rotY);
    tagged(panel, id); tagged(t, id);
    return panel;
  }

  // Plinth with a slanted reading surface.
  function plinth(id, x, z, rotY = 0, { w = 1.0, d = 0.62, h = 1.0 } = {}) {
    const y0 = heightAt(x, z); const ex = EXHIBITS[id];
    const base = world.box(x, y0 + h / 2, z, w, h, d, M.stone, { rotY });
    const top = new THREE.Group(); top.position.set(x, y0 + h + 0.02, z); top.rotation.y = rotY; S.add(top);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.03, d * 0.9), M.paper);
    slab.rotation.x = 0.32; slab.castShadow = true; top.add(slab);
    const t = textPlane([
      { t: ex.kicker, size: 0.045, weight: 600, upper: true, tracking: 0.12, color: MUTED, lh: 1.7 },
      { t: ex.title, size: 0.075, weight: 500, color: INK, lh: 1.25 },
    ], { w: w * 0.86, h: d * 0.8, ppm: 400, padding: 0.02 });
    slab.add(t); t.rotation.set(-PI / 2, 0, 0); t.position.y = 0.017;
    world.circles.push({ x, z, r: Math.max(w, d) * 0.55 });
    tagged(base, id); tagged(slab, id); tagged(t, id);
    return base;
  }

  const inward = (a) => Math.atan2(-Math.cos(a), -Math.sin(a));

  // ---------- door portals and lintel labels ----------
  for (const d of DOORS) {
    const y = heightAt(d.x, d.z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 2.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    m.position.set(d.x, y + 1.7, d.z); S.add(m);
    world.interactive(m, { type: 'door', id: d.id });
  }
  const lintel = (label, x, y, z, rotY) => text([{ t: label, size: 0.2, weight: 500, tracking: 0.14, upper: true }], x, y, z, rotY, { w: 6, h: 0.4, align: 'center', valign: 'middle' });
  lintel('02 · The Park Now', -18.32, 6.6, 0, -PI / 2);
  lintel('05 · The Park as a Border', 3.68, LEVEL1 + 5.6, -54, -PI / 2);
  lintel('04 · The Neighborhood', 4.32, LEVEL1 + 5.6, -54, PI / 2);
  lintel('07 · Sunday', 29, 5.6, 1.68, PI);
  lintel('06 · Malcolm X Park', 29, 5.6, 2.32, 0);
  lintel('08 · The Drum Circle', 46, 5.0, 2.32, 0);
  lintel('09 · Material / Infrastructure', 29, 5.6, 33.68, PI);
  lintel('07 · Sunday', 29, 5.6, 34.32, 0);
  lintel('10 · 1968', 29, 3.2, 55.68, PI);
  lintel('10 · 1968', 29, 3.2, 80.32, 0);
  lintel('12 · Exit / Archive', 10.32, 5.6, 92, PI / 2);
  lintel('11 · Restoration', 9.68, 5.6, 92, -PI / 2);

  // Room titles engraved at human scale near each entry.
  const roomTitle = (num, title, x, y, z, rotY, w = 8) => text([
    { t: num, size: 0.16, weight: 600, tracking: 0.2, color: MUTED, lh: 1.6 },
    { t: title, size: 0.62, weight: 300, lh: 1.05, tracking: -0.01 },
  ], x, y, z, rotY, { w, h: 2.2 });

  // ================= 01 ENTRANCE =================
  const title = text([
    { t: 'MERIDIAN HILL PARK', size: 1.05, weight: 300, tracking: 0.06, lh: 1.15 },
    { t: 'MALCOLM X PARK', size: 1.05, weight: 300, tracking: 0.06, lh: 1.15 },
    { t: 'WASHINGTON, DC', size: 0.28, weight: 600, tracking: 0.4, color: MUTED, lh: 2.2 },
  ], 0, 10, 18.32, 0, { w: 15, h: 5, align: 'center', valign: 'middle' });
  tagged(title, 'ent-names');
  const stmt = text([
    { t: 'THE ARCHITECTURE IS PRISTINE.', size: 0.72, weight: 300, tracking: 0.02, lh: 1.25 },
    { t: 'THE HISTORY IS NOT.', size: 0.72, weight: 600, tracking: 0.02, lh: 1.25 },
    { t: '', lh: 1 },
    { t: 'An architectural exhibition on a federal park in Washington, DC, and on who built it, who used it, who named it, and who governs it.', size: 0.17, weight: 400, color: MUTED, lh: 1.5, font: FONT_SERIF },
  ], -7.68, 6.2, 31, PI / 2, { w: 16, h: 4.6 });
  tagged(stmt, 'ent-statement');
  plate('ent-nps', 7.68, 2.2, 36, -PI / 2, { w: 3.6, h: 2.2, big: 'Not a unit.' });
  plate('ent-names', 7.68, 2.2, 28, -PI / 2, { w: 3.6, h: 2.2, big: 'Two names.' });
  // The meridian: a brass line along x = 0, through the entrance and rotunda.
  world.box(0, 0.006, 30, 0.07, 0.012, 32, M.brass, { cast: false });
  world.box(0, 0.006, 9.25, 0.07, 0.012, 9.5, M.brass, { cast: false });
  world.box(0, 0.006, -9.25, 0.07, 0.012, 9.5, M.brass, { cast: false });
  const merid = drawingPlane(3.2, 1.2, (g, W, H, s) => {
    g.fillStyle = '#b08d57'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3b2e1c'; g.textAlign = 'center';
    g.font = `600 ${0.1 * s}px ${FONT_SANS}`; g.fillText('THE MERIDIAN', W / 2, H * 0.28);
    g.font = `300 ${0.2 * s}px ${FONT_SANS}`; g.fillText('38.922366° N · 77.035418° W', W / 2, H * 0.58);
    g.font = `400 ${0.075 * s}px ${FONT_SANS}`; g.fillText('coordinates as given in the NPS event record, 2026', W / 2, H * 0.82);
  }, { transparent: false });
  merid.rotation.x = -PI / 2; merid.position.set(0, 0.015, 26); S.add(merid); tagged(merid, 'ent-meridian');

  // ================= 02 THE PARK NOW (rotunda) =================
  const model = new THREE.Group(); S.add(model);
  const plinthR = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.1, 0.9, 96), M.stone); plinthR.position.y = 0.45; plinthR.castShadow = plinthR.receiveShadow = true; model.add(plinthR);
  world.circles.push({ x: 0, z: 0, r: 4.2 });
  const mBox = (x, y, z, w, h, d, mat = M.stone) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, 0.9 + y, z); b.castShadow = b.receiveShadow = true; model.add(b); return b; };
  // Upper terrace (north = -z): mall with allées
  mBox(0, 0.3, -1.6, 2.6, 0.6, 3.6);
  mBox(0, 0.605, -1.6, 1.1, 0.01, 3.2, new THREE.MeshStandardMaterial({ color: 0xb9c2a6, roughness: 1 }));
  for (let i = 0; i < 10; i++) for (const sx of [-0.95, 0.95]) {
    const tr = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: 0x8d9a7a, roughness: 1 }));
    tr.position.set(sx, 1.62, -3.2 + i * 0.34); tr.castShadow = true; model.add(tr);
  }
  // Joan of Arc marker at the north end
  mBox(0, 0.72, -3.1, 0.12, 0.24, 0.2, M.bronze);
  // Cascade: 13 basins stepping down to the south
  for (let i = 0; i < 13; i++) {
    const y = 0.55 - i * 0.04, z = 0.35 + i * 0.12;
    mBox(0, y / 2, z, 0.9, y, 0.12);
    mBox(0, y + 0.005, z, 0.6, 0.01, 0.08, M.water);
    for (const sx of [-0.62, 0.62]) mBox(sx, y / 2 + 0.03, z, 0.24, y + 0.06, 0.12);
  }
  // Lower garden and reflecting pool
  mBox(0, 0.02, 2.75, 3.2, 0.04, 1.5);
  mBox(0, 0.045, 2.75, 1.5, 0.01, 0.9, M.water);
  mBox(-1.3, 0.17, 2.3, 0.08, 0.26, 0.08, M.bronze); // Dante marker
  mBox(1.3, 0.12, 3.2, 0.3, 0.16, 0.1, M.bronze); // Buchanan marker
  model.traverse((o) => { if (o.isMesh) tagged(o, 'now-model'); });
  // labels on the plinth rim
  text([{ t: 'SCHEMATIC MODEL · NOT TO SCALE · NORTH ↑ (toward the far wall)', size: 0.08, weight: 600, tracking: 0.14, color: MUTED }], 0, 0.5, 4.13, 0, { w: 5.5, h: 0.2, align: 'center', valign: 'middle' });
  // Words ring (NPS list of visitor activities)
  const words = [['WALKING DOGS', -PI / 4], ['YOGA', 0], ['DANCING', PI / 4], ['PICKUP SOCCER', 3 * PI / 4], ['DRUMMING', -3 * PI / 4]];
  for (const [wd, a] of words) {
    const m = curvedText([{ t: wd, size: 0.9, weight: 300, tracking: 0.08 }], { cx: 0, cz: 0, r: 13.66, a, y: 3.4, w: 9, h: 1.3, align: 'center', valign: 'middle', ppm: 110 });
    S.add(m); tagged(m, 'now-uses');
  }
  const nowTitle = curvedText([
    { t: '02', size: 0.2, weight: 600, tracking: 0.2, color: MUTED, lh: 1.5 },
    { t: 'THE PARK NOW', size: 0.8, weight: 300, tracking: 0.05, lh: 1.1 },
  ], { cx: 0, cz: 0, r: 13.66, a: -PI / 2, y: 4.4, w: 10, h: 2, align: 'center' });
  S.add(nowTitle);
  // Status plate on the north wall (flat plate set just inside the curve)
  plate('now-status', 0, 1.7, -13.3, 0, { w: 3.4, h: 1.6, big: 'Sept. 2026' });

  // ================= 03 WHO BUILT THIS PLACE? (rising ramp) =================
  roomTitle('03', 'WHO BUILT THIS PLACE?', -27.68, 5.8, 1, PI / 2, 9);
  const tl = ['t-1791', 't-1819', 't-1829', 't-1861', 't-1867', 't-1887', 't-1910', 't-1912', 't-1914', 't-1933', 't-1936'];
  tl.forEach((id, i) => {
    const z = -3 - i * 3.6, y = heightAt(-27, z);
    const year = EXHIBITS[id].title.split(' · ')[0];
    plate(id, -27.66, y + 1.55, z, PI / 2, { w: 2.8, h: 1.7, big: year });
  });
  // timeline rail rising with the ramp
  world.box(-27.55, 0.95, 1, 0.05, 0.05, 10, M.brass, { cast: false });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, Math.hypot(40, LEVEL1)), M.brass);
  rail.position.set(-27.55, 0.95 + LEVEL1 / 2, -24); rail.rotation.x = Math.atan2(LEVEL1, 40); S.add(rail);
  // Names in the record, east wall
  const names = text([
    { t: 'NAMES IN THE RECORD', size: 0.12, weight: 600, tracking: 0.2, color: MUTED, lh: 2 },
    ...['BURNAP', 'PEASLEE', 'VITALE', 'EARLEY', 'PAOLANO', 'CREED', 'HENDERSON', 'TOTTEN'].map((n) => ({ t: n, size: 0.5, weight: 300, tracking: 0.12, lh: 1.25 })),
  ], -18.32, heightAt(-20, -12) + 4.2, -12, -PI / 2, { w: 7, h: 6.2 });
  tagged(names, 'built-names');
  // The blank wall: labour not named in the sources
  const blank = text([
    { t: 'The labourers, masons and concrete finishers who built this park between 1914 and 1936 are not named in any source consulted.', size: 0.16, weight: 400, color: MUTED, font: FONT_SERIF, italic: true, lh: 1.45 },
  ], -18.32, heightAt(-20, -31) + 0.75, -31, -PI / 2, { w: 7, h: 0.8 });
  tagged(blank, 'built-labor');
  const blankFrame = world.box(-18.33, heightAt(-20, -31) + 4.2, -31, 0.02, 5.2, 12, new THREE.MeshStandardMaterial({ color: 0xfaf8f4, roughness: 1 }), { cast: false });
  tagged(blankFrame, 'built-labor');
  plinth('built-henderson', -20.3, -16, -PI / 2);
  plinth('t-1912', -20.3, -26, -PI / 2);

  // ================= 04 THE NEIGHBORHOOD =================
  const L1 = LEVEL1;
  roomTitle('04', 'THE NEIGHBORHOOD', -6, L1 + 5.2, -44.32, PI, 9);
  const map = drawingPlane(20, 14, (g, W, H, s) => {
    const X = (m) => W / 2 + m * s, Y = (m) => H / 2 + m * s;
    g.strokeStyle = 'rgba(70,64,56,0.55)'; g.lineWidth = 0.04 * s; g.lineCap = 'round';
    // grid of streets (schematic)
    const line = (x0, y0, x1, y1, wdt = 0.04) => { g.lineWidth = wdt * s; g.beginPath(); g.moveTo(X(x0), Y(y0)); g.lineTo(X(x1), Y(y1)); g.stroke(); };
    line(1.6, -7, 1.6, 7, 0.09);   // 16th St
    line(-1.6, -7, -1.6, 7, 0.05); // 15th St
    line(-10, -2.6, 10, -2.6, 0.05); // Euclid
    line(-10, 2.6, 10, 2.6, 0.05);   // W St
    g.strokeStyle = 'rgba(70,64,56,0.18)';
    for (let i = -9; i <= 9; i += 2.2) { line(i, -7, i, 7, 0.02); }
    for (let j = -6; j <= 6; j += 2.2) { line(-10, j, 10, j, 0.02); }
    // park
    g.fillStyle = 'rgba(176,141,87,0.9)'; g.fillRect(X(-1.4), Y(-2.4), 2.8 * s, 4.8 * s);
    g.fillStyle = '#2a2622'; g.textAlign = 'center';
    g.font = `600 ${0.2 * s}px ${FONT_SANS}`; g.fillText('THE PARK', X(0), Y(0.08));
    g.save(); g.translate(X(1.95), Y(-4.5)); g.rotate(-PI / 2); g.font = `500 ${0.16 * s}px ${FONT_SANS}`; g.fillText('16TH ST NW', 0, 0); g.restore();
    g.save(); g.translate(X(-1.95), Y(-4.5)); g.rotate(-PI / 2); g.font = `500 ${0.14 * s}px ${FONT_SANS}`; g.fillText('15TH ST NW', 0, 0); g.restore();
    g.font = `500 ${0.14 * s}px ${FONT_SANS}`; g.fillText('EUCLID ST NW', X(-6), Y(-2.8)); g.fillText('W ST NW', X(-6), Y(2.95));
    const nb = (t, x, y, sz = 0.42) => { g.font = `300 ${sz * s}px ${FONT_SANS}`; g.fillStyle = '#2a2622'; g.fillText(t, X(x), Y(y)); };
    nb('COLUMBIA HEIGHTS', 5.8, -4.8); nb('MOUNT PLEASANT', -3.8, -5.8); nb('ADAMS MORGAN', -6.8, -0.4);
    nb('WASHINGTON HEIGHTS', -6.2, 4.6, 0.32); nb('U STREET', 4.6, 4.4); nb('SHAW', 7.4, 6.0);
    g.font = `600 ${0.13 * s}px ${FONT_SANS}`; g.fillStyle = '#6d675e';
    g.fillText('SCHEMATIC · POSITIONS APPROXIMATE · NEIGHBORHOOD BOUNDARIES ARE NOT DRAWN', X(0), Y(6.6));
    g.fillText('N ↑', X(9.2), Y(-6.3));
  });
  map.rotation.x = -PI / 2; map.position.set(-12, L1 + 0.02, -54); S.add(map); tagged(map, 'nb-map');
  // Data monoliths: one per Data.gov dataset, height = year last modified
  const ds = data.datasets;
  ds.forEach((d, i) => {
    const year = parseInt((d.modified || d.issued || '2000').slice(0, 4), 10);
    const h = 1.4 + ((year - 1998) / (2026 - 1998)) * 5.6;
    const x = -26.2 + i * 3.0, z = -62;
    const m = world.box(x, L1 + h / 2, z, 1.7, h, 0.6, M.stone);
    world.collideBox(x, z, 1.7, 0.6);
    world.interactive(m, { type: 'dataset', idx: i });
    const t = text([
      { t: String(year), size: 0.3, weight: 300, lh: 1.2 },
      { t: d.title, size: 0.085, weight: 600, lh: 1.3 },
      { t: d.publisher, size: 0.07, weight: 400, color: MUTED, lh: 1.4 },
    ], x, L1 + 0.95, z + 0.31, 0, { w: 1.55, h: 1.6, ppm: 300 });
    world.interactive(t, { type: 'dataset', idx: i });
  });
  const dsLabel = text([
    { t: 'TEN DATASETS FROM THE DATA.GOV CATALOGUE', size: 0.16, weight: 600, tracking: 0.16, lh: 1.6 },
    { t: 'Height = year each record was last modified (1998 → 2026). Located, not analysed.', size: 0.15, weight: 400, color: MUTED, font: FONT_SERIF, lh: 1.4 },
  ], -12, L1 + 8.4, -63.68, 0, { w: 16, h: 1 });
  tagged(dsLabel, 'nb-data');

  // ================= 05 THE PARK AS A BORDER =================
  roomTitle('05', 'THE PARK AS A BORDER', 11.5, L1 + 5.2, -44.32, PI, 9);
  // 36 slabs with one gap
  for (let i = 0; i < 37; i++) {
    const x = 5.2 + i * 0.36, z = -62.4;
    if (i === 22) {
      world.box(x, L1 + 0.006, z, 0.2, 0.012, 1.2, M.brass, { cast: false });
      continue;
    }
    const s = world.box(x, L1 + 1.3, z, 0.1, 2.6, 0.5, M.stone);
    tagged(s, 'bd-units');
  }
  world.collideBox(11.7, -62.4, 13.4, 0.6);
  const unitsLabel = text([
    { t: '36 NATIONAL PARK SERVICE UNITS IN WASHINGTON, DC', size: 0.14, weight: 600, tracking: 0.14, lh: 1.6 },
    { t: 'The gap marks where Meridian Hill Park would stand if it were listed as its own unit. Source: National Parks MCP, findParks, 29 Sept 2026.', size: 0.13, weight: 400, color: MUTED, font: FONT_SERIF, lh: 1.4 },
  ], 11.7, L1 + 4.6, -63.68, 0, { w: 13, h: 1.1 });
  tagged(unitsLabel, 'bd-units');
  // The dividing wall faces
  const thr = text([
    { t: 'A THRESHOLD', size: 0.55, weight: 300, tracking: 0.05, lh: 1.2 },
    { t: 'IS A BORDER', size: 0.55, weight: 300, tracking: 0.05, lh: 1.2 },
    { t: 'AND A WAY THROUGH.', size: 0.55, weight: 600, tracking: 0.05, lh: 1.2 },
  ], 18.48, L1 + 5.4, -59.5, -PI / 2, { w: 8, h: 2.6 });
  tagged(thr, 'bd-threshold');
  const cont = text([
    { t: '"FIRST AMENDMENT SPACE"', size: 0.34, weight: 300, tracking: 0.04, lh: 1.3 },
    { t: 'NPS event listing, 2026', size: 0.12, weight: 500, color: MUTED, lh: 1.8 },
    { t: '"CLOSED ... THROUGH SEPTEMBER 30, 2026"', size: 0.34, weight: 300, tracking: 0.04, lh: 1.3 },
    { t: 'NPS record of determination, 2026', size: 0.12, weight: 500, color: MUTED, lh: 1.8 },
  ], 19.52, L1 + 5.2, -59.5, PI / 2, { w: 8, h: 3 });
  tagged(cont, 'bd-contested');
  // 99 small sites
  for (let i = 0; i < 11; i++) for (let j = 0; j < 9; j++) {
    const lit = i === 5 && j === 4;
    const c = world.box(23 + i * 0.8, L1 + 0.2, -62 + j * 0.7, 0.34, 0.4, 0.34, lit ? M.glow : M.stone, { cast: !lit });
    tagged(c, 'bd-99');
  }
  world.collideBox(27, -59.2, 8.8, 6.4);
  const nnLabel = text([{ t: 'ONE OF NINETY-NINE', size: 0.3, weight: 300, tracking: 0.08, lh: 1.3 }, { t: 'Rock Creek Park "also administers 99 separate neighborhood small sites."', size: 0.13, weight: 400, color: MUTED, font: FONT_SERIF }], 27, L1 + 4.2, -63.68, 0, { w: 9, h: 1 });
  tagged(nnLabel, 'bd-99');
  plinth('bd-alerts', 21.5, -47, PI);

  // ================= 06 MALCOLM X PARK =================
  const mhp = text([{ t: 'MERIDIAN', size: 2.1, weight: 300, tracking: 0.02, lh: 1.0 }, { t: 'HILL PARK', size: 2.1, weight: 300, tracking: 0.02, lh: 1.0 }],
    18.32, 6.4, -9, PI / 2, { w: 20, h: 5, align: 'center', valign: 'middle', ppm: 90 });
  tagged(mhp, 'mx-panel');
  const mxp = text([{ t: 'MALCOLM X', size: 2.1, weight: 600, tracking: 0.02, lh: 1.0 }, { t: 'PARK', size: 2.1, weight: 600, tracking: 0.02, lh: 1.0 }],
    35.68, 6.4, -9, -PI / 2, { w: 20, h: 5, align: 'center', valign: 'middle', ppm: 90 });
  tagged(mxp, 'mx-meaning');
  text([{ t: 'official name', size: 0.16, weight: 500, tracking: 0.2, upper: true, color: MUTED }], 18.32, 3.4, -9, PI / 2, { w: 6, h: 0.3, align: 'center' });
  text([{ t: 'community name, since 1969 (NPS)', size: 0.16, weight: 500, tracking: 0.2, upper: true, color: MUTED }], 35.68, 3.4, -9, -PI / 2, { w: 8, h: 0.3, align: 'center' });
  roomTitle('06', 'MALCOLM X PARK', 29, 7.8, 1.68, PI, 8);
  plinth('mx-1969', 23.5, -6, PI / 2);
  plinth('mx-2026', 34.2, -6, -PI / 2);
  const floorQ = drawingPlane(9, 1.2, (g, W, H, s) => {
    g.fillStyle = '#4a443c'; g.textAlign = 'center'; g.font = `300 ${0.36 * s}px ${FONT_SANS}`;
    g.fillText('WHO WE CHOOSE TO MEMORIALIZE AND WHY', W / 2, H * 0.55);
    g.font = `600 ${0.1 * s}px ${FONT_SANS}`; g.fillStyle = '#8a8378'; g.fillText('THEME OF THE NPS RANGER WALK, 17 OCTOBER 2026', W / 2, H * 0.88);
  });
  floorQ.rotation.x = -PI / 2; floorQ.rotation.z = PI; floorQ.position.set(29, 0.02, -9); S.add(floorQ); tagged(floorQ, 'mx-2026');

  // ================= 07 SUNDAY =================
  const sun = text([{ t: 'SUNDAY', size: 3.2, weight: 300, tracking: 0.06 }], 53.68, 6.5, 18, -PI / 2, { w: 22, h: 4.2, align: 'center', valign: 'middle', ppm: 80 });
  tagged(sun, 'su-uses');
  text([{ t: '07', size: 0.2, weight: 600, tracking: 0.2, color: MUTED }], 53.68, 3.9, 18, -PI / 2, { w: 4, h: 0.3, align: 'center' });
  const markMat = new THREE.MeshStandardMaterial({ color: 0x9c958a, roughness: 1 });
  const floorLine = (x, z, w, d) => world.box(x, 0.004, z, w, 0.008, d, markMat, { cast: false });
  // pitch
  const px = 44, pz = 20, pw = 14, pd = 9;
  floorLine(px, pz - pd / 2, pw, 0.08); floorLine(px, pz + pd / 2, pw, 0.08);
  floorLine(px - pw / 2, pz, 0.08, pd); floorLine(px + pw / 2, pz, 0.08, pd); floorLine(px, pz, 0.08, pd);
  for (const gx of [px - pw / 2 - 0.4, px + pw / 2 + 0.4]) {
    const goal = new THREE.Group(); goal.position.set(gx, 0, pz); S.add(goal);
    for (const dz of [-1.2, 1.2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), M.paper); p.position.set(0, 0.7, dz); p.castShadow = true; goal.add(p); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.48), M.paper); bar.position.y = 1.4; bar.castShadow = true; goal.add(bar);
    world.circles.push({ x: gx, z: pz - 1.2, r: 0.1 }, { x: gx, z: pz + 1.2, r: 0.1 });
  }
  // mats
  for (let i = 0; i < 6; i++) world.box(21.5 + (i % 3) * 1.4, 0.01, 8 + Math.floor(i / 3) * 2.6, 0.62, 0.02, 1.8, new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 1 }), { cast: false });
  // dance floor
  world.box(23.5, 0.006, 26, 6, 0.012, 6, new THREE.MeshStandardMaterial({ color: 0xf3efe8, roughness: 0.4 }), { cast: false });
  // picnic blankets
  const blanket = (x, z, r) => {
    const b = drawingPlane(1.8, 1.8, (g, W, H) => { const n = 8, c = W / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#e7e1d6' : '#c9c0b0'; g.fillRect(i * c, j * c, c, c); } }, { transparent: false });
    b.rotation.x = -PI / 2; b.rotation.z = r; b.position.set(x, 0.012, z); S.add(b); tagged(b, 'su-picnic');
  };
  blanket(33.5, 27.5, 0.3); blanket(36.5, 30, -0.5); blanket(37.8, 25.5, 0.9);
  // dog path: dotted meander
  for (let i = 0; i < 60; i++) { const t = i / 60; world.box(20 + t * 30, 0.005, 31.5 + Math.sin(t * 12) * 1.2, 0.12, 0.01, 0.12, markMat, { cast: false }); }
  plinth('su-uses', 25.5, 15, PI / 2);
  plate('su-history', 40, 2.2, 2.32, 0, { w: 3.4, h: 1.8, big: 'Since 1936' });
  const picLabel = drawingPlane(3, 0.5, (g, W, H, s) => { g.fillStyle = '#6d675e'; g.textAlign = 'center'; g.font = `600 ${0.1 * s}px ${FONT_SANS}`; g.fillText('PICNICS · UNCITED OBSERVATION', W / 2, H * 0.6); });
  picLabel.rotation.x = -PI / 2; picLabel.position.set(35.5, 0.015, 23.2); S.add(picLabel); tagged(picLabel, 'su-picnic');

  // ================= 08 THE DRUM CIRCLE =================
  const dcx = 46, dcz = -8;
  const rings = drawingPlane(15.6, 15.6, (g, W, H, s) => {
    const cx = W / 2, cy = H / 2;
    const ring = (r, label, weight = 1) => {
      g.strokeStyle = 'rgba(80,72,62,0.6)'; g.lineWidth = 0.03 * s * weight; g.beginPath(); g.arc(cx, cy, r * s, 0, PI * 2); g.stroke();
      g.fillStyle = '#4a443c'; g.font = `600 ${0.17 * s}px ${FONT_SANS}`;
      const chars = label.split(''); const step = (0.2 * s) / (r * s - 0.25 * s);
      for (let k = 0; k < 3; k++) {
        let a = -PI / 2 + k * (2 * PI / 3) - (chars.length * step) / 2;
        for (const ch of chars) { g.save(); g.translate(cx + Math.cos(a) * (r * s - 0.25 * s), cy + Math.sin(a) * (r * s - 0.25 * s)); g.rotate(a + PI / 2); g.fillText(ch, 0, 0); g.restore(); a += step; }
      }
    };
    ring(2.4, 'DOCUMENTED', 2); ring(4.3, 'REPORTED', 1.4); ring(6.4, 'INTERPRETATION', 1);
  });
  rings.rotation.x = -PI / 2; rings.position.set(dcx, 0.012, dcz); S.add(rings);
  world.interactive(rings, { type: 'drumRings', cx: dcx, cz: dcz });
  const drumMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3c, roughness: 0.6 });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * PI * 2 + 0.2; if (Math.abs(a - PI / 2) < 0.35) continue; // leave the entry open
    const x = dcx + Math.cos(a) * 5.3, z = dcz + Math.sin(a) * 5.3;
    const dr = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.75, 24), drumMat); dr.position.set(x, 0.375, z); dr.castShadow = true; S.add(dr);
    const skin = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24).rotateX(-PI / 2), M.paper); skin.position.set(x, 0.752, z); S.add(skin);
    world.circles.push({ x, z, r: 0.3 });
    world.interactive(dr, { type: 'drumRings', cx: dcx, cz: dcz, fixed: 'dr-reported' });
  }
  S.add(curvedText([{ t: 'THE DRUM CIRCLE', size: 0.7, weight: 300, tracking: 0.08 }], { cx: dcx, cz: dcz, r: 7.66, a: -PI / 2, y: 5.2, w: 11, h: 1.1, align: 'center', valign: 'middle' }));
  S.add(curvedText([{ t: 'A CIRCLE HAS NO FRONT ROW', size: 0.3, weight: 500, tracking: 0.2, color: MUTED }], { cx: dcx, cz: dcz, r: 7.66, a: 0, y: 2.4, w: 9, h: 0.6, align: 'center', valign: 'middle' }));
  S.add(curvedText([{ t: 'SINCE 1965? (REPORTED)', size: 0.3, weight: 500, tracking: 0.2, color: MUTED }], { cx: dcx, cz: dcz, r: 7.66, a: PI, y: 2.4, w: 9, h: 0.6, align: 'center', valign: 'middle' }));

  // ================= 09 MATERIAL / INFRASTRUCTURE =================
  roomTitle('09', 'MATERIAL / INFRASTRUCTURE', 37.5, 6.4, 34.32, 0, 12);
  const agg = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ map: aggregateTexture(), roughness: 0.8 }));
  put(agg, 18.32, 4.2, 45, PI / 2); tagged(agg, 'ma-earley');
  text([{ t: 'EXPOSED AGGREGATE', size: 0.3, weight: 300, tracking: 0.12 }, { t: 'Illustration, not a sample', size: 0.12, color: MUTED, font: FONT_SERIF, italic: true }], 18.32, 7.9, 45, PI / 2, { w: 8, h: 0.8 });
  const section = drawingPlane(15, 6, (g, W, H, s) => {
    g.fillStyle = 'rgba(250,248,244,1)'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2b2824'; g.lineWidth = 0.025 * s;
    const top = 1.2 * s, x0 = 0.8 * s, step = 0.85 * s, drop = 0.25 * s;
    g.beginPath(); g.moveTo(0.3 * s, top); g.lineTo(x0, top);
    for (let i = 0; i < 13; i++) {
      const x = x0 + i * step, y = top + i * drop;
      g.lineTo(x, y + drop * 0.5); g.quadraticCurveTo(x + step * 0.5, y + drop * 1.8, x + step, y + drop * 0.5); g.lineTo(x + step, y + drop);
    }
    const bx = x0 + 13 * step, by = top + 13 * drop;
    g.lineTo(bx + 2.2 * s, by); g.stroke();
    g.strokeStyle = '#4f7f8c'; g.lineWidth = 0.02 * s;
    for (let i = 0; i < 13; i++) { const x = x0 + i * step, y = top + i * drop; g.beginPath(); g.moveTo(x + step * 0.12, y + drop * 0.9); g.lineTo(x + step * 0.88, y + drop * 0.9); g.stroke(); }
    g.beginPath(); g.moveTo(bx + 0.1 * s, by - 0.05 * s); g.lineTo(bx + 2.1 * s, by - 0.05 * s); g.stroke();
    g.fillStyle = '#2b2824'; g.font = `600 ${0.16 * s}px ${FONT_SANS}`; g.fillText('SECTION · THIRTEEN BASINS INTO A REFLECTING POOL', 0.8 * s, 0.6 * s);
    g.font = `400 ${0.12 * s}px ${FONT_SANS}`; g.fillStyle = '#6d675e'; g.fillText('schematic · no dimensions implied', 0.8 * s, 0.85 * s);
    for (let i = 0; i < 13; i++) { g.fillText(String(i + 1), x0 + i * step + step * 0.42, top + i * drop + drop * 2.6); }
    g.fillText('UPPER TERRACE', 0.3 * s, top - 0.15 * s); g.fillText('LOWER GARDEN', bx + 0.3 * s, by + 0.4 * s);
  }, { transparent: false });
  put(section, 45.68, 4.6, 45, -PI / 2); tagged(section, 'ma-cascade');
  // 90 ft of cast-iron pipe along the south wall, on brackets above the corridor door
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 27.4, 24), M.iron);
  pipe.rotation.z = PI / 2; pipe.position.set(32, 4.3, 55.3); pipe.castShadow = true; S.add(pipe); tagged(pipe, 'ma-pipe');
  for (let x = 19; x < 46; x += 3) world.box(x, 4.3, 55.55, 0.1, 0.5, 0.5, M.iron);
  text([{ t: '90 FT · 27.4 M OF CAST-IRON PIPE', size: 0.2, weight: 600, tracking: 0.16 }], 38, 5.1, 55.68, PI, { w: 7, h: 0.35 });
  // Statues on plinths; the armillary plinth is empty
  const stat = (id, x, build) => {
    const z = 47; world.box(x, 0.7, z, 1.2, 1.4, 1.2, M.stone); world.collideBox(x, z, 1.2, 1.2);
    const g = new THREE.Group(); g.position.set(x, 1.4, z); S.add(g); if (build) build(g);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; tagged(o, id); } });
    const base = world.occluders[world.occluders.length - 1]; tagged(base, id);
    const t = text([{ t: EXHIBITS[id].title, size: 0.075, weight: 500, tracking: 0.08, upper: true }], x, 1.1, z - 0.61, PI, { w: 1.15, h: 0.3, align: 'center', valign: 'middle', ppm: 300 });
    tagged(t, id);
  };
  const bz = (g, w, h, d, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.bronze); m.position.set(x, y + h / 2, z); g.add(m); return m; };
  stat('ma-joan', 21.5, (g) => { bz(g, 0.35, 0.5, 1.0, 0, 0.35); bz(g, 0.1, 0.35, 0.1, 0, 0, 0.35); bz(g, 0.1, 0.35, 0.1, 0, 0, -0.35); bz(g, 0.18, 0.6, 0.2, 0, 0.85, 0.1); bz(g, 0.03, 0.9, 0.03, 0, 1.2, -0.25); });
  stat('ma-dante', 25, (g) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.7, 16), M.bronze); c.position.y = 0.85; g.add(c); });
  stat('ma-buchanan', 33, (g) => { bz(g, 1.0, 0.25, 0.4); bz(g, 0.3, 0.9, 0.3, 0, 0.25); });
  stat('ma-serenity', 36.5, (g) => { bz(g, 0.6, 0.45, 0.5); bz(g, 0.3, 0.6, 0.3, 0, 0.45, -0.05); });
  stat('ma-armillary', 40, null);

  // ================= 10 1968 =================
  const dayZ = [59.5, 63.5, 67.5, 71.5, 75.5];
  ['4 APRIL', '5 APRIL', '6 APRIL', '7 APRIL', '8 APRIL'].forEach((d, i) => {
    const t = text([{ t: '1968', size: 0.14, weight: 600, tracking: 0.2, color: '#b6afa4' }, { t: d, size: 0.62, weight: 300, color: PALE, lh: 1.1 }], 27.97, 1.55, dayZ[i], PI / 2, { w: 3.4, h: 1.2 });
    tagged(t, 'u-days');
  });
  [['13', 'KILLED'], ['~1,000', 'INJURED'], ['6,100+', 'ARRESTED'], ['1,200+', 'FIRES'], ['~6,000', 'TROOPS DEPLOYED']].forEach(([n, l], i) => {
    const t = text([{ t: n, size: 0.62, weight: 600, color: PALE, lh: 1.1 }, { t: l, size: 0.14, weight: 600, tracking: 0.2, color: '#b6afa4', lh: 1.6 }], 30.03, 1.55, dayZ[i], -PI / 2, { w: 3.4, h: 1.2 });
    tagged(t, 'u-days');
  });
  plate('u-summer', 30.02, 1.45, 78.2, -PI / 2, { w: 2.2, h: 1.4, big: '20,000', dark: true });
  plate('u-after', 27.98, 1.45, 78.2, PI / 2, { w: 2.2, h: 1.4, big: 'After', dark: true });
  text([{ t: 'Figures from secondary sources; accounts vary.', size: 0.07, color: '#b6afa4', font: FONT_SERIF, italic: true }], 27.97, 0.6, 59.5, PI / 2, { w: 3.4, h: 0.2 });

  // ================= 11 RESTORATION =================
  roomTitle('11', 'RESTORATION', 21, 7.4, 80.32, 0, 8);
  const rid = ['r-1990', 'r-1994', 'r-2018', 'r-2020', 'r-2026c', 'r-2026w', 'r-afp'];
  rid.forEach((id, i) => plate(id, 41.1 - i * 4.6, 2.3, 103.68, PI, { w: 4, h: 2, big: EXHIBITS[id].title.split(' · ')[0] }));
  const verbs = text([
    { t: 'PRESERVE', size: 0.9, weight: 300, tracking: 0.08, lh: 1.15 },
    { t: 'RESTORE', size: 0.9, weight: 300, tracking: 0.08, lh: 1.15 },
    { t: 'USE', size: 0.9, weight: 300, tracking: 0.08, lh: 1.15 },
    { t: 'REMEMBER', size: 0.9, weight: 600, tracking: 0.08, lh: 1.15 },
  ], 45.68, 5.6, 92, -PI / 2, { w: 9, h: 5, valign: 'middle' });
  tagged(verbs, 'r-tensions');
  // Cascade model: 13 basins stepping east with animated falling water
  const fallCanvas = document.createElement('canvas'); fallCanvas.width = 64; fallCanvas.height = 256;
  const fg = fallCanvas.getContext('2d'); for (let i = 0; i < 64; i++) { fg.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.6})`; fg.fillRect(i, 0, 1, 256); }
  for (let j = 0; j < 40; j++) { fg.fillStyle = 'rgba(160,200,210,0.6)'; fg.fillRect(0, Math.random() * 256, 64, 3); }
  const fallTex = new THREE.CanvasTexture(fallCanvas); fallTex.wrapS = fallTex.wrapT = THREE.RepeatWrapping;
  const fallMat = new THREE.MeshStandardMaterial({ map: fallTex, transparent: true, opacity: 0.8, roughness: 0.1, color: 0xdfeef2, emissive: 0x223338 });
  world.animated.push((t) => { fallTex.offset.y = -t * 1.2; });
  const cz0 = 94, top = 2.4;
  for (let i = 0; i < 13; i++) {
    const x = 15.5 + i * 1.5, y = top - i * 0.17;
    world.box(x, y / 2, cz0, 1.5, y, 3.2, M.stone);
    world.box(x, y + 0.01, cz0, 1.1, 0.02, 2.2, M.water, { cast: false });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.17), fallMat); f.rotation.y = PI / 2; f.position.set(x + 0.76, y - 0.085 + 0.01, cz0); S.add(f);
  }
  world.box(39.5, 0.2, cz0, 7, 0.4, 5, M.stone);
  const pool = world.box(39.5, 0.41, cz0, 6.4, 0.02, 4.4, M.water, { cast: false });
  world.animated.push((t) => { M.water.color.setHSL(0.53, 0.2, 0.62 + Math.sin(t * 1.3) * 0.02); });
  world.collideBox(24.5, cz0, 20, 3.4); world.collideBox(39.5, cz0, 7, 5);
  for (const o of world.occluders.slice(-28)) tagged(o, 'r-cascade');
  tagged(pool, 'r-cascade');
  plinth('r-cascade', 29, 89, PI);

  // ================= 12 EXIT / ARCHIVE =================
  roomTitle('12', 'EXIT / ARCHIVE', -6, 4.4, 80.32, 0, 9);
  // shelving: instanced archive boxes along north and south walls
  const boxGeo = new THREE.BoxGeometry(0.42, 0.3, 0.34);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xe9e3d6, roughness: 0.9 });
  const count = 2 * 5 * 60; const inst = new THREE.InstancedMesh(boxGeo, boxMat, count); let k = 0;
  const mtx = new THREE.Matrix4();
  for (const zz of [80.55, 103.45]) for (let row = 0; row < 5; row++) for (let i = 0; i < 60; i++) {
    const x = -21 + i * 0.5; if (x > 8.5) continue;
    if (zz < 90 && x > -11 && x < -1 && row < 5 && false) continue;
    mtx.makeTranslation(x, 0.3 + row * 0.42, zz); inst.setMatrixAt(k++, mtx);
  }
  inst.count = k; inst.castShadow = inst.receiveShadow = true; S.add(inst);
  world.interactive(inst, { type: 'exhibit', id: 'ar-archive' });
  world.collideBox(-6.25, 80.55, 29.5, 0.5); world.collideBox(-6.25, 103.45, 29.5, 0.5);
  // table
  world.box(-6, 0.8, 92, 14, 0.12, 2.2, M.stone);
  for (const x of [-12.5, 0.5]) world.box(x, 0.4, 92, 0.3, 0.8, 1.8, M.stone);
  world.collideBox(-6, 92, 14, 2.2);
  for (let i = 0; i < 18; i++) {
    const d = world.box(-12 + i * 0.7 + (i % 3) * 0.05, 0.875, 91.6 + (i % 2) * 0.7, 0.42, 0.02, 0.56, M.paper, { cast: false });
    d.rotation.y = (i % 5 - 2) * 0.06; tagged(d, 'ar-archive');
  }
  tagged(world.occluders[world.occluders.length - 21], 'ar-archive');
  text([{ t: 'THE ARCHIVE', size: 0.3, weight: 300, tracking: 0.12 }, { t: 'Click the table or shelves to inspect every claim and its provenance', size: 0.12, color: MUTED, font: FONT_SERIF, italic: true }], -6, 0.95, 90.88, 0, { w: 8, h: 0.6 }).rotation.x = -PI / 2;
  plate('ar-method', 3.5, 3.2, 80.9, 0, { w: 3, h: 1.6, big: 'Method' });
  plate('ar-mcp', -15, 3.2, 80.9, 0, { w: 3, h: 1.6, big: 'MCP' });
  plate('ar-gaps', -6, 3.2, 103.1, PI, { w: 3.4, h: 1.6, big: 'Gaps' });
  // Exit portal
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.2), new THREE.MeshBasicMaterial({ color: 0xfffaf0 }));
  put(portal, -21.68, 2.1, 92, PI / 2); tagged(portal, 'ar-exit');
  text([{ t: 'RETURN TO THE ENTRANCE', size: 0.16, weight: 600, tracking: 0.2 }], -21.66, 4.6, 92, PI / 2, { w: 4, h: 0.35, align: 'center' });
}
