// Buǵraxan esteligi — kinematik hújjetli film: berilgen kadrlar (footage/) + Ken Burns, reń grading, altın sózler, latın subtitrler.
const W = 1920, H = 1080, PH = 804, BAR = (H - PH) / 2;
const cv = document.getElementById('c'), x = cv.getContext('2d');
const SERIF = 'CG, "Liberation Serif", serif', SANS = 'Inter, "DejaVu Sans", sans-serif';
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), p = (t, a, b) => cl((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - t, 3), sm = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
function hrnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

/* ---------- shot list: [segment index, image, move] ----------
   move: z = [start zoom, end zoom], c = [[x0,y0],[x1,y1]] focus (0..1 of image), look = grade preset */
const KB = (z0, z1, x0, y0, x1, y1, look) => ({ z: [z0, z1], c: [[x0, y0], [x1, y1]], look });
const SHOTS = {
  intro: [[0, '21', KB(1.22, 1.04, .5, .55, .5, .52)]],
  exped: [[0, '02', KB(1.05, 1.2, .45, .5, .4, .5, 'archive')], [2, '03', KB(1.25, 1.08, .55, .6, .5, .55, 'archive')]],
  name: [[0, '22', KB(1.04, 1.18, .45, .5, .6, .45)], [1, '23', KB(1.18, 1.05, .45, .55, .5, .5)], [2, '04', KB(1.06, 1.2, .5, .5, .62, .45)], [3, '01', KB(1.2, 1.04, .55, .45, .5, .5)]],
  minaret: [[0, '05', KB(1.04, 1.22, .35, .5, .55, .5)], [1, '07', KB(1.2, 1.04, .5, .55, .5, .5)], [2, '07', KB(1.32, 1.5, .85, .3, .8, .28)]],
  beacon: [[0, '08', KB(1.05, 1.2, .3, .45, .4, .4)], [1, '07', KB(1.12, 1.35, .75, .45, .86, .28)], [2, '06', KB(1.2, 1.06, .45, .55, .5, .5)], [3, '16', KB(1.05, 1.2, .5, .5, .6, .5)], [4, '17', KB(1.25, 1.06, .5, .6, .5, .5)], [5, '19', KB(1.04, 1.22, .5, .55, .5, .3)]],
  city: [[0, '18', KB(1.22, 1.05, .5, .55, .45, .5)], [1, '09', KB(1.05, 1.2, .5, .5, .55, .55)], [2, '01', KB(1.25, 1.4, .3, .45, .6, .45)], [3, '07', KB(1.06, 1.2, .5, .6, .55, .55)], [4, '09', KB(1.3, 1.5, .55, .3, .58, .38)], [5, '05', KB(1.25, 1.08, .7, .45, .6, .5)]],
  flood: [[0, '10', KB(1.05, 1.18, .5, .5, .58, .45)], [.5, '11', KB(1.2, 1.05, .5, .5, .45, .5)], [1, '12', KB(1.05, 1.22, .45, .55, .4, .6)]],
  modern: [[0, '13', KB(1.04, 1.18, .5, .5, .4, .55)], [1, '03', KB(1.3, 1.5, .55, .62, .5, .65)], [2, '14', KB(1.18, 1.04, .5, .5, .5, .5)], [3, '13', KB(1.4, 1.6, .25, .62, .22, .66)], [4, '19', KB(1.2, 1.04, .5, .5, .5, .45)], [5, '02', KB(1.25, 1.1, .65, .5, .7, .45)], [7, '15', KB(1.04, 1.18, .5, .5, .4, .55)]],
  wisdom: [[0, '04', KB(1.3, 1.1, .45, .4, .5, .45)], [1, '16', KB(1.2, 1.05, .45, .45, .4, .45)], [2, '17', KB(1.04, 1.22, .45, .6, .35, .55)]],
  finale: [[0, '21', KB(1.04, 1.2, .5, .5, .58, .55)], [1, '20', KB(1.2, 1.04, .5, .55, .5, .55)]],
};
const LOOK = { def: 'contrast(1.07) saturate(.9) brightness(1.0)', archive: 'sepia(.65) contrast(1.12) saturate(.7) brightness(.98)' };

/* ---------- keywords (gold) per segment: [seg, word, sub, opts] ---------- */
const KEYS = {
  exped: [[0, 'S. P. Tolstov', 'Xorezm arxeologiya hám etnografiya ekspediciyası'], [1, '50–60-jıllar', 'XX ásir · anıqlanǵan', { size: 70 }], [2, '1946', 'Arxeologiyalıq kartaǵa túsirilgen', { size: 84 }]],
  name: [[0, 'Buǵraxan?', 'Atamanıń sırı', { size: 74 }], [1, '992', 'Mawarannaxr', { size: 84 }], [2, 'Qaraxaniyler', 'Buǵraxannıń atı menen baylanıslı'], [3, 'Xorezmshahlar mámleketiniń orayı?', 'Boljawlar', { size: 52 }]],
  minaret: [[0, 'XI ásir', 'Saqlanǵan minara', { size: 80 }], [1, '60+ gektar', 'Esteliktiń ulıwma maydanı', { size: 76 }], [2, 'Úlken civilizaciya orayı', 'Bir waqıtları', { size: 56 }]],
  beacon: [[1, 'Xabar beriw ornı', 'Boljaw'], [2, 'Jámiyetlik orın', 'Minara átirapı'], [4, 'biyik · dóńgelek · jińishke', 'Xorezm minaraları', { size: 50 }], [5, 'Biyikligi belgisiz', 'Tek ǵana boljawlar', { size: 54 }]],
  city: [[1, 'Namaz oqıytuǵın orın', 'Musılman xalıqlarınıń tariyxında', { size: 54 }], [2, 'Arqa shegara', 'Xorezmshahlar mámleketi'], [3, 'Úsh bólim', 'Izertlewler kórsetti', { size: 70 }], [4, 'Qala meshiti', 'Oraylıq bólimde'], [5, 'Xorezmshahlar dáwiri', 'Minara usılı', { size: 54 }]],
  flood: [[0, 'Saqlanıp qalǵan', 'Birneshe márte suw basqanına qaramastan'], [1, 'Sheberlik', 'Qurılısında', { size: 76 }]],
  modern: [[0, 'Birneshe basqısh', 'Úyreniw jumısları'], [1, 'Qarar № 248 · 2025', 'Ózbekstan Respublikası Prezidenti', { size: 56 }], [2, 'Turistlik baǵdarlar', 'Jańa arxeologiyalıq orınlar', { size: 56 }], [3, 'Berdaq atındaǵı QMU', 'Arxeologiya kafedrası', { size: 56 }], [4, 'Qayta tiklew', 'hám abadanlastırıw'], [7, 'Qısı-jazı ziyarat', 'Endi múmkin', { size: 60 }]],
  wisdom: [[1, 'tereń bilim · bay tájiriybe · sheberlik', null, { size: 46 }], [2, 'Ilim-bilim orayı', 'Orta ásirlerde', { size: 66 }]],
  finale: [[0, 'XI–XIV ásirler', 'Qońırat rayonı', { size: 70 }], [1, 'Biybaha derekler', 'Qatlamlarda', { size: 64 }]],
};
const CH = { exped: 'I · Ashılıw', name: 'II · Atamanıń sırı', minaret: 'III · Minara', beacon: 'IV · Minaranıń xızmeti', city: 'V · Qala hám meshit', flood: 'VI · Suw hám waqıt', modern: 'VII · Jańa bet', wisdom: 'VIII · Ilim orayı', finale: 'IX · Miyras' };

/* ---------- timeline (same rules as 3D version) ---------- */
const CPS = 13, segDur = s => Math.max(3.4, s.length / CPS + .8);
const TL = [], SUBS = []; let TOTAL = 0;
{ let t = 0;
  for (const sc of window.SCRIPT) {
    if (sc.id === 'int') continue;
    const e = { ...sc, t0: t, T: [] };
    if (sc.id === 'intro') e.d = 10; else if (sc.id === 'end') e.d = 7;
    else { let u = 1.4; for (const s of sc.segs) { e.T.push(u); SUBS.push({ s, a: t + u, b: t + u + segDur(s) - .35 }); u += segDur(s); } e.d = u + (sc.id === 'finale' ? 5 : 1.2); }
    t += e.d; TL.push(e);
  } TOTAL = t; }
window.TOTAL = TOTAL;
window.TIMELINE = { fps: 25, total: TOTAL, scenes: TL.map(e => ({ id: e.id, t0: +e.t0.toFixed(3), d: +e.d.toFixed(3), segs: e.T.map(v => +(e.t0 + v).toFixed(3)) })), subs: SUBS.map(s => ({ a: +s.a.toFixed(3), b: +s.b.toFixed(3), s: s.s })) };
// absolute shot list
const SH = [];
for (const e of TL) {
  for (const [si, img, mv] of (SHOTS[e.id] || [])) {
    const k = Math.floor(si), fr = si - k, segStart = e.T.length ? e.T[k] : 0, segEnd = e.T.length ? (e.T[k + 1] ?? e.d) : e.d;
    const st = si === 0 ? 0 : segStart + (segEnd - segStart) * fr - .5;
    SH.push({ scene: e, img, mv, a: e.t0 + st });
  }
}
SH.forEach((s, i) => { const n = SH[i + 1]; s.b = n && n.scene === s.scene ? n.a + .9 : s.scene.t0 + s.scene.d; });

/* ---------- images ---------- */
const IMG = {};
const need = [...new Set(SH.map(s => s.img))];
window.ready = Promise.all(need.map(n => new Promise(r => { const im = new Image(); im.onload = () => { IMG[n] = im; r(); }; im.src = `footage/${n}.jpg`; })))
  .then(() => document.fonts.ready).then(() => true);

/* ---------- grain ---------- */
const GR = [0, 1, 2, 3].map(() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; });

/* ---------- text ---------- */
function txt(s, X, Y, size, color, o = {}) {
  x.save(); x.globalAlpha *= (o.a ?? 1); x.font = `${o.it ? 'italic ' : ''}${o.w || 600} ${size}px ${o.f || SANS}`;
  x.fillStyle = color; x.textAlign = o.al || 'center'; x.textBaseline = 'middle'; x.letterSpacing = (o.ls || 0) + 'px';
  x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = o.gb ?? 14; x.shadowOffsetY = 2; x.fillText(s, X, Y); x.restore();
}
function gold(s, X, Y, size, lt, t0, o = {}) {
  const a0 = o.a ?? 1; if (a0 <= 0 || lt < t0) return;
  x.save(); x.font = `${o.it ? 'italic ' : ''}${o.w || 700} ${size}px ${o.f || SERIF}`; x.letterSpacing = (o.ls || 0) + 'px'; x.textBaseline = 'middle'; x.textAlign = 'left';
  const ch = [...s], tot = x.measureText(s).width, x0 = o.al === 'left' ? X : o.al === 'right' ? X - tot : X - tot / 2;
  const g = x.createLinearGradient(x0, Y - size * .55, x0 + tot * .35, Y + size * .5);
  g.addColorStop(0, '#f6dc95'); g.addColorStop(.35, '#c8933a'); g.addColorStop(.6, '#ffe9b0'); g.addColorStop(.85, '#b07a2a'); g.addColorStop(1, '#f2d38a');
  const sh = ((lt - t0) * .45) % 2.2 - .6, hg = x.createLinearGradient(x0, Y, x0 + tot, Y);
  [[-.2, 0], [-.06, 0], [0, .85], [.06, 0], [1.4, 0]].forEach(([d, al]) => hg.addColorStop(cl(sh + d), `rgba(255,250,225,${al})`));
  let acc = '';
  ch.forEach((c, i) => {
    const px = x0 + x.measureText(acc).width; acc += c;
    const k = eo(p(lt, t0 + i * (o.st ?? .04), t0 + i * (o.st ?? .04) + .75)); if (k <= 0) return;
    const dy = (1 - k) * size * .35;
    x.globalAlpha = k * a0; x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowBlur = 16; x.shadowOffsetY = 3; x.fillStyle = g; x.fillText(c, px, Y + dy);
    x.shadowColor = `rgba(255,180,70,${.5 * k})`; x.shadowBlur = 28 * k; x.shadowOffsetY = 0; x.fillText(c, px, Y + dy);
    x.shadowColor = 'transparent'; x.globalCompositeOperation = 'lighter'; x.globalAlpha = k * a0 * .9; x.fillStyle = hg; x.fillText(c, px, Y + dy); x.globalCompositeOperation = 'source-over';
  });
  x.restore();
}
function keyword(word, sub, lt, t0, t1, o = {}) {
  const k = eo(p(lt, t0, t0 + .9)) * (1 - p(lt, t1 - .6, t1)); if (k <= 0) return;
  const X = 150, Y = BAR + PH - 150;
  x.save(); x.globalAlpha = k * .8; const g = x.createRadialGradient(X + 280, Y, 20, X + 280, Y, 560); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(X - 280, Y - 280, 1120, 560); x.restore();
  x.save(); x.globalAlpha = k; x.fillStyle = '#e6b877'; x.fillRect(X, Y - 52, 3, sub ? 106 : 70); x.restore();
  gold(word, X + 26, Y - 16, o.size || 62, lt, t0, { al: 'left', a: 1 - p(lt, t1 - .6, t1) });
  if (sub) txt(sub.toUpperCase(), X + 28 + (1 - k) * 22, Y + 34, 20, '#ecd2a8', { al: 'left', a: k * .95, ls: 5 });
}

/* ---------- drawing ---------- */
function shot(s, t, alpha) {
  const im = IMG[s.img]; if (!im) return;
  const u = sm(p(t, s.a, s.b)), z = lerp(s.mv.z[0], s.mv.z[1], u);
  const cx = lerp(s.mv.c[0][0], s.mv.c[1][0], u) * im.width, cy = lerp(s.mv.c[0][1], s.mv.c[1][1], u) * im.height;
  const base = Math.max(W / im.width, PH / im.height), sc = base * z, vw = W / sc, vh = PH / sc;
  const sx = cl(cx - vw / 2, 0, im.width - vw), sy = cl(cy - vh / 2, 0, im.height - vh);
  x.save(); x.globalAlpha = alpha; x.filter = LOOK[s.mv.look || 'def'];
  x.drawImage(im, sx, sy, vw, vh, 0, BAR, W, PH); x.restore();
}
function draw(t) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const sc = TL.find(e => t >= e.t0 && t < e.t0 + e.d) || TL[TL.length - 1], lt = t - sc.t0;
  // shots with cross-dissolve
  const act = SH.filter(s => t >= s.a && t < s.b);
  act.forEach((s, i) => { const a = i === 0 ? 1 : eo(p(t, s.a, s.a + .9)); shot(s, t, a); });
  // archive flicker & scratches
  const arch = act.some(s => s.mv.look === 'archive');
  if (arch) {
    const fr = Math.floor(t * 25); x.fillStyle = `rgba(20,10,0,${.05 + .06 * hrnd(fr)})`; x.fillRect(0, BAR, W, PH);
    for (let i = 0; i < 3; i++) if (hrnd(fr * 3 + i) > .6) { const sx = hrnd(fr * 7 + i) * W; x.strokeStyle = 'rgba(255,240,210,.22)'; x.lineWidth = 1 + hrnd(fr + i); x.beginPath(); x.moveTo(sx, BAR); x.lineTo(sx + (hrnd(fr + 9) - .5) * 20, BAR + PH); x.stroke(); }
    for (let i = 0; i < 6; i++) if (hrnd(fr * 11 + i) > .75) { x.fillStyle = 'rgba(20,12,4,.55)'; x.beginPath(); x.arc(hrnd(fr * 13 + i) * W, BAR + hrnd(fr * 17 + i) * PH, 1 + hrnd(fr + i * 3) * 3, 0, 7); x.fill(); }
  }
  // warm light sweep + floating dust
  x.save(); x.globalCompositeOperation = 'screen';
  const lx = W * (.15 + .7 * ((t * .02) % 1)), lg = x.createRadialGradient(lx, BAR + PH * .2, 0, lx, BAR + PH * .2, 900); lg.addColorStop(0, 'rgba(255,190,120,.10)'); lg.addColorStop(1, 'rgba(255,190,120,0)'); x.fillStyle = lg; x.fillRect(0, BAR, W, PH);
  for (let i = 0; i < 40; i++) { const X = (hrnd(i) * W + t * (6 + hrnd(i + 3) * 14)) % W, Y = BAR + ((hrnd(i + 50) * PH - t * (3 + hrnd(i + 9) * 8)) % PH + PH) % PH; x.globalAlpha = .2 + .3 * Math.abs(Math.sin(t * .7 + i)); x.fillStyle = '#ffe2b0'; x.beginPath(); x.arc(X, Y, .8 + hrnd(i + 7) * 1.8, 0, 7); x.fill(); }
  x.restore();
  // vignette + grain
  const vg = x.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = vg; x.fillRect(0, BAR, W, PH);
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = arch ? .14 : .07; const gc = GR[Math.floor(t * 25) % 4], ox = Math.floor(hrnd(t * 25) * 256), oy = Math.floor(hrnd(t * 25 + 3) * 256);
  for (let X = -ox; X < W; X += 256) for (let Y = BAR - oy; Y < BAR + PH; Y += 256) x.drawImage(gc, X, Y); x.restore();
  // titles & keywords
  if (sc.id === 'intro') {
    const out = 1 - p(lt, sc.d - 1.4, sc.d - .2);
    x.save(); x.globalAlpha = out; x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, BAR, W, PH); x.restore();
    txt('QARAQALPAQSTAN TARIYXI', W / 2, 420, 30, '#f3dcb4', { w: 500, ls: 16, a: eo(p(lt, 1, 2.4)) * out });
    gold('Buǵraxan esteligi', W / 2, 520, 130, lt, 2, { st: .07, a: out });
    gold('XI–XIV ásirler  ·  Qońırat rayonı', W / 2, 625, 34, lt, 4, { it: true, ls: 2, st: .025, a: out });
  }
  if (sc.id === 'end') {
    gold('Buǵraxan esteligi', W / 2, 515, 116, lt, .8, { st: .06, a: 1 - p(lt, sc.d - 1.5, sc.d - .3) });
    txt('QARAQALPAQSTAN TARIYXI', W / 2, 420, 30, '#d9b98a', { w: 500, ls: 16, a: eo(p(lt, .3, 1.5)) * (1 - p(lt, sc.d - 1.5, sc.d - .3)) });
  }
  for (const [si, w, sub, o] of (KEYS[sc.id] || [])) { const t0 = sc.T[si] + .5, t1 = (sc.T[si + 1] ?? sc.d) - .1; keyword(w, sub, lt, t0, t1, o || {}); }
  if (CH[sc.id]) { const k = eo(p(lt, .6, 1.6)) * (1 - p(lt, 5.5, 6.7)); if (k > 0) { x.save(); x.globalAlpha = k; x.fillStyle = '#e6b877'; x.fillRect(110, BAR + 46, 46 * k, 2); x.restore(); txt(CH[sc.id].toUpperCase(), 172, BAR + 47, 21, '#f6e2c0', { a: k, al: 'left', ls: 6 }); } }
  // scene fades
  const f = Math.min(eo(p(lt, 0, sc.id === 'intro' ? 1.8 : .5)), eo(p(sc.d - lt, 0, sc.id === 'end' ? 1.5 : .5)));
  if (f < 1) { x.fillStyle = `rgba(0,0,0,${1 - f})`; x.fillRect(0, 0, W, H); }
  x.fillStyle = '#000'; x.fillRect(0, 0, W, BAR); x.fillRect(0, H - BAR, W, BAR);
  if (!/nosubs/.test(location.search)) { const s = SUBS.find(q => t >= q.a && t < q.b); if (s) {
    const k = Math.min(p(t, s.a, s.a + .25), p(s.b - t, 0, .25)); x.font = `500 30px ${SANS}`; x.letterSpacing = '0px';
    const ws = s.s.split(' '), ls = []; let cur = ''; for (const w of ws) { const tt = cur ? cur + ' ' + w : w; if (x.measureText(tt).width > 1560 && cur) { ls.push(cur); cur = w; } else cur = tt; } ls.push(cur);
    const y0 = H - BAR / 2 - (ls.length - 1) * 20; ls.forEach((ln, i) => txt(ln, W / 2, y0 + i * 40, 30, '#f3ece0', { w: 500, a: k, gb: 0 }));
  } }
}
window.draw = draw;
if (!/render/.test(location.search)) { const t0 = performance.now(); window.ready.then(() => { const loop = () => { draw(((performance.now() - t0) / 1000) % TOTAL); requestAnimationFrame(loop); }; loop(); }); }
