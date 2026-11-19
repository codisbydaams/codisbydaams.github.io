/* CODIS-V72 — عارض الشخصية البشرية الواقعية (CodisB3D.char) — يحل محل V71.
   • نفس نسخة Three.js المضمّنة لمشاهد الصناديق (لا نسخة ثانية).
   • الأصل: حاوية واحدة codis_char.bin (CDC2) من tools/char3d/mh_build.py — MakeHuman CC0: الجسم الأساسي + 238 Target أصلية
     + هيكل عظمي (74 عظمة) + أوزان + قطع مُركّبة (العينان/الحواجب/الرموش/الشعر/الملابس) + خامات.
   • كل تغيير (الجسم/الطول/الوجه/التفاصيل) = مواضع جديدة للجسم كله (مجموع موزون للأهداف الأصلية) ثم:
     العموديات تُعاد حسابها على الطوبولوجيا الملحومة (لا بقع ظل بعد التشوّه) · الهيكل يُعاد تركيبه من مفاصل الجسم نفسه
     · كل قطعة (عين/حاجب/رمش/شعر/لحية/ملابس) تُعاد تركيبها من رؤوس الجسم ⇒ لا تداخل ولا انفصال مهما تغيّر الشكل.
   • التزامن: طابور واحد لكل عارض (التطبيق/اللقطات بالتتابع)، آخر طلب يفوز، وعود التحميل تُخزَّن لحظة البدء (لا تحميل مزدوج).
   • الموارد: Render Loop فقط ما دام ظاهراً؛ تحرير كامل عند dispose؛ فقدان السياق/استعادته؛ تقليل الحركة. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, MeshPhysicalMaterial, PlaneGeometry, SphereGeometry, BackSide, DoubleSide,
  HemisphereLight, DirectionalLight, SRGBColorSpace, NoColorSpace, ACESFilmicToneMapping, PMREMGenerator, Vector3, Vector2, Quaternion, Matrix4, Box3,
  BufferGeometry, BufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, Uint8BufferAttribute, Uint32BufferAttribute, CanvasTexture, Texture, RepeatWrapping,
  Bone, Skeleton, SkinnedMesh, MathUtils, LinearMipmapLinearFilter, LinearFilter
} from 'three';

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const TYPES = { int8: Int8Array, int16: Int16Array, uint16: Uint16Array, uint8: Uint8Array, float32: Float32Array, uint32: Uint32Array };

/* ---------- الحاوية CDC2: 'CDC2' | uint32 طول JSON | JSON | كتل ---------- */
export function parseCDC(buf) {
  const u8 = new Uint8Array(buf);
  if (u8.length < 8 || String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== 'CDC2') { const e = new Error('char asset: bad header'); e.code = 'parse'; throw e; }
  const jl = new DataView(buf).getUint32(4, true), meta = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + jl))), base = 8 + jl;
  const get = name => {
    const b = meta.blobs[name]; if (!b) { const e = new Error('char asset: missing ' + name); e.code = 'missing'; throw e; }
    const T = TYPES[b[2]]; if (!T) return u8.subarray(base + b[0], base + b[0] + b[1]);
    return new T(buf, base + b[0], b[1] / T.BYTES_PER_ELEMENT);
  };
  const mime = name => meta.blobs[name] && meta.blobs[name][2];
  const tg = {}; for (const [n, o, c, sc] of meta.targets) tg[n] = [o, c, sc || meta.q];
  return { meta, get, mime, tg, tgI: get('tg.idx'), tgD: get('tg.d') };
}

/* ---------- خامة من صورة داخل الحاوية (blob: مسموح بالـCSP؛ fetch(blob:) ممنوع) ---------- */
function loadTex(A, name, o) {
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(new Blob([A.get(name)], { type: A.mime(name) })), im = new Image();
    im.decoding = 'async';
    im.onload = () => {
      URL.revokeObjectURL(url);
      const t = new Texture(im); t.colorSpace = o && o.linear ? NoColorSpace : SRGBColorSpace; t.flipY = true; t.anisotropy = 4;   /* UV بأصل OBJ (أسفل-يسار) */
      if (o && o.repeat) { t.wrapS = t.wrapT = RepeatWrapping; }
      if (o && o.crisp) { t.generateMipmaps = false; t.minFilter = LinearFilter; }
      t.needsUpdate = true; ok(t);
    };
    im.onerror = () => { URL.revokeObjectURL(url); const e = new Error('char texture decode: ' + name); e.code = 'decode'; no(e); };
    im.src = url;
  });
}

/* ---------- بيئة انعكاس ناعمة (استوديو) ---------- */
function makeEnv(renderer) {
  const sc = new Scene();
  sc.add(new Mesh(new SphereGeometry(20, 24, 12), new MeshBasicMaterial({ side: BackSide, color: new Color(.3, .29, .28) })));
  const box = (c, x, y, z, w, h, i) => { const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(c).multiplyScalar(i), side: DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1, 0); sc.add(m); };
  box(0xfff2e2, -6, 6, 7, 8, 6, 2.6); box(0xdfe9ff, 8, 5, -4, 4, 8, 1.6); box(0xffffff, 0, 12, 0, 10, 4, 1.3); box(0xffeedd, 3, 1, 9, 10, 2, .9);
  const pm = new PMREMGenerator(renderer), rt = pm.fromScene(sc, .04); pm.dispose();
  sc.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt;
}
function shadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(.55, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

/* =====================================================================
   Rig — شخص واحد لجنس واحد: الجسم + القطع على هيكل واحد
   ===================================================================== */
const SKIN_GLSL_FRAG = `#include <map_fragment>
#ifdef USE_MAP
{ vec3 c2 = texture2D(uSkin2, vMapUv).rgb; diffuseColor.rgb = mix(diffuseColor.rgb, c2, uSkinMix) * uSkinTint; }
#endif
diffuseColor.rgb = mix(diffuseColor.rgb, uScalpCol, vHM.x * uScalpAmt);
diffuseColor.rgb = mix(diffuseColor.rgb, uBeardCol, vHM.y * uBeardAmt);`;
/* القشور (لحية/حلاقة قصيرة): طبقات فوق الجلد؛ كل بكسل = شعيرة بطول عشوائي ⇒ تبقى بالطبقات حتى طولها.
   ظلّ منبت الشعر/اللحية على الجلد (vHM) يمنع ظهور فروة فاتحة بين الخصلات */
const SHELL_V = ['#include <common>', '#include <common>\nattribute float aDens;attribute float aLay;varying float vDens;varying float vLay;',
  '#include <begin_vertex>', '#include <begin_vertex>\nvDens = aDens; vLay = aLay;'];
const SHELL_F = `{ vec3 st = texture2D(uStrands, vMapUv * uRep).rgb;
  float len = st.r, cut = .06 + vLay * .9 + (1. - vDens) * .95 + uSparse;
  if (len < cut) discard;
  diffuseColor.rgb = uHairCol * (.5 + .95 * vLay * len) * (.66 + .68 * st.g); }`;
class Rig {
  constructor(view, A, sex) {
    this.view = view; this.A = A; this.sex = sex; const M = A.meta, nv = M.nv;
    this.P = new Float32Array(nv * 3); this.N = new Float32Array(nv * 3);
    this.root = new Group(); this.root.visible = false; this.root.name = 'rig-' + sex;
    /* الهيكل: عظام بدوران صفري (الموضع فقط) — الربط يُعاد حسابه مع كل شكل */
    this.bones = M.bones.map(b => { const o = new Bone(); o.name = b.n; return o; });
    M.bones.forEach((b, i) => { if (b.p >= 0) this.bones[b.p].add(this.bones[i]); else this.root.add(this.bones[i]); });
    this.byName = {}; this.bones.forEach(b => { this.byName[b.name] = b; });
    this.skeleton = new Skeleton(this.bones);
    /* الجسم */
    const vmap = A.get(M.body.vmap); this.vmap = vmap; const n = vmap.length;
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('uv', new BufferAttribute(A.get(M.body.uv), 2, true));
    const J = A.get(M.weights.j), W = A.get(M.weights.w), sj = new Uint8Array(n * 4), sw = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { sj[i * 4 + k] = J[vmap[i] * 4 + k]; sw[i * 4 + k] = W[vmap[i] * 4 + k]; }
    g.setAttribute('skinIndex', new Uint8BufferAttribute(sj, 4)); g.setAttribute('skinWeight', new BufferAttribute(sw, 4, true));
    { const hm = new Uint8Array(n * 2); if (M.hairMask) { const HM = A.get(M.hairMask); for (let i = 0; i < n; i++) { hm[i * 2] = HM[vmap[i] * 2]; hm[i * 2 + 1] = HM[vmap[i] * 2 + 1]; } } g.setAttribute('aHM', new BufferAttribute(hm, 2, true)); }
    this.triAll = A.get(M.body.tri); this.triFace = A.get(M.body.face); this.faces4 = A.get(M.body.face4);
    g.setIndex(new BufferAttribute(this.triAll, 1));
    this.bodyGeo = g;
    this.skinMat = new MeshPhysicalMaterial({ roughness: .58, metalness: 0, sheen: .35, sheenRoughness: .75, sheenColor: new Color(.62, .32, .25), envMapIntensity: .5 });
    this.skinU = { uSkin2: { value: null }, uSkinMix: { value: 0 }, uSkinTint: { value: new Color(1, 1, 1) }, uScalpCol: { value: new Color(0, 0, 0) }, uScalpAmt: { value: 0 }, uBeardCol: { value: new Color(0, 0, 0) }, uBeardAmt: { value: 0 } };
    this.skinMat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.skinU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aHM;varying vec2 vHM;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHM = aHM;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uSkin2;uniform float uSkinMix;uniform vec3 uSkinTint;uniform vec3 uScalpCol;uniform float uScalpAmt;uniform vec3 uBeardCol;uniform float uBeardAmt;varying vec2 vHM;')
        .replace('#include <map_fragment>', SKIN_GLSL_FRAG);
    };
    this.skinMat.customProgramCacheKey = () => 'codis-skin2';
    this.body = new SkinnedMesh(g, this.skinMat); this.body.name = 'body'; this.body.frustumCulled = false;
    this.root.add(this.body); this.body.bind(this.skeleton, new Matrix4());
    /* أوزان كل رأس أصلي (للقطع) */
    this.J = J; this.W = W;
    this.parts = {}; this.delKey = '';
    this.box = new Box3(); this.headC = new Vector3(); this.restQ = {};
  }
  /* --- المواضع: البنية + الطول + الأهداف المتفرقة (متر) --- */
  shape(spec) {
    const A = this.A, M = A.meta, q = M.q, P = this.P, nv = M.nv;
    const builds = M.builds[this.sex], b = builds.find(x => x.id === spec.build) || builds[1] || builds[0];
    const src = A.get(b.pos); for (let i = 0; i < nv * 3; i++) P[i] = src[i] * q;
    const h = clamp(spec.height == null ? .5 : spec.height);
    if (h !== .5) { const k = h > .5 ? 'max' : 'min', w = Math.abs(h - .5) * 2 * q, D = A.get(M.height[this.sex + '.' + k]); for (let i = 0; i < nv * 3; i++) P[i] += D[i] * w; }
    const I = A.tgI, Dd = A.tgD;
    for (const name in spec.targets || {}) {
      const w = +spec.targets[name]; if (!w || !isFinite(w)) continue; const t = A.tg[name]; if (!t) continue;
      const wq = w * t[2]; for (let j = t[0], e = t[0] + t[1]; j < e; j++) { const v = I[j] * 3, d = j * 3; P[v] += Dd[d] * wq; P[v + 1] += Dd[d + 1] * wq; P[v + 2] += Dd[d + 2] * wq; }
    }
    /* القدمان على الأرض */
    const vm = this.vmap; let minY = Infinity; for (let i = 0; i < vm.length; i++) { const y = P[vm[i] * 3 + 1]; if (y < minY) minY = y; }
    for (let i = 1; i < nv * 3; i += 3) P[i] -= minY;
    this.normals();
  }
  /* العموديات على الطوبولوجيا الملحومة (فهرس الرأس الأصلي) ⇒ لا خطوط عند حدود UV ولا ظلال خاطئة بعد أي تشوّه */
  normals() {
    const P = this.P, N = this.N, F = this.faces4; N.fill(0);
    const a = new Vector3(), b = new Vector3(), c = new Vector3(), d = new Vector3(), e = new Vector3();
    for (let f = 0; f < F.length; f += 4) {
      const i0 = F[f], i1 = F[f + 1], i2 = F[f + 2], i3 = F[f + 3], t = i3 === i2;
      a.fromArray(P, i0 * 3); b.fromArray(P, i1 * 3); c.fromArray(P, i2 * 3); d.fromArray(P, i3 * 3);
      if (t) e.subVectors(b, a).cross(c.sub(a)); else e.subVectors(c, a).cross(d.sub(b));   /* رباعي: حاصل ضرب القطرين (مساحة موزونة) */
      N[i0 * 3] += e.x; N[i0 * 3 + 1] += e.y; N[i0 * 3 + 2] += e.z; N[i1 * 3] += e.x; N[i1 * 3 + 1] += e.y; N[i1 * 3 + 2] += e.z;
      N[i2 * 3] += e.x; N[i2 * 3 + 1] += e.y; N[i2 * 3 + 2] += e.z; if (!t) { N[i3 * 3] += e.x; N[i3 * 3 + 1] += e.y; N[i3 * 3 + 2] += e.z; }
    }
    for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
  }
  joint(list, out) { const P = this.P; out.set(0, 0, 0); for (const i of list) { out.x += P[i * 3]; out.y += P[i * 3 + 1]; out.z += P[i * 3 + 2]; } return out.multiplyScalar(1 / list.length); }
  /* الهيكل من مفاصل الجسم الحالي ثم إعادة الربط بوضعية الراحة، ثم وضعية الوقوف */
  rebind() {
    const M = this.A.meta, heads = M.bones.map(b => this.joint(b.h, new Vector3()));
    this.bones.forEach((bo, i) => { const p = M.bones[i].p; bo.position.copy(heads[i]); if (p >= 0) bo.position.sub(heads[p]); bo.quaternion.identity(); bo.scale.set(1, 1, 1); });
    /* الربط بلا دوران العرض (yaw) — وإلا تشوّهت الشخصية عند تدويرها (وضع attached يعوّض matrixWorld كل إطار) */
    const turn = this.view.turn, yaw = turn.rotation.y; turn.rotation.y = 0; turn.updateMatrixWorld(true);
    this.skeleton.calculateInverses();
    this.tails = M.bones.map(b => this.joint(b.t, new Vector3())); this.heads = heads;
    pose(this); turn.rotation.y = yaw; turn.updateMatrixWorld(true);
    this.restQ = {}; for (const b of this.bones) this.restQ[b.name] = b.quaternion.clone();
  }
  /* --- الجسم المرئي --- */
  writeBody(del) {
    const g = this.bodyGeo, vm = this.vmap, P = this.P, N = this.N, pa = g.attributes.position.array, na = g.attributes.normal.array;
    for (let i = 0; i < vm.length; i++) { const s = vm[i] * 3, d = i * 3; pa[d] = P[s]; pa[d + 1] = P[s + 1]; pa[d + 2] = P[s + 2]; na[d] = N[s]; na[d + 1] = N[s + 1]; na[d + 2] = N[s + 2]; }
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
    /* إخفاء الجلد تحت الملابس (قوائم delete_verts الأصلية) ⇒ لا اختراق للجلد عبر القماش */
    const key = (del || []).map(x => x.id).join('|');
    if (key !== this.delKey) {
      this.delKey = key;
      if (!del || !del.length) g.setIndex(new BufferAttribute(this.triAll, 1));
      else {
        const hide = new Uint8Array(this.A.meta.nv); for (const d of del) for (const v of d.list) hide[v] = 1;
        const F = this.faces4, T = this.triAll, TF = this.triFace, out = [];
        const faceHidden = new Uint8Array(F.length / 4); for (let f = 0; f < faceHidden.length; f++) faceHidden[f] = hide[F[f * 4]] | hide[F[f * 4 + 1]] | hide[F[f * 4 + 2]] | hide[F[f * 4 + 3]];
        for (let t = 0; t < TF.length; t++) if (!faceHidden[TF[t]]) out.push(T[t * 3], T[t * 3 + 1], T[t * 3 + 2]);   /* triFace = ترتيب الوجه في faces4 */
        g.setIndex(new BufferAttribute(new Uint16Array(out), 1));
      }
    }
    g.computeBoundingBox(); g.computeBoundingSphere();
  }
  /* --- قطعة مُركّبة: موضع كل رأس = مركّب 3 رؤوس من الجسم + إزاحة مقيسة (mhclo) --- */
  part(id) {
    if (this.parts[id]) return this.parts[id];
    const A = this.A, pr = A.meta.proxies.find(p => p.id === id); if (!pr) return null;
    const n = pr.n, refs = A.get(pr.refs), w = A.get(pr.w), off = A.get(pr.off);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('uv', new BufferAttribute(A.get(pr.uv), 2, true));
    if (pr.triBall) {   /* العين: كرة معتمة + قرنية شفافة لامعة (مجموعتان بمادتين) */
      const tb = A.get(pr.triBall), tc = A.get(pr.triCornea), all = new Uint16Array(tb.length + tc.length); all.set(tb); all.set(tc, tb.length);
      g.setIndex(new BufferAttribute(all, 1)); g.addGroup(0, tb.length, 0); g.addGroup(tb.length, tc.length, 1);
    } else g.setIndex(new BufferAttribute(A.get(pr.tri), 1));
    /* أوزان القطعة = أوزان رؤوسها المرجعية الثلاثة بالنسب نفسها */
    const sj = new Uint8Array(n * 4), sw = new Uint8Array(n * 4), acc = new Map();
    for (let i = 0; i < n; i++) {
      acc.clear();
      for (let k = 0; k < 3; k++) { const v = refs[i * 3 + k], wk = w[i * 3 + k]; if (!wk) continue; for (let m = 0; m < 4; m++) { const W8 = this.W[v * 4 + m]; if (!W8) continue; const j = this.J[v * 4 + m]; acc.set(j, (acc.get(j) || 0) + wk * W8); } }
      const top = [...acc.entries()].filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 4); let s = 0; for (const e of top) s += e[1];
      if (!top.length) { sj[i * 4] = this.headIdx(); sw[i * 4] = 255; continue; }
      let r = 255; top.forEach((e, k) => { sj[i * 4 + k] = e[0]; const q8 = k === top.length - 1 ? r : Math.min(r, Math.round(e[1] / s * 255)); sw[i * 4 + k] = q8; r -= q8; });   /* المجموع 255 بالضبط (لا التفاف سالب) */
    }
    g.setAttribute('skinIndex', new Uint8BufferAttribute(sj, 4)); g.setAttribute('skinWeight', new BufferAttribute(sw, 4, true));
    const mesh = new SkinnedMesh(g, null); mesh.name = id; mesh.frustumCulled = false; mesh.visible = false;
    mesh.bind(this.skeleton, new Matrix4()); this.root.add(mesh);
    /* لحام العموديات: الرؤوس المكررة عند حدود UV لها المراجع نفسها */
    const key = new Map(), weld = new Uint32Array(n);
    for (let i = 0; i < n; i++) { const k = refs[i * 3] + ',' + refs[i * 3 + 1] + ',' + refs[i * 3 + 2] + ',' + off[i * 3].toFixed(5) + ',' + off[i * 3 + 1].toFixed(5) + ',' + off[i * 3 + 2].toFixed(5); if (!key.has(k)) key.set(k, i); weld[i] = key.get(k); }
    const P = { pr, mesh, g, refs, w, off, weld, ver: -1, del: pr.del ? { id, list: A.get(pr.del) } : null };
    this.parts[id] = P; return P;
  }
  /* قشرة: رؤوس من الجسم المرئي نفسه × طبقات (الارتفاع على العمودي) — id = 'shell:<region>:<style>:<layers>' */
  shellPart(region, style, L) {
    const id = 'shell:' + region + ':' + style + ':' + L; if (this.parts[id]) return this.parts[id];
    const A = this.A, sh = A.meta.shells && A.meta.shells[region]; if (!sh || !sh.dens[style]) return null;
    const v = A.get(sh.v), tri = A.get(sh.tri), dens = A.get(sh.dens[style]), n = v.length, bg = this.bodyGeo;
    const uvB = bg.attributes.uv.array, sjB = bg.attributes.skinIndex.array, swB = bg.attributes.skinWeight.array;
    const pos = new Float32Array(n * L * 3), uv = new Uint16Array(n * L * 2), d = new Float32Array(n * L), la = new Float32Array(n * L), sj = new Uint8Array(n * L * 4), sw = new Uint8Array(n * L * 4);
    for (let k = 0; k < L; k++) for (let i = 0; i < n; i++) {
      const o = k * n + i, b = v[i]; uv[o * 2] = uvB[b * 2]; uv[o * 2 + 1] = uvB[b * 2 + 1]; d[o] = dens[i] / 255; la[o] = L > 1 ? k / (L - 1) : 0;
      for (let m = 0; m < 4; m++) { sj[o * 4 + m] = sjB[b * 4 + m]; sw[o * 4 + m] = swB[b * 4 + m]; }
    }
    const idx = new Uint32Array(tri.length * L); for (let k = 0; k < L; k++) for (let j = 0; j < tri.length; j++) idx[k * tri.length + j] = tri[j] + k * n;
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('normal', new BufferAttribute(new Float32Array(n * L * 3), 3));
    g.setAttribute('uv', new BufferAttribute(uv, 2, true)); g.setAttribute('aDens', new BufferAttribute(d, 1)); g.setAttribute('aLay', new BufferAttribute(la, 1));
    g.setAttribute('skinIndex', new Uint8BufferAttribute(sj, 4)); g.setAttribute('skinWeight', new BufferAttribute(sw, 4, true));
    g.setIndex(new BufferAttribute(idx, 1));
    const mesh = new SkinnedMesh(g, null); mesh.name = id; mesh.frustumCulled = false; mesh.visible = false; mesh.bind(this.skeleton, new Matrix4()); this.root.add(mesh);
    const P = { shell: true, pr: { id, n: n * L }, mesh, g, v, L, ver: -1, h: 0 };
    this.parts[id] = P; return P;
  }
  fitShell(P, h) {
    if (P.ver === this.ver && P.h === h) return; P.ver = this.ver; P.h = h;
    const bp = this.bodyGeo.attributes.position.array, bn = this.bodyGeo.attributes.normal.array, pa = P.g.attributes.position.array, na = P.g.attributes.normal.array, n = P.v.length;
    for (let k = 0; k < P.L; k++) { const hk = h * (P.L > 1 ? (k + 1) / P.L : 1); for (let i = 0; i < n; i++) { const o = (k * n + i) * 3, b = P.v[i] * 3; for (let c = 0; c < 3; c++) { pa[o + c] = bp[b + c] + bn[b + c] * hk; na[o + c] = bn[b + c]; } } }
    P.g.attributes.position.needsUpdate = true; P.g.attributes.normal.needsUpdate = true; P.g.computeBoundingSphere();
  }
  headIdx() { return Math.max(0, this.A.meta.bones.findIndex(b => b.n === 'head')); }
  fit(P) {
    if (P.ver === this.ver) return; P.ver = this.ver;
    const B = this.P, n = P.pr.n, pa = P.g.attributes.position.array, sc = P.pr.scale, s = [1, 1, 1];
    for (let k = 0; k < 3; k++) { const c = sc[k]; if (c) s[k] = Math.abs(B[c[0] * 3 + k] - B[c[1] * 3 + k]) / c[2]; }
    const r = P.refs, w = P.w, o = P.off;
    for (let i = 0; i < n; i++) {
      const a = r[i * 3] * 3, b = r[i * 3 + 1] * 3, c = r[i * 3 + 2] * 3, wa = w[i * 3], wb = w[i * 3 + 1], wc = w[i * 3 + 2];
      for (let k = 0; k < 3; k++) pa[i * 3 + k] = wa * B[a + k] + wb * B[b + k] + wc * B[c + k] + o[i * 3 + k] * s[k];
    }
    P.g.attributes.position.needsUpdate = true; P.g.computeVertexNormals();
    /* لحام: متوسط العموديات للرؤوس المتطابقة */
    const na = P.g.attributes.normal.array, wd = P.weld;
    for (let i = 0; i < n; i++) { const j = wd[i]; if (j !== i) { na[j * 3] += na[i * 3]; na[j * 3 + 1] += na[i * 3 + 1]; na[j * 3 + 2] += na[i * 3 + 2]; } }
    for (let i = 0; i < n; i++) { const j = wd[i]; const l = Math.hypot(na[j * 3], na[j * 3 + 1], na[j * 3 + 2]) || 1; na[i * 3] = na[j * 3] / l; na[i * 3 + 1] = na[j * 3 + 1] / l; na[i * 3 + 2] = na[j * 3 + 2] / l; }
    P.g.attributes.normal.needsUpdate = true; P.g.computeBoundingSphere();
  }
  dispose() {
    const seen = new Set(), free = o => { if (o && !seen.has(o)) { seen.add(o); try { o.dispose(); } catch (e) {} } };
    free(this.bodyGeo); free(this.skinMat); for (const k in this.parts) { free(this.parts[k].g); } free(this.skeleton);
    if (this.root.parent) this.root.parent.remove(this.root);
  }
}

/* ---------- وضعية الوقوف: الذراعان من وضعية الراحة الأصلية إلى جانبي الجسم (دوران بالعالم) ---------- */
function rotWorld(bone, axis, ang) {
  const pq = new Quaternion(), bq = new Quaternion(); bone.parent.getWorldQuaternion(pq); bone.getWorldQuaternion(bq);
  const q = new Quaternion().setFromAxisAngle(axis, ang).multiply(bq); bone.quaternion.copy(pq.invert().multiply(q)); bone.updateMatrixWorld(true);
}
function boneDir(R, name) { const i = R.A.meta.bones.findIndex(b => b.n === name); return i < 0 ? null : R.tails[i].clone().sub(R.heads[i]).normalize(); }
function rotWorldQ(bone, q) {
  const pq = new Quaternion(), bq = new Quaternion(); bone.parent.getWorldQuaternion(pq); bone.getWorldQuaternion(bq);
  bone.quaternion.copy(pq.invert().multiply(q.clone().multiply(bq))); bone.updateMatrixWorld(true);
}
function pose(R) {
  /* الذراع من وضعية A الأصلية (~50°) إلى جانب الجسم: جزء من الدوران على الكتف (shoulder01) لأن جلد أعلى الذراع موزّع عليه، والباقي على الذراع */
  const b = R.byName, X = new Vector3(1, 0, 0), q = new Quaternion(), w = new Vector3(), h = new Vector3();
  const dirOf = (bo, ch) => { bo.getWorldPosition(h); ch.getWorldPosition(w); return w.sub(h).normalize(); };
  for (const s of ['L', 'R']) {
    const sh = b['shoulder01.' + s], ua = b['upperarm01.' + s], u2 = b['upperarm02.' + s], la = b['lowerarm01.' + s]; if (!ua || !u2 || !la) continue;
    const d0 = dirOf(u2, la), sx = Math.sign(d0.x) || 1, a = MathUtils.degToRad(R.sex === 'female' ? 77 : 74);
    const want = new Vector3(sx * Math.cos(a), -Math.sin(a), .06).normalize();
    if (sh) { const full = new Quaternion().setFromUnitVectors(d0, want); rotWorldQ(sh, new Quaternion().slerp(full, .3)); }
    rotWorldQ(ua, q.setFromUnitVectors(dirOf(u2, la), want));
    rotWorldQ(la, q.setFromAxisAngle(X, MathUtils.degToRad(-5)));
    /* القدمان أقرب قليلاً (وقفة طبيعية بدل وضعية A) */
    const ul = b['upperleg01.' + s]; if (ul) { const d = dirOf(ul, b['upperleg02.' + s] || ul.children[0]); rotWorldQ(ul, q.setFromAxisAngle(new Vector3(0, 0, 1), Math.sign(d.x || (s === 'L' ? 1 : -1)) * MathUtils.degToRad(4.5))); }
  }
}

/* =====================================================================
   CharView
   ===================================================================== */
export class CharView {
  constructor(host, o) {
    this.host = host; this.o = o || {}; this.asset = this.o.asset; this.reduced = !!this.o.reduced;
    this.q = this.o.quality === 'low' ? { dpr: Math.min(window.devicePixelRatio || 1, 1.5) } : { dpr: Math.min(window.devicePixelRatio || 1, 2) };
    const cv = this.canvas = document.createElement('canvas'); cv.className = 'ch3-cv'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
    let r;
    try { r = this.renderer = new WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'default', stencil: false, preserveDrawingBuffer: false }); }
    catch (e) { try { cv.remove(); } catch (x) {} const er = new Error('webgl context'); er.code = 'context'; throw er; }
    r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.setClearColor(0x000000, 0);
    this.scene = new Scene(); this.camera = new PerspectiveCamera(24, 1, .05, 30);
    this.env = makeEnv(r); this.scene.environment = this.env.texture; this.scene.environmentIntensity = .5;
    /* إضاءة استوديو: رئيسية دافئة ناعمة + تعبئة + حافة باردة (الشعر لا يضيع بالظل) + سماء/أرض */
    this.scene.add(new HemisphereLight(0xfff6ec, 0x4a3f36, .65));
    const key = new DirectionalLight(0xfff1e2, 2.1); key.position.set(-1.4, 2.6, 2.4); this.scene.add(key);
    const fill = new DirectionalLight(0xffeadb, .7); fill.position.set(2.2, 1.4, 2.2); this.scene.add(fill);
    const rim = new DirectionalLight(0xdbe6ff, 1.25); rim.position.set(1.6, 2.6, -2.6); this.scene.add(rim);
    const rim2 = new DirectionalLight(0xffe2cc, .45); rim2.position.set(-2, 1.2, -1.8); this.scene.add(rim2);
    this.shadowT = shadowTex();
    this.shadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: this.shadowT, transparent: true, depthWrite: false, toneMapped: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.scale.set(.9, .6, 1); this.shadow.position.y = .002; this.scene.add(this.shadow);
    this.turn = new Group(); this.scene.add(this.turn);
    this.rigs = {}; this.tex = {}; this.mats = {}; this.cur = null; this.spec = null; this.want = null; this.queue = Promise.resolve(); this.gen = 0;
    this.yaw = this.o.yaw == null ? -.28 : this.o.yaw; this.vyaw = 0; this.zoom = 0; this.zoomT = 0; this.focus = 'body'; this.t0 = performance.now(); this.lastT = 0;
    this.dirty = true; this.running = false; this.visible = true; this.lost = false; this.disposed = false; this.frameSkip = 0;
    this.bind(); this.resize();
  }
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
    on(cv, 'wheel', e => { if (this.o.wheel === false && !e.ctrlKey) return; e.preventDefault(); this.setZoom(this.zoomT - e.deltaY * .0016); }, { passive: false });
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
    const budget = Math.sqrt(2.4e6 / (w * h)); this.renderer.setPixelRatio(Math.max(1, Math.min(this.q.dpr, budget)));
    this.renderer.setSize(w, h, false); this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.dirty = true; this.kick();
  }
  setZoom(z) { this.zoomT = clamp(z); this.kick(); }
  /* التركيز: body (الجسم كاملاً) · face (الوجه) · hair (الرأس والرقبة) — الانتقال ناعم بنفس zoom */
  setFocus(f, z) { this.focus = f || 'body'; this.setZoom(z == null ? (f === 'body' ? 0 : 1) : z); }
  rotateBy(a) { this.vyaw = 0; this.yaw += a; this.kick(); }

  /* --- الأصول: وعد واحد لكل أصل يُخزَّن لحظة البدء (لا تحميل مزدوج مهما تزامنت الطلبات) --- */
  data() {
    if (!this._data) {
      this._data = Promise.resolve().then(() => this.asset('char')).then(buf => { if (this.disposed) throw Object.assign(new Error('disposed'), { code: 'disposed' }); return parseCDC(buf); });
      this._data.catch(() => { this._data = null; });   /* فشل ⇒ يُسمح بإعادة المحاولة */
    }
    return this._data;
  }
  texture(name, o) {
    if (!this.tex[name]) { const p = this.data().then(A => loadTex(A, name, o)); this.tex[name] = p; p.catch(() => { if (this.tex[name] === p) delete this.tex[name]; }); }
    return this.tex[name];
  }
  /* شخص لكل جنس للمعاينة + شخص منفصل للّقطات المصغّرة ('t:') ⇒ اللقطات لا تمسّ المعاينة إطلاقاً ولا تحتاج «استعادة» */
  async rig(sex, thumb) {
    const A = await this.data(); if (this.disposed) throw Object.assign(new Error('disposed'), { code: 'disposed' });
    const k = (thumb ? 't:' : '') + sex;
    if (!this.rigs[k]) { const R = new Rig(this, A, sex); R.thumb = !!thumb; this.rigs[k] = R; this.turn.add(R.root); }
    return this.rigs[k];
  }
  material(kind, id, make) { const k = (kind === 'hair' || kind === 'shell' ? this._mp || '' : '') + kind + ':' + id; if (!this.mats[k]) this.mats[k] = make(); return this.mats[k]; }

  /* --- الطابور: التطبيق واللقطات بالتتابع؛ setConfig = آخر طلب يفوز --- */
  run(fn) { const p = this.queue.then(fn, fn); this.queue = p.catch(() => {}); return p; }
  setConfig(spec) {
    this.want = spec; const my = ++this.gen; this.state('loading');
    return this.run(async () => {
      if (this.disposed || my !== this.gen) return;
      try { await this.apply(this.want); if (!this.disposed && my === this.gen) { this.state('ready'); this.kick(); } }
      catch (e) { if (!this.disposed && e && e.code !== 'disposed') this.state('error', { code: e.code || 'asset', msg: e.message }); throw e; }
    });
  }
  async prepare(spec, thumb) {
    const A = await this.data(), M = A.meta, sk = M.skins[spec.sex] || [], need = [];
    const skA = sk.find(s => s.id === spec.skin.a) || sk[0], skB = sk.find(s => s.id === spec.skin.b) || skA;
    need.push(this.texture(skA.img), this.texture(skB.img), this.texture(M.skinDetail, { linear: true, repeat: true }));
    if (M.eyeTex[spec.eye.tex]) need.push(this.texture(M.eyeTex[spec.eye.tex]));
    if ((spec.beardShell || spec.scalpShell) && M.strands) need.push(this.texture(M.strands, { linear: true, repeat: true, crisp: true }));
    for (const id of [spec.brows, spec.lashes, spec.hair, spec.beard, spec.outfit, spec.shoes].concat(spec.extra || [])) {
      const pr = id && M.proxies.find(p => p.id === id); if (!pr) continue;
      if (pr.tex) need.push(this.texture(pr.tex)); if (pr.nrm) need.push(this.texture(pr.nrm, { linear: true }));
    }
    const R = await this.rig(spec.sex, thumb); const t = await Promise.all(need);
    return { A, R, skA, skB, tex: t };
  }
  async apply(spec, thumb) {
    const { A, R, skA, skB } = await this.prepare(spec, thumb); if (this.disposed) return;
    const M = A.meta; this._A = A; this._mp = thumb ? 't:' : '';   /* مواد الشعر/القشور الملوّنة منفصلة للّقطات (لون اللقطة لا يتسرب للمعاينة) */
    /* الخامات الجاهزة (الوعود محلولة الآن) */
    const tx = {}; for (const k in this.tex) { try { tx[k] = await this.tex[k]; } catch (e) {} }
    /* الشكل */
    R.shape(spec); R.ver = (R.ver || 0) + 1; R.rebind();
    /* القطع المختارة */
    const want = [['eyes', 'eyes'], ['brows', spec.brows], ['lashes', spec.lashes], ['hair', spec.hair], ['beard', spec.beard], ['outfit', spec.outfit], ['shoes', spec.shoes]].filter(x => x[1]);
    for (const k in R.parts) R.parts[k].mesh.visible = false;
    const del = [];
    for (const [slot, id] of want) {
      const P = R.part(id); if (!P) continue;
      R.fit(P); P.mesh.material = this.partMat(slot, P.pr, tx, spec); P.mesh.visible = true; P.mesh.renderOrder = slot === 'hair' ? 3 : slot === 'brows' || slot === 'lashes' || slot === 'beard' ? 2 : 0;
      if (P.del && (slot === 'outfit' || slot === 'shoes')) del.push(P.del);
    }
    R.writeBody(del);
    /* القشور: اللحية + الحلاقة القصيرة (بعد كتابة الجسم لأنها تُشتق من مواضعه وعمودياته) */
    for (const sh of [spec.beardShell, spec.scalpShell]) {
      if (!sh || !sh.style) continue; const P = R.shellPart(sh.region, sh.style, sh.layers || 4); if (!P) continue;
      R.fitShell(P, sh.len || .003); P.mesh.material = this.shellMat(sh, tx, sh.region === 'beard' ? spec.beardColor : spec.hairColor); P.mesh.visible = true; P.mesh.renderOrder = 1;
    }
    { const u = R.skinU, hc = new Color(spec.hairColor || '#2a1d14'), bc = new Color(spec.beardColor || spec.hairColor || '#2a1d14');
      u.uScalpCol.value.copy(hc).multiplyScalar(.85); u.uScalpAmt.value = clamp(spec.scalpTint || 0);
      u.uBeardCol.value.copy(bc).multiplyScalar(.9); u.uBeardAmt.value = clamp(spec.beardTint || 0);
      /* ظلّ الفروة: قناع التسريحة المختارة نفسها (أو الحلاقة القصيرة) — لا ظلّ على الجبهة خارج منبت تلك التسريحة */
      const hs = spec.hair && this._A.meta.hairScalp && this._A.meta.hairScalp[spec.hair] ? spec.hair : (spec.scalpShell && spec.scalpShell.style ? '*scalp' : '');
      if (hs !== R.scalpMaskHair) { R.scalpMaskHair = hs; const M = this._A.meta, hm = R.bodyGeo.attributes.aHM, vm = R.vmap, HM = this._A.get(M.hairMask), src = hs && hs !== '*scalp' ? this._A.get(M.hairScalp[hs]) : null;
        for (let i = 0; i < vm.length; i++) hm.array[i * 2] = src ? src[vm[i]] : hs ? HM[vm[i] * 2] : 0; hm.needsUpdate = true; }
      const bs = spec.beardShell && spec.beardShell.style || '';
      if (bs !== R.beardMaskStyle) { R.beardMaskStyle = bs; const M = this._A.meta, hm = R.bodyGeo.attributes.aHM, src = bs && M.beardMask && M.beardMask[bs] ? this._A.get(M.beardMask[bs]) : null, vm = R.vmap;
        for (let i = 0; i < vm.length; i++) hm.array[i * 2 + 1] = src ? src[vm[i]] : 0; hm.needsUpdate = true; } }
    /* الجلد */
    R.skinMat.map = tx[skA.img]; this.skinU(R, tx[skB.img], spec);
    if (tx[M.skinDetail]) { const d = tx[M.skinDetail]; d.repeat.set(36, 36); R.skinMat.normalMap = d; R.skinMat.normalScale = new Vector2(.32, .32); }
    R.skinMat.needsUpdate = !R._skinOnce; R._skinOnce = true;
    if (!thumb) for (const k in this.rigs) this.rigs[k].root.visible = k === spec.sex;
    /* الإطار */
    R.body.geometry.computeBoundingBox(); R.box.copy(R.body.geometry.boundingBox);
    const hb = R.heads[M.bones.findIndex(b => b.n === 'head')], ht = R.tails[M.bones.findIndex(b => b.n === 'head')];
    R.headC.set(0, hb.y + (ht.y - hb.y) * .45, hb.z + .02); R.headTop = ht.y;
    const ep = R.parts.eyes; if (ep) { ep.g.computeBoundingBox(); const eb = ep.g.boundingBox; R.eyeC = new Vector3(0, (eb.min.y + eb.max.y) / 2, (eb.min.z + eb.max.z) / 2); } else R.eyeC = R.headC.clone();
    this._mp = '';
    if (thumb) { this.tcur = R; return; }
    this.cur = R; this.spec = spec; this.dirty = true;
  }
  skinU(R, t2, spec) { R.skinU.uSkin2.value = t2; R.skinU.uSkinMix.value = clamp(spec.skin.mix || 0); R.skinU.uSkinTint.value.set(spec.skin.tint || '#ffffff'); }
  partMat(slot, pr, tx, spec) {
    if (slot === 'eyes') {
      const ball = this.material('eyes', spec.eye.tex + '|' + (spec.eye.tint || ''), () => {
        const m = new MeshStandardMaterial({ map: tx[this._A.meta.eyeTex[spec.eye.tex]], roughness: .38, metalness: 0, envMapIntensity: .55 });
        if (spec.eye.tint) m.color.set(spec.eye.tint); return m;
      });
      const cornea = this.material('cornea', '1', () => new MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, metalness: 0, transparent: true, opacity: .16, depthWrite: false, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: .02 }));
      return [ball, cornea];
    }
    if (slot === 'outfit' || slot === 'shoes') return this.material('cloth', pr.id, () => new MeshStandardMaterial({ map: tx[pr.tex], normalMap: pr.nrm ? tx[pr.nrm] : null, roughness: .86, metalness: 0, envMapIntensity: .35, side: DoubleSide }));
    /* شعر/حاجب/رمش/لحية: رمادي × لون الشعر، شفافية بقص + تغطية (alphaToCoverage) */
    const col = slot === 'brows' ? '#' + new Color(spec.browColor || '#2a1d14').multiplyScalar(.82).getHexString() : slot === 'beard' ? spec.beardColor : slot === 'lashes' ? '#1a1310' : spec.hairColor;
    const fine = slot === 'brows' || slot === 'lashes';   /* الحاجب/الرمش: مزج ناعم (القص يجعلها متقطعة) — صغيرة فلا مشكلة ترتيب */
    const m = this.material('hair', pr.id, () => new MeshStandardMaterial({ map: tx[pr.tex], alphaTest: fine ? .04 : .38, transparent: fine, depthWrite: !fine, alphaToCoverage: !fine, side: DoubleSide, roughness: slot === 'hair' ? .52 : .7, metalness: 0, envMapIntensity: .45 }));
    m.color.set(col || '#2a1d14'); return m;
  }
  shellMat(sh, tx, col) {
    const key = sh.region + ':' + (sh.sparse || 0) + ':' + (sh.rep || 0);
    const m = this.material('shell', key, () => {
      const u = { uStrands: { value: tx[this._A.meta.strands] }, uRep: { value: sh.rep || 60 }, uSparse: { value: sh.sparse || 0 }, uHairCol: { value: new Color() } };
      const mm = new MeshStandardMaterial({ map: tx[this._A.meta.strands], roughness: .7, metalness: 0, envMapIntensity: .3, side: DoubleSide });
      mm.onBeforeCompile = s2 => {
        Object.assign(s2.uniforms, u);
        s2.vertexShader = s2.vertexShader.replace(SHELL_V[0], SHELL_V[1]).replace(SHELL_V[2], SHELL_V[3]);
        s2.fragmentShader = s2.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uStrands;uniform float uRep;uniform float uSparse;uniform vec3 uHairCol;varying float vDens;varying float vLay;')
          .replace('#include <map_fragment>', SHELL_F);
      };
      mm.customProgramCacheKey = () => 'codis-shell'; mm.userData.u = u; return mm;
    });
    m.userData.u.uHairCol.value.set(col || '#2a1d14'); return m;
  }
  /* --- الكاميرا: الجسم كاملاً ⇄ الوجه/الرأس --- */
  frame(z, cam, R) {
    R = R || this.cur; if (!R) return;
    cam = cam || this.camera; const box = R.box, h = box.max.y - box.min.y, fov = MathUtils.degToRad(cam.fov), asp = cam.aspect, tf = Math.tan(fov / 2);
    const bodyH = h * 1.1, bodyW = Math.max(.6, (box.max.x - box.min.x) * 1.12);
    const dFull = Math.max(bodyH / 2 / tf, bodyW / 2 / (tf * asp));
    const hair = this.focus === 'hair', eyes = this.focus === 'eyes', faceH = hair ? .5 : eyes ? .075 : .34, faceW = hair ? .42 : eyes ? .135 : .28;
    const dFace = Math.max(faceH / 2 / tf, faceW / 2 / (tf * asp));
    const fy = hair ? R.headC.y - .015 : eyes ? R.eyeC.y + .002 : R.headC.y - .015;
    const e = z * z * (3 - 2 * z), ty = MathUtils.lerp(box.min.y + h * .5, fy, e), d = MathUtils.lerp(dFull, dFace, e);
    const tz = MathUtils.lerp(0, eyes ? R.eyeC.z - .02 : R.headC.z, e), elev = MathUtils.lerp(.05, eyes ? 0 : .015, e);
    cam.position.set(0, ty + d * elev, tz + d); cam.lookAt(0, ty, tz); cam.updateMatrixWorld();
  }
  kick() { if (this.disposed || this.lost || !this.visible || document.hidden) return; this.dirty = true; if (!this.running) { this.running = true; this.lastT = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t)); } }
  stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  loop(t) {
    if (!this.running) return;
    const dt = Math.min(.05, (t - this.lastT) / 1000); this.lastT = t;
    let busy = false;
    if (Math.abs(this.vyaw) > 1e-4) { this.yaw += this.vyaw; this.vyaw *= Math.pow(.0025, dt); busy = true; } else this.vyaw = 0;
    const dz = this.zoomT - this.zoom; if (Math.abs(dz) > 1e-3) { this.zoom += dz * (1 - Math.pow(.0005, dt)); busy = true; } else this.zoom = this.zoomT;
    const idle = !this.reduced && this.o.idle !== false;
    if (this.cur && idle) this.breathe((t - this.t0) / 1000);
    if (busy || idle || this.dirty) {
      if (busy || this.dirty || (this.frameSkip = (this.frameSkip + 1) % 2) === 0) this.render();
      this.dirty = false; this.raf = requestAnimationFrame(x => this.loop(x));
    } else this.running = false;
  }
  breathe(s, R) {
    R = R || this.cur; const b = R.byName, q = new Quaternion(), X = new Vector3(1, 0, 0), Zv = new Vector3(0, 0, 1);
    const br = Math.sin(s * 1.6) * .01, sw = Math.sin(s * .55) * .008;
    for (const [k, a, ax] of [['spine03', br, X], ['spine01', br * .6, X], ['neck01', -br * .5, X], ['head', sw, Zv]]) if (b[k] && R.restQ[k]) b[k].quaternion.copy(R.restQ[k]).multiply(q.setFromAxisAngle(ax, a));
  }
  render() {
    if (this.lost || this.disposed) return;
    this.turn.rotation.y = this.yaw; this.frame(this.zoom);
    this.renderer.render(this.scene, this.camera);
  }
  /* لقطة مصغّرة: داخل الطابور، على شخص اللقطات المنفصل؛ تُرسم وتُقرأ في المهمة نفسها (لا وميض ولا تعارض مع المعاينة) */
  snapshot(spec, o) {
    o = o || {};
    return this.run(async () => {
      if (this.disposed || this.lost) return '';
      await this.apply(spec, true); if (this.disposed || !this.tcur) return '';
      const T = this.tcur, vis = {}; for (const k in this.rigs) { vis[k] = this.rigs[k].root.visible; this.rigs[k].root.visible = this.rigs[k] === T; }
      const prevF = this.focus; this.focus = o.focus || 'face';
      this.turn.rotation.y = o.yaw == null ? -.32 : o.yaw; if (this.o.idle !== false) this.breathe(0, T);
      const cam = this.camera.clone(); cam.aspect = o.aspect || 1; cam.updateProjectionMatrix();
      const S = o.size || 160, W = Math.round(S * (o.aspect || 1)), H = S;
      /* هدف رسم بحجم اللقطة نفسها (لا قص من إطار العرض) */
      const r = this.renderer, oldPR = r.getPixelRatio(), oldW = this.W, oldH = this.H;
      r.setPixelRatio(1); r.setSize(W * 2, H * 2, false);
      this.frame(o.z == null ? 1 : o.z, cam, T); r.render(this.scene, cam);
      let url = ''; try { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(this.canvas, 0, 0, W * 2, H * 2, 0, 0, W, H); url = c.toDataURL('image/png');   /* PNG: شفافية بلا كتل (WebP المضغوط يطبع مربعات رمادية حول الحواف) */ } catch (e) {}
      for (const k in vis) this.rigs[k].root.visible = vis[k];
      r.setPixelRatio(oldPR); this.W = this.H = 0; this.resize(); this.focus = prevF;
      this.render();
      return url;
    });
  }
  dispose() {
    if (this.disposed) return; this.disposed = true; this.stop(); this.gen++;
    for (const [el, ev, fn, op] of this.L) el.removeEventListener(ev, fn, op);
    try { this.ro && this.ro.disconnect(); this.io && this.io.disconnect(); } catch (e) {}
    for (const k in this.rigs) this.rigs[k].dispose();
    for (const k in this.mats) { try { this.mats[k].dispose(); } catch (e) {} }
    for (const k in this.tex) this.tex[k].then(t => t.dispose(), () => {});
    try { this.shadow.geometry.dispose(); this.shadow.material.dispose(); this.shadowT.dispose(); this.env.dispose(); } catch (e) {}
    try { this.renderer.dispose(); this.renderer.forceContextLoss(); } catch (e) {}
    try { this.canvas.remove(); } catch (e) {}
    this.rigs = {}; this.tex = {}; this.mats = {}; this.scene = null; this._data = null;
  }
}

export function create(host, o) { return new CharView(host, o); }
