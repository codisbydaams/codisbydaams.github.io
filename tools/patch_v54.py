"""CODIS-V54 (3.41.0) — الإقلاع والأداء على iOS (لا يمسّ البيانات/المحفظة/المكافآت/الاحتمالات/مفاتيح التخزين).
  1) شاشة البداية: صور إقلاع iOS (apple-touch-startup-image) بنفس خلفية #codis-startup، شريط تقدّم أوضح (v54.css)،
     التقدّم رتيب (لا يرجع) ومربوط بمراحل حقيقية (المستند ← المراحل ← الخطوط)، ووضع «busy» لما لا يُقاس.
  2) شبكة الأمان: كانت تكشف الواجهة عند 5ث من فتح المستند حتى لو كان سكربت التطبيق ما زال يُحلَّل (فتحة باردة بطيئة ⇒
     واجهة فارغة قبل رسم الغرف). الآن تكشف فقط إذا انتهى المستند ولم يبدأ codisBoot (سكربت مات).
  3) codisBoot: الوجهة تُحدَّد أولاً وتُرسم غرفتها فقط قبل الكشف (كانت تُرسم الغرف الثلاث ثم غرفة العمليات مرة ثانية عند
     وجود خطة)؛ الغرفتان الأخريان تُرسمان بوقت الخمول بعد الكشف، أو فوراً إن انتقل المستخدم قبل ذلك (codisBootDeferredFlush).
     انتظار الخطوط 2.5ث ← 1.5ث كحد أقصى. حالة الجاهزية window.codisBootState (parsed/data/firstRoom/revealed/deferred).
  4) CodisBox3D: التسخين المسبق (تقييم Three.js ~617KB = مهمة طويلة واحدة) كان يقع بعد ~14ث على Safari مهما كان المستخدم
     يفعل؛ الآن فقط حين يكون التطبيق هادئاً (لا لمس 2.5ث، ظاهر، لا مشهد). صحة WebGL للجهاز: فقدان السياق أو موت الصفحة أثناء
     مشهد ⇒ الجودة 'low' الموجودة أصلاً بالمحرّك لهذا الجهاز 14 يوماً؛ فقدانان بالجلسة ⇒ المشهد 2D (النتيجة نفسها). الأجهزة السليمة: بلا تغيير.
  5) نسخة جديدة من sw.js v8 (الصفحة من الكاش فوراً + تحديث بالخلفية): رسالة codis-update ⇒ إعادة تحميل إن كنا ما زلنا بشاشة البداية
     بلا أي لمسة، وإلا تنبيه بأنها تُطبَّق بالفتحة القادمة.
  ثم tools/boot_split.mjs (بيانات الصور المدفونة بعناصر <script> صغيرة قبل السكربت الرئيسي).
  py -3 tools/patch_v54.py <ناتج v53> <out>   (sh tools/rebuild_v54.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V54' not in s and 'CODIS-V53' in s, 'needs v53 output'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:160])
    s = s.replace(old, new)
css = rd('identity', 'v54.css'); assert '</style' not in css and '<!--' not in css
startup = rd('identity', 'v54_startup.html'); assert startup.count('apple-touch-startup-image') == 13

# ---- 1) صور الإقلاع (آخر الرأس: لا تؤخر شيئاً قبلها) + طبقة v54 ----
rep('</script>\n</head>\n<body>', '</script>\n<!-- CODIS-V54: صور إقلاع iOS (خلفية شاشة البداية نفسها، بلا شعار — الشعار يُرسم بحركته داخل الصفحة) -->\n' + startup + '</head>\n<body>')
i = s.index('<style id="codis-v53-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v54-css">\n/* CODIS-V54 */\n' + css + '</style>' + s[j:]

# ---- 2) شاشة البداية: تقدّم رتيب + busy + شبكة أمان لا تكشف أثناء التحليل ----
rep("""    p = Math.max(0, Math.min(1, +p || 0));
    b.firstElementChild.style.setProperty('--p', p);""", """    p = Math.max(0, Math.min(1, +p || 0));
    p = Math.max(p, window.__codisP || 0); window.__codisP = p;   /* CODIS-V54: التقدّم لا يرجع أبداً */
    if(b.getAttribute('data-mode') === 'busy' && !window.__codisBusy) b.removeAttribute('data-mode');
    b.firstElementChild.style.setProperty('--p', p);""")
rep("""  window.codisBootStatus = function(txt){ var s = document.getElementById('cs-status'); if(s && txt) s.textContent = txt; };""",
    """  window.codisBootStatus = function(txt){ var s = document.getElementById('cs-status'); if(s && txt) s.textContent = txt; };
  /* CODIS-V54: مرحلة لا تُقاس نسبتها ⇒ لمعة متحركة بدل رقم مختلَق */
  window.codisBootBusy = function(on){ window.__codisBusy = !!on; var b = document.getElementById('cs-bar'); if(!b) return; if(on) b.setAttribute('data-mode', 'busy'); else b.removeAttribute('data-mode'); };
  (function(){ var b = document.getElementById('cs-bar'); if(b) b.setAttribute('data-mode', 'busy'); })();   /* حتى تصل أول مرحلة حقيقية */""")
rep("""  var codisStartupTimer = window.setTimeout(
    window.codisReveal,
    Math.max(0, 5000 - performance.now())   /* CODIS-PERF: شبكة أمان فقط (الإقلاع الطبيعي يكشف عند الجاهزية) */
  );""", """  /* CODIS-V54: كانت تكشف عند 5ث من فتح المستند حتى لو كان سكربت التطبيق ما زال يُحلَّل (فتحة باردة ⇒ واجهة بلا غرف).
     الآن: فقط إذا اكتمل المستند ولم يبدأ codisBoot (أي سكربت التطبيق توقّف بخطأ) — بعد 1.5ث */
  var codisStartupTimer = 0;
  document.addEventListener('DOMContentLoaded', function(){
    if(window.codisBootState) return;
    codisStartupTimer = window.setTimeout(function(){ if(!window.codisBootState) window.codisReveal(); }, 1500);
  });""")
rep("""      document.documentElement.classList.remove('codis-booting');""", """      document.documentElement.classList.remove('codis-booting');
      try{ if(window.codisBootState){ window.codisBootState.revealed = Math.round(performance.now()); } }catch(e){}""")

# ---- 3) codisBoot ----
a = s.index('function codisBoot(){'); b = s.index('\ncodisBoot();\n', a)
old = s[a:b]
assert "step('route', function(){ if(currentPlanActive()) navigateToPage('tasks'); });" in old
assert "  const TOTAL = 14; let done = 0, failed = 0; const reqFailed = [];" in old
stage_line = old[old.index('  const STAGE = '):old.index('\n', old.index('  const STAGE = '))]
req_line = old[old.index('  const REQUIRED = '):old.index('\n', old.index('  const REQUIRED = '))]
new = """/* CODIS-V54: حالات الجاهزية منفصلة — parsed (المستند والسكربت) · data (البيانات والاقتصاد) · firstRoom (الغرفة الأولى مرسومة) ·
   revealed (الكشف) · deferred (بقية الغرف). DOM موجود ≠ مرسوم ≠ بيانات محمّلة ≠ قابل للتفاعل. */
/* الحالة على window ودوال function فقط: navigateToPage (قبل هذا السطر بالملف) يقرؤها ⇒ لا const/let (قاعدة TDZ وقت التحميل) */
function codisBootRoom(r){ const f = { planning:renderPlanningPage, tasks:renderTasksPage, learn:renderLearnPage }[r]; if(f) f(); }
/* يرسم الغرف المؤجلة الآن (قبل أي انتقال) — عدا الغرفة الهدف التي يرسمها navigateToPage بنفسه ⇒ لا رسم مكرر */
function codisBootDeferredFlush(except){
  const list = window.__codisLater; if(!list || !list.length) return;
  window.__codisLater = [];
  list.forEach(r=>{ if(r === except) return; try{ codisBootRoom(r); }catch(e){ console.error('CODIS deferred init (' + r + '):', e); } });
  if(window.codisBootState) window.codisBootState.deferred = Math.round(performance.now());
}
function codisBootIdle(fn, ms){
  if(typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout:ms });
  else window.setTimeout(fn, Math.min(ms, 400));
}
function codisBootScheduleDeferred(delay){
  window.setTimeout(function next(){
    const L = window.__codisLater || [];
    if(!L.length){ if(window.codisBootState && !window.codisBootState.deferred) window.codisBootState.deferred = Math.round(performance.now()); return; }
    codisBootIdle(()=>{
      const L2 = window.__codisLater || []; const r = L2.shift(); if(!r) return;
      try{ codisBootRoom(r); }catch(e){ console.error('CODIS deferred init (' + r + '):', e); }
      if(L2.length) window.setTimeout(next, 120); else if(window.codisBootState) window.codisBootState.deferred = Math.round(performance.now());
    }, 1600);
  }, delay);
}
function codisBoot(){
  const TOTAL = 10; let done = 0, failed = 0; const reqFailed = [];   /* 10 مراحل حتى تجهز الغرفة الأولى (ثم الخطوط) */
""" + stage_line + """
""" + req_line + """
  const BS = window.codisBootState = { parsed:Math.round(performance.now()), data:0, firstRoom:0, revealed:0, deferred:0, route:'' };
  const P0 = Math.max(.58, window.__codisP || 0);   /* ما قبلها = تحليل المستند (تُبلّغه كتل البيانات) */
  function step(label, fn){
    if(window.codisBootStatus && STAGE[label]) window.codisBootStatus(STAGE[label] + '…');
    try{ fn(); }
    catch(err){ failed++; if(REQUIRED[label]) reqFailed.push(REQUIRED[label]); console.error('CODIS init error ('+label+'):', err); }
    done++; if(window.codisBootProgress) window.codisBootProgress(P0 + (.94 - P0) * done / TOTAL, failed > 0);
  }
  try{
    step('lock', function(){ codisLockBoot(); });   /* أول شي: إذا القفل مفعّل يغطي التطبيق قبل ما تنكشف شاشة الإقلاع */
    step('motion', function(){ CodisMotion.init(); });
    step('notifications', function(){ CodisNotifications.init(); });
    step('archive', function(){
      const n = archiveStaleWeeksIfAny();
      if(n>0) showToast(n===1 ? 'انحفظت خطة الأسبوع السابق بالأرشيف' : `انحفظت ${n} خطط سابقة بالأرشيف`, 'var(--aqua)', 'check');
    });
    step('economy', econTick);
    step('coinchip', econRenderChip);   // أشهر انتهت منذ آخر استخدام تُحسم هنا (بعد أرشفة الأسابيع القديمة)
    step('habits', initHabitChecks);
    BS.data = Math.round(performance.now());
    /* الوجهة الأولى أولاً: خطة فعّالة -> غرفة العمليات، وإلا غرفة التخطيط — ثم تُرسم هذه الغرفة فقط (مرة واحدة) */
    let route = 'planning';
    step('route', function(){ route = currentPlanActive() ? 'tasks' : 'planning'; });
    BS.route = route;
    if(route === 'tasks') step('tasks', function(){ navigateToPage('tasks'); });
    else step('planning', renderPlanningPage);
    step('view', codisSyncView);
    BS.firstRoom = Math.round(performance.now());
    window.__codisLater = (route === 'tasks' ? ['planning', 'learn'] : ['tasks', 'learn']);
  } finally{
    const fontsLoaded = !document.fonts || document.fonts.status === 'loaded';
    if(!fontsLoaded && window.codisBootBusy) window.codisBootBusy(true);
    const fontsReady = (document.fonts && document.fonts.ready && !fontsLoaded) ? Promise.race([document.fonts.ready, new Promise(function(r){ setTimeout(r, 1500); })]) : Promise.resolve();
    fontsReady.catch(function(){}).then(function(){
    if(window.codisBootBusy) window.codisBootBusy(false);
    if(window.codisBootProgress) window.codisBootProgress(1, failed > 0);
    if(window.codisBootStatus && !reqFailed.length) window.codisBootStatus('جاهز');
    window.codisStartupTimer_ref = codisStartupTimer;
    const go = function(){
    window.clearTimeout(codisStartupTimer);
    const revealAt = window.CODIS_BOOT_DURATION - window.getCodisExitDuration();
    const remaining = Math.max(0, revealAt - performance.now());
    codisStartupTimer = window.setTimeout(window.codisReveal, remaining);
    window.setTimeout(function(){ econUiReady = true; try{ CodisOutcomeUI.flushPending(); econRenderHome(); }catch(e){ console.error('economy flush:', e); } }, remaining + 900);
    codisBootScheduleDeferred(remaining + 1300);   /* بعد دخول الغرفة وحركتها: بقية الغرف بوقت الخمول */
    };
    if(reqFailed.length && window.codisBootFail){ window.clearTimeout(codisStartupTimer); window.codisBootFail(reqFailed, go); } else go();
    });   // القرارات المعلّقة تظهر بعد انكشاف الواجهة
  }
}"""
s = s[:a] + new + s[b:]
# بعد codisBoot(): نسخة أحدث وصلت بالخلفية (sw.js v8)
rep('\ncodisBoot();\n</script>', """
codisBoot();
/* CODIS-V54: sw.js v8 يخدم الصفحة من الكاش فوراً ويحمّل الجديد بالخلفية. وصلت نسخة أحدث ⇒ إن كنا ما زلنا بشاشة البداية ولم يلمس
   المستخدم شيئاً تُعاد الصفحة (من الكاش، فورية)، وإلا تبقى الجلسة كما هي وتُطبَّق النسخة بالفتحة القادمة. لا حلقة: مرة كل دقيقتين. */
(function(){
  if(!('serviceWorker' in navigator)) return;
  let touched = false, told = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach(t=>window.addEventListener(t, ()=>{ touched = true; }, { capture:true, passive:true, once:true }));
  navigator.serviceWorker.addEventListener('message', ev=>{
    const d = ev && ev.data; if(!d || d.type !== 'codis-update') return;
    const mine = (document.querySelector('meta[name="codis-version"]') || {}).content || '';
    if(d.version && d.version === mine) return;
    let recent = false; try{ recent = Date.now() - (+sessionStorage.getItem('codis_upd_reload') || 0) < 120000; }catch(e){}
    if(document.documentElement.classList.contains('codis-booting') && !touched && !recent){
      try{ sessionStorage.setItem('codis_upd_reload', String(Date.now())); }catch(e){}
      location.reload(); return;
    }
    if(told) return; told = true;
    try{ showToast('نسخة أحدث من CODIS جاهزة — تُطبَّق عند فتح التطبيق مرة ثانية', 'var(--aqua)', 'check'); }catch(e){}
  });
})();
</script>""")
# أي انتقال قبل اكتمال الرسم المؤجل: ارسم البقية أولاً (الهدف يرسمه navigateToPage نفسه)
rep("""function navigateToPage(page){
  const target = document.querySelector(`.navbtn[data-page="${page}"]`);
  if(!target) return;""", """function navigateToPage(page){
  const target = document.querySelector(`.navbtn[data-page="${page}"]`);
  if(!target) return;
  if(window.__codisLater && window.__codisLater.length) codisBootDeferredFlush(page);   /* CODIS-V54 */""")

# ---- 4) CodisBox3D: تسخين بوقت الهدوء + صحة WebGL للجهاز ----
rep("""  function tier(){
    const n = navigator, ios = /iPhone|iPad|iPod/.test(n.userAgent || '') || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);""", """  /* CODIS-V54: صحة WebGL لهذا الجهاز (localStorage codis_b3d_health — ليس من بيانات المستخدم ولا يُزامَن).
     iOS يقتل الصفحة عند امتلاء ذاكرة الرسم بلا أي حدث ⇒ علامة run تُكتب عند بدء المشهد وتُمسح عند انتهائه/إغلاق الصفحة؛
     بقاؤها بالفتحة التالية = الصفحة ماتت أثناء المشهد. أي فقدان ⇒ الجودة 'low' (الموجودة بالمحرّك) 14 يوماً؛ فقدانان بالجلسة ⇒ 2D. */
  const HK = 'codis_b3d_health'; let lostNow = 0;
  function health(){ try{ const h = JSON.parse(localStorage.getItem(HK) || 'null'); return h && typeof h === 'object' && !Array.isArray(h) ? h : {}; }catch(e){ return {}; } }
  function healthSet(h){ try{ localStorage.setItem(HK, JSON.stringify(h)); }catch(e){} }
  function running(on){ const h = health(); if(on) h.run = Date.now(); else if(!h.run) return; else delete h.run; healthSet(h); }
  try{ const h = health(); if(h.run){ h.lost = (+h.lost || 0) + 1; h.at = Date.now(); delete h.run; healthSet(h); } }catch(e){}
  try{
    document.addEventListener('webglcontextlost', ()=>{ if(!(cur || bulk)) return; lostNow++; const h = health(); h.lost = (+h.lost || 0) + 1; h.at = Date.now(); healthSet(h); }, true);
    window.addEventListener('pagehide', ()=>running(false));
    /* بالخلفية المشهد متوقف (Runner لا يرسم والصفحة مخفية) ⇒ قتل iOS للتطبيق المعلّق ليس انهياراً بسبب المشهد */
    document.addEventListener('visibilitychange', ()=>{ if(cur || bulk) running(!document.hidden); });
  }catch(e){}
  function hurt(){ const h = health(); return lostNow > 0 || (+h.lost > 0 && Date.now() - (+h.at || 0) < 14 * 864e5); }
  function tier(){
    if(hurt()) return 'low';
    const n = navigator, ios = /iPhone|iPad|iPod/.test(n.userAgent || '') || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);""")
rep("""    if(lib) return lib; if(bad || window.CODIS_B3D_OFF) return null;""", """    if(lostNow >= 2) return null;   /* CODIS-V54: الجهاز فقد السياق مرتين بهذه الجلسة ⇒ المشهد 2D بنفس النتيجة */
    if(lib) return lib; if(bad || window.CODIS_B3D_OFF) return null;""")
rep("""          dispose:()=>{ if(cur === ctl) cur = null; clearTimeout(watch); }, targets:singleTarget }) });
      cur = ctl;""", """          dispose:()=>{ if(cur === ctl) cur = null; clearTimeout(watch); if(!cur && !bulk) running(false); }, targets:singleTarget }) });
      cur = ctl; running(true);""")
rep("""          dispose:()=>{ if(bulk === ctl) bulk = null; clearTimeout(bwatch); }, targets:bulkTargets(res) }) });
      bulk = ctl;""", """          dispose:()=>{ if(bulk === ctl) bulk = null; clearTimeout(bwatch); if(!cur && !bulk) running(false); }, targets:bulkTargets(res) }) });
      bulk = ctl; running(true);""")
rep("""  function prewarm(){ try{ if('requestIdleCallback' in window) requestIdleCallback(()=>{ ensure(); }, { timeout:20000 }); else setTimeout(ensure, 8000); }catch(e){} }
  window.addEventListener('load', ()=>setTimeout(prewarm, 6000), { once:true });""", """  /* CODIS-V54: تقييم المكتبة مهمة طويلة واحدة لا تُقسَّم ⇒ تقع فقط حين يكون التطبيق هادئاً (ظاهر، لا لمس منذ 2.5ث، لا مشهد/معاينة)،
     لا بمؤقت ثابت (Safari بلا requestIdleCallback كان يقيّمها عند ~14ث مهما كان المستخدم يفعل). أول فتح صندوق يبقى يعمل كما كان لو لم تُسخَّن */
  let lastIn = 0, warmT = 0;
  try{ ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(t=>window.addEventListener(t, ()=>{ lastIn = performance.now(); }, { capture:true, passive:true })); }catch(e){}
  /* تغيّر العرض (فتح/إغلاق المتجر، انتقال غرفة) = نشاط أيضاً حتى لو جاء برمجياً */
  try{ new MutationObserver(()=>{ lastIn = performance.now(); }).observe(document.documentElement, { attributes:true, attributeFilter:['data-view'] }); }catch(e){}
  function quiet(){ return !document.hidden && performance.now() - lastIn > 2500 && !document.documentElement.classList.contains('codis-booting') && !(cur || bulk) && !document.querySelector('.bcx, .peek, .b3d-root, .ucx'); }
  function prewarm(){
    clearTimeout(warmT); if(lib || bad || window.CODIS_B3D_OFF) return;
    if(!quiet()){ warmT = setTimeout(prewarm, 1500); return; }
    const go = ()=>{ if(!lib && !bad && quiet()) ensure(); else if(!lib && !bad) warmT = setTimeout(prewarm, 1500); };
    if('requestIdleCallback' in window) requestIdleCallback(go, { timeout:3000 }); else go();
  }
  window.addEventListener('load', ()=>setTimeout(prewarm, 6000), { once:true });""")

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v54 applied')
