import * as THREE from 'three';
import { concreteTexture, limestoneTexture } from './textures.js';

export const LEVEL1 = 3.6;
export const EYE = 1.65;

// Floor height of the walkable surface at (x, z). Two ramps link the ground floor
// to an upper level holding rooms 04 and 05.
export function heightAt(x, z) {
  if (x > -28 && x < -18 && z < -4 && z >= -44) return LEVEL1 * (-4 - z) / 40;
  if (z < -44 && x > -28 && x < 34) return LEVEL1;
  if (x > 24 && x < 34 && z >= -44 && z < -20) return LEVEL1 * (-20 - z) / 24;
  return 0;
}

function scaleBoxUV(geo, w, h, d, tile) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
  }
  uv.needsUpdate = true; return geo;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.segs = [];      // collision segments {ax, az, bx, bz, r}
    this.circles = [];   // collision circles {x, z, r}
    this.interactables = [];
    this.occluders = [];
    this.animated = [];
    const wallTex = concreteTexture();
    const darkTex = concreteTexture({ base: [150, 146, 140], seed: 21 });
    const floorTex = limestoneTexture();
    this.mat = {
      wall: new THREE.MeshStandardMaterial({ map: wallTex, color: 0xffffff, roughness: 0.92 }),
      wallDark: new THREE.MeshStandardMaterial({ map: darkTex, color: 0xb8b2aa, roughness: 0.95 }),
      ceiling: new THREE.MeshStandardMaterial({ map: wallTex, color: 0xf4f2ee, roughness: 1, emissive: 0x6a665f, emissiveIntensity: 0.55 }),
      floor: new THREE.MeshStandardMaterial({ map: floorTex, color: 0xffffff, roughness: 0.75 }),
      stone: new THREE.MeshStandardMaterial({ map: wallTex, color: 0xf6f3ee, roughness: 0.85 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.45, metalness: 0.75 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.3, metalness: 0.9 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.6 }),
      water: new THREE.MeshStandardMaterial({ color: 0x8fb4bf, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.85 }),
      paper: new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 0.95 }),
      glow: new THREE.MeshBasicMaterial({ color: 0xfff6e6 }),
    };
  }

  add(mesh, { cast = true, receive = true } = {}) { mesh.castShadow = cast; mesh.receiveShadow = receive; this.scene.add(mesh); return mesh; }

  box(cx, cy, cz, w, h, d, mat = this.mat.stone, { rotY = 0, cast = true, tile = 4 } = {}) {
    const geo = scaleBoxUV(new THREE.BoxGeometry(w, h, d), w, h, d, tile);
    const m = new THREE.Mesh(geo, mat); m.position.set(cx, cy, cz); m.rotation.y = rotY;
    this.occluders.push(m);
    return this.add(m, { cast });
  }

  collideBox(cx, cz, w, d) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    this.segs.push({ ax: x0, az: z0, bx: x1, bz: z0, r: 0 }, { ax: x1, az: z0, bx: x1, bz: z1, r: 0 },
      { ax: x1, az: z1, bx: x0, bz: z1, r: 0 }, { ax: x0, az: z1, bx: x0, bz: z0, r: 0 });
  }

  // Straight wall with optional door gaps: gaps = [[s0, s1, lintelBottomY]] measured along the wall.
  wall(ax, az, bx, bz, { y0 = 0, h = 9, t = 0.6, mat = this.mat.wall, gaps = [], collide = true } = {}) {
    const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    const rot = -Math.atan2(bz - az, bx - ax);
    const piece = (s0, s1, yb, yt, col) => {
      const len = s1 - s0; if (len <= 0.01 || yt - yb <= 0.01) return;
      const mid = (s0 + s1) / 2, cx = ax + ux * mid, cz = az + uz * mid;
      const ext = col ? t : 0;
      this.box(cx, (yb + yt) / 2, cz, len + ext, yt - yb, t, mat, { rotY: rot });
      if (col && collide) this.segs.push({ ax: ax + ux * s0, az: az + uz * s0, bx: ax + ux * s1, bz: az + uz * s1, r: t / 2 });
    };
    const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
    let s = 0;
    for (const [g0, g1, lintel] of sorted) {
      piece(s, g0, y0, y0 + h, true);
      piece(g0, g1, lintel, y0 + h, false);
      s = g1;
    }
    piece(s, L, y0, y0 + h, true);
  }

  // Curved wall from segments. gaps = [[a0, a1, lintelY]] in radians; angle a maps to (cx + r cos a, cz + r sin a).
  arcWall(cx, cz, r, { h = 9, t = 0.6, n = 48, gaps = [], mat = this.mat.wall } = {}) {
    const step = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const a0 = i * step, a1 = a0 + step, am = (a0 + a1) / 2;
      const gap = gaps.find(([g0, g1]) => am > g0 && am < g1);
      const len = 2 * r * Math.sin(step / 2) + 0.05;
      const px = cx + r * Math.cos(am), pz = cz + r * Math.sin(am);
      const rot = -Math.atan2(Math.cos(am), -Math.sin(am));
      if (gap) { this.box(px, (gap[2] + h) / 2, pz, len, h - gap[2], t, mat, { rotY: rot }); continue; }
      this.box(px, h / 2, pz, len, h, t, mat, { rotY: rot });
      this.segs.push({ ax: cx + r * Math.cos(a0), az: cz + r * Math.sin(a0), bx: cx + r * Math.cos(a1), bz: cz + r * Math.sin(a1), r: t / 2 });
    }
  }

  floor(x0, x1, z0, z1, y = 0, mat = this.mat.floor, tile = 4) {
    const w = x1 - x0, d = z1 - z0;
    const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
    const m = new THREE.Mesh(geo, mat); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    return this.add(m, { cast: false });
  }

  // Sloped quad along z: height yA at z0, yB at z1.
  ramp(x0, x1, z0, z1, yA, yB, mat = this.mat.floor) {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array([x0, yA, z0, x1, yA, z0, x0, yB, z1, x1, yB, z1]);
    const L = Math.hypot(z1 - z0, yB - yA) / 4, W = (x1 - x0) / 4;
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, W, 0, 0, L, W, L]), 2));
    const up = z1 > z0 ? [0, 2, 1, 1, 2, 3] : [0, 1, 2, 1, 3, 2];
    geo.setIndex(up); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { geo.setIndex(up.slice().reverse()); geo.computeVertexNormals(); }
    return this.add(new THREE.Mesh(geo, mat), { cast: false });
  }

  // Ceiling slab with skylight slits running along `axis`.
  ceiling(x0, x1, z0, z1, y, { axis = 'x', every = 5, slit = 0.8, t = 0.5, mat = this.mat.ceiling } = {}) {
    if (axis === 'x') {
      let z = z0; while (z < z1) {
        const zEnd = Math.min(z + every - slit, z1);
        this.box((x0 + x1) / 2, y + t / 2, (z + zEnd) / 2, x1 - x0 + 0.6, t, zEnd - z, mat);
        z += every;
      }
    } else {
      let x = x0; while (x < x1) {
        const xEnd = Math.min(x + every - slit, x1);
        this.box((x + xEnd) / 2, y + t / 2, (z0 + z1) / 2, xEnd - x, t, z1 - z0 + 0.6, mat);
        x += every;
      }
    }
  }

  solidCeiling(x0, x1, z0, z1, y, mat = this.mat.ceiling, t = 0.5) {
    this.box((x0 + x1) / 2, y + t / 2, (z0 + z1) / 2, x1 - x0 + 0.6, t, z1 - z0 + 0.6, mat);
  }

  ringCeiling(cx, cz, rIn, rOut, y, mat = this.mat.ceiling) {
    const shape = new THREE.Shape(); shape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, rIn, 0, Math.PI * 2, true); shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false, curveSegments: 64 });
    geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, mat); m.position.set(cx, y + 0.6, cz);
    return this.add(m);
  }

  interactive(mesh, data) { mesh.userData.interact = data; this.interactables.push(mesh); return mesh; }

  // Resolve a circle (player) against all colliders.
  collide(pos, r) {
    for (let iter = 0; iter < 3; iter++) {
      for (const s of this.segs) {
        const dx = s.bx - s.ax, dz = s.bz - s.az; const l2 = dx * dx + dz * dz || 1e-6;
        let t = ((pos.x - s.ax) * dx + (pos.z - s.az) * dz) / l2; t = Math.max(0, Math.min(1, t));
        const qx = s.ax + dx * t, qz = s.az + dz * t; const ex = pos.x - qx, ez = pos.z - qz;
        const d = Math.hypot(ex, ez), min = r + s.r;
        if (d < min && d > 1e-6) { const k = (min - d) / d; pos.x += ex * k; pos.z += ez * k; }
      }
      for (const c of this.circles) {
        const ex = pos.x - c.x, ez = pos.z - c.z, d = Math.hypot(ex, ez), min = r + c.r;
        if (d < min && d > 1e-6) { const k = (min - d) / d; pos.x += ex * k; pos.z += ez * k; }
      }
    }
  }

  buildArchitecture() {
    const W = this.mat.wall, H1 = LEVEL1;

    // 01 ENTRANCE: tall hall, x[-8,8] z[18,46]
    this.floor(-8, 8, 18, 46);
    this.wall(-8, 46, 8, 46, { h: 14 });
    this.wall(-8, 18, -8, 46, { h: 14 });
    this.wall(8, 18, 8, 46, { h: 14 });
    this.wall(-8, 18, 8, 18, { h: 14, gaps: [[5.5, 10.5, 6]] });
    this.ceiling(-8, 8, 18, 46, 14, { axis: 'x', every: 4, slit: 0.6 });
    // vestibule into rotunda
    this.floor(-2.5, 2.5, 13, 18);
    this.wall(-2.5, 13.6, -2.5, 18, { h: 6, t: 0.5 });
    this.wall(2.5, 13.6, 2.5, 18, { h: 6, t: 0.5 });
    this.solidCeiling(-2.5, 2.5, 13.6, 18, 6);

    // 02 ROTUNDA (THE PARK NOW): r=14, central void and oculus
    const circ = new THREE.Mesh(new THREE.CircleGeometry(14.3, 96).rotateX(-Math.PI / 2), this.mat.floor);
    const cuv = circ.geometry.attributes.uv; for (let i = 0; i < cuv.count; i++) cuv.setXY(i, cuv.getX(i) * 7, cuv.getY(i) * 7);
    this.add(circ, { cast: false });
    const ga = Math.asin(2.5 / 14);
    this.arcWall(0, 0, 14, { h: 20, n: 64, gaps: [[Math.PI / 2 - ga, Math.PI / 2 + ga, 6], [Math.PI - ga, Math.PI + ga, 6]] });
    this.ringCeiling(0, 0, 4.2, 14.6, 20);
    // A helical gallery band above the doors: suggests a continuous promenade without copying one.
    const turns = 1.35, segs = 90, rH = 12.6;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * turns * Math.PI * 2 + Math.PI * 0.62, a2 = ((i + 1) / segs) * turns * Math.PI * 2 + Math.PI * 0.62;
      const y = 7.2 + (i / segs) * 10.5, am = (a + a2) / 2;
      const len = 2 * rH * Math.sin((a2 - a) / 2) + 0.08, rot = -Math.atan2(Math.cos(am), -Math.sin(am));
      this.box(rH * Math.cos(am), y, rH * Math.sin(am), len, 1.25, 0.28, this.mat.stone, { rotY: rot });
      const slabR = 13.25; this.box(slabR * Math.cos(am), y - 0.62, slabR * Math.sin(am), len + 0.1, 0.22, 1.5, this.mat.stone, { rotY: rot });
    }
    // west vestibule
    this.floor(-18, -13, -2.5, 2.5);
    this.wall(-18, -2.5, -13.6, -2.5, { h: 6, t: 0.5 });
    this.wall(-18, 2.5, -13.6, 2.5, { h: 6, t: 0.5 });
    this.solidCeiling(-18, -13.6, -2.5, 2.5, 6);

    // 03 WHO BUILT: ramp gallery x[-28,-18], flat z[-4,6], ramp z[-44,-4]
    this.floor(-28, -18, -4, 6);
    this.ramp(-28, -18, -4, -44, 0, H1);
    this.wall(-28, 6, -18, 6, { h: 13 });
    this.wall(-28, -64, -28, 6, { h: 13 });
    this.wall(-18, -44, -18, 6, { h: 13, gaps: [[41.5, 46.5, 6]] });
    this.ceiling(-28, -18, -44, 6, 13, { axis: 'x', every: 3.2, slit: 0.5 });

    // Upper level podium (04 + 05)
    this.box(3, H1 / 2, -54, 62, H1, 20, this.mat.stone, { cast: false });
    this.floor(-28, 34, -64, -44, H1 + 0.01);
    // 04 NEIGHBORHOOD x[-28,4]
    this.wall(-28, -64, 4, -64, { h: 13 });
    this.wall(-18, -44, 4, -44, { h: 13 });
    this.wall(4, -64, 4, -44, { h: 13, gaps: [[8, 12, H1 + 5]] });
    this.ceiling(-28, 4, -64, -44, 13, { axis: 'z', every: 4, slit: 0.7 });
    // 05 BORDER x[4,34], split by a wall with one slot
    this.wall(4, -64, 34, -64, { h: 13 });
    this.wall(4, -44, 24, -44, { h: 13 });
    this.wall(34, -64, 34, -20, { h: 13 });
    this.wall(19, -64, 19, -44, { h: 13, t: 1.0, gaps: [[8.6, 11.0, 13]] });
    this.ceiling(4, 34, -64, -44, 13, { axis: 'x', every: 5, slit: 0.35 });
    // descending ramp x[24,34] z[-44,-20]
    this.ramp(24, 34, -44, -20, H1, 0);
    this.wall(24, -44, 24, -20, { h: 13 });
    this.ceiling(24, 34, -44, -20, 13, { axis: 'x', every: 3, slit: 0.5 });

    // 06 MALCOLM X PARK x[18,36] z[-20,2]
    this.floor(18, 36, -20, 2);
    this.wall(18, -20, 24, -20, { h: 13 });
    this.wall(34, -20, 36, -20, { h: 13 });
    this.wall(18, -20, 18, 56, { h: 12 });
    this.wall(36, -20, 36, 2, { h: 12 });
    this.ceiling(18, 36, -20, 2, 12, { axis: 'z', every: 6, slit: 0.6 });
    // Wall shared by 06/07 and the drum vestibule
    this.wall(18, 2, 54, 2, { h: 12, gaps: [[9, 13, 5], [26.5, 29.5, 4.5]] });

    // 07 SUNDAY x[18,54] z[2,34]: the brightest room, wide skylights
    this.floor(18, 54, 2, 34);
    this.wall(54, 2, 54, 34, { h: 12 });
    this.wall(18, 34, 54, 34, { h: 12, gaps: [[9, 13, 5]] });
    this.ceiling(18, 54, 2, 34, 12, { axis: 'z', every: 4, slit: 1.6 });

    // 08 DRUM CIRCLE: center (46,-8) r=8
    const dga = Math.asin(1.5 / 8);
    const dc = new THREE.Mesh(new THREE.CircleGeometry(8.3, 64).rotateX(-Math.PI / 2), this.mat.floor);
    dc.position.set(46, 0, -8); this.add(dc, { cast: false });
    this.arcWall(46, -8, 8, { h: 9, n: 48, gaps: [[Math.PI / 2 - dga, Math.PI / 2 + dga, 4.5]] });
    this.ringCeiling(46, -8, 2.2, 8.5, 9);
    this.floor(44.5, 47.5, -0.5, 2);
    this.wall(44.5, -0.3, 44.5, 2, { h: 4.5, t: 0.4 });
    this.wall(47.5, -0.3, 47.5, 2, { h: 4.5, t: 0.4 });
    this.solidCeiling(44.5, 47.5, -0.3, 2, 4.5);

    // 09 MATERIAL x[18,46] z[34,56]
    this.floor(18, 46, 34, 56);
    this.wall(46, 34, 46, 56, { h: 10 });
    this.wall(18, 56, 46, 56, { h: 10, gaps: [[9.7, 12.3, 2.7]] });
    this.ceiling(18, 46, 34, 56, 10, { axis: 'x', every: 5.5, slit: 0.5 });

    // 10 1968: compressed corridor, low and narrow, darker stone
    this.floor(27.7, 30.3, 56, 80, 0, new THREE.MeshStandardMaterial({ map: this.mat.floor.map, color: 0x77726a, roughness: 0.9 }));
    this.wall(27.7, 56, 27.7, 80, { h: 2.7, t: 0.5, mat: this.mat.wallDark });
    this.wall(30.3, 56, 30.3, 80, { h: 2.7, t: 0.5, mat: this.mat.wallDark });
    this.solidCeiling(27.7, 30.3, 56, 80, 2.7, this.mat.wallDark, 0.4);
    for (let z = 58; z < 80; z += 4) this.box(29, 2.68, z, 0.08, 0.02, 1.4, this.mat.glow, { cast: false });

    // 11 RESTORATION x[10,46] z[80,104]
    this.floor(10, 46, 80, 104);
    this.wall(10, 80, 46, 80, { h: 11, gaps: [[17.7, 20.3, 2.7]] });
    this.wall(46, 80, 46, 104, { h: 11 });
    this.wall(10, 104, 46, 104, { h: 11 });
    this.wall(10, 80, 10, 104, { h: 11, gaps: [[10, 14, 5]] });
    this.ceiling(10, 46, 80, 104, 11, { axis: 'z', every: 4.5, slit: 0.9 });

    // 12 ARCHIVE x[-22,10] z[80,104]
    this.floor(-22, 10, 80, 104);
    this.wall(-22, 80, 10, 80, { h: 7 });
    this.wall(-22, 104, 10, 104, { h: 7 });
    this.wall(-22, 80, -22, 104, { h: 7 });
    this.ceiling(-22, 10, 80, 104, 7, { axis: 'x', every: 3, slit: 0.25 });
  }
}
