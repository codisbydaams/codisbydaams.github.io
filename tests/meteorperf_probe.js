/* CODIS-V66 — تشخيص أداء (أداة تحقيق، لا اختبار قبول): يقيس متوسط الإطار «خامل» بغرفة العمليات مع تعطيل أجزاء من طبقة v66 بالتتابع.
   TEST=tests/meteorperf_probe.js node tools/prof/cdp.mjs <url> tools/prof/s_evaltest.mjs --cpu 4 */
(async ()=>{
  const results = [], sleep = ms=>new Promise(r=>setTimeout(r, ms));
  const T = (name, ok, info)=>results.push({ name, ok:!!ok, info:info === undefined ? '' : JSON.stringify(info).slice(0, 1500) });
  CodisOutcomeUI.show = ()=>{}; CodisOutcomeUI.enqueue = ()=>{};
  CodisWallet.transact([], ()=>{ CodisWallet.applySilver('ADMIN_GRANT', 20000, 'qa', 'admin', 'qa|p' + Math.random(), null); return { ok:true }; });
  CodisPlanThemes.buy('blazingMeteorOperations');
  const L = n=>Array.from({ length:n }, (_, i)=>(i + 1) + '- مهمة رقم ' + (i + 1) + ' لمراجعة التقرير').join('\n');
  try{ startNewPlan(); }catch(e){} await sleep(300);
  const ti = document.getElementById('plan-tasks-input'); ti.value = L(70); ti.dispatchEvent(new Event('input', { bubbles:true }));
  distributePlan(); await sleep(900);
  document.querySelector('.navbtn[data-page="tasks"]').click(); await sleep(800);
  const MOVE = !!window.__PROBE_MOVE;
  const idle = async ()=>MOVE ? mv() : idle0();
  const idle0 = async ()=>{ await sleep(300); const fr = []; let last = performance.now(); for(let i = 0; i < 60; i++){ const t = await new Promise(r=>requestAnimationFrame(r)); fr.push(t - last); last = t; } fr.sort((a, b)=>a - b); return +(fr.slice(2).reduce((a, b)=>a + b, 0) / (fr.length - 2)).toFixed(1); };
  async function mv(){ const list = document.getElementById('day-task-list'), r = list.getBoundingClientRect(); await sleep(300); const fr = []; let last = performance.now();
    for(let i = 0; i < 60; i++){ const x = r.left + (i * 7) % Math.max(10, r.width), y = r.top + 20 + (i * 13) % 300; const tg = document.elementFromPoint(x, Math.min(y, innerHeight - 10)) || list;
      tg.dispatchEvent(new PointerEvent('pointermove', { bubbles:true, pointerType:'mouse', clientX:x, clientY:y })); const t = await new Promise(r=>requestAnimationFrame(r)); fr.push(t - last); last = t; }
    try{ CodisMeteorFx.reset(); }catch(e){} fr.sort((a, b)=>a - b); return +(fr.slice(2).reduce((a, b)=>a + b, 0) / (fr.length - 2)).toFixed(1); }
  const out = { base:await idle() };
  CodisPlanThemes.equip('blazingMeteorOperations', 'own'); codisPlanThemeApply('operations'); await sleep(400);
  out.met = await idle();
  const sh = [...document.styleSheets].find(s=>s.ownerNode && s.ownerNode.id === 'codis-v66-css');
  sh.disabled = true; out.sheetOff = await idle(); sh.disabled = false; out.sheetOn = await idle();
  { const st = document.createElement('style'); document.head.appendChild(st);
    const V = { noFlow:'.bm-flow{ animation:none !important; }', noFlowFilter:'.bm-motif *{ filter:none !important; }', noOrb:'.bm-orb{ animation:none !important; }', noMeteor:'.bm-meteor{ animation:none !important; display:none !important; }', noEdge:'#page-tasks .xp-hud::after{ animation:none !important; }', allOff:'.bm-decor *, #page-tasks *::after{ animation:none !important; }', motifHidden:'.bm-motif{ display:none !important; }' };
    for(const k of Object.keys(V)){ st.textContent = V[k]; out['x_' + k] = await idle(); } st.remove(); }
  if(window.__PROBE_ONLYX){ T('probe (info)', false, out); return JSON.stringify({ results }); }
  /* تعطيل كل قاعدة بالتتابع على مجموعات: نحذف القواعد ونعيدها */
  const rules = [...sh.cssRules].map(r=>r.cssText), N = rules.length;
  const setRules = keep=>{ while(sh.cssRules.length) sh.deleteRule(0); keep.forEach(t=>{ try{ sh.insertRule(t, sh.cssRules.length); }catch(e){} }); };
  const groups = 8, sz = Math.ceil(N / groups);
  for(let g = 0; g < groups; g++){ setRules(rules.filter((_, i)=>Math.floor(i / sz) !== g)); out['without_' + g + ' (' + (rules[g * sz] || '').slice(0, 70) + ')'] = await idle(); }
  if(window.__PROBE_RULES){ const lim = Math.min(N, sz * 3); const per = [];
    for(let i = 0; i < lim; i++){ setRules(rules.filter((_, j)=>j !== i)); const v = await idle(); if(v < out.met - 3) per.push(v + ' ← ' + rules[i].slice(0, 110)); }
    out.per = per; }
  setRules(rules);
  out.anims = document.getAnimations().filter(a=>a.playState === 'running').map(a=>(a.animationName || a.constructor.name) + ':' + (a.effect && a.effect.target ? (a.effect.target.className && String(a.effect.target.className).slice(0, 30)) : '')).slice(0, 20);
  T('probe (info)', false, out);
  return JSON.stringify({ results });
})()
