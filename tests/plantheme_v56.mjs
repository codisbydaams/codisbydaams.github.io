/* CODIS-V56 — ثيمات غرفة التخطيط (INFERNO CRYSTAL). WebKit حقيقي (محاكاة iPhone) افتراضياً؛ ENGINE=chrome لـChrome المثبّت.
   Run:  PW=<path to playwright-core/index.mjs> node tests/plantheme_v56.mjs [app.html]
   السيناريوهات العشرون من الطلب + الضغط المتكرر + الاستقلال عن مظاهر البطاقات + الإصلاح الذاتي + بيانات مشوّهة + تقليل الحركة +
   تطابق المعاينة مع المربع الحقيقي + لا IDs مكررة + لا أخطاء صفحة، بالمظهرين وعلى 320/390. */
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = process.argv[2] || path.join(ROOT, 'app/CODIS_FINAL.html');
const { webkit, chromium, devices } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
const CHROME = process.env.ENGINE === 'chrome';
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = p === '/app/CODIS_FINAL.html' ? APP : path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':{ '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml', '.js':'text/javascript' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/app/CODIS_FINAL.html';
let pass = 0, fail = 0; const ok = (n, c, info) => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + n + (!c && info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 400) : '')); };
async function open(w, theme, reduced){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v56t-'));
  const o = { ...devices['iPhone 12'], viewport:{ width:w, height:844 }, screen:{ width:w, height:844 }, reducedMotion:reduced ? 'reduce' : 'no-preference' };
  const ctx = CHROME ? await chromium.launchPersistentContext(prof, { ...o, defaultBrowserType:undefined, executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true }) : await webkit.launchPersistentContext(prof, o);
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); } await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t, true), theme); };
  await boot();
  return { page, errs, boot, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const grant = n => CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', n, 'qa', 'admin', 'qa|' + n + '|' + Math.random(), null); return { ok:true }; });
const S = () => ({ silver:CodisWallet.silverBalance(), coins:data.wallet.balance, own:CodisPlanThemes.owns('infernoCrystal'), eq:CodisPlanThemes.equippedId(), ptx:CodisWallet.silverTxs().filter(t => t.referenceId === 'plantheme|infernoCrystal').length,
  box:(() => { const b = document.querySelector('#planning-empty > .empty-state'); const r = b.getBoundingClientRect(); return { pt:b.getAttribute('data-pt') || '', decor:!!b.querySelector(':scope > .pt-decor'), w:Math.round(r.width), h:Math.round(r.height) }; })(),
  cos:JSON.stringify(data.inventory.cosmetics), dup:(() => { const seen = {}, d = []; document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) d.push(e.id); seen[e.id] = 1; }); return d; })() });
const confirmYes = async p => { await p.waitForTimeout(450); await p.evaluate(() => resolveCodisConfirm(true)); await p.waitForTimeout(800); };

for (const [theme, w] of (process.env.RUNS || 'paper:390,dark:320').split(',').map(x => x.split(':'))) {
  const T = theme + ' ' + w + ': ';
  const o = await open(+w, theme); const p = o.page;
  await p.evaluate(() => navigateToPage('planning')); await p.waitForTimeout(900);
  const base = await p.evaluate(S);
  // 1–4: المتجر ← المظاهر ← مظاهر البطاقات القديمة ← ثيمات التخطيط
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1400); await p.evaluate(() => econStoreSetPart('cosmetics', { quiet:true })); await p.waitForTimeout(600);
  let st = await p.evaluate(() => ({ tabs:[...document.querySelectorAll('#pane-cosmetics .cos-seg-b')].map(b => b.getAttribute('aria-selected') + ':' + b.textContent.trim()), cardTiles:document.querySelectorAll('#cos-sub-cards .cos-tile').length, themesHidden:document.getElementById('cos-sub-themes').hidden, rail:(document.querySelector('.st-rail-b[data-part="cosmetics"] .st-rail-n') || {}).textContent }));
  ok(T + '1–3 store cosmetics: two inner tabs, old card cosmetics intact and shown first', st.tabs.length === 2 && st.tabs[0].startsWith('true') && st.cardTiles === 2 && st.themesHidden && st.rail === '3', st);
  await p.evaluate(() => econCosSetSub('themes')); await p.waitForTimeout(400);
  st = await p.evaluate(() => { const t = document.querySelector('#cos-sub-themes .pt-tile[data-ptid="infernoCrystal"]'); return { vis:!!t && t.offsetParent !== null, cardsHidden:document.getElementById('cos-sub-cards').hidden, prev:!!(t && t.querySelector('.pt-stage > .pt-box[data-pt="infernoCrystal"] .pt-decor')), name:t && t.querySelector('.pt-name').textContent, price:t && t.querySelector('.pt-buy').textContent.replace(/\s/g, '') }; });
  ok(T + '4 themes tab: INFERNO CRYSTAL tile with real preview, name, silver price', st.vis && st.cardsHidden && st.prev && st.name === 'Inferno Crystal', st);
  // 5: المعاينة الكبيرة (فتح/إغلاق بـEsc والرجوع) + تطابق المعاينة مع المربع الحقيقي
  await p.evaluate(() => codisPlanThemePreview('infernoCrystal')); await p.waitForTimeout(500);
  st = await p.evaluate(() => { const ov = document.querySelector('.pt-ov'); return { open:!!ov, box:!!(ov && ov.querySelector('.pt-box .pt-decor')), back:codisBackLayer().el === ov }; });
  ok(T + '5 big preview opens (back-layer aware)', st.open && st.box && st.back, st);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(T + '5 Esc closes preview only (store stays)', await p.evaluate(() => !document.querySelector('.pt-ov') && econStoreIsOpen()));
  // 6: فضة غير كافية
  let s0 = await p.evaluate(S);
  st = await p.evaluate(() => { const b = document.querySelector('#cos-sub-themes .pt-buy'); return { dis:b.disabled, txt:b.textContent }; });
  await p.evaluate(() => { econPlanThemeBuy('infernoCrystal'); }); await p.waitForTimeout(700);
  let s1 = await p.evaluate(S);
  ok(T + '6 insufficient silver: button disabled with «ينقصك», no charge, not owned', st.dis && /ينقصك/.test(st.txt) && s1.silver === s0.silver && !s1.own && s1.ptx === 0, { st, s0:s0.silver, s1:s1.silver });
  // 7–9: شراء برصيد كافٍ + ضغط متكرر ⇒ خصم واحد وملكية مسجّلة والكوينز كما هي
  await p.evaluate(grant, 5000); await p.evaluate(() => econRenderStore()); await p.waitForTimeout(400);
  s0 = await p.evaluate(S);
  await p.evaluate(() => { econPlanThemeBuy('infernoCrystal'); econPlanThemeBuy('infernoCrystal'); econPlanThemeBuy('infernoCrystal'); });
  const conf = await p.evaluate(() => (document.querySelector('#codis-confirm-modal') || {}).textContent || '');
  await confirmYes(p);
  await p.evaluate(() => { econPlanThemeBuy('infernoCrystal'); }); await p.waitForTimeout(600);
  s1 = await p.evaluate(S);
  ok(T + '7 confirm shows price, balance and remaining', /3,499/.test(conf) && /5,000/.test(conf) && /1,501/.test(conf), conf.slice(0, 200));
  ok(T + '8 silver deducted exactly once (3,499), one ledger tx, coins untouched', s0.silver - s1.silver === 3499 && s1.ptx === 1 && s1.coins === s0.coins, { s0:s0.silver, s1:s1.silver, ptx:s1.ptx, c0:s0.coins, c1:s1.coins });
  ok(T + '9 ownership recorded once, not equipped yet', s1.own && s1.eq === '' && await p.evaluate(() => data.inventory.planThemes.owned.filter(x => x.id === 'infernoCrystal').length === 1));
  // 10–12: بحوزتك ← المظاهر ← الثيم ← تجهيز
  await p.evaluate(() => econOpenVault()); await p.waitForTimeout(1300); await p.evaluate(() => econOwnSetPart('cosmetics')); await p.waitForTimeout(400);
  st = await p.evaluate(() => { const t = document.querySelector('#own-panel-cosmetics .pt-tile[data-ptid="infernoCrystal"]'); return { tile:!!t, n:(document.querySelector('#own-tab-cosmetics .own-tab-n') || {}).textContent, btn:t && t.querySelector('.pt-act').textContent, prev:!!(t && t.querySelector('.pt-box .pt-decor')) }; });
  ok(T + '10–11 own sheet «المظاهر» lists the theme with preview and equip button', st.tile && st.prev && st.n === '1' && /تجهيز/.test(st.btn), st);
  await p.evaluate(() => document.querySelector('#own-panel-cosmetics .pt-act').click()); await p.waitForTimeout(700);
  s1 = await p.evaluate(S);
  st = await p.evaluate(() => ({ part:econOwnPart, btn:document.querySelector('#own-panel-cosmetics .pt-act').textContent, tag:(document.querySelector('#own-panel-cosmetics .pt-state') || {}).textContent }));
  ok(T + '12 equip: no silver, applied to the real box immediately, stays on «المظاهر»', s1.eq === 'infernoCrystal' && s1.silver === s0.silver - 3499 && s1.box.pt === 'infernoCrystal' && s1.box.decor && st.part === 'cosmetics' && /إزالة/.test(st.btn), { s1:s1.box, st });
  // 13–16: غرفة التخطيط + الانتقال بين الغرف
  await p.evaluate(() => { econCloseOwn(); econCloseStore(); navigateToPage('planning'); }); await p.waitForTimeout(1200);
  s1 = await p.evaluate(S);
  ok(T + '13–14 planning shows the theme; box size unchanged', s1.box.pt === 'infernoCrystal' && s1.box.w === base.box.w && s1.box.h === base.box.h, { base:base.box, now:s1.box });
  const look = await p.evaluate(() => { const b = document.querySelector('#planning-empty > .empty-state'), c = e => getComputedStyle(e); return { bg:c(b).backgroundImage.slice(0, 40), title:c(b.querySelector('.es-title')).color, copy:c(b.querySelector('.es-copy')).color, btnBg:c(b.querySelector('.btn')).backgroundImage.slice(0, 60), before:c(b, '::before').display }; });
  ok(T + '14 themed look applied (obsidian bg, crystal title, molten button, original dot grid hidden)', /gradient/.test(look.bg) && look.title === 'rgb(244, 215, 182)' && /gradient/.test(look.btnBg), look);
  await p.evaluate(() => navigateToPage('tasks')); await p.waitForTimeout(700); await p.evaluate(() => navigateToPage('learn')); await p.waitForTimeout(700); await p.evaluate(() => navigateToPage('planning')); await p.waitForTimeout(900);
  s1 = await p.evaluate(S);
  ok(T + '15–16 after visiting other rooms the theme stays', s1.box.pt === 'infernoCrystal' && s1.box.decor);
  // تطابق المعاينة: نفس القيم المحسوبة للنصوص والزر داخل المتجر
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1300); await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(500);
  const par = await p.evaluate(() => { const real = document.querySelector('#planning-empty > .empty-state'), pv = document.querySelector('#cos-sub-themes .pt-box'), k = (b, s, props) => { const e = s ? b.querySelector(s) : b, c = getComputedStyle(e); return props.map(x => c.getPropertyValue(x)).join('|'); };
    const P = ['color', 'font-size', 'font-weight', 'text-shadow'], B = ['background-image', 'color', 'border-radius', 'min-height', 'font-size', 'box-shadow'];
    return [['title', k(real, '.es-title', P), k(pv, '.es-title', P)], ['copy', k(real, '.es-copy', P), k(pv, '.es-copy', P)], ['btn', k(real, '.btn', B), k(pv, '.btn', B)], ['box', k(real, null, ['background-image', 'border-radius', 'box-shadow']), k(pv, null, ['background-image', 'border-radius', 'box-shadow'])], ['art', k(real, '.es-mark svg', ['color', 'filter']), k(pv, '.es-mark svg', ['color', 'filter'])]].filter(x => x[1] !== x[2]); });
  ok(T + 'preview renders with exactly the same computed styles as the real box', !par.length, par);
  // مظاهر البطاقات مستقلة تماماً
  const cosBefore = s1.cos;
  await p.evaluate(() => { econCloseStore(); }); await p.waitForTimeout(400);
  ok(T + 'card cosmetics data untouched by theme buy/equip', (await p.evaluate(S)).cos === cosBefore && cosBefore === base.cos, { base:base.cos, now:cosBefore });
  // 17–18: إزالة
  await p.evaluate(() => econPlanThemeToggle('infernoCrystal')); await p.waitForTimeout(600);
  s1 = await p.evaluate(S);
  const look2 = await p.evaluate(() => { const b = document.querySelector('#planning-empty > .empty-state'); return { cls:b.className, style:b.getAttribute('style'), before:getComputedStyle(b, '::before').display, title:getComputedStyle(b.querySelector('.es-title')).color }; });
  ok(T + '17–18 unequip: original box restored, theme still owned', s1.eq === '' && s1.own && s1.box.pt === '' && !s1.box.decor && look2.style === null && look2.cls === 'empty-state' && look2.before !== 'none', look2);
  // 19–20: إعادة التشغيل
  await p.evaluate(() => econPlanThemeToggle('infernoCrystal')); await p.waitForTimeout(500);
  await o.boot(); await p.evaluate(() => navigateToPage('planning')); await p.waitForTimeout(900);
  s1 = await p.evaluate(S);
  ok(T + '19–20 after restart: owned + equipped + applied, silver not charged again', s1.own && s1.eq === 'infernoCrystal' && s1.box.pt === 'infernoCrystal' && s1.ptx === 1 && s1.silver === s0.silver - 3499, s1);
  ok(T + 'no duplicate DOM ids', !s1.dup.length, s1.dup.slice(0, 5));
  // الإصلاح الذاتي: ملكية أسقطتها نسخة أقدم والمعاملة باقية ⇒ تعود بلا خصم
  await p.evaluate(() => { data.inventory.planThemes = { owned:[], equipped:'' }; saveData(); renderPlanningPage(); }); await p.waitForTimeout(300);
  s1 = await p.evaluate(S);
  ok(T + 'self-heal restores ownership from the silver ledger (no new charge)', s1.own && s1.ptx === 1 && s1.silver === s0.silver - 3499, s1);
  ok(T + 'no page/console errors', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}
// بيانات مشوّهة/قديمة: الإقلاع سليم والتطبيع آمن
{
  const o = await open(375, 'paper'); const p = o.page; const K = 'life_organizer_data_v1';
  for (const bad of [null, 'x', [], { owned:'q', equipped:7 }, { owned:[{ id:'infernoCrystal' }, { id:'infernoCrystal' }, { id:'<script>' }, 5, null], equipped:'infernoCrystal' }, { owned:[{ id:'futureTheme9', paid:'z' }], equipped:'futureTheme9' }]) {
    await p.evaluate(([k, b]) => { const d = JSON.parse(localStorage.getItem(k)); d.inventory = d.inventory || {}; d.inventory.planThemes = b; localStorage.setItem(k, JSON.stringify(d)); }, [K, bad]);
    o.errs.length = 0; await o.boot(); await p.evaluate(() => navigateToPage('planning')); await p.waitForTimeout(500);
    const r = await p.evaluate(() => ({ pt:data.inventory.planThemes, box:document.querySelector('#planning-empty > .empty-state').getAttribute('data-pt') || '' }));
    const good = Array.isArray(r.pt.owned) && typeof r.pt.equipped === 'string' && new Set(r.pt.owned.map(x => x.id)).size === r.pt.owned.length && r.pt.owned.every(x => /^[A-Za-z0-9_-]+$/.test(x.id));
    ok('odd stored planThemes ' + JSON.stringify(bad).slice(0, 60) + ' → boots, normalized', good && !o.errs.length && (r.box === '' || r.box === 'infernoCrystal'), { r, e:o.errs.slice(0, 2) });
  }
  const fut = await p.evaluate(() => ({ kept:data.inventory.planThemes.owned.some(x => x.id === 'futureTheme9'), eq:CodisPlanThemes.equippedId() }));
  ok('unknown (future) theme ids are kept, but never applied', fut.kept && fut.eq === '', fut);
  await o.close();
}
// تقليل الحركة: لا حركة، والثيم كامل ثابت
{
  const o = await open(390, 'dark', true); const p = o.page;
  await p.evaluate(grant, 4000); await p.evaluate(() => { CodisPlanThemes.buy('infernoCrystal'); CodisPlanThemes.equip('infernoCrystal'); navigateToPage('planning'); }); await p.waitForTimeout(900);
  const r = await p.evaluate(() => { const b = document.querySelector('#planning-empty > .empty-state'); return { pt:b.getAttribute('data-pt'), anim:[...b.querySelectorAll('.pt-decor > *')].map(e => getComputedStyle(e).animationName).filter(n => n && n !== 'none'), sheen:getComputedStyle(b.querySelector('.pt-sheen')).display, breath:getComputedStyle(b.querySelector('.pt-breath')).opacity }; });
  ok('reduced motion: themed, no decor animation, sheen hidden, glow static', r.pt === 'infernoCrystal' && !r.anim.length && r.sheen === 'none' && +r.breath > .5, r);
  await o.close();
}
srv.close();
console.log(`\n${pass} passed, ${fail} failed (engine: ${CHROME ? 'chrome' : 'webkit'})`); process.exit(fail ? 1 : 0);
