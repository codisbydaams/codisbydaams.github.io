/* CODIS-V62 — الاختبارات الإلزامية: القسائم (دمج يدوي فقط) · الصناديق المغلقة بـ«بحوزتك» (استخدام ← البكجات ← فتح) · نافذة الخيارين · مكافآت التقدم الأربعة (استلام يدوي).
   WebKit حقيقي (محاكاة iPhone). Run:  PW=<path to playwright-core/index.mjs> node tests/v62_browser.mjs [app.html]
   RUNS="paper:375,dark:320" (الافتراضي؛ المنطق الكامل بالأول، التخطيط بالكل) · SHOTS=<dir> للقطات. الاختبار وحده يمنح الجواهر/الفضة بمعاملة ADMIN_GRANT صريحة. */
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
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v62t-'));
  const opts = { ...devices['iPhone 12'], viewport:{ width:w, height:844 }, screen:{ width:w, height:844 } };
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
  return { page, errs, boot, until, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const shot = async (p, name, sel) => { if (!SHOTS) return; try { if (sel) { const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await el.screenshot({ path:path.join(SHOTS, name + '.png') }); return; } } await p.screenshot({ path:path.join(SHOTS, name + '.png') }); } catch (e) { console.log('shot ' + name + ': ' + e.message); } };
const grant = (p, cur, n) => p.evaluate(([cur, n]) => CodisWallet.transact([], () => { const r = 'qa|' + Math.random(); const t = cur === 'gems' ? CodisWallet.applyGems('ADMIN_GRANT', n, 'qa', 'admin', r) : CodisWallet.applySilver('ADMIN_GRANT', n, 'qa', 'admin', r); return t ? { ok:true } : { ok:false }; }), [cur, n]);
/* قسائم بمعرّفات فريدة (مثل قسائم الصناديق) دون المرور بالشراء */
const give = (p, tier, n, tag) => p.evaluate(([tier, n, tag]) => CodisWallet.transact([], () => { for (let k = 0; k < n; k++) if (!CodisVouchers.grantInTx({ id:'vx|' + tag + '|' + k, t:'box', tier, n:1 })) return { ok:false }; return { ok:true }; }), [tier, n, tag]);
const ST = () => ({ c:CodisVouchers.counts(), own:CodisBoxes.tiers().reduce((o, t) => (o[t.id] = CodisBoxes.owned(t.id).length, o), {}), boxes:(data.inventory.boxes || []).length, gems:CodisWallet.gemBalance(), silver:CodisWallet.silverBalance(), ev:data.vouchers.events.length });
const zeroVouchers = p => p.evaluate(() => { data.vouchers.events = []; data.inventory.boxes = []; saveData(); });

const RUNS = (process.env.RUNS || 'paper:375,dark:320').split(',').map(x => x.split(':'));
for (let ri = 0; ri < RUNS.length; ri++) {
  const [theme, w] = RUNS[ri], T = theme + ' ' + w + ': ', tag = theme + w, full = ri === 0;
  const o = await open(+w, theme); const p = o.page;
  await grant(p, 'gems', 5000); await grant(p, 'silver', 3000);

  if (full) {
    // ================= القسائم =================
    await zeroVouchers(p); await give(p, 'bx1', 9, 'a');
    const v1 = await p.evaluate(() => { const s0 = JSON.stringify([CodisVouchers.counts(), data.inventory.boxes.length]); const r = CodisVouchers.merge('bx1'); return { r:r.reason, same:s0 === JSON.stringify([CodisVouchers.counts(), data.inventory.boxes.length]) }; });
    ok(T + 'V1 9 vouchers: merge refused, nothing changes', v1.r === 'few' && v1.same, v1);
    await give(p, 'bx1', 1, 'b');
    const v2 = await p.evaluate(() => { const b0 = CodisBoxes.owned('bx1').length, g0 = CodisWallet.gemBalance(); const r = CodisVouchers.merge('bx1'); const b = CodisBoxes.get(r.uid); return { ok:r.ok, have:CodisVouchers.count('bx1'), nb:CodisBoxes.owned('bx1').length - b0, st:b && b.status, cur:b && b.currency, gems:CodisWallet.gemBalance() - g0 }; });
    ok(T + 'V2 10 vouchers: manual merge ⇒ exactly 1 closed bronze box, 0 left, no currency', v2.ok && v2.have === 0 && v2.nb === 1 && v2.st === 'unopened' && v2.cur === 'VOUCHER' && v2.gems === 0, v2);
    await give(p, 'bx1', 20, 'c');
    const v3 = await p.evaluate(() => { const b0 = CodisBoxes.owned('bx1').length; const r = CodisVouchers.merge('bx1'); return { ok:r.ok, have:CodisVouchers.count('bx1'), nb:CodisBoxes.owned('bx1').length - b0 }; });
    ok(T + 'V3 20 vouchers: one press ⇒ one box, 10 remain', v3.ok && v3.have === 10 && v3.nb === 1, v3);
    const v4 = await p.evaluate(() => { const b0 = CodisBoxes.owned('bx1').length; const r = CodisVouchers.merge('bx1'); const r2 = CodisVouchers.merge('bx1'); return { ok:r.ok, have:CodisVouchers.count('bx1'), nb:CodisBoxes.owned('bx1').length - b0, again:r2.reason }; });
    ok(T + 'V4 second press ⇒ second box, 0 remain, third press refused', v4.ok && v4.have === 0 && v4.nb === 1 && v4.again === 'few', v4);
    // V5 الشراء حتى 10 (و30): لا دمج
    const v5 = await p.evaluate(() => { data.vouchers.events = data.vouchers.events.filter(e => e.t !== 'buy'); const b0 = data.inventory.boxes.length; const a = CodisVouchers.buy('bx2', 9), b = CodisVouchers.buy('bx2', 1);
      return { ok:a.ok && b.ok, have:CodisVouchers.count('bx2'), boxes:data.inventory.boxes.length - b0, rb:b.boxes.length }; });
    ok(T + 'V5 buying the 10th voucher: no automatic merge', v5.ok && v5.have === 10 && v5.boxes === 0 && v5.rb === 0, v5);
    const v5b = await p.evaluate(() => { data.vouchers.events = data.vouchers.events.filter(e => e.t !== 'buy'); const b0 = data.inventory.boxes.length; const r = CodisVouchers.buy('bx2', 20); const ok = r.ok && CodisWallet.transact([], () => { for (let k = 0; k < 10; k++) if (!CodisVouchers.grantInTx({ id:'vx|v5b|' + k, t:'box', tier:'bx2', n:1 })) return { ok:false }; return { ok:true }; }).ok; return { ok, have:CodisVouchers.count('bx2'), boxes:data.inventory.boxes.length - b0 }; });
    ok(T + 'V5b 30 vouchers held: still no automatic merge', v5b.ok && v5b.have === 30 && v5b.boxes === 0, v5b);
    // V6 قسيمة من صندوق حقيقي تجعل العدد 10: لا دمج
    await give(p, 'bx1', 9, 'd');
    const v6 = await p.evaluate(() => { for (let i = 0; i < 120; i++) { const b = CodisBoxes.buy('bx1'); if (!b.ok) return { err:'buy ' + b.reason }; const before = data.inventory.boxes.filter(x => x.status === 'unopened').length; const r = CodisBoxes.open(b.box.uid); if (!r.ok) return { err:'open ' + r.reason };
        if (r.voucher) return { i, have:CodisVouchers.count('bx1'), rb:r.voucher.boxes.length, closedDelta:data.inventory.boxes.filter(x => x.status === 'unopened').length - (before - 1) }; } return { err:'no voucher in 120 opens' }; });
    ok(T + 'V6 voucher from a box reaching 10: no automatic merge', !v6.err && v6.have === 10 && v6.rb === 0 && v6.closedDelta === 0, v6);
    // V7 أنواع مختلفة لا تُجمع
    await zeroVouchers(p); await give(p, 'bx3', 5, 'e'); await give(p, 'bx4', 5, 'f');
    const v7 = await p.evaluate(() => ({ a:CodisVouchers.merge('bx3').reason, b:CodisVouchers.merge('bx4').reason, c:CodisVouchers.merge('bx9').reason, boxes:data.inventory.boxes.length, cnt:CodisVouchers.counts() }));
    ok(T + 'V7 5+5 of different tiers: refused (no cross-tier merge), unknown tier invalid', v7.a === 'few' && v7.b === 'few' && v7.c === 'invalid' && v7.boxes === 0, v7);
    // فشل الحفظ ⇒ تراجع
    await give(p, 'bx5', 10, 'g');
    const v7b = await p.evaluate(() => { const s0 = JSON.stringify([CodisVouchers.counts(), data.inventory.boxes, data.vouchers.events.length]); codisSaveSuspended = 'fail'; const r = CodisVouchers.merge('bx5'); codisSaveSuspended = false; return { r:r.reason, same:s0 === JSON.stringify([CodisVouchers.counts(), data.inventory.boxes, data.vouchers.events.length]) }; });
    ok(T + 'save failure during merge ⇒ full rollback (vouchers kept, no box)', v7b.r === 'save' && v7b.same, v7b);
    // الواجهة: «بحوزتك» ← العناصر ← قسائم الصناديق
    await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1300);
    await p.evaluate(() => { econOpenVault(); }); await p.waitForTimeout(700); await p.evaluate(() => econOwnSetPart('items')); await p.waitForTimeout(500);
    const u1 = await p.evaluate(() => { const g = document.getElementById('own-vouchers'); if (!g) return { none:true };
      return { head:g.querySelector('.own-sub span').textContent, rows:[...g.querySelectorAll('.vch-mg')].map(r => ({ t:r.dataset.tier, n:r.querySelector('.vch-prog').textContent, btn:r.querySelector('.vch-merge').textContent, off:r.querySelector('.vch-merge').getAttribute('aria-disabled'), meter:!!r.querySelector('.vch-meter') })) }; });
    ok(T + 'own «قسائم الصناديق»: 5 tiers, count, meter, «دمج 10 قسائم» enabled only at 10', u1.head === 'قسائم الصناديق' && u1.rows.length === 5 && u1.rows.every(r => r.btn === 'دمج 10 قسائم' && r.meter) && u1.rows.find(r => r.t === 'bx5').off === 'false' && u1.rows.find(r => r.t === 'bx3').off === 'true', u1);
    await shot(p, tag + '_own_vouchers', '#own-vouchers');
    const u2 = await p.evaluate(() => { const s0 = JSON.stringify(CodisVouchers.counts()) + data.inventory.boxes.length; document.querySelector('#own-vouchers .vch-mg[data-tier="bx3"] .vch-merge').click(); return s0 === JSON.stringify(CodisVouchers.counts()) + data.inventory.boxes.length; });
    ok(T + 'UI: pressing merge with 5 does nothing', u2);
    const u3 = await p.evaluate(() => { window.codisVchMergeAt = 0; const b0 = CodisBoxes.owned('bx5').length; const b = document.querySelector('#own-vouchers .vch-mg[data-tier="bx5"] .vch-merge'); b.click(); b.click(); const b2 = document.querySelector('#own-vouchers .vch-mg[data-tier="bx5"] .vch-merge'); if (b2) b2.click();
      return { nb:CodisBoxes.owned('bx5').length - b0, have:CodisVouchers.count('bx5'), sheetOpen:document.getElementById('eco-own-sheet').classList.contains('is-open') }; });
    ok(T + 'UI: rapid double-press on merge ⇒ exactly one box', u3.nb === 1 && u3.have === 0 && u3.sheetOpen, u3);
    // V8 إعادة التحميل
    await give(p, 'bx2', 23, 'h'); await p.evaluate(() => CodisVouchers.merge('bx2'));
    const before = await p.evaluate(() => JSON.stringify([CodisVouchers.counts(), CodisBoxes.owned().map(b => b.uid).sort(), data.vouchers.events.length]));
    await o.boot(); await p.waitForTimeout(800);
    const after = await p.evaluate(() => JSON.stringify([CodisVouchers.counts(), CodisBoxes.owned().map(b => b.uid).sort(), data.vouchers.events.length]));
    ok(T + 'V8 reload after merge: box and remaining vouchers saved exactly', before === after && JSON.parse(after)[0].bx2 === 13, { before, after });
    // المزامنة: نفس الدمج على جهازين ⇒ صندوق واحد · الصندوق المفتوح لا يرجع مغلقاً
    const mg = await p.evaluate(() => { const base = JSON.parse(JSON.stringify(data)); base.vouchers = { v:1, events:[{ id:'vb|S0', t:'buy', tier:'bx1', n:10, at:'2026-11-15T10:00:00.000Z', day:'2026-11-15' }] }; base.inventory.boxes = [];
      const A = JSON.parse(JSON.stringify(base)), B = JSON.parse(JSON.stringify(base));
      const ev = at => ({ id:'vr|bx1|1', t:'redeem', tier:'bx1', n:-10, at }), bx = at => ({ uid:'box|vr|bx1|1', tier:'bx1', paid:0, currency:'VOUCHER', acquiredAt:at, status:'unopened', sourceRef:'vr|bx1|1' });
      A.vouchers.events.push(ev('2026-11-16T10:00:00.000Z')); A.inventory.boxes.push(Object.assign(bx('2026-11-16T10:00:00.000Z'), { status:'opened', openedAt:'2026-11-16T10:05:00.000Z' }));
      B.vouchers.events.push(ev('2026-11-16T11:00:00.000Z')); B.inventory.boxes.push(bx('2026-11-16T11:00:00.000Z'));
      const m1 = CodisMerge.merge(base, A, B, { localNewer:false }), m2 = CodisMerge.merge(base, B, A, { localNewer:true });
      const f = m => ({ redeems:m.vouchers.events.filter(e => e.t === 'redeem').length, boxes:m.inventory.boxes.filter(b => b.uid === 'box|vr|bx1|1').map(b => b.status), sum:m.vouchers.events.reduce((a, e) => a + e.n, 0) });
      return { a:f(m1), b:f(m2) }; });
    ok(T + 'sync: same merge on two devices ⇒ one redemption, one box; opened wins both ways', [mg.a, mg.b].every(x => x.redeems === 1 && x.boxes.length === 1 && x.boxes[0] === 'opened' && x.sum === 0), mg);

    // ================= الصناديق =================
    await zeroVouchers(p); await give(p, 'bx1', 10, 'k');
    await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1300);
    await p.evaluate(() => { econOpenVault(); }); await p.waitForTimeout(600); await p.evaluate(() => econOwnSetPart('items')); await p.waitForTimeout(400);
    await p.evaluate(() => { window.codisVchMergeAt = 0; document.querySelector('#own-vouchers .vch-mg[data-tier="bx1"] .vch-merge').click(); }); await p.waitForTimeout(500);
    await p.evaluate(() => econOwnSetPart('boxes')); await p.waitForTimeout(500);
    const b1 = await p.evaluate(() => { const g = document.getElementById('own-closed-boxes'); if (!g) return { none:true }; const t = g.querySelector('.own-bx[data-tier="bx1"]');
      return { head:g.querySelector('.own-sub span').textContent, tiles:g.querySelectorAll('.own-bx').length, name:t && t.querySelector('.shop-name').textContent, st:t && t.querySelector('.own-bx-st').textContent, src:t && t.querySelector('.own-bx-src').textContent, btn:t && t.querySelector('.own-bx-use').textContent, tab:document.getElementById('own-tab-boxes').textContent }; });
    ok(T + 'B1 merged bronze box shows in «بحوزتك» ← الصناديق المغلقة with type, count, state, «استخدام»', b1.head === 'الصناديق المغلقة' && b1.tiles === 1 && /برونزي/.test(b1.name) && /مغلق ×1/.test(b1.st) && /دمج القسائم/.test(b1.src) && b1.btn === 'استخدام', b1);
    await shot(p, tag + '_own_boxes', '#eco-own-sheet');
    const g0 = await p.evaluate(() => CodisWallet.gemBalance());
    await p.click('#own-closed-boxes .own-bx[data-tier="bx1"] .own-bx-use'); await p.waitForTimeout(900);
    const b2 = await p.evaluate(() => { const c = document.querySelector('#eco-boxes .bx-card[data-tier="bx1"]'); const m = document.getElementById('econ-box-modal');
      return { part:econStorePart, own:document.getElementById('eco-own-sheet').classList.contains('is-open'), picked:!!c && c.classList.contains('is-picked'), others:document.querySelectorAll('#eco-boxes .bx-card.is-picked').length, mine:c && c.querySelector('.bx-mine') ? c.querySelector('.bx-mine').textContent : '',
        modal:!!m && m.getAttribute('aria-hidden') === 'false', closed:CodisBoxes.owned('bx1').length, focus:document.activeElement && document.activeElement.className }; });
    ok(T + 'B2 «استخدام» ⇒ boxes section, bronze card selected, NOT opened (modal closed, box still closed)', b2.part === 'boxes' && !b2.own && b2.picked && b2.others === 1 && /×1/.test(b2.mine) && !b2.modal && b2.closed === 1, b2);
    ok(T + 'B2 the «فتح» button of the selected card gets focus', /bx-mine-open/.test(b2.focus || ''), b2.focus);
    await shot(p, tag + '_boxes_picked', '#eco-boxes .bx-card[data-tier="bx1"]');
    const uidA = await p.evaluate(() => CodisBoxes.owned('bx1')[0].uid);
    await p.click('#eco-boxes .bx-card[data-tier="bx1"] .bx-mine-open'); await p.waitForTimeout(400);
    const b3 = await p.evaluate(uid => ({ st:CodisBoxes.get(uid).status, closed:CodisBoxes.owned('bx1').length, gems:CodisWallet.gemBalance(), modal:document.getElementById('econ-box-modal').getAttribute('aria-hidden') === 'false' }), uidA);
    ok(T + 'B3 «فتح» opens it with the normal opening, consumed once, no gems charged', b3.st === 'opened' && b3.closed === 0 && b3.gems === g0 && b3.modal, { b3, g0 });
    await p.waitForTimeout(1600); await p.evaluate(() => econBoxClose()); await p.waitForTimeout(400);
    const b4 = await p.evaluate(uid => { const n0 = JSON.stringify([CodisInventory.owned().length, CodisPasses.owned().length, CodisPouches.owned().length, CodisHolidayCards.usable().length, CodisVouchers.total()]); const r = CodisBoxes.open(uid); econBoxOpenOwned('bx1');
      return { r:r.reason, same:n0 === JSON.stringify([CodisInventory.owned().length, CodisPasses.owned().length, CodisPouches.owned().length, CodisHolidayCards.usable().length, CodisVouchers.total()]), modal:document.getElementById('econ-box-modal').getAttribute('aria-hidden') === 'false' }; }, uidA);
    ok(T + 'B4 opening the same box again: refused, no second reward', b4.r === 'opened' && b4.same && !b4.modal, b4);
    // B5–B7 نافذة الخيارين
    await p.evaluate(() => { CodisWallet.transact([], () => { for (let k = 0; k < 2; k++) data.inventory.boxes.push({ uid:'box|qa|own' + k, tier:'bx2', paid:0, currency:'PROGRESS', acquiredAt:econNowIso(), status:'unopened', sourceRef:'qa' }); return { ok:true }; }); econRenderAll(); }); await p.waitForTimeout(600);
    await p.click('#eco-boxes .bx-card[data-tier="bx2"] .bx-buy'); await p.waitForTimeout(600);
    const c1 = await p.evaluate(() => { const m = document.getElementById('econ-pack-modal'), b = document.getElementById('econ-pack-body'); const t = CodisBoxes.tier('bx2');
      return { open:m.getAttribute('aria-hidden') === 'false', choice:m.querySelector('.pk-modal').classList.contains('is-choice'), opts:[...b.querySelectorAll('.bxc-t > b')].map(x => x.textContent), price:(b.querySelector('.bxc-opt.is-coin .bxc-v') || {}).textContent, gems:String(t.gems), own:(b.querySelector('.bxc-opt.is-own .bxc-v') || {}).textContent, note:!!b.querySelector('.bxc-note'), cfm:window.__cfm.length }; });
    ok(T + 'B5 owning a matching box + «شراء 1» ⇒ two-choice window (price, owned count, explanation)', c1.open && c1.choice && c1.opts[0] === 'الشراء بالعملة' && c1.opts[1] === 'استخدام صندوق موجود' && c1.price.indexOf(c1.gems) !== -1 && /×2/.test(c1.own) && c1.note && c1.cfm === 0, c1);
    await shot(p, tag + '_choice', '#econ-pack-modal .pk-modal');
    const fit = await p.evaluate(() => { const b = document.getElementById('econ-pack-body'); const br = b.getBoundingClientRect(); return { over:[...b.querySelectorAll('.bxc-opt, .bxc-hero')].filter(e => { const r = e.getBoundingClientRect(); return r.right > br.right + 1 || r.left < br.left - 1; }).length, hs:document.documentElement.scrollWidth > innerWidth + 1, cut:[...b.querySelectorAll('.bxc-t b, .bxc-t small')].filter(e => e.scrollWidth > e.clientWidth + 1).length }; });
    ok(T + 'choice window fits (no overflow, no clipped text)', !fit.over && !fit.hs && !fit.cut, fit);
    const gA = await p.evaluate(() => CodisWallet.gemBalance());
    await p.click('#econ-pack-body .bxc-opt.is-coin'); await p.waitForTimeout(700);
    const c2 = await p.evaluate(gA => ({ paid:gA - CodisWallet.gemBalance(), price:CodisBoxes.tier('bx2').gems, own:CodisBoxes.owned('bx2').length, cfm:window.__cfm.length, modal:document.getElementById('econ-box-modal').getAttribute('aria-hidden') === 'false', prices:CodisWallet.gemTxs().filter(t => t.type === 'PURCHASE_BOX').length }), gA);
    ok(T + 'B6 «الشراء بالعملة»: charges the price once (via the usual confirm), owned boxes untouched', c2.paid === c2.price && c2.own === 2 && c2.cfm === 1 && c2.modal, c2);
    await p.waitForTimeout(1600); await p.evaluate(() => econBoxClose()); await p.waitForTimeout(400);
    await p.click('#eco-boxes .bx-card[data-tier="bx2"] .bx-buy'); await p.waitForTimeout(600);
    const gB = await p.evaluate(() => CodisWallet.gemBalance());
    await p.click('#econ-pack-body .bxc-opt.is-own'); await p.waitForTimeout(500);
    const c3 = await p.evaluate(gB => ({ paid:gB - CodisWallet.gemBalance(), own:CodisBoxes.owned('bx2').length, opened:data.inventory.boxes.filter(b => /^box\|qa\|own/.test(b.uid) && b.status === 'opened').length, modal:document.getElementById('econ-box-modal').getAttribute('aria-hidden') === 'false' }), gB);
    ok(T + 'B7 «استخدام صندوق موجود»: no currency, exactly one owned box consumed and opened', c3.paid === 0 && c3.own === 1 && c3.opened === 1 && c3.modal, c3);
    await p.waitForTimeout(1600); await p.evaluate(() => econBoxClose()); await p.waitForTimeout(400);
    // B8 مستوى مختلف
    const c4 = await p.evaluate(async () => { window.__cfm = []; const g0 = CodisWallet.gemBalance(), own2 = CodisBoxes.owned('bx2').length; await econBuyBox('bx3'); await new Promise(r => setTimeout(r, 300));
      const choice = document.getElementById('econ-pack-modal').getAttribute('aria-hidden') === 'false'; const paid = g0 - CodisWallet.gemBalance(); econBoxClose(); econBoxOpenOwned('bx4');
      return { choice, cfm:window.__cfm.length, paid, price:CodisBoxes.tier('bx3').gems, own2After:CodisBoxes.owned('bx2').length, own2, modal4:document.getElementById('econ-box-modal').getAttribute('aria-hidden') === 'false' }; });
    ok(T + 'B8 owning only a silver box: bronze/crystal purchase has no «use existing» option, other tier untouched', !c4.choice && c4.cfm === 1 && c4.paid === c4.price && c4.own2After === c4.own2 && !c4.modal4, c4);
    await p.waitForTimeout(1600); await p.evaluate(() => { econBoxClose(); econCloseOwn(); econCloseStore({ silent:true }); }); await p.waitForTimeout(400);

    // ================= مكافآت التقدم =================
    const P0 = await p.evaluate(() => CodisProgress.defs().map(a => a.id));
    ok(T + 'existing achievements kept + 4 new ones added', ['first_week', 'ops_tasks_25', 'learn_items_25', 'habit_month_clean', 'build_week1', 'quit_week1', 'first_month'].every(id => P0.indexOf(id) !== -1) && P0.length === 7, P0);
    // السلبي أولاً: لا شيء جاهز
    const neg = await p.evaluate(() => {
      const t = todayKey(), K = n => dateKeyOffset(-n);
      const H = { id:'hq_H', text:'تدخين', type:'H', importance:'normal', createdAt:K(40), log:{}, occurrences:[{ date:K(12), daysBefore:28, punishment:'', coins:0 }], lastOccurrence:K(12), bestDays:28, monthlyMilestones:{} }; normalizeHabit(H, 'quit'); data.habits.quit.push(H);   // وقوع قبل 12 يوماً
      const E = { id:'hb_E', text:'رياضة', type:'E', importance:'normal', createdAt:K(20), log:{} }; normalizeHabit(E, 'build'); [0, 1, 2, 4, 5, 6].forEach(i => E.log[K(i)] = true); data.habits.build.push(E);   // فجوة
      const Q = { id:'hq_E', text:'سكر', type:'E', importance:'normal', createdAt:K(20), log:{}, abstain:true, failLog:{} }; normalizeHabit(Q, 'quit'); Q.abstain = true; [1, 2, 3, 4, 5, 6].forEach(i => Q.log[K(i)] = true); data.habits.quit.push(Q);   // 6 أيام
      const E2 = { id:'hb_E2', text:'قراءة', type:'E', importance:'normal', createdAt:K(14), log:{} }; normalizeHabit(E2, 'build'); data.habits.build.push(E2);   // مرّ أسبوعان بلا تسجيل
      data.outcomeLedger['monthly|2026-09'] = { id:'monthly|2026-09', room:'monthly', kind:'punish', scope:'monthly', tier:'fail', status:'pending', item:'x', at:econNowIso() };
      saveData(); CodisProgress.check({ quiet:true });
      return CodisProgress.list().filter(s => ['habit_month_clean', 'build_week1', 'quit_week1', 'first_month'].indexOf(s.def.id) !== -1).map(s => ({ id:s.def.id, st:s.status, v:s.shown + '/' + s.goal })); });
    ok(T + 'not met yet (lapse 12 days ago, gap in week, 6 clean days, 2 weeks passed without logs, failed month) ⇒ all «قيد التقدم»', neg.length === 4 && neg.every(s => s.st === 'progress'), neg);
    const s0 = await p.evaluate(() => ({ g:CodisWallet.gemBalance(), b:CodisBoxes.owned('bx1').length, pg:document.querySelector('#progress-root') ? 1 : 0 }));
    // تحقق الشروط
    const pos = await p.evaluate(() => {
      const K = n => dateKeyOffset(-n);
      const H = data.habits.quit.find(h => h.id === 'hq_H'); H.occurrences = []; H.lastOccurrence = null; H.createdAt = K(31); runHabitChecks();   // 32 يوماً بلا وقوع ⇒ محطة الـ30 بنظام العادات
      const E = data.habits.build.find(h => h.id === 'hb_E'); E.log[K(3)] = true;   // 7 متتالية
      const Q = data.habits.quit.find(h => h.id === 'hq_E'); Q.log[K(0)] = true;
      data.outcomeLedger['monthly|2026-10'] = { id:'monthly|2026-10', room:'monthly', kind:'neutral', scope:'monthly', tier:'success', status:'resolved', item:'', at:econNowIso() };
      saveData(); const opened = CodisProgress.check({ quiet:true }).map(a => a.id);
      return { opened, ms:Object.keys(H.monthlyMilestones).length, L:CodisProgress.list().map(s => ({ id:s.def.id, st:s.status })) }; });
    const stOf = id => (pos.L.find(x => x.id === id) || {}).st;
    ok(T + 'P1 event habit: 30 days without lapse ⇒ 30-gem reward READY only', stOf('habit_month_clean') === 'ready' && pos.ms >= 1, pos);
    ok(T + 'P2 first week of a daily «أكتسبها» habit ⇒ 5 gems READY', stOf('build_week1') === 'ready', pos.L);
    ok(T + 'P3 first week of a daily «أتخلص منها» habit (نجحت ×7) ⇒ 5 gems READY', stOf('quit_week1') === 'ready', pos.L);
    ok(T + 'P4 first successful month ⇒ 5 bronze boxes READY', stOf('first_month') === 'ready', pos.L);
    const s1 = await p.evaluate(() => ({ g:CodisWallet.gemBalance(), b:CodisBoxes.owned('bx1').length }));
    ok(T + 'P5 nothing granted before «استلام المكافأة» (gems, boxes unchanged)', s1.g === s0.g && s1.b === s0.b, { s0, s1 });
    // تراجع اليوم نفسه: «نجحت اليوم» ثم تراجع ⇒ يرجع قيد التقدم
    const rv = await p.evaluate(() => { const Q = data.habits.quit.find(h => h.id === 'hq_E'); toggleDailyHabit('hq_E'); return { st:CodisProgress.state(CodisProgress.def('quit_week1')).status, log:!!Q.log[todayKey()] }; });
    ok(T + 'undoing today\'s «نجحت» that completed the week ⇒ back to «قيد التقدم»', rv.st === 'progress' && !rv.log, rv);
    await p.evaluate(() => { toggleDailyHabit('hq_E'); }); await p.waitForTimeout(1300);
    ok(T + '«نجحت اليوم» again ⇒ ready again (real event hook)', await p.evaluate(() => CodisProgress.state(CodisProgress.def('quit_week1')).status === 'ready'));
    // الواجهة + الاستلام
    await p.evaluate(() => { showSettingsHome && showSettingsHome(); openSettingsCategory('progress'); }).catch(() => {}); await p.evaluate(() => { navigate && navigate('settings'); }).catch(() => {});
    await p.evaluate(() => { openSettingsCategory('progress'); codisProgressRender(); }); await p.waitForTimeout(600);
    const ui = await p.evaluate(() => [...document.querySelectorAll('#progress-root .pg-card')].map(c => ({ id:c.dataset.ach, name:c.querySelector('.pg-name').textContent, desc:!!c.querySelector('.pg-desc').textContent, st:c.querySelector('.pg-st').textContent, num:c.querySelector('.pg-num').textContent, rw:c.querySelector('.pg-rw-v').textContent, btn:!!c.querySelector('.pg-claim') })));
    const card = id => ui.find(c => c.id === id) || {};
    ok(T + 'progress page: each new card has name, description, reward value, progress and «جاهزة للاستلام» + button', ['habit_month_clean', 'build_week1', 'quit_week1', 'first_month'].every(id => card(id).desc && /جاهزة للاستلام/.test(card(id).st) && card(id).btn) && card('habit_month_clean').num === '30 / 30' && /30/.test(card('habit_month_clean').rw) && /5 × بكج برونزي/.test(card('first_month').rw), ui);
    await shot(p, tag + '_progress', '#settings-page-progress');
    const cl = await p.evaluate(() => { const g0 = CodisWallet.gemBalance(), b0 = CodisBoxes.owned('bx1').length; codisPgBusy = false;
      const b = document.querySelector('#progress-root .pg-card[data-ach="habit_month_clean"] .pg-claim'); b.click(); b.click();
      return { dg:CodisWallet.gemBalance() - g0, db:CodisBoxes.owned('bx1').length - b0, again:CodisProgress.claim('habit_month_clean').reason, tx:CodisWallet.gemTxs().filter(t => t.referenceId === 'progress|habit_month_clean').length }; });
    ok(T + 'P6 claim 30 gems via the button (double tap) ⇒ +30 once; second claim refused', cl.dg === 30 && cl.db === 0 && cl.again === 'claimed' && cl.tx === 1, cl);
    await p.waitForTimeout(1500);
    const cl2 = await p.evaluate(() => { const g0 = CodisWallet.gemBalance(), b0 = CodisBoxes.owned('bx1').length; const r = [CodisProgress.claim('build_week1'), CodisProgress.claim('quit_week1'), CodisProgress.claim('first_month')].map(x => x.ok);
      const again = ['build_week1', 'quit_week1', 'first_month'].map(id => CodisProgress.claim(id).reason);
      const nb = CodisBoxes.owned('bx1').filter(b => /^box\|prog\|first_month\|/.test(b.uid));
      return { r, again, dg:CodisWallet.gemBalance() - g0, db:CodisBoxes.owned('bx1').length - b0, prog:nb.length, st:nb.map(b => b.status + ':' + b.currency) }; });
    ok(T + 'P6 each reward claimed once: +5 +5 gems, 5 bronze boxes; repeats refused', cl2.r.every(Boolean) && cl2.again.every(x => x === 'claimed') && cl2.dg === 10 && cl2.db === 5 && cl2.prog === 5, cl2);
    ok(T + 'P7 the 5 bronze boxes are CLOSED in inventory (not opened automatically)', cl2.st.every(x => x === 'unopened:PROGRESS'), cl2.st);
    // فشل الحفظ عند الاستلام ⇒ لا شيء ويبقى جاهزاً
    const sf = await p.evaluate(() => { data.progress.claims = data.progress.claims.filter(c => c.id !== 'first_week'); data.progress.unlocked.push({ id:'first_week', at:econNowIso() }); const g0 = CodisWallet.gemBalance(); codisSaveSuspended = 'fail'; const r = CodisProgress.claim('first_week'); codisSaveSuspended = false;
      return { r:r.reason, dg:CodisWallet.gemBalance() - g0, st:CodisProgress.state(CodisProgress.def('first_week')).status }; });
    ok(T + 'save failure on claim ⇒ nothing granted, reward stays ready', sf.r === 'save' && sf.dg === 0 && sf.st === 'ready', sf);
    await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1200); await p.evaluate(() => { econOpenVault(); }); await p.waitForTimeout(600); await p.evaluate(() => econOwnSetPart('boxes')); await p.waitForTimeout(400);
    const own5 = await p.evaluate(() => { const t = document.querySelector('#own-closed-boxes .own-bx[data-tier="bx1"]'); return t ? { st:t.querySelector('.own-bx-st').textContent, src:t.querySelector('.own-bx-src').textContent } : { dbg:{ open:econOwnOpen, part:econOwnPart, owned:CodisBoxes.owned().map(b => b.tier), sec:!!document.getElementById('own-closed-boxes'), html:(document.getElementById('own-closed-boxes') || {}).outerHTML.slice(0, 700), nsec:document.querySelectorAll('#own-closed-boxes').length, page:econStorePart, sheet:!!document.getElementById('eco-own-sheet') } }; });
    ok(T + 'P7 five bronze boxes visible in «بحوزتك» ← الصناديق المغلقة', !!own5 && own5.st && /مغلق ×5/.test(own5.st) && /مكافآت التقدم/.test(own5.src), own5);
    // الاستمرار بعد إعادة التحميل
    const pb = await p.evaluate(() => JSON.stringify([data.progress.claims.map(c => c.id).sort(), CodisWallet.gemBalance(), CodisBoxes.owned().length]));
    await o.boot(); await p.waitForTimeout(6500);
    const pa = await p.evaluate(() => JSON.stringify([data.progress.claims.map(c => c.id).sort(), CodisWallet.gemBalance(), CodisBoxes.owned().length]));
    ok(T + 'claims, gems and closed boxes persist after reload (no re-grant at boot)', pb === pa, { pb, pa });
  } else {
    await zeroVouchers(p); await give(p, 'bx1', 12, 'vis'); await give(p, 'bx4', 3, 'vis2');
    await p.evaluate(() => { CodisWallet.transact([], () => { data.inventory.boxes.push({ uid:'box|qa|v1', tier:'bx5', paid:0, currency:'PROGRESS', acquiredAt:econNowIso(), status:'unopened', sourceRef:'qa' }); return { ok:true }; }); CodisVouchers.merge('bx1'); });
  }
  // ================= التخطيط بكل عرض =================
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1300); await p.evaluate(() => { econOpenVault(); }); await p.waitForTimeout(700);
  for (const part of ['items', 'boxes']) {
    await p.evaluate(pt => econOwnSetPart(pt), part); await p.waitForTimeout(500);
    const lay = await p.evaluate(pt => { const pan = document.getElementById('own-panel-' + pt), pr = pan.getBoundingClientRect(); const els = [...pan.querySelectorAll('.vch-mg, .own-bx')];
      return { n:els.length, over:els.filter(e => { const r = e.getBoundingClientRect(); return r.right > pr.right + 1 || r.left < pr.left - 1; }).length, hs:document.documentElement.scrollWidth > innerWidth + 1,
        cut:[...pan.querySelectorAll('.vch-merge span, .own-bx-use, .vch-name, .own-bx-st, .bx-mine-n')].filter(e => e.scrollWidth > e.clientWidth + 1).length,
        tap:[...pan.querySelectorAll('.vch-merge, .own-bx-use')].filter(b => b.getBoundingClientRect().height < 34).map(b => b.className + ':' + b.getBoundingClientRect().height + ':' + getComputedStyle(b).minHeight), ref:[...document.querySelectorAll('#eco-own-sheet .own-use:not(.own-bx-use)')].map(b => b.getBoundingClientRect().height).slice(0, 3) }; }, part);
    ok(T + 'layout «بحوزتك» ' + part + ': no overflow, no clipped text, tap targets ≥34px', lay.n > 0 && !lay.over && !lay.hs && !lay.cut && !lay.tap.length, lay);
    await shot(p, tag + '_lay_' + part, '#eco-own-sheet');
  }
  await p.evaluate(() => { econCloseOwn(); econStoreSetPart('boxes', { quiet:true, top:true }); }); await p.waitForTimeout(600);
  const bl = await p.evaluate(() => { const cards = [...document.querySelectorAll('#eco-boxes .bx-card')].filter(c => c.querySelector('.bx-mine')); return { n:cards.length, cut:cards.filter(c => { const n = c.querySelector('.bx-mine-n'), b = c.querySelector('.bx-mine-open'), cr = c.getBoundingClientRect(), br = b.getBoundingClientRect(); return br.right > cr.right + 1 || br.left < cr.left - 1 || b.scrollWidth > b.clientWidth + 1; }).length }; });
  ok(T + 'boxes section: owned row «لديك ×N + فتح» fits inside each card', bl.n > 0 && !bl.cut, bl);
  await shot(p, tag + '_boxes_mine', '#eco-boxes');
  ok(T + 'no JS errors', o.errs.length === 0, o.errs);
  await o.close();
}
srv.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
