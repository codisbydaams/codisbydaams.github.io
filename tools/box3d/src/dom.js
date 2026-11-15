/* CODIS-BOX3D v2 — بطاقات DOM حقيقية: الكرت في المشهد هو نفس ترميز بطاقة الجائزة الفعلية، يُسقَط عليه تحويل منظوري (homography → matrix3d)
   من أركان مستوى البطاقة ثلاثي الأبعاد عبر الكاميرا نفسها.
   • الحجم الطبيعي: يُقاس عنصر البطاقة الحقيقي داخل الوجه (لا الحاوية) فتطابق أبعاده ونسبته البطاقة بالواجهة النهائية ⇒ هبوط بلا قفزة.
   • الحدّة: المحتوى يُرسم مكبّراً K مرة داخل الطبقة (تحويل ثنائي الأبعاد داخل طبقة مركّبة = رسم متجهي بدقة أعلى) ثم يصغّره الإسقاط ⇒ لا ضبابية على شاشات 2x/3x.
     بلا will-change: Chrome كان يثبّت دقة أول إطار (البطاقة تبدأ صغيرة) فتبقى ضبابية حين تكبر.
   • لمعة سطحية تتحرك مع دوران البطاقة بالنسبة للكاميرا + ظهر عام حين تدير ظهرها + قصّ بحافة الصندوق الأمامية وهي داخله. */
import { Vector3 } from 'three';

const BACK = '<svg viewBox="0 0 300 375" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true"><rect width="300" height="375" rx="16" fill="#16120d"/><g stroke="rgba(255,214,140,.14)" stroke-width="2">' +
  Array.from({ length: 16 }, (_, i) => `<path d="M${i * 40 - 300} 0L${i * 40 + 75} 375M${i * 40 - 300} 375L${i * 40 + 75} 0"/>`).join('') + '</g><rect x="10" y="10" width="280" height="355" rx="12" fill="none" stroke="#d9a441" stroke-width="6"/>' +
  '<circle cx="150" cy="187" r="62" fill="#0c0d10" stroke="#d9a441" stroke-width="5"/><path d="M178 160H138q-17 0-17 17v12q0 17 17 17h40" fill="none" stroke="#f4f6f8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><rect x="146" y="176" width="14" height="14" fill="#38e1e6"/></svg>';

function quadMatrix(p, w, h) {
  const x0 = p[0].x, y0 = p[0].y, x1 = p[1].x, y1 = p[1].y, x2 = p[2].x, y2 = p[2].y, x3 = p[3].x, y3 = p[3].y;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, c, d, e, f, g, hh;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) { a = x1 - x0; b = x3 - x0; c = x0; d = y1 - y0; e = y3 - y0; f = y0; g = hh = 0; }
  else {
    const den = dx1 * dy2 - dx2 * dy1; if (Math.abs(den) < 1e-9) return null;
    g = (dx3 * dy2 - dx2 * dy3) / den; hh = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1; b = x3 - x0 + hh * x3; c = x0; d = y1 - y0 + g * y1; e = y3 - y0 + hh * y3; f = y0;
  }
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${c},${f},0,1)`;
}

export class DomCards {
  constructor(root, beforeEl, hooks) {
    this.root = root; this.hooks = hooks || {}; this.items = [];
    const l = this.layer = document.createElement('div'); l.className = 'b3d-cards'; root.insertBefore(l, beforeEl || null);
    this.v = [new Vector3(), new Vector3(), new Vector3(), new Vector3()]; this.t = new Vector3(); this.n = new Vector3(); this.c = new Vector3();
    this.pts = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    this.K = Math.min(3, Math.max(1.5, (window.devicePixelRatio || 1) * .9));
  }
  /* face = { html, tone, sel } — html نفس ترميز بطاقة الجائزة؛ sel يحدد عنصر البطاقة الحقيقي داخله (للقياس والمطابقة) */
  add(face, opts) {
    const K = (opts && opts.K) || this.K;
    const wrap = document.createElement('div'); wrap.className = 'b3d-cw';
    const card = document.createElement('div'); card.className = 'b3d-card';
    const sc = document.createElement('div'); sc.className = 'b3d-sc';
    const front = document.createElement('div'); front.className = 'b3d-front rwc-' + (face.tone || 'C'); front.setAttribute('data-tone', face.tone || 'C'); front.innerHTML = face.html;
    const back = document.createElement('div'); back.className = 'b3d-back'; back.innerHTML = BACK; back.style.display = 'none';
    const glare = document.createElement('div'); glare.className = 'b3d-glare';
    sc.appendChild(front); card.appendChild(sc); card.appendChild(back); card.appendChild(glare); wrap.appendChild(card); this.layer.appendChild(wrap);
    try { if (this.hooks.fit) this.hooks.fit(front); } catch (e) {}
    /* قياس عنصر البطاقة الحقيقي: الحاوية مرئية بلا تحويل لحظة القياس */
    card.style.display = 'block'; card.style.visibility = 'hidden'; card.style.transform = 'none';
    let w0 = 300, h0 = 375, ox = 0, oy = 0;
    try {
      const fr = front.getBoundingClientRect(), el = (face.sel && front.querySelector(face.sel)) || front.querySelector('.bx-reveal > *') || front.firstElementChild;
      if (el) { const r = el.getBoundingClientRect(); if (r.width > 20 && r.height > 20) { w0 = r.width; h0 = r.height; ox = r.left - fr.left; oy = r.top - fr.top; } }
    } catch (e) {}
    card.style.display = 'none'; card.style.visibility = '';
    const W = Math.round(w0 * K), H = Math.round(h0 * K);
    card.style.width = W + 'px'; card.style.height = H + 'px'; sc.style.transform = `scale(${K}) translate(${-ox}px,${-oy}px)`;
    back.style.width = W + 'px'; back.style.height = H + 'px';
    const it = { wrap, card, front, back, glare, shown: false, flip: false, W, H, ar: h0 / w0, w0, h0 }; this.items.push(it); return it;
  }
  hide(it) { if (it.shown) { it.card.style.display = 'none'; it.shown = false; } }
  /* obj: مجموعة البطاقة (أركانها ±.5 × ±ar/2) · clip: {a,b} حافة الصندوق الأمامية بالعالم أو null · glare: شدة اللمعة 0..1 */
  place(it, obj, cam, W, H, clip, opacity, glare) {
    obj.updateMatrixWorld(true); const v = this.v, p = this.pts, hy = it.ar / 2;
    v[0].set(-.5, hy, 0); v[1].set(.5, hy, 0); v[2].set(.5, -hy, 0); v[3].set(-.5, -hy, 0);
    let ok = true;
    for (let i = 0; i < 4; i++) {
      v[i].applyMatrix4(obj.matrixWorld); this.t.copy(v[i]).applyMatrix4(cam.matrixWorldInverse); if (this.t.z > -cam.near * 1.5) ok = false;
      v[i].project(cam); p[i].x = (v[i].x * .5 + .5) * W; p[i].y = (-v[i].y * .5 + .5) * H;
    }
    if (!ok || !obj.visible) { this.hide(it); return; }
    const signed = (p[0].x * p[1].y - p[1].x * p[0].y) + (p[1].x * p[2].y - p[2].x * p[1].y) + (p[2].x * p[3].y - p[3].x * p[2].y) + (p[3].x * p[0].y - p[0].x * p[3].y);
    const back = signed < 0, q = back ? [p[1], p[0], p[3], p[2]] : p;
    const m = quadMatrix(q, it.W, it.H); if (!m) { this.hide(it); return; }
    if (!it.shown) { it.card.style.display = 'block'; it.shown = true; }
    it.card.style.transform = m;
    if (back !== it.flip) { it.flip = back; it.front.parentNode.style.display = back ? 'none' : ''; it.back.style.display = back ? '' : 'none'; }
    it.card.style.opacity = opacity == null ? '1' : String(opacity);
    /* لمعة: موضعها من ميل البطاقة الأفقي بالنسبة لاتجاه الكاميرا */
    this.n.set(1, 0, 0).transformDirection(obj.matrixWorld); this.c.setFromMatrixPosition(obj.matrixWorld); this.t.copy(cam.position).sub(this.c).normalize();
    const s = this.n.dot(this.t), gx = (50 - s * 160).toFixed(1), ga = Math.max(0, (glare == null ? .5 : glare) * (1 - Math.abs(s) * 1.2));
    if (it.gx !== gx) { it.gx = gx; it.glare.style.backgroundPosition = gx + '% 0'; } const gs = ga.toFixed(2); if (it.ga !== gs) { it.ga = gs; it.glare.style.opacity = gs; }
    let cp = 'none';
    if (clip) {
      const a = this.t.copy(clip.a).project(cam), ax = (a.x * .5 + .5) * W, ay = (-a.y * .5 + .5) * H; const b = this.c.copy(clip.b).project(cam), bx = (b.x * .5 + .5) * W, by = (-b.y * .5 + .5) * H;
      if (Math.abs(bx - ax) > 1) {
        const m2 = (by - ay) / (bx - ax), yAt = x => ay + m2 * (x - ax); let below = false;
        for (let i = 0; i < 4; i++) if (p[i].y > yAt(p[i].x) - 1) below = true;
        if (below) cp = `polygon(-3000px ${yAt(-3000).toFixed(1)}px, ${W + 3000}px ${yAt(W + 3000).toFixed(1)}px, ${W + 3000}px -3000px, -3000px -3000px)`;
      }
    }
    if (it.cp !== cp) { it.cp = cp; it.wrap.style.clipPath = cp; it.wrap.style.webkitClipPath = cp; }
    it.quad = [{ x: p[0].x, y: p[0].y }, { x: p[1].x, y: p[1].y }, { x: p[2].x, y: p[2].y }, { x: p[3].x, y: p[3].y }];
  }
  dispose() { try { this.items.forEach(it => it.wrap.remove()); this.layer.remove(); } catch (e) {} this.items = []; }
}
