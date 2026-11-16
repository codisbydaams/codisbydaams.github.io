/* CODIS-V61 — معاينة البكج (احتمالات كل عنصر = السحب الفعلي) · القسائم · الصندوق المجاني (جواهر/فضة) · مكافآت التقدم · التوافق.
   WebKit حقيقي (محاكاة iPhone) + عرض حاسوب. Run:  PW=<path to playwright-core/index.mjs> node tests/v61_browser.mjs [app.html]
   RUNS="paper:375,dark:320,paper:1280" (الافتراضي)  ·  SHOTS=<dir> للقطات. الاختبار وحده يمنح الفضة/الجواهر بمعاملة ADMIN_GRANT صريحة. */
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
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v61t-'));
  const desk = w >= 900;
  const opts = desk ? { viewport:{ width:w, height:900 }, deviceScaleFactor:1, hasTouch:false, isMobile:false } : { ...devices['iPhone 12'], viewport:{ width:w, height:844 }, screen:{ width:w, height:844 } };
  const ctx = await webkit.launchPersistentContext(prof, opts);
  await ctx.addInitScript(() => { window.CODIS_B3D_OFF = true; });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); }
    await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t), theme === 'dark' ? 'dark' : 'paper').catch(() => {}); await page.waitForTimeout(300);
    await page.evaluate(() => { CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {}; window.__cfm = []; codisConfirm = async (o) => { window.__cfm.push(o); return true; }; }); };
  await boot();
  return { page, errs, boot, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const shot = async (p, name, sel) => { if (!SHOTS) return; try { if (sel) { const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await el.screenshot({ path:path.join(SHOTS, name + '.png') }); return; } } await p.screenshot({ path:path.join(SHOTS, name + '.png') }); } catch (e) { console.log('shot ' + name + ': ' + e.message); } };
const grant = (p, cur, n) => p.evaluate(([cur, n]) => CodisWallet.transact([], () => { const r = 'qa|' + Math.random(); const t = cur === 'gems' ? CodisWallet.applyGems('ADMIN_GRANT', n, 'qa', 'admin', r) : CodisWallet.applySilver('ADMIN_GRANT', n, 'qa', 'admin', r); return t ? { ok:true } : { ok:false }; }), [cur, n]);
const BAL = () => ({ coin:CodisWallet.balance(), silver:CodisWallet.silverBalance(), gems:CodisWallet.gemBalance(), stx:CodisWallet.silverTxs().length, gtx:CodisWallet.gemTxs().length, ev:(data.vouchers.events || []).length, boxes:(data.inventory.boxes || []).length, items:CodisInventory.owned().length, claims:data.progress.claims.length });

const RUNS = (process.env.RUNS || 'paper:375,dark:320,paper:1280').split(',').map(x => x.split(':'));
for (let ri = 0; ri < RUNS.length; ri++) {
  const [theme, w] = RUNS[ri], T = theme + ' ' + w + ': ', tag = theme + w, full = ri === 0;
  const o = await open(+w, theme); const p = o.page;

  // ================= 1) احتمالات البكجات: المعروض = السحب الفعلي =================
  const odds = await p.evaluate(() => CodisBoxes.tiers().map(t => { const rows = CodisBoxes.effective(t), items = [];
    rows.forEach(r => r.items.forEach(it => items.push({ id:it.id, kind:it.kind, tier:it.tier || '', p:r.pm / 10 / r.items.length })));
    return { id:t.id, n:items.length, uniq:new Set(items.map(x => x.id)).size, sum:items.reduce((a, b) => a + b.p, 0), pmSum:rows.reduce((a, r) => a + r.pm, 0),
      vouchers:items.filter(x => x.kind === 'voucher').map(x => x.tier), items,
      /* المؤهّل = جوائز المستوى حتى سقف القيمة الموجود (MAX_PRIZE_X × السعر المرجعي؛ أغلى بكج بلا سقف) */
      pool:(()=>{ const top = Math.max.apply(null, CodisBoxes.tiers().map(x => x.basePrice)), cap = t.basePrice >= top ? Infinity : CodisLimits.num('box.MAX_PRIZE_X', 12) * t.basePrice; return CodisBoxes.prizePool(t.id).filter(x => CodisBoxes.valueOf(x) > 0 && CodisBoxes.valueOf(x) <= cap).length; })() }; }));
  odds.forEach(t => {
    ok(T + t.id + ' sums: Σpm = 1000 and Σ(item %) = 100', t.pmSum === 1000 && Math.abs(t.sum - 100) < 1e-9, t);
    ok(T + t.id + ' every eligible prize appears once', t.n === t.uniq && t.n === t.pool, { n:t.n, uniq:t.uniq, pool:t.pool });
    ok(T + t.id + ' only its own voucher', t.vouchers.length === 1 && t.vouchers[0] === t.id, t.vouchers);
  });
  for (const tid of ['bx1', 'bx3', 'bx5']) {
    await p.evaluate(id => econPackOpen(id), tid); await p.waitForTimeout(700);
    const dom = await p.evaluate(id => { const cells = [...document.querySelectorAll('#econ-pack-body .pkg-cell')];
      const want = []; CodisBoxes.effective(CodisBoxes.tier(id)).slice().reverse().forEach(o => o.items.forEach(it => want.push(econPackPctTxt(o.pm / 10 / o.items.length))));
      return { n:cells.length, kinds:cells.map(c => c.dataset.kind), pcts:cells.map(c => c.querySelector('.pkg-p').textContent).sort(), want:want.sort(), groups:document.querySelectorAll('#econ-pack-body details').length,
        sum:(document.querySelector('#econ-pack-body .pkx-sum b') || {}).textContent, flips:document.querySelectorAll('#econ-pack-body .cflip').length }; }, tid);
    ok(T + tid + ' pack window: one flat grid (no nested groups), every prize visible', dom.groups === 0 && dom.n === odds.find(x => x.id === tid).n && dom.flips === dom.n, dom);
    ok(T + tid + ' pack window: shown % = engine %', JSON.stringify(dom.pcts) === JSON.stringify(dom.want) && dom.sum === '100%', dom);
    if (tid === 'bx3') {
      await shot(p, tag + '_pack', '#econ-pack-modal .pk-modal');
      await p.click('#econ-pack-body .pkg-cell:nth-child(2) .cflip'); await p.waitForTimeout(800);
      const f1 = await p.evaluate(() => { const c = document.querySelector('#econ-pack-body .pkg-cell:nth-child(2) .cflip'); const b = c.querySelector('.cflip-b');
        return { on:c.classList.contains('is-flipped'), pressed:c.getAttribute('aria-pressed'), txt:b.textContent, pct:c.parentNode.querySelector('.pkg-p').textContent, name:c.parentNode.querySelector('.pkg-n').textContent, r:c.getBoundingClientRect().width }; });
      ok(T + 'flip: tap shows back with name, kind and the same %', f1.on && f1.pressed === 'true' && f1.txt.indexOf(f1.name) !== -1 && f1.txt.indexOf('نسبة الحصول') !== -1 && f1.txt.indexOf(f1.pct) !== -1 && f1.txt.indexOf('النوع') !== -1, f1);
      await shot(p, tag + '_pack_flip', '#econ-pack-body .pkg-cell:nth-child(2)');
      await p.click('#econ-pack-body .pkg-cell:nth-child(2) .cflip'); await p.waitForTimeout(800);
      ok(T + 'flip: tap again returns to the face', await p.evaluate(() => !document.querySelector('#econ-pack-body .pkg-cell:nth-child(2) .cflip').classList.contains('is-flipped')));
      await p.focus('#econ-pack-body .pkg-cell:nth-child(3) .cflip'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
      ok(T + 'flip: keyboard Enter flips', await p.evaluate(() => document.querySelector('#econ-pack-body .pkg-cell:nth-child(3) .cflip').classList.contains('is-flipped')));
      const fit = await p.evaluate(() => { const g = document.querySelector('#econ-pack-body .pkg-grid'), cells = [...g.querySelectorAll('.pkg-cell')]; const gr = g.getBoundingClientRect();
        return { over:cells.filter(c => { const r = c.getBoundingClientRect(); return r.right > gr.right + 1 || r.left < gr.left - 1; }).length, hscroll:document.documentElement.scrollWidth > innerWidth + 1, cut:cells.filter(c => { const n = c.querySelector('.pkg-p'); return n.scrollWidth > n.clientWidth + 1; }).length }; });
      ok(T + 'pack grid fits the screen (no overflow, % not clipped)', !fit.over && !fit.hscroll && !fit.cut, fit);
    }
    await p.evaluate(() => econPackClose()); await p.waitForTimeout(400);
  }
  if (full) {
    // السحب الفعلي (roll) مقابل المعروض: 20,000 سحب لكل مستوى — لا قسيمة لمستوى آخر، والتكرار قريب من الاحتمال
    const sim = await p.evaluate(() => CodisBoxes.tiers().map(t => { const N = 20000, c = {}; let other = 0;
      for (let i = 0; i < N; i++) { const r = CodisBoxes.roll(t); if (!r) continue; c[r.item.id] = (c[r.item.id] || 0) + 1; if (r.voucherTier && r.voucherTier !== t.id) other++; }
      let worst = 0; CodisBoxes.effective(t).forEach(o => o.items.forEach(it => { const pr = o.pm / 1000 / o.items.length, got = (c[it.id] || 0) / N, sd = Math.sqrt(pr * (1 - pr) / N); worst = Math.max(worst, Math.abs(got - pr) / Math.max(sd, 1e-9)); }));
      return { id:t.id, other, worst:+worst.toFixed(2), keys:Object.keys(c).length }; }));
    sim.forEach(s => ok(T + 'roll() vs shown odds ' + s.id + ' (max |z| < 5, no foreign voucher)', s.other === 0 && s.worst < 5, s));
  }

  // ================= 2) القسائم =================
  if (full) await grant(p, 'silver', 5000);
  const v0 = await p.evaluate(() => ({ c:CodisVouchers.counts(), left:CodisVouchers.dailyLeft(), cap:CodisVouchers.dailyCap(), prices:CodisVouchers.defs().map(d => CodisVouchers.price(d.tier)), sil:CodisWallet.silverBalance() }));
  if (full) {
    ok(T + 'prices 7/14/21/37/54 silver · daily cap 20 · start empty', JSON.stringify(v0.prices) === '[7,14,21,37,54]' && v0.cap === 20 && v0.left === 20 && Object.values(v0.c).every(x => x === 0), v0);
    // شراء: خصم الفضة + القسيمة بمعاملة واحدة
    const b1 = await p.evaluate(() => { const s0 = CodisWallet.silverBalance(), r = CodisVouchers.buy('bx1', 9); return { ok:r.ok, d:s0 - CodisWallet.silverBalance(), have:CodisVouchers.count('bx1'), boxes:CodisBoxes.owned('bx1').length, tx:CodisWallet.silverTxs().slice(-1)[0] }; });
    ok(T + 'buy 9 bronze: −63 silver, 9 owned, no box yet, ledger tx PURCHASE_VOUCHER', b1.ok && b1.d === 63 && b1.have === 9 && b1.boxes === 0 && b1.tx.type === 'PURCHASE_VOUCHER' && b1.tx.amount === -63, b1);
    // العاشرة من صندوق حقيقي: نفتح صناديق برونزية حتى تطلع قسيمة
    await grant(p, 'gems', 4000);
    const b2 = await p.evaluate(() => { for (let i = 0; i < 80; i++) { const b = CodisBoxes.buy('bx1'); if (!b.ok) return { err:'buy ' + b.reason }; const r = CodisBoxes.open(b.box.uid); if (!r.ok) return { err:'open ' + r.reason }; if (r.voucher) return { i, have:CodisVouchers.count('bx1'), boxes:r.voucher.boxes, owned:CodisBoxes.owned('bx1').map(x => x.uid), ev:data.vouchers.events.slice(-2).map(e => e.id), bx:data.inventory.boxes.find(x => x.uid === r.box.uid).voucher, left:CodisVouchers.dailyLeft() }; } return { err:'no voucher in 80 opens' }; });
    ok(T + '9 + 1 from a real box ⇒ matching closed box, 0 left', !b2.err && b2.have === 0 && b2.boxes.length === 1 && b2.owned.indexOf('box|vr|bx1|1') !== -1 && b2.ev[1] === 'vr|bx1|1' && /^vx\|/.test(b2.bx), b2);
    ok(T + 'box vouchers do not consume the daily purchase limit', b2.left === 11, b2.left);
    const b3 = await p.evaluate(() => { const r = CodisBoxes.open('box|vr|bx1|1'); return { ok:r.ok, st:(data.inventory.boxes.find(b => b.uid === 'box|vr|bx1|1') || {}).status }; });
    ok(T + 'voucher box opens through the normal box opening', b3.ok && b3.st === 'opened', b3);
    // 20 ⇒ صندوقان، 23 ⇒ صندوقان + 3 (بالشراء + قسائم من صناديق)
    const b4 = await p.evaluate(() => { data.vouchers.events = data.vouchers.events.filter(e => e.t !== 'buy'); const ob = CodisBoxes.owned('bx2').length;
      const r = CodisWallet.transact([], () => { for (let k = 0; k < 20; k++) { if (!CodisVouchers.grantInTx({ id:'vx|qa20|' + k, t:'box', tier:'bx2', n:1 })) return { ok:false }; } return { ok:true }; });
      const a = { ok:r.ok, have:CodisVouchers.count('bx2'), boxes:CodisBoxes.owned('bx2').length - ob };
      CodisWallet.transact([], () => { for (let k = 0; k < 3; k++) CodisVouchers.grantInTx({ id:'vx|qa3|' + k, t:'box', tier:'bx2', n:1 }); return { ok:true }; });
      a.have2 = CodisVouchers.count('bx2'); a.boxes2 = CodisBoxes.owned('bx2').length - ob; return a; });
    ok(T + '20 silver vouchers ⇒ 2 silver boxes, 0 left', b4.ok && b4.have === 0 && b4.boxes === 2, b4);
    ok(T + 'then +3 ⇒ 3 kept (23 total ⇒ 2 boxes + 3)', b4.have2 === 3 && b4.boxes2 === 2, b4);
    const b5 = await p.evaluate(() => { const r = CodisWallet.transact([], () => { for (let k = 0; k < 9; k++) CodisVouchers.grantInTx({ id:'vx|mix|' + k, t:'box', tier:'bx3', n:1 }); for (let k = 0; k < 9; k++) CodisVouchers.grantInTx({ id:'vx|mix4|' + k, t:'box', tier:'bx4', n:1 }); return { ok:true }; });
      return { c:CodisVouchers.counts(), b3:CodisBoxes.owned('bx3').length, b4:CodisBoxes.owned('bx4').length }; });
    ok(T + 'different tiers never combine (9 crystal + 9 gold ⇒ no box)', b5.c.bx3 === 9 && b5.c.bx4 === 9 && b5.b3 === 0 && b5.b4 === 0, b5);
    // الحد اليومي: 20 لكل الأنواع
    const d1 = await p.evaluate(() => { data.vouchers.events = data.vouchers.events.filter(e => e.t !== 'buy'); const a = CodisVouchers.buy('bx1', 12), b = CodisVouchers.buy('bx2', 8), s0 = BALs(); const c = CodisVouchers.buy('bx3', 1), s1 = BALs();
      function BALs(){ return CodisWallet.silverBalance() + '|' + data.vouchers.events.length; } return { a:a.ok, b:b.ok, c:c.ok, reason:c.reason, left:CodisVouchers.dailyLeft(), same:s0 === s1 }; });
    ok(T + '12 bronze + 8 silver = limit; the 21st is refused with nothing charged', d1.a && d1.b && !d1.c && d1.reason === 'daily' && d1.left === 0 && d1.same, d1);
    const d2 = await p.evaluate(() => { const y = new Date(CodisClock.now() - 86400000); const yk = localDateStr(y); data.vouchers.events.forEach(e => { if (e.t === 'buy') e.day = yk; }); return { left:CodisVouchers.dailyLeft(), r:CodisVouchers.buy('bx3', 1).ok }; });
    ok(T + 'next local day ⇒ limit renews', d2.left === 20 && d2.r, d2);
    // نقص الفضة: لا شيء يتغير
    const d3 = await p.evaluate(() => { const s = CodisWallet.silverBalance(); CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', -s, 'qa', 'admin', 'qa-zero'); return { ok:true }; }); const e0 = data.vouchers.events.length; const r = CodisVouchers.buy('bx5', 1); return { r:r.reason, ev:data.vouchers.events.length - e0, sil:CodisWallet.silverBalance() }; });
    ok(T + 'not enough silver ⇒ refused, no voucher, no charge', d3.r === 'insufficient' && d3.ev === 0 && d3.sil === 0, d3);
    await grant(p, 'silver', 2000);
    // فشل الحفظ ⇒ تراجع كامل
    const d4 = await p.evaluate(() => { const b0 = JSON.stringify([CodisWallet.silverBalance(), data.vouchers.events.length, CodisWallet.silverTxs().length]); codisSaveSuspended = 'fail'; const r = CodisVouchers.buy('bx1', 1); codisSaveSuspended = false; return { reason:r.reason, same:b0 === JSON.stringify([CodisWallet.silverBalance(), data.vouchers.events.length, CodisWallet.silverTxs().length]) }; });
    ok(T + 'save failure ⇒ full rollback (silver, ledger, vouchers)', d4.reason === 'save' && d4.same, d4);
    // الضغط المزدوج على زر الشراء
    await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1300); await p.evaluate(() => econStoreSetPart('items')); await p.waitForTimeout(500);
    const d5 = await p.evaluate(() => { econVoucherLock = 0; const e0 = data.vouchers.events.length, s0 = CodisWallet.silverBalance(); const b = document.querySelector('#pane-items .vch-tile[data-tier="bx2"] .vch-buy'); b.click(); b.click(); return { ev:data.vouchers.events.length - e0, d:s0 - CodisWallet.silverBalance() }; });
    ok(T + 'double tap on buy ⇒ one purchase, one charge', d5.ev === 1 && d5.d === 14, d5);
    await p.waitForTimeout(600);
  } else { await grant(p, 'silver', 500); await p.evaluate(() => CodisWallet.transact([], () => { for (let k = 0; k < 7; k++) CodisVouchers.grantInTx({ id:'vx|vis|' + k, t:'box', tier:'bx1', n:1 }); CodisVouchers.grantInTx({ id:'vx|vis2', t:'box', tier:'bx4', n:1 }); return { ok:true }; })); await p.evaluate(() => econOpenStore()); await p.waitForTimeout(1300); await p.evaluate(() => econStoreSetPart('items')); await p.waitForTimeout(600); }
  const st = await p.evaluate(() => { const pane = document.getElementById('pane-items'), tiles = [...pane.querySelectorAll('.vch-tile')];
    return { on:pane.classList.contains('is-on'), rail:!!document.querySelector('.st-rail-b[data-part="items"]'), tiles:tiles.length, names:tiles.map(t => t.querySelector('.vch-name').textContent), left:pane.querySelector('.vch-left').textContent,
      prices:tiles.map(t => t.querySelector('.vch-buy .eco-coin b').textContent), own:tiles.map(t => t.querySelector('.vch-own').textContent),
      clip:tiles.filter(t => [...t.querySelectorAll('.vch-name, .vch-buy, .vch-buy5')].some(e => e.scrollWidth > e.clientWidth + 1)).length, hs:document.getElementById('eco-store-stage').scrollWidth > document.getElementById('eco-store-stage').clientWidth + 1 }; });
  ok(T + 'store «العناصر» section registered in the rail, 5 vouchers with name/price/owned/buy', st.on && st.rail && st.tiles === 5 && st.names.join('|') === 'قسيمة برونزية|قسيمة فضية|قسيمة كريستالية|قسيمة ذهبية|قسيمة خرافية' && st.prices.join() === '7,14,21,37,54' && /متبقي لك \d+ من 20 قسيمة اليوم/.test(st.left), st);
  ok(T + 'voucher tiles: no clipped text, no horizontal overflow', !st.clip && !st.hs, st);
  await shot(p, tag + '_store_items', '#pane-items');
  // «بحوزتك» ← العناصر ← قسائم الصناديق
  await p.evaluate(() => econOpenVault()); await p.waitForTimeout(900); await p.evaluate(() => econOwnSetPart('items')); await p.waitForTimeout(500);
  const ow = await p.evaluate(() => { const g = document.getElementById('own-vouchers'); if (!g) return { none:true }; return { head:g.querySelector('.own-sub span').textContent, tiles:g.querySelectorAll('.vch-own-tile').length, prog:[...g.querySelectorAll('.vch-prog b')].map(b => b.textContent), counts:CodisVouchers.counts() }; });
  const want = ['bx1', 'bx2', 'bx3', 'bx4', 'bx5'].map(k => ow.counts && (ow.counts[k] + ' / 10'));
  ok(T + '«بحوزتك» has «قسائم الصناديق» with each type and x / 10 progress', !ow.none && ow.head === 'قسائم الصناديق' && ow.tiles === 5 && JSON.stringify(ow.prog) === JSON.stringify(want), { ow, want });
  await shot(p, tag + '_own_vouchers', '#own-vouchers');
  await p.evaluate(() => econCloseOwn()); await p.waitForTimeout(500);

  if (full) {
    // البقاء بعد إعادة التحميل
    const before = await p.evaluate(() => JSON.stringify(CodisVouchers.counts()) + '|' + data.vouchers.events.length + '|' + CodisWallet.silverBalance());
    await o.boot();
    const after = await p.evaluate(() => JSON.stringify(CodisVouchers.counts()) + '|' + data.vouchers.events.length + '|' + CodisWallet.silverBalance());
    ok(T + 'vouchers survive reload exactly', before === after, { before, after });
    // الدمج بين جهازين: اتحاد الأحداث، استبدال الدفعة نفسها مرة واحدة، لا قسائم تختفي أو تتكرر
    const mg = await p.evaluate(() => { const base = JSON.parse(JSON.stringify(data)); base.vouchers = { v:1, events:[{ id:'vb|A0', t:'buy', tier:'bx1', n:9, at:'2026-11-15T10:00:00.000Z', day:'2026-11-15' }] }; base.inventory.boxes = [];
      const A = JSON.parse(JSON.stringify(base)), B = JSON.parse(JSON.stringify(base));
      A.vouchers.events.push({ id:'vx|boxA', t:'box', tier:'bx1', n:1, at:'2026-11-16T10:00:00.000Z' }, { id:'vr|bx1|1', t:'redeem', tier:'bx1', n:-10, at:'2026-11-16T10:00:00.000Z' }); A.inventory.boxes.push({ uid:'box|vr|bx1|1', tier:'bx1', paid:0, currency:'VOUCHER', acquiredAt:'2026-11-16T10:00:00.000Z', status:'unopened', sourceRef:'vr|bx1|1' });
      B.vouchers.events.push({ id:'vx|boxB', t:'box', tier:'bx1', n:1, at:'2026-11-16T11:00:00.000Z' }, { id:'vr|bx1|1', t:'redeem', tier:'bx1', n:-10, at:'2026-11-16T11:00:00.000Z' }); B.inventory.boxes.push({ uid:'box|vr|bx1|1', tier:'bx1', paid:0, currency:'VOUCHER', acquiredAt:'2026-11-16T11:00:00.000Z', status:'unopened', sourceRef:'vr|bx1|1' });
      const m = CodisMerge.merge(base, A, B); normalizeData(m, false);
      const sum = m.vouchers.events.filter(e => e.tier === 'bx1').reduce((a, e) => a + e.n, 0);
      return { ids:m.vouchers.events.map(e => e.id), boxes:m.inventory.boxes.filter(b => b.uid === 'box|vr|bx1|1').length, sum }; });
    ok(T + 'merge two devices: events union, same redemption once, one box, 1 voucher kept', mg.ids.length === 4 && mg.boxes === 1 && mg.sum === 1, mg);
  }

  // ================= 3) الصندوق المجاني =================
  if (full) {
    const f0 = await p.evaluate(() => { ['أ', 'ب', 'ج'].forEach((n, i) => codisFinCreateReward({ name:'هدية ' + n, kind:'time', minutes:4 + i * 2, cardId:'free_box' })); data.economyState.freeBox = { at:'', n:0 }; saveData(); return CodisFreeBox.status(); });
    ok(T + 'free box ready with eligible cards', f0.ready && f0.poolN >= 3, f0);
    const f1 = await p.evaluate(() => { const b0 = { g:CodisWallet.gemBalance(), s:CodisWallet.silverBalance(), it:CodisInventory.owned().length }; const r = CodisFreeBox.claim();
      const gt = CodisWallet.gemTxs().slice(-1)[0], sx = CodisWallet.silverTxs().slice(-1)[0];
      return { ok:r.ok, gems:r.gems, silver:r.silver, dg:CodisWallet.gemBalance() - b0.g, ds:CodisWallet.silverBalance() - b0.s, di:CodisInventory.owned().length - b0.it, gt:gt.type, st:sx.type, sameRef:gt.referenceId === sx.referenceId && /^freebox\|/.test(gt.referenceId), wait:CodisFreeBox.status().ready }; });
    ok(T + 'claim: card + gems (1–10) + silver (1–20) together, one claim reference', f1.ok && f1.di === 1 && f1.dg === f1.gems && f1.ds === f1.silver && f1.gems >= 1 && f1.gems <= 10 && f1.silver >= 1 && f1.silver <= 20 && f1.gt === 'FREEBOX_GRANT' && f1.st === 'FREEBOX_GRANT' && f1.sameRef, f1);
    const f2 = await p.evaluate(() => { const b = JSON.stringify([CodisWallet.gemBalance(), CodisWallet.silverBalance(), CodisInventory.owned().length]); const r1 = CodisFreeBox.claim(), r2 = CodisFreeBox.claim(); return { r1:r1.reason, r2:r2.reason, same:b === JSON.stringify([CodisWallet.gemBalance(), CodisWallet.silverBalance(), CodisInventory.owned().length]), waitH:Math.round(CodisFreeBox.status().waitMs / 3600000) }; });
    ok(T + 'repeat claims refused for 24h, nothing granted', f2.r1 === 'wait' && f2.r2 === 'wait' && f2.same && f2.waitH === 24, f2);
    const f3 = await p.evaluate(() => { data.economyState.freeBox.at = new Date(CodisClock.now() - 86400001).toISOString(); data.inventory.items.forEach(x => { if (x.source === 'free') x.acquiredAt = data.economyState.freeBox.at; }); const b = JSON.stringify([CodisWallet.gemBalance(), CodisWallet.silverBalance(), CodisInventory.owned().length, data.economyState.freeBox.at]);
      codisSaveSuspended = 'fail'; const r = CodisFreeBox.claim(); codisSaveSuspended = false; return { reason:r.reason, same:b === JSON.stringify([CodisWallet.gemBalance(), CodisWallet.silverBalance(), CodisInventory.owned().length, data.economyState.freeBox.at]), ready:CodisFreeBox.status().ready }; });
    ok(T + 'save failure ⇒ no card, no gems, no silver, claim time unchanged', f3.reason === 'save' && f3.same && f3.ready, f3);
    const f4 = await p.evaluate(() => { const g = {}, s = {}; let bad = 0; for (let i = 0; i < 400; i++) { data.economyState.freeBox.at = new Date(CodisClock.now() - 86400001).toISOString(); data.inventory.items.forEach(x => { if (x.source === 'free') x.acquiredAt = data.economyState.freeBox.at; }); const r = CodisFreeBox.claim(); if (!r.ok) { bad++; continue; } g[r.gems] = (g[r.gems] || 0) + 1; s[r.silver] = (s[r.silver] || 0) + 1; }
      return { bad, gk:Object.keys(g).map(Number).sort((a, b) => a - b), sk:Object.keys(s).map(Number).sort((a, b) => a - b) }; });
    ok(T + '400 claims: gems cover exactly 1..10, silver exactly 1..20', f4.bad === 0 && f4.gk.join() === '1,2,3,4,5,6,7,8,9,10' && f4.sk.length === 20 && f4.sk[0] === 1 && f4.sk[19] === 20, f4);
    // الواجهة
    await p.evaluate(() => { data.economyState.freeBox.at = new Date(CodisClock.now() - 86400001).toISOString(); data.inventory.items.forEach(x => { if (x.source === 'free') x.acquiredAt = data.economyState.freeBox.at; }); saveData(); econRenderStore(); econStoreSetPart('boxes'); }); await p.waitForTimeout(600);
    await p.evaluate(() => codisFreeBoxOpen()); await p.waitForTimeout(2000);
    const fu = await p.evaluate(() => { const v = document.getElementById('fb-rev'); return { shown:!!v && !v.hidden, bonus:v ? [...v.querySelectorAll('.fb-bn .eco-coin b')].map(b => b.textContent) : [], bal:v ? v.querySelector('.fb-bal').textContent : '', card:!!(v && v.querySelector('.fb-cardwrap .rwc, .fb-cardwrap svg, .fb-cardwrap img')) }; });
    ok(T + 'free box reveal shows the card + gems + silver + new balances', fu.shown && fu.bonus.length === 2 && fu.card && /رصيدك الآن/.test(fu.bal), fu);
    await shot(p, tag + '_freebox', '#fb-ov .fb-stage');
    await p.evaluate(() => codisFreeBoxClose()); await p.waitForTimeout(500);
  }

  // ================= 4) مكافآت التقدم: الشرط ← جاهزة للاستلام ← الاستلام اليدوي فقط =================
  const GEM = () => p.evaluate(() => CodisWallet.gemBalance());
  const ST = id => p.evaluate(id => CodisProgress.state(CodisProgress.def(id)).status, id);
  const goPage = async () => { await p.evaluate(() => { try { econCloseStore({ silent:true }); } catch (e) {} document.querySelector('.navbtn[data-page="settings"]').click(); }); await p.waitForTimeout(600); await p.evaluate(() => openSettingsCategory('progress')); await p.waitForTimeout(900); };
  const card = id => p.evaluate(id => { const c = document.querySelector('#progress-root .pg-card[data-ach="' + id + '"]'); return c ? { cls:c.className, btn:!!c.querySelector('.pg-claim'), stamp:!!c.querySelector('.pg-stamp'), st:c.querySelector('.pg-st').textContent.trim(), num:c.querySelector('.pg-num').textContent } : null; }, id);
  if (full) {
    const seedWeek = (ops, learn, dup) => p.evaluate(([ops, learn, dup]) => { const mk = (pre, n, st) => { const days = {}; for (let d = 0; d < 7; d++) days[d] = []; for (let i = 0; i < n; i++) days[i % 6].push({ id:pre + i, text:'م ' + i, status:st, qty:1 }); return { days, holidayDay:6, planName:'qa' }; };
      const tw = mk('qt', ops.done, 'done'); for (let i = 0; i < ops.half; i++) tw.days[i % 6].push({ id:'qh' + i, text:'نص', status:'half', progress:90, qty:1 });
      if (dup) tw.days[3].push(JSON.parse(JSON.stringify(tw.days[0][0])));
      tw.days[6].push({ id:'qhol', text:'عطلة', status:'done', qty:1 });
      const lw = mk('ql', learn.done, 'done');
      data.archive.unshift({ id:'arc_qa', name:'qa', weekId:'2026-10-04', status:'completed', cause:'completed', tasksWeek:tw, learnWeek:lw }); saveData(); return { ops:codisProgressDoneCount('tasks'), learn:codisProgressDoneCount('learn') }; }, [ops, learn, dup]);
    const p0 = await p.evaluate(() => { const L = CodisProgress.list(); return { ids:L.map(s => s.def.id), st:L.map(s => s.status), goals:L.map(s => s.goal), rw:L.map(s => s.def.rewards.map(r => r.type + r.n).join()) }; });
    ok(T + 'three achievements (5 / 10 / 10 gems), all in progress', p0.ids.join() === 'first_week,ops_tasks_25,learn_items_25' && p0.goals.join() === '1,25,25' && p0.rw.join('|') === 'gems5|gems10|gems10' && p0.st.every(s => s === 'progress'), p0);
    const c1 = await seedWeek({ done:24, half:25 }, { done:24 }, true); let g0 = await GEM();
    const u1 = await p.evaluate(() => CodisProgress.check({ quiet:true }).map(a => a.id));
    ok(T + '24 done + 25 half + duplicate id + holiday task ⇒ 24/24, nothing unlocked', c1.ops === 24 && c1.learn === 24 && !u1.length && await GEM() === g0, { c1, u1 });
    // (1) 25 مهمة ⇒ جاهزة للاستلام بلا أي جواهر
    await p.evaluate(() => { data.archive[0].tasksWeek.days[2].push({ id:'qt_25', text:'٢٥', status:'done', qty:1 }); saveData(); });
    const u2 = await p.evaluate(() => CodisProgress.check({ quiet:true }).map(a => a.id));
    ok(T + '(1) 25 ops tasks ⇒ «ready to claim», no gems added', u2.join() === 'ops_tasks_25' && await ST('ops_tasks_25') === 'ready' && await GEM() === g0 && await p.evaluate(() => CodisWallet.gemTxs().every(t => t.type !== 'PROGRESS_REWARD')), u2);
    // (2) فتح الصفحة لا يمنح
    await goPage(); const k1 = await card('ops_tasks_25');
    ok(T + '(2) opening the page: card highlighted with «استلام المكافأة», no gems', /is-ready/.test(k1.cls) && k1.btn && !k1.stamp && /جاهزة للاستلام/.test(k1.st) && await GEM() === g0, k1);
    await shot(p, tag + '_progress_ready', '#settings-page-progress');
    // (3)(7) إعادة التحميل / إغلاق التطبيق: تبقى جاهزة ولا منح
    await o.boot(); await p.waitForTimeout(6500);
    ok(T + '(3)(7) reload + boot check ⇒ still ready, no gems', await ST('ops_tasks_25') === 'ready' && await GEM() === g0 && await p.evaluate(() => CodisProgress.unlocked('ops_tasks_25')));
    // (4)(5) الضغط على «استلام المكافأة»
    await goPage(); await p.click('#progress-root .pg-card[data-ach="ops_tasks_25"] .pg-claim'); await p.waitForTimeout(300);
    const flying = await p.evaluate(() => !!document.querySelector('#progress-root .pg-card[data-ach="ops_tasks_25"] .pg-fly'));
    await p.waitForTimeout(1500); const k2 = await card('ops_tasks_25');
    ok(T + '(4) tapping «استلام المكافأة» ⇒ +10 gems (PROGRESS_REWARD progress|ops_tasks_25)', await GEM() === g0 + 10 && await p.evaluate(() => CodisWallet.gemTxs().filter(t => t.referenceId === 'progress|ops_tasks_25').length === 1), { g:await GEM(), g0 });
    ok(T + '(5) state «تم الاستلام»: stamp shown, button gone (with claim animation)', /is-claimed/.test(k2.cls) && k2.stamp && !k2.btn && /تم الاستلام/.test(k2.st) && flying, { k2, flying });
    await shot(p, tag + '_progress_claimed', '#progress-root .pg-card[data-ach="ops_tasks_25"]');
    // (6) مرة ثانية: لا شيء
    const r6 = await p.evaluate(() => [CodisProgress.claim('ops_tasks_25').reason, CodisProgress.claim('ops_tasks_25').reason]);
    ok(T + '(6) claiming again ⇒ refused, no extra gems', r6.join() === 'claimed,claimed' && await GEM() === g0 + 10, r6);
    // (9) فشل الحفظ أثناء الاستلام ⇒ لا منح جزئي وتبقى جاهزة
    await p.evaluate(() => { data.archive[0].learnWeek.days[1].push({ id:'ql_25', text:'٢٥', status:'done', qty:1 }); saveData(); CodisProgress.check({ quiet:true }); });
    g0 = await GEM();
    const r9 = await p.evaluate(() => { const b = JSON.stringify([CodisWallet.gemBalance(), CodisWallet.gemTxs().length, data.progress.claims.length]); codisSaveSuspended = 'fail'; const r = CodisProgress.claim('learn_items_25'); codisSaveSuspended = false;
      return { reason:r.reason, same:b === JSON.stringify([CodisWallet.gemBalance(), CodisWallet.gemTxs().length, data.progress.claims.length]), st:CodisProgress.state(CodisProgress.def('learn_items_25')).status }; });
    ok(T + '(9) save failure while claiming ⇒ nothing granted, still ready', r9.reason === 'save' && r9.same && r9.st === 'ready', r9);
    // الضغط المزدوج/المتزامن على الزر ⇒ مرة واحدة
    await goPage();
    await p.evaluate(() => { const b = document.querySelector('#progress-root .pg-card[data-ach="learn_items_25"] .pg-claim'); b.click(); b.click(); codisProgressClaimUI('learn_items_25', b); }); await p.waitForTimeout(1600);
    ok(T + 'double / concurrent taps ⇒ +10 once', await GEM() === g0 + 10 && await ST('learn_items_25') === 'claimed', { g:await GEM(), g0 });
    // أول أسبوع ناجح: جاهزة بلا منح، وتبقى جاهزة حتى لو اختفى مصدرها لاحقاً
    const r11 = await p.evaluate(() => { data.outcomeLedger['weekly|qa|2'] = { id:'weekly|qa|2', scope:'weekly', kind:'reward', status:'resolved', decision:'item', item:'م', room:'tasks', type:'weekly_reward', at:econNowIso(), rarity:'C', rarityTone:'c' }; saveData();
      const u = CodisProgress.check({ quiet:true }).map(a => a.id); delete data.outcomeLedger['weekly|qa|2']; saveData(); return { u, st:CodisProgress.state(CodisProgress.def('first_week')).status }; });
    ok(T + '(10) first successful week ⇒ ready (no gems); stays ready even if the source later disappears', r11.u.join() === 'first_week' && r11.st === 'ready' && await GEM() === g0 + 10, r11);
    const r12 = await p.evaluate(() => { data.outcomeLedger['weekly|qa|n'] = { id:'weekly|qa|n', scope:'weekly', kind:'neutral', status:'resolved', item:'', room:'tasks', type:'weekly_neutral', at:econNowIso() }; saveData(); const a = CodisProgress.check({ quiet:true }).length; const r = CodisProgress.claim('first_week'); return { a, ok:r.ok, again:CodisProgress.claim('first_week').reason }; });
    ok(T + '(10) first week claimed manually ⇒ +5 once; neutral weeks change nothing', r12.a === 0 && r12.ok && r12.again === 'claimed' && await GEM() === g0 + 15, r12);
    // (8) استلام على جهاز ثم مزامنة مع جهاز آخر كانت فيه جاهزة ⇒ لا استلام ثانٍ
    const r8 = await p.evaluate(() => { const base = JSON.parse(JSON.stringify(data)); base.wallet.gems.transactions = base.wallet.gems.transactions.filter(t => t.referenceId !== 'progress|ops_tasks_25'); base.wallet.gems.balance -= 10; base.progress.claims = base.progress.claims.filter(c => c.id !== 'ops_tasks_25');
      const A = JSON.parse(JSON.stringify(base)), B = JSON.parse(JSON.stringify(base));
      A.wallet.gems.transactions.push({ id:'gtxA', type:'PROGRESS_REWARD', currency:'GEMS', amount:10, reason:'x', source:'progress', referenceId:'progress|ops_tasks_25', createdAt:econNowIso() }); A.wallet.gems.balance += 10; A.progress.claims.push({ id:'ops_tasks_25', at:econNowIso() });
      const m = CodisMerge.merge(base, B, A); normalizeData(m, false); const keep = data; data = m; const st = CodisProgress.state(CodisProgress.def('ops_tasks_25')).status, again = CodisProgress.claim('ops_tasks_25').reason, n = data.wallet.gems.transactions.filter(t => t.referenceId === 'progress|ops_tasks_25').length; data = keep;
      return { st, again, n, d:m.wallet.gems.balance - base.wallet.gems.balance }; });
    ok(T + '(8) claimed on device A, synced to device B ⇒ «claimed» on B, cannot claim again, +10 once', r8.st === 'claimed' && r8.again === 'claimed' && r8.n === 1 && r8.d === 10, r8);
    // سجل الاستلام مفقود لكن دفتر الجواهر فيه المرجع ⇒ مستلمة
    const r13 = await p.evaluate(() => { data.progress.claims = data.progress.claims.filter(c => c.id !== 'first_week'); const s = CodisProgress.state(CodisProgress.def('first_week')).status, r = CodisProgress.claim('first_week').reason; return { s, r }; });
    ok(T + 'claim log lost but gem ledger has the reference ⇒ still «claimed»', r13.s === 'claimed' && r13.r === 'claimed' && await GEM() === g0 + 15, r13);
    await p.evaluate(() => saveData());
  }
  // صفحة الإعدادات
  await p.evaluate(() => { try { econCloseStore({ silent:true }); } catch (e) {} document.querySelector('.navbtn[data-page="settings"]').click(); }); await p.waitForTimeout(700);
  const hp = await p.evaluate(() => { const b = [...document.querySelectorAll('#settings-home .ios-row')].map(r => r.querySelector('.ios-row-title').textContent); return b.slice(0, 3); });
  ok(T + 'settings home: «مكافآت التقدم» right after «الحساب والمزامنة»', hp[0] === 'الحساب والمزامنة' && hp[1] === 'مكافآت التقدم', hp);
  const gpg = await p.evaluate(() => CodisWallet.gemBalance());
  await p.evaluate(() => openSettingsCategory('progress')); await p.waitForTimeout(900);
  const pg = await p.evaluate(() => { const cards = [...document.querySelectorAll('#progress-root .pg-card')]; return { n:cards.length, cls:cards.map(c => c.className.replace('pg-card ', '')), nums:cards.map(c => c.querySelector('.pg-num').textContent), rw:cards.map(c => c.querySelector('.pg-rw .eco-coin b') && c.querySelector('.pg-rw .eco-coin b').textContent), clip:cards.filter(c => [...c.querySelectorAll('.pg-name, .pg-num, .pg-st')].some(e => e.scrollWidth > e.clientWidth + 1)).length, hs:document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(T + 'progress page: 3 cards with name/progress/goal/bar/reward/state', pg.n === 3 && pg.rw.join() === '5,10,10' && pg.nums.every(x => /^\d+ \/ (1|25)$/.test(x)) && !pg.clip && !pg.hs, pg);
  if (full) ok(T + 'progress page: claimed state shown for all three', pg.cls.every(c => /^is-claimed/.test(c)), pg.cls);
  else ok(T + 'progress page: fresh account = in-progress state', pg.cls.every(c => c === 'is-progress'), pg.cls);
  ok(T + 'opening the page grants nothing', await p.evaluate(() => CodisWallet.gemBalance()) === gpg);
  await shot(p, tag + '_progress', '#settings-page-progress');

  ok(T + 'no JS errors', o.errs.length === 0, o.errs);
  await o.close();
}
srv.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
