/* CODIS-V69 — كلفة رسم «بدايات الغرف» (Chrome عبر cdp.mjs: محاكاة آيفون DPR3 + معالج مبطّأ).
   TEST=tests/introperf_browser.js node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_evaltest.mjs --cpu 4
   لكل بداية: أطوال الإطارات أثناء التشغيل (rAF) مقارنة بالانتقال نفسه بلا بداية، ومدة البقاء الفعلية. */
(async()=>{
  const sleep = ms=>new Promise(r=>setTimeout(r, ms)), results = [];
  const ok = (name, c, info)=>results.push({ name, ok:!!c, info:JSON.stringify(info) });
  CodisWallet.transact([], ()=>{ CodisWallet.applySilver('ADMIN_GRANT', 20000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; });
  let LONG = []; const frames = async (ms)=>{ const out = []; const t0 = performance.now(); let last = t0; const end = last + ms; LONG = []; await new Promise(res=>{ (function f(t){ const d = t - last; out.push(d); if(d > 50) LONG.push([Math.round(last - t0), Math.round(d)]); last = t; if(t < end) requestAnimationFrame(f); else res(); })(performance.now()); }); return out.slice(1); };
  const stat = a=>{ const s = a.slice().sort((x, y)=>x - y); return { n:a.length, p50:+s[Math.floor(s.length * .5)].toFixed(1), p95:+s[Math.floor(s.length * .95)].toFixed(1), max:+s[s.length - 1].toFixed(1), over50:a.filter(x=>x > 50).length }; };
  const out = {};
  for(const id of ['planningIntro', 'tasksIntro', 'learnIntro', 'habitsIntro']){
    const room = CodisRoomIntros.def(id).room;
    navigateToPage('settings'); await sleep(700);
    navigateToPage(room); const base = stat(await frames(2400)); const longBase = LONG; await sleep(300);   /* بلا بداية (غير مملوكة بعد) */
    CodisRoomIntros.buy(id);
    navigateToPage('settings'); await sleep(700);
    const t0 = performance.now(); navigateToPage(room); const withI = stat(await frames(2400));
    while(document.querySelector('.ri-layer') && performance.now() - t0 < 6000) await sleep(20);
    const life = Math.round(performance.now() - t0);
    out[id] = { base, withI, life, long:LONG };
    ok(id + ': intro adds no sustained jank: p95 ≤ 20ms (CPU×4) · long frames [t,ms] nav-only=' + JSON.stringify(longBase) + ' with-intro=' + JSON.stringify(LONG) + ' p95=' + withI.p95, withI.p95 <= 20, { base, withI, longBase, longIntro:LONG });
    ok(id + ': lifetime 2.3–3.1s (play 2.35s + fade 0.34s)', life >= 2300 && life <= 3100, life);
  }
  /* تقليل الحركة: لقطة نهائية + 1.3ث + تلاشٍ 0.2ث */
  window.CODIS_REDUCED_MOTION = true;
  navigateToPage('settings'); await sleep(500); const t1 = performance.now(); navigateToPage('tasks'); await sleep(60);
  const calm = !!document.querySelector('.ri-layer .ri-scene.is-calm');
  while(document.querySelector('.ri-layer') && performance.now() - t1 < 5000) await sleep(20);
  const lifeC = Math.round(performance.now() - t1); window.CODIS_REDUCED_MOTION = false;
  ok('reduced motion: static scene, lifetime 1.4–1.8s · ' + lifeC + 'ms', calm && lifeC >= 1400 && lifeC <= 1800, lifeC);
  return { results, out };
})()
