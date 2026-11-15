// CODIS-V52 QA — فتح الصناديق v2 (Chromium swiftshader + WebKit). يحتاج playwright-core@1.49.1 (NODE_PATH) + خادم ساكن لجذر المشروع.
//   node tests/box3d_v2_qa.mjs [فلتر]      CODIS_URL (الافتراضي http://127.0.0.1:8791/app/CODIS_FINAL.html) · CHROME_PATH
// يفحص: دقة هبوط البطاقة على بطاقة الواجهة الحقيقية (صندوق واحد + ×10، بالبكسل) · التخطي في كل مرحلة (صامت، بلا تكرار منح) · الإغلاق والفتح المتكرر ·
// الاحتواء بإطار الهاتف على الحاسوب · نسبة البكسل الفعلية · المستويات التسعة (عرض فقط) · الصوت: لا مفاتيح قديمة أثناء المشهد، وكل chest.* غير صامت وبلا تشبّع.
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium, webkit } = require('playwright-core');
const filter = process.argv[2] || '', URL = process.env.CODIS_URL || 'http://127.0.0.1:8791/app/CODIS_FINAL.html';
const CH = { executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'] };
const rows = [];
async function open(o) {
  const b = o.br === 'webkit' ? await webkit.launch() : await chromium.launch(CH);
  const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 2, reducedMotion: o.calm ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 160)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/404|Failed to load resource/.test(t)) errs.push('ERR ' + t.slice(0, 160)); if (/CodisBox3D/.test(t) && m.type() === 'warning') errs.push('WARN ' + t.slice(0, 160)); });
  await p.goto(URL); await p.waitForFunction('typeof CodisBoxes!=="undefined"&&typeof econBuyBox10==="function"', null, { timeout: 60000 }); await p.waitForTimeout(900);
  try { await p.getByText('المتابعة بدون حساب').first().click({ timeout: 3000 }); } catch (e) {} await p.waitForTimeout(500);
  await p.evaluate(`(()=>{ codisConfirm=async()=>true; CodisOutcomeUI.show=()=>{}; CodisOutcomeUI.enqueue=()=>{}; data.wallet.balance=900000; saveData(); try{ CodisAudio.unlockNow(); }catch(e){} })()`);
  return { b, p, errs };
}
const freeze = key => `(()=>{const c=CodisBox3D._ctl().${key}; cancelAnimationFrame(c.run.raf); c.run.frame=()=>{}; window.__c=c; return c.total;})()`;
/* يكمل الهبوط يدوياً حتى k=1 ويعيد أقصى خطأ بالبكسل بين أركان بطاقة المشهد ومستطيل البطاقة الحقيقية */
const landErr = `(()=>{ const r=__c.run; if(!r.landing) return {err:-1, n:0}; r.landing.t=r.landing.dur-1e-6; if(r.onFrame) r.onFrame(0, r.tl.t); r.updateCamera(0); r.landStep(1e-4); r.post(); let mx=0; r.landing.items.forEach(it=>{ const q=it.L.dom.quad, R=it.r, c=[[R.x,R.y],[R.x+R.w,R.y],[R.x+R.w,R.y+R.h],[R.x,R.y+R.h]]; q.forEach((v,i)=>{ mx=Math.max(mx, Math.hypot(v.x-c[i][0], v.y-c[i][1])); }); }); return {err:+mx.toFixed(2), n:r.landing.items.length}; })()`;
async function scenario(name, fn) {
  if (filter && !name.includes(filter)) return; const t0 = Date.now(); let res;
  try { res = await fn(); } catch (e) { res = { ok: false, info: 'EXC ' + String(e).slice(0, 220) }; }
  rows.push([name, res.ok ? 'PASS' : 'FAIL', res.info || '', ((Date.now() - t0) / 1000).toFixed(0) + 's']); console.log(rows[rows.length - 1].join(' | '));
}
const post = p => p.evaluate(`JSON.stringify({root:!!document.querySelector('.b3d-root'), active:CodisBox3D.active(), inert:document.querySelectorAll('[inert]').length, canv:document.querySelectorAll('canvas.b3d-cv').length, ov:document.documentElement.style.overflow, bal:data.wallet.balance, boxes:(data.inventory.boxes||[]).length, opened:(data.inventory.boxes||[]).filter(b=>b.status==='opened').length, hidden:[...document.querySelectorAll('#econ-box-modal .bx-reveal > *, #econ-bulk-modal .bk-card')].filter(e=>e.style.visibility==='hidden').length})`).then(JSON.parse);
const pre = p => p.evaluate(`JSON.stringify({bal:data.wallet.balance, boxes:(data.inventory.boxes||[]).length, inert:document.querySelectorAll('[inert]').length})`).then(JSON.parse);
const waitGone = async p => { for (let i = 0; i < 30; i++) { if (await p.evaluate(`!document.querySelector('.b3d-root')`)) return true; await p.waitForTimeout(250); } return false; };

/* 1) دقة الهبوط — صندوق واحد لكل مستوى صندوق + ×10 */
for (const t of [1, 3, 5]) await scenario(`landing precision single tier${t}`, async () => {
  const { b, p, errs } = await open({}); const a = await pre(p);
  await p.evaluate(`econBuyBox('bx${t}')`); await p.waitForFunction('!!CodisBox3D._ctl().cur'); const total = await p.evaluate(freeze('cur'));
  await p.evaluate(`__c.seek(${total}+.05)`); const L = await p.evaluate(landErr); await p.waitForTimeout(400); await waitGone(p); const z = await post(p);
  await b.close(); const ok = L.n === 1 && L.err >= 0 && L.err < 1.5 && !z.root && z.hidden === 0 && a.bal - z.bal > 0 && errs.length === 0;
  return { ok, info: `err=${L.err}px n=${L.n} hiddenLeft=${z.hidden} ${errs.slice(0, 2).join('|')}` };
});
for (const t of [2, 4]) await scenario(`landing precision bulk tier${t}`, async () => {
  const { b, p, errs } = await open({}); await p.evaluate(`econBuyBox10('bx${t}')`); await p.waitForFunction('!!CodisBox3D._ctl().bulk'); const total = await p.evaluate(freeze('bulk'));
  await p.evaluate(`__c.seek(${total}+.05)`); const L = await p.evaluate(landErr); await p.waitForTimeout(400); await waitGone(p); const z = await post(p);
  const cells = await p.evaluate(`document.querySelectorAll('#econ-bulk-modal .bk-cell').length`); await b.close();
  const ok = L.n === 10 && L.err < 1.5 && cells === 10 && !z.root && z.hidden === 0 && errs.length === 0;
  return { ok, info: `err=${L.err}px n=${L.n} cells=${cells} ${errs.slice(0, 2).join('|')}` };
});
/* 2) التخطي في كل مرحلة: صامت (لا مفاتيح انفجار بعد التخطي) + منح مرة واحدة + لا بقايا */
const SK = [['anticipation', .45], ['lid', .62], ['card-rise', .78]];
for (const [ph, f] of SK) await scenario(`skip single during ${ph}`, async () => {
  const { b, p, errs } = await open({}); const a = await pre(p);
  await p.evaluate(`econBuyBox('bx4')`); await p.waitForFunction('!!CodisBox3D._ctl().cur'); const total = await p.evaluate(freeze('cur'));
  await p.evaluate(`__c.seek(${total * f})`); const n0 = await p.evaluate('CodisAudio.trace().length');
  await p.evaluate(`__c.run.frame=__c.run.constructor.prototype.frame.bind(__c.run); __c.skip(); __c.run.raf=requestAnimationFrame(__c.run.frame);`);
  const gone = await waitGone(p); const tr = await p.evaluate(`CodisAudio.trace().slice(${n0}).map(x=>x.key)`); const z = await post(p);
  const res = await p.evaluate(`!!document.querySelector('#econ-box-modal .bx-reveal')`); await b.close();
  const burst = tr.filter(k => /chest\.(reveal|rattle|lid|unlatch|rise|spin)/.test(k)).length;
  const ok = gone && res && burst === 0 && a.boxes + 1 === z.boxes && z.inert === a.inert && z.canv === 0 && z.hidden === 0 && errs.length === 0;
  return { ok, info: `after-skip sounds=[${tr.join(',')}] result=${res} z=${JSON.stringify(z)} a=${JSON.stringify(a)} ${errs.slice(0, 2).join('|')}` };
});
await scenario('skip bulk mid-sequence + all 10 land', async () => {
  const { b, p, errs } = await open({}); const a = await pre(p); await p.evaluate(`econBuyBox10('bx3')`); await p.waitForFunction('!!CodisBox3D._ctl().bulk'); const total = await p.evaluate(freeze('bulk'));
  await p.evaluate(`__c.seek(${total * .4})`); await p.evaluate(`__c.run.frame=__c.run.constructor.prototype.frame.bind(__c.run); __c.skip(); __c.run.raf=requestAnimationFrame(__c.run.frame);`);
  const gone = await waitGone(p); const z = await post(p); const cells = await p.evaluate(`document.querySelectorAll('#econ-bulk-modal .bk-cell').length`); await b.close();
  return { ok: gone && cells === 10 && z.hidden === 0 && z.canv === 0 && z.inert === a.inert && errs.length === 0, info: `cells=${cells} inert=${z.inert}/${a.inert} ${errs.slice(0, 2).join('|')}` };
});
/* 3) إغلاق أثناء المشهد ثم فتح فوري لصندوق آخر (×3) */
await scenario('close mid-scene then reopen x3', async () => {
  const { b, p, errs } = await open({}); const a = await pre(p); let bad = '';
  for (let k = 0; k < 3; k++) {
    await p.evaluate(`econBuyBox('bx2')`); await p.waitForFunction('!!CodisBox3D._ctl().cur'); await p.waitForTimeout(700);
    await p.evaluate('econBoxClose()'); await p.waitForTimeout(250);
    const z = await post(p); if (z.root || z.active || z.canv || z.inert !== a.inert) bad += `#${k}:${JSON.stringify(z)} `;
  }
  const z = await post(p); await b.close();
  return { ok: !bad && z.boxes - a.boxes === 3 && z.opened >= 3 && errs.length === 0, info: bad + ` boxes+${z.boxes - a.boxes} ${errs.slice(0, 2).join('|')}` };
});
/* 4) الحاسوب: المشهد داخل إطار الهاتف (430px) لا النافذة */
for (const [w, h] of [[1440, 900], [900, 480]]) await scenario(`desktop frame ${w}x${h}`, async () => {
  const { b, p, errs } = await open({ w, h, dpr: 1 }); await p.evaluate(`econBuyBox('bx3')`); await p.waitForFunction('!!CodisBox3D._ctl().cur'); await p.waitForTimeout(400);
  const g = await p.evaluate(`(()=>{const r=document.querySelector('.b3d-root').getBoundingClientRect(), f=document.body.getBoundingClientRect(), c=document.querySelector('canvas.b3d-cv'); return {rw:r.width, rl:r.left, fw:f.width, fl:f.left, rh:r.height, cw:c.width, csw:c.clientWidth}; })()`);
  await b.close(); const ok = Math.abs(g.rw - 430) < 1 && Math.abs(g.rl - g.fl) < 1 && Math.abs(g.rh - h) < 1 && errs.length === 0;
  return { ok, info: JSON.stringify(g) };
});
/* 5) نسبة البكسل: آيفون DPR3 يُرسم بدقة الجهاز (لا 1.5) */
await scenario('pixel ratio DPR3 phone', async () => {
  const { b, p, errs } = await open({ w: 390, h: 844, dpr: 3 }); await p.evaluate(`econBuyBox('bx1')`); await p.waitForFunction('!!CodisBox3D._ctl().cur'); await p.waitForTimeout(300);
  const g = await p.evaluate(`(()=>{const c=document.querySelector('canvas.b3d-cv'); return {px:c.width/c.clientWidth, K:CodisBox3D._ctl().cur.run.dom.K}; })()`); await b.close();
  return { ok: g.px >= 2.9 && g.K >= 2.5 && errs.length === 0, info: JSON.stringify(g) };
});
/* 6) المستويات التسعة × الصناديق الخمسة: عرض فقط بنتائج اصطناعية (لا اقتصاد) — بلا أخطاء وبمدة متصاعدة */
await scenario('nine reveal levels x five boxes (display only)', async () => {
  const { b, p, errs } = await open({}); const out = [];
  for (const n of [1, 2, 3, 4, 5]) for (const lv of [1, 3, 5, 7, 9]) {
    const r = await p.evaluate(`(()=>{ const L=CodisBox3D._lib()||(CodisBox3D.can(),CodisBox3D._lib()); const c=L.playSingle({n:${n}, lv:${lv}, calm:false, tier:'hi', theme:'paper', host:document.body, manual:true, reward:{title:'x', rgb:[255,200,90], rgb2:[255,150,60], face:null}, hooks:{}}); c.seek(c.total*.6); c.seek(c.total+.01); const t=c.total; c.abort(); return t; })()`);
    out.push(r.toFixed(1));
  }
  const left = await p.evaluate(`document.querySelectorAll('.b3d-root,canvas.b3d-cv').length`); await b.close();
  const mono = [0, 1, 2, 3, 4].every(i => +out[i * 5] < +out[i * 5 + 4]);
  return { ok: errs.length === 0 && left === 0 && mono, info: 'durations ' + out.join(' ') + ` left=${left} ${errs.slice(0, 2).join('|')}` };
});
/* 7) الصوت: أثناء مشهد حقيقي لا يُسمع أي مفتاح قديم؛ وكل chest.* يُصيَّر بلا صمت وبلا تشبّع */
await scenario('audio identity: only chest.* during scenes', async () => {
  const { b, p, errs } = await open({}); const n0 = await p.evaluate('CodisAudio.trace().length');
  await p.evaluate(`econBuyBox('bx5')`); await p.waitForFunction('!!CodisBox3D._ctl().cur'); for (let i = 0; i < 60 && await p.evaluate('!!document.querySelector(".b3d-root")'); i++) await p.waitForTimeout(500);
  await p.evaluate(`econBoxClose()`); await p.waitForTimeout(300); const n1 = await p.evaluate('CodisAudio.trace().length');
  await p.evaluate(`econBuyBox10('bx2')`); await p.waitForFunction('!!CodisBox3D._ctl().bulk'); await p.evaluate(`CodisBox3D._ctl().bulk.seek(CodisBox3D._ctl().bulk.total*.3)`); for (let i = 0; i < 80 && await p.evaluate('!!document.querySelector(".b3d-root")'); i++) await p.waitForTimeout(500);
  const keys = await p.evaluate(`CodisAudio.trace().slice(${n0}).map(x=>x.key)`), st = await p.evaluate('JSON.stringify(CodisAudio.stats())'); await b.close();
  const old = keys.filter(k => /^(box\.|bulk\.|reward\.achievement|store\.buy|press@box|open@box)/.test(k));
  return { ok: old.length === 0 && keys.some(k => k === 'chest.reveal') && errs.length === 0, info: `${keys.length} events, old=[${old.join(',')}] ctx=${st} sample=${[...new Set(keys)].join(',')}` };
});
await scenario('audio render: chest.* not silent, no clipping', async () => {
  const { b, p, errs } = await open({});
  const r = await p.evaluate(`(async()=>{ const ev=CodisAudio.events().filter(k=>/^chest\\./.test(k)), out={}; for(const k of ev){ for(const lv of [1,9]){ const buf=await CodisAudio.render(k,{lv, n:5, dur:1.2, i:1, of:3, k:3, w:1.2},3.5); let pk=0; for(let c=0;c<buf.numberOfChannels;c++){ const d=buf.getChannelData(c); for(let i=0;i<d.length;i++){ const a=Math.abs(d[i]); if(a>pk) pk=a; } } out[k+'@'+lv]=+pk.toFixed(3); } } return out; })()`);
  await b.close(); const vals = Object.entries(r), silent = vals.filter(([, v]) => v < .004), clip = vals.filter(([, v]) => v > .95);
  return { ok: vals.length >= 40 && !silent.length && !clip.length && errs.length === 0, info: `${vals.length} renders; max=${Math.max(...vals.map(v => v[1]))} silent=[${silent.map(v => v[0])}] clip=[${clip.map(v => v[0])}]` };
});
/* 8) WebKit (محرك الآيفون): صندوق واحد + ×10 حتى النهاية بدقة هبوط */
await scenario('webkit single + landing', async () => {
  const { b, p, errs } = await open({ br: 'webkit', w: 390, h: 844, dpr: 3 }); await p.evaluate(`econBuyBox('bx4')`); await p.waitForFunction('!!CodisBox3D._ctl().cur', null, { timeout: 30000 });
  const total = await p.evaluate(freeze('cur')); await p.evaluate(`__c.seek(${total}+.05)`); const L = await p.evaluate(landErr); await p.waitForTimeout(400); await waitGone(p); const z = await post(p); await b.close();
  return { ok: L.n === 1 && L.err < 1.5 && !z.root && errs.length === 0, info: `err=${L.err} ${errs.slice(0, 2).join('|')}` };
});
await scenario('webkit bulk + landing', async () => {
  const { b, p, errs } = await open({ br: 'webkit', w: 390, h: 844, dpr: 3 }); await p.evaluate(`econBuyBox10('bx5')`); await p.waitForFunction('!!CodisBox3D._ctl().bulk', null, { timeout: 30000 });
  const total = await p.evaluate(freeze('bulk')); await p.evaluate(`__c.seek(${total}+.05)`); const L = await p.evaluate(landErr); await p.waitForTimeout(400); await waitGone(p); const z = await post(p); await b.close();
  return { ok: L.n === 10 && L.err < 1.5 && !z.root && errs.length === 0, info: `err=${L.err} ${errs.slice(0, 2).join('|')}` };
});
console.log('\nSUMMARY', rows.filter(r => r[1] === 'PASS').length + '/' + rows.length + ' passed');
