/* =====================================================================
   v3 — white & gold theme, pseudo-3D (projected quads), kinetic type,
   narrator-driven timeline. Depends on lib.js (helpers, icons, screens).
   ===================================================================== */
Object.assign(C, {
  acc: '#1f9d63', acc2: '#0e7c86', red: '#e0344d', yel: '#e0a82e', mut: '#5e6b70',
  ink: '#12302f', teal: '#095659', gold: '#c99a3a', xz: '#3f6f5c', xz2: '#72b977'
});
const GLASS = 'rgba(255,255,255,.82)';

/* ---------- assets ---------- */
const IMG = {};
const ASSETS = {
  emblem_top: '../assets/emblem_top.png', emblem_left: '../assets/emblem_left.png', emblem_right: '../assets/emblem_right.png',
  wordmark: '../assets/wordmark.png', since: '../assets/since.png',
  xazna_full: '../assets/xazna_full.png', xazna_icon: '../assets/xazna_icon.png', xazna_word: '../assets/xazna_word.png',
  mijoz: '../assets/media/mijoz_tasdiq.png', qulf: '../assets/media/telefon_qulf.png'
};
for (const [k, v] of Object.entries(ASSETS)) { const im = new Image(); im.src = v; IMG[k] = im; }
const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const CA = cnv(W, H), CB = cnv(W, H), TMP = cnv(W, H), PHC = cnv(440, 840), CARD = cnv(1320, 760), SHC = cnv(520, 580);
const T = {};      // tinted logo parts
const LOGO = cnv(1690, 440);
function tint(img, col) {
  const c = cnv(img.width, img.height), g = c.getContext('2d');
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return c;
}
const CARDS = {};
window.assetsReady = Promise.all(Object.values(IMG).map(im => im.decode())).then(() => {
  for (const n of ['emblem_top', 'emblem_left', 'emblem_right', 'wordmark']) T[n] = tint(IMG[n], C.teal);
  T.since = tint(IMG.since, '#b8892e');
  const g = LOGO.getContext('2d');
  ['emblem_top', 'emblem_left', 'emblem_right'].forEach(n => g.drawImage(T[n], 0, 0));
  g.drawImage(T.wordmark, 450, 10); g.drawImage(T.since, 450, 10);
  CARDS.mijoz = photoCard(IMG.mijoz, 1200, 675); CARDS.qulf = photoCard(IMG.qulf, 1200, 675);
});
function photoCard(img, w, h, zoom = 1, c = cnv(w + 28, h + 28)) {
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(0, 0, w + 28, h + 28, 26); g.fill();
  g.save(); g.beginPath(); g.roundRect(14, 14, w, h, 16); g.clip();
  const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
  const s = Math.max(w / iw, h / ih) * zoom;
  g.drawImage(img, 14 + w / 2 - iw * s / 2, 14 + h / 2 - ih * s / 2, iw * s, ih * s);
  g.restore();
  g.strokeStyle = '#d4ab55'; g.lineWidth = 3; g.beginPath(); g.roundRect(7, 7, w + 14, h + 14, 20); g.stroke();
  return c;
}

/* ---------- 3D projection (textured, subdivided quads) ---------- */
const PERSP = 1800;
function rot3(px, py, pz, rx, ry, rz) {
  let c = Math.cos(rz), s = Math.sin(rz); const x1 = px * c - py * s, y1 = px * s + py * c;
  c = Math.cos(rx); s = Math.sin(rx); const y2 = y1 * c - pz * s, z2 = y1 * s + pz * c;
  c = Math.cos(ry); s = Math.sin(ry); return [x1 * c + z2 * s, y2, -x1 * s + z2 * c];
}
function proj(cx, cy, px, py, o) {
  const [a, b, c] = rot3(px, py, 0, o.rx || 0, o.ry || 0, o.rz || 0);
  const f = PERSP / (PERSP + c + (o.z || 0)); return [cx + (a + (o.ox || 0)) * f, cy + b * f];
}
function corners(cx, cy, w, h, o) { return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => proj(cx, cy, u * w / 2, v * h / 2, o)); }
function tri(img, p0, p1, p2) {
  const mx = (p0[0] + p1[0] + p2[0]) / 3, my = (p0[1] + p1[1] + p2[1]) / 3;
  const ex = p => { const dx = p[0] - mx, dy = p[1] - my, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * .8, p[1] + dy / l * .8]; };
  const a = ex(p0), b = ex(p1), c = ex(p2);
  x.save(); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.closePath(); x.clip();
  const [x0, y0, u0, v0] = p0, [x1, y1, u1, v1] = p1, [x2, y2, u2, v2] = p2;
  const dl = u0 * v1 + v0 * u2 + u1 * v2 - v1 * u2 - v0 * u1 - u0 * v2;
  if (Math.abs(dl) < 1e-6) { x.restore(); return; }
  x.transform(
    (x0 * v1 + v0 * x2 + x1 * v2 - v1 * x2 - v0 * x1 - x0 * v2) / dl,
    (y0 * v1 + v0 * y2 + y1 * v2 - v1 * y2 - v0 * y1 - y0 * v2) / dl,
    (u0 * x1 + x0 * u2 + u1 * x2 - x1 * u2 - x0 * u1 - u0 * x2) / dl,
    (u0 * y1 + y0 * u2 + u1 * y2 - y1 * u2 - y0 * u1 - u0 * y2) / dl,
    (u0 * v1 * x2 + v0 * x1 * u2 + x0 * u1 * v2 - x0 * v1 * u2 - v0 * u1 * x2 - u0 * x1 * v2) / dl,
    (u0 * v1 * y2 + v0 * y1 * u2 + y0 * u1 * v2 - y0 * v1 * u2 - v0 * u1 * y2 - u0 * y1 * v2) / dl);
  x.drawImage(img, 0, 0); x.restore();
}
const QT = cnv(W, H);
function quad3D(src, cx, cy, w, h, o = {}) {
  const al = o.alpha ?? 1;
  if (al < .999 && !o._inner) { // render opaque off-screen, then fade as one layer (avoids seam lines)
    if (al <= 0) return corners(cx, cy, w, h, o);
    const prev = x, tr = x.getTransform(), q = QT.getContext('2d');
    q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, W, H); q.setTransform(tr);
    x = q; const cs = quad3D(src, cx, cy, w, h, { ...o, alpha: 1, _inner: true }); x = prev;
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha *= al; x.drawImage(QT, 0, 0); x.restore();
    return cs;
  }
  const nx = o.nx || 8, ny = o.ny || 8, sw = src.width, sh = src.height, P = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / ny, q = proj(cx, cy, (u - .5) * w, (v - .5) * h, o); P.push([q[0], q[1], u * sw, v * sh]);
  }
  const cs = corners(cx, cy, w, h, o);
  x.save(); x.globalAlpha *= (o.alpha ?? 1);
  if (o.shadow) {
    x.save(); x.shadowColor = 'rgba(70,48,10,.35)'; x.shadowBlur = 60; x.shadowOffsetY = 34;
    x.fillStyle = 'rgba(255,255,255,1)'; x.beginPath(); cs.forEach((c, k) => k ? x.lineTo(c[0], c[1]) : x.moveTo(c[0], c[1])); x.closePath(); x.fill(); x.restore();
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = P[j * (nx + 1) + i], b = P[j * (nx + 1) + i + 1], c = P[(j + 1) * (nx + 1) + i + 1], d = P[(j + 1) * (nx + 1) + i];
    tri(src, a, b, c); tri(src, a, c, d);
  }
  if (o.sheen) { // moving specular highlight
    const g = x.createLinearGradient(cs[0][0], cs[0][1], cs[2][0], cs[2][1]);
    const k = cl(.5 - (o.ry || 0) * 1.2 + (o.sheenOff || 0), .05, .95);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(k, `rgba(255,255,255,${.22 * o.sheen})`); g.addColorStop(Math.min(1, k + .12), 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); cs.forEach((c, k) => k ? x.lineTo(c[0], c[1]) : x.moveTo(c[0], c[1])); x.closePath(); x.fill();
  }
  x.restore();
  return cs;
}

/* ---------- phone in 3D ---------- */
function phoneBody(content) {
  const X = 220, Y = 420;
  x.save(); x.translate(X, Y);
  const g = x.createLinearGradient(-PW / 2, -PH / 2, PW / 2, PH / 2);
  g.addColorStop(0, '#e9ecef'); g.addColorStop(.3, '#8a9099'); g.addColorStop(.7, '#3c424b'); g.addColorStop(1, '#b7bcc4');
  x.fillStyle = g; rr(-PW / 2 - 6, -PH / 2 - 6, PW + 12, PH + 12, 60); x.fill();
  x.fillStyle = '#0d1016'; rr(-PW / 2, -PH / 2, PW, PH, 56); x.fill();
  const sx = -PW / 2 + 16, sy = -PH / 2 + 16, sw = PW - 32, sh = PH - 32;
  x.save(); rr(sx, sy, sw, sh, 44); x.clip();
  const bgG = x.createLinearGradient(0, sy, 0, sy + sh); bgG.addColorStop(0, '#f5f8f6'); bgG.addColorStop(1, '#e6eeea');
  x.fillStyle = bgG; x.fillRect(sx, sy, sw, sh);
  content(sx, sy, sw, sh);
  x.restore();
  x.save(); rr(sx, sy, sw, sh, 44); x.clip();
  const sk = cl(.5 - PHONE_RY * 1.4, -.2, 1.2), gl = x.createLinearGradient(sx, sy, sx + sw, sy + sh);
  gl.addColorStop(cl(sk - .15), 'rgba(255,255,255,0)'); gl.addColorStop(cl(sk), 'rgba(255,255,255,.22)'); gl.addColorStop(cl(sk + .12), 'rgba(255,255,255,0)');
  x.fillStyle = gl; x.fillRect(sx, sy, sw, sh); x.restore();
  x.fillStyle = '#0d1016'; rr(-60, -PH / 2 + 26, 120, 30, 15); x.fill();
  x.restore();
}
let PHONE_RY = 0;
function phone3D(X, Y, s, content, o = {}) {
  const prev = x; x = PHC.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, 440, 840);
  PHONE_RY = o.ry || 0; phoneBody(content); x = prev;
  const a = o.alpha ?? 1;
  x.save(); x.globalAlpha *= a * .5;
  const fy = Y + 430 * s, sg = x.createRadialGradient(X, fy, 10, X, fy, 260 * s);
  sg.addColorStop(0, 'rgba(70,48,10,.6)'); sg.addColorStop(1, 'rgba(70,48,10,0)');
  x.fillStyle = sg; x.beginPath(); x.ellipse(X, fy, 260 * s, 46 * s, 0, 0, 7); x.fill(); x.restore();
  if (o.glow) glowCircle(X, Y, 520 * s, o.glow, a * .8);
  quad3D(PHC, X, Y + (o.dy || 0), 440 * s, 840 * s, { ry: o.ry || 0, rx: o.rx || 0, rz: o.rz || 0, z: o.z || 0, nx: 6, ny: 10, alpha: a });
}

/* ---------- app screens restyled with Xazna branding ---------- */
function appHeader(sx, sy, sw, title) {
  x.fillStyle = '#fff'; x.fillRect(sx, sy, sw, 150);
  statusBar(sx, sy, sw, false);
  if (title === 'Xazna') x.drawImage(IMG.xazna_full, sx + 28, sy + 84, 180, 180 * 323 / 1675);
  else { x.drawImage(IMG.xazna_icon, sx + 26, sy + 86, 36, 36 * 323 / 335); txt(title, sx + 74, sy + 105, 26, '#1d2b2a', { al: 'left', w: 800 }); }
  x.fillStyle = '#e3ebe7'; x.fillRect(sx, sy + 148, sw, 2);
}
function appHome(sx, sy, sw, sh, lt) {
  appHeader(sx, sy, sw, 'Xazna');
  const g = x.createLinearGradient(sx, sy + 170, sx + sw, sy + 320);
  g.addColorStop(0, '#2f5f4d'); g.addColorStop(1, '#4f8f6c');
  x.fillStyle = g; x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 18; rr(sx + 22, sy + 168, sw - 44, 150, 22); x.fill(); x.shadowBlur = 0;
  txt('Asosiy hisob', sx + 48, sy + 205, 18, 'rgba(255,255,255,.8)', { al: 'left', w: 500 });
  txt('2 450 000 so‘m', sx + 48, sy + 250, 32, '#fff', { al: 'left', w: 800 });
  txt('**** 4821', sx + 48, sy + 290, 16, 'rgba(255,255,255,.8)', { al: 'left', w: 500 });
  ['O‘tkazma', 'To‘lov', 'Kartalar', 'Kredit'].forEach((it, i) => {
    const cx = sx + 60 + i * 82, cy = sy + 370;
    x.fillStyle = '#e1f0e6'; x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.fill();
    x.fillStyle = C.xz; x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.fill();
    txt(it, cx, cy + 50, 14, '#33415e', { w: 600 });
  });
  for (let i = 0; i < 4; i++) {
    x.fillStyle = '#fff'; rr(sx + 24, sy + 460 + i * 74, sw - 48, 60, 14); x.fill();
    x.fillStyle = '#e5ebf0'; x.beginPath(); x.arc(sx + 60, sy + 490 + i * 74, 18, 0, 7); x.fill();
    x.fillStyle = '#ccd6de'; rr(sx + 92, sy + 480 + i * 74, 140, 10, 5); x.fill(); rr(sx + 92, sy + 497 + i * 74, 90, 8, 4); x.fill();
  }
}

/* ---------- background: white / gold, 3D floor, silk lines, bokeh ---------- */
function bg(t, tint = 0) {
  const g = x.createRadialGradient(W * .5, H * .38, 40, W * .5, H * .5, H * 1.2);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.45, '#faf6ec'); g.addColorStop(1, '#e7d7b5');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  glowCircle(W * (.18 + .08 * Math.sin(t * .13)), H * .12, 760, 'rgba(255,224,150,.38)');
  glowCircle(W * (.86 + .05 * Math.cos(t * .11)), H * .92, 820, 'rgba(226,186,104,.28)');
  // perspective floor grid
  const hz = H * .66;
  x.save(); x.strokeStyle = '#b8892e'; x.lineWidth = 1.2;
  for (let i = -24; i <= 24; i++) { x.globalAlpha = .09; x.beginPath(); x.moveTo(W / 2 + i * 34, hz); x.lineTo(W / 2 + i * 380, H + 40); x.stroke(); }
  const off = (t * .22) % 1;
  for (let j = 0; j < 14; j++) {
    const z = (j + off) / 14, yy = hz + (H - hz) * Math.pow(z, 2.3);
    x.globalAlpha = .12 * z; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke();
  }
  x.restore();
  const hg = x.createLinearGradient(0, hz - 2, 0, hz + 170); hg.addColorStop(0, 'rgba(250,245,233,1)'); hg.addColorStop(1, 'rgba(250,245,233,0)');
  x.fillStyle = hg; x.fillRect(0, hz - 2, W, 172);
  // silk gold lines
  x.save(); x.lineWidth = 2;
  for (let k = 0; k < 5; k++) {
    x.beginPath();
    for (let xx = -40; xx <= W + 40; xx += 24) {
      const yy = H * .86 + k * 16 + Math.sin(xx * .0028 + t * .45 + k * .7) * 55 + Math.sin(xx * .0011 - t * .3 + k) * 35;
      xx === -40 ? x.moveTo(xx, yy) : x.lineTo(xx, yy);
    }
    x.strokeStyle = `rgba(196,150,58,${.22 - .035 * k})`; x.stroke();
    x.beginPath();
    for (let xx = -40; xx <= W * .7; xx += 24) {
      const yy = H * .08 + k * 14 + Math.sin(xx * .003 - t * .4 + k * .9) * 40;
      xx === -40 ? x.moveTo(xx, yy) : x.lineTo(xx, yy);
    }
    x.strokeStyle = `rgba(196,150,58,${.14 - .025 * k})`; x.stroke();
  }
  x.restore();
  // bokeh
  for (let i = 0; i < 30; i++) {
    const px = rnd(i + 700) * W + Math.sin(t * .2 + i) * 40;
    const py = ((rnd(i + 800) * H * 1.2 - t * (8 + rnd(i) * 18)) % (H * 1.2) + H * 1.2) % (H * 1.2) - H * .1;
    const r = 5 + rnd(i + 900) * 26, a = .18 + .2 * Math.abs(Math.sin(t * .7 + i));
    const bg2 = x.createRadialGradient(px, py, 0, px, py, r);
    bg2.addColorStop(0, `rgba(232,190,95,${a})`); bg2.addColorStop(.7, `rgba(232,190,95,${a * .4})`); bg2.addColorStop(1, 'rgba(232,190,95,0)');
    x.fillStyle = bg2; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  if (tint > 0) {
    const v = x.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .95);
    v.addColorStop(0, 'rgba(224,52,77,0)'); v.addColorStop(1, `rgba(224,52,77,${.16 * tint})`);
    x.fillStyle = v; x.fillRect(0, 0, W, H);
  }
  const v = x.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.1);
  v.addColorStop(0, 'rgba(120,90,30,0)'); v.addColorStop(1, 'rgba(120,90,30,.18)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
}

/* ---------- kinetic typography ---------- */
function goldFill(size) {
  const g = x.createLinearGradient(0, -size * .78, 0, size * .12);
  g.addColorStop(0, '#e2bb62'); g.addColorStop(.4, '#b07f25'); g.addColorStop(.5, '#f3d991'); g.addColorStop(.62, '#a8761d'); g.addColorStop(1, '#6e4a0e');
  return g;
}
/* kt: per-character animated text. modes: flip (rotateX), pop, drop, slide, glitch */
function kt(str, X, Y, size, lt, start, o = {}) {
  const w = o.w || 800, stg = o.stg ?? .028, dur = o.dur ?? .6, ls = o.ls || 0, mode = o.mode || 'flip';
  x.save(); x.font = `${w} ${size}px ${F}`; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  const ch = [...str], ws = ch.map(c => x.measureText(c).width + ls), tw = ws.reduce((a, b) => a + b, 0) - ls;
  let cx = o.al === 'center' ? X - tw / 2 : o.al === 'right' ? X - tw : X;
  const base = Y + size * .34;
  if (o.hl) {
    const hs = start + ch.length * stg * .5, hk = eio(p(lt, hs, hs + .45));
    if (hk > 0) { x.fillStyle = o.hl; rr(cx - size * .18, Y - size * .5, (tw + size * .36) * hk, size * 1.02, size * .14); x.fill(); }
  }
  if (o.underline) {
    const hs = start + ch.length * stg, hk = eio(p(lt, hs, hs + .5));
    if (hk > 0) { const g = x.createLinearGradient(cx, 0, cx + tw, 0); g.addColorStop(0, '#b8892e'); g.addColorStop(1, '#f1d27c'); x.fillStyle = g; rr(cx, Y + size * .5, tw * hk, Math.max(4, size * .07), 3); x.fill(); }
  }
  ch.forEach((c, i) => {
    const k = p(lt, start + i * stg, start + i * stg + dur);
    if (k <= 0 || c === ' ') { cx += ws[i]; return; }
    const e = back(k), eo_ = eo(k);
    x.save(); x.globalAlpha *= Math.min(1, k * 2.4) * (o.a ?? 1); x.translate(cx + ws[i] / 2, base);
    if (mode === 'flip') { x.translate(0, (1 - eo_) * size * .55); x.scale(1, Math.max(.02, e)); }
    else if (mode === 'pop') { const s = Math.max(.01, e); x.scale(s, s); }
    else if (mode === 'drop') { x.translate(0, -(1 - eo_) * size * 1.3); x.rotate((1 - eo_) * (rnd(i * 3.1) - .5) * 1.4); }
    else if (mode === 'slide') { x.translate((1 - eo_) * size * 1.5, 0); x.scale(Math.max(.02, eo_), 1); }
    else if (mode === 'glitch') {
      if (k < .9) { x.translate((rnd(i + Math.floor(lt * 24)) - .5) * size * .5 * (1 - k), (rnd(i * 7 + Math.floor(lt * 24)) - .5) * size * .2 * (1 - k)); }
    }
    const ox = -ws[i] / 2 + ls / 2;
    if (o.ext) for (let d = o.ext; d > 0; d--) { x.fillStyle = o.extCol || '#8c6116'; x.fillText(c, ox + d * .55, d); }
    if (mode === 'glitch' && k < .9) {
      x.globalAlpha *= .6; x.fillStyle = 'rgba(0,200,255,.8)'; x.fillText(c, ox - 6, 0); x.fillStyle = 'rgba(255,0,80,.8)'; x.fillText(c, ox + 6, 0); x.globalAlpha /= .6;
    }
    x.shadowColor = o.glow || 'rgba(70,45,0,.22)'; x.shadowBlur = o.sb ?? 16; x.shadowOffsetY = o.glow ? 0 : 7;
    x.fillStyle = o.gold ? goldFill(size) : (o.color || C.ink);
    x.fillText(c, ox, 0);
    x.restore(); cx += ws[i];
  });
  x.restore();
  return tw;
}
function tw(str, size, w = 800, ls = 0) { x.save(); x.font = `${w} ${size}px ${F}`; const m = [...str].reduce((a, c) => a + x.measureText(c).width + ls, 0) - ls; x.restore(); return m; }
/* glass chip with a big keyword and a small descriptor, flips in */
function chip(lt, start, X, Y, wdt, big, small, col, icon) {
  const k = p(lt, start, start + .7); if (k <= 0) return;
  const e = back(k);
  x.save(); x.translate(X + wdt / 2, Y); x.scale(1, Math.max(.02, e)); x.translate(-X - wdt / 2, -Y);
  x.globalAlpha *= Math.min(1, k * 2);
  x.shadowColor = 'rgba(80,55,10,.22)'; x.shadowBlur = 30; x.shadowOffsetY = 12;
  x.fillStyle = GLASS; rr(X, Y - 56, wdt, 112, 22); x.fill(); x.shadowBlur = 0; x.shadowOffsetY = 0;
  x.strokeStyle = 'rgba(201,154,58,.55)'; x.lineWidth = 2; x.stroke();
  x.fillStyle = col; rr(X, Y - 56, 10, 112, 5); x.fill();
  x.restore();
  let tx = X + 36;
  if (icon) { const ik = back(p(lt, start + .2, start + .7)); if (ik > 0) { x.save(); x.translate(X + 72, Y); x.scale(ik, ik); icon(); x.restore(); } tx = X + 128; }
  kt(big, tx, Y - 14, 46, lt, start + .25, { w: 900, color: col, stg: .02, mode: 'slide', sb: 8 });
  kt(small, tx, Y + 30, 24, lt, start + .45, { w: 500, color: C.mut, stg: .008, mode: 'flip', sb: 0 });
}
function goldBar(lt, start, X, Y, w = 260) {
  const k = eio(p(lt, start, start + .7)); if (k <= 0) return;
  const g = x.createLinearGradient(X, 0, X + w, 0); g.addColorStop(0, '#b8892e'); g.addColorStop(1, 'rgba(241,210,124,.2)');
  x.fillStyle = g; rr(X, Y, w * k, 6, 3); x.fill();
}
function sparkle(X, Y, r, a) {
  if (a <= 0) return; x.save(); x.globalAlpha *= a; x.translate(X, Y);
  x.fillStyle = '#fff6d6'; x.shadowColor = '#f3cf6e'; x.shadowBlur = 20;
  x.beginPath(); x.moveTo(0, -r); x.quadraticCurveTo(0, 0, r, 0); x.quadraticCurveTo(0, 0, 0, r); x.quadraticCurveTo(0, 0, -r, 0); x.quadraticCurveTo(0, 0, 0, -r); x.fill(); x.restore();
}
function confetti(lt, t0, cx, cy, n = 70) {
  for (let i = 0; i < n; i++) {
    const k = p(lt, t0, t0 + 2.6); if (k <= 0 || k >= 1) continue;
    const a = rnd(i) * 6.283, sp = 250 + rnd(i + 1) * 650, r = eo(k) * sp;
    x.save(); x.globalAlpha = 1 - k; x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .7 + k * k * 260); x.rotate(k * 9 + i); x.scale(1, Math.cos(k * 12 + i));
    x.fillStyle = ['#d5a64a', '#f3d98c', '#0e7c86', '#fff', '#b8892e'][i % 5]; x.fillRect(-8, -4, 16, 8); x.restore();
  }
}

/* ---------- shield (3D card) ---------- */
function drawShieldCard(lt) {
  const prev = x; x = SHC.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 520, 580);
  const X = 260, Y = 300, s = 2;
  x.save(); shieldPath(X, Y, s);
  const g = x.createLinearGradient(X - 190, Y - 220, X + 190, Y + 230);
  g.addColorStop(0, '#13909a'); g.addColorStop(.6, '#095659'); g.addColorStop(1, '#063b3e');
  x.fillStyle = g; x.fill();
  x.lineWidth = 16; const gg = x.createLinearGradient(X - 200, Y - 220, X + 200, Y + 230);
  gg.addColorStop(0, '#f6dc8c'); gg.addColorStop(.5, '#b8892e'); gg.addColorStop(1, '#f3d27a'); x.strokeStyle = gg; x.stroke();
  shieldPath(X, Y, s * .8); x.strokeStyle = 'rgba(243,210,122,.45)'; x.lineWidth = 4; x.stroke();
  x.restore();
  check(X, Y + 10, 110, 1, '#f6dc8c', 26);
  x = prev;
}

/* ---------- logo assets placement ---------- */
const LS = .82;
const LTL = { x: W / 2 - 1690 * LS / 2, y: H / 2 - 40 - 440 * LS / 2 };
const EFX = LTL.x + 175 * LS, EFY = LTL.y + 220 * LS;
function rays(cx, cy, a, lt, col = '226,180,90') {
  if (a <= 0) return;
  x.save(); x.globalAlpha *= a * .32; x.translate(cx, cy); x.rotate(lt * .1);
  for (let i = 0; i < 20; i++) {
    x.rotate(Math.PI * 2 / 20);
    const g = x.createLinearGradient(0, 0, 1300, 0); g.addColorStop(0, `rgba(${col},.85)`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(1300, -80); x.lineTo(1300, 80); x.fill();
  }
  x.restore(); glowCircle(cx, cy, 560, `rgba(255,235,180,.55)`, a);
}
function flareH(cx, cy, a, len = 1400) {
  if (a <= 0) return;
  x.save(); x.globalAlpha = a;
  const g = x.createLinearGradient(cx - len, 0, cx + len, 0);
  g.addColorStop(0, 'rgba(240,200,110,0)'); g.addColorStop(.5, 'rgba(255,248,220,.95)'); g.addColorStop(1, 'rgba(240,200,110,0)');
  x.fillStyle = g; x.fillRect(cx - len, cy - 4, len * 2, 8); x.globalAlpha = a * .45; x.fillRect(cx - len, cy - 18, len * 2, 36);
  x.restore(); glowCircle(cx, cy, 200, 'rgba(255,240,200,.95)', a);
}
function shimmer(src, tlx, tly, w, h, k) {
  if (k <= 0 || k >= 1) return;
  const t = TMP.getContext('2d'); t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, W, H);
  t.drawImage(src, tlx, tly, w, h); t.globalCompositeOperation = 'source-in';
  const bx = lerp(tlx - 300, tlx + w + 300, k), g = t.createLinearGradient(bx - 150, 0, bx + 150, 0);
  g.addColorStop(0, 'rgba(255,230,160,0)'); g.addColorStop(.5, 'rgba(255,236,170,1)'); g.addColorStop(1, 'rgba(255,230,160,0)');
  t.fillStyle = g; t.fillRect(0, 0, W, H); x.drawImage(TMP, 0, 0);
}
function reflection(src, tlx, tly, w, h, a = .14) {
  const t = TMP.getContext('2d'); t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, W, H);
  t.save(); t.translate(0, 2 * (tly + h) + 12); t.scale(1, -1); t.drawImage(src, tlx, tly, w, h); t.restore();
  t.globalCompositeOperation = 'destination-in';
  const g = t.createLinearGradient(0, tly + h + 12, 0, tly + h + 12 + h * .7); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  t.fillStyle = g; t.fillRect(0, 0, W, H);
  x.save(); x.globalAlpha *= a; x.drawImage(TMP, 0, 0); x.restore();
}

/* =========================== SCENES =========================== */
const PIECES = [['emblem_top', 0, -950, -1.3, 2.2], ['emblem_left', -1100, 700, 1.5, 2.6], ['emblem_right', 1100, 700, -1.5, 2.6]];
function sLogo(lt, d) {
  bg(lt);
  const IMP = 1.9;
  for (let i = 0; i < 150; i++) {
    const a = rnd(i) * 6.283, r0 = 700 + rnd(i + 11) * 700, k = eio(p(lt, rnd(i + 9) * .7, IMP));
    if (k <= 0 || k >= 1) continue;
    const r = r0 * (1 - k), tl = 30 + 170 * Math.sin(k * Math.PI);
    x.strokeStyle = `rgba(196,146,48,${.55 * Math.sin(k * Math.PI)})`; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); x.lineTo(W / 2 + Math.cos(a) * (r + tl), H / 2 + Math.sin(a) * (r + tl)); x.stroke();
  }
  const m = eio(p(lt, 2.7, 3.6));
  const ecx = lerp(W / 2, EFX, m), ecy = lerp(H / 2 - 10, EFY, m), es = lerp(1.35, LS, m);
  rays(ecx, ecy, p(lt, IMP, IMP + .5) * (1 - .55 * m), lt);
  const glow = 60 * (1 - p(lt, IMP, IMP + 1.2)) + 10;
  PIECES.forEach(([n, ox, oy, or, zs], j) => {
    const k = p(lt, .8 + j * .15, IMP); if (k <= 0) return;
    const e = k * k * (3 - 2 * k);
    for (let g = 5; g >= 0; g--) {
      const kk = Math.max(0, e - g * .045 * (1 - e) * 2), sc = es * (1 + (zs - 1) * (1 - kk) * (1 - kk));
      x.save(); x.globalAlpha = g ? .13 * (1 - e) : 1;
      x.translate(ecx + ox * (1 - kk), ecy + oy * (1 - kk)); x.rotate(or * (1 - kk) * (1 - kk)); x.scale(sc, sc);
      if (!g) { x.shadowColor = 'rgba(230,180,80,.9)'; x.shadowBlur = glow; }
      x.drawImage(T[n], -175, -220); x.restore();
    }
  });
  if (lt > IMP) {
    for (let r = 0; r < 3; r++) {
      const k = eo(p(lt, IMP + r * .14, IMP + 1.2 + r * .14));
      if (k > 0 && k < 1) { x.strokeStyle = `rgba(201,154,58,${(1 - k) * .75})`; x.lineWidth = 10 * (1 - k) + 1; x.beginPath(); x.ellipse(W / 2, H / 2 - 10, 120 + k * 1150, (120 + k * 1150) * (.35 + .65 * (1 - r * .25)), 0, 0, 7); x.stroke(); }
    }
    flareH(W / 2, H / 2 - 10, 1 - p(lt, IMP, IMP + 1));
    const f = 1 - p(lt, IMP, IMP + .4); if (f > 0) { x.fillStyle = `rgba(255,252,240,${f * .9})`; x.fillRect(0, 0, W, H); }
  }
  const rv = eio(p(lt, 3.2, 4.2));
  const wx = LTL.x + 450 * LS, wy = LTL.y + 10 * LS, ww = 1240 * LS;
  if (rv > 0) {
    x.save(); x.beginPath(); x.rect(wx - 20, 0, (ww + 40) * rv, H); x.clip();
    x.shadowColor = 'rgba(80,55,10,.25)'; x.shadowBlur = 16; x.shadowOffsetY = 8;
    x.drawImage(T.wordmark, wx, wy, ww, 430 * LS); x.restore();
    const ex = wx - 20 + (ww + 40) * rv, ba = Math.sin(rv * Math.PI);
    if (ba > .01) {
      const g = x.createLinearGradient(ex - 70, 0, ex + 20, 0); g.addColorStop(0, 'rgba(240,200,110,0)'); g.addColorStop(1, `rgba(255,240,200,${ba})`);
      x.fillStyle = g; x.fillRect(ex - 70, wy - 40, 90, 430 * LS + 80); flareH(ex, wy + 160 * LS, ba * .7, 520);
    }
  }
  const sk = eo(p(lt, 4.1, 4.8));
  if (sk > 0) { x.save(); x.globalAlpha = sk; x.drawImage(T.since, wx, wy + (1 - sk) * 25, ww, 430 * LS); x.restore(); }
  if (lt > 4.6) reflection(LOGO, LTL.x, LTL.y, 1690 * LS, 440 * LS, .12 * p(lt, 4.6, 5.3));
  shimmer(LOGO, LTL.x, LTL.y, 1690 * LS, 440 * LS, p(lt, 4.9, 5.9));
  for (let i = 0; i < 6; i++) sparkle(LTL.x + rnd(i + 40) * 1690 * LS, LTL.y + rnd(i + 50) * 440 * LS, 18 + rnd(i) * 16, Math.sin(p(lt, 5 + i * .12, 5.6 + i * .12) * Math.PI));
}

function s1(lt, d) {
  bg(lt);
  const cx = W / 2, cy = 330;
  drawShieldCard(lt);
  const ek = eo(p(lt, 0, 1.3));
  const ry = (1 - ek) * -1.6 + Math.sin(lt * .9) * .35 * ek;
  // orbit icons behind / front
  const orb = (front) => {
    for (let i = 0; i < 4; i++) {
      const a = lt * 1.1 + i * 1.571, z = Math.sin(a), k = eo(p(lt, .8, 1.8));
      if ((z > 0) !== front) continue;
      const f = 1 + z * .25, ox = cx + Math.cos(a) * 360 * k, oy = cy + 40 + Math.sin(a) * 70 * k;
      x.save(); x.globalAlpha = k * (front ? 1 : .6); x.translate(ox, oy); x.scale(f, f);
      [() => lockIcon(0, 0, .8, '#c99a3a'), () => cardIcon(0, 0, .8), () => keyIcon(0, 0, .9), () => pinIcon(0, 0, .7)][i]();
      x.restore();
    }
  };
  orb(false);
  glowCircle(cx, cy, 330, 'rgba(255,225,150,.6)', ek);
  quad3D(SHC, cx, cy, 260 * 1.45, 290 * 1.45, { ry, nx: 6, ny: 6, alpha: ek, z: (1 - ek) * 900 });
  orb(true);
  kt('AKSIYADORLIK TIJORAT XALQ BANKI', cx, 585, 34, lt, .5, { al: 'center', w: 800, ls: 7, color: '#9a7224', stg: .018, sb: 0 });
  kt('KIBERXAVFSIZLIK', cx, 700, 130, lt, 2.9, { al: 'center', w: 900, color: C.teal, ext: 9, extCol: '#b8892e', stg: .045, dur: .7 });
  const pk = p(lt, 5.1, 5.7);
  if (pk > 0) {
    const e = back(pk), pw = 880;
    x.save(); x.translate(cx, 860); x.scale(1, Math.max(.02, e)); x.globalAlpha = Math.min(1, pk * 2);
    x.shadowColor = 'rgba(224,52,77,.45)'; x.shadowBlur = 40; x.shadowOffsetY = 12;
    const g = x.createLinearGradient(-pw / 2, 0, pw / 2, 0); g.addColorStop(0, '#d42a45'); g.addColorStop(1, '#f2566b');
    x.fillStyle = g; rr(-pw / 2, -50, pw, 100, 50); x.fill(); x.restore();
    warnTri(cx - 360, 862, .48, '#fff', Math.min(1, pk * 2));
    kt('MIJOZLARGA OGOHLANTIRISH!', cx + 40, 860, 50, lt, 5.35, { al: 'center', w: 900, color: '#fff', mode: 'pop', stg: .02, sb: 0 });
  }
}

function s2(lt, d) {
  const danger = p(lt, 2.4, 3.8);
  bg(lt, danger * (.7 + .3 * Math.sin(lt * 5)));
  const px = 520, py = 540, inK = eo(p(lt, 0, 1.2));
  const shake = lt > 2.5 && lt < 3.5 ? Math.sin(lt * 80) * .03 : 0;
  phone3D(px, py, .9, (sx, sy, sw, sh) => {
    appHome(sx, sy, sw, sh, lt);
    if (lt > 3.1) bug(sx + sw / 2 + Math.sin(lt * 3) * 90, sy + 420 + Math.cos(lt * 2.3) * 200, .55, lt);
    if (danger > 0) { x.fillStyle = `rgba(224,40,60,${danger * .2 * (.7 + .3 * Math.sin(lt * 10))})`; x.fillRect(sx, sy, sw, sh); }
  }, { ry: .55 * (1 - inK) + .28 + Math.sin(lt * .6) * .05 + shake, z: (1 - inK) * 600, glow: danger > .3 ? 'rgba(224,52,77,.35)' : 'rgba(255,220,140,.5)' });
  const bk = eio(p(lt, .4, 2.6));
  if (lt < 3.1) bug(lerp(-120, px + 30, bk), lerp(1000, py + 160, bk) + Math.sin(lt * 8) * 15, .95 * (1 - p(lt, 2.6, 3.1) * .5), lt);
  const ha = eo(p(lt, 3.5, 4.4)) * (1 - p(lt, 8, 8.6));
  if (ha > 0) {
    x.save(); x.translate(0, 0); hacker(1660, 780, .82, ha, lt); x.restore();
    const icons = [cardIcon, keyIcon, pinIcon, userIcon];
    for (let i = 0; i < 9; i++) {
      const st = 4 + i * .42, k = p(lt, st, st + 1.5); if (k <= 0 || k >= 1) continue;
      const e = eio(k), ix = lerp(px + 150, 1600, e), iy = lerp(py - 100 + (i % 3) * 80, 720, e) - Math.sin(e * Math.PI) * 240;
      icons[i % 4](ix, iy, .75 * (1 - e * .4), ha * (1 - p(k, .8, 1)));
    }
  }
  kt('ENG KENG TARQALGAN USUL', 960, 150, 28, lt, .4, { w: 800, color: C.red, ls: 6, stg: .02, sb: 0 });
  goldBar(lt, .3, 960, 108, 300);
  kt('ZARARLI', 960, 265, 128, lt, 1.4, { w: 900, color: C.red, ext: 8, extCol: '#7d1020', mode: 'glitch', stg: .05, dur: .8 });
  kt('DASTUR', 960, 395, 128, lt, 1.9, { w: 900, color: C.ink, ext: 8, extCol: '#b8892e', stg: .05, dur: .7 });
  kt('smartfonga o‘rnatilib,', 960, 500, 40, lt, 3.4, { w: 600, color: C.mut, stg: .015 });
  kt('ma’lumotlaringizni o‘g‘irlaydi', 960, 560, 44, lt, 4.4, { w: 800, color: C.ink, stg: .02, hl: 'rgba(224,52,77,.14)' });
  const ck = p(lt, 8.3, 8.9);
  if (ck > 0) {
    const e = back(ck);
    x.save(); x.translate(1400, 735); x.scale(1, Math.max(.02, e)); x.globalAlpha = Math.min(1, ck * 2);
    x.shadowColor = 'rgba(120,20,30,.25)'; x.shadowBlur = 40; x.shadowOffsetY = 16;
    x.fillStyle = GLASS; rr(-440, -110, 880, 220, 28); x.fill(); x.shadowBlur = 0;
    x.strokeStyle = 'rgba(224,52,77,.5)'; x.lineWidth = 2; x.stroke(); x.fillStyle = C.red; rr(-440, -110, 12, 220, 6); x.fill();
    x.restore();
    kt('Foydalanuvchi buni', 1000, 680, 40, lt, 8.6, { w: 600, color: C.mut, stg: .015 });
    kt('BILMAY HAM QOLADI!', 1000, 775, 70, lt, 9.3, { w: 900, color: C.red, ext: 5, extCol: '#7d1020', mode: 'pop', stg: .03 });
    const ek = back(p(lt, 8.9, 9.4));
    if (ek > 0) {
      x.save(); x.translate(1740, 680); x.scale(ek, ek); x.strokeStyle = C.red; x.lineWidth = 6; x.lineCap = 'round';
      x.beginPath(); x.ellipse(0, 0, 38, 20, 0, 0, 7); x.stroke(); x.beginPath(); x.moveTo(-40, 32); x.lineTo(40, -32); x.stroke(); x.restore();
    }
  }
}

const CLIP = {}; let lastClip = null;
function clipIdx(lt) { const n = 227, per = 2 * (n - 1); let f = Math.floor(Math.max(0, lt - .15) * 30) % per; if (f >= n) f = per - f; return f + 1; }
const CLIPC = cnv(1308, 748);
function s3(lt, d) {
  bg(lt);
  const im = CLIP[clipIdx(lt)] || lastClip; if (im) lastClip = im;
  const zoom = 1.04 + .1 * cl(lt / d);
  if (im) photoCard(im, 1280, 720, zoom, CLIPC);
  const ink = eo(p(lt, 0, 1.1)), mv = eio(p(lt, 6.3, 7.4));
  const cx = lerp(960, 560, mv), cy = lerp(480, 520, mv), w = lerp(1500, 860, mv), h = w * 748 / 1308;
  const ry = (1 - ink) * .7 + mv * .38 + Math.sin(lt * .5) * .02, rx = (1 - ink) * .2;
  if (im) quad3D(CLIPC, cx, cy, w, h, { ry, rx, z: (1 - ink) * 700, nx: 10, ny: 8, sheen: .8, shadow: true, alpha: ink });
  // lower third over the clip (phase A)
  const la = 1 - p(lt, 6.0, 6.5);
  if (la > 0 && lt > 1) {
    x.save(); x.globalAlpha = la;
    const lk = eio(p(lt, 1.2, 1.9));
    const g = x.createLinearGradient(260, 0, 1500, 0); g.addColorStop(0, 'rgba(9,40,42,.88)'); g.addColorStop(1, 'rgba(9,40,42,0)');
    x.fillStyle = g; x.fillRect(250, 760, 1240 * lk, 130);
    x.fillStyle = '#d5a64a'; x.fillRect(250, 760, 8, 130 * lk);
    kt('BANK XODIMLARI', 290, 795, 28, lt, 1.5, { w: 800, color: '#e8c06a', ls: 6, stg: .02, sb: 0 });
    kt('Operativ kuzatuv va frod monitoringi bo‘limi', 290, 848, 46, lt, 1.9, { w: 800, color: '#fff', stg: .016, sb: 10, glow: 'rgba(0,0,0,.4)' });
    x.restore();
  }
  // phase B: antifrod
  if (lt > 6.6) {
    goldBar(lt, 6.8, 1060, 182, 280);
    kt('ANTIFROD', 1060, 270, 124, lt, 6.9, { w: 900, color: C.teal, ext: 9, extCol: '#b8892e', stg: .045 });
    kt('TIZIMLARI', 1062, 375, 62, lt, 7.4, { w: 900, gold: true, ls: 4, stg: .03, sb: 6 });
    chip(lt, 8.1, 1060, 500, 760, 'BARQAROR', 'ishlash holatida saqlanadi', C.acc, () => check(0, 2, 26, 1, C.acc, 9));
    chip(lt, 8.9, 1060, 640, 760, '24 / 7', 'uzluksiz monitoring', C.acc2, () => { x.strokeStyle = C.acc2; x.lineWidth = 7; x.beginPath(); x.arc(0, 0, 26, 0, 7); x.stroke(); x.beginPath(); x.moveTo(0, -14); x.lineTo(0, 0); x.lineTo(12, 8); x.stroke(); });
    chip(lt, 10.4, 1060, 780, 760, 'TUSHUNTIRISH', 'mijozlarga firibgarlik haqida', '#b8892e', () => { x.fillStyle = '#b8892e'; rr(-30, -24, 60, 42, 12); x.fill(); x.beginPath(); x.moveTo(-12, 16); x.lineTo(-22, 32); x.lineTo(4, 16); x.fill(); });
  }
}

function s4(lt, d) {
  bg(lt);
  const swap = eio(p(lt, 10.0, 11.0));
  const det = p(lt, 6.2, 6.6), scanY = p(lt, 3.4, 5.8), inK = eo(p(lt, 0, 1.2));
  if (swap < 1) {
    phone3D(lerp(560, -200, swap), 540, .92, (sx, sy, sw, sh) => {
      appHome(sx, sy, sw, sh, lt);
      if (scanY > 0 && scanY < 1) {
        const yy = sy + scanY * sh, g = x.createLinearGradient(0, yy - 140, 0, yy);
        g.addColorStop(0, 'rgba(201,154,58,0)'); g.addColorStop(1, 'rgba(201,154,58,.45)');
        x.fillStyle = g; x.fillRect(sx, yy - 140, sw, 140); x.fillStyle = '#d5a64a'; x.fillRect(sx, yy - 3, sw, 6);
      }
      if (det > 0) {
        x.fillStyle = `rgba(10,20,25,${det * .45})`; x.fillRect(sx, sy, sw, sh);
        const by = sy - 140 + back(det) * 200;
        x.fillStyle = '#fff'; x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 30; rr(sx + 18, by, sw - 36, 130, 22); x.fill(); x.shadowBlur = 0;
        x.fillStyle = C.red; rr(sx + 18, by, 10, 130, 5); x.fill();
        warnTri(sx + 75, by + 62, .38, C.red);
        txt('Xazna Antifrod', sx + 120, by + 40, 18, '#6a7a99', { al: 'left', w: 600 });
        txt('Shubhali dastur', sx + 120, by + 72, 24, '#0d2a55', { al: 'left', w: 800 });
        txt('aniqlandi!', sx + 120, by + 102, 24, C.red, { al: 'left', w: 800 });
      }
    }, { ry: (1 - inK) * -.9 - .22 + Math.sin(lt * .6) * .05 - swap * .9, z: (1 - inK) * 700, alpha: 1 - swap, glow: det > 0 ? 'rgba(224,52,77,.3)' : 'rgba(255,220,140,.5)' });
    if (scanY > 0 && scanY < 1) kt('Qurilma tekshirilmoqda… ' + Math.floor(scanY * 100) + '%', 560, 1000 - 40, 28, 9, 0, { al: 'center', w: 700, color: '#9a7224', sb: 0 });
    x.save(); x.globalAlpha = 1 - swap;
    const lk = back(p(lt, .5, 1.2));
    if (lk > 0) { x.save(); x.translate(1060 + 260, 175); x.scale(lk, Math.max(.02, lk)); x.drawImage(IMG.xazna_full, -260, -260 * 323 / 1675, 520, 520 * 323 / 1675 * 2 / 2); x.restore(); }
    kt('MOBIL ILOVASIDA', 1062, 290, 32, lt, 1.3, { w: 800, color: '#9a7224', ls: 7, stg: .02, sb: 0 });
    kt('MAXSUS', 1060, 370, 52, lt, 2.4, { w: 800, color: C.ink, stg: .03 });
    kt('ANTIFROD TIZIMI', 1060, 460, 86, lt, 2.8, { w: 900, color: C.teal, ext: 7, extCol: '#b8892e', stg: .035 });
    chip(lt, 6.3, 1060, 620, 760, 'ANIQLAYDI', 'shubhali dasturlarni', C.red, () => bug(0, 4, .42, lt));
    chip(lt, 8.3, 1060, 760, 760, 'XABAR BERADI', 'darhol ogohlantirish', '#b8892e', () => { x.fillStyle = '#b8892e'; x.beginPath(); x.moveTo(-22, 14); x.quadraticCurveTo(-22, -26, 0, -28); x.quadraticCurveTo(22, -26, 22, 14); x.lineTo(28, 20); x.lineTo(-28, 20); x.fill(); x.beginPath(); x.arc(0, 27, 7, 0, 7); x.fill(); });
    x.restore();
  }
  if (swap > 0) {
    const ck = eo(p(lt, 10.2, 11.4));
    quad3D(CARDS.qulf, 650, 520, 1060, 1060 * 703 / 1228, { ry: .5 * (1 - ck) + .16 + Math.sin(lt * .5) * .03, rx: .05, z: (1 - ck) * 1400, nx: 10, ny: 8, sheen: 1, shadow: true, alpha: swap });
    const lk = back(p(lt, 11, 11.6));
    if (lk > 0) { x.save(); x.translate(1500, 245); x.scale(lk, lk); glowCircle(0, 0, 140, 'rgba(255,215,120,.6)'); lockIcon(0, 0, 1.6, '#d5a64a'); x.restore(); }
    kt('XAVFSIZLIK CHORASI SIFATIDA', 1260, 380, 28, lt, 11.2, { w: 800, color: C.mut, ls: 3, stg: .012, sb: 0 });
    kt('AYRIM AMALIYOTLAR', 1260, 450, 44, lt, 11.8, { w: 900, color: C.ink, stg: .02 });
    kt('VAQTINCHA', 1258, 560, 84, lt, 12.6, { w: 900, gold: true, ext: 6, extCol: '#8c6116', stg: .04 });
    kt('CHEKLANADI', 1258, 675, 84, lt, 13.2, { w: 900, color: C.red, ext: 6, extCol: '#7d1020', stg: .04, mode: 'pop' });
  }
}

const S5 = [ // step-local animation times (seconds)
  { tap: 3.6, modal: 4.2 }, { fin: 3.4, press: 4.8, out: 6.4 }, { fin: .3, press: 1.3 }, { fin: .4, press: 1.4, rem: 3.8 }];
const STEPS3 = [['Ilova darhol', 'OGOHLANTIRADI', 'pul o‘tkazmoqchi bo‘lsangiz'], ['«Muammoni hal qilish»', 'TUGMASINI BOSING', 'boshqarish sahifasiga o‘tasiz'], ['«Ruxsatni olib tashlash»', 'FUNKSIYASINI YOQING', 'ilova ishlamasa'], ['«Olib tashlash»', 'VIRUS O‘CHIRILADI', 'pastdagi tugmani bosing']];
function s5(lt, d) {
  bg(lt);
  let step = 0, acc = 0;
  while (step < 3 && lt >= acc + STEP_D[step]) { acc += STEP_D[step]; step++; }
  const st = lt - acc, P = S5[step];
  let fx = -999, fy = -999, fpress = 0, fa = 0, removedK = 0;
  const content = (sx, sy, sw, sh) => {
    if (step === 0) {
      transferScreen(sx, sy, sw, sh, lt);
      const mk = p(st, P.modal, P.modal + .5); if (mk > 0) warnModal(sx, sy, sw, sh, mk, 0);
      fa = p(st, P.tap - 1, P.tap - .6) * (1 - p(st, P.modal, P.modal + .4)); fpress = p(st, P.tap, P.tap + .4);
      fx = sx + sw / 2 + 30; fy = sy + sh - 92;
    } else if (step === 1) {
      const out = p(st, P.out, P.out + .6);
      if (out < 1) { transferScreen(sx, sy, sw, sh, lt); warnModal(sx, sy, sw, sh, 1, p(st, P.press, P.press + .4)); }
      if (out > 0) { x.save(); x.translate((1 - eio(out)) * sw, 0); x.fillStyle = '#eef2f9'; x.fillRect(sx, sy, sw, sh); managerScreen(sx, sy, sw, sh, lt, 0, 0, 0); x.restore(); }
      fa = p(st, P.fin, P.fin + .5) * (1 - p(st, P.press + .8, P.press + 1.2)); fpress = p(st, P.press, P.press + .4);
      fx = sx + sw / 2 + 40; fy = sy + sh / 2 + 135;
    } else if (step === 2) {
      x.fillStyle = '#eef2f9'; x.fillRect(sx, sy, sw, sh);
      managerScreen(sx, sy, sw, sh, lt, eio(p(st, P.press + .2, P.press + .6)), 0, 0);
      fa = p(st, P.fin, P.fin + .5) * (1 - p(st, P.press + 1, P.press + 1.4)); fpress = p(st, P.press, P.press + .4);
      fx = sx + sw - 82; fy = sy + 395;
      if (st > P.press + .6) { x.strokeStyle = `rgba(201,154,58,${.5 + .5 * Math.sin(lt * 8)})`; x.lineWidth = 5; rr(sx + 20, sy + 346, sw - 40, 98, 22); x.stroke(); }
    } else {
      removedK = p(st, P.rem, P.rem + 1.4);
      x.fillStyle = '#eef2f9'; x.fillRect(sx, sy, sw, sh);
      managerScreen(sx, sy, sw, sh, lt, 1, p(st, P.press, P.press + .4), removedK);
      fa = p(st, P.fin, P.fin + .5) * (1 - p(st, P.press + .6, P.press + 1)); fpress = p(st, P.press, P.press + .4);
      fx = sx + sw / 2 + 30; fy = sy + sh - 92;
    }
    if (fa > 0) finger(fx, fy + (1 - fa) * 120, 1, fpress, fa);
  };
  const spin = (1 - eo(p(st, 0, .9))) * (step % 2 ? -.6 : .6) * (lt > 1 ? 1 : 0);
  const inK = eo(p(lt, 0, 1.1));
  phone3D(520, 545, .93, content, { ry: -.2 + Math.sin(lt * .5) * .05 + spin + (1 - inK) * -.9, z: (1 - inK) * 700, glow: step === 3 && removedK > .5 ? 'rgba(31,157,99,.35)' : (step < 2 ? 'rgba(224,52,77,.22)' : 'rgba(255,220,140,.5)') });
  if (step === 3 && removedK > .4) confetti(st, P.rem + .6, 520, 480, 50);
  // header
  x.drawImage(IMG.xazna_icon, 1000, 92, 56, 56 * 323 / 335);
  kt('VIRUSNI O‘CHIRISH', 1072, 120, 40, lt, .3, { w: 900, color: C.teal, stg: .02 });
  kt('4 QADAM', 1520, 120, 40, lt, .7, { w: 900, gold: true, stg: .04, sb: 4 });
  STEPS3.forEach((s, i) => {
    const Y = 270 + i * 190, ap = eo(p(lt, .4 + i * .18, 1 + i * .18)); if (ap <= 0) return;
    const active = i === step, done = i < step || (i === 3 && removedK >= 1);
    const fl = active ? back(p(st, 0, .6)) : 1;
    x.save(); x.globalAlpha = ap * (active ? 1 : .5); x.translate((1 - ap) * 80, 0);
    x.translate(0, Y); x.scale(1, Math.max(.05, fl)); x.translate(0, -Y);
    if (active) {
      x.shadowColor = 'rgba(80,55,10,.25)'; x.shadowBlur = 36; x.shadowOffsetY = 14; x.fillStyle = GLASS; rr(990, Y - 78, 860, 156, 26); x.fill();
      x.shadowBlur = 0; x.shadowOffsetY = 0; x.strokeStyle = '#d5a64a'; x.lineWidth = 2.5; x.stroke();
    }
    x.restore();
    x.save(); x.globalAlpha = ap * (active ? 1 : .5);
    if (done) { x.fillStyle = C.acc; x.beginPath(); x.arc(1060, Y, 40, 0, 7); x.fill(); check(1060, Y + 2, 20, 1, '#fff', 8); }
    else { x.font = `900 64px ${F}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#8c6116'; x.fillText('0' + (i + 1), 1063, Y + 5); x.fillStyle = goldFill(64); x.save(); x.translate(0, Y + 22); x.fillText('0' + (i + 1), 1060, -22); x.restore(); }
    x.restore();
    if (active) {
      kt(s[0], 1130, Y - 46, 28, st, .15, { w: 700, color: C.mut, stg: .01, sb: 0 });
      kt(s[1], 1130, Y + 4, 50, st, .3, { w: 900, color: i === 3 ? C.acc : C.teal, stg: .022, mode: 'flip', ext: 4, extCol: '#b8892e' });
      kt(s[2], 1130, Y + 50, 24, st, .6, { w: 500, color: C.mut, stg: .01, sb: 0 });
    } else {
      x.save(); x.globalAlpha = ap * .55; txt(s[0], 1130, Y - 30, 26, C.mut, { al: 'left', w: 600 }); txt(s[1], 1130, Y + 12, 38, C.ink, { al: 'left', w: 800 }); x.restore();
    }
  });
}

function s6(lt, d) {
  bg(lt);
  const px = 540, py = 540, inK = eo(p(lt, 0, 1.1));
  for (let i = 0; i < 5; i++) {
    const r = (lt * 150 + i * 110) % 550;
    x.strokeStyle = `rgba(201,154,58,${(1 - r / 550) * .6})`; x.lineWidth = 3;
    x.beginPath(); x.ellipse(px, py + 330, r + 180, (r + 180) * .26, 0, 0, 7); x.stroke();
  }
  const notes = [[1.0, 'Qurilma tekshirildi', 'Tahdid topilmadi', C.acc], [3.7, 'Qurilma tekshirildi', 'Hammasi xavfsiz', C.acc], [7.2, 'Diqqat! Zararli dastur', 'Uni hoziroq o‘chiring', C.red]];
  phone3D(px, py, .9, (sx, sy, sw, sh) => {
    appHome(sx, sy, sw, sh, lt);
    notes.forEach((n, i) => {
      const k = back(p(lt, n[0], n[0] + .5)) * (1 - (i < 2 ? p(lt, n[0] + 2, n[0] + 2.3) : 0)); if (k <= 0) return;
      const by = sy - 130 + k * 190;
      x.fillStyle = '#fff'; x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 25; rr(sx + 16, by, sw - 32, 110, 22); x.fill(); x.shadowBlur = 0;
      x.fillStyle = n[3]; x.beginPath(); x.arc(sx + 66, by + 55, 28, 0, 7); x.fill();
      if (i < 2) check(sx + 66, by + 57, 16, 1, '#fff', 6); else warnTri(sx + 66, by + 57, .25, '#fff');
      txt(n[1], sx + 110, by + 40, 20, '#0d2a55', { al: 'left', w: 800 }); txt(n[2], sx + 110, by + 72, 17, '#6a7a99', { al: 'left', w: 500 });
    });
  }, { ry: .25 + Math.sin(lt * .5) * .07 + (1 - inK) * .9, z: (1 - inK) * 700, glow: lt > 7.2 && lt < 10.5 ? 'rgba(224,52,77,.3)' : 'rgba(255,220,140,.55)' });
  drawShieldCard(lt);
  const sk = back(p(lt, .6, 1.3));
  if (sk > 0) quad3D(SHC, px + 230, py + 300, 150 * sk, 168 * sk, { ry: Math.sin(lt * 1.3) * .5, nx: 4, ny: 4 });
  x.drawImage(IMG.xazna_icon, 1000, 128, 50, 50 * 323 / 335);
  kt('YANA BIR AFZALLIK', 1066, 152, 30, lt, .4, { w: 800, color: '#9a7224', ls: 6, stg: .02, sb: 0 });
  kt('DOIMIY', 1000, 285, 128, lt, 3.2, { w: 900, color: C.teal, ext: 9, extCol: '#b8892e', stg: .05 });
  kt('TEKSHIRUV', 1004, 400, 84, lt, 3.7, { w: 900, gold: true, ext: 6, extCol: '#8c6116', stg: .04 });
  chip(lt, 7.2, 1000, 580, 800, 'OGOHLANTIRADI', 'zararli dastur aniqlansa — darhol', C.red, () => warnTri(0, 4, .42, C.red));
  chip(lt, 10.8, 1000, 720, 800, 'O‘ZINGIZ O‘CHIRASIZ', 'virusni bir necha bosishda', C.acc, () => check(0, 2, 26, 1, C.acc, 9));
}

function s7(lt, d) {
  bg(lt);
  const ck = eo(p(lt, 0, 1.3));
  quad3D(CARDS.mijoz, 600, 500, 1020, 1020 * 703 / 1228, { ry: .55 * (1 - ck) + .2 + Math.sin(lt * .4) * .03, rx: -.03, z: (1 - ck) * 1200, nx: 10, ny: 8, sheen: 1, shadow: true, alpha: ck });
  const lk = back(p(lt, .5, 1.2));
  if (lk > 0) { x.save(); x.translate(1190, 200); x.scale(Math.max(.02, lk), lk); x.drawImage(IMG.xazna_full, 0, -45, 470, 470 * 323 / 1675); x.restore(); }
  kt('orqali moliyaviy operatsiyalaringiz', 1192, 320, 34, lt, 1.2, { w: 600, color: C.mut, stg: .012, sb: 0 });
  const ow = tw('OSON', 128, 900);
  kt('OSON', 1186, 450, 128, lt, 3.0, { w: 900, color: C.teal, ext: 10, extCol: '#b8892e', stg: .07, mode: 'drop' });
  kt('va', 1186 + ow + 30, 470, 50, lt, 3.4, { w: 700, color: C.mut, sb: 0 });
  kt('XAVFSIZ', 1186, 600, 118, lt, 3.6, { w: 900, gold: true, ext: 10, extCol: '#8c6116', stg: .07, mode: 'drop' });
  kt('amalga oshiring!', 1192, 720, 46, lt, 4.6, { w: 800, color: C.ink, stg: .02, underline: true });
  confetti(lt, 3.7, 1450, 520, 80);
  for (let i = 0; i < 8; i++) sparkle(1190 + rnd(i + 70) * 620, 380 + rnd(i + 80) * 300, 14 + rnd(i) * 14, Math.sin(p(lt, 4 + i * .2, 4.7 + i * .2) * Math.PI));
}

function sEnd(lt, d) {
  bg(lt + 40);
  const k = eo(p(lt, 0, 1)), s = .52, lw = 1690 * s, lh = 440 * s, lx = 150, ly = H / 2 - 50 - lh / 2;
  rays(lx + 175 * s, ly + 220 * s, k * .6, lt);
  x.save(); x.globalAlpha = k; x.drawImage(LOGO, lx + (1 - k) * -60, ly, lw, lh); x.restore();
  reflection(LOGO, lx, ly, lw, lh, .12 * k);
  const dk = eio(p(lt, .4, 1.1));
  const g = x.createLinearGradient(0, ly - 30, 0, ly + lh + 30); g.addColorStop(0, 'rgba(201,154,58,0)'); g.addColorStop(.5, '#c99a3a'); g.addColorStop(1, 'rgba(201,154,58,0)');
  x.fillStyle = g; x.fillRect(1100, ly + lh / 2 - (lh / 2 + 30) * dk, 4, (lh + 60) * dk);
  const xk = eo(p(lt, .7, 1.5)), xw = 640, xh = xw * 323 / 1675, xx = 1170, xy = ly + lh / 2 - xh / 2;
  x.save(); x.globalAlpha = xk; x.drawImage(IMG.xazna_full, xx + (1 - xk) * 60, xy, xw, xh); x.restore();
  reflection(IMG.xazna_full, xx, xy, xw, xh, .1 * xk);
  shimmer(LOGO, lx, ly, lw, lh, p(lt, 1.4, 2.4)); shimmer(IMG.xazna_full, xx, xy, xw, xh, p(lt, 1.9, 2.9));
  kt('Xazna mobil ilovasi bilan — oson va xavfsiz', W / 2, 860, 40, lt, 2.0, { al: 'center', w: 700, color: C.ink, stg: .012, underline: true });
}

/* =========================== ENGINE =========================== */
const FN = { logo: sLogo, s1, s2, s3, s4, s5, s6, s7, end: sEnd };
let TL = { scenes: [], steps: [], subs: [] }, SC = [], TOTAL = 0;
function setTimeline(tl) {
  TL = tl; STEP_D = tl.steps; SC = []; let a = 0;
  for (const [id, d] of tl.scenes) { SC.push({ fn: FN[id], d, s: a, id }); a += d; }
  TOTAL = a; window.TOTAL = a; return { total: a, starts: SC.map(s => [s.id, +s.s.toFixed(2)]) };
}
window.setTimeline = setTimeline;
const TRANS = ['zoom', 'glitch', 'cube', 'wipe', 'cube', 'iris', 'zoom', 'cube'];
const TT = .5;
function plan(t) { // which scenes are drawn at t (and transition)
  let i = SC.findIndex(s => t < s.s + s.d); if (i < 0) i = SC.length - 1;
  const lt = t - SC[i].s, d = SC[i].d;
  if (i > 0 && lt < TT) return { a: [i - 1, SC[i - 1].d + lt], b: [i, lt], tr: TRANS[i - 1], k: (lt + TT) / (2 * TT) };
  if (i < SC.length - 1 && lt > d - TT) return { a: [i, lt], b: [i + 1, Math.max(0, lt - d)], tr: TRANS[i], k: (lt - d + TT) / (2 * TT) };
  return { a: [i, lt] };
}
window.prepare = async t => {
  const pl = plan(t), need = [pl.a, pl.b].filter(v => v && SC[v[0]].id === 's3').map(v => clipIdx(v[1]));
  for (const k of need) if (!CLIP[k]) { const im = new Image(); im.src = `build/clip/f_${String(k).padStart(4, '0')}.jpg`; await im.decode(); CLIP[k] = im; }
  const ks = Object.keys(CLIP); if (ks.length > 30) ks.slice(0, ks.length - 30).forEach(k => delete CLIP[k]);
};
function renderScene([i, lt], c) {
  const prev = x; x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
  x.save(); const d = SC[i].d, z = 1 + .03 * cl(lt / d);
  x.translate(W / 2, H / 2); x.scale(z, z); x.translate(-W / 2, -H / 2);
  SC[i].fn(lt, d); x.restore(); x = prev;
}
function drawScaled(c, s, a = 1, dx = 0) { MAIN.globalAlpha = a; MAIN.drawImage(c, W / 2 - W * s / 2 + dx, H / 2 - H * s / 2, W * s, H * s); MAIN.globalAlpha = 1; }
function stage() { const g = MAIN.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, H); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#d9c497'); MAIN.fillStyle = g; MAIN.fillRect(0, 0, W, H); }
function compose(type, k) {
  const m = MAIN; x = MAIN; m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
  if (type === 'zoom') {
    if (k < .5) { const e = eio(k * 2); drawScaled(CA, 1 + e * .7); for (let j = 1; j < 5; j++) drawScaled(CA, 1 + e * .7 + j * .05 * e, .18); }
    else { const e = 1 - eo((k - .5) * 2); drawScaled(CB, 1 + e * .5); for (let j = 1; j < 5; j++) drawScaled(CB, 1 + e * .5 + j * .05 * e, .18 * e); }
    const f = 1 - Math.abs(k - .5) * 4; if (f > 0) { m.fillStyle = `rgba(255,250,235,${f * .95})`; m.fillRect(0, 0, W, H); }
    flareH(W / 2, H / 2, Math.max(0, 1 - Math.abs(k - .5) * 3));
  } else if (type === 'glitch') {
    const src = k < .5 ? CA : CB, amp = Math.sin(k * Math.PI), seed = Math.floor(k * 24);
    m.drawImage(src, 0, 0);
    for (let b = 0; b < 16; b++) { const y0 = rnd(seed * 31 + b) * H, h = 20 + rnd(seed * 17 + b) * 90, off = (rnd(seed * 7 + b) - .5) * 260 * amp; m.drawImage(src, 0, y0, W, h, off, y0, W, h); }
    m.globalCompositeOperation = 'multiply'; drawScaled(src, 1, .25 * amp, 16 * amp); m.globalCompositeOperation = 'source-over';
    for (let b = 0; b < 6; b++) { m.fillStyle = b % 2 ? `rgba(224,52,77,${.5 * amp})` : `rgba(201,154,58,${.5 * amp})`; m.fillRect(0, rnd(seed * 13 + b) * H, W, 3 + rnd(b + seed) * 9); }
  } else if (type === 'cube') {
    stage(); const e = eio(k), hW = W / 2, ph = e * Math.PI / 2, push = Math.sin(e * Math.PI) * 500;
    // rotating cube: face A (current) turns away to the left, face B comes in from the right
    const A = () => quad3D(CA, W / 2, H / 2, W, H, { ry: ph, ox: -hW * Math.sin(ph), z: hW * (1 - Math.cos(ph)) + push, nx: 12, ny: 6, sheen: .8 });
    const B = () => quad3D(CB, W / 2, H / 2, W, H, { ry: ph - Math.PI / 2, ox: hW * Math.cos(ph), z: hW * (1 - Math.sin(ph)) + push, nx: 12, ny: 6, sheen: .8 });
    if (e < .5) { if (e > .02) B(); A(); } else { if (e < .98) A(); B(); }
  } else if (type === 'wipe') {
    const e = eio(k), lx = lerp(-500, W + 500, e), sl = 300;
    m.drawImage(CA, 0, 0);
    m.save(); m.beginPath(); m.moveTo(-600, 0); m.lineTo(lx + sl, 0); m.lineTo(lx - sl, H); m.lineTo(-600, H); m.closePath(); m.clip(); m.drawImage(CB, 0, 0); m.restore();
    for (let j = 0; j < 3; j++) { m.strokeStyle = j ? `rgba(213,166,74,${.3 / j})` : 'rgba(255,244,210,1)'; m.lineWidth = j ? 44 * j : 9; m.beginPath(); m.moveTo(lx + sl, 0); m.lineTo(lx - sl, H); m.stroke(); }
  } else if (type === 'iris') {
    const e = eio(k), r = e * 1250;
    m.drawImage(CA, 0, 0); m.save(); m.beginPath(); m.arc(W / 2, H / 2, r, 0, 7); m.clip(); m.drawImage(CB, 0, 0); m.restore();
    m.strokeStyle = 'rgba(255,240,200,.95)'; m.lineWidth = 7; m.beginPath(); m.arc(W / 2, H / 2, r, 0, 7); m.stroke();
    m.strokeStyle = 'rgba(201,154,58,.35)'; m.lineWidth = 44; m.stroke();
  }
}
function subtitles(t) {
  const s = TL.subs.find(s => t >= s[0] && t < s[1]); if (!s) return;
  const a = Math.min(p(t, s[0], s[0] + .15), 1 - p(t, s[1] - .15, s[1]));
  x = MAIN; x.save(); x.globalAlpha = a; x.font = `600 30px ${F}`; const w = x.measureText(s[2]).width;
  x.fillStyle = 'rgba(9,40,42,.84)'; rr(W / 2 - w / 2 - 30, 1006, w + 60, 54, 27); x.fill();
  x.fillStyle = '#d5a64a'; rr(W / 2 - w / 2 - 30, 1006, 8, 54, 4); x.fill(); x.restore();
  txt(s[2], W / 2, 1034, 30, '#fff', { a, w: 600 });
}
function draw(t) {
  x = MAIN; MAIN.setTransform(1, 0, 0, 1, 0, 0); MAIN.globalAlpha = 1; MAIN.globalCompositeOperation = 'source-over';
  const pl = plan(t);
  renderScene(pl.a, CA);
  if (pl.b) { renderScene(pl.b, CB); compose(pl.tr, pl.k); } else MAIN.drawImage(CA, 0, 0);
  x = MAIN; subtitles(t);
  const fa = 1 - Math.min(p(t, 0, .5), 1 - p(t, TOTAL - .9, TOTAL));
  if (fa > 0) { MAIN.fillStyle = `rgba(255,255,255,${fa})`; MAIN.fillRect(0, 0, W, H); }
}
window.draw = draw;
const q = new URLSearchParams(location.search);
window.assetsReady.then(() => document.fonts.ready).then(async () => {
  const tl = window.TIMELINE; if (tl) setTimeline(tl);
  if (q.has('t')) { await window.prepare(+q.get('t')); draw(+q.get('t')); }
});
