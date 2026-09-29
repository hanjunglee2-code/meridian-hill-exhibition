import * as THREE from 'three';
import { World, heightAt, EYE } from './world.js';
import { buildExhibits } from './exhibits.js';
import { ROOMS, DOORS, EXHIBITS } from './content.js';
import { UI } from './ui.js';
import { setAnisotropy } from './textures.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = (s) => document.querySelector(s);

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch { return false; }
}

async function loadJSON(p) { const r = await fetch(p); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); }

async function loadFonts() {
  const faces = ['300 40px "Inter Tight"', '400 40px "Inter Tight"', '500 40px "Inter Tight"', '600 40px "Inter Tight"', '400 40px "EB Garamond"', 'italic 400 40px "EB Garamond"'];
  await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 3500))]);
}

async function boot() {
  let data;
  try {
    const [provenance, datasets, nps] = await Promise.all([
      loadJSON('research/provenance.json'), loadJSON('research/datagov_datasets.json'), loadJSON('research/nps_mcp_snapshot.json'),
    ]);
    data = { provenance, datasets, nps };
  } catch (e) {
    $('#intro-status').textContent = 'Could not load research files. Serve this folder over HTTP (see README), for example: python3 -m http.server';
    console.error(e); return;
  }
  const player = { x: 0, z: 42, y: EYE, yaw: 0, pitch: 0 };
  const visited = new Set();
  let current = null;
  let started = false, locked = false;
  const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

  const hooks = {
    travelToRoom: (id) => { const r = ROOMS.find((x) => x.id === id); if (r) travel(r.spawn); },
    exitToEntrance: () => { ui.closeAll(); travel(ROOMS[0].spawn); },
    onOpen: () => { if (document.pointerLockElement) document.exitPointerLock(); $('#hud').classList.add('dim'); },
    onClose: () => { $('#hud').classList.remove('dim'); if (started && !touch) $('#resume').classList.add('show'); },
  };
  const ui = new UI(data, hooks);

  $('#btn-text').addEventListener('click', () => ui.openText());
  $('#btn-archive').addEventListener('click', () => ui.openArchive());

  if (!webglOK()) {
    $('#intro').classList.add('hide');
    ui.openText('Your browser or device cannot run the WebGL 2 building, so the exhibition is shown as text.');
    $('#text-close').style.display = 'none';
    return;
  }

  $('#intro-status').textContent = 'Preparing the building…';
  await loadFonts();

  // ---------------- renderer & scene ----------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('#stage').appendChild(renderer.domElement);
  setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8ecee);
  scene.fog = new THREE.Fog(0xe8ecee, 60, 190);
  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.05, 400);
  camera.rotation.order = 'YXZ';

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xf7f8fb, 0xdcd8d0, 0.55));
  const sun = new THREE.DirectionalLight(0xfff3df, 2.6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 160 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  scene.add(sun); scene.add(sun.target);
  const sunOffset = new THREE.Vector3(26, 62, 18);

  const world = new World(scene);
  world.buildArchitecture();
  buildExhibits(world, data);

  // ---------------- state ----------------
  const keys = new Set();
  const ray = new THREE.Raycaster(); ray.far = 11;
  const rayTargets = [...new Set([...world.interactables, ...world.occluders])];
  let hover = null;

  function place(s) { player.x = s.x; player.z = s.z; player.yaw = s.yaw; player.pitch = 0; player.y = heightAt(s.x, s.z) + EYE; }
  place(ROOMS[0].spawn);

  let traveling = false;
  function travel(spawn) {
    if (traveling) return; traveling = true;
    const f = $('#fade'); f.classList.add('on');
    setTimeout(() => { place(spawn); updateRoom(true); f.classList.remove('on'); traveling = false; }, 420);
  }

  function roomAt(x, z) {
    for (const r of ROOMS) {
      const s = r.shape;
      if (s.type === 'rect' && x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1) return r;
      if (s.type === 'circle' && Math.hypot(x - s.cx, z - s.cz) <= s.r) return r;
    }
    return null;
  }
  let titleTimer = 0;
  function updateRoom(force = false) {
    const r = roomAt(player.x, player.z);
    if (!r || (r === current && !force)) return;
    current = r;
    $('#room-tag').innerHTML = `<span>${r.num}</span>${r.title}`;
    if (!visited.has(r.id)) {
      visited.add(r.id);
      const t = $('#room-title'); t.innerHTML = `<span>${r.num}</span><strong>${r.title}</strong><em>${r.sub}</em>`;
      t.classList.add('show'); clearTimeout(titleTimer); titleTimer = setTimeout(() => t.classList.remove('show'), 3200);
    }
  }

  // ---------------- interaction ----------------
  function interact(target) {
    if (!target) return;
    const d = target.userData.interact;
    if (d.type === 'exhibit') ui.openExhibit(d.id);
    else if (d.type === 'dataset') ui.openDataset(d.idx);
    else if (d.type === 'door') {
      const door = DOORS.find((x) => x.id === d.id);
      travel(current && current.id === door.b ? door.toA : door.toB);
    } else if (d.type === 'drumRings') {
      if (d.fixed) return ui.openExhibit(d.fixed);
      const r = Math.hypot(hoverPoint.x - d.cx, hoverPoint.z - d.cz);
      ui.openExhibit(r < 3.3 ? 'dr-documented' : r < 5.4 ? 'dr-reported' : 'dr-interpretation');
    }
  }
  const hoverPoint = new THREE.Vector3();
  function pick(ndcX = 0, ndcY = 0) {
    ray.setFromCamera({ x: ndcX, y: ndcY }, camera);
    const hits = ray.intersectObjects(rayTargets, false);
    const h = hits.find((x) => x.object.visible !== false);
    if (h && h.object.userData.interact) { hoverPoint.copy(h.point); return h.object; }
    return null;
  }
  function labelFor(obj) {
    const d = obj.userData.interact;
    if (d.type === 'exhibit') return EXHIBITS[d.id]?.title;
    if (d.type === 'dataset') return data.datasets[d.idx].title;
    if (d.type === 'door') { const door = DOORS.find((x) => x.id === d.id); const other = current && current.id === door.b ? door.a : door.b; const r = ROOMS.find((x) => x.id === other); return `Go to ${r.num} · ${r.title}`; }
    if (d.type === 'drumRings') return 'The drum circle: documented, reported, interpreted';
    return '';
  }

  // ---------------- input: desktop ----------------
  const canvas = renderer.domElement;
  function start() {
    started = true; $('#intro').classList.add('hide'); $('#hud').classList.add('show');
    initAudio();
    if (!touch) canvas.requestPointerLock?.();
    else $('#touch').classList.add('show');
    updateRoom(true);
  }
  $('#btn-enter').addEventListener('click', start);
  $('#btn-enter').disabled = false; $('#intro-status').textContent = '';
  $('#resume').addEventListener('click', () => { $('#resume').classList.remove('show'); canvas.requestPointerLock?.(); });
  canvas.addEventListener('click', () => {
    if (!started || touch) return;
    if (!locked) { canvas.requestPointerLock?.(); return; }
    if (hover) interact(hover);
  });
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas;
    $('#resume').classList.toggle('show', started && !locked && !ui.isOpen());
    $('#crosshair').classList.toggle('show', locked);
  });
  document.addEventListener('mousemove', (e) => {
    if (!locked) return;
    player.yaw -= e.movementX * 0.0022; player.pitch -= e.movementY * 0.0022;
    player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch));
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') { if (e.key === 'Escape') ui.closeAll(); return; }
    keys.add(e.code);
    if (!started) return;
    if (e.code === 'KeyM') { ui.isOpen() && ui.open === '#map' ? ui.closeAll() : ui.openMap(player, visited); }
    if (e.code === 'KeyP') { ui.isOpen() && ui.open === '#archive' ? ui.closeAll() : ui.openArchive(); }
    if (e.code === 'KeyT') { ui.isOpen() && ui.open === '#textmode' ? ui.closeAll() : ui.openText(); }
    if (e.code === 'KeyN') toggleSound();
    if (e.code === 'KeyE' || e.code === 'Enter') { if (hover && !ui.isOpen()) interact(hover); }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  document.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  $('#btn-map').addEventListener('click', () => ui.openMap(player, visited));
  $('#btn-arch2').addEventListener('click', () => ui.openArchive());
  $('#btn-sound').addEventListener('click', () => toggleSound());

  // ---------------- input: touch ----------------
  const joy = { id: null, x: 0, y: 0, ox: 0, oy: 0 }, look = { id: null, lx: 0, ly: 0, moved: 0, t: 0 };
  canvas.addEventListener('touchstart', (e) => {
    if (!started) return;
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.4 && t.clientY > window.innerHeight * 0.45 && joy.id === null) {
        joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY; joy.x = joy.y = 0;
        const k = $('#joy'); k.style.left = `${t.clientX - 50}px`; k.style.top = `${t.clientY - 50}px`; k.classList.add('on');
      } else if (look.id === null) { look.id = t.identifier; look.lx = t.clientX; look.ly = t.clientY; look.moved = 0; look.t = performance.now(); }
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) {
        joy.x = Math.max(-1, Math.min(1, (t.clientX - joy.ox) / 50)); joy.y = Math.max(-1, Math.min(1, (t.clientY - joy.oy) / 50));
        $('#joy i').style.transform = `translate(${joy.x * 30}px, ${joy.y * 30}px)`;
      } else if (t.identifier === look.id) {
        const dx = t.clientX - look.lx, dy = t.clientY - look.ly; look.lx = t.clientX; look.ly = t.clientY; look.moved += Math.abs(dx) + Math.abs(dy);
        player.yaw -= dx * 0.005; player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - dy * 0.005));
      }
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; $('#joy').classList.remove('on'); $('#joy i').style.transform = ''; }
      else if (t.identifier === look.id) {
        if (look.moved < 10 && performance.now() - look.t < 350) {
          const o = pick((t.clientX / window.innerWidth) * 2 - 1, -(t.clientY / window.innerHeight) * 2 + 1);
          if (o) interact(o);
        }
        look.id = null;
      }
    }
  });

  // ---------------- sound: synthesized drum pulse, heard only near the drum circle ----------------
  let actx = null, master = null, soundOn = true, nextBeat = 0, step = 0;
  function initAudio() {
    if (actx) return;
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination); } catch { actx = null; }
  }
  function toggleSound() { soundOn = !soundOn; $('#btn-sound').textContent = soundOn ? 'Sound on' : 'Sound off'; }
  function hit(t, low, vol) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.setValueAtTime(low ? 120 : 260, t); o.frequency.exponentialRampToValueAtTime(low ? 48 : 140, t + 0.18);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (low ? 0.45 : 0.16));
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.5);
  }
  const pattern = [1, 0, 2, 0, 1, 2, 0, 2, 1, 0, 2, 0, 1, 0, 2, 2];
  function audioTick() {
    if (!actx) return;
    const d = Math.hypot(player.x - 46, player.z + 8);
    const target = soundOn ? Math.max(0, Math.min(1, (16 - d) / 10)) * 0.5 : 0;
    master.gain.setTargetAtTime(target, actx.currentTime, 0.4);
    if (target < 0.01) return;
    if (actx.state === 'suspended') actx.resume();
    while (nextBeat < actx.currentTime + 0.15) {
      if (nextBeat < actx.currentTime) nextBeat = actx.currentTime + 0.02;
      const p = pattern[step % 16]; if (p) hit(nextBeat, p === 1, p === 1 ? 0.9 : 0.35);
      step++; nextBeat += 0.16;
    }
  }

  // ---------------- loop ----------------
  const clock = new THREE.Clock(); let t = 0;
  const vel = new THREE.Vector2();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05); t += dt;
    if (started && !traveling && !ui.isOpen()) {
      let f = 0, s = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
      if (keys.has('KeyA')) s -= 1;
      if (keys.has('KeyD')) s += 1;
      if (keys.has('ArrowLeft')) player.yaw += 1.8 * dt;
      if (keys.has('ArrowRight')) player.yaw -= 1.8 * dt;
      if (joy.id !== null) { f -= joy.y; s += joy.x; }
      const len = Math.hypot(f, s); if (len > 1) { f /= len; s /= len; }
      const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 6.2 : 3.4;
      const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
      const tx = (-sin * f + cos * s) * speed, tz = (-cos * f - sin * s) * speed;
      vel.x += (tx - vel.x) * Math.min(1, dt * 9); vel.y += (tz - vel.y) * Math.min(1, dt * 9);
      player.x += vel.x * dt; player.z += vel.y * dt;
      world.collide(player, 0.36);
      const gy = heightAt(player.x, player.z) + EYE;
      player.y += (gy - player.y) * Math.min(1, dt * 12);
      updateRoom();
    }
    camera.position.set(player.x, player.y, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);

    sun.target.position.set(player.x, 0, player.z); sun.position.copy(sun.target.position).add(sunOffset);

    if (started && (locked || touch) && !ui.isOpen()) {
      const h = touch ? null : pick();
      if (h !== hover) {
        hover = h;
        $('#hover').textContent = hover ? labelFor(hover) : '';
        $('#hover').classList.toggle('show', !!hover);
        $('#crosshair').classList.toggle('active', !!hover);
      }
    }
    for (const fn of world.animated) fn(t);
    audioTick();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  // Debug hook for automated screenshots: ?at=roomId
  const at = new URLSearchParams(location.search).get('at');
  if (at) { const r = ROOMS.find((x) => x.id === at); if (r) { place(r.spawn); started = true; $('#intro').classList.add('hide'); updateRoom(true); } }
  const view = new URLSearchParams(location.search).get('view');
  if (view) { const [x, z, yaw, pitch] = view.split(',').map(Number); player.x = x; player.z = z; player.yaw = yaw; player.pitch = pitch || 0; player.y = heightAt(x, z) + EYE; }
  frame();
  window.__exhibition = { ui, travel, player };
  window.__ready = true;
}

boot();
