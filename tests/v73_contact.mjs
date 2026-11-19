/* CODIS-V73 — صفحات مقارنة (Contact Sheets) لكل الاختيارات، من التطبيق نفسه (CodisChar.spec + العارض الحقيقي، GPU إن وُجد).
   PW=<playwright-core/index.mjs> OUT=<مجلد> node tests/v73_contact.mjs [url]  ⇒ OUT/<group>/*.png ثم: py -3 tools/char3d/lab/sheet.py */
import { pathToFileURL } from 'url'; import { writeFileSync, mkdirSync } from 'fs';
const { chromium } = await import(pathToFileURL(process.env.PW).href);
const url = process.argv[2] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html', OUT = process.env.OUT, ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const br = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: process.env.SWIFT ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--headless=new', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await br.newPage({ viewport: { width: 900, height: 1000 } }), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(url); await p.waitForTimeout(3000);
await p.evaluate(() => { window.CODIS_CHAR_TIER = 'hi'; try { document.getElementById('codis-gate').remove(); } catch (e) {} const h = document.createElement('div'); h.id = 'cs-host'; h.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:800px;z-index:99999;background:#ece6dc'; document.body.appendChild(h); window.__v = CodisChar.mount(h, { idle: false, yaw: 0 }); });
const D = await p.evaluate(() => CodisChar.DEFS);
const want = g => !ONLY.length || ONLY.some(o => g.startsWith(o));
async function shot(group, name, sel, o) {
  if (!want(group)) return; mkdirSync(OUT + '/' + group, { recursive: true });
  const u = await p.evaluate(([sel, o]) => window.__v.snapshot(CodisChar.spec(sel), o), [sel, o]);
  if (u) writeFileSync(OUT + '/' + group + '/' + name + '.png', Buffer.from(u.split(',')[1], 'base64'));
}
const V = { front: 0, a45: -.62, side: -1.5708, back: 3.1416, b135: 2.5 };
for (const sex of ['male', 'female']) {
  const base = Object.assign({ body: sex }, D.defaults[sex]);
  for (const b of D.builds[sex]) for (const [vn, y] of [['front', V.front], ['side', V.side], ['back', V.back]])
    await shot('bodies_' + sex, b.id + '_' + vn, Object.assign({}, base, { build: b.id }), { focus: 'body', z: 0, yaw: y, size: 420, aspect: .5 });
  for (const f of D.faces[sex]) for (const [vn, y] of [['front', V.front], ['a45', V.a45], ['side', V.side]])
    await shot('faces_' + sex, f.id + '_' + vn, Object.assign({}, base, { face: f.id }), { focus: 'face', z: 1, yaw: y, size: 300 });
  for (const h of D.hairs[sex]) for (const [vn, y] of [['a45', V.a45], ['side', V.side], ['back', V.b135]])
    await shot('hair_' + sex, h.id + '_' + vn, Object.assign({}, base, { hair: h.id }), { focus: 'hair', z: 1, yaw: y, size: 300 });
  for (const e of D.eyes) await shot('eyes_' + sex, 'color_' + e.id, Object.assign({}, base, { eyes: e.id }), { focus: 'eyes', z: 1, yaw: 0, size: 220, aspect: 1.6 });
  for (const e of D.eyeShapes) await shot('eyes_' + sex, 'shape_' + e.id, Object.assign({}, base, { eyeShape: e.id }), { focus: 'eyes', z: 1, yaw: 0, size: 220, aspect: 1.6 });
  for (const b of D.brows) await shot('brows_' + sex, b.id, Object.assign({}, base, { brows: b.id }), { focus: 'eyes', z: 1, yaw: -.15, size: 220, aspect: 1.6 });
  for (const s of D.skins) await shot('skins_' + sex, s.id, Object.assign({}, base, { skin: s.id }), { focus: 'face', z: 1, yaw: -.45, size: 260 });
  for (const u of D.unders) await shot('skins_' + sex, 'under_' + u.id, Object.assign({}, base, { skin: 's4', under: u.id }), { focus: 'face', z: 1, yaw: -.45, size: 260 });
  for (const c of D.colors) await shot('haircolor_' + sex, c.id, Object.assign({}, base, { hairColor: c.id }), { focus: 'hair', z: 1, yaw: -.6, size: 240 });
}
const mb = Object.assign({ body: 'male' }, D.defaults.male);
for (const b of D.beards) for (const [vn, y] of [['a45', -.6], ['front', 0]]) await shot('beards', b.id + '_' + vn, Object.assign({}, mb, { beard: b.id, hair: 'crop' }), { focus: 'beard', z: 1, yaw: y, size: 300 });
for (const b of ['short', 'full', 'goatee']) for (const c of ['black', 'chestnut', 'gray', 'lightblonde']) await shot('beards', 'color_' + b + '_' + c, Object.assign({}, mb, { beard: b, hairColor: c, hair: 'crop' }), { focus: 'beard', z: 1, yaw: -.6, size: 240 });
/* اختبارات العيوب: تركيبات متطرفة (منزلقات ±100 مجتمعة) + ملابس + شعر طويل */
const ex = [['m_extreme_big', { body: 'male', build: 'heavy', height: 100, advb: 'sd:100,ct:100,be:100,th:100,ca:100,ua:100,bi:100', hair: 'shoulder', beard: 'full' }],
  ['m_extreme_small', { body: 'male', build: 'slim', height: 0, advb: 'sd:-100,ct:-100,be:-100,th:-100,ca:-100,ua:-100,tl:-100', hair: 'quiff' }],
  ['f_extreme_big', { body: 'female', build: 'full', height: 100, advb: 'hc:100,bu:100,th:100,ct:100,be:100,wc:100', hair: 'long_curly' }],
  ['f_extreme_small', { body: 'female', build: 'slim', height: 0, advb: 'hc:-100,bu:-100,th:-100,wc:-100,sd:-100', hair: 'braid' }],
  ['m_face_extreme', { body: 'male', face: 'm14', adv: 'fw:100,jw:100,nw:100,mw:100,es:100,cv:100', hair: 'afro', beard: 'goatee' }],
  ['f_face_extreme', { body: 'female', face: 'f4', adv: 'fw:-100,fl:100,nl:100,cs:100,es:-100,cb:100', hair: 'bob' }]];
for (const [name, sel] of ex) for (const [vn, y] of [['front', 0], ['side', V.side], ['back', V.back]]) await shot('extremes', name + '_' + vn, Object.assign({}, D.defaults[sel.body], sel), { focus: 'body', z: 0, yaw: y, size: 420, aspect: .5 });
console.log('errors', errs.slice(0, 5)); await br.close();
