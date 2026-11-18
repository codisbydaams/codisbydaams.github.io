/* CODIS-V71 — الشخصية ثلاثية الأبعاد: اختبار متصفح حقيقي (WebKit بملف iPhone 12 + Chromium إن وُجد، وشاشة كبيرة).
   تشغيل (كبقية اختبارات WebKit):  cp tests/v71_char.mjs %TEMP%/pw/ && node %TEMP%/pw/v71_char.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html
   SHOTS=<مجلد> لحفظ لقطات المراحل. يفشل (exit 1) على أي خطأ صفحة أو شرط غير متحقق. */
import { webkit, chromium, devices } from 'playwright-core';
const url = process.argv[2] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html';
const SHOTS = process.env.SHOTS || '';
let bad = 0, n = 0;
const ok = (c, m, x) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); };
const W = ms => new Promise(r => setTimeout(r, ms));
async function run(label, launcher, ctxOpts) {
  let br; try { br = await launcher.launch(launcher === chromium ? { executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] } : {}); } catch (e) { console.log('SKIP ' + label + ' (' + e.message.split('\n')[0] + ')'); return; }
  const ctx = await br.newContext(ctxOpts), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(3000);
  await p.evaluate(() => { try { const g = document.getElementById('codis-gate'); if (g) g.remove(); } catch (e) {} navigateToPage('settings'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => openSettingsCategory('character')); await p.waitForTimeout(700);
  ok(await p.evaluate(() => !!document.querySelector('#char-root .chp-empty')), label + ': empty state on «شخصيتي» when no character');
  ok(await p.evaluate(() => document.getElementById('home-char-state').textContent === 'غير منشأة'), label + ': settings badge says none');
  const gl = await p.evaluate(() => CodisChar.available());
  console.log('INFO ' + label + ': WebGL path available = ' + gl + (gl ? '' : ' (why: ' + await p.evaluate(() => CodisChar.why()) + ')'));
  await p.evaluate(() => codisCharOpen('create'));
  if (gl) { await p.waitForFunction(() => codisChx && codisChx.ready, null, { timeout: 30000 }).catch(() => {}); }
  await p.waitForTimeout(800);
  const st0 = await p.evaluate(() => ({ open: !!document.getElementById('codis-char'), ready: codisChx && codisChx.ready, flat: document.getElementById('codis-char').classList.contains('is-flat'), canv: document.querySelectorAll('canvas.ch3-cv').length }));
  ok(st0.open && (gl ? st0.ready && st0.canv === 1 : st0.flat), label + ': creator open (' + (gl ? '3D ready, 1 canvas' : 'no-WebGL fallback') + ')', st0);
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_1_body.png' });
  /* الجسم كاملاً داخل الإطار: إسقاط صندوق الجسم على الشاشة */
  if (gl) {
    const fit = await p.evaluate(() => { const v = CodisChar.current(), B = v.cur, c = v.camera, b = B.box; v.frame(0); const pts = [[0, b.min.y, 0], [0, b.max.y, 0], [b.min.x, (b.min.y + b.max.y) / 2, 0], [b.max.x, (b.min.y + b.max.y) / 2, 0]].map(q => { const V = new c.position.constructor(q[0], q[1], q[2]).project(c); return [V.x, V.y]; }); return pts.every(q => Math.abs(q[0]) <= 1 && Math.abs(q[1]) <= 1) ? 'inside' : JSON.stringify(pts); });
    ok(fit === 'inside', label + ': full body (head→feet, arms) inside the camera frame', fit);
    const cv = await p.$('canvas.ch3-cv'), bb = await cv.boundingBox(), y0 = await p.evaluate(() => CodisChar.current().yaw);
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 + 120, bb.y + bb.height / 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
    const y1 = await p.evaluate(() => CodisChar.current().yaw);
    ok(Math.abs(y1 - y0) > .5, label + ': drag rotates the character (pointer events)', { y0, y1 });
    await p.click('[data-chx="zin"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => CodisChar.current().zoomT > .3), label + ': zoom-in button');
    await p.click('[data-chx="zout"]');
  }
  await p.click('.chx-opt[data-v="female"]'); await p.waitForTimeout(gl ? 2500 : 200);
  ok(await p.evaluate(() => codisChx.sel.body === 'female' && (!CodisChar.current() || CodisChar.current().cur.name === 'female')), label + ': female body selected and shown');
  await p.click('[data-chx="next"]'); await p.waitForTimeout(gl ? 3500 : 300);
  ok(await p.evaluate(() => document.getElementById('codis-char').dataset.step === 'face' && document.querySelectorAll('.chx-opt.is-face').length === 4), label + ': face step with 4 faces');
  if (gl) ok(await p.evaluate(() => document.querySelectorAll('.chx-opt.is-face img').length >= 2), label + ': face cards get real 3D thumbnails');
  if (gl) {
    const d = await p.evaluate(() => { const v = CodisChar.current(), g = v.cur.body.geometry, a = g.morphAttributes.position; let mx = 0; for (const at of a) for (let i = 0; i < at.array.length; i++) mx = Math.max(mx, Math.abs(at.array[i])); return mx; });
    await p.click('.chx-opt[data-v="f2"]'); await p.waitForTimeout(500);
    const inf = await p.evaluate(() => { const v = CodisChar.current(); return Array.from(v.cur.body.morphTargetInfluences); });
    ok(d > .005 && inf.filter(x => x === 1).length === 1, label + ': face = real morph target on the mesh (max displacement m)', { d, inf });
  } else await p.click('.chx-opt[data-v="f2"]');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_2_face.png' });
  await p.click('[data-chx="next"]'); await p.waitForTimeout(gl ? 3500 : 300);
  ok(await p.evaluate(() => document.querySelectorAll('.chx-opt.is-hair').length >= 4), label + ': ≥4 hairstyles for female');
  await p.click('.chx-opt[data-v="short"]'); await p.waitForTimeout(600);
  if (gl) ok(await p.evaluate(() => CodisChar.current().hairNow.map(m => m.name).join() === 'Hair_BuzzedFemale'), label + ': hair mesh swapped on the head bone');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_3_hair.png' });
  await p.click('[data-chx="next"]'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelectorAll('.chx-opt.is-color').length >= 6), label + ': ≥6 hair colours');
  await p.click('.chx-opt[data-v="blonde"]'); await p.waitForTimeout(300);
  if (gl) ok(await p.evaluate(() => { const v = CodisChar.current(); return v.hairMats[0].color.getHexString() !== '000000' && Math.abs(v.hairMats[0].color.r - v.hairMats[0].color.b) > .2; }), label + ': hair colour applied to material');
  await p.click('[data-chx="prev"]'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.querySelector('.chx-opt.is-on').dataset.v === 'short'), label + ': going back keeps choices');
  await p.click('[data-chx="next"]'); await p.waitForTimeout(300); await p.click('[data-chx="next"]'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.getElementById('codis-char').dataset.step === 'review' && /أنثى/.test(document.querySelector('.chx-sum').innerText) && /أشقر/.test(document.querySelector('.chx-sum').innerText)), label + ': review summary');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_4_review.png' });
  await p.click('[data-chx="next"]'); await p.waitForTimeout(800);
  const saved = await p.evaluate(() => ({ open: !!codisChx, ch: data.profile && data.profile.character, ls: JSON.parse(localStorage.getItem(STORE_KEY)).profile.character, canv: document.querySelectorAll('canvas.ch3-cv').length }));
  ok(!saved.open && saved.ch && saved.ch.body === 'female' && saved.ch.face === 'f2' && saved.ch.hair === 'short' && saved.ch.color === 'blonde' && saved.ls && saved.ls.hair === 'short', label + ': saved to data.profile.character + localStorage', saved.ch);
  await p.reload(); await p.waitForTimeout(3500);
  await p.evaluate(() => { const g = document.getElementById('codis-gate'); if (g) g.remove(); navigateToPage('settings'); }); await p.waitForTimeout(300);
  await p.evaluate(() => openSettingsCategory('character')); await p.waitForTimeout(gl ? 4000 : 600);
  const pg = await p.evaluate(() => ({ info: (document.querySelector('.chp-info') || {}).innerText || '', ready: !!CodisChar.current() && !!CodisChar.current().cur, ch: data.profile.character }));
  ok(/أنثى/.test(pg.info) && /قلبي/.test(pg.info) && /أشقر/.test(pg.info) && (!gl || pg.ready), label + ': after reload «شخصيتي» shows the saved character', pg.info.replace(/\n/g, ' | '));
  if (SHOTS) await p.screenshot({ path: SHOTS + '/' + label + '_5_page.png', fullPage: true });
  await p.evaluate(() => showSettingsHome(true)); await p.waitForTimeout(1000);
  ok(await p.evaluate(() => !CodisChar.current() && document.querySelectorAll('canvas.ch3-cv').length === 0), label + ': leaving the page disposes the viewer (no canvas, no loop)');
  ok(!errs.length, label + ': no page errors', errs.slice(0, 3));
  await br.close();
}
await run('webkit-iphone12', webkit, { ...devices['iPhone 12'] });
await run('chromium-desktop', chromium, { viewport: { width: 1280, height: 800 } });
console.log(bad ? bad + '/' + n + ' FAILED' : 'ALL ' + n + ' PASSED'); process.exit(bad ? 1 : 0);
