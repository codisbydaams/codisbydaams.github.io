/* ================= CODIS-V66 · نطاق «الغرفة كاملة» + BLAZING METEOR (المعاينات · ورقة «المنجزة» · التفاعل) =================
   (1) codisThemeRoomSurface(tg): سطح kind:'room' = جذر الغرفة (CODIS_THEME_TARGETS[tg].page) بصنف .pt-room؛ يُستعمل فقط لثيم يعلن apply:'room'.
   (2) المعاينة: مصغّرة = مخطط غرفة ثابت خاص بكل غرفة؛ كبيرة = غرفة مصغّرة كاملة بمكوّنات التطبيق نفسها وبيانات عيّنة ثابتة (بلا معرّفات، inert،
       لا تستدعي وظائف التطبيق ولا تمسّ البيانات)، وأنماط الغرف المربوطة بالمعرّفات تُعكس إليها بآلية V59 (CODIS_PT_PV_MAP).
   (3) CodisMeteorFx: مستمعات Pointer Events مفوَّضة passive على document (لا مستمع لكل زر، لا preventDefault)، requestAnimationFrame واحد،
       transform/opacity + Web Animations للحلقات/الشرارات (عدد عناصر ثابت يُعاد استعماله). يعمل فقط داخل غرفة مجهّزة ظاهرة. */
Object.assign(CODIS_PT_PV_MAP, { 'page-habits':'pt-pv-dsc', 'habit-tab-build':'pt-pv-htb', 'habit-tab-quit':'pt-pv-htq', 'build-habit-list':'pt-pv-hlist', 'tasks-content':'pt-pv-tc', 'learn-content':'pt-pv-lc' });
var codisMeteorFxApi = null;   /* var: تقرؤه codisPlanThemeStrip بأمان حتى قبل تعريف الوحدة */
function codisThemeIsRoom(d){ return !!(d && d.apply === 'room'); }
function codisThemeRoomSurface(tg){ const T = CODIS_THEME_TARGETS[tg]; return (T && T.page) ? { key:'room', kind:'room', sel:T.page, label:'الغرفة كاملة', short:'الغرفة كاملة' } : null; }
function codisThemeCoversOf(d){
  if(codisThemeIsRoom(d)){ const T = CODIS_THEME_TARGETS[d.target] || {}; return ['الغرفة كاملة من بدايتها إلى نهايتها، ومعها كل عنصر يُضاف لاحقاً'].concat(Array.isArray(T.parts) ? T.parts : []); }
  return codisThemeSurfaces(d && d.target).map(x=>x.label || x.key);
}
/* ورقة تُفتح من داخل غرفة ملبّسة بالكامل (مثل «المنجزة») تأخذ هوية الغرفة وصوتها ما دام الثيم مجهّزاً */
function codisThemeTagSheet(root, opener){
  try{
    const r = opener && opener.closest ? opener.closest('.pt-room[data-pt][data-pt-target]') : null; if(!r || !root || r.closest('.pt-stage, .pt-ov')) return;
    const d = CodisPlanThemes.def(r.getAttribute('data-pt')); if(!codisThemeIsRoom(d) || !CodisPlanThemes.isEquipped(d.id)) return;
    codisPlanThemeVars(d).forEach(p=>root.style.setProperty(p[0], p[1]));
    root.setAttribute('data-pt', d.id); root.setAttribute('data-pt-target', d.target); root.setAttribute('data-pt-surface', 'sheet'); root.classList.add('pt-room-sheet');
  }catch(e){}
}
const CODIS_RT_ROOMCLS = { planning:'pt-pv-planning', operations:'pt-pv-ops', teacher:'pt-pv-lrn', discipline:'pt-pv-dsc' };
const CODIS_RT_EYEBROW = { planning:'PLANNING · DRAFTING TABLE', operations:'OPERATIONS · EXECUTION', teacher:'TEACHER · STUDY PATH', discipline:'DISCIPLINE · CONTROL CHAMBER' };
/* المصغّرة: مخطط غرفة ثابت (رأس + مكوّنات الغرفة الأساسية) بالرموز نفسها — بلا حركة ولا تفاعل */
function codisRoomThemeMiniHtml(d){
  const tg = d.target, P = (c, inner)=>'<i class="mm-panel ' + c + '">' + (inner || '') + '</i>';
  let body = '';
  if(tg === 'planning') body = P('is-card', '<i class="mm-k"></i><i class="mm-l w60"></i><i class="mm-bar"><b style="width:64%"></b></i><i class="mm-btn"></i>') +
    '<i class="mm-row"><i class="mm-pill is-on"></i><i class="mm-pill"></i></i>' + P('is-write', '<i class="mm-l w80"></i><i class="mm-l w60"></i><i class="mm-l w70"></i>') + '<i class="mm-row"><i class="mm-btn"></i><i class="mm-btn is-sec"></i></i>';
  else if(tg === 'discipline') body = '<i class="mm-row"><i class="mm-pill is-on is-wide"></i><i class="mm-pill is-wide"></i></i><i class="mm-row is-end"><i class="mm-btn is-sec is-sm"></i></i>' +
    P('is-habit', '<i class="mm-ring"></i><i class="mm-l w60"></i><i class="mm-l w40"></i><i class="mm-btn is-full"></i>') + P('is-habit', '<i class="mm-ring"></i><i class="mm-l w50"></i><i class="mm-l w40"></i>');
  else body = P('is-hud', '<i class="mm-l w40"></i><i class="mm-bar"><b style="width:' + (tg === 'teacher' ? 58 : 40) + '%"></b></i>') +
    '<i class="mm-row is-days"><i class="mm-day"></i><i class="mm-day is-on"></i><i class="mm-day"></i><i class="mm-day"></i></i>' +
    P('is-task', (tg === 'teacher' ? '<i class="mm-gem"></i>' : '') + '<i class="mm-l w70"></i><i class="mm-st"><b class="s-x"></b><b class="s-h"></b><b class="s-d"></b></i>') +
    P('is-task', (tg === 'teacher' ? '<i class="mm-gem"></i>' : '') + '<i class="mm-l w50"></i><i class="mm-st"><b class="s-x"></b><b class="s-h"></b><b class="s-d is-on"></b></i>');
  return '<div class="bm-mroom" data-pt="' + d.id + '" data-pt-target="' + tg + '" style="' + escapeHtml(codisPlanThemeStyle(d)) + '" aria-hidden="true">' + codisPlanThemeDecorHtml(d, true) +
    '<i class="mm-eb"></i><i class="mm-t"></i>' + body + '</div>';
}
/* عادة عيّنة ثابتة لمعاينة التأديب: نفس renderHabitRow الحقيقي (نسخة HTML فقط بلا معالجات)، وإن تعذّر ⇒ نسخة ثابتة بالأصناف نفسها */
function codisRoomThemeHabitHtml(){
  try{
    const log = {}; for(let i = 1; i <= 5; i++) log[dateKeyOffset(-i)] = true;
    const h = { id:'ptpv-h1', text:'قراءة عشر صفحات', type:'E', importance:'important', createdAt:dateKeyOffset(-20), log:log, milestones:{}, misses:[], doneEvents:{}, failLog:{}, checkedThrough:yesterdayKey(), c7:todayKey() };
    const was = codisJustChangedId, r = renderHabitRow(h); codisJustChangedId = was;
    r.row.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
    return r.row.outerHTML;
  }catch(e){
    return '<div class="habit-card hbx imp-important is-daily"><div class="hbx-head"><div class="hbx-ring"><div class="streak-ring"><span class="streak-num">5</span></div><span class="hbx-cap">سلسلة</span></div><div class="habit-body"><div class="habit-name">قراءة عشر صفحات</div><div class="hb-tags"><span class="pill hb-pill">يومية</span><span class="pill hb-pill is-important">مهمة</span></div></div></div>' +
      '<div class="hb-glance"><span>الأفضل <b>5</b></span><span>أيام منجزة <b>5</b></span><span>المحطة <b>7</b></span></div><div class="hbx-acts"><button type="button" class="stat-btn stat-done"><span class="hbx-lab">سويتها اليوم</span></button></div></div>';
  }
}
/* المعاينة الكبيرة: الغرفة كاملة مصغّرة */
function codisRoomThemePvHtml(d){
  const tg = d.target, T = CODIS_THEME_TARGETS[tg] || {}, L = tg === 'teacher', btn = (c, t)=>'<button type="button" class="' + c + '" tabindex="-1">' + t + '</button>';
  const head = '<header class="page-head"><span class="room-eyebrow">' + CODIS_RT_EYEBROW[tg] + '</span><div class="page-title">' + escapeHtml(T.room || '') + '</div>' +
    (tg === 'operations' || L ? '<div class="page-context"><strong>الثلاثاء</strong><span class="today-chip">اليوم</span></div>' : '') + '</header>';
  let body = '';
  if(tg === 'planning'){
    body = '<div class="pt-pv-plan"><div class="plan-card"><span class="eyebrow">الخطة</span><div class="plan-name">خطة الأسبوع</div><div class="plan-info">١٢ مهمة، ٦ عناصر تعلّم</div>' +
      '<div class="plan-progress"><div class="plan-progress-row"><span>نسبة الإنجاز</span><span class="plan-pct">٦٤٪</span></div><div class="xp-track"><div class="xp-fill" style="width:64%;"></div></div></div>' +
      '<div class="plan-cta">' + btn('btn btn-primary', codisIcon('next') + 'أضف للخطة') + '</div><div class="plan-more">' + btn('pm-btn', 'احفظ الخطة') + btn('pm-btn', 'خطة جديدة') + btn('pm-btn is-danger', 'إيقاف الخطة') + '</div></div></div>' +
      '<div class="pt-pv-editor"><div class="write-head"><div class="write-head-row"><div class="write-title">شنو تريد تنجز؟</div>' + btn('saved-plans-link', '<span>خططي المحفوظة</span>' + codisIcon('expand', { size:'sm' })) + '</div></div>' +
      '<div class="write-tabs">' + btn('write-tab active', 'المهام') + btn('write-tab', 'التعلّم') + '</div>' +
      '<div class="pt-pv-wsec write-panel"><div class="write-box"><textarea readonly tabindex="-1" aria-hidden="true">١٥ ريلز\n!أراجع تقرير المبيعات\nأرد على رسائل الزبائن</textarea><span class="write-count show">٣ مهام</span></div></div>' +
      '<div class="write-actions">' + btn('btn btn-primary', '<span>رتّب خطتي</span>' + codisIcon('next')) + btn('btn btn-secondary', 'حفظ الخطة') + '</div></div>';
  } else if(tg === 'discipline'){
    body = '<div class="disc-modes">' + btn('disc-mode is-active pt-pv-htb', '<span class="disc-mode-t"><span>أكتسبها</span><small>عادات تبنيها</small></span><span class="disc-mode-n">٢</span>') +
      btn('disc-mode pt-pv-htq', '<span class="disc-mode-t"><span>أتخلص منها</span><small>عادات تتركها</small></span><span class="disc-mode-n">١</span>') + '</div>' +
      '<div class="disc-toolbar"><p class="disc-mode-desc">يومية أو أسبوعية — تسجّلها كل ما تنجزها.</p>' + btn('disc-add-trigger', '<span class="disc-add-glyph"></span><span>إضافة عادة</span>') + '</div>' +
      '<div class="card add-habit"><div><span class="field-label">اسم العادة</span><input type="text" readonly tabindex="-1" aria-hidden="true" value="رياضة صباحية"></div>' +
      '<div><div class="field-label">الأهمية</div><div class="hb-chips">' + btn('hb-chip is-on', 'عادية') + btn('hb-chip', 'مهمة') + btn('hb-chip', 'حرجة') + '</div></div>' +
      '<div class="add-habit-actions">' + btn('btn btn-primary', 'إضافة') + btn('btn btn-quiet', 'إلغاء') + '</div></div>' +
      '<div class="pt-pv-hlist">' + codisRoomThemeHabitHtml() + '</div>';
  } else {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'];
    body = '<section class="xp-hud"><div class="xp-hud-top"><div class="xp-id"><span class="xp-label">إنجاز اليوم</span><span class="xp-count">خلّصت ٢ من ٥</span></div><span class="xp-value">' + (L ? '٥٨٪' : '٤٠٪') + '</span></div>' +
      '<div class="xp-track"><div class="xp-fill" style="width:' + (L ? 58 : 40) + '%"></div></div></section>' +
      '<div class="' + (L ? 'pt-pv-lc' : 'pt-pv-tc') + '"><div class="day-tabs">' + days.map((n, i)=>btn('day-tab' + (i === 2 ? ' active today' : i === 3 ? ' locked' : ''), n + '<span class="dcount">' + (i === 3 ? 'مقفل' : (i + 3) + ' مهام') + '</span>')).join('') + '</div>' +
      '<div class="section-head"><h2 class="section-title">' + (L ? 'التعلّم' : 'المهام') + '</h2>' + btn('btn btn-quiet', 'إعادة التخطيط') + '</div>' +
      '<div class="pt-pv-list">' + codisPtPvTask({ id:'ptpv1', text:L ? 'قراءة الفصل الثالث من كتاب الإدارة' : 'مراجعة تقرير المبيعات الأسبوعي', status:'', priority:'high' }, L) +
      codisPtPvTask({ id:'ptpv2', text:L ? 'مراجعة المفردات الجديدة' : 'اتصال بفريق العمليات', status:'half', priority:'' }, L) + '</div>' +
      '<div class="row-input"><input type="text" readonly tabindex="-1" aria-hidden="true" placeholder="' + (L ? 'عنصر تعلّم إضافي' : 'مهمة إضافية') + '">' + btn('btn btn-secondary', 'إضافة') + '</div></div>';
  }
  return '<div class="bm-pv pt-room ' + CODIS_RT_ROOMCLS[tg] + '" data-pt="' + d.id + '" data-pt-target="' + tg + '" data-pt-surface="room" style="' + escapeHtml(codisPlanThemeStyle(d)) + '">' +
    codisPlanThemeDecorHtml(d, false) + '<div class="bm-pv-in">' + head + body + '</div></div>';
}
function codisRoomThemeStageHtml(d, big){
  if(!big) return '<div class="pt-stage is-mini bm-mini">' + codisRoomThemeMiniHtml(d) + '</div>';
  return '<div class="pt-slides" data-n="1" data-i="0"><div class="pt-stage is-big pt-slide is-on is-room" data-i="0" data-surface="room" inert>' + codisRoomThemePvHtml(d) + '</div></div>';
}
const CodisMeteorFx = (function(){
  const ROOM = '.pt-room[data-pt^="blazingMeteor"]';
  const PANEL = '.task-item, .habit-card, .plan-card, .xp-hud, .write-box, .empty-state, .card, .saved-plan-row, .row-input, .disc-mode, .day-tab, .cd-trigger';
  const PRESS = 'button, .btn, .stat-btn, .pm-btn, .task-wt, .day-tab, .hb-chip, .disc-mode, [role="button"], summary';
  let room = null, decor = null, fx = null, light = null, panel = null, pid = null, px = 0, py = 0, raf = 0, press = null, ringN = 0, typT = 0, typEl = null, pmx = -1e4, pmy = -1e4, pfr = 0;
  const calm = ()=>{ try{ return !!(window.CODIS_REDUCED_MOTION || document.documentElement.classList.contains('sx-calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); }catch(e){ return false; } };
  function roomOf(t){ const r = t && t.closest ? t.closest(ROOM) : null; return (r && !r.closest('.pt-stage, .pt-ov, .pt-mtile, .m-ghost, .m-exiting')) ? r : null; }
  function bind(r){
    if(room === r && decor && decor.isConnected) return true;
    off(); const dc = r.querySelector(':scope > .bm-decor'), f = dc && dc.querySelector(':scope > .bm-fx'); if(!f) return false;
    room = r; decor = dc; fx = f; light = f.querySelector('.bm-light'); return true;
  }
  function setPanel(p){
    if(panel === p) return;
    if(panel){ panel.classList.remove('bm-near'); panel.style.removeProperty('--bm-mx'); panel.style.removeProperty('--bm-my'); if(!panel.getAttribute('style')) panel.removeAttribute('style'); }
    panel = p; pmx = pmy = -1e4; pfr = 1; if(p) p.classList.add('bm-near');
  }
  function paint(){
    raf = 0; if(!room || !decor || !decor.isConnected || room.offsetParent === null){ off(); return; }
    const r = decor.getBoundingClientRect();
    if(light) light.style.transform = 'translate3d(' + Math.round(px - r.left) + 'px,' + Math.round(py - r.top) + 'px,0)';
    /* حافة اللوح: إعادة رسمه مكلفة ⇒ كل إطارين وعند حركة ≥ 5px فقط (الضوء العام يبقى كل إطار) */
    if(panel && panel.isConnected && (++pfr & 1) === 0 && (Math.abs(px - pmx) >= 5 || Math.abs(py - pmy) >= 5)){ pmx = px; pmy = py; const b = panel.getBoundingClientRect(); panel.style.setProperty('--bm-mx', Math.round(px - b.left) + 'px'); panel.style.setProperty('--bm-my', Math.round(py - b.top) + 'px'); }
  }
  function queue(e){ px = e.clientX; py = e.clientY; if(!raf) raf = requestAnimationFrame(paint); }
  function lightOn(touch){ if(!fx || calm()) return; fx.classList.add('is-on'); fx.classList.toggle('is-touch', !!touch); }
  function off(){
    if(raf){ cancelAnimationFrame(raf); raf = 0; }
    if(fx) fx.classList.remove('is-on', 'is-touch');
    setPanel(null); room = null; decor = null; fx = null; light = null;
  }
  function local(e){ const r = decor.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function ring(e, strong){
    if(!fx || calm() || typeof Element.prototype.animate !== 'function') return;
    const rs = fx.querySelectorAll('.bm-ring'); if(!rs.length) return; const el = rs[ringN++ % rs.length], p = local(e);
    el.style.left = Math.round(p[0]) + 'px'; el.style.top = Math.round(p[1]) + 'px';
    try{ el.animate([{ transform:'translate(-50%,-50%) scale(.15)', opacity:.95 }, { transform:'translate(-50%,-50%) scale(1)', opacity:0 }], { duration:strong ? 640 : 520, easing:'cubic-bezier(.2,.7,.2,1)' }); }catch(x){}
    if(!strong) return;
    const sp = fx.querySelector('.bm-sparks'); if(!sp) return; sp.style.left = Math.round(p[0]) + 'px'; sp.style.top = Math.round(p[1]) + 'px';
    Array.prototype.forEach.call(sp.children, (b, i)=>{ const a = (i / sp.children.length) * 6.283 + (ringN % 5) * .37, dist = 18 + ((i * 7 + ringN * 3) % 13);
      try{ b.animate([{ transform:'rotate(' + a + 'rad) translateX(4px) scaleX(.6)', opacity:1 }, { transform:'rotate(' + a + 'rad) translateX(' + dist + 'px) scaleX(.15)', opacity:0 }], { duration:360 + (i % 3) * 60, easing:'cubic-bezier(.1,.8,.3,1)' }); }catch(x){} });
  }
  function zap(b){ if(calm() || typeof b.animate !== 'function') return; try{ b.animate([{ filter:'brightness(1.5) saturate(1.25)' }, { filter:'brightness(1)' }], { duration:300, easing:'ease-out' }); }catch(x){} }
  function release(){ if(press){ press.classList.remove('bm-press'); press = null; } }
  function panelOf(t){ const p = t.closest(PANEL); return (p && room && room.contains(p)) ? p : null; }
  function down(e){
    const r = roomOf(e.target); if(!r){ if(room) off(); return; }
    if(!bind(r)) return;
    const b = e.target.closest(PRESS), isB = !!(b && r.contains(b) && !b.disabled);
    if(isB){ release(); press = b; b.classList.add('bm-press'); }
    setPanel(panelOf(e.target)); queue(e); ring(e, isB);
    if(e.pointerType !== 'mouse'){ pid = e.pointerId; lightOn(true); } else lightOn(false);
  }
  function move(e){
    if(e.pointerType === 'mouse'){
      const r = roomOf(e.target); if(!r){ if(room) off(); return; }
      if(!bind(r)) return; lightOn(false); setPanel(panelOf(e.target)); queue(e); return;
    }
    if(pid !== e.pointerId || !room) return;
    queue(e);   /* الضوء يتبع الإصبع داخل الغرفة؛ التمرير يحوّلها pointercancel ⇒ رجوع */
  }
  function up(e){
    if(press){ const b = press; release(); if(e.type === 'pointerup' && b.contains(e.target)) zap(b); }
    if(e.pointerType !== 'mouse' && (pid === e.pointerId || pid === null)){ pid = null; if(fx) fx.classList.remove('is-on', 'is-touch'); setPanel(null); }
  }
  function cancel(){ release(); pid = null; off(); }
  function out(e){ if(e.pointerType !== 'mouse' || !room) return; const to = e.relatedTarget; if(!to || !room.contains(to)) off(); }
  function typing(e){
    const t = e.target; if(!t || !(t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') || !roomOf(t)) return;
    if(typEl && typEl !== t) typEl.classList.remove('bm-typing'); typEl = t; t.classList.add('bm-typing');
    clearTimeout(typT); typT = setTimeout(()=>{ if(typEl) typEl.classList.remove('bm-typing'); typEl = null; }, 240);
  }
  try{
    const o = { passive:true, capture:true };
    document.addEventListener('pointerdown', down, o); document.addEventListener('pointermove', move, o);
    document.addEventListener('pointerup', up, o); document.addEventListener('pointercancel', cancel, o); document.addEventListener('pointerout', out, o);
    document.addEventListener('input', typing, o);
    window.addEventListener('blur', cancel); window.addEventListener('pagehide', cancel);
    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) cancel(); });
  }catch(e){}
  /* html[data-bm-room] = الغرفة الظاهرة الآن ملبّسة بالنيزك (خلفية خلف الشريطين العامين). مراقب واحد لسمات الجذور الأربعة فقط (style/data-pt) */
  const ROOTS = ['page-planning', 'page-tasks', 'page-learn', 'page-habits'];
  let syncQ = 0;
  function syncRoot(){ syncQ = 0; try{ const v = ROOTS.map(id=>document.getElementById(id)).find(r=>r && /^blazingMeteor/.test(r.getAttribute('data-pt') || '') && r.classList.contains('pt-room') && r.style.display !== 'none');
    const de = document.documentElement, cur = de.getAttribute('data-bm-room') || '', nx = v ? v.getAttribute('data-pt-target') : '';
    if(cur !== nx){ if(nx) de.setAttribute('data-bm-room', nx); else de.removeAttribute('data-bm-room'); } if(!v && room) cancel(); }catch(e){} }
  function watch(){ try{ const mo = new MutationObserver(()=>{ if(!syncQ) syncQ = requestAnimationFrame(syncRoot); }); let n = 0;
    ROOTS.forEach(id=>{ const el = document.getElementById(id); if(el){ mo.observe(el, { attributes:true, attributeFilter:['style', 'data-pt', 'class'] }); n++; } }); syncRoot(); return n; }catch(e){ return 0; } }
  if(!watch()) document.addEventListener('DOMContentLoaded', watch, { once:true });
  /* إزالة الثيم: لا يبقى أي مؤثر نشط داخل الغرفة */
  function detach(el){ if(!el) return; if(room === el || (room && el.contains(room))) cancel(); el.querySelectorAll('.bm-near, .bm-press, .bm-typing').forEach(x=>{ x.classList.remove('bm-near', 'bm-press', 'bm-typing'); x.style.removeProperty('--bm-mx'); x.style.removeProperty('--bm-my'); if(!x.getAttribute('style')) x.removeAttribute('style'); }); }
  return { state:()=>({ rings:ringN, room:room ? room.id : null, on:!!(fx && fx.classList.contains('is-on')), touch:pid !== null, press:!!press, panel:panel ? panel.className : null }), reset:cancel, detach:detach };
})();
codisMeteorFxApi = CodisMeteorFx;
