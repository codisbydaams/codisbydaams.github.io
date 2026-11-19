/* CODIS-V72 — صفحات مقارنة (Contact Sheets) لكل الاختيارات، من التطبيق نفسه (CodisChar.spec + العارض الحقيقي).
   PW=<playwright-core/index.mjs> OUT=<مجلد> node tests/v72_contact.mjs [url]   ⇒ OUT/<group>/*.png ثم py -3 tools/char3d/lab/sheet.py */
import { pathToFileURL } from 'url'; import { writeFileSync, mkdirSync } from 'fs';
const { chromium } = await import(pathToFileURL(process.env.PW).href);
const url = process.argv[2] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html', OUT = process.env.OUT;
const br = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await br.newPage({ viewport: { width: 700, height: 900 } }), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(url); await p.waitForTimeout(3000);
await p.evaluate(() => { try { document.getElementById('codis-gate').remove(); } catch (e) {} const h = document.createElement('div'); h.id = 'cs-host'; h.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:800px;z-index:99999;background:#ece6dc'; document.body.appendChild(h); window.__v = CodisChar.mount(h, { idle: false, yaw: 0 }); });
const D = await p.evaluate(() => CodisChar.DEFS);
async function shot(group, name, sel, o) {
  mkdirSync(OUT + '/' + group, { recursive: true });
  const u = await p.evaluate(([sel, o]) => window.__v.snapshot(CodisChar.spec(sel), o), [sel, o]);
  if (u) writeFileSync(OUT + '/' + group + '/' + name + '.png', Buffer.from(u.split(',')[1], 'base64'));
}
const V = { front: 0, a45: -.785, side: -1.5708, back: 3.1416, b135: 2.36 };
for (const sex of ['male', 'female']) {
  const base = Object.assign({ body: sex }, D.defaults[sex]);
  for (const f of D.faces[sex]) for (const [vn, y] of [['front', V.front], ['a45', V.a45], ['side', V.side]])
    await shot('faces_' + sex, f.id + '_' + vn, Object.assign({}, base, { face: f.id, hair: sex === 'male' ? 'short04' : 'ponytail01' }), { focus: 'face', z: 1, yaw: y, size: 220 });
  for (const b of D.builds) for (const [vn, y] of [['front', V.front], ['side', V.side], ['back', V.back]])
    await shot('bodies_' + sex, b.id + '_' + vn, Object.assign({}, base, { build: b.id }), { focus: 'body', z: 0, yaw: y, size: 320, aspect: .5 });
  for (const h of D.hairs[sex]) for (const [vn, y] of [['a45', V.a45], ['side', V.side], ['back', V.b135]])
    await shot('hair_' + sex, h.id + '_' + vn, Object.assign({}, base, { hair: h.id }), { focus: 'hair', z: 1, yaw: y, size: 220 });
  /* ملاءمة الشعر على وجوه وبنيات مختلفة (لا اختراق/فراغ) */
  for (const h of D.hairs[sex]) for (const fid of [D.faces[sex][2].id, D.faces[sex][3].id, D.faces[sex][6].id])
    await shot('hairfit_' + sex, h.id + '_' + fid, Object.assign({}, base, { hair: h.id, face: fid, build: fid.endsWith('3') ? 'broad' : 'slim' }), { focus: 'hair', z: 1, yaw: -.6, size: 180 });
  for (const e of D.eyeShapes) await shot('eyes_' + sex, 'shape_' + e.id, Object.assign({}, base, { eyeShape: e.id }), { focus: 'eyes', z: 1, yaw: 0, size: 150, aspect: 1.6 });
  for (const e of D.eyes) await shot('eyes_' + sex, 'color_' + e.id, Object.assign({}, base, { eyes: e.id }), { focus: 'eyes', z: 1, yaw: 0, size: 150, aspect: 1.6 });
  for (const b of D.brows) await shot('brows_' + sex, b.id, Object.assign({}, base, { brows: b.id }), { focus: 'eyes', z: 1, yaw: -.2, size: 150, aspect: 1.6 });
  for (const s of D.skins) await shot('skins_' + sex, s.id, Object.assign({}, base, { skin: s.id }), { focus: 'face', z: 1, yaw: -.4, size: 200 });
  for (const c of D.colors) await shot('haircolor_' + sex, c.id, Object.assign({}, base, { hairColor: c.id, hair: sex === 'male' ? 'short02' : 'bob01' }), { focus: 'hair', z: 1, yaw: -.5, size: 170 });
}
const mb = Object.assign({ body: 'male' }, D.defaults.male);
for (const b of D.beards) for (const [vn, y] of [['a45', -.6], ['front', 0]]) await shot('beards', b.id + '_' + vn, Object.assign({}, mb, { beard: b.id }), { focus: 'face', z: 1, yaw: y, size: 220 });
for (const b of D.beards.slice(1, 4)) for (const c of ['black', 'chestnut', 'gray']) await shot('beards', 'color_' + b.id + '_' + c, Object.assign({}, mb, { beard: b.id, hairColor: c }), { focus: 'face', z: 1, yaw: -.6, size: 180 });
console.log('errors', errs.slice(0, 5)); await br.close();
