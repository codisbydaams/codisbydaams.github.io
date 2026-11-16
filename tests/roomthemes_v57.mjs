/* CODIS-V57 — ثيمات الغرف الثلاث (INFERNO CRYSTAL للتخطيط/العمليات/الأستاذ). WebKit حقيقي (محاكاة iPhone).
   Run:  PW=<path to playwright-core/index.mjs> node tests/roomthemes_v57.mjs [app.html]     (RUNS="paper:375,dark:320,paper:430" افتراضياً)
   يغطي السيناريوهات العشرين من الطلب: المربعات الثلاثة، الشراء/الرصيد/الضغط المتكرر، التجهيز المستقل لكل غرفة، إعادة التشغيل،
   شبكة 3 أعمدة + ثيمات اختبارية مؤقتة، نافذة التفاصيل (الرسمة الصحيحة، Esc/خلفية/تركيز/Tab)، بحوزتك، مظاهر البطاقات، ترحيل V56، بيانات مشوّهة، تقليل الحركة. */
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = process.argv[2] || path.join(ROOT, 'app/CODIS_FINAL.html');
const { webkit, devices } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = p === '/app/CODIS_FINAL.html' ? APP : path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':{ '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml', '.js':'text/javascript' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/app/CODIS_FINAL.html';
let pass = 0, fail = 0; const ok = (n, c, info) => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + n + (!c && info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 500) : '')); };
async function open(w, theme, reduced){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v57t-'));
  const ctx = await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'], viewport:{ width:w, height:844 }, screen:{ width:w, height:844 }, reducedMotion:reduced ? 'reduce' : 'no-preference' });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); } await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t, true), theme); };
  await boot();
  return { page, errs, boot, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const IDS = ['infernoCrystal', 'infernoCrystalOperations', 'infernoCrystalTeacher'];
const ROOMS = { planning:['planning', '#planning-empty', 'ea-plan'], operations:['tasks', '#tasks-empty', 'ea-ops'], teacher:['learn', '#learn-empty', 'ea-lrn'] };
const grant = n => CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', n, 'qa', 'admin', 'qa|' + n + '|' + Math.random(), null); return { ok:true }; });
const S = () => ({ silver:CodisWallet.silverBalance(), coins:data.wallet.balance, map:CodisPlanThemes.equippedMap(), owned:CodisPlanThemes.owned().map(d => d.id), legacy:data.inventory.planThemes.equipped,
  ptx:CodisWallet.silverTxs().filter(t => /^plantheme\|/.test(t.referenceId || '')).length, cos:JSON.stringify(data.inventory.cosmetics),
  boxes:Object.fromEntries(['#planning-empty', '#tasks-empty', '#learn-empty'].map(s => { const b = document.querySelector(s + ' > .empty-state'); return [s, { pt:b.getAttribute('data-pt') || '', decor:b.querySelectorAll(':scope > .pt-decor').length, cls:b.className, style:b.getAttribute('style') }]; })),
  dup:(() => { const seen = {}, d = []; document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) d.push(e.id); seen[e.id] = 1; }); return d; })() });
const confirmYes = async p => { await p.waitForTimeout(450); await p.evaluate(() => resolveCodisConfirm(true)); await p.waitForTimeout(800); };
const openThemes = async p => { await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1300); await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(500); };
const gridInfo = sel => { const g = document.querySelector(sel); const ts = [...g.children].filter(t => t.offsetParent !== null).map(t => t.getBoundingClientRect());
  const cut = [...g.querySelectorAll('.pt-mname, .pt-mroom, .pt-mbadge')].filter(e => e.offsetParent !== null && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)).map(e => e.className + ':' + e.textContent);
  const out = ts.filter(r => r.right > innerWidth + .5 || r.left < -.5).length;
  return { n:ts.length, rows:[...new Set(ts.map(r => Math.round(r.top)))].length, cols:[...new Set(ts.map(r => Math.round(r.left)))].length, w:[...new Set(ts.map(r => Math.round(r.width)))], cut, out, docW:document.documentElement.scrollWidth, vw:innerWidth }; };

for (const [theme, w] of (process.env.RUNS || 'paper:375,dark:320,paper:430').split(',').map(x => x.split(':'))) {
  const T = theme + ' ' + w + ': ';
  const o = await open(+w, theme); const p = o.page;
  // 1–3: المربعات الثلاثة دون خطة/مسار — كل غرفة رسمتها، بلا ثيم
  const base = {};
  for (const [tg, [pg, sel, art]] of Object.entries(ROOMS)) {
    await p.evaluate(x => navigateToPage(x), pg); await p.waitForTimeout(800);
    base[tg] = await p.evaluate(([s, a]) => { const b = document.querySelector(s + ' > .empty-state'), r = b.getBoundingClientRect(); return { vis:b.offsetParent !== null, art:!!b.querySelector('.es-mark svg.' + a), pt:b.getAttribute('data-pt') || '', w:Math.round(r.width), h:Math.round(r.height), btn:b.querySelector('.btn').getAttribute('onclick'), title:b.querySelector('.es-title').textContent }; }, [sel, art]);
  }
  ok(T + '1–3 empty boxes visible with their own drawing, unthemed', Object.values(base).every(b => b.vis && b.art && !b.pt), base);
  // 10: المتجر ثلاثة أعمدة
  await openThemes(p);
  let g = await p.evaluate(gridInfo, '#cos-sub-themes .pt-grid');
  ok(T + '10/18/19 store grid: 3 equal columns, one row, no clipped text, no horizontal overflow', g.n === 3 && g.cols === 3 && g.rows === 1 && g.w.length === 1 && !g.cut.length && !g.out && g.docW <= g.vw, g);
  // 11: ثيمات اختبارية مؤقتة ⇒ تلتف لصفوف تالية، ثم تُزال
  await p.evaluate(() => { for (let i = 0; i < 5; i++) CODIS_PLAN_THEME_DEFS.push(Object.assign({}, CODIS_PLAN_THEME_DEFS[i % 3], { id:'qaTmp' + i, name:'QA Temp Theme ' + i })); econRenderAll(); econRenderStore(); }); await p.waitForTimeout(600);
  await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(300);
  g = await p.evaluate(gridInfo, '#cos-sub-themes .pt-grid');
  ok(T + '11 extra temporary themes wrap to following rows (8 → 3 rows × 3 cols)', g.n === 8 && g.rows === 3 && g.cols === 3 && !g.cut.length && !g.out, g);
  await p.evaluate(() => { for (let i = CODIS_PLAN_THEME_DEFS.length - 1; i >= 0; i--) if (/^qaTmp/.test(CODIS_PLAN_THEME_DEFS[i].id)) CODIS_PLAN_THEME_DEFS.splice(i, 1); econRenderStore(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(300);
  ok(T + '11 temporary test themes removed (no data left)', await p.evaluate(() => CODIS_PLAN_THEME_DEFS.length === 3 && document.querySelectorAll('#cos-sub-themes .pt-mtile').length === 3 && !JSON.stringify(data).includes('qaTmp')));
  // 12–13: كل بطاقة ⇒ النافذة الكبيرة بالرسمة الصحيحة
  const prev = [];
  for (const id of IDS) {
    await p.evaluate(i => document.querySelector('#cos-sub-themes .pt-mtile[data-ptid="' + i + '"] .pt-mbtn').click(), id); await p.waitForTimeout(500);
    prev.push(await p.evaluate(i => { const ov = document.querySelector('.pt-ov'), d = CodisPlanThemes.def(i), s = ov && ov.querySelector('.pt-stage.is-big > .pt-box');
      return { id:i, tg:d.target, boxT:s && s.getAttribute('data-pt-target'), art:s ? [...s.querySelector('.es-mark svg').classList].join(' ') : '', title:s && s.querySelector('.es-title').textContent, act:ov.querySelector('.pt-ov-act').textContent, dis:ov.querySelector('.pt-ov-act').disabled, focus:document.activeElement === ov.querySelector('.pt-ov-x'), back:codisBackLayer().el === ov, room:ov.querySelector('.pt-ov-room').textContent }; }, id));
    await p.evaluate(() => document.querySelector('.pt-ov-bg').click()); await p.waitForTimeout(300);
  }
  ok(T + '12–13 each tile opens the big preview with its OWN room drawing + room/rarity/action', prev.every(x => x.boxT === x.tg && x.art.includes(ROOMS[x.tg][2]) && x.title === base[x.tg].title && /شراء بالفضة/.test(x.act) && x.focus && x.back) && prev[1].room === 'غرفة العمليات' && prev[2].room === 'غرفة الأستاذ', prev);
  ok(T + 'backdrop click closes; focus returns to the tile', await p.evaluate(() => !document.querySelector('.pt-ov') && document.activeElement && document.activeElement.closest('.pt-mtile[data-ptid="infernoCrystalTeacher"]') !== null));
  // 14: رصيد غير كافٍ
  let s0 = await p.evaluate(S);
  await p.evaluate(() => document.querySelector('.pt-mtile[data-ptid="infernoCrystalOperations"] .pt-mbtn').click()); await p.waitForTimeout(400);
  let st = await p.evaluate(() => ({ dis:document.querySelector('.pt-ov-act').disabled, note:document.querySelector('.pt-ov-note').textContent }));
  await p.evaluate(() => { econPlanThemeBuy('infernoCrystalOperations'); }); await p.waitForTimeout(600);
  let s1 = await p.evaluate(S);
  ok(T + '14 insufficient silver: action disabled with «ينقصك», no charge, not owned', st.dis && /ينقصك/.test(st.note) && s1.silver === s0.silver && !s1.owned.length && !s1.ptx, { st, s1 });
  // 5–6, 15: شراء العمليات من النافذة + ضغط متكرر ⇒ خصم واحد، النافذة تتحدّث لـ«تجهيز الثيم»
  await p.evaluate(grant, 12000); await p.evaluate(() => codisPtOvSync()); s0 = await p.evaluate(S);
  await p.evaluate(() => { const b = document.querySelector('.pt-ov-act'); b.click(); b.click(); econPlanThemeBuy('infernoCrystalOperations'); });
  const conf = await p.evaluate(() => (document.querySelector('#codis-confirm-modal') || {}).textContent || '');
  await confirmYes(p);
  await p.evaluate(() => { econPlanThemeBuy('infernoCrystalOperations'); }); await p.waitForTimeout(500);
  s1 = await p.evaluate(S);
  st = await p.evaluate(() => ({ open:!!document.querySelector('.pt-ov'), act:document.querySelector('.pt-ov-act').textContent, st:document.querySelector('.pt-ov-st').textContent }));
  ok(T + '5 confirm shows room, price, balance, remaining', /العمليات/.test(conf) && /3,499/.test(conf) && /12,000/.test(conf) && /8,501/.test(conf), conf.slice(0, 220));
  ok(T + '5/15 operations bought once (−3,499, one tx), coins untouched, not auto-equipped', s0.silver - s1.silver === 3499 && s1.ptx === 1 && s1.coins === s0.coins && s1.owned.join() === 'infernoCrystalOperations' && !s1.map.operations, s1);
  ok(T + '5 window updates after purchase → owned + «تجهيز الثيم»', st.open && /تجهيز الثيم/.test(st.act) && /تملكه/.test(st.st), st);
  // تجهيز من النافذة + نقرة مزدوجة لا تُلغي التجهيز
  await p.evaluate(() => { const b = document.querySelector('.pt-ov-act'); b.click(); const b2 = document.querySelector('.pt-ov-act'); b2.click(); }); await p.waitForTimeout(600);
  s1 = await p.evaluate(S);
  ok(T + '15 double click on equip = one equip (no equip-then-remove); applied to #tasks-empty immediately', s1.map.operations === 'infernoCrystalOperations' && s1.boxes['#tasks-empty'].pt === 'infernoCrystalOperations' && s1.boxes['#tasks-empty'].decor === 1 && !s1.boxes['#planning-empty'].pt && !s1.boxes['#learn-empty'].pt, s1.boxes);
  ok(T + '9 window shows «إزالة الثيم» + equipped state', await p.evaluate(() => /إزالة الثيم/.test(document.querySelector('.pt-ov-act').textContent) && /مجهّز الآن على غرفة العمليات/.test(document.querySelector('.pt-ov-st').textContent)));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(T + 'Esc closes the window only (store stays open), focus back on the tile', await p.evaluate(() => !document.querySelector('.pt-ov') && econStoreIsOpen() && !!(document.activeElement && document.activeElement.closest('.pt-mtile[data-ptid="infernoCrystalOperations"]'))));
  // 6–7: الأستاذ والتخطيط (API نفسه) ⇒ الغرف الثلاث مجهّزة معاً
  await p.evaluate(() => { CodisPlanThemes.buy('infernoCrystalTeacher'); CodisPlanThemes.buy('infernoCrystal'); econPlanThemeToggle('infernoCrystalTeacher'); econPlanThemeToggle('infernoCrystal'); }); await p.waitForTimeout(500);
  s1 = await p.evaluate(S);
  ok(T + '6–7 all three rooms equipped at once, each box wears its own theme', s1.map.planning === 'infernoCrystal' && s1.map.operations === 'infernoCrystalOperations' && s1.map.teacher === 'infernoCrystalTeacher' && s1.legacy === 'infernoCrystal' && s1.silver === s0.silver - 3 * 3499 && s1.ptx === 3 && Object.values(s1.boxes).every(b => b.pt && b.decor === 1), s1);
  // 16: بحوزتك
  await p.evaluate(() => econOpenVault()); await p.waitForTimeout(1300); await p.evaluate(() => econOwnSetPart('cosmetics')); await p.waitForTimeout(400);
  g = await p.evaluate(gridInfo, '#own-panel-cosmetics .pt-grid');
  st = await p.evaluate(() => ({ n:(document.querySelector('#own-tab-cosmetics .own-tab-n') || {}).textContent, on:[...document.querySelectorAll('#own-panel-cosmetics .pt-mtile.is-on')].length, rooms:[...document.querySelectorAll('#own-panel-cosmetics .pt-mroom')].map(e => e.textContent) }));
  ok(T + '16 «بحوزتك» lists the 3 owned themes in a 3-column grid with room + equipped state', g.n === 3 && g.cols === 3 && !g.cut.length && !g.out && st.on === 3 && st.rooms.length === 3, { g, st });
  await p.evaluate(() => document.querySelector('#own-panel-cosmetics .pt-mtile[data-ptid="infernoCrystalOperations"] .pt-mbtn').click()); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.pt-ov-act').click()); await p.waitForTimeout(600);
  s1 = await p.evaluate(S);
  ok(T + '8 removing the operations theme (from «بحوزتك») leaves planning & teacher untouched; original box fully restored', s1.map.operations === '' && s1.map.planning === 'infernoCrystal' && s1.map.teacher === 'infernoCrystalTeacher' && s1.boxes['#tasks-empty'].pt === '' && s1.boxes['#tasks-empty'].decor === 0 && s1.boxes['#tasks-empty'].cls === 'empty-state' && s1.boxes['#tasks-empty'].style === null && s1.boxes['#planning-empty'].decor === 1 && s1.boxes['#learn-empty'].decor === 1, s1.boxes);
  await p.evaluate(() => document.querySelector('.pt-ov-act').click()); await p.waitForTimeout(600);
  await p.evaluate(() => { codisPlanThemePreviewClose(); econCloseOwn(); econCloseStore(); }); await p.waitForTimeout(400);
  // 4: كل غرفة بعد فتحها: ثيمها، نفس المقاس والزر ووظيفته
  const rooms = {};
  for (const [tg, [pg, sel, art]] of Object.entries(ROOMS)) {
    await p.evaluate(x => navigateToPage(x), pg); await p.waitForTimeout(800);
    rooms[tg] = await p.evaluate(([s, a]) => { const b = document.querySelector(s + ' > .empty-state'), r = b.getBoundingClientRect(), c = e => getComputedStyle(e); return { pt:b.getAttribute('data-pt'), art:!!b.querySelector('.es-mark svg.' + a), w:Math.round(r.width), h:Math.round(r.height), btn:b.querySelector('.btn').getAttribute('onclick'), title:b.querySelector('.es-title').textContent, tcol:c(b.querySelector('.es-title')).color, bbg:c(b.querySelector('.btn')).backgroundImage.slice(0, 30), bg:c(b).backgroundImage.slice(0, 20), dots:c(b, '::before').position === 'absolute' ? 'shown' : 'none' }; }, [sel, art]);
  }
  ok(T + '4 each room shows its own theme with its own drawing, same text & button action, original grid hidden', Object.entries(rooms).every(([tg, r]) => r.pt === IDS[Object.keys(ROOMS).indexOf(tg)] && r.art && r.btn === base[tg].btn && r.title === base[tg].title && r.tcol === 'rgb(244, 215, 182)' && /gradient/.test(r.bbg) && /gradient/.test(r.bg) && r.dots === 'none'), rooms);
  ok(T + 'ops/teacher boxes keep their original width', ['operations', 'teacher'].every(tg => rooms[tg].w === base[tg].w), { rooms, base });
  // تطابق المعاينة الكبيرة مع المربع الحقيقي (قيم محسوبة)
  await openThemes(p);
  await p.evaluate(() => document.querySelector('#cos-sub-themes .pt-mtile[data-ptid="infernoCrystalTeacher"] .pt-mbtn').click()); await p.waitForTimeout(500);
  const par = await p.evaluate(() => { const real = document.querySelector('#learn-empty > .empty-state'), pv = document.querySelector('.pt-ov .pt-box'), k = (b, s, props) => { const e = s ? b.querySelector(s) : b, c = getComputedStyle(e); return props.map(x => c.getPropertyValue(x)).join('|'); };
    const P = ['color', 'font-size', 'font-weight'], B = ['background-image', 'color', 'border-radius', 'min-height', 'font-size'];
    return [['title', k(real, '.es-title', P), k(pv, '.es-title', P)], ['btn', k(real, '.btn', B), k(pv, '.btn', B)], ['box', k(real, null, ['background-image', 'border-radius']), k(pv, null, ['background-image', 'border-radius'])], ['gem', k(real, '.ea .accw.pop', ['fill']), k(pv, '.ea .accw.pop', ['fill'])]].filter(x => x[1] !== x[2]); });
  ok(T + 'large preview = real teacher box (same computed styles)', !par.length, par);
  // Tab يبقى داخل النافذة
  const trap = await p.evaluate(() => { const ov = document.querySelector('.pt-ov'); const f = [...ov.querySelectorAll('button:not([disabled])')]; f[f.length - 1].focus(); ov.dispatchEvent(new KeyboardEvent('keydown', { key:'Tab', bubbles:true, cancelable:true })); return document.activeElement === f[0] || ov.contains(document.activeElement); });
  ok(T + 'keyboard: Tab is trapped inside the window', trap);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const cos = await p.evaluate(S);
  ok(T + '17 card cosmetics untouched', cos.cos === (await p.evaluate(() => JSON.stringify(data.inventory.cosmetics))) && await p.evaluate(() => document.querySelectorAll('#cos-sub-cards .cos-tile').length) === 2);
  await p.evaluate(() => econCloseStore());
  // 9: إعادة التشغيل
  await o.boot(); await p.evaluate(() => navigateToPage('tasks')); await p.waitForTimeout(700); await p.evaluate(() => navigateToPage('learn')); await p.waitForTimeout(700); await p.evaluate(() => navigateToPage('planning')); await p.waitForTimeout(800);
  s1 = await p.evaluate(S);
  ok(T + '9 after restart: per-room equips persist and are applied; no extra charge', s1.map.planning === 'infernoCrystal' && s1.map.operations === 'infernoCrystalOperations' && s1.map.teacher === 'infernoCrystalTeacher' && Object.values(s1.boxes).every(b => b.pt && b.decor === 1) && s1.ptx === 3 && s1.silver === s0.silver - 3 * 3499, s1);
  // idempotent: تطبيق متكرر لا يكرر الزخارف ولا يعيد DOM
  const idem = await p.evaluate(() => { const d0 = document.querySelector('#tasks-empty .pt-decor'); for (let i = 0; i < 5; i++){ codisPlanThemeApply(); renderTasksPage(); renderLearnPage(); } return document.querySelector('#tasks-empty .pt-decor') === d0 && ['#planning-empty', '#tasks-empty', '#learn-empty'].every(s => document.querySelectorAll(s + ' > .empty-state > .pt-decor').length === 1); });
  ok(T + 'apply is idempotent (no duplicate decor, no DOM rebuild)', idem);
  ok(T + 'no duplicate DOM ids', !s1.dup.length, s1.dup.slice(0, 5));
  ok(T + '20 no page/console errors', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}
// ترحيل V56 + توافق نسخة 3.43 + بيانات مشوّهة
{
  const o = await open(375, 'paper'); const p = o.page; const K = 'life_organizer_data_v1';
  const put = async b => { await p.evaluate(([k, x]) => { const d = JSON.parse(localStorage.getItem(k)); d.inventory = d.inventory || {}; d.inventory.planThemes = x; localStorage.setItem(k, JSON.stringify(d)); }, [K, b]); o.errs.length = 0; await o.boot(); await p.evaluate(() => navigateToPage('planning')); await p.waitForTimeout(500); };
  await put({ owned:[{ id:'infernoCrystal', source:'store', sourceRef:'tx1', acquiredAt:'2026-11-16T00:00:00.000Z', paid:3499 }], equipped:'infernoCrystal' });
  let r = await p.evaluate(() => ({ pt:data.inventory.planThemes, map:CodisPlanThemes.equippedMap(), box:document.querySelector('#planning-empty > .empty-state').getAttribute('data-pt') }));
  ok('V56 data migrates: planning equip + ownership kept, other rooms empty', r.map.planning === 'infernoCrystal' && !r.map.operations && !r.map.teacher && r.pt.owned.length === 1 && r.pt.owned[0].paid === 3499 && r.pt.equippedByTarget.planning === 'infernoCrystal' && r.box === 'infernoCrystal', r);
  // 3.43 أزال تجهيز التخطيط وأسقط الخريطة ⇒ الحقل القديم يغلب
  await put({ owned:[{ id:'infernoCrystal' }, { id:'infernoCrystalTeacher' }], equipped:'', equippedByTarget:{ planning:'infernoCrystal', teacher:'infernoCrystalTeacher' } });
  r = await p.evaluate(() => CodisPlanThemes.equippedMap());
  ok('legacy `equipped` stays the source of truth for planning (old client unequip wins); teacher kept', r.planning === '' && r.teacher === 'infernoCrystalTeacher', r);
  // ثيم غرفة لا يُجهَّز على غرفة أخرى حتى لو عُبث بالبيانات
  await put({ owned:[{ id:'infernoCrystal' }, { id:'infernoCrystalOperations' }], equipped:'infernoCrystalOperations', equippedByTarget:{ operations:'infernoCrystal', teacher:'notOwned' } });
  r = await p.evaluate(() => ({ map:CodisPlanThemes.equippedMap(), boxes:['#planning-empty', '#tasks-empty', '#learn-empty'].map(s => document.querySelector(s + ' > .empty-state').getAttribute('data-pt') || '') }));
  ok('cross-room / unowned equips are never applied', !r.map.planning && !r.map.operations && !r.map.teacher && r.boxes.every(x => !x), r);
  ok('equip() refuses an unowned theme', await p.evaluate(() => { data.inventory.planThemes.owned = []; const x = CodisPlanThemes.equip('infernoCrystalTeacher'); return !x.ok && x.reason === 'notowned'; }));
  for (const bad of [null, 'x', [], { owned:'q', equipped:7, equippedByTarget:'z' }, { owned:[{ id:'infernoCrystalTeacher' }, { id:'infernoCrystalTeacher' }, { id:'<s>' }, 5], equippedByTarget:[1] }, { owned:[{ id:'futureTheme9' }], equipped:'', equippedByTarget:{ moon:'futureTheme9', __proto__x:'a', teacher:7 } }]) {
    await put(bad);
    r = await p.evaluate(() => ({ pt:data.inventory.planThemes, boxes:['#planning-empty', '#tasks-empty', '#learn-empty'].map(s => document.querySelector(s + ' > .empty-state').getAttribute('data-pt') || '') }));
    const by = r.pt.equippedByTarget, good = Array.isArray(r.pt.owned) && typeof r.pt.equipped === 'string' && by && typeof by === 'object' && !Array.isArray(by) && ['planning', 'operations', 'teacher'].every(k => typeof by[k] === 'string') && new Set(r.pt.owned.map(x => x.id)).size === r.pt.owned.length;
    ok('odd stored planThemes ' + JSON.stringify(bad).slice(0, 70) + ' → boots, normalized', good && !o.errs.length && r.boxes.every(x => !x), { r, e:o.errs.slice(0, 2) });
  }
  ok('unknown future target key with an owned future theme is kept (not applied)', await p.evaluate(() => data.inventory.planThemes.equippedByTarget.moon === 'futureTheme9'));
  await o.close();
}
// تقليل الحركة: الغرف الثلاث مثبّتة بلا حركة زخرفية
{
  const o = await open(390, 'dark', true); const p = o.page;
  await p.evaluate(grant, 12000); await p.evaluate(ids => ids.forEach(i => { CodisPlanThemes.buy(i); CodisPlanThemes.equip(i); }), IDS);
  const r = [];
  for (const [pg, sel] of Object.values(ROOMS)) { await p.evaluate(x => navigateToPage(x), pg); await p.waitForTimeout(700);
    r.push(await p.evaluate(s => { const b = document.querySelector(s + ' > .empty-state'); return { pt:b.getAttribute('data-pt'), anim:[...b.querySelectorAll('.pt-decor > *')].map(e => getComputedStyle(e).animationName).filter(n => n && n !== 'none'), sheen:getComputedStyle(b.querySelector('.pt-sheen')).display }; }, sel)); }
  ok('reduced motion: all 3 rooms themed, no decor animation, sheen hidden', r.every(x => x.pt && !x.anim.length && x.sheen === 'none'), r);
  ok('reduced motion run: no errors', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}
srv.close();
console.log(`\n${pass} passed, ${fail} failed (engine: webkit)`); process.exit(fail ? 1 : 0);
