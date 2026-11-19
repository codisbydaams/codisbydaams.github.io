/* CODIS-V72 — الشخصية الواقعية: اختبار متصفح حقيقي (WebKit بملف iPhone 12 + Chromium إن وُجد).
   تشغيل:  PW=<playwright-core/index.mjs> node tests/v72_char.mjs [http://127.0.0.1:8766/app/CODIS_FINAL.html]
   SHOTS=<مجلد> لحفظ لقطات المراحل. يفشل (exit 1) على أي خطأ صفحة أو شرط غير متحقق.
   ملاحظة: WebKit هنا بلا requestIdleCallback ⇒ مسار البديل (setTimeout) يُختبر فعلياً. */
import { pathToFileURL } from 'url';
const PWm = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
const { webkit, chromium, devices } = PWm;
const url = process.argv[2] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html';
const SHOTS = process.env.SHOTS || '';
let bad = 0, n = 0;
const ok = (c, m, x) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x).slice(0, 400) : '')); };
/* انتظار بالاستطلاع عبر evaluate (waitForFunction قد يُحجب بـCSP التطبيق «unsafe-eval» فيُبتلع ولا ينتظر) */
async function until(p, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < (ms || 30000)) { try { if (await p.evaluate(fn, arg)) return true; } catch (e) {} await p.waitForTimeout(250); } return false; }
async function boot(p) {
  await p.goto(url); await p.waitForTimeout(3000);
  await p.evaluate(() => { try { const g = document.getElementById('codis-gate'); if (g) g.remove(); } catch (e) {} navigateToPage('settings'); });
  await p.waitForTimeout(300);
}
const ready = p => until(p, () => !!(codisChx && codisChx.ready), 90000);
const idle = async p => { await until(p, () => { const v = CodisChar.current(); return !v || !!v.cur; }, 30000); await p.evaluate(() => CodisChar.current() && CodisChar.current().queue); await p.waitForTimeout(150); };
async function run(label, launcher, ctxOpts) {
  let br; try { br = await launcher.launch(launcher === chromium ? { executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] } : {}); } catch (e) { console.log('SKIP ' + label + ' (' + e.message.split('\n')[0] + ')'); return; }
  const ctx = await br.newContext(ctxOpts), p = await ctx.newPage(), errs = [];
  let assetHits = 0, failAsset = false;
  await ctx.route('**/codis_char_v72.bin', r => { assetHits++; if (failAsset) return r.fulfill({ status: 503, body: 'x' }); return r.continue(); });
  p.on('pageerror', e => errs.push(e.message));
  await boot(p);
  await p.evaluate(() => { data.profile = Object.assign({}, data.profile || {}, { name: 'اختبار', photo: 'data:image/png;base64,AAAA', photoMode: 'custom' }); saveData(); });
  await p.evaluate(() => openSettingsCategory('character')); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!document.querySelector('#char-root .chp-empty')), label + ': empty state on «شخصيتي» when no character');
  const gl = await p.evaluate(() => CodisChar.available());
  console.log('INFO ' + label + ': WebGL = ' + gl + ', rIC = ' + await p.evaluate(() => typeof requestIdleCallback));
  /* --- فشل الأصل ⇒ رسالة + زر إعادة محاولة ظاهر ⇒ إعادة المحاولة تنجح (لا حالة فشل عالقة) --- */
  if (gl) {
    failAsset = true;
    await p.evaluate(() => codisCharOpen('create'));
    await until(p, () => { const f = document.querySelector('.chx-fail'); return !!(f && !f.hidden); }, 20000);
    const f0 = await p.evaluate(() => { const f = document.querySelector('.chx-fail'); return { shown: f && !f.hidden, retry: f && !f.querySelector('[data-chx="retry"]').hidden, msg: f && f.querySelector('p').textContent }; });
    ok(f0.shown && f0.retry && /الاتصال|تنزيل/.test(f0.msg), label + ': asset failure ⇒ clear message + retry button', f0);
    failAsset = false; assetHits = 0;
    await p.click('[data-chx="retry"]'); await ready(p);
    ok(await p.evaluate(() => codisChx.ready && document.querySelector('.chx-fail').hidden && document.querySelectorAll('canvas.ch3-cv').length === 1), label + ': retry recovers (1 canvas, ready)');
  } else { await p.evaluate(() => codisCharOpen('create')); await p.waitForTimeout(500); }
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_1_body.png' });
  ok(await p.evaluate(() => document.querySelectorAll('.chx-steps li').length === 7), label + ': male flow has 7 steps (beard included)');
  if (gl) {
    /* الجسم كاملاً داخل الإطار */
    const fit = await p.evaluate(() => { const v = CodisChar.current(), B = v.cur, c = v.camera, b = B.box; v.frame(0); const pts = [[0, b.min.y, 0], [0, b.max.y, 0], [b.min.x, (b.min.y + b.max.y) / 2, 0], [b.max.x, (b.min.y + b.max.y) / 2, 0]].map(q => { const V = new c.position.constructor(q[0], q[1], q[2]).project(c); return [V.x, V.y]; }); return pts.every(q => Math.abs(q[0]) <= 1 && Math.abs(q[1]) <= 1) ? 'inside' : JSON.stringify(pts); });
    ok(fit === 'inside', label + ': full body (head→feet, arms) inside the camera frame', fit);
    const cv = await p.$('canvas.ch3-cv'), bb = await cv.boundingBox(), y0 = await p.evaluate(() => CodisChar.current().yaw);
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 + 120, bb.y + bb.height / 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
    ok(Math.abs(await p.evaluate(() => CodisChar.current().yaw) - y0) > .5, label + ': drag rotates the character');
    ok(assetHits <= 1, label + ': asset downloaded once (no duplicate concurrent loads)', { assetHits });
    /* بنيات الجسم: أبعاد حقيقية مختلفة */
    const W = {};
    for (const b of ['slim', 'avg', 'athl', 'broad']) { await p.click('.chx-opt[data-k="build"][data-v="' + b + '"]'); await p.waitForTimeout(200); await idle(p);
      W[b] = await p.evaluate(() => { /* الجذع فقط (|x|<20سم، بين الحوض والصدر) — بلا الذراعين المتدليتين */ const R = CodisChar.current().cur, P = R.P, vm = R.vmap, H = R.box.max.y; let zf = -9, zb = 9, sx = 0; for (let i = 0; i < vm.length; i++) { const x = P[vm[i] * 3], y = P[vm[i] * 3 + 1] / H, z = P[vm[i] * 3 + 2]; if (y > .56 && y < .64 && Math.abs(x) < .2) { zf = Math.max(zf, z); zb = Math.min(zb, z); sx = Math.max(sx, Math.abs(x)); } } return [+(sx * 100).toFixed(1), +((zf - zb) * 100).toFixed(1)]; }); }
    const ws = Object.values(W).map(x => x[0] + x[1]);
    ok(new Set(ws.map(x => Math.round(x))).size === 4 && W.broad[1] > W.slim[1] + 4 && W.broad[0] > W.slim[0] + 1, label + ': 4 builds differ in real geometry (waist half-width / depth, cm)', W);
    /* الطول */
    const h0 = await p.evaluate(() => CodisChar.current().cur.box.max.y);
    await p.evaluate(() => { const i = document.querySelector('[data-sl="height"]'); i.value = 95; i.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(150); await idle(p);
    const h1 = await p.evaluate(() => CodisChar.current().cur.box.max.y);
    ok(h1 - h0 > .06 && h1 - h0 < .2 && h1 < 2.0, label + ': height slider changes real stature within a human range (m)', { h0, h1 });
  }
  /* الأنثى ⇒ 6 مراحل */
  await p.click('.chx-opt[data-k="body"][data-v="female"]'); await p.waitForTimeout(300); if (gl) await idle(p);
  ok(await p.evaluate(() => codisChx.sel.body === 'female' && document.querySelectorAll('.chx-steps li').length === 6), label + ': female flow has 6 steps (no beard)');
  await p.click('.chx-opt[data-k="body"][data-v="male"]'); await p.waitForTimeout(300); if (gl) await idle(p);
  await p.click('[data-chx="next"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.getElementById('codis-char').dataset.step === 'skin' && document.querySelectorAll('.chx-opt.is-skin').length >= 8), label + ': skin step with ≥8 tones');
  await p.click('[data-chx="next"]'); await p.waitForTimeout(gl ? 1200 : 300);
  ok(await p.evaluate(() => document.getElementById('codis-char').dataset.step === 'face' && document.querySelectorAll('.chx-opt.is-face').length === 10), label + ': face step with 10 faces');
  /* كل وجه يُختار يبقى هو نفسه (لا ترحيل خاطئ) ومواصفته = تعريفه */
  const picks = await p.evaluate(() => { const out = []; for (const f of CodisChar.DEFS.faces.male) { codisChxPick('face', f.id); const t = CodisChar.spec(codisChx.sel).targets, k = Object.keys(f.t)[0], key = k[0] === '*' ? 'l-' + k.slice(1) : k; out.push([f.id, codisChx.sel.face, Math.abs((t[key] || 0) - f.t[k]) < 1e-6]); } codisChxPick('face', 'm1'); return out; });
  ok(picks.every(x => x[0] === x[1] && x[2]), label + ': each of the 10 faces stays selected and maps to its own targets', picks.filter(x => !(x[0] === x[1] && x[2])));
  if (gl) {
    await until(p, () => document.querySelectorAll('.chx-opt.is-face img').length >= 3, 40000);
    ok(await p.evaluate(() => document.querySelectorAll('.chx-opt.is-face img').length >= 3), label + ': face cards get real 3D thumbnails (idle queue; Safari fallback path)', await p.evaluate(() => document.querySelectorAll('.chx-opt.is-face img').length));
    /* الوجه: مواضع الرأس + العموديات تتغير (لا ظلال قديمة) */
    const snap = () => p.evaluate(() => { const R = CodisChar.current().cur; return { P: Array.from(R.P.subarray(0, 19158 * 3)).filter((_, i) => i % 7 === 0).slice(0, 4000), N: Array.from(R.bodyGeo.attributes.normal.array.subarray(0, 30000)).filter((_, i) => i % 5 === 0) }; });
    const a = await snap(); await p.click('.chx-opt[data-v="m2"]'); await p.waitForTimeout(200); await idle(p); const b = await snap();
    const dP = Math.max(...a.P.map((v, i) => Math.abs(v - b.P[i]))), dN = Math.max(...a.N.map((v, i) => Math.abs(v - b.N[i])));
    ok(dP > .002 && dN > .01, label + ': face preset = real mesh change + recomputed normals', { dP, dN });
    /* كل منزلق تخصيص دقيق له أثر حقيقي على المجسّم */
    const eff = await p.evaluate(async () => {
      const v = CodisChar.current(), base = Object.assign({}, codisChx.sel, { adv: '' }), out = {};
      await v.setConfig(CodisChar.spec(base)); const P0 = Float32Array.from(v.cur.P);
      for (const g of CodisChar.DEFS.adv) for (const it of g.items) {
        for (const sg of [100, -100]) { await v.setConfig(CodisChar.spec(Object.assign({}, base, { adv: it.k + ':' + sg }))); const P = v.cur.P; let m = 0; for (let i = 0; i < P.length; i++) { const d = Math.abs(P[i] - P0[i]); if (d > m) m = d; } out[it.k + (sg > 0 ? '+' : '-')] = +(m * 1000).toFixed(2); }
      }
      await v.setConfig(CodisChar.spec(codisChx.sel)); return out;
    });
    const weak = Object.entries(eff).filter(([k, mm]) => !(mm >= .6));
    ok(!weak.length, label + ': every advanced slider moves the mesh ≥0.6mm (' + Object.keys(eff).length + ' directions)', weak.length ? weak : undefined);
    /* تزامن: طلبات متتالية سريعة ⇒ آخر طلب يفوز، لا مجسّمات مكررة */
    const cc = await p.evaluate(async () => {
      const v = CodisChar.current(), S = CodisChar.DEFS, sel = codisChx.sel, ps = [];
      for (const f of S.faces.male.slice(0, 6)) ps.push(v.setConfig(CodisChar.spec(Object.assign({}, sel, { face: f.id }))).catch(() => {}));
      const last = Object.assign({}, sel, { face: 'm7', hair: 'afro01' }); ps.push(v.setConfig(CodisChar.spec(last))); await Promise.all(ps);
      const R = v.cur, vis = R.root.children.filter(o => o.isSkinnedMesh && o.visible).map(o => o.name);
      return { rigs: Object.keys(v.rigs).filter(k => k.indexOf('t:') !== 0).length, thumbRigs: Object.keys(v.rigs).filter(k => k.indexOf('t:') === 0).length, hair: vis.filter(n => /^(short|afro|bob|long|pony|braid)/.test(n)), turn: v.turn.children.length, visibleRigs: v.turn.children.filter(o => o.visible).length };
    });
    ok(cc.rigs <= 2 && cc.thumbRigs <= 2 && cc.hair.length === 1 && cc.hair[0] === 'afro01' && cc.turn <= 4 && cc.visibleRigs === 1, label + ': 7 concurrent setConfig ⇒ last wins, one hair, one visible rig, no duplicates', cc);
    await p.evaluate(() => codisChxPick('hair', codisChx.sel.hair)); await p.waitForTimeout(100);
  }
  /* التنقل حتى اللحية: اللحية مستقلة عن الشعر */
  await p.evaluate(() => { codisChx.sel = CodisChar.fix(Object.assign({}, codisChx.sel, { hair: 'short02' })); codisChxStep(codisChxSteps(codisChx).findIndex(s => s.key === 'beard')); }); await p.waitForTimeout(300);
  await p.click('.chx-opt[data-k="beard"][data-v="full"]'); await p.waitForTimeout(300); if (gl) await idle(p);
  const bd = await p.evaluate(() => { const v = CodisChar.current(); return { sel: [codisChx.sel.hair, codisChx.sel.beard], vis: v ? v.cur.root.children.filter(o => o.isSkinnedMesh && o.visible).map(o => o.name) : [] }; });
  ok(bd.sel[0] === 'short02' && bd.sel[1] === 'full' && (!gl || (bd.vis.includes('short02') && bd.vis.some(x => /^shell:beard:full/.test(x)))), label + ': beard independent of hairstyle (both visible)', bd);
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_2_beard.png' });
  /* الحفظ: data.profile.character v2 + الملف الشخصي كما هو */
  await p.evaluate(() => codisChxStep(codisChxSteps(codisChx).length - 1)); await p.waitForTimeout(200);
  await p.click('[data-chx="next"]'); await until(p, () => !document.getElementById('codis-char'), 8000);
  const sv = await p.evaluate(() => ({ c: data.profile.character, name: data.profile.name, photo: data.profile.photo, mode: data.profile.photoMode, open: !!document.getElementById('codis-char'), canv: document.querySelectorAll('canvas.ch3-cv').length }));
  ok(sv.c && sv.c.v === 2 && sv.c.beard === 'full' && sv.c.hair === 'short02' && sv.c.model === 'mh-cc0' && sv.name === 'اختبار' && sv.photo === 'data:image/png;base64,AAAA' && sv.mode === 'custom' && !sv.open, label + ': saved v2 character; name/photo untouched; creator closed', { open: sv.open, mode: sv.mode, name: sv.name, v: sv.c && sv.c.v });
  await p.evaluate(() => { localStorage.removeItem('codis_x'); }); await p.reload(); await p.waitForTimeout(3000);
  const rl = await p.evaluate(() => data.profile && data.profile.character);
  ok(rl && rl.v === 2 && rl.beard === 'full' && rl.build && rl.skin, label + ': survives reload (normalizer keeps v2 fields)', rl);
  /* صفحة «شخصيتي» */
  await p.evaluate(() => { try { const g = document.getElementById('codis-gate'); if (g) g.remove(); } catch (e) {} navigateToPage('settings'); openSettingsCategory('character'); }); await p.waitForTimeout(gl ? 4000 : 500);
  const pg = await p.evaluate(() => ({ secs: document.querySelectorAll('#char-root .chp-sec').length, dts: [...document.querySelectorAll('#char-root .chp-info dt')].map(x => x.textContent), canv: document.querySelectorAll('canvas.ch3-cv').length, sync: (document.querySelector('.chp-sync') || {}).textContent }));
  ok(pg.secs === 3 && pg.dts.includes('البنية') && pg.dts.includes('البشرة') && pg.dts.includes('اللحية') && (!gl || pg.canv === 1) && /محفوظة/.test(pg.sync || ''), label + ': «شخصيتي» shows all categories + one viewer + honest sync state', pg);
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_3_page.png', fullPage: false });
  /* الخروج من الصفحة ⇒ العارض يُغلق */
  await p.evaluate(() => navigateToPage('tasks')); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelectorAll('canvas.ch3-cv').length === 0 && !CodisChar.current()), label + ': leaving the page disposes the viewer');
  /* ترحيل V71 */
  await p.evaluate(() => { data.profile.character = { v: 1, body: 'male', face: 'm3', hair: 'parted_beard', color: 'copper', model: 'ubc-std', assets: 'v71-1', createdAt: 1, updatedAt: 2 }; });
  const mg = await p.evaluate(() => CodisChar.fix(data.profile.character));
  ok(mg.face === 'm8' && mg.hair === 'short03' && mg.beard === 'full' && mg.hairColor === 'copper', label + ': V71 character migrated to equivalent V72 choices (not reset)', mg);
  await p.evaluate(() => { data.profile.character = { v: 2, body: 'female', face: 'f99', hair: 'zzz', skin: 's1', eyes: 'nope', adv: 'fw:40,xx:9,ed:500', sym: false }; });
  const uk = await p.evaluate(() => CodisChar.fix(data.profile.character));
  ok(uk.face === 'f1' && uk.hair === 'long01' && uk.skin === 's1' && uk.eyes === 'brown' && uk.adv === 'ed:100,fw:40' && uk.sym === false, label + ': unknown ids ⇒ defaults per field; adv sanitized', uk);
  /* فتح/إغلاق متكرر: لا تراكم سياقات */
  if (gl) {
    for (let i = 0; i < 4; i++) { await p.evaluate(() => codisCharOpen('edit')); await p.waitForTimeout(800); await p.evaluate(() => codisChxClose(false)); await p.waitForTimeout(350); }
    ok(await p.evaluate(() => document.querySelectorAll('canvas.ch3-cv').length === 0 && !CodisChar.current()), label + ': open/close ×4 ⇒ no leftover canvases/views');
  }
  ok(!errs.length, label + ': no page errors', errs.slice(0, 5));
  await br.close();
}
await run('webkit-iphone12', webkit, { ...devices['iPhone 12'] });
if (!process.env.NO_CHROME) await run('chromium-desktop', chromium, { viewport: { width: 1280, height: 860 } });
console.log((bad ? 'FAILED ' : 'PASSED ') + (n - bad) + '/' + n);
process.exit(bad ? 1 : 0);
