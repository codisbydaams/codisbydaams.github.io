/* CODIS-BOX3D v2 — خمسة مجسّمات حقيقية بالكود. كل صندوق: جسم مجوّف بجدران مشطوفة الحواف (RoundedBox) + أرضية + تبطين،
   غطاء بسماكة يدور حول محور مفصلاته الفعلي (عُقد مفصلات متناوبة: جسم/غطاء/جسم)، لوح قفل بثقب مفتاح + لسان (hasp) يتحرّر،
   أشرطة/زوايا/مسامير معدنية، وخامات PBR مولّدة (خشب ألواح/جلد/حجر بعروق/ورنيش بطبقة لمعان) مع خرائط نتوء وخشونة.
   الشخصيات: 1 خشب بلوط وبرونز مطروق · 2 جلد كحلي بغطاء أسطواني وفضة مصقولة · 3 حجر أوبسيديان برونات وعناقيد كريستال
   4 ورنيش قرمزي بزخارف ذهبية وأرجل كروية · 5 ذخيرة ثمانية على قاعدة مدرّجة بأعمدة وأجنحة وتاج كريستالي.
   الأجزاء الساكنة تُدمج حسب الخامة (بضع مشابك رسم لكل صندوق)؛ الأجزاء المتحركة (الغطاء، القفل) منفصلة. */
import {
  Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, OctahedronGeometry, PlaneGeometry, CircleGeometry, ConeGeometry, Shape, ExtrudeGeometry,
  MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, AdditiveBlending, DoubleSide, Vector3, Color
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { tex, woodSet, leatherSet, stoneSet, lacquerSet, metalSet, filigreeCanvas, runeCanvas, emblemCanvas } from './tex.js';
import { rng } from './util.js';

/* لون ضوء الصندوق (قبل أن يتحول للون الجائزة الفعلية) ولون الحافة/الدرزة */
export const TINT = [null,
  { light: [255, 178, 96], edge: [255, 196, 120] },
  { light: [150, 210, 255], edge: [196, 238, 255] },
  { light: [110, 190, 255], edge: [120, 220, 255] },
  { light: [255, 196, 96], edge: [255, 150, 70] },
  { light: [255, 224, 150], edge: [140, 230, 255] }];

export class Lib {
  constructor(S) { this.t = {}; this.m = {}; this.S = S || 512; }
  tex(k, f) { return this.t[k] || (this.t[k] = f()); }
  mat(k, f) { return this.m[k] || (this.m[k] = f()); }
  disposeAll() { Object.keys(this.t).forEach(k => { try { this.t[k].dispose(); } catch (e) {} }); Object.keys(this.m).forEach(k => { try { this.m[k].dispose(); } catch (e) {} }); this.t = {}; this.m = {}; }
}

function bake(group) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert(), by = new Map(), done = [];
  group.traverse(o => {
    if (o === group || !o.isMesh) return;
    let a = o, dyn = false; while (a && a !== group) { if (a.userData.keep) { dyn = true; break; } a = a.parent; }
    if (dyn) return;
    const g = o.geometry.clone().applyMatrix4(inv.clone().multiply(o.matrixWorld));
    const ng = g.index ? g.toNonIndexed() : g; if (ng !== g) g.dispose();
    Object.keys(ng.attributes).forEach(n => { if (n !== 'position' && n !== 'normal' && n !== 'uv') ng.deleteAttribute(n); });
    if (!ng.attributes.uv) { const n = ng.attributes.position.count; ng.setAttribute('uv', new (ng.attributes.position.constructor)(new Float32Array(n * 2), 2)); }
    const k = o.material.uuid; if (!by.has(k)) by.set(k, { mat: o.material, geos: [] }); by.get(k).geos.push(ng);
    done.push(o);
  });
  done.forEach(o => { o.parent.remove(o); o.geometry.dispose(); });
  by.forEach(v => { const geo = mergeGeometries(v.geos, false); v.geos.forEach(g => g.dispose()); if (!geo) return; const m = new Mesh(geo, v.mat); m.castShadow = true; m.receiveShadow = true; group.add(m); });
}
const RB = (w, h, d, r = .025, s = 2) => new RoundedBoxGeometry(w, h, d, s, Math.max(.002, Math.min(r, w / 2 - .002, h / 2 - .002, d / 2 - .002)));

export function buildBox(n, lib) {
  const T = TINT[n], S = lib.S, R = rng(100 + n);
  const root = new Group(); root.name = 'box';
  const body = new Group(); body.name = 'body'; root.add(body);
  const lidPivot = new Group(); lidPivot.name = 'lidPivot'; root.add(lidPivot);
  const lidG = new Group(); lidG.name = 'lidG'; lidPivot.add(lidG);
  const lockPivot = new Group(); lockPivot.name = 'lockPivot'; lockPivot.userData.keep = true; lidG.add(lockPivot);
  const instMats = [];
  const add = (g, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
  const std = (k, o) => lib.mat(k, () => new MeshStandardMaterial(o));
  const phys = (k, o) => lib.mat(k, () => new MeshPhysicalMaterial(o));
  const inst = (m, k) => { m.userData.inst = true; m.userData.k = k; instMats.push(m); return m; };
  const glow = (k, col) => inst(new MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), k);
  const crystalMat = (col, em, k) => { const m = new MeshPhysicalMaterial({ color: col, emissive: em, emissiveIntensity: .9, roughness: .06, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, flatShading: true, envMapIntensity: 1.6 }); m.userData.gem = true; return inst(m, k); };
  /* معدن: لون + خشونة مولّدة + نتوء (مصقول/مطروق) */
  const metal = (k, col, rough, kind) => lib.mat(k, () => { const ms = lib.tex('mt_' + kind, () => metalSet(S / 2, kind, { seed: 11 + kind.length })); const rt = lib.tex('mr_' + kind, () => tex(ms.rough, [1, 1], false)), bt = lib.tex('mb_' + kind, () => tex(ms.bump, [1, 1], false)); return new MeshStandardMaterial({ color: col, metalness: 1, roughness: rough, roughnessMap: rt, bumpMap: bt, bumpScale: kind === 'hammered' ? 1.2 : .4, envMapIntensity: 1.15 }); });
  const emb = lib.mat('embm', () => new MeshStandardMaterial({ map: lib.tex('emb', () => tex(emblemCanvas('#0c0d10', '#f4f6f8', '#38e1e6', 512), null)), roughness: .3, metalness: .25 }));
  const keyhole = std('kh', { color: 0x060504, roughness: .95, metalness: .1 });
  let w, d, h, lidH, t = .085, tf = .09, kind = 'rect', ap = 0, lidKind = 'flat';
  let outer, lining, trim, trim2, strap, gemA, gemB, cyan;

  /* ================= الخامات والأبعاد ================= */
  if (n === 1) {
    w = 2.3; d = 1.5; h = 1.0; lidH = .3;
    outer = lib.mat('1o', () => { const s = woodSet(S, '#7a4a26', { seed: 3, planks: 4 }); return new MeshStandardMaterial({ map: tex(s.map, [1, 1]), bumpMap: tex(s.bump, [1, 1], false), bumpScale: 1.6, roughness: .74, metalness: 0 }); });
    lining = lib.mat('1l', () => { const s = leatherSet(S / 2, '#5a2a16', { seed: 4 }); return new MeshStandardMaterial({ map: tex(s.map, [2, 2]), roughness: .95 }); });
    trim = metal('1t', 0xb07c3e, .42, 'hammered'); trim2 = metal('1t2', 0x6e4a24, .5, 'hammered');
    gemA = crystalMat(0xffb35a, 0xff7a18, 'g1');
  } else if (n === 2) {
    w = 2.25; d = 1.45; h = .95; lidH = .1 + (d / 2) * .56; lidKind = 'barrel';
    outer = lib.mat('2o', () => { const s = leatherSet(S, '#1a2a56', { seed: 12 }); return new MeshStandardMaterial({ map: tex(s.map, [1.4, 1]), bumpMap: tex(s.bump, [1.4, 1], false), bumpScale: 1.1, roughness: .58, metalness: .05 }); });
    lining = lib.mat('2l', () => { const s = leatherSet(S / 2, '#2c4a8a', { seed: 14 }); return new MeshStandardMaterial({ map: tex(s.map, [2, 2]), roughness: .95 }); });
    trim = metal('2t', 0xe6ebf0, .2, 'brushed'); trim2 = metal('2t2', 0x9aa4ae, .32, 'brushed');
    gemA = crystalMat(0x7fe9ff, 0x18b8d8, 'g2');
  } else if (n === 3) {
    w = 1.62; d = 1.62; h = 1.5; lidH = .3;
    outer = inst(lib.mat('3o', () => { const s = stoneSet(S, '#1d1b2e', { seed: 21, vein: [150, 200, 255], veins: 9 }); return new MeshPhysicalMaterial({ map: tex(s.map, [1, 1]), bumpMap: tex(s.bump, [1, 1], false), bumpScale: 1.2, roughness: .38, metalness: .1, clearcoat: .7, clearcoatRoughness: .25, emissive: 0x3aa8ff, emissiveMap: tex(runeCanvas(S, { seed: 17, n: 5, y: .5 }), [1, 1]), emissiveIntensity: .25 }); }).clone(), 'rune');
    lining = lib.mat('3l', () => { const s = leatherSet(S / 2, '#22163e', { seed: 23 }); return new MeshStandardMaterial({ map: tex(s.map, [2, 2]), roughness: .95 }); });
    trim = metal('3t', 0xc9d2dc, .26, 'brushed'); trim2 = metal('3t2', 0x4c535c, .4, 'hammered');
    gemA = crystalMat(0x8fdcff, 0x1f86f0, 'g3');
  } else if (n === 4) {
    w = 2.2; d = 1.42; h = 1.02; lidH = .34;
    outer = lib.mat('4o', () => new MeshPhysicalMaterial({ map: tex(lacquerSet(S, '#7c1220', { seed: 31 }).map, [1, 1]), roughness: .42, metalness: 0, clearcoat: 1, clearcoatRoughness: .12 }));
    lining = lib.mat('4l', () => { const s = leatherSet(S / 2, '#4b0d16', { seed: 35 }); return new MeshStandardMaterial({ map: tex(s.map, [2, 2]), roughness: .95 }); });
    trim = lib.mat('4t', () => { const f = tex(filigreeCanvas(S / 2, { seed: 5 }), [1, 1], false); return new MeshStandardMaterial({ color: 0xf0c060, metalness: 1, roughness: .28, bumpMap: f, bumpScale: 1.4, envMapIntensity: 1.25 }); });
    trim2 = metal('4t2', 0xb9852c, .36, 'hammered');
    strap = std('4s', { color: 0x17110d, roughness: .45, metalness: .3 });
    gemA = crystalMat(0xffb02e, 0xff7a10, 'g4');
  } else {
    kind = 'oct'; ap = .98; h = 1.3; lidH = .4; w = d = ap * 2;
    outer = inst(lib.mat('5o', () => { const s = stoneSet(S, '#2a1f40', { seed: 41, vein: [255, 214, 140], veins: 8 }); return new MeshPhysicalMaterial({ map: tex(s.map, [1.5, 1]), bumpMap: tex(s.bump, [1.5, 1], false), bumpScale: 1.2, roughness: .4, metalness: .12, clearcoat: .8, clearcoatRoughness: .2, emissive: 0xffc860, emissiveMap: tex(runeCanvas(S, { seed: 19, n: 3, y: .5, frame: false }), [1.5, 1]), emissiveIntensity: .2 }); }).clone(), 'rune');
    lining = lib.mat('5l', () => { const s = leatherSet(S / 2, '#241231', { seed: 43 }); return new MeshStandardMaterial({ map: tex(s.map, [2, 2]), roughness: .95 }); });
    trim = lib.mat('5t', () => { const f = tex(filigreeCanvas(S / 2, { seed: 9, cells: 3 }), [1, 1], false); return new MeshStandardMaterial({ color: 0xf2c868, metalness: 1, roughness: .26, bumpMap: f, bumpScale: 1.2, envMapIntensity: 1.3 }); });
    trim2 = metal('5t2', 0x8a6320, .4, 'hammered');
    gemA = crystalMat(0x9fe6ff, 0x2a98ff, 'g5'); gemB = crystalMat(0xffc65a, 0xff8a10, 'g5b');
  }
  cyan = glow('cy', (T.edge[0] << 16) | (T.edge[1] << 8) | T.edge[2]);
  const rivet = (g, x, y, z, r = .028, mat = trim) => add(g, new SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z, Math.PI / 2, 0, 0);
  const rivetsRow = (g, x0, x1, y, z, k, r) => { for (let i = 0; i < k; i++) rivet(g, x0 + (x1 - x0) * (k > 1 ? i / (k - 1) : .5), y, z, r); };
  /* عنقود كريستال: منشورات سداسية بقمم مدببة بميلان عشوائي */
  const cluster = (g, x, y, z, s, mat, cnt = 4) => {
    for (let i = 0; i < cnt; i++) {
      const L = s * (i ? .55 + R() * .4 : 1), r = s * (i ? .13 + R() * .05 : .19), geo = new CylinderGeometry(r, r * 1.08, L, 6); const tip = new ConeGeometry(r, L * .38, 6); tip.translate(0, L / 2 + L * .19, 0); const m = mergeGeometries([geo.toNonIndexed(), tip.toNonIndexed()], false); geo.dispose(); tip.dispose();
      m.translate(0, L / 2, 0); const a = i ? (i / (cnt - 1)) * 6.28 + R() : 0, tilt = i ? .35 + R() * .3 : 0;
      add(g, m, mat, x + Math.cos(a) * s * .12 * (i ? 1 : 0), y, z + Math.sin(a) * s * .12 * (i ? 1 : 0), Math.sin(a) * tilt, R() * 3, -Math.cos(a) * tilt);
    }
  };
  const medallion = (g, r, x, y, z, ring, segs = 48, rot = 0) => { const c = new CylinderGeometry(r, r, .05, segs); c.rotateX(Math.PI / 2); if (rot) c.rotateZ(rot); add(g, c, keyhole, x, y, z); add(g, new CircleGeometry(r * .97, segs, rot), emb, x, y, z + .026); const tr = new TorusGeometry(r * 1.06, r * .12, 10, segs); if (rot) tr.rotateZ(rot); add(g, tr, ring || trim, x, y, z + .03); };

  /* ================= الجسم المجوّف ================= */
  if (kind === 'rect') {
    add(body, RB(w, tf, d, .03), outer, 0, tf / 2, 0);
    add(body, RB(w, h, t, .03), outer, 0, h / 2, d / 2 - t / 2);
    add(body, RB(w, h, t, .03), outer, 0, h / 2, -d / 2 + t / 2);
    add(body, RB(t, h, d - .02, .03), outer, -w / 2 + t / 2, h / 2, 0);
    add(body, RB(t, h, d - .02, .03), outer, w / 2 - t / 2, h / 2, 0);
    const ih = h - tf, e = .003;
    add(body, new PlaneGeometry(w - 2 * t, d - 2 * t), lining, 0, tf + e, 0, -Math.PI / 2);
    add(body, new PlaneGeometry(w - 2 * t, ih), lining, 0, tf + ih / 2, d / 2 - t - e, 0, Math.PI);
    add(body, new PlaneGeometry(w - 2 * t, ih), lining, 0, tf + ih / 2, -d / 2 + t + e, 0, 0);
    add(body, new PlaneGeometry(d - 2 * t, ih), lining, -w / 2 + t + e, tf + ih / 2, 0, 0, Math.PI / 2);
    add(body, new PlaneGeometry(d - 2 * t, ih), lining, w / 2 - t - e, tf + ih / 2, 0, 0, -Math.PI / 2);
    /* حافة الفتحة: إطار رفيع من المعدن الثانوي على أعلى الجدران */
    add(body, RB(w + .01, .03, t + .02, .01), trim2, 0, h - .012, d / 2 - t / 2); add(body, RB(w + .01, .03, t + .02, .01), trim2, 0, h - .012, -d / 2 + t / 2);
    add(body, RB(t + .02, .03, d, .01), trim2, -w / 2 + t / 2, h - .012, 0); add(body, RB(t + .02, .03, d, .01), trim2, w / 2 - t / 2, h - .012, 0);
    /* خط التسريب الضوئي بالدرزة */
    add(body, BOXG(w + .012, .018, .03), cyan, 0, h + .004, d / 2 + .004); add(body, BOXG(w + .012, .018, .03), cyan, 0, h + .004, -d / 2 - .004);
    add(body, BOXG(.03, .018, d + .012), cyan, w / 2 + .004, h + .004, 0); add(body, BOXG(.03, .018, d + .012), cyan, -w / 2 - .004, h + .004, 0);
  } else {
    const k8 = Math.cos(Math.PI / 8), tw = 2 * ap * Math.tan(Math.PI / 8) + .014;
    const floor = new CylinderGeometry(ap / k8, ap / k8, tf, 8); floor.rotateY(Math.PI / 8); add(body, floor, outer, 0, tf / 2, 0);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, px = Math.sin(a), pz = Math.cos(a), ra = ap - t / 2; add(body, RB(tw, h, t, .02), outer, px * ra, h / 2, pz * ra, 0, a, 0); add(body, new PlaneGeometry(tw - .03, h - tf), lining, px * (ap - t - .004), tf + (h - tf) / 2, pz * (ap - t - .004), 0, a + Math.PI, 0); }
    const oct = new CylinderGeometry((ap - t) / k8, (ap - t) / k8, .002, 8); oct.rotateY(Math.PI / 8); add(body, oct, lining, 0, tf + .002, 0);
    const twl = 2 * ap * Math.tan(Math.PI / 8); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; add(body, BOXG(twl, .018, .03), cyan, Math.sin(a) * (ap + .004), h + .004, Math.cos(a) * (ap + .004), 0, a, 0); }
  }

  /* ================= شخصية كل مستوى (الجسم) ================= */
  const corner4 = fn => { [-1, 1].forEach(sx => [-1, 1].forEach(sz => fn(sx, sz))); };
  if (n === 1) {
    /* زوايا برونز مطروق بشكل L + أشرطة عمودية بمسامير + حلقتا حمل جانبيتان */
    corner4((sx, sz) => { add(body, RB(.22, h + .02, .03, .012), trim, sx * (w / 2 - .1), h / 2, sz * (d / 2 + .012)); add(body, RB(.03, h + .02, .22, .012), trim, sx * (w / 2 + .012), h / 2, sz * (d / 2 - .1)); [.12, .5, .88].forEach(fy => { rivet(body, sx * (w / 2 - .1), h * fy, sz * (d / 2 + .028), .024); rivet(body, sx * (w / 2 + .028), h * fy, sz * (d / 2 - .1), .024); }); });
    [-.62, .62].forEach(x => { add(body, RB(.2, h + .006, .026, .01), trim2, x, h / 2, d / 2 + .01); add(body, RB(.2, h + .006, .026, .01), trim2, x, h / 2, -d / 2 - .01); [.16, .5, .84].forEach(fy => rivet(body, x, h * fy, d / 2 + .024, .022)); });
    [.07, h - .1].forEach(y => { add(body, RB(w + .02, .06, .02, .008), trim2, 0, y, d / 2 + .008); add(body, RB(w + .02, .06, .02, .008), trim2, 0, y, -d / 2 - .008); });
    [-1, 1].forEach(s => { add(body, RB(.03, .2, .28, .01), trim, s * (w / 2 + .015), h * .62, 0); const r = new TorusGeometry(.11, .022, 10, 28); r.rotateY(Math.PI / 2); add(body, r, trim, s * (w / 2 + .04), h * .5, 0); });
  } else if (n === 2) {
    corner4((sx, sz) => { add(body, RB(.14, h + .02, .14, .03), trim, sx * (w / 2 - .02), h / 2, sz * (d / 2 - .02)); [.18, .5, .82].forEach(fy => { rivet(body, sx * (w / 2 + .05), h * fy, sz * (d / 2 - .02), .022, trim2); }); });
    [.08, h - .12].forEach(y => { add(body, RB(w + .03, .09, .03, .012), trim, 0, y, d / 2 + .004); add(body, RB(w + .03, .09, .03, .012), trim, 0, y, -d / 2 - .004); add(body, RB(.03, .09, d + .03, .012), trim, w / 2 + .004, y, 0); add(body, RB(.03, .09, d + .03, .012), trim, -w / 2 - .004, y, 0); });
    rivetsRow(body, -w / 2 + .25, w / 2 - .25, h * .45, d / 2 + .004, 9, .018);
    medallion(body, .26, 0, h * .46, d / 2 + .02, trim, 8, Math.PI / 8);
    [-1, 1].forEach(s => { const r = new TorusGeometry(.12, .02, 10, 28); r.rotateY(Math.PI / 2); add(body, RB(.03, .16, .26, .01), trim, s * (w / 2 + .015), h * .62, 0); add(body, r, trim, s * (w / 2 + .04), h * .5, 0); });
  } else if (n === 3) {
    corner4((sx, sz) => { add(body, RB(.2, h + .03, .2, .04), trim2, sx * (w / 2 - .04), h / 2, sz * (d / 2 - .04)); add(body, RB(.22, .06, .22, .02), trim, sx * (w / 2 - .04), h * .3, sz * (d / 2 - .04)); add(body, RB(.22, .06, .22, .02), trim, sx * (w / 2 - .04), h * .75, sz * (d / 2 - .04)); cluster(body, sx * (w / 2 + .02), .02, sz * (d / 2 + .02), .26, gemA, 3); });
    [.1, h - .12].forEach(y => { add(body, RB(w + .02, .07, .03, .012), trim, 0, y, d / 2 + .004); add(body, RB(w + .02, .07, .03, .012), trim, 0, y, -d / 2 - .004); add(body, RB(.03, .07, d + .02, .012), trim, w / 2 + .004, y, 0); add(body, RB(.03, .07, d + .02, .012), trim, -w / 2 - .004, y, 0); });
    add(body, RB(.58, .58, .045, .03), trim, 0, h * .5, d / 2 + .012, 0, 0, Math.PI / 4); medallion(body, .21, 0, h * .5, d / 2 + .04, trim2, 40);
  } else if (n === 4) {
    /* أرجل كروية ذهبية + زوايا مزخرفة + شريطان أسودان بجواهر كهرمان + ميدالية */
    corner4((sx, sz) => { add(body, new SphereGeometry(.1, 18, 12), trim, sx * (w / 2 - .1), -.04, sz * (d / 2 - .1)); add(body, RB(.24, .3, .24, .04), trim, sx * (w / 2 - .06), .15, sz * (d / 2 - .06)); add(body, RB(.2, .2, .2, .04), trim, sx * (w / 2 - .06), h - .1, sz * (d / 2 - .06)); add(body, RB(.06, h * .5, .06, .02), trim2, sx * (w / 2 + .005), h * .5, sz * (d / 2 + .005)); });
    [-.6, .6].forEach(x => { add(body, RB(.24, h + .004, .028, .008), strap, x, h / 2, d / 2 + .006); add(body, RB(.24, h + .004, .028, .008), strap, x, h / 2, -d / 2 - .006); const g = add(body, new OctahedronGeometry(.085, 0), gemA, x, h * .55, d / 2 + .05); g.scale.set(.8, 1.3, .6); rivetsRow(body, x, x, h * .22, d / 2 + .024, 1, .026); rivetsRow(body, x, x, h * .85, d / 2 + .024, 1, .026); });
    add(body, RB(w + .02, .05, .03, .01), trim, 0, .12, d / 2 + .006); add(body, RB(w + .02, .05, .03, .01), trim, 0, h - .14, d / 2 + .006);
    medallion(body, .26, 0, h * .5, d / 2 + .02, trim, 48);
  } else {
    const k8 = Math.cos(Math.PI / 8);
    const pb1 = new CylinderGeometry(1.4, 1.5, .16, 8); pb1.rotateY(Math.PI / 8); add(body, pb1, outer, 0, -.08, 0);
    const pb2 = new CylinderGeometry(1.2, 1.28, .12, 8); pb2.rotateY(Math.PI / 8); add(body, pb2, trim2, 0, -.02, 0);
    for (let i = 0; i < 8; i++) { const a = (i + .5) * Math.PI / 4, r = ap / k8 + .01; const col = new CylinderGeometry(.045, .05, h - .1, 12); add(body, col, trim, Math.sin(a) * r, h / 2, Math.cos(a) * r); add(body, RB(.12, .07, .12, .02), trim, Math.sin(a) * r, h - .03, Math.cos(a) * r); add(body, RB(.12, .07, .12, .02), trim, Math.sin(a) * r, .07, Math.cos(a) * r); }
    [.16, h - .16].forEach(y => { const b = new CylinderGeometry(ap / k8 + .025, ap / k8 + .025, .05, 8, 1, true); b.rotateY(Math.PI / 8); add(body, b, trim, 0, y, 0); });
    medallion(body, .28, 0, h * .55, ap + .01, trim, 48);
    for (let i = 0; i < 4; i++) { const a = (i * 2 + 1) * Math.PI / 4; cluster(body, Math.sin(a) * 1.3, .0, Math.cos(a) * 1.3, .32, gemB, 3); }
    const wingShape = s => { const sh = new Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.15 * s, .35, .35 * s, .8, .55 * s, 1.05); sh.lineTo(.5 * s, .7); sh.bezierCurveTo(.4 * s, .45, .28 * s, .2, .12 * s, 0); sh.closePath(); return sh; };
    [-1, 1].forEach(s => { for (let k = 0; k < 4; k++) { const eg = new ExtrudeGeometry(wingShape(s), { depth: .025, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 1 }); const m = add(body, eg, trim, s * (ap + .06 + k * .025), h * .18 + k * .15, .12 - k * .05, 0, s * .45, s * -.16 * k); m.scale.set(.95 - k * .1, .9 - k * .14, 1); } });
  }

  /* ================= المفصلات: عُقد متناوبة على محور الغطاء ================= */
  const hz = kind === 'rect' ? -d / 2 - .035 : -ap - .035, hy = h + .01;
  lidPivot.position.set(0, hy, hz + .035);
  const hx = kind === 'rect' ? w * .28 : ap * .45, KR = .042;
  [-1, 1].forEach(s => {
    const cx = s * hx;
    [-1, 1].forEach(k => { const c = new CylinderGeometry(KR, KR, .085, 14); c.rotateZ(Math.PI / 2); add(body, c, trim, cx + k * .095, hy, hz); });
    add(body, RB(.28, .22, .022, .008), trim, cx, hy - .13, hz + .012); rivetsRow(body, cx - .09, cx + .09, hy - .15, hz + .002, 3, .018);
    const lk = new CylinderGeometry(KR * .97, KR * .97, .1, 14); lk.rotateZ(Math.PI / 2); add(lidG, lk, trim, cx, 0, -.035);
    const pin = new CylinderGeometry(.014, .014, .3, 8); pin.rotateZ(Math.PI / 2); add(body, pin, trim2, cx, hy, hz);
  });

  /* ================= الغطاء ================= */
  const lz = kind === 'rect' ? d / 2 : ap;
  if (kind === 'rect') {
    if (lidKind === 'barrel') {
      const Rr = (d + .06) / 2, Hh = Rr * .56, L = w + .06;
      add(lidG, RB(L, .1, d + .06, .025), outer, 0, .05, lz);
      const dome = new CylinderGeometry(Rr, Rr, L, 40, 1, true, 0, Math.PI); dome.rotateZ(Math.PI / 2); dome.scale(1, Hh / Rr, 1);
      const dmat = lib.mat('dome2', () => { const m = outer.clone(); m.side = DoubleSide; return m; });
      add(lidG, dome, dmat, 0, .1, lz);
      [-1, 1].forEach(s => { const cap = new Shape(); cap.absellipse(0, 0, Rr + .01, Hh + .01, 0, Math.PI, false); const cg = new ExtrudeGeometry(cap, { depth: .04, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2 }); cg.rotateY(-Math.PI / 2); add(lidG, cg, trim, s > 0 ? w / 2 + .05 : -w / 2 - .01, .1, lz); });
      [-.72, -.24, .24, .72].forEach(x => { const tr = new TorusGeometry(Rr + .012, .026, 8, 40, Math.PI); tr.rotateY(Math.PI / 2); tr.scale(1, Hh / Rr, 1); add(lidG, tr, trim, x, .1, lz); });
      add(lidG, RB(w + .1, .05, .05, .015), trim, 0, .1, lz + Rr); add(lidG, RB(w + .1, .05, .05, .015), trim, 0, .1, lz - Rr);
      const jm = add(lidG, new OctahedronGeometry(.09, 0), gemA, 0, .1 + Hh + .04, lz); jm.scale.set(.8, 1.3, .8);
      add(lidG, new PlaneGeometry(w - 2 * t - .04, d - 2 * t - .04), lining, 0, -.0005, lz, Math.PI / 2);
    } else {
      add(lidG, RB(w + .06, lidH, d + .06, .045), outer, 0, lidH / 2, lz);
      add(lidG, RB(w - 2 * t - .04, .05, d - 2 * t - .04, .01), lining, 0, -.025, lz);
      add(lidG, new PlaneGeometry(w - 2 * t - .04, d - 2 * t - .04), lining, 0, -.051, lz, Math.PI / 2);
      /* إطار علوي بارز (لوح مرفوع) */
      const fw = w - .2, fd = d - .2;
      add(lidG, RB(fw, .025, .05, .01), trim2, 0, lidH + .006, lz + fd / 2); add(lidG, RB(fw, .025, .05, .01), trim2, 0, lidH + .006, lz - fd / 2);
      add(lidG, RB(.05, .025, fd, .01), trim2, fw / 2, lidH + .006, lz); add(lidG, RB(.05, .025, fd, .01), trim2, -fw / 2, lidH + .006, lz);
      /* حزام الغطاء الأمامي/الجانبي */
      add(lidG, RB(w + .08, .05, .025, .01), trim, 0, lidH * .5, lz + d / 2 + .035); add(lidG, RB(w + .08, .05, .025, .01), trim, 0, lidH * .5, lz - d / 2 - .035);
      if (n === 1) {
        [-.62, .62].forEach(x => { add(lidG, RB(.2, .014, d + .1, .005), trim2, x, lidH + .006, lz); add(lidG, RB(.2, lidH + .02, .022, .008), trim2, x, lidH / 2, lz + d / 2 + .04); [-.45, 0, .45].forEach(zz => rivet(lidG, x, lidH + .013, lz + zz * d * .8, .022)); });
        corner4((sx, sz) => { add(lidG, RB(.2, .03, .2, .01), trim, sx * (w / 2 - .06), lidH + .01, lz + sz * (d / 2 - .06)); rivet(lidG, sx * (w / 2 - .06), lidH + .025, lz + sz * (d / 2 - .06), .02); });
        { const r = .2, c = new CylinderGeometry(r, r, .04, 40); add(lidG, c, keyhole, 0, lidH + .02, lz); add(lidG, new CircleGeometry(r * .97, 40), emb, 0, lidH + .041, lz, -Math.PI / 2); const tr = new TorusGeometry(r * 1.06, r * .12, 10, 40); tr.rotateX(Math.PI / 2); add(lidG, tr, trim, 0, lidH + .04, lz); }
      } else if (n === 3) {
        corner4((sx, sz) => { add(lidG, RB(.22, lidH + .02, .22, .04), trim2, sx * (w / 2 - .02), lidH / 2, lz + sz * (d / 2 - .02)); cluster(lidG, sx * (w / 2 - .02), lidH + .01, lz + sz * (d / 2 - .02), .24, gemA, 3); });
        cluster(lidG, 0, lidH + .01, lz, .6, gemA, 6);
        add(lidG, RB(.05, .025, d - .1, .01), trim, 0, lidH + .01, lz); add(lidG, RB(w - .1, .025, .05, .01), trim, 0, lidH + .01, lz);
      } else if (n === 4) {
        [-.6, .6].forEach(x => { add(lidG, RB(.24, .016, d + .1, .006), strap, x, lidH + .006, lz); add(lidG, RB(.24, lidH + .02, .024, .008), strap, x, lidH / 2, lz + d / 2 + .04); });
        corner4((sx, sz) => { add(lidG, RB(.26, .14, .26, .04), trim, sx * (w / 2 - .04), lidH - .04, lz + sz * (d / 2 - .04)); });
        add(lidG, RB(.66, .03, .42, .02), trim, 0, lidH + .012, lz); const gm = add(lidG, new OctahedronGeometry(.1, 0), gemA, 0, lidH + .07, lz); gm.scale.set(1, .75, 1);
        add(lidG, RB(w - .5, .1, d - .5, .05), outer, 0, lidH + .03, lz);
      }
    }
  } else {
    const k8 = Math.cos(Math.PI / 8), Rr = (ap + .03) / k8;
    const slab = new CylinderGeometry(Rr * .96, Rr, lidH, 8); slab.rotateY(Math.PI / 8); add(lidG, slab, outer, 0, lidH / 2, lz);
    const und = new CylinderGeometry((ap - t - .03) / k8, (ap - t - .03) / k8, .05, 8); und.rotateY(Math.PI / 8); add(lidG, und, lining, 0, -.025, lz);
    const und2 = new CircleGeometry((ap - t - .03) / k8, 8, Math.PI / 8); und2.rotateX(Math.PI / 2); add(lidG, und2, lining, 0, -.051, lz);
    [.06, lidH - .03].forEach(y => { const b = new CylinderGeometry(Rr + .025, Rr + .025, .05, 8, 1, true); b.rotateY(Math.PI / 8); add(lidG, b, trim, 0, y, lz); });
    const topc = new CylinderGeometry(Rr * .62, Rr * .82, .14, 8); topc.rotateY(Math.PI / 8); add(lidG, topc, trim2, 0, lidH + .07, lz);
    const ring = new TorusGeometry(Rr * .62, .025, 8, 40); ring.rotateX(Math.PI / 2); add(lidG, ring, trim, 0, lidH + .14, lz);
    cluster(lidG, 0, lidH + .13, lz, .62, gemA, 7);
    for (let i = 0; i < 8; i++) { const a = (i + .5) * Math.PI / 4; const c = add(lidG, new OctahedronGeometry(.075, 0), gemB, Math.sin(a) * Rr * .98, lidH * .55, lz + Math.cos(a) * Rr * .98); c.scale.set(.7, 1.2, .7); }
  }

  /* ================= القفل: لوح بثقب مفتاح على الجسم + لسان على الغطاء يتحرّر ================= */
  const fz = kind === 'rect' ? d / 2 : ap;
  const plateY = h - .2;
  add(body, RB(.3, .28, .035, .02), trim, 0, plateY, fz + .022);
  add(body, new CylinderGeometry(.032, .032, .04, 16).rotateX(Math.PI / 2), keyhole, 0, plateY + .03, fz + .032); add(body, BOXG(.026, .07, .04), keyhole, 0, plateY - .015, fz + .032);
  rivet(body, -.11, plateY + .1, fz + .04, .016); rivet(body, .11, plateY + .1, fz + .04, .016); rivet(body, -.11, plateY - .1, fz + .04, .016); rivet(body, .11, plateY - .1, fz + .04, .016);
  const lockY = lidKind === 'barrel' ? .1 : lidH * .5;
  lockPivot.position.set(0, lockY, lz + (kind === 'rect' ? d / 2 : ap) + .05);
  const hasp = add(lockPivot, RB(.17, .3 + (lockY - .1), .035, .015), trim, 0, -.12 - (lockY - .1) / 2, 0); hasp.userData.keep = true;
  const loop = new TorusGeometry(.045, .014, 8, 20); const lp = add(lockPivot, loop, trim2, 0, -.26 - (lockY - .1), .02); lp.userData.keep = true;
  const lg = add(lockPivot, new OctahedronGeometry(.05, 0), gemA, 0, -.05 - (lockY - .1) * .5, .03); lg.scale.set(.8, 1.2, .6); lg.userData.keep = true;
  [hasp, lp, lg].forEach(m => { m.castShadow = true; });

  bake(body); bake(lidG);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return {
    n, root, body, lidPivot, lidG, lockPivot, kind, instMats,
    dims: { w, d, h, lidH, ap, slab: lidKind === 'barrel' ? .1 : lidH },
    mouth: new Vector3(0, h - .1, 0), tint: T,
    top: h + lidH + (n === 3 ? .55 : n === 5 ? .7 : n === 2 ? .1 : .05),
    baseY: n === 5 ? -.16 : n === 4 ? -.14 : 0,
  };
}
function BOXG(w, h, d) { return new BoxGeometry(w, h, d); }

/* نسخة: تشارك الهندسة والخامات الثابتة، وتنسخ خامات التوهّج/الجواهر/الرونات (لكل نسخة إضاءتها) */
export function instantiate(model) {
  const root = model.root.clone(true), map = new Map(), inst = [];
  root.traverse(o => {
    if (o.isMesh && o.material && o.material.userData && o.material.userData.inst) {
      let m = map.get(o.material); if (!m) { m = o.material.clone(); m.userData = Object.assign({}, o.material.userData); map.set(o.material, m); inst.push(m); }
      o.material = m;
    }
  });
  const runeBase = inst.filter(m => m.userData.k === 'rune').map(m => m.emissiveIntensity);
  return {
    n: model.n, root, body: root.getObjectByName('body'), lidPivot: root.getObjectByName('lidPivot'), lidG: root.getObjectByName('lidG'), lockPivot: root.getObjectByName('lockPivot'),
    dims: model.dims, mouth: model.mouth.clone(), tint: model.tint, top: model.top, baseY: model.baseY, instMats: inst, kind: model.kind,
    setSeam(v) { inst.forEach(m => { if (m.userData.k === 'cy') m.opacity = v; }); },
    setSeamColor(c) { inst.forEach(m => { if (m.userData.k === 'cy') m.color.copy(c); }); },
    setGems(v) { let j = 0; inst.forEach(m => { if (m.userData.gem) m.emissiveIntensity = v * .8; else if (m.userData.k === 'rune') { m.emissiveIntensity = (runeBase[j++] || .2) * (.6 + v * .7); } }); },
    dispose() { inst.forEach(m => { try { m.dispose(); } catch (e) {} }); },
  };
}
