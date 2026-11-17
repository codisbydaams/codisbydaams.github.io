/* CODIS-V63 — الاختبارات الإلزامية: «بحوزتك» (الصناديق داخل العناصر، القسائم المملوكة فقط، بلا عناوين) · الهويتان (صندوق/قسيمة) · المتجر (لا صف صناديق، أيقونة الجواهر، نافذة الخيارين)
   · الصندوق المجاني (جائزة واحدة) · مكافآت التقدم بالمراحل (استلام يدوي) · الاستقرار (إعادة التحميل، أخطاء console).
   WebKit حقيقي (محاكاة iPhone). Run:  PW=<path to playwright-core/index.mjs> node tests/v63_browser.mjs [app.html]
   RUNS="paper:375,dark:320" (الافتراضي؛ المنطق الكامل بالأول، التخطيط واللقطات بالكل) · SHOTS=<dir> للقطات. الاختبار وحده يمنح الجواهر/الفضة بمعاملة ADMIN_GRANT صريحة. */
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
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v63t-'));
  const opts = { ...devices['iPhone 12'], viewport:{ width:w, height:740 }, screen:{ width:w, height:740 } };
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
const give = (p, tier, n, tag) => p.evaluate(([tier, n, tag]) => CodisWallet.transact([], () => { for (let k = 0; k < n; k++) if (!CodisVouchers.grantInTx({ id:'vx|' + tag + '|' + k, t:'box', tier, n:1 })) return { ok:false }; return { ok:true }; }), [tier, n, tag]);
const boxes = (p, tier, n, tag) => p.evaluate(([tier, n, tag]) => CodisWallet.transact([], () => { for (let k = 0; k < n; k++) data.inventory.boxes.push({ uid:'box|qa|' + tag + '|' + k, tier, paid:0, currency:'PROGRESS', acquiredAt:econNowIso(), status:'unopened', sourceRef:'qa' }); return { ok:true }; }), [tier, n, tag]);
const reset = p => p.evaluate(() => { data.vouchers.events = []; data.inventory.boxes = []; saveData(); });
const storeOwnItems = async p => { await p.evaluate(() => { try { econCloseOwn(); econCloseStore({ silent:true }); } catch (e) {} }); await p.waitForTimeout(300); await p.evaluate(() => econOpenStore()); await p.waitForTimeout(1300); await p.evaluate(() => { econOwnPart = 'items'; econOpenVault(); }); await p.waitForTimeout(1200); await p.evaluate(() => econOwnSetPart('items')); await p.waitForTimeout(400); };
const storeBoxes = async p => { await p.evaluate(() => { try { econCloseOwn(); econCloseStore({ silent:true }); } catch (e) {} }); await p.waitForTimeout(300); await p.evaluate(() => econOpenStore()); await p.waitForTimeout(1300); await p.evaluate(() => econStoreSetPart('boxes', { quiet:true, top:true })); await p.waitForTimeout(500); };
const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

const RUNS = (process.env.RUNS || 'paper:375,dark:320').split(',').map(x => x.split(':'));
for (let ri = 0; ri < RUNS.length; ri++) {
  const [theme, w] = RUNS[ri], T = theme + ' ' + w + ': ', tag = theme + w, full = ri === 0;
  const o = await open(+w, theme); const p = o.page;
  await grant(p, 'gems', 20000); await grant(p, 'silver', 3000);

  // ================= (1) «بحوزتك» =================
  await reset(p); await give(p, 'bx1', 3, 'a');
  await storeOwnItems(p); await p.waitForTimeout(1200); await Promise.race([p.waitForTimeout(4000), p.evaluate(() => Promise.all(document.getAnimations().filter(a => { const t = a.effect && a.effect.getComputedTiming(); return t && isFinite(t.endTime); }).map(a => a.finished.catch(() => {})))).catch(() => {})]);
  const a1 = await p.evaluate(() => ({ boxTab:!!document.getElementById('own-tab-boxes'), tabs:[...document.querySelectorAll('.own-tab')].map(t => t.dataset.own), tiers:[...document.querySelectorAll('#own-vouchers .vch-mg')].map(r => r.dataset.tier), zero:document.querySelectorAll('.is-zero').length,
    heads:document.querySelectorAll('#own-panel-items .own-sub, #own-panel-items .own-sub-x, #own-panel-items .own-sub-n').length, op:[...document.querySelectorAll('#own-vouchers .vch-mg')].map(r => getComputedStyle(r).opacity + '|' + getComputedStyle(r).filter) }));
  ok(T + 'A1 no «الصناديق» tab in «بحوزتك» (cards/items/cosmetics only)', !a1.boxTab && a1.tabs.join() === 'cards,items,cosmetics', a1);
  ok(T + 'A2 only bronze vouchers owned ⇒ only the bronze tile, nothing faded', a1.tiers.join() === 'bx1' && !a1.zero && a1.op.every(x => x === '1|none'), a1);
  ok(T + 'A3 items section has no group titles, counts or explanations', a1.heads === 0, a1);
  await give(p, 'bx3', 2, 'b'); await storeOwnItems(p);
  const a4 = await p.evaluate(() => [...document.querySelectorAll('#own-vouchers .vch-mg')].map(r => r.dataset.tier));
  ok(T + 'A4 bronze + crystal owned ⇒ exactly those two tiers', a4.join() === 'bx1,bx3', a4);
  await give(p, 'bx1', 7, 'c'); await p.evaluate(() => { window.codisVchMergeAt = 0; document.querySelector('#own-vouchers .vch-mg[data-tier="bx1"] .vch-merge').click(); }); await p.waitForTimeout(600);
  const a5 = await p.evaluate(() => { const T = econOwnTotals(), tab = document.querySelector('#own-tab-items .own-tab-n');
    return { tiers:[...document.querySelectorAll('#own-vouchers .vch-mg')].map(r => r.dataset.tier), bx1:CodisVouchers.count('bx1'), first:(document.querySelector('#own-panel-items .own-kinds > .own-part') || {}).id, tiles:[...document.querySelectorAll('#own-boxes .own-bx')].map(t => t.dataset.tier + ':' + t.querySelector('.own-bx-n').textContent + ':' + !!t.querySelector('.obx-art .bxa') + ':' + t.querySelector('.own-bx-use').textContent),
      el:T.elements, tab:tab && tab.textContent, total:T.total, sum:T.cards + T.elements + T.cosmetics + T.themes, title:(document.querySelector('.own-title-n') || {}).textContent, boxes:T.boxes, v:CodisVouchers.total() }; });
  ok(T + 'A5 all bronze vouchers consumed by merge ⇒ bronze tile disappears', a5.tiers.join() === 'bx3' && a5.bx1 === 0, a5);
  ok(T + 'A6 merged closed box shows inside «العناصر» first, with ×count and «استخدام»', a5.first === 'own-boxes' && a5.tiles.length === 1 && a5.tiles[0] === 'bx1:×1:true:استخدام', a5);
  ok(T + 'A7 counter includes the box exactly once (elements = vouchers + boxes, tab badge, total)', a5.el === a5.v + a5.boxes && +a5.tab === a5.el && a5.total === a5.sum && +a5.title === a5.total, a5);
  await shot(p, tag + '_own_items', '#eco-own-sheet');

  // ================= (2) الهويتان =================
  const id1 = await p.evaluate(() => { const box = document.createElement('div'); box.id = 'qa-gal'; box.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;padding:12px;background:var(--bg);display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:start';
    box.innerHTML = CodisBoxes.tiers().map(t => '<div class="qa-c">' + econVoucherArt(t.id) + '</div><div class="qa-c">' + econOwnedBoxArt(t.id) + '</div>').join('') + '<div>' + CodisBoxes.tiers().map(t => econVoucherArt(t.id, { mini:true }) + ' ' + econOwnedBoxArt(t.id, { mini:true })).join(' ') + '</div>';
    (document.getElementById('eco-store-body') || document.body).appendChild(box);
    const v = [...box.querySelectorAll('.vch-art')], b = [...box.querySelectorAll('.obx-art')];
    const vt = v.slice(0, 5).map(e => getComputedStyle(e).getPropertyValue('--vt').trim()), bt = b.slice(0, 5).map(e => getComputedStyle(e).getPropertyValue('--vt').trim());
    return { vBox:v.some(e => e.querySelector('.bxa, img, .obx-box')), bBox:b.every(e => !!e.querySelector('.bxa-img')), vt:new Set(vt).size, bt:new Set(bt).size, notch:v.every(e => !!e.querySelector('.vc-stub') && !!e.querySelector('.vc-star')),
      pips:v.slice(0, 5).map(e => e.querySelectorAll('.vc-pip.on').length).join(), mini:[...box.querySelectorAll('.is-mini')].map(e => { const r = e.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }).slice(0, 2), vh:Math.round(v[0].getBoundingClientRect().height) }; });
  ok(T + 'I1 voucher art contains no box at all; owned box art carries the box image', !id1.vBox && id1.bBox, id1);
  ok(T + 'I2 five distinct colours for each identity + level pips 1..5 on vouchers', id1.vt === 5 && id1.bt === 5 && id1.pips === '1,2,3,4,5' && id1.notch, id1);
  ok(T + 'I3 mini icons render at icon size (≈31×20) and full arts have height', id1.mini[0] === '31x20' && id1.mini[1] === '32x20' && id1.vh > 40, id1);
  await shot(p, tag + '_identities', '#qa-gal'); await p.evaluate(() => document.getElementById('qa-gal').remove());

  // ================= (3) المتجر =================
  await storeBoxes(p);
  const s1 = await p.evaluate(() => ({ own:document.querySelectorAll('#eco-boxes .bx-own, #eco-boxes .bx-own-chip, #eco-boxes .bx-tag, #eco-boxes .bx-mine, .bx-mine-open').length, title:document.getElementById('bx-h').textContent, icon:document.querySelectorAll('.eco-gem-line .eco-bx-own').length, iconTxt:(document.querySelector('.eco-gem-line .eco-bx-own') || {}).textContent, art:!!document.querySelector('.eco-gem-line .eco-bx-own .obx-art.is-mini .bxa') }));
  ok(T + 'S1 no owned-box strip, no «N مغلق» tag, no «لديك ×1 – فتح» row', s1.own === 0 && s1.title === 'البكجات', s1);
  ok(T + 'S2 one box ⇒ one icon beside the gems, no number, new box art', s1.icon === 1 && s1.iconTxt === '' && s1.art, s1);
  await shot(p, tag + '_balance', '.eco-balance');
  await boxes(p, 'bx2', 9, 'ten'); await p.evaluate(() => econRenderAll()); await p.waitForTimeout(500);
  const s2 = await p.evaluate(() => ({ n:CodisBoxes.owned().length, icon:document.querySelectorAll('.eco-gem-line .eco-bx-own').length, digits:/\d/.test(document.querySelector('.eco-gem-line .eco-bx-own').textContent), tone:document.querySelector('.eco-gem-line .eco-bx-own .obx-art').dataset.tone }));
  ok(T + 'S3 ten boxes ⇒ still a single icon, no ×10 (highest tier shown)', s2.n === 10 && s2.icon === 1 && !s2.digits && s2.tone === 'b', s2);
  if (full) {
    await p.click('.eco-gem-line .eco-bx-own'); await p.waitForTimeout(1300);
    const s3 = await p.evaluate(() => ({ open:econOwnOpen, part:econOwnPart, first:(document.querySelector('#own-panel-items .own-kinds > .own-part') || {}).id }));
    ok(T + 'S4 tapping the icon opens «بحوزتك» ← العناصر (boxes first)', s3.open && s3.part === 'items' && s3.first === 'own-boxes', s3);
    // «استخدام» من «بحوزتك» ⇒ البكجات + تحديد + نافذة الخيارين (بلا فتح)
    const g0 = await p.evaluate(() => CodisWallet.gemBalance());
    await p.click('#own-boxes .own-bx[data-tier="bx2"] .own-bx-use'); await p.waitForTimeout(1300);
    const u1 = await p.evaluate(g0 => { const m = document.getElementById('econ-pack-modal'); return { part:econStorePart, own:econOwnOpen, picked:[...document.querySelectorAll('#eco-boxes .bx-card.is-picked')].map(c => c.dataset.tier), choice:m.getAttribute('aria-hidden') === 'false' && m.querySelector('.pk-modal').classList.contains('is-choice'),
      opts:document.querySelectorAll('#econ-pack-body .bxc-opt').length, boxOpen:document.getElementById('econ-box-modal').getAttribute('aria-hidden') === 'false', owned:CodisBoxes.owned('bx2').length, gems:CodisWallet.gemBalance() - g0 }; }, g0);
    ok(T + 'U1 «استخدام» ⇒ packs section, tier selected, two-choice window, nothing opened or charged', u1.part === 'boxes' && !u1.own && u1.picked.join() === 'bx2' && u1.choice && u1.opts === 2 && !u1.boxOpen && u1.owned === 9 && u1.gems === 0, u1);
    await shot(p, tag + '_choice', '#econ-pack-modal .pk-modal');
    await p.click('#econ-pack-body .bxc-opt.is-own'); await p.waitForTimeout(500);
    const u2 = await p.evaluate(g0 => ({ owned:CodisBoxes.owned('bx2').length, gems:CodisWallet.gemBalance() - g0, open:document.getElementById('econ-box-modal').getAttribute('aria-hidden') === 'false' }), g0);
    ok(T + 'U2 «استخدام صندوق موجود» ⇒ exactly one box consumed, no gems, original opening', u2.owned === 8 && u2.gems === 0 && u2.open, u2);
    await p.waitForTimeout(1500); await p.evaluate(() => econBoxClose()); await p.waitForTimeout(400);
    const g1 = await p.evaluate(() => CodisWallet.gemBalance());
    await p.click('#eco-boxes .bx-card[data-tier="bx2"] .bx-buy'); await p.waitForTimeout(600);
    await p.click('#econ-pack-body .bxc-opt.is-coin'); await p.waitForTimeout(700);
    const u3 = await p.evaluate(g1 => ({ paid:g1 - CodisWallet.gemBalance(), price:CodisBoxes.tier('bx2').gems, owned:CodisBoxes.owned('bx2').length }), g1);
    ok(T + 'U3 «الشراء بالعملة» ⇒ price charged once, owned boxes untouched', u3.paid === u3.price && u3.owned === 8, u3);
    await p.waitForTimeout(1500); await p.evaluate(() => econBoxClose()); await p.waitForTimeout(300);
    const u4 = await p.evaluate(async () => { window.__cfm = []; const g = CodisWallet.gemBalance(), o2 = CodisBoxes.owned('bx2').length; await econBuyBox('bx4'); await new Promise(r => setTimeout(r, 300));
      const choice = document.getElementById('econ-pack-modal').getAttribute('aria-hidden') === 'false'; const paid = g - CodisWallet.gemBalance(); econBoxClose(); econBoxOpenOwned('bx4');
      return { choice, cfm:window.__cfm.length, paid, price:CodisBoxes.tier('bx4').gems, o2:CodisBoxes.owned('bx2').length - o2, open4:document.getElementById('econ-box-modal').getAttribute('aria-hidden') === 'false' }; });
    ok(T + 'U4 other tier: no «use existing» option, silver box untouched, using a gold box you don\'t own is impossible', !u4.choice && u4.cfm === 1 && u4.paid === u4.price && u4.o2 === 0 && !u4.open4, u4);
    await p.waitForTimeout(1500); await p.evaluate(() => econBoxClose()); await p.waitForTimeout(300);
    const u5 = await p.evaluate(() => { const b = CodisBoxes.owned('bx2')[0].uid; const r1 = CodisBoxes.open(b); const r2 = CodisBoxes.open(b); return { a:r1.ok, b:r2.reason }; });
    ok(T + 'U5 no double opening of the same box', u5.a && u5.b === 'opened', u5);
    await reset(p); await p.evaluate(() => econRenderAll()); await p.waitForTimeout(400);
    ok(T + 'S5 no closed boxes ⇒ icon disappears', await p.evaluate(() => document.querySelectorAll('.eco-gem-line .eco-bx-own').length === 0));
  }

  // ================= (4) الصندوق المجاني =================
  if (full) {
    const f0 = await p.evaluate(() => { data.settings.rewardItems = data.settings.rewardItems.filter(x => !x.freebox); const r = codisFinCreateReward({ name:'جلسة قهوة طويلة الاسم مع الأصدقاء في المقهى القديم', kind:'time', minutes:10, cardId:'free_box' }); saveData(); return { ok:r.ok, pool:CodisFreeBox.pool().length }; });
    ok(T + 'F0 test free-box card created', f0.ok && f0.pool === 1, f0);
    // توزيع الفئات + لا أكثر من جائزة
    const fz = await p.evaluate(() => { const st = { card:0, gems:0, silver:0 }, bad = []; const old = '2020-01-01T00:00:00.000Z';
      let it = 0; const clear = () => { it++; data.economyState.freeBox = { at:new Date(Date.UTC(2020, 0, 1) + it * 1000).toISOString(), n:it }; [data.wallet.gems.transactions, data.wallet.silver.transactions].forEach(L => L.forEach(t => { if (t.type === 'FREEBOX_GRANT') t.createdAt = old; })); data.inventory.items.forEach(x => { if (x.source === 'free') x.acquiredAt = old; }); };
      for (let i = 0; i < 240; i++) { clear(); const g = CodisWallet.gemBalance(), s = CodisWallet.silverBalance(), inv = CodisInventory.owned().length; const r = CodisFreeBox.claim(); if (!r.ok) { bad.push(r.reason); continue; }
        const dg = CodisWallet.gemBalance() - g, ds = CodisWallet.silverBalance() - s, di = CodisInventory.owned().length - inv; st[r.type]++;
        const one = (r.type === 'card' && di === 1 && !dg && !ds) || (r.type === 'gems' && dg >= 1 && dg <= 10 && dg === r.n && !ds && !di) || (r.type === 'silver' && ds >= 1 && ds <= 20 && ds === r.n && !dg && !di); if (!one) bad.push({ t:r.type, dg, ds, di }); }
      return { st, bad:bad.slice(0, 5), nb:bad.length }; });
    ok(T + 'F1 240 claims: every claim grants exactly ONE prize in range (card ×1 · gems 1–10 · silver 1–20)', fz.nb === 0, fz);
    ok(T + 'F2 the three categories are equally likely (each 50–110 of 240)', ['card', 'gems', 'silver'].every(k => fz.st[k] >= 50 && fz.st[k] <= 110), fz.st);
    const fe = await p.evaluate(() => { const items = data.settings.rewardItems.filter(x => x.freebox); data.settings.rewardItems = data.settings.rewardItems.filter(x => !x.freebox); const st = { card:0, gems:0, silver:0 }; const old = '2020-01-01T00:00:00.000Z'; let readyAll = true;
      for (let i = 0; i < 60; i++) { data.economyState.freeBox = { at:new Date(Date.UTC(2020, 5, 1) + i * 1000).toISOString(), n:1000 + i }; [data.wallet.gems.transactions, data.wallet.silver.transactions].forEach(L => L.forEach(t => { if (t.type === 'FREEBOX_GRANT') t.createdAt = old; })); data.inventory.items.forEach(x => { if (x.source === 'free') x.acquiredAt = old; });
        if (!CodisFreeBox.status().ready) readyAll = false; const r = CodisFreeBox.claim(); if (r.ok) st[r.type]++; }
      data.settings.rewardItems = data.settings.rewardItems.concat(items); saveData(); return { st, readyAll, empty:CodisFreeBox.status().empty }; });
    ok(T + 'F3 no eligible cards ⇒ box still usable, only gems/silver', fe.readyAll && fe.st.card === 0 && fe.st.gems + fe.st.silver === 60 && fe.st.gems > 10 && fe.st.silver > 10 && fe.empty === false, fe);
    const fw = await p.evaluate(() => { const r1 = CodisFreeBox.claim(); const r2 = CodisFreeBox.claim(); return { r1:r1.ok, r2:r2.reason, wait:CodisFreeBox.status().waitMs > 23 * 3600e3 || !r1.ok }; });
    ok(T + 'F4 24h cooldown: second claim refused', fw.r2 === 'wait' && fw.wait, fw);
    const fx = await p.evaluate(() => { const old = new Date(CodisClock.now() - 25 * 3600e3).toISOString(); data.economyState.freeBox.at = old; [data.wallet.gems.transactions, data.wallet.silver.transactions].forEach(L => L.forEach(t => { if (t.type === 'FREEBOX_GRANT') t.createdAt = old; })); data.inventory.items.forEach(x => { if (x.source === 'free') x.acquiredAt = old; }); return CodisFreeBox.status().ready; });
    ok(T + 'F5 after 24h the box is available again', fx);
    const fs1 = await p.evaluate(() => { const s0 = JSON.stringify([data.economyState.freeBox, CodisWallet.gemBalance(), CodisWallet.silverBalance(), CodisInventory.owned().length]); codisSaveSuspended = 'fail'; const r = CodisFreeBox.claim(); codisSaveSuspended = false;
      return { r:r.reason, same:s0 === JSON.stringify([data.economyState.freeBox, CodisWallet.gemBalance(), CodisWallet.silverBalance(), CodisInventory.owned().length]), ready:CodisFreeBox.status().ready }; });
    ok(T + 'F6 save failure ⇒ nothing granted, claim not recorded, still available', fs1.r === 'save' && fs1.same && fs1.ready, fs1);
    // تزامن جهازين (حساب مسجّل): نفس الحالة ⇒ نفس الجائزة بنفس المرجع ⇒ الدمج يعطي جائزة واحدة
    const sync = await p.evaluate(() => { const S = CodisAccount.state; let u0; try { u0 = S.user; S.user = { id:'qa-user-1' }; } catch (e) { return { skip:'state not writable' }; } if (!(S.user && S.user.id === 'qa-user-1')) return { skip:'state not writable' };
      const snap = JSON.parse(JSON.stringify(data)); const res = [];
      for (let k = 0; k < 2; k++) { const r = CodisFreeBox.claim(); res.push(r.ok ? r.type + ':' + (r.n || (r.item && r.item.id)) : r.reason); res.push(JSON.parse(JSON.stringify(data))); if (k === 0) { Object.keys(snap).forEach(key => { data[key] = JSON.parse(JSON.stringify(snap[key])); }); } }
      const A = res[1], B = res[3]; const m = CodisMerge.merge(snap, A, B, { localNewer:false });
      const cnt = d => (d.wallet.gems.transactions.filter(t => t.type === 'FREEBOX_GRANT').length + d.wallet.silver.transactions.filter(t => t.type === 'FREEBOX_GRANT').length + d.inventory.items.filter(x => x.source === 'free').length);
      try { S.user = u0; } catch (e) {} Object.keys(A).forEach(key => { data[key] = A[key]; }); saveData();
      return { a:res[0], b:res[2], before:cnt(snap), merged:cnt(m) }; });
    ok(T + 'F7 two devices, same state (signed-in) ⇒ same single prize; merge keeps ONE grant', sync.skip ? false : (sync.a === sync.b && sync.merged === sync.before + 1), sync);
    // الواجهة: ثلاث نتائج — لوحة مقروءة بلا قص
    for (const kind of ['card', 'gems', 'silver']) {
      await p.evaluate(kind => { const old = '2020-01-01T00:00:00.000Z'; data.economyState.freeBox.at = old; [data.wallet.gems.transactions, data.wallet.silver.transactions].forEach(L => L.forEach(t => { if (t.type === 'FREEBOX_GRANT') t.createdAt = old; })); data.inventory.items.forEach(x => { if (x.source === 'free') x.acquiredAt = old; });
        const rows = CodisFreeBox.pool().length; const ix = { card:0, gems:1, silver:2 }[kind]; const orig = window.codisRandInt; window.__ri = orig;
        codisRandInt = (a, b) => (a === 0 && b === (rows ? 2 : 1)) ? ix : (a === 1 && b === 10 ? 7 : a === 1 && b === 20 ? 13 : orig(a, b)); saveData(); }, kind);
      await storeBoxes(p); await p.waitForTimeout(300);
      const before = await p.evaluate(() => ({ g:CodisWallet.gemBalance(), s:CodisWallet.silverBalance(), n:data.economyState.freeBox.n }));
      await p.evaluate(() => { codisFreeBoxOpen(); codisFreeBoxOpen(); }); await p.waitForTimeout(1900);
      const fu = await p.evaluate(([kind, before]) => { codisRandInt = window.__ri; const v = document.getElementById('fb-rev'); if (!v || v.hidden) return { none:true }; const cs = getComputedStyle(v), r = v.getBoundingClientRect();
        const txt = [...v.querySelectorAll('.fb-kick, .fb-name, .fb-pz-n, .fb-pz-l, .fb-note, .fb-val em')].map(e => ({ c:getComputedStyle(e).color, cut:e.scrollWidth > e.clientWidth + 1 }));
        return { kind:[...v.querySelector('.fb-prize').classList].join(' '), bg:cs.backgroundColor, txt, inV:r.left >= -1 && r.right <= innerWidth + 1, hs:document.documentElement.scrollWidth > innerWidth + 1,
          card:v.querySelectorAll('.fb-cardwrap').length, gems:v.querySelectorAll('.eco-gem, .fb-prize.is-gems').length, silver:v.querySelectorAll('.fb-prize.is-silver').length, num:(v.querySelector('.fb-pz-n') || {}).textContent, bal:v.querySelectorAll('.fb-bal, .fb-bonus').length,
          dg:CodisWallet.gemBalance() - before.g, ds:CodisWallet.silverBalance() - before.s, claims:data.economyState.freeBox.n - before.n }; }, [kind, before]);
      const minC = fu.txt ? Math.min(...fu.txt.map(t => contrast(t.c, fu.bg))) : 0;
      const shows = kind === 'card' ? fu.card === 1 && !fu.num && fu.dg === 0 && fu.ds === 0 : kind === 'gems' ? fu.card === 0 && fu.num === '+7' && fu.dg === 7 && fu.ds === 0 && /is-gems/.test(fu.kind) : fu.card === 0 && fu.num === '+13' && fu.ds === 13 && fu.dg === 0 && /is-silver/.test(fu.kind);
      ok(T + 'F8 ' + kind + ' result: shows only that prize, one claim despite double tap', !fu.none && shows && fu.bal === 0 && fu.claims === 1, fu);
      ok(T + 'F9 ' + kind + ' result readable: contrast ≥4.5, nothing clipped, inside the screen', minC >= 4.5 && fu.txt.every(t => !t.cut) && fu.inV && !fu.hs, { minC, fu });
      await shot(p, tag + '_freebox_' + kind, '#fb-ov');
      await p.evaluate(() => codisFreeBoxClose()); await p.waitForTimeout(300);
    }
    const fcard = await p.evaluate(() => { const old = '2020-01-01T00:00:00.000Z'; data.economyState.freeBox.at = old; [data.wallet.gems.transactions, data.wallet.silver.transactions].forEach(L => L.forEach(t => { if (t.type === 'FREEBOX_GRANT') t.createdAt = old; })); data.inventory.items.forEach(x => { if (x.source === 'free') x.acquiredAt = old; }); return codisFreeBoxStoreHtml(); });
    ok(T + 'F10 store card text says one random prize', /جائزة واحدة عشوائية/.test(fcard) && !/جواهر وفضة/.test(fcard));
  }

  // ================= (5) مكافآت التقدم =================
  if (full) {
    const ids = await p.evaluate(() => CodisProgress.defs().map(a => a.id + ':' + a.goal + ':' + a.rewards.map(r => r.type + (r.tier || '') + r.n).join('+')));
    const want = ['first_week:1:gems10', 'weeks_3:3:gems50', 'weeks_10:10:gems500', 'ops_tasks_25:25:gems10', 'ops_tasks_75:75:gems50', 'ops_tasks_250:250:gems500', 'learn_items_25:25:gems10', 'learn_items_75:75:gems50', 'learn_items_250:250:gems500',
      'days_1:1:vouchersbx15', 'days_3:3:vouchersbx110', 'days_20:20:boxesbx15', 'habit_month_clean:30:gems30', 'build_week1:7:gems5', 'quit_week1:7:gems5', 'first_month:1:boxesbx15'];
    ok(T + 'P0 all stages defined with the requested goals/rewards; old achievements unchanged', want.every(x => ids.indexOf(x) !== -1) && ids.length === 16, ids);
    // مستخدم قديم استلم «أول أسبوع ناجح» بـ5
    await reset(p);
    const leg = await p.evaluate(() => { CodisWallet.transact([], () => { CodisWallet.applyGems('PROGRESS_REWARD', 5, 'مكافأة تقدم: أول أسبوع ناجح', 'progress', 'progress|first_week', { ach:'first_week' }); data.progress.claims.push({ id:'first_week', at:econNowIso() }); return { ok:true }; });
      const g = CodisWallet.gemBalance(); const r = CodisProgress.claim('first_week'); return { r:r.reason, st:CodisProgress.state(CodisProgress.def('first_week')).status, g:CodisWallet.gemBalance() - g }; });
    ok(T + 'P1 legacy «first week» claimed at 5 stays claimed — no difference, no re-grant', leg.r === 'claimed' && leg.st === 'claimed' && leg.g === 0, leg);
    // الأسابيع الناجحة: 3 (+ ملغى + غير ناجح)
    const wk = await p.evaluate(() => { const L = data.outcomeLedger; for (let i = 1; i <= 3; i++) L['weekly|qa' + i] = { id:'weekly|qa' + i, room:'weekly', kind:'reward', scope:'weekly', status:'resolved', item:'x', at:econNowIso() };
      L['weekly|qaV'] = { id:'weekly|qaV', room:'weekly', kind:'reward', scope:'weekly', status:'void', item:'x', at:econNowIso() }; L['weekly|qaP'] = { id:'weekly|qaP', room:'weekly', kind:'punish', scope:'weekly', status:'resolved', item:'x', at:econNowIso() };
      saveData(); const g = CodisWallet.gemBalance(); CodisProgress.check({ quiet:true }); const st = id => CodisProgress.state(CodisProgress.def(id)).status;
      return { w:codisProgressWeeklyWins(), w3:st('weeks_3'), w10:st('weeks_10'), g:CodisWallet.gemBalance() - g }; });
    ok(T + 'P2 3 successful weeks (void/failed ignored) ⇒ «3 أسابيع» READY, 10 not, nothing granted yet', wk.w === 3 && wk.w3 === 'ready' && wk.w10 === 'progress' && wk.g === 0, wk);
    const c3 = await p.evaluate(() => { const g = CodisWallet.gemBalance(); const a = CodisProgress.claim('weeks_3'), b = CodisProgress.claim('weeks_3'); return { a:a.ok, b:b.reason, g:CodisWallet.gemBalance() - g }; });
    ok(T + 'P3 manual claim ⇒ +50 gems once, second claim refused', c3.a && c3.b === 'claimed' && c3.g === 50, c3);
    const c10 = await p.evaluate(() => { const L = data.outcomeLedger; for (let i = 4; i <= 10; i++) L['weekly|qa' + i] = { id:'weekly|qa' + i, room:'weekly', kind:'reward', scope:'weekly', status:'resolved', item:'x', at:econNowIso() }; saveData(); CodisProgress.check({ quiet:true });
      const g = CodisWallet.gemBalance(); const r = CodisProgress.claim('weeks_10'); return { r:r.ok, g:CodisWallet.gemBalance() - g }; });
    ok(T + 'P4 10 successful weeks ⇒ +500 gems on claim', c10.r && c10.g === 500, c10);
    // المهام/التعلّم/الأيام (أرشيف + جاري، عطلة، يوم فارغ، جزئي، نسخة مكررة)
    const mk = await p.evaluate(() => { const T = (pfx, n, st) => Array.from({ length:n }, (_, k) => ({ id:pfx + '_' + k, text:'t', status:st || 'done' }));
      const tw = { holidayDay:6, days:{ 0:T('o0', 25), 1:T('o1', 1).concat(T('o1p', 1, 'partial')), 2:[], 3:[], 4:[], 5:[], 6:T('oh', 5) } }, lw = { holidayDay:6, days:{ 0:T('l0', 25), 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] } };
      const e = { id:'arc_qa1', name:'qa', weekId:'2020-01-05', status:'completed', cause:'completed', tasksWeek:tw, learnWeek:lw };
      data.archive.unshift(e, JSON.parse(JSON.stringify(e))); saveData(); const g = CodisWallet.gemBalance(); CodisProgress.check({ quiet:true }); const st = id => CodisProgress.state(CodisProgress.def(id)).status;
      return { ops:codisProgressDoneCount('tasks'), learn:codisProgressDoneCount('learn'), days:codisProgressDaysDone(), o25:st('ops_tasks_25'), o75:st('ops_tasks_75'), l25:st('learn_items_25'), d1:st('days_1'), d3:st('days_3'), g:CodisWallet.gemBalance() - g, v:CodisVouchers.total() }; });
    ok(T + 'P5 ops = 26 (holiday & partial excluded, duplicate archive ignored), learn = 25 separate', mk.ops === 26 && mk.learn === 25, mk);
    ok(T + 'P6 complete days = 2 (ops day + teacher day; empty/holiday/partial days ignored, duplicate ignored)', mk.days === 2, mk);
    ok(T + 'P7 stages open independently: ops25/learn25/days1 READY, ops75/days3 not; nothing granted', mk.o25 === 'ready' && mk.l25 === 'ready' && mk.d1 === 'ready' && mk.o75 === 'progress' && mk.d3 === 'progress' && mk.g === 0 && mk.v === 0, mk);
    const mk2 = await p.evaluate(() => { const T = (pfx, n) => Array.from({ length:n }, (_, k) => ({ id:pfx + '_' + k, text:'t', status:'done' }));
      const days = {}; for (let d = 0; d < 7; d++) days[d] = T('w2d' + d, d < 3 ? 17 : 1); const e = { id:'arc_qa2', name:'qa2', weekId:'2020-01-12', status:'completed', tasksWeek:{ holidayDay:-1, days }, learnWeek:null };
      const days3 = {}; for (let d = 0; d < 7; d++) days3[d] = T('w3d' + d, 1); const e3 = { id:'arc_qa3', name:'qa3', weekId:'2020-01-19', status:'stopped', tasksWeek:{ holidayDay:-1, days:days3 }, learnWeek:{ holidayDay:-1, days:Object.fromEntries([0, 1, 2, 3].map(d => [d, T('w3l' + d, 1)])) } };
      data.archive.unshift(e, e3); saveData(); CodisProgress.check({ quiet:true }); const st = id => CodisProgress.state(CodisProgress.def(id)).status;
      return { ops:codisProgressDoneCount('tasks'), days:codisProgressDaysDone(), o75:st('ops_tasks_75'), d3:st('days_3'), d20:st('days_20') }; });
    ok(T + 'P8 more history ⇒ ops 75 READY, 3 days READY, 20 days READY (20 = 2 + 7 + 7 + 4)', mk2.ops >= 75 && mk2.days === 20 && mk2.o75 === 'ready' && mk2.d3 === 'ready' && mk2.d20 === 'ready', mk2);
    const cl = await p.evaluate(() => { const b0 = CodisBoxes.owned('bx1').length; const r1 = CodisProgress.claim('days_1'), r2 = CodisProgress.claim('days_3'); const v = CodisVouchers.count('bx1'), b1 = CodisBoxes.owned('bx1').length;
      const r3 = CodisProgress.claim('days_20'); const bs = CodisBoxes.owned('bx1'); return { r:[r1.ok, r2.ok, r3.ok], v, auto:b1 - b0, boxes:bs.length - b0, st:bs.every(b => b.status === 'unopened'), again:CodisProgress.claim('days_1').reason }; });
    ok(T + 'P9 days rewards: 5 + 10 bronze vouchers (15, NOT auto-merged), then 5 closed bronze boxes', cl.r.every(Boolean) && cl.v === 15 && cl.auto === 0 && cl.boxes === 5 && cl.st && cl.again === 'claimed', cl);
    // تراجع اليوم نفسه عن «خلصتها» في يوم جارٍ ⇒ لا يبقى «جاهز»
    const und = await p.evaluate(() => { const st = id => CodisProgress.state(CodisProgress.def(id)).status; const u = data.progress.unlocked.find(x => x.id === 'learn_items_75'); return { l75:st('learn_items_75'), has:!!u }; });
    ok(T + 'P10 learn 75 still «قيد التقدم» (rooms not mixed)', und.l75 === 'progress' && !und.has, und);
    // الواجهة: العرض البصري الموحّد
    await p.evaluate(() => { try { econCloseOwn(); econCloseStore({ silent:true }); } catch (e) {} document.querySelector('.navbtn[data-page="settings"]').click(); }); await p.waitForTimeout(700);
    await p.evaluate(() => { openSettingsCategory('progress'); codisProgressRender(); }); await p.waitForTimeout(700);
    const ui = await p.evaluate(() => { const card = id => document.querySelector('#progress-root .pg-card[data-ach="' + id + '"]'), rw = id => card(id).querySelector('.pg-rw-v');
      return { d1:{ ico:!!rw('days_1').querySelector('.vch-art.is-mini'), txt:rw('days_1').textContent.trim(), aria:rw('days_1').querySelector('[role="img"]').getAttribute('aria-label') },
        d20:{ ico:!!rw('days_20').querySelector('.obx-art.is-mini .bxa'), txt:rw('days_20').textContent.trim() }, fm:{ ico:!!rw('first_month').querySelector('.obx-art.is-mini'), txt:rw('first_month').textContent.trim() },
        gem:!!rw('weeks_10').querySelector('.eco-gem'), legacy:rw('first_week').textContent.trim(), ready:[...document.querySelectorAll('#progress-root .pg-claim')].map(b => b.closest('.pg-card').dataset.ach),
        words:/قسيمة|قسائم|صناديق|بكج/.test([...document.querySelectorAll('#progress-root .pg-rw-v')].map(e => e.textContent).join(' ')), h:[...document.querySelectorAll('#progress-root .pg-rw-v .is-mini')].map(e => Math.round(e.getBoundingClientRect().height)) }; });
    ok(T + 'P11 rewards drawn as icon + number (voucher/box per level), names only for screen readers', ui.d1.ico && ui.d1.txt === '5' && /قسيمة برونزية/.test(ui.d1.aria) && ui.d20.ico && ui.d20.txt === '5' && ui.fm.ico && ui.fm.txt === '5' && ui.gem && !ui.words, ui);
    ok(T + 'P12 claimed legacy «first week» shows what was actually received (5); icons ≈ gem height', ui.legacy === '5' && ui.h.every(h => h >= 16 && h <= 22), ui);
    ok(T + 'P13 READY rewards show «استلام المكافأة» buttons (manual claim only)', ['ops_tasks_25', 'ops_tasks_75', 'learn_items_25'].every(id => ui.ready.indexOf(id) !== -1) && ui.ready.indexOf('days_1') === -1, ui.ready);
    await shot(p, tag + '_progress', '#settings-page-progress');
    // إعادة التحميل: لا تكرار
    const before = await p.evaluate(() => JSON.stringify([CodisWallet.gemBalance(), CodisVouchers.counts(), CodisBoxes.owned().length, data.progress.claims.map(c => c.id).sort()]));
    await o.boot(); await p.waitForTimeout(6500);
    const after = await p.evaluate(() => JSON.stringify([CodisWallet.gemBalance(), CodisVouchers.counts(), CodisBoxes.owned().length, data.progress.claims.map(c => c.id).sort()]));
    ok(T + 'R1 reload: nothing re-granted, claims/vouchers/boxes identical', before === after, { before, after });
    await storeOwnItems(p);
    const r2 = await p.evaluate(() => ({ boxes:[...document.querySelectorAll('#own-boxes .own-bx')].map(t => t.dataset.tier + t.querySelector('.own-bx-n').textContent), vch:[...document.querySelectorAll('#own-vouchers .vch-mg')].map(r => r.dataset.tier) }));
    ok(T + 'R2 progress vouchers and closed boxes appear in «العناصر»', r2.boxes.join() === 'bx1×5' && r2.vch.join() === 'bx1', r2);
  }

  // ================= تخطيط (كل العروض) =================
  await reset(p); await give(p, 'bx2', 4, 'L'); await give(p, 'bx5', 12, 'L2'); await boxes(p, 'bx3', 2, 'L3'); await boxes(p, 'bx5', 1, 'L4');
  await storeOwnItems(p);
  const lay = await p.evaluate(() => { const st = document.getElementById('eco-own-stage'), r0 = st.getBoundingClientRect(); const over = [...st.querySelectorAll('.own-bx, .vch-mg, .own-bx-n, .vch-merge, .own-bx-use')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < r0.left - 1 || r.right > r0.right + 1); }).map(e => e.className);
    const cut = [...st.querySelectorAll('.shop-name, .vch-name, .vch-prog, .own-bx-use, .vch-merge, .vch-merge span')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
    return { over, cut, hs:document.documentElement.scrollWidth > innerWidth + 1, sep:getComputedStyle(document.querySelector('#own-vouchers')).borderTopWidth }; });
  ok(T + 'L1 items layout: nothing overflows or is clipped; groups separated by a hairline only', !lay.over.length && !lay.cut.length && !lay.hs && lay.sep === '1px', lay);
  await shot(p, tag + '_own_items_full', '#eco-own-sheet');
  await storeBoxes(p); await shot(p, tag + '_store_boxes', '#eco-store-body');
  ok(T + 'no JS errors', !o.errs.length, o.errs.slice(0, 5));
  await o.close();
}
srv.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
