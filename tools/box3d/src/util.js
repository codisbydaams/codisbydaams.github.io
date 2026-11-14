/* CODIS-BOX3D — أدوات مشتركة: تسهيلات، عشوائي حتمي، مخطط زمني، منحنيات كاميرا */
import { Vector3, MathUtils } from 'three';
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const E = {
  lin: t => t,
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
  io: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  ioq: t => (t < .5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2),
  outq: t => 1 - Math.pow(1 - t, 5),
  back: t => { const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  soft: t => t * t * (3 - 2 * t),
};
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }
export function noise1(t, k = 0) { return Math.sin(t * 12.9898 + k * 78.233) * .5 + Math.sin(t * 7.13 + k * 3.7) * .3 + Math.sin(t * 23.7 + k * 1.3) * .2; }
/* مخطط زمني: tw(t0,dur,fn,ease) تُقيَّم بقيم مطلقة (لا تراكم) + cue(t,fn) مرة واحدة */
export class Timeline {
  constructor() { this.items = []; this.cues = []; this.t = 0; this.ci = 0; this.speed = 1; this.end = 0; }
  tw(t0, dur, fn, ease = E.io) { this.items.push({ t0, dur: Math.max(1e-4, dur), fn, ease, done: false }); this.end = Math.max(this.end, t0 + dur); return this; }
  cue(t, fn) { this.cues.push({ t, fn }); this.cues.sort((a, b) => a.t - b.t); this.end = Math.max(this.end, t); return this; }
  update(dt) {
    this.t += dt * this.speed;
    for (const it of this.items) {
      if (it.done || this.t < it.t0) continue;
      const p = clamp((this.t - it.t0) / it.dur);
      it.fn(it.ease(p), p);
      if (p >= 1) it.done = true;
    }
    while (this.ci < this.cues.length && this.cues[this.ci].t <= this.t) { const c = this.cues[this.ci++]; c.fn(); }
  }
  /* قفزة للنهاية (التخطّي): كل العناصر بقيمها النهائية ثم الإشارات المتبقية */
  finish() { for (const it of this.items) if (!it.done) { try { it.fn(it.ease(1), 1); } catch (e) {} it.done = true; } while (this.ci < this.cues.length) { const c = this.cues[this.ci++]; try { c.fn(); } catch (e) {} } this.t = this.end; }
  get done() { return this.t >= this.end && this.ci >= this.cues.length; }
}
/* مسار كاميرا بمفاتيح: key(t, pos, look, fov, ease) مع استيفاء بين كل مفتاحين */
export class CamTrack {
  constructor() { this.k = []; }
  key(t, p, l, f = 34, e = E.io) { this.k.push({ t, p: new Vector3(p[0], p[1], p[2]), l: new Vector3(l[0], l[1], l[2]), f, e }); this.k.sort((a, b) => a.t - b.t); return this; }
  eval(t, outP, outL) {
    const k = this.k; if (!k.length) return 34;
    if (t <= k[0].t) { outP.copy(k[0].p); outL.copy(k[0].l); return k[0].f; }
    for (let i = 1; i < k.length; i++) {
      if (t <= k[i].t) { const a = k[i - 1], b = k[i], u = b.e(clamp((t - a.t) / Math.max(1e-4, b.t - a.t))); outP.lerpVectors(a.p, b.p, u); outL.lerpVectors(a.l, b.l, u); return lerp(a.f, b.f, u); }
    }
    const z = k[k.length - 1]; outP.copy(z.p); outL.copy(z.l); return z.f;
  }
}
export const rad = MathUtils.degToRad;
