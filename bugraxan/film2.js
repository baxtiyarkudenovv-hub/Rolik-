// Bugraxan esteligi — kinematik hújjetli film: berilgen kadrlar + tereńlik kartası (Depth-Anything-V2) arqalı 2.5D parallaks,
// shader ótiwler, altın infografika, latın subtitrler. Muzıkasız — tek ses effektleri (sfx.py).
const W = 1920, H = 1080, PH = 804, BAR = (H - PH) / 2;
const cv = document.getElementById('c'), x = cv.getContext('2d');
const SERIF = 'CG, "Liberation Serif", serif', SANS = 'Inter, "DejaVu Sans", sans-serif';
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), p = (t, a, b) => cl((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - t, 3), eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, sm = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
function hrnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

/* ================= SHOTS =================
   [segment, image, {z:[z0,z1], c:[[x,y],[x,y]], par:[[ox,oy],[ox,oy]], dol:[d0,d1], foc, look, tr}]
   par = parallax camera shift (screen fraction), dol = depth dolly (near grows), tr = transition into this shot */
const S = (z0, z1, x0, y0, x1, y1, o = {}) => ({ z: [z0, z1], c: [[x0, y0], [x1, y1]], par: o.par || [[-.012, 0], [.012, 0]], dol: o.dol || [0, .07], foc: o.foc ?? .45, look: o.look || 0, tr: o.tr || 'luma' });
const SHOTS = {
  intro: [[0, '21', S(1.25, 1.06, .52, .58, .5, .55, { par: [[.014, -.004], [-.01, 0]], dol: [.0, .1], foc: .3 })]],
  exped: [[0, '02', S(1.08, 1.22, .45, .52, .42, .5, { look: 1, par: [[-.016, 0], [.006, 0]], foc: .4 })], [2, '03', S(1.22, 1.08, .55, .62, .52, .58, { look: 1, tr: 'depth', par: [[0, -.01], [0, .008]] })]],
  name: [[0, '22', S(1.06, 1.2, .42, .55, .55, .5, { par: [[-.02, 0], [.012, 0]], foc: .5, tr: 'flash' })], [1, '30', S(1.06, 1.2, .55, .5, .62, .45, { dol: [0, .12], foc: .45 })], [2, '23', S(1.18, 1.06, .45, .55, .5, .52, { par: [[.014, 0], [-.012, 0]], foc: .55, tr: 'depth' })], [3, '26', S(1.22, 1.06, .45, .45, .5, .5, { par: [[.012, -.006], [-.012, .004]], dol: [.08, 0], foc: .35 })]],
  minaret: [[0, '19', S(1.08, 1.16, .5, .5, .5, .45, { par: [[-.01, 0], [.006, 0]], foc: .5, tr: 'flash' })], [.42, '05', S(1.1, 1.22, .4, .5, .5, .5, { par: [[-.016, .004], [.014, -.004]], foc: .6, tr: 'scan' })], [1, '26', S(1.05, 1.22, .5, .5, .5, .45, { dol: [0, .1], foc: .3, tr: 'depth' })], [2, '07', S(1.35, 1.55, .82, .32, .84, .26, { par: [[-.012, 0], [.012, 0]], foc: .2 })]],
  beacon: [[0, '08', S(1.06, 1.2, .3, .48, .38, .42, { par: [[.016, 0], [-.012, .004]], foc: .55 })], [1, '07', S(1.15, 1.4, .75, .45, .86, .28, { dol: [0, .1], foc: .2, tr: 'depth' })], [2, '28', S(1.18, 1.05, .4, .55, .45, .5, { par: [[-.016, 0], [.012, 0]], foc: .6 })], [3, 'BUILD', S(1, 1, .5, .5, .5, .5, { tr: 'flash' })], [5, '19', S(1.05, 1.22, .5, .58, .5, .4, { par: [[-.014, 0], [.012, 0]], foc: .5 })]],
  city: [[0, '18', S(1.22, 1.06, .5, .55, .45, .52, { dol: [.12, 0], foc: .7, tr: 'flash' })], [1, '09', S(1.06, 1.2, .5, .52, .55, .55, { par: [[.016, 0], [-.012, 0]], foc: .5 })], [2, '01', S(1.28, 1.45, .3, .45, .6, .45, { par: [[-.01, 0], [.01, 0]], foc: .3, tr: 'depth' })], [3, '26', S(1.35, 1.15, .4, .4, .5, .48, { dol: [0, .1], foc: .3 })], [4, '27', S(1.05, 1.2, .4, .55, .45, .5, { dol: [0, .12], foc: .6, tr: 'depth' })], [5, '05', S(1.25, 1.08, .7, .45, .6, .5, { par: [[-.014, 0], [.014, 0]], foc: .6 })]],
  flood: [[0, '10', S(1.06, 1.2, .5, .52, .58, .48, { dol: [0, .1], foc: .4, tr: 'flash' })], [.5, '11', S(1.2, 1.06, .5, .52, .45, .5, { par: [[.016, 0], [-.012, 0]], foc: .6 })], [1, '12', S(1.06, 1.22, .45, .58, .4, .62, { par: [[-.014, -.004], [.01, .004]], foc: .6, tr: 'depth' })]],
  modern: [[0, '13', S(1.05, 1.2, .5, .52, .42, .55, { par: [[.016, 0], [-.01, 0]], foc: .5, tr: 'flash' })], [1, '03', S(1.32, 1.52, .55, .62, .5, .66, { par: [[0, -.008], [0, .008]], foc: .7 })], [2, '14', S(1.18, 1.05, .5, .52, .5, .5, { par: [[-.016, 0], [.012, 0]], foc: .55, tr: 'depth' })], [3, '13', S(1.4, 1.6, .25, .62, .22, .66, { dol: [0, .1], foc: .6 })], [4, '19', S(1.2, 1.05, .5, .52, .5, .45, { par: [[.014, 0], [-.014, 0]], foc: .6, tr: 'depth' })], [5, '02', S(1.25, 1.1, .65, .5, .7, .46, { par: [[-.012, 0], [.012, 0]], foc: .4 })], [7, '15', S(1.05, 1.2, .5, .52, .42, .55, { dol: [0, .1], foc: .5, tr: 'flash' })]],
  wisdom: [[0, '29', S(1.05, 1.2, .45, .45, .4, .4, { par: [[.014, 0], [-.012, 0]], dol: [0, .08], foc: .6, tr: 'flash' })], [1, '24', S(1.2, 1.05, .45, .55, .45, .5, { par: [[-.014, 0], [.012, 0]], foc: .6, tr: 'depth' })], [2, '17', S(1.05, 1.22, .45, .6, .38, .56, { dol: [0, .1], foc: .6 })]],
  finale: [[0, '25', S(1.05, 1.22, .5, .55, .45, .5, { par: [[-.012, 0], [.014, 0]], dol: [0, .1], foc: .3, tr: 'flash' })], [1, '20', S(1.22, 1.05, .5, .55, .5, .55, { dol: [.12, 0], foc: .7, tr: 'depth' })]],
};

/* ================= GOLD KEYWORDS & INFOGRAPHICS ================= */
// Ekrandaǵı jazıwlar — tek diktor tekstindegi sózler, sanlar hám sáneler (qaraqalpaq latın jazıwında).
const KEYS = {
  exped: [[0, 'S. P. Tolstov', 'Xorezm arxeologiya hám etnografiya ekspediciyası', { size: 66 }]],
  name: [[0, 'Bul estelik ne ushın Bugraxan dep atalǵan?', null, { size: 46 }], [2, 'Qaraxaniyler áwladınan bolǵan Bugraxan', null, { size: 48 }], [3, 'Xorezmshahlar mámleketiniń orayı', 'boljawlar', { size: 52 }]],
  minaret: [[2, 'Úlken civilizaciya orayı', null, { size: 58 }]],
  beacon: [[2, 'Jámiyetlik orın', 'minaranıń átirapı'], [3, 'Ulıwmalıq belgiler', 'Xorezm minaraları', { size: 58 }], [5, 'Biyikligi haqqında anıq maǵlıwmat joq', 'tek boljawlar aytıladı', { size: 46 }]],
  city: [[1, 'Namaz oqıytuǵın orın', 'musılman xalıqlarınıń tariyxında', { size: 56 }], [4, 'Qala meshiti', 'oraylıq bóliminde'], [5, 'Xorezmshahlar dáwirine tán usıl', null, { size: 52 }]],
  flood: [[1, 'Sheberlik penen qurılǵan', null, { size: 60 }]],
  modern: [[0, 'Birneshe basqısh', 'úyreniw jumısları'], [2, 'Jańa turistlik baǵdarlar', 'jańa arxeologiyalıq orınlardı úyreniw', { size: 54 }], [3, 'Berdaq atındaǵı Qaraqalpaq mámleketlik universiteti', 'arxeologiya kafedrası', { size: 42 }], [4, 'Qayta tiklew hám abadanlastırıw', null, { size: 54 }], [5, 'Qaytadan jabılatuǵın edi', 'burın', { size: 54 }]],
  wisdom: [[0, 'Úlkemiz aymaǵınan tabılǵan qalalar', null, { size: 52 }], [2, 'Ilim-bilim rawajlanǵan oray', 'orta ásirlerde', { size: 58 }]],
  finale: [[1, 'Biybaha derekler', 'qatlamlarında', { size: 64 }]],
};
const INFO = {
  exped: [[1, 'century', { big: '50–60-jıllar', small: 'XX ásir', x: 1440, y: 380 }], [2, 'stamp', { big: '1946-jılı', small: 'arxeologiyalıq kartaǵa túsirilgen', x: 1460, y: 340 }]],
  name: [[1, 'century', { big: '992-jılı', small: 'Mawarannaxr', x: 1480, y: 380 }]],
  minaret: [[0, 'century', { big: 'XI ásir', small: 'minara', x: 430, y: 420 }], [1, 'area', { n: 60, unit: 'gektardan aslam', x: 1480, y: 330 }]],
  beacon: [[0, 'question', { q: 'Qanday xızmet atqarǵan?', x: 1380, y: 300 }], [1, 'signal', { ax: .89, ay: .06, label: 'Xabar beriw ornı' }], [4, 'triad', { x: 1460, y: 420 }]],
  city: [[2, 'map', { x: 1460, y: 540 }], [3, 'parts', { x: 1460, y: 420 }]],
  flood: [[0, 'water', { label: 'Birneshe márte suw basqan', x: 1440, y: 300 }], [1, 'check', { label: 'Saqlanıp qalǵan', x: 1440, y: 300 }]],
  modern: [[1, 'doc', { n: '248-sanlı qarar', y2: '2025', label: 'Ózbekstan Respublikası Prezidentiniń qararı', x: 1460, y: 410 }], [7, 'seasons', { x: 1460, y: 330 }]],
  wisdom: [[1, 'icons3', { x: 1440, y: 360 }]],
  finale: [[0, 'century', { big: 'XI–XIV', small: 'ásirler · Qońırat rayonı', x: 1440, y: 360 }]],
};
const CH = {};

/* ================= TIMELINE ================= */
const CPS = 13, segDur = s => Math.max(3.4, s.length / CPS + .8);
const TL = [], SUBS = []; let TOTAL = 0;
{ let t = 0;
  for (const sc of window.SCRIPT) {
    if (sc.id === 'int') continue;
    const e = { ...sc, t0: t, T: [] };
    if (sc.id === 'intro') e.d = 11; else if (sc.id === 'end') e.d = 7;
    else { let u = 2.2; for (const s of sc.segs) { e.T.push(u); SUBS.push({ s, a: t + u, b: t + u + segDur(s) - .35 }); u += segDur(s); } e.d = u + (sc.id === 'finale' ? 5 : 1.0); }
    t += e.d; TL.push(e);
  } TOTAL = t; }
const SH = [];
for (const e of TL) for (const [si, img, mv] of (SHOTS[e.id] || [])) {
  const k = Math.floor(si), fr = si - k, s0 = e.T.length ? e.T[k] : 0, s1 = e.T.length ? (e.T[k + 1] ?? e.d) : e.d;
  SH.push({ scene: e, img, mv, a: e.t0 + (si === 0 ? 0 : s0 + (s1 - s0) * fr - .6) });
}
SH.forEach((s, i) => { const n = SH[i + 1]; s.b = n && n.scene === s.scene ? n.a + 1.1 : s.scene.t0 + s.scene.d; s.first = !SH[i - 1] || SH[i - 1].scene !== s.scene; });
const EVENTS = [];
SH.forEach(s => EVENTS.push({ t: +s.a.toFixed(3), k: s.first ? 'cut' : 'tr', tr: s.mv.tr }));
for (const e of TL) {
  (KEYS[e.id] || []).forEach(([si]) => EVENTS.push({ t: +(e.t0 + e.T[si] + .5).toFixed(3), k: 'gold' }));
  (INFO[e.id] || []).forEach(([si, ty]) => EVENTS.push({ t: +(e.t0 + e.T[si] + .4).toFixed(3), k: 'info', ty }));
  if (CH[e.id]) EVENTS.push({ t: +(e.t0 + .3).toFixed(3), k: 'chapter' });
}
window.TOTAL = TOTAL;
window.TIMELINE = { fps: 25, total: TOTAL, scenes: TL.map(e => ({ id: e.id, t0: +e.t0.toFixed(3), d: +e.d.toFixed(3), segs: e.T.map(v => +(e.t0 + v).toFixed(3)) })), subs: SUBS.map(s => ({ a: +s.a.toFixed(3), b: +s.b.toFixed(3), s: s.s })), shots: SH.map(s => ({ a: +s.a.toFixed(3), b: +s.b.toFixed(3), img: s.img, scene: s.scene.id })), events: EVENTS.sort((a, b) => a.t - b.t) };

/* ================= WEBGL PARALLAX ================= */
const gc = document.createElement('canvas'); gc.width = W; gc.height = PH;
const gl = gc.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
const VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; uv.y = 1.-uv.y; gl_Position = vec4(p,0,1); }`;
const FS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D tA, dA, tB, dB; uniform vec4 camA, camB; uniform vec2 parA, parB, covA, covB; uniform float focA, focB, mixv, ttype, lookA, lookB, time;
vec2 view(vec2 q, vec4 cam, vec2 par, float foc, vec2 cov, sampler2D D){
  vec2 c = cam.yz, r = (q-.5)*cov/cam.x, s = c + r;
  for(int i=0;i<12;i++){ float d = texture(D, clamp(s,0.,1.)).r; float k = 1. + cam.w*(d-foc); vec2 ns = c + r/k - par*(d-foc); s = mix(s, ns, .65); }
  return clamp(s, .001, .999);
}
vec3 grade(vec3 c, float look, float d){
  float l = dot(c, vec3(.2126,.7152,.0722));
  c = mix(vec3(l), c, .92); c = (c-.5)*1.08+.5;
  c += vec3(.02,.008,-.012)*smoothstep(.4,1.,l) + vec3(-.012,.004,.016)*(1.-smoothstep(0.,.45,l));
  c = mix(c, vec3(l)*vec3(1.08,.9,.66)*1.06, look*.72);
  c *= 1. - .1*(1.-d)*look; // archive: darker distance
  return c;
}
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 sa = view(uv, camA, parA, focA, covA, dA); vec3 a = grade(texture(tA, sa).rgb, lookA, texture(dA, sa).r);
  if (mixv <= 0.) { o = vec4(a,1); return; }
  vec2 sb = view(uv, camB, parB, focB, covB, dB); vec3 b = grade(texture(tB, sb).rgb, lookB, texture(dB, sb).r);
  float m; vec3 col;
  if (ttype < .5) { // luma dissolve: highlights of B bloom in first
    float lb = dot(b, vec3(.3,.59,.11)); m = smoothstep(0., 1., clamp((mixv*1.5 - .25) + (lb-.5)*.6 + (h(uv*900.)-.5)*.04, 0., 1.)); col = mix(a, b, m);
  } else if (ttype < 1.5) { // depth reveal: far plane of B appears first, near objects arrive last
    float db = texture(dB, sb).r; m = smoothstep(db*.7 - .08, db*.7 + .08, mixv*1.25 - .12); col = mix(a, b, m);
    col += vec3(1.,.8,.5)*.18*exp(-pow((mixv*1.25-.12-db*.7)*12.,2.)) * (1.-abs(mixv-.5)*2.);
  } else if (ttype > 2.5) { // golden time-scan: a vertical light line sweeps the past into view
    float e = mixv*1.3 - .15; m = smoothstep(e - .004, e + .004, 1. - uv.x); col = mix(b, a, m);
    float g = exp(-pow((1. - uv.x - e)*90., 2.)); col += vec3(1.,.78,.4)*g*1.2 + vec3(1.,.7,.35)*.25*exp(-abs(1. - uv.x - e)*14.);
  } else { // golden light flash
    m = smoothstep(.35, .65, mixv); col = mix(a, b, m); float f = exp(-pow((mixv-.5)*4.2, 2.)); col = mix(col, vec3(1.,.86,.62), f*.75);
  }
  o = vec4(col, 1);
}`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; }
const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = n => gl.getUniformLocation(prog, n);
const TEX = {}, DIM = {};
function upload(img) { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
const load = src => new Promise((r, j) => { const im = new Image(); im.onload = () => r(im); im.onerror = j; im.src = src; });
const need = [...new Set(SH.map(s => s.img))].filter(n => n !== 'BUILD');
window.ready = Promise.all(need.map(async n => { const [a, b] = await Promise.all([load(`footage/${n}.jpg`), load(`footage/depth/${n}.png`)]); TEX[n] = [upload(a), upload(b)]; DIM[n] = [a.width, a.height]; }))
  .then(() => Promise.all(['600', '700'].flatMap(w => ['', 'italic '].map(st => document.fonts.load(`${st}${w} 40px CG`, 'AaǴǵıŃńÁáÓóÚú')))))
  .then(() => document.fonts.load('500 30px Inter', 'ǵı')).then(() => document.fonts.ready).then(() => true);
function camOf(s, t) {
  const u = eio(p(t, s.a, s.b)), mv = s.mv, [iw, ih] = DIM[s.img];
  const cov = [Math.min(1, (iw / ih) / (W / PH) * 0 + 1), (iw / (W / PH)) / ih]; // cover fit by width
  if (cov[1] > 1) { cov[0] = 1 / cov[1]; cov[1] = 1; }
  const z = lerp(mv.z[0], mv.z[1], u), hx = cov[0] / z / 2, hy = cov[1] / z / 2;
  const cx = cl(lerp(mv.c[0][0], mv.c[1][0], u), hx + .02, 1 - hx - .02), cy = cl(lerp(mv.c[0][1], mv.c[1][1], u), hy + .02, 1 - hy - .02);
  const par = [lerp(mv.par[0][0], mv.par[1][0], u), lerp(mv.par[0][1], mv.par[1][1], u)];
  return { cam: [z, cx, cy, lerp(mv.dol[0], mv.dol[1], u)], par, cov, foc: mv.foc, look: mv.look };
}
function bind(unit, tex, name) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U(name), unit); }
function renderGL(A, B, m, type, t) {
  const ca = camOf(A, t); bind(0, TEX[A.img][0], 'tA'); bind(1, TEX[A.img][1], 'dA');
  gl.uniform4fv(U('camA'), ca.cam); gl.uniform2fv(U('parA'), ca.par); gl.uniform2fv(U('covA'), ca.cov); gl.uniform1f(U('focA'), ca.foc); gl.uniform1f(U('lookA'), ca.look);
  if (B) { const cb = camOf(B, t); bind(2, TEX[B.img][0], 'tB'); bind(3, TEX[B.img][1], 'dB'); gl.uniform4fv(U('camB'), cb.cam); gl.uniform2fv(U('parB'), cb.par); gl.uniform2fv(U('covB'), cb.cov); gl.uniform1f(U('focB'), cb.foc); gl.uniform1f(U('lookB'), cb.look); }
  else { bind(2, TEX[A.img][0], 'tB'); bind(3, TEX[A.img][1], 'dB'); }
  gl.uniform1f(U('mixv'), B ? m : 0); gl.uniform1f(U('ttype'), { luma: 0, depth: 1, flash: 2, scan: 3 }[type] ?? 0); gl.uniform1f(U('time'), t);
  gl.viewport(0, 0, W, PH); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
// project an image point (0..1) of shot s to screen (approx., ignores parallax)
function projImg(s, t, ix, iy) { const c = camOf(s, t); const sx = (ix - c.cam[1]) / (c.cov[0] / c.cam[0]) + .5, sy = (iy - c.cam[2]) / (c.cov[1] / c.cam[0]) + .5; return [sx * W, BAR + sy * PH]; }

/* ================= 2D: text & gold ================= */
const GR = [0, 1, 2, 3].map(() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; });
function txt(s, X, Y, size, color, o = {}) {
  x.save(); x.globalAlpha *= (o.a ?? 1); x.font = `${o.it ? 'italic ' : ''}${o.w || 600} ${size}px ${o.f || SANS}`;
  x.fillStyle = color; x.textAlign = o.al || 'center'; x.textBaseline = 'middle'; x.letterSpacing = (o.ls || 0) + 'px';
  x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowBlur = o.gb ?? 14; x.shadowOffsetY = 2; x.fillText(s, X, Y); x.restore();
}
function goldGrad(x0, y0, x1, y1) { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#f6dc95'); g.addColorStop(.35, '#c8933a'); g.addColorStop(.6, '#ffe9b0'); g.addColorStop(.85, '#b07a2a'); g.addColorStop(1, '#f2d38a'); return g; }
const GOLD = '#e7bd6a';
function gold(s, X, Y, size, lt, t0, o = {}) {
  const a0 = o.a ?? 1; if (a0 <= 0 || lt < t0) return;
  x.save(); x.font = `${o.it ? 'italic ' : ''}${o.w || 700} ${size}px ${o.f || SERIF}`; x.letterSpacing = (o.ls || 0) + 'px'; x.textBaseline = 'middle'; x.textAlign = 'left';
  const ch = [...s], tot = x.measureText(s).width, x0 = o.al === 'left' ? X : o.al === 'right' ? X - tot : X - tot / 2;
  const g = goldGrad(x0, Y - size * .55, x0 + tot * .35, Y + size * .5);
  const shv = ((lt - t0) * .45) % 2.2 - .6, hg = x.createLinearGradient(x0, Y, x0 + tot, Y);
  [[-.2, 0], [-.06, 0], [0, .85], [.06, 0], [1.4, 0]].forEach(([d, al]) => hg.addColorStop(cl(shv + d), `rgba(255,250,225,${al})`));
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
function backing(X, Y, r, a) { if (a <= 0) return; x.save(); x.globalAlpha = a; const g = x.createRadialGradient(X, Y, 10, X, Y, r); g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r); x.restore(); }
function keyword(word, sub, lt, t0, t1, o = {}) {
  const k = eo(p(lt, t0, t0 + .9)) * (1 - p(lt, t1 - .6, t1)); if (k <= 0) return;
  const X = 150, Y = BAR + PH - 150; backing(X + 300, Y, 560, k * .85);
  x.save(); x.globalAlpha = k; x.fillStyle = GOLD; x.fillRect(X, Y - 52, 3, sub ? 106 : 70); x.restore();
  gold(word, X + 26, Y - 16, o.size || 62, lt, t0, { al: 'left', a: 1 - p(lt, t1 - .6, t1) });
  if (sub) txt(sub, X + 28 + (1 - k) * 22, Y + 38, 30, '#ecd2a8', { al: 'left', a: k * .95, ls: 1, f: SERIF, it: true });
}
// line-art helpers
function stroke(a, w = 2.5, glow = 14) { x.strokeStyle = GOLD; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.globalAlpha = a; x.shadowColor = 'rgba(255,180,70,.7)'; x.shadowBlur = glow; x.stroke(); x.shadowBlur = 0; }
function line(x0, y0, x1, y1, k, a, w) { if (k <= 0) return; x.beginPath(); x.moveTo(x0, y0); x.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); stroke(a, w); }
function arc(X, Y, r, k, a, w, st = -Math.PI / 2) { if (k <= 0) return; x.beginPath(); x.arc(X, Y, r, st, st + Math.PI * 2 * k); stroke(a, w); }
function dot(X, Y, r, a) { x.save(); x.globalAlpha = a; x.fillStyle = '#ffe2a0'; x.shadowColor = 'rgba(255,190,90,.9)'; x.shadowBlur = 18; x.beginPath(); x.arc(X, Y, r, 0, 7); x.fill(); x.restore(); }
function small(s, X, Y, a, o = {}) { txt(s, X, Y, o.size || 19, o.col || '#f1dcb6', { a, ls: o.ls ?? 4, al: o.al || 'center', w: o.w || 600 }); }

/* ================= infographics ================= */
const IG = {
  timeline(o, l, a, sc) { // horizontal gold timeline
    const X = o.x, Y = o.y, n = o.pts.length, Wd = 520; backing(X + Wd / 2, Y, 420, a * .9);
    x.save(); line(X, Y, X + Wd, Y, eo(p(l, 0, 1.4)), a, 2);
    o.pts.forEach(([y, s], i) => { const px = X + 40 + i * (Wd - 80) / (n - 1), k = eo(p(l, .4 + i * .5, 1.2 + i * .5)); if (k <= 0) return; dot(px, Y, 7 * k, a); x.restore(); gold(y, px, Y - 52, 54, l, .4 + i * .5, { a }); small(s.toUpperCase(), px, Y + 38, k * a); x.save(); });
    x.restore(); small(o.label, X + Wd / 2, Y + 86, eo(p(l, 1, 2)) * a, { size: 16, ls: 8, col: '#cdb489' });
  },
  stamp(o, l, a) { const k = p(l, .1, .55); if (k <= 0) return; backing(o.x, o.y, 330, a * .9);
    x.save(); x.translate(o.x, o.y); x.rotate(-.08); const s = 1 + 1.4 * (1 - eo(k)); x.scale(s, s); x.globalAlpha = eo(k) * a;
    x.strokeStyle = goldGrad(-170, -70, 170, 70); x.lineWidth = 4; x.shadowColor = 'rgba(255,170,60,.7)'; x.shadowBlur = 16; x.strokeRect(-210, -78, 420, 156); x.lineWidth = 1.5; x.strokeRect(-198, -66, 396, 132); x.restore();
    gold(o.big, o.x, o.y - 12, 96, l, .35, { st: .06, a }); gold(o.small, o.x, o.y + 120, 34, l, .9, { it: true, st: .025, a }); },
  counter(o, l, a) { backing(o.x, o.y, 360, a * .9); const k = eo(p(l, 0, 2.2)), n = Math.round(lerp(o.from, o.to, k));
    x.save(); x.globalAlpha = a * eo(p(l, 0, .3)); x.font = `700 150px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = goldGrad(o.x - 160, o.y - 80, o.x + 160, o.y + 60); x.shadowColor = 'rgba(255,170,60,.6)'; x.shadowBlur = 30; x.fillText(String(n), o.x, o.y); x.restore();
    line(o.x - 150, o.y + 82, o.x + 150, o.y + 82, eo(p(l, .3, 1.4)), a, 2); small(o.label, o.x, o.y + 112, eo(p(l, .8, 1.6)) * a, { size: 20, ls: 12 });
    if (o.sub) gold(o.sub, o.x, o.y + 160, 36, l, 1.4, { it: true, a }); },
  flow(o, l, a) { const X = o.x, Y = o.y; backing(X, Y, 520, a * .9);
    gold(o.a, X - 250, Y, 44, l, 0, { a }); line(X - 90, Y, X + 70, Y, eo(p(l, .8, 1.8)), a, 3);
    const k = eo(p(l, 1.5, 1.9)); if (k > 0) { x.beginPath(); x.moveTo(X + 52, Y - 14); x.lineTo(X + 72, Y); x.lineTo(X + 52, Y + 14); stroke(a * k, 3); }
    gold(o.b, X + 250, Y, 44, l, 1.6, { a }); small('992 · ÍYELEW', X, Y + 48, eo(p(l, 2, 2.8)) * a, { size: 15, ls: 6 }); },
  century(o, l, a) { backing(o.x, o.y, 360, a * .95); const r = o.big.length > 5 ? 190 : 150;
    arc(o.x, o.y, r, eo(p(l, 0, 1.6)), a * .9, 2); arc(o.x, o.y, r + 12, eo(p(l, .3, 1.9)), a * .45, 1);
    for (let i = 0; i < 24; i++) { const ang = i / 24 * 6.283 - 1.57, k = p(l, .2 + i * .04, .5 + i * .04); if (k > 0) line(o.x + Math.cos(ang) * (r + 18), o.y + Math.sin(ang) * (r + 18), o.x + Math.cos(ang) * (r + 18 + (i % 6 ? 6 : 14)), o.y + Math.sin(ang) * (r + 18 + (i % 6 ? 6 : 14)), 1, a * .7 * k, 1.5); }
    gold(o.big, o.x, o.y - 10, o.big.length > 9 ? 64 : o.big.length > 5 ? 80 : 104, l, .5, { st: .06, a }); gold(o.small, o.x, o.y + 66, 32, l, 1.2, { it: true, st: .03, a }); },
  area(o, l, a) { backing(o.x, o.y + 20, 380, a * .95); const S = 170, X = o.x - S / 2, Y = o.y - S / 2 - 10, k = eo(p(l, 0, 1.8));
    x.save(); x.beginPath(); const per = 4 * S, d = per * k; let r = d; x.moveTo(X, Y); [[S, 0], [0, S], [-S, 0], [0, -S]].reduce(([px, py], [dx, dy]) => { const L = Math.abs(dx + dy), u = cl(r / L); x.lineTo(px + dx * u, py + dy * u); r -= L; return [px + dx, py + dy]; }, [X, Y]); stroke(a, 2.5); x.restore();
    x.save(); x.globalAlpha = a * .15 * eo(p(l, 1.2, 2)); x.fillStyle = '#e7bd6a'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) x.fillRect(X + i * S / 8, Y + j * S / 8, S / 8, S / 8); x.restore();
    const n = Math.round(o.n * eo(p(l, .5, 2.6))); x.save(); x.globalAlpha = a; x.font = `700 92px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = goldGrad(o.x - 80, o.y - 60, o.x + 80, o.y + 40); x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 16; x.fillText(String(n), o.x, o.y - 10); x.restore();
    gold(o.unit, o.x, o.y + S / 2 + 36, 38, l, 1.2, { it: true, a }); },
  question(o, l, a) { backing(o.x, o.y, 360, a * .9); arc(o.x, o.y - 10, 92, eo(p(l, 0, 1.4)), a, 2); gold('?', o.x, o.y - 6, 120, l, .3, { a }); gold(o.q, o.x, o.y + 130, 40, l, .8, { it: true, a }); },
  signal(o, l, a, s, t) { const [X, Y] = projImg(s, t, o.ax, o.ay);
    for (let i = 0; i < 4; i++) { const r = ((l * .45 + i / 4) % 1); x.save(); x.beginPath(); x.ellipse(X, Y, 30 + r * 520, (30 + r * 520) * .42, 0, 0, 7); stroke(a * (1 - r) * .8 * eo(p(l, 0, .6)), 2); x.restore(); }
    dot(X, Y, 8, a * eo(p(l, 0, .5))); backing(520, BAR + 170, 380, a * .9); gold(o.label, 520, BAR + 160, 52, l, .6, { a }); small('boljawlarǵa qaraǵanda', 520, BAR + 214, eo(p(l, 1, 1.8)) * a, { size: 26, ls: 1, w: 500 }); },
  triad(o, l, a) { backing(o.x, o.y, 400, a * .95); const items = [['biyik', 'up'], ['dóńgelek', 'circle'], ['jińishkerip barǵan', 'taper']];
    items.forEach(([s, ic], i) => { const Y = o.y - 140 + i * 140, X = o.x - 120, t0 = i * .9, k = eo(p(l, t0, t0 + 1)); if (k <= 0) return;
      x.save(); if (ic === 'up') { line(X, Y + 40, X, Y - 40, k, a, 3); if (k > .8) { x.beginPath(); x.moveTo(X - 14, Y - 26); x.lineTo(X, Y - 42); x.lineTo(X + 14, Y - 26); stroke(a, 3); } }
      if (ic === 'circle') arc(X, Y, 34, k, a, 3);
      if (ic === 'taper') { x.beginPath(); x.moveTo(X - 30, Y + 40); x.lineTo(lerp(X - 30, X - 14, k), lerp(Y + 40, Y - 40, k)); x.moveTo(X + 30, Y + 40); x.lineTo(lerp(X + 30, X + 14, k), lerp(Y + 40, Y - 40, k)); stroke(a, 3); }
      x.restore(); gold(s, X + 64, Y, 48, l, t0 + .2, { al: 'left', it: true, a }); }); },
  measure(o, l, a) { const X = o.x, Y0 = BAR + PH - 80, Y1 = BAR + 90, k = eo(p(l, 0, 2)); backing(X + 60, (Y0 + Y1) / 2, 380, a * .9);
    line(X, Y0, X, Y1, k, a, 2.5); for (let i = 0; i <= 20; i++) { const yy = lerp(Y0, Y1, i / 20); if (p(l, i * .08, i * .08 + .2) > 0) line(X, yy, X + (i % 5 ? 14 : 30), yy, 1, a * .8, 1.5); }
    const q = 1 + .05 * Math.sin(l * 4); x.save(); x.translate(X + 120, Y1 + 40); x.scale(q, q); x.restore(); gold('? m', X + 140, Y1 + 50, 92, l, 1.4, { a }); small(o.label.toUpperCase(), X + 140, Y1 + 110, eo(p(l, 1.8, 2.4)) * a, { ls: 10 }); },
  compass(o, l, a) { backing(o.x, o.y + 20, 380, a * .95); const r = 90, k = eo(p(l, 0, 1.4)); arc(o.x, o.y, r, k, a, 2); arc(o.x, o.y, r - 12, k, a * .5, 1);
    const n = eo(p(l, .8, 1.6)); if (n > 0) { x.save(); x.beginPath(); x.moveTo(o.x, o.y - r * .95 * n); x.lineTo(o.x + 18, o.y); x.lineTo(o.x, o.y + r * .5 * n); x.lineTo(o.x - 18, o.y); x.closePath(); x.globalAlpha = a; x.fillStyle = goldGrad(o.x - 20, o.y - r, o.x + 20, o.y); x.shadowColor = 'rgba(255,170,60,.7)'; x.shadowBlur = 16; x.fill(); x.restore(); }
    gold('ARQA', o.x, o.y - r - 34, 30, l, 1, { ls: 8, w: 700, f: SANS, a }); gold(o.label, o.x, o.y + r + 56, 50, l, 1.3, { a }); small(o.sub.toUpperCase(), o.x, o.y + r + 102, eo(p(l, 1.8, 2.4)) * a, { size: 16 }); },
  parts(o, l, a) { backing(o.x, o.y, 420, a * .95); const R = [[220, 150, 'III', ''], [140, 96, 'II', ''], [62, 44, 'I', '']];
    R.forEach(([rw, rh, n, s], i) => { const k = eo(p(l, i * .9, i * .9 + 1.2)); if (k <= 0) return; x.save(); x.beginPath(); x.ellipse(o.x, o.y, rw, rh, 0, -1.57, -1.57 + 6.283 * k); stroke(a, 2.2 + i * .4); x.restore();
      gold(n, o.x + rw * .72, o.y - rh * .72 - 10, 34, l, i * .9 + .6, { a }); });
    gold('Úsh bólim', o.x, o.y - 210, 54, l, .2, { a });
    const m = eo(p(l, 2.8, 3.4)); if (m > 0) { x.save(); x.globalAlpha = a * m; x.fillStyle = goldGrad(o.x - 20, o.y - 20, o.x + 20, o.y + 10); x.beginPath(); x.arc(o.x, o.y + 4, 16, Math.PI, 0); x.fill(); x.fillRect(o.x - 22, o.y + 4, 44, 12); x.restore(); } },
  water(o, l, a) { backing(o.x, o.y + 30, 420, a * .95); for (let w = 0; w < 3; w++) { const k = eo(p(l, w * .4, w * .4 + 1.2)); if (k <= 0) continue; x.save(); x.beginPath(); for (let i = 0; i <= 60 * k; i++) { const xx = o.x - 150 + i * 5, yy = o.y + w * 26 + Math.sin(i * .35 + l * 3 + w) * 8; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } stroke(a * (1 - w * .25), 2.5); x.restore(); }
    gold(o.label, o.x, o.y + 120, 40, l, .8, { it: true, a }); },
  check(o, l, a) { backing(o.x, o.y + 20, 380, a * .95); arc(o.x, o.y, 80, eo(p(l, 0, 1.2)), a, 2.5); const k = eo(p(l, .9, 1.6)); if (k > 0) { x.save(); x.beginPath(); x.moveTo(o.x - 34, o.y + 2); x.lineTo(o.x - 8, o.y + 28); x.lineTo(lerp(o.x - 8, o.x + 40, k), lerp(o.y + 28, o.y - 30, k)); stroke(a, 5); x.restore(); }
    gold(o.label, o.x, o.y + 130, 50, l, 1.2, { a }); },
  doc(o, l, a) { backing(o.x, o.y, 420, a * .95); const X = o.x - 110, Y = o.y - 150, k = eo(p(l, 0, 1.4));
    x.save(); x.beginPath(); x.moveTo(X, Y); x.lineTo(X + 180 * k, Y); if (k > .5) { x.lineTo(X + 180, Y + 260 * cl(k * 2 - 1)); } stroke(a, 2.5); x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y + 260 * k); if (k > .5) x.lineTo(X + 180 * cl(k * 2 - 1), Y + 260); stroke(a, 2.5); x.restore();
    for (let i = 0; i < 6; i++) line(X + 24, Y + 100 + i * 22, X + 24 + (i === 5 ? 70 : 130), Y + 100 + i * 22, eo(p(l, .8 + i * .1, 1.2 + i * .1)), a * .55, 2);
    gold(o.n, o.x, Y - 40, 44, l, .9, { a }); const st = p(l, 1.6, 1.95); if (st > 0) { x.save(); x.translate(X + 170, Y + 230); x.scale(1 + 1.2 * (1 - eo(st)), 1 + 1.2 * (1 - eo(st))); x.beginPath(); x.arc(0, 0, 44, 0, 7); stroke(a * eo(st), 3); x.restore(); gold(o.y2, X + 170, Y + 232, 30, l, 1.8, { a }); }
    small(o.label, o.x, Y + 300, eo(p(l, 2, 2.6)) * a, { size: 24, ls: 1, w: 500 }); },
  seasons(o, l, a) { backing(o.x, o.y + 30, 420, a * .95); const X1 = o.x - 110, X2 = o.x + 110, Y = o.y, k1 = eo(p(l, 0, 1.2)), k2 = eo(p(l, .8, 2));
    for (let i = 0; i < 6; i++) { const an = i / 6 * 6.283; line(X1, Y, X1 + Math.cos(an) * 56, Y + Math.sin(an) * 56, k1, a, 2.5); }
    arc(X2, Y, 30, k2, a, 2.5); for (let i = 0; i < 12; i++) { const an = i / 12 * 6.283; if (k2 > .5) line(X2 + Math.cos(an) * 42, Y + Math.sin(an) * 42, X2 + Math.cos(an) * 60, Y + Math.sin(an) * 60, cl(k2 * 2 - 1), a, 2.5); }
    gold('Qısı', X1, Y + 100, 44, l, .5, { it: true, a }); gold('Jazı', X2, Y + 100, 44, l, 1.3, { it: true, a }); small('kóriw hám zıyarat etiw múmkinshiligi', o.x, Y + 160, eo(p(l, 2, 2.8)) * a, { size: 24, ls: 1, w: 500 }); },
  icons3(o, l, a) { backing(o.x, o.y, 420, a * .95); const it = [['tereń bilim', 'book'], ['bay tájiriybe', 'star'], ['sheberlik', 'hand']];
    it.forEach(([s, ic], i) => { const Y = o.y - 130 + i * 130, X = o.x - 140, t0 = i * 1, k = eo(p(l, t0, t0 + 1)); if (k <= 0) return; x.save();
      if (ic === 'book') { x.beginPath(); x.moveTo(X, Y - 26); x.lineTo(X, Y + 26); x.moveTo(X, Y - 26); x.quadraticCurveTo(X - 18, Y - 34, X - 40 * k, Y - 26); x.lineTo(X - 40 * k, Y + 26); x.quadraticCurveTo(X - 18, Y + 18, X, Y + 26); x.moveTo(X, Y - 26); x.quadraticCurveTo(X + 18, Y - 34, X + 40 * k, Y - 26); x.lineTo(X + 40 * k, Y + 26); x.quadraticCurveTo(X + 18, Y + 18, X, Y + 26); stroke(a, 2.5); }
      if (ic === 'star') { x.beginPath(); for (let j = 0; j <= 16 * k; j++) { const an = j / 16 * 6.283 - 1.57, rr = j % 2 ? 16 : 36; j ? x.lineTo(X + Math.cos(an) * rr, Y + Math.sin(an) * rr) : x.moveTo(X + Math.cos(an) * rr, Y + Math.sin(an) * rr); } stroke(a, 2.5); }
      if (ic === 'hand') { arc(X, Y, 32, k, a, 2.5); line(X - 14, Y + 4, X + 16, Y - 14, k, a, 2.5); line(X - 14, Y + 4, X - 4, Y + 16, k, a, 2.5); }
      x.restore(); gold(s, X + 70, Y, 46, l, t0 + .3, { al: 'left', it: true, a }); }); },
  map(o, l, a) { backing(o.x, o.y, 520, a); backing(o.x, o.y, 380, a * .8); x.save(); x.translate(o.x, o.y); x.scale(.62, .62); x.translate(-o.x, -o.y); const X = o.x, Y = o.y, k1 = eo(p(l, 0, 1.4)), k2 = eo(p(l, .6, 2.2)), k3 = eo(p(l, 1.6, 2.8));
    const sea = [[-210, -230], [-120, -260], [-40, -240], [10, -190], [-10, -130], [-80, -110], [-170, -120], [-230, -170]];
    const poly = (pts, k, w, al) => { x.beginPath(); const n = pts.length, m = n * k; for (let i = 0; i <= m; i++) { const q = pts[Math.floor(i) % n], q2 = pts[(Math.floor(i) + 1) % n], f = i - Math.floor(i); const px = X + q[0] + (q2[0] - q[0]) * f, py = Y + q[1] + (q2[1] - q[1]) * f; i ? x.lineTo(px, py) : x.moveTo(px, py); } stroke(al, w); };
    poly(sea, k1, 2, a * .9); 
    x.beginPath(); const rv = [[260, 230], [180, 150], [90, 60], [10, -20], [-40, -110]]; rv.forEach((q, i) => i <= rv.length * k2 ? (i ? x.lineTo(X + q[0], Y + q[1]) : x.moveTo(X + q[0], Y + q[1])) : 0); stroke(a * .7, 2);
    const st = [[-260, -40], [-80, -70], [120, -30], [280, 60], [300, 200], [60, 250], [-200, 220], [-290, 90]];
    poly(st, k2, 1.5, a * .6);
    x.save(); x.setLineDash([2, 0]); x.beginPath(); for (let i = 0; i <= 30 * k3; i++) { const f = i / 30, q = [lerp(-260, 120, f), lerp(-40, -30, f) - Math.sin(f * 3.14) * 40]; i ? x.lineTo(X + q[0], Y + q[1]) : x.moveTo(X + q[0], Y + q[1]); } stroke(a, 4, 22); x.restore();
    const pb = eo(p(l, 2.6, 3.2)); if (pb > 0) { const bx = X - 70, by = Y - 70; for (let i = 0; i < 3; i++) { const r = (l * .6 + i / 3) % 1; x.save(); x.beginPath(); x.arc(bx, by, 6 + r * 46, 0, 7); stroke(a * pb * (1 - r), 2); x.restore(); } dot(bx, by, 7, a * pb); gold('Bugraxan', bx, by + 50, 44, l, 2.8, { a }); }
    gold('Arqa shegara', X, Y - 310, 70, l, 1.8, { a }); gold('Xorezmshahlar mámleketi', X, Y + 310, 44, l, 2, { it: true, a }); x.restore(); },
  timescan(o, l, a) { backing(o.x, o.y, 380, a * .95); const k = eo(p(l, .2, 2.2)), yr = Math.round(lerp(2025, 1000, k));
    const r = 130; arc(o.x, o.y, r, eo(p(l, 0, 1.6)), a * .9, 2); arc(o.x, o.y, r + 12, eo(p(l, .3, 1.9)), a * .45, 1);
    if (k < .97) { x.save(); x.globalAlpha = a; x.font = `700 92px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = goldGrad(o.x - 100, o.y - 50, o.x + 100, o.y + 40); x.shadowColor = 'rgba(255,170,60,.6)'; x.shadowBlur = 24; x.fillText(String(yr), o.x, o.y - 8); x.restore(); small('JIL', o.x, o.y + 62, a * (1 - k), { size: 18, ls: 12 }); }
    else { gold('XI', o.x, o.y - 10, 120, l, 2.15, { st: .08, a }); small('ÁSIR', o.x, o.y + 70, eo(p(l, 2.5, 3)) * a, { size: 20, ls: 12 }); } },
  strata(o, l, a) { backing(o.x, o.y + 140, 420, a * .95); const L = ['XIV', 'XIII', 'XII', 'XI'];
    L.forEach((s, i) => { const Y = o.y + i * 70, k = eo(p(l, i * .5, i * .5 + 1)); if (k <= 0) return; x.save(); x.globalAlpha = a * k * (.18 + i * .07); x.fillStyle = '#c8933a'; x.fillRect(o.x - 170, Y, 340 * k, 56); x.restore(); x.save(); x.beginPath(); x.rect(o.x - 170, Y, 340 * k, 56); stroke(a * .9, 1.5, 6); x.restore(); gold(s + ' ásir', o.x, Y + 29, 32, l, i * .5 + .3, { a }); }); },
};

/* ================= FRAME ================= */
const BF = {}; let lastBF = null;
function buildFrame(s, t) { const i = Math.max(0, Math.min(299, Math.round((t - s.a) / (s.b - s.a) * 299))); const k = String(i).padStart(4, '0');
  if (BF[k]) return Promise.resolve(BF[k]); return load(`footage/build/f_${k}.jpg`).then(im => { if (lastBF) delete BF[lastBF]; BF[k] = im; lastBF = k; return im; }); }
async function draw(t) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const sc = TL.find(e => t >= e.t0 && t < e.t0 + e.d) || TL[TL.length - 1], lt = t - sc.t0;
  const act = SH.filter(s => t >= s.a && t < s.b);
  if (act.length) {
    const A = act[0], B = act[1]; const m = B ? cl((t - B.a) / (A.b - B.a)) : 0;
    if (A.img !== 'BUILD' && (!B || B.img !== 'BUILD')) { renderGL(A, B, eio(m), B ? B.mv.tr : 'luma', t); x.drawImage(gc, 0, BAR); }
    else {
      const base = A.img === 'BUILD' ? A : B, other = A.img === 'BUILD' ? B : A;
      if (other) { renderGL(other, null, 0, 'luma', t); x.drawImage(gc, 0, BAR); }
      const im = await buildFrame(base, t); const al = !B ? 1 : (base === B ? eio(m) : 1 - eio(m));
      x.save(); x.globalAlpha = al; x.drawImage(im, 0, BAR, W, PH); x.restore();
      if (B) { const fl = Math.exp(-Math.pow((m - .5) * 4.2, 2)); x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = `rgba(255,220,160,${.75 * fl})`; x.fillRect(0, BAR, W, PH); x.restore(); }
    }
  }
  const shotNow = act[act.length - 1];
  const arch = act.some(s => s.mv.look);
  if (arch) { const fr = Math.floor(t * 25); x.fillStyle = `rgba(20,10,0,${.04 + .06 * hrnd(fr)})`; x.fillRect(0, BAR, W, PH);
    for (let i = 0; i < 3; i++) if (hrnd(fr * 3 + i) > .6) { const sx = hrnd(fr * 7 + i) * W; x.strokeStyle = 'rgba(255,240,210,.2)'; x.lineWidth = 1 + hrnd(fr + i); x.beginPath(); x.moveTo(sx, BAR); x.lineTo(sx + (hrnd(fr + 9) - .5) * 20, BAR + PH); x.stroke(); }
    for (let i = 0; i < 6; i++) if (hrnd(fr * 11 + i) > .75) { x.fillStyle = 'rgba(20,12,4,.5)'; x.beginPath(); x.arc(hrnd(fr * 13 + i) * W, BAR + hrnd(fr * 17 + i) * PH, 1 + hrnd(fr + i * 3) * 3, 0, 7); x.fill(); } }
  if (act.some(s => s.img === '10' || s.img === '11')) { const ra = act.find(s => s.img === '10' || s.img === '11'); const k = cl(Math.min((t - ra.a) / .8, (ra.b - t) / .8));
    x.save(); x.strokeStyle = `rgba(215,225,235,${.42 * k})`; x.lineWidth = 1.3; x.beginPath(); for (let i = 0; i < 420; i++) { const rx = (hrnd(i) * W * 1.2 + t * 260) % (W * 1.2) - W * .1, ry = BAR + (hrnd(i + 3) * PH + t * 1300 * (1 + hrnd(i) * .5)) % PH; x.moveTo(rx, ry); x.lineTo(rx - 9, ry + 34); } x.stroke(); x.restore(); }
  // atmosphere: drifting light leak + dust motes
  x.save(); x.globalCompositeOperation = 'screen';
  const lx = W * (.1 + .8 * ((t * .017) % 1)), lg = x.createRadialGradient(lx, BAR + PH * .15, 0, lx, BAR + PH * .15, 1000); lg.addColorStop(0, 'rgba(255,180,110,.09)'); lg.addColorStop(1, 'rgba(255,180,110,0)'); x.fillStyle = lg; x.fillRect(0, BAR, W, PH);
  for (let i = 0; i < 46; i++) { const X = (hrnd(i) * W + t * (6 + hrnd(i + 3) * 16)) % W, Y = BAR + ((hrnd(i + 50) * PH - t * (3 + hrnd(i + 9) * 9)) % PH + PH) % PH; x.globalAlpha = .18 + .3 * Math.abs(Math.sin(t * .7 + i)); x.fillStyle = '#ffe2b0'; x.beginPath(); x.arc(X, Y, .8 + hrnd(i + 7) * 1.9, 0, 7); x.fill(); }
  x.restore();
  const vg = x.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = vg; x.fillRect(0, BAR, W, PH);
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = arch ? .15 : .075; const gcn = GR[Math.floor(t * 25) % 4], ox = Math.floor(hrnd(t * 25) * 256), oy = Math.floor(hrnd(t * 25 + 3) * 256);
  for (let X = -ox; X < W; X += 256) for (let Y = BAR - oy; Y < BAR + PH; Y += 256) x.drawImage(gcn, X, Y); x.restore();
  // titles
  if (sc.id === 'intro') { const out = 1 - p(lt, sc.d - 1.4, sc.d - .2); backing(W / 2, 530, 900, out * .8);
    gold('Qaraqalpaqstan tariyxı', W / 2, 420, 46, lt, 1.2, { st: .03, a: out });
    gold('Bugraxan esteligi', W / 2, 522, 136, lt, 2.4, { st: .07, a: out }); line(W / 2 - 260, 600, W / 2 + 260, 600, eo(p(lt, 3.6, 5)), out * .8, 1.5);
  }
  if (sc.id === 'end') { const o = 1 - p(lt, sc.d - 1.5, sc.d - .3); gold('Qaraqalpaqstan tariyxı', W / 2, 420, 44, lt, .3, { st: .03, a: o }); gold('Bugraxan esteligi', W / 2, 520, 120, lt, .8, { st: .06, a: o }); }
  // chapter card (centered, gold) at the start of each chapter
  if (CH[sc.id]) { const [n, nm] = CH[sc.id], k = eo(p(lt, .25, 1)) * (1 - p(lt, 2.1, 2.7)); if (k > 0) { backing(W / 2, H / 2, 700, k * .9); gold(n, W / 2, H / 2 - 50, 70, lt, .25, { a: 1 - p(lt, 2.1, 2.7), st: .1 }); line(W / 2 - 120 * k, H / 2 + 2, W / 2 + 120 * k, H / 2 + 2, 1, k * .8, 1.5); gold(nm, W / 2, H / 2 + 52, 54, lt, .5, { it: true, a: 1 - p(lt, 2.1, 2.7) }); }
    const k2 = eo(p(lt, 2.7, 3.5)) * (1 - p(lt, 7, 8)); if (k2 > 0) { x.save(); x.globalAlpha = k2; x.fillStyle = GOLD; x.fillRect(110, BAR + 46, 46, 2); x.restore(); txt(`${n} · ${nm}`.toUpperCase(), 172, BAR + 47, 20, '#f6e2c0', { a: k2, al: 'left', ls: 6 }); } }
  for (const [si, w, sub, o] of (KEYS[sc.id] || [])) { const t0 = sc.T[si] + .5, t1 = (sc.T[si + 1] ?? sc.d) - .1; keyword(w, sub, lt, t0, t1, o || {}); }
  for (const [si, ty, o] of (INFO[sc.id] || [])) { const t0 = sc.T[si] + .4, t1 = (sc.T[si + 1] ?? sc.d) - .15; if (lt < t0 || lt > t1) continue; const a = eo(p(lt, t0, t0 + .5)) * (1 - p(lt, t1 - .6, t1)); x.save(); IG[ty](o, lt - t0, a, shotNow, t); x.restore(); }
  // scene fades (dip to black between chapters)
  const f = Math.min(eo(p(lt, 0, sc.id === 'intro' ? 2 : .45)), eo(p(sc.d - lt, 0, sc.id === 'end' ? 1.5 : .45)));
  if (f < 1) { x.fillStyle = `rgba(0,0,0,${1 - f})`; x.fillRect(0, 0, W, H); }
  x.fillStyle = '#000'; x.fillRect(0, 0, W, BAR); x.fillRect(0, H - BAR, W, BAR);
  if (/subs/.test(location.search)) { const s = SUBS.find(q => t >= q.a && t < q.b); if (s) {
    const k = Math.min(p(t, s.a, s.a + .25), p(s.b - t, 0, .25)); x.font = `500 30px ${SANS}`; x.letterSpacing = '0px';
    const ws = s.s.split(' '), ls = []; let cur = ''; for (const w of ws) { const tt = cur ? cur + ' ' + w : w; if (x.measureText(tt).width > 1560 && cur) { ls.push(cur); cur = w; } else cur = tt; } ls.push(cur);
    const y0 = H - BAR / 2 - (ls.length - 1) * 20; ls.forEach((ln, i) => txt(ln, W / 2, y0 + i * 40, 30, '#f3ece0', { w: 500, a: k, gb: 0 }));
  } }
}
window.draw = draw;
if (!/render/.test(location.search)) { const t0 = performance.now(); window.ready.then(() => { const loop = () => { draw(((performance.now() - t0) / 1000) % TOTAL); requestAnimationFrame(loop); }; loop(); }); }
