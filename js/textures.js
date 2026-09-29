import * as THREE from 'three';

export const FONT_SANS = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
export const FONT_SERIF = '"EB Garamond", Georgia, serif';

let maxAniso = 4;
export function setAnisotropy(n) { maxAniso = n; }

function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function finish(canvas, repeat = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

// Board-marked white concrete: fine speckle and faint horizontal formwork joints.
export function concreteTexture({ base = [236, 233, 227], seed = 7, joints = true, size = 512 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const r = rand(seed);
  g.fillStyle = `rgb(${base.join(',')})`; g.fillRect(0, 0, size, size);
  const img = g.getImageData(0, 0, size, size); const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 10;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 900; i++) {
    const v = 200 + r() * 40; g.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.25 + r() * 0.3})`;
    g.beginPath(); g.arc(r() * size, r() * size, r() * 1.4 + 0.3, 0, Math.PI * 2); g.fill();
  }
  if (joints) {
    g.strokeStyle = 'rgba(120,115,105,0.18)'; g.lineWidth = 1.2;
    for (let y = 0; y < size; y += size / 4) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(size, y + 0.5); g.stroke(); }
    g.strokeStyle = 'rgba(120,115,105,0.07)';
    for (let x = 0; x < size; x += size / 2) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, size); g.stroke(); }
  }
  return finish(c);
}

// Limestone floor slabs.
export function limestoneTexture({ seed = 3, size = 512 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const r = rand(seed);
  g.fillStyle = 'rgb(226,221,211)'; g.fillRect(0, 0, size, size);
  const img = g.getImageData(0, 0, size, size); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 7; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8; }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(190,182,168,${0.15 + r() * 0.15})`; g.lineWidth = r() * 1.5;
    g.beginPath(); const x = r() * size, y = r() * size; g.moveTo(x, y);
    g.bezierCurveTo(x + r() * 80, y + r() * 20, x + r() * 120, y - r() * 20, x + r() * 200, y + r() * 30); g.stroke();
  }
  g.strokeStyle = 'rgba(150,142,130,0.55)'; g.lineWidth = 1.5;
  g.strokeRect(0.75, 0.75, size - 1.5, size - 1.5);
  g.beginPath(); g.moveTo(0, size / 2); g.lineTo(size, size / 2); g.stroke();
  return finish(c);
}

// Exposed aggregate: pebbles in a matrix (illustrative impression of Earley's technique).
export function aggregateTexture({ seed = 11, size = 1024 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const r = rand(seed);
  g.fillStyle = 'rgb(214,205,190)'; g.fillRect(0, 0, size, size);
  const palette = [[176, 140, 110], [150, 120, 100], [200, 182, 160], [120, 108, 98], [190, 160, 130], [230, 220, 200], [160, 100, 80]];
  for (let i = 0; i < 5200; i++) {
    const p = palette[Math.floor(r() * palette.length)];
    const x = r() * size, y = r() * size, rx = 3 + r() * 9, ry = rx * (0.6 + r() * 0.4);
    g.fillStyle = `rgb(${p[0] + (r() - 0.5) * 20},${p[1] + (r() - 0.5) * 20},${p[2] + (r() - 0.5) * 20})`;
    g.beginPath(); g.ellipse(x, y, rx, ry, r() * Math.PI, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath(); g.ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.35, ry * 0.3, 0, 0, Math.PI * 2); g.fill();
  }
  return finish(c);
}

// Architectural text rendered to a transparent texture. Returns a mesh plane of w x h metres.
export function textPlane(lines, opts = {}) {
  const { w = 4, h = 1 } = opts;
  const tex = textTexture(lines, opts);
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.renderOrder = 2;
  return mesh;
}

// Text wrapped onto the inside of a cylinder (for round rooms). thetaCenter uses the
// world convention angle a: point = (cx + r cos a, cz + r sin a).
export function curvedText(lines, { cx, cz, r, a, y, w, h, ...opts }) {
  const tex = textTexture(lines, { w, h, ...opts });
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; tex.offset.x = 1;
  const len = w / r; const theta = Math.PI / 2 - a;
  const geo = new THREE.CylinderGeometry(r, r, h, 48, 1, true, theta - len / 2, len);
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.BackSide, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const m = new THREE.Mesh(geo, mat); m.position.set(cx, y, cz); m.renderOrder = 2; return m;
}

export function textTexture(lines, {
  w = 4, h = 1, ppm = 160, color = '#2a2825', font = FONT_SANS, weight = 500,
  size = 0.12, lineHeight = 1.35, align = 'left', tracking = 0, padding = 0.05,
  bg = null, valign = 'top', upper = false, italic = false,
} = {}) {
  const scale = Math.min(ppm, 4096 / Math.max(w, h));
  const cw = Math.max(2, Math.round(w * scale)), ch = Math.max(2, Math.round(h * scale));
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); }
  g.fillStyle = color; g.textBaseline = 'alphabetic';
  const items = (Array.isArray(lines) ? lines : [lines]).map((l) => (typeof l === 'string' ? { t: l } : l));
  const pad = padding * scale;
  // Wrap each item to width.
  const out = [];
  for (const it of items) {
    const s = (it.size ?? size) * scale;
    const f = `${it.italic ?? italic ? 'italic ' : ''}${it.weight ?? weight} ${s}px ${it.font ?? font}`;
    g.font = f;
    if ('letterSpacing' in g) g.letterSpacing = `${(it.tracking ?? tracking) * s}px`;
    let text = it.t; if (it.upper ?? upper) text = text.toUpperCase();
    if (text === '') { out.push({ text: '', f, s, color: it.color, lh: it.lh ?? lineHeight, tracking: it.tracking ?? tracking }); continue; }
    const words = text.split(' '); let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (g.measureText(test).width > cw - pad * 2 && line) { out.push({ text: line, f, s, color: it.color, lh: it.lh ?? lineHeight, tracking: it.tracking ?? tracking }); line = word; }
      else line = test;
    }
    out.push({ text: line, f, s, color: it.color, lh: it.lh ?? lineHeight, tracking: it.tracking ?? tracking });
  }
  const total = out.reduce((a, o) => a + o.s * o.lh, 0);
  let y = valign === 'middle' ? (ch - total) / 2 : valign === 'bottom' ? ch - pad - total : pad;
  for (const o of out) {
    y += o.s * o.lh;
    g.font = o.f; if ('letterSpacing' in g) g.letterSpacing = `${o.tracking * o.s}px`;
    g.fillStyle = o.color ?? color;
    const tw = g.measureText(o.text).width;
    const x = align === 'center' ? (cw - tw) / 2 : align === 'right' ? cw - pad - tw : pad;
    g.fillText(o.text, x, y - o.s * (o.lh - 1) * 0.5);
  }
  return finish(c, false);
}

// Generic drawing plane: callback draws on a canvas sized in metres.
export function drawingPlane(w, h, draw, { ppm = 128, transparent = true, emissive = false } = {}) {
  const scale = Math.min(ppm, 4096 / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const g = c.getContext('2d'); draw(g, c.width, c.height, scale);
  const tex = finish(c, false);
  const mat = emissive
    ? new THREE.MeshBasicMaterial({ map: tex, transparent, depthWrite: !transparent, polygonOffset: true, polygonOffsetFactor: -2 })
    : new THREE.MeshStandardMaterial({ map: tex, transparent, roughness: 0.95, depthWrite: !transparent, polygonOffset: true, polygonOffsetFactor: -2 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.renderOrder = 2; return m;
}
