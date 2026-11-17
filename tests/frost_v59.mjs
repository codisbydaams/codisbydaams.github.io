/* CODIS-V59 — FROST CRYSTAL «الجليد الصاقع». WebKit حقيقي (محاكاة iPhone) + عرض حاسوب للمرور بالمؤشر.
   Run:  PW=<path to playwright-core/index.mjs> node tests/frost_v59.mjs [app.html]      RUNS="paper:375,dark:320,paper:430,paper:1280" افتراضياً
         SHOTS=<dir> يحفظ لقطات (المتجر، المعاينات، المربعات، بطاقة الخطة، المستطيلات).
   يغطي: المتجر (العائلة بعد الجحيم، وصف، 3 منتجات، 7,999)، الشراء الذري (خصم دقيق، ملكية منفصلة، فشل الحفظ لا يخصم)، المعاينة لكل غرفة،
   التجهيز لكل غرفة + خلط العائلات + العزل، عودة القيم المحسوبة حرفياً بعد الإزالة، نسبة الإنجاز/عرض الشريط، الحالات الثلاث (نقرات حقيقية)،
   الوزن اليدوي/التلقائي، مهمة جديدة، تغيير اليوم، ثبات مكان المستطيلات، الثلج (خلف المحتوى، لا يلتقط اللمس، يتحرك، يتوقف مع تقليل الحركة)،
   عدم تسرّب ألوان الجحيم لأسطح الجليد، إعادة التشغيل، «بحوزتك»، لا تمرير أفقي ولا قص، لا أخطاء. */
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
let pass = 0, fail = 0; const ok = (n, c, info) => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + n + (!c && info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 700) : '')); };
async function open(w, theme, reduced){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v59t-'));
  const desk = w >= 900;
  const opts = desk ? { viewport:{ width:w, height:900 }, deviceScaleFactor:1, hasTouch:false, isMobile:false } : { ...devices['iPhone 12'], viewport:{ width:w, height:844 }, screen:{ width:w, height:844 } };
  if (reduced) opts.reducedMotion = 'reduce';
  const ctx = await webkit.launchPersistentContext(prof, opts);
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); } await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t, true), theme); };
  await boot();
  return { page, errs, boot, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const FR = { planning:'frostCrystalPlanning', operations:'frostCrystalOperations', teacher:'frostCrystalTeacher' };
const IN = { planning:'infernoCrystal', operations:'infernoCrystalOperations', teacher:'infernoCrystalTeacher' };
const nav = async (p, pg) => { await p.evaluate(x => navigateToPage(x), pg); await p.waitForTimeout(900); };
const setEq = (p, tg, id) => p.evaluate(([t, i]) => { const P = CodisPlanThemes; if (i) P.equip(i, 'own'); else P.unequip(t, 'own'); codisPlanThemeApply(t); }, [tg, id]);
const shot = async (p, name, sel) => { if (!SHOTS) return; try { if (sel) { const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); await el.screenshot({ path:path.join(SHOTS, name + '.png') }); return; } } await p.screenshot({ path:path.join(SHOTS, name + '.png') }); } catch (e) { console.log('shot fail', name, e.message); } };
/* نفس لقطة V58: القيم المحسوبة لكل سطح (قبل التجهيز = بعد الإزالة حرفياً) */
const SNAP = () => { const c = (e, ps, pseudo) => e ? ps.map(x => getComputedStyle(e, pseudo || null).getPropertyValue(x)).join('|') : 'none';
  const card = document.querySelector('#planning-active > .plan-card'), q = s => card.querySelector(s);
  const L = l => { const e = document.querySelector(l); return c(e, ['padding-top', 'margin-top', 'overflow-y', 'isolation']) + '#' + c(e, ['content', 'position'], '::before') + '#' + c(e, ['content'], '::after'); };
  const item = l => document.querySelector(l + ' > .task-item'), I = l => { const it = item(l); if (!it) return 'no-item'; const g = s => it.querySelector(s);
    return [c(it, ['background-image', 'box-shadow', 'color', 'border-top-color', 'background-position']), c(it, ['background-color', 'background-image', 'box-shadow', 'width'], '::before'), c(it, ['background-image', 'width', 'opacity'], '::after'), c(g('.task-text'), ['color']), c(g('.task-wt'), ['background-image', 'border-top-color', 'color']), c(g('.status-group'), ['background-color', 'box-shadow']), [...it.querySelectorAll('.stat-btn')].map(b => c(b, ['background-image', 'color', 'border-top-color'])).join('/'), L(l)].join(' ‖ '); };
  const box = s => { const e = document.querySelector(s); return c(e, ['background-image', 'box-shadow', 'color']) + '|' + e.querySelectorAll(':scope > .pt-decor').length; };
  return { card:[c(card, ['background-image', 'box-shadow', 'color']), c(card, ['display', 'background-image'], '::before'), c(q('.plan-name'), ['color']), c(q('.plan-progress'), ['background-image', 'margin-left']), c(q('.plan-pct'), ['color', '-webkit-text-fill-color', 'font-size']), c(q('.xp-fill'), ['background-image']), c(q('.xp-track'), ['background-image', 'height']), c(q('.plan-cta .btn'), ['background-image', 'color', 'text-shadow']), c(q('.pm-btn'), ['color']), c(q('.eyebrow'), ['color'])].join(' ‖ '),
    cardDecor:card.querySelectorAll(':scope > .pt-decor').length, ops:I('#day-task-list'), learn:I('#learn-day-task-list'),
    boxes:['#planning-empty > .empty-state', '#tasks-empty > .empty-state', '#learn-empty > .empty-state'].map(box).join(' ‖ '),
    pct:document.getElementById('plan-active-pct').textContent, fill:document.getElementById('plan-active-fill').getAttribute('style') }; };
const ATTR = () => ['#planning-empty > .empty-state', '#planning-active > .plan-card', '#tasks-empty > .empty-state', '#day-task-list', '#learn-empty > .empty-state', '#learn-day-task-list'].map(s => { const e = document.querySelector(s); return s + '=' + (e.getAttribute('data-pt') || '') + '/' + e.className + '/' + (e.getAttribute('style') || ''); });
const clipped = () => [...document.querySelectorAll('#day-task-list > .task-item, #learn-day-task-list > .task-item, #planning-active > .plan-card')].filter(e => e.offsetParent !== null)
  .flatMap(it => [...it.querySelectorAll('.task-text, .task-wt, .stat-btn, .stat-label, .plan-name, .plan-pct, .pm-btn, .plan-cta .btn')]).filter(e => e.offsetParent !== null && (e.scrollWidth > e.clientWidth + 1)).map(e => e.className + ':' + e.textContent.trim().slice(0, 20));
/* بصمة الجحيم: ألوانه الثابتة (V58) — يجب ألا تظهر على أي سطح جليدي */
const LEAK = (sel) => { const bad = ['255, 138, 46', '255, 181, 101', '217, 194, 160', '217, 190, 150', '244, 215, 182', '255, 236, 214', '255, 120, 40', '255, 90, 20', '7, 4, 4', '10, 6, 5', '226, 57, 27', '28, 19, 16', '241, 220, 196', '191, 168, 143', '201, 162, 110', '255, 226, 191', '160, 140, 122', '168, 145, 124', '205, 184, 163', '233, 211, 188', '255, 196, 138', '255, 106, 26', '255, 215, 168', '18, 12, 10', '231, 166, 76', '232, 71, 60', '255, 182, 172'];
  const props = ['color', 'background-color', 'background-image', 'border-top-color', 'border-left-color', 'box-shadow', 'text-shadow', 'outline-color', 'fill', 'stroke', 'filter', '-webkit-text-fill-color'];
  const out = []; document.querySelectorAll(sel).forEach(root => { [root, ...root.querySelectorAll('*')].forEach(e => { if (e.closest('.pt-decor svg')) return; [null, '::before', '::after'].forEach(ps => { const cs = getComputedStyle(e, ps); props.forEach(pr => { const v = cs.getPropertyValue(pr); const b = bad.find(x => v.includes(x)); if (b) out.push((e.className && e.className.baseVal === undefined ? e.className : e.tagName) + (ps || '') + ' ' + pr + ' ' + b); }); }); }); });
  return [...new Set(out)].slice(0, 12); };
/* الثلج: موجود، يتحرك، خلف المحتوى، لا يلتقط اللمس */
const SNOW = (sel) => { const r = { decor:[], list:null };
  document.querySelectorAll(sel).forEach(e => { const sn = [...e.querySelectorAll(':scope > .pt-decor > .pt-snow')]; r.decor.push({ n:sn.length, anim:sn.map(s => getComputedStyle(s).animationName).join(','), pe:getComputedStyle(e.querySelector(':scope > .pt-decor') || e).pointerEvents, z:getComputedStyle(e.querySelector(':scope > .pt-decor') || e).zIndex }); });
  return r; };
const LISTSNOW = (l) => { const e = document.querySelector(l), b = getComputedStyle(e, '::before'), a = getComputedStyle(e, '::after'); return { b:[b.content, b.position, b.zIndex, b.pointerEvents, b.animationName, b.backgroundImage.slice(0, 26)].join('|'), a:[a.content, a.position, a.zIndex, a.pointerEvents, a.animationName].join('|') }; };
/* ما تحت نقطة النص: يجب أن يكون النص نفسه (لا طبقة زخرفة/ثلج) */
const HIT = (sels) => sels.map(s => { const e = document.querySelector(s); if (!e || e.offsetParent === null) return s + ':hidden'; e.scrollIntoView({ block:'center' }); const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return (h && (h === e || e.contains(h) || h.contains(e) && h.closest('button'))) ? 'ok' : s + '→' + (h ? h.className || h.tagName : 'null'); });
const RECTS = (l) => { const L = document.querySelector(l), P = L.parentElement.getBoundingClientRect(); return [...L.querySelectorAll(':scope > .task-item')].slice(0, 6).map(it => { const r = it.getBoundingClientRect(); return [Math.round(r.left - P.left), Math.round(r.top - P.top), Math.round(r.width), Math.round(r.height)].join(','); }).join(' ') + ' next:' + (L.nextElementSibling ? Math.round(L.nextElementSibling.getBoundingClientRect().top - P.top) : '-'); };

for (const [theme, w] of (process.env.ONLY === 'surf' ? [] : (process.env.RUNS || 'paper:375,dark:320,paper:430,paper:1280').split(',').map(x => x.split(':')))) {
  const T = theme + ' ' + w + ': ', tag = theme + w;
  const o = await open(+w, theme); const p = o.page;
  await p.evaluate(() => { codisConfirm = async () => true; CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {};
    CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 60000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; }); });

  // ---- المتجر: العائلة بعد الجحيم، وصف، 3 منتجات بسعر 7,999 ----
  await p.evaluate(() => econOpenStore()); await p.waitForTimeout(1300); await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(600);
  let st = await p.evaluate(() => ({ fams:[...document.querySelectorAll('#cos-sub-themes .pt-fam')].map(f => ({ id:f.dataset.family, ar:f.querySelector('.pt-fam-ar').textContent, en:(f.querySelector('.pt-fam-en') || {}).textContent, desc:(f.querySelector('.pt-fam-desc') || {}).textContent || '', n:f.querySelectorAll('.pt-mtile').length, names:[...f.querySelectorAll('.pt-mname')].map(x => x.textContent), price:[...f.querySelectorAll('.pt-mbadge')].map(x => x.textContent.replace(/\s+/g, '')), sep:getComputedStyle(f, '::before').content, cols:getComputedStyle(f.querySelector('.pt-grid')).gridTemplateColumns.split(' ').length, fam:[...f.querySelectorAll('.pt-mtile')].map(t => t.dataset.ptFam) })),
    h:document.getElementById('pt-h').textContent, docW:document.documentElement.scrollWidth <= innerWidth, cut:[...document.querySelectorAll('#cos-sub-themes .pt-mname, #cos-sub-themes .pt-mbadge, #cos-sub-themes .pt-fam-ar')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent),
    miniAnim:[...document.querySelectorAll('#cos-sub-themes .pt-mtile[data-pt-fam="frostCrystal"] .pt-snow, #cos-sub-themes .pt-mtile[data-pt-fam="frostCrystal"] .pt-glint')].map(e => getComputedStyle(e).animationName).filter(x => x !== 'none').length }));
  const fr = st.fams[1] || {};
  ok(T + 'store: «الثيمات» → Inferno family then Frost family (order), separator before Frost', st.h === 'الثيمات' && st.fams.map(f => f.id).join() === 'infernoCrystal,frostCrystal,agedWood,blazingMeteor'   /* V64: + الخشب المعتّق بعدهما */ && st.fams[0].sep === 'none' && fr.sep !== 'none', st.fams.map(f => [f.id, f.sep]));
  ok(T + 'store: Frost header = «الجليد الصاقع» + FROST CRYSTAL + description; 3 room products, 7,999 each, 3-column grid, family not repeated on tiles', fr.ar === 'الجليد الصاقع' && fr.en === 'Frost Crystal' && /البلورات الجليدية النقية/.test(fr.desc) && fr.n === 3 && fr.names.join() === 'غرفة التخطيط,غرفة العمليات,غرفة الأستاذ' && fr.price.every(x => /7,999|٧٬?٩٩٩/.test(x)) && fr.cols === 3 && fr.fam.every(x => x === 'frostCrystal'), fr);
  ok(T + 'store: no clipped labels, no horizontal scroll; mini previews are static (no snow/glint animation)', st.docW && !st.cut.length && st.miniAnim === 0, st);
  await shot(p, tag + '_store_themes', '#cos-sub-themes');
  // ---- المعاينة لكل منتج: النافذة نفسها، مربع الغرفة الصحيحة بهوية الجليد ----
  for (const tg of ['planning', 'operations', 'teacher']) {
    await p.evaluate(id => document.querySelector('#cos-sub-themes .pt-mtile[data-ptid="' + id + '"] .pt-mbtn').click(), FR[tg]); await p.waitForTimeout(700);
    const ov = await p.evaluate(() => { const o = document.querySelector('.pt-ov'), b = o && o.querySelector('.pt-stage.is-big > .pt-box'); return o && { fam:o.dataset.ptFam, tg:o.dataset.ptTarget, pt:b && b.dataset.pt, btg:b && b.dataset.ptTarget, floe:!!(b && b.querySelector('.pt-floe')), snow:b ? b.querySelectorAll('.pt-snow').length : 0, anim:b ? [...b.querySelectorAll('.pt-snow')].map(s => getComputedStyle(s).animationName).join() : '', covers:o.querySelectorAll('.pt-ov-covers li').length, act:o.querySelector('.pt-ov-act').textContent.replace(/\s+/g, ' ').trim(), cardBg:getComputedStyle(o.querySelector('.pt-ov-card')).backgroundImage.slice(0, 20), title:getComputedStyle(b.querySelector('.es-title')).color, art:!!b.querySelector('.es-art') }; });
    ok(T + 'preview ' + tg + ': same details window, Frost family styling, real ' + tg + ' box with ice shelf + 2 animated snow layers, buy 7,999', ov && ov.fam === 'frostCrystal' && ov.tg === tg && ov.pt === FR[tg] && ov.btg === tg && ov.floe && ov.snow === 2 && ov.anim === 'ptSnowA,ptSnowB' && ov.covers === 3 && /شراء بالفضة/.test(ov.act) && /7,999/.test(ov.act) && /gradient/.test(ov.cardBg) && ov.title === 'rgb(11, 51, 82)' && ov.art, ov);
    await shot(p, tag + '_preview_' + tg, '.pt-ov-card');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  }
  // ---- الشراء: فشل الحفظ لا يخصم ولا يملّك ----
  const failBuy = await p.evaluate(() => { const s0 = CodisWallet.silverBalance(); codisSaveSuspended = 'fail'; let r; try { r = CodisPlanThemes.buy('frostCrystalPlanning'); } finally { codisSaveSuspended = false; } return { r, s0, s1:CodisWallet.silverBalance(), own:CodisPlanThemes.owns('frostCrystalPlanning') }; });
  ok(T + 'atomic purchase: a failed save deducts nothing and grants nothing', failBuy.r && !failBuy.r.ok && failBuy.s0 === failBuy.s1 && !failBuy.own, failBuy);
  // ---- الشراء الحقيقي عبر زر النافذة (التأكيد نفسه) لكل منتج: خصم 7,999 بالضبط وملكية ذلك المنتج فقط ----
  const buys = [];
  for (const tg of ['planning', 'operations', 'teacher']) {
    await p.evaluate(id => document.querySelector('#cos-sub-themes .pt-mtile[data-ptid="' + id + '"] .pt-mbtn').click(), FR[tg]); await p.waitForTimeout(600);
    const s0 = await p.evaluate(() => CodisWallet.silverBalance());
    await p.evaluate(() => document.querySelector('.pt-ov .pt-ov-act').click()); await p.waitForTimeout(1200);
    buys.push(await p.evaluate(([tg, s0, ids]) => ({ tg, d:s0 - CodisWallet.silverBalance(), owns:ids.map(i => CodisPlanThemes.owns(i)), rec:(data.inventory.planThemes.owned.find(x => x.id === ids[['planning', 'operations', 'teacher'].indexOf(tg)]) || {}).paid, eq:CodisPlanThemes.equippedMap(), btn:(document.querySelector('.pt-ov .pt-ov-act') || {}).textContent }), [tg, s0, [FR.planning, FR.operations, FR.teacher]]));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  }
  ok(T + 'buy each Frost product: exactly 7,999 silver each, ownership only of that product, nothing auto-equipped, store offers «بحوزتك» (no equip in store)', buys.every(b => b.d === 7999 && b.rec === 7999) && buys[0].owns.join() === 'true,false,false' && buys[1].owns.join() === 'true,true,false' && buys[2].owns.join() === 'true,true,true' && buys.every(b => !b.eq.planning && !b.eq.operations && !b.eq.teacher) && /افتح «بحوزتك» للتجهيز/.test(buys[2].btn || '') /* V60: لا تجهيز من المتجر */, buys);
  ok(T + 'ledger: three PURCHASE_COSMETIC plantheme|frost* transactions; re-buy refused', await p.evaluate(() => CodisWallet.silverTxs().filter(t => t.type === 'PURCHASE_COSMETIC' && /^plantheme\|frostCrystal/.test(t.referenceId || '') && t.amount === -7999).length === 3 && CodisPlanThemes.buy('frostCrystalTeacher').reason === 'owned'));
  await p.evaluate(() => { CodisPlanThemes.buy('infernoCrystal'); CodisPlanThemes.buy('infernoCrystalOperations'); CodisPlanThemes.buy('infernoCrystalTeacher'); econCloseStore(); }); await p.waitForTimeout(400);

  // ---- المربعات الثلاثة (بلا خطة) بالجليد ----
  for (const tg of ['planning', 'operations', 'teacher']) await setEq(p, tg, FR[tg]);
  for (const [pg, sel] of [['planning', '#planning-empty > .empty-state'], ['tasks', '#tasks-empty > .empty-state'], ['learn', '#learn-empty > .empty-state']]) { await nav(p, pg); await shot(p, tag + '_box_' + pg, sel); }
  await nav(p, 'planning');
  ok(T + 'waiting boxes: three Frost boxes, one decor each, snow behind content (decor z-index -1, no pointer events), title readable', await p.evaluate(() => ['#planning-empty', '#tasks-empty', '#learn-empty'].every(s => { const b = document.querySelector(s + ' > .empty-state'), d = b.querySelectorAll(':scope > .pt-decor'); return /^frostCrystal/.test(b.dataset.pt) && d.length === 1 && getComputedStyle(d[0]).zIndex === '-1' && getComputedStyle(d[0]).pointerEvents === 'none' && d[0].querySelectorAll('.pt-snow').length === 2; })));
  ok(T + 'waiting box: the button under its centre is the real button (snow/decor never on top)', (await p.evaluate(HIT, ['#planning-empty > .empty-state .btn', '#planning-empty > .empty-state .es-title'])).every(x => x === 'ok'), await p.evaluate(HIT, ['#planning-empty > .empty-state .btn']));
  for (const tg of ['planning', 'operations', 'teacher']) await setEq(p, tg, null);

  // ---- خطة حقيقية (مهام + تعلّم) ----
  await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms));
    navigateToPage('planning'); await sleep(600); startNewPlan(); await sleep(500);
    const L = n => Array.from({ length:n }, (_, i) => (i + 1) + '- ' + ['مراجعة تقرير المبيعات الأسبوعي للفريق', '!اجتماع فريق العمليات لمراجعة خطة الربع', 'اتصال بالعائلة', 'قراءة الفصل الثالث من كتاب الإدارة', 'حل تمارين الرياضيات', 'مراجعة المفردات الجديدة'][i % 6] + ' ' + (i + 1)).join('\n');
    const ti = document.getElementById('plan-tasks-input'); ti.value = L(21); ti.dispatchEvent(new Event('input', { bubbles:true }));
    const li = document.getElementById('plan-learn-input'); li.value = L(21); li.dispatchEvent(new Event('input', { bubbles:true }));
    distributePlan(); await sleep(900); });
  await nav(p, 'tasks'); await nav(p, 'learn'); await nav(p, 'planning');
  const base = await p.evaluate(SNAP); const silver0 = await p.evaluate(() => CodisWallet.silverBalance()), owned0 = await p.evaluate(() => JSON.stringify(data.inventory.planThemes.owned));
  await nav(p, 'tasks'); const rOps0 = await p.evaluate(RECTS, '#day-task-list'); await nav(p, 'learn'); const rLrn0 = await p.evaluate(RECTS, '#learn-day-task-list'); await nav(p, 'planning');
  ok(T + 'setup: plan distributed, nothing themed', base.ops !== 'no-item' && base.learn !== 'no-item' && !base.cardDecor && (await p.evaluate(ATTR)).every(a => /=\//.test(a)), await p.evaluate(ATTR));

  // ---- التخطيط بالجليد، العمليات بالجحيم، الأستاذ أصلي ----
  await setEq(p, 'planning', FR.planning); await setEq(p, 'operations', IN.operations); await p.evaluate(() => renderPlanningPage()); await p.waitForTimeout(1200);
  let s = await p.evaluate(SNAP), a = await p.evaluate(ATTR);
  ok(T + 'mixed rooms: planning=Frost (box + plan card), operations=Inferno, teacher=original', /=frostCrystalPlanning\/empty-state pt-box/.test(a[0]) && /=frostCrystalPlanning\/plan-card pt-card/.test(a[1]) && /=infernoCrystalOperations\//.test(a[2]) && /=infernoCrystalOperations\/pt-scope/.test(a[3]) && /=\/empty-state\//.test(a[4]) && /^#learn-day-task-list=\/\/$/.test(a[5]) && s.learn === base.learn && s.cardDecor === 1, a);
  const look = await p.evaluate(() => { const c = document.querySelector('#planning-active > .plan-card'), g = (e, x, ps) => getComputedStyle(e, ps || null).getPropertyValue(x); return { bg:g(c, 'background-image').slice(0, 16), before:g(c, 'display', '::before'), pctFill:g(c.querySelector('.plan-pct'), '-webkit-text-fill-color'), fillBg:g(c.querySelector('.xp-fill'), 'background-image'), track:g(c.querySelector('.xp-track'), 'background-image').slice(0, 16), title:g(c.querySelector('.plan-name'), 'color'), btnTx:g(c.querySelector('.plan-cta .btn'), 'color'), pm:g(c.querySelector('.pm-btn'), 'color'), floe:!!c.querySelector(':scope > .pt-decor .pt-floe') }; });
  ok(T + 'plan card = crystal control panel: light ice bg, arctic title, ice progress channel, crystal fill, ice CTA, ice shelf decor', /gradient/.test(look.bg) && look.before === 'none' && look.title === 'rgb(11, 51, 82)' && /rgba\((0, 0, 0|255, 255, 255), 0\)|transparent/.test(look.pctFill) && /gradient/.test(look.track) && /88, 197, 233|79, 192, 232|31, 155, 208/.test(look.fillBg) && look.btnTx === 'rgb(10, 58, 90)' && look.pm === 'rgb(44, 93, 128)' && look.floe, look);
  ok(T + 'plan card: % text and fill width unchanged by the theme', s.pct === base.pct && s.fill === base.fill, { base:[base.pct, base.fill], now:[s.pct, s.fill] });
  ok(T + 'plan card: no Inferno colours leak onto the Frost card/box', !(await p.evaluate(LEAK, '#planning-active > .plan-card, #planning-empty > .empty-state')).length, await p.evaluate(LEAK, '#planning-active > .plan-card, #planning-empty > .empty-state'));
  const cs = await p.evaluate(SNOW, '#planning-active > .plan-card');
  ok(T + 'plan card: snow inside the decor layer (behind content, no pointer events) and animating', cs.decor[0].n === 2 && cs.decor[0].anim === 'ptSnowA,ptSnowB' && cs.decor[0].pe === 'none' && cs.decor[0].z === '-1', cs);
  ok(T + 'plan card: name/% /buttons are what the finger hits (not snow)', (await p.evaluate(HIT, ['#plan-active-name', '#plan-active-pct', '#planning-active .plan-cta .btn', '#planning-active .pm-btn'])).every(x => x === 'ok'), await p.evaluate(HIT, ['#plan-active-name', '#plan-active-pct', '#planning-active .plan-cta .btn', '#planning-active .pm-btn']));
  await shot(p, tag + '_plancard', '#planning-active > .plan-card');
  const steps = [];
  for (let k = 0; k < 3; k++) {
    await p.evaluate(k => { const wk = currentWeekId(), W = data.weeks[wk]; let n = 0; const td = String(CodisClock.day()); for (const [dk, d] of Object.entries(W.days || {})) { if (dk === td) continue; for (const t of (d || [])) { if (n >= (k + 1) * 4) break; if (!t.status) { t.status = 'done'; } n++; } } saveData(); renderPlanningPage(); }, k);
    await p.waitForTimeout(1700);
    steps.push(await p.evaluate(() => ({ pct:document.getElementById('plan-active-pct').textContent, w:document.getElementById('plan-active-fill').style.width, pt:document.querySelector('#planning-active > .plan-card').getAttribute('data-pt') })));
  }
  const nums = steps.map(x => parseFloat(x.pct.replace(/[^\d.]/g, '')));
  ok(T + 'progress updates repeatedly under Frost (text rises, fill width = text, theme stays)', nums[0] < nums[1] && nums[1] < nums[2] && steps.every(x => x.pt === FR.planning && Math.abs(parseFloat(x.w) - parseFloat(x.pct.replace(/[^\d.]/g, ''))) < 1.01), steps);
  await shot(p, tag + '_plancard_progress', '#planning-active > .plan-card');
  const pctThemed = steps[2];

  // ---- العمليات بالجليد ----
  await nav(p, 'tasks'); await setEq(p, 'operations', FR.operations); await p.evaluate(() => renderTasksPage()); await p.waitForTimeout(800);
  a = await p.evaluate(ATTR);
  ok(T + 'operations Frost: waiting box + list scope wear Frost; planning still Frost, teacher original', /=frostCrystalOperations\/empty-state pt-box/.test(a[2]) && /=frostCrystalOperations\/pt-scope/.test(a[3]) && /=frostCrystalPlanning\//.test(a[1]) && /^#learn-day-task-list=\/\/$/.test(a[5]), a);
  const rOps1 = await p.evaluate(RECTS, '#day-task-list');
  ok(T + 'operations: rectangles keep exactly their place and size (snow field padding is layout-neutral)', rOps1 === rOps0, { before:rOps0, after:rOps1 });
  const items = await p.evaluate(() => [...document.querySelectorAll('#day-task-list > .task-item')].map(it => ({ bg:/gradient/.test(getComputedStyle(it).backgroundImage), col:getComputedStyle(it.querySelector('.task-text')).color })));
  ok(T + 'operations: every task rectangle is ice glass with arctic text', items.length >= 1 && items.every(x => x.bg && ['rgb(11, 51, 82)', 'rgb(7, 43, 71)'].includes(x.col)), items.slice(0, 3));
  const ls = await p.evaluate(LISTSNOW, '#day-task-list');
  ok(T + 'operations: one shared snow field (list ::before/::after sticky, z -1, no pointer events, animating) — no per-task snow', /^""\|sticky\|-1\|none\|ptSnowA\|url/.test(ls.b) && /^""\|sticky\|-1\|none\|ptSnowB$/.test(ls.a) && await p.evaluate(() => !document.querySelector('#day-task-list .pt-snow, #day-task-list .pt-decor')), ls);
  ok(T + 'operations: task text, weight, status buttons and delete are hit directly (snow never covers them)', (await p.evaluate(HIT, ['#day-task-list > .task-item .task-text', '#day-task-list > .task-item .task-wt', '#day-task-list > .task-item .stat-btn.stat-done', '#day-task-list > .task-item .stat-btn.stat-half', '#day-task-list > .task-item .task-del'])).every(x => x === 'ok'), await p.evaluate(HIT, ['#day-task-list > .task-item .task-text', '#day-task-list > .task-item .task-wt', '#day-task-list > .task-item .stat-btn.stat-done']));
  ok(T + 'operations: no Inferno colours leak onto Frost rectangles/box', !(await p.evaluate(LEAK, '#day-task-list, #tasks-empty > .empty-state')).length, await p.evaluate(LEAK, '#day-task-list, #tasks-empty > .empty-state'));
  const states = await p.evaluate(list => { const L = document.querySelector(list), out = {}; ['done', 'half', 'none'].forEach(st => { const it = document.createElement('div'); it.className = 'task-item is-' + st + ' qa-fx'; it.innerHTML = codisTaskItemHtml({ id:'qa_' + st, text:'عينة ' + st, status:st, priority:'' }, false); L.appendChild(it);
      const b = it.querySelector('.stat-btn.active'), c = getComputedStyle(b); out[st] = { active:b.dataset.status, color:c.color, border:c.borderTopColor, bg:c.backgroundImage.slice(-60), rail:getComputedStyle(it, '::before').backgroundImage.slice(0, 80) }; }); L.querySelectorAll('.qa-fx').forEach(x => x.remove()); return out; }, '#day-task-list');
  const uniq = (S, k) => new Set(['done', 'half', 'none'].map(x => S[x][k])).size === 3;
  ok(T + 'operations states: three distinct identities (cyan / icy gold / cold rose) on buttons and rails', ['done', 'half', 'none'].every(x => states[x].active === x) && uniq(states, 'color') && uniq(states, 'border') && uniq(states, 'bg') && uniq(states, 'rail') && states.done.border === 'rgb(47, 176, 222)' && states.half.border === 'rgb(212, 155, 42)' && states.none.border === 'rgb(218, 88, 118)', states);
  const clickRes = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const L = document.getElementById('day-task-list');
    const res = []; for (const st of ['done', 'none']) { const it = [...L.querySelectorAll(':scope > .task-item')][0]; if (!it) break; const id = it.dataset.tid; it.querySelector('.stat-btn[data-status="' + st + '"]').click(); await sleep(250);
      const cur = L.querySelector(':scope > .task-item[data-tid="' + id + '"]') || it; const mid = { themedBg:/gradient/.test(getComputedStyle(cur).backgroundImage) }; await sleep(1800);
      const wk = currentWeekId(); let t = null; Object.values(data.weeks[wk].days || {}).forEach(d => (d || []).forEach(x => { if (String(x.id) === String(id)) t = x; })); res.push({ st, saved:t && t.status, mid, scope:L.classList.contains('pt-scope') }); }
    return res; });
  ok(T + 'operations real clicks: «خلصتها» / «ما سويتها» save; rectangle stays Frost', clickRes.length === 2 && clickRes.every(r => r.saved === r.st && r.mid.themedBg && r.scope), clickRes);
  const half = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const it = document.querySelector('#day-task-list > .task-item'); if (!it) return null; it.querySelector('.stat-btn[data-status="half"]').click(); await sleep(500);
    const panel = document.querySelector('.hp-ov, .half-ov, [class*="half"][role="dialog"], .tp-sheet'); return { opened:!!document.querySelector('[role="dialog"]'), panel:!!panel }; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok(T + 'operations «نصها» still opens its percentage step (flow untouched)', half && half.opened, half);
  const wt = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const it = document.querySelector('#day-task-list > .task-item'); if (!it) return null; const id = it.dataset.tid;
    const chip = () => document.querySelector('#day-task-list > .task-item[data-tid="' + id + '"] .task-wt'); const c0 = chip(), r0 = { manual:c0.classList.contains('is-manual'), border:getComputedStyle(c0).borderTopColor, v:getComputedStyle(c0.querySelector('.tw-v')).color };
    c0.click(); await sleep(300); const inp = document.querySelector('#day-task-list > .task-item[data-tid="' + id + '"] .tw-in'); const inpBg = inp && getComputedStyle(inp).backgroundColor;
    inp.value = '2.5'; document.querySelector('#day-task-list > .task-item[data-tid="' + id + '"] .tw-save').click(); await sleep(500);
    const c1 = chip(), r1 = { manual:c1.classList.contains('is-manual'), border:getComputedStyle(c1).borderTopColor, txt:c1.textContent };
    c1.click(); await sleep(300); document.querySelector('#day-task-list > .task-item[data-tid="' + id + '"] .tw-auto').click(); await sleep(500);
    return { r0, inpBg, r1, back:!chip().classList.contains('is-manual') }; });
  ok(T + 'weight: auto (silver chip) → edit (white input) → manual 2.5 (cyan edge) → back to auto', wt && !wt.r0.manual && wt.r0.v === 'rgb(11, 51, 82)' && wt.inpBg === 'rgb(255, 255, 255)' && wt.r1.manual && /2\.5/.test(wt.r1.txt) && wt.r1.border === 'rgb(63, 180, 224)' && wt.back, wt);
  const added = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const i = document.getElementById('manual-task-input'); i.value = 'مهمة جليدية جديدة'; addManualTask(); await sleep(600);
    const it = [...document.querySelectorAll('#day-task-list > .task-item')].find(x => /مهمة جليدية جديدة/.test(x.textContent)); return it ? { bg:/gradient/.test(getComputedStyle(it).backgroundImage), col:getComputedStyle(it.querySelector('.task-text')).color, hex:/svg/.test(getComputedStyle(it, '::after').backgroundImage) } : null; });
  ok(T + 'a newly added task is Frost automatically (incl. crystal corners)', added && added.bg && added.col === 'rgb(11, 51, 82)' && added.hex, added);
  const del = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const it = [...document.querySelectorAll('#day-task-list > .task-item')].find(x => /مهمة جليدية جديدة/.test(x.textContent)); if (!it) return null; it.querySelector('.task-del').click(); await sleep(700); return { gone:![...document.querySelectorAll('#day-task-list > .task-item')].some(x => /مهمة جليدية جديدة/.test(x.textContent)), scope:document.getElementById('day-task-list').dataset.pt }; });
  ok(T + 'delete a task: removed, list stays Frost', del && del.gone && del.scope === FR.operations, del);
  const day = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const cur = activeDayIdx, nxt = (cur + 1) % 7; renderTasksPage(nxt); await sleep(500); const r = { scope:document.getElementById('day-task-list').dataset.pt, items:[...document.querySelectorAll('#day-task-list > .task-item')].map(it => /gradient/.test(getComputedStyle(it).backgroundImage)) }; renderTasksPage(cur); await sleep(400); return r; });
  ok(T + 'changing the day keeps Frost on the re-rendered list', day.scope === 'frostCrystalOperations' && day.items.every(Boolean), day);
  ok(T + 'operations: no clipped text, no horizontal scroll', !(await p.evaluate(clipped)).length && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await p.evaluate(clipped));
  if (w >= 900) {
    const it = await p.$('#day-task-list > .task-item'); const pos0 = await p.evaluate(() => getComputedStyle(document.querySelector('#day-task-list > .task-item')).backgroundPosition.split(',')[0]);
    await it.hover(); await p.waitForTimeout(1100); const pos1 = await p.evaluate(() => getComputedStyle(document.querySelector('#day-task-list > .task-item')).backgroundPosition.split(',')[0]);
    const sh = await p.evaluate(() => getComputedStyle(document.querySelector('#day-task-list > .task-item')).boxShadow);
    ok(T + 'hover (pointer device): crystal sheen sweeps across + edge brightens', pos0.trim() !== pos1.trim() && /63, 180, 224/.test(sh), { pos0, pos1, sh:sh.slice(0, 80) });
    await shot(p, tag + '_ops_hover', '#day-task-list > .task-item');
    await p.mouse.move(2, 2);
  }
  await p.evaluate(() => { const L = document.getElementById('day-task-list'); L.scrollIntoView({ block:'start' }); }); await p.waitForTimeout(300);
  await shot(p, tag + '_ops_list');
  await shot(p, tag + '_ops_item', '#day-task-list > .task-item');

  // ---- الأستاذ بالجليد (هوية كتاب) ----
  await nav(p, 'learn'); await setEq(p, 'teacher', FR.teacher); await p.evaluate(() => renderLearnPage()); await p.waitForTimeout(800);
  a = await p.evaluate(ATTR); s = await p.evaluate(SNAP);
  ok(T + 'teacher Frost: path box + every learning rectangle; other rooms keep their own', /=frostCrystalTeacher\/empty-state pt-box/.test(a[4]) && /=frostCrystalTeacher\/pt-scope/.test(a[5]) && /=frostCrystalOperations\/pt-scope/.test(a[3]) && /=frostCrystalPlanning\//.test(a[1]), a);
  ok(T + 'teacher: rectangles keep their place and size', (await p.evaluate(RECTS, '#learn-day-task-list')) === rLrn0, { before:rLrn0, after:await p.evaluate(RECTS, '#learn-day-task-list') });
  const bookVsOps = await p.evaluate(() => { const l = document.querySelector('#learn-day-task-list > .task-item'), cs = getComputedStyle(l); return { book:(cs.backgroundImage.match(/url\(/g) || []).length, spine:getComputedStyle(l, '::after').backgroundImage.slice(0, 40), node:getComputedStyle(l, '::before').clipPath, dbl:/139, 216, 244/.test(cs.boxShadow), layers:cs.backgroundImage.split('gradient').length }; });
  ok(T + 'teacher keeps a book identity (crystal book glyph, silver spine, page edges, double frost frame, crystal station) — not a copy of operations', bookVsOps.book === 1 && /gradient/.test(bookVsOps.spine) && /polygon/.test(bookVsOps.node) && bookVsOps.dbl && s.learn !== s.ops, bookVsOps);
  const lstates = await p.evaluate(list => { const L = document.querySelector(list), out = {}; ['done', 'half', 'none'].forEach(st => { const it = document.createElement('div'); it.className = 'task-item is-' + st + ' qa-fx'; it.innerHTML = codisTaskItemHtml({ id:'ql_' + st, text:'عينة ' + st, status:st, priority:'' }, false); L.appendChild(it);
      const b = it.querySelector('.stat-btn.active'), c = getComputedStyle(b); out[st] = { color:c.color, border:c.borderTopColor, node:getComputedStyle(it, '::before').backgroundColor + ' ' + getComputedStyle(it, '::before').backgroundImage.slice(0, 40) }; }); L.querySelectorAll('.qa-fx').forEach(x => x.remove()); return out; }, '#learn-day-task-list');
  ok(T + 'teacher states: three distinct active identities + distinct station crystals', uniq(lstates, 'color') && uniq(lstates, 'node') && uniq(lstates, 'border'), lstates);
  const lclick = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const it = document.querySelector('#learn-day-task-list > .task-item'); if (!it) return null; const id = it.dataset.tid; it.querySelector('.stat-btn[data-status="done"]').click(); await sleep(2000);
    const wk = currentWeekId(); let t = null; Object.values(data.learnWeeks[wk].days || {}).forEach(d => (d || []).forEach(x => { if (String(x.id) === String(id)) t = x; })); return t && t.status; });
  ok(T + 'teacher real click «خلصتها» saves the status', lclick === 'done', lclick);
  ok(T + 'teacher: snow field shared, behind content; no Inferno leak; no clipped text', /sticky\|-1\|none\|ptSnowA/.test((await p.evaluate(LISTSNOW, '#learn-day-task-list')).b) && !(await p.evaluate(LEAK, '#learn-day-task-list, #learn-empty > .empty-state')).length && !(await p.evaluate(clipped)).length && (await p.evaluate(HIT, ['#learn-day-task-list > .task-item .task-text', '#learn-day-task-list > .task-item .stat-btn.stat-done'])).every(x => x === 'ok'), { leak:await p.evaluate(LEAK, '#learn-day-task-list, #learn-empty > .empty-state'), cut:await p.evaluate(clipped) });
  await p.evaluate(() => document.getElementById('learn-day-task-list').scrollIntoView({ block:'start' })); await p.waitForTimeout(300);
  await shot(p, tag + '_learn_list'); await shot(p, tag + '_learn_item', '#learn-day-task-list > .task-item');

  // ---- إعادة التشغيل: الاختيارات محفوظة (تخطيط جليد، عمليات جحيم، أستاذ جليد) ----
  await setEq(p, 'operations', IN.operations);
  await o.boot(); await nav(p, 'tasks'); await nav(p, 'learn'); await nav(p, 'planning');
  a = await p.evaluate(ATTR);
  ok(T + 'after restart: planning Frost, operations Inferno, teacher Frost — all six surfaces', /=frostCrystalPlanning\//.test(a[0]) && /=frostCrystalPlanning\//.test(a[1]) && /=infernoCrystalOperations\//.test(a[2]) && /=infernoCrystalOperations\//.test(a[3]) && /=frostCrystalTeacher\//.test(a[4]) && /=frostCrystalTeacher\//.test(a[5]), a);
  ok(T + 'Inferno operations next to Frost rooms is still exactly Inferno (its text colour, no Frost snow field)', await p.evaluate(() => { const it = document.querySelector('#day-task-list > .task-item'); return !!it && ['rgb(241, 220, 196)', 'rgb(255, 232, 208)'].includes(getComputedStyle(it.querySelector('.task-text')).color) && getComputedStyle(document.getElementById('day-task-list'), '::before').content === 'none'; }));
  ok(T + 'idempotent: repeated apply/render keeps exactly one decor per box/card', await p.evaluate(() => { const d0 = document.querySelector('#planning-active > .plan-card > .pt-decor'); for (let i = 0; i < 4; i++) { codisPlanThemeApply(); renderPlanningPage(); renderTasksPage(); renderLearnPage(); } return document.querySelector('#planning-active > .plan-card > .pt-decor') === d0 && ['#planning-empty > .empty-state', '#planning-active > .plan-card', '#tasks-empty > .empty-state', '#learn-empty > .empty-state'].every(s => document.querySelectorAll(s + ' > .pt-decor').length === 1); }));
  // ---- الإزالة: رجوع حرفي للأصل (كل الأسطح) ----
  const pctNow = await p.evaluate(() => document.getElementById('plan-active-pct').textContent);
  for (const tg of ['planning', 'operations', 'teacher']) await setEq(p, tg, null);
  await p.evaluate(() => { renderPlanningPage(); renderTasksPage(); renderLearnPage(); }); await p.waitForTimeout(1500);
  const back = await p.evaluate(SNAP); a = await p.evaluate(ATTR);
  ok(T + 'unequip all: every surface back to the original computed look; no pt attrs/vars; % kept', back.card === base.card && back.ops === base.ops && back.learn === base.learn && back.boxes === base.boxes && a.every(x => /=\//.test(x) && !/pt-|--pt/.test(x.split('=')[1])) && back.pct === pctNow, { a, d:[back.card === base.card, back.ops === base.ops, back.learn === base.learn, back.boxes === base.boxes] });
  ok(T + 're-equip after removal works (ownership kept)', await p.evaluate(() => { CodisPlanThemes.equip('frostCrystalOperations', 'own'); codisPlanThemeApply('operations'); const ok1 = document.getElementById('day-task-list').dataset.pt === 'frostCrystalOperations'; CodisPlanThemes.unequip('operations', 'own'); codisPlanThemeApply('operations'); return ok1 && CodisPlanThemes.owns('frostCrystalOperations') && !document.getElementById('day-task-list').dataset.pt; }));
  ok(T + 'equips never touch silver or ownership', await p.evaluate(([s0, o0]) => CodisWallet.silverBalance() === s0 && JSON.stringify(data.inventory.planThemes.owned) === o0, [silver0, owned0]));
  // ---- «بحوزتك» ----
  for (const tg of ['planning', 'teacher']) await setEq(p, tg, FR[tg]);
  await p.evaluate(() => econOpenStore()); await p.waitForTimeout(1000); await p.evaluate(() => econOpenVault()); await p.waitForTimeout(1300); await p.evaluate(() => econOwnSetPart('cosmetics')); await p.waitForTimeout(500);
  st = await p.evaluate(() => ({ fams:[...document.querySelectorAll('#own-panel-cosmetics .pt-fam')].map(f => f.dataset.family + ':' + f.querySelectorAll('.pt-mtile').length + '/' + f.querySelectorAll('.pt-mtile.is-on').length + ':' + (f.querySelector('.pt-fam-ar') || {}).textContent), on:[...document.querySelectorAll('#own-panel-cosmetics .pt-mtile.is-on')].map(t => t.dataset.ptid).sort().join(), ring:(() => { const t = document.querySelector('#own-panel-cosmetics .pt-mtile.is-on[data-pt-fam="frostCrystal"]'); return t ? getComputedStyle(t).boxShadow : ''; })(), ids:(() => { const seen = {}, d = []; document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) d.push(e.id); seen[e.id] = 1; }); return d; })() }));
  ok(T + '«بحوزتك»: Inferno family then Frost family (3 each), Frost planning+teacher shown equipped with an ice ring, no duplicate ids', st.fams.join() === 'infernoCrystal:3/0:الجحيم الكريستالي,frostCrystal:3/2:الجليد الصاقع' && st.on === 'frostCrystalPlanning,frostCrystalTeacher' && /63, 180, 224/.test(st.ring) && !st.ids.length, st);
  await shot(p, tag + '_own', '#own-panel-cosmetics');
  await p.evaluate(() => document.querySelector('#own-panel-cosmetics .pt-mtile[data-ptid="frostCrystalTeacher"] .pt-mbtn').click()); await p.waitForTimeout(500);
  st = await p.evaluate(() => ({ act:document.querySelector('.pt-ov .pt-ov-act').dataset.act, fam:[...document.querySelectorAll('.pt-ov-meta dd')].map(x => x.textContent) }));
  ok(T + 'details from «بحوزتك»: equipped Frost teacher offers removal; family = الجليد الصاقع', st.act === 'unequip' && st.fam.includes('الجليد الصاقع') && st.fam.includes('غرفة الأستاذ'), st);
  await p.keyboard.press('Escape'); await p.evaluate(() => { econCloseOwn(); econCloseStore(); }); await p.waitForTimeout(300);
  // ---- صلاحية CSS: كل قاعدة جليدية فيها خصائص مفهومة ----
  const cssv = await p.evaluate(() => { const sh = [...document.styleSheets].find(x => x.ownerNode && x.ownerNode.id === 'codis-v59-css'); const bad = []; let n = 0;
    const walk = rules => [...rules].forEach(r => { if (r.cssRules && !r.selectorText) walk(r.cssRules); else if (r.selectorText && /frostCrystal/.test(r.selectorText)) { n++; if (!r.style.length) bad.push(r.selectorText.slice(0, 90)); } }); walk(sh.cssRules); return { n, bad }; });
  ok(T + 'CSS: all Frost rules parsed with properties (' + cssv.n + ' rules)', cssv.n > 80 && !cssv.bad.length, cssv);
  ok(T + 'no page/console errors', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}

// ---- V59 أسطح إضافية للثيمين: مربع كتابة الخطة · «كل المهام/العناصر محسومة» · شرائح المعاينة ----
for (const theme of (process.env.STHEMES || 'paper,dark').split(',')) {
  const o = await open(375, theme); const p = o.page; const T = 'surfaces ' + theme + ' 375: ';
  await p.evaluate(() => { codisConfirm = async () => true; CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {};
    CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 60000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; });
    ['frostCrystalPlanning', 'frostCrystalOperations', 'frostCrystalTeacher', 'infernoCrystal', 'infernoCrystalOperations', 'infernoCrystalTeacher'].forEach(id => CodisPlanThemes.buy(id)); });
  // مربع الكتابة: الأصل ثم الجليد ثم الجحيم ثم الأصل حرفياً
  await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); navigateToPage('planning'); await sleep(600); startNewPlan(); await sleep(500); });
  const WB = () => [...document.querySelectorAll('#plan-editor .write-box')].map(w => { const c = getComputedStyle(w), t = getComputedStyle(w.querySelector('textarea')); return [w.dataset.pt || '', w.className, w.getAttribute('style') || '', w.querySelectorAll(':scope > .pt-decor').length, c.backgroundImage.slice(0, 40), c.boxShadow.slice(0, 40), t.color, t.backgroundColor].join('|'); }).join(' ‖ ');
  const wb0 = await p.evaluate(WB);
  await setEq(p, 'planning', 'frostCrystalPlanning'); await p.waitForTimeout(700); let wb = await p.evaluate(WB);
  const wbOk = await p.evaluate(() => { const w = document.querySelector('#plan-section-tasks .write-box'), ta = w.querySelector('textarea'), cnt = w.querySelector('.write-count'); ta.value = '1- مهمة جليدية\n2- مهمة ثانية'; ta.dispatchEvent(new Event('input', { bubbles:true }));
    const r = w.getBoundingClientRect(), rc = cnt.getBoundingClientRect(); return { n:document.querySelectorAll('#plan-editor .write-box.pt-panel[data-pt="frostCrystalPlanning"]').length, txt:getComputedStyle(ta).color, bg:getComputedStyle(ta).backgroundColor, cntIn:rc.width > 0 && rc.left >= r.left - 1 && rc.right <= r.right + 1 && rc.bottom <= r.bottom + 1, cnt:cnt.textContent, decorPE:getComputedStyle(w.querySelector('.pt-decor')).pointerEvents, hit:document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === ta }; });
  ok(T + 'write boxes (all 3) wear Frost: one decor each, arctic text on transparent textarea, typing + count work, count chip inside, textarea is what the finger hits', wbOk.n === 3 && wbOk.txt === 'rgb(11, 51, 82)' && /rgba\(0, 0, 0, 0\)|transparent/.test(wbOk.bg) && /2/.test(wbOk.cnt) && wbOk.cntIn && wbOk.decorPE === 'none' && wbOk.hit, wbOk);
  await setEq(p, 'planning', 'infernoCrystal'); await p.waitForTimeout(500);
  ok(T + 'write boxes switch to Inferno (obsidian, champagne text, one decor)', await p.evaluate(() => [...document.querySelectorAll('#plan-editor .write-box')].every(w => w.dataset.pt === 'infernoCrystal' && w.querySelectorAll(':scope > .pt-decor').length === 1 && getComputedStyle(w.querySelector('textarea')).color === 'rgb(244, 215, 182)')));
  await p.evaluate(() => { document.activeElement && document.activeElement.blur(); document.getElementById('plan-tasks-input').value = ''; document.getElementById('plan-tasks-input').dispatchEvent(new Event('input', { bubbles:true })); }); await setEq(p, 'planning', null); await p.waitForTimeout(700); wb = await p.evaluate(WB);
  ok(T + 'unequip: write boxes back to the original computed look, no pt class/attr/vars', wb === wb0, { wb0, wb });
  await setEq(p, 'planning', 'frostCrystalPlanning');
  await p.evaluate(async () => { const ti = document.getElementById('plan-tasks-input'); ti.value = '1- مهمة أ\n2- مهمة ب\n3- مهمة ج'; ti.dispatchEvent(new Event('input', { bubbles:true })); const li = document.getElementById('plan-learn-input'); li.value = '1- درس أ\n2- درس ب'; li.dispatchEvent(new Event('input', { bubbles:true })); distributePlan(); await new Promise(r => setTimeout(r, 900)); });
  // «كل المهام محسومة»: حسم مهام اليوم بنقرات حقيقية
  const IN = sel => { const e = document.querySelector(sel); return e ? { pt:e.dataset.pt || '', cls:e.className, decor:e.querySelectorAll(':scope > .pt-decor').length, bg:getComputedStyle(e).backgroundImage.slice(0, 30), copy:getComputedStyle(e.querySelector('.es-copy')).color, before:getComputedStyle(e, '::before').display } : null; };
  for (const [pg, list, tg, fr, inf, ttl] of [['tasks', '#day-task-list', 'operations', 'frostCrystalOperations', 'infernoCrystalOperations', 'كل مهام اليوم محسومة'], ['learn', '#learn-day-task-list', 'teacher', 'frostCrystalTeacher', 'infernoCrystalTeacher', 'كل عناصر اليوم محسومة']]) {
    await nav(p, pg);
    await p.evaluate(async l => { const sleep = ms => new Promise(r => setTimeout(r, ms)); for (let k = 0; k < 10; k++) { const it = document.querySelector(l + ' > .task-item'); if (!it) break; it.querySelector('.stat-btn[data-status="done"]').click(); await sleep(1500); } }, list);
    await p.waitForTimeout(600);
    const sel = list + ' > .empty-state.is-clear'; const plain = await p.evaluate(IN, sel);
    await setEq(p, tg, fr); await p.waitForTimeout(400); let x = await p.evaluate(IN, sel);
    ok(T + tg + ' «' + ttl + '» box: Frost after equip (one decor, ice copy colour, paper dot-grid hidden)', plain && !plain.pt && x && x.pt === fr && /pt-box/.test(x.cls) && x.decor === 1 && x.copy === 'rgb(51, 96, 127)' && x.before === 'none', { plain, x });
    await p.evaluate(([l, pg]) => pg === 'tasks' ? renderTasksPage() : renderLearnPage(), [list, pg]); await p.waitForTimeout(500); await p.waitForTimeout(400); x = await p.evaluate(IN, sel);
    ok(T + tg + ' box keeps Frost after a full re-render (rebuilt by the room)', x && x.pt === fr && x.decor === 1, x);
    await setEq(p, tg, inf); await p.waitForTimeout(400); x = await p.evaluate(IN, sel);
    ok(T + tg + ' box switches to Inferno', x && x.pt === inf && x.decor === 1 && x.copy === 'rgb(205, 184, 163)', x);
    await setEq(p, tg, null); await p.waitForTimeout(400); x = await p.evaluate(IN, sel);
    ok(T + tg + ' unequip: box back to its original look exactly', x && JSON.stringify(x) === JSON.stringify(plain), { plain, x });
    await setEq(p, tg, fr);
    if (process.env.DBG) console.log('alive?', await Promise.race([p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r('raf-ok'))))), new Promise(r => setTimeout(() => r('HUNG'), 20000))]), new Date().toISOString());
    await shot(p, 'surf_' + theme + '_' + tg + '_clear', sel);
  }
  // شرائح المعاينة: كل منتج = أسطح غرفته كلها، الضغط يتنقّل دورياً، والمستطيل يطابق الغرفة الحقيقية
  await nav(p, 'tasks');
  const realItem = await p.evaluate(() => { const L = document.querySelector('#day-task-list'); const it = document.createElement('div'); it.className = 'task-item qa-fx'; it.innerHTML = codisTaskItemHtml({ id:'qa_r', text:'عينة', status:'', priority:'' }, true); L.appendChild(it); const c = getComputedStyle(it), b = getComputedStyle(it.querySelector('.stat-btn')), g = getComputedStyle(it.querySelector('.status-group'));
    const r = [c.borderTopLeftRadius, c.paddingTop, c.backgroundImage.slice(0, 60), b.borderTopLeftRadius, b.minHeight, g.gridTemplateColumns.split(' ').length, g.borderTopLeftRadius].join('|'); it.remove(); return r; });
  await p.evaluate(() => econOpenStore()); await p.waitForTimeout(1300); await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(500);
  for (const id of ['frostCrystalPlanning', 'frostCrystalOperations', 'frostCrystalTeacher', 'infernoCrystal', 'infernoCrystalOperations', 'infernoCrystalTeacher']) {
    await p.evaluate(id => document.querySelector('#cos-sub-themes .pt-mtile[data-ptid="' + id + '"] .pt-mbtn').click(), id); await p.waitForTimeout(700);
    const seq = [];
    for (let k = 0; k < 4; k++) { seq.push(await p.evaluate(() => { const S = document.querySelector('.pt-ov .pt-slides'), on = S.querySelector(':scope > .pt-slide.is-on'), th = on.querySelector('[data-pt]');
        return { i:+S.dataset.i, n:+S.dataset.n, surf:on.dataset.surface, onCount:S.querySelectorAll(':scope > .pt-slide.is-on').length, pt:th && th.dataset.pt, lab:document.querySelector('.pt-slide-lab').textContent, dots:[...document.querySelectorAll('.pt-slide-dots > i')].findIndex(x => x.classList.contains('is-on')), vis:getComputedStyle(on).visibility }; }));
      await p.click('.pt-ov .pt-slide-hit'); await p.waitForTimeout(400); }
    const surf = await p.evaluate(id => codisThemeSurfaces(CodisPlanThemes.def(id).target).map(x => x.key), id);
    ok(T + 'preview ' + id + ': slides = every surface of its room in order; tap cycles 1→2→3→1 (label + dots follow, one visible slide, all wear this theme)', seq[0].n === 3 && seq.slice(0, 3).map(x => x.surf).join() === surf.join() && seq[3].i === 0 && seq.every((x, k) => x.i === k % 3 && x.onCount === 1 && x.pt === id && x.dots === x.i && x.vis === 'visible' && x.lab.indexOf(' · ') > 0), { seq, surf });
    if (id === 'frostCrystalOperations') {
      await p.evaluate(() => codisPtSlideStep(0, 1)); await p.waitForTimeout(400);
      const pv = await p.evaluate(() => { const it = document.querySelector('.pt-ov .pt-slide.is-on .pt-pv-list > .task-item'), c = getComputedStyle(it), b = getComputedStyle(it.querySelector('.stat-btn')), g = getComputedStyle(it.querySelector('.status-group')); return [c.borderTopLeftRadius, c.paddingTop, c.backgroundImage.slice(0, 60), b.borderTopLeftRadius, b.minHeight, g.gridTemplateColumns.split(' ').length, g.borderTopLeftRadius].join('|'); });
      ok(T + 'preview task rectangle matches a real Frost operations rectangle (radius, padding, background, button + tray geometry)', pv === realItem, { pv, realItem });
      await shot(p, 'surf_' + theme + '_pv_ops_tasks', '.pt-ov-card');
      await p.click('.pt-ov .pt-slide-nav.is-prev'); await p.waitForTimeout(300);
      ok(T + 'prev arrow goes back one slide', await p.evaluate(() => document.querySelector('.pt-ov .pt-slides').dataset.i === '0'));
    }
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  }
  ok(T + 'preview mirror stylesheet built once, only preview-class selectors', await p.evaluate(() => { const st = document.getElementById('codis-pt-pv-css'); return !!st && document.querySelectorAll('#codis-pt-pv-css').length === 1 && st.sheet.cssRules.length > 100 && [...st.sheet.cssRules].every(r => !r.selectorText || /pt-pv-/.test(r.selectorText)); }));
  ok(T + 'no horizontal scroll, no duplicate ids, no errors', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth && (() => { const seen = {}; for (const e of document.querySelectorAll('[id]')) { if (seen[e.id]) return false; seen[e.id] = 1; } return true; })()) && !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}

// ---- تقليل الحركة: الثلج واللمعات ثابتة، والثيم كامل ----
{
  const o = await open(375, 'paper', true); const p = o.page; const T = 'reduced-motion 375: ';
  await p.evaluate(() => { CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 30000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; });
    ['frostCrystalPlanning', 'frostCrystalOperations', 'frostCrystalTeacher'].forEach(id => { CodisPlanThemes.buy(id); CodisPlanThemes.equip(id, 'own'); }); codisPlanThemeApply(); });
  await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); navigateToPage('planning'); await sleep(600); startNewPlan(); await sleep(500);
    const ti = document.getElementById('plan-tasks-input'); ti.value = '1- مهمة أ\n2- مهمة ب\n3- مهمة ج'; ti.dispatchEvent(new Event('input', { bubbles:true })); const li = document.getElementById('plan-learn-input'); li.value = '1- درس أ\n2- درس ب'; li.dispatchEvent(new Event('input', { bubbles:true })); distributePlan(); await sleep(900); });
  await nav(p, 'tasks'); await nav(p, 'learn'); await nav(p, 'planning');
  const r = await p.evaluate(() => { const an = [...document.querySelectorAll('.pt-decor *')].map(e => getComputedStyle(e).animationName).filter(x => x !== 'none');
    const L = ['#day-task-list', '#learn-day-task-list'].map(s => getComputedStyle(document.querySelector(s), '::before').animationName + '/' + getComputedStyle(document.querySelector(s), '::after').animationName);
    return { an, L, themed:document.querySelector('#planning-active > .plan-card').dataset.pt, snowShown:getComputedStyle(document.querySelector('#planning-active .pt-snow')).opacity, glint:getComputedStyle(document.querySelector('#planning-active .pt-glint')).opacity }; });
  ok(T + 'no decor/snow/glint animation, list snow still, theme fully present (static snow + glints visible)', !r.an.length && r.L.every(x => x === 'none/none') && r.themed === 'frostCrystalPlanning' && +r.snowShown > 0 && +r.glint > 0, r);
  ok(T + 'no errors', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}
srv.close();
console.log(`\n${pass} passed, ${fail} failed (engine: webkit)`); process.exit(fail ? 1 : 0);
