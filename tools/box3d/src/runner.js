/* CODIS-BOX3D — مشغّل المشهد المشترك: طبقة ملء الشاشة + Renderer واحد + حلقة rAF + كاميرا بمسار + تنظيف كامل.
   يُستعمل لمشهد الصندوق الواحد ومشهد ×10 (سيناريوهان مستقلان فوق نفس الأساس). */
import { Vector3 } from 'three';
import { Stage, quality } from './stage.js';
import { Timeline, CamTrack, noise1, clamp } from './util.js';
import { DomCards } from './dom.js';

export const REG = { last: null };
export class Runner {
  constructor(o) {
    REG.last = this; this.o = o; this.hooks = o.hooks || {}; this.dead = false; this.handed = false; this.raf = 0; this.last = 0; this.shakeAmp = 0; this.shakeT = 0; this.fitMul = 1;
    const root = this.root = document.createElement('div'); root.className = 'b3d-root'; root.setAttribute('aria-hidden', 'true'); root.setAttribute('role', 'presentation');
    root.innerHTML = '<div class="b3d-vig"></div><div class="b3d-flash"></div><div class="b3d-black"></div>';
    (o.host || document.body).appendChild(root);
    this.flashEl = root.querySelector('.b3d-flash'); this.blackEl = root.querySelector('.b3d-black'); this.vigEl = root.querySelector('.b3d-vig');
    const r = root.getBoundingClientRect(); this.W = Math.max(2, Math.round(r.width)); this.H = Math.max(2, Math.round(r.height));
    this.q = quality(!!o.low); if (o.preserve) this.q.preserve = true;
    try { this.stage = new Stage({ host: root, q: this.q, theme: o.theme, w: this.W, h: this.H, hooks: this.hooks }); } catch (e) { this.dead = false; this.stage = null; try { root.remove(); } catch (x) {} this.dead = true; throw e; }
    root.insertBefore(this.stage.canvas, root.firstChild);
    this.dom = new DomCards(root, this.vigEl, this.hooks); this.post = null;
    this.tl = new Timeline(); this.track = new CamTrack(); this.cp = new Vector3(); this.cl = new Vector3(); this.extra = [];
    this.onLost = e => { try { e.preventDefault(); } catch (x) {} this.fail('contextlost'); };
    this.stage.canvas.addEventListener('webglcontextlost', this.onLost);
    this.ro = null; try { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); } catch (e) { this.onWin = () => this.resize(); window.addEventListener('resize', this.onWin); }
    this.onVis = () => { this.last = 0; }; document.addEventListener('visibilitychange', this.onVis);
    /* تخطٍّ خفي بلا أي زر مرئي: نقرتان سريعتان على المشهد أو Esc */
    this.lastTap = 0;
    this.onDown = e => { const n = performance.now(); if (n - this.lastTap < 380) { this.lastTap = 0; this.skip(); } else this.lastTap = n; e.preventDefault(); };
    root.addEventListener('pointerdown', this.onDown);
    this.onKey = e => { if (e.key === 'Escape') { try { e.stopPropagation(); e.preventDefault(); } catch (x) {} this.skip(); } };
    window.addEventListener('keydown', this.onKey, true);
    this.inert = [];
    try { const list = (o.host && o.host !== document.body) ? [document.body] : Array.prototype.slice.call(document.body.children).filter(el => el !== root && el.tagName !== 'SCRIPT'); list.forEach(el => { if (!el.inert) { el.inert = true; this.inert.push(el); } }); } catch (e) {}
    this.prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
  }
  resize() {
    if (this.dead) return; const r = this.root.getBoundingClientRect(); const w = Math.round(r.width), h = Math.round(r.height);
    if (w < 2 || h < 2 || (w === this.W && h === this.H)) return; this.W = w; this.H = h; this.stage.size(w, h); if (this.onResize) try { this.onResize(w, h); } catch (e) {}
  }
  get aspect() { return this.W / this.H; }
  start() { this.last = 0; this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame); }
  shake(a) { this.shakeAmp = Math.max(this.shakeAmp, a); }
  flash(a, ms) { const e = this.flashEl; if (!e) return; e.style.transition = 'none'; e.style.opacity = String(a); void e.offsetWidth; e.style.transition = 'opacity ' + (ms || 500) + 'ms ease-out'; e.style.opacity = '0'; }
  frame(ts) {
    if (this.dead) return; this.raf = requestAnimationFrame(this.frame);
    if (document.hidden) { this.last = 0; return; }
    const dt = this.last ? clamp((ts - this.last) / 1000, 0, .05) : 0; this.last = ts;
    try {
      if (!this.handed || this.fading) this.tl.update(dt);
      if (this.onFrame) this.onFrame(dt, this.tl.t);
      this.updateCamera(dt);
      this.stage.tick(dt, this.tl.t + (this.tAbs = (this.tAbs || 0) + dt));
      this.stage.render(); if (this.post) this.post();
      this.frames = (this.frames || 0) + 1; if (this.frames === 1 && this.hooks.onFirstFrame) this.hooks.onFirstFrame();
    } catch (e) { try { console.warn('CodisBox3D', e); } catch (x) {} this.fail('error'); }
  }
  updateCamera(dt) {
    const cam = this.stage.camera, fov = this.track.eval(this.tl.t, this.cp, this.cl);
    const fit = this.fitMul = Math.max(1, .85 / this.aspect);
    cam.position.copy(this.cl).addScaledVector(this.cp.clone().sub(this.cl), fit);
    this.shakeAmp *= Math.exp(-dt * 5); this.shakeT += dt;
    if (this.shakeAmp > .0005) { const a = this.shakeAmp; cam.position.x += noise1(this.shakeT * 3.1, 1) * a; cam.position.y += noise1(this.shakeT * 3.7, 2) * a; cam.position.z += noise1(this.shakeT * 2.9, 3) * a * .5; }
    cam.lookAt(this.cl); if (Math.abs(cam.fov - fov) > .01) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }
  seek(t) { if (this.dead) return; const step = 1 / 30; let k = 0; while (this.tl.t < t - 1e-6 && k++ < 4000) { this.tl.update(step); if (this.onFrame) this.onFrame(step, this.tl.t); this.updateCamera(step); this.stage.tick(step, this.tl.t); } this.stage.render(); if (this.post) this.post(); }
  fail(why) { if (this.dead || this.handed) return; this.failed = why; this.handoff(true); }
  skip() { if (this.dead || this.handed) return; try { this.tl.finish(); } catch (e) {} this.handoff(true); }
  /* تسليم: يُظهر الواجهة النهائية تحتنا ثم نخفت الطبقة ونُنظّف */
  handoff(fast) {
    if (this.handed || this.dead) return; this.handed = true;
    try { if (this.hooks.onReveal) this.hooks.onReveal(this.failed || ''); } catch (e) { try { console.warn('CodisBox3D reveal', e); } catch (x) {} }
    const ms = fast ? 220 : 520; this.fading = true;
    this.blackEl.style.transition = 'opacity ' + ms + 'ms ease-in'; this.blackEl.style.opacity = '1';
    this.root.style.transition = 'opacity ' + ms + 'ms ease-in'; this.root.style.opacity = '0';
    this.fadeT = setTimeout(() => this.dispose('done'), ms + 60);
  }
  /* إنهاء من الخارج (إغلاق/فتح آخر): بلا تسليم */
  abort() { this.dispose('abort'); }
  dispose(why) {
    if (this.dead) return; this.dead = true; cancelAnimationFrame(this.raf); clearTimeout(this.fadeT);
    try { this.root.removeEventListener('pointerdown', this.onDown); window.removeEventListener('keydown', this.onKey, true); document.removeEventListener('visibilitychange', this.onVis); if (this.ro) this.ro.disconnect(); if (this.onWin) window.removeEventListener('resize', this.onWin); this.stage.canvas.removeEventListener('webglcontextlost', this.onLost); } catch (e) {}
    try { (this.extra || []).forEach(f => f()); } catch (e) {}
    try { if (this.dom) this.dom.dispose(); } catch (e) {}
    try { if (this.stage) this.stage.dispose(); } catch (e) {}
    try { if (this.root.parentNode) this.root.parentNode.removeChild(this.root); } catch (e) {}
    try { this.inert.forEach(el => { el.inert = false; }); document.documentElement.style.overflow = this.prevOverflow || ''; } catch (e) {}
    try { if (this.hooks.onDispose) this.hooks.onDispose(why); } catch (e) {}
  }
}
