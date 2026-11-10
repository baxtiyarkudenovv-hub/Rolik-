// Қосымша 3D декорациялар: рельеф карталар, теңге, қарар, қазыў, астролябия, қатламлар, реконструкция, тасқын, лагерь.
import * as THREE from 'three';
import { rng, fbm, canvas, tex, normalFrom, noiseFill, height, minaretMesh, CITY, CITADEL } from './world.js';

/* ================= relief maps ================= */
function smooth(pts, n = 8) {
  const o = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; o.push([0, 1].map(j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  o.push(pts[pts.length - 1]); return o;
}
export const GEO = {
  ARAL: smooth([[760, 150], [900, 110], [1060, 135], [1200, 120], [1290, 190], [1270, 300], [1310, 390], [1230, 470], [1120, 500], [1030, 540], [930, 520], [850, 470], [800, 390], [740, 330], [720, 240], [760, 150]], 6),
  AMU: smooth([[1640, 1080], [1560, 960], [1440, 880], [1330, 800], [1230, 720], [1130, 650], [1070, 590], [1040, 545]], 10),
  AMU2: smooth([[1130, 650], [1060, 640], [990, 600], [960, 535]], 8),
  KHOREZM: smooth([[1020, 660], [1140, 640], [1290, 740], [1400, 860], [1330, 930], [1190, 880], [1080, 790], [990, 720], [1020, 660]], 6),
  STATE: smooth([[420, 640], [700, 560], [930, 590], [1150, 600], [1400, 700], [1700, 820], [1800, 1000], [1300, 1080], [700, 1060], [380, 900], [420, 640]], 6),
  BUG: [960, 640],
  RA: smooth([[300, 270], [400, 230], [520, 270], [540, 380], [470, 450], [360, 440], [290, 360], [300, 270]], 6),
  RAMU: smooth([[1180, 1080], [1060, 900], [900, 760], [700, 600], [560, 490], [500, 440]], 10),
  RSYR: smooth([[1640, 620], [1480, 560], [1250, 470], [960, 380], [720, 340], [545, 330]], 10),
  MAVR: smooth([[860, 700], [980, 610], [1160, 560], [1360, 560], [1450, 640], [1380, 760], [1200, 860], [1000, 880], [880, 800], [860, 700]], 6),
  ARR1: smooth([[1820, 380], [1650, 470], [1480, 620], [1300, 700]], 8),
  ARR2: smooth([[1840, 640], [1640, 700], [1440, 760], [1290, 790]], 8),
};
const MW = 1920, MH = 1080, TS = 2048 / 1920;
function pathC(ctx, pts, close) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] * TS, p[1] * TS) : ctx.moveTo(p[0] * TS, p[1] * TS)); if (close) ctx.closePath(); }
function makeRelief(kind) {
  const TW = 2048, TH = 1152, col = canvas(TW, TH), hc = canvas(TW, TH), c = col.getContext('2d'), h = hc.getContext('2d'), r = rng(kind === 'A' ? 61 : 62);
  noiseFill(c, TW, TH, .004, [176, 150, 112], [80, 70, 55], 5, 3);
  noiseFill(h, TW, TH, .003, [120, 120, 120], [70, 70, 70], 5, 33);
  const sea = kind === 'A' ? GEO.ARAL : GEO.RA, rivers = kind === 'A' ? [[GEO.AMU, 9], [GEO.AMU2, 6]] : [[GEO.RAMU, 8], [GEO.RSYR, 8]];
  // plateau (Ústirt) west: lighter, higher, with escarpment
  const plat = kind === 'A' ? [[0, 0], [700, 0], [700, 260], [760, 520], [820, 760], [760, 1080], [0, 1080]] : [[0, 0], [260, 0], [260, 500], [320, 1080], [0, 1080]];
  c.save(); pathC(c, plat, true); c.clip(); c.fillStyle = 'rgba(205,195,170,.22)'; c.fillRect(0, 0, TW, TH); c.restore();
  h.save(); pathC(h, plat, true); h.fillStyle = 'rgba(255,255,255,.45)'; h.shadowColor = '#fff'; h.shadowBlur = 30; h.fill(); h.restore();
  // dune fields (Qızılqum) east: orange streaks
  for (let i = 0; i < 2500; i++) { const x = (900 + r() * 1100) * TS, y = r() * TH; c.strokeStyle = `rgba(${200 + r() * 30},${150 + r() * 30},${90 + r() * 20},.25)`; c.lineWidth = 2 + r() * 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30 + r() * 30, y - 10 - r() * 10); c.stroke(); }
  // oasis / delta fields along rivers
  for (const [rv] of rivers) for (const p of rv) for (let k = 0; k < 8; k++) {
    const x = (p[0] + (r() - .5) * 120) * TS, y = (p[1] + (r() - .5) * 120) * TS; c.fillStyle = `rgba(${70 + r() * 40},${95 + r() * 40},${50 + r() * 20},${.12 + r() * .18})`; c.fillRect(x, y, 6 + r() * 26, 6 + r() * 26);
  }
  // sea: depression + water colour
  h.save(); pathC(h, sea, true); h.fillStyle = '#000'; h.shadowColor = '#000'; h.shadowBlur = 40; h.fill(); h.restore();
  c.save(); pathC(c, sea, true); c.clip(); const g = c.createRadialGradient(TW / 2, TH / 3, 50, TW / 2, TH / 3, 900); g.addColorStop(0, '#1f5e6e'); g.addColorStop(1, '#3d7f84'); c.fillStyle = g; c.fillRect(0, 0, TW, TH); c.restore();
  c.save(); c.strokeStyle = 'rgba(200,215,200,.5)'; c.lineWidth = 6; pathC(c, sea, true); c.stroke(); c.restore();
  // rivers
  for (const [rv, w] of rivers) { c.save(); c.strokeStyle = '#2f5d66'; c.lineWidth = w; c.lineJoin = c.lineCap = 'round'; pathC(c, rv); c.stroke(); c.restore(); h.save(); h.strokeStyle = 'rgba(0,0,0,.6)'; h.lineWidth = w * 2.5; h.filter = 'blur(4px)'; pathC(h, rv); h.stroke(); h.restore(); }
  const id = h.getImageData(0, 0, TW, TH).data;
  const geo = new THREE.PlaneGeometry(MW, MH, 480, 270); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i) + MW / 2, pz = pos.getZ(i) + MH / 2;
    const v = id[(Math.min(TH - 1, Math.floor(pz * TS)) * TW + Math.min(TW - 1, Math.floor(px * TS))) * 4] / 255;
    pos.setY(i, (v - .45) * 70 + fbm(px * .02, pz * .02, 3) * 6);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: tex(col, 1), normalMap: tex(normalFrom(hc, 1.5), 1, false), roughness: .95 });
  mat.map.wrapS = mat.map.wrapT = THREE.ClampToEdgeWrapping;
  const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshStandardMaterial({ color: '#1d4f5c', roughness: .25, metalness: .1, transparent: true, opacity: .55 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -18;
  const grp = new THREE.Group(); grp.add(mesh, water); return grp;
}
export const mapPos = (p, y = 30) => new THREE.Vector3(p[0] - MW / 2, y, p[1] - MH / 2);
export function tube(pts, color, r = 2.2, y = 26, close = false) {
  const v = pts.map(p => mapPos(p, y)); if (close) v.push(v[0].clone());
  const cur = new THREE.CatmullRomCurve3(v), g = new THREE.TubeGeometry(cur, pts.length * 3, r, 6, false);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: .95 }));
  m.userData.total = g.index.count; m.userData.set = k => g.setDrawRange(0, Math.floor(k * m.userData.total / 6) * 6); return m;
}
export function mapScene() {
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#0a0806'); sc.fog = new THREE.Fog('#0a0806', 800, 1900);
  const L = new THREE.DirectionalLight('#fff1dc', 3); L.position.set(-800, 600, -500); sc.add(L);
  sc.add(new THREE.HemisphereLight('#c9d8ff', '#3a2a18', 1.1));
  const A = makeRelief('A'), B = makeRelief('B'); B.visible = false; sc.add(A, B);
  const R = '#ff4a2a';
  const lines = {
    khorezm: tube(GEO.KHOREZM, '#ffb15a', 1.6, 24, true), state: tube(GEO.STATE, '#ff9a40', 1.8, 28, true), north: tube(GEO.STATE.slice(0, Math.floor(GEO.STATE.length * .42)), R, 3.2, 30),
    mavr: tube(GEO.MAVR, R, 2.2, 26, true), arr1: tube(GEO.ARR1, R, 4.5, 34), arr2: tube(GEO.ARR2, R, 3.6, 34),
  };
  Object.values(lines).forEach(l => { l.visible = false; sc.add(l); });
  lines.state.material.opacity = .7;
  const pinMat = new THREE.MeshBasicMaterial({ color: '#ff5a3a', toneMapped: false });
  const pin = new THREE.Group(); const ball = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), pinMat); ball.position.y = 70;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 70, 8), new THREE.MeshBasicMaterial({ color: '#ffb08a', transparent: true, opacity: .6, toneMapped: false })); beam.position.y = 35;
  pin.add(ball, beam); pin.position.copy(mapPos(GEO.BUG, 0)); sc.add(pin);
  return { sc, A, B, lines, pin };
}

/* ================= studio (objects on dark) ================= */
export function studioScene(renderer) {
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#050403');
  return sc;
}
export function coin() {
  const S = 1024, c = canvas(S, S), x = c.getContext('2d'), r = rng(71);
  const hc = canvas(S, S), h = hc.getContext('2d');
  for (const ctx of [x, h]) {
    ctx.fillStyle = ctx === x ? '#a99272' : '#777'; ctx.fillRect(0, 0, S, S);
    const ink = ctx === x ? 'rgba(70,55,35,.55)' : '#fff';
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S * .44, 0, 7); ctx.stroke(); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * .30, 0, 7); ctx.stroke();
    for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283; ctx.beginPath(); ctx.arc(S / 2 + Math.cos(a) * S * .47, S / 2 + Math.sin(a) * S * .47, 7, 0, 7); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${S * .13}px "DejaVu Sans"`; ctx.fillText('بغرا خان', S / 2, S / 2 - S * .07);
    ctx.font = `bold ${S * .085}px "DejaVu Sans"`; ctx.fillText('هارون', S / 2, S / 2 + S * .1);
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.font = `bold ${S * .05}px "DejaVu Sans"`;
    const ring = 'ضرب هذا الدرهم سنة اثنين وثمانين وثلثمائة'; for (let i = 0; i < ring.length; i++) { ctx.save(); ctx.rotate(-1.4 + i * (5.2 / ring.length)); ctx.fillText(ring[ring.length - 1 - i], 0, -S * .37); ctx.restore(); } ctx.restore();
  }
  // wear
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${r() > .5 ? '40,30,20' : '200,190,160'},${r() * .2})`; x.beginPath(); x.arc(r() * S, r() * S, 4 + r() * 40, 0, 7); x.fill(); }
  h.filter = 'blur(3px)'; h.drawImage(hc, 0, 0);
  const face = new THREE.MeshStandardMaterial({ map: tex(c), normalMap: tex(normalFrom(hc, 6), 1, false), metalness: .85, roughness: .38, color: '#e8dcc0' });
  const side = new THREE.MeshStandardMaterial({ color: '#9a8668', metalness: .85, roughness: .45 });
  const g = new THREE.CylinderGeometry(1, 1, .09, 128, 1);
  const m = new THREE.Mesh(g, [side, face, face]);
  // irregular hand-struck edge
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), rr = Math.hypot(p.getX(i), p.getZ(i)); if (rr > .5) { const k = 1 + fbm(a * 3, .5, 3) * .08; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
  g.computeVertexNormals();
  return m;
}
export function decree() {
  const g = new THREE.Group();
  // wooden desk
  const S = 1024, wc = canvas(S, S), w = wc.getContext('2d'), r = rng(81);
  w.fillStyle = '#4a2e1a'; w.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 2) { const v = fbm(y * .02, 0, 4); w.fillStyle = `rgba(${110 + v * 80},${70 + v * 50},${40 + v * 30},.35)`; w.fillRect(0, y + Math.sin(y * .05) * 3, S, 2); }
  for (let i = 0; i < 9; i++) { w.strokeStyle = 'rgba(30,15,8,.25)'; w.lineWidth = 2; w.beginPath(); w.moveTo(0, r() * S); w.bezierCurveTo(300, r() * S, 700, r() * S, S, r() * S); w.stroke(); }
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshStandardMaterial({ map: tex(wc, 1), roughness: .55 })); desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; g.add(desk);
  // paper with text
  const pc = canvas(1240, 1754), x = pc.getContext('2d');
  x.fillStyle = '#f1eadb'; x.fillRect(0, 0, 1240, 1754);
  for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(150,130,100,${r() * .05})`; x.fillRect(r() * 1240, r() * 1754, 2, 2); }
  x.fillStyle = '#2a2018'; x.textAlign = 'center';
  x.font = '600 34px Inter'; x.fillText('ÓZBEKSTAN RESPUBLIKASÍ PREZIDENTINIŃ', 620, 230);
  x.font = '700 92px CG, serif'; x.fillText('QARARÍ', 620, 350);
  x.font = '700 50px CG, serif'; x.fillStyle = '#7a2414'; x.fillText('№ 248  ·  2025-jıl', 620, 440);
  x.fillStyle = 'rgba(60,45,30,.35)';
  for (let i = 0; i < 26; i++) { const lw = i % 6 === 5 ? 520 : 820 + r() * 120; x.fillRect(180, 560 + i * 40, lw, 13); }
  x.fillStyle = 'rgba(232,170,60,.45)'; x.fillRect(170, 836, 900, 34);
  x.fillStyle = '#2a2018'; x.font = '600 26px Inter'; x.textAlign = 'left'; x.fillText('jańa arxeologiyalıq orınlar · turistlik jónelisler', 190, 862);
  const ptex = tex(pc, 1); ptex.wrapS = ptex.wrapT = THREE.ClampToEdgeWrapping;
  const pg = new THREE.PlaneGeometry(4.2, 5.94, 30, 40), pp = pg.attributes.position;
  for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.pow(Math.abs(pp.getX(i)) / 2.1, 3) * .12 + Math.pow((pp.getY(i) + 2.97) / 5.94, 4) * .05);
  pg.computeVertexNormals();
  const paper = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: ptex, roughness: .85, side: THREE.DoubleSide })); paper.rotation.x = -Math.PI / 2; paper.rotation.z = .08; paper.position.y = .02; paper.castShadow = true; paper.receiveShadow = true; g.add(paper);
  // pen and stamp
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3, 16), new THREE.MeshStandardMaterial({ color: '#111', metalness: .6, roughness: .3 })); pen.rotation.z = Math.PI / 2; pen.rotation.y = .5; pen.position.set(3.3, .07, 1.5); pen.castShadow = true; g.add(pen);
  const stamp = new THREE.Group(); const sb = new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, .35, 40), new THREE.MeshStandardMaterial({ color: '#2b2b2b', metalness: .4, roughness: .4 }));
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(.18, .25, 1.1, 24), new THREE.MeshStandardMaterial({ color: '#5a3418', roughness: .5 })); sh.position.y = .7; stamp.add(sb, sh); stamp.castShadow = true; g.add(stamp);
  sb.castShadow = sh.castShadow = true;
  // seal imprint decal
  const sc2 = canvas(256, 256), s = sc2.getContext('2d'); s.strokeStyle = '#1f4a8a'; s.lineWidth = 10; s.beginPath(); s.arc(128, 128, 110, 0, 7); s.stroke(); s.lineWidth = 4; s.beginPath(); s.arc(128, 128, 88, 0, 7); s.stroke(); s.fillStyle = '#1f4a8a'; s.font = '700 64px CG, serif'; s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillText('248', 128, 132);
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: tex(sc2), transparent: true, opacity: 0, depthWrite: false })); seal.rotation.x = -Math.PI / 2; seal.position.set(1.2, .08, 2.0); g.add(seal);
  return { g, stamp, seal, paper };
}
// excavation square with trenches & finds
export function lathePot(color = '#a65d34') {
  const pts = [[0, 0], [.32, 0], [.5, .1], [.62, .4], [.58, .7], [.38, .92], [.26, 1.0], [.28, 1.12], [.24, 1.13]].map(([a, b]) => new THREE.Vector2(a, b));
  const g = new THREE.LatheGeometry(pts, 48); const S = 512, c = canvas(S, S), x = c.getContext('2d');
  noiseFill(x, S, S, .03, [150, 85, 50], [50, 30, 20], 4, 4); x.strokeStyle = 'rgba(60,30,15,.6)'; x.lineWidth = 6;
  for (let k = 0; k < 2; k++) { x.beginPath(); for (let i = 0; i <= 24; i++) x.lineTo(i * S / 24, S * (.45 + k * .12) + (i % 2 ? 14 : -14)); x.stroke(); }
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex(c, 1), roughness: .85, side: THREE.DoubleSide }));
}
export function excavation(groundMat) {
  const g = new THREE.Group(), r = rng(91);
  const geo = new THREE.PlaneGeometry(40, 40, 400, 400); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, cells = [[-1, -1], [0, -1], [0, 0], [1, 1], [-2, 1], [1, -2]];
  const inCell = (x, z) => { for (const [i, j] of cells) { const cx = i * 5 + 2.5, cz = j * 5 + 2.5; if (Math.abs(x - cx) < 2.25 && Math.abs(z - cz) < 2.25) return Math.min(2.25 - Math.abs(x - cx), 2.25 - Math.abs(z - cz)); } return -1; };
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = inCell(x, z); p.setY(i, fbm(x * .2, z * .2, 3) * .25 + (d > 0 ? -Math.min(1, d * 6) * 1.1 : 0)); }
  geo.computeVertexNormals();
  const col = new Float32Array(p.count * 3).fill(1); for (let i = 0; i < p.count; i++) { if (p.getY(i) < -.3) { col[i * 3] = .82; col[i * 3 + 1] = .72; col[i * 3 + 2] = .62; } }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const gm = groundMat.clone(); gm.map = groundMat.map.clone(); gm.map.repeat.set(4, 4); gm.normalMap = groundMat.normalMap.clone(); gm.normalMap.repeat.set(4, 4);
  const m = new THREE.Mesh(geo, gm); m.receiveShadow = true; g.add(m);
  // grid strings & stakes
  const sm = new THREE.MeshStandardMaterial({ color: '#f4f0e6', roughness: .6 }), wm = new THREE.MeshStandardMaterial({ color: '#7a5a38', roughness: .8 });
  for (let i = -3; i <= 3; i++) for (const dir of [0, 1]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 30, 4), sm); s.rotation.z = Math.PI / 2; if (dir) s.rotation.y = Math.PI / 2;
    s.position.set(dir ? i * 5 : 0, .25, dir ? 0 : i * 5); s.castShadow = true; g.add(s);
  }
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const st = new THREE.Mesh(new THREE.BoxGeometry(.08, .6, .08), wm); st.position.set(i * 5, .2, j * 5); st.castShadow = true; g.add(st); }
  // finds
  const pot = lathePot(); pot.scale.setScalar(.9); pot.rotation.z = 1.35; pot.position.set(2.6, -.75, 2.7); pot.castShadow = true; g.add(pot);
  const c2 = coin(); c2.scale.setScalar(.22); c2.position.set(-2.2, -1.02, -2.6); c2.rotation.x = .2; g.add(c2);
  const sh = lathePot('#8a4a2a'); sh.scale.setScalar(.5); sh.rotation.z = -1.4; sh.position.set(7.4, -.85, 7.6); g.add(sh);
  // tools: brush & trowel
  const brush = new THREE.Group(); const bh = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 12), new THREE.MeshStandardMaterial({ color: '#a8743e', roughness: .5 })); const bb = new THREE.Mesh(new THREE.BoxGeometry(.32, .2, .08), new THREE.MeshStandardMaterial({ color: '#2d2219', roughness: 1 })); bb.position.y = -.5; brush.add(bh, bb); brush.rotation.set(Math.PI / 2, 0, .7); brush.position.set(4.6, .1, 1.2); brush.traverse(o => o.castShadow = true); g.add(brush);
  const trowel = new THREE.Mesh(new THREE.ConeGeometry(.3, .75, 3), new THREE.MeshStandardMaterial({ color: '#9aa0a4', metalness: .8, roughness: .35 })); trowel.scale.z = .08; trowel.rotation.set(-Math.PI / 2, 0, 2.2); trowel.position.set(-4.4, .05, -.6); trowel.castShadow = true; g.add(trowel);
  return { g, pot, coin: c2 };
}
export function astrolabe() {
  const g = new THREE.Group(), brass = new THREE.MeshStandardMaterial({ color: '#c49a52', metalness: 1, roughness: .28 });
  // engraved plate
  const S = 1024, c = canvas(S, S), x = c.getContext('2d'), hc = canvas(S, S), h = hc.getContext('2d');
  for (const ctx of [x, h]) {
    ctx.fillStyle = ctx === x ? '#b88d48' : '#888'; ctx.fillRect(0, 0, S, S); ctx.strokeStyle = ctx === x ? 'rgba(60,35,10,.8)' : '#000'; ctx.lineWidth = 3;
    for (let k = 1; k < 9; k++) { ctx.beginPath(); ctx.arc(S / 2, S / 2 + k * 18, k * 46, 0, 7); ctx.stroke(); }
    for (let i = 0; i < 24; i++) { ctx.beginPath(); ctx.moveTo(S / 2, S / 2); ctx.lineTo(S / 2 + Math.cos(i / 24 * 6.283) * 470, S / 2 + Math.sin(i / 24 * 6.283) * 470); ctx.stroke(); }
    for (let i = 0; i < 360; i += 2) { const a = i / 360 * 6.283, l = i % 10 ? 14 : 30; ctx.beginPath(); ctx.moveTo(S / 2 + Math.cos(a) * 500, S / 2 + Math.sin(a) * 500); ctx.lineTo(S / 2 + Math.cos(a) * (500 - l), S / 2 + Math.sin(a) * (500 - l)); ctx.stroke(); }
  }
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, .12, 128), [brass, new THREE.MeshStandardMaterial({ map: tex(c), normalMap: tex(normalFrom(hc, 3), 1, false), metalness: 1, roughness: .32 }), brass]);
  plate.rotation.x = Math.PI / 2; g.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.08, .16, 24, 160), brass); g.add(rim);
  const throne = new THREE.Mesh(new THREE.TorusGeometry(.42, .1, 16, 48), brass); throne.position.y = 3.55; g.add(throne);
  // rete
  const rete = new THREE.Group(); const ec = new THREE.Mesh(new THREE.TorusGeometry(1.75, .05, 12, 120), brass); ec.position.y = .55; rete.add(ec);
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(2.6, .06, 12, 140), brass); rete.add(r2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + .2, L = 1.2 + (i % 3) * .5, sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(.12, L * .5, 0, L); sh.quadraticCurveTo(-.12, L * .5, 0, 0); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .04, bevelEnabled: false }), brass); m.rotation.z = a; m.position.set(Math.cos(a + 1.57) * .6, Math.sin(a + 1.57) * .6, 0); rete.add(m); }
  rete.position.z = .1; g.add(rete);
  const alid = new THREE.Mesh(new THREE.BoxGeometry(6, .16, .06), brass); alid.position.z = .18; g.add(alid);
  const pinM = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .5, 16), brass); pinM.rotation.x = Math.PI / 2; g.add(pinM);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, rete, alid };
}
export function strata(clayMat) {
  const g = new THREE.Group(), cols = ['#b08a5e', '#987250', '#7f5c3e', '#6a4a30', '#523825'], H = 3;
  cols.forEach((cc, i) => {
    const geo = new THREE.BoxGeometry(24, H, 10, 120, 20, 2), p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const X = p.getX(k), Y = p.getY(k), Z = p.getZ(k); if (Y > 0) p.setY(k, Y + fbm(X * .2, i * 3, 3) * .7); if (Z > 0) p.setZ(k, Z + fbm(X * .5, Y * .5 + i, 3) * .25); }
    geo.computeVertexNormals();
    const m = clayMat.clone(); m.color = new THREE.Color(cc); m.map = clayMat.map.clone(); m.map.repeat.set(4, 1); m.normalMap = clayMat.normalMap.clone(); m.normalMap.repeat.set(4, 1);
    const mesh = new THREE.Mesh(geo, m); mesh.position.y = -i * H - H / 2; mesh.receiveShadow = true; mesh.castShadow = true; g.add(mesh);
  });
  const finds = [];
  [[-6, -2.4, 'pot'], [5, -5.6, 'coin'], [-2, -8.7, 'pot2'], [7, -11.6, 'coin'], [-7, -12.2, 'pot']].forEach(([x, y, t]) => {
    let o; if (t === 'coin') { o = coin(); o.scale.setScalar(.35); o.rotation.x = Math.PI / 2 - .2; } else { o = lathePot(t === 'pot2' ? '#7a4a2a' : '#a65d34'); o.scale.setScalar(.9); o.rotation.z = .3; }
    o.position.set(x, y, 5.1); g.add(o); finds.push(o);
  });
  return { g, finds };
}

/* ================= reconstruction of the medieval city ================= */
export function reconstruction(clayMat, brickMat) {
  const g = new THREE.Group(), r = rng(101);
  const inPoly = (x, z, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) c = !c; } return c; };
  const houseMat = clayMat.clone(); houseMat.color = new THREE.Color('#e8d4b8');
  const box = new THREE.BoxGeometry(1, 1, 1), N = 2200, im = new THREE.InstancedMesh(box, houseMat, N), M = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  let n = 0;
  while (n < N) {
    const x = (r() - .5) * 940, z = (r() - .5) * 900;
    if (!inPoly(x, z, CITY) || Math.hypot(x, z) < 60) continue;
    if (Math.abs((x + z * .3) % 70) < 6 || Math.abs((z - x * .2) % 85) < 6) continue; // streets
    const w = 6 + r() * 10, d = 6 + r() * 10, h = 3 + r() * 3;
    q.setFromEuler(new THREE.Euler(0, .05 + (r() - .5) * .08, 0)); M.compose(new THREE.Vector3(x, height(x, z) + h / 2 - .5, z), q, new THREE.Vector3(w, h, d));
    im.setMatrixAt(n, M); c.setHSL(.09 + r() * .03, .08 + r() * .08, .8 + r() * .15); im.setColorAt(n, c); n++;
  }
  im.castShadow = im.receiveShadow = true; g.add(im);
  // walls with round towers
  const wallMat = clayMat.clone(); wallMat.color = new THREE.Color('#d9c09c');
  const addWalls = (poly, hgt, thick, towerEvery, towerR) => {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      const w = new THREE.Mesh(new THREE.BoxGeometry(L, hgt, thick), wallMat); w.position.set(mx, height(mx, mz) + hgt / 2 - 1, mz); w.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); w.castShadow = w.receiveShadow = true; g.add(w);
      for (let t = 0; t < L; t += towerEvery) { const x = a[0] + (b[0] - a[0]) * t / L, z = a[1] + (b[1] - a[1]) * t / L; const tw = new THREE.Mesh(new THREE.CylinderGeometry(towerR * .85, towerR, hgt + 3, 20), wallMat); tw.position.set(x, height(x, z) + (hgt + 3) / 2 - 1, z); tw.castShadow = tw.receiveShadow = true; g.add(tw); }
    }
  };
  addWalls(CITY, 9, 6, 55, 5.5); addWalls(CITADEL, 11, 5, 40, 5);
  // Friday mosque next to the minaret
  const mosque = new THREE.Group(); const mm = clayMat.clone(); mm.color = new THREE.Color('#efdcc0');
  const hall = new THREE.Mesh(new THREE.BoxGeometry(46, 9, 34), mm); hall.position.y = 4.5; mosque.add(hall);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.5, 4, 32), mm); drum.position.y = 11; mosque.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 16, 0, 6.283, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#3f8f9a', roughness: .35, metalness: .1 })); dome.position.y = 13; mosque.add(dome);
  const portal = new THREE.Mesh(new THREE.BoxGeometry(18, 16, 4), mm); portal.position.set(0, 8, 18); mosque.add(portal);
  const arch = new THREE.Mesh(new THREE.PlaneGeometry(8, 11), new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 1 })); arch.position.set(0, 6, 20.05); mosque.add(arch);
  for (let i = 0; i < 6; i++) { const cup = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8, 0, 6.283, 0, Math.PI / 2), mm); cup.position.set(-17 + (i % 3) * 17 * (i % 3 === 1 ? 0 : 1) + (i % 3 === 1 ? 0 : 0), 9, i < 3 ? -9 : 9); if (i % 3 !== 1) mosque.add(cup); }
  mosque.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  mosque.position.set(-30, height(-30, 0) - .5, 2); mosque.rotation.y = Math.PI / 2; g.add(mosque);
  const intact = minaretMesh(brickMat, { ruin: false, h: 46, rb: 5.2, rt: 2.9 }); g.add(intact);
  return { g, mosque, intact };
}

/* ================= particles ================= */
export function spriteTex(col = [255, 200, 120]) {
  const c = canvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(.3, `rgba(${col},.5)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
export function points(n, size, color, map, additive = true) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ size, color, map, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true, toneMapped: false });
  return new THREE.Points(g, m);
}
export function starfield() {
  const n = 4000, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), c = new Float32Array(n * 3), r = rng(111);
  for (let i = 0; i < n; i++) { const th = r() * 6.283, ph = Math.acos(r() * .95), R = 7000; p[i * 3] = Math.sin(ph) * Math.cos(th) * R; p[i * 3 + 1] = Math.cos(ph) * R; p[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * R; const b = .3 + r() ** 3 * 1.4; c[i * 3] = b; c[i * 3 + 1] = b * (.9 + r() * .1); c[i * 3 + 2] = b * (.95 + r() * .15); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
}
export function camp() {
  const g = new THREE.Group(), r = rng(121);
  const cloth = new THREE.MeshStandardMaterial({ color: '#cfc3a6', roughness: 1, side: THREE.DoubleSide });
  [[22, 30, 0], [31, 24, .6], [15, 40, 1.2]].forEach(([x, z, rot]) => {
    const t = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 4, 1, true), cloth); t.position.set(x, height(x, z) + 1.5, z); t.rotation.y = rot + .78; t.scale.set(1.4, 1, 1); t.castShadow = true; g.add(t);
  });
  const wood = new THREE.MeshStandardMaterial({ color: '#4a3420', roughness: .8 });
  const tri = new THREE.Group(); for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.6, 6), wood); const a = i * 2.09; l.position.set(Math.cos(a) * .3, .75, Math.sin(a) * .3); l.rotation.set(Math.sin(a) * .35, 0, -Math.cos(a) * .35); tri.add(l); }
  const head = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .4, 16), new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: .7, roughness: .3 })); head.rotation.z = Math.PI / 2; head.position.y = 1.62; tri.add(head);
  tri.position.set(12, height(12, 20), 20); tri.traverse(o => o.castShadow = true); g.add(tri);
  for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.2, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? '#c8382a' : '#eee', roughness: .7 })); const x = 6 + i * 3.5, z = 12 + r() * 4; st.position.set(x, height(x, z) + 1, z); st.rotation.z = (r() - .5) * .1; st.castShadow = true; g.add(st); }
  const boxes = new THREE.Mesh(new THREE.BoxGeometry(1.2, .7, .8), wood); boxes.position.set(26, height(26, 25) + .35, 25); boxes.castShadow = true; g.add(boxes);
  return g;
}
export function people(n, seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  const cols = ['#2b2f3a', '#5a3a2a', '#3a4a3a', '#7a6a58', '#1f2228', '#8a3a2a'];
  for (let i = 0; i < n; i++) {
    const p = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: cols[Math.floor(r() * cols.length)], roughness: .9 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .9, 4, 10), m); body.position.y = 1.0; p.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), new THREE.MeshStandardMaterial({ color: '#8a6248', roughness: .8 })); head.position.y = 1.72; p.add(head);
    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .6, 4, 8), new THREE.MeshStandardMaterial({ color: '#22252b', roughness: .9 })); legs.position.y = .45; p.add(legs);
    p.traverse(o => o.castShadow = true); p.userData = { a: r() * 6.28, d: 14 + r() * 30, sp: (r() - .5) * .04, ph: r() * 10 }; g.add(p);
  }
  return g;
}
export function lamps(n = 10) {
  const g = new THREE.Group(), post = new THREE.MeshStandardMaterial({ color: '#2a2622', metalness: .6, roughness: .4 }), bulb = new THREE.MeshStandardMaterial({ color: '#ffe0a8', emissive: '#ffcc88', emissiveIntensity: 0 });
  for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), x = side * 3.2, z = 14 + k * 9; const l = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 3.4, 8), post); p.position.y = 1.7; const b = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), bulb); b.position.y = 3.5; l.add(p, b); l.position.set(x, height(x, z), z); l.traverse(o => o.castShadow = true); g.add(l); }
  const pc = canvas(256, 256), x = pc.getContext('2d'); noiseFill(x, 256, 256, .05, [190, 170, 140], [40, 35, 30], 3, 7); x.strokeStyle = 'rgba(90,75,60,.6)'; x.lineWidth = 3; for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); for (let j = (i / 32 % 2) * 32; j < 256; j += 64) { x.beginPath(); x.moveTo(j, i); x.lineTo(j, i + 32); x.stroke(); } }
  const path = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 60, 4, 60), new THREE.MeshStandardMaterial({ map: tex(pc, 1), roughness: .9 })); path.material.map.repeat.set(2, 26);
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0, 38); const pp = path.geometry.attributes.position; for (let i = 0; i < pp.count; i++) { const X = pp.getX(i), Y = pp.getY(i); pp.setZ(i, height(X, 38 - Y) + .08); } path.receiveShadow = true; g.add(path);
  return { g, bulb };
}
