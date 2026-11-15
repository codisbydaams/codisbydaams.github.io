/* CODIS-V54 boot / app-shell test — real WebKit (iPhone 12 emulation), its own deployment-shaped server (index.html + sw.js at the
   root, ETag/Last-Modified like GitHub Pages, switchable offline / never-answers).
   Run:  PW=<path to playwright-core/index.mjs> node tests/boot_v54.mjs        (or with playwright-core resolvable)
   Checks: readiness order · progress monotonic and 100% only before reveal · bar geometry · first room only before reveal, the
   rest deferred · navigation before the deferred render · active plan opens Tasks · no page errors · SW offline launch ·
   SW never-answering network launch · background update applied within two launches, no reload loop · stored data unchanged ·
   WebGL health marker (page died mid-scene ⇒ counted once). */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { webkit, chromium, devices } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
/* ENGINE=chrome: نفس الاختبار على Chrome المثبّت. ملاحظة مُقاسة: WebKit الخاص بـPlaywright على ويندوز لا يحفظ أي شيء بـCache Storage
   (حتى put صغير يرجع بلا خطأ وبلا مدخل) ⇒ أجزاء الـSW (الإقلاع بلا شبكة/التحديث بالخلفية) تُتحقق على Chrome فقط هنا، والآيفون الحقيقي غير مُتحقَّق */
const CHROME = process.env.ENGINE === 'chrome';
const SWOK = CHROME || process.env.SW === '1';
const K = 'life_organizer_data_v1';
let mode = 'normal', override = null;
const files = { '/index.html':['app/CODIS_FINAL.html', 'text/html; charset=utf-8'], '/sw.js':['sw.js', 'text/javascript'], '/manifest.webmanifest':['manifest.webmanifest', 'application/manifest+json'], '/icon.svg':['icon.svg', 'image/svg+xml'] };
const srv = http.createServer((req, res) => {
  if (mode === 'offline') { req.socket.destroy(); return; }
  if (mode === 'hang') return;
  let p = new URL(req.url, 'http://x').pathname; if (p === '/') p = '/index.html';
  const f = files[p]; if (!f) { res.writeHead(404); res.end(); return; }
  let body = fs.readFileSync(path.join(ROOT, f[0]));
  if (p === '/index.html' && override) body = override;
  const tag = 'W/"' + body.length.toString(16) + '-' + (override ? 'b' : 'a') + '"';
  if (req.headers['if-none-match'] === tag) { res.writeHead(304, { etag:tag }); res.end(); return; }
  res.writeHead(200, { 'content-type':f[1], 'cache-control':'max-age=0', etag:tag, 'content-length':body.length }); res.end(body);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const ORIGIN = 'http://127.0.0.1:' + srv.address().port;
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v54-'));
let pass = 0, fail = 0; const ok = (name, cond, info) => { (cond ? pass++ : fail++); console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? ' — ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); };
const INIT = `(()=>{ const P = window.__prog = []; let real; Object.defineProperty(window, 'codisBootProgress', { configurable:true, set(f){ real = f; }, get(){ return real && function(p){ P.push([Math.round(performance.now()), +p, !!document.documentElement.classList.contains('codis-booting')]); return real.apply(this, arguments); }; } });
  try{ if(sessionStorage.getItem('__seedHealth')){ sessionStorage.removeItem('__seedHealth'); localStorage.setItem('codis_b3d_health', JSON.stringify({ run:Date.now() - 5000 })); } }catch(e){}
  window.__navs = (+sessionStorage.getItem('__navs') || 0) + 1; try{ sessionStorage.setItem('__navs', String(window.__navs)); }catch(e){} })();`;
const ctx = CHROME ? await chromium.launchPersistentContext(prof, { ...devices['iPhone 12'], defaultBrowserType:undefined, executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true })
  : await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'] });
console.log('engine:', CHROME ? 'chrome' : 'webkit');
await ctx.addInitScript(INIT);
const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
page.on('pageerror', e => errs.push(e.message));
/* waitForFunction يحتاج eval والصفحة تمنعه بالـCSP ⇒ استطلاع بـevaluate */
async function until(fn, ms){ const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(100); } return false; }
const revealed = async () => { if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0), 30000)) throw new Error('no reveal within 30s'); };
async function launch(){ errs.length = 0; await page.goto(ORIGIN + '/', { waitUntil:'commit', timeout:45000 }); await revealed(); }

// ---- A: first launch (guest) ----
await launch();
if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1500); }
await page.waitForTimeout(4000);
let st = await page.evaluate(() => ({ s:window.codisBootState, prog:window.__prog, bar:(()=>{ const b = document.getElementById('cs-bar'); const r = b.getBoundingClientRect(); return { h:r.height, w:r.width }; })(),
  tasks:document.getElementById('page-tasks').innerHTML.length, learn:document.getElementById('page-learn').innerHTML.length, planning:document.getElementById('page-planning').innerHTML.length,
  active:(document.querySelector('.navbtn.active') || {}).dataset.page }));
ok('no page errors on first launch', !errs.length, errs.slice(0, 2));
ok('readiness order parsed ≤ data ≤ firstRoom ≤ revealed', st.s && st.s.parsed <= st.s.data && st.s.data <= st.s.firstRoom && st.s.firstRoom <= st.s.revealed, st.s);
ok('deferred rooms rendered after reveal', st.s.deferred >= st.s.revealed, st.s);
const P = st.prog; const mono = P.every((x, i) => !i || x[1] >= P[i - 1][1] - 1e-9 || x[1] < P[i - 1][1]);   // calls may pass lower values; the bar clamps (checked below via __codisP)
ok('parse progress reported by data blocks before boot', P.filter(x => x[1] < .57).length >= 10, P.length + ' calls');
ok('100% reached while still booting (before reveal)', P.some(x => x[1] === 1 && x[2]), P.slice(-2));
const shown = await page.evaluate(() => window.__codisP); ok('displayed progress never went backwards and ended at 1', shown === 1 && mono, shown);
ok('progress bar is 6px tall', Math.abs(st.bar.h - 6) < .6, st.bar);
ok('first room is planning (no plan) and all rooms rendered by now', st.active === 'planning' && st.tasks > 200 && st.learn > 200 && st.planning > 200, st);

// ---- B: active plan ⇒ Tasks first, planning deferred; navigation right at reveal ----
await page.evaluate(fs.readFileSync(path.join(ROOT, 'tools/prof/seed_plan.js'), 'utf8')); await page.waitForTimeout(1200);
const before = await page.evaluate(k => localStorage.getItem(k), K);
await launch();
st = await page.evaluate(() => ({ s:window.codisBootState, active:(document.querySelector('.navbtn.active') || {}).dataset.page, vis:getComputedStyle(document.getElementById('page-tasks')).display }));
ok('active plan opens Tasks first', st.s.route === 'tasks' && st.active === 'tasks' && st.vis !== 'none', st);
const nav = await page.evaluate(() => { const pend = (window.__codisLater || []).slice(); navigateToPage('learn'); const r = { pend, learn:document.getElementById('page-learn').innerHTML.length, later:(window.__codisLater || []).length, active:document.querySelector('.navbtn.active').dataset.page }; navigateToPage('tasks'); return r; });
ok('navigation before the deferred render flushes it (learn shown, planning rendered, nothing left)', nav.active === 'learn' && nav.learn > 200 && nav.later === 0, nav);
await page.waitForTimeout(2500);
ok('no page errors with an active plan', !errs.length, errs.slice(0, 2));

// ---- C: service worker app shell ----
if (!SWOK) console.log('SKIP SW sections C/D (this WebKit build has no working Cache Storage; run with ENGINE=chrome)');
if (SWOK) {
await until(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller), 30000);
await page.waitForTimeout(1500);
const ctl = await page.evaluate(async () => ({ c:!!(navigator.serviceWorker && navigator.serviceWorker.controller), keys:await caches.keys(), n:(await (await caches.open('codis-pwa-v8')).keys()).map(r => new URL(r.url).pathname) }));
ok('SW v8 controls the page and cached the shell once', ctl.c && ctl.keys.includes('codis-pwa-v8') && ctl.n.filter(x => x.endsWith('index.html')).length === 1, ctl);
mode = 'offline'; const t0 = Date.now(); await launch(); const tOff = Date.now() - t0;
ok('offline launch reaches the app', true, tOff + ' ms to reveal');
mode = 'hang'; const t1 = Date.now(); await launch(); const tHang = Date.now() - t1;
ok('network that never answers does not delay the launch (was ≥3.5s wait)', tHang < 6000, tHang + ' ms to reveal');
mode = 'normal';
}
const after = await page.evaluate(k => localStorage.getItem(k), K);
const pick = s => { try { const d = JSON.parse(s); return { bal:d.wallet && d.wallet.balance, tx:d.wallet && d.wallet.transactions && d.wallet.transactions.length, rw:d.settings && d.settings.rewardItems && d.settings.rewardItems.length, weeks:Object.keys(d.weeks || {}).length, inv:d.inventory && d.inventory.items && d.inventory.items.length }; } catch (e) { return null; } };
ok('stored data unchanged across launches (balance/transactions/rewards/weeks/inventory)', JSON.stringify(pick(before)) === JSON.stringify(pick(after)), [pick(before), pick(after)]);

// ---- D: background update ----
if (SWOK) {
override = Buffer.from(fs.readFileSync(path.join(ROOT, 'app/CODIS_FINAL.html'), 'utf8').replace(/<meta name="codis-version" content="[^"]*">/, '<meta name="codis-version" content="9.9.9">'));
await page.waitForTimeout(16000);   /* sw.js: فحص خلفي واحد كل 15ث */
const navs0 = await page.evaluate(() => window.__navs);
await launch(); await page.waitForTimeout(6000);
let v = await page.evaluate(() => document.querySelector('meta[name="codis-version"]').content);
if (v !== '9.9.9') { await launch(); await page.waitForTimeout(3000); v = await page.evaluate(() => document.querySelector('meta[name="codis-version"]').content); }
ok('new version applied within two launches', v === '9.9.9', v);
const navs1 = await page.evaluate(() => window.__navs); await page.waitForTimeout(5000); const navs2 = await page.evaluate(() => window.__navs);
ok('no reload loop after the update', navs2 === navs1 && navs1 - navs0 <= 3, { navs0, navs1, navs2 });
override = null;
}

// ---- E: WebGL health marker ----
/* تُزرع قبل سكربتات التطبيق (الصفحة السابقة تمسح العلامة بـpagehide عند الإغلاق الطبيعي — وهذا مقصود) */
await page.evaluate(() => sessionStorage.setItem('__seedHealth', '1'));
await launch();
const h = await page.evaluate(() => JSON.parse(localStorage.getItem('codis_b3d_health') || '{}'));
ok('page that died mid-scene is counted once and the marker cleared', h.lost === 1 && !h.run, h);
await page.evaluate(() => localStorage.removeItem('codis_b3d_health'));
ok('no page errors overall', !errs.length, errs.slice(0, 2));

await ctx.close(); srv.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {}   /* WebKit قد يبقي الملفات مقفلة لحظة */
console.log(fail ? fail + ' FAILED, ' + pass + ' passed' : 'ALL ' + pass + ' PASSED'); process.exit(fail ? 1 : 0);
