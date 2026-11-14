/* CODIS-BOX3D — خامات مولَّدة بالكود (Canvas صغير): ورق/كرتون/جلد/حجر/معدن/شعار. لا ملفات صور. */
import { CanvasTexture, SRGBColorSpace, RepeatWrapping, LinearMipmapLinearFilter, LinearFilter } from 'three';
import { rng } from './util.js';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export function tex(c, rep, srgb = true) {
  const t = new CanvasTexture(c); if (srgb) t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4; t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter; t.generateMipmaps = true; return t;
}
/* حبيبات ورقية: لون أساس + ألياف + بقع تعتيق + شقوق اختيارية */
export function grainCanvas(base, o = {}) {
  const S = o.size || 256, c = cv(S, S), x = c.getContext('2d'), R = rng(o.seed || 7);
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  const im = x.getImageData(0, 0, S, S), d = im.data, amp = o.amp == null ? 16 : o.amp;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * amp; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(im, 0, 0);
  const fib = o.fibers == null ? 140 : o.fibers; x.lineWidth = 1;
  for (let i = 0; i < fib; i++) { const px = R() * S, py = R() * S, a = R() * 6.28, l = 4 + R() * 14; x.strokeStyle = R() > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)'; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  for (let i = 0; i < (o.stains == null ? 8 : o.stains); i++) { const cx = R() * S, cy = R() * S, g = x.createRadialGradient(cx, cy, 0, cx, cy, 30 + R() * 50); g.addColorStop(0, 'rgba(40,24,8,.11)'); g.addColorStop(1, 'rgba(40,24,8,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); }
  if (o.cracks) { x.strokeStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < o.cracks; i++) { let px = R() * S, py = R() * S; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (R() - .5) * 40; py += (R() - .5) * 40; x.lineTo(px, py); } x.stroke(); } }
  return c;
}
export function brushedCanvas(base, hi) {
  const S = 256, c = cv(S, S), x = c.getContext('2d'), R = rng(11);
  const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, base); g.addColorStop(.5, hi); g.addColorStop(1, base); x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) { const y = R() * S; x.strokeStyle = R() > .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)'; x.beginPath(); x.moveTo(0, y); x.lineTo(S, y + (R() - .5) * 3); x.stroke(); }
  return c;
}
/* شعار CODIS: C مفتوحة بيضاء + مربع سماوي على قرص داكن */
export function emblemCanvas(bg = '#0c0d10', fg = '#f4f6f8', acc = '#38e1e6') {
  const S = 256, c = cv(S, S), x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, S, S);
  x.strokeStyle = fg; x.lineWidth = 26; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(178, 92); x.lineTo(112, 92); x.quadraticCurveTo(84, 92, 84, 120); x.lineTo(84, 136); x.quadraticCurveTo(84, 164, 112, 164); x.lineTo(178, 164); x.stroke();
  x.beginPath(); x.moveTo(178, 92); x.lineTo(178, 104); x.moveTo(178, 164); x.lineTo(178, 152); x.stroke();
  x.fillStyle = acc; x.fillRect(122, 116, 24, 24);
  return c;
}
export function glowCanvas(S = 128) { const c = cv(S, S), x = c.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); return c; }
export function shaftCanvas() { const W = 64, H = 256, c = cv(W, H), x = c.getContext('2d'); const gy = x.createLinearGradient(0, H, 0, 0); gy.addColorStop(0, 'rgba(255,255,255,.95)'); gy.addColorStop(.5, 'rgba(255,255,255,.35)'); gy.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gy; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'destination-in'; const gx = x.createLinearGradient(0, 0, W, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.5, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gx; x.fillRect(0, 0, W, H); return c; }
export function raysCanvas() { const S = 256, c = cv(S, S), x = c.getContext('2d'); x.translate(S / 2, S / 2); for (let i = 0; i < 16; i++) { x.rotate(Math.PI / 8); const g = x.createLinearGradient(0, 0, S / 2, 0); g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(S / 2, -5 - (i % 2) * 6); x.lineTo(S / 2, 5 + (i % 2) * 6); x.closePath(); x.fill(); } return c; }
export function shadowCanvas() { const S = 128, c = cv(S, S), x = c.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(.55, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); return c; }
export function gradientBg(top, mid, bot) { const c = cv(8, 256), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, 8, 256); return c; }
/* طبقة مسرح ورقي بقصّ شفاف: أقواس / تلال / نجوم */
export function paperLayerCanvas(fill, kind, seed) {
  const W = 512, H = 256, c = cv(W, H), x = c.getContext('2d'), R = rng(seed || 3);
  x.fillStyle = fill; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  if (kind === 'arches') { for (let i = 0; i < 5; i++) { const cx = 50 + i * 103, w = 56; x.beginPath(); x.moveTo(cx - w / 2, H); x.lineTo(cx - w / 2, 120); x.arc(cx, 120, w / 2, Math.PI, 0); x.lineTo(cx + w / 2, H); x.closePath(); x.fill(); } }
  else if (kind === 'hills') { x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W, 90); for (let i = W; i >= 0; i -= 16) x.lineTo(i, 90 + Math.sin(i * .02 + seed) * 24 + R() * 6); x.closePath(); x.fill(); }
  else { for (let i = 0; i < 14; i++) { const cx = R() * W, cy = 14 + R() * 110, r = 4 + R() * 7; x.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? r * .45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); } }
  x.globalCompositeOperation = 'source-over';
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  return c;
}
export { cv };
