/* CODIS-V68 — تغطية النيزك · مشاهد المعاينة · تجربة التفاعل · «؟» · المسافات. WebKit حقيقي (محاكاة iPhone 12).
   Run:  PW=<path to playwright-core/index.mjs> node tests/v68_browser.mjs [app.html]   RUNS="paper:375,dark:320,paper:1280" · SHOTS=<dir>.
   لمس الإصبع داخل المعاينة يُحاكى بـPointerEvent(pointerType:touch) مُرسَل (Playwright WebKit لا يولّد Pointer Events من اللمس) — محاكاة. الماوس حقيقي. */
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
let pass = 0, fail = 0; const ok = (n, c, info) => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + n + (!c && info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 1400) : '')); };
async function open(w, theme, opts = {}){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v68t-'));
  const ctx = await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'], viewport:{ width:w, height:w > 700 ? 900 : 780 }, screen:{ width:w, height:w > 700 ? 900 : 780 }, reducedMotion:opts.reduced ? 'reduce' : 'no-preference', hasTouch:true, isMobile:w < 700 });
  await ctx.addInitScript(() => { window.CODIS_B3D_OFF = true;
    window.__lc = 0; const A = EventTarget.prototype.addEventListener, R = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(){ if (this === document || this === window) window.__lc++; return A.apply(this, arguments); };
    EventTarget.prototype.removeEventListener = function(){ if (this === document || this === window) window.__lc--; return R.apply(this, arguments); }; });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); }
    await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t), theme === 'dark' ? 'dark' : 'paper').catch(() => {}); await page.waitForTimeout(300);
    await page.evaluate(() => { CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {}; }); };
  await boot();
  return { page, errs, boot, until, ctx, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const shot = async (p, name, sel) => { if (!SHOTS) return; try { if (sel) { const el = await p.$(sel); if (el) { await el.screenshot({ path:path.join(SHOTS, name + '.png') }); return; } } await p.screenshot({ path:path.join(SHOTS, name + '.png') }); } catch (e) { console.log('shot ' + name + ': ' + e.message); } };
const grant = (p, n) => p.evaluate(n => CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', n, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; }), n);
const IDS = { planning:'blazingMeteorPlanning', operations:'blazingMeteorOperations', teacher:'blazingMeteorTeacher', discipline:'blazingMeteorDiscipline' };
const PG = { planning:['planning', '#page-planning'], operations:['tasks', '#page-tasks'], teacher:['learn', '#page-learn'], discipline:['habits', '#page-habits'] };
const ptr = (p, sel, type, kind, fx = .5, fy = .5, id = 7) => p.evaluate(([sel, type, kind, fx, fy, id]) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(), x = r.left + r.width * fx, y = r.top + r.height * fy;
  const t = document.elementFromPoint(x, y) || el; t.dispatchEvent(new PointerEvent(type, { bubbles:true, cancelable:true, composed:true, pointerId:id, pointerType:kind, isPrimary:true, clientX:x, clientY:y, buttons:type === 'pointerup' ? 0 : 1 })); return { x, y }; }, [sel, type, kind, fx, fy, id]);
async function seedLong(p){ await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const L = n => Array.from({ length:n }, (_, i) => 'مهمة رقم ' + (i + 1) + ' لمراجعة العمل').join('\n');
  document.querySelector('.navbtn[data-page="planning"]').click(); await sleep(400); try { startNewPlan(); } catch (e) {} await sleep(300);
  const ti = document.getElementById('plan-tasks-input'); ti.value = L(26); ti.dispatchEvent(new Event('input', { bubbles:true }));
  const li = document.getElementById('plan-learn-input'); li.value = L(26); li.dispatchEvent(new Event('input', { bubbles:true })); distributePlan(); await sleep(900);
  const t = document.getElementById('new-habit-text'); for (const x of ['قراءة', 'رياضة', 'مشي', 'ماء', 'نوم مبكر', 'تأمل']) { t.value = x; addHabit(); } }); }
const cover = (p, tg) => p.evaluate(([pg, sel, id]) => new Promise(res => { document.querySelector('.navbtn[data-page="' + pg + '"]').click(); setTimeout(() => {
  CodisPlanThemes.equip(id, 'own'); codisPlanThemeApply(); setTimeout(() => { const m = document.querySelector('.main'), r = document.querySelector(sel), dc = r.querySelector(':scope > .bm-decor'); m.scrollTop = m.scrollHeight;
  setTimeout(() => { const dr = dc ? dc.getBoundingClientRect() : { bottom:0, top:0 }, mr = m.getBoundingClientRect(); let last = 0;
    r.querySelectorAll('*').forEach(e => { if (e.closest('.bm-decor, .disc-add:not(.is-open)') || !e.getClientRects().length) return; if (getComputedStyle(e).visibility === 'hidden') return; const b = e.getBoundingClientRect(); if (b.height && b.bottom > last) last = b.bottom; });
    res({ dc:!!dc, decorBottom:Math.round(dr.bottom), vh:innerHeight, mainBottom:Math.round(mr.bottom), last:Math.round(Math.min(last, mr.bottom)), extra:m.scrollHeight - m.clientHeight, rootH:Math.round(r.getBoundingClientRect().height) }); }, 350); }, 350); }, 600); }), [PG[tg][0], PG[tg][1], IDS[tg]]);

const RUNS = (process.env.RUNS || 'paper:375,dark:320,paper:1280').split(',').map(x => x.split(':'));
for (let ri = 0; ri < RUNS.length; ri++) {
  const [theme, w] = RUNS[ri], T = theme + ' ' + w + ': ', tag = theme + w, full = ri === 0;
  const o = await open(+w, theme); const p = o.page;
  await grant(p, 200000);
  await p.evaluate(() => CodisPlanThemes.defs().forEach(d => CodisPlanThemes.buy(d.id)));
  // ===== (1) تغطية النيزك =====
  for (const tg of Object.keys(IDS)) {
    const c = await cover(p, tg);
    ok(T + 'M1 ' + tg + ' short content: meteor layer reaches the screen bottom (no gap) and covers the last element', c.dc && c.decorBottom >= c.vh - 1 && c.decorBottom >= c.last, c);
    if (full) await shot(p, tag + '_cover_' + tg + '_short', null);
  }
  await seedLong(p);
  for (const tg of Object.keys(IDS)) {
    const c = await cover(p, tg);
    ok(T + 'M2 ' + tg + ' long content scrolled to the end: layer covers the last visible element and the screen bottom', c.dc && c.decorBottom >= c.last && c.decorBottom >= c.vh - 1, c);
    if (full) await shot(p, tag + '_cover_' + tg + '_long', null);
  }
  const off = await p.evaluate(() => { CodisPlanThemes.unequip('discipline', 'own'); codisPlanThemeApply('discipline'); const r = document.getElementById('page-habits'); return { mh:getComputedStyle(r).minHeight, pt:r.classList.contains('pt-room') }; });
  ok(T + 'M3 unequip ⇒ no min-height left on the room (original layout)', off.mh === '0px' && !off.pt, off);
  const sw = await p.evaluate(() => { CodisPlanThemes.equip('agedWoodPlanning', 'own'); codisPlanThemeApply('planning'); const r = document.getElementById('page-planning'); return { mh:getComputedStyle(r).minHeight, room:r.classList.contains('pt-room') }; });
  ok(T + 'M4 switching planning to a surface theme (Aged Wood) ⇒ room cover rule no longer applies', sw.mh === '0px' && !sw.room, sw);
  await p.evaluate(() => { ['planning', 'operations', 'teacher', 'discipline'].forEach(t => CodisPlanThemes.unequip(t, 'own')); codisPlanThemeApply(); });

  // ===== (2) المتجر: «؟» والمسافات =====
  await p.evaluate(() => { document.querySelector('.navbtn[data-page="planning"]').click(); econOpenStore(); }); await p.waitForTimeout(1200);
  await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true, top:true }); econCosSetSub('themes'); }); await p.waitForTimeout(800);
  const grid = await p.evaluate(() => { const out = { fams:[] };
    document.querySelectorAll('#cos-sub-themes .pt-fam').forEach(f => { const tiles = [...f.querySelectorAll(':scope > .pt-grid > .st-tile')].map(t => t.getBoundingClientRect());
      const xs = [], ys = []; for (let i = 1; i < tiles.length; i++) { const a = tiles[i - 1], b = tiles[i]; if (Math.abs(a.top - b.top) < 2) xs.push(Math.round(Math.max(a.left - b.right, b.left - a.right))); }
      const rows = [...new Set(tiles.map(t => Math.round(t.top)))].sort((a, b) => a - b); for (let i = 1; i < rows.length; i++) { const prev = tiles.filter(t => Math.round(t.top) === rows[i - 1]); ys.push(Math.round(rows[i] - Math.max(...prev.map(t => t.bottom)))); }
      const tl = [...f.querySelectorAll(':scope > .pt-grid > .st-tile')], al = new Set(tl.map(t => Math.round(t.getBoundingClientRect().bottom - t.querySelector('.pt-mbadge').getBoundingClientRect().bottom)));
      out.fams.push({ f:f.dataset.family, xs:[...new Set(xs)], ys:[...new Set(ys)], badge:[...al] }); });
    out.descShown = [...document.querySelectorAll('#cos-sub-themes .pt-fam-desc')].filter(x => x.getClientRects().length).length;
    out.nested = document.querySelectorAll('button button').length; out.infoFam = document.querySelectorAll('#cos-sub-themes .pt-fam-ar .pt-info').length; out.infoTile = document.querySelectorAll('#cos-sub-themes .st-tile > .pt-info.is-tile').length;
    out.tiles = document.querySelectorAll('#cos-sub-themes .st-tile').length; const fs = [...document.querySelectorAll('#cos-sub-themes .pt-fam')].map(x => x.getBoundingClientRect()); out.famGaps = [...new Set(fs.slice(1).map((r, i) => Math.round(r.top - fs[i].bottom)))]; return out; });
  const xsAll = new Set(grid.fams.flatMap(f => f.xs)), ysAll = new Set(grid.fams.flatMap(f => f.ys));
  ok(T + 'G1 one spacing system: identical horizontal gaps and identical vertical gaps in every family; family gaps equal; badges at one position', Math.max(...xsAll) - Math.min(...xsAll) <= 1 && (ysAll.size === 0 || Math.max(...ysAll) - Math.min(...ysAll) <= 1) && Math.max(...grid.famGaps) - Math.min(...grid.famGaps) <= 1 && grid.fams.every(f => f.badge.length <= 1), grid);
  ok(T + 'I0 descriptions not shown permanently; «؟» on every family and on every tile (separate element, no nested buttons)', grid.descShown === 0 && grid.infoFam === 5 && grid.infoTile === grid.tiles && grid.nested === 0, grid);
  await shot(p, tag + '_store_themes', '#cos-sub-themes');
  await p.click('#cos-sub-themes .pt-fam[data-family="blazingMeteor"] .pt-fam-ar .pt-info'); await p.waitForTimeout(350);
  const i1 = await p.evaluate(() => { const e = document.querySelector('.pt-pop'); if (!e) return { none:true }; const r = e.getBoundingClientRect();
    return { t:e.querySelector('#pt-pop-t').textContent, b:e.querySelector('.pt-pop-b').textContent.slice(0, 20), ov:!!document.querySelector('.pt-ov'), in:r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1, exp:document.querySelector('.pt-fam[data-family="blazingMeteor"] .pt-info').getAttribute('aria-expanded'), focus:document.activeElement === e }; });
  ok(T + 'I1 family «؟» shows the family description in a popover inside the screen, does not open the details window', i1.t === 'النيزك المشتعل' && /عالم كهرماني/.test(i1.b) && !i1.ov && i1.in && i1.exp === 'true' && i1.focus, i1);
  await shot(p, tag + '_info_family', null);
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  const i2 = await p.evaluate(() => ({ pop:!!document.querySelector('.pt-pop'), focus:!!(document.activeElement && document.activeElement.classList.contains('pt-info')), ov:!!document.querySelector('.pt-ov'), store:document.getElementById('eco-store-body').offsetParent !== null }));
  ok(T + 'I2 Escape closes only the popover and returns focus to «؟» (store stays open)', !i2.pop && i2.focus && !i2.ov && i2.store, i2);
  await p.click('#cos-sub-themes .st-tile[data-ptid="agedWoodTeacher"] > .pt-info'); await p.waitForTimeout(300);
  const i3 = await p.evaluate(() => { const e = document.querySelector('.pt-pop'); return e ? { t:e.querySelector('#pt-pop-t').textContent, b:e.querySelector('.pt-pop-b').textContent, ov:!!document.querySelector('.pt-ov'), n:document.querySelectorAll('.pt-pop').length } : { none:true }; });
  const desc = await p.evaluate(() => CodisPlanThemes.def('agedWoodTeacher').desc);
  ok(T + 'I3 product «؟» shows that product\'s own description (not the family one), one popover only, details not opened', /الخشب المعتّق/.test(i3.t) && i3.b === desc && !i3.ov && i3.n === 1, i3);
  await shot(p, tag + '_info_tile', null);
  await p.click('#cos-sub-themes .st-tile[data-ptid="infernoCrystal"] > .pt-info'); await p.waitForTimeout(300);
  const i4 = await p.evaluate(() => ({ n:document.querySelectorAll('.pt-pop').length, t:(document.querySelector('#pt-pop-t') || {}).textContent }));
  ok(T + 'I4 opening another «؟» replaces the first (never stacked)', i4.n === 1 && /الجحيم/.test(i4.t), i4);
  await p.mouse.click(5, 300); await p.waitForTimeout(300);
  ok(T + 'I5 click outside closes the popover without opening anything', await p.evaluate(() => !document.querySelector('.pt-pop') && !document.querySelector('.pt-ov')));
  await p.click('#cos-sub-themes .st-tile[data-ptid="frostCrystalTeacher"] .pt-mbtn'); await p.waitForTimeout(700);
  const i6 = await p.evaluate(() => { const r = { ov:!!document.querySelector('.pt-ov'), pop:!!document.querySelector('.pt-pop'), peek:!!document.querySelector('.peek'), view:document.documentElement.getAttribute('data-view'), part:typeof econStorePart !== 'undefined' ? econStorePart : '' }; codisPlanThemePreviewClose(true); return r; });
  ok(T + 'I6 the tile itself still opens the details window (info button did not take over the card)', i6.ov && !i6.pop, i6);
  // ===== (3) مشاهد المعاينة + التفاعل =====
  const defs = await p.evaluate(() => CodisPlanThemes.defs().map(d => ({ id:d.id, room:d.apply === 'room', n:codisThemeScenes(d).length, fx:codisThemeFxOf(d) })));
  let lastLc = null;
  for (const d of defs) {
    const lc0 = lastLc, dj0 = await p.evaluate(() => JSON.stringify(data));
    await p.evaluate(id => codisPlanThemePreview(id, document.querySelector('.pt-mtile[data-ptid="' + id + '"] .pt-mbtn')), d.id); await p.waitForTimeout(450);
    const seen = [];
    for (let k = 0; k < d.n; k++) {
      seen.push(await p.evaluate(() => { const ov = document.querySelector('.pt-ov'), S = ov.querySelector('.pt-slides'), on = S.querySelector(':scope > .pt-slide.is-on');
        const vis = [...S.querySelectorAll(':scope > .pt-slide')].filter(x => getComputedStyle(x).display !== 'none').length, themed = on.querySelector('[data-pt]');
        return { i:+S.dataset.i, t:(ov.querySelector('.pt-scn-t') || {}).textContent || '', c:(ov.querySelector('.pt-scn-n') || {}).textContent || '', dsc:((ov.querySelector('.pt-scn-d') || {}).textContent || '').length,
          onDot:[...ov.querySelectorAll('.pt-scn-dot')].findIndex(x => x.classList.contains('is-on')), vis, themed:themed && themed.getAttribute('data-pt'), h:Math.round(on.getBoundingClientRect().height),
          sig:on.innerText.replace(/\s+/g, ' '), ids:[...on.querySelectorAll('[id]')].filter(e => document.querySelectorAll('[id="' + CSS.escape(e.id) + '"]').length > 1).length, on:[...on.querySelectorAll('*')].filter(e => [...e.attributes].some(a => /^on/i.test(a.name))).length }; }));
      if (full || d.room) await shot(p, tag + '_scene_' + d.id + '_' + (k + 1), '.pt-ov .pt-ov-card');
      if (k < d.n - 1) { await p.click('.pt-ov .pt-slide-nav.is-next'); await p.waitForTimeout(280); }
    }
    const okAll = seen.every((s, k) => s.i === k && s.vis === 1 && s.themed === d.id && s.h > 80 && s.ids === 0 && s.on === 0 && s.c === (k + 1) + ' / ' + d.n && s.onDot === k && s.t && s.dsc > 0);
    ok(T + 'S ' + d.id + ' — ' + d.n + ' scenes (' + (d.room ? 'room states' : 'surfaces') + '): next reaches every one, one visible at a time, each themed with this product, title+desc+counter+dot in sync, no duplicate ids, no inline handlers',
      (d.room ? d.n === 6 : d.n >= 3) && okAll && new Set(seen.map(s => s.sig)).size === d.n, seen.map(s => [s.i, s.c, s.t, s.vis, s.themed, s.h, s.ids, s.on, s.onDot, s.sig.slice(0, 30)]));
    await p.click('.pt-ov .pt-scn-dot:nth-child(2)'); await p.waitForTimeout(200);
    const dot = await p.evaluate(() => +document.querySelector('.pt-ov .pt-slides').dataset.i);
    await p.focus('.pt-ov .pt-scn-dot.is-on'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(200);
    const kb = await p.evaluate(() => ({ i:+document.querySelector('.pt-ov .pt-slides').dataset.i, f:!!(document.activeElement && document.activeElement.classList.contains('is-on')) }));
    await p.keyboard.press('End'); await p.waitForTimeout(150); const end = await p.evaluate(() => +document.querySelector('.pt-ov .pt-slides').dataset.i);
    await p.click('.pt-ov .pt-slide-nav.is-next'); await p.waitForTimeout(150); const wrap = await p.evaluate(() => +document.querySelector('.pt-ov .pt-slides').dataset.i);
    await ptr(p, '.pt-ov .pt-slides', 'pointerdown', 'touch', .8, .5, 21); await ptr(p, '.pt-ov .pt-slides', 'pointerup', 'touch', .2, .52, 21); await p.waitForTimeout(200);
    const swipe = await p.evaluate(() => +document.querySelector('.pt-ov .pt-slides').dataset.i);
    await ptr(p, '.pt-ov .pt-slides', 'pointerdown', 'touch', .5, .2, 22); await ptr(p, '.pt-ov .pt-slides', 'pointerup', 'touch', .52, .8, 22); await p.waitForTimeout(150);
    const vert = await p.evaluate(() => +document.querySelector('.pt-ov .pt-slides').dataset.i);
    ok(T + 'N ' + d.id + ' dots jump directly, ArrowLeft = next (RTL) keeping focus on the dot, End = last, next wraps to first, left swipe = next, vertical drag ignored',
      dot === 1 && kb.i === 2 % d.n && kb.f && end === d.n - 1 && wrap === 0 && swipe === 1 && vert === 1, { dot, kb, end, wrap, swipe, vert });
    if (d.fx) {
      await p.evaluate(() => codisPtSlideStep(0, 0)); await p.waitForTimeout(260);
      const sel = d.fx === 'meteor' ? '.pt-ov .pt-slide.is-on .bm-pv' : '.pt-ov .pt-slide.is-on [data-pt^="agedWood"][data-pt-target]';
      const box = await p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; e.scrollIntoView({ block:'center' }); const r = e.getBoundingClientRect(); return { x:r.left + r.width * .5, y:r.top + Math.min(r.height * .5, 160) }; }, sel);
      let r1 = { none:true };
      if (box) { await p.mouse.move(box.x - 30, box.y - 20); await p.mouse.move(box.x, box.y, { steps:4 }); await p.waitForTimeout(150);
        r1 = await p.evaluate(fx => { if (fx === 'meteor') { const f = document.querySelector('.pt-ov .pt-slide.is-on .bm-fx'), l = f && f.querySelector('.bm-light'); return { on:!!(f && f.classList.contains('is-on')), moved:!!(l && /translate3d/.test(l.style.transform)), lit:1 }; }
          const h = document.querySelector('.pt-ov .aw-lit'), f = h && h.querySelector(':scope > .aw-fx, :scope > .pt-decor > .aw-fx'); return { on:!!(f && f.classList.contains('is-on')), moved:!!(f && f.style.getPropertyValue('--aw-x')), lit:h ? 1 : 0 }; }, d.fx); }
      ok(T + 'X1 ' + d.id + ' (' + d.fx + ') real mouse over the preview: the theme\'s own light follows the pointer', r1.on && r1.moved && r1.lit === 1, r1);
      const bsel = d.fx === 'meteor' ? '.pt-ov .pt-slide.is-on .bm-pv :is(.btn, .stat-btn, .disc-mode)' : '.pt-ov .pt-slide.is-on [data-pt^="agedWood"][data-pt-target] :is(.btn, .stat-btn, .pm-btn)';
      let r2 = { none:true };
      if (await p.evaluate(s => !!document.querySelector(s), bsel)) {
        await p.evaluate(() => { window.__anims = 0; if (!window.__animP) { window.__animP = 1; const A = Element.prototype.animate; Element.prototype.animate = function(){ window.__anims++; return A.apply(this, arguments); }; } });
        await p.evaluate(s => { const b = document.querySelector(s); b.scrollIntoView({ block:'center' }); const r = b.getBoundingClientRect(); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, cancelable:true, composed:true, pointerId:31, pointerType:'touch', isPrimary:true, clientX:r.left + r.width / 2, clientY:r.top + r.height / 2, buttons:1 })); }, bsel); await p.waitForTimeout(60);
        r2 = await p.evaluate(fx => ({ press:document.querySelectorAll(fx === 'meteor' ? '.pt-ov .bm-press' : '.pt-ov .aw-press').length, touch:fx === 'meteor' ? !!document.querySelector('.pt-ov .bm-fx.is-touch') : !!document.querySelector('.pt-ov .aw-fx.is-touch'), ring:fx === 'meteor' ? window.__anims : document.querySelectorAll('.pt-ov .aw-fx.is-ring').length }), d.fx);
        await p.evaluate(s => { const b = document.querySelector(s), r = b.getBoundingClientRect(); b.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, composed:true, pointerId:31, pointerType:'touch', isPrimary:true, clientX:r.left + r.width / 2, clientY:r.top + r.height / 2 })); }, bsel); await p.waitForTimeout(100);
        await p.click(bsel).catch(() => {}); await p.waitForTimeout(150); }
      ok(T + 'X2 ' + d.id + ' touch-press a button in the preview: press state + touch light + ' + (d.fx === 'meteor' ? 'energy ring and sparks' : 'response ring'), r2.press === 1 && r2.touch && r2.ring >= (d.fx === 'meteor' ? 2 : 1), r2);
      if (box) { await p.mouse.move(box.x, box.y); await p.waitForTimeout(80); }
      await p.evaluate(() => codisPtSlideStep(1)); await p.waitForTimeout(150);
      const r3 = await p.evaluate(() => ({ left:document.querySelectorAll('.pt-ov .pt-slide:not(.is-on) :is(.bm-fx.is-on, .bm-near, .bm-press, .aw-lit, .aw-press, .aw-fx.is-on)').length, st:CodisThemePreviewFx.state() }));
      ok(T + 'X3 ' + d.id + ' changing scene during an active effect leaves nothing running in the previous scene', r3.left === 0 && !r3.st.press, r3);
      await p.mouse.move(2, 2);
    }
    const dj1 = await p.evaluate(() => JSON.stringify(data));
    await p.evaluate(() => codisPlanThemePreviewClose()); await p.waitForTimeout(200);
    const fin = await p.evaluate(() => ({ lc:window.__lc, st:CodisThemePreviewFx.state(), ov:!!document.querySelector('.pt-ov'), left:document.querySelectorAll('.bm-press, .aw-press, .bm-near, .aw-lit').length, eq:Object.values(CodisPlanThemes.equippedMap()).filter(Boolean).length }));
    ok(T + 'Z ' + d.id + ' preview changed no user data and equipped nothing; closing removes the window, its listeners (document/window count flat from preview to preview) and every effect', dj1 === dj0 && (lc0 === null || fin.lc === lc0) && !fin.st.open && fin.st.listeners === 0 && !fin.ov && fin.left === 0 && fin.eq === 0, { same:dj1 === dj0, diff:dj1 === dj0 ? '' : (() => { const a = JSON.parse(dj0), b = JSON.parse(dj1); return Object.keys(b).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map(k => k + ':' + (typeof b[k] === 'object' && b[k] ? Object.keys(b[k]).filter(j => JSON.stringify((a[k] || {})[j]) !== JSON.stringify(b[k][j])).join('|') : '')).join(','); })(), lc0, fin });
    lastLc = fin.lc;
  }
  await p.evaluate(() => { econOpenVault(); }); await p.waitForTimeout(900); await p.evaluate(() => econOwnSetPart('cosmetics', { quiet:true })); await p.waitForTimeout(300);
  const own = await p.evaluate(() => { const b = document.querySelector('#own-panel-cosmetics .pt-mtile[data-ptid="blazingMeteorDiscipline"] .pt-mbtn'); codisPlanThemePreview('blazingMeteorDiscipline', b);
    const ov = document.querySelector('.pt-ov'); const r = { ctx:ov.dataset.ctx, n:+ov.querySelector('.pt-slides').dataset.n, dots:ov.querySelectorAll('.pt-scn-dot').length, info:document.querySelectorAll('#own-panel-cosmetics .st-tile > .pt-info').length, fx:CodisThemePreviewFx.state().kit }; codisPlanThemePreviewClose(true); return r; });
  ok(T + 'O1 «بحوزتك» opens the same scene system (6 scenes, dots, meteor interaction) with «؟» on owned tiles', own.ctx === 'own' && own.n === 6 && own.dots === 6 && own.info > 0 && own.fx === 'meteor', own);
  await shot(p, tag + '_own_themes', '#own-panel-cosmetics');
  const dup = await p.evaluate(() => [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i));
  ok(T + 'ZZ no duplicate DOM ids; no JS errors', !dup.length && !o.errs.length, { dup, errs:o.errs.slice(0, 6) });
  await o.close();
}
{ const o = await open(375, 'paper', { reduced:true }); const p = o.page;
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(900);
  const r = await p.evaluate(async () => { codisPlanThemePreview('blazingMeteorOperations', null); await new Promise(r => setTimeout(r, 300)); const sl = document.querySelector('.pt-ov .pt-slide.is-on .bm-pv'), b = sl.getBoundingClientRect();
    const t = document.elementFromPoint(b.left + b.width / 2, b.top + 80) || sl; t.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerId:3, pointerType:'touch', clientX:b.left + b.width / 2, clientY:b.top + 80 }));
    const on = !!document.querySelector('.pt-ov .bm-fx.is-on'); codisPtSlideStep(1); const an = getComputedStyle(document.querySelector('.pt-ov .pt-slide.is-on')).animationName; codisPlanThemePreviewClose(true); return { on, an }; });
  ok('reduced-motion: no preview light/rings, scene change without animation', !r.on && r.an === 'none', r);
  await o.close(); }
console.log('\n' + pass + ' passed, ' + fail + ' failed'); srv.close(); process.exit(fail ? 1 : 0);
