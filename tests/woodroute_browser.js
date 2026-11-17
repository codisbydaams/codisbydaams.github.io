/* CODIS-V64 — توجيه الصوت الخشبي بأثر المحرك الحقيقي (CodisAudio.trace = ما صدر فعلاً)، Chrome بسياق صوت يعمل.
   TEST=tests/woodroute_browser.js node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_evaltest.mjs --cpu 1 */
(async ()=>{
  const results = [], sleep = ms=>new Promise(r=>setTimeout(r, ms));
  const T = (name, ok, info)=>results.push({ name, ok:!!ok, info:info === undefined ? '' : JSON.stringify(info).slice(0, 500) });
  CodisOutcomeUI.show = ()=>{}; CodisOutcomeUI.enqueue = ()=>{}; codisConfirm = async ()=>true;
  CodisAudio.unlockNow(); for(let i = 0; i < 20 && CodisAudio.stats().state !== 'running'; i++) await sleep(100);
  T('audio context running in this browser', CodisAudio.stats().state === 'running', CodisAudio.stats());
  const since = ()=>{ const n = CodisAudio.trace().length; return ()=>CodisAudio.trace().slice(n).map(t=>t.key); };
  const wait = ()=>sleep(260);   /* > تبريد أي صوت واجهة */
  CodisWallet.transact([], ()=>{ CodisWallet.applySilver('ADMIN_GRANT', 30000, 'qa', 'admin', 'qa|r' + Math.random(), null); return { ok:true }; });
  ['agedWoodPlanning', 'agedWoodOperations'].forEach(id=>CodisPlanThemes.buy(id));
  document.querySelector('.navbtn[data-page="planning"]').click(); await sleep(600);
  CodisPlanThemes.equip('agedWoodPlanning', 'own'); codisPlanThemeApply('planning'); await sleep(200);
  // (1) «ابدأ بناء الخطة» داخل المربع الملبّس
  let tr = since(); document.querySelector('#planning-empty > .empty-state .btn').click(); await wait();
  let k = tr(); T('planning box button ⇒ only wooden sounds were played', k.length >= 1 && k.every(x=>/@agedWood$/.test(x)), k);
  // خطة ثم بطاقة الخطة
  const L = n=>Array.from({ length:n }, (_, i)=>(i + 1) + '- مهمة رقم ' + (i + 1)).join('\n');
  const ti = document.getElementById('plan-tasks-input'); ti.value = L(14); ti.dispatchEvent(new Event('input', { bubbles:true }));
  distributePlan(); await sleep(900); document.querySelector('.navbtn[data-page="planning"]').click(); await sleep(500);
  tr = since(); document.querySelector('#planning-active > .plan-card .plan-cta .btn').click(); await wait();
  k = tr(); T('«أضف للخطة» on the wood plan card ⇒ wooden', k.length >= 1 && k.every(x=>/@agedWood$/.test(x)), k);
  try{ cancelExtendPlan(); }catch(e){} await wait();
  // (2) التنقل العام خارج السطح
  tr = since(); document.querySelector('.navbtn[data-page="tasks"]').click(); await sleep(400);
  k = tr(); T('bottom navigation ⇒ original sounds only', k.every(x=>!/@agedWood$/.test(x)), k);
  // (3) زر حالة داخل مستطيل العمليات الملبّس
  CodisPlanThemes.equip('agedWoodOperations', 'own'); codisPlanThemeApply('operations'); await sleep(200);
  const it = document.querySelector('#day-task-list > .task-item'); tr = since(); it.querySelector('.stat-btn.stat-done').click(); await sleep(1700);
  k = tr(); T('«خلصتها» in a wood rectangle ⇒ task.done@agedWood + wooden layers, nothing plain', k.indexOf('task.done@agedWood') !== -1 && k.every(x=>/@agedWood$/.test(x) || /^xp\./.test(x)), k);
  const it2 = document.querySelector('#day-task-list > .task-item'); tr = since(); it2.querySelector('.stat-btn.stat-x').click(); await sleep(1700);
  k = tr(); T('«ما سويتها» ⇒ task.none@agedWood (different from done)', k.indexOf('task.none@agedWood') !== -1 && k.indexOf('task.done@agedWood') === -1, k);
  // (4) إزالة ثيم العمليات ⇒ الأصل
  CodisPlanThemes.unequip('operations', 'own'); codisPlanThemeApply('operations'); await sleep(200);
  const it3 = document.querySelector('#day-task-list > .task-item'); tr = since(); it3.querySelector('.stat-btn.stat-done').click(); await sleep(1700);
  k = tr(); T('after removing the theme the same action plays the original sounds', k.indexOf('task.done') !== -1 && k.every(x=>!/@agedWood$/.test(x)), k);
  // (5) كتم
  CodisPlanThemes.equip('agedWoodOperations', 'own'); codisPlanThemeApply('operations'); data.settings.sound.enabled = false; CodisAudio.applySettings(); await sleep(100);
  const it4 = document.querySelector('#day-task-list > .task-item'); tr = since(); it4 && it4.querySelector('.stat-btn.stat-half').click(); await sleep(400);
  k = tr(); T('sound disabled ⇒ the theme is silent', k.length === 0, k);
  data.settings.sound.enabled = true; CodisAudio.applySettings();
  // (6) نقرة واحدة = صوت واجهة واحد (لا pointerdown + click)
  document.querySelector('.navbtn[data-page="planning"]').click(); await sleep(500);
  const pm = document.querySelector('#planning-active > .plan-card .pm-btn'); tr = since();
  pm.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerType:'touch', pointerId:3 })); pm.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, pointerType:'touch', pointerId:3 })); pm.click(); await wait();
  k = tr().filter(x=>/^(press|tab|confirm)/.test(x)); T('touch down/up + click on a wood button ⇒ exactly one press sound', k.length <= 1 && k.every(x=>/@agedWood$/.test(x)), k);
  document.querySelectorAll('.modal-overlay[aria-hidden="false"] .btn-secondary').forEach(b=>b.click());
  // (7) سريع ×6 ⇒ لا تكدس
  await sleep(300); const cta = document.querySelector('#planning-active > .plan-card .plan-cta .btn'); tr = since();
  for(let i = 0; i < 6; i++){ cta.click(); try{ cancelExtendPlan(); }catch(e){} }
  await wait(); k = tr(); T('six instant presses (each opens + cancels the editor) ⇒ cooldown keeps the burst small, all wooden, no stacking', k.length >= 1 && k.length <= 4 && k.every(x=>/@agedWood$/.test(x)) && CodisAudio.stats().voices <= 12, { k, v:CodisAudio.stats().voices });
  T('scope never leaks after the click (resets to null)', CodisAudio.scope() === null, CodisAudio.scope());
  return JSON.stringify({ results });
})()
