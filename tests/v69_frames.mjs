/* CODIS-V69 — لقطات حتمية لتسلسل كل بداية (WebKit iPhone): تُوقف كل الحركات وتُضبط على أزمنة محددة. لا PASS/FAIL — للمراجعة البصرية.
   PW=<playwright-core/index.mjs> SHOTS=<dir> [THEME=dark] [W=375 H=812] node tests/v69_frames.mjs */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const { webkit, devices } = await import(pathToFileURL(process.env.PW).href);
const OUT = process.env.SHOTS; fs.mkdirSync(OUT, { recursive:true });
const W = +(process.env.W || 375), H = +(process.env.H || 812), T = (process.env.T || '150,450,750,1050,1350,1650,2000').split(',').map(Number);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'v69f-'));
const ctx = await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'], viewport:{ width:W, height:H }, screen:{ width:W, height:H } }); const p = ctx.pages()[0];
await p.goto(process.env.URL || 'http://127.0.0.1:8766/app/CODIS_FINAL.html');
for (let i = 0; i < 300; i++) { if (await p.evaluate(() => !!(window.codisBootState && codisBootState.revealed))) break; await p.waitForTimeout(100); }
if (await p.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await p.click('#gate-guest'); await p.waitForTimeout(1200); }
await p.evaluate(t => CodisTheme.set(t), process.env.THEME || 'paper').catch(() => {}); await p.waitForTimeout(800);
await p.evaluate(() => { CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 20000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; }); CodisRoomIntros.defs().forEach(d => CodisRoomIntros.buy(d.id)); });
for (const room of ['planning', 'tasks', 'learn', 'habits']) {
  await p.evaluate(() => navigateToPage('settings')); await p.waitForTimeout(300);
  await p.evaluate(r => { navigateToPage(r); const L = codisRiLive; L.timers.forEach(clearTimeout); L.timers.length = 0; L.el.classList.add('is-in'); L.el.style.transition = 'none';
    window.__anims = L.el.getAnimations({ subtree:true }); window.__anims.forEach(a => a.pause()); }, room);
  const files = [];
  for (const t of T) { await p.evaluate(t => { __anims.forEach(a => { a.currentTime = t; }); }, t); await p.waitForTimeout(250); const f = path.join(OUT, room + '_' + t + '.png'); await p.screenshot({ path:f }); files.push(f); }
  await p.evaluate(() => codisRoomIntroStop(true));
}
await ctx.close(); console.log('frames written');
