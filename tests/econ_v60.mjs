/* CODIS-V60 — الجواهر + محتويات الصناديق + «العناصر» + التجهيز من «بحوزتك» فقط. WebKit حقيقي (محاكاة iPhone) + عرض حاسوب.
   Run:  PW=<path to playwright-core/index.mjs> node tests/econ_v60.mjs [app.html]     (RUNS="paper:375,dark:320,paper:430,paper:1280")
   لا يمنح الجواهر بالتطبيق: الاختبار وحده يضيفها بمعاملة ADMIN_GRANT صريحة (محاكاة مصدر مستقبلي) ليختبر الشراء. */
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
async function open(w, theme, seedFn){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v60t-'));
  const desk = w >= 900;
  const opts = desk ? { viewport:{ width:w, height:900 }, deviceScaleFactor:1, hasTouch:false, isMobile:false } : { ...devices['iPhone 12'], viewport:{ width:w, height:844 }, screen:{ width:w, height:844 } };
  const ctx = await webkit.launchPersistentContext(prof, opts);
  await ctx.addInitScript(() => { window.CODIS_B3D_OFF = true; });   /* مشهد الفتح 2D (WebGL غير موثوق بالمحاكاة) */
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); } await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t, true), theme); };
  await boot();
  if (seedFn) { await page.evaluate(seedFn); await boot(); }
  return { page, errs, boot, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const shot = async (p, name, sel) => { if (!SHOTS) return; try { if (sel) { const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); await el.screenshot({ path:path.join(SHOTS, name + '.png') }); return; } } await p.screenshot({ path:path.join(SHOTS, name + '.png') }); } catch (e) { console.log('shot fail', name, e.message.split('\n')[0]); } };
const grantGems = (p, n) => p.evaluate(n => CodisWallet.transact([], () => { const t = CodisWallet.applyGems('ADMIN_GRANT', n, 'qa', 'admin', 'qa|' + Math.random(), null); return t ? { ok:true } : { ok:false }; }), n);
const BAL = () => ({ coin:CodisWallet.balance(), silver:CodisWallet.silverBalance(), gems:CodisWallet.gemBalance(), gtx:CodisWallet.gemTxs().length, ctx:data.wallet.transactions.length, stx:CodisWallet.silverTxs().length,
  boxes:JSON.stringify(data.inventory.boxes), passes:CodisPasses.owned().length, pouches:CodisPouches.owned().length, hc:CodisHolidayCards.usable().length, items:CodisInventory.owned().length });
const KINDS_OK = ['pass', 'holiday', 'pouch'];

for (const [theme, w] of (process.env.RUNS || 'paper:375,dark:320,paper:430,paper:1280').split(',').map(x => x.split(':'))) {
  const T = theme + ' ' + w + ': ', tag = theme + w;
  const o = await open(+w, theme); const p = o.page;
  await p.evaluate(() => { CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {}; window.__cfm = []; const c0 = codisConfirm; codisConfirm = async (o) => { window.__cfm.push(o); return true; }; });

  // ---- 1) الجواهر: البنية الأولية (صفر بلا منحة) ----
  const g0 = await p.evaluate(() => ({ g:JSON.stringify(data.wallet.gems), bal:CodisWallet.gemBalance(), name:econGemsCfg().name, types:econGemTxTypes() }));
  ok(T + 'gems wallet exists, starts at 0 with an empty ledger (no free gems); 3 independent currencies', g0.g === '{"balance":0,"lifetimeEarned":0,"lifetimeSpent":0,"transactions":[]}' && g0.bal === 0 && g0.name === 'الجواهر' && g0.types.join() === 'PURCHASE_BOX,ADMIN_GRANT', g0);
  await p.evaluate(() => econOpenStore()); await p.waitForTimeout(1300); await p.evaluate(() => econStoreSetPart('boxes', { quiet:true })); await p.waitForTimeout(400);
  let st = await p.evaluate(() => ({ gemLine:!!document.querySelector('#eco-store-body .eco-balance .eco-gem-line .eco-gem'), btns:[...document.querySelectorAll('#eco-boxes .bx-card')].map(c => ({ gem:!!c.querySelector('.bx-buy .eco-gem, .bx-buy .bx-buy-s'), coin:!!c.querySelector('.bx-buys .eco-coin:not(.eco-gem)'), dis:c.querySelector('.bx-buy').disabled, lab:c.querySelector('.bx-buy').getAttribute('aria-label') })),
    docW:document.documentElement.scrollWidth <= innerWidth }));
  ok(T + 'store: gem balance line in header; box buttons show only the gem price (no coin, no «ينقصك») and stay tappable at 0 gems', st.gemLine && st.btns.length === 5 && st.btns.every(b => b.gem && !b.coin && !b.dis && /جوهرة/.test(b.lab) && !/ينقصك/.test(b.lab)) && st.docW, st);
  const icons = await p.evaluate(() => { const vis = e => getComputedStyle(e).display !== 'none'; const c = document.querySelector('#eco-store-body .eco-balance-main > .eco-coin'), sv = document.querySelector('#eco-store-body .eco-silver-line .eco-silver'), g = document.querySelector('#eco-store-body .eco-gem-line .eco-gem');
    return { coinSvg:!!c.querySelector('svg') && vis(c.querySelector('svg')), coinMedal:getComputedStyle(c, '::before').content, silverSvg:vis(sv.querySelector('svg')), silverMedal:getComputedStyle(sv, '::before').content, gemSvg:vis(g.querySelector('.eco-gem-ico')), gemMedal:getComputedStyle(g, '::before').content, nq:/ينقصك/.test(document.body.innerText) }; });
  ok(T + 'store uses the original app coin + silver icons (no store medallion), gems show the diamond icon; no «ينقصك» text anywhere', icons.coinSvg && icons.silverSvg && icons.gemSvg && /none|normal/.test(icons.coinMedal) && /none|normal/.test(icons.silverMedal) && /none|normal/.test(icons.gemMedal) && !icons.nq, icons);
  await shot(p, tag + '_store_boxes_0gems', '#eco-boxes');
  const before0 = await p.evaluate(BAL);
  const ins = await p.evaluate(async () => { const r = CodisBoxes.buy('bx1'), r10 = CodisBoxes.buyOpenMany('bx1'); window.__toasts = []; const st0 = showToast; showToast = (m) => { window.__toasts.push(m); }; await econBuyBox('bx1'); await econBuyBox10('bx1'); showToast = st0; return { r, r10, toasts:window.__toasts }; });
  ok(T + 'insufficient gems: engine + UI refuse (single and ×10) with «ما عندك جواهر كافية» (no amount), nothing deducted', ins.r.reason === 'insufficient' && ins.r.need === 35 && ins.r10.reason === 'insufficient' && ins.toasts.length === 2 && ins.toasts.every(m => /^ما عندك جواهر كافية/.test(m) && !/ينقصك/.test(m)) && JSON.stringify(await p.evaluate(BAL)) === JSON.stringify(before0), ins);

  // ---- 2) الشراء الفردي بالجواهر + الفتح ----
  await grantGems(p, 3000);
  const b1 = await p.evaluate(BAL);
  const buy = await p.evaluate(() => { const r = CodisBoxes.buy('bx2'); return { ok:r.ok, price:r.price, box:r.box, tx:CodisWallet.gemTxs().slice(-1)[0] }; });
  const b2 = await p.evaluate(BAL);
  ok(T + 'buy 1 box: −67 gems only (coins/silver untouched), gem ledger PURCHASE_BOX with unique ref, box unopened · GEMS · paid 67', buy.ok && buy.price === 67 && b2.gems === b1.gems - 67 && b2.coin === b1.coin && b2.silver === b1.silver && b2.ctx === b1.ctx && b2.stx === b1.stx && buy.tx.type === 'PURCHASE_BOX' && buy.tx.currency === 'GEMS' && buy.tx.amount === -67 && /^box\|bx2\|/.test(buy.tx.referenceId) && buy.box.status === 'unopened' && buy.box.currency === 'GEMS' && buy.box.paid === 67, { buy, b1, b2 });
  const op = await p.evaluate(uid => { const c0 = { pa:CodisPasses.owned().length, po:CodisPouches.owned().length, hc:CodisHolidayCards.usable().length, it:CodisInventory.owned().length }; const r = CodisBoxes.open(uid); const again = CodisBoxes.open(uid);
    return { ok:r.ok, kind:r.item && r.item.kind, pass:!!r.pass, pouch:!!r.pouch, holiday:!!r.holiday, owned:!!r.owned, cos:!!r.cosmetic, again:again.reason, c0, c1:{ pa:CodisPasses.owned().length, po:CodisPouches.owned().length, hc:CodisHolidayCards.usable().length, it:CodisInventory.owned().length }, box:CodisBoxes.get(uid) }; }, buy.box.uid);
  const grew = (op.c1.pa - op.c0.pa) + (op.c1.po - op.c0.po) + (op.c1.hc - op.c0.hc);
  ok(T + 'open owned box: prize is PASS/HOLIDAY/POUCH, granted to its own system (not reward inventory), box marked opened with its link, second open refused', op.ok && KINDS_OK.includes(op.kind) && !op.owned && !op.cos && grew === 1 && op.c1.it === op.c0.it && op.again === 'opened' && op.box.status === 'opened' && !!(op.box.passUid || op.box.pouchUid || op.box.holidayUid), op);

  // ---- 3) ×10 ----
  const g10 = await p.evaluate(() => { const b0 = CodisWallet.gemBalance(), c0 = CodisWallet.balance(), n0 = CodisWallet.gemTxs().length; const r = CodisBoxes.buyOpenMany('bx3');
    return { ok:r.ok, n:r.n, total:r.total, d:b0 - CodisWallet.gemBalance(), coin:c0 === CodisWallet.balance(), txs:CodisWallet.gemTxs().length - n0, kinds:r.items.map(x => x.item.kind), boxes:new Set(r.items.map(x => x.box.uid)).size, prizes:new Set(r.items.map(x => (x.pass || x.pouch || x.holiday || {}).uid)).size, before:r.balanceBefore, after:r.balanceAfter }; });
  ok(T + 'buy+open ×10: −1,050 gems in one atomic op, 10 gem tx, 10 distinct boxes and 10 distinct allowed prizes, coins untouched', g10.ok && g10.n === 10 && g10.total === 1050 && g10.d === 1050 && g10.coin && g10.txs === 10 && g10.kinds.every(k => KINDS_OK.includes(k)) && g10.boxes === 10 && g10.prizes === 10 && g10.before - g10.after === 1050, g10);

  // ---- 4) حماية: فشل الحفظ ⇒ تراجع كامل (الجواهر + الصناديق + العناصر)، لا سالب، لا تكرار ----
  const rb = await p.evaluate(BAL);
  const fs1 = await p.evaluate(() => { codisSaveSuspended = 'fail'; let a, b; try { a = CodisBoxes.buy('bx1'); b = CodisBoxes.buyOpenMany('bx1'); } finally { codisSaveSuspended = false; } return { a:a.reason, b:b.reason }; });
  ok(T + 'save failure on buy and on buy+open ×10: rolled back completely (gems, gem ledger, boxes, passes/pouches/holiday)', fs1.a === 'save' && fs1.b === 'save' && JSON.stringify(await p.evaluate(BAL)) === JSON.stringify(rb), { fs1, rb, now:await p.evaluate(BAL) });
  const guard = await p.evaluate(() => { let neg, dup1, dup2; CodisWallet.transact([], () => { neg = CodisWallet.applyGems('PURCHASE_BOX', -1e9, 'x', 'qa', 'qa|neg'); dup1 = CodisWallet.applyGems('ADMIN_GRANT', 5, 'x', 'qa', 'qa|dup'); dup2 = CodisWallet.applyGems('ADMIN_GRANT', 5, 'x', 'qa', 'qa|dup'); return { ok:true }; });
    const bad = CodisWallet.applyGems('EARN_DAILY', 50, 'x', 'qa', 'qa|t'); return { neg, dup1:!!dup1, dup2, bad, bal:CodisWallet.gemBalance() }; });
  ok(T + 'gem ledger guards: no negative balance, same (type+ref) never applied twice, unknown types refused', guard.neg === null && guard.dup1 && guard.dup2 === null && guard.bad === null && guard.bal >= 0, guard);
  const rapid = await p.evaluate(async () => { window.__ebo = econBoxOpenFor; econBoxOpenFor = function(){}; const b0 = CodisWallet.gemBalance(), n0 = CodisBoxes.owned().length; await Promise.all([econBuyBox('bx1'), econBuyBox('bx1'), econBuyBox('bx1')]); const r = { d:b0 - CodisWallet.gemBalance(), n:CodisBoxes.owned().length - n0, cfm:window.__cfm.slice(-1)[0] }; econBoxOpenFor = window.__ebo; return r; });
  ok(T + 'rapid triple tap on «شراء»: exactly one purchase; confirm shows price, gem balance and remaining in gems', rapid.d === 35 && rapid.n === 1 && /35 جوهرة/.test(rapid.cfm.message) && /رصيد الجواهر/.test(rapid.cfm.message) && /المتبقي بعد الشراء/.test(rapid.cfm.message) && /eco-gem-ico/.test(rapid.cfm.hero), { d:rapid.d, n:rapid.n, msg:rapid.cfm && rapid.cfm.message });

  // ---- 5) قائمة السماح: آلاف السحوبات بعشوائية مضبوطة لكل المستويات + بلا مكافآت عادية ----
  const rolls = await p.evaluate(() => { let sd = 12345; const R0 = Math.random; Math.random = () => { sd = (sd * 1103515245 + 12345) % 2147483648; return sd / 2147483648; };
    const out = { kinds:{}, bad:[], tiers:{} };
    try { CodisBoxes.tiers().forEach(t => { const rows = CodisBoxes.effective(t); out.tiers[t.id] = { n:rows.length, sum:rows.reduce((a, r) => a + r.pm, 0), neg:rows.some(r => !(r.pm >= 0)), poolKinds:[...new Set(rows.flatMap(r => r.items.map(x => x.kind)))].join() };
      for (let i = 0; i < 3000; i++) { const r = CodisBoxes.roll(t); const k = r && r.item && r.item.kind; if (!k || ['pass', 'holiday', 'pouch'].indexOf(k) === -1 || r.cosmeticId || (!r.pass && !r.pouchType && !r.holidayKind)) out.bad.push(t.id + ':' + (k || 'null')); else out.kinds[k] = (out.kinds[k] || 0) + 1; } });
    const saved = data.settings.rewardItems; data.settings.rewardItems = []; out.noRewards = CodisBoxes.tiers().map(t => CodisBoxes.effective(t).length); out.noRewardPool = CodisBoxes.pool().length; data.settings.rewardItems = saved;
    } finally { Math.random = R0; } return out; });
  ok(T + '15,000 seeded draws over all 5 tiers: only PASS/HOLIDAY/POUCH (all three appear), no reward cards/cosmetics/themes', !rolls.bad.length && Object.keys(rolls.kinds).sort().join() === 'holiday,pass,pouch' && Object.values(rolls.kinds).reduce((a, b) => a + b, 0) === 15000, rolls);
  ok(T + 'every tier available, probabilities sum to exactly 1000‰, none negative, pools hold only allowed kinds', Object.values(rolls.tiers).every(t => t.n > 0 && t.sum === 1000 && !t.neg && t.poolKinds.split(',').every(k => KINDS_OK.includes(k))), rolls.tiers);
  ok(T + 'with zero normal reward cards the boxes still work (availability depends on allowed prizes only)', rolls.noRewardPool === 0 && rolls.noRewards.every(n => n > 0), rolls.noRewards);
  await p.evaluate(() => { econPackOpen('bx5'); }); await p.waitForTimeout(600);
  st = await p.evaluate(() => ({ price:!!document.querySelector('#econ-pack-body .pkx-price .eco-gem'), coin:!!document.querySelector('#econ-pack-body .pkx-price .eco-coin:not(.eco-gem)'), kinds:[...new Set([...document.querySelectorAll('#econ-pack-body .pkx-k, #econ-pack-body [class*="kind"]')].map(e => e.textContent.trim()).filter(Boolean))].slice(0, 8) }));
  await shot(p, tag + '_pack_details', '#econ-pack-body'); await p.evaluate(() => econPackClose()); await p.waitForTimeout(300);
  ok(T + 'box details sheet: open price in gems', st.price && !st.coin, st);

  // ---- 6) واجهة الفتح الحقيقية (2D): فتح صندوق مملوك من شريط «بكجاتك المغلقة» ثم الإغلاق ----
  await p.evaluate(() => { location.hash = ''; }); await p.evaluate(() => { econRenderAll(); econStoreSetPart('boxes', { quiet:true }); }); await p.waitForTimeout(500);
  const chips = await p.evaluate(() => [...document.querySelectorAll('#eco-boxes .bx-own-chip')].length);
  ok(T + 'owned unopened boxes reachable from the store boxes section («بكجاتك المغلقة»)', chips >= 1, chips);
  const ui = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const n0 = CodisBoxes.owned().length, pa0 = CodisPasses.owned().length + CodisPouches.owned().length + CodisHolidayCards.usable().length;
    const chip = document.querySelector('#eco-boxes .bx-own-chip'); chip.click(); await sleep(600);
    const btn = [...document.querySelectorAll('#econ-box-modal button, .bx-modal button')].find(b => /افتح|فتح/.test(b.textContent) && b.offsetParent !== null); if (btn) btn.click(); await sleep(5500);
    const res = document.querySelector('#econ-box-modal, .bx-modal'); const txt = res ? res.textContent.replace(/\s+/g, ' ').slice(0, 200) : '';
    try { econBoxClose(); } catch (e) {} await sleep(500);
    return { opened:n0 - CodisBoxes.owned().length, grew:CodisPasses.owned().length + CodisPouches.owned().length + CodisHolidayCards.usable().length - pa0, txt, closed:!document.querySelector('#econ-box-modal.is-open, .bx-modal.is-open') }; });
  ok(T + 'open an owned box through the real 2D scene: one box consumed, one allowed item granted, result shown, window closes', ui.opened === 1 && ui.grew === 1, ui);
  const bulkUi = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const g0 = CodisWallet.gemBalance(); await econBuyBox10('bx1'); await sleep(1500); const shown = !!document.querySelector('.bk-modal, #econ-bulk-modal'); try { econBulkClose(); } catch (e) {} await sleep(500); return { d:g0 - CodisWallet.gemBalance(), shown }; });
  ok(T + '×10 through the UI: −350 gems, results window shown and closes', bulkUi.d === 350 && bulkUi.shown, bulkUi);

  // ---- 7) «بحوزتك»: الكروت · العناصر · المظاهر ----
  await p.evaluate(() => { econCloseStore(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 30000, 'qa', 'admin', 'qa|s' + Math.random(), null); return { ok:true }; }); ['frostCrystalPlanning', 'infernoCrystalOperations', 'frostCrystalTeacher'].forEach(id => CodisPlanThemes.buy(id)); econOpenStore(); });
  await p.waitForTimeout(1200); await p.evaluate(() => econOpenVault()); await p.waitForTimeout(1300);
  st = await p.evaluate(() => { const T = econOwnTotals(); return { tabs:[...document.querySelectorAll('#eco-own-sheet .own-tab')].map(b => b.dataset.own + ':' + (b.querySelector('.own-tab-n').hidden ? 0 : b.querySelector('.own-tab-n').textContent)), T,
    groups:[...document.querySelectorAll('#own-panel-items .own-kind')].map(s => s.dataset.kind + ':' + s.querySelector('.own-sub-n').textContent), cardsHasPass:!!document.querySelector('#own-panel-cards .pcd, #own-panel-cards .hcd, #own-panel-cards [data-pouch]'),
    real:{ pouches:CodisPouches.owned().length, passes:CodisPasses.owned().length, hc:CodisHolidayCards.usable().length + Math.min(CodisHolidayCards.expired().length, 8) }, title:(document.querySelector('.own-title-n') || {}).textContent }; });
  const gmap = Object.fromEntries(st.groups.map(x => x.split(':')));
  ok(T + '«بحوزتك» sections are exactly الكروت · العناصر · المظاهر (no الأكياس/البكجات)', st.tabs.map(x => x.split(':')[0]).join() === 'cards,items,cosmetics', st.tabs);
  ok(T + '«العناصر» groups pouches/passes/holiday with real counts; cards section shows no pass/holiday/pouch tiles; totals count each item once', String(st.real.pouches) === (gmap.pouches || '0') && String(st.real.passes) === (gmap.passes || '0') && (st.real.hc ? String(st.real.hc) === gmap.holiday : !gmap.holiday) && !st.cardsHasPass &&
    st.T.elements === st.real.pouches + st.real.passes + st.real.hc && st.T.cards === st.T.items && st.T.total === st.T.cards + st.T.elements + st.T.cosmetics + st.T.themes, st);
  await p.evaluate(() => econOwnSetPart('items')); await p.waitForTimeout(400); await shot(p, tag + '_own_items', '#own-panel-items');
  const pouch = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const t = CodisPouches.owned()[0]; if (!t) return 'none'; const n0 = CodisPouches.owned().length, s0 = CodisWallet.silverBalance(), g0 = CodisWallet.gemBalance();
    const b = document.querySelector('#own-panel-items .pch-use[onclick*="(' + t.type + ')"]'); b.click(); await sleep(600);
    const sh = document.querySelector('.pq-sheet, .dq-pick, [class*="pouch-sheet"]'); const okBtn = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && /^(افتح|فتح|تأكيد)/.test(x.textContent.trim()) && !x.closest('#eco-own-sheet')); if (okBtn) { okBtn.click(); await sleep(600); }
    try { dqSkip(); } catch (e) {} await sleep(400); try { dqClose(); } catch (e) {} await sleep(400);
    return { used:n0 - CodisPouches.owned().length, silver:CodisWallet.silverBalance() - s0, gems:CodisWallet.gemBalance() - g0 }; });
  ok(T + 'pouch opened from «العناصر»: pouch consumed, silver added, gems untouched', pouch === 'none' || (pouch.used >= 1 && pouch.silver > 0 && pouch.gems === 0), pouch);
  ok(T + 'pass and holiday tiles keep their own actions (dismantle / use) inside «العناصر»', await p.evaluate(() => { const ps = document.querySelectorAll('#own-panel-items .own-kind[data-kind="passes"] .st-tile'); const hs = document.querySelectorAll('#own-panel-items .own-kind[data-kind="holiday"] .st-tile');
    return (!CodisPasses.owned().length || (ps.length && [...ps].every(t => t.querySelector('button')))) && (!CodisHolidayCards.usable().length || (hs.length && [...hs].every(t => t.querySelector('button')))); }));

  // ---- 8) الثيمات: المتجر بلا تجهيز، «بحوزتك» فقط ----
  const api = await p.evaluate(() => { const before = JSON.stringify(CodisPlanThemes.equippedMap()); const a = CodisPlanThemes.equip('frostCrystalPlanning'), b = CodisPlanThemes.equip('frostCrystalPlanning', 'store'), c = CodisPlanThemes.unequip('planning'); econPlanThemeToggle('frostCrystalPlanning', 'store'); return { a:a.reason, b:b.reason, c:c.reason, same:JSON.stringify(CodisPlanThemes.equippedMap()) === before }; });
  ok(T + 'engine guard: equip/unequip without the «بحوزتك» context are refused (no state change)', api.a === 'context' && api.b === 'context' && api.c === 'context' && api.same, api);
  await p.evaluate(() => { econCloseOwn(); econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('#cos-sub-themes .pt-mtile[data-ptid="frostCrystalPlanning"] .pt-mbtn').click()); await p.waitForTimeout(600);
  st = await p.evaluate(() => ({ ctx:document.querySelector('.pt-ov').dataset.ctx, act:document.querySelector('.pt-ov .pt-ov-act').dataset.act, txt:document.querySelector('.pt-ov .pt-ov-act').textContent }));
  ok(T + 'store details for an owned theme: no equip action, only «افتح «بحوزتك» للتجهيز»', st.ctx === 'store' && st.act === 'goown' && /بحوزتك/.test(st.txt), st);
  await p.evaluate(() => document.querySelector('.pt-ov .pt-ov-act').click()); await p.waitForTimeout(1500);
  st = await p.evaluate(() => ({ open:econOwnOpen, part:econOwnPart, focus:document.activeElement && document.activeElement.closest('.pt-mtile') && document.activeElement.closest('.pt-mtile').dataset.ptid, ov:!!document.querySelector('.pt-ov'), eq:CodisPlanThemes.equippedId('planning') }));
  ok(T + '«افتح بحوزتك» takes you to «بحوزتك» → المظاهر on that theme (nothing equipped by the store)', st.open && st.part === 'cosmetics' && st.focus === 'frostCrystalPlanning' && !st.ov && !st.eq, st);
  await p.evaluate(() => document.querySelector('#own-panel-cosmetics .pt-mtile[data-ptid="frostCrystalPlanning"] .pt-mbtn').click()); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.pt-ov .pt-ov-act').click()); await p.waitForTimeout(800);
  st = await p.evaluate(() => ({ ctx:document.querySelector('.pt-ov').dataset.ctx, eq:CodisPlanThemes.equippedId('planning'), box:document.querySelector('#planning-empty > .empty-state').dataset.pt || '', act:document.querySelector('.pt-ov .pt-ov-act').dataset.act }));
  ok(T + 'equip from «بحوزتك»: planning wears Frost; button becomes «إزالة»', st.ctx === 'own' && st.eq === 'frostCrystalPlanning' && st.box === 'frostCrystalPlanning' && st.act === 'unequip', st);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('#own-panel-cosmetics .pt-mtile[data-ptid="infernoCrystalOperations"] .pt-mbtn').click(); }); await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('.pt-ov .pt-ov-act').click()); await p.waitForTimeout(700); await p.keyboard.press('Escape');
  await p.evaluate(() => { econCloseOwn(); econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#cos-sub-themes .pt-mtile[data-ptid="frostCrystalPlanning"] .pt-mbtn').click()); await p.waitForTimeout(600);
  st = await p.evaluate(() => ({ st:document.querySelector('.pt-ov .pt-ov-st').textContent, act:document.querySelector('.pt-ov .pt-ov-act').dataset.act, map:CodisPlanThemes.equippedMap() }));
  ok(T + 'store shows «مجهّز» for the equipped theme but still no unequip; different themes on different rooms', /مجهّز/.test(st.st) && st.act === 'goown' && st.map.planning === 'frostCrystalPlanning' && st.map.operations === 'infernoCrystalOperations' && !st.map.teacher, st);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => econOpenVault()); await p.waitForTimeout(1000); await p.evaluate(() => econOwnSetPart('cosmetics')); await p.evaluate(() => document.querySelector('#own-panel-cosmetics .pt-mtile[data-ptid="frostCrystalPlanning"] .pt-mbtn').click()); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.pt-ov .pt-ov-act').click()); await p.waitForTimeout(700); await p.keyboard.press('Escape');
  ok(T + 'unequip from «بحوزتك»: planning back to original, ownership kept', await p.evaluate(() => !CodisPlanThemes.equippedId('planning') && CodisPlanThemes.owns('frostCrystalPlanning') && !document.querySelector('#planning-empty > .empty-state').dataset.pt));
  await p.evaluate(() => { econCloseOwn(); econCloseStore(); }); await p.waitForTimeout(300);

  // ---- 9) إعادة التحميل: كل شيء محفوظ ----
  const keep = await p.evaluate(() => JSON.stringify({ g:data.wallet.gems, c:CodisWallet.balance(), s:CodisWallet.silverBalance(), b:data.inventory.boxes.length, m:CodisPlanThemes.equippedMap() }));
  await o.boot(); await p.waitForTimeout(500);
  ok(T + 'reload: gem balance + ledger, coins, silver, boxes and room themes persist exactly', await p.evaluate(k => JSON.stringify({ g:data.wallet.gems, c:CodisWallet.balance(), s:CodisWallet.silverBalance(), b:data.inventory.boxes.length, m:CodisPlanThemes.equippedMap() }) === k, keep), keep.slice(0, 200));
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1200); await p.evaluate(() => econOpenVault()); await p.waitForTimeout(1200); await p.evaluate(() => econOwnSetPart('items')); await p.waitForTimeout(400);
  ok(T + 'layout: no horizontal scroll, no clipped group titles/counts, no duplicate ids', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth && ![...document.querySelectorAll('#own-panel-items .own-sub > span, .eco-balance .eco-lab')].some(e => e.scrollWidth > e.clientWidth + 1) && (() => { const seen = {}; for (const e of document.querySelectorAll('[id]')) { if (seen[e.id]) return false; seen[e.id] = 1; } return true; })()));
  await shot(p, tag + '_store_header', '#eco-store-body .eco-balance');
  ok(T + 'no page/console errors', !o.errs.length, o.errs.slice(0, 4));
  await o.close();
}

// ---- 10) بيانات قديمة (قبل الجواهر): لا يضيع شيء، الجواهر صفر، الصناديق المغلقة القديمة تُفتح بالنظام الجديد، المفتوحة تاريخ ----
{
  const T = 'legacy data: ';
  const seed = () => { const K = 'life_organizer_data_v1', d = JSON.parse(localStorage.getItem(K) || '{}'), now = new Date().toISOString();
    d.wallet = { balance:812.5, lifetimeEarned:900, lifetimeSpent:87.5, transactions:[{ id:'tx_old1', type:'PURCHASE_BOX', amount:-35, reason:'شراء بكج برونزي', source:'store', referenceId:'box|bx1|old1', createdAt:now }], silver:{ balance:1234, lifetimeEarned:1234, lifetimeSpent:0, transactions:[{ id:'stx_old', type:'OPEN_POUCH', currency:'SILVER', amount:1234, reason:'old', source:'pouch', referenceId:'p|old', createdAt:now }] } };
    d.inventory = d.inventory || {}; d.inventory.items = (d.inventory.items || []);
    d.inventory.boxes = [{ uid:'box|tx_old1', tier:'bx1', paid:35, acquiredAt:now, status:'unopened', sourceRef:'tx_old1' }, { uid:'box|tx_old2', tier:'bx4', paid:182, acquiredAt:now, status:'unopened', sourceRef:'tx_old2' },
      { uid:'box|tx_old3', tier:'bx2', paid:67, acquiredAt:now, status:'opened', openedAt:now, sourceRef:'tx_old3', rewardUid:'own|box|box|tx_old3' }];
    d.inventory.passes = [{ uid:'pass|old|1', scope:'daily', severity:'MEDIUM', tier:'bx1', sourceRef:'x', acquiredAt:now, status:'owned' }];
    d.inventory.pouches = [{ uid:'pouch|old|1', type:2, tier:'bx1', sourceRef:'x', acquiredAt:now, status:'owned' }];
    localStorage.setItem(K, JSON.stringify(d)); };
  const o = await open(375, 'paper', seed); const p = o.page;
  const s = await p.evaluate(() => ({ c:CodisWallet.balance(), ctx:data.wallet.transactions.map(t => t.id).join(), s:CodisWallet.silverBalance(), stx:CodisWallet.silverTxs().length, g:JSON.stringify(data.wallet.gems), un:CodisBoxes.owned().map(b => b.uid).join(), op:JSON.stringify(data.inventory.boxes.find(b => b.uid === 'box|tx_old3')), pa:CodisPasses.owned().length, po:CodisPouches.owned().length }));
  ok(T + 'coins, coin history, silver, unopened + opened boxes, passes and pouches all preserved; gems initialised to 0', s.c === 812.5 && /tx_old1/.test(s.ctx) && s.s === 1234 && s.stx === 1 && s.g === '{"balance":0,"lifetimeEarned":0,"lifetimeSpent":0,"transactions":[]}' && s.un === 'box|tx_old1,box|tx_old2' && /"status":"opened"/.test(s.op) && /own\|box\|box\|tx_old3/.test(s.op) && s.pa === 1 && s.po === 1, s);
  const op = await p.evaluate(() => { const a = CodisBoxes.open('box|tx_old1'), b = CodisBoxes.open('box|tx_old2'); return { a:a.ok && a.item.kind, b:b.ok && b.item.kind, left:CodisBoxes.owned().length, old3:JSON.stringify(data.inventory.boxes.find(x => x.uid === 'box|tx_old3')), coin:CodisWallet.balance(), gems:CodisWallet.gemBalance() }; });
  ok(T + 'old unopened boxes open (free, already paid) with the new allowlist; the old opened box record is untouched; no currency moves', ['pass', 'holiday', 'pouch'].includes(op.a) && ['pass', 'holiday', 'pouch'].includes(op.b) && op.left === 0 && op.old3 === s.op && op.coin === 812.5 && op.gems === 0, op);
  ok(T + 'no errors', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}
srv.close();
console.log(`\n${pass} passed, ${fail} failed (engine: webkit)`); process.exit(fail ? 1 : 0);
