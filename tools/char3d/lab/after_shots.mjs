/* لقطات «بعد» بنفس تأطير لقطات V72 «قبل» (من التطبيق نفسه، GPU) */
import { pathToFileURL } from 'url'; import { writeFileSync, mkdirSync } from 'fs';
const { chromium } = await import(pathToFileURL(process.env.PW || (process.env.TEMP + "/pw/node_modules/playwright-core/index.mjs")).href);   /* PW=<playwright-core/index.mjs> node after_shots.mjs <out> [url] */
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await br.newPage({ viewport: { width: 1000, height: 1100 } });
await p.goto(process.argv[3] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html'); await p.waitForTimeout(3000);
await p.evaluate(() => { window.CODIS_CHAR_TIER = 'hi'; try { document.getElementById('codis-gate').remove(); } catch (e) {} const h = document.createElement('div'); h.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:800px;z-index:99999'; document.body.appendChild(h); window.__v = CodisChar.mount(h, { idle: false, yaw: 0 }); });
const jobs = [];
for (const sex of ['male', 'female']) {
  for (const [nm, yaw, z, f, sz, asp] of [['body_front', 0, 0, 'body', 1000, .6], ['body_45', -.785, 0, 'body', 1000, .6], ['body_side', 1.5708, 0, 'body', 1000, .6], ['body_back', 3.1416, 0, 'body', 1000, .6],
    ['face_front', 0, 1, 'face', 800, 1], ['face_45', -.6, 1, 'face', 800, 1], ['face_side', -1.5708, 1, 'face', 800, 1], ['eyes', 0, 1, 'eyes', 560, 1.6], ['hair_back', 2.6, 1, 'hair', 800, 1]])
    jobs.push([sex + '_' + nm, sex, { focus: f, z, yaw, size: sz, aspect: asp }]);
}
for (const [name, sex, o] of jobs) {
  const u = await p.evaluate(([sex, o]) => window.__v.snapshot(CodisChar.spec(Object.assign({ body: sex }, CodisChar.DEFS.defaults[sex])), o), [sex, o]);
  writeFileSync(out + '/' + name + '.png', Buffer.from(u.split(',')[1], 'base64'));
}
await br.close(); console.log('after', jobs.length);
