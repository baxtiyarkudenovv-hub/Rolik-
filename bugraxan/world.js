// Буғрахан 3D дүньясы: процедуралық текстуралар, жер рельефи, минара, харабалар, өсимликлер.
import * as THREE from 'three';

/* ---------- noise ---------- */
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const P = new Uint8Array(512); { const r = rng(7); const a = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } for (let i = 0; i < 512; i++) P[i] = a[i & 255]; }
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
function grad(h, x, y) { const g = h & 7, u = g < 4 ? x : y, v = g < 4 ? y : x; return ((g & 1) ? -u : u) + ((g & 2) ? -2 * v : 2 * v); }
export function noise(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y), A = P[X] + Y, B = P[X + 1] + Y;
  return .5 * ((1 - v) * ((1 - u) * grad(P[A], x, y) + u * grad(P[B], x - 1, y)) + v * ((1 - u) * grad(P[A + 1], x, y - 1) + u * grad(P[B + 1], x - 1, y - 1)));
}
export function fbm(x, y, o = 5) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); f *= 2.03; a *= .5; } return s; }

/* ---------- texture helpers ---------- */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// normal map from a grayscale height canvas
function normalFrom(hc, strength = 2) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = canvas(w, h), oc = out.getContext('2d'), id = oc.createImageData(w, h), d = id.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * .5 + .5) * 255; d[i + 1] = (dy / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  oc.putImageData(id, 0, 0); return out;
}
function tex(c, rep = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
  t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function noiseFill(ctx, w, h, sc, base, amp, oct = 4, seed = 0) {
  const id = ctx.createImageData(w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // tileable via 4-sample blend
    const u = x / w, v = y / h;
    const n = (fbm(x * sc + seed, y * sc, oct) * (1 - u) * (1 - v) + fbm((x - w) * sc + seed, y * sc, oct) * u * (1 - v) + fbm(x * sc + seed, (y - h) * sc, oct) * (1 - u) * v + fbm((x - w) * sc + seed, (y - h) * sc, oct) * u * v);
    const i = (y * w + x) * 4;
    for (let k = 0; k < 3; k++) d[i + k] = base[k] + n * amp[k];
    d[i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
}

/* ---------- takyr (cracked clay) + sand ---------- */
export function groundMaterial(opts = {}) {
  const S = 1024, r = rng(3);
  const col = canvas(S, S), hc = canvas(S, S), c = col.getContext('2d'), h = hc.getContext('2d');
  noiseFill(c, S, S, .008, [182, 150, 112], [70, 60, 50], 5, 0);
  noiseFill(h, S, S, .02, [150, 150, 150], [90, 90, 90], 4, 50);
  // cracks: polygonal net from jittered grid
  const N = 22, pts = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) pts.push([(i + (r() - .5) * .8) * S / N, (j + (r() - .5) * .8) * S / N]);
  const at = (i, j) => pts[((j % (N + 1)) + N + 1) % (N + 1) * (N + 1) + ((i % (N + 1)) + N + 1) % (N + 1)];
  const crack = (a, b) => {
    for (const [ctx, st, w] of [[c, 'rgba(80,58,36,.32)', 1.4], [h, 'rgba(20,20,20,.7)', 2]]) {
      ctx.strokeStyle = st; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      const n = 6; for (let k = 1; k <= n; k++) ctx.lineTo(a[0] + (b[0] - a[0]) * k / n + (r() - .5) * 8, a[1] + (b[1] - a[1]) * k / n + (r() - .5) * 8); ctx.stroke();
    }
  };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { crack(at(i, j), at(i + 1, j)); crack(at(i, j), at(i, j + 1)); }
  // pebbles & salt specks
  for (let i = 0; i < 2600; i++) {
    const x = r() * S, y = r() * S, s = .6 + r() * 2.4, salt = r() < .35;
    c.fillStyle = salt ? `rgba(240,235,222,${.25 + r() * .4})` : `rgba(${90 + r() * 60},${70 + r() * 40},${50 + r() * 30},.8)`;
    c.beginPath(); c.arc(x, y, s, 0, 7); c.fill();
    if (!salt) { h.fillStyle = 'rgba(255,255,255,.8)'; h.beginPath(); h.arc(x, y, s, 0, 7); h.fill(); }
  }
  const map = tex(col, opts.rep || 150), nrm = tex(normalFrom(hc, 2.2), opts.rep || 150, false);
  const m = new THREE.MeshStandardMaterial({ map, normalMap: nrm, normalScale: new THREE.Vector2(1, 1), roughness: .95, metalness: 0, vertexColors: true });
  return m;
}

/* ---------- fired brick texture for the minaret ---------- */
export function brickMaterial() {
  const Wt = 2048, Ht = 4096, r = rng(11);
  const col = canvas(Wt, Ht), hc = canvas(Wt, Ht), c = col.getContext('2d'), h = hc.getContext('2d');
  c.fillStyle = '#9c8466'; c.fillRect(0, 0, Wt, Ht); h.fillStyle = '#303030'; h.fillRect(0, 0, Wt, Ht);
  const rowH = 11, bw = 26;
  const bands = [[.12, .16], [.30, .345], [.47, .52], [.64, .685], [.80, .84], [.9, .93]]; // in v (bottom=0)
  for (let row = 0, y = Ht; y > 0; row++, y -= rowH) {
    const v = 1 - y / Ht, band = bands.findIndex(([a, b]) => v > a && v < b);
    const off = (row % 2) * bw / 2;
    for (let x = -bw + off; x < Wt; x += bw) {
      let tone = .8 + r() * .3; let R = 196, G = 160, B = 112;
      if (band >= 0) { // geometric ornament: rhombus lattice / zigzag via tone
        const k = Math.floor(x / bw), ph = (band % 2) ? (Math.abs(((k + row) % 8) - 4) < 1) : (((k + Math.floor(row / 2)) % 6) < 2);
        if (ph) { tone *= .72; R = 170; G = 128; B = 86; } else tone *= 1.07;
      }
      c.fillStyle = `rgb(${R * tone | 0},${G * tone | 0},${B * tone | 0})`;
      c.fillRect(x + 1.5, y - rowH + 1.5, bw - 3, rowH - 3);
      const hh = 170 + r() * 60; h.fillStyle = `rgb(${hh},${hh},${hh})`; h.fillRect(x + 1.5, y - rowH + 1.5, bw - 3, rowH - 3);
    }
    if (band >= 0 && (row % 7 === 0)) { c.fillStyle = 'rgba(60,40,22,.35)'; c.fillRect(0, y - 2, Wt, 2); }
  }
  // weathering: vertical rain streaks, dark base, salt efflorescence, missing bricks
  for (let i = 0; i < 260; i++) {
    const x = r() * Wt, y0 = r() * Ht * .9, len = 80 + r() * 600, g = c.createLinearGradient(0, y0, 0, y0 + len);
    g.addColorStop(0, 'rgba(50,35,20,0)'); g.addColorStop(.3, `rgba(50,35,20,${.08 + r() * .12})`); g.addColorStop(1, 'rgba(50,35,20,0)');
    c.fillStyle = g; c.fillRect(x, y0, 3 + r() * 14, len);
  }
  let g = c.createLinearGradient(0, Ht, 0, Ht * .75); g.addColorStop(0, 'rgba(232,226,210,.75)'); g.addColorStop(.4, 'rgba(232,226,210,.25)'); g.addColorStop(1, 'rgba(232,226,210,0)');
  c.fillStyle = g; c.fillRect(0, Ht * .75, Wt, Ht * .25);
  for (let i = 0; i < 900; i++) { const x = r() * Wt, y = Ht - r() ** 2 * Ht * .25; c.fillStyle = `rgba(240,236,224,${r() * .5})`; c.beginPath(); c.arc(x, y, 2 + r() * 12, 0, 7); c.fill(); }
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(r() * Wt / bw) * bw, y = Ht - Math.floor((r() ** 1.6) * Ht / rowH) * rowH, n = 1 + Math.floor(r() * 3);
    c.fillStyle = 'rgba(85,62,40,.75)'; c.fillRect(x, y - rowH * n, bw * (1 + Math.floor(r() * 2)), rowH * n);
    h.fillStyle = '#202020'; h.fillRect(x, y - rowH * n, bw * (1 + Math.floor(r() * 2)), rowH * n);
  }
  g = c.createLinearGradient(0, Ht, 0, Ht * .88); g.addColorStop(0, 'rgba(60,40,25,.45)'); g.addColorStop(1, 'rgba(60,40,25,0)'); c.fillStyle = g; c.fillRect(0, Ht * .88, Wt, Ht * .12);
  const map = tex(col, 1), nrm = tex(normalFrom(hc, 4), 1, false);
  map.repeat.set(1, 1); nrm.repeat.set(1, 1);
  return new THREE.MeshStandardMaterial({ map, normalMap: nrm, normalScale: new THREE.Vector2(1.3, 1.3), roughness: .9 });
}

/* ---------- pakhsa / mud-brick clay ---------- */
export function clayMaterial(tint = [168, 132, 96]) {
  const S = 512, r = rng(21), col = canvas(S, S), hc = canvas(S, S), c = col.getContext('2d'), h = hc.getContext('2d');
  noiseFill(c, S, S, .02, tint, [60, 50, 40], 5, 9); noiseFill(h, S, S, .03, [128, 128, 128], [120, 120, 120], 5, 19);
  for (let y = 0; y < S; y += 32 + r() * 12) { c.fillStyle = 'rgba(70,50,30,.18)'; c.fillRect(0, y, S, 2 + r() * 2); h.fillStyle = 'rgba(0,0,0,.5)'; h.fillRect(0, y, S, 3); }
  for (let i = 0; i < 70; i++) { const x = r() * S; c.strokeStyle = 'rgba(60,40,25,.25)'; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(x, 0); let xx = x; for (let y = 0; y < S * r(); y += 8) { xx += (r() - .5) * 6; c.lineTo(xx, y); } c.stroke(); }
  const m = new THREE.MeshStandardMaterial({ map: tex(col, 1), normalMap: tex(normalFrom(hc, 3), 1, false), roughness: 1 });
  return m;
}

/* ---------- terrain ---------- */
// city outline (≈ 60 ha) in metres, minaret at origin
export const CITY = [[-430, -380], [80, -440], [440, -330], [470, 60], [380, 400], [-60, 450], [-420, 360], [-480, -20]];
export const CITADEL = [[-120, -110], [130, -120], [150, 110], [-110, 130]];
function distSeg(px, pz, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - a[0] - t * dx, pz - a[1] - t * dz); }
export function distPoly(px, pz, poly) { let d = 1e9; for (let i = 0; i < poly.length; i++) d = Math.min(d, distSeg(px, pz, poly[i], poly[(i + 1) % poly.length])); return d; }
const MOUNDS = (() => { const r = rng(5), m = []; for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = 40 + r() * 380; m.push([Math.cos(a) * d, Math.sin(a) * d, 12 + r() * 40, .6 + r() * 3.2]); } return m; })();
export function height(x, z) {
  const R = Math.hypot(x, z);
  let y = fbm(x * .0012, z * .0012, 4) * 6 + fbm(x * .01, z * .01, 3) * .6;
  const w = distPoly(x, z, CITY); y += 4.2 * Math.exp(-(w * w) / (2 * 14 * 14)) * (1 + .4 * fbm(x * .02, z * .02, 2));
  const c = distPoly(x, z, CITADEL); y += 3 * Math.exp(-(c * c) / (2 * 9 * 9));
  for (const [mx, mz, rad, hh] of MOUNDS) { const d = Math.hypot(x - mx, z - mz); if (d < rad * 2.5) y += hh * Math.exp(-(d * d) / (2 * rad * rad)); }
  // dunes beyond the site
  const dz = Math.max(0, (R - 900) / 600); if (dz > 0) {
    const u = x * .7 + z * .7; y += Math.min(1, dz) * (Math.abs(Math.sin(u * .006 + fbm(x * .001, z * .001, 2) * 4)) * 14 + fbm(x * .004, z * .004, 3) * 8);
  }
  const flat = Math.exp(-(R * R) / (2 * 14 * 14)); return y * (1 - flat) + y * flat * .2;
}
export function terrain(mat) {
  const group = new THREE.Group();
  const mk = (size, seg, lowerInside) => {
    const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, colr = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i); let y = height(x, z);
      if (lowerInside && Math.hypot(x, z) < lowerInside) y -= 6;
      pos.setY(i, y);
      const n = fbm(x * .003 + 40, z * .003, 3), salt = Math.max(0, fbm(x * .008 + 9, z * .008, 3) - .15) * 1.2;
      colr[i * 3] = .95 + n * .25 + salt * .25; colr[i * 3 + 1] = .92 + n * .22 + salt * .28; colr[i * 3 + 2] = .88 + n * .2 + salt * .35;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colr, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
  };
  group.add(mk(1500, 300, 0)); group.add(mk(9000, 180, 700));
  return group;
}

/* ---------- minaret ---------- */
export function minaretMesh(mat, o = {}) {
  const H = o.h || 28, rb = o.rb || 4.3, rt = o.rt || 2.7, ruin = o.ruin ?? true;
  const pts = [];
  pts.push(new THREE.Vector2(0.01, 0)); pts.push(new THREE.Vector2(rb + .5, 0)); pts.push(new THREE.Vector2(rb + .5, .9)); pts.push(new THREE.Vector2(rb, 1.0));
  for (let i = 1; i <= 60; i++) { const t = i / 60; pts.push(new THREE.Vector2(rb + (rt - rb) * Math.pow(t, .92), 1 + (H - 1) * t)); }
  if (!ruin) { pts.push(new THREE.Vector2(rt + .45, H + .2)); pts.push(new THREE.Vector2(rt + .45, H + 1.4)); pts.push(new THREE.Vector2(rt * .7, H + 1.6)); pts.push(new THREE.Vector2(rt * .55, H + 3.2)); pts.push(new THREE.Vector2(.01, H + 4.6)); }
  else { pts.push(new THREE.Vector2(rt - .6, H)); pts.push(new THREE.Vector2(.01, H - .5)); }
  const g = new THREE.LatheGeometry(pts, 96);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x);
    if (ruin && y > H - 2.5) { // jagged broken top
      const k = (y - (H - 2.5)) / 2.5, drop = (fbm(a * 2.2 + 3, 1.7, 3) + .5) * 5.5 * k;
      pos.setY(i, y - Math.max(0, drop));
    }
    // erosion at the base and slight irregularity
    const rr = Math.hypot(x, z); if (rr > .1) { const e = 1 - (y < 3 ? .04 * (fbm(a * 5, y * .8, 3) + .5) : 0) + fbm(a * 3, y * .3, 2) * .012; pos.setX(i, x * e); pos.setZ(i, z * e); }
    uv.setXY(i, uv.getX(i) * 3, Math.min(1, y / H));
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}

/* ---------- ruins: mud walls & foundations ---------- */
export function ruins(mat) {
  const group = new THREE.Group(), r = rng(31);
  const wall = (x, z, len, h, th, rot) => {
    len = Math.min(len, 9); const sink = 2.5, HH = h + sink;
    const g = new THREE.BoxGeometry(len, HH, th, Math.ceil(len / .8), Math.ceil(HH / .6), 3), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), top = (Y + HH / 2) / HH;
      const prof = Math.max(0, 1 - Math.pow(Math.abs(X) / (len / 2), 2.5)); // tapered, eroded ends
      const er = (fbm(X * .35 + x, z * .1, 3) + .5);
      const yTop = -HH / 2 + sink + h * prof * (.55 + .45 * er);
      const ny = Y > 0 ? Math.min(Y, yTop) : Y;
      p.setY(i, Y > -HH / 2 + sink * .5 ? Math.min(ny, yTop) : Y);
      p.setZ(i, Z * (1 - Math.max(0, top - .3) * .55) + fbm(X * .5, Y * .5 + z, 2) * .25);
      p.setX(i, X + fbm(Y * .3, Z + x, 2) * .3);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.position.set(x, height(x, z) - sink + HH / 2 - .2, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; group.add(m);
  };
  // citadel walls near the minaret
  for (let i = 0; i < CITADEL.length; i++) {
    const a = CITADEL[i], b = CITADEL[(i + 1) % CITADEL.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = 5;
    for (let k = 0; k < n; k++) { if (r() < .3) continue; const t = (k + .5) / n, l = L / n * (.5 + r() * .45); wall(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, l, 2.5 + r() * 3.5, 2.6, -Math.atan2(b[1] - a[1], b[0] - a[0])); }
  }
  // house foundations scattered
  for (let i = 0; i < 46; i++) {
    const a = r() * 6.28, d = 16 + r() * 110, x = Math.cos(a) * d, z = Math.sin(a) * d, rot = r() * .3;
    const w = 4 + r() * 6, dd = 4 + r() * 6, hh = .4 + r() * 1.3;
    wall(x, z - dd / 2, w, hh, .7, rot); if (r() > .3) wall(x - w / 2, z, dd, hh * .9, .7, rot + Math.PI / 2); if (r() > .5) wall(x + w / 2, z, dd, hh * .7, .7, rot + Math.PI / 2);
  }
  // big outer wall fragments along the city ridge
  for (let i = 0; i < CITY.length; i++) {
    const a = CITY[i], b = CITY[(i + 1) % CITY.length];
    for (let k = 0; k < 6; k++) { if (r() < .5) continue; const t = r(); wall(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 8 + r() * 20, 3 + r() * 4, 4, -Math.atan2(b[1] - a[1], b[0] - a[0])); }
  }
  return group;
}

/* ---------- desert shrubs (saksawıl / jıńǵıl) ---------- */
export function shrubs(n = 1600, radius = 1300) {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); const k = .55 + (fbm(v.x * 2, v.y * 2 + v.z, 2) + .5) * .7; p.setXYZ(i, v.x * k, Math.max(-.2, v.y) * k * .8, v.z * k); }
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: '#6b6a4a', roughness: 1, flatShading: true });
  const im = new THREE.InstancedMesh(g, m, n), r = rng(41), M = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    let x, z; do { x = (r() - .5) * radius * 2; z = (r() - .5) * radius * 2; } while (Math.hypot(x, z) < 25);
    const s = .25 + r() * .6; q.setFromEuler(new THREE.Euler(0, r() * 6, 0));
    M.compose(new THREE.Vector3(x, height(x, z) + s * .25, z), q, new THREE.Vector3(s * (1 + r()), s, s * (1 + r())));
    im.setMatrixAt(i, M); c.setHSL(.12 + r() * .08, .12 + r() * .12, .36 + r() * .14); im.setColorAt(i, c);
  }
  im.castShadow = true; im.receiveShadow = true; return im;
}

/* ---------- pottery shards on the surface ---------- */
export function shards(n = 900) {
  const g = new THREE.CircleGeometry(.12, 5); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: '#a8623a', roughness: .8 });
  const im = new THREE.InstancedMesh(g, m, n), r = rng(51), M = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, d = 3 + r() ** .7 * 90, x = Math.cos(a) * d, z = Math.sin(a) * d, s = .5 + r() * 1.5;
    q.setFromEuler(new THREE.Euler((r() - .5) * .4, r() * 6, (r() - .5) * .4)); M.compose(new THREE.Vector3(x, height(x, z) + .03, z), q, new THREE.Vector3(s, 1, s * .7));
    im.setMatrixAt(i, M); c.setHSL(.04 + r() * .05, .45, .3 + r() * .2); im.setColorAt(i, c);
  }
  im.receiveShadow = true; return im;
}

export { canvas, tex, normalFrom, noiseFill };
