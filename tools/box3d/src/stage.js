/* CODIS-BOX3D — المسرح: Renderer واحد + إضاءة + بيئة «مسرح ورق أنتيكا» + جسيمات + طبقة CSS كاملة الشاشة. يحترم المظهرين (ورقي/داكن). */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, CylinderGeometry, TorusGeometry, RingGeometry,
  HemisphereLight, DirectionalLight, PointLight, SpotLight, AdditiveBlending, SRGBColorSpace, ACESFilmicToneMapping, PCFSoftShadowMap, FogExp2, Vector3, PMREMGenerator,
  BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, InstancedMesh, DynamicDrawUsage, Object3D, DoubleSide, SphereGeometry, BackSide, MeshPhysicalMaterial, CanvasTexture, Fog
} from 'three';
import { tex, grainCanvas, glowCanvas, shaftCanvas, raysCanvas, shadowCanvas, gradientBg, paperLayerCanvas, brushedCanvas } from './tex.js';
import { rng, clamp, lerp } from './util.js';

export const PAL = {
  paper: { sky: ['#e9d6ab', '#d3b67c', '#9a7a45'], fog: 0xcdb27a, fogD: .018, ambient: 0xfff0d8, hemi: [0xfff1d6, 0x6a4a28, .9], key: 0xffe2b0, keyI: 3.0, floor: '#c9aa72', floorRim: 0xb8862f, layers: ['#a9824b', '#8d6a3b', '#6b4e2b'], env: [.9, .74, .54], exposure: .86 },
  dark: { sky: ['#1c1710', '#110e09', '#070605'], fog: 0x0d0a07, fogD: .04, ambient: 0xffd9a0, hemi: [0xffd9a8, 0x1a1008, .5], key: 0xffc98a, keyI: 2.5, floor: '#2d2318', floorRim: 0xb48a2c, layers: ['#2a2016', '#1d160e', '#120e08'], env: [.5, .42, .34], exposure: .95 },
};

export function makeRenderer(canvas, q) {
  const r = new WebGLRenderer({ canvas, antialias: q.aa, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!q.preserve, stencil: false });
  r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = 1;
  r.shadowMap.enabled = q.shadow; r.shadowMap.type = PCFSoftShadowMap;
  return r;
}

/* بيئة انعكاسات صغيرة تُولَّد مرة واحدة (PMREM) ليلمع المعدن بلا ملفات HDR */
export function makeEnv(renderer, theme) {
  const sc = new Scene(), P = PAL[theme] || PAL.paper;
  const sky = new Mesh(new SphereGeometry(20, 24, 12), new MeshBasicMaterial({ side: BackSide, color: new Color(P.env[0], P.env[1], P.env[2]) })); sc.add(sky);
  const box = (c, x, y, z, w, h, i) => { const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(c).multiplyScalar(i), side: DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
  box(0xfff0d0, -6, 8, 6, 8, 5, theme === 'dark' ? 2.2 : 3.4); box(0xcfe6ff, 7, 5, 4, 5, 6, theme === 'dark' ? 1.2 : 1.6); box(0xffd49a, 0, 3, -8, 10, 3, 2); box(0xffffff, 0, 12, 0, 6, 6, 1.4);
  const pm = new PMREMGenerator(renderer); const rt = pm.fromScene(sc, .04); pm.dispose();
  sc.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt;
}

export class Stage {
  constructor(opts) {
    const q = this.q = opts.q, theme = this.theme = opts.theme === 'dark' ? 'dark' : 'paper', P = this.P = PAL[theme];
    this.host = opts.host; this.hooks = opts.hooks || {};
    const cv = this.canvas = document.createElement('canvas'); cv.className = 'b3d-cv'; this.host.appendChild(cv);
    this.renderer = makeRenderer(cv, q);
    this.scene = new Scene(); this.camera = new PerspectiveCamera(34, 1, .1, 80);
    this.env = makeEnv(this.renderer, theme); this.scene.environment = this.env.texture; this.scene.environmentIntensity = theme === 'dark' ? .55 : .8;
    this.bgTex = tex(gradientBg(P.sky[0], P.sky[1], P.sky[2]), null); this.scene.background = this.bgTex;
    this.scene.fog = new FogExp2(P.fog, P.fogD);
    this.renderer.toneMappingExposure = P.exposure;
    /* إضاءة: ضوء مفتاح دافئ بظل ناعم + سماء + ضوء داخل الصندوق (متحرّك) + سبوت للتركيز */
    this.hemi = new HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2]); this.scene.add(this.hemi);
    this.key = new DirectionalLight(P.key, P.keyI); this.key.position.set(-4.5, 8, 5.5);
    if (q.shadow) { this.key.castShadow = true; const s = this.key.shadow; s.mapSize.set(q.shadowSize, q.shadowSize); const c = s.camera; c.near = 1; c.far = 30; c.left = -6; c.right = 6; c.top = 6; c.bottom = -6; s.bias = -.0004; s.normalBias = .02; s.radius = 4; }
    this.scene.add(this.key); this.scene.add(this.key.target);
    this.inner = new PointLight(0xffc880, 0, 6, 1.6); this.scene.add(this.inner);
    this.spot = new SpotLight(0xfff2d0, 0, 22, .42, .6, 1.2); this.spot.position.set(0, 10, 2); this.scene.add(this.spot); this.scene.add(this.spot.target);
    this.rim = new DirectionalLight(0x9fc4ff, theme === 'dark' ? 1.1 : .5); this.rim.position.set(5, 3, -6); this.scene.add(this.rim);
    this.buildSet();
    this.buildFx();
    this.size(opts.w, opts.h);
  }
  size(w, h) {
    if (!w || !h) return; this.W = w; this.H = h;
    const dpr = Math.min(window.devicePixelRatio || 1, this.q.dpr), px = Math.min(dpr, Math.sqrt(this.q.maxPx / (w * h)));
    this.renderer.setPixelRatio(Math.max(.6, px)); this.renderer.setSize(w, h, false); this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  /* ===== ديكور المسرح: منصّة كرتون دوّارة + طبقات ورقية مقصوصة + فوانيس/نجوم معلّقة ===== */
  buildSet() {
    const P = this.P, set = this.set = new Group(); this.scene.add(set);
    const floorTex = tex(grainCanvas(P.floor, { seed: 91, amp: 20, fibers: 260, stains: 16 }), [3, 3]);
    this.floorMat = new MeshStandardMaterial({ map: floorTex, roughness: .92, metalness: 0 });
    const plat = this.platform = new Mesh(new CylinderGeometry(3.4, 3.55, .22, 48), this.floorMat); plat.position.y = -.11; plat.receiveShadow = true; set.add(plat);
    const rim = this.rimM = new Mesh(new TorusGeometry(3.42, .06, 8, 64), new MeshStandardMaterial({ color: P.floorRim, roughness: .35, metalness: .9 })); rim.rotation.x = Math.PI / 2; rim.position.y = -.005; set.add(rim);
    const step = this.stepM = new Mesh(new CylinderGeometry(4.7, 4.8, .12, 48), new MeshStandardMaterial({ map: floorTex, roughness: .95, color: new Color(P.floor).multiplyScalar(.75) })); step.position.y = -.28; step.receiveShadow = true; set.add(step);
    const gnd = new Mesh(new PlaneGeometry(60, 60), new MeshStandardMaterial({ color: new Color(P.layers[2]), roughness: 1 })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -.4; gnd.receiveShadow = true; set.add(gnd);
    /* ظل تماس ناعم تحت الصندوق */
    this.contact = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: tex(shadowCanvas(), null), transparent: true, depthWrite: false, opacity: .8 })); this.contact.rotation.x = -Math.PI / 2; this.contact.position.y = .004; set.add(this.contact);
    /* طبقات مسرح ورقية بعمق (تعطي حركة المنظور عند تحرك الكاميرا) */
    this.layers = [];
    [['arches', -7.5, 10, 7.4, 0], ['hills', -10.5, 12.5, 8.6, 1], ['stars', -14, 17, 10.5, 2]].forEach(([kind, z, w, y, i]) => {
      const m = new Mesh(new PlaneGeometry(w * 2.2, w * 1.05), new MeshStandardMaterial({ map: tex(paperLayerCanvas(P.layers[i], kind, 10 + i), null), transparent: true, alphaTest: .4, roughness: 1, side: DoubleSide }));
      m.position.set(0, y * .52, z); m.receiveShadow = true; m.userData.z = z; this.set.add(m); this.layers.push(m);
    });
    /* فوانيس/نجوم ورقية معلّقة بخيط */
    const R = rng(77); this.hang = [];
    for (let i = 0; i < 5; i++) {
      const g = new Group(), len = 2.2 + R() * 2.2, star = new Mesh(new CylinderGeometry(.0, .24 + R() * .08, .06, 5), new MeshStandardMaterial({ color: i % 2 ? 0xd9a441 : 0xb44d3a, roughness: .7, metalness: .1, emissive: i % 2 ? 0x3a2606 : 0x2a0c06 }));
      star.position.y = -len; const cord = new Mesh(new CylinderGeometry(.006, .006, len, 4), new MeshBasicMaterial({ color: 0x6a5230 })); cord.position.y = -len / 2; g.add(cord); g.add(star);
      g.position.set(-5 + i * 2.5 + (R() - .5), 8.6, -3.8 - R() * 2); g.userData = { ph: R() * 6.28, amp: .05 + R() * .05 }; this.set.add(g); this.hang.push(g);
    }
    /* أشعة ضوء خفيفة من أعلى اليسار */
    this.shaftTex = tex(shaftCanvas(), null);
    this.shafts = [];
    [[-3.2, 4.4, -1.4, .38, 3.2], [-1.6, 4.4, -2.4, .26, 2.4]].forEach(([x, y, z, o, sc], i) => {
      const m = new Mesh(new PlaneGeometry(1.4 * sc, 10), new MeshBasicMaterial({ map: this.shaftTex, transparent: true, opacity: o * (this.theme === 'dark' ? .55 : .5), blending: AdditiveBlending, depthWrite: false, color: this.theme === 'dark' ? 0xffd9a0 : 0xfff0c8, fog: false }));
      m.position.set(x, y, z); m.rotation.z = -.38; m.userData.o = m.material.opacity; this.set.add(m); this.shafts.push(m);
    });
  }
  /* ===== جسيمات: غبار معلّق دائم + شرر/رماد صاعد + قصاصات ورق + حلقة صدمة + هالة ===== */
  buildFx() {
    const q = this.q, glow = this.glowTex = tex(glowCanvas(), null); const R = rng(5);
    /* غبار */
    const n = q.dust, pos = new Float32Array(n * 3); this.dustSeed = [];
    for (let i = 0; i < n; i++) { pos[i * 3] = (R() - .5) * 12; pos[i * 3 + 1] = R() * 7; pos[i * 3 + 2] = (R() - .5) * 10 - 1; this.dustSeed.push(R() * 6.28); }
    const gd = new BufferGeometry(); gd.setAttribute('position', new Float32BufferAttribute(pos, 3));
    this.dust = new Points(gd, new PointsMaterial({ map: glow, size: .09, transparent: true, opacity: this.theme === 'dark' ? .55 : .5, depthWrite: false, blending: AdditiveBlending, color: this.theme === 'dark' ? 0xffd9a0 : 0xfff4d8, sizeAttenuation: true, fog: false }));
    this.dust.frustumCulled = false; this.scene.add(this.dust);
    /* شرر/غبار صاعد (قابل لإعادة التدوير) */
    const m = q.sparks; this.sp = { n: m, pos: new Float32Array(m * 3), vel: new Float32Array(m * 3), life: new Float32Array(m), max: new Float32Array(m), i: 0 };
    for (let i = 0; i < m; i++) { this.sp.pos[i * 3 + 1] = -50; this.sp.life[i] = 0; }
    const gs = new BufferGeometry(); gs.setAttribute('position', new Float32BufferAttribute(this.sp.pos, 3)); this.sp.geo = gs;
    this.sparks = new Points(gs, new PointsMaterial({ map: glow, size: .16, transparent: true, opacity: 1, depthWrite: false, blending: AdditiveBlending, color: 0xffd08a, sizeAttenuation: true, fog: false })); this.sparks.frustumCulled = false; this.scene.add(this.sparks);
    /* قصاصات ورق (Instanced) */
    const pn = q.paper; this.paper = { n: pn, a: [], mesh: new InstancedMesh(new PlaneGeometry(.1, .14), new MeshStandardMaterial({ roughness: .9, side: DoubleSide }), pn), dummy: new Object3D() };
    this.paper.mesh.instanceMatrix.setUsage(DynamicDrawUsage); this.paper.mesh.frustumCulled = false; this.paper.mesh.castShadow = false;
    for (let i = 0; i < pn; i++) { this.paper.a.push({ life: 0, max: 1, p: new Vector3(0, -50, 0), v: new Vector3(), r: new Vector3(), s: new Vector3(), sc: 1 }); this.paper.dummy.position.set(0, -50, 0); this.paper.dummy.updateMatrix(); this.paper.mesh.setMatrixAt(i, this.paper.dummy.matrix); this.paper.mesh.setColorAt(i, new Color(1, 1, 1)); }
    this.scene.add(this.paper.mesh);
    /* حلقة صدمة + هالة + أشعة + عمود ضوء */
    this.shock = new Mesh(new RingGeometry(.92, 1, 64), new MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false })); this.shock.rotation.x = -Math.PI / 2; this.shock.position.y = .02; this.scene.add(this.shock);
    this.halo = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: glow, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, color: 0xffe0a0, fog: false })); this.halo.renderOrder = 5; this.scene.add(this.halo);
    this.raysM = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: tex(raysCanvas(), null), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, color: 0xffe0a0, fog: false })); this.raysM.renderOrder = 4; this.scene.add(this.raysM);
    this.pillar = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: this.shaftTex, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, color: 0xffe0a0, fog: false })); this.pillar.renderOrder = 3; this.scene.add(this.pillar);
    this.pillar2 = this.pillar.clone(); this.pillar2.material = this.pillar.material.clone(); this.scene.add(this.pillar2);
  }
  /* انبعاث شرر (rgb 0..1) من نقطة */
  emitSparks(p, n, o = {}) {
    const S = this.sp, sp = o.sp || [1.2, 3.2], up = o.up == null ? 2 : o.up, sz = o.spread == null ? .5 : o.spread, life = o.life || [.9, 1.8];
    for (let k = 0; k < n; k++) {
      const i = S.i = (S.i + 1) % S.n, a = Math.random() * 6.283, s = sp[0] + Math.random() * (sp[1] - sp[0]);
      S.pos[i * 3] = p.x + (Math.random() - .5) * sz; S.pos[i * 3 + 1] = p.y; S.pos[i * 3 + 2] = p.z + (Math.random() - .5) * sz;
      S.vel[i * 3] = Math.cos(a) * s * .4; S.vel[i * 3 + 1] = up * (.6 + Math.random() * .8) + s * .3; S.vel[i * 3 + 2] = Math.sin(a) * s * .4;
      S.max[i] = S.life[i] = life[0] + Math.random() * (life[1] - life[0]);
    }
    if (o.color != null) this.sparks.material.color.setHex(o.color);
  }
  burstPaper(p, n, o = {}) {
    const P = this.paper, cols = o.colors || [0xf0e0b8, 0xd9b36a, 0xc74a36, 0x2f6c9f], sp = o.sp || [1.5, 4];
    for (let k = 0; k < n; k++) {
      const a = P.a[(P.cur = ((P.cur || 0) + 1) % P.n)], th = Math.random() * 6.283, s = sp[0] + Math.random() * (sp[1] - sp[0]);
      a.p.set(p.x + (Math.random() - .5) * .5, p.y, p.z + (Math.random() - .5) * .5); a.v.set(Math.cos(th) * s * .55, 2.2 + Math.random() * s, Math.sin(th) * s * .55);
      a.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); a.s.set((Math.random() - .5) * 9, (Math.random() - .5) * 9, (Math.random() - .5) * 9); a.max = a.life = (o.life || 2.4) * (.7 + Math.random() * .6); a.sc = .7 + Math.random() * .9;
      P.mesh.setColorAt(P.cur, new Color(cols[(Math.random() * cols.length) | 0]));
    }
    if (P.mesh.instanceColor) P.mesh.instanceColor.needsUpdate = true;
  }
  /* تحديث الجسيمات والحركات الخلفية */
  tick(dt, t) {
    const S = this.sp;
    for (let i = 0; i < S.n; i++) {
      if (S.life[i] <= 0) continue; S.life[i] -= dt;
      if (S.life[i] <= 0) { S.pos[i * 3 + 1] = -50; continue; }
      S.vel[i * 3 + 1] -= 1.4 * dt; S.vel[i * 3] *= (1 - .8 * dt); S.vel[i * 3 + 2] *= (1 - .8 * dt);
      S.pos[i * 3] += S.vel[i * 3] * dt; S.pos[i * 3 + 1] += S.vel[i * 3 + 1] * dt; S.pos[i * 3 + 2] += S.vel[i * 3 + 2] * dt;
    }
    S.geo.attributes.position.needsUpdate = true;
    const P = this.paper, d = P.dummy; let live = 0;
    for (let i = 0; i < P.n; i++) {
      const a = P.a[i]; if (a.life <= 0) continue; a.life -= dt; live++;
      if (a.life <= 0) { d.position.set(0, -50, 0); d.scale.setScalar(.0001); d.updateMatrix(); P.mesh.setMatrixAt(i, d.matrix); continue; }
      a.v.y -= 3.2 * dt; a.v.multiplyScalar(1 - 1.4 * dt); a.v.x += Math.sin(t * 3 + i) * .6 * dt; a.p.addScaledVector(a.v, dt); a.r.addScaledVector(a.s, dt * .25);
      if (a.p.y < .02) { a.p.y = .02; a.v.set(0, 0, 0); a.s.multiplyScalar(.9); }
      d.position.copy(a.p); d.rotation.set(a.r.x, a.r.y, a.r.z); d.scale.setScalar(a.sc * Math.min(1, a.life * 2)); d.updateMatrix(); P.mesh.setMatrixAt(i, d.matrix);
    }
    if (live) P.mesh.instanceMatrix.needsUpdate = true;
    const pa = this.dust.geometry.attributes.position;
    for (let i = 0; i < this.q.dust; i++) { pa.array[i * 3 + 1] += Math.sin(t * .4 + this.dustSeed[i]) * .0016 + .0007; pa.array[i * 3] += Math.cos(t * .3 + this.dustSeed[i]) * .0012; if (pa.array[i * 3 + 1] > 7.5) pa.array[i * 3 + 1] = 0; }
    pa.needsUpdate = true;
    this.hang.forEach(g => { g.rotation.z = Math.sin(t * .8 + g.userData.ph) * g.userData.amp; });
  }
  render() { this.renderer.render(this.scene, this.camera); }
  dispose() {
    const seen = new Set();
    this.scene.traverse(o => {
      if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(m => { if (seen.has(m)) return; seen.add(m); ['map', 'bumpMap', 'alphaMap', 'emissiveMap', 'roughnessMap'].forEach(k => { if (m[k] && !seen.has(m[k])) { seen.add(m[k]); m[k].dispose(); } }); m.dispose(); });
    });
    try { this.env.dispose(); } catch (e) {} try { this.bgTex.dispose(); } catch (e) {}
    if (this.paper) { try { this.paper.mesh.dispose(); } catch (e) {} }
    try { this.renderer.dispose(); this.renderer.forceContextLoss(); } catch (e) {}
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}

export function quality(low) {
  const base = low
    ? { aa: false, shadow: true, shadowSize: 1024, dpr: 1.5, maxPx: 1.5e6, dust: 50, sparks: 90, paper: 50 }
    : { aa: true, shadow: true, shadowSize: 2048, dpr: 2, maxPx: 3.6e6, dust: 110, sparks: 260, paper: 110 };
  return base;
}
