// Буғрахан естелиги — кинематик анимацион ҳүжжетли фильм (1920×1080, 25 fps, 2.39:1 кадр).
const W = 1920, H = 1080, BAR = 138;
const cv = document.getElementById('c');
const x = cv.getContext('2d');
const SERIF = 'CG, "Liberation Serif", serif', SANS = 'Inter, "DejaVu Sans", sans-serif';

/* ---------------- helpers ---------------- */
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const p = (t, a, b) => cl((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - t, 3);
const ei = t => t * t * t;
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sm = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function rnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function mixc(a, b, t, al = 1) { const A = hex(a), B = hex(b); return `rgba(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')},${al})`; }
function rgba(h, a) { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function fade(lt, d, fi = .8, fo = .8) { return Math.min(eo(p(lt, 0, fi)), eo(p(d - lt, 0, fo))); }

function txt(s, X, Y, size, color, o = {}) {
  x.save(); x.globalAlpha *= (o.a ?? 1);
  x.font = `${o.it ? 'italic ' : ''}${o.w || 600} ${size}px ${o.f || SANS}`;
  x.fillStyle = color; x.textAlign = o.al || 'center'; x.textBaseline = o.bl || 'middle';
  if (o.ls) x.letterSpacing = o.ls + 'px';
  if (o.glow) { x.shadowColor = o.glow; x.shadowBlur = o.gb || 30; }
  if (o.sh) { x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowBlur = o.sh; x.shadowOffsetY = 2; }
  x.fillText(s, X, Y); x.restore();
}
// title reveal: letters rise + unblur
function rtxt(s, X, Y, size, color, lt, start, o = {}) {
  const k = eo(p(lt, start, start + (o.dur || 1.6)));
  if (k <= 0) return;
  txt(s, X, Y + (1 - k) * (o.dy ?? 26), size, color, { ...o, a: k * (o.a ?? 1), ls: (o.ls || 0) + (1 - k) * (o.spread ?? 14) });
}
function glow(X, Y, r, col, a = 1) {
  if (r <= 0) return;
  x.save(); x.globalAlpha *= a;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r); x.restore();
}
function vgrad(stops, y0 = 0, y1 = H) {
  const g = x.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c)); return g;
}
function sky(stops) { x.fillStyle = vgrad(stops); x.fillRect(-200, -200, W + 400, H + 400); }
// Catmull-Rom smoothing
function smooth(pts, n = 8) {
  const o = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map(j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  o.push(pts[pts.length - 1]); return o;
}
function partial(pts, prog, close = false) { // polyline up to fraction
  x.beginPath();
  if (prog <= 0) return;
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rem = L * cl(prog); x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    if (rem >= seg[i - 1]) { x.lineTo(pts[i][0], pts[i][1]); rem -= seg[i - 1]; }
    else { const t = rem / seg[i - 1]; x.lineTo(lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)); break; }
  }
  if (close && prog >= 1) x.closePath();
}
function poly(pts) { x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); }
function cam(s, cx = W / 2, cy = H / 2, dx = 0, dy = 0) { x.translate(cx + dx, cy + dy); x.scale(s, s); x.translate(-cx, -cy); }

/* ---------------- textures ---------------- */
const GR = [];
for (let k = 0; k < 4; k++) {
  const c = document.createElement('canvas'); c.width = c.height = 384;
  const g = c.getContext('2d'), id = g.createImageData(384, 384);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0); GR.push(c);
}
const STARS = Array.from({ length: 520 }, (_, i) => [rnd(i) * W * 1.3 - W * .15, rnd(i + 900) * H * .9, rnd(i + 1800) ** 3 * 2.2 + .35, rnd(i + 2700)]);
function stars(a, tw = 0, maxY = H) {
  x.save();
  for (const [sx, sy, r, ph] of STARS) {
    if (sy > maxY) continue;
    x.globalAlpha = a * (.45 + .55 * Math.abs(Math.sin(tw * (1 + ph * 2) + ph * 40))) * cl(1 - sy / maxY * .8);
    x.fillStyle = ph > .85 ? '#ffe2b8' : '#e8f0ff';
    x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill();
  }
  x.restore();
}
// parchment
const BLOT = Array.from({ length: 60 }, (_, i) => [rnd(i + 11) * W, rnd(i + 77) * H, 40 + rnd(i + 5) * 260, rnd(i + 31)]);
function parchment(tone = 0) {
  x.fillStyle = vgrad([[0, '#ead8ae'], [1, '#dcc391']]); x.fillRect(-50, -50, W + 100, H + 100);
  for (const [bx, by, r, k] of BLOT) glow(bx, by, r, k > .5 ? 'rgba(150,105,50,.10)' : 'rgba(255,245,215,.25)');
  const g = x.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(90,55,20,${.55 + tone})`);
  x.fillStyle = g; x.fillRect(-50, -50, W + 100, H + 100);
}

/* ---------------- landscape ---------------- */
function dune(baseY, amp, seed, top, bot, par = 0, f = 1) {
  x.beginPath(); x.moveTo(-300, H + 50);
  for (let X = -300; X <= W + 300; X += 12) {
    const u = (X + par) * .0016 * f;
    const y = baseY - amp * (Math.sin(u + seed) * .55 + Math.sin(u * 2.3 + seed * 1.7) * .3 + Math.sin(u * 5.1 + seed * 3.1) * .15);
    x.lineTo(X, y);
  }
  x.lineTo(W + 300, H + 50); x.closePath();
  x.fillStyle = vgrad([[0, top], [1, bot]], baseY - amp, baseY + 260); x.fill();
}
// tepa (earthen mounds with wall remnants)
function ruins(baseY, s, seed, col, hi) {
  x.save();
  for (let i = 0; i < 9; i++) {
    const cx = (rnd(seed + i) * 1.6 - .3) * W, w = (120 + rnd(seed + i + 40) * 260) * s, h = (18 + rnd(seed + i + 80) * 50) * s;
    x.beginPath(); x.moveTo(cx - w, baseY + 2);
    x.bezierCurveTo(cx - w * .5, baseY - h, cx + w * .3, baseY - h * 1.1, cx + w, baseY + 2); x.closePath();
    x.fillStyle = col; x.fill();
    if (rnd(seed + i + 120) > .45) { // wall fragment
      const ww = w * .5, wh = h * .9; x.fillStyle = col;
      x.beginPath(); x.moveTo(cx - ww * .4, baseY - h * .55); x.lineTo(cx - ww * .38, baseY - h * .55 - wh); x.lineTo(cx - ww * .1, baseY - h * .55 - wh * 1.05);
      x.lineTo(cx, baseY - h * .55 - wh * .6); x.lineTo(cx + ww * .3, baseY - h * .55 - wh * .8); x.lineTo(cx + ww * .4, baseY - h * .55); x.closePath(); x.fill();
      if (hi) { x.strokeStyle = hi; x.lineWidth = 1.5 * s; x.stroke(); }
    }
  }
  x.restore();
}
// Хорезм минарасы: бийик, домалақ, жоқарысы жиңишке
function minaret(cx, by, h, rb, rt, o = {}) {
  const light = o.light ?? .7, base = o.col || '#c79a5e', ruin = o.ruin ?? true, sil = o.sil;
  const wAt = y => lerp(rb, rt, (by - y) / h);
  const top = by - h, jag = [];
  for (let i = 0; i <= 10; i++) jag.push([cx - rt + (2 * rt) * i / 10, top + (ruin ? (rnd(i * 7 + 3) * .06 * h * (i % 3 ? 1 : .3)) : 0)]);
  const path = () => {
    x.beginPath(); x.moveTo(cx - rb, by);
    for (let k = 0; k <= 20; k++) { const y = by - h * k / 20; x.lineTo(cx - wAt(y), y); }
    jag.forEach(q => x.lineTo(q[0], q[1]));
    for (let k = 20; k >= 0; k--) { const y = by - h * k / 20; x.lineTo(cx + wAt(y), y); }
    x.closePath();
  };
  // ground shadow
  if (!sil && o.shadow !== false) {
    x.save(); x.globalAlpha = .35 * (o.shA ?? 1); x.fillStyle = '#2b1606';
    x.beginPath(); x.moveTo(cx - rb, by); x.lineTo(cx + rb, by); x.lineTo(cx + rb + h * (o.shL ?? .9), by + rb * .45); x.lineTo(cx - rb + h * (o.shL ?? .9), by + rb * .55); x.closePath(); x.fill(); x.restore();
  }
  x.save(); path();
  if (sil) { x.fillStyle = sil; x.fill(); x.restore(); return { top, wAt }; }
  x.clip();
  const g = x.createLinearGradient(cx - rb, 0, cx + rb, 0);
  const dk = mixc(base, '#1d0f05', .72), md = base, lt = mixc(base, '#fff1d6', .35);
  if (light > .5) { g.addColorStop(0, dk); g.addColorStop(.25, mixc(base, '#1d0f05', .35)); g.addColorStop(.72, lt); g.addColorStop(.93, md); g.addColorStop(1, mixc(base, '#1d0f05', .3)); }
  else { g.addColorStop(0, mixc(base, '#1d0f05', .3)); g.addColorStop(.1, md); g.addColorStop(.3, lt); g.addColorStop(.75, mixc(base, '#1d0f05', .35)); g.addColorStop(1, dk); }
  x.fillStyle = g; x.fillRect(cx - rb - 5, top - 30, 2 * rb + 10, h + 40);
  // brick courses (curved rows + dashed joints)
  const rows = Math.round(h / (o.course || 9));
  x.lineWidth = Math.max(.6, h / 900);
  for (let i = 1; i < rows; i++) {
    const y = by - h * i / rows, w = wAt(y);
    x.strokeStyle = 'rgba(40,20,5,.22)'; x.setLineDash([w * .09, w * .02]); x.lineDashOffset = (i % 2) * w * .055;
    x.beginPath(); x.ellipse(cx, y, w, w * .09, 0, 0, Math.PI); x.stroke();
  }
  x.setLineDash([]);
  // ornamental belts
  const belts = o.belts || [.18, .42, .63, .82];
  belts.forEach((bp, bi) => {
    const y0 = by - h * bp, bh = h * .035, w = wAt(y0);
    x.fillStyle = 'rgba(60,30,8,.28)'; x.beginPath(); x.ellipse(cx, y0, w, w * .09, 0, 0, Math.PI); x.lineTo(cx - w, y0 - bh);
    x.ellipse(cx, y0 - bh, w, w * .09, 0, Math.PI, 0, true); x.closePath(); x.fill();
    x.strokeStyle = bi % 2 ? 'rgba(255,230,180,.35)' : 'rgba(30,15,4,.45)'; x.lineWidth = Math.max(1, h / 500);
    x.beginPath(); const n = 18;
    for (let k = 0; k <= n; k++) { const a = Math.PI * k / n, xx = cx - w * Math.cos(a), yy = y0 - (k % 2 ? bh * .85 : bh * .15) + Math.sin(a) * w * .09; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
    x.stroke();
  });
  // rim light
  if (o.rim) { x.strokeStyle = o.rim; x.lineWidth = 3; x.globalAlpha = .6; path(); x.stroke(); }
  x.restore();
  // base platform
  x.fillStyle = mixc(base, '#1d0f05', .45);
  x.beginPath(); x.ellipse(cx, by, rb * 1.18, rb * .14, 0, 0, Math.PI); x.lineTo(cx - rb * 1.18, by - rb * .1); x.ellipse(cx, by - rb * .1, rb * 1.18, rb * .14, 0, Math.PI, 0, true); x.fill();
  return { top, wAt };
}
// silhouetted people
function person(px, py, s, col, o = {}) {
  x.save(); x.translate(px, py); x.scale(s, s); x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round';
  const st = o.step || 0;
  x.beginPath(); x.arc(0, -78, 9, 0, 7); x.fill();
  x.lineWidth = 13; x.beginPath(); x.moveTo(0, -64); x.lineTo(0, -32); x.stroke();
  x.lineWidth = 7; x.beginPath(); x.moveTo(0, -32); x.lineTo(-6 + Math.sin(st) * 9, 0); x.moveTo(0, -32); x.lineTo(6 - Math.sin(st) * 9, 0); x.stroke();
  x.lineWidth = 5.5; x.beginPath(); x.moveTo(0, -60);
  if (o.staff) { x.lineTo(14, -40); x.stroke(); x.lineWidth = 3; x.beginPath(); x.moveTo(20, -110); x.lineTo(20, 0); x.stroke(); }
  else if (o.point) { x.lineTo(26, -70); x.stroke(); }
  else { x.lineTo(-5 - Math.sin(st) * 5, -34); x.moveTo(0, -60); x.lineTo(5 + Math.sin(st) * 5, -34); x.stroke(); }
  if (o.hat) { x.beginPath(); x.ellipse(0, -86, 15, 4, 0, 0, 7); x.fill(); x.fillRect(-8, -95, 16, 9); }
  x.restore();
}
function tripod(px, py, s, col) {
  x.save(); x.translate(px, py); x.scale(s, s); x.strokeStyle = col; x.lineWidth = 3;
  x.beginPath(); x.moveTo(0, -60); x.lineTo(-18, 0); x.moveTo(0, -60); x.lineTo(18, 0); x.moveTo(0, -60); x.lineTo(3, 0); x.stroke();
  x.fillStyle = col; x.fillRect(-14, -70, 28, 10); x.restore();
}
// dust motes in light
function motes(lt, a, col = '255,225,170') {
  x.save();
  for (let i = 0; i < 70; i++) {
    const X = (rnd(i) * W + lt * (8 + rnd(i + 3) * 18)) % W, Y = (rnd(i + 50) * H - lt * (4 + rnd(i + 9) * 10) + H * 3) % H;
    x.globalAlpha = a * (.25 + .5 * Math.abs(Math.sin(lt * .8 + i)));
    x.fillStyle = `rgb(${col})`; x.beginPath(); x.arc(X, Y, .8 + rnd(i + 7) * 2.2, 0, 7); x.fill();
  }
  x.restore();
}
function godrays(sx, sy, a, col = '255,214,150', n = 9, lt = 0) {
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const ang = Math.PI * .5 + (i - n / 2) * .11 + Math.sin(lt * .2 + i) * .02, len = 1700, wd = .03 + rnd(i) * .03;
    const g = x.createLinearGradient(sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
    g.addColorStop(0, `rgba(${col},${a * (.10 + rnd(i + 4) * .1)})`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.beginPath(); x.moveTo(sx, sy);
    x.lineTo(sx + Math.cos(ang - wd) * len, sy + Math.sin(ang - wd) * len); x.lineTo(sx + Math.cos(ang + wd) * len, sy + Math.sin(ang + wd) * len); x.closePath(); x.fill();
  }
  x.restore();
}
function label(s, X, Y, k, o = {}) { // map label with tick
  if (k <= 0) return;
  txt(s, X, Y + (1 - k) * 10, o.size || 30, o.col || '#4a2c10', { f: SERIF, w: o.w || 700, a: k, ls: o.ls ?? 2, al: o.al || 'center', it: o.it });
}
function pin(X, Y, k, lt, col = '#a0281a') {
  if (k <= 0) return;
  for (let i = 0; i < 3; i++) { const r = ((lt * .6 + i / 3) % 1); x.strokeStyle = rgba('#a0281a', (1 - r) * .7 * k); x.lineWidth = 3; x.beginPath(); x.arc(X, Y, 10 + r * 70, 0, 7); x.stroke(); }
  x.fillStyle = col; x.beginPath(); x.arc(X, Y, 11 * eo(k), 0, 7); x.fill();
  x.fillStyle = '#f7e7c4'; x.beginPath(); x.arc(X, Y, 4 * eo(k), 0, 7); x.fill();
}
function arrow(pts, prog, col, w = 8) {
  x.save(); x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round';
  partial(pts, prog); x.stroke();
  if (prog > .02) {
    let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let rem = L * cl(prog), i = 1; while (i < pts.length - 1 && rem > seg[i - 1]) { rem -= seg[i - 1]; i++; }
    const a = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]), t = cl(rem / seg[i - 1]);
    const X = lerp(pts[i - 1][0], pts[i][0], t), Y = lerp(pts[i - 1][1], pts[i][1], t);
    x.fillStyle = col; x.beginPath(); x.moveTo(X + Math.cos(a) * w * 2.4, Y + Math.sin(a) * w * 2.4);
    x.lineTo(X + Math.cos(a + 2.4) * w * 2.6, Y + Math.sin(a + 2.4) * w * 2.6); x.lineTo(X + Math.cos(a - 2.4) * w * 2.6, Y + Math.sin(a - 2.4) * w * 2.6); x.fill();
  }
  x.restore();
}
function sepia(a, lt) { // archival look
  x.save();
  x.globalCompositeOperation = 'saturation'; x.globalAlpha = a; x.fillStyle = '#808080'; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgba(214,170,110,${a})`; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  const fl = .04 + .04 * rnd(Math.floor(lt * 25)); x.fillStyle = `rgba(20,10,0,${fl * a})`; x.fillRect(0, 0, W, H);
  // scratches
  const fr = Math.floor(lt * 25);
  for (let i = 0; i < 3; i++) if (rnd(fr * 3 + i) > .55) {
    const sx = rnd(fr * 7 + i) * W; x.strokeStyle = `rgba(255,240,210,${.25 * a})`; x.lineWidth = 1 + rnd(fr + i);
    x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + (rnd(fr + 9) - .5) * 20, H); x.stroke();
  }
  for (let i = 0; i < 6; i++) if (rnd(fr * 11 + i) > .7) { x.fillStyle = `rgba(30,15,0,${.5 * a})`; x.beginPath(); x.arc(rnd(fr * 13 + i) * W, rnd(fr * 17 + i) * H, 1 + rnd(fr + i * 3) * 3, 0, 7); x.fill(); }
  x.restore();
}

/* ---------------- maps ---------------- */
const ARAL = smooth([[760, 150], [900, 110], [1060, 135], [1200, 120], [1290, 190], [1270, 300], [1310, 390], [1230, 470], [1120, 500], [1030, 540], [930, 520], [850, 470], [800, 390], [740, 330], [720, 240], [760, 150]], 6);
const AMU = smooth([[1640, 1080], [1560, 960], [1440, 880], [1330, 800], [1230, 720], [1130, 650], [1070, 590], [1040, 545]], 10);
const AMU2 = smooth([[1130, 650], [1060, 640], [990, 600], [960, 535]], 8);
const KHOREZM = smooth([[1020, 660], [1140, 640], [1290, 740], [1400, 860], [1330, 930], [1190, 880], [1080, 790], [990, 720], [1020, 660]], 6);
const BUG = [960, 640];
// region map (992)
const RA = smooth([[300, 270], [400, 230], [520, 270], [540, 380], [470, 450], [360, 440], [290, 360], [300, 270]], 6);
const RAMU = smooth([[1180, 1080], [1060, 900], [900, 760], [700, 600], [560, 490], [500, 440]], 10);
const RSYR = smooth([[1640, 620], [1480, 560], [1250, 470], [960, 380], [720, 340], [545, 330]], 10);
const MAVR = smooth([[860, 700], [980, 610], [1160, 560], [1360, 560], [1450, 640], [1380, 760], [1200, 860], [1000, 880], [880, 800], [860, 700]], 6);
function mapStroke(pts, prog, col, w, close) { x.strokeStyle = col; x.lineWidth = w; x.lineJoin = 'round'; x.lineCap = 'round'; partial(pts, prog, close); x.stroke(); }
function hatch(pts, a, col) { // water hatch
  x.save(); poly(pts); x.clip(); x.strokeStyle = col; x.globalAlpha = a; x.lineWidth = 1.5;
  for (let y = 0; y < H; y += 14) { x.beginPath(); for (let X = 0; X < W; X += 20) x.lineTo(X, y + Math.sin(X * .02 + y) * 3); x.stroke(); }
  x.restore();
}
function compass(X, Y, s, a, rot) {
  x.save(); x.globalAlpha = a; x.translate(X, Y); x.rotate(rot); x.strokeStyle = '#5a3a18'; x.fillStyle = '#5a3a18'; x.lineWidth = 2;
  x.beginPath(); x.arc(0, 0, 60 * s, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, 50 * s, 0, 7); x.stroke();
  for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 2); x.beginPath(); x.moveTo(0, -78 * s); x.lineTo(9 * s, 0); x.lineTo(-9 * s, 0); x.closePath(); i % 2 ? x.stroke() : x.fill(); }
  x.restore(); x.save(); x.globalAlpha = a; txt('Т', X, Y - 98 * s, 26 * s, '#5a3a18', { f: SERIF, w: 700 }); x.restore();
}

/* ================= SCENES ================= */
const S = {};

// ---------- INTRO ----------
S.intro = (lt, d) => {
  const dawn = sm(p(lt, 2, 11));
  sky([[0, mixc('#04060f', '#1b2747', dawn)], [.45, mixc('#070b1c', '#a2573a', dawn)], [.62, mixc('#0b0f22', '#f0a35a', dawn)], [1, mixc('#0b0f22', '#f6c27a', dawn)]]);
  x.save(); cam(1.12 - .1 * eio(p(lt, 0, d)), W / 2, H * .6);
  stars(1 - dawn * .9, lt);
  const sunY = lerp(820, 600, eo(p(lt, 3, 13)));
  glow(W * .62, sunY, 700, `rgba(255,170,90,${.55 * dawn})`); glow(W * .62, sunY, 120, `rgba(255,236,200,${dawn})`);
  godrays(W * .62, sunY, dawn * .9, '255,200,140', 11, lt);
  dune(700, 40, 1, mixc('#0b0c18', '#7a4a2e', dawn), mixc('#05050c', '#3a2014', dawn), lt * 6);
  x.save(); x.translate(0, 0); ruins(735, 1, 20, mixc('#08080f', '#5b351f', dawn)); x.restore();
  minaret(W * .42, 760, 330, 34, 22, { sil: mixc('#07070c', '#3d2414', dawn), shadow: false });
  dune(820, 60, 4, mixc('#0a0a12', '#a8683c', dawn), mixc('#040408', '#4b2a16', dawn), lt * 14, .7);
  dune(960, 70, 9, mixc('#07070c', '#6e4024', dawn), '#120904', lt * 26, .5);
  x.restore();
  motes(lt, dawn * .6);
  // titles
  const tA = p(lt, 6, 7.5), out = 1 - p(lt, d - 1.6, d - .3);
  x.save(); x.globalAlpha = out;
  rtxt('ҚАРАҚАЛПАҚСТАН ТАРИЙХЫ', W / 2, 395, 34, '#f3dcb4', lt, 5.6, { f: SANS, w: 500, ls: 16, spread: 30, sh: 12 });
  x.globalAlpha = out * eo(tA); x.fillStyle = '#e6b877'; x.fillRect(W / 2 - 160 * eo(tA), 432, 320 * eo(tA), 2); x.globalAlpha = out;
  rtxt('Буғрахан естелиги', W / 2, 520, 128, '#fff3dc', lt, 7, { f: SERIF, w: 700, ls: 2, spread: 22, glow: 'rgba(255,170,80,.6)', gb: 40, dur: 2.2 });
  rtxt('XI–XIV әсирлер  ·  Қоңырат районы', W / 2, 625, 30, '#f0c99a', lt, 9, { f: SERIF, w: 600, it: true, ls: 3 });
  x.restore();
};

// ---------- EXPEDITION ----------
S.exped = (lt, d, T) => {
  const a1 = p(lt, T[2] - .5, T[2] + 1.5); // switch from field silhouettes to map
  if (a1 < 1) {
    x.save(); x.globalAlpha = 1;
    sky([[0, '#5b6a7e'], [.55, '#d9b98d'], [.7, '#efd2a4'], [1, '#c39a68']]);
    cam(1.06 + .05 * p(lt, 0, T[2] + 2), W * .5, H * .7, -40 * p(lt, 0, T[2]), 0);
    glow(W * .78, 520, 420, 'rgba(255,235,190,.6)');
    dune(640, 25, 3, '#a88660', '#7a5a3a', 0, .8);
    ruins(655, .9, 60, '#8a6844');
    minaret(W * .28, 680, 250, 26, 17, { col: '#b38c5e', shL: .6 });
    dune(760, 35, 7, '#97754d', '#5f4126', 0, .6);
    // expedition
    const walk = lt * 2.2;
    person(1040 + lt * 6, 790, 1.15, '#2c1c0e', { hat: true, staff: true });
    person(1180 + lt * 4, 800, 1.2, '#2c1c0e', { hat: true, point: true });
    tripod(1300, 800, 1.3, '#2c1c0e');
    person(1420 - lt * 5, 805, 1.18, '#2c1c0e', { step: walk, hat: true });
    // tents
    x.fillStyle = '#3a2614'; [[1640, 760, 1], [1760, 770, .8]].forEach(([tx, ty, s]) => { x.beginPath(); x.moveTo(tx - 80 * s, ty); x.lineTo(tx, ty - 70 * s); x.lineTo(tx + 80 * s, ty); x.closePath(); x.fill(); });
    dune(900, 40, 11, '#6a4a2c', '#2e1c0e', 0, .5);
    x.restore();
    sepia(1, lt);
    // archival caption
    const k = eo(p(lt, 1, 2.5)) * (1 - a1);
    txt('ХАЭЭ · С. П. Толстов', 150, 262, 30, '#f5e6c8', { f: SERIF, w: 700, al: 'left', a: k, ls: 3, sh: 8 });
    txt('Хорезм археология ҳәм этнография экспедициясы', 150, 302, 22, '#e9d6b2', { a: k * .9, al: 'left', w: 500, sh: 8 });
  }
  if (a1 > 0) {
    x.save(); x.globalAlpha = eo(a1);
    const lm = lt - T[2] + .5;
    cam(1 + .12 * eio(p(lm, 0, d - T[2] + .5)), BUG[0], BUG[1]);
    parchment();
    compass(1640, 300, 1, eo(p(lm, .3, 1.5)), (1 - eo(p(lm, .3, 2))) * 2);
    hatch(ARAL, .35 * eo(p(lm, .5, 2)), '#4f7a8a');
    mapStroke(ARAL, eo(p(lm, 0, 2.2)), '#3e5f6c', 4, true);
    mapStroke(AMU, eo(p(lm, .6, 2.8)), '#3e5f6c', 6);
    mapStroke(AMU2, eo(p(lm, 1.8, 3.2)), '#3e5f6c', 4);
    x.save(); x.setLineDash([10, 8]); mapStroke(KHOREZM, eo(p(lm, 1.2, 3.4)), 'rgba(110,60,20,.8)', 3, true); x.restore();
    label('АРАЛ ТЕҢИЗИ', 1020, 330, eo(p(lm, 1.2, 2.2)), { col: '#2f4d58', it: true, size: 34, ls: 8 });
    label('Әмиўдәрья', 1330, 760, eo(p(lm, 2, 3)), { col: '#2f4d58', it: true, size: 28 });
    label('ҮСТИРТ', 520, 560, eo(p(lm, 2.3, 3.3)), { size: 30, ls: 10, col: '#6b4a2a' });
    label('ҚЫЗЫЛҚУМ', 1560, 560, eo(p(lm, 2.5, 3.5)), { size: 30, ls: 10, col: '#6b4a2a' });
    label('ХОРЕЗМ', 1210, 820, eo(p(lm, 2.8, 3.8)), { size: 34, ls: 10, col: '#7a3d18' });
    pin(BUG[0], BUG[1], eo(p(lm, 3.2, 4)), lt);
    label('Буғрахан', BUG[0] - 30, BUG[1] + 52, eo(p(lm, 3.4, 4.4)), { col: '#7a1d10', size: 40 });
    // stamp 1946
    const st = p(lm, 3.8, 4.3);
    if (st > 0) {
      x.save(); x.translate(470, 830); x.rotate(-.18); const s = 1 + 1.4 * (1 - eo(st)); x.scale(s, s); x.globalAlpha = eo(st) * .85;
      x.strokeStyle = '#9b2516'; x.lineWidth = 6; x.strokeRect(-150, -62, 300, 124); x.lineWidth = 2; x.strokeRect(-138, -50, 276, 100);
      txt('1946', 0, -8, 64, '#9b2516', { f: SERIF, w: 700 }); txt('АРХЕОЛОГИЯЛЫҚ КАРТА', 0, 34, 16, '#9b2516', { w: 700, ls: 3 });
      x.restore();
    }
    x.restore();
  }
};

// ---------- NAME ----------
S.name = (lt, d, T) => {
  const ph2 = p(lt, T[3] - .6, T[3] + .9);
  if (ph2 < 1) {
    x.save();
    cam(1.04 + .06 * p(lt, 0, T[3]), W / 2, H / 2);
    parchment(.05);
    const l0 = lt;
    hatch(RA, .35 * eo(p(l0, .3, 1.5)), '#4f7a8a'); mapStroke(RA, eo(p(l0, 0, 1.6)), '#3e5f6c', 4, true);
    mapStroke(RAMU, eo(p(l0, .4, 2.4)), '#3e5f6c', 5); mapStroke(RSYR, eo(p(l0, .6, 2.6)), '#3e5f6c', 5);
    label('Әмиўдәрья', 740, 690, eo(p(l0, 1.5, 2.5)), { it: true, col: '#2f4d58', size: 26 });
    label('Сырдәрья', 1180, 420, eo(p(l0, 1.7, 2.7)), { it: true, col: '#2f4d58', size: 26 });
    label('ХОРЕЗМ', 560, 520, eo(p(l0, 2, 3)), { size: 32, ls: 10, col: '#7a3d18' });
    // Movarounnahr
    const mv = eo(p(lt, T[1], T[1] + 1.5));
    x.save(); poly(MAVR); x.fillStyle = `rgba(160,60,30,${.22 * mv})`; x.fill(); x.restore();
    x.save(); x.setLineDash([12, 8]); mapStroke(MAVR, mv, 'rgba(140,40,20,.9)', 3, true); x.restore();
    label('МӘЎЕРЕННАҲР', 1160, 720, mv, { size: 36, ls: 8, col: '#7a2414' });
    [['Бухара', 960, 760], ['Самарқанд', 1260, 800]].forEach(([n, X, Y], i) => { const k = eo(p(lt, T[1] + .8 + i * .3, T[1] + 1.8 + i * .3)); if (k > 0) { x.fillStyle = rgba('#4a2c10', k); x.beginPath(); x.arc(X, Y, 7, 0, 7); x.fill(); label(n, X, Y + 32, k, { size: 24, w: 600 }); } });
    // Karakhanid advance
    const ar = eo(p(lt, T[1] + 1, T[1] + 4));
    arrow(smooth([[1820, 380], [1650, 470], [1480, 620], [1300, 700]], 8), ar, 'rgba(150,30,15,.85)', 9);
    arrow(smooth([[1840, 640], [1640, 700], [1440, 760], [1290, 790]], 8), eo(p(lt, T[1] + 1.6, T[1] + 4.4)), 'rgba(150,30,15,.65)', 7);
    label('ҚАРАХАНИЙЛЕР', 1680, 330, eo(p(lt, T[1] + 1.4, T[1] + 2.4)), { size: 30, ls: 6, col: '#7a1d10' });
    const yr = eo(p(lt, T[1] + 2.4, T[1] + 3.4));
    if (yr > 0) { x.save(); x.translate(1600, 860); x.rotate(-.05); x.globalAlpha = yr; txt('992', 0, 0, 120 + 30 * (1 - yr), '#8a2414', { f: SERIF, w: 700 }); x.restore(); }
    // "Буғрахан" name seal
    const nm = eo(p(lt, T[2], T[2] + 1.6));
    if (nm > 0) {
      x.save(); x.globalAlpha = nm; x.fillStyle = 'rgba(240,225,190,.75)'; x.fillRect(0, 0, W, H);
      x.translate(W / 2, H / 2); x.rotate((1 - nm) * -.2);
      x.strokeStyle = '#8a2414'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 210, 0, 7); x.stroke();
      x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 190, 0, 7); x.stroke();
      for (let i = 0; i < 24; i++) { x.rotate(Math.PI / 12); x.beginPath(); x.moveTo(0, -192); x.lineTo(0, -208); x.stroke(); }
      x.restore();
      txt('Буғрахан', W / 2, H / 2 - 10, 96, '#7a1d10', { f: SERIF, w: 700, a: nm });
      txt('ҚАРАХАНИЙЛЕР ӘЎЛАДЫ', W / 2, H / 2 + 70, 20, '#7a1d10', { a: nm * .9, w: 700, ls: 6 });
    }
    x.restore();
  }
  if (ph2 > 0) { // Khorezmshah capital hypothesis: night city of light
    x.save(); x.globalAlpha = eo(ph2);
    const l2 = lt - T[3] + .6;
    sky([[0, '#060a18'], [.55, '#1a2140'], [.75, '#5a3a3a'], [1, '#2a1a14']]);
    cam(1 + .1 * eio(p(l2, 0, d - T[3] + .6)), W / 2, 640);
    stars(.9, lt, 600);
    glow(W / 2, 700, 650, 'rgba(255,170,80,.35)');
    // city skyline
    x.fillStyle = '#0d0a10';
    for (let i = 0; i < 40; i++) { const bx = 300 + i * 34, bh = 40 + rnd(i + 3) * 90 * (1 - Math.abs(i - 20) / 26); x.fillRect(bx, 760 - bh, 30, bh + 40); if (rnd(i + 8) > .75) { x.beginPath(); x.arc(bx + 15, 760 - bh, 15, Math.PI, 0); x.fill(); } }
    minaret(W / 2 + 40, 760, 310, 26, 17, { sil: '#0d0a10', ruin: false, shadow: false });
    // window lights
    for (let i = 0; i < 90; i++) { const wx = 310 + rnd(i + 40) * 1320, wy = 700 + rnd(i + 70) * 60, k = eo(p(l2, .5 + rnd(i) * 3, 1 + rnd(i) * 3)); x.fillStyle = `rgba(255,${180 + rnd(i) * 60},100,${k * .9})`; x.fillRect(wx, wy, 4, 6); }
    dune(800, 20, 5, '#120c0a', '#060405', 0, .4);
    txt('Хорезмшаҳлар мәмлекетиниң орайы?', W / 2, 300, 52, '#f6dcb0', { f: SERIF, w: 700, it: true, a: eo(p(l2, 1.6, 3)), glow: 'rgba(255,160,60,.5)', gb: 30 });
    x.restore();
  }
};

// ---------- MINARET ----------
S.minaret = (lt, d, T) => {
  const ph = p(lt, T[1] - .6, T[1] + 1.2);
  if (ph < 1) {
    // tilt-up along the minaret at golden hour
    const tilt = eio(p(lt, 0, T[1]));
    sky([[0, '#2b3f63'], [.5, '#e39a5c'], [.8, '#f6c98d'], [1, '#f2b77a']]);
    x.save(); x.translate(0, lerp(-1100, 0, tilt)); // camera starts high (top of minaret) and descends
    glow(1500, 400, 600, 'rgba(255,190,120,.5)'); glow(1500, 400, 120, 'rgba(255,240,210,.9)');
    godrays(1500, 400, .7, '255,200,140', 9, lt);
    dune(1700, 60, 2, '#b07848', '#5c3a1e', 0, .7);
    ruins(1760, 1.6, 33, '#7c5230', 'rgba(255,200,140,.4)');
    minaret(820, 1840, 1900, 150, 95, { light: .8, rim: 'rgba(255,220,170,.9)', course: 13, shL: .8 });
    dune(1960, 60, 6, '#8e5c34', '#3a2210', 0, .5);
    x.restore();
    motes(lt, .7);
    const k = eo(p(lt, 1, 2.5)) * (1 - ph);
    txt('XI', 1380, 330, 220, 'rgba(255,240,215,.92)', { f: SERIF, w: 700, a: k, glow: 'rgba(255,160,80,.6)', gb: 40 });
    txt('ӘСИР', 1380, 470, 40, '#fff0d6', { a: k, w: 600, ls: 22 });
  }
  if (ph > 0) { // aerial plan, 60 ha
    x.save(); x.globalAlpha = eo(ph);
    const l2 = lt - T[1] + .6;
    x.fillStyle = vgrad([[0, '#9a7448'], [1, '#7d5a36']]); x.fillRect(0, 0, W, H);
    cam(1.25 - .2 * eio(p(l2, 0, d - T[1])), W / 2, H / 2, 0, 0); x.rotate(.0);
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${rnd(i) > .5 ? '60,38,18' : '200,160,110'},${.06 + rnd(i + 3) * .08})`; x.beginPath(); x.ellipse(rnd(i + 5) * W, rnd(i + 9) * H, 20 + rnd(i) * 90, 10 + rnd(i + 1) * 40, rnd(i) * 3, 0, 7); x.fill(); }
    // canal
    x.strokeStyle = 'rgba(70,90,80,.5)'; x.lineWidth = 14; x.beginPath(); x.moveTo(0, 860); x.bezierCurveTo(500, 800, 700, 980, 1920, 900); x.stroke();
    const outline = smooth([[560, 250], [980, 200], [1380, 260], [1460, 520], [1400, 820], [960, 880], [560, 820], [480, 540], [560, 250]], 6);
    x.save(); poly(outline); x.fillStyle = `rgba(255,214,150,${.25 * eo(p(l2, 1.8, 3))})`; x.fill(); x.restore();
    x.save(); x.shadowColor = 'rgba(255,220,160,.9)'; x.shadowBlur = 18; mapStroke(outline, eo(p(l2, .4, 2.6)), '#ffe3b0', 5, true); x.restore();
    // inner walls & mounds
    const inner = smooth([[820, 420], [1100, 400], [1180, 560], [1100, 690], [820, 700], [760, 560], [820, 420]], 6);
    x.save(); x.setLineDash([14, 10]); mapStroke(inner, eo(p(l2, 1.2, 3)), 'rgba(255,230,190,.8)', 3, true); x.restore();
    // minaret dot
    const mk = eo(p(l2, 2, 2.8)); glow(960, 540, 90, `rgba(255,220,150,${mk})`); x.fillStyle = rgba('#fff4dc', mk); x.beginPath(); x.arc(960, 540, 12, 0, 7); x.fill();
    x.restore();
    const n = Math.round(60 * eo(p(l2, 1.5, 4)));
    txt(`${n}+`, 1640, 470, 150, '#fff2d8', { f: SERIF, w: 700, a: eo(p(l2, 1.4, 2.2)), glow: 'rgba(0,0,0,.5)', gb: 20 });
    txt('ГЕКТАР', 1640, 575, 34, '#fff2d8', { w: 600, ls: 18, a: eo(p(l2, 1.8, 2.6)), sh: 10 });
  }
};

// ---------- BEACON / FUNCTION / BLUEPRINT ----------
S.beacon = (lt, d, T) => {
  const bp = p(lt, T[3] - .7, T[3] + .9); // blueprint from seg 3
  if (bp < 1) {
    const gather = p(lt, T[2] - .5, T[2] + 1.2);
    const night = 1 - gather * .65;
    sky([[0, mixc('#030614', '#1d1a3a', 1 - night)], [.6, mixc('#0a1430', '#a25a3c', 1 - night)], [1, mixc('#141a30', '#e2955a', 1 - night)]]);
    x.save(); cam(1.08 - .06 * p(lt, 0, T[3]), W * .35, 500);
    stars(night, lt, 760);
    const fx = 620, fy = 355, fire = eo(p(lt, 1.2, 2.4)) * (1 - gather * .7);
    // distant beacons
    [[1250, 700, .35, 2.8], [1560, 708, .25, 3.6], [1780, 712, .18, 4.4], [300, 712, .22, 5]].forEach(([bx, by, s, t0]) => {
      minaret(bx, by + 10, 420 * s, 40 * s, 26 * s, { sil: '#05060c', shadow: false });
      const k = eo(p(lt, t0 + T[1] - 2, t0 + T[1] - 1.4)) * (1 - gather * .7);
      glow(bx, by + 10 - 420 * s - 6, 70, `rgba(255,150,60,${k * (.8 + .2 * Math.sin(lt * 9 + bx))})`);
      glow(bx, by + 10 - 420 * s - 6, 14, `rgba(255,240,200,${k})`);
    });
    // light rings travelling
    for (let i = 0; i < 3; i++) { const r = ((lt * .35 + i / 3) % 1); x.strokeStyle = `rgba(255,190,110,${(1 - r) * .35 * fire})`; x.lineWidth = 3; x.beginPath(); x.ellipse(fx, fy, r * 1300, r * 260, 0, 0, 7); x.stroke(); }
    dune(740, 22, 2, mixc('#090a14', '#5b3420', 1 - night), mixc('#040509', '#2a170c', 1 - night), 0, .6);
    minaret(fx, 760, 400, 44, 29, { sil: mixc('#06070d', '#2c1910', 1 - night), shadow: false, ruin: false });
    // fire
    glow(fx, fy, 260, `rgba(255,140,50,${.6 * fire})`);
    for (let i = 0; i < 26; i++) { const fl = (lt * 1.6 + rnd(i)) % 1; x.fillStyle = `rgba(255,${200 - fl * 140},${80 - fl * 60},${(1 - fl) * fire})`; x.beginPath(); x.arc(fx + (rnd(i + 3) - .5) * 30 + Math.sin(lt * 6 + i) * 6, fy - 4 - fl * 70, (1 - fl) * 13, 0, 7); x.fill(); }
    glow(fx, fy - 10, 40, `rgba(255,245,210,${fire})`);
    // gathering people
    if (gather > 0) {
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1, d0 = 260 + rnd(i) * 900, prog = eo(p(lt - T[2] + .5, rnd(i + 7) * 2, 6 + rnd(i + 7) * 2));
        const px = fx + side * lerp(d0, 90 + rnd(i + 9) * 260, prog), py = 790 + rnd(i + 3) * 40;
        person(px, py, .55 + rnd(i + 4) * .25, `rgba(10,6,6,${eo(gather)})`, { step: lt * 4 + i });
      }
    }
    dune(880, 40, 8, mixc('#05060a', '#3a2214', 1 - night), '#050304', 0, .4);
    x.restore();
    motes(lt, .4 * (1 - night));
    const k = eo(p(lt, T[1], T[1] + 1)) * (1 - p(lt, T[2] - 1, T[2]));
    txt('ХАБАР БЕРИЎ ОРНЫ', 1380, 300, 38, '#ffd9a6', { a: k, w: 600, ls: 14, glow: 'rgba(255,140,40,.6)', gb: 24 });
    const k2 = eo(p(lt, T[2] + .5, T[2] + 1.5)) * (1 - bp);
    txt('ЖӘМӘӘТЛИК ОРЫН', 1380, 300, 38, '#ffe4c0', { a: k2, w: 600, ls: 14, sh: 16 });
  }
  if (bp > 0) { // technical drawing
    x.save(); x.globalAlpha = eo(bp);
    const l2 = lt - T[3] + .7;
    x.fillStyle = vgrad([[0, '#0b2140'], [1, '#08182e']]); x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(150,200,255,.08)'; x.lineWidth = 1;
    for (let X = 0; X < W; X += 40) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, H); x.stroke(); }
    for (let Y = 0; Y < H; Y += 40) { x.beginPath(); x.moveTo(0, Y); x.lineTo(W, Y); x.stroke(); }
    x.strokeStyle = 'rgba(150,200,255,.18)'; for (let X = 0; X < W; X += 200) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, H); x.stroke(); }
    cam(1 + .05 * p(l2, 0, d - T[3]), W / 2, H / 2);
    const cx = 900, by = 900, h = 700, rb = 85, rt = 52;
    const prof = [[cx - rb * 1.3, by], [cx - rb, by - 20], [cx - rt, by - h], [cx + rt, by - h], [cx + rb, by - 20], [cx + rb * 1.3, by]];
    x.save(); x.shadowColor = 'rgba(140,200,255,.8)'; x.shadowBlur = 12;
    mapStroke(prof, eo(p(l2, .2, 2.6)), '#d8ecff', 3);
    x.restore();
    // section lines
    for (let i = 1; i < 9; i++) { const y = by - h * i / 9, w = lerp(rb, rt, i / 9), k = eo(p(l2, 1.2 + i * .15, 2 + i * .15)); x.strokeStyle = `rgba(200,230,255,${.5 * k})`; x.lineWidth = 1.5; x.beginPath(); x.ellipse(cx, y, w * k, w * .12 * k, 0, 0, 7); x.stroke(); }
    // plan circle
    const pk = eo(p(l2, 1, 2.6)); x.strokeStyle = `rgba(216,236,255,${pk})`; x.lineWidth = 2;
    x.beginPath(); x.arc(470, 330, 120 * pk, 0, 7); x.stroke(); x.beginPath(); x.arc(470, 330, 70 * pk, 0, 7); x.stroke();
    x.setLineDash([6, 6]); x.beginPath(); x.moveTo(330, 330); x.lineTo(610, 330); x.moveTo(470, 190); x.lineTo(470, 470); x.stroke(); x.setLineDash([]);
    txt('ПЛАН', 470, 500, 20, '#9fc7ef', { a: pk, w: 600, ls: 8 });
    // callouts synced to segment 4
    const ls = [['бийик', T[4], cx + 150, 380, cx + rt + 4, 420], ['домалақ', T[4] + 1.1, cx + 200, 700, cx + rb - 6, 720], ['жоқарысы жиңишке', T[4] + 2.2, cx + 150, 230, cx + rt, by - h + 10]];
    ls.forEach(([s, t0, lx, ly, ax, ay]) => {
      const k = eo(p(lt, t0, t0 + .8)); if (k <= 0) return;
      x.strokeStyle = `rgba(255,214,140,${k})`; x.lineWidth = 2; x.beginPath(); x.moveTo(ax, ay); x.lineTo(lerp(ax, lx, k), lerp(ay, ly, k)); x.lineTo(lerp(ax, lx, k) + 160 * k, lerp(ay, ly, k)); x.stroke();
      x.fillStyle = `rgba(255,214,140,${k})`; x.beginPath(); x.arc(ax, ay, 5, 0, 7); x.fill();
      txt(s, lx + 10, ly - 24, 34, '#ffd68c', { f: SERIF, w: 700, it: true, al: 'left', a: k });
    });
    // unknown height
    const hk = eo(p(lt, T[5], T[5] + 1));
    if (hk > 0) {
      const X = cx - 260; x.strokeStyle = `rgba(255,120,90,${hk})`; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(X, by); x.lineTo(X, lerp(by, by - h - 140, hk)); x.stroke();
      x.beginPath(); x.moveTo(X - 20, by); x.lineTo(X + 20, by); x.stroke();
      x.setLineDash([8, 8]); x.beginPath(); x.moveTo(X, by - h); x.lineTo(X, by - h - 140); x.stroke(); x.setLineDash([]);
      const q = 1 + .06 * Math.sin(lt * 4);
      x.save(); x.translate(X - 120, by - h / 2 + 90); x.scale(q, q); txt('? м', 0, 0, 110, '#ff8a6a', { f: SERIF, w: 700, a: hk, glow: 'rgba(255,90,60,.6)', gb: 30 }); x.restore();
    }
    x.restore();
  }
};

// ---------- CITY & MOSQUE ----------
S.city = (lt, d, T) => {
  const ph2 = p(lt, T[2] - .6, T[2] + 1); // map of state
  const ph3 = p(lt, T[3] - .6, T[3] + 1); // city plan
  const ph4 = p(lt, T[5] - .6, T[5] + 1); // back to minaret
  if (ph2 < 1) { // dusk mosque
    sky([[0, '#140f2e'], [.45, '#4b2a4e'], [.7, '#c0603e'], [1, '#f0a35e']]);
    x.save(); cam(1.03 + .07 * p(lt, 0, T[2]), W * .55, 650);
    stars(.6, lt, 420);
    // crescent
    x.fillStyle = '#fff2cf'; x.save(); x.shadowColor = 'rgba(255,240,200,.8)'; x.shadowBlur = 40;
    x.beginPath(); x.arc(1450, 230, 46, 0, 7); x.fill(); x.restore();
    x.fillStyle = '#1a112f'; x.beginPath(); x.arc(1474, 216, 42, 0, 7); x.fill();
    glow(W / 2, 760, 700, 'rgba(255,150,70,.35)');
    dune(760, 18, 3, '#3a1e22', '#1a0c10', 0, .5);
    // mosque silhouette
    const mc = '#170b10';
    x.fillStyle = mc; x.fillRect(980, 600, 520, 180);
    x.beginPath(); x.arc(1240, 600, 120, Math.PI, 0); x.fill(); x.fillRect(1236, 450, 8, 40); x.beginPath(); x.arc(1240, 448, 9, 0, 7); x.fill();
    x.beginPath(); x.arc(1060, 600, 50, Math.PI, 0); x.fill(); x.beginPath(); x.arc(1420, 600, 50, Math.PI, 0); x.fill();
    // lit arches
    for (let i = 0; i < 7; i++) { const ax = 1010 + i * 72, k = eo(p(lt, .8 + i * .2, 1.6 + i * .2)); x.fillStyle = `rgba(255,190,100,${.85 * k})`; x.beginPath(); x.moveTo(ax, 760); x.lineTo(ax, 690); x.arc(ax + 18, 690, 18, Math.PI, 0); x.lineTo(ax + 36, 760); x.fill(); glow(ax + 18, 720, 60, `rgba(255,170,80,${.35 * k})`); }
    minaret(820, 790, 420, 40, 26, { sil: mc, shadow: false, ruin: false });
    for (let i = 0; i < 12; i++) person(700 + i * 70 + rnd(i) * 30, 830, .6, '#0e0609', { step: lt * 3 + i });
    dune(860, 30, 7, '#1c0d10', '#0a0406', 0, .4);
    x.restore();
    motes(lt, .3);
  }
  if (ph2 > 0 && ph3 < 1) { // Khorezmshah state, northern border
    x.save(); x.globalAlpha = eo(ph2);
    const l2 = lt - T[2] + .6;
    cam(1 + .08 * p(l2, 0, 7), 900, 420);
    parchment(.05);
    hatch(ARAL, .35, '#4f7a8a'); mapStroke(ARAL, 1, '#3e5f6c', 4, true); mapStroke(AMU, 1, '#3e5f6c', 6); mapStroke(AMU2, 1, '#3e5f6c', 4);
    const state = smooth([[420, 640], [700, 560], [930, 590], [1150, 600], [1400, 700], [1700, 820], [1800, 1000], [1300, 1080], [700, 1060], [380, 900], [420, 640]], 6);
    x.save(); poly(state); x.fillStyle = `rgba(150,70,30,${.2 * eo(p(l2, .3, 1.8))})`; x.fill(); x.restore();
    mapStroke(state, eo(p(l2, .2, 2.4)), 'rgba(120,50,20,.6)', 3, true);
    // northern border highlight
    const nb = state.slice(0, Math.floor(state.length * .42));
    x.save(); x.shadowColor = 'rgba(200,40,20,.7)'; x.shadowBlur = 14; mapStroke(nb, eo(p(l2, 1.4, 3.2)), '#a3261a', 7); x.restore();
    label('ХОРЕЗМШАҲЛАР МӘМЛЕКЕТИ', 1080, 860, eo(p(l2, .8, 1.8)), { size: 38, ls: 8, col: '#7a2a14' });
    label('арқа шегара', 620, 520, eo(p(l2, 2.4, 3.4)), { size: 34, it: true, col: '#a3261a' });
    pin(BUG[0], BUG[1], eo(p(l2, 2, 2.8)), lt);
    label('Буғрахан', BUG[0] + 20, BUG[1] - 44, eo(p(l2, 2.2, 3)), { col: '#7a1d10', size: 38 });
    label('АРАЛ ТЕҢИЗИ', 1020, 330, 1, { col: '#2f4d58', it: true, size: 32, ls: 8 });
    x.restore();
  }
  if (ph3 > 0 && ph4 < 1) { // 3-part city plan with mosque
    x.save(); x.globalAlpha = eo(ph3);
    const l3 = lt - T[3] + .6;
    x.fillStyle = vgrad([[0, '#1b130c'], [1, '#0d0906']]); x.fillRect(0, 0, W, H);
    cam(1.02 + .08 * p(l3, 0, 9), W / 2, H / 2);
    x.strokeStyle = 'rgba(230,190,130,.06)'; for (let X = 0; X < W; X += 60) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, H); x.stroke(); } for (let Y = 0; Y < H; Y += 60) { x.beginPath(); x.moveTo(0, Y); x.lineTo(W, Y); x.stroke(); }
    const z3 = smooth([[420, 230], [960, 160], [1500, 230], [1580, 560], [1460, 880], [960, 940], [440, 860], [340, 540], [420, 230]], 6);
    const z2 = smooth([[640, 330], [960, 290], [1290, 340], [1340, 560], [1260, 760], [960, 800], [660, 750], [590, 540], [640, 330]], 6);
    const z1 = [[830, 440], [1090, 440], [1090, 650], [830, 650]];
    const zs = [[z3, 'III', 'Рабад', 1460, 560, .0], [z2, 'II', 'Шаҳристан', 1215, 540, 1.1], [z1.concat([z1[0]]), 'I', 'Орайлық бөлим', 960, 380, 2.2]];
    zs.forEach(([z, n, nm, lx, ly, t0], i) => {
      const k = eo(p(l3, t0 + .3, t0 + 1.8));
      x.save(); poly(z); x.fillStyle = `rgba(${[180, 205, 235][i]},${[120, 150, 180][i]},${[70, 90, 120][i]},${.12 * k + i * .03 * k})`; x.fill(); x.restore();
      x.save(); x.shadowColor = 'rgba(255,200,120,.6)'; x.shadowBlur = 10; mapStroke(z, k, `rgba(240,200,140,${.5 + i * .2})`, 2 + i, true); x.restore();
      txt(n, lx, ly, 46, '#f3cf95', { f: SERIF, w: 700, a: k }); txt(nm, lx, ly + 40, 22, '#cfae80', { a: k, w: 500, ls: 3 });
    });
    // mosque icon in centre (seg 4)
    const mk = eo(p(lt, T[4], T[4] + 1.2));
    if (mk > 0) {
      glow(960, 550, 220 * mk, 'rgba(255,190,100,.45)');
      x.save(); x.translate(960, 560); x.scale(mk, mk); x.fillStyle = '#ffd99a';
      x.fillRect(-60, -10, 120, 50); x.beginPath(); x.arc(0, -10, 42, Math.PI, 0); x.fill(); x.fillRect(-3, -70, 6, 18);
      x.fillRect(74, -80, 14, 120); x.beginPath(); x.moveTo(74, -80); x.lineTo(81, -96); x.lineTo(88, -80); x.fill();
      x.restore();
      txt('Қала мешити', 960, 690, 30, '#ffe2b0', { f: SERIF, w: 700, it: true, a: mk });
    }
    x.restore();
  }
  if (ph4 > 0) { // minaret in Khorezmshah style, warm hero shot
    x.save(); x.globalAlpha = eo(ph4);
    const l4 = lt - T[5] + .6;
    sky([[0, '#3b4f78'], [.55, '#e1a06a'], [1, '#f5cf98']]);
    cam(1.15 - .1 * eio(p(l4, 0, d - T[5])), 960, 600);
    glow(600, 380, 500, 'rgba(255,210,150,.6)');
    dune(780, 30, 4, '#b98252', '#6a4426', 0, .7);
    ruins(800, 1.1, 90, '#8d603a');
    minaret(1060, 860, 640, 64, 42, { light: .25, rim: 'rgba(255,225,180,.8)', course: 10, shL: -.8 });
    dune(940, 40, 2, '#93623a', '#3c2412', 0, .5);
    x.restore();
    txt('Хорезмшаҳлар дәўири усылы', 560, 300, 44, '#fff4dc', { f: SERIF, w: 700, it: true, a: eo(p(lt, T[5] + .6, T[5] + 1.8)), sh: 18 });
  }
};

// ---------- FLOOD ----------
S.flood = (lt, d, T) => {
  const rise = sm(p(lt, .5, d * .55)), recede = sm(p(lt, d * .7, d - .6));
  const lvl = lerp(990, 740, rise * (1 - recede));
  const storm = rise * (1 - recede);
  sky([[0, mixc('#7aa0c4', '#2c3540', storm)], [.6, mixc('#e6c79a', '#5d6670', storm)], [1, mixc('#f0d0a0', '#6f7478', storm)]]);
  x.save(); cam(1.05 + .05 * p(lt, 0, d), W / 2, 700);
  glow(1450, 360, 500, `rgba(255,220,170,${.6 * (1 - storm)})`);
  // clouds
  for (let i = 0; i < 14; i++) { const cx = (rnd(i) * 2400 + lt * 30 * (1 + rnd(i + 2))) % 2400 - 240, cy = 120 + rnd(i + 5) * 260; glow(cx, cy, 200 + rnd(i) * 200, `rgba(${mixc('#ffffff', '#3a4048', storm).slice(5, -3)},${.25 + .4 * storm})`); }
  dune(760, 30, 3, mixc('#b88a58', '#5b5048', storm), mixc('#7a5634', '#3a3430', storm), 0, .6);
  ruins(780, 1.1, 140, mixc('#8c6440', '#4a403a', storm));
  minaret(960, 820, 560, 56, 37, { light: .75, col: mixc('#c79a5e', '#8a7a68', storm * .6).replace(/rgba\((\d+),(\d+),(\d+),1\)/, (m, a, b, c) => '#' + [a, b, c].map(v => (+v).toString(16).padStart(2, '0')).join('')), shadow: storm < .5 });
  // wet line after recede
  if (recede > 0) { x.fillStyle = `rgba(60,40,25,${.35 * recede})`; x.fillRect(960 - 60, 740, 120, 820 - 740); }
  // water
  if (lvl < 985) {
    x.save();
    x.beginPath(); x.moveTo(-200, H + 50);
    for (let X = -200; X <= W + 200; X += 10) x.lineTo(X, lvl + Math.sin(X * .012 + lt * 1.6) * 6 + Math.sin(X * .031 - lt * 2.3) * 3);
    x.lineTo(W + 200, H + 50); x.closePath();
    x.fillStyle = vgrad([[0, 'rgba(110,130,130,.88)'], [1, 'rgba(40,55,60,.95)']], lvl, H); x.fill();
    x.clip();
    // reflection
    x.globalAlpha = .25; x.translate(0, lvl * 2); x.scale(1, -1); minaret(960, 820, 560, 56, 37, { sil: '#c9d3d0', shadow: false }); x.restore();
    for (let i = 0; i < 40; i++) { const wx = (rnd(i) * W + lt * 40) % W, wy = lvl + 10 + rnd(i + 4) * 200; x.strokeStyle = 'rgba(220,235,235,.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(wx, wy); x.lineTo(wx + 30 + rnd(i) * 40, wy); x.stroke(); }
  }
  x.restore();
  // rain
  if (storm > .05) { x.save(); x.strokeStyle = `rgba(210,220,230,${.35 * storm})`; x.lineWidth = 1.5; for (let i = 0; i < 260; i++) { const rx = (rnd(i) * W + lt * 300) % W, ry = (rnd(i + 3) * H + lt * 1400 * (1 + rnd(i))) % H; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 8, ry + 30); x.stroke(); } x.restore(); }
  // centuries
  const cs = ['XII', 'XIII', 'XIV', 'XVI', 'XVIII', 'XX'];
  const ci = Math.floor(cl(p(lt, 1, d - 2)) * cs.length * .999);
  txt(cs[ci] + ' әсир', 1500, 300, 48, '#f5efe6', { f: SERIF, w: 700, a: .85 * fade(lt, d, 1.5, 1.5), sh: 14 });
  if (recede > .4) txt('Сақланып қалды', W / 2, 260, 64, '#fff6e6', { f: SERIF, w: 700, it: true, a: eo(p(recede, .4, .9)), glow: 'rgba(255,200,120,.6)', gb: 30 });
};

// ---------- MODERN ----------
S.modern = (lt, d, T) => {
  const A = p(lt, T[1] - .6, T[1] + .8), B = p(lt, T[3] - .6, T[3] + .8), C = p(lt, T[5] - .6, T[5] + .8);
  if (A < 1) { // stages timeline
    x.fillStyle = vgrad([[0, '#1a120b'], [1, '#0c0805']]); x.fillRect(0, 0, W, H);
    glow(W / 2, H / 2, 900, 'rgba(200,140,70,.18)');
    const pts = [['1946', 'карта'], ['1950–60', 'экспедиция'], ['…', 'изертлеўлер'], ['2025', 'жаңа басқыш']];
    const k = eo(p(lt, .3, 3));
    x.strokeStyle = 'rgba(230,190,130,.5)'; x.lineWidth = 3; x.beginPath(); x.moveTo(360, 540); x.lineTo(360 + 1200 * k, 540); x.stroke();
    pts.forEach(([y, s], i) => {
      const X = 360 + i * 400, kk = eo(p(lt, .6 + i * .7, 1.4 + i * .7));
      glow(X, 540, 60 * kk, 'rgba(255,200,120,.7)'); x.fillStyle = rgba('#ffe1b0', kk); x.beginPath(); x.arc(X, 540, 10, 0, 7); x.fill();
      txt(y, X, 470, 56, '#ffe9c8', { f: SERIF, w: 700, a: kk }); txt(s, X, 600, 24, '#d1b088', { a: kk, w: 500, ls: 3 });
    });
  }
  if (A > 0 && B < 1) { // decree document
    x.save(); x.globalAlpha = eo(A);
    const l = lt - T[1] + .6;
    x.fillStyle = vgrad([[0, '#2a1d12'], [1, '#120c07']]); x.fillRect(0, 0, W, H);
    glow(W / 2, 500, 800, 'rgba(255,200,130,.25)');
    x.save(); x.translate(W / 2, 545); x.rotate(lerp(-.25, -.03, eo(p(l, 0, 1.6)))); const s = lerp(.7, 1, eo(p(l, 0, 1.6))) * (1 + .03 * p(l, 1.6, 12)); x.scale(s, s);
    x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 50; x.shadowOffsetY = 20; x.fillStyle = '#f4ecdc'; x.fillRect(-300, -380, 600, 760); x.shadowColor = 'transparent';
    x.strokeStyle = 'rgba(120,90,50,.4)'; x.lineWidth = 2; x.strokeRect(-270, -350, 540, 700);
    txt('ӨЗБЕКСТАН РЕСПУБЛИКАСЫ ПРЕЗИДЕНТИНИҢ', 0, -290, 17, '#3a2a18', { w: 700, ls: 1 });
    txt('ҚАРАРЫ', 0, -240, 44, '#3a2a18', { f: SERIF, w: 700, ls: 8 });
    txt('№ 248  ·  2025-жыл', 0, -185, 26, '#7a2414', { f: SERIF, w: 700 });
    for (let i = 0; i < 13; i++) { const lw = 420 - (i % 4 === 3 ? 160 : rnd(i) * 60); x.fillStyle = 'rgba(80,60,40,.25)'; x.fillRect(-210, -120 + i * 30, lw * eo(p(l, .8 + i * .08, 1.6 + i * .08)), 8); }
    // highlighted line
    const hl = eo(p(lt, T[2], T[2] + 1.4)); x.fillStyle = `rgba(230,170,60,${.45 * hl})`; x.fillRect(-220, 7, 440 * hl, 30);
    txt('жаңа археологиялық орынлар · туристлик жөнелислер', 0, 22, 14.5, '#3a2a18', { w: 700, a: hl });
    // seal stamp
    const st = p(l, 2.2, 2.6);
    if (st > 0) { x.save(); x.translate(170, 270); const ss = 1 + 1.2 * (1 - eo(st)); x.scale(ss, ss); x.globalAlpha = eo(st) * .8; x.strokeStyle = '#1f4a8a'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 70, 0, 7); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 56, 0, 7); x.stroke(); txt('248', 0, 2, 34, '#1f4a8a', { f: SERIF, w: 700 }); x.restore(); }
    x.restore(); x.restore();
  }
  if (B > 0 && C < 1) { // excavation & restoration by KSU archaeologists
    x.save(); x.globalAlpha = eo(B);
    const l = lt - T[3] + .6;
    x.fillStyle = vgrad([[0, '#a07850'], [1, '#7a5634']]); x.fillRect(0, 0, W, H);
    cam(1.15 - .12 * eio(p(l, 0, T[5] - T[3])), W / 2, H / 2);
    for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(${rnd(i) > .5 ? '70,45,22' : '210,170,120'},${.08 + rnd(i + 3) * .08})`; x.beginPath(); x.ellipse(rnd(i + 5) * W, rnd(i + 9) * H, 10 + rnd(i) * 60, 6 + rnd(i + 1) * 30, rnd(i) * 3, 0, 7); x.fill(); }
    // grid & trenches
    const gk = eo(p(l, .2, 1.6));
    x.strokeStyle = `rgba(255,250,235,${.7 * gk})`; x.lineWidth = 2;
    for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(400 + i * 140, 160); x.lineTo(400 + i * 140, 160 + 760 * gk); x.stroke(); }
    for (let j = 0; j <= 5; j++) { x.beginPath(); x.moveTo(400, 160 + j * 152); x.lineTo(400 + 1120 * gk, 160 + j * 152); x.stroke(); }
    [[2, 1], [3, 1], [3, 2], [5, 3], [6, 3], [1, 3]].forEach(([i, j], n) => { const k = eo(p(l, 1 + n * .4, 2 + n * .4)); x.fillStyle = `rgba(70,42,20,${.55 * k})`; x.fillRect(400 + i * 140 + 6, 160 + j * 152 + 6, 128, 140); });
    // artifacts appear
    [[680, 400, 'pot'], [870, 560, 'coin'], [1290, 640, 'lamp']].forEach(([ax, ay, t], n) => {
      const k = eo(p(l, 2.6 + n * .7, 3.4 + n * .7)); if (k <= 0) return; glow(ax, ay, 80, `rgba(255,220,150,${.6 * k})`); artifact(t, ax, ay, k);
    });
    x.restore();
    const tk = eo(p(lt, T[3] + .5, T[3] + 1.6)) * (1 - C);
    x.save(); x.globalAlpha = tk; x.fillStyle = 'rgba(15,10,6,.55)'; x.fillRect(120, 180, 720, 120); x.fillStyle = '#e6b877'; x.fillRect(120, 180, 6, 120); x.restore();
    txt('Бердақ атындағы ҚМУ', 150, 220, 36, '#fff1d8', { f: SERIF, w: 700, al: 'left', a: tk });
    txt('АРХЕОЛОГИЯ КАФЕДРАСЫ', 150, 266, 20, '#e8c9a0', { w: 600, al: 'left', a: tk, ls: 5 });
  }
  if (C > 0) { // site open year-round: winter → summer
    x.save(); x.globalAlpha = eo(C);
    const l = lt - T[5] + .6, dd = d - T[5] + .6;
    const sum = sm(p(l, dd * .45, dd * .7));
    sky([[0, mixc('#9fb3c8', '#4a7ab0', sum)], [.6, mixc('#dfe6ec', '#f3d3a0', sum)], [1, mixc('#eef1f4', '#f7dcae', sum)]]);
    cam(1.08 - .08 * eio(p(l, 0, dd)), W / 2, 700);
    glow(1500, 300, 500, `rgba(255,${lerp(240, 210, sum)},${lerp(230, 150, sum)},${lerp(.3, .7, sum)})`);
    dune(760, 26, 3, mixc('#e8ecef', '#c79868', sum), mixc('#c9d0d6', '#8a5e38', sum), 0, .6);
    ruins(780, 1.1, 210, mixc('#c4c9cc', '#9a6c44', sum));
    // paved path & lamps
    x.fillStyle = mixc('#d8dcdf', '#e8d2a8', sum); x.beginPath(); x.moveTo(820, 840); x.lineTo(1100, 840); x.lineTo(1500, 1080); x.lineTo(500, 1080); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(120,90,60,.35)'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { const y = 850 + i * i * 4.5; x.beginPath(); x.moveTo(lerp(820, 500, (y - 840) / 240), y); x.lineTo(lerp(1100, 1500, (y - 840) / 240), y); x.stroke(); }
    [[780, 860, .7], [1150, 860, .7], [640, 960, 1], [1300, 960, 1]].forEach(([lx, ly, s]) => { x.fillStyle = '#2b2018'; x.fillRect(lx - 3 * s, ly - 120 * s, 6 * s, 120 * s); x.fillRect(lx - 12 * s, ly - 128 * s, 24 * s, 12 * s); glow(lx, ly - 122 * s, 50 * s, `rgba(255,220,150,${.5 * (1 - sum)})`); });
    minaret(960, 830, 500, 50, 33, { light: .7, col: mixc('#c79a5e', '#d2a468', sum).replace(/rgba\((\d+),(\d+),(\d+),1\)/, (m, a, b, c) => '#' + [a, b, c].map(v => (+v).toString(16).padStart(2, '0')).join('')), shL: .5 });
    if (sum < 1) { x.fillStyle = `rgba(255,255,255,${.7 * (1 - sum)})`; x.beginPath(); x.ellipse(960, 830 - 500 + 6, 34, 8, 0, 0, 7); x.fill(); }
    // tourists
    for (let i = 0; i < 9; i++) { const pr = ((l * .05 + rnd(i)) % 1); person(lerp(i % 2 ? 540 : 1400, 960 + (rnd(i + 3) - .5) * 200, pr), lerp(1060, 860, pr), lerp(1.1, .55, pr), i % 3 ? '#2a1d14' : '#46301e', { step: l * 5 + i }); }
    // snow
    if (sum < 1) { x.fillStyle = `rgba(255,255,255,${.85 * (1 - sum)})`; for (let i = 0; i < 220; i++) { const sx = (rnd(i) * W + Math.sin(l + i) * 30 + l * 20) % W, sy = (rnd(i + 3) * H + l * (60 + rnd(i) * 80)) % H; x.beginPath(); x.arc(sx, sy, 1.5 + rnd(i + 2) * 2.5, 0, 7); x.fill(); } }
    x.restore();
    txt(sum < .5 ? 'Қысы' : 'Жазы', 1560, 260, 56, sum < .5 ? '#2f4a66' : '#fff4dc', { f: SERIF, w: 700, it: true, a: eo(p(l, .8, 1.8)) * (Math.abs(sum - .5) * 2), sh: sum < .5 ? 0 : 14 });
  }
};
function artifact(t, X, Y, k) {
  x.save(); x.translate(X, Y); x.scale(k, k);
  if (t === 'pot') { x.fillStyle = '#b5683a'; x.beginPath(); x.moveTo(-18, -50); x.lineTo(18, -50); x.bezierCurveTo(20, -30, 55, -25, 50, 10); x.bezierCurveTo(45, 45, 20, 50, 0, 50); x.bezierCurveTo(-20, 50, -45, 45, -50, 10); x.bezierCurveTo(-55, -25, -20, -30, -18, -50); x.fill(); x.strokeStyle = '#6e3a1c'; x.lineWidth = 3; x.beginPath(); x.moveTo(-44, 0); for (let i = 0; i <= 8; i++) x.lineTo(-44 + i * 11, i % 2 ? 10 : 0); x.stroke(); }
  if (t === 'coin') { x.fillStyle = '#c9a24a'; x.beginPath(); x.arc(0, 0, 40, 0, 7); x.fill(); x.strokeStyle = '#7a5a1c'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 32, 0, 7); x.stroke(); x.beginPath(); for (let i = 0; i < 5; i++) { x.moveTo(-18, -14 + i * 7); x.lineTo(18 - (i % 2) * 8, -14 + i * 7); } x.stroke(); }
  if (t === 'lamp') { x.fillStyle = '#9a5a30'; x.beginPath(); x.ellipse(0, 0, 50, 22, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(40, -6); x.lineTo(80, -14); x.lineTo(80, 4); x.lineTo(40, 10); x.fill(); x.fillRect(-56, -18, 14, 30); glow(82, -16, 30, 'rgba(255,200,100,.8)'); }
  x.restore();
}

// ---------- WISDOM ----------
S.wisdom = (lt, d, T) => {
  sky([[0, '#03040c'], [.6, '#0b1230'], [1, '#1a1838']]);
  x.save(); cam(1.04 + .1 * eio(p(lt, 0, d)), W / 2, H / 2);
  stars(1, lt);
  // astrolabe
  const ax = W / 2, ay = 520, ak = eo(p(lt, .3, 3));
  x.save(); x.translate(ax, ay); x.globalAlpha = ak;
  x.strokeStyle = '#d9b26a'; x.shadowColor = 'rgba(255,190,90,.6)'; x.shadowBlur = 16;
  x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 330, 0, 7); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 300, 0, 7); x.stroke();
  x.save(); x.rotate(lt * .05); for (let i = 0; i < 72; i++) { x.rotate(Math.PI / 36); x.beginPath(); x.moveTo(0, -300); x.lineTo(0, i % 6 ? -288 : -272); x.stroke(); } x.restore();
  x.save(); x.rotate(-lt * .08); x.beginPath(); x.arc(0, 40, 200, 0, 7); x.stroke(); x.beginPath(); x.arc(0, -60, 120, 0, 7); x.stroke();
  for (let i = 0; i < 9; i++) { const a = i * .7, r = 120 + (i % 3) * 60; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); x.stroke(); x.fillStyle = '#ffe2a6'; x.beginPath(); x.arc(Math.cos(a) * r, Math.sin(a) * r, 6, 0, 7); x.fill(); }
  x.restore();
  x.save(); x.rotate(lt * .12); x.lineWidth = 5; x.beginPath(); x.moveTo(-310, 0); x.lineTo(310, 0); x.stroke(); x.restore();
  x.restore();
  // girih stars (8-pointed)
  for (let i = 0; i < 6; i++) {
    const k = eo(p(lt, T[1] + i * .25, T[1] + 1.5 + i * .25)); if (k <= 0) continue;
    const gx = [320, 1600, 250, 1680, 520, 1400][i], gy = [300, 300, 760, 760, 900, 900][i];
    x.save(); x.translate(gx, gy); x.rotate(lt * .1 * (i % 2 ? 1 : -1)); x.globalAlpha = k; x.strokeStyle = '#e8c27a'; x.lineWidth = 2.5;
    for (let r = 0; r < 2; r++) { x.save(); x.rotate(r * Math.PI / 4); x.strokeRect(-70 * k, -70 * k, 140 * k, 140 * k); x.restore(); }
    x.beginPath(); x.arc(0, 0, 40 * k, 0, 7); x.stroke(); x.restore();
  }
  x.restore();
  const w = ['билим', 'тәжирийбе', 'көнликпе'];
  w.forEach((s, i) => { const k = eo(p(lt, T[1] + 1 + i * .9, T[1] + 2 + i * .9)) * (1 - p(lt, T[2] + 1, T[2] + 2)); txt(s, W / 2 + (i - 1) * 420, 900 - BAR, 46, '#ffe7b8', { f: SERIF, w: 700, it: true, a: k, glow: 'rgba(255,170,60,.5)', gb: 24 }); });
  const k3 = eo(p(lt, T[2] + 1.5, T[2] + 3));
  txt('ИЛИМ-БИЛИМ ОРАЙЫ', W / 2, 520, 64, '#fff2d6', { f: SERIF, w: 700, ls: 10, a: k3, glow: 'rgba(255,170,60,.7)', gb: 40 });
};

// ---------- FINALE ----------
S.finale = (lt, d, T) => {
  const ph = p(lt, T[1] + 1, T[1] + 2.6);
  if (ph < 1) { // strata cross-section, descending camera
    const dsc = eio(p(lt, 0, T[1] + 2));
    x.fillStyle = '#2a1a0e'; x.fillRect(0, 0, W, H);
    x.save(); x.translate(0, -dsc * 900);
    sky([[0, '#4a6a92'], [.3, '#e7b07a'], [.36, '#e7b07a'], [1, '#e7b07a']]);
    x.fillStyle = vgrad([[0, '#4a6a92'], [1, '#f0bb80']], 0, 380); x.fillRect(0, 0, W, 380);
    minaret(960, 380, 260, 26, 17, { light: .7, shadow: false });
    const layers = [['#a57a4c', 'XIV'], ['#8e6440', 'XIII'], ['#7a5435', 'XII'], ['#64432a', 'XI'], ['#4d3220', '']];
    layers.forEach(([c, n], i) => {
      const y0 = 380 + i * 300;
      x.beginPath(); x.moveTo(0, y0); for (let X = 0; X <= W; X += 20) x.lineTo(X, y0 + Math.sin(X * .004 + i * 2) * 18 + Math.sin(X * .013 + i) * 6); x.lineTo(W, H * 3); x.lineTo(0, H * 3); x.closePath();
      x.fillStyle = c; x.fill();
      for (let j = 0; j < 60; j++) { x.fillStyle = `rgba(${rnd(i * 70 + j) > .5 ? '30,18,8' : '220,180,130'},.14)`; x.beginPath(); x.arc(rnd(i * 31 + j) * W, y0 + 30 + rnd(i * 17 + j) * 250, 2 + rnd(j) * 8, 0, 7); x.fill(); }
      if (n) { txt(n, 150, y0 + 150, 64, 'rgba(255,235,200,.75)', { f: SERIF, w: 700 }); txt('әсир', 150, y0 + 205, 20, 'rgba(255,235,200,.6)', { ls: 5 }); }
    });
    [['pot', 1300, 560], ['coin', 700, 850], ['lamp', 1250, 1150], ['pot', 620, 1430], ['coin', 1420, 1460]].forEach(([t, ax, ay], i) => {
      const k = eo(p(lt, 1.5 + i * 1.3, 2.6 + i * 1.3)); glow(ax, ay, 120, `rgba(255,210,140,${.55 * k * (.8 + .2 * Math.sin(lt * 2 + i))})`); artifact(t, ax, ay, .5 + .5 * k);
    });
    x.restore();
    txt('?', 1650, 820 - BAR, 140, 'rgba(255,230,180,.5)', { f: SERIF, w: 700, a: eo(p(lt, T[1], T[1] + 1)) * (1 - ph) });
  }
  if (ph > 0) { // final wide sunset
    x.save(); x.globalAlpha = eo(ph);
    const l = lt - T[1] - 1;
    sky([[0, '#1d2140'], [.45, '#8b4a4a'], [.65, '#ef9a55'], [1, '#f6c27a']]);
    cam(1 + .08 * eio(p(l, 0, d - T[1] - 1)), W / 2, 700);
    glow(1250, 700, 800, 'rgba(255,150,70,.6)'); glow(1250, 700, 110, 'rgba(255,236,200,1)');
    godrays(1250, 700, 1, '255,190,120', 13, lt);
    dune(730, 30, 1, '#6a3a26', '#2a150c', 0, .8);
    ruins(750, 1, 20, '#3d2014');
    minaret(800, 790, 470, 46, 30, { sil: '#1a0d08', shadow: false });
    dune(880, 50, 4, '#3a1d10', '#0f0704', 0, .6);
    x.restore();
    motes(lt, .6);
  }
};

// ---------- END TITLE ----------
S.end = (lt, d) => {
  x.fillStyle = '#060403'; x.fillRect(0, 0, W, H);
  glow(W / 2, H / 2, 800, 'rgba(160,90,40,.25)');
  rtxt('ҚАРАҚАЛПАҚСТАН ТАРИЙХЫ', W / 2, 410, 30, '#d9b98a', lt, .4, { w: 500, ls: 16, spread: 24 });
  rtxt('Буғрахан естелиги', W / 2, 510, 110, '#fff0d6', lt, 1, { f: SERIF, w: 700, glow: 'rgba(255,170,80,.45)', gb: 40, dur: 2 });
  rtxt('Қоңырат районы · XI–XIV әсирлер', W / 2, 610, 30, '#d9b98a', lt, 2.2, { f: SERIF, it: true, w: 600, ls: 3 });
};

// ---------- INTERVIEW SLOT ----------
S.int = (lt, d, T, sc) => {
  x.fillStyle = vgrad([[0, '#1a120c'], [1, '#0a0705']]); x.fillRect(0, 0, W, H);
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) { const bx = (rnd(i + sc.n * 13) * W * 1.2 - 100 + lt * 8 * (rnd(i) - .5)), by = 200 + rnd(i + 40) * 600, r = 30 + rnd(i + 3) * 90; glow(bx, by, r, `rgba(${rnd(i) > .5 ? '255,170,90' : '255,215,150'},${.12 + rnd(i + 5) * .12})`); }
  x.restore();
  glow(W * .62, H * .45, 600, 'rgba(255,180,110,.12)');
  // soft silhouette of speaker
  x.save(); x.globalAlpha = .55; x.fillStyle = '#050302';
  x.beginPath(); x.ellipse(W * .62, 420, 95, 118, 0, 0, 7); x.fill();
  x.beginPath(); x.moveTo(W * .62 - 310, H); x.bezierCurveTo(W * .62 - 280, 620, W * .62 - 120, 560, W * .62, 560); x.bezierCurveTo(W * .62 + 120, 560, W * .62 + 280, 620, W * .62 + 310, H); x.fill();
  x.restore();
  // lower third
  const k = eo(p(lt, .4, 1.3)) * (1 - p(lt, d - 1, d - .4));
  x.save(); x.globalAlpha = k;
  x.fillStyle = 'rgba(10,6,3,.6)'; x.fillRect(150, 700, 640 * k, 120);
  x.fillStyle = '#e6b877'; x.fillRect(150, 700, 6, 120);
  x.restore();
  txt(sc.who, 185, 742, 44, '#fff2dc', { f: SERIF, w: 700, al: 'left', a: k });
  txt(sc.role, 185, 790, 22, '#e2c39a', { w: 500, al: 'left', a: k, ls: 2 });
};

/* ================= TIMELINE ================= */
const CPS = 13; // characters per second of narration
const segDur = s => Math.max(3.4, s.length / CPS + .8);
let TL = [], TOTAL = 0, SUBS = [];
function build() {
  let t = 0, nInt = 0; TL = []; SUBS = [];
  for (const sc of window.SCRIPT) {
    const e = { ...sc, t0: t, T: [] };
    if (sc.id === 'intro') e.d = 14.5;
    else if (sc.id === 'end') e.d = 7;
    else if (sc.id === 'int') { e.d = 7; e.n = nInt++; }
    else {
      let u = 1.6;
      for (const s of sc.segs) { e.T.push(u); SUBS.push({ s, a: t + u, b: t + u + segDur(s) - .35 }); u += segDur(s); }
      e.d = u + (sc.id === 'finale' ? 6.5 : 1.6);
    }
    t += e.d; TL.push(e);
  }
  TOTAL = t; window.TOTAL = TOTAL;
  window.TIMELINE = { fps: 25, total: TOTAL, scenes: TL.map(e => ({ id: e.id, t0: +e.t0.toFixed(3), d: +e.d.toFixed(3), segs: e.T.map(v => +(e.t0 + v).toFixed(3)) })), subs: SUBS.map(s => ({ a: +s.a.toFixed(3), b: +s.b.toFixed(3), s: s.s })) };
}
build();
window.SHOW_SUBS = !/nosubs/.test(location.search);

/* ================= FRAME ================= */
function chapter(sc, lt) {
  if (!sc.ch) return;
  const k = eo(p(lt, .9, 2)) * (1 - p(lt, 6, 7.2));
  if (k <= 0) return;
  x.save(); x.globalAlpha = k; x.fillStyle = '#e6b877'; x.fillRect(110, BAR + 46, 46 * k, 2); x.restore();
  txt(sc.ch.toUpperCase(), 172, BAR + 47, 22, '#f6e2c0', { a: k, al: 'left', w: 600, ls: 6, sh: 10 });
}
function subtitles(t) {
  if (!window.SHOW_SUBS) return;
  const s = SUBS.find(q => t >= q.a && t < q.b); if (!s) return;
  const k = Math.min(p(t, s.a, s.a + .25), p(s.b - t, 0, .25));
  x.font = `500 31px ${SANS}`;
  const words = s.s.split(' '), lines = []; let cur = '';
  for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (x.measureText(tt).width > 1500 && cur) { lines.push(cur); cur = w; } else cur = tt; }
  lines.push(cur);
  const y0 = H - BAR / 2 - (lines.length - 1) * 21;
  lines.forEach((ln, i) => txt(ln, W / 2, y0 + i * 42, 31, '#f4ead8', { a: k, w: 500 }));
}
let GI = 0;
function draw(t) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const sc = TL.find(e => t >= e.t0 && t < e.t0 + e.d) || TL[TL.length - 1];
  const lt = t - sc.t0;
  x.save(); S[sc.id](lt, sc.d, sc.T, sc); x.restore();
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  // grade: vignette + warm grain
  const g = x.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.1);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = .07;
  const gc = GR[(GI++) % 4], ox = Math.floor(rnd(t * 25) * 384), oy = Math.floor(rnd(t * 25 + 7) * 384);
  for (let X = -ox; X < W; X += 384) for (let Y = -oy; Y < H; Y += 384) x.drawImage(gc, X, Y);
  x.restore();
  chapter(sc, lt);
  // scene fades
  const f = fade(lt, sc.d, sc.id === 'intro' ? 2 : .7, sc.id === 'end' ? 2 : .7);
  if (f < 1) { x.fillStyle = `rgba(0,0,0,${1 - f})`; x.fillRect(0, 0, W, H); }
  // letterbox 2.39:1
  x.fillStyle = '#000'; x.fillRect(0, 0, W, BAR); x.fillRect(0, H - BAR, W, BAR);
  subtitles(t);
}
window.draw = draw;
window.ready = document.fonts.load(`700 40px CG`).then(() => document.fonts.load(`600 40px CG`)).then(() => document.fonts.load(`italic 700 40px CG`)).then(() => document.fonts.ready);

// live preview when opened in a browser
if (!/render/.test(location.search)) {
  const t0 = performance.now();
  const loop = () => { draw(((performance.now() - t0) / 1000) % TOTAL); requestAnimationFrame(loop); };
  window.ready.then(loop);
}
