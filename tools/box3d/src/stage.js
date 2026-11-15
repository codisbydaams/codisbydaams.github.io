/* CODIS-BOX3D v2 — المسرح: Renderer واحد + إضاءة سينمائية (مفتاح دافئ بظل ناعم + حافة باردة + بقعة تركيز) + بيئة انعكاس PMREM
   + أرضية منصة خشبية + خلفية «أتيليه» بعمق + جسيمات (غبار معلّق · شرر ممطوط بالسرعة · قصاصات) + عمود ضوء حجمي (Shader) + بركة ضوء أرضية.
   الدقة: نسبة البكسل الفعلية للجهاز (حتى 3) ضمن ميزانية بكسلات، مع حاكم تكيّفي ينزل بخطوات صغيرة فقط إن هبط معدل الإطارات (ولا ينزل تحت أرضية الوضوح). */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, CylinderGeometry, TorusGeometry, RingGeometry, CircleGeometry,
  HemisphereLight, DirectionalLight, PointLight, SpotLight, AdditiveBlending, SRGBColorSpace, ACESFilmicToneMapping, PCFSoftShadowMap, FogExp2, Vector3, PMREMGenerator,
  BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, InstancedMesh, DynamicDrawUsage, Object3D, DoubleSide, SphereGeometry, BackSide, Matrix4, ShaderMaterial
} from 'three';
import { tex, setAniso, glowCanvas, shaftCanvas, raysCanvas, shadowCanvas, gradientBg, floorCanvas, streakCanvas } from './tex.js';
import { rng, clamp } from './util.js';

export const PAL = {
  paper: { sky: ['#6b4c2c', '#3d2a17', '#1a120a'], fog: 0x24180d, fogD: .045, hemi: [0xffe9c8, 0x3a2614, .55], key: 0xffdcae, keyI: 3.4, floor: '#5a3d22', floorRim: '#c79a45', set: '#2c1e11', env: [.75, .6, .44], exposure: .98, rim: 0xa9c8ff, rimI: .9 },
  dark: { sky: ['#1d1812', '#0f0c08', '#050403'], fog: 0x070605, fogD: .05, hemi: [0xffd9a8, 0x140c06, .4], key: 0xffc98a, keyI: 3.0, floor: '#2b2016', floorRim: '#b48a2c', set: '#120d08', env: [.45, .38, .3], exposure: 1.0, rim: 0x9fc4ff, rimI: 1.2 },
};

export function quality(tier) {
  const dpr = window.devicePixelRatio || 1;
  if (tier === 'low') return { tier: 'low', aa: true, shadow: true, shadowSize: 1024, dpr: Math.min(dpr, 2), floor: Math.min(dpr, 1.25), maxPx: 2.4e6, dust: 60, sparks: 160, paper: 50, aniso: 4, texS: 512 };
  return { tier: 'hi', aa: true, shadow: true, shadowSize: 2048, dpr: Math.min(dpr, 3), floor: Math.min(dpr, 1.5), maxPx: 4.4e6, dust: 110, sparks: 300, paper: 90, aniso: 8, texS: 1024 };
}

export function makeRenderer(canvas, q) {
  const r = new WebGLRenderer({ canvas, antialias: q.aa, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!q.preserve, stencil: false });
  r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = 1;
  r.shadowMap.enabled = q.shadow; r.shadowMap.type = PCFSoftShadowMap;
  return r;
}
/* بيئة انعكاسات: قبة دافئة + ثلاث «صناديق ضوء» (مفتاح/حافة/سقف) فيلمع المعدن والورنيش بخطوط ضوء واضحة */
export function makeEnv(renderer, theme) {
  const sc = new Scene(), P = PAL[theme] || PAL.paper;
  sc.add(new Mesh(new SphereGeometry(20, 24, 12), new MeshBasicMaterial({ side: BackSide, color: new Color(P.env[0] * .5, P.env[1] * .5, P.env[2] * .5) })));
  const box = (c, x, y, z, w, h, i) => { const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(c).multiplyScalar(i), side: DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
  box(0xfff0d0, -6, 7, 6, 7, 4, 4.2); box(0xcfe0ff, 8, 4, -3, 3, 7, 2.2); box(0xffe2b0, 0, 12, 0, 8, 3, 2.4); box(0xffd49a, 0, 1, 9, 12, 1.2, 1.4);
  const pm = new PMREMGenerator(renderer); const rt = pm.fromScene(sc, .03); pm.dispose();
  sc.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt;
}
/* عمود ضوء حجمي: أسطوانة مفتوحة، أسطع بمنتصف المقطع، يتلاشى للأعلى، إضافي */
function beamMaterial() {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(1, .85, .6) }, uI: { value: 0 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 uColor;uniform float uI;uniform float uT;varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){float f=abs(dot(normalize(vN),normalize(vV)));f=pow(f,2.2);float y=vUv.y;float fade=smoothstep(0.,.08,y)*pow(1.-y,1.6);float fl=.85+.15*sin(uT*3.+y*9.);gl_FragColor=vec4(uColor*uI*f*fade*fl,1.);}',
    transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false,
  });
}

export class Stage {
  constructor(opts) {
    const q = this.q = opts.q, theme = this.theme = opts.theme === 'dark' ? 'dark' : 'paper', P = this.P = PAL[theme];
    this.host = opts.host; this.hooks = opts.hooks || {}; this.pxMul = 1; setAniso(q.aniso || 4);
    const cv = this.canvas = document.createElement('canvas'); cv.className = 'b3d-cv'; this.host.appendChild(cv);
    this.renderer = makeRenderer(cv, q);
    try { setAniso(Math.min(q.aniso || 4, this.renderer.capabilities.getMaxAnisotropy())); } catch (e) {}
    this.scene = new Scene(); this.camera = new PerspectiveCamera(34, 1, .1, 90);
    this.env = makeEnv(this.renderer, theme); this.scene.environment = this.env.texture; this.scene.environmentIntensity = theme === 'dark' ? .6 : .75;
    this.bgTex = tex(gradientBg(P.sky[0], P.sky[1], P.sky[2]), null); this.scene.background = this.bgTex;
    this.scene.fog = new FogExp2(P.fog, P.fogD);
    this.renderer.toneMappingExposure = P.exposure;
    this.hemi = new HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2]); this.scene.add(this.hemi);
    this.key = new DirectionalLight(P.key, P.keyI); this.key.position.set(-4.5, 8, 5.5);
    if (q.shadow) { this.key.castShadow = true; const s = this.key.shadow; s.mapSize.set(q.shadowSize, q.shadowSize); const c = s.camera; c.near = 1; c.far = 30; c.left = -6; c.right = 6; c.top = 6; c.bottom = -6; s.bias = -.0004; s.normalBias = .02; s.radius = 5; }
    this.scene.add(this.key); this.scene.add(this.key.target);
    this.inner = new PointLight(0xffc880, 0, 7, 1.6); this.scene.add(this.inner);
    this.spot = new SpotLight(0xfff2d0, 0, 24, .4, .65, 1.2); this.spot.position.set(0, 10, 2); this.scene.add(this.spot); this.scene.add(this.spot.target);
    this.rim = new DirectionalLight(P.rim, P.rimI); this.rim.position.set(5, 4, -6); this.scene.add(this.rim);
    this.fill = new DirectionalLight(0xffe0b8, .35); this.fill.position.set(4, 2, 6); this.scene.add(this.fill);
    this.buildSet(); this.buildFx();
    this.size(opts.w, opts.h);
  }
  /* الدقة: min(DPR الجهاز, سقف الجودة, ميزانية البكسلات) × حاكم الأداء، ولا تنزل تحت الأرضية */
  pixelRatio(w, h) { const q = this.q, budget = Math.sqrt(q.maxPx / Math.max(1, w * h)); return Math.max(Math.min(q.floor, budget), Math.min(q.dpr, budget) * this.pxMul); }
  size(w, h) {
    if (!w || !h) return; this.W = w; this.H = h;
    this.renderer.setPixelRatio(this.pixelRatio(w, h)); this.renderer.setSize(w, h, false); this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  degrade() { const before = this.pixelRatio(this.W, this.H); this.pxMul = Math.max(.5, this.pxMul * .86); const after = this.pixelRatio(this.W, this.H); if (Math.abs(after - before) < .02) return false; this.size(this.W, this.H); return true; }
  buildSet() {
    const P = this.P, set = this.set = new Group(); this.scene.add(set);
    const floorTex = tex(floorCanvas(this.q.texS >= 1024 ? 1024 : 512, P.floor, P.floorRim), null);
    this.floorMat = new MeshStandardMaterial({ map: floorTex, roughness: .55, metalness: .05 });
    const plat = this.platform = new Mesh(new CylinderGeometry(3.4, 3.5, .22, 64), [new MeshStandardMaterial({ color: new Color(P.floor).multiplyScalar(.6), roughness: .6 }), this.floorMat, this.floorMat]); plat.position.y = -.11; plat.receiveShadow = true; set.add(plat);
    const rim = this.rimM = new Mesh(new TorusGeometry(3.42, .045, 10, 96), new MeshStandardMaterial({ color: P.floorRim, roughness: .3, metalness: 1 })); rim.rotation.x = Math.PI / 2; rim.position.y = -.005; set.add(rim);
    const step = this.stepM = new Mesh(new CylinderGeometry(4.6, 4.8, .14, 64), new MeshStandardMaterial({ color: new Color(P.floor).multiplyScalar(.45), roughness: .8 })); step.position.y = -.29; step.receiveShadow = true; set.add(step);
    const gnd = new Mesh(new PlaneGeometry(80, 80), new MeshStandardMaterial({ color: new Color(P.set), roughness: 1 })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -.36; gnd.receiveShadow = true; set.add(gnd);
    this.contact = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: tex(shadowCanvas(), null), transparent: true, depthWrite: false, opacity: .85 })); this.contact.rotation.x = -Math.PI / 2; this.contact.position.y = .004; set.add(this.contact);
    /* جدار خلفي منحني (سايكلوراما) بلون المسرح: يمنح عمقاً بلا تشويش */
    const cyc = new Mesh(new CylinderGeometry(16, 16, 22, 48, 1, true, Math.PI * .65, Math.PI * .7), new MeshStandardMaterial({ color: new Color(P.set).multiplyScalar(1.4), roughness: 1, side: BackSide })); cyc.position.set(0, 10.6, 2); set.add(cyc); this.cyc = cyc;
    this.layers = [];
  }
  buildFx() {
    const q = this.q, glow = this.glowTex = tex(glowCanvas(), null); const R = rng(5);
    const n = q.dust, pos = new Float32Array(n * 3); this.dustSeed = [];
    for (let i = 0; i < n; i++) { pos[i * 3] = (R() - .5) * 12; pos[i * 3 + 1] = R() * 7; pos[i * 3 + 2] = (R() - .5) * 10 - 1; this.dustSeed.push(R() * 6.28); }
    const gd = new BufferGeometry(); gd.setAttribute('position', new Float32BufferAttribute(pos, 3));
    this.dust = new Points(gd, new PointsMaterial({ map: glow, size: .07, transparent: true, opacity: .55, depthWrite: false, blending: AdditiveBlending, color: 0xffe2b4, sizeAttenuation: true, fog: false }));
    this.dust.frustumCulled = false; this.scene.add(this.dust);
    /* شرر ممطوط: كل شرارة مستطيل يتجه مع سرعتها على مستوى الشاشة ويطول بسرعتها */
    const m = q.sparks; this.sp = { n: m, pos: new Float32Array(m * 3), vel: new Float32Array(m * 3), life: new Float32Array(m), max: new Float32Array(m), col: new Float32Array(m * 3), sz: new Float32Array(m), drag: new Float32Array(m), grav: new Float32Array(m), i: 0 };
    this.sparks = new InstancedMesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: tex(streakCanvas(), null), transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false, fog: false, side: DoubleSide }), m);
    this.sparks.instanceMatrix.setUsage(DynamicDrawUsage); this.sparks.frustumCulled = false; this._m4 = new Matrix4(); this._zero = new Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < m; i++) { this.sparks.setMatrixAt(i, this._zero); this.sparks.setColorAt(i, new Color(0, 0, 0)); }
    this.scene.add(this.sparks);
    const pn = q.paper; this.paper = { n: pn, a: [], mesh: new InstancedMesh(new PlaneGeometry(.09, .13), new MeshStandardMaterial({ roughness: .5, metalness: .4, side: DoubleSide }), pn), dummy: new Object3D() };
    this.paper.mesh.instanceMatrix.setUsage(DynamicDrawUsage); this.paper.mesh.frustumCulled = false;
    for (let i = 0; i < pn; i++) { this.paper.a.push({ life: 0, max: 1, p: new Vector3(0, -50, 0), v: new Vector3(), r: new Vector3(), s: new Vector3(), sc: 1 }); this.paper.dummy.position.set(0, -50, 0); this.paper.dummy.scale.setScalar(.0001); this.paper.dummy.updateMatrix(); this.paper.mesh.setMatrixAt(i, this.paper.dummy.matrix); this.paper.mesh.setColorAt(i, new Color(1, 1, 1)); }
    this.scene.add(this.paper.mesh);
    this.shock = new Mesh(new RingGeometry(.9, 1, 96), new MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false, toneMapped: false })); this.shock.rotation.x = -Math.PI / 2; this.shock.position.y = .02; this.scene.add(this.shock);
    this.pool = new Mesh(new CircleGeometry(1, 48), new MeshBasicMaterial({ map: glow, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, color: 0xffd090, fog: false, toneMapped: false })); this.pool.rotation.x = -Math.PI / 2; this.pool.position.y = .012; this.scene.add(this.pool);
    this.halo = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: glow, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, color: 0xffe0a0, fog: false, toneMapped: false })); this.halo.renderOrder = 5; this.scene.add(this.halo);
    this.raysM = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: tex(raysCanvas(), null), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, color: 0xffe0a0, fog: false, toneMapped: false })); this.raysM.renderOrder = 4; this.scene.add(this.raysM);
    this.beam = new Mesh(new CylinderGeometry(1, .62, 1, 40, 1, true), beamMaterial()); this.beam.geometry.translate(0, .5, 0); this.beam.renderOrder = 3; this.beam.visible = false; this.scene.add(this.beam);
    this.shaftTex = tex(shaftCanvas(), null);
  }
  /* انبعاث شرر: col = Color أو رقم hex؛ o.sp سرعة · o.up صعود · o.spread · o.life · o.size · o.drag · o.grav */
  emitSparks(p, n, o = {}) {
    const S = this.sp, sp = o.sp || [1.2, 3.2], up = o.up == null ? 2 : o.up, sz = o.spread == null ? .5 : o.spread, life = o.life || [.7, 1.4], c = o.color == null ? 0xffd08a : o.color;
    const col = typeof c === 'number' ? new Color(c) : c, size = o.size || .05;
    for (let k = 0; k < n; k++) {
      const i = S.i = (S.i + 1) % S.n, a = Math.random() * 6.283, s = sp[0] + Math.random() * (sp[1] - sp[0]);
      S.pos[i * 3] = p.x + (Math.random() - .5) * sz; S.pos[i * 3 + 1] = p.y + (Math.random() - .5) * sz * .2; S.pos[i * 3 + 2] = p.z + (Math.random() - .5) * sz;
      S.vel[i * 3] = Math.cos(a) * s * .45; S.vel[i * 3 + 1] = up * (.6 + Math.random() * .8) + s * .25; S.vel[i * 3 + 2] = Math.sin(a) * s * .45;
      S.max[i] = S.life[i] = life[0] + Math.random() * (life[1] - life[0]); S.sz[i] = size * (.6 + Math.random() * .8); S.drag[i] = o.drag == null ? 1.6 : o.drag; S.grav[i] = o.grav == null ? 2.6 : o.grav;
      const j = .85 + Math.random() * .3; S.col[i * 3] = col.r * j; S.col[i * 3 + 1] = col.g * j; S.col[i * 3 + 2] = col.b * j;
    }
  }
  burstPaper(p, n, o = {}) {
    const P = this.paper, cols = o.colors || [0xf0d9a8, 0xd9b36a], sp = o.sp || [1.5, 4];
    for (let k = 0; k < n; k++) {
      const a = P.a[(P.cur = ((P.cur || 0) + 1) % P.n)], th = Math.random() * 6.283, s = sp[0] + Math.random() * (sp[1] - sp[0]);
      a.p.set(p.x + (Math.random() - .5) * .5, p.y, p.z + (Math.random() - .5) * .5); a.v.set(Math.cos(th) * s * .55, 2.2 + Math.random() * s, Math.sin(th) * s * .55);
      a.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); a.s.set((Math.random() - .5) * 9, (Math.random() - .5) * 9, (Math.random() - .5) * 9); a.max = a.life = (o.life || 2.4) * (.7 + Math.random() * .6); a.sc = .7 + Math.random() * .9;
      P.mesh.setColorAt(P.cur, new Color(cols[(Math.random() * cols.length) | 0]));
    }
    if (P.mesh.instanceColor) P.mesh.instanceColor.needsUpdate = true;
  }
  tick(dt, t) {
    const S = this.sp, cam = this.camera, m4 = this._m4, e = cam.matrixWorld.elements, rx = e[0], ry = e[1], rz = e[2], ux = e[4], uy = e[5], uz = e[6], fx = e[8], fy = e[9], fz = e[10];
    let any = false;
    for (let i = 0; i < S.n; i++) {
      if (S.life[i] <= 0) continue; S.life[i] -= dt; any = true;
      if (S.life[i] <= 0) { this.sparks.setMatrixAt(i, this._zero); continue; }
      const dr = 1 - S.drag[i] * dt; S.vel[i * 3 + 1] -= S.grav[i] * dt; S.vel[i * 3] *= dr; S.vel[i * 3 + 1] *= dr; S.vel[i * 3 + 2] *= dr;
      const vx = S.vel[i * 3], vy = S.vel[i * 3 + 1], vz = S.vel[i * 3 + 2];
      S.pos[i * 3] += vx * dt; S.pos[i * 3 + 1] += vy * dt; S.pos[i * 3 + 2] += vz * dt;
      if (S.pos[i * 3 + 1] < .01 && vy < 0) { S.pos[i * 3 + 1] = .01; S.vel[i * 3 + 1] = -vy * .3; S.vel[i * 3] *= .6; S.vel[i * 3 + 2] *= .6; }
      const sx = vx * rx + vy * ry + vz * rz, sy = vx * ux + vy * uy + vz * uz, sl = Math.hypot(sx, sy) + 1e-5, cx = sx / sl, cy = sy / sl;
      const k = S.life[i] / S.max[i], L = S.sz[i] * (1.2 + sl * 1.6) * Math.min(1, k * 3), W = S.sz[i] * .5 * Math.min(1, k * 3);
      /* محاور: X باتجاه السرعة على الشاشة (طول) · Y عمودي عليه (عرض) · Z نحو الكاميرا */
      m4.set(
        (rx * cx + ux * cy) * L, (-rx * cy + ux * cx) * W, fx, S.pos[i * 3] - (rx * cx + ux * cy) * L * .4,
        (ry * cx + uy * cy) * L, (-ry * cy + uy * cx) * W, fy, S.pos[i * 3 + 1] - (ry * cx + uy * cy) * L * .4,
        (rz * cx + uz * cy) * L, (-rz * cy + uz * cx) * W, fz, S.pos[i * 3 + 2] - (rz * cx + uz * cy) * L * .4,
        0, 0, 0, 1);
      this.sparks.setMatrixAt(i, m4);
      const a = Math.min(1, k * 1.6); this.sparks.instanceColor.setXYZ(i, S.col[i * 3] * a, S.col[i * 3 + 1] * a, S.col[i * 3 + 2] * a);
    }
    if (any || this._sparkAny) { this.sparks.instanceMatrix.needsUpdate = true; this.sparks.instanceColor.needsUpdate = true; } this._sparkAny = any;
    const P = this.paper, d = P.dummy; let live = 0;
    for (let i = 0; i < P.n; i++) {
      const a = P.a[i]; if (a.life <= 0) continue; a.life -= dt; live++;
      if (a.life <= 0) { d.position.set(0, -50, 0); d.scale.setScalar(.0001); d.updateMatrix(); P.mesh.setMatrixAt(i, d.matrix); continue; }
      a.v.y -= 3.2 * dt; a.v.multiplyScalar(1 - 1.4 * dt); a.v.x += Math.sin(t * 3 + i) * .6 * dt; a.p.addScaledVector(a.v, dt); a.r.addScaledVector(a.s, dt * .25);
      if (a.p.y < .02) { a.p.y = .02; a.v.set(0, 0, 0); a.s.multiplyScalar(.9); }
      d.position.copy(a.p); d.rotation.set(a.r.x, a.r.y, a.r.z); d.scale.setScalar(a.sc * Math.min(1, a.life * 2)); d.updateMatrix(); P.mesh.setMatrixAt(i, d.matrix);
    }
    if (live || this._paperAny) P.mesh.instanceMatrix.needsUpdate = true; this._paperAny = live > 0;
    const pa = this.dust.geometry.attributes.position;
    for (let i = 0; i < this.q.dust; i++) { pa.array[i * 3 + 1] += Math.sin(t * .4 + this.dustSeed[i]) * .0016 + .0007; pa.array[i * 3] += Math.cos(t * .3 + this.dustSeed[i]) * .0012; if (pa.array[i * 3 + 1] > 7.5) pa.array[i * 3 + 1] = 0; }
    pa.needsUpdate = true;
    this.beam.material.uniforms.uT.value = t; this.beam.visible = this.beam.material.uniforms.uI.value > .002;
  }
  render() { this.renderer.render(this.scene, this.camera); }
  dispose() {
    const seen = new Set();
    this.scene.traverse(o => {
      if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(m => { if (seen.has(m)) return; seen.add(m); ['map', 'bumpMap', 'alphaMap', 'emissiveMap', 'roughnessMap', 'metalnessMap'].forEach(k => { if (m[k] && !seen.has(m[k])) { seen.add(m[k]); m[k].dispose(); } }); m.dispose(); });
    });
    try { this.env.dispose(); } catch (e) {} try { this.bgTex.dispose(); } catch (e) {} try { this.shaftTex.dispose(); } catch (e) {}
    [this.paper && this.paper.mesh, this.sparks].forEach(x => { try { if (x) x.dispose(); } catch (e) {} });
    try { this.renderer.renderLists.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss(); } catch (e) {}
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
