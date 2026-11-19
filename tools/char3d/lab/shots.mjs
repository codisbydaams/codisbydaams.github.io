/* لقطات المختبر: node shots.mjs <jobs.json> <outdir>   (PW=<playwright-core/index.mjs>)
   jobs = [{name, cfg, yaw, z}]  ← صورة PNG لكل لقطة */
import { readFileSync, mkdirSync } from 'fs';
import { pathToFileURL } from 'url';
const { chromium } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
const [jobsF, out] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const jobs = JSON.parse(readFileSync(jobsF, 'utf8'));
const br = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await br.newPage({ viewport: { width: 600, height: 900 } }), errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await p.goto(process.env.LAB || 'http://127.0.0.1:8766/tools/char3d/lab/lab.html'); await p.waitForFunction(() => window.V);
for (const j of jobs) {
  if (j.size) await p.evaluate(s => { const h = document.getElementById('h'); h.style.width = s[0] + 'px'; h.style.height = s[1] + 'px'; V.resize(); }, j.size);
  await p.evaluate(j => shot(j.cfg, j.yaw || 0, j.z || 0, j.focus), j);
  await p.locator('#h').screenshot({ path: out + '/' + j.name + '.png' });
}
if (errs.length) console.log('ERRORS', errs.slice(0, 10));
await br.close(); console.log('shots', jobs.length);
