/* CODIS-V72 — لقطات كل مراحل منشئ الشخصية (WebKit iPhone) بالمظهرين وبعرضين — للمراجعة البصرية فقط.
   PW=<playwright-core/index.mjs> SHOTS=<مجلد> node tests/v72_shots.mjs [url] */
import { pathToFileURL } from 'url';
const { webkit, devices } = await import(pathToFileURL(process.env.PW).href);
const url = process.argv[2] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html', OUT = process.env.SHOTS;
const br = await webkit.launch(), errs = [];
async function until(p, fn, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await p.evaluate(fn)) return true; } catch (e) {} await p.waitForTimeout(300); } return false; }
for (const [theme, w, h, sex] of [['paper', 390, 844, 'male'], ['dark', 390, 844, 'female'], ['paper', 320, 640, 'female'], ['dark', 320, 640, 'male']]) {
  const ctx = await br.newContext({ ...devices['iPhone 12'], viewport: { width: w, height: h } }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript({ content: "try{localStorage.setItem('codis_theme_v1','" + theme + "')}catch(e){}" });
  await p.goto(url); await p.waitForTimeout(3000);
  await p.evaluate(() => { try { const g = document.getElementById('codis-gate'); if (g) g.remove(); } catch (e) {} navigateToPage('settings'); codisCharOpen('create'); });
  await until(p, () => !!(codisChx && codisChx.ready), 90000);
  if (sex === 'female') { await p.click('.chx-opt[data-k="body"][data-v="female"]'); await p.waitForTimeout(1500); }
  const n = await p.evaluate(() => codisChxSteps(codisChx).length);
  for (let i = 0; i < n; i++) {
    await p.evaluate(k => codisChxStep(k), i); await p.waitForTimeout(600);
    await until(p, () => ![...document.querySelectorAll('.chx-opt .chx-thumb')].some(x => x.querySelector('.chx-ph')), 60000);
    await p.waitForTimeout(400);
    const key = await p.evaluate(() => document.getElementById('codis-char').dataset.step);
    await p.screenshot({ path: OUT + '/' + theme + w + '_' + sex + '_' + i + '_' + key + '.png' });
    if (key === 'face') { await p.evaluate(() => { const d = document.querySelector('.chx-acc'); if (d) d.open = true; const pn = document.querySelector('.chx-panel'); pn.scrollTop = 99999; }); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/' + theme + w + '_' + sex + '_' + i + '_face_adv.png' }); }
  }
  await ctx.close();
}
await br.close(); console.log('errors', errs.slice(0, 5));
