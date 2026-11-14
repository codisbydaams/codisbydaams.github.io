/* CODIS-BOX3D — بطاقة المكافأة ثلاثية الأبعاد (وجه بالاسم الحقيقي للجائزة + ظهر) تخرج من الصندوق ثم تتحول لعرض الواجهة الفعلي */
import { Group, Mesh, PlaneGeometry, BoxGeometry, MeshStandardMaterial, MeshBasicMaterial, DoubleSide } from 'three';
import { tex, cv, emblemCanvas } from './tex.js';

const rr = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
function wrapLines(x, text, maxW, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += '…'; } return lines;
}
export function cardFaceCanvas(d, theme) {
  const W = 512, H = 640, c = cv(W, H), x = c.getContext('2d'), col = d.rgb || [255, 214, 120], rgb = `rgb(${col[0]},${col[1]},${col[2]})`, dark = theme === 'dark';
  x.clearRect(0, 0, W, H);
  rr(x, 6, 6, W - 12, H - 12, 34); x.fillStyle = dark ? '#211a12' : '#f3e8cd'; x.fill();
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},.30)`); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},.18)`); x.fillStyle = g; x.fill();
  x.lineWidth = 10; x.strokeStyle = rgb; rr(x, 22, 22, W - 44, H - 44, 26); x.stroke();
  x.lineWidth = 2; x.strokeStyle = dark ? 'rgba(255,230,170,.55)' : 'rgba(90,58,16,.55)'; rr(x, 38, 38, W - 76, H - 76, 18); x.stroke();
  /* شعار */
  x.save(); x.beginPath(); x.arc(W / 2, 156, 62, 0, 6.283); x.clip(); x.drawImage(emblemCanvas(), W / 2 - 62, 156 - 62, 124, 124); x.restore();
  x.lineWidth = 6; x.strokeStyle = rgb; x.beginPath(); x.arc(W / 2, 156, 66, 0, 6.283); x.stroke();
  /* الاسم */
  const fam = d.font || 'sans-serif'; x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = dark ? '#f6ead0' : '#2c1d0a';
  let fs = 56, lines; for (; fs >= 30; fs -= 4) { x.font = `700 ${fs}px ${fam}`; lines = wrapLines(x, d.title, W - 120, 3); if (lines.length <= 2 || fs <= 34) break; }
  const lh = fs * 1.25, y0 = 330 - ((lines.length - 1) * lh) / 2; lines.forEach((l, i) => x.fillText(l, W / 2, y0 + i * lh));
  x.font = `600 28px ${fam}`; x.fillStyle = rgb; x.fillText(d.sub || '', W / 2, 505);
  x.fillStyle = dark ? 'rgba(255,230,170,.7)' : 'rgba(90,58,16,.7)'; x.font = `600 22px ${fam}`; x.fillText(d.tag || '', W / 2, 560);
  return c;
}
export function cardBackCanvas(d, theme) {
  const W = 512, H = 640, c = cv(W, H), x = c.getContext('2d'), col = d.rgb || [255, 214, 120], rgb = `rgb(${col[0]},${col[1]},${col[2]})`;
  rr(x, 6, 6, W - 12, H - 12, 34); x.fillStyle = '#16120d'; x.fill();
  x.save(); x.clip(); x.strokeStyle = 'rgba(255,214,140,.14)'; x.lineWidth = 2;
  for (let i = -H; i < W + H; i += 34) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); x.beginPath(); x.moveTo(i, H); x.lineTo(i + H, 0); x.stroke(); } x.restore();
  x.lineWidth = 10; x.strokeStyle = rgb; rr(x, 22, 22, W - 44, H - 44, 26); x.stroke();
  x.save(); x.beginPath(); x.arc(W / 2, H / 2, 96, 0, 6.283); x.clip(); x.drawImage(emblemCanvas(), W / 2 - 96, H / 2 - 96, 192, 192); x.restore();
  x.lineWidth = 8; x.beginPath(); x.arc(W / 2, H / 2, 102, 0, 6.283); x.stroke();
  return c;
}
export function makeCard(d, theme) {
  const g = new Group(), W = 1, H = 1.25;
  const ft = tex(cardFaceCanvas(d, theme), null), bt = tex(cardBackCanvas(d, theme), null);
  const fm = new MeshStandardMaterial({ map: ft, roughness: .55, metalness: .1, alphaTest: .4, emissive: 0x000000 });
  const bm = new MeshStandardMaterial({ map: bt, roughness: .6, metalness: .2, alphaTest: .4 });
  const f = new Mesh(new PlaneGeometry(W, H), fm); f.position.z = .008; const b = new Mesh(new PlaneGeometry(W, H), bm); b.rotation.y = Math.PI; b.position.z = -.008;
  const e = new Mesh(new BoxGeometry(W - .06, H - .06, .014), new MeshStandardMaterial({ color: 0x3a2c14, roughness: .6 }));
  g.add(f, b, e); g.userData = { mats: [fm, bm], texs: [ft, bt], face: f };
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
