// Буғрахан естелиги — реалистлик 3D ҳүжжетли фильм (Three.js). Экрандағы гилт сөзлер — қарақалпақ латын жазыўында.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as Wd from './world.js';
import * as St from './sets.js';

const W = 1920, H = 1080, PH = 804, BAR = (H - PH) / 2;
const out = document.getElementById('c'), x = out.getContext('2d');
const SERIF = 'CG, "Liberation Serif", serif', SANS = 'Inter, "DejaVu Sans", sans-serif';
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), p = (t, a, b) => cl((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - t, 3), eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, sm = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t, V = (a, b, c) => new THREE.Vector3(a, b, c);
const lv = (a, b, t) => a.clone().lerp(b, t);
function hrnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

/* ================= renderer & post ================= */
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
R.setPixelRatio(1); R.setSize(W, PH); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .6;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const cam = new THREE.PerspectiveCamera(36, W / PH, .2, 15000);
const pmrem = new THREE.PMREMGenerator(R);

const composer = new EffectComposer(R);
const rpass = new RenderPass(new THREE.Scene(), cam); composer.addPass(rpass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, PH / 2), .3, .55, .88); composer.addPass(bloom);
composer.addPass(new OutputPass());
const GRADE = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, sepia: { value: 0 }, vign: { value: .55 }, grain: { value: .035 }, sat: { value: 1 }, contrast: { value: 1.05 }, flick: { value: 1 }, tint: { value: V(1, 1, 1) }, lift: { value: V(0, 0, 0) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time,sepia,vign,grain,sat,contrast,flick; uniform vec3 tint,lift; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){ vec2 d=vUv-.5; float ca=.0016*length(d)*2.;
    vec3 c=vec3(texture2D(tDiffuse,vUv+d*ca).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-d*ca).b);
    c=c*tint+lift*(1.-c); float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,sat); c=(c-.5)*contrast+.5;
    vec3 sp=vec3(l)*vec3(1.08,.88,.64)*1.08; c=mix(c,sp,sepia);
    c*=1.-vign*dot(d,d)*1.7; c+=(h(vUv*vec2(1920.,804.)+fract(time*7.31)*91.)-.5)*grain; c*=flick;
    gl_FragColor=vec4(clamp(c,0.,1.),1.); }`
};
const grade = new ShaderPass(GRADE); composer.addPass(grade);
function setGrade(o = {}) {
  const u = grade.uniforms; u.sepia.value = o.sepia ?? 0; u.vign.value = o.vign ?? .55; u.grain.value = o.grain ?? .035; u.sat.value = o.sat ?? 1;
  u.contrast.value = o.contrast ?? 1.05; u.flick.value = o.flick ?? 1; u.tint.value.set(...(o.tint || [1, .98, .95])); u.lift.value.set(...(o.lift || [.01, .01, .02]));
  bloom.strength = o.bloom ?? .3; R.toneMappingExposure = o.exp ?? .6;
}

/* ================= SITE scene ================= */
const site = new THREE.Scene();
const sky = new Sky(); sky.scale.setScalar(12000); site.add(sky);
const sun = new THREE.DirectionalLight('#ffd9b0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .5; site.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#bcd0ff', '#5a4028', .6); site.add(hemi);
site.fog = new THREE.FogExp2('#d8b48a', .0008);
const groundMat = Wd.groundMaterial(), brickMat = Wd.brickMaterial(), clayMat = Wd.clayMaterial();
site.add(Wd.terrain(groundMat));
const minaret = Wd.minaretMesh(brickMat); site.add(minaret);
const ruins = Wd.ruins(clayMat); site.add(ruins);
const camp = St.camp(); site.add(camp);
const recon = St.reconstruction(clayMat, brickMat); site.add(recon.g);
const stars = St.starfield(); site.add(stars);
const fireTex = St.spriteTex([255, 170, 80]), warmTex = St.spriteTex([255, 214, 150]);
const fire = St.points(140, 1.6, '#ff9a48', fireTex); fire.material.opacity = .35; site.add(fire);
const fireLight = new THREE.PointLight('#ff9a48', 0, 0, 2); fireLight.position.set(0, 49, 0); site.add(fireLight);
const farTowers = new THREE.Group(); [[-1500, -900], [1700, -1300], [2300, 600], [-2100, 1200]].forEach(([fx, fz]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4.4, 40, 16), new THREE.MeshStandardMaterial({ color: '#2a2018' })); m.position.set(fx, Wd.height(fx, fz) + 20, fz); farTowers.add(m); });
const farFires = St.points(4, 60, '#ffa050', fireTex); site.add(farTowers, farFires);
const lanterns = St.points(160, 5, '#ffcf8a', warmTex); site.add(lanterns);
const L = St.lamps(10); site.add(L.g);
const crowd = St.people(14, 3); site.add(crowd);
const snow = St.points(3000, .25, '#ffffff', St.spriteTex([255, 255, 255]), false); site.add(snow);
const rainG = new THREE.BufferGeometry(); rainG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2400 * 6), 3));
const rain = new THREE.LineSegments(rainG, new THREE.LineBasicMaterial({ color: '#c8d2da', transparent: true, opacity: .35 })); site.add(rain);
const waterNrm = (() => { const c = Wd.canvas(512, 512); Wd.noiseFill(c.getContext('2d'), 512, 512, .03, [128, 128, 128], [127, 127, 127], 4, 5); const t = Wd.tex(Wd.normalFrom(c, 5), 6, false); return t; })();
const water = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: '#3b3a30', roughness: .06, metalness: .7, normalMap: waterNrm, normalScale: new THREE.Vector2(.35, .35), transparent: true, opacity: .96 }));
water.rotation.x = -Math.PI / 2; site.add(water);
// glowing survey outlines on the ground
const SHAH = Wd.CITY.map(([a, b]) => [a * .58, b * .58]);
function groundTube(poly, color, r = 1.6) {
  const pts = poly.concat([poly[0]]).flatMap((q, i, arr) => { if (i === arr.length - 1) return [q]; const n = arr[i + 1], o = []; for (let k = 0; k < 8; k++) o.push([lerp(q[0], n[0], k / 8), lerp(q[1], n[1], k / 8)]); return o; });
  const v = pts.map(([a, b]) => V(a, Wd.height(a, b) + 2.5 + (recon ? 0 : 0), b)); const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v), v.length * 2, r, 6, false);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: .9, fog: false })); m.userData.set = k => g.setDrawRange(0, Math.floor(k * g.index.count / 6) * 6); return m;
}
const outlines = { city: groundTube(Wd.CITY, '#ffd08a', 2.4), shah: groundTube(SHAH, '#ffb36a', 2), cit: groundTube(Wd.CITADEL.map(([a, b]) => [a * 1.05, b * 1.05]), '#ff8a5a', 1.8) };
Object.values(outlines).forEach(o => site.add(o));
const nightBg = (() => { const c = Wd.canvas(16, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#02040c'); gr.addColorStop(.6, '#0a1430'); gr.addColorStop(1, '#1c2440'); g.fillStyle = gr; g.fillRect(0, 0, 16, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const envCache = {};
function setSky(o) {
  const el = o.elev, az = THREE.MathUtils.degToRad(o.az ?? 240);
  const dir = new THREE.Vector3(Math.cos(THREE.MathUtils.degToRad(el)) * Math.sin(az), Math.sin(THREE.MathUtils.degToRad(el)), Math.cos(THREE.MathUtils.degToRad(el)) * Math.cos(az));
  const u = sky.material.uniforms; u.turbidity.value = o.turb ?? 5; u.rayleigh.value = o.ray ?? 1.5; u.mieCoefficient.value = o.mie ?? .005; u.mieDirectionalG.value = .86; u.sunPosition.value.copy(dir);
  const night = !!o.night; sky.visible = !night; site.background = night ? nightBg : null;
  const c = o.focus || V(0, 0, 0), ext = o.shadow || 90;
  sun.position.copy(c).addScaledVector(night && o.moon ? o.moon : dir, 900); sun.target.position.copy(c);
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 100, far: 2400 }); sun.shadow.camera.updateProjectionMatrix();
  sun.color.set(o.sunCol || '#ffd2a6'); sun.intensity = o.sunI ?? 3; hemi.color.set(o.hemiSky || '#bcd0ff'); hemi.groundColor.set(o.hemiGr || '#5a4028'); hemi.intensity = o.hemiI ?? .6;
  site.fog.color.set(o.fog || '#d8b48a'); site.fog.density = o.fogD ?? .0008;
  const key = night ? 'night' : [Math.round(el), Math.round(o.az ?? 240), o.turb ?? 5].join(',');
  if (!envCache[key]) { if (night) { const s = new THREE.Scene(); s.background = new THREE.Color('#101830'); envCache[key] = pmrem.fromScene(s).texture; } else { const s = new THREE.Scene(), sk = new Sky(); sk.scale.setScalar(1000); sk.material.uniforms.sunPosition.value.copy(dir); ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG'].forEach(k => sk.material.uniforms[k].value = u[k].value); s.add(sk); envCache[key] = pmrem.fromScene(s).texture; } }
  site.environment = envCache[key]; site.environmentIntensity = o.envI ?? .55;
  return dir;
}

/* ================= MAP & STUDIO scenes ================= */
const MAP = St.mapScene();
const studio = new THREE.Scene(); studio.background = new THREE.Color('#060504');
studio.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture; studio.environmentIntensity = .5;
const key = new THREE.SpotLight('#ffe2bc', 300, 0, .5, .6, 2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0002; studio.add(key, key.target);
const rim = new THREE.DirectionalLight('#8fb4ff', 1.2); studio.add(rim);
const shemi = new THREE.HemisphereLight('#ffe6c8', '#1a120a', .25); studio.add(shemi);
const coin = St.coin(); studio.add(coin);
const DEC = St.decree(); studio.add(DEC.g);
const EXC = St.excavation(groundMat); studio.add(EXC.g);
const AST = St.astrolabe(); studio.add(AST.g);
const STR = St.strata(clayMat); studio.add(STR.g);
const dust = St.points(500, .05, '#ffd9a0', warmTex); studio.add(dust);
const holo = new THREE.Group(); {
  const pts = []; for (let i = 0; i <= 14; i++) pts.push(new THREE.Vector2(4.3 + (2.7 - 4.3) * i / 14, i * 2)); pts.push(new THREE.Vector2(.01, 28));
  const lg = new THREE.LatheGeometry([new THREE.Vector2(.01, 0), new THREE.Vector2(4.8, 0)].concat(pts), 28);
  holo.add(new THREE.LineSegments(new THREE.WireframeGeometry(lg), new THREE.LineBasicMaterial({ color: '#8fd0ff', transparent: true, opacity: .55, toneMapped: false })));
  holo.add(new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: '#2a7fd0', transparent: true, opacity: .12, depthWrite: false, toneMapped: false })));
  const grid = new THREE.GridHelper(60, 30, '#3a78b8', '#1b3c66'); holo.add(grid);
  const ring = new THREE.Mesh(new THREE.RingGeometry(9, 9.15, 96), new THREE.MeshBasicMaterial({ color: '#8fd0ff', toneMapped: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; holo.add(ring);
} studio.add(holo);
const holoBg = new THREE.Color('#06142a'), darkBg = new THREE.Color('#060504');

/* ================= 2D overlay helpers ================= */
function txt(s, X, Y, size, color, o = {}) {
  x.save(); x.globalAlpha *= (o.a ?? 1); x.font = `${o.it ? 'italic ' : ''}${o.w || 600} ${size}px ${o.f || SANS}`;
  x.fillStyle = color; x.textAlign = o.al || 'center'; x.textBaseline = 'middle'; if (o.ls) x.letterSpacing = o.ls + 'px';
  x.shadowColor = o.glow || 'rgba(0,0,0,.65)'; x.shadowBlur = o.gb ?? 18; x.shadowOffsetY = o.glow ? 0 : 2;
  x.fillText(s, X, Y); x.restore();
}
function rtxt(s, X, Y, size, color, lt, t0, o = {}) { const k = eo(p(lt, t0, t0 + (o.dur || 1.6))); if (k <= 0) return; txt(s, X, Y + (1 - k) * (o.dy ?? 20), size, color, { ...o, a: k * (o.a ?? 1), ls: (o.ls || 0) + (1 - k) * (o.spread ?? 10) }); }
// documentary keyword card (lower-left): thin gold rule + serif word + small caps line
function keyword(word, sub, lt, t0, t1, o = {}) {
  const k = eo(p(lt, t0, t0 + .9)) * (1 - p(lt, t1 - .6, t1));
  if (k <= 0) return; const X = o.x ?? 150, Y = o.y ?? (BAR + PH - 150);
  x.save(); x.globalAlpha = k; x.fillStyle = '#e6b877'; x.fillRect(X, Y - 52, 3, sub ? 106 : 70); x.restore();
  txt(word, X + 26 + (1 - k) * 16, Y - 16, o.size || 58, '#fff5e4', { f: SERIF, w: 700, al: 'left', a: k });
  if (sub) txt(sub.toUpperCase(), X + 28 + (1 - k) * 22, Y + 32, 20, '#ecd2a8', { w: 600, al: 'left', a: k * .95, ls: 5 });
}
function proj(v, camera = cam) { const q = v.clone().project(camera); return [(q.x + 1) / 2 * W, BAR + (1 - q.y) / 2 * PH, q.z < 1]; }
function mapLabel(s, v, k, o = {}) { if (k <= 0) return; const [X, Y, ok] = proj(v); if (!ok) return; txt(s, X + (o.dx || 0), Y + (o.dy || 0), o.size || 30, o.col || '#fff4e0', { f: o.f || SERIF, w: 700, it: o.it, a: k, ls: o.ls ?? 3, gb: 12 }); }
function ping(v, k, lt) { if (k <= 0) return; const [X, Y] = proj(v); for (let i = 0; i < 3; i++) { const r = (lt * .6 + i / 3) % 1; x.strokeStyle = `rgba(255,120,80,${(1 - r) * .8 * k})`; x.lineWidth = 3; x.beginPath(); x.ellipse(X, Y, 10 + r * 80, (10 + r * 80) * .45, 0, 0, 7); x.stroke(); } }

/* ================= helpers for scenes ================= */
function shake(t, amt = 1, seed = 0) { return V(Wd.fbm(t * .35 + seed, 3.1, 3) * amt, Wd.fbm(t * .3 + seed, 7.7, 3) * amt * .6, Wd.fbm(t * .33 + seed, 11.3, 3) * amt); }
function look(pos, tgt, t, amt = .25, fov = 36) { cam.fov = fov; if (ACTIVE === site) { pos = pos.clone(); pos.y += Math.max(0, Wd.height(pos.x, pos.z)); } cam.position.copy(pos).add(shake(t, amt)); cam.lookAt(tgt.clone().add(shake(t + 50, amt * .6))); cam.updateProjectionMatrix(); }
function orbit(r, h, a) { return V(Math.cos(a) * r, h, Math.sin(a) * r); }
let ACTIVE = site;
function hideAll() {
  [camp, recon.g, stars, fire, farTowers, farFires, lanterns, L.g, crowd, snow, rain, water, ...Object.values(outlines)].forEach(o => o.visible = false);
  minaret.visible = ruins.visible = true; fireLight.intensity = 0; L.bulb.emissiveIntensity = 0;
  groundMat.color.set('#ffffff'); groundMat.roughness = .95;
  [coin, DEC.g, EXC.g, AST.g, STR.g, holo, dust].forEach(o => o.visible = false);
  MAP.A.visible = true; MAP.B.visible = false; Object.values(MAP.lines).forEach(l => l.visible = false); MAP.pin.visible = false;
  studio.background = darkBg; key.intensity = 300; rim.intensity = 1.2; shemi.intensity = .25;
}
function useRecon(on) { recon.g.visible = on; minaret.visible = !on; ruins.visible = !on; }
function particlesFire(lt, base, n = 140, spread = 2.6, rise = 7) {
  const a = fire.geometry.attributes.position;
  for (let i = 0; i < n; i++) { const f = (lt * (.8 + hrnd(i) * .6) + hrnd(i + 9)) % 1; a.setXYZ(i, base.x + (hrnd(i + 3) - .5) * spread * (1 - f * .5) + Math.sin(lt * 3 + i) * .3, base.y + f * rise, base.z + (hrnd(i + 7) - .5) * spread * (1 - f * .5)); }
  a.needsUpdate = true; fire.visible = true;
}

/* ================= SCENES ================= */
const S = {};
S.intro = (lt, d) => {
  const k = sm(p(lt, 0, d)), el = lerp(-4, 3.5, k);
  setSky({ elev: el, az: 90, turb: 7, ray: 2.2, mie: .006, sunI: lerp(0, 2.6, p(el, -1, 3.5)), sunCol: '#ffb070', hemiI: lerp(.08, .45, k), hemiSky: '#8aa0d0', fog: lerp(0, 1, k) > .5 ? '#c99a74' : '#3a3c52', fogD: .0007, envI: lerp(.15, .5, k) });
  stars.visible = true; stars.material.opacity = cl(1 - (el + 4) / 4.5);
  look(V(lerp(-130, -78, eio(k)), lerp(2.5, 4, k), lerp(40, 26, k)), V(0, 15, -14), lt, .3, 34);
  setGrade({ exp: lerp(.35, .62, k), bloom: .45, tint: [1.02, .97, .92] });
  return () => {
    const out2 = 1 - p(lt, d - 1.6, d - .3); x.save(); x.globalAlpha = out2;
    rtxt('QARAQALPAQSTAN TARIYXI', W / 2, 400, 32, '#f3dcb4', lt, 5.4, { w: 500, ls: 16, spread: 28 });
    const ka = eo(p(lt, 6, 7.5)); x.globalAlpha = out2 * ka; x.fillStyle = '#e6b877'; x.fillRect(W / 2 - 170 * ka, 436, 340 * ka, 2); x.globalAlpha = out2;
    rtxt('Buǵraxan esteligi', W / 2, 520, 126, '#fff3dc', lt, 6.8, { f: SERIF, w: 700, ls: 2, spread: 20, dur: 2.2, glow: 'rgba(255,170,80,.55)', gb: 40 });
    rtxt('XI–XIV ásirler  ·  Qońırat rayonı', W / 2, 622, 30, '#f0c99a', lt, 8.8, { f: SERIF, it: true, ls: 3 });
    x.restore();
  };
};
S.exped = (lt, d, T) => {
  if (lt < T[2] - .3) {
    ACTIVE = site; camp.visible = true;
    setSky({ elev: 32, az: 210, turb: 8, sunI: 3, fog: '#d7c4a4', fogD: .0009, shadow: 70, focus: V(10, 0, 20) });
    const k = p(lt, 0, T[2]);
    look(V(lerp(48, 40, k), 2.0, lerp(62, 50, k)), V(lerp(6, 0, k), 9, 6), lt * 2, .35, 40);
    setGrade({ sepia: 1, grain: .13, vign: 1.1, contrast: 1.18, flick: .9 + .1 * hrnd(Math.floor(lt * 25)), exp: .62, bloom: .15 });
    return () => {
      // archival film damage
      const fr = Math.floor(lt * 25);
      for (let i = 0; i < 3; i++) if (hrnd(fr * 3 + i) > .6) { const sx = hrnd(fr * 7 + i) * W; x.strokeStyle = 'rgba(255,240,210,.25)'; x.lineWidth = 1 + hrnd(fr + i); x.beginPath(); x.moveTo(sx, BAR); x.lineTo(sx + (hrnd(fr + 9) - .5) * 20, BAR + PH); x.stroke(); }
      for (let i = 0; i < 8; i++) if (hrnd(fr * 11 + i) > .75) { x.fillStyle = 'rgba(20,12,4,.6)'; x.beginPath(); x.arc(hrnd(fr * 13 + i) * W, BAR + hrnd(fr * 17 + i) * PH, 1 + hrnd(fr + i * 3) * 3, 0, 7); x.fill(); }
      keyword('S. P. Tolstov', 'Xorezm arxeologiya-etnografiya ekspediciyası', lt, 1.2, T[2] - .4);
      txt('ARXIV · XX ÁSIR 50–60-JILLAR', W - 150, BAR + 56, 18, '#f1e2c4', { al: 'right', ls: 4, a: eo(p(lt, .5, 1.5)) * (1 - p(lt, T[2] - 1, T[2] - .4)) });
    };
  }
  ACTIVE = MAP.sc; const lm = lt - T[2] + .3, k = eio(p(lm, 0, d - T[2]));
  const tgt = St.mapPos(St.GEO.BUG, 0);
  look(lv(V(80, 1250, 820), V(tgt.x + 120, 520, tgt.z + 560), k), lv(V(40, 0, -40), tgt, k), lt, 0, 34);
  [['khorezm', p(lm, 1.2, 3.4)]].forEach(([n, v]) => { MAP.lines[n].visible = v > 0; MAP.lines[n].userData.set(eo(v)); });
  MAP.pin.visible = lm > 3; MAP.pin.scale.setScalar(eo(p(lm, 3, 3.8)) + .001);
  setGrade({ exp: .75, vign: .9, bloom: .5, contrast: 1.08 });
  return () => {
    mapLabel('Aral teńizi', St.mapPos([1020, 330], 0), eo(p(lm, .8, 1.8)), { it: true, size: 36, col: '#d7f0f4', ls: 6 });
    mapLabel('Ámiwdárya', St.mapPos([1330, 790], 0), eo(p(lm, 1.4, 2.4)), { it: true, size: 26, col: '#d7f0f4' });
    mapLabel('ÚSTIRT', St.mapPos([480, 560], 30), eo(p(lm, 1.6, 2.6)), { f: SANS, size: 24, ls: 10 });
    mapLabel('QIZILQUM', St.mapPos([1560, 560], 0), eo(p(lm, 1.8, 2.8)), { f: SANS, size: 24, ls: 10 });
    mapLabel('XOREZM', St.mapPos([1210, 830], 0), eo(p(lm, 2.2, 3.2)), { f: SANS, size: 30, ls: 12, col: '#ffd9a6' });
    ping(St.mapPos(St.GEO.BUG, 0), eo(p(lm, 3, 3.8)), lt);
    mapLabel('Buǵraxan', St.mapPos(St.GEO.BUG, 70), eo(p(lm, 3.3, 4.2)), { size: 46, dy: -50, col: '#fff' });
    const st = p(lm, 3.8, 4.25);
    if (st > 0) { x.save(); x.translate(330, BAR + PH - 170); x.rotate(-.12); const s = 1 + 1.3 * (1 - eo(st)); x.scale(s, s); x.globalAlpha = eo(st) * .9; x.strokeStyle = '#e04a2a'; x.lineWidth = 5; x.strokeRect(-150, -60, 300, 120); txt('1946', 0, -10, 62, '#ff6a44', { f: SERIF, w: 700, gb: 0 }); txt('ARXEOLOGIYALIQ KARTA', 0, 34, 15, '#ff6a44', { w: 700, ls: 3, gb: 0 }); x.restore(); }
  };
};
S.name = (lt, d, T) => {
  if (lt < T[2] - .3) {
    ACTIVE = MAP.sc; MAP.A.visible = false; MAP.B.visible = true;
    const k = eio(p(lt, 0, T[2]));
    look(lv(V(-100, 1150, 900), V(250, 820, 760), k), lv(V(-60, 0, -40), V(150, 0, 30), k), lt, 0, 36);
    const mv = p(lt, T[1], T[1] + 1.6); MAP.lines.mavr.visible = mv > 0; MAP.lines.mavr.userData.set(eo(mv));
    const a1 = p(lt, T[1] + .9, T[1] + 3.6), a2 = p(lt, T[1] + 1.5, T[1] + 4.2);
    MAP.lines.arr1.visible = a1 > 0; MAP.lines.arr1.userData.set(eo(a1)); MAP.lines.arr2.visible = a2 > 0; MAP.lines.arr2.userData.set(eo(a2));
    setGrade({ exp: .75, vign: .9, bloom: .55 });
    return () => {
      mapLabel('Aral', St.mapPos([420, 350], 0), eo(p(lt, .6, 1.6)), { it: true, size: 28, col: '#d7f0f4' });
      mapLabel('Ámiwdárya', St.mapPos([760, 660], 0), eo(p(lt, 1, 2)), { it: true, size: 24, col: '#d7f0f4' });
      mapLabel('Sırdárya', St.mapPos([1180, 430], 0), eo(p(lt, 1.2, 2.2)), { it: true, size: 24, col: '#d7f0f4' });
      mapLabel('XOREZM', St.mapPos([560, 540], 0), eo(p(lt, 1.4, 2.4)), { f: SANS, size: 28, ls: 12, col: '#ffd9a6' });
      mapLabel('MÁWERENNAHR', St.mapPos([1160, 720], 0), eo(p(lt, T[1] + .6, T[1] + 1.6)), { f: SANS, size: 32, ls: 10, col: '#ffb49a' });
      [['Buxara', 960, 770], ['Samarqand', 1260, 810]].forEach(([n, a, b], i) => mapLabel(n, St.mapPos([a, b], 0), eo(p(lt, T[1] + 1 + i * .3, T[1] + 2 + i * .3)), { size: 24 }));
      mapLabel('QARAXANIYLER', St.mapPos([1700, 330], 0), eo(p(lt, T[1] + 1.4, T[1] + 2.4)), { f: SANS, size: 28, ls: 8, col: '#ff8a6a' });
      keyword('992', 'Qaraxaniyler Máwerennahrdı iyeleydi', lt, T[1] + 2.2, T[2] - .3, { size: 72 });
    };
  }
  if (lt < T[3] - .3) {
    ACTIVE = studio; coin.visible = true; dust.visible = true;
    const l = lt - T[2] + .3;
    coin.position.set(0, 0, 0); coin.rotation.set(Math.PI / 2 - .25 + Math.sin(l * .3) * .08, l * .05, .2);
    key.position.set(-4, 5, 6); key.target.position.set(0, 0, 0); rim.position.set(5, 3, -4);
    animateDust(l, 3);
    look(V(lerp(.4, -.3, l / 8), lerp(.5, .2, l / 8), lerp(3.6, 2.6, eio(p(l, 0, 8)))), V(0, 0, 0), l, .01, 34);
    setGrade({ exp: .9, bloom: .25, vign: 1.1, contrast: 1.1 });
    return () => { keyword('Buǵraxan', 'Qaraxaniyler áwladı · 992-jıl', lt, T[2] + .4, T[3] - .3, { size: 70 }); };
  }
  ACTIVE = site; useRecon(true);
  const l = lt - T[3] + .3, k = eio(p(l, 0, d - T[3]));
  setSky({ elev: 7, az: 255, turb: 6, ray: 2, sunI: 2.8, sunCol: '#ffae6a', hemiI: .5, fog: '#c99a78', fogD: .00035, shadow: 260, envI: .5 });
  look(orbit(lerp(240, 190, k), lerp(70, 55, k), lerp(.9, 1.25, k)), V(-20, 18, 0), lt, .4, 36);
  setGrade({ exp: .7, bloom: .5, tint: [1.04, .96, .9] });
  return () => { keyword('Xorezmshahlar mámleketiniń orayı?', 'Boljawlar', lt, T[3] + .6, d - .4, { size: 54 }); };
};
function animateDust(l, r) { const a = dust.geometry.attributes.position; for (let i = 0; i < 500; i++) a.setXYZ(i, (hrnd(i) - .5) * r * 2 + Math.sin(l * .2 + i) * .1, (hrnd(i + 5) - .5) * r + ((l * .03 * (1 + hrnd(i))) % 1) * .5, (hrnd(i + 9) - .5) * r * 2); a.needsUpdate = true; }
S.minaret = (lt, d, T) => {
  if (lt < T[1] - .3) {
    ACTIVE = site; const k = eio(p(lt, 0, T[1] - .3));
    setSky({ elev: 7, az: 245, turb: 6, ray: 2, sunI: 3.2, sunCol: '#ffbe7a', hemiI: .45, fog: '#d7a57a', fogD: .0008, shadow: 40, envI: .5 });
    const a = lerp(-.45, .1, k);
    look(V(Math.cos(a) * 11, lerp(1.6, 30, k), Math.sin(a) * 11), V(0, lerp(9, 27, k), 0), lt, .12, 44);
    setGrade({ exp: .68, bloom: .35, tint: [1.04, .98, .9] });
    return () => keyword('XI ásir', 'Saqlanǵan minara', lt, 1.4, T[1] - .3, { size: 72 });
  }
  ACTIVE = site; const l = lt - T[1] + .3, k = eio(p(l, 0, d - T[1]));
  setSky({ elev: 26, az: 220, turb: 4, sunI: 3.4, fog: '#d9c3a2', fogD: .00025, shadow: 600, envI: .55 });
  outlines.city.visible = true; outlines.city.userData.set(eo(p(l, .4, 3)));
  look(lv(V(-100, 520, 760), V(-20, 1050, 330), k), V(0, 0, 0), lt, .6, 40);
  setGrade({ exp: .6, bloom: .35, contrast: 1.15, sat: 1.1 });
  return () => {
    const n = Math.round(60 * eo(p(l, 1, 3.6)));
    txt(`${n}+`, W - 330, BAR + 300, 150, '#fff2d8', { f: SERIF, w: 700, a: eo(p(l, 1, 1.8)) });
    txt('GEKTAR', W - 330, BAR + 400, 30, '#fff2d8', { ls: 18, a: eo(p(l, 1.4, 2.2)) });
    keyword('Úlken civilizaciya orayı', 'Buǵraxan qalası', lt, T[2], d - .4, { size: 56 });
  };
};
S.beacon = (lt, d, T) => {
  if (lt < T[2] - .3) {
    ACTIVE = site; useRecon(true); stars.visible = true; stars.material.opacity = 1;
    setSky({ elev: -20, night: true, moon: V(-.4, .6, .5).normalize(), sunCol: '#8aa2d8', sunI: .9, hemiSky: '#2a3c70', hemiGr: '#140e0a', hemiI: .5, fog: '#0b1224', fogD: .0006, shadow: 120, envI: .25 });
    const top = V(0, 51, 0); particlesFire(lt, top, 140, 3, 9); fireLight.intensity = 2500 * (.85 + .15 * Math.sin(lt * 13) * Math.sin(lt * 7.3)); fireLight.position.set(0, 56, 0);
    farTowers.visible = true; farFires.visible = true; const fa = farFires.geometry.attributes.position;
    farTowers.children.forEach((m, i) => { const on = p(lt, T[1] + .4 + i * .7, T[1] + .9 + i * .7); fa.setXYZ(i, m.position.x, on > 0 ? m.position.y + 22 : -999, m.position.z); }); fa.needsUpdate = true;
    const k = eio(p(lt, 0, T[2]));
    look(V(lerp(-120, -95, k), lerp(26, 22, k), lerp(120, 95, k)), V(0, lerp(34, 38, k), 0), lt, .3, 38);
    setGrade({ exp: .85, bloom: .5, tint: [.95, .97, 1.08], lift: [0, .01, .03] });
    return () => keyword('Xabar beriw ornı', 'Boljaw', lt, T[1] + .3, T[2] - .3);
  }
  if (lt < T[3] - .4) {
    ACTIVE = site; useRecon(true);
    const l = lt - T[2] + .3, k = eio(p(l, 0, T[3] - T[2]));
    setSky({ elev: .5, az: 265, turb: 9, ray: 3, sunI: .5, sunCol: '#ff8a50', hemiSky: '#6a7ab0', hemiI: .9, fog: '#5a5070', fogD: .0005, shadow: 400, envI: .6 });
    lanterns.visible = true; const a = lanterns.geometry.attributes.position;
    for (let i = 0; i < 160; i++) { const ang = hrnd(i) * 6.28, r0 = 140 + hrnd(i + 3) * 260, r1 = 40 + hrnd(i + 5) * 30, pr = eo(p(l, hrnd(i + 7) * 2, 7 + hrnd(i + 7) * 3)), rr = lerp(r0, r1, pr), X = Math.cos(ang) * rr, Z = Math.sin(ang) * rr; a.setXYZ(i, X, Wd.height(X, Z) + 1.6 + Math.sin(l * 4 + i) * .05, Z); }
    a.needsUpdate = true;
    look(orbit(lerp(240, 190, k), lerp(70, 55, k), lerp(2.2, 2.6, k)), V(0, 8, 0), lt, .4, 38);
    setGrade({ exp: 1.1, bloom: .7, tint: [.98, .96, 1.04] });
    return () => keyword('Jámáátlik orın', 'Minara átirapı', lt, .6 + T[2], T[3] - .4);
  }
  ACTIVE = studio; holo.visible = true; studio.background = holoBg; key.intensity = 0; rim.intensity = 0; shemi.intensity = 0;
  const l = lt - T[3] + .4;
  holo.position.set(0, -14, 0); holo.rotation.y = l * .12;
  look(V(lerp(30, 34, p(l, 0, 14)), lerp(4, 6, p(l, 0, 14)), lerp(52, 46, p(l, 0, 14))), V(0, 0, 0), l, .02, 36);
  setGrade({ exp: .9, bloom: .9, vign: .9, grain: .03 });
  return () => {
    const pt = (y, r) => { const a = holo.rotation.y; return V(Math.cos(.6) * r, y - 14, Math.sin(.6) * r); };
    [['biyik', T[4], pt(16, 3.4), [140, -40]], ['domalaq', T[4] + 1, pt(4, 4.2), [150, 30]], ['joqarısı jińishke', T[4] + 2, pt(27, 2.8), [150, -50]]].forEach(([s, t0, v, [dx, dy]]) => {
      const k = eo(p(lt, t0, t0 + .8)); if (k <= 0) return; const [X, Y] = proj(v);
      x.save(); x.strokeStyle = `rgba(255,214,140,${k})`; x.lineWidth = 2; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + dx * k, Y + dy * k); x.lineTo(X + (dx + 170) * k, Y + dy * k); x.stroke(); x.fillStyle = `rgba(255,214,140,${k})`; x.beginPath(); x.arc(X, Y, 5, 0, 7); x.fill(); x.restore();
      txt(s, X + dx + 6, Y + dy - 24, 36, '#ffd68c', { f: SERIF, w: 700, it: true, al: 'left', a: k, glow: 'rgba(255,160,60,.4)' });
    });
    const hk = eo(p(lt, T[5], T[5] + 1));
    if (hk > 0) { const [X1, Y1] = proj(V(-8, -14, 3)), [X2, Y2] = proj(V(-8, 14, 3)); x.save(); x.strokeStyle = `rgba(255,120,90,${hk})`; x.lineWidth = 2.5; x.setLineDash([10, 8]); x.beginPath(); x.moveTo(X1, Y1); x.lineTo(X2, lerp(Y1, Y2 - 60, hk)); x.stroke(); x.restore(); txt('? m', X1 - 120, (Y1 + Y2) / 2, 110, '#ff8a6a', { f: SERIF, w: 700, a: hk, glow: 'rgba(255,90,60,.6)', gb: 30 }); }
    keyword('Biyikligi belgisiz', 'Tek ǵana boljawlar', lt, T[5] + 1, d - .4, { size: 50 });
  };
};
S.city = (lt, d, T) => {
  if (lt < T[2] - .3) {
    ACTIVE = site; useRecon(true); const k = eio(p(lt, 0, T[2]));
    setSky({ elev: 4, az: 250, turb: 7, ray: 2.4, sunI: 2.8, sunCol: '#ffa766', hemiI: .45, fog: '#c48c66', fogD: .0006, shadow: 120, focus: V(-30, 0, 0), envI: .45 });
    look(V(lerp(-150, -110, k), lerp(28, 40, k), lerp(110, 60, k)), V(-25, 14, 0), lt, .3, 38);
    setGrade({ exp: .68, bloom: .45, tint: [1.04, .96, .9] });
    return () => keyword('Namaz oqıytuǵın orın', 'Musılman xalıqlar tariyxında', lt, T[1] + .2, T[2] - .3, { size: 54 });
  }
  if (lt < T[3] - .3) {
    ACTIVE = MAP.sc; const l = lt - T[2] + .3, k = eio(p(l, 0, T[3] - T[2]));
    MAP.lines.state.visible = true; MAP.lines.state.userData.set(eo(p(l, .2, 2.2))); MAP.lines.north.visible = l > 1.4; MAP.lines.north.userData.set(eo(p(l, 1.4, 3.2)));
    MAP.pin.visible = true; MAP.pin.scale.setScalar(1);
    const tgt = St.mapPos(St.GEO.BUG, 0);
    look(lv(V(150, 1000, 1150), V(tgt.x + 80, 620, tgt.z + 700), k), lv(V(150, 0, 200), tgt, k), lt, 0, 36);
    setGrade({ exp: .75, vign: .9, bloom: .55 });
    return () => {
      mapLabel('XOREZMSHAHLAR MÁMLEKETI', St.mapPos([1150, 900], 0), eo(p(l, .6, 1.6)), { f: SANS, size: 30, ls: 8, col: '#ffd9a6' });
      mapLabel('arqa shegara', St.mapPos([620, 520], 30), eo(p(l, 2.2, 3.2)), { size: 38, it: true, col: '#ff9a7a' });
      ping(tgt, 1, lt); mapLabel('Buǵraxan', St.mapPos(St.GEO.BUG, 70), 1, { size: 42, dy: -50 });
    };
  }
  if (lt < T[5] - .3) {
    ACTIVE = site; useRecon(true); const l = lt - T[3] + .3, k = eio(p(l, 0, T[5] - T[3]));
    setSky({ elev: 16, az: 230, turb: 6, sunI: 3, fog: '#d3b08c', fogD: .00045, shadow: 600, envI: .5 });
    [['city', 0], ['shah', 1], ['cit', 2]].forEach(([n, i]) => { const v = p(l, .3 + i * 1.1, 1.8 + i * 1.1); outlines[n].visible = v > 0; outlines[n].userData.set(eo(v)); });
    look(lv(V(0, 820, 760), V(80, 520, 420), k), V(0, 0, -20), lt, .5, 40);
    setGrade({ exp: .62, bloom: .5 });
    return () => {
      [['III', 'Rabad', V(420, 8, -150), .3], ['II', 'Shahristan', V(230, 8, -60), 1.4], ['I', 'Orayliq bólim', V(-20, 12, -150), 2.5]].forEach(([n, s, v, t0]) => { const kk = eo(p(l, t0 + .6, t0 + 1.4)); mapLabel(n, v, kk, { size: 52 }); mapLabel(s.toUpperCase(), v, kk, { f: SANS, size: 18, ls: 5, dy: 42 }); });
      keyword('Úsh bólim', 'Izertlewler kórsetti', lt, T[3] + .4, T[4] - .2);
      const mk = eo(p(lt, T[4], T[4] + 1)); if (mk > 0) { const [X, Y] = proj(V(-30, 14, 2)); x.save(); x.strokeStyle = `rgba(255,214,140,${mk})`; x.lineWidth = 3; x.beginPath(); x.arc(X, Y, 40 + 10 * Math.sin(lt * 3), 0, 7); x.stroke(); x.restore(); }
      keyword('Qala meshiti', 'Orayliq bólimde', lt, T[4] + .2, T[5] - .3);
    };
  }
  ACTIVE = site; const l = lt - T[5] + .3, k = eio(p(l, 0, d - T[5]));
  setSky({ elev: 6, az: 120, turb: 6, ray: 2, sunI: 3.2, sunCol: '#ffbe80', hemiI: .45, fog: '#d6a87e', fogD: .0008, shadow: 50, envI: .5 });
  look(V(lerp(-26, -20, k), 1.2, lerp(-14, -10, k)), V(0, 20, 0), lt, .12, 40);
  setGrade({ exp: .66, bloom: .35, tint: [1.04, .98, .9] });
  return () => keyword('Xorezmshahlar dáwiri usılı', 'Minara qurılısı', lt, T[5] + .5, d - .3, { size: 54 });
};
S.flood = (lt, d) => {
  ACTIVE = site; water.visible = true; rain.visible = true;
  const rise = sm(p(lt, .3, d * .5)), rec = sm(p(lt, d * .62, d - .5)), storm = rise * (1 - rec);
  water.position.y = lerp(-6, 5.2, rise * (1 - rec)); waterNrm.offset.set(lt * .01, lt * .006);
  setSky({ elev: lerp(30, 22, storm), az: 200, turb: lerp(6, 20, storm), ray: lerp(1.5, .6, storm), mie: lerp(.005, .03, storm), sunI: lerp(2.8, .7, storm), sunCol: '#e8e2d8', hemiSky: '#9aa6b4', hemiI: lerp(.5, .9, storm), fog: storm > .3 ? '#7e858c' : '#cdb79a', fogD: lerp(.0008, .0014, storm), shadow: 90, envI: .6 });
  const a = rain.geometry.attributes.position, cp = cam.position;
  for (let i = 0; i < 2400; i++) { const X = cp.x + (hrnd(i) - .5) * 160, Z = cp.z + (hrnd(i + 4) - .5) * 160, Y = 60 - ((lt * 28 * (1 + hrnd(i + 2) * .4) + hrnd(i + 8) * 60) % 60) + (storm < .1 ? -999 : 0); a.setXYZ(i * 2, X, Y, Z); a.setXYZ(i * 2 + 1, X - .2, Y - 1.4, Z); }
  a.needsUpdate = true; rain.material.opacity = .35 * storm;
  const k = p(lt, 0, d); look(orbit(lerp(80, 64, k), lerp(5, 9, k), lerp(.5, 1.1, k)), V(0, 13, 0), lt, .4, 40);
  setGrade({ exp: lerp(.62, .7, storm), sat: lerp(1, .55, storm), contrast: 1.08, tint: storm > .2 ? [.95, .98, 1.02] : [1.02, .98, .94], bloom: .3 });
  return () => {
    const cs = ['XII', 'XIII', 'XIV', 'XVI', 'XVIII', 'XX'], ci = Math.floor(cl(p(lt, 1, d - 2)) * cs.length * .999);
    txt(cs[ci] + ' ásir', W - 150, BAR + 70, 40, '#f5efe6', { f: SERIF, w: 700, al: 'right', a: .85 * eo(p(lt, 1, 2)) * (1 - p(lt, d - 1.2, d - .4)) });
    keyword('Saqlanıp qalǵan', 'Neshe márte suw alsa da', lt, d * .68, d - .3, { size: 64 });
  };
};
S.modern = (lt, d, T) => {
  if (lt < T[1] - .3) {
    ACTIVE = site; const k = eio(p(lt, 0, T[1]));
    setSky({ elev: 18, az: 130, turb: 5, sunI: 3, fog: '#d5c0a0', fogD: .0006, shadow: 300, envI: .5 });
    look(orbit(lerp(260, 220, k), lerp(90, 70, k), lerp(-.9, -.6, k)), V(0, 6, 0), lt, .4, 38);
    setGrade({ exp: .6, bloom: .3, sat: .85 });
    return () => {
      const pts = [['1946', 'karta'], ['1950–60', 'ekspediciya'], ['…', 'izertlewler'], ['2025', 'jańa basqısh']], kk = eo(p(lt, .3, 3)), Y = BAR + PH - 150;
      const g = x.createLinearGradient(0, Y - 140, 0, BAR + PH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = g; x.fillRect(0, Y - 140, W, BAR + PH - Y + 140);
      x.strokeStyle = 'rgba(230,190,130,.7)'; x.lineWidth = 2; x.beginPath(); x.moveTo(360, Y); x.lineTo(360 + 1200 * kk, Y); x.stroke();
      pts.forEach(([y, s], i) => { const X = 360 + i * 400, q = eo(p(lt, .6 + i * .6, 1.4 + i * .6)); x.fillStyle = `rgba(255,225,176,${q})`; x.beginPath(); x.arc(X, Y, 8, 0, 7); x.fill(); txt(y, X, Y - 50, 50, '#ffe9c8', { f: SERIF, w: 700, a: q }); txt(s.toUpperCase(), X, Y + 40, 18, '#e8cfa6', { a: q, ls: 4 }); });
      txt('BIR NESHE BASQISH', W / 2, BAR + 70, 24, '#fff0d8', { ls: 10, a: eo(p(lt, .4, 1.4)) * (1 - p(lt, T[1] - 1, T[1] - .3)) });
    };
  }
  if (lt < T[3] - .3) {
    ACTIVE = studio; DEC.g.visible = true; dust.visible = true; const l = lt - T[1] + .3, k = eio(p(l, 0, T[3] - T[1]));
    DEC.g.position.set(0, -1, 0); key.position.set(-6, 9, -3); key.target.position.set(0, -1, 0); key.intensity = 520; rim.position.set(4, 3, 6); rim.intensity = .5; shemi.intensity = .35;
    const sd = p(l, 2.0, 2.4), su = p(l, 2.6, 3.3); DEC.g.children.forEach(() => {});
    const stamp = DEC.g.children.find(o => o.isGroup); stamp.position.set(1.2, lerp(lerp(2.6, .18, eio(sd)), 2.8, eio(su)), 2.0);
    DEC.seal.material.opacity = l > 2.4 ? .85 : 0;
    animateDust(l, 4);
    look(lv(V(-1.2, 7.5, 5.2), V(-.2, 4.6, 3.6), k), lv(V(0, -1, 0), V(.2, -1, .6), k), l, .02, 32);
    setGrade({ exp: .85, bloom: .2, vign: 1.1, tint: [1.05, .99, .92] });
    return () => keyword('Qarar № 248 · 2025', 'Ózbekstan Respublikası Prezidenti', lt, T[1] + .6, T[2] + .4, { size: 54 }) || keyword('Jańa turistlik jónelisler', 'Arxeologiyalıq orınlardı úyreniw', lt, T[2] + .6, T[3] - .3, { size: 50 });
  }
  if (lt < T[5] - .3) {
    ACTIVE = studio; EXC.g.visible = true; studio.background = new THREE.Color('#1a140e');
    const l = lt - T[3] + .3, k = eio(p(l, 0, T[5] - T[3]));
    EXC.g.position.set(0, 0, 0); key.position.set(-20, 40, 14); key.target.position.set(0, 0, 0); key.intensity = 9000; key.angle = .6; rim.position.set(10, 20, -10); rim.intensity = .6; shemi.intensity = .9;
    look(V(lerp(6, 3, k), lerp(26, 13, k), lerp(14, 8, k)), V(lerp(1, 0, k), -.6, lerp(2, 1, k)), l, .05, 38);
    setGrade({ exp: .75, bloom: .2, tint: [1.03, .99, .94] });
    return () => { keyword('Berdaq atındaǵı QMU', 'Arxeologiya kafedrası', lt, T[3] + .3, T[4] - .2); keyword('Qayta tiklew', 'hám abadanlastırıw', lt, T[4] + .2, T[5] - .3); };
  }
  ACTIVE = site; L.g.visible = true; crowd.visible = true;
  const l = lt - T[5] + .3, dd = d - T[5] + .3, sum = sm(p(l, dd * .45, dd * .7));
  setSky({ elev: lerp(14, 30, sum), az: 210, turb: lerp(9, 4, sum), ray: lerp(1, 1.6, sum), sunI: lerp(1.8, 3.2, sum), sunCol: sum < .5 ? '#f0e8e0' : '#ffd6a8', hemiI: lerp(.8, .5, sum), fog: sum < .5 ? '#c9ccd2' : '#d8c4a4', fogD: lerp(.0014, .0007, sum), shadow: 70, focus: V(0, 0, 30), envI: .55 });
  groundMat.color.set(new THREE.Color('#ffffff').lerp(new THREE.Color('#ffffff'), 0)); if (sum < 1) groundMat.color.setRGB(lerp(1.9, 1, sum), lerp(1.95, 1, sum), lerp(2.05, 1, sum));
  L.bulb.emissiveIntensity = 2 * (1 - sum);
  if (sum < 1) { snow.visible = true; snow.material.opacity = 1 - sum; const a = snow.geometry.attributes.position; for (let i = 0; i < 3000; i++) { const X = (hrnd(i) - .5) * 120, Z = 10 + (hrnd(i + 3) - .5) * 120, Y = 40 - ((l * 2.5 * (1 + hrnd(i + 2)) + hrnd(i + 8) * 40) % 40); a.setXYZ(i, X + Math.sin(l + i) * .6, Y, Z); } a.needsUpdate = true; }
  crowd.children.forEach((pp, i) => { const u = pp.userData, z = 70 - ((l * 1.2 + u.ph * 6) % 60), xx = (i % 2 ? -1 : 1) * (.6 + (i % 3) * .4); pp.position.set(xx, Wd.height(xx, z), z); pp.rotation.y = Math.PI; });
  look(V(lerp(9, 6, p(l, 0, dd)), 3.4, lerp(78, 70, p(l, 0, dd))), V(0, 12, 0), lt, .2, 40);
  setGrade({ exp: .62, bloom: .35, sat: lerp(.8, 1, sum), tint: sum < .5 ? [.97, .99, 1.03] : [1.03, .99, .93] });
  return () => {
    keyword(sum < .5 ? 'Qısı' : 'Jazı', null, lt, T[5] + .4 + (sum < .5 ? 0 : dd * .55), sum < .5 ? T[5] + dd * .5 : d - .3, { size: 70 });
    txt('ZIYARAT ETIW MÚMKINSHILIGI JARATILDI', W / 2, BAR + 64, 22, '#fff5e6', { ls: 8, a: eo(p(lt, T[6], T[6] + 1)) * (1 - p(lt, d - 1, d - .3)) });
  };
};
S.wisdom = (lt, d, T) => {
  ACTIVE = studio; AST.g.visible = true; dust.visible = true;
  AST.g.position.set(0, 0, 0); AST.g.rotation.set(-.15, Math.sin(lt * .1) * .25, 0); AST.rete.rotation.z = lt * .05; AST.alid.rotation.z = -lt * .09;
  key.position.set(-6, 7, 8); key.target.position.set(0, 0, 0); key.intensity = 700; key.angle = .5; rim.position.set(6, 2, -6); rim.intensity = 2.5; shemi.intensity = .1;
  animateDust(lt, 6);
  const k = eio(p(lt, 0, d));
  look(V(lerp(3.5, -1.5, k), lerp(1.5, .4, k), lerp(11, 8, k)), V(0, .3, 0), lt, .02, 34);
  setGrade({ exp: .9, bloom: .45, vign: 1.2, contrast: 1.1, tint: [1.04, .98, .9] });
  return () => {
    ['bilim', 'tájiriybe', 'kónlikpe'].forEach((s, i) => { const kk = eo(p(lt, T[1] + 1 + i * .9, T[1] + 2 + i * .9)) * (1 - p(lt, T[2] + .6, T[2] + 1.4)); txt(s, W / 2 + (i - 1) * 420, BAR + PH - 120, 50, '#ffe7b8', { f: SERIF, w: 700, it: true, a: kk, glow: 'rgba(255,170,60,.5)', gb: 24 }); });
    keyword('Ilim-bilim orayı', 'Orta ásirlerde', lt, T[2] + 1.2, d - .4, { size: 66 });
  };
};
S.finale = (lt, d, T) => {
  if (lt < T[1] + 1) {
    ACTIVE = studio; STR.g.visible = true; dust.visible = true; studio.background = new THREE.Color('#0d0a07');
    const k = eio(p(lt, 0, T[1] + 1));
    key.position.set(-10, 8, 18); key.target.position.set(0, -7, 0); key.intensity = 2600; key.angle = .7; rim.position.set(8, 6, 10); rim.intensity = .8; shemi.intensity = .4;
    animateDust(lt, 12);
    look(V(lerp(-5, 3, k), lerp(1, -10, k), lerp(34, 30, k)), V(lerp(-1, 1, k), lerp(-3, -9, k), 4), lt, .05, 40);
    setGrade({ exp: .75, bloom: .3, vign: 1.1, tint: [1.04, .98, .92] });
    return () => {
      ['XIV', 'XIII', 'XII', 'XI'].forEach((s, i) => { const v = V(-8.5, -i * 3 - 1.5, 5.2); mapLabel(s + ' ásir', v, eo(p(lt, .5 + i * .8, 1.3 + i * .8)), { size: 34 }); });
      keyword('Biybaha derekler', 'Qatlamlarda', lt, T[1], T[1] + 1, { size: 60 });
    };
  }
  ACTIVE = site; const l = lt - T[1] - 1, k = eio(p(l, 0, d - T[1] - 1));
  setSky({ elev: 4, az: 250, turb: 6, ray: 2.2, sunI: 2.8, sunCol: '#ffa060', hemiI: .4, fog: '#c58a62', fogD: .0003, shadow: 160, envI: .45 });
  look(lv(V(30, 4, 26), V(190, 95, 220), k), V(0, lerp(16, 12, k), 0), lt, .3, 38);
  setGrade({ exp: .7, bloom: .55, tint: [1.05, .96, .88] });
  return () => {
    rtxt('Qońırat rayonı', W / 2, BAR + 250, 30, '#ffe2c0', lt, T[1] + 2.2, { ls: 10, f: SANS });
    rtxt('XI–XIV ásirler', W / 2, BAR + 320, 64, '#fff3dc', lt, T[1] + 2.8, { f: SERIF, w: 700 });
  };
};
S.end = (lt) => {
  ACTIVE = null;
  return () => {
    rtxt('QARAQALPAQSTAN TARIYXI', W / 2, 420, 30, '#d9b98a', lt, .4, { w: 500, ls: 16, spread: 24 });
    rtxt('Buǵraxan esteligi', W / 2, 515, 110, '#fff0d6', lt, 1, { f: SERIF, w: 700, glow: 'rgba(255,170,80,.45)', gb: 40, dur: 2 });
    rtxt('Qońırat rayonı · XI–XIV ásirler', W / 2, 615, 30, '#d9b98a', lt, 2.2, { f: SERIF, it: true, ls: 3 });
  };
};
S.int = (lt, d, T, sc) => {
  ACTIVE = site; const n = sc.n;
  setSky({ elev: 5 + n, az: 240 + n * 20, turb: 7, sunI: 2.6, sunCol: '#ffb070', hemiI: .4, fog: '#c99a74', fogD: .0009, shadow: 60, envI: .45 });
  const a = n * 1.3 + .4; look(V(Math.cos(a) * 30, 2.2, Math.sin(a) * 30), V(0, 10, 0), lt, .15, 50);
  setGrade({ exp: .55, bloom: .6, tint: [1.04, .97, .9] });
  return () => {
    const k = eo(p(lt, .4, 1.3)) * (1 - p(lt, d - 1, d - .4));
    x.save(); x.globalAlpha = k; const g = x.createLinearGradient(150, 0, 900, 0); g.addColorStop(0, 'rgba(10,6,3,.7)'); g.addColorStop(1, 'rgba(10,6,3,0)'); x.fillStyle = g; x.fillRect(150, 760, 760, 118); x.fillStyle = '#e6b877'; x.fillRect(150, 760, 4, 118); x.restore();
    txt(sc.who, 185, 800, 44, '#fff2dc', { f: SERIF, w: 700, al: 'left', a: k }); txt(sc.role.toUpperCase(), 186, 848, 19, '#e2c39a', { al: 'left', a: k, ls: 4 });
  };
};

/* ================= TIMELINE ================= */
const CH = { exped: 'I · Ashılıw', name: 'II · Atamanıń sırı', minaret: 'III · Minara', beacon: 'IV · Minaranıń xızmeti', city: 'V · Qala hám meshit', flood: 'VI · Suw hám waqıt', modern: 'VII · Jańa bet', wisdom: 'VIII · Ilim orayı', finale: 'IX · Miyras' };
const ROLE = { 'Археолог-илимпаз': 'Arxeolog-ilimpaz', 'Студент · археология қәнигелиги': 'Student · arxeologiya qánigeligi' };
const CPS = 13, segDur = s => Math.max(3.4, s.length / CPS + .8);
const TL = []; let TOTAL = 0; const SUBS = [];
{ let t = 0, nInt = 0;
  for (const sc of window.SCRIPT) {
    const e = { ...sc, t0: t, T: [] };
    if (sc.id === 'intro') e.d = 14.5; else if (sc.id === 'end') e.d = 7;
    else if (sc.id === 'int') { e.d = 7; e.n = nInt++; e.who = 'Intervyu'; e.role = ROLE[sc.role] || sc.role; }
    else { let u = 1.6; for (const s of sc.segs) { e.T.push(u); SUBS.push({ s, a: t + u, b: t + u + segDur(s) - .35 }); u += segDur(s); } e.d = u + (sc.id === 'finale' ? 6.5 : 1.6); }
    t += e.d; TL.push(e);
  } TOTAL = t; }
window.TOTAL = TOTAL;
window.TIMELINE = { fps: 25, total: TOTAL, scenes: TL.map(e => ({ id: e.id, t0: +e.t0.toFixed(3), d: +e.d.toFixed(3), segs: e.T.map(v => +(e.t0 + v).toFixed(3)) })), subs: SUBS.map(s => ({ a: +s.a.toFixed(3), b: +s.b.toFixed(3), s: s.s })) };

/* ================= FRAME ================= */
function draw(t) {
  const sc = TL.find(e => t >= e.t0 && t < e.t0 + e.d) || TL[TL.length - 1], lt = t - sc.t0;
  hideAll(); ACTIVE = site;
  const overlay = S[sc.id](lt, sc.d, sc.T, sc);
  grade.uniforms.time.value = t;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  if (ACTIVE) {
    rpass.scene = ACTIVE; composer.render();
    if (sc.id === 'int') { x.filter = 'blur(16px) brightness(.7)'; x.drawImage(R.domElement, -40, BAR - 30, W + 80, PH + 60); x.filter = 'none'; }
    else { const j = sc.id === 'exped' && lt < sc.T[2] - .3 ? [(hrnd(t * 25) - .5) * 4, (hrnd(t * 25 + 3) - .5) * 4] : [0, 0]; x.drawImage(R.domElement, j[0], BAR + j[1]); }
  }
  overlay && overlay();
  if (CH[sc.id]) { const k = eo(p(lt, .9, 2)) * (1 - p(lt, 6, 7.2)); if (k > 0) { x.save(); x.globalAlpha = k; x.fillStyle = '#e6b877'; x.fillRect(110, BAR + 46, 46 * k, 2); x.restore(); txt(CH[sc.id].toUpperCase(), 172, BAR + 47, 21, '#f6e2c0', { a: k, al: 'left', ls: 6 }); } }
  const f = Math.min(eo(p(lt, 0, sc.id === 'intro' ? 2.2 : .6)), eo(p(sc.d - lt, 0, sc.id === 'end' ? 2 : .6)));
  if (f < 1) { x.fillStyle = `rgba(0,0,0,${1 - f})`; x.fillRect(0, 0, W, H); }
  x.fillStyle = '#000'; x.fillRect(0, 0, W, BAR); x.fillRect(0, H - BAR, W, BAR);
}
window.draw = draw;
window.ready = document.fonts.load('700 40px CG').then(() => document.fonts.load('600 40px CG')).then(() => document.fonts.ready).then(() => { draw(0); return true; });
if (!/render/.test(location.search)) { const t0 = performance.now(); const loop = () => { draw(((performance.now() - t0) / 1000) % TOTAL); requestAnimationFrame(loop); }; window.ready.then(loop); }
