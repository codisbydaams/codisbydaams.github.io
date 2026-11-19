/* CODIS-V73 — عارض الشخصية البشرية (CodisB3D.char v3) — يحل محل V72.
   • نفس نسخة Three.js المضمّنة لمشاهد الصناديق (لا نسخة ثانية).
   • الأصل: حاوية واحدة codis_char_v73.bin (CDC3، اختيارياً gzip) من tools/char3d/v73/build.py — الأساس MakeHuman (CC0).
   • الجسم: مواضع = بنية (int16) + طول + أهداف أصلية متفرقة ⇒ تقسيم Catmull–Clark بمستوى واحد (خطّي ⇒ يُطبَّق بعد أي مزج)
     ⇒ 107 ألف مثلث بسطح ناعم (الحواف/الأذن/الأصابع بلا تضليع) — المستوى المنخفض يرسم الشبكة الأصلية.
   • الجلد: PBR مادي + تشتت تحت السطح «مُدمج مسبقاً» (Penner 2011؛ جدول من ملف تشتت d'Eon) بانحناء لكل رأس يُحسب مع كل شكل
     + نفاذية للأجزاء الرقيقة (الأذن/الأنف/الأصابع، سماكة مخبوزة) + إطباق محيطي مخبوز + طبقة لمعان ثانية + خريطة مناطق (خشونة/احمرار).
   • الشعر/اللحية/الحواجب: بطاقات خصل مولّدة، تظليل Kajiya–Kay بفصّين مُزاحين (Scheuermann 2004)، تغطية ألفا + MSAA، ظلال ذاتية.
   • العين: انكسار القزحية (إزاحة منظور تحت القرنية)، قرنية لامعة، تظليل الجفن على الصلبة.
   • الملابس: مولّدة من سطح الجسم المقسَّم نفسه (قص دقيق عند الحواف + سماكة الحافة + إزاحة وتنعيم) ⇒ تتبع كل بنية ومنزلق بلا اختراق.
   • الإضاءة: استوديو (رئيسية بظل ناعم + تعبئة + حافتان + بيئة PMREM) + ظل ملامس للأرض، تحويل ألوان Khronos PBR Neutral.
   • الحركة: تنفّس + رمش طبيعي (دوران الجفن حول مركز العين بأوزان MakeHuman) — تتوقف مع تقليل الحركة.
   • التزامن/الموارد كما V72: طابور واحد، آخر طلب يفوز، وعد الأصل يُخزَّن لحظة البدء ويُصفَّر عند الفشل، الرسم فقط ما دام ظاهراً، تحرير كامل. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, MeshPhysicalMaterial, MeshDepthMaterial, ShadowMaterial,
  PlaneGeometry, SphereGeometry, BackSide, DoubleSide, FrontSide, HemisphereLight, DirectionalLight, SRGBColorSpace, NoColorSpace, NeutralToneMapping,
  PMREMGenerator, Vector3, Vector2, Quaternion, Matrix4, Box3, BufferGeometry, BufferAttribute, Uint8BufferAttribute, CanvasTexture, Texture,
  RepeatWrapping, ClampToEdgeWrapping, Bone, Skeleton, SkinnedMesh, MathUtils, LinearFilter, PCFSoftShadowMap, RGBADepthPacking
} from 'three';

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const TYPES = { int8: Int8Array, int16: Int16Array, uint16: Uint16Array, uint8: Uint8Array, float32: Float32Array, uint32: Uint32Array, int32: Int32Array };
const fail = (code, msg) => Object.assign(new Error(msg || code), { code });
/* مولّد بذرة ثابت (mulberry32) + بصمة نص (FNV-1a) — قيم البطاقات العشوائية تُشتق حتمياً ولا تُخزَّن */
const rnd32 = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hashStr = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------- الحاوية CDC3 (gzip اختياري) ---------- */
export async function unpack(buf) {
  const u8 = new Uint8Array(buf);
  if (u8.length > 18 && u8[0] === 0x1f && u8[1] === 0x8b) {
    if (typeof DecompressionStream === 'function') {
      try { return await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); } catch (e) {}
    }
    try { return gunzip(u8).buffer; } catch (e) { throw fail('parse', 'char asset: gzip'); }   /* Safari < 16.4: فك ذاتي */
  }
  return buf;
}
/* فك gzip/deflate ذاتي (RFC 1951/1952) — بديل لمتصفحات بلا DecompressionStream؛ خوارزمية tinf (شجرة قانونية) */
const LB = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258], LX = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DB = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577], DX = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const CLO = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
export function gunzip(u8) {
  if (u8[0] !== 0x1f || u8[1] !== 0x8b || u8[2] !== 8) throw new Error('gzip header');
  const flg = u8[3]; let p = 10;
  if (flg & 4) p += 2 + (u8[p] | u8[p + 1] << 8); if (flg & 8) { while (u8[p++]); } if (flg & 16) { while (u8[p++]); } if (flg & 2) p += 2;
  const n = u8.length, size = (u8[n - 4] | u8[n - 3] << 8 | u8[n - 2] << 16 | u8[n - 1] << 24) >>> 0, out = new Uint8Array(size);
  let tag = 0, bits = 0, op = 0;
  const bit = () => { if (!bits) { tag = u8[p++]; bits = 8; } const b = tag & 1; tag >>>= 1; bits--; return b; };
  const rd = k => { let v = 0; for (let i = 0; i < k; i++) v |= bit() << i; return v; };
  const tree = () => ({ c: new Uint16Array(16), s: new Uint16Array(320) });
  const build = (t, L, off, num) => { t.c.fill(0); for (let i = 0; i < num; i++) t.c[L[off + i]]++; t.c[0] = 0; const o = new Uint16Array(16); for (let i = 0, s = 0; i < 16; i++) { o[i] = s; s += t.c[i]; } for (let i = 0; i < num; i++) if (L[off + i]) t.s[o[L[off + i]]++] = i; };
  const dec = t => { let sum = 0, cur = 0, len = 0; do { cur = 2 * cur + bit(); len++; sum += t.c[len]; cur -= t.c[len]; } while (cur >= 0); return t.s[sum + cur]; };
  const flt = tree(), fdt = tree(), lt = tree(), dt = tree(), ct = tree(), L = new Uint8Array(320);
  for (let i = 0; i < 144; i++) L[i] = 8; for (let i = 144; i < 256; i++) L[i] = 9; for (let i = 256; i < 280; i++) L[i] = 7; for (let i = 280; i < 288; i++) L[i] = 8; build(flt, L, 0, 288);
  for (let i = 0; i < 30; i++) L[i] = 5; build(fdt, L, 0, 30);
  let fin = 0;
  do {
    fin = bit(); const type = rd(2);
    if (type === 0) { bits = 0; const len = u8[p] | u8[p + 1] << 8; p += 4; out.set(u8.subarray(p, p + len), op); p += len; op += len; continue; }
    let T1 = flt, T2 = fdt;
    if (type === 2) {
      const hl = rd(5) + 257, hd = rd(5) + 1, hc = rd(4) + 4; L.fill(0);
      for (let i = 0; i < hc; i++) L[CLO[i]] = rd(3); build(ct, L, 0, 19);
      const LL = new Uint8Array(hl + hd); let i = 0;
      while (i < hl + hd) { const s = dec(ct); if (s < 16) LL[i++] = s; else if (s === 16) { const v = LL[i - 1], r = rd(2) + 3; for (let k = 0; k < r; k++) LL[i++] = v; } else if (s === 17) { const r = rd(3) + 3; i += r; } else { const r = rd(7) + 11; i += r; } }
      build(lt, LL, 0, hl); build(dt, LL, hl, hd); T1 = lt; T2 = dt;
    } else if (type !== 1) throw new Error('deflate type');
    for (;;) {
      let s = dec(T1); if (s < 256) { out[op++] = s; continue; } if (s === 256) break;
      s -= 257; const len = rd(LX[s]) + LB[s], ds = dec(T2), dist = rd(DX[ds]) + DB[ds];
      for (let k = 0; k < len; k++, op++) out[op] = out[op - dist];
    }
  } while (!fin);
  return out;
}
export function parseCDC(buf) {
  const u8 = new Uint8Array(buf);
  if (u8.length < 8 || String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== 'CDC3') throw fail('parse', 'char asset: bad header');
  let meta; const jl = new DataView(buf).getUint32(4, true);
  try { meta = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + jl))); } catch (e) { throw fail('parse', 'char asset: json'); }
  const base = 8 + jl, cache = {};
  const get = name => {
    if (cache[name]) return cache[name];
    const b = meta.blobs[name]; if (!b) throw fail('missing', 'char asset: missing ' + name);
    if (base + b[0] + b[1] > buf.byteLength) throw fail('parse', 'char asset: truncated');
    const T = TYPES[b[2]]; const v = T ? new T(buf, base + b[0], b[1] / T.BYTES_PER_ELEMENT) : u8.subarray(base + b[0], base + b[0] + b[1]);
    return (cache[name] = v);
  };
  const mime = name => meta.blobs[name] && meta.blobs[name][2];
  const tg = {}; for (const [n, o, c, sc] of meta.targets) tg[n] = [o, c, sc];
  return { meta, get, mime, tg, tgI: get(meta.tgIdx), tgD: get(meta.tgD), byId: Object.fromEntries(meta.proxies.map(p => [p.id, p])) };
}

/* ---------- خامة من صورة داخل الحاوية (blob: مسموح بالـCSP؛ fetch(blob:) ممنوع) ---------- */
function loadTex(A, name, o) {
  o = o || {};
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(new Blob([A.get(name)], { type: A.mime(name) })), im = new Image();
    im.decoding = 'async';
    im.onload = () => {
      URL.revokeObjectURL(url);
      const t = new Texture(im); t.colorSpace = o.linear ? NoColorSpace : SRGBColorSpace; t.flipY = o.flipY !== false; t.anisotropy = o.aniso || 4;
      t.wrapS = t.wrapT = o.repeat ? RepeatWrapping : ClampToEdgeWrapping;
      if (o.crisp) { t.generateMipmaps = false; t.minFilter = LinearFilter; }
      t.needsUpdate = true; ok(t);
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(fail('decode', 'char texture decode: ' + name)); };
    im.src = url;
  });
}

/* ---------- بيئة استوديو (PMREM): صناديق ضوء ناعمة + ارتداد أرضي دافئ ---------- */
function makeEnv(renderer) {
  const sc = new Scene();
  sc.add(new Mesh(new SphereGeometry(20, 32, 16), new MeshBasicMaterial({ side: BackSide, color: new Color(.16, .155, .15) })));
  const panel = (c, i, x, y, z, w, h) => { const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(c).multiplyScalar(i), side: DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1.2, 0); sc.add(m); };
  panel(0xfff0e0, 3.2, -6, 7, 7, 7, 6);       /* رئيسية دافئة كبيرة */
  panel(0xf2f4ff, 1.15, 8, 4, 5, 5, 7);       /* تعبئة محايدة */
  panel(0xdfe8ff, 2.4, 5, 6, -7, 2, 9);       /* حافة باردة */
  panel(0xffe6d2, 1.4, -6, 5, -6, 2, 8);      /* حافة دافئة */
  panel(0xffffff, 1.1, 0, 13, 1, 9, 5);       /* سقف */
  const fl = new Mesh(new PlaneGeometry(40, 40), new MeshBasicMaterial({ color: new Color(.42, .37, .33), side: DoubleSide })); fl.rotation.x = -Math.PI / 2; fl.position.y = -1.5; sc.add(fl);
  const pm = new PMREMGenerator(renderer), rt = pm.fromScene(sc, .035); pm.dispose();
  sc.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt;
}
function blobShadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 3, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.42)'); g.addColorStop(.5, 'rgba(0,0,0,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

/* =====================================================================
   Topo — طوبولوجيا الجسم الرباعي المغلق + تقسيم Catmull–Clark (مشتركة بين كل الأشخاص)
   الفهرسة: [0..nv) نقاط الرؤوس (المساعدات تنتقل بفرق أقرب رأس جسم) · [nv..nv+ne) الحواف · [..+nf) الوجوه
   ===================================================================== */
class Topo {
  constructor(A) {
    const M = A.meta, nv = M.nv, q = A.get(M.body.q4), nf = q.length / 4;
    this.nv = nv; this.nf = nf; this.q = q; this.uvq = A.get(M.body.uv); this.near = A.get(M.body.near);
    const fe = new Int32Array(nf * 4), map = new Map(), ea = [], eb = [];
    for (let f = 0; f < nf; f++) for (let k = 0; k < 4; k++) {
      const a = q[f * 4 + k], b = q[f * 4 + ((k + 1) & 3)], lo = a < b ? a : b, hi = a < b ? b : a, key = lo * nv + hi;
      let e = map.get(key); if (e === undefined) { e = ea.length; map.set(key, e); ea.push(lo); eb.push(hi); }
      fe[f * 4 + k] = e;
    }
    const ne = ea.length; this.ne = ne; this.ea = Int32Array.from(ea); this.eb = Int32Array.from(eb); this.fe = fe;
    const ef = new Int32Array(ne * 2).fill(-1);
    for (let f = 0; f < nf; f++) for (let k = 0; k < 4; k++) { const e = fe[f * 4 + k]; if (ef[e * 2] < 0) ef[e * 2] = f; else ef[e * 2 + 1] = f; }
    this.ef = ef;
    const vfc = new Int32Array(nv + 1), vec = new Int32Array(nv + 1);
    for (let i = 0; i < nf * 4; i++) vfc[q[i] + 1]++;
    for (let e = 0; e < ne; e++) { vec[this.ea[e] + 1]++; vec[this.eb[e] + 1]++; }
    for (let i = 0; i < nv; i++) { vfc[i + 1] += vfc[i]; vec[i + 1] += vec[i]; }
    const vf = new Int32Array(nf * 4), ve = new Int32Array(ne * 2), cf = vfc.slice(0, nv), ce = vec.slice(0, nv);
    for (let f = 0; f < nf; f++) for (let k = 0; k < 4; k++) { const v = q[f * 4 + k]; vf[cf[v]++] = f; }
    for (let e = 0; e < ne; e++) { ve[ce[this.ea[e]]++] = e; ve[ce[this.eb[e]]++] = e; }
    this.vfc = vfc; this.vf = vf; this.vec = vec; this.ve = ve;
    this.isBody = new Uint8Array(nv); for (let i = 0; i < nf * 4; i++) this.isBody[q[i]] = 1;
    this.nsv = nv + ne + nf;
    const sq = new Uint32Array(nf * 16);
    for (let f = 0; f < nf; f++) for (let k = 0; k < 4; k++) {
      const o = (f * 4 + k) * 4; sq[o] = q[f * 4 + k]; sq[o + 1] = nv + fe[f * 4 + k]; sq[o + 2] = nv + ne + f; sq[o + 3] = nv + fe[f * 4 + ((k + 3) & 3)];
    }
    this.sq = sq; this.rm = {}; this.wts = null;
  }
  /* مواضع (أو أي حقل خطي بعرض c) ⇒ المستوى الأول. P: nv*c ⇒ S: nsv*c */
  subdivide(P, S, c) {
    c = c || 3; const { nv, ne, nf, q, ea, eb, ef, vfc, vf, vec, ve, isBody, near } = this, oE = nv * c, oF = (nv + ne) * c;
    for (let f = 0; f < nf; f++) { const a = q[f * 4] * c, b = q[f * 4 + 1] * c, d = q[f * 4 + 2] * c, e = q[f * 4 + 3] * c, o = oF + f * c; for (let k = 0; k < c; k++) S[o + k] = (P[a + k] + P[b + k] + P[d + k] + P[e + k]) * .25; }
    for (let e = 0; e < ne; e++) { const a = ea[e] * c, b = eb[e] * c, f0 = oF + ef[e * 2] * c, f1 = oF + ef[e * 2 + 1] * c, o = oE + e * c; for (let k = 0; k < c; k++) S[o + k] = (P[a + k] + P[b + k] + S[f0 + k] + S[f1 + k]) * .25; }
    const fa = new Float64Array(c), ra = new Float64Array(c);
    for (let v = 0; v < nv; v++) {
      if (!isBody[v]) continue;
      const n = vec[v + 1] - vec[v], nfv = vfc[v + 1] - vfc[v], o = v * c; fa.fill(0); ra.fill(0);
      for (let i = vfc[v]; i < vfc[v + 1]; i++) { const f = oF + vf[i] * c; for (let k = 0; k < c; k++) fa[k] += S[f + k]; }
      for (let i = vec[v]; i < vec[v + 1]; i++) { const e = ve[i], a = ea[e] * c, b = eb[e] * c; for (let k = 0; k < c; k++) ra[k] += (P[a + k] + P[b + k]) * .5; }
      for (let k = 0; k < c; k++) S[o + k] = (fa[k] / nfv + 2 * ra[k] / n + (n - 3) * P[o + k]) / n;
    }
    for (let v = 0; v < nv; v++) if (!isBody[v]) { const m = near[v] * c, o = v * c; for (let k = 0; k < c; k++) S[o + k] = P[o + k] + (S[m + k] - P[m + k]); }
    return S;
  }
  /* عموديات ملحومة على الرباعيات (sub = المقسّمة أو الأصلية) */
  normals(S, N, sub) {
    const Q = sub ? this.sq : this.q, nq = Q.length / 4; N.fill(0);
    for (let i = 0; i < nq; i++) {
      const a = Q[i * 4] * 3, b = Q[i * 4 + 1] * 3, c = Q[i * 4 + 2] * 3, d = Q[i * 4 + 3] * 3;
      const ux = S[c] - S[a], uy = S[c + 1] - S[a + 1], uz = S[c + 2] - S[a + 2], vx = S[d] - S[b], vy = S[d + 1] - S[b + 1], vz = S[d + 2] - S[b + 2];
      const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx;
      N[a] += x; N[a + 1] += y; N[a + 2] += z; N[b] += x; N[b + 1] += y; N[b + 2] += z; N[c] += x; N[c + 1] += y; N[c + 2] += z; N[d] += x; N[d + 1] += y; N[d + 2] += z;
    }
    for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]); if (l > 0) { N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; } }
  }
  /* الانحناء المتوسط التقريبي لكل رأس (1/م): متوسط (Δn·Δp)/|Δp|² على أضلاع الرباعيات */
  curvature(S, N, out, sub) {
    const Q = sub ? this.sq : this.q, nq = Q.length / 4, cnt = this._cc || (this._cc = new Float32Array(this.nsv)); out.fill(0); cnt.fill(0);
    for (let i = 0; i < nq; i++) for (let k = 0; k < 4; k++) {
      const a = Q[i * 4 + k], b = Q[i * 4 + ((k + 1) & 3)], A3 = a * 3, B3 = b * 3;
      const dx = S[B3] - S[A3], dy = S[B3 + 1] - S[A3 + 1], dz = S[B3 + 2] - S[A3 + 2], l2 = dx * dx + dy * dy + dz * dz; if (l2 <= 0) continue;
      const kk = ((N[B3] - N[A3]) * dx + (N[B3 + 1] - N[A3 + 1]) * dy + (N[B3 + 2] - N[A3 + 2]) * dz) / l2;
      out[a] += kk; out[b] += kk; cnt[a]++; cnt[b]++;
    }
    for (let i = 0; i < out.length; i++) if (cnt[i]) out[i] /= cnt[i];
  }
  /* رؤوس الرسم (فك اللحام عند حدود UV فقط) */
  render(sub) {
    const key = sub ? 's' : 'b'; if (this.rm[key]) return this.rm[key];
    const { nf, q, uvq, nsv } = this, Q = sub ? this.sq : q, nq = Q.length / 4;
    const first = new Int32Array(nsv).fill(-1), fu = new Float32Array(nsv * 2), extra = new Map(), rv2sv = [], uvs = [], corner = new Int32Array(nq * 4);
    const cu = new Float32Array(8), U = (f, k) => uvq[(f * 4 + (k & 3)) * 2] / 65535, V = (f, k) => uvq[(f * 4 + (k & 3)) * 2 + 1] / 65535;
    for (let i = 0; i < nq; i++) {
      if (sub) { const f = i >> 2, k = i & 3, mu = (U(f, 0) + U(f, 1) + U(f, 2) + U(f, 3)) / 4, mv = (V(f, 0) + V(f, 1) + V(f, 2) + V(f, 3)) / 4;
        cu[0] = U(f, k); cu[1] = V(f, k); cu[2] = (U(f, k) + U(f, k + 1)) / 2; cu[3] = (V(f, k) + V(f, k + 1)) / 2; cu[4] = mu; cu[5] = mv; cu[6] = (U(f, k) + U(f, k + 3)) / 2; cu[7] = (V(f, k) + V(f, k + 3)) / 2;
      } else for (let k = 0; k < 4; k++) { cu[k * 2] = U(i, k); cu[k * 2 + 1] = V(i, k); }
      for (let k = 0; k < 4; k++) {
        const sv = Q[i * 4 + k], u = cu[k * 2], v = cu[k * 2 + 1]; let rv = first[sv];
        if (rv < 0) { rv = rv2sv.length; first[sv] = rv; rv2sv.push(sv); uvs.push(u, v); fu[sv * 2] = u; fu[sv * 2 + 1] = v; }
        else if (Math.abs(fu[sv * 2] - u) + Math.abs(fu[sv * 2 + 1] - v) > 1e-6) {
          const kk = sv + ':' + Math.round(u * 65535) + ':' + Math.round(v * 65535); rv = extra.get(kk);
          if (rv === undefined) { rv = rv2sv.length; extra.set(kk, rv); rv2sv.push(sv); uvs.push(u, v); }
        }
        corner[i * 4 + k] = rv;
      }
    }
    const idx = new Uint32Array(nq * 6), qf = new Uint32Array(nq * 2);
    for (let i = 0; i < nq; i++) { const c = corner, o = i * 6; idx[o] = c[i * 4]; idx[o + 1] = c[i * 4 + 1]; idx[o + 2] = c[i * 4 + 2]; idx[o + 3] = c[i * 4]; idx[o + 4] = c[i * 4 + 2]; idx[o + 5] = c[i * 4 + 3]; qf[i * 2] = qf[i * 2 + 1] = sub ? i >> 2 : i; }
    return (this.rm[key] = { sub, rv2sv: Uint32Array.from(rv2sv), uv: Float32Array.from(uvs), idx, triFace: qf, n: rv2sv.length });
  }
  /* أوزان العظام لكل رأس مقسّم: النقاط الأصلية كما هي، الحواف/الوجوه متوسط ثم أعلى 4 */
  weights(J, W, nb) {
    if (this.wts) return this.wts;
    const { nv, ne, nf, q, ea, eb, nsv } = this, sj = new Uint8Array(nsv * 4), sw = new Uint8Array(nsv * 4), acc = new Float32Array(nb), touched = [];
    sj.set(J.subarray(0, nv * 4)); sw.set(W.subarray(0, nv * 4));
    const merge = (list, o) => {
      touched.length = 0;
      for (const v of list) for (let m = 0; m < 4; m++) { const w = W[v * 4 + m]; if (!w) continue; const j = J[v * 4 + m]; if (!acc[j]) touched.push(j); acc[j] += w; }
      touched.sort((a, b) => acc[b] - acc[a]); let s = 0; const k4 = Math.min(4, touched.length); for (let i = 0; i < k4; i++) s += acc[touched[i]];
      let r = 255; for (let i = 0; i < k4; i++) { const j = touched[i], w8 = i === k4 - 1 ? r : Math.min(r, Math.round(acc[j] / s * 255)); sj[o * 4 + i] = j; sw[o * 4 + i] = w8; r -= w8; }
      for (const j of touched) acc[j] = 0;
    };
    for (let e = 0; e < ne; e++) merge([ea[e], eb[e]], nv + e);
    for (let f = 0; f < nf; f++) merge([q[f * 4], q[f * 4 + 1], q[f * 4 + 2], q[f * 4 + 3]], nv + ne + f);
    return (this.wts = { sj, sw });
  }
}

/* =====================================================================
   المواد
   ===================================================================== */
/* الجلد: RE_Direct مخصّص (تشتت مُدمج مسبقاً + نفاذية) + AO مخبوز + لون مزدوج/مناطق + ظلال الشعر/اللحية */
const SKIN_PARS = `
uniform sampler2D uLUT; uniform sampler2D uSkin2; uniform sampler2D uRegion; uniform sampler2D uStub;
uniform float uSkinMix; uniform vec3 uSkinTint; uniform vec3 uUnder; uniform float uRed; uniform float uBuzz;
uniform vec3 uScalpCol; uniform float uScalpAmt; uniform vec3 uBeardCol; uniform float uBeardAmt; uniform float uStubRep; uniform float uTrans;
varying float vCv; varying float vAO; varying float vTh; varying vec3 vHM;
vec3 gSkinN; float gRed; float gCov = 0.;
void RE_Direct_Skin( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
  vec3 Nd = normalize( mix( gSkinN, geometryNormal, .35 ) );
  float ndl = dot( Nd, directLight.direction );
  vec3 sss = texture2D( uLUT, vec2( ndl * .5 + .5, clamp( vCv, .0, 1. ) ) ).rgb;
  float lit = mix( 1., vAO, .45 );
  reflectedLight.directDiffuse += sss * directLight.color * BRDF_Lambert( material.diffuseColor ) * lit;
  vec3 Lt = normalize( directLight.direction + Nd * .28 );
  float tr = pow( saturate( dot( geometryViewDir, -Lt ) ), 3. ) * 1.4 + .06;
  reflectedLight.directDiffuse += tr * vTh * uTrans * directLight.color * material.diffuseColor * vec3( 1., .32, .2 );
  float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
  vec3 irradiance = dotNL * directLight.color * lit;
  #ifdef USE_CLEARCOAT
    float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
    clearcoatSpecularDirect += dotNLcc * directLight.color * lit * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
  #endif
  reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
}
#undef RE_Direct
#define RE_Direct RE_Direct_Skin`;
const SKIN_MAP = `#include <map_fragment>
#ifdef USE_MAP
{ vec3 c2 = texture2D( uSkin2, vMapUv ).rgb; diffuseColor.rgb = mix( diffuseColor.rgb, c2, uSkinMix ); }
vec4 rg = texture2D( uRegion, vMapUv ); gRed = rg.r;
diffuseColor.rgb *= uSkinTint * uUnder;
diffuseColor.rgb *= mix( vec3( 1. ), vec3( 1.04, .86, .84 ), gRed * uRed );
#endif
#ifdef USE_NORMALMAP
{ vec3 dn = texture2D( normalMap, vNormalMapUv ).xyz * 2. - 1.; diffuseColor.rgb *= 1. - clamp( ( 1. - dn.z ) * 1.8, 0., .22 ); }
#endif
{ float st = texture2D( uStub, vMapUv * uStubRep ).r;
  float nv = abs( dot( normalize( vNormal ), normalize( vViewPosition ) ) );
  float bd = vHM.y * uBeardAmt, sd = max( vHM.x * uScalpAmt, vHM.z * uBuzz ) * ( 1. + .45 * ( 1. - nv ) * ( 1. - nv ) );
  float bc = clamp( bd * ( .45 + .75 * st ), 0., .92 ), sc = clamp( sd * ( .72 + .4 * st ), 0., .97 );
  diffuseColor.rgb = mix( diffuseColor.rgb, uBeardCol, bc );
  diffuseColor.rgb = mix( diffuseColor.rgb, uScalpCol, sc );
  gCov = max( sc, bc * .8 ); }`;
const SKIN_AO = `#include <aomap_fragment>
{ reflectedLight.indirectDiffuse *= vAO;
  #if defined( USE_CLEARCOAT )
  clearcoatSpecularIndirect *= vAO;
  #endif
  float dnv = saturate( dot( geometryNormal, geometryViewDir ) );
  reflectedLight.indirectSpecular *= computeSpecularOcclusion( dnv, vAO, material.roughness ); }`;
const SKIN_COV = `#include <lights_physical_fragment>
material.specularColor *= 1. - .6 * gCov; material.specularF90 *= 1. - .6 * gCov;
#ifdef USE_CLEARCOAT
material.clearcoat *= 1. - gCov;
#endif`;
function skinMaterial(U) {
  const m = new MeshPhysicalMaterial({ roughness: 1, metalness: 0, ior: 1.4, specularIntensity: .9, clearcoat: .16, clearcoatRoughness: .36, envMapIntensity: .75 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aCv; attribute float aAO; attribute float aTh; attribute vec3 aHM; attribute vec3 aBk; uniform float uBlink; varying float vCv; varying float vAO; varying float vTh; varying vec3 vHM;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += aBk * uBlink; vCv = sqrt( clamp( abs( aCv ) / 520., 0., 1. ) ); vAO = aAO; vTh = aTh; vHM = aHM;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', '#include <lights_physical_pars_fragment>\n' + SKIN_PARS)
      .replace('#include <map_fragment>', SKIN_MAP)
      .replace('#include <normal_fragment_maps>', 'gSkinN = normal;\n#include <normal_fragment_maps>')
      .replace('#include <aomap_fragment>', SKIN_AO)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, .95, gCov );')
      .replace('#include <lights_physical_fragment>', SKIN_COV);
  };
  m.customProgramCacheKey = () => 'codis-skin4';
  return m;
}

/* ظل الشعر: الشعر نصف شفاف للضوء ⇒ تغطية الظل = ألفا الخصلة × HAIR_SHADOW بتنقيط Bayer 4×4 ثابت بفضاء خريطة الظل؛
   فلتر PCF الناعم (4×4 خانات) يحوّله لظل جزئي ناعم الحافة. (كان alphaTest .5 ⇒ ظل معتم حاد: «مستطيل» ذيل الحصان على الرقبة) */
const HAIR_SHADOW = .6;
function hairDepthMaterial(map) {
  const m = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: map || null });
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <alphatest_fragment>', `{ vec2 q = floor( gl_FragCoord.xy ), h = floor( q * .5 );
  float t = fract( h.x * .5 + h.y * h.y * .75 ) * .25 + fract( q.x * .5 + q.y * q.y * .75 ) + .03125;
  if ( diffuseColor.a * ${HAIR_SHADOW.toFixed(2)} <= t ) discard; }`);
  };
  m.customProgramCacheKey = () => 'codis-hair-depth';
  return m;
}

/* الشعر: Kajiya–Kay بفصّين مُزاحين + انتشار ملفوف + عمق داخل الكتلة (ظل ذاتي) + تدرّج الجذر/الطرف */
const HAIR_PARS = `
uniform vec3 uHairCol; uniform vec3 uTipCol; uniform float uA2C; uniform float uShift1; uniform float uShift2; uniform float uSpec1; uniform float uSpec2; uniform float uExp1; uniform float uExp2;
varying vec3 vHT; varying float vHD; varying float vHR; varying float vHC; float gStrand;
void RE_Direct_Hair( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
  vec3 T = normalize( vHT ); vec3 L = directLight.direction; vec3 V = geometryViewDir; vec3 N = geometryNormal;
  float occ = mix( 1., .38, vHD );
  float wrap = saturate( ( dot( N, L ) + .55 ) / 1.55 );
  reflectedLight.directDiffuse += directLight.color * material.diffuseColor * ( .35 + .65 * wrap ) * occ * RECIPROCAL_PI;
  vec3 H = normalize( L + V );
  float jit = ( vHC - .5 ) * .14;
  vec3 T1 = normalize( T + N * ( uShift1 + jit ) ), T2 = normalize( T + N * ( uShift2 + jit ) );
  float d1 = dot( T1, H ), d2 = dot( T2, H );
  float s1 = pow( sqrt( max( 0., 1. - d1 * d1 ) ), uExp1 ), s2 = pow( sqrt( max( 0., 1. - d2 * d2 ) ), uExp2 );
  float vis = smoothstep( -.25, .3, dot( N, L ) );
  float sv = .25 + 1.1 * gStrand * gStrand;
  vec3 spec = ( vec3( s1 * uSpec1 ) + material.diffuseColor * s2 * uSpec2 * ( .55 + .9 * vHC ) ) * vis * occ * sv;
  reflectedLight.directSpecular += directLight.color * spec;
  float back = pow( saturate( dot( V, -L ) ), 4. ) * .55 * ( 1. - vHD * .7 );
  reflectedLight.directDiffuse += directLight.color * material.diffuseColor * back;
}
#undef RE_Direct
#define RE_Direct RE_Direct_Hair`;
function hairMaterial(U, tex, o) {
  const m = new MeshPhysicalMaterial({ map: tex, roughness: .72, metalness: 0, envMapIntensity: .07, side: DoubleSide, alphaTest: o.blend ? (o.alphaTest || .02) : .02, alphaToCoverage: !o.blend, transparent: !!o.blend, depthWrite: !o.blend, ior: 1.55 });
  U.uA2C = { value: o.blend ? 0 : 1 };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aHT; attribute float aHD; attribute float aHR; attribute float aHC; varying vec3 vHT; varying float vHD; varying float vHR; varying float vHC;')
      .replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n{ vec3 ht = aHT;\n#ifdef USE_SKINNING\nht = ( skinMatrix * vec4( aHT, 0. ) ).xyz;\n#endif\nvHT = normalize( ( modelViewMatrix * vec4( ht, 0. ) ).xyz ); vHD = aHD; vHR = aHR; vHC = aHC; }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', '#include <lights_physical_pars_fragment>\n' + HAIR_PARS)
      .replace('#include <map_fragment>', `#include <map_fragment>
#ifdef USE_MAP
if ( uA2C > .5 ) { vec2 tsz = vec2( textureSize( map, 0 ) ); vec2 ddx = dFdx( vMapUv * tsz ), ddy = dFdy( vMapUv * tsz );
  float lod = max( 0., .5 * log2( max( dot( ddx, ddx ), dot( ddy, ddy ) ) ) );
  diffuseColor.a = min( 1., diffuseColor.a * ( 1. + lod * .32 ) );
  diffuseColor.a = clamp( ( diffuseColor.a - .4 ) / max( fwidth( diffuseColor.a ), 1e-4 ) + .5, 0., 1. ); }
#endif
gStrand = diffuseColor.r;
{ float rr = vHR; vec3 base = mix( uHairCol * ( .62 + .38 * smoothstep( 0., .35, rr ) ), uTipCol, smoothstep( .45, 1., rr ) * .55 );
  base *= .8 + .4 * vHC; base *= mix( 1., .55 + .45 * diffuseColor.r, .9 );
  diffuseColor.rgb = base; }`)
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.indirectDiffuse *= mix( 1., .42, vHD ); reflectedLight.indirectSpecular *= mix( 1., .25, vHD );');
  };
  m.customProgramCacheKey = () => 'codis-hair3' + (o.blend ? 'b' : 'a');
  return m;
}

/* العين: إزاحة منظور للقزحية تحت القرنية (انكسار تقريبي) + تظليل الجفن على أطراف الصلبة */
const EYE_FRAG = `#include <map_fragment>
#ifdef USE_MAP
{ vec2 c0 = uIris0, c1 = uIris1; vec2 uv = vMapUv; float d0 = distance( uv, c0 ), d1 = distance( uv, c1 ); vec2 ic = d0 < d1 ? c0 : c1; float di = min( d0, d1 );
  vec3 dp1 = dFdx( -vViewPosition ), dp2 = dFdy( -vViewPosition ); vec2 du1 = dFdx( uv ), du2 = dFdy( uv ); vec3 n0 = normalize( vNormal );
  vec3 p2 = cross( dp2, n0 ), p1 = cross( n0, dp1 ); vec3 Tt = p2 * du1.x + p1 * du2.x, Bt = p2 * du1.y + p1 * du2.y;
  float im = inversesqrt( max( dot( Tt, Tt ), dot( Bt, Bt ) ) ); vec3 Vv = normalize( vViewPosition );
  vec3 Vt = vec3( dot( Vv, Tt * im ), dot( Vv, Bt * im ), dot( Vv, n0 ) );
  float k = length( du1 ) / max( length( dp1 ), 1e-6 );
  float m = 1. - smoothstep( uIrisR * .96, uIrisR * 1.12, di );
  vec2 off = Vt.xy / max( Vt.z, .25 ) * uIrisDepth * k * .75 * m;
  vec4 t2 = texture2D( map, uv - off );
  diffuseColor = vec4( t2.rgb * uIrisTint, 1. );
  float lim = smoothstep( uIrisR * .78, uIrisR * 1.0, di ) * ( 1. - smoothstep( uIrisR * 1.0, uIrisR * 1.18, di ) );
  diffuseColor.rgb *= 1. - lim * .45;
  float sc = smoothstep( uIrisR * 1.15, uIrisR * 2.6, di );
  diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * vec3( 1.0, .93, .9 ), sc * .35 );
  diffuseColor.rgb *= 1. - smoothstep( uIrisR * 1.35, uIrisR * 2.9, di ) * .55; }
#endif`;
function eyeMaterial(tex, U) {
  const m = new MeshPhysicalMaterial({ map: tex, roughness: .32, metalness: 0, envMapIntensity: .6, ior: 1.38, specularIntensity: .4 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 uIris0; uniform vec2 uIris1; uniform float uIrisR; uniform float uIrisDepth; uniform vec3 uIrisTint;').replace('#include <map_fragment>', EYE_FRAG);
  };
  m.customProgramCacheKey = () => 'codis-eye3';
  return m;
}

/* الملابس المولّدة: قماش (sheen) + نسيج متكرر + حواف/خياطة من خريطة الملابس */
function clothMaterial(tex, U) {
  const m = new MeshPhysicalMaterial({ color: 0xffffff, roughness: .86, metalness: 0, sheen: .55, sheenRoughness: .7, sheenColor: new Color(.5, .5, .5), envMapIntensity: .55, side: DoubleSide, normalMap: tex.knit || null, normalScale: new Vector2(.45, .45) });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aAO; attribute float aHem; varying float vAO; varying float vHem;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAO = aAO; vHem = aHem;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uClothCol; varying float vAO; varying float vHem;')
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = uClothCol * ( 1. - vHem * .12 ) * ( gl_FrontFacing ? 1. : .55 );')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.indirectDiffuse *= vAO; reflectedLight.indirectSpecular *= vAO; reflectedLight.directDiffuse *= mix( 1., vAO, .35 );');
  };
  m.customProgramCacheKey = () => 'codis-cloth3';
  return m;
}

/* =====================================================================
   Rig — شخص واحد لجنس واحد: الجسم (مقسّم) + القطع على هيكل واحد
   ===================================================================== */
class Rig {
  constructor(view, A, sex) {
    this.view = view; this.A = A; this.sex = sex; const M = A.meta, nv = M.nv, T = this.T = view.topo(A), sub = view.q.subdiv;
    this.P = new Float32Array(nv * 3); this.S = new Float32Array(T.nsv * 3); this.NS = new Float32Array(T.nsv * 3); this.CV = new Float32Array(T.nsv);
    this.BK = new Float32Array(nv * 3); this.BKS = new Float32Array(T.nsv * 3);
    this.root = new Group(); this.root.visible = false; this.root.name = 'rig-' + sex;
    this.bones = M.bones.map(b => { const o = new Bone(); o.name = b.n; return o; });
    M.bones.forEach((b, i) => { if (b.p >= 0) this.bones[b.p].add(this.bones[i]); else this.root.add(this.bones[i]); });
    this.byName = {}; this.bones.forEach(b => { this.byName[b.name] = b; });
    this.skeleton = new Skeleton(this.bones);
    this.J = A.get(M.weights.j); this.W = A.get(M.weights.w);
    /* الجسم */
    const RM = this.RM = T.render(sub), n = RM.n, rv = RM.rv2sv, g = new BufferGeometry(), wt = T.weights(this.J, this.W, M.bones.length);
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('uv', new BufferAttribute(RM.uv, 2));
    const sj = new Uint8Array(n * 4), sw = new Uint8Array(n * 4); for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { sj[i * 4 + k] = wt.sj[rv[i] * 4 + k]; sw[i * 4 + k] = wt.sw[rv[i] * 4 + k]; }
    g.setAttribute('skinIndex', new Uint8BufferAttribute(sj, 4)); g.setAttribute('skinWeight', new BufferAttribute(sw, 4, true));
    const scal = (name, def) => { const out = new Float32Array(n); if (!name) { out.fill(def); return out; } const src = A.get(name), b = new Float32Array(nv); for (let i = 0; i < nv; i++) b[i] = src[i] / 255; const s = new Float32Array(T.nsv); T.subdivide(b, s, 1); for (let i = 0; i < n; i++) out[i] = s[rv[i]]; return out; };
    g.setAttribute('aAO', new BufferAttribute(scal(M.body.ao, 1), 1)); g.setAttribute('aTh', new BufferAttribute(scal(M.body.thick, 0), 1));
    g.setAttribute('aCv', new BufferAttribute(new Float32Array(n), 1)); g.setAttribute('aHM', new BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aBk', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setIndex(new BufferAttribute(RM.idx, 1));
    this.bodyGeo = g;
    this.skinU = { uLUT: { value: null }, uSkin2: { value: null }, uRegion: { value: null }, uStub: { value: null }, uSkinMix: { value: 0 }, uSkinTint: { value: new Color(1, 1, 1) }, uUnder: { value: new Color(1, 1, 1) }, uRed: { value: .6 },
      uScalpCol: { value: new Color(0, 0, 0) }, uScalpAmt: { value: 0 }, uBeardCol: { value: new Color(0, 0, 0) }, uBeardAmt: { value: 0 }, uStubRep: { value: 26 }, uTrans: { value: .55 }, uBuzz: { value: 0 }, uBlink: view.blinkU };
    this.skinMat = skinMaterial(this.skinU);
    this.body = new SkinnedMesh(g, this.skinMat); this.body.name = 'body'; this.body.frustumCulled = false; this.body.castShadow = true; this.body.receiveShadow = true;
    this.root.add(this.body); this.body.bind(this.skeleton, new Matrix4());
    this.parts = {}; this.delKey = ''; this.hmKey = '';
    this.box = new Box3(); this.headC = new Vector3(); this.eyeC = new Vector3(); this.restQ = {};
  }
  /* --- المواضع: البنية + الطول + الأهداف المتفرقة (متر) ⇒ التقسيم ⇒ العموديات/الانحناء/الرمش --- */
  shape(spec) {
    const A = this.A, M = A.meta, q = M.q, P = this.P, nv = M.nv, T = this.T, sub = this.RM.sub;
    const builds = M.builds[this.sex], b = builds.find(x => x.id === spec.build) || builds.find(x => x.id === 'avg') || builds[0];
    const src = A.get(b.pos), base = b.base ? A.get(builds.find(x => x.id === b.base).pos) : null;
    for (let i = 0; i < nv * 3; i++) P[i] = (src[i] + (base ? base[i] : 0)) * q;
    const I = A.tgI, Dd = A.tgD, tl = Object.assign({}, spec.targets || {});
    const h = clamp(spec.height == null ? .5 : spec.height); if (h !== .5) tl['height-' + this.sex + '-' + (h > .5 ? 'max' : 'min')] = (tl['height-' + this.sex + '-' + (h > .5 ? 'max' : 'min')] || 0) + Math.abs(h - .5) * 2;
    for (const name in tl) {
      const w = +tl[name]; if (!w || !isFinite(w)) continue; const t = A.tg[name]; if (!t) continue;
      const wq = w * t[2]; for (let j = t[0], e = t[0] + t[1]; j < e; j++) { const v = I[j] * 3, d = j * 3; P[v] += Dd[d] * wq; P[v + 1] += Dd[d + 1] * wq; P[v + 2] += Dd[d + 2] * wq; }
    }
    /* القدمان على الأرض (أدنى رأس جسم) */
    let minY = Infinity; for (let v = 0; v < nv; v++) if (T.isBody[v] && P[v * 3 + 1] < minY) minY = P[v * 3 + 1];
    for (let i = 1; i < nv * 3; i += 3) P[i] -= minY;
    T.subdivide(P, this.S, 3); T.normals(this.S, this.NS, sub); T.curvature(this.S, this.NS, this.CV, sub);
    this.blinkShape();
  }
  /* الرمش: الجفن العلوي يدور حول مركز العين بأوزان MakeHuman (orbicularis03) حتى يلامس السفلي — يُحسب للشكل الحالي */
  blinkShape() {
    const A = this.A, M = A.meta, bl = M.blink, P = this.S, BK = this.BK; BK.fill(0); if (!bl) return;
    const c = new Vector3(), up = new Vector3(), lo = new Vector3(), p = new Vector3(), q = new Quaternion(), X = new Vector3();
    for (const s of ['L', 'R']) {
      const d = bl[s]; if (!d) continue; const ci = A.get(d.c), vi = A.get(d.v), wi = A.get(d.w), mu = A.get(d.mu), ml = A.get(d.ml);
      c.set(0, 0, 0); for (const i of ci) c.add(p.fromArray(P, i * 3)); c.multiplyScalar(1 / ci.length);
      up.set(0, 0, 0); for (const i of mu) up.add(p.fromArray(P, i * 3)); up.multiplyScalar(1 / mu.length).sub(c);
      lo.set(0, 0, 0); for (const i of ml) lo.add(p.fromArray(P, i * 3)); lo.multiplyScalar(1 / ml.length).sub(c);
      X.copy(up).cross(lo); if (X.lengthSq() < 1e-12) continue; X.normalize();
      const ang = up.angleTo(lo) * (d.k || 1.02);
      for (let j = 0; j < vi.length; j++) { const v = vi[j], w = wi[j] / 255; p.fromArray(P, v * 3).sub(c); const r = p.clone().applyQuaternion(q.setFromAxisAngle(X, ang * w)); BK[v * 3] = r.x - p.x; BK[v * 3 + 1] = r.y - p.y; BK[v * 3 + 2] = r.z - p.z; }
    }
    this.T.subdivide(BK, this.BKS, 3);
  }
  joint(list, out) { const P = this.P; out.set(0, 0, 0); for (const i of list) { out.x += P[i * 3]; out.y += P[i * 3 + 1]; out.z += P[i * 3 + 2]; } return out.multiplyScalar(1 / list.length); }
  rebind() {
    const M = this.A.meta, heads = M.bones.map(b => this.joint(b.h, new Vector3()));
    this.bones.forEach((bo, i) => { const p = M.bones[i].p; bo.position.copy(heads[i]); if (p >= 0) bo.position.sub(heads[p]); bo.quaternion.identity(); bo.scale.set(1, 1, 1); });
    const turn = this.view.turn, yaw = turn.rotation.y; turn.rotation.y = 0; turn.updateMatrixWorld(true);
    this.skeleton.calculateInverses();
    this.tails = M.bones.map(b => this.joint(b.t, new Vector3())); this.heads = heads;
    pose(this); turn.rotation.y = yaw; turn.updateMatrixWorld(true);
    this.restQ = {}; for (const b of this.bones) this.restQ[b.name] = b.quaternion.clone();
  }
  writeBody(hide) {
    const g = this.bodyGeo, RM = this.RM, rv = RM.rv2sv, S = this.S, N = this.NS, CV = this.CV, BK = this.BKS;
    const pa = g.attributes.position.array, na = g.attributes.normal.array, ca = g.attributes.aCv.array, ba = g.attributes.aBk.array;
    for (let i = 0; i < RM.n; i++) { const s = rv[i] * 3, d = i * 3; pa[d] = S[s]; pa[d + 1] = S[s + 1]; pa[d + 2] = S[s + 2]; na[d] = N[s]; na[d + 1] = N[s + 1]; na[d + 2] = N[s + 2]; ca[i] = CV[rv[i]]; ba[d] = BK[s]; ba[d + 1] = BK[s + 1]; ba[d + 2] = BK[s + 2]; }
    g.attributes.position.needsUpdate = g.attributes.normal.needsUpdate = g.attributes.aCv.needsUpdate = g.attributes.aBk.needsUpdate = true;
    /* إخفاء الجلد المغطّى بالملابس (قناع لكل وجه أصلي) ⇒ لا اختراق ولا رسم مهدور */
    const key = hide ? hide.key : '';
    if (key !== this.delKey) {
      this.delKey = key;
      if (!hide) g.setIndex(new BufferAttribute(RM.idx, 1));
      else { const out = new Uint32Array(RM.idx.length); let o = 0; const tf = RM.triFace, hf = hide.faces; for (let t = 0; t < tf.length; t++) if (!hf[tf[t]]) { out[o++] = RM.idx[t * 3]; out[o++] = RM.idx[t * 3 + 1]; out[o++] = RM.idx[t * 3 + 2]; } g.setIndex(new BufferAttribute(out.slice(0, o), 1)); }
    }
    g.computeBoundingBox(); g.computeBoundingSphere();
  }
  /* أقنعة الجسم (ظل فروة الرأس تحت التسريحة + كثافة اللحية) — لكل رأس أصلي ⇒ مقسّمة */
  masks(scalp, beard, cap) {
    const key = (scalp || '') + '|' + (beard || '') + '|' + (cap || ''); if (key === this.hmKey) return; this.hmKey = key;
    const A = this.A, M = A.meta, nv = M.nv, T = this.T, rv = this.RM.rv2sv, hm = this.bodyGeo.attributes.aHM, b3 = new Float32Array(nv * 3), s3 = new Float32Array(T.nsv * 3);
    const get = k => k && M.masks[k] ? A.get(M.masks[k]) : null, sa = get(scalp), ba = get(beard), ca = get(cap);
    for (let i = 0; i < nv; i++) { b3[i * 3] = sa ? sa[i] / 255 : 0; b3[i * 3 + 1] = ba ? ba[i] / 255 : 0; b3[i * 3 + 2] = ca ? ca[i] / 255 : 0; }
    T.subdivide(b3, s3, 3); for (let i = 0; i < rv.length; i++) for (let c = 0; c < 3; c++) hm.array[i * 3 + c] = s3[rv[i] * 3 + c];
    hm.needsUpdate = true;
  }
  /* --- قطعة مُركّبة (mhclo أو مولّدة بالصيغة نفسها): موضع كل رأس = مركّب 3 رؤوس من الجسم المنعَّم + إزاحة مقيسة --- */
  part(id) {
    if (this.parts[id]) return this.parts[id];
    const A = this.A, pr = A.byId[id]; if (!pr) return null;
    if (pr.kind === 'garment') return this.garment(pr);
    if (pr.fmt === 'strands2') return this.strandPart(pr);
    const n = pr.n, refs = A.get(pr.refs), w = A.get(pr.w), off = A.get(pr.off), g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('uv', new BufferAttribute(A.get(pr.uv), 2, true));
    if (pr.triBall) {
      const tb = A.get(pr.triBall), tc = A.get(pr.triCornea), all = new Uint32Array(tb.length + tc.length); all.set(tb); all.set(tc, tb.length);
      g.setIndex(new BufferAttribute(all, 1)); g.addGroup(0, tb.length, 0); g.addGroup(tb.length, tc.length, 1);
    } else g.setIndex(new BufferAttribute(A.get(pr.tri), 1));
    if (pr.strand) {   /* بطاقات خصل: مماس الخصلة (يُحسب بعد كل ملاءمة) + عمق/جذر-طرف/عشوائي */
      g.setAttribute('aHT', new BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('aHD', new BufferAttribute(A.get(pr.hd), 1, true)); g.setAttribute('aHR', new BufferAttribute(A.get(pr.hr), 1, true)); g.setAttribute('aHC', new BufferAttribute(A.get(pr.hc), 1, true));
    }
    g.setAttribute('aBk', new BufferAttribute(new Float32Array(n * 3), 3));
    const sj = new Uint8Array(n * 4), sw = new Uint8Array(n * 4), acc = new Map(), J = this.J, W = this.W;
    for (let i = 0; i < n; i++) {
      acc.clear();
      for (let k = 0; k < 3; k++) { const v = refs[i * 3 + k], wk = w[i * 3 + k]; if (!wk) continue; for (let m = 0; m < 4; m++) { const W8 = W[v * 4 + m]; if (!W8) continue; const j = J[v * 4 + m]; acc.set(j, (acc.get(j) || 0) + wk * W8); } }
      const top = [...acc.entries()].filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 4); let s = 0; for (const e of top) s += e[1];
      if (!top.length) { sj[i * 4] = this.headIdx(); sw[i * 4] = 255; continue; }
      let r = 255; top.forEach((e, k) => { sj[i * 4 + k] = e[0]; const q8 = k === top.length - 1 ? r : Math.min(r, Math.round(e[1] / s * 255)); sw[i * 4 + k] = q8; r -= q8; });
    }
    g.setAttribute('skinIndex', new Uint8BufferAttribute(sj, 4)); g.setAttribute('skinWeight', new BufferAttribute(sw, 4, true));
    const mesh = new SkinnedMesh(g, null); mesh.name = id; mesh.frustumCulled = false; mesh.visible = false; mesh.castShadow = pr.kind !== 'lashes' && pr.kind !== 'brows'; mesh.receiveShadow = true;
    mesh.bind(this.skeleton, new Matrix4()); this.root.add(mesh);
    const key = new Map(), weld = new Uint32Array(n);
    for (let i = 0; i < n; i++) { const k = refs[i * 3] + ',' + refs[i * 3 + 1] + ',' + refs[i * 3 + 2] + ',' + off[i * 3].toFixed(5) + ',' + off[i * 3 + 1].toFixed(5) + ',' + off[i * 3 + 2].toFixed(5); if (!key.has(k)) key.set(k, i); weld[i] = key.get(k); }
    const P = { pr, mesh, g, refs, w, off, weld, ver: -1, tdir: pr.tdir ? A.get(pr.tdir) : null, nrmIn: pr.nin ? A.get(pr.nin) : null };
    this.parts[id] = P; return P;
  }
  headIdx() { return Math.max(0, this.A.meta.bones.findIndex(b => b.n === 'head')); }
  fit(P) {
    if (P.ver === this.ver) return; P.ver = this.ver;
    const B = this.S, n = P.pr.n, pa = P.g.attributes.position.array, sc = P.pr.scale, s = [1, 1, 1], BK = this.BK, ka = P.g.attributes.aBk.array;
    for (let k = 0; k < 3; k++) { const c = sc[k]; if (c) s[k] = Math.abs(B[c[0] * 3 + k] - B[c[1] * 3 + k]) / c[2]; }
    const r = P.refs, w = P.w, o = P.off;
    for (let i = 0; i < n; i++) {
      const a = r[i * 3] * 3, b = r[i * 3 + 1] * 3, c = r[i * 3 + 2] * 3, wa = w[i * 3], wb = w[i * 3 + 1], wc = w[i * 3 + 2];
      for (let k = 0; k < 3; k++) { pa[i * 3 + k] = wa * B[a + k] + wb * B[b + k] + wc * B[c + k] + o[i * 3 + k] * s[k]; ka[i * 3 + k] = wa * BK[a + k] + wb * BK[b + k] + wc * BK[c + k]; }
    }
    P.g.attributes.position.needsUpdate = true; P.g.attributes.aBk.needsUpdate = true;
    if (P.pr.strand) this.strandFrames(P);
    else {
      P.g.computeVertexNormals();
      const na = P.g.attributes.normal.array, wd = P.weld;
      for (let i = 0; i < n; i++) { const j = wd[i]; if (j !== i) { na[j * 3] += na[i * 3]; na[j * 3 + 1] += na[i * 3 + 1]; na[j * 3 + 2] += na[i * 3 + 2]; } }
      for (let i = 0; i < n; i++) { const j = wd[i]; const l = Math.hypot(na[j * 3], na[j * 3 + 1], na[j * 3 + 2]) || 1; na[i * 3] = na[j * 3] / l; na[i * 3 + 1] = na[j * 3 + 1] / l; na[i * 3 + 2] = na[j * 3 + 2] / l; }
      P.g.attributes.normal.needsUpdate = true;
    }
    P.g.computeBoundingSphere();
  }
  /* بطاقة الخصلة: المماس = اتجاه الخصلة (الصف التالي/السابق)، العمودي = عمودي البطاقة ممزوجاً باتجاه «للخارج» المخزّن */
  strandFrames(P) {
    const n = P.pr.n, pa = P.g.attributes.position.array, ta = P.g.attributes.aHT.array, na = P.g.attributes.normal.array, td = P.tdir, ni = P.nrmIn, st = P.pr.stride || 2;
    const t = new Vector3(), a = new Vector3(), b = new Vector3(), c = new Vector3();
    for (let i = 0; i < n; i++) {
      const j = td[i] > 0 ? i + st : i - st; if (j < 0 || j >= n) { ta[i * 3 + 1] = -1; continue; }
      t.set(pa[j * 3] - pa[i * 3], pa[j * 3 + 1] - pa[i * 3 + 1], pa[j * 3 + 2] - pa[i * 3 + 2]); if (td[i] < 0) t.negate(); t.normalize();
      ta[i * 3] = t.x; ta[i * 3 + 1] = t.y; ta[i * 3 + 2] = t.z;
      const side = (i % st === 0) ? i + 1 : i - 1; a.fromArray(pa, i * 3); b.fromArray(pa, side * 3).sub(a); c.copy(t).cross(b);
      if (ni) { const o = new Vector3(ni[i * 3] / 127, ni[i * 3 + 1] / 127, ni[i * 3 + 2] / 127); if (c.dot(o) < 0) c.negate(); c.normalize().multiplyScalar(.45).add(o).normalize(); }
      else c.normalize();
      na[i * 3] = c.x; na[i * 3 + 1] = c.y; na[i * 3 + 2] = c.z;
    }
    P.g.attributes.aHT.needsUpdate = true; P.g.attributes.normal.needsUpdate = true;
  }
  /* --- خصل مولّدة (شعر/لحية/حاجب) «strands2»: الأصل يخزّن العمود الفقري لكل بطاقة بإحداثيات الرأس المرجعي (تفاضل درجة ثانية، 0.1مم)
         + أقرب رأس جسم لكل نقطة. وقت العرض: الموضع = رأس_الآن + (المرجعي − رأس_المرجع) × مقياس الرأس، ثم تُبنى البطاقات (شريطان لكل نقطة،
         مستدقّة، ملتفّة، مسطحة على سطح الشعر) بعد كل شكل ⇒ تتبع الرأس/الوجه/البنية. القيم العشوائية للبطاقات من مولّد بذرة ثابت (لا تُخزَّن). --- */
  strandPart(pr) {
    const A = this.A, M = A.meta, nc = pr.nc, cnt = A.get(pr.cnt), card = A.get(pr.card), f = Math.max(1, pr.smooth || 1), keepF = pr.kind === 'hair' ? this.view.q.hair : 1, NC = (M.atlas && M.atlas.cells) || 8;
    const cs = new Int32Array(nc + 1); for (let c = 0; c < nc; c++) cs[c + 1] = cs[c] + cnt[c];
    const npt = cs[nc], p2 = A.get(pr.pos), r0 = A.get(pr.ref), auth = new Float32Array(npt * 3), ref = new Int32Array(npt);
    for (let c = 0; c < nc; c++) {
      let dx = 0, dy = 0, dz = 0;
      for (let i = cs[c]; i < cs[c + 1]; i++) {
        const j = i - cs[c];
        if (j === 0) { auth[i * 3] = p2[i * 3]; auth[i * 3 + 1] = p2[i * 3 + 1]; auth[i * 3 + 2] = p2[i * 3 + 2]; ref[i] = r0[i]; continue; }
        if (j === 1) { dx = p2[i * 3]; dy = p2[i * 3 + 1]; dz = p2[i * 3 + 2]; } else { dx += p2[i * 3]; dy += p2[i * 3 + 1]; dz += p2[i * 3 + 2]; }
        auth[i * 3] = auth[i * 3 - 3] + dx; auth[i * 3 + 1] = auth[i * 3 - 2] + dy; auth[i * 3 + 2] = auth[i * 3 - 1] + dz; ref[i] = ref[i - 1] + r0[i];
      }
    }
    for (let i = 0, un = pr.unit || 1e-4; i < npt * 3; i++) auth[i] *= un;
    const R = rnd32(hashStr(pr.id)), us = new Float32Array(nc), uf = new Float32Array(nc), vl = new Float32Array(nc), rn = new Float32Array(nc), tw = new Float32Array(nc), tw0 = pr.twist || .2;
    for (let c = 0; c < nc; c++) {
      if (pr.single) { const k = Math.floor(R() * 4); uf[c] = .13; us[c] = (k + .5) / 4 - .065; } else { uf[c] = .55 + .45 * R(); us[c] = R() * (1 - uf[c]); }
      vl[c] = .8 + .2 * R(); rn[c] = R(); tw[c] = (R() * 2 - 1) * tw0;
    }
    const keep = []; let nv = 0, nt = 0;
    for (let c = 0; c < nc; c++) { if (rn[c] > keepF) continue; const m = (cnt[c] - 1) * f + 1; keep.push(c); nv += m * 2; nt += (m - 1) * 2; }
    const g = new BufferGeometry(), uv = new Float32Array(nv * 2), hr = new Float32Array(nv), hd = new Float32Array(nv), hc = new Float32Array(nv), idx = new Uint32Array(nt * 3);
    const sj = new Uint8Array(nv * 4), sw = new Uint8Array(nv * 4), J = this.J, W = this.W, cw = 1 / NC;
    let o = 0, ti = 0;
    for (const c of keep) {
      const n = cnt[c], m = (n - 1) * f + 1, cb = c * 3, uL = card[cb] / NC + us[c] * cw, uR = uL + uf[c] * cw, dep = card[cb + 2] / 255;
      for (let k = 0; k < m; k++) {
        const t = k / (m - 1), v = 1 - .005 - t * vl[c] * .985, src = ref[cs[c] + Math.min(n - 1, Math.round(k / f))];
        for (let s2 = 0; s2 < 2; s2++) { const q = o + k * 2 + s2; uv[q * 2] = s2 ? uR : uL; uv[q * 2 + 1] = v; hr[q] = t; hd[q] = Math.min(1, dep + (1 - t) * .18); hc[q] = rn[c]; for (let z = 0; z < 4; z++) { sj[q * 4 + z] = J[src * 4 + z]; sw[q * 4 + z] = W[src * 4 + z]; } }
        if (k < m - 1) { const a2 = o + k * 2; idx[ti++] = a2; idx[ti++] = a2 + 1; idx[ti++] = a2 + 3; idx[ti++] = a2; idx[ti++] = a2 + 3; idx[ti++] = a2 + 2; }
      }
      o += m * 2;
    }
    g.setAttribute('position', new BufferAttribute(new Float32Array(nv * 3), 3)); g.setAttribute('normal', new BufferAttribute(new Float32Array(nv * 3), 3));
    g.setAttribute('uv', new BufferAttribute(uv, 2)); g.setAttribute('aHT', new BufferAttribute(new Float32Array(nv * 3), 3));
    g.setAttribute('aHR', new BufferAttribute(hr, 1)); g.setAttribute('aHD', new BufferAttribute(hd, 1)); g.setAttribute('aHC', new BufferAttribute(hc, 1));
    g.setAttribute('skinIndex', new Uint8BufferAttribute(sj, 4)); g.setAttribute('skinWeight', new BufferAttribute(sw, 4, true));
    g.setIndex(new BufferAttribute(idx, 1));
    const mesh = new SkinnedMesh(g, null); mesh.name = pr.id; mesh.frustumCulled = false; mesh.visible = false; mesh.castShadow = pr.kind !== 'brows'; mesh.receiveShadow = true;
    mesh.bind(this.skeleton, new Matrix4()); this.root.add(mesh);
    const P = { pr, mesh, g, strands: true, keep, cs, f, ver: -1, auth, ref, tw, card, cnt, pts: new Float32Array(npt * 3), out: new Float32Array(npt * 3) };
    this.parts[pr.id] = P; return P;
  }
  fitStrands(P) {
    if (P.ver === this.ver) return; P.ver = this.ver;
    const S = this.S, N = this.NS, Sa = this.view.authShape(this.A, P.pr.auth || this.sex), pr = P.pr, np = pr.np, pts = P.pts, nrm = P.out, ref = P.ref, au = P.auth, s = [1, 1, 1];
    [[5399, 11998], [791, 881], [962, 5320]].forEach(([a, b], k) => { const d0 = Math.abs(Sa[a * 3 + k] - Sa[b * 3 + k]); if (d0 > 1e-6) s[k] = Math.abs(S[a * 3 + k] - S[b * 3 + k]) / d0; });
    const hi = this.headIdx(), hc = this.heads[hi].clone().lerp(this.tails[hi], .45);
    for (let i = 0; i < np; i++) {
      const r = ref[i] * 3;
      for (let k = 0; k < 3; k++) pts[i * 3 + k] = S[r + k] + (au[i * 3 + k] - Sa[r + k]) * s[k];
      let nx = N[r], ny = N[r + 1], nz = N[r + 2];
      let rx = pts[i * 3] - hc.x, ry = pts[i * 3 + 1] - hc.y, rz = pts[i * 3 + 2] - hc.z; const nl = Math.hypot(nx, ny, nz) || 1;
      const hang = Math.min(1, Math.max(0, (-ry - .07) / .06)); ry *= 1 - hang; const rl = Math.hypot(rx, ry, rz) || 1, kn = .7 - .45 * hang;
      nx = nx / nl * kn + rx / rl * (1 - kn); ny = ny / nl * kn + ry / rl * (1 - kn); nz = nz / nl * kn + rz / rl * (1 - kn); const ol = Math.hypot(nx, ny, nz) || 1;
      nrm[i * 3] = nx / ol; nrm[i * 3 + 1] = ny / ol; nrm[i * 3 + 2] = nz / ol;
    }
    const pa = P.g.attributes.position.array, na = P.g.attributes.normal.array, ta = P.g.attributes.aHT.array, f = P.f, taper = pr.kind === 'brows' ? .3 : pr.kind === 'beard' ? .45 : .5;
    const cp = (i, k) => pts[i * 3 + k];
    let o = 0; const p = [0, 0, 0], t = [0, 0, 0], on = [0, 0, 0];
    for (const c of P.keep) {
      const n = P.cnt[c], m = (n - 1) * f + 1, s0 = P.cs[c], width = P.card[c * 3 + 1] / 1e4, ctw = Math.cos(P.tw[c]), stw = Math.sin(P.tw[c]);
      for (let k = 0; k < m; k++) {
        const seg = Math.min(n - 2, Math.floor(k / f)), u = k / f - seg, i0 = s0 + Math.max(0, seg - 1), i1 = s0 + seg, i2 = s0 + seg + 1, i3 = s0 + Math.min(n - 1, seg + 2);
        const u2 = u * u, u3 = u2 * u;
        for (let z = 0; z < 3; z++) {
          const P0 = cp(i0, z), P1 = cp(i1, z), P2 = cp(i2, z), P3 = cp(i3, z);
          p[z] = .5 * (2 * P1 + (-P0 + P2) * u + (2 * P0 - 5 * P1 + 4 * P2 - P3) * u2 + (-P0 + 3 * P1 - 3 * P2 + P3) * u3);
          t[z] = .5 * ((-P0 + P2) + 2 * (2 * P0 - 5 * P1 + 4 * P2 - P3) * u + 3 * (-P0 + 3 * P1 - 3 * P2 + P3) * u2);
          on[z] = nrm[i1 * 3 + z] * (1 - u) + nrm[i2 * 3 + z] * u;
        }
        const tl = Math.hypot(t[0], t[1], t[2]) || 1; t[0] /= tl; t[1] /= tl; t[2] /= tl;
        let sx = t[1] * on[2] - t[2] * on[1], sy = t[2] * on[0] - t[0] * on[2], sz = t[0] * on[1] - t[1] * on[0]; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
        const ux = sy * t[2] - sz * t[1], uy = sz * t[0] - sx * t[2], uz = sx * t[1] - sy * t[0];
        const qx = sx * ctw + ux * stw, qy = sy * ctw + uy * stw, qz = sz * ctw + uz * stw;
        const tt = k / (m - 1), wk = width * (1 - taper * Math.pow(tt, 1.4)) * (.75 + .25 * Math.min(1, tt / .15)) * .5;
        for (let s2 = 0; s2 < 2; s2++) {
          const q = (o + k * 2 + s2) * 3, sg = s2 ? 1 : -1;
          pa[q] = p[0] + qx * wk * sg; pa[q + 1] = p[1] + qy * wk * sg; pa[q + 2] = p[2] + qz * wk * sg;
          na[q] = on[0]; na[q + 1] = on[1]; na[q + 2] = on[2]; ta[q] = t[0]; ta[q + 1] = t[1]; ta[q + 2] = t[2];
        }
      }
      o += m * 2;
    }
    P.g.attributes.position.needsUpdate = P.g.attributes.normal.needsUpdate = P.g.attributes.aHT.needsUpdate = true; P.g.computeBoundingSphere();
  }
  /* --- الملابس المولّدة: رؤوس = استيفاء بين رأسين مقسّمين (القصّ الدقيق عند الحواف) + إزاحة على العمودي + تنعيم يجسر التجاويف --- */
  garment(pr) {
    const A = this.A, M = A.meta, T = this.T, nv = M.nv, wt = T.weights(this.J, this.W, M.bones.length);
    const fsrc = A.get(pr.field), osrc = A.get(pr.off), rsrc = pr.relax ? A.get(pr.relax) : null, fb = new Float32Array(nv), ob = new Float32Array(nv), rb = new Float32Array(nv);
    for (let i = 0; i < nv; i++) { fb[i] = fsrc[i] * 5e-4; ob[i] = osrc[i] * 2.5e-4; rb[i] = rsrc ? rsrc[i] * 2.5e-4 : 0; }
    const F = T.subdivide(fb, new Float32Array(T.nsv), 1), O = T.subdivide(ob, new Float32Array(T.nsv), 1), RX = T.subdivide(rb, new Float32Array(T.nsv), 1);
    const sq = T.sq, uvq = T.uvq, nq = sq.length / 4, va = [], vb = [], vt = [], vu = [], vv = [], off = [], rel = [], key = new Map(), tri = [];
    const vert = (a, b, t, u, v) => {
      if (t <= 1e-6) { b = a; t = 0; } else if (t >= 1 - 1e-6) { a = b; t = 0; }
      if (a > b) { const x = a; a = b; b = x; t = 1 - t; }
      const k = a + ',' + b + ',' + Math.round(t * 65535) + ',' + Math.round(u * 65535) + ',' + Math.round(v * 65535);
      let id = key.get(k); if (id === undefined) { id = va.length; key.set(k, id); va.push(a); vb.push(b); vt.push(t); vu.push(u); vv.push(v); off.push(O[a] * (1 - t) + O[b] * t); rel.push(RX[a] * (1 - t) + RX[b] * t); }
      return id;
    };
    const U = (f, k) => uvq[(f * 4 + (k & 3)) * 2] / 65535, W2 = (f, k) => uvq[(f * 4 + (k & 3)) * 2 + 1] / 65535, cu = new Float32Array(8);
    /* قصّ كل مثلث من الرباعيات المقسّمة عند خط الصفر (Sutherland–Hodgman) ⇒ حواف نظيفة مهما كانت الطوبولوجيا */
    for (let i = 0; i < nq; i++) {
      const c4 = [sq[i * 4], sq[i * 4 + 1], sq[i * 4 + 2], sq[i * 4 + 3]], f4 = c4.map(s => F[s]);
      if (f4[0] > 0 && f4[1] > 0 && f4[2] > 0 && f4[3] > 0) continue;
      const f = i >> 2, k = i & 3, mu = (U(f, 0) + U(f, 1) + U(f, 2) + U(f, 3)) / 4, mv = (W2(f, 0) + W2(f, 1) + W2(f, 2) + W2(f, 3)) / 4;
      cu[0] = U(f, k); cu[1] = W2(f, k); cu[2] = (U(f, k) + U(f, k + 1)) / 2; cu[3] = (W2(f, k) + W2(f, k + 1)) / 2; cu[4] = mu; cu[5] = mv; cu[6] = (U(f, k) + U(f, k + 3)) / 2; cu[7] = (W2(f, k) + W2(f, k + 3)) / 2;
      for (const tr of [[0, 1, 2], [0, 2, 3]]) {
        const out = [];
        for (let e = 0; e < 3; e++) {
          const j0 = tr[e], j1 = tr[(e + 1) % 3], in0 = f4[j0] <= 0, in1 = f4[j1] <= 0;
          if (in0) out.push([c4[j0], c4[j0], 0, cu[j0 * 2], cu[j0 * 2 + 1]]);
          if (in0 !== in1) { const t = f4[j0] / (f4[j0] - f4[j1]); out.push([c4[j0], c4[j1], t, cu[j0 * 2] + (cu[j1 * 2] - cu[j0 * 2]) * t, cu[j0 * 2 + 1] + (cu[j1 * 2 + 1] - cu[j0 * 2 + 1]) * t]); }
        }
        if (out.length < 3) continue; const ids = out.map(q => vert(q[0], q[1], q[2], q[3], q[4]));
        for (let j = 1; j < ids.length - 1; j++) tri.push(ids[0], ids[j], ids[j + 1]);
      }
    }
    /* لحام (بلا UV) لاكتشاف الحافة الحقيقية وللتنعيم/العموديات */
    const n0 = va.length, wk = new Int32Array(n0), wmap = new Map();
    for (let i = 0; i < n0; i++) { const k = va[i] + ',' + vb[i] + ',' + Math.round(vt[i] * 65535); let r = wmap.get(k); if (r === undefined) { r = i; wmap.set(k, i); } wk[i] = r; }
    /* سماكة الحافة: لكل ضلع حدّي (يستعمله مثلث واحد) شريط داخلي بسماكة القماش */
    const ecount = new Map(), ek = (x, y) => x < y ? x * 1048576 + y : y * 1048576 + x;
    for (let t = 0; t < tri.length; t += 3) for (let e = 0; e < 3; e++) { const k = ek(wk[tri[t + e]], wk[tri[t + (e + 1) % 3]]); ecount.set(k, (ecount.get(k) || 0) + 1); }
    const hemOf = [], inner = new Map(), th = .0021, hem = [];
    const innerOf = i => { let j = inner.get(i); if (j === undefined) { j = va.length; inner.set(i, j); va.push(va[i]); vb.push(vb[i]); vt.push(vt[i]); vu.push(vu[i]); vv.push(vv[i]); off.push(Math.max(.0007, off[i] - th)); hemOf[j] = i; } return j; };
    const nT = tri.length;
    for (let t = 0; t < nT; t += 3) for (let e = 0; e < 3; e++) {
      const i0 = tri[t + e], i1 = tri[t + (e + 1) % 3]; if (ecount.get(ek(wk[i0], wk[i1])) !== 1) continue;
      const j0 = innerOf(i0), j1 = innerOf(i1); tri.push(i1, i0, j0, i1, j0, j1); hem[i0] = hem[i1] = 1;
    }
    const n = va.length, g = new BufferGeometry(), wkf = new Int32Array(n); wkf.set(wk); for (let i = n0; i < n; i++) wkf[i] = i;
    const uv = new Float32Array(n * 2), hm = new Float32Array(n); for (let i = 0; i < n; i++) { uv[i * 2] = vu[i]; uv[i * 2 + 1] = vv[i]; hm[i] = i >= n0 ? 1 : hem[i] ? .5 : 0; }
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('normal', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('uv', new BufferAttribute(uv, 2)); g.setAttribute('aHem', new BufferAttribute(hm, 1));
    g.setIndex(new BufferAttribute(Uint32Array.from(tri), 1));
    /* جيران التنعيم (على ممثّلي اللحام فقط) */
    const nbs = Array.from({ length: n }, () => new Set());
    for (let t = 0; t < nT; t += 3) for (let e = 0; e < 3; e++) { const x = wk[tri[t + e]], y2 = wk[tri[t + (e + 1) % 3]]; if (x !== y2) { nbs[x].add(y2); nbs[y2].add(x); } }
    const nbo = new Uint32Array(n + 1); for (let i = 0; i < n; i++) nbo[i + 1] = nbo[i] + nbs[i].size;
    const nb = new Uint32Array(nbo[n]); for (let i = 0; i < n; i++) { let o = nbo[i]; for (const j of nbs[i]) nb[o++] = j; }
    /* أوزان العظام + AO */
    const sj = new Uint8Array(n * 4), sw = new Uint8Array(n * 4), ao = new Float32Array(n), acc = new Map(), aoS = this.aoS || (this.aoS = (() => { const src = A.get(M.body.ao), b2 = new Float32Array(nv); for (let i = 0; i < nv; i++) b2[i] = src[i] / 255; return T.subdivide(b2, new Float32Array(T.nsv), 1); })());
    for (let i = 0; i < n; i++) {
      acc.clear(); const t = vt[i];
      for (const [v, f] of [[va[i], 1 - t], [vb[i], t]]) for (let m = 0; m < 4; m++) { const W8 = wt.sw[v * 4 + m]; if (!W8) continue; const j = wt.sj[v * 4 + m]; acc.set(j, (acc.get(j) || 0) + W8 * f); }
      const top = [...acc.entries()].filter(e => e[1] > 0).sort((x, y2) => y2[1] - x[1]).slice(0, 4); let s = 0; for (const e of top) s += e[1];
      let r = 255; top.forEach((e, k) => { sj[i * 4 + k] = e[0]; const q8 = k === top.length - 1 ? r : Math.min(r, Math.round(e[1] / s * 255)); sw[i * 4 + k] = q8; r -= q8; });
      ao[i] = Math.min(1, (aoS[va[i]] * (1 - t) + aoS[vb[i]] * t) * 1.08) * (i >= n0 ? .6 : 1);
    }
    g.setAttribute('skinIndex', new Uint8BufferAttribute(sj, 4)); g.setAttribute('skinWeight', new BufferAttribute(sw, 4, true)); g.setAttribute('aAO', new BufferAttribute(ao, 1));
    /* الجلد المغطّى تماماً (بهامش) لا يُرسم */
    const hide = new Uint8Array(T.nf), q = T.q, mg = pr.hideMargin || .012;
    for (let f = 0; f < T.nf; f++) hide[f] = fb[q[f * 4]] < -mg && fb[q[f * 4 + 1]] < -mg && fb[q[f * 4 + 2]] < -mg && fb[q[f * 4 + 3]] < -mg ? 1 : 0;
    const mesh = new SkinnedMesh(g, null); mesh.name = pr.id; mesh.frustumCulled = false; mesh.visible = false; mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.bind(this.skeleton, new Matrix4()); this.root.add(mesh);
    const edge = new Uint8Array(n); for (let i = 0; i < n0; i++) if (hem[i]) edge[wk[i]] = 1;   /* الحافة لا تُنعَّم (خط مستقيم نظيف) */
    const relIdx = []; for (let i = 0; i < n0; i++) if (wk[i] === i && rel[i] > 0 && !edge[i] && nbo[i + 1] > nbo[i]) relIdx.push(i);
    const P = { pr, mesh, g, garment: true, n0, edge, va: Int32Array.from(va), vb: Int32Array.from(vb), vt: Float32Array.from(vt), off: Float32Array.from(off), rel: Float32Array.from(rel), relIdx: Uint32Array.from(relIdx), wk: wkf, nb, nbo, hide, hemOf, th,
      ver: -1, tmp: new Float32Array(n * 3), base: new Float32Array(n * 3), nrm: new Float32Array(n * 3) };
    this.parts[pr.id] = P; return P;
  }
  fitGarment(P) {
    if (P.ver === this.ver) return; P.ver = this.ver;
    const S = this.S, N = this.NS, n = P.va.length, n0 = P.n0, pa = P.g.attributes.position.array, base = P.base, nr = P.nrm, tmp = P.tmp, off = P.off, nb = P.nb, nbo = P.nbo, wk = P.wk;
    for (let i = 0; i < n; i++) {
      const t = P.vt[i], a = P.va[i] * 3, b = P.vb[i] * 3;
      let nx = N[a] * (1 - t) + N[b] * t, ny = N[a + 1] * (1 - t) + N[b + 1] * t, nz = N[a + 2] * (1 - t) + N[b + 2] * t; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      nr[i * 3] = nx; nr[i * 3 + 1] = ny; nr[i * 3 + 2] = nz;
      base[i * 3] = S[a] * (1 - t) + S[b] * t; base[i * 3 + 1] = S[a + 1] * (1 - t) + S[b + 1] * t; base[i * 3 + 2] = S[a + 2] * (1 - t) + S[b + 2] * t;
      const d = off[i]; pa[i * 3] = base[i * 3] + nx * d; pa[i * 3 + 1] = base[i * 3 + 1] + ny * d; pa[i * 3 + 2] = base[i * 3 + 2] + nz * d;
    }
    /* تنعيم لابلاسي محدود (القماش يجسر التجاويف) على ممثّلي اللحام، مع قيد: لا يقترب من الجلد أقل من 75% من الإزاحة
       (حول الحلمة فقط يُسمح بالمرور داخل الجلد المخفي بمقدار rel ⇒ يُجسر النتوء) */
    const it = P.pr.smooth || 0, lam = .5;
    for (let r = 0; r < it; r++) {
      for (let i = 0; i < n0; i++) {
        if (wk[i] !== i) continue; const s0 = nbo[i], s1 = nbo[i + 1]; if (s1 <= s0 || P.edge[i]) { tmp[i * 3] = pa[i * 3]; tmp[i * 3 + 1] = pa[i * 3 + 1]; tmp[i * 3 + 2] = pa[i * 3 + 2]; continue; }
        let x = 0, y = 0, z = 0; for (let k = s0; k < s1; k++) { const j = nb[k] * 3; x += pa[j]; y += pa[j + 1]; z += pa[j + 2]; } const m = 1 / (s1 - s0);
        tmp[i * 3] = pa[i * 3] + (x * m - pa[i * 3]) * lam; tmp[i * 3 + 1] = pa[i * 3 + 1] + (y * m - pa[i * 3 + 1]) * lam; tmp[i * 3 + 2] = pa[i * 3 + 2] + (z * m - pa[i * 3 + 2]) * lam;
      }
      for (let i = 0; i < n0; i++) {
        if (wk[i] !== i) continue; const dmin = off[i] * .75 - P.rel[i], bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2], nx = nr[i * 3], ny = nr[i * 3 + 1], nz = nr[i * 3 + 2];
        let x = tmp[i * 3], y = tmp[i * 3 + 1], z = tmp[i * 3 + 2]; const dd = (x - bx) * nx + (y - by) * ny + (z - bz) * nz;
        if (dd < dmin) { const k = dmin - dd; x += nx * k; y += ny * k; z += nz * k; }
        pa[i * 3] = x; pa[i * 3 + 1] = y; pa[i * 3 + 2] = z;
      }
    }
    /* حول الحلمة فقط: تمريرات إضافية بحدود ثابتة (الجيران خارج المنطقة لا يتحركون) ⇒ القماش يجسر النتوء بلا «حلقة» */
    const ri = P.relIdx;
    for (let r = 0; r < 24 && ri.length; r++) {
      for (let q = 0; q < ri.length; q++) { const i = ri[q], s0 = nbo[i], s1 = nbo[i + 1]; let x = 0, y = 0, z = 0; for (let k = s0; k < s1; k++) { const j = nb[k] * 3; x += pa[j]; y += pa[j + 1]; z += pa[j + 2]; } const m = 1 / (s1 - s0);
        tmp[i * 3] = pa[i * 3] + (x * m - pa[i * 3]) * lam; tmp[i * 3 + 1] = pa[i * 3 + 1] + (y * m - pa[i * 3 + 1]) * lam; tmp[i * 3 + 2] = pa[i * 3 + 2] + (z * m - pa[i * 3 + 2]) * lam; }
      for (let q = 0; q < ri.length; q++) { const i = ri[q], dmin = off[i] * .75 - P.rel[i], nx = nr[i * 3], ny = nr[i * 3 + 1], nz = nr[i * 3 + 2]; let x = tmp[i * 3], y = tmp[i * 3 + 1], z = tmp[i * 3 + 2];
        const dd = (x - base[i * 3]) * nx + (y - base[i * 3 + 1]) * ny + (z - base[i * 3 + 2]) * nz; if (dd < dmin) { const k = dmin - dd; x += nx * k; y += ny * k; z += nz * k; }
        pa[i * 3] = x; pa[i * 3 + 1] = y; pa[i * 3 + 2] = z; }
    }
    for (let i = 0; i < n0; i++) { const j = wk[i]; if (j !== i) { pa[i * 3] = pa[j * 3]; pa[i * 3 + 1] = pa[j * 3 + 1]; pa[i * 3 + 2] = pa[j * 3 + 2]; } }
    for (let i = n0; i < n; i++) { const o = wk[P.hemOf[i]]; pa[i * 3] = pa[o * 3] - nr[i * 3] * P.th; pa[i * 3 + 1] = pa[o * 3 + 1] - nr[i * 3 + 1] * P.th; pa[i * 3 + 2] = pa[o * 3 + 2] - nr[i * 3 + 2] * P.th; }
    P.g.attributes.position.needsUpdate = true; P.g.computeVertexNormals();
    const na = P.g.attributes.normal.array;
    for (let i = 0; i < n0; i++) { const j = wk[i]; if (j !== i) { na[j * 3] += na[i * 3]; na[j * 3 + 1] += na[i * 3 + 1]; na[j * 3 + 2] += na[i * 3 + 2]; } }
    for (let i = 0; i < n0; i++) { const j = wk[i]; const l = Math.hypot(na[j * 3], na[j * 3 + 1], na[j * 3 + 2]) || 1; na[i * 3] = na[j * 3] / l; na[i * 3 + 1] = na[j * 3 + 1] / l; na[i * 3 + 2] = na[j * 3 + 2] / l; }
    P.g.attributes.normal.needsUpdate = true; P.g.computeBoundingSphere();
  }
  dispose() {
    const seen = new Set(), free = o => { if (o && !seen.has(o)) { seen.add(o); try { o.dispose(); } catch (e) {} } };
    free(this.bodyGeo); free(this.skinMat); for (const k in this.parts) { free(this.parts[k].g); if (this.parts[k].mesh.customDepthMaterial) free(this.parts[k].mesh.customDepthMaterial); } free(this.skeleton);
    if (this.root.parent) this.root.parent.remove(this.root);
  }
}

/* ---------- وضعية الوقوف: الذراعان لجانبي الجسم + انثناء طبيعي للأصابع + القدمان أقرب ---------- */
function rotWorldQ(bone, q) {
  const pq = new Quaternion(), bq = new Quaternion(); bone.parent.getWorldQuaternion(pq); bone.getWorldQuaternion(bq);
  bone.quaternion.copy(pq.invert().multiply(q.clone().multiply(bq))); bone.updateMatrixWorld(true);
}
function pose(R) {
  const b = R.byName, X = new Vector3(1, 0, 0), q = new Quaternion(), w = new Vector3(), h = new Vector3(), fem = R.sex === 'female';
  const dirOf = (bo, ch) => { bo.getWorldPosition(h); ch.getWorldPosition(w); return w.sub(h).normalize(); };
  for (const s of ['L', 'R']) {
    const sh = b['shoulder01.' + s], ua = b['upperarm01.' + s], u2 = b['upperarm02.' + s], la = b['lowerarm01.' + s]; if (!ua || !u2 || !la) continue;
    const d0 = dirOf(u2, la), sx = Math.sign(d0.x) || 1, a = MathUtils.degToRad(fem ? 82 : 80);
    const want = new Vector3(sx * Math.cos(a), -Math.sin(a), .07).normalize();
    if (sh) { const full = new Quaternion().setFromUnitVectors(d0, want); rotWorldQ(sh, new Quaternion().slerp(full, .3)); }
    rotWorldQ(ua, q.setFromUnitVectors(dirOf(u2, la), want));
    /* الساعد: انثناء خفيف للأمام + كبّ (الكف نحو الفخذ) موزّع على عظمتي الساعد (لا التواء «غلاف الحلوى») */
    const wr = b['wrist.' + s], wantF = new Vector3().copy(want).add(new Vector3(-sx * .03, 0, .16)).normalize();
    if (wr) rotWorldQ(la, q.setFromUnitVectors(dirOf(la, wr), wantF));   /* الساعد: انثناء طبيعي خفيف (~9°) للأمام */
    const l2 = b['lowerarm02.' + s], fa = dirOf(la, l2 || la.children[0]);
    rotWorldQ(la, q.setFromAxisAngle(fa, MathUtils.degToRad(fem ? 32 : 30) * sx));
    if (l2 && l2.children.length) rotWorldQ(l2, q.setFromAxisAngle(dirOf(l2, l2.children[0]), MathUtils.degToRad(fem ? 36 : 34) * sx));
    /* الأصابع: انثناء طبيعي متدرّج (اليد المرتخية) — حول محور عمودي على مستوى الكف */
    const hand = b['wrist.' + s]; if (hand) {
      for (let f = 1; f <= 5; f++) for (let k = 1; k <= 3; k++) {
        const fb = b['finger' + f + '-' + k + '.' + s]; if (!fb || !fb.children.length) continue;
        const d = dirOf(fb, fb.children[0]), axis = new Vector3().crossVectors(d, new Vector3(0, 0, 1)).normalize();
        const deg = f === 1 ? [0, 8, 10][k - 1] : [12, 20, 14][k - 1] + (f - 2) * 3;
        if (axis.lengthSq() > .1) rotWorldQ(fb, q.setFromAxisAngle(axis, MathUtils.degToRad(deg) * -sx));
      }
    }
    /* الساقان: من وضعية A الأصلية إلى وقفة طبيعية (ميل خارجي صغير ثابت) */
    const ul = b['upperleg01.' + s], kn = b['lowerleg01.' + s];
    if (ul && kn) { const d = dirOf(ul, kn), lx = Math.sign(d.x) || 1, be = MathUtils.degToRad(fem ? 1.5 : 2.5); rotWorldQ(ul, q.setFromUnitVectors(d, new Vector3(lx * Math.sin(be), -Math.cos(be), d.z).normalize())); }
  }
}

/* =====================================================================
   CharView
   ===================================================================== */
const TIERS = {
  hi: { dpr: 2, subdiv: true, shadow: 2048, hair: 1, aa: true },
  mid: { dpr: 2, subdiv: true, shadow: 1024, hair: 1, aa: true },
  low: { dpr: 1.5, subdiv: false, shadow: 0, hair: .6, aa: true },
};
export class CharView {
  constructor(host, o) {
    this.host = host; this.o = o || {}; this.asset = this.o.asset; this.reduced = !!this.o.reduced;
    this.q = Object.assign({}, TIERS[this.o.quality] || TIERS.mid); this.q.dpr = Math.min(window.devicePixelRatio || 1, this.q.dpr);
    const cv = this.canvas = document.createElement('canvas'); cv.className = 'ch3-cv'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
    let r;
    try { r = this.renderer = new WebGLRenderer({ canvas: cv, antialias: this.q.aa, alpha: true, powerPreference: 'default', stencil: false, preserveDrawingBuffer: false }); }
    catch (e) { try { cv.remove(); } catch (x) {} throw fail('context', 'webgl context'); }
    r.outputColorSpace = SRGBColorSpace; r.toneMapping = NeutralToneMapping; r.toneMappingExposure = 1.0; r.setClearColor(0x000000, 0);
    if (this.q.shadow) { r.shadowMap.enabled = true; r.shadowMap.type = PCFSoftShadowMap; }
    this.scene = new Scene(); this.camera = new PerspectiveCamera(22, 1, .03, 30);
    this.env = makeEnv(r); this.scene.environment = this.env.texture; this.scene.environmentIntensity = .62;
    /* إضاءة استوديو: رئيسية دافئة بظل ناعم + تعبئة + حافتان + سماء/أرض */
    this.scene.add(new HemisphereLight(0xfff4ea, 0x3d342e, .38));
    const key = this.key = new DirectionalLight(0xfff0e0, 2.35); key.position.set(-1.25, 2.85, 2.35); key.target.position.set(0, 1.05, 0);
    if (this.q.shadow) { key.castShadow = true; key.shadow.mapSize.set(this.q.shadow, this.q.shadow); const c = key.shadow.camera; c.left = -.75; c.right = .75; c.top = 1.25; c.bottom = -1.25; c.near = .5; c.far = 7; key.shadow.bias = -.00025; key.shadow.normalBias = .018; key.shadow.radius = 4; }
    this.scene.add(key, key.target);
    const fill = new DirectionalLight(0xf3efff, .62); fill.position.set(2.3, 1.5, 2.0); this.scene.add(fill);
    const rim = new DirectionalLight(0xdce7ff, 1.45); rim.position.set(1.7, 2.7, -2.5); this.scene.add(rim);
    const rim2 = new DirectionalLight(0xffe4cf, .7); rim2.position.set(-2.1, 1.6, -2.0); this.scene.add(rim2);
    this.blobT = blobShadowTex();
    this.blob = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, toneMapped: false }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.scale.set(.95, .62, 1); this.blob.position.y = .0015; this.scene.add(this.blob);
    if (this.q.shadow) { this.ground = new Mesh(new PlaneGeometry(4, 4), new ShadowMaterial({ opacity: .12 })); this.ground.rotation.x = -Math.PI / 2; this.ground.position.y = .001; this.ground.receiveShadow = true; this.scene.add(this.ground); }
    this.turn = new Group(); this.scene.add(this.turn);
    this.blinkU = { value: 0 }; this.nextBlink = 1.5; this.blinkT = -1;
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
    const budget = Math.sqrt(2.6e6 / (w * h)); this.renderer.setPixelRatio(Math.max(1, Math.min(this.q.dpr, budget)));
    this.renderer.setSize(w, h, false); this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.dirty = true; this.kick();
  }
  setZoom(z) { this.zoomT = clamp(z); this.kick(); }
  setFocus(f, z) { this.focus = f || 'body'; this.setZoom(z == null ? (f === 'body' ? 0 : 1) : z); }
  rotateBy(a) { this.vyaw = 0; this.yaw += a; this.kick(); }

  data() {
    if (!this._data) {
      this._data = Promise.resolve().then(() => this.asset('char')).then(unpack).then(buf => { if (this.disposed) throw fail('disposed'); return parseCDC(buf); });
      this._data.catch(() => { this._data = null; });
    }
    return this._data;
  }
  topo(A) { if (!this._topo || this._topoA !== A) { this._topo = new Topo(A); this._topoA = A; } return this._topo; }
  authShape(A, sex) {
    this._auth = this._auth && this._authA === A ? this._auth : {}; this._authA = A;
    if (this._auth[sex]) return this._auth[sex];
    const M = A.meta, T = this.topo(A), b = (M.builds[sex] || []).find(x => x.id === 'avg') || M.builds[sex][0], src = A.get(b.pos), P = new Float32Array(M.nv * 3), S = new Float32Array(T.nsv * 3);
    const base = b.base ? A.get(M.builds[sex].find(x => x.id === b.base).pos) : null;
    for (let i = 0; i < P.length; i++) P[i] = (src[i] + (base ? base[i] : 0)) * M.q;
    T.subdivide(P, S, 3); return (this._auth[sex] = S.slice(0, M.nv * 3));
  }
  texture(name, o) {
    if (!name) return Promise.resolve(null);
    const k = name + (o && o.linear ? ':l' : '');
    if (!this.tex[k]) { const p = this.data().then(A => loadTex(A, name, o)); this.tex[k] = p; p.catch(() => { if (this.tex[k] === p) delete this.tex[k]; }); }
    return this.tex[k];
  }
  async rig(sex, thumb) {
    const A = await this.data(); if (this.disposed) throw fail('disposed');
    const k = (thumb ? 't:' : '') + sex;
    if (!this.rigs[k]) { const R = new Rig(this, A, sex); R.thumb = !!thumb; this.rigs[k] = R; this.turn.add(R.root); }
    return this.rigs[k];
  }
  material(kind, id, make) { const k = (this._mp || '') + kind + ':' + id; if (!this.mats[k]) this.mats[k] = make(); return this.mats[k]; }
  run(fn) { const p = this.queue.then(fn, fn); this.queue = p.catch(() => {}); return p; }
  setConfig(spec) {
    this.want = spec; const my = ++this.gen; this.state('loading');
    return this.run(async () => {
      if (this.disposed || my !== this.gen) return;
      try { await this.apply(this.want); if (!this.disposed && my === this.gen) { this.state('ready'); this.kick(); } }
      catch (e) { if (!this.disposed && e && e.code !== 'disposed') this.state('error', { code: e.code || 'asset', msg: e.message }); throw e; }
    });
  }
  /* القطع المطلوبة لمواصفة: [{slot, id}] */
  partsOf(spec) {
    const out = [['eyes', spec.eyes || 'eyes']];
    for (const [slot, v] of [['lashes', spec.lashes], ['brows', spec.brows], ['hair', spec.hair], ['beard', spec.beard], ['top', spec.top], ['bottom', spec.bottom], ['shoes', spec.shoes]])
      for (const id of [].concat(v || [])) if (id) out.push([slot, id]);
    return out;
  }
  async prepare(spec, thumb) {
    const A = await this.data(), M = A.meta, sk = M.skins[spec.sex] || [], need = [];
    const skA = sk.find(s => s.id === spec.skin.a) || sk[0], skB = sk.find(s => s.id === spec.skin.b) || skA;
    need.push(this.texture(skA.img), this.texture(skB.img), this.texture(M.tex.lut, { linear: true, flipY: false, crisp: true }), this.texture(M.tex.region, { linear: true }), this.texture(M.tex.detail, { linear: true, repeat: true }), this.texture(M.tex.stub, { linear: true, repeat: true }));
    if (M.eyeTex[spec.eye.tex]) need.push(this.texture(M.eyeTex[spec.eye.tex]));
    for (const [slot, id] of this.partsOf(spec)) {
      const pr = A.byId[id]; if (!pr) continue;
      if (pr.tex) need.push(this.texture(pr.tex)); if (pr.nrm) need.push(this.texture(pr.nrm, { linear: true }));
    }
    if (M.tex.knit) need.push(this.texture(M.tex.knit, { linear: true, repeat: true }));
    const R = await this.rig(spec.sex, thumb); await Promise.all(need);
    return { A, R, skA, skB };
  }
  async apply(spec, thumb) {
    const { A, R, skA, skB } = await this.prepare(spec, thumb); if (this.disposed) return;
    const M = A.meta; this._A = A; this._mp = thumb ? 't:' : '';
    const tx = {}; for (const k in this.tex) { try { tx[k] = await this.tex[k]; } catch (e) {} }
    R.shape(spec); R.ver = (R.ver || 0) + 1; R.rebind();
    for (const k in R.parts) R.parts[k].mesh.visible = false;
    const faces = new Uint8Array(R.T.nf); let hideKey = '';
    for (const [slot, id] of this.partsOf(spec)) {
      const P = R.part(id); if (!P) continue;
      if (P.garment) { R.fitGarment(P); const hf = P.hide; for (let f = 0; f < hf.length; f++) if (hf[f]) faces[f] = 1; hideKey += id + '|'; }
      else if (P.strands) R.fitStrands(P);
      else R.fit(P);
      P.mesh.material = this.partMat(slot, P.pr, tx, spec);
      if (P.strands && !P.mesh.customDepthMaterial) P.mesh.customDepthMaterial = hairDepthMaterial(P.mesh.material.map);
      P.mesh.visible = true; P.mesh.renderOrder = slot === 'hair' ? 4 : slot === 'beard' ? 3 : slot === 'brows' || slot === 'lashes' ? 2 : 0;
    }
    R.writeBody(hideKey ? { key: hideKey, faces } : null);
    R.masks(spec.scalpMask || '', spec.beardMask || '', spec.capMask || '');
    const u = R.skinU, hc = new Color(spec.hairColor || '#2a1d14'), bc = new Color(spec.beardColor || spec.hairColor || '#2a1d14');
    u.uScalpCol.value.copy(hc).multiplyScalar(.55); u.uScalpAmt.value = clamp(spec.scalpTint || 0); u.uBuzz.value = clamp(spec.buzz || 0);
    u.uBeardCol.value.copy(bc).multiplyScalar(.75); u.uBeardAmt.value = clamp(spec.beardTint || 0);
    R.skinMat.map = tx[skA.img]; u.uSkin2.value = tx[skB.img]; u.uSkinMix.value = clamp(spec.skin.mix || 0); u.uSkinTint.value.set(spec.skin.tint || '#ffffff'); u.uUnder.value.set(spec.skin.under || '#ffffff');
    u.uRed.value = spec.skin.red == null ? .6 : spec.skin.red; u.uLUT.value = tx[M.tex.lut + ':l']; u.uRegion.value = tx[M.tex.region + ':l']; u.uStub.value = tx[M.tex.stub + ':l'];
    u.uTrans.value = spec.skin.trans == null ? .55 : spec.skin.trans;
    R.skinMat.roughnessMap = tx[M.tex.region + ':l']; R.skinMat.roughness = spec.skin.rough == null ? 1 : spec.skin.rough;
    const det = tx[M.tex.detail + ':l']; if (det) { det.repeat.set(M.tex.detailRep || 40, M.tex.detailRep || 40); R.skinMat.normalMap = det; R.skinMat.normalScale = new Vector2(.55, .55); }
    R.skinMat.needsUpdate = !R._skinOnce; R._skinOnce = true;
    if (!thumb) for (const k in this.rigs) this.rigs[k].root.visible = k === spec.sex;
    R.body.geometry.computeBoundingBox(); R.box.copy(R.body.geometry.boundingBox);
    const hi = M.bones.findIndex(b => b.n === 'head'), hb = R.heads[hi], ht = R.tails[hi];
    R.headC.set(0, hb.y + (ht.y - hb.y) * .45, hb.z + .02); R.headTop = ht.y;
    const ep = R.parts[spec.eyes || 'eyes']; if (ep) { ep.g.computeBoundingBox(); const eb = ep.g.boundingBox; R.eyeC.set(0, (eb.min.y + eb.max.y) / 2, (eb.min.z + eb.max.z) / 2); } else R.eyeC.copy(R.headC);
    this._mp = '';
    if (thumb) { this.tcur = R; return; }
    this.cur = R; this.spec = spec; this.dirty = true;
  }
  partMat(slot, pr, tx, spec) {
    const M = this._A.meta;
    if (slot === 'eyes') {
      const e = spec.eye, U = { uIris0: { value: new Vector2().fromArray(M.eye.c0) }, uIris1: { value: new Vector2().fromArray(M.eye.c1) }, uIrisR: { value: M.eye.r }, uIrisDepth: { value: M.eye.depth || .0016 }, uIrisTint: { value: new Color(e.tint || '#ffffff') } };
      const ball = this.material('eyes', e.tex + '|' + (e.tint || ''), () => eyeMaterial(tx[M.eyeTex[e.tex]], U));
      const cornea = this.material('cornea', '1', () => new MeshPhysicalMaterial({ color: 0xffffff, roughness: .03, metalness: 0, transparent: true, opacity: .12, depthWrite: false, envMapIntensity: 2.2, ior: 1.376, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: .015 }));
      return [ball, cornea];
    }
    if (pr.kind === 'garment') {
      const col = spec.colors && spec.colors[slot] || pr.color || '#7a7d80';
      const m = this.material('cloth', pr.id, () => { const U = { uClothCol: { value: new Color() } }, mm = clothMaterial({ knit: tx[M.tex.knit + ':l'] }, U); mm.userData.U = U; return mm; });
      if (m.normalMap) m.normalMap.repeat.set(pr.knitRep || 90, pr.knitRep || 90);
      m.userData.U.uClothCol.value.set(col); return m;
    }
    if (slot === 'shoes') return this.material('shoe', pr.id, () => new MeshPhysicalMaterial({ map: tx[pr.tex], normalMap: pr.nrm ? tx[pr.nrm + ':l'] : null, roughness: .72, metalness: 0, envMapIntensity: .5, sheen: .2 }));
    if (slot === 'lashes') return this.material('lash', pr.id, () => {
      const m = new MeshStandardMaterial({ map: tx[pr.tex], color: 0x18110e, roughness: .55, metalness: 0, transparent: true, depthWrite: false, alphaTest: .04, side: DoubleSide, envMapIntensity: .3 });
      m.onBeforeCompile = sh => { sh.uniforms.uBlink = this.blinkU; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aBk; uniform float uBlink;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += aBk * uBlink;'); };
      m.customProgramCacheKey = () => 'codis-lash3'; return m;
    });
    /* شعر/لحية/حاجب/رمش: بطاقات خصل */
    const col = slot === 'beard' ? (spec.beardColor || spec.hairColor) : slot === 'brows' ? (spec.browColor || spec.hairColor) : slot === 'lashes' ? '#120d0b' : spec.hairColor;
    const tip = slot === 'hair' ? (spec.hairTip || col) : col, blend = slot === 'brows' || slot === 'lashes';
    const U = { uHairCol: { value: new Color() }, uTipCol: { value: new Color() }, uShift1: { value: -.08 }, uShift2: { value: .12 }, uSpec1: { value: .075 }, uSpec2: { value: .13 }, uExp1: { value: 140 }, uExp2: { value: 42 } };
    const m = this.material('hair', pr.id, () => { const mm = hairMaterial(U, tx[pr.tex], { blend, alphaTest: blend ? .02 : pr.alphaTest }); mm.userData.U = U; return mm; });
    const Uu = m.userData.U; Uu.uHairCol.value.set(col || '#2a1d14'); Uu.uTipCol.value.set(tip || col || '#2a1d14');
    if (slot === 'lashes' || slot === 'brows') { Uu.uSpec1.value = .05; Uu.uSpec2.value = .06; }
    return m;
  }
  /* --- الكاميرا: body · torso · face · eyes · hair · beard --- */
  frame(z, cam, R) {
    R = R || this.cur; if (!R) return;
    cam = cam || this.camera; const box = R.box, h = box.max.y - box.min.y, fov = MathUtils.degToRad(cam.fov), asp = cam.aspect, tf = Math.tan(fov / 2);
    const bodyH = h * 1.08, bodyW = Math.max(.62, (box.max.x - box.min.x) * 1.1);
    const dFull = Math.max(bodyH / 2 / tf, bodyW / 2 / (tf * asp));
    const F = { face: [.33, .27, R.headC.y - .012, R.headC.z], eyes: [.11, .2, R.eyeC.y + .004, R.eyeC.z - .02], hair: [.52, .46, R.headC.y - .03, R.headC.z - .02], beard: [.3, .26, R.headC.y - .045, R.headC.z], torso: [.98, .66, R.headC.y - .37, 0] }[this.focus] || [.33, .27, R.headC.y - .012, R.headC.z];
    const dFace = Math.max(F[0] / 2 / tf, F[1] / 2 / (tf * asp));
    const e = z * z * (3 - 2 * z), ty = MathUtils.lerp(box.min.y + h * .5, F[2], e), d = MathUtils.lerp(dFull, dFace, e);
    const tz = MathUtils.lerp(0, F[3], e), elev = MathUtils.lerp(.05, this.focus === 'eyes' ? 0 : .012, e);
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
    if (this.cur && idle) { const s = (t - this.t0) / 1000; this.breathe(s); this.blink(s); }
    if (busy || idle || this.dirty) {
      if (busy || this.dirty || this.blinkT >= 0 || (this.frameSkip = (this.frameSkip + 1) % 2) === 0) this.render();
      this.dirty = false; this.raf = requestAnimationFrame(x => this.loop(x));
    } else this.running = false;
  }
  /* رمش طبيعي: فواصل 2.4–6ث، إغلاق ~70ms وفتح ~110ms، رمشة مزدوجة أحياناً */
  blink(s) {
    if (this.blinkT < 0 && s >= this.nextBlink) { this.blinkT = s; this.dbl = Math.random() < .14; }
    if (this.blinkT < 0) { this.blinkU.value = 0; return; }
    const x = s - this.blinkT, c = .07, o = .11, tot = c + o;
    let v = x < c ? x / c : x < tot ? 1 - (x - c) / o : 0; v = v * v * (3 - 2 * v);
    this.blinkU.value = v;
    if (x >= tot) { if (this.dbl) { this.dbl = false; this.blinkT = s + .06; } else { this.blinkT = -1; this.nextBlink = s + 2.4 + Math.random() * 3.6; } }
  }
  breathe(s, R) {
    R = R || this.cur; const b = R.byName, q = new Quaternion(), X = new Vector3(1, 0, 0), Zv = new Vector3(0, 0, 1);
    const br = Math.sin(s * 1.55) * .009, sw = Math.sin(s * .5) * .006, sw2 = Math.sin(s * .37 + 1.3) * .004;
    for (const [k, a, ax] of [['spine03', br, X], ['spine01', br * .6, X], ['neck01', -br * .5, X], ['head', sw, Zv], ['spine05', sw2, Zv]]) if (b[k] && R.restQ[k]) b[k].quaternion.copy(R.restQ[k]).multiply(q.setFromAxisAngle(ax, a));
  }
  render() {
    if (this.lost || this.disposed) return;
    this.turn.rotation.y = this.yaw; this.frame(this.zoom);
    this.renderer.render(this.scene, this.camera);
  }
  snapshot(spec, o) {
    o = o || {};
    return this.run(async () => {
      if (this.disposed || this.lost) return '';
      await this.apply(spec, true); if (this.disposed || !this.tcur) return '';
      const T = this.tcur, vis = {}; for (const k in this.rigs) { vis[k] = this.rigs[k].root.visible; this.rigs[k].root.visible = this.rigs[k] === T; }
      const prevF = this.focus, prevB = this.blinkU.value; this.focus = o.focus || 'face'; this.blinkU.value = 0;
      this.turn.rotation.y = o.yaw == null ? -.32 : o.yaw; if (this.o.idle !== false) this.breathe(0, T);
      const cam = this.camera.clone(); cam.aspect = o.aspect || 1; cam.updateProjectionMatrix();
      const S = o.size || 160, W = Math.round(S * (o.aspect || 1)), H = S;
      const r = this.renderer, oldPR = r.getPixelRatio();
      r.setPixelRatio(1); r.setSize(W * 2, H * 2, false);
      this.frame(o.z == null ? 1 : o.z, cam, T); r.render(this.scene, cam);
      let url = ''; try { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(this.canvas, 0, 0, W * 2, H * 2, 0, 0, W, H); url = c.toDataURL('image/png'); } catch (e) {}
      for (const k in vis) this.rigs[k].root.visible = vis[k];
      r.setPixelRatio(oldPR); this.W = this.H = 0; this.resize(); this.focus = prevF; this.blinkU.value = prevB;
      this.render();
      return url;
    });
  }
  info() { const i = this.renderer.info; return { calls: i.render.calls, tris: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, programs: (i.programs || []).length, dpr: this.renderer.getPixelRatio(), tier: this.o.quality || 'mid', subdiv: this.q.subdiv }; }
  dispose() {
    if (this.disposed) return; this.disposed = true; this.stop(); this.gen++;
    for (const [el, ev, fn, op] of this.L) el.removeEventListener(ev, fn, op);
    try { this.ro && this.ro.disconnect(); this.io && this.io.disconnect(); } catch (e) {}
    for (const k in this.rigs) this.rigs[k].dispose();
    for (const k in this.mats) { const m = this.mats[k]; try { (Array.isArray(m) ? m : [m]).forEach(x => x.dispose()); } catch (e) {} }
    for (const k in this.tex) this.tex[k].then(t => t && t.dispose(), () => {});
    try { this.blob.geometry.dispose(); this.blob.material.dispose(); this.blobT.dispose(); this.env.dispose(); if (this.ground) { this.ground.geometry.dispose(); this.ground.material.dispose(); } } catch (e) {}
    try { this.renderer.dispose(); this.renderer.forceContextLoss(); } catch (e) {}
    try { this.canvas.remove(); } catch (e) {}
    this.rigs = {}; this.tex = {}; this.mats = {}; this.scene = null; this._data = null; this._topo = null;
  }
}

export function create(host, o) { return new CharView(host, o); }
