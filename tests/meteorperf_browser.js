/* CODIS-V66 — أداء غرفة العمليات بثيم «النيزك المشتعل» مقابل الغرفة الأصلية (Chrome، CPU مبطّأ عبر cdp.mjs):
   عاصفة حركة مؤشر (120 حدث pointermove) + تمرير، ثم إطارات rAF: المتوسط/الأسوأ، عدد الحركات المستمرة، عقد الطبقة الزخرفية.
   TEST=tests/meteorperf_browser.js node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_evaltest.mjs --cpu 4 */
(async ()=>{
  const results = [], sleep = ms=>new Promise(r=>setTimeout(r, ms));
  const T = (name, ok, info)=>results.push({ name, ok:!!ok, info:info === undefined ? '' : JSON.stringify(info).slice(0, 600) });
  CodisOutcomeUI.show = ()=>{}; CodisOutcomeUI.enqueue = ()=>{};
  CodisWallet.transact([], ()=>{ CodisWallet.applySilver('ADMIN_GRANT', 20000, 'qa', 'admin', 'qa|p' + Math.random(), null); return { ok:true }; });
  CodisPlanThemes.buy('blazingMeteorOperations');
  const L = n=>Array.from({ length:n }, (_, i)=>(i + 1) + '- مهمة رقم ' + (i + 1) + ' لمراجعة التقرير').join('\n');
  try{ startNewPlan(); }catch(e){} await sleep(300);
  const ti = document.getElementById('plan-tasks-input'); ti.value = L(70); ti.dispatchEvent(new Event('input', { bubbles:true }));
  distributePlan(); await sleep(900);
  document.querySelector('.navbtn[data-page="tasks"]').click(); await sleep(800);
  const run = async (mode)=>{
    const list = document.getElementById('day-task-list'), r = list.getBoundingClientRect(), m = codisScrollerOf(list);
    const frames = []; let last = performance.now(), on = true; const tick = t=>{ frames.push(t - last); last = t; if(on) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    for(let i = 0; i < 120; i++){ const x = r.left + (i * 7) % Math.max(10, r.width), y = r.top + 20 + (i * 13) % 300; const tg = mode === 'storm' ? (document.elementFromPoint(x, Math.min(y, innerHeight - 10)) || list) : list;
      if(mode !== 'scroll') tg.dispatchEvent(new PointerEvent('pointermove', { bubbles:true, pointerType:'mouse', clientX:x, clientY:y })); if(mode !== 'idle' && i % 10 === 0){ m.scrollTop += 40; } await new Promise(r=>requestAnimationFrame(r)); }
    on = false; await sleep(50); m.scrollTop = 0;
    try{ CodisMeteorFx.reset(); }catch(e){} const f = frames.slice(2).sort((a, b)=>a - b);
    return { n:f.length, avg:+(f.reduce((a, b)=>a + b, 0) / f.length).toFixed(1), p95:+f[Math.floor(f.length * .95)].toFixed(1), worst:+f[f.length - 1].toFixed(1),
      anims:document.getAnimations().filter(a=>a.playState === 'running').length, nodes:document.querySelectorAll('#page-tasks *').length };
  };
  const base = await run('storm'), baseS = await run('scroll'), baseI = await run('idle');
  CodisPlanThemes.equip('blazingMeteorOperations', 'own'); codisPlanThemeApply('operations'); await sleep(500);
  const met = await run('storm'), metS = await run('scroll'), metI = await run('idle'); try{ CodisMeteorFx.reset(); }catch(e){}
  T('frames measured (original vs meteor)', base.n > 60 && met.n > 60, { base, met });
  T('meteor room adds ≤ 8 continuous animations (breath, energy edge ×1, flow, 2 meteors…)', met.anims - base.anims <= 8, { base:base.anims, met:met.anims });
  T('decorative layer adds ≤ 40 DOM nodes to the room', met.nodes - base.nodes <= 40, { base:base.nodes, met:met.nodes });
  T('scrolling only (the common case on phones): average frame within +25% of the original room', metS.avg <= baseS.avg * 1.25 + 1, { baseS, metS });
  T('idle (continuous ambient motion only): average frame within +25% of the original room', metI.avg <= baseI.avg * 1.25 + 1, { baseI, metI });
  T('pointer storm (mouse light following every frame) + scroll at CPU×4: average inside the 60 fps budget (≤ 16.7 ms), p95 ≤ 33 ms', met.avg <= 16.7 && met.p95 <= 33, { base, met });
  document.dispatchEvent(new Event('visibilitychange'));
  return JSON.stringify({ results });
})()
