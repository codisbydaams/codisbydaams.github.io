/* CODIS-V73 — منظومة الشخصية: اختبار متصفح حقيقي (WebKit بملف iPhone 12 + Chromium).
   تشغيل:  PW=<playwright-core/index.mjs> node tests/v73_char.mjs [http://127.0.0.1:8766/app/CODIS_FINAL.html]
   CHROME_GPU=1 ⇒ Chromium على الـGPU الحقيقي (وإلا swiftshader). SHOTS=<مجلد> لحفظ لقطات. NO_CHROME=1 / NO_WEBKIT=1.
   يفشل (exit 1) على أي خطأ صفحة أو شرط غير متحقق. ملاحظة: WebKit هنا بلا requestIdleCallback ⇒ مسار البديل (setTimeout) يُختبر فعلياً. */
import { pathToFileURL } from 'url';
const PWm = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
const { webkit, chromium, devices } = PWm;
const url = process.argv[2] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html';
const SHOTS = process.env.SHOTS || '';
let bad = 0, n = 0;
const ok = (c, m, x) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x).slice(0, 500) : '')); };
async function until(p, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < (ms || 30000)) { try { if (await p.evaluate(fn, arg)) return true; } catch (e) {} await p.waitForTimeout(250); } return false; }
async function boot(p) {
  await p.goto(url); await p.waitForTimeout(3000);
  await p.evaluate(() => { try { const g = document.getElementById('codis-gate'); if (g) g.remove(); } catch (e) {} navigateToPage('settings'); });
  await p.waitForTimeout(300);
}
const ready = p => until(p, () => !!(codisChx && codisChx.ready), 120000);
/* انتظار حقيقي لا مهلة ثابتة: الواجهة تطبّق الاختيار في الإطار التالي (rAF ⇒ applyT) — تحت swiftshader قد يتأخر الإطار عن 200ms */
const idle = async p => { await until(p, () => { const v = CodisChar.current(), pend = typeof codisChx !== 'undefined' && codisChx && codisChx.applyT; return !v || (!!v.cur && !pend); }, 60000); await p.evaluate(() => CodisChar.current() && CodisChar.current().queue); await p.waitForTimeout(150); };
const visParts = p => p.evaluate(() => { const v = CodisChar.current(); return v && v.cur ? v.cur.root.children.filter(o => o.isSkinnedMesh && o.visible).map(o => o.name) : []; });
async function run(label, launcher, ctxOpts) {
  const chromeArgs = process.env.CHROME_GPU ? ['--headless=new', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];
  let br; try { br = await launcher.launch(launcher === chromium ? { executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: chromeArgs } : {}); } catch (e) { console.log('SKIP ' + label + ' (' + e.message.split('\n')[0] + ')'); return; }
  /* SW_BLOCK=1: عند الاختبار على تخطيط المستودع (index.html بالجذر) يعمل sw.js ويجلب الأصل بنفسه فيتجاوز ctx.route ⇒ محاكاة فشل التنزيل لا تحدث */
  const ctx = await br.newContext(Object.assign({}, ctxOpts, process.env.SW_BLOCK ? { serviceWorkers: 'block' } : {})), p = await ctx.newPage(), errs = [];
  let assetHits = 0, failAsset = false;
  await ctx.route('**/codis_char_v73.bin', r => { assetHits++; if (failAsset) return r.fulfill({ status: 503, body: 'x' }); return r.continue(); });
  p.on('pageerror', e => errs.push(e.message));
  await boot(p);
  await p.evaluate(() => { data.profile = Object.assign({}, data.profile || {}, { name: 'اختبار', photo: 'data:image/png;base64,AAAA', photoMode: 'custom', gender: 'female' }); saveData(); });
  await p.evaluate(() => openSettingsCategory('character')); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!document.querySelector('#char-root .chp-empty')), label + ': empty state on «شخصيتي» when no character');
  const gl = await p.evaluate(() => CodisChar.available());
  console.log('INFO ' + label + ': WebGL = ' + gl + ', rIC = ' + await p.evaluate(() => typeof requestIdleCallback) + ', tier = ' + await p.evaluate(() => CodisChar.tier()) + ', DecompressionStream = ' + await p.evaluate(() => typeof DecompressionStream));
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
  ok(await p.evaluate(() => codisChx.sel.body === 'male'), label + ': new character independent of profile.gender (female profile ⇒ default male body unless chosen)');
  ok(await p.evaluate(() => document.querySelectorAll('.chx-steps li').length === 7), label + ': male flow has 7 steps (beard included)');
  if (gl) {
    const info = await p.evaluate(() => { const v = CodisChar.current(), R = v.cur; return { sub: v.q.subdiv, tris: R.RM.idx.length / 3, rv: R.RM.n, bones: R.bones.length, blink: R.BKS.some(x => Math.abs(x) > 1e-4) }; });
    ok(info.bones === 74 && info.blink && (info.sub ? info.tris > 90000 : info.tris > 20000), label + ': body = ' + (info.sub ? 'Catmull–Clark subdivided' : 'base (low tier)') + ' mesh, 74 bones, blink deltas present', info);
    const fit = await p.evaluate(() => { const v = CodisChar.current(), B = v.cur, c = v.camera, b = B.box; v.frame(0); const pts = [[0, b.min.y, 0], [0, b.max.y, 0], [b.min.x, (b.min.y + b.max.y) / 2, 0], [b.max.x, (b.min.y + b.max.y) / 2, 0]].map(q => { const V = new c.position.constructor(q[0], q[1], q[2]).project(c); return [V.x, V.y]; }); return pts.every(q => Math.abs(q[0]) <= 1 && Math.abs(q[1]) <= 1) ? 'inside' : JSON.stringify(pts); });
    ok(fit === 'inside', label + ': full body (head→feet, arms) inside the camera frame', fit);
    const cv = await p.$('canvas.ch3-cv'), bb = await cv.boundingBox(), y0 = await p.evaluate(() => CodisChar.current().yaw);
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 + 120, bb.y + bb.height / 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
    ok(Math.abs(await p.evaluate(() => CodisChar.current().yaw) - y0) > .5, label + ': drag rotates the character');
    ok(assetHits <= 1, label + ': asset downloaded once (no duplicate concurrent loads)', { assetHits });
    /* البنيات الست: أبعاد حقيقية مختلفة (نصف عرض/عمق الجذع عند الخصر، سم) */
    const measure = () => p.evaluate(() => { const R = CodisChar.current().cur, P = R.P, H = R.box.max.y; let zf = -9, zb = 9, sx = 0, cx = 0; for (let v = 0; v < 19158; v++) { if (!R.T.isBody[v]) continue; const x = P[v * 3], y = P[v * 3 + 1] / H, z = P[v * 3 + 2]; if (y > .56 && y < .64 && Math.abs(x) < .2) { zf = Math.max(zf, z); zb = Math.min(zb, z); sx = Math.max(sx, Math.abs(x)); } if (y > .7 && y < .74 && Math.abs(x) < .06) cx = Math.max(cx, z); } return [+(sx * 100).toFixed(1), +((zf - zb) * 100).toFixed(1), +(cx * 100).toFixed(1)]; });
    const W = {};
    for (const b of ['slim', 'avg', 'athl', 'musc', 'broad', 'heavy']) { await p.click('.chx-opt[data-k="build"][data-v="' + b + '"]'); await p.waitForTimeout(200); await idle(p); W[b] = await measure(); }
    const sig = Object.values(W).map(x => x.join('/'));
    ok(new Set(sig).size === 6 && W.heavy[1] > W.slim[1] + 4 && W.musc[2] > W.slim[2] + 1 && W.athl[0] < W.heavy[0], label + ': 6 male builds differ in real geometry [waist ½-width, waist depth, chest front (z)] cm', W);
    await p.click('.chx-opt[data-k="build"][data-v="avg"]'); await idle(p);
    const h0 = await p.evaluate(() => CodisChar.current().cur.box.max.y);
    await p.evaluate(() => { const i = document.querySelector('[data-sl="height"]'); i.value = 95; i.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(150); await idle(p);
    const h1 = await p.evaluate(() => CodisChar.current().cur.box.max.y);
    ok(h1 - h0 > .06 && h1 - h0 < .2 && h1 < 2.0, label + ': height slider changes real stature within a human range (m)', { h0, h1 });
    /* الملابس: الجلد تحت القماش مخفي، القطعتان ظاهرتان */
    const gar = await p.evaluate(() => { const R = CodisChar.current().cur; return { idx: R.bodyGeo.index.count, full: R.RM.idx.length, vis: R.root.children.filter(o => o.isSkinnedMesh && o.visible).map(o => o.name) }; });
    ok(gar.idx < gar.full * .8 && gar.vis.includes('tee_m') && gar.vis.includes('pants_m'), label + ': generated garments visible and covered skin not drawn', { drawn: gar.idx, full: gar.full, vis: gar.vis });
  }
  await p.click('.chx-opt[data-k="body"][data-v="female"]'); await p.waitForTimeout(300); if (gl) await idle(p);
  ok(await p.evaluate(() => codisChx.sel.body === 'female' && document.querySelectorAll('.chx-steps li').length === 6 && document.querySelectorAll('.chx-opt[data-k="build"]').length === 6), label + ': female flow has 6 steps (no beard) and 6 builds');
  if (gl) {
    const F = {};
    for (const b of ['slim', 'avg', 'athl', 'curvy', 'full', 'broad']) { await p.click('.chx-opt[data-k="build"][data-v="' + b + '"]'); await p.waitForTimeout(200); await idle(p); F[b] = await p.evaluate(() => { const R = CodisChar.current().cur, P = R.P, H = R.box.max.y; let hip = 0, waist = 0, sh = 0; for (let v = 0; v < 19158; v++) { if (!R.T.isBody[v]) continue; const x = Math.abs(P[v * 3]), y = P[v * 3 + 1] / H; if (y > .5 && y < .54 && x < .26) hip = Math.max(hip, x); if (y > .6 && y < .63 && x < .2) waist = Math.max(waist, x); if (y > .79 && y < .82 && x < .3) sh = Math.max(sh, x); } return [+(hip * 100).toFixed(1), +(waist * 100).toFixed(1), +(sh * 100).toFixed(1)]; }); }
    ok(new Set(Object.values(F).map(x => x.join('/'))).size === 6 && F.curvy[0] - F.curvy[1] > F.slim[0] - F.slim[1] && F.broad[2] > F.avg[2], label + ': 6 female builds differ [hip ½-width, waist ½-width, shoulder ½-width] cm (curvy = bigger hip-waist ratio, broad = wider shoulders)', F);
  }
  await p.click('.chx-opt[data-k="body"][data-v="male"]'); await p.waitForTimeout(300); if (gl) await idle(p);
  await p.click('[data-chx="next"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.getElementById('codis-char').dataset.step === 'skin' && document.querySelectorAll('.chx-opt.is-skin').length === 12 && document.querySelectorAll('.chx-opt.is-under').length === 4), label + ': skin step with 12 tones + 4 undertones');
  await p.click('[data-chx="next"]'); await p.waitForTimeout(gl ? 1200 : 300);
  ok(await p.evaluate(() => document.getElementById('codis-char').dataset.step === 'face' && document.querySelectorAll('.chx-opt.is-face').length === 16), label + ': face step with 16 faces');
  const picks = await p.evaluate(() => { const out = []; for (const f of CodisChar.DEFS.faces.male) { codisChxPick('face', f.id); const t = CodisChar.spec(codisChx.sel).targets, k = Object.keys(f.t)[0], key = k[0] === '*' ? 'l-' + k.slice(1) : k; out.push([f.id, codisChx.sel.face, Math.abs((t[key] || 0) - f.t[k]) < 1e-6]); } codisChxPick('face', 'm1'); return out; });
  ok(picks.every(x => x[0] === x[1] && x[2]), label + ': each of the 16 faces stays selected and maps to its own targets', picks.filter(x => !(x[0] === x[1] && x[2])));
  if (gl) {
    await until(p, () => document.querySelectorAll('.chx-opt.is-face img').length >= 3, 60000);
    ok(await p.evaluate(() => document.querySelectorAll('.chx-opt.is-face img').length >= 3), label + ': face cards get real 3D thumbnails (idle queue; Safari fallback path)', await p.evaluate(() => document.querySelectorAll('.chx-opt.is-face img').length));
    const snap = () => p.evaluate(() => { const R = CodisChar.current().cur; return { P: Array.from(R.P.subarray(0, 19158 * 3)).filter((_, i) => i % 7 === 0).slice(0, 4000), N: Array.from(R.bodyGeo.attributes.normal.array.subarray(0, 30000)).filter((_, i) => i % 5 === 0) }; });
    const a = await snap(); await p.click('.chx-opt[data-v="m2"]'); await p.waitForTimeout(200); await idle(p); const b = await snap();
    const dP = Math.max(...a.P.map((v, i) => Math.abs(v - b.P[i]))), dN = Math.max(...a.N.map((v, i) => Math.abs(v - b.N[i])));
    ok(dP > .002 && dN > .01, label + ': face preset = real mesh change + recomputed normals', { dP, dN });
    /* كل منزلق تخصيص دقيق (الوجه + الجسم) له أثر حقيقي، وفي الاتجاهين */
    const eff = await p.evaluate(async () => {
      const v = CodisChar.current(), base = Object.assign({}, codisChx.sel, { adv: '', advb: '' }), out = {};
      await v.setConfig(CodisChar.spec(base)); const P0 = Float32Array.from(v.cur.P);
      for (const [field, list] of [['adv', CodisChar.DEFS.adv], ['advb', CodisChar.DEFS.advb]]) for (const g of list) for (const it of g.items) {
        if (it.sex && it.sex !== 'male') continue;
        for (const sg of [100, -100]) { await v.setConfig(CodisChar.spec(Object.assign({}, base, { [field]: it.k + ':' + sg }))); const P = v.cur.P; let m = 0; for (let i = 0; i < P.length; i++) { const d = Math.abs(P[i] - P0[i]); if (d > m) m = d; } out[field + ':' + it.k + (sg > 0 ? '+' : '-')] = +(m * 1000).toFixed(2); }
      }
      await v.setConfig(CodisChar.spec(codisChx.sel)); return out;
    });
    const weak = Object.entries(eff).filter(([k, mm]) => !(mm >= .6));
    ok(!weak.length, label + ': every face/body slider moves the mesh ≥0.6mm (' + Object.keys(eff).length + ' directions)', weak.length ? weak : undefined);
    const cc = await p.evaluate(async () => {
      const v = CodisChar.current(), S = CodisChar.DEFS, sel = codisChx.sel, ps = [];
      for (const f of S.faces.male.slice(0, 6)) ps.push(v.setConfig(CodisChar.spec(Object.assign({}, sel, { face: f.id }))).catch(() => {}));
      const last = Object.assign({}, sel, { face: 'm7', hair: 'afro' }); ps.push(v.setConfig(CodisChar.spec(last))); await Promise.all(ps);
      const R = v.cur, vis = R.root.children.filter(o => o.isSkinnedMesh && o.visible).map(o => o.name);
      return { rigs: Object.keys(v.rigs).filter(k => k.indexOf('t:') !== 0).length, thumbRigs: Object.keys(v.rigs).filter(k => k.indexOf('t:') === 0).length, hair: vis.filter(n => /^hair_/.test(n)), turn: v.turn.children.length, visibleRigs: v.turn.children.filter(o => o.visible).length };
    });
    ok(cc.rigs <= 2 && cc.thumbRigs <= 2 && cc.hair.length === 1 && cc.hair[0] === 'hair_m_afro' && cc.turn <= 4 && cc.visibleRigs === 1, label + ': 7 concurrent setConfig ⇒ last wins, one hair, one visible rig, no duplicates', cc);
    await p.evaluate(() => codisChxPick('hair', codisChx.sel.hair)); await p.waitForTimeout(100);
  }
  await p.evaluate(() => { codisChx.sel = CodisChar.fix(Object.assign({}, codisChx.sel, { hair: 'crop' })); codisChxStep(codisChxSteps(codisChx).findIndex(s => s.key === 'beard')); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.querySelectorAll('.chx-opt.is-beard').length === 11), label + ': beard step with 11 options');
  await p.click('.chx-opt[data-k="beard"][data-v="full"]'); await p.waitForTimeout(300); if (gl) await idle(p);
  const bd = await p.evaluate(() => [codisChx.sel.hair, codisChx.sel.beard]), vis = gl ? await visParts(p) : [];
  ok(bd[0] === 'crop' && bd[1] === 'full' && (!gl || (vis.includes('hair_m_crop') && vis.includes('beard_full') && vis.some(n => /^brow_/.test(n)))), label + ': beard independent of hairstyle (hair + beard + strand brows visible)', { bd, vis });
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_2_beard.png' });
  await p.evaluate(() => codisChxStep(codisChxSteps(codisChx).length - 1)); await p.waitForTimeout(200);
  await p.click('[data-chx="next"]'); await until(p, () => !document.getElementById('codis-char'), 8000);
  const sv = await p.evaluate(() => ({ c: data.profile.character, name: data.profile.name, photo: data.profile.photo, mode: data.profile.photoMode, gender: data.profile.gender, open: !!document.getElementById('codis-char') }));
  ok(sv.c && sv.c.v === 3 && sv.c.beard === 'full' && sv.c.hair === 'crop' && sv.c.model === 'mh-cc0' && sv.c.assets === 'v73-1' && sv.name === 'اختبار' && sv.photo === 'data:image/png;base64,AAAA' && sv.mode === 'custom' && sv.gender === 'female' && !sv.open, label + ': saved v3 character; name/photo/gender untouched; creator closed', { open: sv.open, v: sv.c && sv.c.v, gender: sv.gender });
  const t1 = await p.evaluate(() => [data.profile.character.createdAt, data.profile.character.updatedAt]);
  await p.waitForTimeout(30); await p.evaluate(() => CodisChar.save(data.profile.character));
  const t2 = await p.evaluate(() => [data.profile.character.createdAt, data.profile.character.updatedAt]);
  ok(t1[0] === t2[0] && t1[1] === t2[1], label + ': re-saving an unchanged character keeps createdAt and updatedAt', { t1, t2 });
  await p.evaluate(() => { localStorage.removeItem('codis_x'); }); await p.reload(); await p.waitForTimeout(3000);
  const rl = await p.evaluate(() => data.profile && data.profile.character);
  ok(rl && rl.v === 3 && rl.beard === 'full' && rl.build && rl.skin && rl.under, label + ': survives reload (normalizer keeps v3 fields)', rl);
  await p.evaluate(() => { try { const g = document.getElementById('codis-gate'); if (g) g.remove(); } catch (e) {} navigateToPage('settings'); openSettingsCategory('character'); }); await p.waitForTimeout(gl ? 5000 : 500);
  const pg = await p.evaluate(() => ({ secs: document.querySelectorAll('#char-root .chp-sec').length, dts: [...document.querySelectorAll('#char-root .chp-info dt')].map(x => x.textContent), canv: document.querySelectorAll('canvas.ch3-cv').length, sync: (document.querySelector('.chp-sync') || {}).textContent }));
  ok(pg.secs === 3 && pg.dts.includes('البنية') && pg.dts.includes('البشرة') && pg.dts.includes('اللحية') && (!gl || pg.canv === 1) && /محفوظة/.test(pg.sync || ''), label + ': «شخصيتي» shows all categories + one viewer + honest sync state', pg);
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_3_page.png', fullPage: false });
  await p.evaluate(() => navigateToPage('tasks')); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelectorAll('canvas.ch3-cv').length === 0 && !CodisChar.current()), label + ': leaving the page disposes the viewer');
  /* الترحيل: V71 ⇒ V72 ⇒ V73 و V72 ⇒ V73 (جداول صريحة؛ لا إعادة إنشاء) */
  const mg1 = await p.evaluate(() => CodisChar.fix({ v: 1, body: 'male', face: 'm3', hair: 'parted_beard', color: 'copper', model: 'ubc-std', assets: 'v71-1', createdAt: 1, updatedAt: 2 }));
  ok(mg1.v === 3 && mg1.face === 'm8' && mg1.hair === 'side_part' && mg1.beard === 'full' && mg1.hairColor === 'copper', label + ': V71 character migrated to equivalent V73 choices (not reset)', mg1);
  const mg2 = await p.evaluate(() => CodisChar.fix({ v: 2, body: 'male', build: 'broad', height: 70, face: 'm5', eyeShape: 'hooded', eyes: 'bluegreen', brows: 'eyebrow006', skin: 's7', hair: 'short04', hairColor: 'chestnut', beard: 'goatee', beardColor: 'black', adv: 'fw:40,sh:30,be:-20,cbL:15', sym: false }));
  ok(mg2.build === 'broad' && mg2.height === 70 && mg2.face === 'm5' && mg2.eyeShape === 'hooded' && mg2.eyes === 'graygreen' && mg2.brows === 'brow_06' && mg2.skin === 's8' && mg2.hair === 'slick_back' && mg2.hairColor === 'chestnut' && mg2.beard === 'goatee' && mg2.beardColor === 'black' && mg2.adv === 'cbL:15,fw:40' && mg2.advb === 'be:-20,sh:30' && mg2.sym === false, label + ': V72 character migrated field by field (ids kept/mapped, body sliders moved to advb)', mg2);
  const mgf = await p.evaluate(() => CodisChar.fix({ v: 2, body: 'female', build: 'curvyish', face: 'f9', hair: 'bob01', skin: 's9', eyes: 'grey', brows: 'eyebrow011' }));
  ok(mgf.build === 'avg' && mgf.face === 'f9' && mgf.hair === 'lob' && mgf.skin === 's11' && mgf.eyes === 'gray' && mgf.brows === 'brow_11', label + ': V72 female migrated; unknown build ⇒ default only for that field', mgf);
  const uk = await p.evaluate(() => CodisChar.fix({ v: 3, body: 'female', face: 'f99', hair: 'zzz', skin: 's1', eyes: 'nope', under: 'q', adv: 'fw:40,xx:9,ed:500', advb: 'pc:50,bp:30', sym: false }));
  ok(uk.face === 'f1' && uk.hair === 'long_straight' && uk.skin === 's1' && uk.eyes === 'brown' && uk.under === 'n' && uk.adv === 'ed:100,fw:40' && uk.advb === 'bp:30' && uk.sym === false, label + ': unknown ids ⇒ defaults per field; adv sanitized; male-only body slider dropped for female', uk);
  if (gl) {
    for (let i = 0; i < 4; i++) { await p.evaluate(() => codisCharOpen('edit')); await p.waitForTimeout(900); await p.evaluate(() => codisChxClose(false)); await p.waitForTimeout(350); }
    ok(await p.evaluate(() => document.querySelectorAll('canvas.ch3-cv').length === 0 && !CodisChar.current()), label + ': open/close ×4 ⇒ no leftover canvases/views');
  }
  ok(!errs.length, label + ': no page errors', errs.slice(0, 5));
  await br.close();
}
if (!process.env.NO_WEBKIT) await run('webkit-iphone12', webkit, { ...devices['iPhone 12'] });
if (!process.env.NO_CHROME) await run('chromium-desktop', chromium, { viewport: { width: 1280, height: 860 } });
console.log((bad ? 'FAILED ' : 'PASSED ') + (n - bad) + '/' + n);
process.exit(bad ? 1 : 0);
