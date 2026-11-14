// CODIS-BOX3D end-to-end QA (Chromium + WebKit). يحتاج: npm i playwright-core@1.49.1 (بمجلد مؤقت) + خادم ساكن لجذر المشروع.
//   node tests/box3d_e2e.mjs [فلتر-اسم]        المتغيرات: CODIS_URL (الافتراضي http://127.0.0.1:8791/app/CODIS_FINAL.html) · CHROME_PATH · NODE_PATH يشير لـplaywright-core
// كل سيناريو يشتري/يفتح فعلياً بمحرك الاقتصاد الحقيقي ثم يقفز بزمن المشهد (seek) ويتحقق: خصم مرة واحدة، تسجيل الصناديق، إزالة الطبقة، استعادة الواجهة (inert/overflow)، عدم تسرب canvas، ظهور النتيجة، بلا أخطاء JS.
// البرمجيات غير المدعومة (بلا WebGL / فشل تحميل المحرك) يجب أن تسقط للمشهد القديم وتبقى النتيجة.
// QA matrix for CODIS box 3D. node qa.mjs [filter]
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium, webkit } = require('playwright-core');
const filter = process.argv[2] || '';
const CH = { executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] };
const URL = process.env.CODIS_URL || 'http://127.0.0.1:8791/app/CODIS_FINAL.html';
const rows = [];
async function scenario(name, o) {
  if (filter && !name.includes(filter)) return;
  const t0 = Date.now();
  const b = o.br === 'webkit' ? await webkit.launch() : await chromium.launch(CH);
  const ctx = await b.newContext({ viewport: { width: o.w || 430, height: o.h || 860 }, deviceScaleFactor: o.dpr || 1, reducedMotion: o.calm ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!(o.badsrc && /boom/.test(e.message))) errs.push('PAGEERR ' + e.message.slice(0, 160)); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/404|Failed to load resource/.test(t) && !(o.badsrc && /boom/.test(t))) errs.push('ERR ' + t.slice(0, 160)); if (/CodisBox3D/.test(t) && m.type() === 'warning' && !(o.nowebgl || o.badsrc)) errs.push('WARN ' + t.slice(0, 160)); });
  await p.addInitScript(`try{localStorage.setItem('codis_theme_v1','${o.dark ? 'dark' : 'paper'}')}catch(e){}`);
  if (o.nowebgl) await p.addInitScript(`(()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){ if(/webgl/.test(t)) return null; return g.call(this,t,...a); };})()`);
  if (o.badsrc) await p.addInitScript(`document.addEventListener('DOMContentLoaded',()=>{const e=document.getElementById('codis-b3d-src'); if(e) e.textContent='throw new Error("boom");';})`);
  let res = { ok: false, info: '' };
  try {
    await p.goto(URL); await p.waitForFunction('typeof CodisBoxes!=="undefined"&&typeof data!=="undefined"&&typeof econBuyBox10==="function"', null, { timeout: 60000 }); await p.waitForTimeout(1200);
    try { await p.getByText('المتابعة بدون حساب').first().click({ timeout: 4000 }); } catch (e) {} await p.waitForTimeout(800);
    const pre = JSON.parse(await p.evaluate(`(()=>{ codisConfirm=async()=>true; CodisOutcomeUI.show=()=>{}; CodisOutcomeUI.enqueue=()=>{}; data.wallet.balance=500000; saveData(); const t=CodisBoxes.tier('bx${o.tier}'); return JSON.stringify({bal:data.wallet.balance, price:t.price, boxes:(data.inventory.boxes||[]).length, canv:document.querySelectorAll('canvas.b3d-cv').length, inert:document.querySelectorAll('[inert]').length}); })()`));
    await p.evaluate(o.mode === 'bulk' ? `econBuyBox10('bx${o.tier}')` : `econBuyBox('bx${o.tier}')`); await p.waitForTimeout(900);
    const live = JSON.parse(await p.evaluate(`JSON.stringify({root:!!document.querySelector('.b3d-root'), active:CodisBox3D.active(), full:(()=>{const r=document.querySelector('.b3d-root'); if(!r) return null; const b=r.getBoundingClientRect(); return b.width===innerWidth&&b.height===innerHeight&&b.top===0&&b.left===0;})(), old:!!document.querySelector('.cb-world,.bkc-stage'), toast:!!document.querySelector('.toast.show,#toast.show')})`));
    const key = o.mode === 'bulk' ? 'bulk' : 'cur';
    let frames = null, total = null;
    if (o.abortAt) {
      await p.evaluate(`(()=>{const c=CodisBox3D._ctl().${key}; if(c) c.seek(${o.abortAt});})()`); await p.waitForTimeout(150);
      await p.evaluate(o.mode === 'bulk' ? 'econBulkClose()' : 'econBoxClose()'); await p.waitForTimeout(800);
    } else if (o.realtime) {
      const t1 = Date.now(); let done = false; for (let i = 0; i < 160 && !done; i++) { await p.waitForTimeout(500); done = await p.evaluate(`!document.querySelector('.b3d-root')`); if (i === 6) frames = await p.evaluate(`(()=>{const c=CodisBox3D._ctl().${key}; return c&&c.run? c.run.frames:null})()`); }
      total = (Date.now() - t1) / 1000;
    } else if (live.root) {
      total = await p.evaluate(`(()=>{const c=CodisBox3D._ctl().${key}; return c? c.total:null})()`);
      await p.evaluate(`(()=>{const c=CodisBox3D._ctl().${key}; if(c) c.seek(c.total*0.5);})()`); await p.waitForTimeout(100);
      await p.evaluate(`(()=>{const c=CodisBox3D._ctl().${key}; if(c) c.seek(c.total+0.5);})()`);
    }
    for(let i=0;i<40;i++){ if(await p.evaluate(`!document.querySelector('.b3d-root')`)) break; await p.waitForTimeout(500); } await p.waitForTimeout(600);
    if (!live.root && !o.abortAt) { for (let i = 0; i < 90; i++) { if (await p.evaluate(`!!document.querySelector('#econ-box-modal .bx-reveal, #econ-bulk-modal .bk-grid')`)) break; await p.waitForTimeout(500); } await p.waitForTimeout(1500); }
    const post = JSON.parse(await p.evaluate(`JSON.stringify({root:!!document.querySelector('.b3d-root'), active:CodisBox3D.active(), inert:document.querySelectorAll('[inert]').length, canv:document.querySelectorAll('canvas.b3d-cv').length, ov:document.documentElement.style.overflow, phase:${o.mode === 'bulk' ? 'econBulkState&&econBulkState.phase' : 'econBoxState&&econBoxState.phase'}, bal:data.wallet.balance, boxes:(data.inventory.boxes||[]).length, opened:(data.inventory.boxes||[]).filter(b=>b.status==='opened').length, result:!!document.querySelector('#econ-box-modal .bx-reveal, #econ-bulk-modal .bk-grid'), cells:document.querySelectorAll('#econ-bulk-modal .bk-cell').length})`));
    const n = o.mode === 'bulk' ? 10 : 1, chk = [];
    chk.push(['charged once', pre.bal - post.bal === pre.price * n, pre.bal - post.bal + '/' + pre.price * n]);
    chk.push(['boxes recorded+opened', post.boxes - pre.boxes === n && post.opened >= n, post.boxes - pre.boxes]);
    chk.push(['overlay gone', !post.root && !post.active]);
    chk.push(['UI restored (inert/overflow)', post.inert === pre.inert && post.ov === '']);
    chk.push(['no leaked canvas', post.canv <= pre.canv, pre.canv + '->' + post.canv]);
    if (!o.abortAt) chk.push(['result shown', post.result && (o.mode !== 'bulk' || post.cells === 10), post.phase + '/' + post.cells]);
    if (!o.nowebgl && !o.badsrc) chk.push(['3D fullscreen live', live.root && live.full === true, JSON.stringify(live)]);
    if (o.nowebgl || o.badsrc) chk.push(['fell back (no 3D overlay)', !live.root, JSON.stringify(live)]);
    chk.push(['no JS errors', errs.length === 0, errs.slice(0, 2).join(' | ')]);
    const bad = chk.filter(c => !c[1]); res = { ok: !bad.length, info: bad.map(c => c[0] + (c[2] ? ' [' + c[2] + ']' : '')).join('; ') + (frames != null ? ` frames@3s=${frames}` : '') + (total != null ? ` realtime=${(+total).toFixed(1)}s` : '') };
  } catch (e) { res = { ok: false, info: 'EXC ' + String(e).slice(0, 200) }; }
  rows.push([name, res.ok ? 'PASS' : 'FAIL', res.info, ((Date.now() - t0) / 1000).toFixed(0) + 's']);
  console.log(rows[rows.length - 1].join(' | '));
  await b.close();
}
for (const t of [1, 2, 3, 4, 5]) await scenario(`single tier${t} portrait`, { mode: 'single', tier: t });
for (const t of [1, 2, 3, 4, 5]) await scenario(`bulk tier${t} portrait`, { mode: 'bulk', tier: t });
await scenario('single tier5 dark', { mode: 'single', tier: 5, dark: true });
await scenario('bulk tier4 dark', { mode: 'bulk', tier: 4, dark: true });
await scenario('single tier2 landscape', { mode: 'single', tier: 2, w: 900, h: 480 });
await scenario('bulk tier3 landscape', { mode: 'bulk', tier: 3, w: 1000, h: 520 });
await scenario('single tier1 reduced-motion', { mode: 'single', tier: 1, calm: true });
await scenario('bulk tier2 reduced-motion', { mode: 'bulk', tier: 2, calm: true });
await scenario('single tier3 no-webgl fallback', { mode: 'single', tier: 3, nowebgl: true });
await scenario('bulk tier3 no-webgl fallback', { mode: 'bulk', tier: 3, nowebgl: true });
await scenario('single tier4 engine-load-failure fallback', { mode: 'single', tier: 4, badsrc: true });
await scenario('single tier3 close-mid-scene', { mode: 'single', tier: 3, abortAt: 2.2 });
await scenario('bulk tier3 close-mid-scene', { mode: 'bulk', tier: 3, abortAt: 6 });
await scenario('single tier2 realtime', { mode: 'single', tier: 2, realtime: true });
await scenario('single tier3 webkit', { mode: 'single', tier: 3, br: 'webkit', dpr: 2, w: 390, h: 760 });
await scenario('bulk tier2 webkit', { mode: 'bulk', tier: 2, br: 'webkit', dpr: 2, w: 390, h: 760 });
console.log('\nSUMMARY', rows.filter(r => r[1] === 'PASS').length + '/' + rows.length + ' passed');
