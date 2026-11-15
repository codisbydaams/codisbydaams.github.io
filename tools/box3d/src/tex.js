/* CODIS-BOX3D — خامات مولَّدة بالكود (Canvas): خشب ألواح · جلد محبّب · حجر بعروق · ورنيش · معدن مصقول/مطروق · نقوش ذهبية · رونات مضيئة + خرائط نتوء (bump).
   لا ملفات صور. الدقة تتبع جودة الجهاز (q.texS) وتُولَّد مرة واحدة لكل مشهد ثم تُشارَك بين النسخ. */
import { CanvasTexture, SRGBColorSpace, NoColorSpace, RepeatWrapping, LinearMipmapLinearFilter, LinearFilter } from 'three';
import { rng } from './util.js';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let ANISO = 4;
export function setAniso(a) { ANISO = Math.max(1, a | 0); }
export function tex(c, rep, srgb = true) {
  const t = new CanvasTexture(c); t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]);
  t.anisotropy = ANISO; t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter; t.generateMipmaps = true; return t;
}
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgbS = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/* ضجيج قيمي ناعم (2 أوكتاف) على شبكة صغيرة ثم تكبير — رخيص وكافٍ للتعتيق */
function valueNoise(S, cells, seed) {
  const R = rng(seed), g = []; for (let i = 0; i < (cells + 1) * (cells + 1); i++) g.push(R());
  const c = cv(S, S), x = c.getContext('2d'), im = x.createImageData(S, S), d = im.data;
  for (let y = 0; y < S; y++) for (let X = 0; X < S; X++) {
    const fx = X / S * cells, fy = y / S * cells, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = g[iy * (cells + 1) + ix], b = g[iy * (cells + 1) + ix + 1], cc = g[(iy + 1) * (cells + 1) + ix], dd = g[(iy + 1) * (cells + 1) + ix + 1];
    const v = (a + (b - a) * sx) * (1 - sy) + (cc + (dd - cc) * sx) * sy, o = (y * S + X) * 4; d[o] = d[o + 1] = d[o + 2] = v * 255; d[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); return c;
}
function grain(x, S, R, amp) { const im = x.getImageData(0, 0, S, S), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * amp; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(im, 0, 0); }

/* ===== خشب ألواح: ألياف متموجة + عُقد + فواصل ألواح. out: {map, bump} ===== */
export function woodSet(S, base, o = {}) {
  const R = rng(o.seed || 3), planks = o.planks || 4, c = cv(S, S), x = c.getContext('2d'), b = cv(S, S), y = b.getContext('2d');
  const B = hexRgb(base), dark = mix(B, [0, 0, 0], .45), light = mix(B, [255, 236, 200], .18);
  y.fillStyle = '#808080'; y.fillRect(0, 0, S, S);
  const ph = S / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph, tint = .9 + R() * .2; x.fillStyle = rgbS(mix(B, light, (R() - .3) * .35).map(v => v * tint)); x.fillRect(0, y0, S, ph);
    /* ألياف: خطوط أفقية متموجة بعرض متغير */
    for (let k = 0; k < S * .5; k++) {
      const yy = y0 + R() * ph, amp = 1 + R() * 3, fr = .01 + R() * .02, ph0 = R() * 6, a = .05 + R() * .12, dk = R() > .45;
      x.strokeStyle = rgbS(dk ? dark : light, a); x.lineWidth = .6 + R() * 1.4; x.beginPath();
      for (let X = 0; X <= S; X += 8) { const yv = yy + Math.sin(X * fr + ph0) * amp; X ? x.lineTo(X, yv) : x.moveTo(X, yv); } x.stroke();
      if (dk) { y.strokeStyle = 'rgba(0,0,0,' + (a * .9) + ')'; y.lineWidth = x.lineWidth; y.beginPath(); for (let X = 0; X <= S; X += 8) { const yv = yy + Math.sin(X * fr + ph0) * amp; X ? y.lineTo(X, yv) : y.moveTo(X, yv); } y.stroke(); }
    }
    /* عقدة */
    if (R() > .35) { const kx = R() * S, ky = y0 + ph * (.3 + R() * .4), kr = ph * (.12 + R() * .1); for (let r = kr; r > 1; r -= 2.2) { x.strokeStyle = rgbS(dark, .18); x.lineWidth = 1.2; x.beginPath(); x.ellipse(kx, ky, r * 2.2, r, 0, 0, 6.283); x.stroke(); } y.fillStyle = 'rgba(0,0,0,.35)'; y.beginPath(); y.ellipse(kx, ky, kr * 1.3, kr * .6, 0, 0, 6.283); y.fill(); }
    /* فاصل اللوح: أخدود داكن + حافة مضيئة */
    x.fillStyle = rgbS(mix(dark, [0, 0, 0], .4), .85); x.fillRect(0, y0, S, Math.max(2, S / 256 * 3)); x.fillStyle = rgbS(light, .25); x.fillRect(0, y0 + Math.max(2, S / 256 * 3), S, 1);
    y.fillStyle = '#000'; y.fillRect(0, y0, S, Math.max(2, S / 256 * 4));
  }
  grain(x, S, R, 10);
  return { map: c, bump: b };
}
/* ===== جلد محبّب: خلايا صغيرة متفاوتة + لمعان خافت ===== */
export function leatherSet(S, base, o = {}) {
  const R = rng(o.seed || 9), c = cv(S, S), x = c.getContext('2d'), b = cv(S, S), y = b.getContext('2d'), B = hexRgb(base);
  x.fillStyle = base; x.fillRect(0, 0, S, S); y.fillStyle = '#7a7a7a'; y.fillRect(0, 0, S, S);
  const n = Math.round(S * S / 90);
  for (let i = 0; i < n; i++) {
    const px = R() * S, py = R() * S, r = 1.2 + R() * 2.6 * S / 512, l = R();
    x.fillStyle = rgbS(mix(B, l > .5 ? [255, 255, 255] : [0, 0, 0], .05 + R() * .07)); x.beginPath(); x.arc(px, py, r, 0, 6.283); x.fill();
    y.fillStyle = `rgba(255,255,255,${.12 + R() * .2})`; y.beginPath(); y.arc(px, py, r * .8, 0, 6.283); y.fill();
  }
  const nz = valueNoise(S, 6, o.seed || 9); x.globalAlpha = .18; x.globalCompositeOperation = 'multiply'; x.drawImage(nz, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  grain(x, S, R, 6);
  return { map: c, bump: b };
}
/* ===== حجر: تبقّع + عروق رفيعة متعرجة ===== */
export function stoneSet(S, base, o = {}) {
  const R = rng(o.seed || 21), c = cv(S, S), x = c.getContext('2d'), b = cv(S, S), y = b.getContext('2d'), B = hexRgb(base);
  x.fillStyle = base; x.fillRect(0, 0, S, S); y.fillStyle = '#808080'; y.fillRect(0, 0, S, S);
  const n1 = valueNoise(S, 5, o.seed || 21), n2 = valueNoise(S, 14, (o.seed || 21) + 7);
  x.globalCompositeOperation = 'overlay'; x.globalAlpha = .55; x.drawImage(n1, 0, 0); x.globalAlpha = .3; x.drawImage(n2, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  y.globalAlpha = .6; y.drawImage(n2, 0, 0); y.globalAlpha = 1;
  const vein = o.vein || [210, 200, 255];
  for (let i = 0; i < (o.veins || 7); i++) {
    let px = R() * S, py = R() * S, a = R() * 6.28; x.strokeStyle = rgbS(vein, .1 + R() * .14); x.lineWidth = .7 + R() * 1.3; y.strokeStyle = 'rgba(0,0,0,.5)'; y.lineWidth = x.lineWidth + .5; x.beginPath(); y.beginPath(); x.moveTo(px, py); y.moveTo(px, py);
    for (let k = 0; k < 28; k++) { a += (R() - .5) * .9; px += Math.cos(a) * S / 40; py += Math.sin(a) * S / 40; x.lineTo(px, py); y.lineTo(px, py); } x.stroke(); y.stroke();
  }
  grain(x, S, R, 8);
  return { map: c, bump: b };
}
/* ===== ورنيش (للصندوق الذهبي): لون عميق + تموّج خفيف بالطبقة ===== */
export function lacquerSet(S, base, o = {}) {
  const R = rng(o.seed || 31), c = cv(S, S), x = c.getContext('2d'), B = hexRgb(base);
  const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, rgbS(mix(B, [0, 0, 0], .18))); g.addColorStop(.5, rgbS(B)); g.addColorStop(1, rgbS(mix(B, [0, 0, 0], .25))); x.fillStyle = g; x.fillRect(0, 0, S, S);
  const nz = valueNoise(S, 4, o.seed || 31); x.globalCompositeOperation = 'soft-light'; x.globalAlpha = .5; x.drawImage(nz, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  grain(x, S, R, 4);
  return { map: c };
}
/* ===== معدن: مصقول (خطوط) أو مطروق (نقر) — يُعطي roughnessMap و bump ===== */
export function metalSet(S, kind, o = {}) {
  const R = rng(o.seed || 11), r = cv(S, S), x = r.getContext('2d'), b = cv(S, S), y = b.getContext('2d');
  x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, S, S); y.fillStyle = '#808080'; y.fillRect(0, 0, S, S);
  if (kind === 'hammered') {
    for (let i = 0; i < S * S / 300; i++) { const px = R() * S, py = R() * S, rr = (3 + R() * 6) * S / 512; const g = y.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); y.fillStyle = g; y.fillRect(px - rr, py - rr, rr * 2, rr * 2); x.fillStyle = `rgba(${R() > .5 ? '255,255,255' : '0,0,0'},.06)`; x.beginPath(); x.arc(px, py, rr, 0, 6.283); x.fill(); }
  } else {
    for (let i = 0; i < S * 1.2; i++) { const yy = R() * S, a = .04 + R() * .08; x.strokeStyle = `rgba(${R() > .5 ? '255,255,255' : '0,0,0'},${a})`; x.lineWidth = .5 + R(); x.beginPath(); x.moveTo(0, yy); x.lineTo(S, yy + (R() - .5) * 2); x.stroke(); y.strokeStyle = `rgba(0,0,0,${a * .8})`; y.beginPath(); y.moveTo(0, yy); y.lineTo(S, yy); y.stroke(); }
  }
  const nz = valueNoise(S, 4, (o.seed || 11) + 3); x.globalAlpha = .35; x.drawImage(nz, 0, 0); x.globalAlpha = 1;
  return { rough: r, bump: b };
}
/* ===== نقش زخرفي (فيليغري) بخطوط حلزونية — يُستخدم bump + لمعة على الذهب/الفضة ===== */
export function filigreeCanvas(S, o = {}) {
  const c = cv(S, S), x = c.getContext('2d'), R = rng(o.seed || 5);
  x.fillStyle = '#808080'; x.fillRect(0, 0, S, S); x.strokeStyle = '#ffffff'; x.lineCap = 'round'; x.lineWidth = S / 90;
  const scroll = (cx, cy, r, s) => { x.beginPath(); for (let a = 0; a < 9.5; a += .15) { const rr = r * (1 - a / 11); x.lineTo(cx + Math.cos(a * s) * rr, cy + Math.sin(a * s) * rr); } x.stroke(); };
  const cells = o.cells || 2, cs = S / cells;
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) { const cx = (i + .5) * cs, cy = (j + .5) * cs; scroll(cx - cs * .18, cy, cs * .2, 1); scroll(cx + cs * .18, cy, cs * .2, -1); x.beginPath(); x.moveTo(cx - cs * .45, cy + cs * .32); x.quadraticCurveTo(cx, cy + cs * .1, cx + cs * .45, cy + cs * .32); x.stroke(); x.beginPath(); x.arc(cx, cy - cs * .26, cs * .06, 0, 6.283); x.stroke(); }
  x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = S / 60; x.strokeRect(S * .02, S * .02, S * .96, S * .96);
  return c;
}
/* ===== رونات مضيئة (emissiveMap): أسود + خطوط بيضاء ===== */
export function runeCanvas(S, o = {}) {
  const c = cv(S, S), x = c.getContext('2d'), R = rng(o.seed || 17);
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = S / 120;
  const band = (y0) => { x.beginPath(); x.moveTo(S * .06, y0); x.lineTo(S * .94, y0); x.stroke(); };
  if (o.frame !== false) { band(S * .08); band(S * .92); }
  const n = o.n || 7, w = S * .84 / n;
  for (let i = 0; i < n; i++) {
    const cx = S * .08 + w * (i + .5), cy = S * (o.y || .5), h = S * .16;
    x.beginPath(); x.moveTo(cx, cy - h / 2); x.lineTo(cx, cy + h / 2); const k = (R() * 4) | 0;
    if (k === 0) { x.moveTo(cx, cy - h / 4); x.lineTo(cx + w * .25, cy - h / 2); x.moveTo(cx, cy); x.lineTo(cx - w * .25, cy + h / 4); }
    else if (k === 1) { x.moveTo(cx - w * .25, cy - h / 2); x.lineTo(cx + w * .25, cy); x.lineTo(cx - w * .25, cy + h / 2); }
    else if (k === 2) { x.moveTo(cx - w * .22, cy - h / 6); x.lineTo(cx + w * .22, cy - h / 6); x.moveTo(cx - w * .22, cy + h / 6); x.lineTo(cx + w * .22, cy + h / 6); }
    else { x.arc(cx, cy, h * .22, 0, 6.283); }
    x.stroke();
  }
  return c;
}
/* شعار CODIS: C مفتوحة بيضاء + مربع سماوي على قرص داكن */
export function emblemCanvas(bg = '#0c0d10', fg = '#f4f6f8', acc = '#38e1e6', S = 256) {
  const c = cv(S, S), x = c.getContext('2d'), k = S / 256;
  x.fillStyle = bg; x.fillRect(0, 0, S, S); x.scale(k, k);
  x.strokeStyle = fg; x.lineWidth = 26; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(178, 92); x.lineTo(112, 92); x.quadraticCurveTo(84, 92, 84, 120); x.lineTo(84, 136); x.quadraticCurveTo(84, 164, 112, 164); x.lineTo(178, 164); x.stroke();
  x.beginPath(); x.moveTo(178, 92); x.lineTo(178, 104); x.moveTo(178, 164); x.lineTo(178, 152); x.stroke();
  x.fillStyle = acc; x.fillRect(122, 116, 24, 24);
  return c;
}
export function glowCanvas(S = 128) { const c = cv(S, S), x = c.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.4)'); g.addColorStop(.6, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); return c; }
/* شرارة ممطوطة: نواة بيضاء + ذيل يتلاشى (للانبعاث على شكل خطوط) */
export function streakCanvas() { const W = 128, H = 32, c = cv(W, H), x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(255,255,255,.55)'); g.addColorStop(.92, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'destination-in'; const v = x.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.5, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = v; x.fillRect(0, 0, W, H); return c; }
export function shaftCanvas() { const W = 64, H = 256, c = cv(W, H), x = c.getContext('2d'); const gy = x.createLinearGradient(0, H, 0, 0); gy.addColorStop(0, 'rgba(255,255,255,.95)'); gy.addColorStop(.5, 'rgba(255,255,255,.35)'); gy.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gy; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'destination-in'; const gx = x.createLinearGradient(0, 0, W, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.5, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gx; x.fillRect(0, 0, W, H); return c; }
export function raysCanvas() { const S = 512, c = cv(S, S), x = c.getContext('2d'); x.translate(S / 2, S / 2); const R = rng(4); for (let i = 0; i < 24; i++) { x.rotate(Math.PI / 12); const L = S / 2 * (.65 + R() * .35), wd = 3 + R() * 9; const g = x.createLinearGradient(0, 0, L, 0); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(.4, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(L, -wd); x.lineTo(L, wd); x.closePath(); x.fill(); } return c; }
export function shadowCanvas() { const S = 128, c = cv(S, S), x = c.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(.5, 'rgba(0,0,0,.32)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); return c; }
export function gradientBg(top, mid, bot) { const c = cv(8, 512), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, 8, 512); return c; }
/* أرضية المسرح: لوح خشبي داكن بحلقات + بقعة مضاءة بالمنتصف */
export function floorCanvas(S, base, rim) {
  const c = cv(S, S), x = c.getContext('2d'), R = rng(91), B = hexRgb(base);
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  for (let r = S * .5; r > 4; r -= 5 + R() * 9) { x.strokeStyle = rgbS(mix(B, R() > .5 ? [0, 0, 0] : [255, 230, 190], .05 + R() * .05), .3); x.lineWidth = 1 + R() * 2; x.beginPath(); x.arc(S / 2, S / 2, r, 0, 6.283); x.stroke(); }
  const nz = valueNoise(S, 6, 5); x.globalCompositeOperation = 'overlay'; x.globalAlpha = .35; x.drawImage(nz, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  x.strokeStyle = rim; x.lineWidth = S * .012; x.beginPath(); x.arc(S / 2, S / 2, S * .485, 0, 6.283); x.stroke();
  x.lineWidth = S * .004; x.beginPath(); x.arc(S / 2, S / 2, S * .44, 0, 6.283); x.stroke();
  grain(x, S, R, 8); return c;
}
export { cv };
