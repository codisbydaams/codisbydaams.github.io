/* CODIS-V55 — كروت المتجر + «بحوزتك» بأقسام. WebKit حقيقي (محاكاة iPhone) افتراضياً؛ ENGINE=chrome لـChrome المثبّت.
   Run:  PW=<path to playwright-core/index.mjs> node tests/own_v55.mjs [app.html]
   يفحص: أربعة أعمدة وارتفاع موحّد وعدم قص الأزرار/الأسماء على 320–430 · رسالة «فاضي» ووصف النطاق · شريط «بحوزتك» (tablist، قسم واحد ظاهر،
   أعداد صحيحة، لوحة المفاتيح) · ذاكرة التمرير لكل قسم · بقاء القسم والتمرير والتحديد بعد بيع/تحديد/استخدام كيس/تجهيز/فتح بكج ·
   الوصول للبطاقات المنتهية فقط · استقلال حالة المتجر · القلب لا يغيّر الأبعاد · لا أخطاء صفحة. */
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = process.argv[2] || path.join(ROOT, 'app/CODIS_FINAL.html');
const { webkit, chromium, devices } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
const CHROME = process.env.ENGINE === 'chrome';
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = p === '/app/CODIS_FINAL.html' ? APP : path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':{ '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml', '.js':'text/javascript' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/app/CODIS_FINAL.html';
let pass = 0, fail = 0; const ok = (name, cond, info) => { (cond ? pass++ : fail++); console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !cond ? ' — ' + JSON.stringify(info).slice(0, 400) : '')); };
async function open(w, h = 844, theme = 'paper'){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v55t-'));
  const o = { ...devices['iPhone 12'], viewport:{ width:w, height:h }, screen:{ width:w, height:h } };
  const ctx = CHROME ? await chromium.launchPersistentContext(prof, { ...o, defaultBrowserType:undefined, executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true }) : await webkit.launchPersistentContext(prof, o);
  await ctx.addInitScript(() => { window.CODIS_B3D_OFF = true; });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); } await page.waitForTimeout(600); };
  await boot(); await page.evaluate(t => CodisTheme.set(t, true), theme);
  return { page, errs, boot, ctx, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const SEED = fx => { const now = Date.now(), iso = t => new Date(t).toISOString(), R = data.settings.rewardItems, inv = data.inventory;
  if (fx.only) R.forEach(r => { r.enabled = false; });
  (fx.rewards || []).forEach((r, i) => R.push(Object.assign({ id:'qa_r' + i, name:'مكافأة', rarity:'C', room:'daily', enabled:true, storePrice:null, coinValue:null, stickerId:null, weight:10, createdAt:'2026-01-01T00:00:00.000Z', updatedAt:'2026-01-01T00:00:00.000Z' }, r)));
  (fx.items || []).forEach((o, i) => { const r = econRarityById(o.rarity || 'C'); inv.items.push({ uid:'qa_i' + i, rewardId:null, stickerId:null, name:o.name, rarity:r.id, rarityName:r.name, rarityTone:r.tone, rarityOrder:r.order || 1, room:'tasks', source:'outcome', sourceRef:'qa' + i, scope:'daily', acquiredAt:iso(now - i * 60000), status:'owned', statusAt:iso(now), coinValue:o.coin === undefined ? 40 : o.coin, paid:null }); });
  (fx.passes || []).forEach((o, i) => CodisWallet.transact([], () => { CodisPasses.grant(Object.assign({ uid:'qa_p' + i, scope:'daily', severity:'MEDIUM', tier:'bx1', sourceRef:'qa' }, o)); return { ok:true }; }));
  if (!Array.isArray(inv.holidayCards)) inv.holidayCards = [];
  (fx.hc || []).forEach((o, i) => inv.holidayCards.push(Object.assign({ uid:'qa_h' + i, kind:'extra', status:'owned', acquiredAt:iso(now - 1000 * i), expiresAt:iso(now + 86400000 * 3), sourceRef:'qa' }, o)));
  if (!Array.isArray(inv.pouches)) inv.pouches = []; (fx.pouches || []).forEach((t, i) => inv.pouches.push({ uid:'qa_pc' + i, type:t, tier:'', sourceRef:'qa', acquiredAt:iso(now - i * 1000), status:'owned' }));
  (fx.cos || []).forEach(id => { CodisWallet.transact([], () => { const r = CodisCosmetics.grant({ id, source:'store', sourceRef:'qa' }); return { ok:!!r }; }); });
  if (!inv.boxes) inv.boxes = []; const T = econBoxTierIds(); (fx.boxes || []).forEach((ti, i) => inv.boxes.push({ uid:'qa_b' + i, tier:T[ti], status:'unopened', acquiredAt:iso(now - i * 1000), sourceRef:'qa' }));
  if (fx.balance !== undefined) data.wallet.balance = fx.balance; saveData(); return 1; };
const NAMES = [['C','مشي'], ['C','ساعة سوشل ميديا'], ['B','تطلب أكل تحبه من المطعم الذي تحبه كثيراً جداً'], ['B','Netflix'], ['A','iPhone 15 Pro Max 256GB Titanium'], ['A','فلم بالسينما IMAX 3D مع الأصدقاء'],
  ['S','عشاء'], ['S','رحلة إلى أربيل لمدة 3 أيام مع العائلة'], ['SS','PlayStation 5'], ['SS','مكافأة_طويلة—بدون/مسافات/كثيرة/جداً'], ['C','12345678901234567890'], ['B','قهوة ☕ + كيك 🍰']];
const STORE = { only:true, balance:300, rewards:NAMES.map(([r, n], i) => ({ rarity:r, name:n, room:['daily','weekly','monthly','master'][i % 4] })) };
const OWN = { balance:900, items:[{ name:'مشي' }, { name:'مشي' }, { name:'تطلب أكل تحبه من المطعم الذي تحبه كثيراً', rarity:'B' }, { name:'iPhone 15 Pro Max', rarity:'A', coin:900 }, { name:'عشاء', rarity:'S', coin:0 }, { name:'PlayStation 5', rarity:'SS', coin:2500 },
  ...Array.from({ length:12 }, (_, i) => ({ name:'مكافأة ' + (i + 1), rarity:'B' }))],
  passes:[{ scope:'daily', severity:'MEDIUM' }, { scope:'habit', severity:'HIGH' }], hc:[{ kind:'extra' }, { kind:'change', expiresAt:'' }, { kind:'extra', uid:'qa_hdead', status:'expired', expiresAt:new Date(Date.now() - 86400000).toISOString() }],
  pouches:[1, 1, 3], cos:['crocShades'], boxes:[0, 0, 2] };
const storeOpen = async (p, part = 'cards') => { await p.evaluate(() => econOpenStore()); await p.waitForTimeout(1400); await p.evaluate(x => econStoreSetPart(x, { quiet:true }), part); await p.waitForTimeout(600); };
const ownOpen = async p => { await p.evaluate(() => econOpenVault()); await p.waitForTimeout(1300); };
const OWNSTATE = () => { const sh = document.getElementById('eco-own-sheet'), st = document.getElementById('eco-own-stage');
  const tabs = [...sh.querySelectorAll('.own-tab')].map(b => ({ k:b.dataset.own, on:b.getAttribute('aria-selected') === 'true', n:(b.querySelector('.own-tab-n:not([hidden])') || {}).textContent || '', ti:b.tabIndex }));
  const vis = [...sh.querySelectorAll('.own-panel')].filter(p => p.offsetParent !== null).map(p => p.dataset.own);
  return { open:sh.classList.contains('is-open'), part:econOwnPart, tabs, vis, top:st.scrollTop, sel:Object.keys(econSelSet).length, selMode:econSelMode, storePart:econStorePart, storePos:JSON.stringify(econStoreScrollPos), T:econOwnTotals() }; };
const fmt = n => n.toLocaleString('en-US');   /* econFmt: أرقام لاتينية بفواصل (الخط يرسمها عربية) */

// ===== A: كروت المتجر على كل العروض =====
for (const theme of (process.env.SKIP_A ? [] : (process.env.THEMES || 'paper,dark').split(','))) for (const w of (process.env.WS || '320,344,360,375,390,402,430').split(',').map(Number)) {
  const o = await open(w, 844, theme); await o.page.evaluate(SEED, STORE); await o.boot(); await o.page.evaluate(t => CodisTheme.set(t, true), theme); await storeOpen(o.page);
  const m = await o.page.evaluate(async () => {
    const st = document.getElementById('eco-store-stage'); const pane = document.getElementById('pane-cards'); const out = { cols:[], h:new Set(), bad:[], rows:[] };
    for (let y = 0; y <= st.scrollHeight; y += 300) { st.scrollTop = y; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
    pane.querySelectorAll('.store-row').forEach(row => { const tops = {}; [...row.children].forEach(t => { const k = Math.round(t.getBoundingClientRect().top); tops[k] = (tops[k] || 0) + 1; }); out.cols.push(Math.max(...Object.values(tops))); out.rows.push(row.getAttribute('aria-label')); });
    const pr = pane.getBoundingClientRect();
    pane.querySelectorAll('.st-tile').forEach(t => { const r = t.getBoundingClientRect(), b = t.querySelector('.shop-buy, .hcd-buy'), n = t.querySelector('.shop-name'), br = b.getBoundingClientRect(), nr = n.getBoundingClientRect();
      out.h.add(Math.round(r.height));
      const inner = [...b.querySelectorAll('.sb-v, .sb-k, .eco-coin')].some(e => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > br.right + .5 || e.getBoundingClientRect().left < br.left - .5);
      if (b.scrollWidth > b.clientWidth + 1 || inner) out.bad.push(['btn-clip', n.textContent.slice(0, 18), b.textContent]);
      if (Math.round(br.height) !== 34) out.bad.push(['btn-h', br.height]);
      if (nr.bottom > br.top + .5) out.bad.push(['name-over-btn', n.textContent.slice(0, 18)]);
      if (r.left < pr.left - .5 || r.right > pr.right + .5) out.bad.push(['tile-out', n.textContent.slice(0, 18)]);
      const cap = t.querySelector('.st-cap'), cr = cap.getBoundingClientRect(); [...cap.children].forEach(c => { const q = c.getBoundingClientRect(); if (q.width && (q.left < r.left - .5 || q.right > r.right + .5)) out.bad.push(['cap-out', c.className]); });
      const fs = parseFloat(getComputedStyle(n).fontSize); if (fs < 10) out.bad.push(['name-font', fs]); });
    out.h = [...out.h]; out.ovx = document.documentElement.scrollWidth > innerWidth; return out; });
  ok(`A ${theme} ${w}: 4 columns per full line`, m.cols.every(c => c <= 4) && m.cols.some(c => c === 4), m.cols);
  ok(`A ${theme} ${w}: one tile height`, m.h.length === 1, m.h);
  ok(`A ${theme} ${w}: no clipped buttons/names/overflow`, !m.bad.length && !m.ovx, m.bad.slice(0, 4));
  if (w === 390 && theme === 'paper') {
    // القلب: الأبعاد ثابتة والجيران لا تتحرك
    const f = await o.page.evaluate(async () => { const t = document.querySelector('#pane-cards .st-tile'), nb = t.nextElementSibling, c = t.querySelector('.cflip'); const a = [t.getBoundingClientRect(), nb.getBoundingClientRect()].map(r => [r.width, r.height, r.top, r.left].map(Math.round).join());
      codisFlipToggle(c); await new Promise(r => setTimeout(r, 800)); const b = [t.getBoundingClientRect(), nb.getBoundingClientRect()].map(r => [r.width, r.height, r.top, r.left].map(Math.round).join());
      const bk = c.querySelector('.cflip-b').getBoundingClientRect(), fr = c.querySelector('.cflip-f').getBoundingClientRect(); codisFlipToggle(c); return { a, b, back:[Math.round(bk.width), Math.round(bk.height)], front:[Math.round(fr.width), Math.round(fr.height)], pressed:c.getAttribute('aria-pressed') }; });
    ok('A flip keeps tile + neighbour geometry, back = face box', f.a.join() === f.b.join() && f.back.join() === f.front.join(), f);
    const k = await o.page.evaluate(async () => { const c = document.querySelector('#pane-cards .st-tile .cflip'); c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', bubbles:true })); await new Promise(r => setTimeout(r, 300)); const on = c.classList.contains('is-flipped'); if (on) codisFlipToggle(c); return on; });
    ok('A flip by keyboard (Enter)', k);
    ok('A band labels', m.rows[0] === '0–300 كوين', m.rows);
    // سعر فوق الحد الأعلى للنطاقات ⇒ «فأكثر»
    const big = await o.page.evaluate(() => { const d = document.createElement('div'); d.innerHTML = econShopInnerHtml([{ p:60000, n:'x', hk:'extra' }]); return d.querySelector('.store-row').getAttribute('aria-label'); });
    ok('A last band over max says «فأكثر»', /فأكثر/.test(big), big);
    // بطاقات العطلة فقط ⇒ لا رسالة «فاضي» ؛ والعداد = المعروض
    const hc = await o.page.evaluate(() => { data.settings.rewardItems.forEach(r => { r.enabled = false; }); saveData(); econRenderStore(); const p = document.getElementById('pane-cards'); return { empty:!!p.querySelector('.st-empty'), tiles:p.querySelectorAll('.st-tile').length, n:(p.querySelector('.st-part-n') || {}).textContent, rail:(document.querySelector('.st-rail-b[data-part="cards"] .st-rail-n') || {}).textContent }; });
    ok('A holiday-only store: no «فاضي», counters = tiles', !hc.empty && hc.tiles === 2 && hc.n === fmt(2) && hc.rail === fmt(2), hc);
  }
  ok(`A ${theme} ${w}: no page errors`, !o.errs.length, o.errs.slice(0, 2));
  await o.close();
}

// ===== B: «بحوزتك» =====
if (!process.env.ONLY_A) 
{
  const o = await open(390); const p = o.page; await p.evaluate(SEED, OWN); await o.boot(); await storeOpen(p, 'boxes');
  const storeBefore = await p.evaluate(() => ({ part:econStorePart }));
  await ownOpen(p); let s = await p.evaluate(OWNSTATE);
  ok('B sheet opens on cards, one panel visible', s.open && s.part === 'cards' && s.vis.join() === 'cards', s);
  ok('B rail: 4 tabs in order, one selected, roving tabindex', s.tabs.map(t => t.k).join() === 'cards,pouches,cosmetics,boxes' && s.tabs.filter(t => t.on).length === 1 && s.tabs.filter(t => t.ti === 0).length === 1, s.tabs);
  ok('B counts: cards incl. expired shown, pouches/cos/boxes', s.T.cards === 18 + 2 + 2 + 1 && s.T.hcDead === 1 && s.tabs[0].n === fmt(s.T.cards) && s.tabs[1].n === fmt(3) && s.tabs[2].n === fmt(1) && s.tabs[3].n === fmt(3), { T:s.T, tabs:s.tabs });
  const a11y = await p.evaluate(() => { const r = document.querySelector('#eco-own-sheet .own-rail'), t = document.getElementById('own-tab-pouches'), pn = document.getElementById('own-panel-pouches');
    return { role:r.getAttribute('role'), orient:r.getAttribute('aria-orientation'), ctl:t.getAttribute('aria-controls'), lb:pn.getAttribute('aria-labelledby'), prole:pn.getAttribute('role'), label:t.textContent.includes('الأكياس'),
      sizes:[...document.querySelectorAll('#eco-own-sheet .own-tab')].map(b => { const q = b.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }) }; });
  ok('B ARIA tablist/tab/tabpanel wiring + visible text labels', a11y.role === 'tablist' && a11y.orient === 'vertical' && a11y.ctl === 'own-panel-pouches' && a11y.lb === 'own-tab-pouches' && a11y.prole === 'tabpanel' && a11y.label, a11y);
  ok('B tab targets ≥ 44×44', a11y.sizes.every(([w, h]) => w >= 44 && h >= 44), a11y.sizes);
  const geo = await p.evaluate(() => { const r = document.querySelector('#eco-own-sheet .own-rail').getBoundingClientRect(), b = document.querySelector('#eco-own-sheet .own-sheet-bar').getBoundingClientRect(), st = document.getElementById('eco-own-stage').getBoundingClientRect(); return { railRight:Math.round(r.right), vw:innerWidth, railTop:r.top, barBottom:b.bottom, stageLeft:st.left, railLeft:r.left, cols:getComputedStyle(document.querySelector('#own-panel-cards .shop-grid')).gridTemplateColumns.split(' ').length }; });
  ok('B rail on the right edge, under header, stage to its left', geo.railRight === geo.vw && geo.railTop >= geo.barBottom - 1 && geo.stageLeft < geo.railLeft, geo);
  ok('B inventory grid 3 columns at 390', geo.cols === 3, geo);
  const ob = await p.evaluate(() => { const bad = []; document.querySelectorAll('#own-panel-cards .st-tile').forEach(t => { const r = t.getBoundingClientRect(); t.querySelectorAll('.shop-acts .btn, .own-pick').forEach(b => { if (b.scrollWidth > b.clientWidth + 1) bad.push(['clip', b.textContent]); const q = b.getBoundingClientRect(); if (q.left < r.left - .5 || q.right > r.right + .5) bad.push(['out', b.textContent]); }); }); return bad; });
  ok('B inventory buttons not clipped/outside tiles', !ob.length, ob.slice(0, 4));
  // لوحة المفاتيح
  const kb = await p.evaluate(async () => { const t = document.getElementById('own-tab-cards'); t.focus(); const r = []; for (const k of ['ArrowDown', 'ArrowDown', 'End', 'Home', 'ArrowUp']) { t.closest('.own-rail').dispatchEvent(new KeyboardEvent('keydown', { key:k, bubbles:true, cancelable:true })); r.push(econOwnPart + ':' + (document.activeElement.dataset.own || '')); } return r; });
  ok('B keyboard: arrows/Home/End move selection + focus', kb.join() === 'pouches:pouches,cosmetics:cosmetics,boxes:boxes,cards:cards,boxes:boxes', kb);
  // ذاكرة التمرير لكل قسم
  await p.evaluate(() => econOwnSetPart('cards')); await p.waitForTimeout(300);
  await p.evaluate(() => { document.getElementById('eco-own-stage').scrollTop = 420; }); await p.waitForTimeout(250);
  await p.evaluate(() => econOwnSetPart('pouches')); await p.waitForTimeout(350); s = await p.evaluate(OWNSTATE);
  ok('B switch: pouches only, stage at its own top', s.vis.join() === 'pouches' && s.top === 0, s);
  await p.evaluate(() => econOwnSetPart('cards')); await p.waitForTimeout(350); s = await p.evaluate(OWNSTATE);
  ok('B back to cards restores its scroll', Math.abs(s.top - 420) <= 2, s.top);
  ok('B store state untouched by own navigation', s.storePart === storeBefore.part && s.storePart === 'boxes', s.storePart);
  // بيع كرت ⇒ القسم والتمرير باقيان والعداد ينقص
  await p.evaluate(() => { econSell('qa_i3'); }); await p.waitForTimeout(400); await p.evaluate(() => resolveCodisConfirm(true)); await p.waitForTimeout(900); s = await p.evaluate(OWNSTATE);
  ok('B sell: still cards, scroll kept, count updated', s.part === 'cards' && s.vis.join() === 'cards' && Math.abs(s.top - 420) <= 40 && s.tabs[0].n === fmt(s.T.cards) && s.T.cards === 22, { part:s.part, top:s.top, n:s.tabs[0].n, cards:s.T.cards });
  // تحديد متعدد ⇒ إعادة رسم ⇒ التحديد باقٍ وشريط البيع ظاهر داخل الشاشة
  await p.evaluate(() => econSelToggleMode()); await p.waitForTimeout(500);
  await p.evaluate(() => { econSelToggle('qa_i6'); econSelToggle('qa_i7'); econRenderStore(); }); await p.waitForTimeout(500); s = await p.evaluate(OWNSTATE);
  const bar = await p.evaluate(() => { const b = document.querySelector('#own-panel-cards .own-bar'); if (!b) return null; const r = b.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, vh:innerHeight, n:b.querySelector('.own-bar-n').textContent }; });
  ok('B selection survives re-render, bulk bar visible on screen', s.selMode && s.sel === 2 && bar && bar.bottom <= bar.vh && bar.top > 0 && bar.n === fmt(2), { s:s.sel, bar });
  await p.evaluate(() => { econSellSelected(); }); await p.waitForTimeout(400); await p.evaluate(() => resolveCodisConfirm(true)); await p.waitForTimeout(1000); s = await p.evaluate(OWNSTATE);
  ok('B bulk sell: still cards, counts updated', s.part === 'cards' && s.T.cards === 20 && s.tabs[0].n === fmt(20), { part:s.part, cards:s.T.cards });
  await p.evaluate(() => { if (econSelMode) econSelToggleMode(); }); await p.waitForTimeout(300);
  // كيس فضة ⇒ يبقى بالأكياس
  await p.evaluate(() => econOwnSetPart('pouches')); await p.waitForTimeout(300);
  const silver0 = await p.evaluate(() => CodisWallet.silverBalance());
  await p.evaluate(() => { econPouchUse(3); }); await p.waitForTimeout(600);
  await p.evaluate(() => { try { dqSkip(); } catch (e) {} }); await p.waitForTimeout(600); await p.evaluate(() => { try { dqClose(); } catch (e) {} }); await p.waitForTimeout(900);
  s = await p.evaluate(OWNSTATE); const silver1 = await p.evaluate(() => CodisWallet.silverBalance());
  ok('B pouch use: stays on pouches, count 3→2, silver up', s.part === 'pouches' && s.vis.join() === 'pouches' && s.T.pouches === 2 && s.tabs[1].n === fmt(2) && silver1 > silver0, { part:s.part, T:s.T.pouches, silver0, silver1 });
  // مظهر ⇒ تجهيز/إزالة
  await p.evaluate(() => econOwnSetPart('cosmetics')); await p.waitForTimeout(300);
  await p.evaluate(() => econCosToggle('crocShades')); await p.waitForTimeout(700);
  let eq = await p.evaluate(() => CodisCosmetics.isEquipped('crocShades')); s = await p.evaluate(OWNSTATE);
  ok('B equip cosmetic: stays on cosmetics', eq && s.part === 'cosmetics' && s.vis.join() === 'cosmetics', { eq, part:s.part });
  await p.evaluate(() => econCosToggle('crocShades')); await p.waitForTimeout(700); eq = await p.evaluate(() => CodisCosmetics.isEquipped('crocShades'));
  ok('B unequip cosmetic', !eq);
  // بكج ⇒ النافذة فوق الورقة ثم الرجوع لنفس القسم
  await p.evaluate(() => econOwnSetPart('boxes')); await p.waitForTimeout(300);
  const items0 = await p.evaluate(() => CodisInventory.owned().length + CodisPasses.owned().length + CodisHolidayCards.all().length + CodisPouches.owned().length + CodisCosmetics.owned().length);
  await p.evaluate(() => econOwnOpenBox(econBoxTierIds()[0])); await p.waitForTimeout(800);
  const over = await p.evaluate(() => { const m = document.getElementById('econ-box-modal'), r = m.getBoundingClientRect(), el = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return { open:m.getAttribute('aria-hidden') === 'false', top:!!el && m.contains(el) }; });
  ok('B box modal opens above the sheet', over.open && over.top, over);
  await p.evaluate(() => econBoxDo()); await p.waitForTimeout(6500);
  await p.evaluate(() => econBoxClose()); await p.waitForTimeout(900); s = await p.evaluate(OWNSTATE);
  const items1 = await p.evaluate(() => CodisInventory.owned().length + CodisPasses.owned().length + CodisHolidayCards.all().length + CodisPouches.owned().length + CodisCosmetics.owned().length);
  const foc = await p.evaluate(() => !!document.activeElement && !!document.activeElement.closest('#eco-own-sheet'));
  ok('B after box close: sheet open on boxes, count 3→2, prize added, focus inside sheet', s.open && s.part === 'boxes' && s.T.boxes === 2 && s.tabs[3].n === fmt(2) && items1 === items0 + 1 && foc, { open:s.open, part:s.part, boxes:s.T.boxes, items0, items1, foc });
  // إغلاق وفتح الورقة ⇒ نفس القسم
  await p.evaluate(() => econCloseOwn()); await p.waitForTimeout(500); await ownOpen(p); s = await p.evaluate(OWNSTATE);
  ok('B reopen keeps last section', s.part === 'boxes' && s.vis.join() === 'boxes', s.part);
  // قسم يفرغ ⇒ حالة فارغة والشريط كامل
  await p.evaluate(() => { data.inventory.pouches.forEach(x => { x.status = 'used'; }); saveData(); econRenderStore(); econOwnSetPart('pouches'); }); await p.waitForTimeout(400); s = await p.evaluate(OWNSTATE);
  const emp = await p.evaluate(() => !!document.querySelector('#own-panel-pouches .own-empty') && document.querySelectorAll('#eco-own-sheet .own-tab').length);
  ok('B emptied section: empty state, badge hidden, all 4 tabs kept', s.part === 'pouches' && emp === 4 && s.tabs[1].n === '', { emp, tabs:s.tabs });
  ok('B no page errors', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}
// ===== C: بطاقات عطلة منتهية فقط ⇒ «بحوزتك» متاحة =====
{
  const o = await open(375); const p = o.page;
  await p.evaluate(SEED, { hc:[{ kind:'extra', uid:'qa_hd1', status:'expired', expiresAt:new Date(Date.now() - 86400000).toISOString() }] }); await o.boot(); await storeOpen(p);
  const T = await p.evaluate(() => econOwnTotals()); await ownOpen(p); const s = await p.evaluate(OWNSTATE);
  const tile = await p.evaluate(() => { const t = document.querySelector('#own-panel-cards .st-tile.is-dead'); return t ? { dism:!!t.querySelector('.own-dism'), use:!!t.querySelector('.hcd-use') } : null; });
  ok('C expired-only: not usable (hc=0), counted separately, sheet opens, dismantle offered', T.hc === 0 && T.hcDead === 1 && T.total === 1 && s.open && s.part === 'cards' && tile && tile.dism && !tile.use, { T, open:s.open, tile });
  ok('C no page errors', !o.errs.length, o.errs.slice(0, 2));
  await o.close();
}
// ===== D: كل قسم وحده ⇒ يفتح عليه =====
for (const [k, fx] of [['pouches', { pouches:[2] }], ['cosmetics', { cos:['crocShades'] }], ['boxes', { boxes:[1] }], ['cards', { passes:[{ scope:'daily', severity:'LOW' }] }]]) {
  const o = await open(360); const p = o.page; await p.evaluate(SEED, fx); await o.boot(); await storeOpen(p); await ownOpen(p); const s = await p.evaluate(OWNSTATE);
  ok('D only ' + k + ': opens on it, others empty', s.open && s.part === k && s.tabs.filter(t => t.n).map(t => t.k).join() === k, s.tabs);
  await o.close();
}
srv.close();
console.log(`\n${pass} passed, ${fail} failed (engine: ${CHROME ? 'chrome' : 'webkit'})`); process.exit(fail ? 1 : 0);
