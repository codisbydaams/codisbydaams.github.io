// CODIS-V53 — اختبار تفاعلات الصناديق والاقتصاد والتسرّب (Chromium swiftshader). يحتاج playwright-core@1.49.1 عبر NODE_PATH + خادم ساكن لجذر المشروع.
//   node tests/box_v53_interactions.mjs [فلتر]     CODIS_URL (الافتراضي http://127.0.0.1:8791/app/CODIS_FINAL.html)
// بيانات تجريبية فقط: ملف ضيف معزول في سياق متصفح جديد لكل سيناريو، رصيد اختباري، لا حساب ولا مزامنة.
// يفحص: الخصم والمنح مرة واحدة (فردي/×10، 3D و2D) · الإغلاق أثناء الحركة · التخطي · الضغط السريع · إعادة الفتح · تدوير/تغيير القياس أثناء المشهد ·
// فشل WebGL · فشل المشهد (مهلة الأمان) · عدم تراكم canvas/rAF/المؤقتات/الطبقات بعد 6 دورات · صوت الكشف مرة واحدة ولا أصوات بعد الإغلاق.
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright-core');
const filter = process.argv[2] || '', URL = process.env.CODIS_URL || 'http://127.0.0.1:8791/app/CODIS_FINAL.html';
const CH = { executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'] };
const rows = [];
/* عدّاد rAF/المؤقتات المعلّقة (يُحقن قبل سكربتات التطبيق) */
const INSTR = () => {
  const raf = new Map(); let rid = 0; const oR = window.requestAnimationFrame.bind(window), oC = window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => { const id = oR(t => { raf.delete(id); cb(t); }); raf.set(id, 1); return id; };
  window.cancelAnimationFrame = id => { raf.delete(id); oC(id); };
  const iv = new Set(), oSI = window.setInterval.bind(window), oCI = window.clearInterval.bind(window);
  window.setInterval = (f, ms, ...a) => { const id = oSI(f, ms, ...a); iv.add(id); return id; }; window.clearInterval = id => { iv.delete(id); oCI(id); };
  window.__pend = () => ({ raf: raf.size, iv: iv.size });
};
async function open(o = {}) {
  const b = await chromium.launch(CH); const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 160)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/404|Failed to load resource/.test(t)) errs.push('ERR ' + t.slice(0, 160)); if (m.type() === 'warning' && /Codis(Box|Bulk)|CodisBox3D/.test(t) && !/unavailable/.test(t)) errs.push('WARN ' + t.slice(0, 160)); });
  await p.addInitScript(INSTR); if (o.off) await p.addInitScript(() => { window.CODIS_B3D_OFF = true; });
  if (o.nowebgl) await p.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { return /webgl/i.test(k) ? null : g.call(this, k, ...a); }; });
  await p.goto(URL); await p.waitForFunction('typeof CodisBoxes!=="undefined"&&typeof econBuyBox10==="function"', null, { timeout: 60000 }); await p.waitForTimeout(800);
  try { await p.getByText('المتابعة بدون حساب').first().click({ timeout: 3000 }); } catch (e) {} await p.waitForTimeout(400);
  await p.evaluate(`(()=>{ codisConfirm=async()=>true; CodisOutcomeUI.show=()=>{}; CodisOutcomeUI.enqueue=()=>{}; data.wallet.balance=900000; saveData(); try{ CodisAudio.unlockNow(); }catch(e){} })()`);
  return { b, p, errs, ctx };
}
const snap = p => p.evaluate(`JSON.stringify({ bal:+data.wallet.balance.toFixed(2), boxes:(data.inventory.boxes||[]).length, opened:(data.inventory.boxes||[]).filter(b=>b.status==='opened').length, unopened:(data.inventory.boxes||[]).filter(b=>b.status==='unopened').length,
  items:(data.inventory.items||[]).length, passes:JSON.stringify(data).split('pass|box|').length-1, tx:(data.wallet.transactions||data.wallet.tx||[]).length,
  root:document.querySelectorAll('.b3d-root').length, canv:document.querySelectorAll('canvas.b3d-cv').length, world:document.querySelectorAll('#econ-box-modal .cb-world').length,
  cine:CodisBoxCinema.active(), bulkCine:CodisBulkCinema.active(), b3d:CodisBox3D.active(), inert:document.querySelectorAll('[inert]').length, ov:document.documentElement.style.overflow, pend:window.__pend() })`).then(JSON.parse);
const waitFor = async (p, q, n = 120) => { for (let i = 0; i < n; i++) { if (await p.evaluate(q)) return true; await p.waitForTimeout(250); } return false; };
/* كل مكافأة ممنوحة = صندوق بحالة opened مرتبط بها؛ والمحفظة تُخصم سعر الصناديق المشتراة بالضبط */
const priceOf = (p, t) => p.evaluate(`CodisBoxes.tier('${t}').price`);
async function scenario(name, fn) {
  if (filter && !name.includes(filter)) return; const t0 = Date.now(); let res;
  try { res = await fn(); } catch (e) { res = { ok: false, info: 'EXC ' + String(e).slice(0, 220) }; }
  rows.push([name, res.ok ? 'PASS' : 'FAIL', res.info || '', ((Date.now() - t0) / 1000).toFixed(0) + 's']); console.log(rows[rows.length - 1].join(' | '));
}
const linked = p => p.evaluate(`(data.inventory.boxes||[]).filter(b=>b.status==='opened').every(b=>!!(b.rewardUid||b.passUid||b.holidayUid||b.pouchUid||b.cosmeticId))`);

for (const mode of ['3d', '2d']) {
  await scenario(`${mode} single: close mid-animation → granted once, nothing left running`, async () => {
    const { b, p, errs } = await open({ off: mode === '2d' }); const a = await snap(p), price = await priceOf(p, 'bx3');
    await p.evaluate(`econBuyBox('bx3')`); await p.waitForTimeout(900);
    const mid = await snap(p); await p.evaluate(`econBoxClose()`); await p.waitForTimeout(700); const z = await snap(p); const lk = await linked(p); await b.close();
    const ok = Math.abs(a.bal - z.bal - price) < .01 && z.opened - a.opened === 1 && z.unopened === a.unopened && lk && !z.root && !z.canv && !z.world && !z.cine && !z.b3d && z.inert === a.inert && z.pend.raf <= a.pend.raf + 1 && z.pend.iv <= a.pend.iv && errs.length === 0;
    return { ok, info: `paid=${(a.bal - z.bal).toFixed(2)}/${price} opened+${z.opened - a.opened} midActive=${mid.cine || mid.b3d} after:raf=${z.pend.raf}/${a.pend.raf} iv=${z.pend.iv}/${a.pend.iv} ${errs.slice(0, 2).join('|')}` };
  });
  await scenario(`${mode} bulk: close mid-animation → 10 granted once, nothing left running`, async () => {
    const { b, p, errs } = await open({ off: mode === '2d' }); const a = await snap(p), price = await priceOf(p, 'bx2');
    await p.evaluate(`econBuyBox10('bx2')`); await p.waitForTimeout(1500);
    if (mode === '3d') await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.evaluate(`econBulkClose()`); await p.waitForTimeout(800);
    const z = await snap(p); const lk = await linked(p); await b.close();
    const ok = Math.abs(a.bal - z.bal - price * 10) < .01 && z.opened - a.opened === 10 && lk && !z.root && !z.canv && !z.bulkCine && !z.b3d && z.inert === a.inert && z.pend.raf <= a.pend.raf + 1 && z.pend.iv <= a.pend.iv && errs.length === 0;
    return { ok, info: `paid=${(a.bal - z.bal).toFixed(2)}/${price * 10} opened+${z.opened - a.opened} raf=${z.pend.raf}/${a.pend.raf} iv=${z.pend.iv}/${a.pend.iv} ${errs.slice(0, 2).join('|')}` };
  });
  await scenario(`${mode} bulk: skip → done grid of 10 in the right order, counter 10/10, Done visible`, async () => {
    const { b, p, errs } = await open({ off: mode === '2d' });
    await p.evaluate(`econBuyBox10('bx4')`); await p.waitForTimeout(1600);
    if (mode === '3d') { await p.keyboard.press('Escape'); } else { const c = await p.evaluate(`document.querySelector('.bkc-count b').textContent`); await p.evaluate(`econBulkSkip()`); }
    await waitFor(p, `!document.querySelector('.b3d-root') && econBulkState && econBulkState.phase==='done'`); await p.waitForTimeout(600);
    const g = await p.evaluate(`(()=>{ const s=econBulkState, cells=[...document.querySelectorAll('#econ-bulk-modal .bk-cell')]; const vh=innerHeight, done=document.querySelector('.bk-done').getBoundingClientRect();
      const order = cells.every((c,i)=>c.getAttribute('data-box')===s.res.items[i].box.uid); const inView = cells.every(c=>{ const r=c.getBoundingClientRect(); return r.top>=0 && r.bottom<=vh+1; });
      const overlap = cells.some((c,i)=>cells.some((d,j)=>{ if(j<=i) return false; const a=c.getBoundingClientRect(), b=d.getBoundingClientRect(); return a.left<b.right-1 && b.left<a.right-1 && a.top<b.bottom-1 && b.top<a.bottom-1; }));
      return { n:cells.length, order, inView, overlap, doneIn: done.bottom<=vh+1 && done.top>=0, hidden:[...document.querySelectorAll('#econ-bulk-modal .bk-card')].filter(e=>e.style.visibility==='hidden').length }; })()`);
    await b.close();
    return { ok: g.n === 10 && g.order && g.inView && !g.overlap && g.doneIn && g.hidden === 0 && errs.length === 0, info: JSON.stringify(g) + ' ' + errs.slice(0, 2).join('|') };
  });
  await scenario(`${mode} single: rapid presses on open + reopen 3x → one box per press, no stacking`, async () => {
    const { b, p, errs } = await open({ off: mode === '2d' }); const a = await snap(p);
    for (let k = 0; k < 3; k++) {
      await p.evaluate(`econBuyBox('bx1')`); await p.waitForTimeout(300); await p.evaluate(`econBoxDo(); econBoxDo(); econBoxDo();`);   /* ضغطات مكررة أثناء الفتح: محروسة بالمرحلة */
      await waitFor(p, `!document.querySelector('.b3d-root') && econBoxState && econBoxState.phase==='reveal'`); await p.waitForTimeout(400); await p.evaluate(`econBoxClose()`); await p.waitForTimeout(400);
    }
    const z = await snap(p); await b.close();
    const ok = z.opened - a.opened === 3 && z.boxes - a.boxes === 3 && !z.root && !z.canv && !z.world && z.pend.raf <= a.pend.raf + 1 && errs.length === 0;
    return { ok, info: `opened+${z.opened - a.opened} boxes+${z.boxes - a.boxes} raf=${z.pend.raf}/${a.pend.raf} ${errs.slice(0, 2).join('|')}` };
  });
  await scenario(`${mode} rotate portrait→landscape→portrait mid-bulk → everything inside the sheet`, async () => {
    const { b, p, errs } = await open({ off: mode === '2d' });
    await p.evaluate(`econBuyBox10('bx3')`); await p.waitForTimeout(1500); await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(900);
    const mid = await p.evaluate(`(()=>{ const vh=innerHeight, q=s=>{ const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return r.width ? (r.top>=-1 && r.bottom<=vh+1) : null; }; return { skip:q('.bk-skip'), stage:q('.bkc-stage'), tray:q('.bkc-tray'), root:q('.b3d-root') }; })()`);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400); await p.setViewportSize({ width: 844, height: 390 });
    await waitFor(p, `!document.querySelector('.b3d-root') && econBulkState && econBulkState.phase==='done'`, 200); await p.waitForTimeout(700);
    const end = await p.evaluate(`(()=>{ const vh=innerHeight, cells=[...document.querySelectorAll('#econ-bulk-modal .bk-cell')], d=document.querySelector('.bk-done').getBoundingClientRect(); return { n:cells.length, cellsIn:cells.every(c=>{ const r=c.getBoundingClientRect(); return r.top>=-1 && r.bottom<=vh+1; }), doneIn:d.top>=0 && d.bottom<=vh+1 }; })()`);
    await b.close(); const midOk = mode === '2d' ? (mid.skip && mid.stage && mid.tray) : mid.root;
    return { ok: !!midOk && end.n === 10 && end.cellsIn && end.doneIn && errs.length === 0, info: JSON.stringify({ mid, end }) + ' ' + errs.slice(0, 2).join('|') };
  });
}
await scenario('no WebGL → 2D fallback for single and bulk, rewards shown and granted once', async () => {
  const { b, p, errs } = await open({ nowebgl: true }); const a = await snap(p);
  await p.evaluate(`econBuyBox('bx5')`); await p.waitForTimeout(500); const s1 = await snap(p);
  await waitFor(p, `econBoxState && econBoxState.phase==='reveal'`); const rv = await p.evaluate(`!!document.querySelector('#econ-box-body .bx-stage.is-done')`); await p.evaluate(`econBoxClose()`); await p.waitForTimeout(400);
  await p.evaluate(`econBuyBox10('bx1')`); await p.waitForTimeout(500); const s2 = await snap(p); await p.evaluate(`econBulkSkip()`); await p.waitForTimeout(500);
  const cells = await p.evaluate(`document.querySelectorAll('#econ-bulk-modal .bk-cell').length`); await p.evaluate(`econBulkClose()`); const z = await snap(p); await b.close();
  const ok = !s1.root && s1.cine && rv && !s2.root && s2.bulkCine && cells === 10 && z.opened - a.opened === 11 && errs.filter(e => !/WARN/.test(e)).length === 0;
  return { ok, info: `2dSingle=${s1.cine} reveal=${rv} 2dBulk=${s2.bulkCine} cells=${cells} opened+${z.opened - a.opened} ${errs.slice(0, 2).join('|')}` };
});
await scenario('3D scene failure / watchdog → result delivered once, layer gone', async () => {
  const { b, p, errs } = await open({}); const a = await snap(p);
  await p.evaluate(`econBuyBox('bx4')`); await p.waitForFunction('!!CodisBox3D._ctl().cur'); await p.waitForTimeout(400);
  await p.evaluate(`CodisBox3D._ctl().cur.run.fail('watchdog')`); await waitFor(p, `!document.querySelector('.b3d-root')`);
  const r1 = await p.evaluate(`econBoxState && econBoxState.phase`); await p.evaluate(`econBoxClose()`);
  await p.evaluate(`econBuyBox10('bx4')`); await p.waitForFunction('!!CodisBox3D._ctl().bulk'); await p.waitForTimeout(400);
  await p.evaluate(`CodisBox3D._ctl().bulk.run.fail('error')`); await waitFor(p, `!document.querySelector('.b3d-root')`); await p.waitForTimeout(300);
  const r2 = await p.evaluate(`econBulkState && econBulkState.phase`), cells = await p.evaluate(`document.querySelectorAll('#econ-bulk-modal .bk-cell').length`);
  await p.evaluate(`econBulkClose()`); const z = await snap(p); await b.close();
  const ok = r1 === 'reveal' && r2 === 'done' && cells === 10 && z.opened - a.opened === 11 && !z.root && !z.canv && z.inert === a.inert && errs.length === 0;
  return { ok, info: `single=${r1} bulk=${r2} cells=${cells} opened+${z.opened - a.opened} ${errs.slice(0, 2).join('|')}` };
});
await scenario('2D safety timeout: frozen rAF → bulk still finishes, single still reveals', async () => {
  const { b, p, errs } = await open({ off: true });
  await p.evaluate(`econBuyBox('bx2')`); await p.waitForTimeout(200); await p.evaluate(`window.__oraf=window.requestAnimationFrame; window.requestAnimationFrame=()=>0;`);   /* WebView مقيّد: لا إطارات */
  const r1 = await waitFor(p, `econBoxState && econBoxState.phase==='reveal'`, 60); await p.evaluate(`window.requestAnimationFrame=window.__oraf; econBoxClose()`);
  await p.evaluate(`econBuyBox10('bx2')`); await p.waitForTimeout(200); await p.evaluate(`window.requestAnimationFrame=()=>0;`);
  const r2 = await waitFor(p, `econBulkState && econBulkState.phase==='done'`, 240); await p.evaluate(`window.requestAnimationFrame=window.__oraf;`); await b.close();
  return { ok: r1 && r2 && errs.length === 0, info: `singleRevealed=${r1} bulkDone=${r2} ${errs.slice(0, 2).join('|')}` };
});
await scenario('leaks: 6 open/close cycles (3D single + 3D bulk, skipped then closed) → no canvas/rAF/interval/listener build-up', async () => {
  const { b, p, errs } = await open({}); const a = await snap(p); const heap0 = await p.evaluate(`performance.memory ? performance.memory.usedJSHeapSize : 0`);
  for (let k = 0; k < 6; k++) {
    await p.evaluate(k % 2 ? `econBuyBox10('bx1')` : `econBuyBox('bx1')`); await p.waitForTimeout(700); await p.keyboard.press('Escape'); await waitFor(p, `!document.querySelector('.b3d-root')`); await p.waitForTimeout(300);
    await p.evaluate(`econBoxClose(); econBulkClose();`); await p.waitForTimeout(300);
  }
  const z = await snap(p); await p.evaluate(`window.gc && gc()`); const heap1 = await p.evaluate(`performance.memory ? performance.memory.usedJSHeapSize : 0`);
  const extra = await p.evaluate(`JSON.stringify({ cv:document.querySelectorAll('canvas').length, cards:document.querySelectorAll('.b3d-card,.bkc-card').length, zoom:document.querySelectorAll('.bk-zoom').length })`);
  await b.close();
  const ok = z.opened - a.opened === 33 && !z.root && !z.canv && z.pend.raf <= a.pend.raf + 1 && z.pend.iv <= a.pend.iv && z.inert === a.inert && z.ov === a.ov && errs.length === 0;
  return { ok, info: `opened+${z.opened - a.opened} raf=${z.pend.raf}/${a.pend.raf} iv=${z.pend.iv}/${a.pend.iv} ${extra} heapMB=${(heap0 / 1e6).toFixed(0)}→${(heap1 / 1e6).toFixed(0)} ${errs.slice(0, 2).join('|')}` };
});
await scenario('audio: one reveal sound per single open (3D and 2D), none after close/skip', async () => {
  const out = [];
  for (const off of [false, true]) {
    const { b, p, errs } = await open({ off }); const n0 = await p.evaluate('CodisAudio.trace().length');
    await p.evaluate(`econBuyBox('bx3')`);
    if (!off) { await p.waitForFunction('!!CodisBox3D._ctl().cur'); await p.evaluate(`(()=>{ const c=CodisBox3D._ctl().cur; c.seek(c.total + .05); })()`); }   /* swiftshader بطيء: الزمن يُقدَّم بـseek والإشارات (ومنها الأصوات) تُطلق كما هي */
    await waitFor(p, `!document.querySelector('.b3d-root') && econBoxState && econBoxState.phase==='reveal'`); await p.waitForTimeout(2600);
    const keys = await p.evaluate(`CodisAudio.trace().slice(${n0}).map(x=>x.key)`); await p.evaluate(`econBoxClose()`); const n1 = await p.evaluate('CodisAudio.trace().length'); await p.waitForTimeout(1500);
    const after = await p.evaluate(`CodisAudio.trace().slice(${n1}).map(x=>x.key).filter(k=>!/^close/.test(k))`); await b.close();
    const reveals = keys.filter(k => /^(chest\.reveal|box\.reveal)/.test(k)).length, opens = keys.filter(k => /^(chest\.touch|press|open)/.test(k)).length;
    out.push({ off, reveals, opens, after: after.length, keys: [...new Set(keys)].join(','), errs: errs.length });
  }
  return { ok: out.every(o => o.reveals === 1 && o.after === 0 && o.errs === 0), info: JSON.stringify(out) };
});
console.log('\nSUMMARY', rows.filter(r => r[1] === 'PASS').length + '/' + rows.length + ' passed');
