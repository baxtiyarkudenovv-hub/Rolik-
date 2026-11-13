// Minaranıń nolden tikleniwi — 3D qurılıs sahnası (altın sızılma → gerbish qatarları → tolıq minara).
// Kadrlar footage/build/ ga 1920×804 jpg bolıp shıǵarıladı hám film2.js ishinde qollanıladı.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as Wd from './world.js';

const W = 1920, PH = 804, DUR = 12;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), p = (t, a, b) => cl((t - a) / (b - a));
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, eo = t => 1 - Math.pow(1 - t, 3), lerp = (a, b, t) => a + (b - a) * t;
function hr(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
R.setSize(W, PH); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .5; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.localClippingEnabled = true;
document.body.appendChild(R.domElement);
const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, W / PH, .2, 15000);
const sky = new Sky(); sky.scale.setScalar(12000); sc.add(sky);
const el = THREE.MathUtils.degToRad(13), az = THREE.MathUtils.degToRad(150), dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
Object.assign(sky.material.uniforms, {}); const u = sky.material.uniforms; u.turbidity.value = 3; u.rayleigh.value = 1.1; u.mieCoefficient.value = .003; u.mieDirectionalG.value = .8; u.sunPosition.value.copy(dir);
const pm = new THREE.PMREMGenerator(R); { const s = new THREE.Scene(), k = new Sky(); k.scale.setScalar(1000); Object.keys(u).forEach(n => k.material.uniforms[n].value = u[n].value); s.add(k); sc.environment = pm.fromScene(s).texture; sc.environmentIntensity = .5; }
const sun = new THREE.DirectionalLight('#ffc48a', 3.2); sun.position.copy(dir).multiplyScalar(500); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 100, far: 1200 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .4; sc.add(sun);
sc.add(new THREE.HemisphereLight('#bcd0ff', '#5a4028', .45));
sky.visible = false; { const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#5f7fa8'); gr.addColorStop(.5, '#b9b3a6'); gr.addColorStop(.62, '#e9c296'); gr.addColorStop(1, '#d9a774'); g.fillStyle = gr; g.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; sc.background = t; }
sc.fog = new THREE.FogExp2('#c79e78', .0005);
const groundMat = Wd.groundMaterial(), brickMat = Wd.brickMaterial();
sc.add(Wd.terrain(groundMat));

// the minaret being built
const Hm = 46, rb = 5.2, rt = 2.9;
const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const bm = brickMat.clone(); bm.clippingPlanes = [clip]; bm.clipShadows = true;
const mn = Wd.minaretMesh(bm, { ruin: false, h: Hm, rb, rt }); sc.add(mn);
const rAt = y => y > Hm ? rt * .7 : lerp(rb, rt, cl((y - 1) / (Hm - 1)) ** .92);
// golden blueprint wireframe
const wpts = []; for (let i = 0; i <= 16; i++) wpts.push(new THREE.Vector2(rAt(i / 16 * Hm) + .05, i / 16 * Hm)); wpts.push(new THREE.Vector2(rt * .55, Hm + 3.2), new THREE.Vector2(.01, Hm + 4.6));
const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.LatheGeometry(wpts, 24)), new THREE.LineBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: .8, toneMapped: false })); sc.add(wire);
const wclip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0); wire.material.clippingPlanes = [wclip];
// plan circle on the ground
const planG = new THREE.RingGeometry(rb + .5, rb + .75, 128, 1, 0, Math.PI * 2); planG.rotateX(-Math.PI / 2);
const plan = new THREE.Mesh(planG, new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false, transparent: true })); plan.position.y = .15; sc.add(plan);
const cross = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-rb - 2, .16, 0), new THREE.Vector3(rb + 2, .16, 0), new THREE.Vector3(0, .16, -rb - 2), new THREE.Vector3(0, .16, rb + 2)]), new THREE.LineBasicMaterial({ color: '#ffcf7a', toneMapped: false, transparent: true })); sc.add(cross);
// glowing build ring + light
const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .07, 8, 96), new THREE.MeshBasicMaterial({ color: '#ffd08a', toneMapped: false, transparent: true })); ring.rotation.x = Math.PI / 2; sc.add(ring);
const glowL = new THREE.PointLight('#ffb35c', 0, 30, 2); sc.add(glowL);
// flying bricks
const NB = 160, bg = new THREE.BoxGeometry(.9, .26, .45), bmat = new THREE.MeshStandardMaterial({ color: '#c99a62', roughness: .85 });
const bricks = new THREE.InstancedMesh(bg, bmat, NB); bricks.castShadow = true; sc.add(bricks);
// dust sparks
const NS = 400, sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3));
const st = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,220,150,1)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const sparks = new THREE.Points(sg, new THREE.PointsMaterial({ size: .35, map: st, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); sc.add(sparks);

const comp = new EffectComposer(R); comp.addPass(new RenderPass(sc, cam)); const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, PH / 2), .55, .5, .82); comp.addPass(bloom); comp.addPass(new OutputPass());
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);

function draw(t) {
  // phases: 0–2.2 blueprint, 2–9.5 bricks rise, 9.5–12 reveal
  const bp = eo(p(t, .2, 2.4)), build = eio(p(t, 2, 9.6)), front = build * (Hm + 4.8);
  wclip.constant = bp * (Hm + 5); wire.material.opacity = .85 * (1 - p(t, 7.5, 10.5));
  plan.material.opacity = cl(p(t, 0, .8)) * (1 - p(t, 9, 11)); cross.material.opacity = plan.material.opacity * .7;
  planG.setDrawRange(0, Math.floor(eo(p(t, 0, 1.4)) * planG.index.count / 6) * 6);
  clip.constant = front + .001;
  const on = build > 0 && build < 1; ring.visible = on; const rr = rAt(front) + .25; ring.scale.set(rr, rr, 1); ring.position.y = front; ring.material.opacity = .9;
  glowL.position.set(0, front + .5, 0); glowL.intensity = on ? 900 : 0;
  // bricks fly in toward the front
  for (let i = 0; i < NB; i++) {
    const t0 = 2 + hr(i) * 7.3, k = p(t, t0, t0 + 1.1), a = hr(i + 7) * 6.283;
    if (k <= 0 || k >= 1 || t > 9.8) { M.makeScale(0, 0, 0); bricks.setMatrixAt(i, M); continue; }
    const yT = eio(p(t0 + 1.1, 2, 9.6)) * (Hm + 4.8), r0 = 9 + hr(i + 3) * 8, rT = rAt(yT);
    const e = eo(k), rad = lerp(r0, rT + .2, e), y = lerp(yT + 6 + hr(i + 5) * 6, yT, e) + Math.sin(k * 3.14) * 1.5, ang = a + (1 - e) * 1.2;
    V3.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad); Q.setFromEuler(new THREE.Euler((1 - e) * 3 * hr(i), -ang, (1 - e) * 2 * hr(i + 1))); M.compose(V3, Q, S1); bricks.setMatrixAt(i, M);
  }
  bricks.instanceMatrix.needsUpdate = true;
  const sp = sg.attributes.position;
  for (let i = 0; i < NS; i++) { const life = (t * .8 + hr(i)) % 1, a = hr(i + 9) * 6.283 + t * .3, r = rAt(front) + .3 + life * 3 * hr(i + 2); sp.setXYZ(i, Math.cos(a) * r, on ? front - .2 + life * 2.5 * hr(i + 4) - life * .5 : -999, Math.sin(a) * r); }
  sp.needsUpdate = true; sparks.material.opacity = on ? .9 : 0;
  // camera: low orbit, rising with the build, then crane & pull back for the reveal
  const ca = lerp(-.5, .5, t / DUR), rad = lerp(34, 48, eio(p(t, 2, 9))) + lerp(0, 34, eio(p(t, 9, 12))), cy = lerp(2.5, 16, eio(p(t, 1.5, 9))) + lerp(0, -6, eio(p(t, 9, 12)));
  const ty = cl(front - 3, 5, 30) * (1 - eio(p(t, 9.4, 12))) + 24 * eio(p(t, 9.4, 12));
  cam.position.set(Math.cos(ca) * rad, cy + Math.max(0, Wd.height(Math.cos(ca) * rad, Math.sin(ca) * rad)), Math.sin(ca) * rad); cam.lookAt(0, ty, 0);
  bloom.strength = .5 + .3 * (on ? 1 : 0);
  comp.render();
}
window.DUR = DUR; window.draw = draw; window.ready = Promise.resolve(true);
