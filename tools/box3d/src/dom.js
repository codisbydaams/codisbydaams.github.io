/* CODIS-BOX3D — بطاقات DOM حقيقية: الكرت الذي يظهر بالمشهد هو نفس بطاقة الجائزة الفعلية (نفس HTML/الصورة/الإطار/الخط) لا رسماً بديلاً.
   كل بطاقة عنصر DOM يُسقَط عليه تحويل منظوري (homography → matrix3d) من أركان مستوى البطاقة ثلاثي الأبعاد عبر الكاميرا نفسها، فيتحرك ويدور ويتصغّر بدقة منظور المشهد.
   ظهر عام يظهر حين تدير البطاقة ظهرها للكاميرا. قصّ بخط حافة الصندوق الأمامية يجعلها تخرج من داخله (الجدار الأمامي يحجب الجزء السفلي). */
import { Vector3 } from 'three';

const CW = 300, CH = 375;
const BACK = '<svg viewBox="0 0 300 375" width="100%" height="100%" aria-hidden="true"><rect width="300" height="375" rx="22" fill="#16120d"/><g stroke="rgba(255,214,140,.14)" stroke-width="2">' +
  Array.from({ length: 16 }, (_, i) => `<path d="M${i * 40 - 300} 0L${i * 40 + 75} 375M${i * 40 - 300} 375L${i * 40 + 75} 0"/>`).join('') + '</g><rect x="10" y="10" width="280" height="355" rx="16" fill="none" stroke="#d9a441" stroke-width="6"/>' +
  '<circle cx="150" cy="187" r="62" fill="#0c0d10" stroke="#d9a441" stroke-width="5"/><path d="M178 160H138q-17 0-17 17v12q0 17 17 17h40" fill="none" stroke="#f4f6f8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><rect x="146" y="176" width="14" height="14" fill="#38e1e6"/></svg>';

/* مربع الوحدة → رباعي: (a,b,c,d,e,f,g,h) ثم matrix3d مقسوماً على أبعاد العنصر */
function quadMatrix(p, w, h) {
  const x0 = p[0].x, y0 = p[0].y, x1 = p[1].x, y1 = p[1].y, x2 = p[2].x, y2 = p[2].y, x3 = p[3].x, y3 = p[3].y;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, c, d, e, f, g, hh;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) { a = x1 - x0; b = x2 - x1; c = x0; d = y1 - y0; e = y2 - y1; f = y0; g = hh = 0; }
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
    this.v = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    this.pts = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]; this.t = new Vector3();
  }
  /* face = { html, tone } — html هو نفس ترميز بطاقة الجائزة الفعلية */
  add(face) {
    const wrap = document.createElement('div'); wrap.className = 'b3d-cw';
    const card = document.createElement('div'); card.className = 'b3d-card';
    const front = document.createElement('div'); front.className = 'b3d-front rwc-' + (face.tone || 'C'); front.setAttribute('data-tone', face.tone || 'C'); front.innerHTML = face.html;
    const back = document.createElement('div'); back.className = 'b3d-back'; back.innerHTML = BACK; back.style.display = 'none';
    card.appendChild(front); card.appendChild(back); wrap.appendChild(card); this.layer.appendChild(wrap);
    try { if (this.hooks.fit) this.hooks.fit(front); } catch (e) {}
    const it = { wrap, card, front, back, shown: false, flip: false }; this.items.push(it); return it;
  }
  hide(it) { if (it.shown) { it.card.style.display = 'none'; it.shown = false; } }
  /* place: obj = مجموعة البطاقة (أركانها ±.5 × ±.625) ؛ clip = {a:Vector3,b:Vector3} نقطتا حافة الصندوق بالعالم أو null */
  place(it, obj, cam, W, H, clip, opacity) {
    obj.updateMatrixWorld(true); cam.updateMatrixWorld(); const v = this.v, p = this.pts;
    v[0].set(-.5, .625, 0); v[1].set(.5, .625, 0); v[2].set(.5, -.625, 0); v[3].set(-.5, -.625, 0);
    let ok = true;
    for (let i = 0; i < 4; i++) {
      v[i].applyMatrix4(obj.matrixWorld); this.t.copy(v[i]).applyMatrix4(cam.matrixWorldInverse); if (this.t.z > -cam.near * 1.5) ok = false;
      v[i].project(cam); p[i].x = (v[i].x * .5 + .5) * W; p[i].y = (-v[i].y * .5 + .5) * H;
    }
    if (!ok || !obj.visible) { this.hide(it); return; }
    const area = (p[1].x - p[0].x) * (p[3].y - p[0].y) - (p[1].y - p[0].y) * (p[3].x - p[0].x) - 0;   /* إشارة اتجاه الرباعي على الشاشة */
    const signed = (p[0].x * p[1].y - p[1].x * p[0].y) + (p[1].x * p[2].y - p[2].x * p[1].y) + (p[2].x * p[3].y - p[3].x * p[2].y) + (p[3].x * p[0].y - p[0].x * p[3].y);
    const back = signed < 0;
    let q = p; if (back) q = [p[1], p[0], p[3], p[2]];
    const m = quadMatrix(q, CW, CH); if (!m) { this.hide(it); return; }
    if (!it.shown) { it.card.style.display = 'block'; it.shown = true; }
    it.card.style.transform = m; if (back !== it.flip) { it.flip = back; it.front.style.display = back ? 'none' : ''; it.back.style.display = back ? '' : 'none'; }
    it.card.style.opacity = opacity == null ? '1' : String(opacity);
    /* قصّ بحافة الصندوق الأمامية: الجزء تحت الخط محجوب */
    let cp = 'none';
    if (clip) {
      const a = this.t.copy(clip.a).project(cam), b = clip.b.clone().project(cam);
      const ax = (a.x * .5 + .5) * W, ay = (-a.y * .5 + .5) * H, bx = (b.x * .5 + .5) * W, by = (-b.y * .5 + .5) * H;
      if (Math.abs(bx - ax) > 1) {
        const m2 = (by - ay) / (bx - ax), yAt = x => ay + m2 * (x - ax); let below = false;
        for (let i = 0; i < 4; i++) if (p[i].y > yAt(p[i].x) - 1) below = true;
        if (below) cp = `polygon(-3000px ${yAt(-3000)}px, ${W + 3000}px ${yAt(W + 3000)}px, ${W + 3000}px -3000px, -3000px -3000px)`;
      }
    }
    if (it.cp !== cp) { it.cp = cp; it.wrap.style.clipPath = cp; it.wrap.style.webkitClipPath = cp; }
  }
  dispose() { try { this.items.forEach(it => it.wrap.remove()); this.layer.remove(); } catch (e) {} this.items = []; }
}
