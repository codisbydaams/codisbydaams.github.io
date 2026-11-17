/* CODIS-V64 — ثيم «الخشب المعتّق»: النظام (متجر/معاينة/شراء/بحوزتك/تجهيز/إزالة/إعادة تحميل) · التفاعل (ماوس حقيقي + لمس/قلم بـPointer Events) · الصوت (المحصور بالأسطح) · الأداء.
   WebKit حقيقي (محاكاة iPhone 12، لمس مفعّل). Run:  PW=<path to playwright-core/index.mjs> node tests/v64_browser.mjs [app.html]
   RUNS="paper:375,dark:320" · SHOTS=<dir>. لمس الإصبع يُحاكى بـPointerEvent(pointerType:'touch') مُرسَل للعنصر (Playwright WebKit لا يولّد Pointer Events من touchscreen) — يُذكر كمحاكاة.
   الصوت: يُسجَّل كل استدعاء لـCodisAudio.play مع المفتاح الذي يختاره المحرك فعلاً (trace) إن كان سياق الصوت يعمل، وإلا المفتاح المحسوب بنفس القاعدة. */
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = process.argv[2] || path.join(ROOT, 'app/CODIS_FINAL.html');
const SHOTS = process.env.SHOTS || ''; if (SHOTS) fs.mkdirSync(SHOTS, { recursive:true });
const { webkit, devices } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = p === '/app/CODIS_FINAL.html' ? APP : path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':{ '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml', '.js':'text/javascript' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/app/CODIS_FINAL.html';
let pass = 0, fail = 0; const ok = (n, c, info) => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + n + (!c && info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 900) : '')); };
async function open(w, theme){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v64t-'));
  const ctx = await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'], viewport:{ width:w, height:760 }, screen:{ width:w, height:760 } });
  await ctx.addInitScript(() => { window.CODIS_B3D_OFF = true; });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); }
    await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t), theme === 'dark' ? 'dark' : 'paper').catch(() => {}); await page.waitForTimeout(300);
    await page.evaluate(() => { CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {}; codisConfirm = async () => true;
      /* سجل الصوت: الاسم + النطاق + المفتاح المختار (نفس قاعدة المحرك) + هل صدر فعلاً */
      window.__snd = []; const P = CodisAudio.play;
      CodisAudio.play = function(name, opts){ const sc = CodisAudio.scope ? CodisAudio.scope() : null, o = opts || {}, def = k => !!CodisAudio.def(k);
        const key = (sc && def(name + '@' + sc)) ? name + '@' + sc : (o.ctx && def(name + '@' + o.ctx)) ? name + '@' + o.ctx : name; const r = P.apply(this, arguments); window.__snd.push({ name, key, sc, ok:r }); return r; }; }); };
  await boot();
  return { page, errs, boot, until, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const shot = async (p, name, sel) => { if (!SHOTS) return; try { if (sel) { const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(350); await el.screenshot({ path:path.join(SHOTS, name + '.png') }); return; } } await p.screenshot({ path:path.join(SHOTS, name + '.png') }); } catch (e) { console.log('shot ' + name + ': ' + e.message); } };
const nav = async (p, pg) => { await p.evaluate(pg => { try { econCloseStore({ silent:true }); } catch (e) {} const b = document.querySelector('.navbtn[data-page="' + pg + '"]'); if (b) b.click(); }, pg); await p.waitForTimeout(700); };
const IDS = { planning:'agedWoodPlanning', operations:'agedWoodOperations', teacher:'agedWoodTeacher' };
const setEq = (p, tg, on) => p.evaluate(([t, id, o]) => { const P = CodisPlanThemes; const r = o ? P.equip(id, 'own') : P.unequip(t, 'own'); codisPlanThemeApply(t); return r && r.ok; }, [tg, IDS[tg], on]);
const snd = p => p.evaluate(() => { const s = window.__snd; window.__snd = []; return s; });
/* لمس/قلم: Pointer Events حقيقية الشكل تُرسَل للعنصر عند نقطة داخل صندوقه */
const ptr = (p, sel, type, kind, fx = .5, fy = .5, id = 7) => p.evaluate(([sel, type, kind, fx, fy, id]) => { const el = typeof sel === 'string' ? document.querySelector(sel) : null; if (!el) return null; const r = el.getBoundingClientRect(), x = r.left + r.width * fx, y = r.top + r.height * fy;
  const t = document.elementFromPoint(x, y) || el; const e = new PointerEvent(type, { bubbles:true, cancelable:true, composed:true, pointerId:id, pointerType:kind, isPrimary:true, clientX:x, clientY:y, buttons:type === 'pointerup' ? 0 : 1 }); t.dispatchEvent(e); return { x, y, prevented:e.defaultPrevented, target:t.className && t.className.baseVal === undefined ? String(t.className).slice(0, 40) : t.tagName }; }, [sel, type, kind, fx, fy, id]);
const raf = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const fxState = (p, hostSel) => p.evaluate(sel => { const h = document.querySelector(sel); if (!h) return null; const fx = h.querySelector(':scope > .aw-fx, :scope > .pt-decor > .aw-fx'); const r = h.getBoundingClientRect();
  return { lit:h.classList.contains('aw-lit'), touch:h.classList.contains('aw-touch'), fx:!!fx, on:!!fx && fx.classList.contains('is-on'), tch:!!fx && fx.classList.contains('is-touch'), ring:!!fx && fx.classList.contains('is-ring'),
    x:fx ? parseFloat(fx.style.getPropertyValue('--aw-x')) : NaN, y:fx ? parseFloat(fx.style.getPropertyValue('--aw-y')) : NaN, w:r.width, h:r.height, glowOp:fx ? getComputedStyle(fx.querySelector('.aw-glow')).opacity : null }; }, hostSel);

const RUNS = (process.env.RUNS || 'paper:375,dark:320').split(',').map(x => x.split(':'));
for (let ri = 0; ri < RUNS.length; ri++) {
  const [theme, w] = RUNS[ri], T = theme + ' ' + w + ': ', tag = theme + w, full = ri === 0;
  const o = await open(+w, theme); const p = o.page;
  await p.evaluate(() => CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 40000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; }));

  // ================= (1) نظام الثيمات =================
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1300);
  await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true, top:true }); econCosSetSub('themes'); }); await p.waitForTimeout(700);
  const st = await p.evaluate(() => { const f = document.querySelector('#eco-store-body .pt-fam[data-family="agedWood"]'); if (!f) return { none:true };
    return { ar:f.querySelector('.pt-fam-ar').textContent, en:f.querySelector('.pt-fam-en').textContent, desc:(f.querySelector('.pt-fam-desc') || {}).textContent || '', tiles:[...f.querySelectorAll('.pt-mtile')].map(t => t.dataset.ptid + ':' + t.dataset.ptTarget + ':' + !!t.querySelector('.pt-stage.is-mini .aw-decor .aw-wood') + ':' + t.querySelector('.pt-mbadge').textContent.replace(/\s/g, '')),
      order:[...document.querySelectorAll('#eco-store-body .pt-fam')].map(x => x.dataset.family), defs:CodisPlanThemes.defs().filter(d => d.family === 'agedWood').map(d => d.silver + d.rarityAr + d.art + d.sound), ids:[...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i).slice(0, 5) }; });
  ok(T + 'S1 family «الخشب المعتّق» (Aged Wood) in the store with its description, after the existing families', st.ar === 'الخشب المعتّق' && /aged wood/i.test(st.en) && /عالم من الحرفية الخشبية العتيقة/.test(st.desc) && /قبل عقود طويلة/.test(st.desc) && st.order.join() === 'infernoCrystal,frostCrystal,agedWood', st);
  ok(T + 'S2 three room products with mini previews (wood layer) and the 7,999 silver price, legendary', st.tiles.length === 3 && ['agedWoodPlanning:planning', 'agedWoodOperations:operations', 'agedWoodTeacher:teacher'].every((x, i) => st.tiles[i].indexOf(x + ':true:') === 0) && st.tiles.every(t => /7,999|٧٬٩٩٩|7999/.test(t)) && st.defs.every(d => d === '7999أسطوريagedWoodagedWood'), st);
  ok(T + 'S3 no duplicate element ids in the store', !st.ids.length, st.ids);
  const same = await p.evaluate(() => { const b = document.getElementById('eco-store-body'); econRenderStore(); const h0 = b._codisHtml; econRenderStore(); return h0 === b._codisHtml && h0.indexOf('aw-wood') > 0; });
  ok(T + 'S4 store HTML identical across renders (deterministic art ⇒ DOM reuse kept)', same);
  await shot(p, tag + '_store_family', '#eco-store-body .pt-fam[data-family="agedWood"]');
  // المعاينة الكبيرة
  await p.click('#eco-store-body .pt-mtile[data-ptid="agedWoodOperations"] .pt-mbtn'); await p.waitForTimeout(800);
  const pv = await p.evaluate(() => { const ov = document.querySelector('.pt-ov'); if (!ov) return { none:true }; return { fam:ov.dataset.ptFam, name:ov.querySelector('.pt-ov-name').textContent, slides:ov.querySelectorAll('.pt-slide').length, wood:ov.querySelectorAll('.pt-slide .aw-decor').length, items:ov.querySelectorAll('.pt-slide .pt-scope[data-pt="agedWoodOperations"] .task-item').length, desc:ov.querySelector('.pt-ov-desc').textContent, act:ov.querySelector('.pt-ov-act').dataset.act }; });
  ok(T + 'S5 big preview: wood family window, all room surfaces as slides (box/rectangles/clear box), buy action', pv.fam === 'agedWood' && pv.slides === 3 && pv.wood >= 2 && pv.items === 2 && /ورشة/.test(pv.desc) && pv.act === 'buy', pv);
  await shot(p, tag + '_preview_ops', '.pt-ov .pt-ov-card');
  if (full) { await p.evaluate(() => codisPtSlideStep(1)); await p.waitForTimeout(400); await shot(p, tag + '_preview_ops_tasks', '.pt-ov .pt-ov-card'); }
  // صوت المعاينة: لا خشب
  await snd(p); await p.click('.pt-ov .pt-slide-nav.is-next').catch(() => {}); await p.waitForTimeout(150);
  const pvS = await snd(p);
  ok(T + 'A1 no wood sounds inside the theme preview window', pvS.every(x => !/@agedWood/.test(x.key) && !x.sc), pvS);
  // الشراء من النافذة
  const s0 = await p.evaluate(() => CodisWallet.silverBalance());
  await p.click('.pt-ov .pt-ov-act'); await p.waitForTimeout(900);
  const by = await p.evaluate(s0 => ({ paid:s0 - CodisWallet.silverBalance(), own:CodisPlanThemes.owns('agedWoodOperations'), eq:CodisPlanThemes.isEquipped('agedWoodOperations'), act:(document.querySelector('.pt-ov .pt-ov-act') || {}).dataset }), s0);
  ok(T + 'S6 buying with silver: 7,999 charged once, owned, not auto-equipped', by.paid === 7999 && by.own && !by.eq, by);
  await p.evaluate(() => { codisPlanThemePreviewClose(true); ['agedWoodPlanning', 'agedWoodTeacher'].forEach(id => CodisPlanThemes.buy(id)); econRenderAll(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { econOpenVault(); }); await p.waitForTimeout(1200); await p.evaluate(() => econOwnSetPart('cosmetics')); await p.waitForTimeout(500);
  const inv = await p.evaluate(() => [...document.querySelectorAll('#own-plan-themes .pt-fam[data-family="agedWood"] .pt-mtile')].map(t => t.dataset.ptid));
  ok(T + 'S7 all three appear in «بحوزتك» ← المظاهر under the wood family', inv.length === 3, inv);
  await p.evaluate(() => { econCloseOwn(); econCloseStore({ silent:true }); }); await p.waitForTimeout(300);

  // التخطيط (بلا خطة): تجهيز ← المربع ملبّس فقط
  await nav(p, 'planning');
  ok(T + 'S8 equip on planning', await setEq(p, 'planning', true));
  const pl = await p.evaluate(() => { const b = document.querySelector('#planning-empty > .empty-state'); const others = ['#tasks-empty > .empty-state', '#day-task-list', '#learn-empty > .empty-state', '#learn-day-task-list'].map(s => (document.querySelector(s) || {}).getAttribute ? document.querySelector(s).getAttribute('data-pt') : null);
    const cs = getComputedStyle(b), t = b.querySelector('.es-title'), c = b.querySelector('.es-copy'), btn = b.querySelector('.btn');
    return { pt:b.getAttribute('data-pt'), surf:b.getAttribute('data-pt-surface'), decor:!!b.querySelector(':scope > .pt-decor.aw-decor .aw-wood path.g-d'), motif:!!b.querySelector('.aw-motif'), corners:b.querySelectorAll('.aw-corner').length, others, bodyBg:getComputedStyle(document.body).backgroundImage.slice(0, 40), nav:getComputedStyle(document.querySelector('.navbtn')).backgroundImage.indexOf('svg') < 0,
      title:getComputedStyle(t).color, copy:getComputedStyle(c).color, btnTx:getComputedStyle(btn).color }; });
  ok(T + 'S9 planning box dressed in wood (grain, motif, 4 brass corners); other rooms, body and nav untouched', pl.pt === 'agedWoodPlanning' && pl.surf === 'emptyState' && pl.decor && pl.motif && pl.corners === 4 && pl.others.every(x => !x), pl);
  await shot(p, tag + '_planning_box', '#planning-empty > .empty-state');

  // ================= (2) التفاعل — ماوس حقيقي =================
  if (full) {
    const bb = await p.evaluate(() => { const r = document.querySelector('#planning-empty > .empty-state').getBoundingClientRect(); return { x:r.left, y:r.top, w:r.width, h:r.height }; });
    await p.mouse.move(bb.x + bb.w * .3, bb.y + bb.h * .4); await p.mouse.move(bb.x + bb.w * .32, bb.y + bb.h * .42); await raf(p); await p.waitForTimeout(450);
    const m1 = await fxState(p, '#planning-empty > .empty-state');
    ok(T + 'M1 mouse over the wood: amber light on, follows the cursor position', m1 && m1.lit && m1.on && Math.abs(m1.x - bb.w * .32) < 3 && Math.abs(m1.y - bb.h * .42) < 3 && +m1.glowOp > .9, m1);
    await p.mouse.move(bb.x + bb.w * .75, bb.y + bb.h * .6); await raf(p);
    const m2 = await fxState(p, '#planning-empty > .empty-state');
    ok(T + 'M2 light moves with the cursor', Math.abs(m2.x - bb.w * .75) < 3 && Math.abs(m2.y - bb.h * .6) < 3, m2);
    await shot(p, tag + '_planning_mouse', '#planning-empty > .empty-state');
    await p.mouse.move(bb.x + bb.w / 2, bb.y - 40); await raf(p); await p.waitForTimeout(500);
    const m3 = await fxState(p, '#planning-empty > .empty-state');
    ok(T + 'M3 cursor leaves ⇒ surface returns to rest smoothly (light fades out)', !m3.lit && !m3.on && +m3.glowOp < .05, m3);
  }

  // ================= (3) الصوت: زر «ابدأ بناء الخطة» داخل السطح الملبّس =================
  await snd(p); await p.click('#planning-empty > .empty-state .btn'); await p.waitForTimeout(500);
  const a2 = await snd(p); const ui = a2.filter(x => /^(press|tab|confirm|open|close|success|task|pen|nav)/.test(x.name));
  ok(T + 'A2 «ابدأ بناء الخطة» inside the wood box ⇒ a wooden sound, no plain sound mixed in', ui.length >= 1 && ui.some(x => /@agedWood$/.test(x.key)) && ui.filter(x => x.ok !== false).every(x => /@agedWood$/.test(x.key) || !x.sc) && ui.filter(x => /@agedWood$/.test(x.key)).length <= 2, ui);
  const audioOn = await p.evaluate(() => CodisAudio.stats().state);
  if (full) console.log('     audio context state in WebKit: ' + audioOn + ' · played keys: ' + JSON.stringify(ui.filter(x => x.ok).map(x => x.key)));
  // كتابة الخطة + التوزيع ⇒ مربع الكتابة وبطاقة الخطة ملبّستان
  await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms));
    const L = n => Array.from({ length:n }, (_, i) => (i + 1) + '- ' + ['مراجعة تقرير المبيعات الأسبوعي للفريق', '!اجتماع فريق العمليات لمراجعة خطة الربع', 'اتصال بالعائلة', 'قراءة الفصل الثالث من كتاب الإدارة', 'حل تمارين الرياضيات', 'مراجعة المفردات الجديدة'][i % 6] + ' ' + (i + 1)).join('\n');
    const ti = document.getElementById('plan-tasks-input'); ti.value = L(21); ti.dispatchEvent(new Event('input', { bubbles:true }));
    const li = document.getElementById('plan-learn-input'); li.value = L(21); li.dispatchEvent(new Event('input', { bubbles:true })); codisPlanThemeApply('planning'); await sleep(200); });
  const wb = await p.evaluate(() => [...document.querySelectorAll('#plan-editor .write-box')].map(e => e.getAttribute('data-pt') + ':' + !!e.querySelector(':scope > .pt-decor.aw-decor')));
  ok(T + 'S10 plan write boxes dressed (panel surface)', wb.length >= 1 && wb.every(x => x === 'agedWoodPlanning:true'), wb);
  if (full) await shot(p, tag + '_writebox', '#plan-editor');
  await p.evaluate(async () => { distributePlan(); await new Promise(r => setTimeout(r, 900)); }); await nav(p, 'planning');
  const card = await p.evaluate(() => { const c = document.querySelector('#planning-active > .plan-card'); return c && { pt:c.getAttribute('data-pt'), decor:!!c.querySelector(':scope > .pt-decor.aw-decor'), name:getComputedStyle(c.querySelector('.plan-name')).color }; });
  ok(T + 'S11 active plan card dressed in wood', card && card.pt === 'agedWoodPlanning' && card.decor, card);
  await shot(p, tag + '_plan_card', '#planning-active > .plan-card');
  await snd(p); await p.click('#planning-active > .plan-card .plan-cta .btn'); await p.waitForTimeout(400);
  const a3 = (await snd(p)).filter(x => /^(press|tab|confirm|open|close|success)/.test(x.name));
  ok(T + 'A3 «أضف للخطة» on the wood plan card ⇒ wooden press', a3.some(x => /@agedWood$/.test(x.key)) && a3.filter(x => x.ok !== false).every(x => /@agedWood$/.test(x.key)), a3);
  await p.evaluate(() => { try { cancelExtendPlan && cancelExtendPlan(); } catch (e) {} }); await nav(p, 'planning');
  // زر التنقل العام خارج السطح
  await snd(p); await p.click('.navbtn[data-page="tasks"]'); await p.waitForTimeout(500);
  const a4 = await snd(p);
  ok(T + 'A4 bottom navigation (outside any wood surface) keeps its original sound', a4.length >= 0 && a4.every(x => !/@agedWood/.test(x.key) && !x.sc), a4);

  // ================= العمليات =================
  ok(T + 'S12 equip on operations', await setEq(p, 'operations', true));
  await nav(p, 'tasks');
  const ops = await p.evaluate(() => { const L = document.getElementById('day-task-list'), it = L.querySelector(':scope > .task-item'); if (!it) return { none:true }; const cs = getComputedStyle(it);
    return { pt:L.getAttribute('data-pt'), grain:/data:image\/svg/.test(cs.backgroundImage), iso:cs.isolation, txt:getComputedStyle(it.querySelector('.task-text')).color, n:L.querySelectorAll(':scope > .task-item').length, ta:cs.touchAction, plan:document.querySelector('#planning-active > .plan-card').getAttribute('data-pt') }; });
  ok(T + 'S13 operations rectangles dressed (wood grain texture), planning still dressed separately', ops.pt === 'agedWoodOperations' && ops.grain && ops.iso === 'isolate' && ops.n > 0 && ops.plan === 'agedWoodPlanning', ops);
  const css64 = await p.evaluate(() => (document.getElementById('codis-v64-css') || {}).textContent || '');
  ok(T + 'T0 the theme adds no touch-action lock (rectangles keep the app own value; vertical pan allowed)', !/touch-action/.test(css64) && /pan-y|auto|manipulation/.test(ops.ta) && !/none/.test(ops.ta), ops.ta);
  await shot(p, tag + '_ops_items', '#day-task-list');

  // ================= (2) التفاعل — لمس/قلم (Pointer Events) =================
  const IT = '#day-task-list > .task-item';
  const d1 = await ptr(p, IT, 'pointerdown', 'touch', .3, .3); await raf(p);
  const t1 = await fxState(p, IT);
  ok(T + 'T1 touch down on a wood rectangle ⇒ warm light at the touch point + ripple + slight press', t1.lit && t1.touch && t1.on && t1.tch && t1.ring && Math.abs(t1.x - t1.w * .3) < 3 && Math.abs(t1.y - t1.h * .3) < 3 && !d1.prevented, { t1, d1 });
  await ptr(p, IT, 'pointermove', 'touch', .7, .5); await raf(p);
  const t2 = await fxState(p, IT);
  ok(T + 'T2 the light follows the finger inside the surface', Math.abs(t2.x - t2.w * .7) < 3 && Math.abs(t2.y - t2.h * .5) < 3 && t2.on, t2);
  await shot(p, tag + '_ops_touch', IT);
  await ptr(p, IT, 'pointerup', 'touch', .7, .5); await raf(p); await p.waitForTimeout(450);
  const t3 = await fxState(p, IT);
  ok(T + 'T3 finger up ⇒ back to rest (no stuck press / light)', !t3.lit && !t3.touch && !t3.on && !t3.tch && +t3.glowOp < .05, t3);
  await ptr(p, IT, 'pointerdown', 'pen', .5, .5, 9); await raf(p);
  const t4a = await fxState(p, IT); await ptr(p, IT, 'pointercancel', 'pen', .5, .5, 9); await raf(p);
  const t4 = await fxState(p, IT);
  ok(T + 'T4 pen down then pointercancel (browser takes the gesture for scrolling) ⇒ everything restored', t4a.on && t4a.touch && !t4.lit && !t4.touch && !t4.on, { t4a, t4 });
  const sb = IT + ' .stat-btn.stat-done';
  await ptr(p, sb, 'pointerdown', 'touch', .5, .5, 11);
  const k1 = await p.evaluate(s => { const b = document.querySelector(s); return { press:b.classList.contains('aw-press'), tr:getComputedStyle(b).transform }; }, sb);
  await ptr(p, sb, 'pointerup', 'touch', .5, .5, 11);
  const k2 = await p.evaluate(s => document.querySelector(s).classList.contains('aw-press'), sb);
  ok(T + 'T5 a status key pressed by touch sinks like a wooden piece, and comes back on release', k1.press && k1.tr !== 'none' && !k2, { k1, k2 });
  await ptr(p, IT, 'pointerdown', 'touch', .5, .5, 13); const out = await ptr(p, IT, 'pointermove', 'touch', .5, 3.5, 13); await raf(p);
  const t6 = await fxState(p, IT); await ptr(p, IT, 'pointerup', 'touch', .5, 3.5, 13);
  ok(T + 'T6 finger slides outside the wood ⇒ effect stops at the border (nothing outside)', !t6.on && !t6.lit && !out.prevented, t6);
  const sc = await p.evaluate(async () => { const L = document.getElementById('day-task-list'), it = L.querySelector('.task-item'); const r = it.getBoundingClientRect();
    const te = new Event('touchmove', { bubbles:true, cancelable:true }); it.dispatchEvent(te);
    const pe = new PointerEvent('pointermove', { bubbles:true, cancelable:true, pointerType:'touch', pointerId:21, clientX:r.left + 5, clientY:r.top + 5 }); it.dispatchEvent(pe);
    const m = [document.querySelector('.main'), document.querySelector('#page-tasks'), document.scrollingElement].find(x => x && x.scrollHeight > x.clientHeight + 20) || document.scrollingElement, y0 = m.scrollTop; m.scrollTop = y0 + 120; await new Promise(r => requestAnimationFrame(r)); const y1 = m.scrollTop; m.scrollTop = y0;
    return { touchPrevented:te.defaultPrevented, ptrPrevented:pe.defaultPrevented, scrolled:y1 - y0 }; });
  ok(T + 'T7 vertical scrolling over the wood is never blocked (no preventDefault on touch/pointer moves, page still scrolls)', !sc.touchPrevented && !sc.ptrPrevented && sc.scrolled > 0, sc);

  // ================= (3) الصوت: أزرار الحالة داخل مستطيل العمليات =================
  const stat = async (kind) => { await snd(p); const id = await p.evaluate(() => { const it = [...document.querySelectorAll('#day-task-list > .task-item')].find(x => !x.classList.contains('is-done') && !x.classList.contains('is-none') && !x.classList.contains('is-half')); return it && it.getAttribute('data-tid'); });
    if (!id) return { none:true }; await p.click('#day-task-list > .task-item[data-tid="' + id + '"] .stat-btn.stat-' + kind); await p.waitForTimeout(250);
    if (kind === 'half') { const c = await p.$('#day-task-list > .task-item[data-tid="' + id + '"] :is(.half-ok, .hp-ok, [data-act="ok"], .btn-primary)'); if (c) { await c.click(); await p.waitForTimeout(250); } }
    await p.waitForTimeout(1600); return (await snd(p)).filter(x => x.ok !== false || true); };
  const sDone = await stat('done'), sNone = await stat('x');
  const keysOf = a => (a.none ? [] : a).filter(x => /^(task|pen|press|tab|confirm)/.test(x.name)).map(x => x.key);
  ok(T + 'A5 «خلصتها» in a wood rectangle ⇒ wooden done sound (+ carving layers), no plain UI sound', keysOf(sDone).indexOf('task.done@agedWood') !== -1 && keysOf(sDone).every(k => /@agedWood$/.test(k)), keysOf(sDone));
  ok(T + 'A6 «ما سويتها» ⇒ a different wooden sound (state meaning kept)', keysOf(sNone).indexOf('task.none@agedWood') !== -1 && keysOf(sNone).every(k => /@agedWood$/.test(k)), keysOf(sNone));
  if (full) {
    const rn = await p.evaluate(async () => { const names = CodisAudio.events().filter(k => /@agedWood$/.test(k)).map(k => k.replace('@agedWood', '')); const out = {};
      for (const n of names){ try{ const buf = await CodisAudio.render(n, { ctx:'agedWood', dur:.3, kind:'check', pct:50 }, 1.6); let pk = 0; for (let c = 0; c < buf.numberOfChannels; c++){ const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if (a > pk) pk = a; } } out[n] = +pk.toFixed(4); }catch(e){ out[n] = 'ERR ' + e.message; } }
      return out; });
    const vals = Object.values(rn);
    if (vals.every(v => /no offline/.test(String(v)))) console.log('SKIP ' + T + 'A0 offline audio render — this WebKit build has no OfflineAudioContext (covered by tests/woodsound_browser.js in Chrome)');
    else ok(T + 'A0 every wood sound renders through the existing engine (audible, no clipping): ' + Object.keys(rn).length + ' sounds', vals.length >= 16 && vals.every(v => typeof v === 'number' && v > .002 && v < .95), rn);
  }
  // كتم الصوت
  await p.evaluate(() => { data.settings.sound.enabled = false; CodisAudio.applySettings(); }); await snd(p);
  await nav(p, 'planning'); await p.click('#planning-active > .plan-card .pm-btn').catch(() => {}); await p.waitForTimeout(300);
  const mute = await p.evaluate(() => ({ played:window.__snd.filter(x => x.ok).length, trace:CodisAudio.trace().filter(t => Date.now() - 0 && true).length })); await p.evaluate(() => { try { codisConfirmClose && codisConfirmClose(); } catch (e) {} document.querySelectorAll('.modal-overlay[aria-hidden="false"] .btn-secondary').forEach(b => b.click()); });
  ok(T + 'A7 app sound disabled ⇒ the wood theme stays silent', mute.played === 0, mute);
  await p.evaluate(() => { data.settings.sound.enabled = true; CodisAudio.applySettings(); }); await p.waitForTimeout(200);
  // ضغطات سريعة: لا تكدس
  await nav(p, 'planning'); await snd(p);
  for (let k = 0; k < 6; k++) await p.click('#planning-active > .plan-card .plan-cta .btn', { delay:0 }).catch(() => {});
  await p.waitForTimeout(300);
  const fast = await snd(p), wp = fast.filter(x => /^press/.test(x.name)), played = wp.filter(x => x.ok);
  const vs = await p.evaluate(() => CodisAudio.stats().voices);
  ok(T + 'A8 rapid presses: at most one press sound per real activation, cooldown prevents stacking', wp.length <= 6 && played.length <= 6 && vs <= 12 && wp.every(x => /@agedWood$/.test(x.key)), { n:wp.length, played:played.length, vs });
  await p.evaluate(() => { try { cancelExtendPlan(); } catch (e) {} }); await nav(p, 'planning');
  // لوحة المفاتيح: Enter ⇒ صوت واحد
  await snd(p); await p.focus('#planning-active > .plan-card .plan-cta .btn'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  const kb = (await snd(p)).filter(x => /^(press|tab|confirm)/.test(x.name));
  ok(T + 'A9 keyboard activation inside the wood ⇒ one wooden sound', kb.length === 1 && /@agedWood$/.test(kb[0].key), kb);
  await p.evaluate(() => { try { cancelExtendPlan(); } catch (e) {} }); await nav(p, 'planning');
  // الإزالة ⇒ الصوت الأصلي ولا طبقات معلّقة
  ok(T + 'S14 unequip planning', await setEq(p, 'planning', false));
  const un = await p.evaluate(() => ({ attr:[...document.querySelectorAll('[data-pt="agedWoodPlanning"]')].filter(e => !e.closest('.pt-stage, .pt-ov, .pt-mtile')).length, fx:document.querySelectorAll('#page-planning .aw-fx, #page-planning .aw-decor').length, lit:document.querySelectorAll('#page-planning .aw-lit, #page-planning .aw-press').length, ops:document.getElementById('day-task-list').getAttribute('data-pt') }));
  ok(T + 'S15 removal restores the planning surfaces completely (no wood layers/classes left), operations untouched', !un.attr && !un.fx && !un.lit && un.ops === 'agedWoodOperations', un);
  await snd(p); await p.click('#planning-active > .plan-card .plan-cta .btn'); await p.waitForTimeout(300);
  const a10 = (await snd(p)).filter(x => /^(press|tab|confirm|open)/.test(x.name));
  ok(T + 'A10 after removal the same button plays its original sound (no wood)', a10.length >= 1 && a10.every(x => !/@agedWood/.test(x.key) && !x.sc), a10);
  await p.evaluate(() => { try { cancelExtendPlan(); } catch (e) {} });

  // ================= الأستاذ + إعادة التحميل =================
  ok(T + 'S16 equip on teacher', await setEq(p, 'teacher', true));
  await nav(p, 'learn');
  const lr = await p.evaluate(() => { const L = document.getElementById('learn-day-task-list'), it = L.querySelector(':scope > .task-item'); return { pt:L.getAttribute('data-pt'), grain:!!it && /data:image\/svg/.test(getComputedStyle(it).backgroundImage) }; });
  ok(T + 'S17 teacher rectangles dressed (manuscript page in a wooden frame)', lr.pt === 'agedWoodTeacher' && lr.grain, lr);
  await shot(p, tag + '_learn_items', '#learn-day-task-list');
  await setEq(p, 'planning', true);
  await o.boot(); await p.waitForTimeout(800); await nav(p, 'planning'); await nav(p, 'tasks'); await nav(p, 'learn');
  const rl = await p.evaluate(() => ({ eq:CodisPlanThemes.equippedMap(), card:(document.querySelector('#planning-active > .plan-card') || {}).getAttribute && document.querySelector('#planning-active > .plan-card').getAttribute('data-pt'), ops:document.getElementById('day-task-list').getAttribute('data-pt'), learn:document.getElementById('learn-day-task-list').getAttribute('data-pt') }));
  ok(T + 'S18 equipped wood themes persist after reload (all three rooms)', rl.eq.planning === 'agedWoodPlanning' && rl.eq.operations === 'agedWoodOperations' && rl.eq.teacher === 'agedWoodTeacher' && rl.card === 'agedWoodPlanning' && rl.ops === 'agedWoodOperations' && rl.learn === 'agedWoodTeacher', rl);

  // ================= الأداء/الاستقرار =================
  if (full) {
    const churn = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const t0 = performance.now();
      for (let k = 0; k < 8; k++){ CodisPlanThemes.unequip('operations', 'own'); codisPlanThemeApply('operations'); CodisPlanThemes.equip('agedWoodOperations', 'own'); codisPlanThemeApply('operations'); }
      navigateToPage('tasks'); await sleep(400); renderTasksPage(); await sleep(200); renderTasksPage(); await sleep(200);
      return { ms:Math.round(performance.now() - t0), decors:document.querySelectorAll('#tasks-empty > .empty-state > .pt-decor').length, fx:document.querySelectorAll('#day-task-list .aw-fx').length, pt:document.getElementById('day-task-list').getAttribute('data-pt') }; });
    ok(T + 'P1 equip/remove ×8 + list rebuilds: no accumulated decor layers or effect layers', churn.decors <= 1 && churn.fx <= 1 && churn.pt === 'agedWoodOperations', churn);
    const old = await p.evaluate(() => { CodisPlanThemes.buy('frostCrystalOperations'); CodisPlanThemes.equip('frostCrystalOperations', 'own'); codisPlanThemeApply('operations'); const L = document.getElementById('day-task-list'); const r = { pt:L.getAttribute('data-pt'), aw:!!L.querySelector('.aw-fx') };
      const it = L.querySelector('.task-item'); const e = new PointerEvent('pointerdown', { bubbles:true, pointerType:'touch', pointerId:31, clientX:10, clientY:10 }); it && it.dispatchEvent(e); r.lit = !!L.querySelector('.aw-lit, .aw-fx'); it && it.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, pointerType:'touch', pointerId:31 }));
      r.scope = codisSoundScopeOf(it); CodisPlanThemes.equip('agedWoodOperations', 'own'); codisPlanThemeApply('operations'); return r; });
    ok(T + 'P2 existing themes unaffected: Frost on operations gets no wood effects and no sound scope', old.pt === 'frostCrystalOperations' && !old.aw && !old.lit && old.scope === null, old);
  }
  ok(T + 'no JS errors', !o.errs.length, o.errs.slice(0, 5));
  await o.close();
}
srv.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
