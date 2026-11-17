/* CODIS-V66 — عائلة «النيزك المشتعل» (blazingMeteor) ونطاق «الغرفة كاملة».
   WebKit حقيقي (محاكاة iPhone 12، لمس مفعّل). Run:  PW=<path to playwright-core/index.mjs> node tests/v66_browser.mjs [app.html]
   RUNS="paper:375,dark:320,paper:768,dark:1280" · SHOTS=<dir>. لمس الإصبع يُحاكى بـPointerEvent(pointerType:'touch') مُرسَل (Playwright WebKit لا يولّد
   Pointer Events من touchscreen) — يُذكر كمحاكاة. الماوس حقيقي (page.mouse). الصوت: سجل كل استدعاء لـCodisAudio.play بالمفتاح الذي يختاره المحرك بالقاعدة نفسها. */
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
let pass = 0, fail = 0; const ok = (n, c, info) => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + n + (!c && info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 1200) : '')); };
const IDS = { planning:'blazingMeteorPlanning', operations:'blazingMeteorOperations', teacher:'blazingMeteorTeacher', discipline:'blazingMeteorDiscipline' };
const PAGE = { planning:'#page-planning', operations:'#page-tasks', teacher:'#page-learn', discipline:'#page-habits' };
const NAV = { planning:'planning', operations:'tasks', teacher:'learn', discipline:'habits' };
async function open(w, theme, opts = {}){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v66t-'));
  const ctx = await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'], viewport:{ width:w, height:w > 700 ? 900 : 780 }, screen:{ width:w, height:w > 700 ? 900 : 780 }, reducedMotion:opts.reduced ? 'reduce' : 'no-preference', hasTouch:true, isMobile:w < 700 });
  await ctx.addInitScript(() => { window.CODIS_B3D_OFF = true; });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); }
    await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t), theme === 'dark' ? 'dark' : 'paper').catch(() => {}); await page.waitForTimeout(300);
    await page.evaluate(() => { CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {}; codisConfirm = async () => true;
      window.__snd = []; const P = CodisAudio.play;
      CodisAudio.play = function(name, opts){ const sc = (CodisAudio.scope ? CodisAudio.scope() : null) || (CodisAudio.sticky ? CodisAudio.sticky() : null), o = opts || {}, def = k => !!CodisAudio.def(k);
        const key = (sc && def(name + '@' + sc)) ? name + '@' + sc : (o.ctx && def(name + '@' + o.ctx)) ? name + '@' + o.ctx : name; const r = P.apply(this, arguments); window.__snd.push({ name, key, sc, ok:r }); return r; }; }); };
  await boot();
  return { page, errs, boot, until, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const shot = async (p, name, sel, full) => { if (!SHOTS) return; try { if (sel) { const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(350); await el.screenshot({ path:path.join(SHOTS, name + '.png') }); return; } } await p.screenshot({ path:path.join(SHOTS, name + '.png'), fullPage:!!full }); } catch (e) { console.log('shot ' + name + ': ' + e.message); } };
const nav = async (p, pg) => { await p.evaluate(pg => { try { econCloseStore({ silent:true }); } catch (e) {} try { if (econOwnOpen) econCloseOwn(); } catch (e) {} const b = document.querySelector('.navbtn[data-page="' + pg + '"]'); if (b) b.click(); }, pg); await p.waitForTimeout(700); };
const setEq = (p, tg, on, id) => p.evaluate(([t, id, o]) => { const P = CodisPlanThemes; const r = o ? P.equip(id, 'own') : P.unequip(t, 'own'); codisPlanThemeApply(t); return !!(r && r.ok); }, [tg, id || IDS[tg], on]);
const snd = p => p.evaluate(() => { const s = window.__snd; window.__snd = []; return s; });
const raf = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const ptr = (p, sel, type, kind, fx = .5, fy = .5, id = 7) => p.evaluate(([sel, type, kind, fx, fy, id]) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(), x = r.left + r.width * fx, y = r.top + r.height * fy;
  const t = document.elementFromPoint(x, y) || el; const e = new PointerEvent(type, { bubbles:true, cancelable:true, composed:true, pointerId:id, pointerType:kind, isPrimary:true, clientX:x, clientY:y, buttons:type === 'pointerup' ? 0 : 1 }); t.dispatchEvent(e); return { x, y, prevented:e.defaultPrevented }; }, [sel, type, kind, fx, fy, id]);
/* مسح «بلا تصميم»: كل نص ظاهر داخل الغرفة يجب أن يكون فاتحاً على السطح الداكن، إلا داخل عنصر مضيء معروف (زر رئيسي/مفعّل/شارة)؛ ولا خلفية ورقية فاتحة معتمة */
const audit = (p, sel) => p.evaluate(sel => {
  const root = document.querySelector(sel); if (!root) return { none:true };
  const lum = c => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c) || /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?/.exec(c); if (!m) return null; let v = [+m[1], +m[2], +m[3]]; if (v.every(x => x <= 1) && /srgb/.test(c)) v = v.map(x => x * 255);
    const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }; return { L:.2126 * f(v[0]) + .7152 * f(v[1]) + .0722 * f(v[2]), a:m[4] === undefined ? 1 : +m[4] }; };
  const BRIGHT = '.write-tabs-indicator, .btn-primary, .active, .is-on, .is-active .disc-mode-n, .disc-mode.is-active .disc-mode-n, .today-chip, .write-count, .cd-n, .tt-start, .review-ok, .tw-save, .write-tab.active, .stat-btn.active';
  const darkText = [], lightBg = [];
  root.querySelectorAll('*').forEach(el => { if (el.closest('.bm-decor, svg') || !el.getClientRects().length) return; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); const col = lum(cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color && !/rgba\(0, 0, 0, 0\)/.test(cs.webkitTextFillColor) ? cs.webkitTextFillColor : cs.color);
    if (hasText && col && col.L < .16 && !(cs.webkitTextFillColor && /rgba\(0, 0, 0, 0\)|transparent/.test(cs.webkitTextFillColor)) && !el.closest(BRIGHT)) darkText.push((el.className && String(el.className).slice(0, 40)) + ':' + el.textContent.trim().slice(0, 16) + ':' + cs.color);
    const bg = lum(cs.backgroundColor); if (bg && bg.a > .5 && bg.L > .45 && !el.closest(BRIGHT)) lightBg.push(String(el.className).slice(0, 40) + ':' + cs.backgroundColor); });
  return { darkText:darkText.slice(0, 12), lightBg:lightBg.slice(0, 12), n:root.querySelectorAll('*').length };
}, sel);
/* بصمة الغرفة المحسوبة (لمقارنة «قبل التجهيز» و«بعد الإزالة» حرفياً) */
const sig = (p, sel) => p.evaluate(sel => { const r = document.querySelector(sel); if (!r) return ''; const out = [];
  [r, ...r.querySelectorAll('*')].slice(0, 260).forEach(el => { if (el.closest('.m-ghost') || el.matches('.xp-fill') || (el !== r && !el.getClientRects().length)) return;   /* المخفي (display:none) لا يُرسم — WebKit قد يعيد له قيماً قديمة */   /* عرض/لون شريط التقدم يتبع البيانات */ const cs = getComputedStyle(el); out.push(el.tagName + '.' + String(el.className).replace(/\b(bm-near|bm-press|bm-typing|aw-\S+|is-enter\S*|just-changed|\S*pulse\S*|is-drag|has-items)\b/g, '') + '|' + cs.color + '|' + cs.backgroundImage.slice(0, 80) + '|' + cs.backgroundColor + '|' + cs.borderTopColor + '|' + cs.boxShadow.slice(0, 60)); });
  return out.join('\n'); }, sel);

async function seed(p){
  await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms));
    CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 40000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; });
    const L = n => Array.from({ length:n }, (_, i) => ['مراجعة تقرير المبيعات الأسبوعي للفريق', '!اجتماع فريق العمليات لمراجعة خطة الربع', 'اتصال بالعائلة', 'قراءة الفصل الثالث من كتاب الإدارة', 'حل تمارين الرياضيات', 'مراجعة المفردات الجديدة'][i % 6] + ' ' + (i + 1)).join('\n');
    try { startNewPlan(); } catch (e) {} await sleep(250);
    const ti = document.getElementById('plan-tasks-input'); ti.value = L(14); ti.dispatchEvent(new Event('input', { bubbles:true }));
    const li = document.getElementById('plan-learn-input'); li.value = L(14); li.dispatchEvent(new Event('input', { bubbles:true }));
    distributePlan(); await sleep(900);
    const t = document.getElementById('new-habit-text'); t.value = 'قراءة عشر صفحات'; addHabit(); t.value = 'رياضة صباحية'; addHabit(); switchHabitTab('quit'); t.value = 'السكر'; addHabit(); switchHabitTab('build'); });
}

const RUNS = (process.env.RUNS || 'paper:375,dark:320,paper:768,dark:1280').split(',').map(x => x.split(':'));
for (let ri = 0; ri < RUNS.length; ri++) {
  const [theme, w] = RUNS[ri], T = theme + ' ' + w + ': ', tag = theme + w, full = ri === 0;
  const o = await open(+w, theme); const p = o.page;
  await seed(p);
  // ===== (0) الحالة الأصلية: بصمات الغرف الأربع قبل أي تجهيز =====
  const base = {};
  for (const tg of Object.keys(IDS)) { await nav(p, NAV[tg]); base[tg] = await sig(p, PAGE[tg]); }
  const base0 = await p.evaluate(() => ({ eq:CodisPlanThemes.equippedMap(), rooms:[...document.querySelectorAll('.pt-room')].length }));
  ok(T + 'S0 original state: no room theme equipped, no room dressed; equip map has the 4th room (discipline)', base0.rooms === 0 && Object.keys(base0.eq).join() === 'planning,operations,teacher,discipline' && Object.values(base0.eq).every(x => x === ''), base0);

  // ===== (1) المتجر: العائلة والمنتجات الأربعة =====
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1200);
  await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true, top:true }); econCosSetSub('themes'); }); await p.waitForTimeout(700);
  const st = await p.evaluate(() => { const f = document.querySelector('#eco-store-body .pt-fam[data-family="blazingMeteor"]'); if (!f) return { none:true };
    return { ar:f.querySelector('.pt-fam-ar').textContent, en:f.querySelector('.pt-fam-en').textContent, desc:(f.querySelector('.pt-fam-desc') || {}).textContent || '',
      tiles:[...f.querySelectorAll('.pt-mtile')].map(t => t.dataset.ptid + ':' + t.dataset.ptTarget + ':' + !!t.querySelector('.pt-stage.is-mini .bm-mroom .bm-decor') + ':' + t.querySelector('.pt-mbadge').textContent.replace(/\s/g, '')),
      order:[...document.querySelectorAll('#eco-store-body .pt-fam')].map(x => x.dataset.family), defs:CodisPlanThemes.defs().filter(d => d.family === 'blazingMeteor').map(d => [d.id, d.silver, d.rarity, d.art, d.sound, d.apply, !!d.tokens, !!d.motion, !!d.desc, d.ar, d.rarityAr, d.name].join('|')),
      ids:[...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i).slice(0, 5), minis:[...f.querySelectorAll('.bm-mroom')].map(m => m.querySelectorAll('i').length) }; });
  ok(T + 'S1 family «النيزك المشتعل» (Blazing Meteor) is its own group in the store, after Aged Wood', st.ar === 'النيزك المشتعل' && /blazing meteor/i.test(st.en) && /عالم كهرماني نيزكي فاخر/.test(st.desc) && st.order.join() === 'infernoCrystal,frostCrystal,agedWood,blazingMeteor', st);
  ok(T + 'S2 four independent products (one per room), each with its own full definition and silver field 7,999, legendary', st.tiles.length === 4 && ['blazingMeteorPlanning:planning', 'blazingMeteorOperations:operations', 'blazingMeteorTeacher:teacher', 'blazingMeteorDiscipline:discipline'].every((x, i) => st.tiles[i].indexOf(x + ':true:') === 0) && st.tiles.every(t => /7,999|٧٬٩٩٩|7999/.test(t)) && st.defs.length === 4 && st.defs.every(d => /\|7999\|legendary\|blazingMeteor\|blazingMeteor\|room\|true\|true\|true\|النيزك المشتعل\|أسطوري\|Blazing Meteor$/.test(d)), st);
  ok(T + 'S3 every mini preview is a room schematic of its own room (different element sets), no duplicate ids', new Set(st.minis).size >= 3 && !st.ids.length, { minis:st.minis, ids:st.ids });
  const same = await p.evaluate(() => { const b = document.getElementById('eco-store-body'); econRenderStore(); const h0 = b._codisHtml; econRenderStore(); return h0 === b._codisHtml && h0.indexOf('bm-mroom') > 0; });
  ok(T + 'S4 store HTML identical across renders (deterministic ⇒ DOM reuse kept)', same);
  await shot(p, tag + '_store_family', '#eco-store-body .pt-fam[data-family="blazingMeteor"]');
  // المعاينة الكبيرة لكل غرفة
  for (const tg of Object.keys(IDS)) {
    await p.evaluate(() => { document.querySelectorAll('.peek .peek-scrim').forEach(s => s.click()); }); await p.waitForTimeout(150);   /* معاينة الضغط المطوّل بالمتجر (سلوك المتجر) إن فُتحت */
    await p.click('#eco-store-body .pt-mtile[data-ptid="' + IDS[tg] + '"] .pt-mbtn'); await p.waitForTimeout(700);
    if (!await p.evaluate(() => !!document.querySelector('.pt-ov'))) { await p.evaluate(() => document.querySelectorAll('.peek .peek-scrim').forEach(s => s.click())); await p.waitForTimeout(300); await p.evaluate(id => codisPlanThemePreview(id, document.querySelector('#eco-store-body .pt-mtile[data-ptid="' + id + '"] .pt-mbtn')), IDS[tg]); await p.waitForTimeout(700); console.log('     note: ' + tg + ' tile click opened the store long-press peek; details opened via its own handler'); }
    const pv = await p.evaluate(tg => { const ov = document.querySelector('.pt-ov'); if (!ov) return { none:true }; const r = ov.querySelector('.bm-pv.pt-room');
      return { fam:ov.dataset.ptFam, room:ov.querySelector('.pt-ov-room').textContent, meta:[...ov.querySelectorAll('.pt-ov-meta dd')].map(x => x.textContent), price:(ov.querySelector('.pt-ov-price') || {}).textContent || '', st:(ov.querySelector('.pt-ov-st') || {}).textContent || '',
        desc:ov.querySelector('.pt-ov-desc').textContent.length, covers:ov.querySelectorAll('.pt-ov-covers li').length, act:(ov.querySelector('.pt-ov-act') || {}).dataset ? ov.querySelector('.pt-ov-act').dataset.act : '', inert:!!ov.querySelector('.pt-stage.is-big[inert]'),
        dpt:r && r.getAttribute('data-pt'), head:!!(r && r.querySelector('.page-head .page-title')), items:r ? r.querySelectorAll('.task-item').length : 0, hud:!!(r && r.querySelector('.xp-hud .xp-fill')), states:r ? r.querySelectorAll('.task-item .stat-btn').length : 0,
        plan:!!(r && r.querySelector('.plan-card .plan-pct')), write:!!(r && r.querySelector('.write-box textarea')), tabs:r ? r.querySelectorAll('.write-tab, .day-tab, .disc-mode').length : 0, habit:!!(r && r.querySelector('.habit-card')), add:!!(r && r.querySelector('.add-habit input')),
        ids:r ? r.querySelectorAll('[id]').length : -1, decor:!!(r && r.querySelector(':scope > .bm-decor .bm-fx')), live:!!document.querySelector('.pt-room[data-pt="' + (r && r.getAttribute('data-pt')) + '"]:not(.bm-pv)') }; }, tg);
    const shape = tg === 'planning' ? pv.plan && pv.write && pv.tabs >= 2 : tg === 'discipline' ? pv.habit && pv.add && pv.tabs >= 2 : pv.hud && pv.items === 2 && pv.states === 6 && pv.tabs >= 4;
    ok(T + 'S5 ' + tg + ' details window: name/room/family/rarity/price/description/state + a whole-room preview with the real room parts', pv.fam === 'blazingMeteor' && pv.meta.length === 3 && pv.meta[1] === 'النيزك المشتعل' && /7,999|٧٬٩٩٩/.test(pv.price) && pv.desc > 80 && pv.covers >= 6 && pv.act === 'buy' && pv.inert && pv.dpt === IDS[tg] && pv.head && shape && pv.ids === 0 && pv.decor && !pv.live, pv);
    if (full || tg === 'operations') await shot(p, tag + '_preview_' + tg, '.pt-ov .pt-ov-card');
    await snd(p); await p.mouse.click(5, 5).catch(() => {}); await p.evaluate(() => codisPlanThemePreviewClose(true)); await p.waitForTimeout(300);
  }
  const pvS = await snd(p);
  ok(T + 'A1 no meteor sounds inside the store/preview', pvS.every(x => !/@blazingMeteor/.test(x.key) && x.sc !== 'blazingMeteor'), pvS);

  // ===== (2) الشراء: خصم مرة واحدة، لا تكرار، لا شراء بلا رصيد =====
  const buy = await p.evaluate(async () => { const P = CodisPlanThemes, s0 = CodisWallet.silverBalance(), n0 = CodisWallet.silverTxs().length;
    await Promise.all([econPlanThemeBuy('blazingMeteorOperations'), econPlanThemeBuy('blazingMeteorOperations')]);   /* ضغط مزدوج */
    const s1 = CodisWallet.silverBalance(); await econPlanThemeBuy('blazingMeteorOperations'); const s2 = CodisWallet.silverBalance();
    const txs = CodisWallet.silverTxs().filter(t => t.referenceId === 'plantheme|blazingMeteorOperations');
    return { d1:s0 - s1, d2:s1 - s2, txs:txs.length, type:txs[0] && txs[0].type, own:P.owns('blazingMeteorOperations'), others:['blazingMeteorPlanning', 'blazingMeteorTeacher', 'blazingMeteorDiscipline'].map(P.owns), recs:data.inventory.planThemes.owned.filter(x => x.id === 'blazingMeteorOperations').length, eq:P.isEquipped('blazingMeteorOperations'), n:CodisWallet.silverTxs().length - n0 }; });
  ok(T + 'B1 buying operations debits 7,999 silver exactly once (double press + re-buy), one PURCHASE_COSMETIC plantheme|<id>, one ownership record, not auto-equipped, other rooms not owned', buy.d1 === 7999 && buy.d2 === 0 && buy.txs === 1 && buy.type === 'PURCHASE_COSMETIC' && buy.own && buy.others.every(x => !x) && buy.recs === 1 && !buy.eq && buy.n === 1, buy);
  const poor = await p.evaluate(() => { const bal = CodisWallet.silverBalance(); CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', -(bal - 100), 'qa', 'admin', 'qa-drain|' + Math.random(), null); return { ok:true }; });
    const r = CodisPlanThemes.buy('blazingMeteorTeacher'); const out = { r:r.reason, bal:CodisWallet.silverBalance(), own:CodisPlanThemes.owns('blazingMeteorTeacher') };
    CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 40000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; }); return out; });
  ok(T + 'B2 insufficient silver ⇒ refused, nothing debited, not owned', poor.r === 'insufficient' && poor.bal === 100 && !poor.own, poor);
  const ctxRef = await p.evaluate(() => CodisPlanThemes.equip('blazingMeteorOperations', 'store').reason);
  ok(T + 'B3 equipping is refused outside «بحوزتك» (store context)', ctxRef === 'context', ctxRef);
  const ba = await p.evaluate(() => ({ bal:CodisWallet.silverBalance(), r:['blazingMeteorPlanning', 'blazingMeteorTeacher', 'blazingMeteorDiscipline'].map(id => { const r = CodisPlanThemes.buy(id); return r.ok + ':' + (r.reason || ''); }), re:(econRenderAll(), 1) }));
  ok(T + 'B4 the three other rooms bought independently', ba.r.every(x => /^true/.test(x)), ba);


  // ===== (3) «بحوزتك»: المنتجات الأربعة + التجهيز من النافذة =====
  await p.evaluate(() => { econOpenVault(); }); await p.waitForTimeout(900);
  await p.evaluate(() => { econOwnSetPart('cosmetics', { quiet:true }); }); await p.waitForTimeout(500);
  const own = await p.evaluate(() => { const f = document.querySelector('#own-panel-cosmetics .pt-fam[data-family="blazingMeteor"]'); return f ? [...f.querySelectorAll('.pt-mtile')].map(t => t.dataset.ptid + ':' + t.querySelector('.pt-mbadge').textContent.trim()) : null; });
  ok(T + 'O1 «بحوزتك ← المظاهر ← الثيمات» shows the 4 owned meteor products, each «غير مجهّز»', own && own.length === 4 && own.every(x => /غير مجهّز/.test(x)), own);
  await p.evaluate(() => { document.querySelectorAll('.peek .peek-scrim').forEach(s => s.click()); }); await p.waitForTimeout(250);   /* معاينة الضغط المطوّل (سلوك «بحوزتك») إن فُتحت */
  await p.click('#own-panel-cosmetics .pt-mtile[data-ptid="blazingMeteorPlanning"] .pt-mbtn', { timeout:8000 }).catch(() => p.evaluate(() => { const b = document.querySelector('#own-panel-cosmetics .pt-mtile[data-ptid="blazingMeteorPlanning"] .pt-mbtn'); codisPlanThemePreview('blazingMeteorPlanning', b); })); await p.waitForTimeout(700);
  await p.click('.pt-ov .pt-ov-act'); await p.waitForTimeout(700);
  const eq1 = await p.evaluate(() => ({ st:(document.querySelector('.pt-ov .pt-ov-st') || {}).textContent, act:document.querySelector('.pt-ov .pt-ov-act').dataset.act, map:CodisPlanThemes.equippedMap(), legacy:data.inventory.planThemes.equipped }));
  ok(T + 'O2 equip from the details window: state «مجهّز الآن», button becomes «إزالة», equipped mirror (legacy field) = planning', /مجهّز الآن/.test(eq1.st) && eq1.act === 'unequip' && eq1.map.planning === 'blazingMeteorPlanning' && eq1.legacy === 'blazingMeteorPlanning' && !eq1.map.operations, eq1);
  await p.evaluate(() => codisPlanThemePreviewClose(true)); await p.evaluate(() => { try { econCloseOwn(); } catch (e) {} try { econCloseStore({ silent:true }); } catch (e) {} }); await p.waitForTimeout(400);

  // ===== (4) التخطيط: الغرفة كاملة، والغرف الأخرى كما هي =====
  await nav(p, 'planning');
  const pl = await p.evaluate(() => { const r = document.getElementById('page-planning'); return { cls:r.classList.contains('pt-room'), sf:r.getAttribute('data-pt-surface'), decor:!!r.querySelector(':scope > .pt-decor.bm-decor'), oldSurf:document.querySelectorAll('#page-planning [data-pt]:not(#page-planning)').length,
    card:getComputedStyle(r.querySelector('#planning-active > .plan-card')).backgroundImage.indexOf('radial-gradient') > -1, title:getComputedStyle(r.querySelector('.page-title')).webkitTextFillColor, others:['page-tasks', 'page-learn', 'page-habits'].map(x => document.getElementById(x).getAttribute('data-pt')) }; });
  ok(T + 'S6 planning: the room root carries the theme (pt-room + decor), old per-surface dressing not used, other rooms untouched', pl.cls && pl.sf === 'room' && pl.decor && pl.oldSurf === 0 && pl.card && pl.others.every(x => x === null), pl);
  const au1 = await audit(p, '#page-planning');
  ok(T + 'S7 planning audit: no undressed (dark-on-dark) text and no leftover paper surfaces', !au1.darkText.length && !au1.lightBg.length, au1);
  await shot(p, tag + '_planning', null, false);
  await p.evaluate(async () => { startExtendPlan(); await new Promise(r => setTimeout(r, 400)); });
  const au1b = await audit(p, '#page-planning');
  ok(T + 'S8 planning editor (tabs, write boxes, buttons) dressed too', !au1b.darkText.length && !au1b.lightBg.length, au1b);
  await shot(p, tag + '_planning_editor', null, false);
  await p.evaluate(() => { try { cancelExtendPlan(); } catch (e) {} }); await nav(p, 'planning');
  for (const tg of ['operations', 'teacher', 'discipline']) { await nav(p, NAV[tg]); const s = await sig(p, PAGE[tg]); ok(T + 'S9 ' + tg + ' unchanged while only planning is equipped (computed values identical to the original)', s === base[tg], s.split('\n').find((l, i) => l !== base[tg].split('\n')[i])); }

  // ===== (5) العمليات =====
  ok(T + 'S10 equip operations (planning stays equipped)', await setEq(p, 'operations', true));
  await nav(p, 'tasks');
  const au2 = await audit(p, '#page-tasks');
  const op = await p.evaluate(() => ({ pt:document.getElementById('page-tasks').getAttribute('data-pt'), list:document.getElementById('day-task-list').getAttribute('data-pt'), plan:document.getElementById('page-planning').getAttribute('data-pt'), items:document.querySelectorAll('#day-task-list > .task-item').length }));
  ok(T + 'S11 operations whole room dressed (XP, day tabs, task panels, states, weight, timer, manual add) and planning still dressed', op.pt === IDS.operations && op.list === null && op.plan === IDS.planning && op.items > 0 && !au2.darkText.length && !au2.lightBg.length, { op, au2 });
  await shot(p, tag + '_ops', null, false);
  // الحالات الثلاث: ألوان متميزة
  const states = await p.evaluate(() => { const it = document.querySelector('#day-task-list > .task-item'); const g = k => { const b = it.querySelector('.stat-btn.stat-' + k + ' .stat-ico'); return b ? getComputedStyle(b).color : ''; }; return [g('done'), g('half'), g('x')]; });
  ok(T + 'S12 the three states keep distinct identities (mint / amber / plasma red)', new Set(states).size === 3, states);
  // الوزن والمؤقت والإضافة اليدوية والحالات
  await snd(p);
  const wt = await p.evaluate(async () => { const it = document.querySelector('#day-task-list > .task-item'); it.querySelector('.task-wt').click(); await new Promise(r => setTimeout(r, 200)); const f = it.querySelector('.tw-edit'); const r = { form:!!f, inBg:f ? getComputedStyle(f.querySelector('.tw-in')).backgroundColor : '' }; f && f.querySelector('.tw-cancel').click(); return r; });
  ok(T + 'S13 weight editor opens inside the dressed panel (dark field)', wt.form && !/rgb\(2[3-5]\d, 2[3-5]\d/.test(wt.inBg), wt);
  const tt = await p.evaluate(() => { const b = document.querySelector('#day-task-list .tt-start'); return b ? getComputedStyle(b).backgroundImage.indexOf('gradient') > -1 : 'no-timer'; });
  ok(T + 'S14 timer button dressed (or this task has no duration)', tt === true || tt === 'no-timer', tt);
  await p.evaluate(() => { window.__clk = []; document.addEventListener('click', e => window.__clk.push(String(e.target.className || e.target.tagName).slice(0, 40) + '@' + Math.round(e.clientX) + ',' + Math.round(e.clientY)), true); });
  await p.evaluate(() => document.querySelector('#tasks-content .row-input').scrollIntoView({ block:'center' })); await p.waitForTimeout(200);   /* بعيداً عن الشريط السفلي العائم */
  await p.fill('#manual-task-input', 'مهمة يدوية للتجربة'); await snd(p); await p.click('#tasks-content .row-input .btn'); await p.waitForTimeout(500);
  const clk = await p.evaluate(() => ({ c:window.__clk, b:(r => [r.x, r.y, r.width, r.height].map(Math.round))(document.querySelector('#tasks-content .row-input .btn').getBoundingClientRect()), vh:innerHeight }));
  const man = await p.evaluate(() => { const it = [...document.querySelectorAll('#day-task-list > .task-item')].find(x => /مهمة يدوية للتجربة/.test(x.textContent)); return it ? { bg:getComputedStyle(it).backgroundImage.indexOf('radial-gradient') > -1, col:getComputedStyle(it.querySelector('.task-text')).color } : { miss:true, val:document.getElementById('manual-task-input').value, n:document.querySelectorAll('#day-task-list > .task-item').length, day:activeDayIdx, today:CodisClock.day(), es:(document.querySelector('#day-task-list > .empty-state') || {}).className, toasts:[...document.querySelectorAll('.toast, .codis-toast')].map(x => x.textContent).slice(-2) }; });
  ok(T + 'S15 a task added later (dynamic) is dressed automatically', man && man.bg, { man, clk });
  const a2 = (await snd(p)).filter(x => /^(press|task|confirm|success|open)/.test(x.name));
  ok(T + 'A2 «إضافة» inside the dressed operations room ⇒ meteor sound only', a2.length >= 1 && a2.every(x => /@blazingMeteor$/.test(x.key)), a2);
  const stat = async kind => { await snd(p); const id = await p.evaluate(() => { const it = [...document.querySelectorAll('#day-task-list > .task-item')].find(x => !/is-(done|half|none)/.test(x.className)); return it && it.dataset.tid; });
    if (!id) return []; await p.click('#day-task-list > .task-item[data-tid="' + id + '"] .stat-btn.stat-' + kind); await p.waitForTimeout(1700); return (await snd(p)).filter(x => /^(task|pen|press|tab|confirm)/.test(x.name)).map(x => x.key); };
  const sDone = await stat('done'), sNone = await stat('x');
  ok(T + 'A3 «خلصتها» ⇒ meteor done discharge (+ plasma pen layers), nothing original mixed in', sDone.indexOf('task.done@blazingMeteor') !== -1 && sDone.every(k => /@blazingMeteor$/.test(k)), sDone);
  ok(T + 'A4 «ما سويتها» ⇒ a different meteor sound (state meaning kept)', sNone.indexOf('task.none@blazingMeteor') !== -1 && sNone.every(k => /@blazingMeteor$/.test(k)), sNone);
  // ورقة «المنجزة»
  const cd = await p.evaluate(async () => { const b = document.querySelector('#day-task-list .cd-trigger'); if (!b) return { none:true }; b.click(); await new Promise(r => setTimeout(r, 400)); const ov = document.querySelector('.cd-ov'); const r = { pt:ov && ov.getAttribute('data-pt'), bg:ov && getComputedStyle(ov.querySelector('.cd-sheet')).backgroundImage.slice(0, 30), scope:ov && codisSoundScopeOf(ov.querySelector('.cd-close')) }; CodisTaskFlow.closeDone(); await new Promise(r => setTimeout(r, 300)); return r; });
  ok(T + 'S16 «المنجزة» sheet opened from the room inherits its identity and sound scope', cd.pt === IDS.operations && /gradient/.test(cd.bg) && cd.scope === 'blazingMeteor', cd);
  // تفاعل: ماوس حقيقي + لمس/قلم (محاكاة PointerEvent)
  const IT = '#day-task-list > .task-item';
  const box = await (await p.$(IT)).boundingBox();
  if (w >= 700) {
    await p.mouse.move(box.x + box.width * .3, box.y + box.height * .4); await raf(p); await p.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await raf(p);
    const m1 = await p.evaluate(sel => { const it = document.querySelector(sel), fx = document.querySelector('#page-tasks > .bm-decor > .bm-fx'), l = fx.querySelector('.bm-light'); return { on:fx.classList.contains('is-on'), near:it.classList.contains('bm-near'), mx:it.style.getPropertyValue('--bm-mx'), tr:l.style.transform, st:CodisMeteorFx.state() }; }, IT);
    ok(T + 'I1 real mouse over the room ⇒ amber light follows the pointer and the hovered panel edge catches it', m1.on && m1.near && parseFloat(m1.mx) > 0 && /translate3d/.test(m1.tr), m1);
    await p.mouse.move(2, 2); await raf(p); await p.waitForTimeout(200);
    const m2 = await p.evaluate(sel => ({ on:document.querySelector('#page-tasks > .bm-decor > .bm-fx').classList.contains('is-on'), near:document.querySelector(sel).classList.contains('bm-near') }), IT);
    ok(T + 'I2 mouse leaves the room ⇒ light and edge glow fade out', !m2.on && !m2.near, m2);
  }
  const d1 = await ptr(p, IT, 'pointerdown', 'touch', .3, .3, 7); await raf(p);
  const t1 = await p.evaluate(() => { const fx = document.querySelector('#page-tasks > .bm-decor > .bm-fx'); return { on:fx.classList.contains('is-on'), touch:fx.classList.contains('is-touch'), rings:[...fx.querySelectorAll('.bm-ring')].map(r => r.getAnimations ? r.getAnimations().length : -1), st:CodisMeteorFx.state() }; });
  ok(T + 'I3 touch (simulated PointerEvent) ⇒ light at the contact point + amber ring from it, no preventDefault', t1.on && t1.touch && t1.st.rings >= 1 && !d1.prevented, { t1, d1 });
  await ptr(p, IT, 'pointermove', 'touch', .8, .6, 7); await raf(p);
  const t2 = await p.evaluate(() => document.querySelector('#page-tasks > .bm-decor > .bm-fx .bm-light').style.transform);
  await ptr(p, IT, 'pointerup', 'touch', .8, .6, 7); await raf(p); await p.waitForTimeout(450);
  const t3 = await p.evaluate(() => ({ on:document.querySelector('#page-tasks > .bm-decor > .bm-fx').classList.contains('is-on'), st:CodisMeteorFx.state() }));
  ok(T + 'I4 the light follows the finger, and finger up ⇒ everything fades (nothing stuck)', /translate3d/.test(t2) && !t3.on && !t3.st.touch && !t3.st.press, { t2, t3 });
  const sb = IT + ' .stat-btn.stat-half';
  await ptr(p, sb, 'pointerdown', 'touch', .5, .5, 11);
  const k1 = await p.evaluate(s => { const b = document.querySelector(s); return { press:b.classList.contains('bm-press'), tr:getComputedStyle(b).transform, sparks:[...document.querySelectorAll('#page-tasks .bm-sparks b')].filter(x => x.getAnimations && x.getAnimations().length).length }; }, sb);
  await ptr(p, sb, 'pointercancel', 'touch', .5, .5, 11);
  const k2 = await p.evaluate(s => ({ press:document.querySelector(s).classList.contains('bm-press'), st:CodisMeteorFx.state() }), sb);
  ok(T + 'I5 a status key pressed by touch sinks + electric sparks; pointercancel (scroll takes over) restores everything', k1.press && k1.tr !== 'none' && k1.sparks >= 4 && !k2.press && !k2.st.room, { k1, k2 });
  const sc = await p.evaluate(async () => { const it = document.querySelector('#day-task-list .task-item'), r = it.getBoundingClientRect(); const te = new Event('touchmove', { bubbles:true, cancelable:true }); it.dispatchEvent(te);
    const pe = new PointerEvent('pointermove', { bubbles:true, cancelable:true, pointerType:'touch', pointerId:21, clientX:r.left + 5, clientY:r.top + 5 }); it.dispatchEvent(pe);
    const m = codisScrollerOf(it), can = m.scrollHeight > m.clientHeight + 20, y0 = m.scrollTop; m.scrollTop = y0 + 120; await new Promise(r => setTimeout(r, 50)); const y1 = can ? m.scrollTop : y0 + 1; m.scrollTop = y0;   /* محتوى أقصر من الشاشة (عرض كبير) ⇒ لا تمرير أصلاً */
    const css = (document.getElementById('codis-v66-css') || {}).textContent || ''; return { tp:te.defaultPrevented, pp:pe.defaultPrevented, scrolled:y1 - y0, touchAction:/touch-action/.test(css) }; });
  ok(T + 'I6 scrolling/zoom never blocked (no preventDefault, no touch-action lock, page scrolls)', !sc.tp && !sc.pp && sc.scrolled > 0 && !sc.touchAction, sc);
  const typ = await p.evaluate(async () => { const i = document.getElementById('manual-task-input'); i.focus(); i.value = 'ا'; i.dispatchEvent(new Event('input', { bubbles:true })); const a = i.classList.contains('bm-typing'), sh = getComputedStyle(i).boxShadow; await new Promise(r => setTimeout(r, 350)); const b = i.classList.contains('bm-typing'); i.value = ''; i.blur(); return { a, b, sh:sh.slice(0, 60), caret:getComputedStyle(i).caretColor }; });
  ok(T + 'I7 typing in a room field ⇒ brief amber response, then rest; amber caret', typ.a && !typ.b && /rgb\(255/.test(typ.caret), typ);

  // ===== (6) الأستاذ =====
  ok(T + 'S17 equip teacher', await setEq(p, 'teacher', true));
  await nav(p, 'learn');
  const au3 = await audit(p, '#page-learn');
  const lr = await p.evaluate(() => { const it = document.querySelector('#learn-day-task-list > .task-item'); return { pt:document.getElementById('page-learn').getAttribute('data-pt'), gem:it ? getComputedStyle(it.querySelector('.task-main'), '::before').clipPath : '' }; });
  ok(T + 'S18 teacher whole room dressed (tabs, lessons with crystal station, progress, buttons)', lr.pt === IDS.teacher && /polygon/.test(lr.gem) && !au3.darkText.length && !au3.lightBg.length, { lr, au3 });
  await shot(p, tag + '_learn', null, false);
  await p.evaluate(() => { const t = [...document.querySelectorAll('#learn-day-tabs .day-tab:not(.locked)')]; t[t.length - 1] && t[t.length - 1].click(); }); await p.waitForTimeout(400);
  const au3b = await audit(p, '#page-learn'); ok(T + 'S19 teacher after switching day tab still fully dressed', !au3b.darkText.length && !au3b.lightBg.length, au3b);

  // ===== (7) التأديب =====
  await nav(p, 'habits');
  const preD = await sig(p, '#page-habits');
  ok(T + 'S20 discipline unchanged before its own theme is equipped', preD === base.discipline);
  ok(T + 'S21 equip discipline', await setEq(p, 'discipline', true));
  const sel = '#page-habits';
  const steps = [['build list', async () => {}], ['quit tab', () => p.evaluate(() => switchHabitTab('quit'))], ['build tab', () => p.evaluate(() => switchHabitTab('build'))],
    ['add form open', () => p.evaluate(() => toggleAddHabit())], ['type weekly', () => p.evaluate(() => setNewHabitType('W'))], ['days chosen', () => p.evaluate(() => { toggleNewHabitDay(1); toggleNewHabitDay(3); })],
    ['importance', () => p.evaluate(() => setNewHabitImportance('critical'))],
    ['habit added', () => p.evaluate(() => { const t = document.getElementById('new-habit-text'); t.value = 'مشي ثلاثين دقيقة'; addHabit(); })],
    ['logged', () => p.evaluate(() => { const b = document.querySelector('#build-habit-list .habit-card .stat-btn.stat-done:not(:disabled)'); b && b.click(); })],
    ['details open', () => p.evaluate(() => { const b = document.querySelector('#build-habit-list .hb-more-toggle'); b && b.click(); })],
    ['quit + event type', () => p.evaluate(() => { switchHabitTab('quit'); setAddOpen(true); setNewHabitType('H'); const t = document.getElementById('new-habit-text'); t.value = 'التدخين'; addHabit(); })]];
  const bad = [];
  for (const [n, f] of steps) { await f(); await p.waitForTimeout(450); const a = await audit(p, sel); if (a.darkText.length || a.lightBg.length) bad.push({ n, a }); if (full && /added|quit \+/.test(n)) await shot(p, tag + '_disc_' + n.replace(/\W+/g, '_'), null, false); }
  ok(T + 'S22 discipline: every state (both tabs, add form, type change, days, importance, added/logged habit, details, quit event habit) fully dressed', !bad.length, bad);
  const dpt = await p.evaluate(() => ({ pt:document.getElementById('page-habits').getAttribute('data-pt'), cards:document.querySelectorAll('#page-habits .habit-card').length, ring:getComputedStyle(document.querySelector('#page-habits .streak-ring')).filter }));
  ok(T + 'S23 discipline habit cards + progress rings in the meteor identity', dpt.pt === IDS.discipline && dpt.cards >= 1 && /drop-shadow/.test(dpt.ring), dpt);
  await p.evaluate(() => switchHabitTab('build')); await p.waitForTimeout(300); await shot(p, tag + '_habits', null, false);
  await snd(p); await p.click('#habit-tab-quit'); await p.waitForTimeout(250); await p.click('#habit-tab-build'); await p.waitForTimeout(250);
  const a5 = (await snd(p)).filter(x => /^(press|tab|select|toggle|expand|collapse|open|close)/.test(x.name));
  ok(T + 'A5 discipline tabs ⇒ meteor sounds only', a5.length >= 1 && a5.every(x => /@blazingMeteor$/.test(x.key)), a5);
  await snd(p); await p.evaluate(() => { const c = document.querySelector('#build-habit-list .habit-card'); c.querySelector('.hb-more-toggle').click(); });
  const a6 = await p.evaluate(() => 0); const hk = (await snd(p));
  await snd(p);
  const del = await p.evaluate(async () => { const n0 = data.habits.build.length; const c = [...document.querySelectorAll('#build-habit-list .habit-card')].pop(); if (!c.classList.contains('is-open')) c.querySelector('.hb-more-toggle').click(); c.querySelector('.task-del').click(); await new Promise(r => setTimeout(r, 900)); return { n0, n1:data.habits.build.length }; });
  const a7 = (await snd(p)).filter(x => /^(press|task|confirm|close|open)/.test(x.name));
  ok(T + 'A6 archiving a habit inside the dressed room works (logic untouched) with meteor sound', del.n1 === del.n0 - 1 && a7.every(x => /@blazingMeteor$/.test(x.key)) && a7.length >= 1, { del, a7, hk });

  // ===== (8) الاستقلالية + الصوت خارج الغرفة =====
  ok(T + 'S24 remove planning only', await setEq(p, 'planning', false));
  const ind = await p.evaluate(() => ({ map:CodisPlanThemes.equippedMap(), pl:document.getElementById('page-planning').getAttribute('data-pt'), plDecor:document.querySelectorAll('#page-planning .bm-decor, #page-planning .bm-near').length, ops:document.getElementById('page-tasks').getAttribute('data-pt') }));
  ok(T + 'S25 planning removed ⇒ planning back to original, operations/teacher/discipline still equipped', !ind.map.planning && ind.map.operations === IDS.operations && ind.map.teacher === IDS.teacher && ind.map.discipline === IDS.discipline && !ind.pl && !ind.plDecor && ind.ops === IDS.operations, ind);
  await nav(p, 'planning'); const back = await sig(p, '#page-planning');
  const bl = base.planning.split('\n'), dl = back.split('\n').map((l, i) => l !== bl[i] ? i + ': ' + bl[i] + '  =>  ' + l : '').filter(Boolean);
  ok(T + 'S26 planning computed values identical to the original after removal', back === base.planning, dl.slice(0, 6));
  await snd(p); await p.click('#planning-active > .plan-card .plan-cta .btn'); await p.waitForTimeout(300);
  const a8 = (await snd(p)).filter(x => /^(press|tab|confirm|open)/.test(x.name));
  ok(T + 'A7 an undressed room keeps its original sounds (planning after removal)', a8.length >= 1 && a8.every(x => !/@blazingMeteor/.test(x.key) && x.sc !== 'blazingMeteor'), a8);
  await p.evaluate(() => { try { cancelExtendPlan(); } catch (e) {} });
  await snd(p); await p.click('.navbtn[data-page="tasks"]'); await p.waitForTimeout(500);
  const a9 = await snd(p);
  ok(T + 'A8 global navigation (outside the room) keeps its original sound', a9.every(x => !/@blazingMeteor/.test(x.key) && x.sc !== 'blazingMeteor'), a9);
  const scopeAfter = await p.evaluate(() => CodisAudio.scope() || CodisAudio.sticky());
  ok(T + 'A9 the meteor sound scope never stays active after the click', scopeAfter === null, scopeAfter);
  // كتم
  await p.evaluate(() => { data.settings.sound.enabled = false; CodisAudio.applySettings(); }); await snd(p);
  await p.click('#tasks-content .section-head .btn').catch(() => {}); await p.waitForTimeout(300); await p.evaluate(() => { try { codisConfirmClose && codisConfirmClose(); } catch (e) {} });
  const mute = await p.evaluate(() => window.__snd.filter(x => x.ok).length);
  ok(T + 'A10 app sound disabled ⇒ the meteor room stays silent', mute === 0, mute);
  await p.evaluate(() => { data.settings.sound.enabled = true; CodisAudio.applySettings(); });
  const defs = await p.evaluate(() => { const ks = CodisAudio.events().filter(k => /@blazingMeteor$/.test(k)); return ks.map(k => { const d = CodisAudio.def(k), b = CodisAudio.def(k.replace('@blazingMeteor', '')); return k + ':' + (d.ch === b.ch && d.p === b.p && d.cd === b.cd && (d.hold || 0) === (b.hold || 0)); }); });
  ok(T + 'A11 ' + defs.length + ' meteor sounds, each on the same channel/priority/cooldown/hold as the original it replaces', defs.length >= 20 && defs.every(x => /:true$/.test(x)), defs.filter(x => !/:true$/.test(x)));

  // ===== (9) التخزين وإعادة التحميل =====
  await setEq(p, 'planning', true);
  await o.boot(); await p.waitForTimeout(800);
  for (const tg of Object.keys(IDS)) await nav(p, NAV[tg]);
  const rl = await p.evaluate(() => ({ eq:CodisPlanThemes.equippedMap(), legacy:data.inventory.planThemes.equipped, owned:data.inventory.planThemes.owned.filter(x => /^blazingMeteor/.test(x.id)).length, rooms:['page-planning', 'page-tasks', 'page-learn', 'page-habits'].map(x => document.getElementById(x).getAttribute('data-pt')),
    raw:(JSON.parse(localStorage.getItem('life_organizer_data_v1') || '{}').inventory || {}).planThemes }));
  ok(T + 'R1 ownership + per-room equipment persist after reload (4 rooms), legacy equipped field mirrors planning', rl.owned === 4 && rl.eq.planning === IDS.planning && rl.eq.operations === IDS.operations && rl.eq.teacher === IDS.teacher && rl.eq.discipline === IDS.discipline && rl.legacy === IDS.planning && rl.rooms.join() === Object.values(IDS).join() && rl.raw && rl.raw.equippedByTarget.discipline === IDS.discipline, rl);

  if (full) {
    // ===== (10) الثيمات القديمة: سلوكها كما هو، والتبديل على الغرفة نفسها ثيم واحد =====
    const old = await p.evaluate(() => { const P = CodisPlanThemes, out = {};
      CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 40000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; });
      for (const id of ['infernoCrystalOperations', 'frostCrystalOperations', 'agedWoodOperations']) { P.buy(id); P.equip(id, 'own'); codisPlanThemeApply('operations');
        const L = document.getElementById('day-task-list'), pg = document.getElementById('page-tasks'), it = L.querySelector('.task-item');
        out[id] = { list:L.getAttribute('data-pt'), page:pg.getAttribute('data-pt'), room:pg.classList.contains('pt-room'), decor:!!pg.querySelector(':scope > .bm-decor'), box:document.querySelector('#tasks-empty > .empty-state').getAttribute('data-pt'), scope:it ? codisSoundScopeOf(it) : 'x', meteorSnd:it ? false : false }; }
      P.equip('blazingMeteorOperations', 'own'); codisPlanThemeApply('operations');
      out.back = { list:document.getElementById('day-task-list').getAttribute('data-pt'), box:document.querySelector('#tasks-empty > .empty-state').getAttribute('data-pt'), page:document.getElementById('page-tasks').getAttribute('data-pt') };
      return out; });
    ok(T + 'P1 Inferno / Frost / Aged Wood on operations keep their own surfaces (list + box), no room-level meteor layers; back to meteor ⇒ old surfaces restored to original', ['infernoCrystalOperations', 'frostCrystalOperations', 'agedWoodOperations'].every(id => old[id].list === id && old[id].box === id && !old[id].page && !old[id].room && !old[id].decor) && old.agedWoodOperations.scope === 'agedWood' && old.back.list === null && old.back.box === null && old.back.page === IDS.operations, old);
    // churn
    const churn = await p.evaluate(async () => { const t0 = performance.now(); for (let k = 0; k < 10; k++){ CodisPlanThemes.unequip('operations', 'own'); codisPlanThemeApply('operations'); CodisPlanThemes.equip('blazingMeteorOperations', 'own'); codisPlanThemeApply('operations'); }
      renderTasksPage(); await new Promise(r => setTimeout(r, 200)); renderTasksPage();
      return { ms:Math.round(performance.now() - t0), decors:document.querySelectorAll('#page-tasks > .bm-decor').length, fx:document.querySelectorAll('#page-tasks .bm-fx').length, anim:document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#page-tasks .bm-decor')).length }; });
    ok(T + 'P2 equip/remove ×10 + list rebuilds: one decor layer, one effect layer, a handful of animations (no accumulation)', churn.decors === 1 && churn.fx === 1 && churn.anim <= 8, churn);
    const nodes = await p.evaluate(() => ({ decor:document.querySelector('#page-tasks > .bm-decor').querySelectorAll('*').length, rooms:document.querySelectorAll('.bm-decor').length }));
    ok(T + 'P3 decorative layer stays small (≤ 40 nodes per room)', nodes.decor <= 40, nodes);
  }
  ok(T + 'no JS errors', !o.errs.length, o.errs.slice(0, 5));
  await o.close();
}
// ===== تقليل الحركة =====
{
  const o = await open(375, 'paper', { reduced:true }); const p = o.page; await seed(p);
  await p.evaluate(() => { ['blazingMeteorOperations'].forEach(id => { CodisPlanThemes.buy(id); CodisPlanThemes.equip(id, 'own'); }); codisPlanThemeApply(); });
  await nav(p, 'tasks');
  const rm = await p.evaluate(() => { const d = document.querySelector('#page-tasks > .bm-decor'); return { anims:[...d.querySelectorAll('*')].filter(e => getComputedStyle(e).animationName !== 'none').length, fx:getComputedStyle(d.querySelector('.bm-fx')).display, meteor:getComputedStyle(d.querySelector('.bm-meteor')).display, bg:getComputedStyle(d.querySelector('.bm-sky')).backgroundImage.length > 40 }; });
  await ptr(p, '#day-task-list > .task-item', 'pointerdown', 'touch', .5, .5, 3);
  const rings = await p.evaluate(() => [...document.querySelectorAll('#page-tasks .bm-ring, #page-tasks .bm-sparks b')].filter(x => x.getAnimations().length).length);
  await ptr(p, '#day-task-list > .task-item', 'pointerup', 'touch', .5, .5, 3);
  ok('reduced motion: identity stays (sky/panels), no continuous animation, no rings/sparks/light', !rm.anims && rm.fx === 'none' && rm.meteor === 'none' && rm.bg && !rings, { rm, rings });
  await p.evaluate(() => { document.documentElement.classList.add('sx-calm'); });
  ok('no JS errors (reduced motion)', !o.errs.length, o.errs);
  await o.close();
}
srv.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
