/* CODIS-V67 — ثيمات نوافذ الموافقة (الترابي · المائي · الناري · الرياحي).
   WebKit حقيقي (محاكاة iPhone 12). Run:  PW=<path to playwright-core/index.mjs> node tests/v67_browser.mjs [app.html]
   RUNS="paper:375,dark:320,paper:1280" · SHOTS=<dir>. نافذة الموافقة الحقيقية تُفتح بالمسارات الحقيقية ويُضغط زرها بالماوس/اللمس الحقيقي من Playwright. */
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
const IDS = ['earthConfirm', 'waterConfirm', 'fireConfirm', 'windConfirm'];
const PRICE = { earthConfirm:2499, waterConfirm:2999, fireConfirm:3499, windConfirm:2799 };

async function open(w, theme, opts = {}){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v67t-'));
  const ctx = await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'], viewport:{ width:w, height:w > 700 ? 900 : 780 }, screen:{ width:w, height:w > 700 ? 900 : 780 }, reducedMotion:opts.reduced ? 'reduce' : 'no-preference', hasTouch:true, isMobile:w < 700 });
  await ctx.addInitScript(() => { window.CODIS_B3D_OFF = true;
    /* عدّاد المستمعات على document/window (لا تراكم بعد فتح/إغلاق المعاينة والنافذة) */
    window.__lc = 0; const A = EventTarget.prototype.addEventListener, R = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(){ if (this === document || this === window) window.__lc++; return A.apply(this, arguments); };
    EventTarget.prototype.removeEventListener = function(){ if (this === document || this === window) window.__lc--; return R.apply(this, arguments); }; });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); }
    await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t), theme === 'dark' ? 'dark' : 'paper').catch(() => {}); await page.waitForTimeout(300);
    await page.evaluate(() => { CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {}; window.__snd = []; const P = CodisAudio.play; CodisAudio.play = function(name, o){ window.__snd.push(name + '@' + ((o && o.ctx) || '')); return P.apply(this, arguments); }; }); };
  await boot();
  return { page, errs, boot, until, ctx, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const shot = async (p, name, sel) => { if (!SHOTS) return; try { if (sel) { const el = await p.$(sel); if (el) { await el.screenshot({ path:path.join(SHOTS, name + '.png') }); return; } } await p.screenshot({ path:path.join(SHOTS, name + '.png') }); } catch (e) { console.log('shot ' + name + ': ' + e.message); } };
const grant = (p, n) => p.evaluate(n => CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', n, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; }), n);
const confirmOpen = p => p.evaluate(() => CodisMotion.isOpen(document.getElementById('codis-confirm-modal')));
/* بصمة محسوبة لنافذة الموافقة (لمقارنة الأصلي قبل التجهيز وبعد الإزالة حرفياً) */
const csig = p => p.evaluate(() => { const m = document.getElementById('codis-confirm-modal'); const out = [];
  [m, ...m.querySelectorAll('*')].forEach(el => { if (!el.getClientRects().length && el !== m) return; const c = getComputedStyle(el); const a = getComputedStyle(el, '::after');
    out.push([el.id || el.className && String(el.className.baseVal !== undefined ? el.className.baseVal : el.className), c.backgroundImage.slice(0, 80), c.backgroundColor, c.color, c.borderTopColor, c.borderRadius, c.boxShadow.slice(0, 60), a.content, a.backgroundImage.slice(0, 40)].join('|')); });
  return out.join('\n'); });
/* يفتح نافذة موافقة حقيقية بخياراتها (من مسار التطبيق نفسه) ويعيد وصفها المحسوب */
const showConfirm = async (p, expr) => { await p.evaluate(e => { window.__cr = undefined; codisConfirm(eval(e)).then(v => { window.__cr = v; }); }, expr); await p.waitForTimeout(650);
  return p.evaluate(() => { const m = document.getElementById('codis-confirm-modal'), sh = m.querySelector('.confirm-modal'), ok = document.getElementById('codis-confirm-ok'), no = document.getElementById('codis-confirm-cancel'), ic = document.getElementById('codis-confirm-icon');
    const cs = x => getComputedStyle(x);
    return { cfx:m.getAttribute('data-cfx') || '', bg:cs(sh).backgroundImage.slice(0, 60), radius:cs(sh).borderTopLeftRadius, after:cs(sh, '::after').backgroundImage.slice(0, 30), okBg:cs(ok).backgroundImage.slice(0, 50), okC:cs(ok).color, noC:cs(no).color, noBg:cs(no).backgroundImage.slice(0, 40) + cs(no).backgroundColor,
      icoR:cs(ic).borderTopLeftRadius, title:cs(document.getElementById('codis-confirm-title')).color, scrim:cs(m).backgroundColor, focus:document.activeElement && document.activeElement.id, w:sh.getBoundingClientRect().width, sw:document.documentElement.scrollWidth, vw:innerWidth }; }); };
const closeConfirm = async (p, v) => { await p.evaluate(v => resolveCodisConfirm(v), !!v); await p.waitForTimeout(500); };

/* تباين WCAG من رموز CSS الفعلية (كل نقطة بالتدرّج) */
const css = fs.readFileSync(path.join(ROOT, 'tools/identity/v67.css'), 'utf8');
const lum = h => { const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
for (const id of IDS) {
  const blk = css.slice(css.indexOf('[data-cfx="' + id + '"], .cf-mini'), css.indexOf('}', css.indexOf('[data-cfx="' + id + '"], .cf-mini')));
  const tok = k => (new RegExp('--' + k + ':([^;]+);').exec(blk) || [])[1] || '';
  const hexes = s => (s.match(/#[0-9A-Fa-f]{6}/g) || []);
  const base = hexes(tok('cf-base')), worst = (fg, bgs) => Math.min(...bgs.map(b => cr(fg, b)));
  const res = { title:worst(tok('cf-title'), base), text:worst(tok('cf-text'), base), muted:worst(tok('cf-muted'), base),
    ok:worst(tok('cf-ok-fg'), hexes(tok('cf-ok-bg'))), danger:worst(tok('cf-dg-fg'), hexes(tok('cf-dg-bg'))) };
  const noBg = hexes(tok('cf-no-bg')); res.cancel = noBg.length ? worst(tok('cf-no-fg'), noBg) : worst(tok('cf-no-fg'), base);
  ok('C ' + id + ' contrast (every gradient stop): title ≥7, text ≥4.5, labels ≥4.5, confirm/danger/cancel buttons ≥4.5', res.title >= 7 && res.text >= 4.5 && res.muted >= 4.5 && res.ok >= 4.5 && res.danger >= 4.5 && res.cancel >= 4.5, Object.fromEntries(Object.entries(res).map(([k, v]) => [k, +v.toFixed(2)])));
}

const RUNS = (process.env.RUNS || 'paper:375,dark:320,paper:1280').split(',').map(x => x.split(':'));
for (let ri = 0; ri < RUNS.length; ri++) {
  const [theme, w] = RUNS[ri], T = theme + ' ' + w + ': ', tag = theme + w, full = ri === 0;
  const o = await open(+w, theme); const p = o.page;
  // (0) الأصل: لا تجهيز، النافذة بلا data-cfx
  const sig0 = await (async () => { await showConfirm(p, "CodisCopy.deleteTask('مهمة')"); const s = await csig(p); await closeConfirm(p, false); return s; })();
  const d0 = await p.evaluate(() => ({ ct:JSON.stringify(data.inventory.confirmThemes), eq:CodisConfirmThemes.equippedId(), attr:document.getElementById('codis-confirm-modal').hasAttribute('data-cfx') }));
  ok(T + 'S0 default: confirmThemes empty, nothing equipped, dialog unmarked', d0.ct === '{"owned":[],"equipped":""}' && d0.eq === '' && !d0.attr, d0);

  // (1) المتجر: قسم مستقل بأربع بطاقات
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1200);
  await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true, top:true }); econCosSetSub('themes'); }); await p.waitForTimeout(700);
  const st = await p.evaluate(() => { const s = document.querySelector('#eco-store-body #eco-confirm-themes'); if (!s) return { none:true };
    return { title:(s.querySelector('.pt-fam-ar > span') || s.querySelector('.pt-fam-ar')).textContent, tiles:[...s.querySelectorAll('.cf-tile')].map(t => t.dataset.cfid + ':' + t.querySelector('.pt-mname').textContent + ':' + t.querySelector('.pt-mbadge').textContent.replace(/\s/g, '')),
      minis:[...s.querySelectorAll('.cf-mini')].map(m => getComputedStyle(m.querySelector('.cf-mini-sh')).backgroundImage.slice(0, 30)), inRoomFam:!!s.closest('[data-family]:not(#eco-confirm-themes)'), last:[...document.querySelectorAll('#eco-store-body #cos-sub-themes .pt-fam')].pop() === s,
      tab:document.querySelector('#cos-tab-themes .cos-seg-n').textContent, rooms:CodisPlanThemes.defs().some(d => /Confirm$/.test(d.id)), fams:CODIS_THEME_FAMILIES.some(f => /confirm/i.test(f.id)),
      ids:[...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i).slice(0, 5), defs:CodisConfirmThemes.defs().map(d => d.id + ':' + d.silver), nT:CodisPlanThemes.defs().length, sw:document.documentElement.scrollWidth, vw:innerWidth }; });
  ok(T + 'S1 store → المظاهر → الثيمات has its own section «ثيمات نوافذ الموافقة» (last, separate from the room families)', st.title === 'ثيمات نوافذ الموافقة' && st.last && !st.inRoomFam, st);
  ok(T + 'S2 four independent product cards (own id/name/price), each with a mini dialog in its own look', st.tiles.length === 4 && IDS.every((id, i) => st.tiles[i].startsWith(id + ':')) && new Set(st.minis).size === 4 && st.defs.join() === IDS.map(id => id + ':' + PRICE[id]).join(), st);
  ok(T + 'S3 not room themes, not a family, tab count includes them, no duplicate ids, no horizontal overflow', !st.rooms && !st.fams && +st.tab.replace(/[^\d]/g, '') === st.nT + 4 && !st.ids.length && st.sw <= st.vw, st);
  const same = await p.evaluate(() => { const b = document.getElementById('eco-store-body'); econRenderStore(); const h0 = b._codisHtml; econRenderStore(); return h0 === b._codisHtml && h0.indexOf('cf-mini') > 0; });
  ok(T + 'S4 store HTML identical across renders', same);
  await shot(p, tag + '_store_section', '#eco-store-body #eco-confirm-themes');

  // (2) المعاينة: نسخة النافذة، بلا معرّفات ولا أفعال ولا صوت نافذة ولا مستمعات متراكمة
  const lc0 = await p.evaluate(() => window.__lc), lcs = [];
  for (const id of IDS) {
    const dj0 = await p.evaluate(() => JSON.stringify(data));
    await p.evaluate(() => { document.querySelectorAll('.peek .peek-scrim').forEach(s => s.click()); }); await p.waitForTimeout(100);
    await p.click('#eco-store-body .cf-tile[data-cfid="' + id + '"] .pt-mbtn'); await p.waitForTimeout(600);
    if (!await p.evaluate(() => !!document.querySelector('.cf-ov'))) await p.evaluate(id => codisCfPreview(id, document.querySelector('.cf-tile[data-cfid="' + id + '"] .pt-mbtn')), id);
    await p.waitForTimeout(300); await p.evaluate(() => { window.__snd = []; });
    const pv = await p.evaluate(id => { const ov = document.querySelector('.cf-ov'); if (!ov) return { none:true }; const s = ov.querySelector('.cfx-pv');
      return { cfx:s && s.getAttribute('data-cfx'), ids:s ? s.querySelectorAll('[id]').length : -1, hidden:s && s.getAttribute('aria-hidden'), title:s && s.querySelector('h3').textContent, msg:s && s.querySelector('.cfx-pv-msg').textContent,
        btns:s ? [...s.querySelectorAll('.modal-actions .btn')].map(b => b.textContent + ':' + b.tabIndex) : [], bg:s && getComputedStyle(s.querySelector('.confirm-modal')).backgroundImage.slice(0, 50),
        price:(ov.querySelector('.pt-ov-price') || {}).textContent || '', act:ov.querySelector('.pt-ov-act').dataset.act, focus:document.activeElement && document.activeElement.className, n:document.querySelectorAll('.cf-ov').length }; }, id);
    ok(T + 'P1 ' + id + ' preview = real dialog structure (title/text/icon/buttons) in its theme, no ids, decorative only, buy action + price', pv.cfx === id && pv.ids === 0 && pv.hidden === 'true' && pv.title === 'تأكيد الحذف' && /لا يمكن التراجع/.test(pv.msg) && pv.btns.join() === 'تأكيد الحذف:-1,إلغاء:-1' && /gradient/.test(pv.bg) && pv.act === 'buy' && pv.n === 1 && /pt-ov-x/.test(pv.focus), pv);
    // ضغط أزرار المعاينة (لمس حقيقي) ⇒ لا شيء يتغير
    const b = await p.$('.cf-ov .cfx-pv .modal-actions .btn-destructive'); if (b) { await b.tap().catch(() => {}); } await p.waitForTimeout(200);
    const b2 = await p.$('.cf-ov .cfx-pv .modal-actions .btn-secondary'); if (b2) { await b2.click().catch(() => {}); } await p.waitForTimeout(300);
    await p.click('.cf-ov .cf-tone-b[data-tone="neutral"]'); await p.waitForTimeout(250);
    const tone = await p.evaluate(() => { const s = document.querySelector('.cf-ov .cfx-pv'); return s && s.querySelector('h3').textContent + '|' + s.querySelector('.modal-actions .btn').className; });
    if (full || id === 'fireConfirm') { await shot(p, tag + '_preview_' + id + '_buy', '.cf-ov .pt-ov-card'); await p.click('.cf-ov .cf-tone-b[data-tone="danger"]'); await p.waitForTimeout(250); await shot(p, tag + '_preview_' + id + '_del', '.cf-ov .cf-stage'); }
    const after = await p.evaluate(() => ({ dj:JSON.stringify(data), snd:window.__snd.slice(), ov:!!document.querySelector('.cf-ov'), confirm:CodisMotion.isOpen(document.getElementById('codis-confirm-modal')) }));
    ok(T + 'P2 ' + id + ' pressing preview buttons (touch + mouse) changes no data, opens no dialog, plays no dialog sound; tone switch shows the purchase variant', after.dj === dj0 && !after.confirm && after.ov && !after.snd.some(x => /dialog|confirm/.test(x)) && /تأكيد الشراء\|btn btn-primary/.test(tone), { snd:after.snd, tone, same:after.dj === dj0 });
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    lcs.push(await p.evaluate(() => window.__lc));
  }
  const lc1 = await p.evaluate(() => ({ lc:window.__lc, ov:document.querySelectorAll('.cf-ov').length, hit:document.querySelectorAll('.cf-hit').length }));
  ok(T + 'P3 after 4 previews opened/closed: overlay removed (Esc), document/window listener count flat after the first cycle (no growth per preview), no leftover effect classes', lc1.ov === 0 && new Set(lcs.slice(1)).size === 1 && lc1.hit === 0, { lc0, lcs, lc1 });

  // (3) الشراء: رصيد غير كافٍ ⇒ رفض؛ كل منتج وحده؛ خصم مرة واحدة؛ لا تكرار
  const poor = await p.evaluate(async () => { const s = CodisWallet.silverBalance(); if (s > 100) CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', -(s - 100), 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; });
    const s0 = CodisWallet.silverBalance(), n0 = CodisWallet.silverTxs().length; let asked = false; const C0 = codisConfirm; codisConfirm = async () => { asked = true; return true; };
    await econConfirmThemeBuy('earthConfirm'); const r = CodisConfirmThemes.buy('earthConfirm'); codisConfirm = C0;
    return { s0, s1:CodisWallet.silverBalance(), dn:CodisWallet.silverTxs().length - n0, asked, r:r.reason, own:CodisConfirmThemes.owns('earthConfirm') }; });
  ok(T + 'B0 insufficient silver: refused before the dialog, nothing debited, not owned', poor.s0 === poor.s1 && poor.dn === 0 && !poor.asked && poor.r === 'insufficient' && !poor.own, poor);
  await grant(p, 20000);
  for (let k = 0; k < IDS.length; k++) {
    const id = IDS[k];
    await p.evaluate(id => codisCfPreview(id, document.querySelector('.cf-tile[data-cfid="' + id + '"] .pt-mbtn')), id); await p.waitForTimeout(400);
    const s0 = await p.evaluate(() => CodisWallet.silverBalance());
    await p.click('.cf-ov .pt-ov-act[data-act="buy"]'); await p.waitForTimeout(700);
    const dlg = await p.evaluate(() => ({ open:CodisMotion.isOpen(document.getElementById('codis-confirm-modal')), cfx:document.getElementById('codis-confirm-modal').getAttribute('data-cfx') || '', t:document.getElementById('codis-confirm-title').textContent }));
    await p.evaluate(id => econConfirmThemeBuy(id), id);   /* ضغطة ثانية أثناء الشراء ⇒ تُتجاهل (econStoreBusy) */
    const okb = await p.$('#codis-confirm-ok'); await okb.click(); await p.waitForTimeout(150); await okb.click({ force:true }).catch(() => {}); await p.waitForTimeout(700);
    const r = await p.evaluate(([id, ids]) => ({ d:0, s:CodisWallet.silverBalance(), txs:CodisWallet.silverTxs().filter(t => t.referenceId === 'confirmtheme|' + id).map(t => t.type + ':' + t.amount), own:ids.map(x => CodisConfirmThemes.owns(x)), eq:CodisConfirmThemes.equippedId(),
      recs:data.inventory.confirmThemes.owned.length, plan:JSON.stringify(data.inventory.planThemes.equippedByTarget), act:(document.querySelector('.cf-ov .pt-ov-act') || {}).dataset }), [id, IDS]);
    r.d = s0 - r.s;
    ok(T + 'B' + (k + 1) + ' buy ' + id + ' alone: real confirm dialog, ' + PRICE[id] + ' debited once (double press ignored), one PURCHASE_COSMETIC, only it owned, not auto-equipped, rooms untouched',
      dlg.open && /الموافقة/.test(dlg.t) && r.d === PRICE[id] && r.txs.join() === 'PURCHASE_COSMETIC:-' + PRICE[id] && r.own.join() === IDS.map((x, i) => i <= k).join() && r.eq === '' && r.recs === k + 1 && /"planning":""/.test(r.plan) && r.act && r.act.act === 'goown', { dlg, r });
    if (k === 0) { const again = await p.evaluate(() => { const s = CodisWallet.silverBalance(), r = CodisConfirmThemes.buy('earthConfirm'); return { r:r.reason, d:s - CodisWallet.silverBalance() }; });
      ok(T + 'B1b owned product cannot be bought again', again.r === 'owned' && again.d === 0, again); }
    await p.evaluate(() => codisCfClose(true)); await p.waitForTimeout(200);
  }
  // (4) التجهيز من «بحوزتك» فقط؛ خانة واحدة
  const ctxRef = await p.evaluate(() => { const r = CodisConfirmThemes.equip('earthConfirm', 'store'); econConfirmThemeToggle('earthConfirm', 'store'); return { r:r.reason, eq:CodisConfirmThemes.equippedId() }; });
  ok(T + 'E0 equipping outside «بحوزتك» is refused', ctxRef.r === 'context' && ctxRef.eq === '', ctxRef);
  await p.evaluate(() => { econOpenVault(); }); await p.waitForTimeout(900);
  await p.evaluate(() => econOwnSetPart('cosmetics', { quiet:true })); await p.waitForTimeout(400);
  const own = await p.evaluate(() => { const s = document.querySelector('#own-panel-cosmetics #own-confirm-themes'); return s ? { n:s.querySelectorAll('.cf-tile').length, count:s.querySelector('.own-sub-n').textContent, tot:econOwnTotals().themes, pl:CodisPlanThemes.owned().length } : { none:true }; });
  ok(T + 'E1 «بحوزتك» → المظاهر lists the 4 owned confirm themes; owned counter includes them', own.n === 4 && +own.count === 4 && own.tot === own.pl + 4, own);
  await shot(p, tag + '_own_section', '#own-panel-cosmetics #own-confirm-themes');
  const flows = [
    ['delete task', "CodisCopy.deleteTask('مراجعة تقرير المبيعات')", 'danger'],
    ['purchase', "CodisCopy.buy('بيتزا', '1,200', '3,400')", 'neutral'],
    ['important action', "({ title:'إنهاء الأسبوع الماضي', icon:'archive', message:'ينحسم الأسبوع الآن بما سجّلته.', confirmText:'إنهاء الأسبوع', danger:false })", 'neutral'],
    ['delete account (irreversible)', "({ title:'حذف الحساب نهائياً؟', message:'سيُحذف حسابك وكل تقدّمك المحفوظ على الخادم، ولا يمكن التراجع.', detail:'لن تستطيع استرجاع البيانات.', irreversible:true, confirmText:'احذف الحساب' })", 'danger'],
    ['finance rows', "({ title:'تستخدم «عشاء»؟', message:'يتسحب 25,000 دينار من محفظتك المالية.', rows:[['رصيدك الحالي', '100,000 د.ع'], ['قيمة المكافأة', '25,000 د.ع', true], ['رصيدك بعد الخصم', '75,000 د.ع']], icon:'check', confirmText:'استخدم واخصم', danger:false })", 'neutral'],
    ['clear notifications', "CodisCopy.clearNotifs(12)", 'danger'],
  ];
  const seen = {};
  for (const id of IDS) {
    const tg = await p.evaluate(id => { const b = document.querySelector('#own-panel-cosmetics .cf-tile[data-cfid="' + id + '"] .pt-mbtn'); codisCfPreview(id, b); return document.querySelector('.cf-ov').dataset.ctx; }, id); await p.waitForTimeout(400);
    await p.click('.cf-ov .pt-ov-act[data-act="equip"]'); await p.waitForTimeout(500);
    const eq = await p.evaluate(() => ({ eq:CodisConfirmThemes.equippedId(), st:document.querySelector('.cf-ov .pt-ov-act').dataset.act, n:document.querySelectorAll('#own-panel-cosmetics .cf-tile.is-on').length, rooms:JSON.stringify(CodisPlanThemes.equippedMap()) }));
    await p.evaluate(() => codisCfClose(true));
    ok(T + 'E2 ' + id + ' equipped from «بحوزتك» (ctx own) — replaces the previous one, exactly one tile marked, room slots untouched', tg === 'own' && eq.eq === id && eq.st === 'unequip' && eq.n === 1 && !/Confirm/.test(eq.rooms), eq);
    const res = [];
    for (const [nm, ex, tone] of flows) {
      const d = await showConfirm(p, ex); res.push(nm + ':' + d.cfx);
      seen[id + nm] = d;
      ok(T + 'A ' + id + ' on «' + nm + '» dialog: themed (sheet/decor/icon/' + tone + ' button), focus ' + (tone === 'danger' ? 'on cancel' : 'on confirm') + ', no overflow',
        d.cfx === id && /gradient/.test(d.bg) && /url|gradient/.test(d.after) && /gradient/.test(d.okBg) && d.focus === (tone === 'danger' ? 'codis-confirm-cancel' : 'codis-confirm-ok') && d.sw <= d.vw, d);
      if (full || id === 'fireConfirm') { if (nm === 'delete task' || nm === 'purchase' || (full && nm === 'finance rows')) { await p.waitForTimeout(1300); await shot(p, tag + '_dlg_' + id + '_' + nm.replace(/\W+/g, '_'), '#codis-confirm-modal .confirm-modal'); } }
      if (nm === 'delete task') {   /* لمسة حقيقية على «إلغاء» ⇒ النتيجة false والنافذة تُغلق والتركيز يرجع */
        const cb = await p.$('#codis-confirm-cancel'); await cb.tap(); await p.waitForTimeout(600);
        const r = await p.evaluate(() => ({ v:window.__cr, open:CodisMotion.isOpen(document.getElementById('codis-confirm-modal')) }));
        ok(T + 'A ' + id + ' tapping cancel resolves false and closes', r.v === false && !r.open, r);
      } else if (nm === 'purchase') {
        await p.evaluate(() => { window.__hit = false; document.getElementById('codis-confirm-ok').addEventListener('pointerdown', e => { setTimeout(() => { window.__hit = e.currentTarget ? e.currentTarget.classList.contains('cf-hit') : document.getElementById('codis-confirm-ok').classList.contains('cf-hit'); }, 0); }, { once:true }); });
        if (+w < 700) await p.tap('#codis-confirm-ok'); else await p.click('#codis-confirm-ok'); await p.waitForTimeout(80); const hit = await p.evaluate(() => window.__hit || document.getElementById('codis-confirm-ok').classList.contains('cf-hit')); await p.waitForTimeout(600);
        const r = await p.evaluate(() => ({ v:window.__cr, open:CodisMotion.isOpen(document.getElementById('codis-confirm-modal')), hit:document.querySelectorAll('.cf-hit').length }));
        ok(T + 'A ' + id + ' clicking confirm resolves true once, shows the press effect, then it is removed', r.v === true && !r.open && hit && r.hit === 0, { r, hit });
      } else if (nm === 'important action') {
        await p.keyboard.press('Escape'); await p.waitForTimeout(500); const r = await p.evaluate(() => ({ v:window.__cr, open:CodisMotion.isOpen(document.getElementById('codis-confirm-modal')) }));
        ok(T + 'A ' + id + ' Escape cancels (resolves false)', r.v === false && !r.open, r);
      } else await closeConfirm(p, false);
    }
    const nt = await showConfirm(p, "({ title:'تعويض محطات السبعة أيام', message:'رسالة', icon:'info', danger:false, confirmText:'تمام', notice:true })"); await closeConfirm(p, true);
    ok(T + 'A ' + id + ' informational notice (notice:true) keeps the original look', nt.cfx === '', nt);
  }
  ok(T + 'A themes are visually distinct (sheet, button, radius differ between all four)', new Set(IDS.map(id => seen[id + 'delete task'].bg + seen[id + 'delete task'].radius)).size === 4 && new Set(IDS.map(id => seen[id + 'purchase'].okBg)).size === 4);
  // نطاق: لا شيء خارج نافذة الموافقة يتأثر
  const scope = await p.evaluate(() => { const marked = [...document.querySelectorAll('[data-cfx]')].filter(e => e.id !== 'codis-confirm-modal' && !e.closest('#eco-confirm-themes, #own-confirm-themes, .cf-ov'));
    const pick = sel => { const e = document.querySelector(sel); if (!e) return ''; const c = getComputedStyle(e); return [c.backgroundImage.slice(0, 40), c.backgroundColor, c.color, c.borderRadius].join('|'); };
    return { marked:marked.length, sig:['#eco-own-sheet', '.pt-mtile .pt-mbtn', '.modal-overlay:not(#codis-confirm-modal) .modal', '#toast', '.navbtn'].map(pick).join('#') }; });
  const scopeOff = await p.evaluate(() => { CodisConfirmThemes.unequip('own'); const pick = sel => { const e = document.querySelector(sel); if (!e) return ''; const c = getComputedStyle(e); return [c.backgroundImage.slice(0, 40), c.backgroundColor, c.color, c.borderRadius].join('|'); };
    const s = ['#eco-own-sheet', '.pt-mtile .pt-mbtn', '.modal-overlay:not(#codis-confirm-modal) .modal', '#toast', '.navbtn'].map(pick).join('#'); CodisConfirmThemes.equip('windConfirm', 'own'); return s; });
  ok(T + 'N1 only the confirm dialog carries data-cfx; other modals/sheets/tiles/toast/nav compute identically with and without the theme', scope.marked === 0 && scope.sig === scopeOff, { scope, scopeOff });
  // ثيمات الغرف لا تتأثر والعكس
  const rooms = await p.evaluate(() => { const r = CodisPlanThemes.equip('infernoCrystal', 'own'); return { r:!!r.ok || r.reason, cf:CodisConfirmThemes.equippedId(), map:CodisPlanThemes.equippedMap().planning }; });
  ok(T + 'N2 room theme equip and confirm theme equip are independent slots', rooms.cf === 'windConfirm' && (rooms.map === '' || rooms.map === 'infernoCrystal'), rooms);
  // (5) الإزالة ⇒ الأصل حرفياً
  await p.evaluate(() => { const b = document.querySelector('#own-panel-cosmetics .cf-tile[data-cfid="windConfirm"] .pt-mbtn'); codisCfPreview('windConfirm', b); }); await p.waitForTimeout(400);
  await p.click('.cf-ov .pt-ov-act[data-act="unequip"]'); await p.waitForTimeout(500); await p.evaluate(() => codisCfClose(true));
  await p.evaluate(() => { try { if (econOwnOpen) econCloseOwn(); } catch (e) {} try { econCloseStore({ silent:true }); } catch (e) {} }); await p.waitForTimeout(500);
  const sig1 = await (async () => { await showConfirm(p, "CodisCopy.deleteTask('مهمة')"); const s = await csig(p); await closeConfirm(p, false); return s; })();
  ok(T + 'U1 unequip ⇒ the dialog computes exactly as the original (all elements, pseudo layers)', sig1 === sig0 && await p.evaluate(() => CodisConfirmThemes.equippedId() === ''), sig1 === sig0 ? '' : { a:sig0.split('\n').filter(x => !sig1.includes(x)).slice(0, 4), b:sig1.split('\n').filter(x => !sig0.includes(x)).slice(0, 4) });
  // (6) إعادة التحميل: الملكية والتجهيز باقيان
  await p.evaluate(() => { econOwnOpen && econCloseOwn(); econCloseStore({ silent:true }); CodisConfirmThemes.equip('fireConfirm', 'own'); saveData(); }); await p.waitForTimeout(400);
  await o.boot();
  const rl = await p.evaluate(() => ({ own:CodisConfirmThemes.owned().map(d => d.id).join(), eq:CodisConfirmThemes.equippedId(), txs:CodisWallet.silverTxs().filter(t => /^confirmtheme\|/.test(t.referenceId)).length }));
  const rd = await showConfirm(p, "CodisCopy.deleteTask('x')"); await closeConfirm(p, false);
  ok(T + 'R1 after reload: 4 owned, fire still equipped and applied, 4 purchase txs (no duplicates)', rl.own === IDS.join() && rl.eq === 'fireConfirm' && rl.txs === 4 && rd.cfx === 'fireConfirm', { rl, rd:rd.cfx });
  // (7) ملكية من معاملة محفوظة بلا سجل (heal) + بيانات مشوّهة
  const heal = await p.evaluate(() => { data.inventory.confirmThemes.owned = data.inventory.confirmThemes.owned.filter(x => x.id !== 'waterConfirm'); const n = CodisConfirmThemes.heal(); return { n, own:CodisConfirmThemes.owns('waterConfirm') }; });
  ok(T + 'R2 heal(): ownership restored from the saved purchase transaction without a new debit', heal.n === 1 && heal.own, heal);
  if (full) {
    for (const [nm, bad, expect] of [['garbage', { owned:'x', equipped:5 }, '{"owned":[],"equipped":""}'], ['array', [1, 2], '{"owned":[],"equipped":""}'],
      ['future+dupe+unowned equip', { owned:[{ id:'futureConfirm', paid:9 }, { id:'earthConfirm' }, { id:'earthConfirm' }, { id:'bad id!' }], equipped:'waterConfirm' }, 'future,earth,']]) {
      await p.evaluate(b => { data.inventory.confirmThemes = b; saveData(); }, bad); await p.waitForTimeout(300);
      await o.boot();
      const r = await p.evaluate(() => { const t = data.inventory.confirmThemes; return { j:JSON.stringify(t), short:t.owned.map(x => x.id.replace('Confirm', '')).join() + ',' + t.equipped, eq:CodisConfirmThemes.equippedId(), ui:!!document.querySelector('.navbtn') }; });
      ok(T + 'D odd stored confirmThemes (' + nm + ') boots fine and normalizes safely', r.ui && (expect.startsWith('{') ? r.j === expect : r.short === expect), r);
      const dd = await showConfirm(p, "CodisCopy.deleteTask('x')"); await closeConfirm(p, false);
      ok(T + 'D (' + nm + ') dialog still works, original look', dd.cfx === '' && !!dd.okC, dd.cfx);
    }
  }
  const dup = await p.evaluate(() => [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i));
  ok(T + 'Z no duplicate DOM ids; no JS errors', !dup.length && !o.errs.length, { dup, errs:o.errs.slice(0, 5) });
  await o.close();
}

// تقليل الحركة: النافذة ثابتة بحالتها النهائية
{ const o = await open(375, 'paper', { reduced:true }); const p = o.page;
  await p.evaluate(() => { CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 9000, 'qa', 'admin', 'qa|rm', null); return { ok:true }; }); CodisConfirmThemes.buy('waterConfirm'); CodisConfirmThemes.equip('waterConfirm', 'own'); });
  const d = await showConfirm(p, "CodisCopy.deleteTask('x')");
  const an = await p.evaluate(() => { const m = document.getElementById('codis-confirm-modal'); const sh = m.querySelector('.confirm-modal'), ic = document.getElementById('codis-confirm-icon');
    return [getComputedStyle(sh, '::after').animationName, getComputedStyle(ic).animationName, getComputedStyle(ic, '::after').animationName, getComputedStyle(sh, '::after').opacity]; });
  await p.click('#codis-confirm-ok'); await p.waitForTimeout(100); const hit = await p.evaluate(() => document.querySelectorAll('.cf-hit').length);
  ok('reduced-motion: themed dialog still applied, no entrance/decor/press animations, decor fully visible', d.cfx === 'waterConfirm' && an.slice(0, 3).every(x => x === 'none') && an[3] === '1' && hit === 0, { an, hit });
  await o.close(); }

console.log('\n' + pass + ' passed, ' + fail + ' failed'); srv.close(); process.exit(fail ? 1 : 0);
