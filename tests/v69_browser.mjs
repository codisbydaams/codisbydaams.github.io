/* CODIS-V69 — بدايات الغرف (planningIntro · tasksIntro · learnIntro · habitsIntro).
   WebKit حقيقي (محاكاة iPhone). Run:  PW=<path to playwright-core/index.mjs> node tests/v69_browser.mjs [app.html]
   SHOTS=<dir> لقطات: المتجر، المعاينة، وأربع لحظات من كل بداية حقيقية. SIZES="320x568,375x812,430x932,812x375,1280x800" لفحص التخطيط. */
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
const IDS = ['planningIntro', 'tasksIntro', 'learnIntro', 'habitsIntro'], ROOM = { planningIntro:'planning', tasksIntro:'tasks', learnIntro:'learn', habitsIntro:'habits' };

async function open(w, h, opts = {}){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v69t-'));
  const mobile = w < 700 || h < 500;
  const ctx = await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'], viewport:{ width:w, height:h }, screen:{ width:w, height:h }, reducedMotion:opts.reduced ? 'reduce' : 'no-preference', hasTouch:true, isMobile:mobile });
  await ctx.addInitScript(() => { window.CODIS_B3D_OFF = true; window.__riSeen = []; window.__riGone = [];
    new MutationObserver(ms => { ms.forEach(m => { m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList.contains('ri-layer')) window.__riSeen.push([n.getAttribute('data-ri'), Math.round(performance.now()), !!(window.codisBootState && window.codisBootState.revealed)]); }); m.removedNodes.forEach(n => { if (n.nodeType === 1 && n.classList.contains('ri-layer')) window.__riGone.push([n.getAttribute('data-ri'), Math.round(performance.now())]); }); }); })
      .observe(document, { childList:true, subtree:true }); });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  const until = async (fn, ms = 60000, arg) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn, arg)) return true; } catch (e) {} await page.waitForTimeout(80); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); }
    await page.waitForTimeout(600); await page.evaluate(t => CodisTheme.set(t), opts.theme === 'dark' ? 'dark' : 'paper').catch(() => {}); await page.waitForTimeout(250);
    await page.evaluate(() => { CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {}; }); };
  await boot();
  return { page, errs, boot, until, ctx, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const shot = async (p, name) => { if (!SHOTS) return; try { await p.screenshot({ path:path.join(SHOTS, name + '.png') }); } catch (e) { console.log('shot ' + name + ': ' + e.message); } };
const grant = (p, n) => p.evaluate(n => CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', n, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; }), n);
const bal = p => p.evaluate(() => ({ sv:CodisWallet.silverBalance(), coins:data.wallet.balance, gems:CodisWallet.gemBalance(), ntx:CodisWallet.silverTxs().length }));
const layer = p => p.evaluate(() => { const L = document.querySelectorAll('.ri-layer'); return { n:L.length, id:L[0] ? L[0].getAttribute('data-ri') : '', out:L[0] ? L[0].classList.contains('is-out') : false }; });
const go = (p, pg) => p.evaluate(pg => navigateToPage(pg), pg);
const waitGone = (o, ms = 4000) => o.until(() => !document.querySelector('.ri-layer'), ms);
const openIntrosTab = async p => { await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(900); await p.evaluate(() => { econStoreSetPart('cosmetics'); }); await p.waitForTimeout(300);
  await p.evaluate(() => econCosSetSub('intros')); await p.waitForTimeout(500); };

/* ===================== A) المتجر · المعاينة · الشراء · البيانات (375×812 ورقي) ===================== */
{
  const o = await open(375, 812); const p = o.page;
  const d0 = await p.evaluate(() => ({ ri:JSON.stringify(data.inventory.roomIntros), seen:window.__riSeen.length }));
  ok('A0 default: roomIntros = {owned:[]} and no intro shown during boot', d0.ri === '{"owned":[]}' && d0.seen === 0, d0);

  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(900); await p.evaluate(() => econStoreSetPart('cosmetics')); await p.waitForTimeout(300);
  const tabs = await p.evaluate(() => ({ labs:[...document.querySelectorAll('#pane-cosmetics .cos-seg-b')].map(b => b.childNodes[0].textContent.trim()), lazy:document.getElementById('cos-sub-intros').hasAttribute('data-lazy'), kids:document.getElementById('cos-sub-intros').children.length }));
  ok('A1 cosmetics has three tabs (مظاهر البطاقات · الثيمات · بدايات الغرف) and the intros tab is lazy', JSON.stringify(tabs.labs) === JSON.stringify(['مظاهر البطاقات', 'الثيمات', 'بدايات الغرف']) && tabs.lazy && tabs.kids === 0, tabs);
  await p.evaluate(() => econCosSetSub('intros')); await p.waitForTimeout(600);
  const shop = await p.evaluate(() => [...document.querySelectorAll('#cos-sub-intros .ri-card')].map(c => ({ id:c.getAttribute('data-riid'), room:c.querySelector('.ri-room').textContent, name:c.querySelector('.ri-name').textContent,
    price:(c.querySelector('.ri-price b') || {}).textContent, pv:!!c.querySelector('.ri-b-pv'), buy:!!c.querySelector('.ri-b-buy'), svg:c.querySelectorAll('.ri-thumb .ri-svg').length, w:c.getBoundingClientRect().width, sw:document.documentElement.scrollWidth, vw:innerWidth })));
  ok('A2 four products with their rooms, thumbnails, preview + buy buttons', shop.length === 4 && shop.map(x => x.id).join() === IDS.join() && shop.every(x => x.pv && x.buy && x.svg === 1) && shop.map(x => x.room).join() === 'غرفة التخطيط,غرفة العمليات,غرفة الأستاذ,غرفة التأديب', shop);
  const prices = await p.evaluate(() => CodisRoomIntros.defs().map(d => d.silver));
  ok('A3 independent prices (all different)', new Set(prices).size === 4 && prices.every(x => x > 1000), prices);
  ok('A4 no horizontal overflow in the store', shop.every(x => x.sw <= x.vw), shop[0]);
  const keys = await p.evaluate(() => { const ev = k => { econCosSubKey({ key:k, preventDefault(){} }); return econCosSub; }; econCosSetSub('cards'); const a = [ev('ArrowLeft'), ev('ArrowLeft'), ev('ArrowLeft'), ev('ArrowRight'), ev('End'), ev('Home')]; econCosSetSub('intros'); return a; });
  ok('A5 tab keyboard: ArrowLeft = next (RTL), wraps, Home/End', keys.join() === 'themes,intros,cards,intros,intros,cards', keys);
  await shot(p, 'A_store_375');

  // المعاينة لكل منتج: لا انتقال، لا طبقة حقيقية، الغرفة كما هي
  await p.evaluate(() => { window.__nav = 0; const N = window.navigateToPage; window.navigateToPage = function(){ window.__nav++; return N.apply(this, arguments); }; });
  for (const id of IDS) {
    const pre = await p.evaluate(() => ({ act:document.querySelector('.navbtn.active').dataset.page, vis:['planning', 'tasks', 'learn', 'habits', 'settings'].map(x => document.getElementById('page-' + x).style.display).join() }));
    await p.click('#cos-sub-intros .ri-card[data-riid="' + id + '"] .ri-b-pv');
    await p.waitForTimeout(700); if (id === 'tasksIntro') await shot(p, 'A_preview_mid_' + id);
    await p.waitForTimeout(2000);
    const pv = await p.evaluate(() => { const el = document.querySelector('.ri-ov'), sc = el && el.querySelector('.ri-scene'), a = sc && sc.querySelector('.ri-art').getBoundingClientRect(), c = el && el.querySelector('.pt-ov-card').getBoundingClientRect();
      return { open:!!el, id:el && el.getAttribute('data-ri'), play:sc && sc.classList.contains('is-play'), artW:a && Math.round(a.width), cardW:c && Math.round(c.width), buy:!!(el && el.querySelector('.pt-ov-act[data-act=buy]')), live:document.querySelectorAll('.ri-layer').length,
        act:document.querySelector('.navbtn.active').dataset.page, vis:['planning', 'tasks', 'learn', 'habits', 'settings'].map(x => document.getElementById('page-' + x).style.display).join(), nav:window.__nav, focus:document.activeElement && document.activeElement.className }; });
    ok('A6 preview ' + id + ': plays inside the details window, no navigation, no live layer, room unchanged', pv.open && pv.id === id && pv.play && pv.live === 0 && pv.nav === 0 && pv.act === pre.act && pv.vis === pre.vis && pv.buy && pv.artW > 250, pv);
    await shot(p, 'A_preview_end_' + id);
    await p.evaluate(() => codisRiReplay()); await p.waitForTimeout(300);
    const rp = await p.evaluate(() => { const s = document.querySelector('.ri-ov .ri-scene'); const t = s.querySelector('.ri-title'); return { op:+getComputedStyle(t).opacity, live:document.querySelectorAll('.ri-layer').length }; });
    ok('A7 replay restarts the sequence (title hidden again at 300ms) without a live intro', rp.op < .2 && rp.live === 0, rp);
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const cl = await p.evaluate(() => ({ ov:!!document.querySelector('.ri-ov'), f:document.activeElement && document.activeElement.className, nav:window.__nav }));
    ok('A8 Esc closes preview, focus back to its button, still no navigation', !cl.ov && /ri-b-pv/.test(cl.f) && cl.nav === 0, cl);
  }

  // رصيد غير كافٍ: لا نافذة تأكيد، لا خصم
  const b0 = await bal(p);
  const ins = await p.evaluate(() => CodisRoomIntros.buy('planningIntro'));
  await p.click('#cos-sub-intros .ri-card[data-riid="planningIntro"] .ri-b-buy'); await p.waitForTimeout(500);
  const b1 = await bal(p), cf1 = await p.evaluate(() => CodisMotion.isOpen(document.getElementById('codis-confirm-modal')));
  ok('A9 insufficient silver: refused, nothing charged, no confirm dialog', b0.sv < 2299 && ins.reason === 'insufficient' && !cf1 && b1.sv === b0.sv && b1.ntx === b0.ntx && !(await p.evaluate(() => CodisRoomIntros.owns('planningIntro'))), { b0, b1, ins, cf1 });

  await grant(p, 20000); await p.waitForTimeout(300);
  // شراء حقيقي بالضغط: نافذة التأكيد بالسعر والرصيد والمتبقي، ضغط مزدوج لا يكرر
  for (const id of ['tasksIntro', 'learnIntro', 'habitsIntro']) {
    const B = await bal(p), price = await p.evaluate(id => CodisRoomIntros.price(id), id);
    await p.evaluate(() => econRenderAll()); await p.waitForTimeout(300);
    await p.click('#cos-sub-intros .ri-card[data-riid="' + id + '"] .ri-b-buy');
    await p.waitForTimeout(550);
    const cf = await p.evaluate(() => ({ open:CodisMotion.isOpen(document.getElementById('codis-confirm-modal')), msg:document.getElementById('codis-confirm-modal').innerText }));
    const fmt = n => n.toLocaleString('ar-IQ').replace(/\s/g, '');
    const msgOk = await p.evaluate(([pr, sv]) => { const t = document.getElementById('codis-confirm-modal').innerText; return t.includes(econFmt(pr)) && t.includes(econFmt(sv)) && t.includes(econFmt(sv - pr)); }, [price, B.sv]);
    ok('A10 ' + id + ': confirm dialog shows price · balance · remaining', cf.open && msgOk, cf.msg.slice(0, 300));
    await p.evaluate(() => { econRoomIntroBuy(document.querySelector('.ri-card[data-riid]').getAttribute('data-riid')); });   // نقرة متزامنة أخرى أثناء الانشغال ⇒ تُتجاهل
    await p.click('#codis-confirm-ok'); await p.waitForTimeout(700);
    const A = await bal(p), r = await p.evaluate(id => ({ own:CodisRoomIntros.owns(id), rec:data.inventory.roomIntros.owned.filter(x => x.id === id), tx:CodisWallet.silverTxs().filter(t => t.referenceId === 'roomintro|' + id).map(t => [t.type, t.amount]) }), id);
    ok('A11 ' + id + ': owned once, silver −' + price + ' exactly, one PURCHASE_COSMETIC tx, coins/gems untouched', r.own && r.rec.length === 1 && r.rec[0].room === ROOM[id] && r.rec[0].paid === price && B.sv - A.sv === price && A.coins === B.coins && A.gems === B.gems && r.tx.length === 1 && r.tx[0][0] === 'PURCHASE_COSMETIC' && r.tx[0][1] === -price, { B, A, r });
    const again = await p.evaluate(id => CodisRoomIntros.buy(id), id);
    ok('A12 ' + id + ': cannot be bought twice', again.reason === 'owned', again);
  }
  // فشل الحفظ: تراجع كامل (لا خصم ولا ملكية)
  const Bf = await bal(p);
  const rf = await p.evaluate(() => { const S = window.saveData; window.saveData = () => false; let r; try { r = CodisRoomIntros.buy('planningIntro'); } finally { window.saveData = S; } return { r, own:CodisRoomIntros.owns('planningIntro'), tx:CodisWallet.silverTxs().some(t => t.referenceId === 'roomintro|planningIntro') }; });
  const Af = await bal(p);
  ok('A13 save failure rolls back debit AND ownership together', rf.r.reason === 'save' && !rf.own && !rf.tx && Af.sv === Bf.sv && Af.ntx === Bf.ntx, { rf, Bf, Af });
  // بقية المنتج الرابع بالدالة نفسها + الاسترجاع heal
  await p.evaluate(() => CodisRoomIntros.buy('planningIntro'));
  const heal = await p.evaluate(() => { data.inventory.roomIntros.owned = data.inventory.roomIntros.owned.filter(x => x.id !== 'learnIntro'); const n = CodisRoomIntros.heal(); return { n, own:CodisRoomIntros.owns('learnIntro'), cnt:data.inventory.roomIntros.owned.length }; });
  ok('A14 heal(): a saved purchase tx without its ownership record restores ownership (no new charge)', heal.n === 1 && heal.own && heal.cnt === 4, heal);
  await p.evaluate(() => saveData());

  // «بحوزتك»
  await p.evaluate(() => { econRenderAll(); econOpenVault(); }); await p.waitForTimeout(700); await p.evaluate(() => econOwnSetPart('cosmetics', { quiet:true })); await p.waitForTimeout(400);
  const own = await p.evaluate(() => { const s = document.getElementById('own-room-intros'); return s ? { n:s.querySelectorAll('.ri-card').length, st:[...s.querySelectorAll('.ri-st')].map(x => x.textContent), buy:s.querySelectorAll('.ri-b-buy').length, pv:s.querySelectorAll('.ri-b-pv').length, equip:s.querySelectorAll('[data-act=equip]').length } : null; });
  ok('A15 «بحوزتك ← المظاهر» lists the 4 intros as owned + auto-active, preview only (no buy, no equip step)', own && own.n === 4 && own.buy === 0 && own.equip === 0 && own.pv === 4 && own.st.every(t => t.includes('تلقائياً')), own);
  await shot(p, 'A_own_375');
  // معاينة من «بحوزتك»: مملوك، بلا زر شراء
  await p.click('#own-room-intros .ri-card[data-riid="habitsIntro"] .ri-b-pv'); await p.waitForTimeout(600);
  const ownPv = await p.evaluate(() => { const el = document.querySelector('.ri-ov'); return { ctx:el.getAttribute('data-ctx'), buy:!!el.querySelector('.pt-ov-act'), st:el.querySelector('.pt-ov-st').textContent }; });
  ok('A16 preview from «بحوزتك»: owned state, no buy action', ownPv.ctx === 'own' && !ownPv.buy && ownPv.st.includes('مملوك'), ownPv);
  await p.evaluate(() => codisRiClose(true));
  // إعادة التحميل: الملكية باقية
  await o.boot();
  const rl = await p.evaluate(() => ({ ids:CodisRoomIntros.owned().map(d => d.id), seen:window.__riSeen.length }));
  ok('A17 ownership survives reload; no intro during that boot', rl.ids.join() === IDS.join() && rl.seen === 0, rl);
  ok('A18 no page errors (section A)', !o.errs.length, o.errs.slice(0, 3));

  /* ===================== B) التشغيل الحقيقي عند دخول الغرف ===================== */
  o.errs.length = 0;
  await go(p, 'settings'); await p.waitForTimeout(400);
  ok('B0 settings: no intro', (await layer(p)).n === 0);
  for (const id of IDS) {
    const r = ROOM[id];
    await go(p, 'settings'); await p.waitForTimeout(300);
    await p.evaluate(r => document.querySelector('.navbtn[data-page="' + r + '"]').click(), r);
    const t0 = Date.now();
    await p.waitForTimeout(80); const L1 = await layer(p);
    ok('B1 ' + id + ': entering ' + r + ' plays its own intro only', L1.n === 1 && L1.id === id, L1);
    const geo = await p.evaluate(() => { const el = document.querySelector('.ri-layer'); if (!el) return null; const R = x => { const b = el.querySelector(x).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
      return { art:R('.ri-art'), cap:R('.ri-cap'), skip:R('.ri-skip'), vw:innerWidth, vh:innerHeight, sw:document.documentElement.scrollWidth, title:el.querySelector('.ri-title').textContent, focus:document.activeElement && document.activeElement.className, under:document.getElementById('page-' + el.getAttribute('data-ri').replace('Intro', '')).style.display }; });
    ok('B2 ' + id + ': art/caption/skip inside the viewport, no overlap, skip focused, room shown beneath', geo && [geo.art, geo.cap, geo.skip].every(b => b[0] >= 0 && b[1] >= 0 && b[2] <= geo.vw && b[3] <= geo.vh) && geo.cap[1] >= geo.art[3] - 1 && geo.skip[3] <= geo.art[1] && geo.sw <= geo.vw && /ri-skip/.test(geo.focus) && geo.under === 'block', geo);
    for (const [ms, tag] of [[350, 'a'], [900, 'b'], [1500, 'c'], [2150, 'd']]) { const w = ms - (Date.now() - t0); if (w > 0) await p.waitForTimeout(w); await shot(p, 'B_' + id + '_' + tag); }
    const gone = await waitGone(o, 4000); const dt = await p.evaluate(() => { const a = window.__riSeen[window.__riSeen.length - 1], b = window.__riGone[window.__riGone.length - 1]; return a && b && a[0] === b[0] ? b[1] - a[1] : -1; });
    ok('B3 ' + id + ': ends by itself and the layer is removed (≥2.3s; upper bound loose here — headless WebKit paints at ~3–5 fps, exact timing is checked by tests/introperf_browser.js)', gone && dt >= 2300 && dt < 4500, dt);
    // نقرة على الغرفة المفتوحة نفسها ⇒ لا شيء
    await p.evaluate(r => document.querySelector('.navbtn[data-page="' + r + '"]').click(), r); await p.waitForTimeout(150);
    ok('B4 ' + id + ': tapping the already-open room does not replay', (await layer(p)).n === 0);
    // إعادة رسم الغرفة ⇒ لا شيء
    await p.evaluate(r => { ({ planning:renderPlanningPage, tasks:renderTasksPage, learn:renderLearnPage, habits:renderHabitsPage })[r](); saveData(); }, r); await p.waitForTimeout(150);
    ok('B5 ' + id + ': room re-render / save does not play it', (await layer(p)).n === 0);
    // مغادرة ثم عودة ⇒ يُعاد من البداية
    const other = r === 'planning' ? 'learn' : 'planning';
    await go(p, other); await p.waitForTimeout(100); const Lo = await layer(p);
    ok('B6 ' + id + ': the other room plays only its own intro (' + other + ')', Lo.n === 1 && Lo.id === other + 'Intro', Lo);
    await go(p, r); await p.waitForTimeout(250);
    const again = await p.evaluate(() => { const el = document.querySelector('.ri-layer:not(.is-out)'); const t = el && el.querySelector('.ri-title'); return { id:el && el.getAttribute('data-ri'), n:document.querySelectorAll('.ri-layer:not(.is-out)').length, op:t ? +getComputedStyle(t).opacity : -1 }; });
    ok('B7 ' + id + ': returning plays it again from the start (title not yet shown at 250ms)', again.id === id && again.n === 1 && again.op < .2, again);
    await waitGone(o, 3500);
  }
  // التخطي بالزر (لمس/فأرة) ثم بـEsc، والتركيز يرجع لزر الغرفة
  await p.evaluate(() => { window.__sk = []; document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.ri-skip')) window.__sk.push(['click', performance.now(), e.isTrusted]); }, true);
    const S = window.codisRoomIntroStop; window.codisRoomIntroStop = function(i){ window.__sk.push([i ? 'stop!' : 'stop', performance.now()]); return S.apply(this, arguments); }; });
  await go(p, 'settings'); await p.waitForTimeout(250);
  await p.click('.navbtn[data-page="tasks"]');
  const sr = await p.evaluate(() => { const r = document.querySelector('.ri-skip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await p.mouse.click(sr[0], sr[1]); await o.until(() => !document.querySelector('.ri-layer'), 3000);
  const sk = await p.evaluate(() => { const c = window.__sk.find(x => x[0] === 'click'), s = c && window.__sk.find(x => x[0] === 'stop' && x[1] >= c[1]); const g = window.__riGone[window.__riGone.length - 1];
    return { trusted:c && c[2], stopAfterClick:c && s ? Math.round(s[1] - c[1]) : -1, removedAfterClick:c && g ? Math.round(g[1] - c[1]) : -1, page:document.querySelector('.navbtn.active').dataset.page, f:document.activeElement && document.activeElement.className }; });
  ok('B8 a real pointer click on «تخطي» stops the intro at once and the layer leaves within its 0.35s fade (page time); room usable', sk.trusted && sk.stopAfterClick >= 0 && sk.stopAfterClick < 20 && sk.removedAfterClick >= 0 && sk.removedAfterClick < 700 && sk.page === 'tasks' && !/ri-/.test(sk.f), sk);
  await go(p, 'learn'); await p.waitForTimeout(300); await p.keyboard.press('Escape'); const esc = await o.until(() => !document.querySelector('.ri-layer'), 1000);
  ok('B9 Esc skips the intro', esc);
  await go(p, 'habits'); await p.waitForTimeout(300); await p.keyboard.press('Enter'); const ent = await o.until(() => !document.querySelector('.ri-layer'), 1000);
  ok('B10 keyboard Enter on the focused skip button skips', ent);
  // تنقل سريع: طبقة واحدة فقط للغرفة الأخيرة
  await go(p, 'settings'); await p.waitForTimeout(200);
  await p.evaluate(() => { navigateToPage('planning'); navigateToPage('tasks'); navigateToPage('learn'); }); await p.waitForTimeout(60);
  const fast = await p.evaluate(() => [...document.querySelectorAll('.ri-layer')].map(x => x.getAttribute('data-ri')));
  ok('B11 rapid navigation: exactly one intro, the last room\'s', fast.length === 1 && fast[0] === 'learnIntro', fast);
  await go(p, 'settings'); await p.waitForTimeout(80);
  ok('B12 leaving to settings mid-intro removes it at once', (await layer(p)).n === 0);
  // المتجر: فتحه وإغلاقه لا يشغّل شيئاً
  await go(p, 'tasks'); await p.waitForTimeout(100); await p.evaluate(() => codisRoomIntroStop(true));
  await p.evaluate(() => econOpenStore()); await p.waitForTimeout(700); await p.evaluate(() => econCloseStore()); await p.waitForTimeout(600);
  ok('B13 opening/closing the store over a room does not play an intro', (await layer(p)).n === 0);
  // نافذة/مودال: تأكيد فوق الطبقة (z-index)
  await go(p, 'settings'); await go(p, 'planning'); await p.waitForTimeout(150);
  const z = await p.evaluate(() => { codisConfirm({ title:'x', message:'y' }); return new Promise(r => setTimeout(() => { const a = +getComputedStyle(document.querySelector('.ri-layer')).zIndex, b = +getComputedStyle(document.getElementById('codis-confirm-modal')).zIndex; resolveCodisConfirm(false); r({ a, b }); }, 200)); });
  ok('B14 dialogs stay above the intro layer (confirm z > intro z)', z.b > z.a && z.a > 0, z);
  await waitGone(o, 3500);
  // الرجوع (codisBackLayer) يتخطّى
  await go(p, 'settings'); await go(p, 'learn'); await p.waitForTimeout(200);
  const back = await p.evaluate(() => { const L = codisBackLayer(); const isRi = !!(L && L.el && L.el.classList.contains('ri-layer')); if (L) L.act(); return isRi; });
  ok('B15 system back closes the intro first', back && await o.until(() => !document.querySelector('.ri-layer'), 800));
  ok('B16 no page errors (section B)', !o.errs.length, o.errs.slice(0, 3));

  /* ===================== C) الإقلاع بخطة فعّالة (navigateToPage('tasks') داخل codisBoot) ===================== */
  await p.evaluate(fs.readFileSync(path.join(ROOT, 'tools/prof/seed_plan.js'), 'utf8')); await p.waitForTimeout(2500);
  await o.boot(); await p.waitForTimeout(3000);
  const bt = await p.evaluate(() => ({ route:codisBootState.route, act:document.querySelector('.navbtn.active').dataset.page, seen:window.__riSeen, own:CodisRoomIntros.owns('tasksIntro') }));
  ok('C1 boot with an active plan routes to Operations but plays NO intro (owned)', bt.route === 'tasks' && bt.act === 'tasks' && bt.own && bt.seen.length === 0, bt);
  await go(p, 'planning'); await p.waitForTimeout(100);
  const after = await p.evaluate(() => window.__riSeen.map(x => x[0]));
  ok('C2 after boot the first real navigation does play', after.join() === 'planningIntro', after);
  await waitGone(o, 3500);

  /* ===================== D) بيانات مخزّنة مشوّهة ===================== */
  await p.evaluate(() => { data.inventory.roomIntros = { owned:[{ id:5 }, { id:'tasksIntro', room:'tasks' }, { id:'tasksIntro' }, { id:'future_intro', room:'garden', paid:'99' }, null, 'x', { id:'bad id!' }] }; saveData(); });
  o.errs.length = 0; await o.boot();
  const odd = await p.evaluate(() => ({ owned:data.inventory.roomIntros.owned.map(x => x.id + ':' + x.room), mine:CodisRoomIntros.owned().map(d => d.id) }));
  ok('D1 odd stored data: boot ok, dedup, invalid dropped, unknown future id kept, only known ones active', !o.errs.length && odd.owned.join() === 'tasksIntro:tasks,future_intro:garden' && odd.mine.join() === 'tasksIntro', { odd, e:o.errs });
  await p.evaluate(() => { data.inventory.roomIntros = 'garbage'; saveData(); }); await o.boot();
  const odd2 = await p.evaluate(() => JSON.stringify(data.inventory.roomIntros));
  ok('D2 non-object roomIntros normalises to {owned:[]}', odd2 === '{"owned":[]}' && !o.errs.length, odd2);
  await o.close();
}

/* ===================== E) تقليل الحركة ===================== */
{
  const o = await open(375, 812, { reduced:true }); const p = o.page;
  await grant(p, 5000); await p.evaluate(() => CodisRoomIntros.buy('tasksIntro'));
  await go(p, 'settings'); await p.waitForTimeout(200); const t0 = Date.now(); await go(p, 'tasks'); await p.waitForTimeout(120);
  const r = await p.evaluate(() => { const s = document.querySelector('.ri-layer .ri-scene'); const t = s && s.querySelector('.ri-title'); return { calm:s && s.classList.contains('is-calm'), play:s && s.classList.contains('is-play'), title:t ? +getComputedStyle(t).opacity : -1, anim:s ? s.getAnimations({ subtree:true }).length : -1 }; });
  const gone = await o.until(() => !document.querySelector('.ri-layer'), 4000); const dt = await p.evaluate(() => { const a = window.__riSeen[window.__riSeen.length - 1], b = window.__riGone[window.__riGone.length - 1]; return a && b ? b[1] - a[1] : -1; });
  ok('E1 reduced motion: static final frame (no sequence), shorter show (≥1.3s; exact 1.5s checked in Chrome by introperf_browser.js — timers run late in this headless WebKit)', r.calm && !r.play && r.title === 1 && r.anim === 0 && gone && dt >= 1300 && dt < 2600, { r, dt });
  await go(p, 'settings'); await p.waitForTimeout(200); await go(p, 'tasks'); await p.waitForTimeout(150); await shot(p, 'E_reduced');
  ok('E2 no page errors (reduced)', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}

/* ===================== F) أحجام الشاشات + الداكن ===================== */
for (const sz of (process.env.SIZES || '320x568,430x932,812x375,1280x800').split(',')) {
  const [w, h] = sz.split('x').map(Number);
  for (const theme of (sz === '320x568' ? ['paper', 'dark'] : ['paper'])) {
    const o = await open(w, h, { theme }); const p = o.page;
    await grant(p, 20000); await p.evaluate(() => { ['planningIntro', 'tasksIntro', 'learnIntro', 'habitsIntro'].forEach(id => CodisRoomIntros.buy(id)); });
    for (const id of IDS) {
      await go(p, 'settings'); await p.waitForTimeout(150); await go(p, ROOM[id]); await p.waitForTimeout(2050);
      const g = await p.evaluate(() => { const el = document.querySelector('.ri-layer'); if (!el) return null; const R = x => { const b = el.querySelector(x).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
        const fr = el.getBoundingClientRect(); return { art:R('.ri-art'), cap:R('.ri-cap'), skip:R('.ri-skip'), fr:[Math.round(fr.left), Math.round(fr.top), Math.round(fr.right), Math.round(fr.bottom)], vw:innerWidth, vh:innerHeight, sw:document.documentElement.scrollWidth,
          ar:(() => { const b = el.querySelector('.ri-art').getBoundingClientRect(); return +(b.width / b.height).toFixed(3); })(), tfs:parseFloat(getComputedStyle(el.querySelector('.ri-title')).fontSize) }; });
      const inside = g && [g.art, g.cap, g.skip].every(b => b[0] >= g.fr[0] - 1 && b[1] >= g.fr[1] - 1 && b[2] <= g.fr[2] + 1 && b[3] <= g.fr[3] + 1);
      const noOverlap = g && (g.cap[1] >= g.art[3] - 1 || g.cap[0] >= g.art[2] - 1 || g.cap[2] <= g.art[0] + 1) && (g.skip[3] <= g.art[1] + 1 || g.skip[0] >= g.art[2] || g.skip[2] <= g.art[0]);
      ok('F ' + sz + ' ' + theme + ' ' + id + ': fits the frame, 4:3 art undistorted, no overlap, no h-scroll, readable title', inside && noOverlap && Math.abs(g.ar - 1.333) < .02 && g.sw <= g.vw && g.tfs >= 20, g);
      await shot(p, 'F_' + sz + '_' + theme + '_' + id);
      await waitGone(o, 2500);
    }
    ok('F ' + sz + ' ' + theme + ': no page errors', !o.errs.length, o.errs.slice(0, 3));
    await o.close();
  }
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
srv.close(); process.exit(fail ? 1 : 0);
