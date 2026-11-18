/* CODIS-V71 — عارض الشخصية البشرية ثلاثية الأبعاد (CodisB3D.char)
   • نفس نسخة Three.js المضمّنة لمشاهد الصناديق (لا نسخة ثانية) + GLTFLoader من الإصدار نفسه r170.
   • الأصول: مجسّمات Quaternius «Universal Base Characters» (CC0) — جسمان كاملان بهيكل عظمي (65 عظمة) + تسريحات + لحية.
     تصل كـ ArrayBuffer من الصفحة (مدفونة داخل HTML) عبر opts.asset(name) — لا شبكة.
   • الوجوه: Morph Targets حقيقية تُحسب من معاملات تشريحية (عرض الفك · طول/عرض الذقن · الوجنتان · امتلاء الخدين · طول الوجه · الحاجب · الأنف)
     في إطار الوجه (العينان ← الذقن) وتُطبَّق على الجلد والحاجبين واللحية معاً.
   • الملابس: قميص + بنطال + حذاء على الجسم نفسه (قناع من أوزان العظام/الارتفاع + إزاحة للخارج + تنعيم لابلاس للطيات تحت القماش) — لا نسيج ملتصق بالجلد.
   • الموارد: Render Loop فقط ما دام العارض ظاهراً والصفحة أمامية؛ تحرير كامل عند dispose؛ فقدان السياق/استعادته؛ تقليل الحركة. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry, BackSide, DoubleSide,
  HemisphereLight, DirectionalLight, SRGBColorSpace, ACESFilmicToneMapping, PMREMGenerator, Vector3, Quaternion, Matrix4, Box3,
  Float32BufferAttribute, CanvasTexture, TextureLoader, MathUtils
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const gauss = (x, c, s) => Math.exp(-((x - c) * (x - c)) / (2 * s * s));

/* ---------- الإطار التشريحي لكل جسم (من الأصل نفسه، متر، الوجه نحو +Z) ---------- */
const FRAME = {
  male: { eyeY: 1.699, chinY: 1.578, halfW: .091, front: .115 },
  female: { eyeY: 1.656, chinY: 1.539, halfW: .089, front: .112 },
};

/* مصفوفة عظمة الرأس بوضعية الراحة للجسم الأصلي لكل تسريحة (من الأصل نفسه، tools/char3d) — التسريحة «Origin at 0» مرسومة حول هذا الرأس */
const HEAD_REST = {
  male: [1, 0, 0, 0, 0, .99958, .02897, 0, 0, -.02897, .99958, 0, 0, 1.5998, -.0174, 1],
  female: [1, 0, 0, 0, 0, .99984, .01808, 0, 0, -.01808, .99984, 0, 0, 1.5496, -.0109, 1],
};
/* ---------- تحميل GLB مضمّن: الخامات عبر TextureLoader (صورة blob: مسموحة بالـCSP، و fetch(blob:) ممنوع بـconnect-src) ---------- */
function parseGLB(buf) {
  return new Promise((ok, no) => {
    const L = new GLTFLoader();
    L.register(parser => { parser.textureLoader = new TextureLoader(parser.options.manager); return { name: 'codis_tex' }; });
    L.parse(buf, '', ok, no);
  });
}

/* ---------- تشوّه الوجه: إزاحة بالعالم (متر) لنقطة p، والوزن w = انتماء الرأس ---------- */
function faceDelta(p, F, P, out) {
  const H = F.eyeY - F.chinY, t = (F.eyeY - p.y) / H, ax = Math.abs(p.x) / F.halfW, sx = p.x < 0 ? -1 : 1;
  const front = sstep(-.03, .05, p.z), center = 1 - sstep(.15, .7, ax);
  let dx = 0, dy = 0, dz = 0;
  const low = sstep(.35, .95, t) * (1 - sstep(1.25, 1.5, t));            // الوجه السفلي حتى أسفل الذقن
  if (P.jaw) dx += p.x * P.jaw * gauss(t, .92, .26) * sstep(.25, .75, ax) * (1 - sstep(-.09, -.06, p.z) * 0);
  if (P.chinW) dx += p.x * P.chinW * gauss(t, 1.05, .2) * front;
  if (P.chinLen) { const k = sstep(.62, 1.02, t) * center * front; dy -= P.chinLen * k; dz += P.chinLen * .35 * k; }
  if (P.chinFwd) dz += P.chinFwd * sstep(.7, 1.05, t) * center * front;
  if (P.cheek) dx += sx * P.cheek * gauss(t, .32, .13) * gauss(ax, .82, .22) * front;
  if (P.cheekZ) dz += P.cheekZ * gauss(t, .3, .14) * gauss(ax, .6, .25) * front;
  if (P.full) dx += sx * P.full * gauss(t, .68, .2) * gauss(ax, .8, .25) * front;
  if (P.faceLen) dy -= P.faceLen * H * clamp(t, 0, 1.15) * low * front;
  if (P.brow) dz += P.brow * gauss(t, -.2, .1) * center * front;
  if (P.noseW) dx += p.x * P.noseW * gauss(t, .48, .14) * (1 - sstep(.08, .3, ax)) * sstep(.06, .1, p.z);
  if (P.noseZ) dz += P.noseZ * gauss(t, .42, .16) * (1 - sstep(.05, .25, ax)) * sstep(.07, .11, p.z);
  if (P.lips) dz += P.lips * gauss(t, .72, .07) * (1 - sstep(.15, .45, ax)) * front;
  return out.set(dx, dy, dz);
}

/* ---------- وزن عظمة الرأس لكل رأس ---------- */
function headWeights(geo, headIndex) {
  const J = geo.attributes.skinIndex, W = geo.attributes.skinWeight, n = geo.attributes.position.count, out = new Float32Array(n);
  if (!J || !W) return out.fill(1);
  for (let i = 0; i < n; i++) { let w = 0; for (let k = 0; k < 4; k++) if (J.getComponent(i, k) === headIndex) w += W.getComponent(i, k); out[i] = w; }
  return out;
}

/* مصفوفة إزاحات مورف لهندسة (المواضع بالعالم = toWorld × الموضع المحلي) */
function morphArray(geo, toWorld, F, P, wArr) {
  const pos = geo.attributes.position, n = pos.count, arr = new Float32Array(n * 3), p = new Vector3(), d = new Vector3();
  const inv = new Matrix4().copy(toWorld).invert(), lin = new Matrix4().extractRotation(inv), sc = new Vector3().setFromMatrixScale(inv);
  for (let i = 0; i < n; i++) {
    const w = wArr ? sstep(.35, .95, wArr[i]) : 1; if (w <= 0) continue;
    p.fromBufferAttribute(pos, i).applyMatrix4(toWorld); faceDelta(p, F, P, d); if (!d.x && !d.y && !d.z) continue;
    d.multiplyScalar(w).applyMatrix4(lin).multiply(sc);
    arr[i * 3] = d.x; arr[i * 3 + 1] = d.y; arr[i * 3 + 2] = d.z;
  }
  return new Float32BufferAttribute(arr, 3);
}

/* ---------- الملابس: أقنعة + إزاحة ---------- */
const CLOTH = {
  male: { waistUp: .12, sleeve: .42, topOff: .0075, pantOff: .007, flare: .01, shoeY: .118, shoeOff: .012, tunic: .035, neckDrop: .045, neckR: .062, topIt: 12 },
  female: { waistUp: .09, sleeve: .78, topOff: .0095, pantOff: .007, flare: .01, shoeY: .112, shoeOff: .011, tunic: .1, neckDrop: .035, neckR: .058, topIt: 20, drape: .16 },
};
/* المناطق تُحسب من الموضع بوضعية الراحة (T-pose) بدوال تحليلية ⇒ حواف القماش منحنيات نظيفة؛ نفس القاعدة بـJS (الإزاحة) وبالـGLSL (اللون) */
function clothFrame(body, bones) {
  const C = CLOTH[body], wp = v => { const o = new Vector3(); bones[v].getWorldPosition(o); return o; };
  const pelvis = wp('pelvis'), neck = wp('neck_01'), sh = wp('upperarm_l'), hand = wp('hand_l'), shX = Math.abs(sh.x);
  return { waist: pelvis.y + C.waistUp, shX, sleeveX: shX + (Math.abs(hand.x) - shX) * C.sleeve, neckY: neck.y - .018, neckZ: neck.z + .028, neckR: C.neckR, drop: C.neckDrop, shoeY: C.shoeY, tunic: C.tunic };
}
function regionOf(x, y, z, R) {
  const ax = Math.abs(x);
  if (y < R.shoeY) return 3;
  if (y > R.waist + .05 && ax > R.shX - .02) return ax < R.sleeveX ? 1 : 0;
  const r = Math.hypot(x, (z - R.neckZ) * 1.15), collar = R.neckY - R.drop * clamp((z - R.neckZ) / R.neckR) * (1 - sstep(0, R.neckR, ax)) - .012 * clamp(ax / R.neckR);
  if (y > collar && r < .13) return 0;
  if (y > R.neckY + .02) return 0;
  if (y > R.waist - R.tunic) return 1;
  return 2;
}
function clothAttrs(mesh, body, bones) {
  const geo = mesh.geometry, pos = geo.attributes.position, n = pos.count, C = CLOTH[body], R = clothFrame(body, bones);
  const reg = new Uint8Array(n);
  for (let i = 0; i < n; i++) reg[i] = regionOf(pos.getX(i), pos.getY(i), pos.getZ(i), R);
  /* تنعيم لابلاس (القماش يخفي العضلات وأصابع القدم) + إزاحة للخارج على العمودي */
  const idx = geo.index.array, nb = Array.from({ length: n }, () => []);
  for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2]; nb[a].push(b, c); nb[b].push(a, c); nb[c].push(a, b); }
  const key = i => Math.round(pos.getX(i) * 2e4) + ',' + Math.round(pos.getY(i) * 2e4) + ',' + Math.round(pos.getZ(i) * 2e4), groups = new Map();
  for (let i = 0; i < n; i++) { const k = key(i); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); }
  for (const g of groups.values()) if (g.length > 1) { const all = [].concat(...g.map(i => nb[i])); g.forEach(i => { nb[i] = all; }); }
  const P0 = new Float32Array(n * 3); for (let i = 0; i < n; i++) { P0[i * 3] = pos.getX(i); P0[i * 3 + 1] = pos.getY(i); P0[i * 3 + 2] = pos.getZ(i); }
  const PO = new Float32Array(P0), P1 = new Float32Array(P0), ITER = [0, C.topIt, 6, 30];
  for (let it = 0; it < 30; it++) {
    const src = it % 2 ? P1 : P0, dst = it % 2 ? P0 : P1; dst.set(src);
    for (let i = 0; i < n; i++) {
      if (ITER[reg[i]] <= it || !nb[i].length) continue;
      let x = 0, y = 0, z = 0; for (const j of nb[i]) { x += src[j * 3]; y += src[j * 3 + 1]; z += src[j * 3 + 2]; }
      const m = nb[i].length, k = .5;
      dst[i * 3] = src[i * 3] + (x / m - src[i * 3]) * k; dst[i * 3 + 1] = src[i * 3 + 1] + (y / m - src[i * 3 + 1]) * k; dst[i * 3 + 2] = src[i * 3 + 2] + (z / m - src[i * 3 + 2]) * k;
    }
  }
  /* انسدال القماش (الأنثوي): القماش يسقط من أعلى الصدر نحو الحاشية بدل أن يلتصق بالجسم */
  if (C.drape) {
    let bz = -1, by = 0; for (let i = 0; i < n; i++) if (reg[i] === 1 && Math.abs(P0[i * 3]) < .1 && P0[i * 3 + 1] < R.neckY - .05 && P0[i * 3 + 2] > bz) { bz = P0[i * 3 + 2]; by = P0[i * 3 + 1]; }
    for (let i = 0; i < n; i++) {
      if (reg[i] !== 1) continue; const x = Math.abs(P0[i * 3]), y = P0[i * 3 + 1], z = P0[i * 3 + 2]; if (z <= 0 || y > by || x > .17) continue;
      const tz = bz + .004 - (by - y) * C.drape, w = 1 - sstep(.07, .17, x); if (z < tz) P0[i * 3 + 2] = z + (tz - z) * w;
    }
  }
  /* الإزاحة تنتشر حلقات خارج حدود القماش ⇒ لا درجة مسننة عند الياقة/الأكمام/الحاشية */
  const S = P0, off = new Float32Array(n * 3), N = geo.attributes.normal, mag = new Float32Array(n), dis = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = reg[i], y = PO[i * 3 + 1];
    mag[i] = r === 1 ? C.topOff + (y < R.waist ? .006 * sstep(R.waist, R.waist - R.tunic, y) : 0) : r === 2 ? C.pantOff + C.flare * (1 - sstep(.12, .55, y)) : r === 3 ? C.shoeOff : 0;
    for (let k = 0; k < 3; k++) dis[i * 3 + k] = S[i * 3 + k] - PO[i * 3 + k];
  }
  for (let it = 0; it < 3; it++) {
    const m2 = new Float32Array(mag), d2 = new Float32Array(dis);
    for (let i = 0; i < n; i++) {
      if (reg[i] || !nb[i].length) continue;
      let a = 0, x = 0, y = 0, z = 0; for (const j of nb[i]) { a += mag[j]; x += dis[j * 3]; y += dis[j * 3 + 1]; z += dis[j * 3 + 2]; }
      const m = nb[i].length; m2[i] = a / m * .7; d2[i * 3] = x / m * .7; d2[i * 3 + 1] = y / m * .7; d2[i * 3 + 2] = z / m * .7;
    }
    mag.set(m2); dis.set(d2);
  }
  for (let i = 0; i < n; i++) {
    off[i * 3] = dis[i * 3] + N.getX(i) * mag[i]; off[i * 3 + 1] = dis[i * 3 + 1] + N.getY(i) * mag[i]; off[i * 3 + 2] = dis[i * 3 + 2] + N.getZ(i) * mag[i];
  }
  geo.setAttribute('aCOff', new Float32BufferAttribute(off, 3));
  return R;
}
const OUTFIT = {
  male: { top: '#3c5a73', pant: '#2b2f38', shoe: '#1f2126', sole: '#6a655e' },
  female: { top: '#7a4a5e', pant: '#2c3140', shoe: '#22232b', sole: '#6e6862' },
};
const CLOTH_GLSL = `
uniform vec3 uTop;uniform vec3 uPant;uniform vec3 uShoe;uniform vec3 uSole;uniform float uR0[4];uniform float uR1[4];uniform float uTun;varying vec3 vBind;float codisCl;
vec4 codisRegion(vec3 p){
  float ax = abs(p.x), e = .0025;
  float shoe = 1. - smoothstep(uR0[3] - e, uR0[3] + e, p.y);
  float arm = step(uR0[0] + .05, p.y) * step(uR0[1] - .02, ax);
  float sleeve = arm * (1. - smoothstep(uR0[2] - e, uR0[2] + e, ax));
  float r = length(vec2(p.x, (p.z - uR1[1]) * 1.15));
  float collar = uR1[0] - uR1[3] * clamp((p.z - uR1[1]) / uR1[2], 0., 1.) * (1. - smoothstep(0., uR1[2], ax)) - .012 * clamp(ax / uR1[2], 0., 1.);
  float neck = smoothstep(collar - e, collar + e, p.y) * (1. - smoothstep(.13 - e, .13 + e, r));
  neck = max(neck, smoothstep(uR1[0] + .02 - e, uR1[0] + .02 + e, p.y));
  float torsoTop = (1. - arm) * (1. - neck) * smoothstep(uR0[0] - uTun - e, uR0[0] - uTun + e, p.y);
  float top = max(sleeve, torsoTop) * (1. - shoe);
  float pant = (1. - arm) * (1. - shoe) * (1. - top) * step(p.y, uR0[0] + .006);
  return vec4(top, pant, shoe, 0.);
}`;
const CLOTH_FRAG = `#include <map_fragment>
{ vec4 R = codisRegion(vBind);
  vec3 shoe = mix(uShoe, uSole, 1. - smoothstep(.013, .016, vBind.y));
  float band = smoothstep(uR0[0] - .012, uR0[0] - .008, vBind.y) * (1. - smoothstep(uR0[0] - .002, uR0[0] + .002, vBind.y)) * R.y;
  float hemT = R.x * (1. - smoothstep(uR0[0] - uTun + .004, uR0[0] - uTun + .012, vBind.y)) * (1. - step(uR0[0] + .05, vBind.y));
  vec3 cloth = uTop * R.x * (1. - .18 * hemT) + uPant * R.y * (1. - .25 * band) + shoe * R.z;
  float weave = .955 + .045 * sin(vBind.y * 1400.) * sin(vBind.x * 1300. + vBind.z * 900.);
  codisCl = clamp(R.x + R.y + R.z, 0., 1.);
  diffuseColor.rgb = mix(diffuseColor.rgb, cloth * weave, codisCl); }`;
function clothMaterial(mat, body, R) {
  const O = OUTFIT[body], U = { uTop: { value: new Color(O.top) }, uPant: { value: new Color(O.pant) }, uShoe: { value: new Color(O.shoe) }, uSole: { value: new Color(O.sole) },
    uR0: { value: [R.waist, R.shX, R.sleeveX, R.shoeY] }, uR1: { value: [R.neckY, R.neckZ, R.neckR, R.drop] }, uTun: { value: R.tunic } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aCOff;varying vec3 vBind;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;transformed += aCOff;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + CLOTH_GLSL)
      .replace('#include <map_fragment>', CLOTH_FRAG)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .84, codisCl);')
      .replace('#include <normal_fragment_maps>', 'vec3 codisN0 = normal;\n#include <normal_fragment_maps>\nnormal = normalize(mix(normal, codisN0, codisCl));');
  };
  mat.customProgramCacheKey = () => 'codis-cloth-' + body;
  mat.needsUpdate = true;
  return U;
}

/* ---------- بيئة انعكاس ناعمة (استوديو) ---------- */
function makeEnv(renderer) {
  const sc = new Scene();
  sc.add(new Mesh(new SphereGeometry(20, 24, 12), new MeshBasicMaterial({ side: BackSide, color: new Color(.32, .3, .28) })));
  const box = (c, x, y, z, w, h, i) => { const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(c).multiplyScalar(i), side: DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1, 0); sc.add(m); };
  box(0xfff1dc, -6, 6, 7, 8, 6, 3.2); box(0xd8e6ff, 8, 5, -4, 4, 8, 2.0); box(0xffffff, 0, 12, 0, 10, 4, 1.6); box(0xffe9cc, 3, 1, 9, 10, 2, 1.1);
  const pm = new PMREMGenerator(renderer), rt = pm.fromScene(sc, .04); pm.dispose();
  sc.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt;
}
function shadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.55, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

/* ---------- وضعية الوقوف: الذراعان من T-pose إلى جانبي الجسم (دوران بالعالم ثم تحويل للمحلي) ---------- */
function rotWorld(bone, axis, ang) {
  const pq = new Quaternion(), bq = new Quaternion(); bone.parent.getWorldQuaternion(pq); bone.getWorldQuaternion(bq);
  const q = new Quaternion().setFromAxisAngle(axis, ang).multiply(bq); bone.quaternion.copy(pq.invert().multiply(q)); bone.updateMatrixWorld(true);
}
function pose(bones, body) {
  const Z = new Vector3(0, 0, 1), X = new Vector3(1, 0, 0), Y = new Vector3(0, 1, 0), f = body === 'female';
  for (const s of [1, -1]) {
    const L = s > 0 ? 'l' : 'r', side = s;   // l = +X بالأصل
    if (bones['upperarm_' + L]) { rotWorld(bones['upperarm_' + L], Z, -side * MathUtils.degToRad(f ? 71 : 68)); rotWorld(bones['upperarm_' + L], X, MathUtils.degToRad(5)); }
    if (bones['lowerarm_' + L]) rotWorld(bones['lowerarm_' + L], Y, side * MathUtils.degToRad(-14));
    if (bones['hand_' + L]) rotWorld(bones['hand_' + L], X, MathUtils.degToRad(8));
    for (const fn of ['index', 'middle', 'ring', 'pinky']) for (const k of ['01', '02', '03']) { const b = bones[fn + '_' + k + '_' + L]; if (b) rotWorld(b, new Vector3(0, 0, 1).applyAxisAngle(Y, 0), -side * MathUtils.degToRad(k === '01' ? 6 : 12) * 0); }
    if (bones['thigh_' + L]) rotWorld(bones['thigh_' + L], Z, side * MathUtils.degToRad(f ? -1.5 : -2.5));
  }
}

/* =====================================================================
   CharView
   ===================================================================== */
export class CharView {
  constructor(host, o) {
    this.host = host; this.o = o || {}; this.asset = this.o.asset; this.reduced = !!this.o.reduced;
    this.q = this.o.quality === 'low' ? { dpr: Math.min(window.devicePixelRatio || 1, 1.5), aa: true } : { dpr: Math.min(window.devicePixelRatio || 1, 2), aa: true };
    const cv = this.canvas = document.createElement('canvas'); cv.className = 'ch3-cv'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
    const r = this.renderer = new WebGLRenderer({ canvas: cv, antialias: this.q.aa, alpha: true, powerPreference: 'default', stencil: false });
    r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.setClearColor(0x000000, 0);
    this.scene = new Scene(); this.camera = new PerspectiveCamera(26, 1, .05, 30);
    this.env = makeEnv(r); this.scene.environment = this.env.texture; this.scene.environmentIntensity = .55;
    this.scene.add(new HemisphereLight(0xfff4e6, 0x3a3128, .55));
    const key = this.key = new DirectionalLight(0xfff0dc, 2.3); key.position.set(-1.6, 3.2, 2.6); this.scene.add(key);
    const rim = new DirectionalLight(0xcfe0ff, 1.5); rim.position.set(1.8, 2.4, -2.4); this.scene.add(rim);
    const fill = new DirectionalLight(0xffe6cc, .55); fill.position.set(2.2, 1.2, 2.4); this.scene.add(fill);
    this.shadowT = shadowTex();
    this.shadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: this.shadowT, transparent: true, depthWrite: false, toneMapped: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.scale.set(.95, .62, 1); this.shadow.position.y = .002; this.scene.add(this.shadow);
    this.turn = new Group(); this.scene.add(this.turn);
    this.bodies = {}; this.hairDoc = null; this.hairMats = []; this.cfg = null; this.cur = null; this.gen = 0;
    this.yaw = this.o.yaw == null ? -.28 : this.o.yaw; this.vyaw = 0; this.zoom = 0; this.zoomT = 0; this.t0 = performance.now(); this.lastT = 0;
    this.dirty = true; this.running = false; this.visible = true; this.lost = false; this.disposed = false; this.frameSkip = 0;
    this.bind(); this.resize();
  }
  /* --- الحالة --- */
  state(s, x) { try { this.o.onState && this.o.onState(s, x); } catch (e) {} }
  bind() {
    const cv = this.canvas, L = this.L = [];
    const on = (el, ev, fn, op) => { el.addEventListener(ev, fn, op); L.push([el, ev, fn, op]); };
    const ptr = new Map(); let pinch0 = 0, z0 = 0, lastX = 0, lastT = 0;
    on(cv, 'pointerdown', e => { ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { cv.setPointerCapture(e.pointerId); } catch (x) {} lastX = e.clientX; lastT = performance.now(); this.vyaw = 0;
      if (ptr.size === 2) { const a = [...ptr.values()]; pinch0 = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); z0 = this.zoomT; } this.kick(); });
    on(cv, 'pointermove', e => {
      if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptr.size >= 2) { const a = [...ptr.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); if (pinch0 > 0) this.setZoom(z0 + (d / pinch0 - 1) * 1.1); return; }
      const now = performance.now(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT);
      this.yaw += dx * .011; this.vyaw = dx * .011 / dt * 16; lastX = e.clientX; lastT = now; this.kick();
    });
    const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch0 = 0; if (ptr.size === 1) { lastX = [...ptr.values()][0].x; lastT = performance.now(); } if (this.reduced) this.vyaw = 0; this.kick(); };
    on(cv, 'pointerup', up); on(cv, 'pointercancel', up); on(cv, 'lostpointercapture', up);
    on(cv, 'wheel', e => { if (this.o.wheel === false && !e.ctrlKey) return; e.preventDefault(); this.setZoom(this.zoomT - e.deltaY * .0016); }, { passive: false });   /* بالصفحات القابلة للتمرير: Ctrl+عجلة فقط */
    on(cv, 'dblclick', () => this.setZoom(this.zoomT > .5 ? 0 : 1));
    on(cv, 'webglcontextlost', e => { e.preventDefault(); this.lost = true; this.stop(); this.state('lost'); });
    on(cv, 'webglcontextrestored', () => { this.lost = false; this.state('restored'); this.dirty = true; this.kick(); });
    on(document, 'visibilitychange', () => { if (document.hidden) this.stop(); else this.kick(); });
    if ('ResizeObserver' in window) { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.host); }
    if ('IntersectionObserver' in window) { this.io = new IntersectionObserver(es => { this.visible = es.some(x => x.isIntersecting); if (this.visible) this.kick(); else this.stop(); }); this.io.observe(this.host); }
  }
  resize() {
    if (this.disposed) return; const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    if (w === this.W && h === this.H) return; this.W = w; this.H = h;
    const budget = Math.sqrt(2.6e6 / (w * h)); this.renderer.setPixelRatio(Math.max(1, Math.min(this.q.dpr, budget)));
    this.renderer.setSize(w, h, false); this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.dirty = true; this.kick();
  }
  setZoom(z) { this.zoomT = clamp(z); this.kick(); }
  rotateBy(a) { this.vyaw = 0; this.yaw += a; this.kick(); }

  /* --- الأصول --- */
  async body(name) {
    if (this.bodies[name]) return this.bodies[name];
    const buf = await this.asset('body_' + name); if (this.disposed) throw new Error('disposed');
    const g = await parseGLB(buf); const root = g.scene, bones = {}, meshes = {};
    root.traverse(o => { if (o.isBone) bones[o.name] = o; if (o.isMesh) { meshes[o.name] = o; o.frustumCulled = false; } });
    root.updateMatrixWorld(true);
    const bodyMesh = meshes.SuperHero_Male || meshes.Superhero_Female || Object.values(meshes).find(m => m.geometry.attributes.position.count > 4000);
    const brows = meshes.Eyebrows, eyes = meshes.Eyes, F = FRAME[name];
    const headIdx = bodyMesh.skeleton.bones.findIndex(b => b.name === 'Head');
    const B = { name, root, bones, body: bodyMesh, brows, eyes, F, headIdx, headRest: bones.Head.matrixWorld.clone(), faces: [], beardGeo: {} };
    B.hw = headWeights(bodyMesh.geometry, headIdx); B.hwBrow = brows ? headWeights(brows.geometry, brows.skeleton.bones.findIndex(b => b.name === 'Head')) : null;
    const R = clothAttrs(bodyMesh, name, bones);
    B.cloth = clothMaterial(bodyMesh.material, name, R);
    if (brows) { brows.material = brows.material.clone(); B.browMat = brows.material; }
    if (eyes && eyes.material) { eyes.material.roughness = .15; eyes.material.envMapIntensity = 1.2; }
    bodyMesh.material.envMapIntensity = .8;
    pose(bones, name); root.updateMatrixWorld(true);
    B.restQ = {}; for (const k of ['spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head', 'upperarm_l', 'upperarm_r']) if (bones[k]) B.restQ[k] = bones[k].quaternion.clone();
    root.visible = false; this.turn.add(root);
    /* الإطار: الجسم كاملاً (بعد الوضعية) + الرأس */
    bodyMesh.computeBoundingBox(); B.box = bodyMesh.boundingBox.clone().applyMatrix4(bodyMesh.matrixWorld);
    B.headC = new Vector3(0, (F.eyeY + F.chinY) / 2 + .03, .02);
    this.bodies[name] = B; return B;
  }
  async hair() {
    if (this.hairDoc) return this.hairDoc;
    const buf = await this.asset('hair'); if (this.disposed) throw new Error('disposed');
    const g = await parseGLB(buf), map = {};
    g.scene.traverse(o => { if (o.isMesh) { map[o.name] = o; o.frustumCulled = false; } });
    for (const m of Object.values(map)) { m.material = m.material.clone(); m.material.envMapIntensity = .6; this.hairMats.push(m.material); }
    this.hairDoc = { scene: g.scene, map }; return this.hairDoc;
  }
  /* مورف وجه لجسم (يُحسب مرة لكل وجه ويُخزَّن) */
  faceIndex(B, face) {
    const key = face.id; let i = B.faces.findIndex(f => f.id === key); if (i >= 0) return i;
    const geo = B.body.geometry, I = new Matrix4();
    const attr = morphArray(geo, I, B.F, face.p || {}, B.hw);
    geo.morphAttributes.position = (geo.morphAttributes.position || []).concat([attr]); geo.morphTargetsRelative = true;
    if (B.brows) { const bg = B.brows.geometry; bg.morphAttributes.position = (bg.morphAttributes.position || []).concat([morphArray(bg, I, B.F, face.p || {}, null)]); bg.morphTargetsRelative = true; }
    B.faces.push({ id: key, p: face.p || {} }); i = B.faces.length - 1;
    for (const m of [B.body, B.brows]) if (m) { m.geometry.dispose(); m.updateMorphTargets(); }   // إعادة رفع الهندسة بالمورف الجديد
    return i;
  }
  /* --- التطبيق --- */
  async setConfig(cfg) {
    const my = ++this.gen; this.state('loading');
    try {
      const B = await this.body(cfg.body); const H = await this.hair(); if (my !== this.gen || this.disposed) return;
      for (const k in this.bodies) this.bodies[k].root.visible = k === cfg.body;
      const fi = this.faceIndex(B, cfg.face);
      for (const m of [B.body, B.brows]) if (m && m.morphTargetInfluences) m.morphTargetInfluences.forEach((_, j, a) => { a[j] = j === fi ? 1 : 0; });
      /* الشعر: نسخ مرتبطة بعظمة الرأس، مكانها = مكانها حول رأس الجسم الأصلي للتسريحة */
      if (this.hairNow) { for (const h of this.hairNow) h.parent && h.parent.remove(h); }
      this.hairNow = [];
      const parts = [cfg.hair.mesh].concat(cfg.hair.beard ? ['Hair_Beard'] : []).filter(Boolean);
      for (const name of parts) {
        const src = H.map[name]; if (!src) continue;
        const native = cfg.hair.native && cfg.hair.native[name] || (name === 'Hair_Beard' ? 'male' : cfg.body);
        const fit = (cfg.hair.fit && cfg.hair.fit[name]) || null;
        let m = B['hair_' + name];
        if (!m) {
          m = src.clone(); m.geometry = src.geometry.clone(); m.material = src.material;
          /* المحلي بالنسبة لعظمة رأس الجسم الأصلي ⇒ نفس العلاقة على أي رأس */
          const local = new Matrix4().fromArray(HEAD_REST[native] || HEAD_REST.male).invert();
          if (fit) { const S = new Matrix4().makeScale(fit.s[0], fit.s[1], fit.s[2]), T = new Matrix4().makeTranslation(fit.t[0], fit.t[1], fit.t[2]); local.multiply(T).multiply(S); }
          src.updateMatrix(); local.multiply(src.matrix);   /* تحويل العقدة الأصلي (بعض التسريحات مدوّرة ومصغّرة ×0.01) */
          m.matrixAutoUpdate = false; m.matrix.copy(local);
          if (name === 'Hair_Beard') m.userData.beard = true;
          B['hair_' + name] = m;
        }
        if (m.userData.beard) {
          /* مورف اللحية بنفس معاملات الوجه (المواضع بالعالم بوضعية الراحة) */
          const toW = new Matrix4().multiplyMatrices(B.headRest, m.matrix), k = cfg.face.id;
          m.userData.mf = m.userData.mf || {};
          if (!(k in m.userData.mf)) { const g = m.geometry; g.morphAttributes.position = (g.morphAttributes.position || []).concat([morphArray(g, toW, B.F, cfg.face.p || {}, null)]); g.morphTargetsRelative = true; m.userData.mf[k] = g.morphAttributes.position.length - 1; g.dispose(); m.updateMorphTargets(); }
          m.morphTargetInfluences.forEach((_, j, a) => { a[j] = j === m.userData.mf[k] ? 1 : 0; });
        }
        B.bones.Head.add(m); this.hairNow.push(m);
      }
      for (const k in this.bodies) this.bodies[k].root.visible = k === cfg.body;
      this.setColor(cfg.color, B);
      this.cfg = cfg; this.cur = B; this.dirty = true;
      if (!this.fitted) { this.fitted = true; this.zoom = this.zoomT; }
      this.state('ready'); this.kick();
    } catch (e) { if (!this.disposed) this.state('error', e && e.message); throw e; }
  }
  setColor(hex, B) {
    B = B || this.cur; const c = new Color(hex || '#2a1d14');
    const hc = c.clone().multiplyScalar(1.35), bc = c.clone().multiplyScalar(.95);
    for (const m of this.hairMats) m.color.copy(hc);
    if (B && B.browMat) B.browMat.color.copy(bc);
    this.dirty = true; this.kick();
  }
  /* --- الكاميرا: إطار الجسم كاملاً ⇄ الوجه --- */
  frame(z, cam) {
    const B = this.cur; if (!B) return;
    cam = cam || this.camera; const box = B.box, h = box.max.y - box.min.y, fov = MathUtils.degToRad(cam.fov), asp = cam.aspect;
    const bodyH = h * 1.12, bodyW = Math.max(.62, (box.max.x - box.min.x) * 1.15);
    const dFull = Math.max(bodyH / 2 / Math.tan(fov / 2), bodyW / 2 / (Math.tan(fov / 2) * asp));
    const faceH = .42, dFace = Math.max(faceH / 2 / Math.tan(fov / 2), .34 / 2 / (Math.tan(fov / 2) * asp));
    const ty = MathUtils.lerp(box.min.y + h * .5, B.headC.y - .02, z), d = MathUtils.lerp(dFull, dFace, z * z * (3 - 2 * z));
    const tz = MathUtils.lerp(0, B.headC.z, z), elev = MathUtils.lerp(.06, .02, z);
    cam.position.set(0, ty + d * elev, tz + d); cam.lookAt(0, ty, tz); cam.updateMatrixWorld();
  }
  /* --- الحلقة --- */
  kick() { if (this.disposed || this.lost || !this.visible || document.hidden) return; this.dirty = true; if (!this.running) { this.running = true; this.lastT = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t)); } }
  stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  loop(t) {
    if (!this.running) return;
    const dt = Math.min(.05, (t - this.lastT) / 1000); this.lastT = t;
    let busy = false;
    if (Math.abs(this.vyaw) > 1e-4) { this.yaw += this.vyaw; this.vyaw *= Math.pow(.0025, dt); busy = true; } else this.vyaw = 0;
    const dz = this.zoomT - this.zoom; if (Math.abs(dz) > 1e-3) { this.zoom += dz * (1 - Math.pow(.0001, dt)); busy = true; } else this.zoom = this.zoomT;
    const idle = !this.reduced && this.o.idle !== false;
    if (this.cur && idle) this.breathe((t - this.t0) / 1000);
    if (busy || idle || this.dirty) {
      /* الخمول: نصف معدل الإطارات (توفير البطارية) — التفاعل بالمعدل الكامل */
      if (busy || this.dirty || (this.frameSkip = (this.frameSkip + 1) % 2) === 0) this.render();
      this.dirty = false;
      this.raf = requestAnimationFrame(x => this.loop(x));
    } else this.running = false;
  }
  breathe(s) {
    const B = this.cur, b = B.bones, q = new Quaternion(), X = new Vector3(1, 0, 0), Zv = new Vector3(0, 0, 1);
    const br = Math.sin(s * 1.6) * .012, sw = Math.sin(s * .55) * .01;
    for (const [k, a, ax] of [['spine_02', br, X], ['spine_03', br * .7, X], ['neck_01', -br * .6, X], ['Head', sw, Zv]]) if (b[k] && B.restQ[k]) { b[k].quaternion.copy(B.restQ[k]).multiply(q.setFromAxisAngle(ax, a)); }
    for (const s2 of ['l', 'r']) { const k = 'upperarm_' + s2; if (b[k] && B.restQ[k]) b[k].quaternion.copy(B.restQ[k]).multiply(q.setFromAxisAngle(X, Math.sin(s * 1.6 + .6) * .01)); }
  }
  render() {
    if (this.lost || this.disposed) return;
    this.turn.rotation.y = this.yaw; this.frame(this.zoom);
    this.renderer.render(this.scene, this.camera);
  }
  /* لقطة مصغّرة (بطاقات الاختيار): تُرسم وتُنسخ في المهمة نفسها ثم يُعاد المشهد ⇒ لا وميض */
  async snapshot(cfg, o) {
    o = o || {}; const prev = this.cfg, prevYaw = this.yaw, prevZ = this.zoom;
    await this.setConfig(cfg); if (this.disposed) return '';
    this.turn.rotation.y = o.yaw == null ? -.32 : o.yaw; if (this.cur && this.o.idle !== false) this.breathe(0);
    const cam = this.camera.clone(); cam.aspect = this.W / this.H; cam.fov = this.camera.fov; cam.updateProjectionMatrix();
    this.frame(o.z == null ? 1 : o.z, cam);
    this.renderer.render(this.scene, cam);
    const S = o.size || 160, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    const gl = this.renderer.getContext(), bw = gl.drawingBufferWidth, bh = gl.drawingBufferHeight, side = Math.min(bw, bh) | 0;
    const sx = ((bw - side) / 2) | 0, sy = Math.max(0, Math.min(bh - side, ((bh - side) / 2 - (o.dy || 0) * side) | 0));
    const px = new Uint8Array(side * side * 4); gl.readPixels(sx, sy, side, side, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = side; const tx = tmp.getContext('2d'), im = tx.createImageData(side, side), row = side * 4;
    for (let y = 0; y < side; y++) im.data.set(px.subarray((side - 1 - y) * row, (side - y) * row), y * row);   /* GL من الأسفل */
    tx.putImageData(im, 0, 0); x.drawImage(tmp, 0, 0, side, side, 0, 0, S, S);
    let url = ''; try { url = c.toDataURL('image/webp', .86); if (url.indexOf('image/webp') < 0) url = c.toDataURL('image/png'); } catch (e) {}
    this.yaw = prevYaw; this.zoom = prevZ;
    if (prev) await this.setConfig(prev); else this.render();
    this.render();
    return url;
  }
  dispose() {
    if (this.disposed) return; this.disposed = true; this.stop(); this.gen++;
    for (const [el, ev, fn, op] of this.L) el.removeEventListener(ev, fn, op);
    try { this.ro && this.ro.disconnect(); this.io && this.io.disconnect(); } catch (e) {}
    const seen = new Set(), free = o => { if (o && !seen.has(o)) { seen.add(o); o.dispose && o.dispose(); } };
    const walk = root => root.traverse(o => {
      if (o.geometry) free(o.geometry);
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of ms) { for (const k in m) { const v = m[k]; if (v && v.isTexture) free(v); } free(m); }
      if (o.isSkinnedMesh && o.skeleton) free(o.skeleton);
    });
    walk(this.scene); for (const k in this.bodies) walk(this.bodies[k].root); if (this.hairDoc) walk(this.hairDoc.scene);
    free(this.shadowT); free(this.env);
    try { this.renderer.dispose(); this.renderer.forceContextLoss(); } catch (e) {}
    try { this.canvas.remove(); } catch (e) {}
    this.bodies = {}; this.hairDoc = null; this.scene = null;
  }
}

export function create(host, o) { return new CharView(host, o); }
