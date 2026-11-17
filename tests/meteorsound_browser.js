/* CODIS-V66 — الهوية الصوتية «النيزك المشتعل» بالمحرك الحقيقي (Chrome، سياق صوت يعمل + OfflineAudioContext):
   (1) تصيير كل صوت @blazingMeteor: مسموع، بلا تشبّع، قصير، مختلف عن أصله، وحالات المهمة متميزة.
   (2) التوجيه بأثر المحرك (CodisAudio.trace = ما صدر فعلاً): داخل الغرفة المجهّزة فقط، الأصلي خارجها وبعد الإزالة، كتم، لا تسرّب.
   TEST=tests/meteorsound_browser.js node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_evaltest.mjs --cpu 1 */
(async ()=>{
  const results = [], sleep = ms=>new Promise(r=>setTimeout(r, ms));
  const T = (name, ok, info)=>results.push({ name, ok:!!ok, info:info === undefined ? '' : JSON.stringify(info).slice(0, 500) });
  CodisOutcomeUI.show = ()=>{}; CodisOutcomeUI.enqueue = ()=>{}; codisConfirm = async ()=>true;
  const stat = async (n, opts)=>{ const buf = await CodisAudio.render(n, Object.assign({ dur:.3, kind:'check', pct:50 }, opts || {}), 1.6); let pk = 0, e = 0, c0 = 0, n0 = 0;
    for(let c = 0; c < buf.numberOfChannels; c++){ const d = buf.getChannelData(c); for(let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if(a > pk) pk = a; e += d[i] * d[i]; if(a > .0005){ n0 = i; if(!c0) c0 = i; } } }
    return { pk:+pk.toFixed(4), rms:+Math.sqrt(e / (buf.length * buf.numberOfChannels)).toFixed(5), len:+((n0 - c0) / buf.sampleRate).toFixed(3) }; };
  const names = CodisAudio.events().filter(k=>/@blazingMeteor$/.test(k)).map(k=>k.replace('@blazingMeteor', ''));
  T(names.length + ' meteor sounds registered in the existing SOUNDS registry', names.length >= 20, names);
  const M = {}, O = {};
  for(const n of names){ try{ M[n] = await stat(n, { ctx:'blazingMeteor' }); O[n] = await stat(n); }catch(e){ M[n] = 'ERR ' + e.message; } }
  T('every meteor sound renders through the existing engine, audible, no clipping', names.every(n=>M[n].pk > .002 && M[n].pk < .95), M);
  T('meteor sounds are short (≤ .6 s; pen layers follow their stroke)', names.every(n=>/^pen\./.test(n) || M[n].len <= .6), M);
  const same = names.filter(n=>!(Math.abs(M[n].rms - O[n].rms) > 1e-5 || Math.abs(M[n].pk - O[n].pk) > 1e-4));
  T('each meteor sound differs from the original it replaces', !same.length, same.map(n=>[n, M[n], O[n]]));
  const st = ['task.done', 'task.half', 'task.none', 'task.undo'].map(n=>M[n].rms);
  T('the four task-state sounds are distinct from each other', new Set(st.map(x=>x.toFixed(5))).size === 4, st);
  const prim = ['press', 'press.primary', 'press.danger'].map(n=>M[n].rms);
  T('normal / primary / danger presses are distinct', new Set(prim.map(x=>x.toFixed(5))).size === 3, prim);
  const def = k=>CodisAudio.def(k), pairs = names.map(n=>{ const a = def(n + '@blazingMeteor'), b = def(n); return a.ch === b.ch && a.p === b.p && a.cd === b.cd && (a.hold || 0) === (b.hold || 0); });
  T('same channel / priority / cooldown / hold as the originals', pairs.every(Boolean), names.filter((n, i)=>!pairs[i]));

  CodisAudio.unlockNow(); for(let i = 0; i < 20 && CodisAudio.stats().state !== 'running'; i++) await sleep(100);
  T('audio context running in this browser', CodisAudio.stats().state === 'running', CodisAudio.stats());
  /* السجل محدود الطول (يدور) ⇒ نعلّم آخر عنصر بالمرجع لا بالعدد */
  const since = ()=>{ const a = CodisAudio.trace(), last = a[a.length - 1]; return ()=>{ const b = CodisAudio.trace(), i = last ? b.indexOf(last) : -1; return b.slice(i + 1).map(t=>t.key); }; };
  const wait = ()=>sleep(300);
  const pick = ()=>[...document.querySelectorAll('#day-task-list > .task-item')].find(x=>!/is-(done|half|none)|m-exiting|m-ghost/.test(x.className));
  CodisWallet.transact([], ()=>{ CodisWallet.applySilver('ADMIN_GRANT', 40000, 'qa', 'admin', 'qa|m' + Math.random(), null); return { ok:true }; });
  ['blazingMeteorPlanning', 'blazingMeteorOperations', 'blazingMeteorDiscipline'].forEach(id=>CodisPlanThemes.buy(id));
  const L = n=>Array.from({ length:n }, (_, i)=>(i + 1) + '- مهمة رقم ' + (i + 1)).join('\n');
  document.querySelector('.navbtn[data-page="planning"]').click(); await sleep(600);
  try{ startNewPlan(); }catch(e){} await sleep(300);
  const ti = document.getElementById('plan-tasks-input'); ti.value = L(35); ti.dispatchEvent(new Event('input', { bubbles:true }));
  distributePlan(); await sleep(900);
  document.querySelector('.navbtn[data-page="planning"]').click(); await sleep(500);
  CodisPlanThemes.equip('blazingMeteorPlanning', 'own'); codisPlanThemeApply('planning'); await sleep(200);
  let tr = since(); document.querySelector('#planning-active > .plan-card .plan-cta .btn').click(); await wait();
  let k = tr(); T('«أضف للخطة» in the dressed planning room ⇒ only meteor sounds played', k.length >= 1 && k.every(x=>/@blazingMeteor$/.test(x)), k);
  tr = since(); document.querySelector('#plan-editor .write-tab:not(.active)').click(); await wait();
  k = tr(); T('editor tab inside the room ⇒ meteor', k.length >= 1 && k.every(x=>/@blazingMeteor$/.test(x)), k);
  try{ cancelExtendPlan(); }catch(e){} await wait();
  tr = since(); document.querySelector('.navbtn[data-page="tasks"]').click(); await sleep(400);
  k = tr(); T('global navigation ⇒ original sounds only', k.every(x=>!/@blazingMeteor$/.test(x)), k);
  // العمليات غير مجهّزة ⇒ أصلي
  let it = pick(); tr = since(); it.querySelector('.stat-btn.stat-done').click(); await sleep(1700);
  k = tr(); T('operations NOT equipped (planning is) ⇒ original done sound', k.indexOf('task.done') !== -1 && k.every(x=>!/@blazingMeteor$/.test(x)), k);
  CodisPlanThemes.equip('blazingMeteorOperations', 'own'); codisPlanThemeApply('operations'); await sleep(200);
  it = pick(); tr = since(); it.querySelector('.stat-btn.stat-done').click(); await sleep(1700);
  k = tr(); T('operations equipped: «خلصتها» ⇒ task.done@blazingMeteor + plasma layers, nothing plain', k.indexOf('task.done@blazingMeteor') !== -1 && k.every(x=>/@blazingMeteor$/.test(x) || /^xp\./.test(x)), k);
  it = pick(); const xid = it && it.dataset.tid; tr = since(); it.querySelector('.stat-btn.stat-x').click(); await sleep(1700); const xinfo = { xid, after:(document.querySelector('#day-task-list > .task-item[data-tid="' + xid + '"]') || {}).className, n:document.querySelectorAll('#day-task-list > .task-item').length, tr:CodisAudio.trace().slice(-4).map(x=>x.key) };
  k = tr(); T('«ما سويتها» ⇒ task.none@blazingMeteor', k.indexOf('task.none@blazingMeteor') !== -1 && k.indexOf('task.done@blazingMeteor') === -1, { k, xinfo });
  it = pick(); tr = since(); it.querySelector('.task-del').click(); await sleep(900);
  k = tr(); T('delete (after its async confirmation) ⇒ meteor danger + delete sounds', k.length >= 1 && k.every(x=>/@blazingMeteor$/.test(x)), k);
  // التأديب
  document.querySelector('.navbtn[data-page="habits"]').click(); await sleep(500);
  const t = document.getElementById('new-habit-text'); t.value = 'رياضة'; addHabit(); await sleep(300);
  CodisPlanThemes.equip('blazingMeteorDiscipline', 'own'); codisPlanThemeApply('discipline'); await sleep(200);
  tr = since(); document.getElementById('habit-tab-quit').click(); await wait(); document.getElementById('habit-tab-build').click(); await wait();
  document.querySelector('#build-habit-list .habit-card .stat-btn.stat-done').click(); await sleep(600);
  document.querySelector('#build-habit-list .habit-card .hb-more-toggle').click(); await wait();
  k = tr(); T('discipline: tabs, log, details ⇒ meteor sounds only', k.length >= 3 && k.every(x=>/@blazingMeteor$/.test(x) || /^(reward|xp|coins|discipline)\./.test(x)), k);
  // إزالة ⇒ الأصل
  CodisPlanThemes.unequip('operations', 'own'); codisPlanThemeApply('operations');
  document.querySelector('.navbtn[data-page="tasks"]').click(); await sleep(500);
  it = pick(); tr = since(); it && it.querySelector('.stat-btn.stat-done').click(); await sleep(1700);
  k = tr(); T('after removing the operations theme the same action plays the original sounds', k.indexOf('task.done') !== -1 && k.every(x=>!/@blazingMeteor$/.test(x)), k);
  // كتم
  CodisPlanThemes.equip('blazingMeteorOperations', 'own'); codisPlanThemeApply('operations'); data.settings.sound.enabled = false; CodisAudio.applySettings(); await sleep(100);
  it = pick(); tr = since(); it && it.querySelector('.stat-btn.stat-half').click(); await sleep(400);
  k = tr(); T('sound disabled ⇒ the meteor room is silent', k.length === 0, k);
  data.settings.sound.enabled = true; CodisAudio.applySettings();
  // سريع ×6 ⇒ لا تكدس
  document.querySelector('.navbtn[data-page="planning"]').click(); await sleep(500);
  await sleep(300); const cta = document.querySelector('#planning-active > .plan-card .plan-cta .btn'); tr = since();
  for(let i = 0; i < 6; i++){ cta.click(); try{ cancelExtendPlan(); }catch(e){} }
  await wait(); k = tr(); T('six instant presses ⇒ cooldown keeps the burst small, all meteor, voice limit respected', k.length >= 1 && k.length <= 5 && k.every(x=>/@blazingMeteor$/.test(x)) && CodisAudio.stats().voices <= 12, { k, v:CodisAudio.stats().voices });
  document.querySelector('.navbtn[data-page="tasks"]').click(); await sleep(300);
  T('scope never leaks after leaving the room (immediate and sticky both null)', CodisAudio.scope() === null && CodisAudio.sticky() === null, [CodisAudio.scope(), CodisAudio.sticky()]);
  return JSON.stringify({ results });
})()
