// Shared helpers, icons and phone-app screens (from v1/v2)
const W = 1920, H = 1080;
const cv = document.getElementById('c');
const MAIN = cv.getContext('2d');
let x = MAIN;
const F = 'Inter, "DejaVu Sans", sans-serif';
const C = {
  bg1: '#020f17', bg2: '#06394a', acc: '#19d38b', acc2: '#2ec5ff', red: '#ff3b5c',
  yel: '#ffc542', white: '#ffffff', mut: '#a9bde3', card: '#0f2a5c'
};

/* ---------- helpers ---------- */
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const p = (t, a, b) => cl((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - t, 3);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const back = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const lerp = (a, b, t) => a + (b - a) * t;
function rnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function rr(x0, y0, w, h, r) { x.beginPath(); x.roundRect(x0, y0, w, h, r); }
function txt(s, X, Y, size, color, opt = {}) {
  x.save();
  x.globalAlpha *= (opt.a ?? 1);
  x.font = `${opt.w || 700} ${size}px ${F}`;
  x.fillStyle = color; x.textAlign = opt.al || 'center'; x.textBaseline = 'middle';
  if (opt.glow) { x.shadowColor = opt.glow; x.shadowBlur = opt.gb || 30; }
  if (opt.ls) x.letterSpacing = opt.ls + 'px';
  x.fillText(s, X, Y);
  x.restore();
}
// animated text: slide up + fade
function atxt(s, X, Y, size, color, lt, start, opt = {}) {
  const k = eo(p(lt, start, start + (opt.dur || .7)));
  if (k <= 0) return;
  txt(s, X, Y + (1 - k) * 40, size, color, { ...opt, a: k * (opt.a ?? 1) });
}
// typewriter
function ttxt(s, X, Y, size, color, lt, start, cps, opt = {}) {
  const n = Math.floor(cl((lt - start) * cps, 0, s.length));
  if (n <= 0) return;
  const cur = n < s.length && Math.floor(lt * 3) % 2 ? '|' : '';
  txt(s.slice(0, n) + cur, X, Y, size, color, opt);
}
function wrap(s, maxW, size, w = 600) {
  x.font = `${w} ${size}px ${F}`;
  const words = s.split(' '), lines = []; let cur = '';
  for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function para(s, X, Y, size, color, lt, start, maxW, opt = {}) {
  const lines = wrap(s, maxW, size, opt.w || 500);
  lines.forEach((ln, i) => atxt(ln, X, Y + i * size * 1.35, size, color, lt, start + i * .12, { al: 'left', w: 500, ...opt }));
  return lines.length;
}
function glowCircle(X, Y, r, col, a = 1) {
  x.save(); x.globalAlpha *= a;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, 7); x.fill(); x.restore();
}

/* ---------- icons ---------- */
function shieldPath(X, Y, s) {
  x.beginPath();
  x.moveTo(X, Y - 110 * s);
  x.bezierCurveTo(X + 50 * s, Y - 80 * s, X + 90 * s, Y - 78 * s, X + 95 * s, Y - 78 * s);
  x.bezierCurveTo(X + 98 * s, Y + 10 * s, X + 70 * s, Y + 80 * s, X, Y + 115 * s);
  x.bezierCurveTo(X - 70 * s, Y + 80 * s, X - 98 * s, Y + 10 * s, X - 95 * s, Y - 78 * s);
  x.bezierCurveTo(X - 90 * s, Y - 78 * s, X - 50 * s, Y - 80 * s, X, Y - 110 * s);
  x.closePath();
}
function shield(X, Y, s, col = C.acc, checkK = 1, lt = 0) {
  x.save();
  x.shadowColor = col; x.shadowBlur = 50 * s;
  shieldPath(X, Y, s);
  const g = x.createLinearGradient(X, Y - 110 * s, X, Y + 115 * s);
  g.addColorStop(0, col); g.addColorStop(1, '#0b6e52');
  x.fillStyle = g; x.fill();
  x.shadowBlur = 0;
  x.lineWidth = 6 * s; x.strokeStyle = 'rgba(255,255,255,.85)'; x.stroke();
  shieldPath(X, Y, s * .78); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 3 * s; x.stroke();
  // shine
  x.save(); shieldPath(X, Y, s); x.clip();
  const sx = X - 200 * s + ((lt * 0.5) % 2) * 400 * s;
  x.fillStyle = 'rgba(255,255,255,.18)';
  x.beginPath(); x.moveTo(sx, Y - 140 * s); x.lineTo(sx + 40 * s, Y - 140 * s); x.lineTo(sx - 60 * s, Y + 140 * s); x.lineTo(sx - 100 * s, Y + 140 * s); x.fill();
  x.restore();
  if (checkK > 0) check(X, Y + 5 * s, 55 * s, checkK, '#fff', 14 * s);
  x.restore();
}
function check(X, Y, s, k, col, lw) {
  const pts = [[-0.7, 0], [-0.2, 0.5], [0.75, -0.55]];
  const segs = [Math.hypot(.5, .5), Math.hypot(.95, 1.05)];
  const tot = segs[0] + segs[1]; let rem = k * tot;
  x.save(); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(X + pts[0][0] * s, Y + pts[0][1] * s);
  for (let i = 0; i < 2; i++) {
    const f = cl(rem / segs[i]); rem -= segs[i];
    const a = pts[i], b = pts[i + 1];
    x.lineTo(X + lerp(a[0], b[0], f) * s, Y + lerp(a[1], b[1], f) * s);
    if (f < 1) break;
  }
  x.stroke(); x.restore();
}
function bug(X, Y, s, t, col = C.red) {
  x.save(); x.translate(X, Y); x.scale(s, s);
  x.shadowColor = col; x.shadowBlur = 30;
  // legs
  x.strokeStyle = col; x.lineWidth = 6; x.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const w = Math.sin(t * 14 + i) * 8;
    x.beginPath(); x.moveTo(-28, i * 18); x.lineTo(-58, i * 22 + w); x.stroke();
    x.beginPath(); x.moveTo(28, i * 18); x.lineTo(58, i * 22 - w); x.stroke();
  }
  // antenna
  x.beginPath(); x.moveTo(-10, -42); x.quadraticCurveTo(-20, -70, -34, -72 + Math.sin(t * 9) * 4); x.stroke();
  x.beginPath(); x.moveTo(10, -42); x.quadraticCurveTo(20, -70, 34, -72 - Math.sin(t * 9) * 4); x.stroke();
  // body
  x.fillStyle = col; x.beginPath(); x.ellipse(0, 5, 32, 42, 0, 0, 7); x.fill();
  x.shadowBlur = 0;
  x.fillStyle = '#7a0019'; x.beginPath(); x.arc(0, -34, 20, 0, 7); x.fill();
  x.strokeStyle = '#7a0019'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, -14); x.lineTo(0, 46); x.stroke();
  // eyes
  x.fillStyle = '#fff'; x.beginPath(); x.arc(-8, -36, 6, 0, 7); x.arc(8, -36, 6, 0, 7); x.fill();
  x.fillStyle = '#000'; x.beginPath(); x.arc(-7, -35, 3, 0, 7); x.arc(9, -35, 3, 0, 7); x.fill();
  x.restore();
}
function warnTri(X, Y, s, col = C.yel, a = 1) {
  x.save(); x.globalAlpha *= a; x.translate(X, Y); x.scale(s, s);
  x.shadowColor = col; x.shadowBlur = 30;
  x.fillStyle = col; x.beginPath(); x.moveTo(0, -50); x.lineTo(56, 45); x.lineTo(-56, 45); x.closePath();
  x.lineJoin = 'round'; x.lineWidth = 14; x.strokeStyle = col; x.stroke(); x.fill();
  x.shadowBlur = 0; x.fillStyle = '#1a1200';
  rr(-6, -22, 12, 40, 6); x.fill(); x.beginPath(); x.arc(0, 32, 7, 0, 7); x.fill();
  x.restore();
}
function lockIcon(X, Y, s, col = C.yel, open = 0) {
  x.save(); x.translate(X, Y); x.scale(s, s);
  x.strokeStyle = col; x.lineWidth = 9; x.beginPath();
  x.arc(0, -18 - open * 14, 22, Math.PI, 0); x.lineTo(22, -2 - open * 14); x.stroke();
  x.beginPath(); x.moveTo(-22, -18 - open * 14); x.lineTo(-22, -2); x.stroke();
  x.fillStyle = col; rr(-34, -6, 68, 54, 10); x.fill();
  x.fillStyle = '#1a1200'; x.beginPath(); x.arc(0, 16, 8, 0, 7); x.fill(); rr(-3, 16, 6, 18, 3); x.fill();
  x.restore();
}
function cardIcon(X, Y, s, a = 1) {
  x.save(); x.globalAlpha *= a; x.translate(X, Y); x.scale(s, s);
  const g = x.createLinearGradient(-60, -38, 60, 38); g.addColorStop(0, '#ffd36e'); g.addColorStop(1, '#ff8a3d');
  x.fillStyle = g; rr(-60, -38, 120, 76, 10); x.fill();
  x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-60, -22, 120, 14);
  x.fillStyle = '#fff8'; rr(-48, 6, 24, 18, 3); x.fill();
  x.fillStyle = '#fff'; x.font = `700 12px ${F}`; x.textAlign = 'left'; x.fillText('**** 4821', -14, 20);
  x.restore();
}
function keyIcon(X, Y, s, a = 1) {
  x.save(); x.globalAlpha *= a; x.translate(X, Y); x.scale(s, s);
  x.strokeStyle = C.acc2; x.fillStyle = C.acc2; x.lineWidth = 10; x.lineCap = 'round';
  x.beginPath(); x.arc(-30, 0, 22, 0, 7); x.stroke();
  x.beginPath(); x.moveTo(-8, 0); x.lineTo(50, 0); x.moveTo(36, 0); x.lineTo(36, 18); x.moveTo(50, 0); x.lineTo(50, 14); x.stroke();
  x.restore();
}
function pinIcon(X, Y, s, a = 1) {
  x.save(); x.globalAlpha *= a; x.translate(X, Y); x.scale(s, s);
  x.fillStyle = '#ffffff'; rr(-62, -32, 124, 64, 14); x.fill();
  x.fillStyle = '#0a2459';
  for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(-39 + i * 26, 0, 8, 0, 7); x.fill(); }
  x.restore();
}
function userIcon(X, Y, s, a = 1) {
  x.save(); x.globalAlpha *= a; x.translate(X, Y); x.scale(s, s);
  x.fillStyle = '#c9a7ff'; rr(-55, -40, 110, 80, 10); x.fill();
  x.fillStyle = '#4b2a8c'; x.beginPath(); x.arc(-25, -6, 14, 0, 7); x.fill();
  x.beginPath(); x.ellipse(-25, 22, 22, 12, 0, Math.PI, 0); x.fill();
  x.fillRect(2, -16, 40, 7); x.fillRect(2, 0, 30, 7); x.fillRect(2, 16, 36, 7);
  x.restore();
}
function hacker(X, Y, s, a = 1, t = 0) {
  x.save(); x.globalAlpha *= a; x.translate(X, Y); x.scale(s, s);
  glowCircle(0, 0, 220, 'rgba(255,59,92,.35)');
  x.fillStyle = '#0b0f1c';
  x.beginPath(); x.moveTo(-150, 200); x.quadraticCurveTo(-150, 40, -90, 10);
  x.quadraticCurveTo(-110, -150, 0, -170); x.quadraticCurveTo(110, -150, 90, 10);
  x.quadraticCurveTo(150, 40, 150, 200); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,59,92,.6)'; x.lineWidth = 4; x.stroke();
  x.fillStyle = '#000'; x.beginPath(); x.ellipse(0, -50, 62, 80, 0, 0, 7); x.fill();
  const bl = Math.abs(Math.sin(t * 2)) > .05 ? 1 : .1;
  x.fillStyle = C.red; x.shadowColor = C.red; x.shadowBlur = 25;
  x.beginPath(); x.ellipse(-24, -55, 14, 6 * bl, 0.2, 0, 7); x.ellipse(24, -55, 14, 6 * bl, -0.2, 0, 7); x.fill();
  x.restore();
}
function finger(X, Y, s, press, a = 1) {
  if (a <= 0) return;
  x.save(); x.globalAlpha *= a;
  if (press > 0 && press < 1) {
    x.strokeStyle = `rgba(255,255,255,${1 - press})`; x.lineWidth = 5;
    x.beginPath(); x.arc(X, Y, 20 + press * 60, 0, 7); x.stroke();
  }
  x.translate(X, Y); x.scale(s * (1 - Math.sin(cl(press) * Math.PI) * .1), s * (1 - Math.sin(cl(press) * Math.PI) * .1));
  x.fillStyle = '#ffd8b8'; x.strokeStyle = '#c98d62'; x.lineWidth = 3;
  x.beginPath(); x.roundRect(-18, -6, 36, 120, 18); x.fill(); x.stroke();
  x.beginPath(); x.roundRect(-32, 60, 90, 120, 34); x.fill(); x.stroke();
  x.fillStyle = '#fff6'; rr(-10, 0, 20, 22, 8); x.fill();
  x.restore();
}

/* ---------- phone ---------- */
const PW = 400, PH = 800;
function phone(X, Y, s, content, glowCol = C.acc2) {
  x.save(); x.translate(X, Y); x.scale(s, s);
  x.shadowColor = glowCol; x.shadowBlur = 60;
  x.fillStyle = '#10151f'; rr(-PW / 2, -PH / 2, PW, PH, 56); x.fill();
  x.shadowBlur = 0;
  x.strokeStyle = '#3a4560'; x.lineWidth = 4; x.stroke();
  const sx = -PW / 2 + 16, sy = -PH / 2 + 16, sw = PW - 32, sh = PH - 32;
  x.save(); rr(sx, sy, sw, sh, 44); x.clip();
  const g = x.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, '#f4f7fc'); g.addColorStop(1, '#e3eaf6');
  x.fillStyle = g; x.fillRect(sx, sy, sw, sh);
  content(sx, sy, sw, sh);
  x.restore();
  // notch
  x.fillStyle = '#10151f'; rr(-60, -PH / 2 + 26, 120, 30, 15); x.fill();
  x.restore();
}
function statusBar(sx, sy, sw, dark = false) {
  const c = dark ? '#fff' : '#1b2a4a';
  txt('9:41', sx + 40, sy + 40, 18, c, { al: 'left', w: 700 });
  x.fillStyle = c; rr(sx + sw - 70, sy + 32, 34, 16, 4); x.fill();
}
function appHeader(sx, sy, sw, title) {
  const g = x.createLinearGradient(sx, sy, sx + sw, sy + 200);
  g.addColorStop(0, '#0d8f5f'); g.addColorStop(1, '#13b37a');
  x.fillStyle = g; x.fillRect(sx, sy, sw, 150);
  statusBar(sx, sy, sw, true);
  txt(title, sx + 30, sy + 105, 30, '#fff', { al: 'left', w: 800 });
}
function appHome(sx, sy, sw, sh, lt) {
  appHeader(sx, sy, sw, 'Xazna');
  // balance card
  x.fillStyle = '#fff'; x.shadowColor = 'rgba(0,0,0,.15)'; x.shadowBlur = 20;
  rr(sx + 24, sy + 130, sw - 48, 150, 22); x.fill(); x.shadowBlur = 0;
  txt('Asosiy hisob', sx + 50, sy + 170, 18, '#6a7a99', { al: 'left', w: 500 });
  txt('2 450 000 so‘m', sx + 50, sy + 215, 32, '#0d2a55', { al: 'left', w: 800 });
  txt('**** 4821', sx + 50, sy + 255, 16, '#6a7a99', { al: 'left', w: 500 });
  const items = ['O‘tkazma', 'To‘lov', 'Kartalar', 'Kredit'];
  items.forEach((it, i) => {
    const cx = sx + 60 + i * 82, cy = sy + 340;
    x.fillStyle = '#dff6ec'; x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.fill();
    x.fillStyle = '#13b37a'; x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.fill();
    txt(it, cx, cy + 50, 14, '#33415e', { w: 600 });
  });
  for (let i = 0; i < 4; i++) {
    x.fillStyle = '#fff'; rr(sx + 24, sy + 430 + i * 76, sw - 48, 62, 14); x.fill();
    x.fillStyle = '#e5ebf5'; x.beginPath(); x.arc(sx + 60, sy + 461 + i * 76, 18, 0, 7); x.fill();
    x.fillStyle = '#c9d3e6'; rr(sx + 92, sy + 450 + i * 76, 140, 10, 5); x.fill(); rr(sx + 92, sy + 468 + i * 76, 90, 8, 4); x.fill();
  }
}


const STEPS = [
  ['Ilova sizni darhol ogohlantiradi', 'Pul o‘tkazmoqchi bo‘lsangiz va zararli dastur aniqlansa'],
  ['«Muammoni hal qilish» tugmasini bosing', 'Tizim zararli dasturni boshqarish sahifasiga olib o‘tadi'],
  ['«Ruxsatni olib tashlash» funksiyasini yoqing', 'Ilova ishlamasa — ruxsatlarni o‘chiring'],
  ['Pastdagi «Olib tashlash» tugmasini bosing', 'Zararli dastur telefoningizdan o‘chiriladi'],
];
let STEP_D = [9, 10, 6, 7.5];
function transferScreen(sx, sy, sw, sh, lt) {
  appHeader(sx, sy, sw, 'Pul o‘tkazmasi');
  x.fillStyle = '#fff'; rr(sx + 24, sy + 180, sw - 48, 110, 18); x.fill();
  txt('Qabul qiluvchi karta', sx + 48, sy + 215, 17, '#6a7a99', { al: 'left', w: 500 });
  txt('8600 **** **** 1290', sx + 48, sy + 255, 24, '#0d2a55', { al: 'left', w: 700 });
  x.fillStyle = '#fff'; rr(sx + 24, sy + 310, sw - 48, 110, 18); x.fill();
  txt('Summa', sx + 48, sy + 345, 17, '#6a7a99', { al: 'left', w: 500 });
  txt('500 000 so‘m', sx + 48, sy + 385, 28, '#0d2a55', { al: 'left', w: 800 });
  x.fillStyle = '#13b37a'; rr(sx + 24, sy + sh - 130, sw - 48, 76, 38); x.fill();
  txt('Yuborish', sx + sw / 2, sy + sh - 92, 26, '#fff', { w: 800 });
}
function warnModal(sx, sy, sw, sh, k, pressBtn) {
  x.fillStyle = `rgba(5,12,30,${k * .6})`; x.fillRect(sx, sy, sw, sh);
  const kk = back(k);
  x.save(); x.translate(sx + sw / 2, sy + sh / 2); x.scale(kk, kk);
  x.fillStyle = '#fff'; rr(-160, -210, 320, 420, 30); x.fill();
  x.fillStyle = '#ffe5ea'; x.beginPath(); x.arc(0, -120, 55, 0, 7); x.fill();
  warnTri(0, -118, .5, C.red);
  txt('Diqqat!', 0, -30, 30, C.red, { w: 900 });
  txt('Qurilmangizda zararli', 0, 15, 20, '#0d2a55', { w: 600 });
  txt('dastur aniqlandi', 0, 43, 20, '#0d2a55', { w: 600 });
  const pr = Math.sin(cl(pressBtn) * Math.PI) * .06;
  x.save(); x.scale(1 - pr, 1 - pr);
  x.fillStyle = C.red; rr(-130, 100, 260, 70, 35); x.fill();
  txt('Muammoni hal qilish', 0, 135, 20, '#fff', { w: 800 });
  x.restore();
  x.restore();
}
function toggle(X, Y, on) {
  x.fillStyle = on > .5 ? '#13b37a' : '#c3cde0';
  x.fillStyle = `rgb(${lerp(195, 19, on)},${lerp(205, 179, on)},${lerp(224, 122, on)})`;
  rr(X, Y, 76, 42, 21); x.fill();
  x.fillStyle = '#fff'; x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 6;
  x.beginPath(); x.arc(X + 21 + on * 34, Y + 21, 17, 0, 7); x.fill(); x.shadowBlur = 0;
}
function managerScreen(sx, sy, sw, sh, lt, tog, delPress, removed) {
  x.fillStyle = '#1b2a4a'; x.fillRect(sx, sy, sw, 150);
  statusBar(sx, sy, sw, true);
  txt('Zararli dasturni', sx + 30, sy + 92, 24, '#fff', { al: 'left', w: 800 });
  txt('boshqarish', sx + 30, sy + 124, 24, '#fff', { al: 'left', w: 800 });
  const fade = 1 - removed;
  x.save(); x.globalAlpha *= fade;
  x.fillStyle = '#fff'; rr(sx + 24, sy + 180, sw - 48, 150, 20); x.fill();
  x.fillStyle = '#ffe5ea'; rr(sx + 44, sy + 200, 80, 80, 18); x.fill();
  bug(sx + 84, sy + 245, .5, lt);
  txt('Noma’lum ilova', sx + 140, sy + 225, 22, '#0d2a55', { al: 'left', w: 800 });
  txt('Xavf darajasi: yuqori', sx + 140, sy + 258, 17, C.red, { al: 'left', w: 600 });
  txt('Ilova ishlamayapti', sx + 44, sy + 305, 16, '#6a7a99', { al: 'left', w: 500 });
  x.fillStyle = '#fff'; rr(sx + 24, sy + 350, sw - 48, 90, 20); x.fill();
  txt('Ruxsatni olib', sx + 48, sy + 380, 20, '#0d2a55', { al: 'left', w: 700 });
  txt('tashlash', sx + 48, sy + 408, 20, '#0d2a55', { al: 'left', w: 700 });
  toggle(sx + sw - 120, sy + 374, tog);
  const pr = Math.sin(cl(delPress) * Math.PI) * .06;
  x.save(); x.translate(sx + sw / 2, sy + sh - 92); x.scale(1 - pr, 1 - pr);
  x.fillStyle = tog > .5 ? C.red : '#e0a3ae'; rr(-(sw - 48) / 2, -38, sw - 48, 76, 38); x.fill();
  txt('Olib tashlash', 0, 0, 26, '#fff', { w: 800 });
  x.restore();
  x.restore();
  // disintegration particles
  if (removed > 0 && removed < 1) {
    for (let i = 0; i < 40; i++) {
      const a = rnd(i) * 6.283, r = removed * (80 + rnd(i + 5) * 200);
      x.fillStyle = i % 2 ? C.red : '#7a0019';
      x.globalAlpha = 1 - removed;
      x.fillRect(sx + 84 + Math.cos(a) * r, sy + 245 + Math.sin(a) * r, 8, 8);
    }
    x.globalAlpha = 1;
  }
  if (removed > 0) {
    const k = back(p(removed, .3, 1));
    x.save(); x.translate(sx + sw / 2, sy + sh / 2 - 40); x.scale(k, k);
    x.fillStyle = '#13b37a'; x.shadowColor = '#13b37a'; x.shadowBlur = 40;
    x.beginPath(); x.arc(0, 0, 90, 0, 7); x.fill(); x.shadowBlur = 0;
    check(0, 0, 50, p(removed, .5, 1), '#fff', 14);
    txt('Zararli dastur', 0, 150, 28, '#0d2a55', { w: 800 });
    txt('o‘chirildi!', 0, 188, 28, '#13b37a', { w: 900 });
    x.restore();
  }
}
