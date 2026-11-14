/* CODIS-BOX3D — خمسة مجسّمات حقيقية مبنية بالكود (هندسة JS): جسم مجوّف بجدران وأرضية وتبطين، غطاء بسماكة وسطح داخلي ومفصلات على محور حقيقي،
   قفل، زخارف. لا صور مقسومة ولا CSS 3D. كل مستوى له شكله/أبعاده/خاماته/زخارفه. البناء مرة واحدة ثم دمج الأجزاء الساكنة حسب الخامة (بضع مشابك رسم لكل صندوق). */
import {
  Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, OctahedronGeometry, PlaneGeometry, CircleGeometry, ConeGeometry, Shape, ExtrudeGeometry,
  MeshStandardMaterial, MeshBasicMaterial, AdditiveBlending, DoubleSide, Vector3, BufferGeometry
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { tex, grainCanvas, brushedCanvas, emblemCanvas } from './tex.js';

/* ألوان الإضاءة لكل مستوى (مطابقة لجدول TIER القديم) */
export const TINT = [null,
  { light: [255, 176, 92], edge: [104, 228, 236] },
  { light: [128, 204, 255], edge: [196, 238, 255] },
  { light: [104, 172, 255], edge: [178, 126, 255] },
  { light: [255, 192, 86], edge: [255, 122, 62] },
  { light: [255, 224, 142], edge: [112, 230, 255] }];

export class Lib {
  constructor() { this.t = {}; this.m = {}; this.all = []; }
  tex(k, f) { return this.t[k] || (this.t[k] = f()); }
  mat(k, f) { return this.m[k] || (this.m[k] = f()); }
  disposeAll() { Object.keys(this.t).forEach(k => { try { this.t[k].dispose(); } catch (e) {} }); Object.keys(this.m).forEach(k => { try { this.m[k].dispose(); } catch (e) {} }); this.t = {}; this.m = {}; }
}

const rgbHex = a => (a[0] << 16) | (a[1] << 8) | a[2];

function bake(group) {
  /* دمج كل Mesh ساكن بخامة مفردة داخل المجموعة حسب الخامة؛ العقد المعلَّمة userData.keep تبقى كما هي */
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert(), by = new Map(), keep = [];
  group.traverse(o => {
    if (o === group || !o.isMesh) return;
    let a = o, dyn = false; while (a && a !== group) { if (a.userData.keep) { dyn = true; break; } a = a.parent; }
    if (dyn) return;
    const g = o.geometry.clone().applyMatrix4(inv.clone().multiply(o.matrixWorld));
    const ng = g.index ? g.toNonIndexed() : g; if (ng !== g) g.dispose();
    ['uv1', 'uv2', 'color', 'tangent'].forEach(n => { if (ng.attributes[n]) ng.deleteAttribute(n); });
    const k = o.material.uuid; if (!by.has(k)) by.set(k, { mat: o.material, geos: [] }); by.get(k).geos.push(ng);
    keep.push(o);
  });
  keep.forEach(o => { o.parent.remove(o); o.geometry.dispose(); });
  by.forEach(v => {
    const geo = mergeGeometries(v.geos, false); v.geos.forEach(g => g.dispose());
    if (!geo) return; const m = new Mesh(geo, v.mat); m.castShadow = true; m.receiveShadow = true; group.add(m);
  });
}

export function buildBox(n, lib) {
  const T = TINT[n];
  const root = new Group(); root.name = 'box';
  const body = new Group(); body.name = 'body'; root.add(body);
  const lidPivot = new Group(); lidPivot.name = 'lidPivot'; root.add(lidPivot);
  const lidG = new Group(); lidG.name = 'lidG'; lidPivot.add(lidG);
  const lockPivot = new Group(); lockPivot.name = 'lockPivot'; lockPivot.userData.keep = true; lidG.add(lockPivot);
  const instMats = [];   /* خامات تُنسخ لكل نسخة (توهّج/جواهر) */
  const std = (k, o) => lib.mat(k, () => new MeshStandardMaterial(o));
  const glow = (k, col, op = 1) => { const m = new MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: AdditiveBlending, depthWrite: false, toneMapped: false }); m.userData.inst = true; m.userData.k = k; instMats.push(m); return m; };
  const gem = (col, em, k) => { const m = new MeshStandardMaterial({ color: col, emissive: em, emissiveIntensity: 1.1, roughness: .12, metalness: .1, flatShading: true }); m.userData.inst = true; m.userData.gem = true; m.userData.k = k; instMats.push(m); return m; };
  const add = (g, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
  const BX = (w, h, d) => new BoxGeometry(w, h, d);
  const emblemTex = lib.tex('emb', () => tex(emblemCanvas(), null));
  const embMat = lib.mat('embm', () => new MeshStandardMaterial({ map: emblemTex, roughness: .35, metalness: .2 }));
  let w, d, h, lidH, t = .09, tf = .1, kind = 'rect', ap = 0;
  let outer, lining, strap, metal, metal2, cyan, cyanMat, amber;

  /* ========== خامات + أبعاد كل مستوى ========== */
  if (n === 1) {   /* كرتون مقوّى بني بشرائط وأزرار نحاسية */
    w = 2.4; d = 1.6; h = 1.0; lidH = .32;
    outer = std('1o', { map: lib.tex('1o', () => tex(grainCanvas('#6d4528', { seed: 3, amp: 22, fibers: 220, stains: 14 }), [2, 1.2])), roughness: .88, metalness: 0 });
    strap = std('1s', { map: lib.tex('1s', () => tex(grainCanvas('#a98458', { seed: 5, amp: 18, fibers: 200 }), [1, 1])), roughness: .86 });
    metal = std('1m', { color: 0xc99a3c, roughness: .32, metalness: .92 });
    lining = std('1l', { map: lib.tex('1l', () => tex(grainCanvas('#d8c294', { seed: 8, amp: 14, stains: 18 }), [2, 2])), roughness: .95 });
  } else if (n === 2) {   /* جلد كحلي + إطار فضي + غطاء مقوّس */
    w = 2.3; d = 1.5; h = .95; lidH = .1 + (d / 2) * .56;
    outer = std('2o', { map: lib.tex('2o', () => tex(grainCanvas('#1c2c58', { seed: 12, amp: 20, fibers: 160, stains: 10 }), [2, 1.2])), roughness: .55, metalness: .08 });
    metal = std('2m', { map: lib.tex('2m', () => tex(brushedCanvas('#9aa3ad', '#e8edf2'), [1, 1])), color: 0xffffff, roughness: .3, metalness: .95 });
    lining = std('2l', { map: lib.tex('2l', () => tex(grainCanvas('#2c4a8a', { seed: 14, amp: 16, stains: 12 }), [2, 2])), roughness: .9 });
  } else if (n === 3) {   /* حجر داكن + بلّورات زرقاء + نقوش فضية */
    w = 1.6; d = 1.6; h = 1.62; lidH = .3;
    outer = std('3o', { map: lib.tex('3o', () => tex(grainCanvas('#22203a', { seed: 21, amp: 18, fibers: 80, stains: 12, cracks: 9 }), [1.4, 1.6])), roughness: .72, metalness: .18 });
    metal = std('3m', { map: lib.tex('3m', () => tex(brushedCanvas('#8a929c', '#dfe6ee'), [1, 1])), roughness: .34, metalness: .95 });
    lining = std('3l', { map: lib.tex('3l', () => tex(grainCanvas('#2a1d4a', { seed: 23, amp: 14, stains: 10 }), [2, 2])), roughness: .9 });
  } else if (n === 4) {   /* جلد أحمر قاتم + نحاس + شرائط سوداء */
    w = 2.2; d = 1.45; h = 1.05; lidH = .34;
    outer = std('4o', { map: lib.tex('4o', () => tex(grainCanvas('#7c1a22', { seed: 31, amp: 22, fibers: 220, stains: 16 }), [2, 1.3])), roughness: .6, metalness: .08 });
    strap = std('4s', { map: lib.tex('4s', () => tex(grainCanvas('#1d1814', { seed: 33, amp: 14, fibers: 100 }), [1, 1])), roughness: .5, metalness: .25 });
    metal = std('4m', { color: 0xb9852c, roughness: .36, metalness: .9 });
    lining = std('4l', { map: lib.tex('4l', () => tex(grainCanvas('#4b0d16', { seed: 35, amp: 14, stains: 10 }), [2, 2])), roughness: .95 });
  } else {   /* ثماني: حجر بنفسجي داكن + ذهب + قاعدة وأجنحة */
    kind = 'oct'; ap = .98; h = 1.32; lidH = .4; w = d = ap * 2;
    outer = std('5o', { map: lib.tex('5o', () => tex(grainCanvas('#2b2142', { seed: 41, amp: 18, fibers: 90, stains: 12, cracks: 8 }), [1.6, 1.4])), roughness: .7, metalness: .2 });
    metal = std('5m', { map: lib.tex('5m', () => tex(brushedCanvas('#a3792a', '#f1cf72'), [1, 1])), roughness: .34, metalness: .95 });
    lining = std('5l', { map: lib.tex('5l', () => tex(grainCanvas('#241231', { seed: 43, amp: 14, stains: 10 }), [2, 2])), roughness: .9 });
  }
  metal2 = lib.mat('metal2' + n, () => new MeshStandardMaterial({ color: n === 2 || n === 3 ? 0x6b737c : 0x8a6320, roughness: .45, metalness: .9 }));
  cyanMat = glow('cy', rgbHex(T.edge), 0); cyan = cyanMat;
  amber = gem(0xffb02e, 0xff8a10, 'amber');

  /* ========== الجسم المجوّف: جدران بسماكة + أرضية + تبطين داخلي ========== */
  const lin = (geo, mat, x, y, z, rx, ry) => { const m = add(body, geo, mat, x, y, z, rx || 0, ry || 0); return m; };
  if (kind === 'rect') {
    add(body, BX(w, tf, d), outer, 0, tf / 2, 0);
    add(body, BX(w - 2 * t, h, t), outer, 0, h / 2, d / 2 - t / 2);
    add(body, BX(w - 2 * t, h, t), outer, 0, h / 2, -d / 2 + t / 2);
    add(body, BX(t, h, d), outer, -w / 2 + t / 2, h / 2, 0);
    add(body, BX(t, h, d), outer, w / 2 - t / 2, h / 2, 0);
    const ih = h - tf, e = .002;
    lin(new PlaneGeometry(w - 2 * t, d - 2 * t), lining, 0, tf + e, 0, -Math.PI / 2);
    lin(new PlaneGeometry(w - 2 * t, ih), lining, 0, tf + ih / 2, d / 2 - t - e, 0, Math.PI);
    lin(new PlaneGeometry(w - 2 * t, ih), lining, 0, tf + ih / 2, -d / 2 + t + e, 0, 0);
    lin(new PlaneGeometry(d - 2 * t, ih), lining, -w / 2 + t + e, tf + ih / 2, 0, 0, Math.PI / 2);
    lin(new PlaneGeometry(d - 2 * t, ih), lining, w / 2 - t - e, tf + ih / 2, 0, 0, -Math.PI / 2);
  } else {
    const tw = 2 * ap * Math.tan(Math.PI / 8) + .012;
    const floor = new CylinderGeometry(ap / Math.cos(Math.PI / 8), ap / Math.cos(Math.PI / 8), tf, 8); floor.rotateY(Math.PI / 8);
    add(body, floor, outer, 0, tf / 2 + .0, 0);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, px = Math.sin(a), pz = Math.cos(a), ra = ap - t / 2;
      const wm = add(body, BX(tw, h, t), outer, px * ra, h / 2, pz * ra, 0, a, 0);
      const pl = add(body, new PlaneGeometry(tw - .02, h - tf), lining, px * (ap - t - .003), tf + (h - tf) / 2, pz * (ap - t - .003), 0, a + Math.PI, 0);
    }
    const fl = new PlaneGeometry(1, 1); const oct = new CylinderGeometry((ap - t) / Math.cos(Math.PI / 8), (ap - t) / Math.cos(Math.PI / 8), .002, 8); oct.rotateY(Math.PI / 8);
    add(body, oct, lining, 0, tf + .002, 0); fl.dispose();
  }
  /* خط التسريب الضوئي عند درزة الغطاء (يظهر أثناء الترقّب) */
  const seamW = kind === 'rect' ? w : ap * 2 * 1.0824, seamD = kind === 'rect' ? d : ap * 2 * 1.0824;
  if (kind === 'rect') {
    add(body, BX(w + .006, .016, .03), cyanMat, 0, h - .004, d / 2); add(body, BX(w + .006, .016, .03), cyanMat, 0, h - .004, -d / 2);
    add(body, BX(.03, .016, d + .006), cyanMat, w / 2, h - .004, 0); add(body, BX(.03, .016, d + .006), cyanMat, -w / 2, h - .004, 0);
  } else {
    const tw = 2 * ap * Math.tan(Math.PI / 8);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; add(body, BX(tw, .016, .03), cyanMat, Math.sin(a) * ap, h - .004, Math.cos(a) * ap, 0, a, 0); }
  }

  /* ========== زخارف الجسم لكل مستوى ========== */
  const sideMat = lib.mat('sidem', () => new MeshStandardMaterial({ color: 0x14151a, roughness: .5, metalness: .3 }));
  const emblemDisc = (r, x, y, z, segs = 40, rot = 0) => {
    const c = new CylinderGeometry(r, r, .05, segs); c.rotateX(Math.PI / 2); if (rot) c.rotateZ(rot); add(body, c, sideMat, x, y, z);
    const f = new CircleGeometry(r * .985, segs, rot); add(body, f, embMat, x, y, z + .0255);
  };
  const medallion = (r, y, z, ring) => { emblemDisc(r, 0, y, z + .02); add(body, new TorusGeometry(r * 1.08, r * .13, 10, 40), ring || metal, 0, y, z + .035); };
  const corner4 = (fn) => { [-1, 1].forEach(sx => [-1, 1].forEach(sz => fn(sx, sz))); };
  if (n === 1) {
    [-.64, .64].forEach(x => {
      add(body, BX(.27, h + .004, .024), strap, x, h / 2, d / 2 + .005); add(body, BX(.27, h + .004, .024), strap, x, h / 2, -d / 2 - .005);
      [.22, .78].forEach(y => add(body, new SphereGeometry(.05, 12, 8), metal, x, y, d / 2 + .02));
    });
    medallion(.29, .44, d / 2, metal);
    [-1, 1].forEach(s => [-.03, .03].forEach(o => add(body, BX(.3, .01, .008), metal, s * .4, .44 + o, d / 2 + .004)));
    /* إطار ذهبي رفيع على الواجهة + جانبي */
    add(body, BX(w - .9, .012, .008), metal, 0, .08, d / 2 + .003); add(body, BX(w - .9, .012, .008), metal, 0, h - .1, d / 2 + .003);
    add(body, BX(.01, d - .5, .008), metal, w / 2 + .003, h / 2, 0, 0, 0, 0);
    corner4((sx, sz) => { add(body, BX(.05, h, .05), outer, sx * (w / 2 - .02), h / 2, sz * (d / 2 - .02)); add(body, BX(.03, .16, .03), cyanMat, sx * (w / 2 + .004), .12, sz * (d / 2 - .02)); });
    add(body, BX(.014, h * .9, .02), cyanMat, w / 2 + .004, h / 2, d / 2 - .03);
  } else if (n === 2) {
    corner4((sx, sz) => { add(body, BX(.15, h + .02, .15), metal, sx * (w / 2 - .03), h / 2, sz * (d / 2 - .03)); const f = add(body, new OctahedronGeometry(.15, 0), metal, sx * (w / 2), .03, sz * (d / 2)); f.scale.set(1, .6, 1); });
    [.06, h - .1].forEach(y => { add(body, BX(w + .02, .1, .03), metal, 0, y + .05, d / 2); add(body, BX(w + .02, .1, .03), metal, 0, y + .05, -d / 2); add(body, BX(.03, .1, d + .02), metal, w / 2, y + .05, 0); add(body, BX(.03, .1, d + .02), metal, -w / 2, y + .05, 0); });
    add(body, BX(w - .5, .018, .01), cyanMat, 0, h - .16, d / 2 + .012); add(body, BX(.01, .018 + .5, .01), cyanMat, w / 2 + .014, h * .5, 0);
    emblemDisc(.3, 0, .45, d / 2 + .02, 8, Math.PI / 8);
    const orr = new TorusGeometry(.34, .04, 6, 8); orr.rotateZ(Math.PI / 8); add(body, orr, metal, 0, .45, d / 2 + .035);
    [-1, 1].forEach(s => { const g = add(body, new OctahedronGeometry(.1, 0), gem(0x38e1e6, 0x1aaec4, 'g2' + s), s * .0 + s * (w / 2 + .01), h * .5, 0); g.scale.set(.3, 1.6, .9); });
  } else if (n === 3) {
    corner4((sx, sz) => { add(body, BX(.2, h + .02, .2), metal2, sx * (w / 2 - .035), h / 2, sz * (d / 2 - .035)); const c = add(body, new OctahedronGeometry(.17, 0), gem(0x38b7ff, 0x1f78e0, 'g3a' + sx + sz), sx * (w / 2 + .01), .2, sz * (d / 2 + .01)); c.scale.set(.85, 1.5, .85); add(body, new OctahedronGeometry(.14, 0), metal, sx * (w / 2 - .035), h + .02, sz * (d / 2 - .035)); });
    [.12, h - .14].forEach(y => { add(body, BX(w + .02, .08, .03), metal, 0, y, d / 2); add(body, BX(w + .02, .08, .03), metal, 0, y, -d / 2); add(body, BX(.03, .08, d + .02), metal, w / 2, y, 0); add(body, BX(.03, .08, d + .02), metal, -w / 2, y, 0); });
    [-.44, .44].forEach(x => add(body, BX(.022, h * .72, .01), cyanMat, x, h * .5, d / 2 + .004));
    const dia = add(body, BX(.62, .62, .045), metal, 0, h * .52, d / 2 + .012, 0, 0, Math.PI / 4);
    emblemDisc(.24, 0, h * .52, d / 2 + .04, 32);
    [[0, h * .52 + .5], [0, h * .52 - .5]].forEach(p => { const c = add(body, new OctahedronGeometry(.12, 0), gem(0x4dc4ff, 0x1d86f0, 'g3b' + p[1]), p[0], p[1], d / 2 + .03); c.scale.set(.6, 1.5, .5); });
  } else if (n === 4) {
    [-.6, .6].forEach(x => {
      add(body, BX(.26, h + .004, .03), strap, x, h / 2, d / 2 + .004); add(body, BX(.26, h + .004, .03), strap, x, h / 2, -d / 2 - .004);
      add(body, BX(.03, .66, .012), cyanMat, x, h * .36, d / 2 + .024);
      const g = add(body, new OctahedronGeometry(.1, 0), amber, x, h * .72, d / 2 + .04); g.scale.set(.8, 1.35, .6);
      add(body, BX(.34, .03, .02), metal, x, h - .12, d / 2 + .02);
    });
    corner4((sx, sz) => { add(body, BX(.2, .26, .2), metal, sx * (w / 2 - .02), .13, sz * (d / 2 - .02)); add(body, BX(.14, .14, .2), metal, sx * (w / 2 - .02), h - .09, sz * (d / 2 - .02)); });
    medallion(.3, .5, d / 2, metal);
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(p => { const c = add(body, new ConeGeometry(.045, .16, 4), metal, p[0] * .5, .5 + p[1] * .5 * .75, d / 2 + .045, p[1] ? 0 : 0, 0, p[0] ? -p[0] * Math.PI / 2 : (p[1] > 0 ? 0 : Math.PI)); });
    add(body, BX(w + .02, .05, .02), metal, 0, .12, d / 2 + .005);
  } else {
    /* قاعدة مدرّجة + أعمدة ذهبية + أجنحة */
    const pb1 = new CylinderGeometry(1.42, 1.5, .16, 8); pb1.rotateY(Math.PI / 8); add(body, pb1, outer, 0, -.08, 0);
    const pb2 = new CylinderGeometry(1.2, 1.28, .12, 8); pb2.rotateY(Math.PI / 8); add(body, pb2, metal2, 0, -.03, 0);
    const ring = new CylinderGeometry(1.14, 1.14, .02, 8); ring.rotateY(Math.PI / 8); add(body, ring, cyanMat, 0, .035, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i + .5) * Math.PI / 4, r = ap / Math.cos(Math.PI / 8) + .005;
      add(body, BX(.09, h + .04, .09), metal, Math.sin(a) * r, h / 2, Math.cos(a) * r);
    }
    [.1, h * .5, h - .1].forEach(y => { const b = new CylinderGeometry(ap / Math.cos(Math.PI / 8) + .03, ap / Math.cos(Math.PI / 8) + .03, .06, 8, 1, true); b.rotateY(Math.PI / 8); add(body, b, metal, 0, y, 0); });
    medallion(.3, h * .62, ap + .0, metal);
    [-.46, .46].forEach(x => add(body, BX(.022, h * .56, .01), cyanMat, x, h * .45, ap + .006));
    const g1 = add(body, new OctahedronGeometry(.13, 0), amber, 0, h * .24, ap + .04); g1.scale.set(.7, 1.5, .5);
    for (let i = 0; i < 4; i++) { const a = (i * 2 + 1) * Math.PI / 4 + Math.PI / 8 * 0, r = 1.28; const c = add(body, new OctahedronGeometry(.14, 0), amber, Math.sin(a) * r, .24, Math.cos(a) * r); c.scale.set(.8, 1.3, .8); }
    /* أجنحة: ثلاث ريشات منحنية لكل جانب */
    const wingShape = (s) => { const sh = new Shape(); sh.moveTo(0, 0); sh.lineTo(.22 * s, .5); sh.lineTo(.5 * s, 1.0); sh.lineTo(.46 * s, .6); sh.lineTo(.3 * s, .25); sh.lineTo(.12 * s, 0); sh.closePath(); return sh; };
    [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) { const eg = new ExtrudeGeometry(wingShape(s), { depth: .03, bevelEnabled: false }); const m = add(body, eg, metal, s * (ap + .08 + k * .03), h * .22 + k * .17, .1 - k * .05, 0, s * .45, s * -.18 * k); m.scale.set(.9 - k * .1, .85 - k * .15, 1); } });
  }

  /* ========== مفصلات حقيقية على محور الغطاء ========== */
  const hz = kind === 'rect' ? -d / 2 - .015 : -ap - .015, hy = h + .0;
  const hingeMat = n === 1 || n === 4 ? metal : n === 5 ? metal : metal;
  lidPivot.position.set(0, hy, hz + .015);
  [-1, 1].forEach(s => {
    const cyl = new CylinderGeometry(.045, .045, .3, 12); cyl.rotateZ(Math.PI / 2);
    add(body, cyl, hingeMat, s * (kind === 'rect' ? w * .27 : ap * .45), hy, hz);
    add(body, BX(.3, .22, .02), hingeMat, s * (kind === 'rect' ? w * .27 : ap * .45), hy - .12, hz + .0 + (kind === 'rect' ? .0 : -.0));
    const lp = add(lidG, BX(.3, .04, .22), hingeMat, s * (kind === 'rect' ? w * .27 : ap * .45), .02, .12);
  });

  /* ========== الغطاء: بلاطة بسماكة + شفة تُدخل بالجسم + سطح داخلي مبطّن + زخارف ========== */
  const lz = kind === 'rect' ? d / 2 + .015 : ap + .015;    /* مركز الغطاء بالنسبة لمحور المفصلة */
  if (kind === 'rect') {
    const slabH = n === 2 ? .1 : lidH;
    add(lidG, BX(w + .06, slabH, d + .06), outer, 0, slabH / 2, lz);
    add(lidG, BX(w - 2 * t - .03, .06, d - 2 * t - .03), lining, 0, -.03, lz);
    add(lidG, new PlaneGeometry(w - 2 * t - .03, d - 2 * t - .03), lining, 0, -.0605, lz, Math.PI / 2);
    if (n === 1) {
      [-.64, .64].forEach(x => { add(lidG, BX(.27, .012, d + .075), strap, x, lidH + .004, lz); add(lidG, BX(.27, lidH, .02), strap, x, lidH / 2, lz + d / 2 + .04); add(lidG, BX(.27, lidH, .02), strap, x, lidH / 2, lz - d / 2 - .04); [-.5, .5].forEach(zz => add(lidG, new SphereGeometry(.05, 12, 8), metal, x, lidH + .006, lz + zz * .75)); });
      add(lidG, BX(.9, .01, .5), metal, 0, lidH + .004, lz).scale.y = .3;
    } else if (n === 2) {
      const R = (d + .06) / 2, H = R * .56, L = w + .06;
      const dome = new CylinderGeometry(R, R, L, 32, 1, true, 0, Math.PI); dome.rotateZ(Math.PI / 2); dome.scale(1, H / R, 1);
      const dmat = lib.mat('dome2', () => { const m = outer.clone(); m.side = DoubleSide; return m; });
      add(lidG, dome, dmat, 0, .1, lz);
      [-1, 1].forEach(s => { const cap = new Shape(); cap.absellipse(0, 0, R, H, 0, Math.PI, false); const cg = new ExtrudeGeometry(cap, { depth: .05, bevelEnabled: false }); cg.rotateY(-Math.PI / 2); add(lidG, cg, metal, s > 0 ? w / 2 + .03 : -w / 2 - .03 + .0, .1, lz); });
      [-.76, -.38, 0, .38, .76].forEach(x => { const tr = new TorusGeometry(R + .012, .028, 6, 28, Math.PI); tr.rotateY(Math.PI / 2); tr.scale(1, H / R, 1); add(lidG, tr, metal, x, .1, lz); });
      add(lidG, BX(w + .1, .04, .04), metal, 0, .12, lz + R + .0);
      add(lidG, BX(w + .1, .04, .04), metal, 0, .12, lz - R - .0);
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => { const o = add(lidG, new OctahedronGeometry(.13, 0), metal, sx * (w / 2 + .03), .1, lz + sz * (d / 2 + .03)); o.scale.set(1, .7, 1); }));
      const jem = add(lidG, new OctahedronGeometry(.1, 0), gem(0x38e1e6, 0x1aaec4, 'g2lid'), 0, .1 + H + .03, lz); jem.scale.set(.7, 1.3, .7);
    } else if (n === 3) {
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => { add(lidG, BX(.2, lidH + .01, .2), metal2, sx * (w / 2 - .02), lidH / 2, lz + sz * (d / 2 - .02)); const c = add(lidG, new OctahedronGeometry(.17, 0), gem(0x4dc4ff, 0x1f80f0, 'g3l' + sx + sz), sx * (w / 2 - .02), lidH + .06, lz + sz * (d / 2 - .02)); c.scale.set(.8, 1.6, .8); }));
      const big = add(lidG, new OctahedronGeometry(.3, 0), gem(0x6fd0ff, 0x2a98ff, 'g3big'), 0, lidH + .24, lz); big.scale.set(.85, 1.8, .85);
      add(lidG, BX(w + .04, .06, .05), metal, 0, lidH - .03, lz + d / 2 + .03); add(lidG, BX(w + .04, .06, .05), metal, 0, lidH - .03, lz - d / 2 - .03);
      add(lidG, BX(.05, .06, d + .04), metal, w / 2 + .03, lidH - .03, lz); add(lidG, BX(.05, .06, d + .04), metal, -w / 2 - .03, lidH - .03, lz);
      add(lidG, BX(.04, .02, d), metal, 0, lidH + .006, lz); add(lidG, BX(w, .02, .04), metal, 0, lidH + .006, lz);
    } else if (n === 4) {
      [-.6, .6].forEach(x => { add(lidG, BX(.26, .012, d + .08), strap, x, lidH + .004, lz); add(lidG, BX(.26, lidH, .02), strap, x, lidH / 2, lz + d / 2 + .04); add(lidG, BX(.26, lidH, .02), strap, x, lidH / 2, lz - d / 2 - .04); add(lidG, BX(.03, .6, .01), cyanMat, x, lidH + .012, lz).rotation.x = Math.PI / 2; });
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => { add(lidG, BX(.22, .12, .22), metal, sx * (w / 2 - .01), lidH - .04, lz + sz * (d / 2 - .01)); }));
      const plate = add(lidG, BX(.6, .018, .36), metal, 0, lidH + .01, lz); const gm = add(lidG, new OctahedronGeometry(.1, 0), amber, 0, lidH + .06, lz); gm.scale.set(1, .8, 1);
    }
  } else {
    const R = (ap + .03) / Math.cos(Math.PI / 8);
    const slab = new CylinderGeometry(R, R, lidH, 8); slab.rotateY(Math.PI / 8); add(lidG, slab, outer, 0, lidH / 2, lz);
    const und = new CylinderGeometry((ap - t - .03) / Math.cos(Math.PI / 8), (ap - t - .03) / Math.cos(Math.PI / 8), .06, 8); und.rotateY(Math.PI / 8); add(lidG, und, lining, 0, -.03, lz);
    const und2 = new CylinderGeometry((ap - t - .03) / Math.cos(Math.PI / 8), (ap - t - .03) / Math.cos(Math.PI / 8), .002, 8); und2.rotateY(Math.PI / 8); und2.rotateX(Math.PI); add(lidG, und2, lining, 0, -.0612, lz);
    const band = new CylinderGeometry(R + .025, R + .025, .05, 8, 1, true); band.rotateY(Math.PI / 8); add(lidG, band, metal, 0, .06, lz); add(lidG, band.clone(), metal, 0, lidH - .03, lz);
    const topc = new CylinderGeometry(R * .66, R * .8, .1, 8); topc.rotateY(Math.PI / 8); add(lidG, topc, metal2, 0, lidH + .04, lz);
    const peak = add(lidG, new OctahedronGeometry(.3, 0), gem(0x6fd0ff, 0x2a98ff, 'g5peak'), 0, lidH + .34, lz); peak.scale.set(.7, 1.7, .7);
    for (let i = 0; i < 8; i++) { const a = (i + .5) * Math.PI / 4, r = R + .0; const c = add(lidG, new OctahedronGeometry(.1, 0), amber, Math.sin(a) * r * .94, lidH * .62, lz + Math.cos(a) * r * .94); c.scale.set(.8, 1.2, .8); }
  }

  /* ========== القفل: لسان يتدلّى من حافة الغطاء الأمامية ويتحرّر قبل الفتح ========== */
  lockPivot.position.set(0, n === 2 ? .09 : .2, lz + (kind === 'rect' ? d / 2 : ap) + .05);
  const lockMat = n === 4 ? amber : n === 3 || n === 2 ? gem(n === 2 ? 0x38e1e6 : 0x4dc4ff, n === 2 ? 0x1aaec4 : 0x1f86f0, 'lockg') : metal;
  const tongue = new BoxGeometry(.2, .26, .04);
  const tm = add(lockPivot, tongue, n === 3 || n === 2 ? metal : metal, 0, -.13, 0);
  const lg = add(lockPivot, new OctahedronGeometry(.075, 0), n === 1 ? metal : lockMat, 0, -.2, .035); lg.scale.set(.8, 1.2, .6);
  tm.userData.keep = true; lg.userData.keep = true;
  const plate = add(body, BX(.26, .2, .03), metal, 0, h - .2, (kind === 'rect' ? d / 2 : ap) + .02);
  lockPivot.userData.keep = true;
  tm.castShadow = lg.castShadow = true;

  bake(body); bake(lidG);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const model = {
    n, root, body, lidPivot, lidG, lockPivot, kind, instMats,
    dims: { w, d, h, lidH, ap, slab: n === 2 ? .1 : lidH },
    mouth: new Vector3(0, h - .1, kind === 'rect' ? 0 : 0),
    tint: T, top: h + lidH + (n === 3 ? .5 : n === 5 ? .55 : n === 2 ? .1 : .1),
    baseY: n === 5 ? -.16 : 0,
  };
  return model;
}

/* نسخة من مجسّم جاهز: تشارك الهندسة والخامات الثابتة، وتنسخ خامات التوهّج/الجواهر فقط (لكل نسخة إضاءتها المستقلة) */
export function instantiate(model) {
  const root = model.root.clone(true), map = new Map(), inst = [];
  root.traverse(o => {
    if (o.isMesh && o.material && o.material.userData && o.material.userData.inst) {
      let m = map.get(o.material); if (!m) { m = o.material.clone(); m.userData = Object.assign({}, o.material.userData); map.set(o.material, m); inst.push(m); }
      o.material = m;
    }
  });
  return {
    n: model.n, root, body: root.getObjectByName('body'), lidPivot: root.getObjectByName('lidPivot'), lidG: root.getObjectByName('lidG'), lockPivot: root.getObjectByName('lockPivot'),
    dims: model.dims, mouth: model.mouth.clone(), tint: model.tint, top: model.top, baseY: model.baseY, instMats: inst, kind: model.kind,
    setSeam(v) { inst.forEach(m => { if (m.userData.k === 'cy') m.opacity = v; }); },
    setGems(v) { inst.forEach(m => { if (m.userData.gem) m.emissiveIntensity = v; }); },
  };
}
