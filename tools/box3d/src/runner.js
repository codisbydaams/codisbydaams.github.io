/* CODIS-BOX3D v2 — مشغّل المشهد المشترك.
   • الطبقة تُركَّب داخل body: على الهاتف = الشاشة، وعلى الحاسوب = إطار الهاتف 430px (body مُحوَّل فهو حاوية position:fixed) — لا تتمدد مع النافذة.
   • كل الإحداثيات بوحدات CSS نسبةً للطبقة نفسها (W×H)، ودقة الرسم الفعلية منفصلة (Stage.pixelRatio).
   • إسقاط عكسي دقيق: poseForRect(مستطيل شاشة) ⇒ وضعية بطاقة ثلاثية الأبعاد يطابق إسقاطها المستطيل تماماً (يشمل setViewOffset) — أساس الهبوط في الخانات.
   • التسليم «بعنصر مشترك»: تُرسم الواجهة النهائية تحت الطبقة، تُقاس بطاقاتها الحقيقية، تطير بطاقات المشهد إليها بالضبط بينما يتلاشى المشهد، ثم تظهر الحقيقية بنفس البكسلات.
   • نقرة = تسريع · نقرتان/Esc = تخطٍّ صامت (لا تنفجر الأصوات المتبقية) · أي خطأ = تسليم فوري. تنظيف كامل لكل الموارد. */
import { Vector3, Quaternion } from 'three';
import { Stage, quality } from './stage.js';
import { Timeline, CamTrack, noise1, clamp, E } from './util.js';
import { DomCards } from './dom.js';

export const REG = { last: null };
export class Runner {
  constructor(o) {
    REG.last = this; this.o = o; this.hooks = o.hooks || {}; this.dead = false; this.handed = false; this.raf = 0; this.last = 0; this.shakeAmp = 0; this.shakeT = 0; this.rate = 1; this.silent = false;
    const root = this.root = document.createElement('div'); root.className = 'b3d-root'; root.setAttribute('aria-hidden', 'true'); root.setAttribute('role', 'presentation');
    root.innerHTML = '<div class="b3d-vig"></div><div class="b3d-flash"></div><div class="b3d-black"></div><i class="b3d-safe"></i>';
    (o.host || document.body).appendChild(root);
    this.flashEl = root.querySelector('.b3d-flash'); this.blackEl = root.querySelector('.b3d-black'); this.vigEl = root.querySelector('.b3d-vig');
    this.readSafe(); this.measure();
    this.q = quality(o.tier || 'hi'); if (o.preserve) this.q.preserve = true;
    try { this.stage = new Stage({ host: root, q: this.q, theme: o.theme, w: this.W, h: this.H, hooks: this.hooks }); } catch (e) { try { root.remove(); } catch (x) {} this.dead = true; throw e; }
    root.insertBefore(this.stage.canvas, root.firstChild);
    this.dom = new DomCards(root, this.vigEl.nextSibling, this.hooks); this.post = null;
    this.tl = new Timeline(); this.track = new CamTrack(); this.cp = new Vector3(); this.cl = new Vector3(); this.extra = []; this.landables = [];
    this.onLost = e => { try { e.preventDefault(); } catch (x) {} this.fail('contextlost'); };
    this.stage.canvas.addEventListener('webglcontextlost', this.onLost);
    this.ro = null; try { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); } catch (e) { this.onWin = () => this.resize(); window.addEventListener('resize', this.onWin); }
    this.onVis = () => { this.last = 0; }; document.addEventListener('visibilitychange', this.onVis);
    this.lastTap = 0; this.tapT = 0;
    this.onDown = e => { const n = performance.now(); if (n - this.lastTap < 360) { this.lastTap = 0; clearTimeout(this.tapT); this.skip(); } else { this.lastTap = n; clearTimeout(this.tapT); this.tapT = setTimeout(() => this.hurry(), 370); } try { e.preventDefault(); } catch (x) {} };
    root.addEventListener('pointerdown', this.onDown);
    this.onKey = e => { if (e.key === 'Escape') { try { e.stopPropagation(); e.preventDefault(); } catch (x) {} this.skip(); } };
    window.addEventListener('keydown', this.onKey, true);
    this.inert = [];
    try { const host = o.host || document.body; const list = host === document.body ? Array.prototype.slice.call(document.body.children).filter(el => el !== root && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') : [document.body]; list.forEach(el => { if (!el.inert) { el.inert = true; this.inert.push(el); } }); } catch (e) {}
    this.prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    this.fpsN = 0; this.fpsAcc = 0; this.fpsCool = 40;
  }
  /* مساحة آمنة (notch/شريط المنزل) بوحدات CSS */
  readSafe() { try { const cs = getComputedStyle(this.root.querySelector('.b3d-safe')); this.safe = { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 }; } catch (e) { this.safe = { t: 0, r: 0, b: 0, l: 0 }; } }
  measure() { const r = this.root.getBoundingClientRect(); this.ox = r.left; this.oy = r.top; this.W = Math.max(2, Math.round(r.width)); this.H = Math.max(2, Math.round(r.height)); }
  resize() {
    if (this.dead) return; const W0 = this.W, H0 = this.H; this.measure(); this.readSafe(); this._tg = null;
    if (this.W === W0 && this.H === H0) return; this.stage.size(this.W, this.H); if (this.onResize) try { this.onResize(this.W, this.H); } catch (e) {}
  }
  get aspect() { return this.W / this.H; }
  start() { this.last = 0; this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame); }
  sfx(name, opts) { if (this.silent || this.dead) return; try { if (this.hooks.sfx) this.hooks.sfx(name, Object.assign({ group: 'b3d' }, opts || {})); } catch (e) {} }
  haptic(p) { if (this.silent || this.dead) return; try { if (this.hooks.haptic) this.hooks.haptic(p); } catch (e) {} }
  shake(a) { if (!this.silent) this.shakeAmp = Math.max(this.shakeAmp, a); }
  flash(a, ms, col) { const e = this.flashEl; if (!e || this.silent) return; if (col) e.style.background = col; e.style.transition = 'none'; e.style.opacity = String(a); void e.offsetWidth; e.style.transition = 'opacity ' + (ms || 500) + 'ms cubic-bezier(.2,.7,.3,1)'; e.style.opacity = '0'; }
  /* نقرة واحدة: تسريع المشهد الحالي (لا يتخطى) */
  hurry() { if (this.dead || this.handed) return; this.rate = Math.min(3.2, this.rate * 1.8); }
  frame(ts) {
    if (this.dead) return; this.raf = requestAnimationFrame(this.frame);
    if (document.hidden) { this.last = 0; return; }
    const raw = this.last ? (ts - this.last) / 1000 : 0, dt = clamp(raw, 0, .05); this.last = ts;
    try {
      if (!this.handed) this.tl.update(dt * this.rate);
      if (this.onFrame) this.onFrame(dt, this.tl.t);
      this.updateCamera(dt);
      if (this.landing) this.landStep(dt);
      this.stage.tick(dt, (this.tAbs = (this.tAbs || 0) + dt));
      this.stage.render(); if (this.post) this.post();
      this.frames = (this.frames || 0) + 1; if (this.frames === 1 && this.hooks.onFirstFrame) this.hooks.onFirstFrame();
      this.govern(raw);
    } catch (e) { try { console.warn('CodisBox3D', e); } catch (x) {} this.fail('error'); }
  }
  /* حاكم الأداء: متوسط زمن الإطار > 24ms لفترة ⇒ ينزل نسبة البكسل 14% (حتى الأرضية فقط) */
  govern(raw) {
    if (!raw || raw > .25) return; this.fpsAcc += raw; this.fpsN++;
    if (this.fpsN < 30) return; const avg = this.fpsAcc / this.fpsN; this.fpsAcc = 0; this.fpsN = 0;
    if (this.fpsCool > 0) { this.fpsCool -= 30; return; }
    if (avg > .024 && this.stage.degrade()) { this.fpsCool = 30; this.degraded = (this.degraded || 0) + 1; }
  }
  updateCamera(dt) {
    const cam = this.stage.camera, fov = this.track.eval(this.tl.t, this.cp, this.cl);
    const fit = this.fitMul = Math.max(1, (this.fitAspect || .62) / this.aspect);
    cam.position.copy(this.cl).addScaledVector(this.cp.clone().sub(this.cl), fit);
    this.shakeAmp *= Math.exp(-dt * 6); this.shakeT += dt;
    if (this.shakeAmp > .0005) { const a = this.shakeAmp; cam.position.x += noise1(this.shakeT * 3.1, 1) * a; cam.position.y += noise1(this.shakeT * 3.7, 2) * a; cam.position.z += noise1(this.shakeT * 2.9, 3) * a * .5; }
    cam.lookAt(this.cl); if (Math.abs(cam.fov - fov) > .01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
  }
  /* مستطيل عنصر DOM بإحداثيات الطبقة */
  rectOf(el) { if (!el || !el.isConnected) return null; const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null; return { x: r.left - this.ox, y: r.top - this.oy, w: r.width, h: r.height }; }
  /* وضعية تجعل البطاقة (أركانها ±.5 × ±ar/2) تُسقَط على المستطيل تماماً، على عمق D أمام الكاميرا */
  poseForRect(rect, D, ar, pos, quat, scale) {
    const cam = this.stage.camera, v = this._pv || (this._pv = new Vector3()), f = this._pf || (this._pf = new Vector3());
    const nx = ((rect.x + rect.w / 2) / this.W) * 2 - 1, ny = -(((rect.y + rect.h / 2) / this.H) * 2 - 1);
    v.set(nx, ny, .5).unproject(cam).sub(cam.position).normalize(); f.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const t = D / Math.max(1e-4, v.dot(f)); pos.copy(cam.position).addScaledVector(v, t);
    const wpp = 2 * D * Math.tan(cam.fov * Math.PI / 360) / cam.zoom / this.H;
    quat.copy(cam.quaternion); scale.set(rect.w * wpp, rect.h * wpp / ar, rect.w * wpp);
  }
  /* الأهداف (بطاقات الواجهة الحقيقية) من الجسر: { key: Element } — تُقاس عند الطلب وتُخزَّن لإطارات قليلة */
  targetRect(key) {
    if (!this.hooks.targets) return null; const now = performance.now();
    if (!this._tg || now - this._tgAt > 250) { let m = null; try { m = this.hooks.targets(); } catch (e) {} this._tg = {}; this._tgAt = now; if (m) Object.keys(m).forEach(k => { this._tg[k] = { el: m[k], r: this.rectOf(m[k]) }; }); }
    const x = this._tg[key]; return x ? x.r : null;
  }
  seek(t) { if (this.dead) return; const step = 1 / 30; let k = 0; while (this.tl.t < t - 1e-6 && k++ < 4000) { this.tl.update(step); if (this.onFrame) this.onFrame(step, this.tl.t); this.updateCamera(step); this.stage.tick(step, this.tl.t); } this.stage.render(); if (this.post) this.post(); }
  fail(why) { if (this.dead || this.handed) return; this.failed = why; this.handoff(true); }
  skip() { if (this.dead || this.handed) return; this.silent = true; try { if (this.hooks.stopSfx) this.hooks.stopSfx(); } catch (e) {} try { this.tl.finish(); if (this.onFrame) this.onFrame(0, this.tl.t); } catch (e) {} this.silent = false; this.sfx('chest.skip'); this.handoff(true); }
  /* التسليم: يرسم الواجهة النهائية تحتنا؛ إن وُجدت بطاقات حقيقية مطابقة تطير إليها، وإلا تلاشٍ */
  handoff(fast) {
    if (this.handed || this.dead) return; this.handed = true;
    try { if (this.hooks.onReveal) this.hooks.onReveal(this.failed || ''); } catch (e) { try { console.warn('CodisBox3D reveal', e); } catch (x) {} }
    let items = [];
    if (!this.failed && this.landables.length && this.hooks.targets) {
      this._tg = null; let m = null; try { m = this.hooks.targets(); } catch (e) {}
      if (m) this.landables.forEach(L => { const el = m[L.key]; const r = this.rectOf(el); if (r && L.obj && L.obj.visible && L.dom) items.push({ L, el, r }); });
    }
    if (!items.length) { this.fadeOut(fast); return; }
    const dur = fast ? .36 : .62, cam = this.stage.camera, tmp = new Vector3();
    items.forEach(it => { tmp.copy(it.L.obj.position).applyMatrix4(cam.matrixWorldInverse); it.D = Math.max(.6, -tmp.z); it.vis = it.el.style.visibility; it.el.style.visibility = 'hidden'; it.p = new Vector3(); it.q = new Quaternion(); it.s = new Vector3(); });
    this.landing = { t: 0, dur, items };
    this.landables.forEach(L => { if (!items.some(i => i.L === L) && L.dom) { L.dom.wrap.style.transition = 'opacity 200ms'; L.dom.wrap.style.opacity = '0'; } });
    const fadeMs = Math.round(dur * 1000 * .9), delay = Math.round(dur * 1000 * .1);
    [this.stage.canvas, this.vigEl, this.flashEl].forEach(e => { e.style.transition = `opacity ${fadeMs}ms ease ${delay}ms`; e.style.opacity = '0'; });
    this.root.style.transition = `background-color ${fadeMs}ms ease ${delay}ms`; this.root.style.backgroundColor = 'transparent'; this.blackEl.style.opacity = '0';
    this.root.style.pointerEvents = 'none';
  }
  landStep(dt) {
    const L = this.landing; L.t += dt; const k = clamp(L.t / L.dur), e = E.outq ? E.outq(k) : k;
    L.items.forEach(it => { const o = it.L.obj; this.poseForRect(it.r, it.D, it.L.ar || 1.25, it.p, it.q, it.s); o.position.lerp(it.p, e); o.quaternion.slerp(it.q, e); o.scale.lerp(it.s, e); o.updateMatrixWorld(true); if (it.L.onLand) it.L.onLand(e); });
    if (k >= 1 && !L.done) {
      L.done = true; L.items.forEach(it => { it.el.style.visibility = it.vis || ''; }); this.sfx('chest.place', { n: L.items.length });
      L.items.forEach(it => { const w = it.L.dom.wrap; w.style.transition = 'opacity 140ms ease'; w.style.opacity = '0'; });
      this.fadeT = setTimeout(() => this.dispose('done'), 170);
    }
  }
  fadeOut(fast) {
    const ms = fast ? 220 : 480; this.root.style.pointerEvents = 'none';
    this.blackEl.style.transition = 'opacity ' + ms + 'ms ease-in'; this.blackEl.style.opacity = '1';
    this.root.style.transition = 'opacity ' + ms + 'ms ease-in ' + Math.round(ms * .4) + 'ms'; this.root.style.opacity = '0';
    this.fadeT = setTimeout(() => this.dispose('done'), ms * 1.4 + 60);
  }
  abort() { this.dispose('abort'); }
  dispose(why) {
    if (this.dead) return; this.dead = true; cancelAnimationFrame(this.raf); clearTimeout(this.fadeT); clearTimeout(this.tapT);
    if (this.landing && !this.landing.done) this.landing.items.forEach(it => { try { it.el.style.visibility = it.vis || ''; } catch (e) {} });
    if (why === 'abort') { try { if (this.hooks.stopSfx) this.hooks.stopSfx(); } catch (e) {} }
    try { this.root.removeEventListener('pointerdown', this.onDown); window.removeEventListener('keydown', this.onKey, true); document.removeEventListener('visibilitychange', this.onVis); if (this.ro) this.ro.disconnect(); if (this.onWin) window.removeEventListener('resize', this.onWin); this.stage.canvas.removeEventListener('webglcontextlost', this.onLost); } catch (e) {}
    try { (this.extra || []).forEach(f => f()); } catch (e) {}
    try { if (this.dom) this.dom.dispose(); } catch (e) {}
    try { if (this.stage) this.stage.dispose(); } catch (e) {}
    try { if (this.root.parentNode) this.root.parentNode.removeChild(this.root); } catch (e) {}
    try { this.inert.forEach(el => { el.inert = false; }); document.documentElement.style.overflow = this.prevOverflow || ''; } catch (e) {}
    this.landables = []; this._tg = null;
    try { if (this.hooks.onDispose) this.hooks.onDispose(why); } catch (e) {}
  }
}
