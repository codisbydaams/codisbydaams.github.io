/* ================= CODIS-V68 · معاينة الثيمات متعددة المشاهد + تجربة التفاعل قبل الشراء + أوصاف «؟» =================
   (1) المشاهد: codisThemeScenes(d) يختار تلقائياً من تعريف المنتج:
       • ثيم يعلن apply:'room' ⇒ «حالات الغرفة» (6 مشاهد لكل غرفة) — الغرفة كاملة ملبّسة، بمكوّنات CODIS نفسها وبيانات عيّنة ثابتة.
       • ثيم أسطح (القديم) ⇒ «الأسطح» = سطح لكل شريحة كما كان حرفياً (codisPtSlideHtml) — لا يلبّس ما لا يلبسه بالغرفة الحقيقية.
       المشهد يُبنى عند أول عرض فقط، والمخفي display:none (لا حركة ولا عقد زائدة). الأزرار/الحقول بلا معالجات، بلا معرّفات، بلا on*.
   (2) التنقل: سابق/تالي · رقم/عدد · عنوان + وصف · نقاط قابلة للضغط · أسهم/Home/End · سحب أفقي باللمس (touch-action:pan-y ⇒ التمرير العمودي أصلي).
   (3) التفاعل: CodisThemePreviewFx — سجل مركزي CODIS_THEME_FX (مفتاح art ⇒ نوع التفاعل) + أدوات لكل نوع تستعمل طبقات الثيم نفسها
       (.bm-fx للنيزك، .aw-fx للخشب). مستمعات على عنصر النافذة فقط (تُزال مع الإغلاق)، rAF واحد، عناصر مؤثرات ثابتة العدد، لا شيء خارج المشهد الظاهر.
       كل نقرة داخل المشهد تُوقف قبل وصولها لأي معالج بالتطبيق ⇒ لا بيانات تتغير ولا أصوات ثيم.
   (4) «؟»: وصف العائلة ووصف المنتج يظهران عند الطلب فقط في نافذة صغيرة واحدة على مستوى الصفحة (لا تُقصّ داخل البطاقة). */
Object.assign(CODIS_PT_PV_MAP, { 'planning-empty':'pt-pv-pe', 'tasks-empty':'pt-pv-te', 'learn-empty':'pt-pv-le', 'saved-plans-panel':'pt-pv-spp', 'saved-plans-list':'pt-pv-spl',
  'write-tabs':'pt-pv-wtabs', 'plan-section-all':'pt-pv-wall', 'plan-section-learn':'pt-pv-wsl', 'write-review':'pt-pv-wrv', 'plan-all-items':'pt-pv-witems',
  'quit-habit-list':'pt-pv-qlist', 'habit-add':'pt-pv-hadd', 'habit-add-trigger':'pt-pv-htrg', 'habit-mode-desc':'pt-pv-hdesc', 'hb-imp-chips':'pt-pv-himp', 'hb-type-chips':'pt-pv-htype',
  'hb-weekly-field':'pt-pv-hwf', 'new-habit-days':'pt-pv-hdays', 'habit-build-section':'pt-pv-hbs', 'habit-quit-section':'pt-pv-hqs' });
/* سجل التفاعل: مفتاح راسم الثيم (art) ⇒ نوع التفاعل. ثيم تفاعلي جديد = سطر هنا (أو حقل previewFx بالتعريف) + أداة بـCODIS_PV_FX_KITS */
const CODIS_THEME_FX = { blazingMeteor:'meteor', agedWood:'wood' };
function codisThemeFxOf(d){ return d ? (d.previewFx || CODIS_THEME_FX[d.art] || '') : ''; }

/* ---------- أدوات بناء المشاهد ---------- */
function codisPvClean(html){
  /* أي HTML مستعار من التطبيق: بلا معرّفات ولا معالجات ولا تركيز؛ الحقول للقراءة فقط */
  try{
    const t = document.createElement('template'); t.innerHTML = html;
    t.content.querySelectorAll('*').forEach(el=>{
      for(let i = el.attributes.length - 1; i >= 0; i--){ const n = el.attributes[i].name; if(n === 'id' || n === 'for' || n === 'inert' || /^on/i.test(n) || n === 'data-tmr-end' || n === 'data-tmr-total' || n === 'data-tmr-left') el.removeAttribute(n); }
      if(/^(BUTTON|INPUT|TEXTAREA|SELECT|A)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
      if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.setAttribute('readonly', '');
    });
    return t.innerHTML;
  }catch(e){ return ''; }
}
function codisPvFrom(sel){ const el = document.querySelector(sel); return el ? codisPvClean(el.outerHTML) : ''; }
const codisPvB = (c, t)=>'<button type="button" class="' + c + '" tabindex="-1">' + t + '</button>';
function codisPvHud(pct, done, total){
  return '<section class="xp-hud"><div class="xp-hud-top"><div class="xp-id"><span class="xp-label">إنجاز اليوم</span><span class="xp-count">خلّصت ' + econFmt(done) + ' من ' + econFmt(total) + '</span></div><span class="xp-value">' + econFmt(pct) + '٪</span></div>' +
    '<div class="xp-track"><div class="xp-fill" style="width:' + pct + '%"></div></div></section>';
}
function codisPvDays(on, L){
  const n = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  return '<div class="day-tabs">' + n.map((x, i)=>codisPvB('day-tab' + (i === on ? ' active today' : i > on ? ' locked' : ''), x + '<span class="dcount">' + (i > on ? 'مقفل' : econFmt(i + 3) + (L ? ' عناصر' : ' مهام')) + '</span>')).join('') + '</div>';
}
function codisPvTasks(list, L){ return list.map((t, i)=>codisPtPvTask(Object.assign({ id:'ptpv' + i, priority:'' }, t), L)).join(''); }
function codisPvRoom(d, body, attrs){
  const tg = d.target, T = CODIS_THEME_TARGETS[tg] || {}, L = tg === 'teacher';
  const head = '<header class="page-head"><span class="room-eyebrow">' + CODIS_RT_EYEBROW[tg] + '</span><div class="page-title">' + escapeHtml(T.room || '') + '</div>' +
    (tg === 'operations' || L ? '<div class="page-context"><strong>الثلاثاء</strong><span class="today-chip">اليوم</span></div>' : '') + '</header>';
  return '<div class="bm-pv pt-room ' + CODIS_RT_ROOMCLS[tg] + '" data-pt="' + d.id + '" data-pt-target="' + tg + '" data-pt-surface="room"' + (attrs || '') + ' style="' + escapeHtml(codisPlanThemeStyle(d)) + '">' +
    codisPlanThemeDecorHtml(d, false) + '<div class="bm-pv-in">' + head + codisPvClean(body) + '</div></div>';
}
function codisPvEmpty(tg){
  const sel = { planning:'#planning-empty > .empty-state', operations:'#tasks-empty > .empty-state', teacher:'#learn-empty > .empty-state' }[tg], wrap = { planning:'pt-pv-pe', operations:'pt-pv-te', teacher:'pt-pv-le' }[tg];
  let h = '';
  try{ const src = document.querySelector(sel); if(src){ const c = src.cloneNode(true);
    /* الثيم يلبّس الغرفة كاملة ⇒ ما يضيفه تلبيس السطح القديم لا يبقى بالنسخة */
    c.querySelectorAll('.pt-decor, .aw-fx').forEach(x=>x.remove()); c.classList.remove('pt-box', 'aw-lit', 'aw-touch');
    ['data-pt', 'data-pt-target', 'data-pt-surface', 'data-pt-nostyle', 'style'].forEach(a=>c.removeAttribute(a));
    h = codisPvClean(c.outerHTML); } }catch(e){ h = ''; }
  if(!h){ const T = CODIS_THEME_TARGETS[tg] || {}; h = '<div class="empty-state">' + (tg === 'planning' ? '' : codisEsMark(tg === 'teacher' ? 'lrnr' : 'opsr')) + '<div class="es-title">' + escapeHtml(T.box || '') + '</div>' + codisPvB('btn btn-primary', escapeHtml(T.btn || '')) + '</div>'; }
  return '<div class="' + wrap + '">' + h + '</div>';
}
function codisPvEditor(tab, text, opts){
  opts = opts || {};
  const L = tab === 'learn', ph = L ? 'مثلاً:\n3 دروس مونتاج\n!أتعلم أساسيات Excel' : 'مثلاً:\n15 ريلز\n!أراجع تقرير المبيعات\nأرد على رسائل الزبائن';
  const n = text ? text.split('\n').filter(Boolean).length : 0;
  return '<div class="pt-pv-editor">' + (opts.extend ? '<div class="plan-extend-note">تُضاف للخطة الشغّالة على أيامها المتبقية — ترتيبك الحالي ما يتغيّر.</div>' : '') +
    '<div class="write-head"><div class="write-head-row"><div class="write-title">' + (opts.extend ? 'شنو تضيف للخطة؟' : 'شنو تريد تنجز؟') + '</div>' + codisPvB('saved-plans-link' + (opts.saved ? ' is-open' : ''), '<span>خططي المحفوظة</span>' + codisIcon('expand', { size:'sm' })) + '</div></div>' +
    (opts.saved ? '<div class="card pt-pv-spp"><div class="pt-pv-spl">' + [['خطة أسبوع العمل', ''], ['خطة الامتحانات', ''], ['أسبوع الإجازة', '']].map(p=>'<div class="saved-plan-row"><span class="saved-plan-name">' + p[0] + '</span><div class="row-actions">' + codisPvB('btn btn-secondary btn-sm', 'تحميل') + codisPvB('btn btn-destructive btn-sm', 'حذف') + '</div></div>').join('') + '</div></div>' : '') +
    '<div class="write-tabs pt-pv-wtabs">' + codisPvB('write-tab' + (L ? '' : ' active'), 'المهام') + codisPvB('write-tab' + (L ? ' active' : ''), 'التعلّم') + '<span class="write-tabs-indicator"></span></div>' +
    '<div class="write-panel ' + (L ? 'pt-pv-wsl' : 'pt-pv-wsec') + '"><div class="write-box"><textarea readonly tabindex="-1" aria-hidden="true" placeholder="' + escapeHtml(ph) + '">' + escapeHtml(text || '') + '</textarea>' +
    '<span class="write-count show">' + econFmt(n) + (L ? ' عناصر' : ' مهام') + '</span></div></div>' +
    (opts.save ? '<div class="row-input"><input type="text" readonly tabindex="-1" aria-hidden="true" value="خطة أسبوع العمل">' + codisPvB('btn btn-primary', 'حفظ') + codisPvB('btn btn-secondary', 'إلغاء') + '</div>' :
      '<div class="write-actions">' + codisPvB('btn btn-primary', '<span>' + (opts.extend ? 'أضف للخطة' : 'رتّب خطتي') + '</span>' + codisIcon('next')) + codisPvB('btn btn-secondary', opts.extend ? 'إلغاء' : 'حفظ الخطة') + '</div>') + '</div>';
}
function codisPvPlanCard(pct, saveOpen){
  return '<div class="pt-pv-plan"><div class="plan-card"><span class="eyebrow">الخطة</span><div class="plan-name">خطة الأسبوع</div><div class="plan-info">١٢ مهمة، ٦ عناصر تعلّم · الأحد ← السبت</div>' +
    '<div class="plan-progress"><div class="plan-progress-row"><span>نسبة الإنجاز</span><span class="plan-pct">' + econFmt(pct) + '٪</span></div><div class="xp-track"><div class="xp-fill" style="width:' + pct + '%;"></div></div></div>' +
    '<div class="plan-cta">' + codisPvB('btn btn-primary', codisIcon('next') + 'أضف للخطة') + '</div>' +
    (saveOpen ? '<div class="plan-save-active" style="display:block"><div class="row-input"><input type="text" readonly tabindex="-1" aria-hidden="true" value="خطة الأسبوع الأول">' + codisPvB('btn btn-primary', 'حفظ') + codisPvB('btn btn-secondary', 'إلغاء') + '</div></div>' : '') +
    '<div class="plan-more">' + codisPvB('pm-btn', 'احفظ الخطة') + codisPvB('pm-btn', 'خطة جديدة') + codisPvB('pm-btn is-danger', 'إيقاف الخطة') + '</div></div></div>';
}
function codisPvHabit(h){
  try{ const was = codisJustChangedId, r = renderHabitRow(Object.assign({ milestones:{}, monthlyMilestones:{}, occurrences:[], misses:[], doneEvents:{}, failLog:{}, checkedThrough:yesterdayKey(), c7:todayKey(), createdAt:dateKeyOffset(-20) }, h)); codisJustChangedId = was; return r.row.outerHTML; }
  catch(e){ return codisRoomThemeHabitHtml().replace('قراءة عشر صفحات', escapeHtml(h.text || '')); }
}
function codisPvLog(n, skip){ const log = {}; for(let i = 1; i <= n; i++) if(!skip || i % skip) log[dateKeyOffset(-i)] = true; return log; }
function codisPvHabits(mode){
  if(mode === 'quit') return codisPvHabit({ id:'ptpv-q1', text:'السكر بعد العشاء', type:'E', abstain:true, importance:'important', log:codisPvLog(9) }) +
    codisPvHabit({ id:'ptpv-q2', text:'تصفّح الهاتف قبل النوم', type:'H', importance:'critical', log:{} });
  return codisPvHabit({ id:'ptpv-h1', text:'قراءة عشر صفحات', type:'E', importance:'important', log:codisPvLog(6) }) +
    codisPvHabit({ id:'ptpv-h2', text:'رياضة صباحية', type:'W', days:[0, 2, 4], importance:'normal', log:codisPvLog(12, 2) }) +
    codisPvHabit({ id:'ptpv-h3', text:'شرب لترين ماء', type:'E', importance:'critical', log:codisPvLog(3) });
}
function codisPvModes(mode){
  return '<div class="disc-modes">' + codisPvB('disc-mode pt-pv-htb' + (mode === 'build' ? ' is-active' : ''), '<span class="disc-mode-t"><span>أكتسبها</span><small>عادات تبنيها</small></span><span class="disc-mode-n">٣</span>') +
    codisPvB('disc-mode pt-pv-htq' + (mode === 'quit' ? ' is-active' : ''), '<span class="disc-mode-t"><span>أتخلص منها</span><small>عادات تتركها</small></span><span class="disc-mode-n">٢</span>') + '</div>' +
    '<div class="disc-toolbar"><p class="disc-mode-desc pt-pv-hdesc">' + (mode === 'quit' ? 'امتناع يومي أو مواقف حدثية — تسجّل نجاحك أو وقوعك.' : 'يومية أو أسبوعية — تسجّلها كل ما تنجزها.') + '</p>' +
    codisPvB('disc-add-trigger pt-pv-htrg', '<span class="disc-add-glyph"></span><span>إضافة عادة</span>') + '</div>';
}
function codisPvAddHabit(mode, type, imp, days, name){
  const types = HABIT_TYPES[mode] || HABIT_TYPES.build, chip = (on, t)=>codisPvB('hb-chip' + (on ? ' is-on' : ''), t);
  return '<div class="disc-add pt-pv-hadd is-open"><div class="card add-habit"><div><span class="field-label">اسم العادة</span><input type="text" readonly tabindex="-1" aria-hidden="true" value="' + escapeHtml(name || '') + '" placeholder="مثلاً: قراءة عشر صفحات"></div>' +
    '<div><div class="field-label">نوع العادة</div><div class="hb-chips pt-pv-htype">' + types.map(t=>chip(t[0] === type, t[1])).join('') + '</div><div class="hb-hint">' + escapeHtml((HABIT_HINTS[mode] || {})[type] || '') + '</div></div>' +
    (type === 'W' ? '<div class="pt-pv-hwf"><div class="field-label">أيام العادة</div><div class="hb-days pt-pv-hdays">' + CODIS_WDAYS.map((n, i)=>codisPvB('hb-chip hb-day' + (days.indexOf(i) !== -1 ? ' is-on' : ''), n)).join('') + '</div></div>' : '') +
    '<div><div class="field-label">الأهمية</div><div class="hb-chips pt-pv-himp">' + [['normal', 'عادية'], ['important', 'مهمة'], ['critical', 'حرجة']].map(x=>chip(x[0] === imp, x[1])).join('') + '</div></div>' +
    '<div class="add-habit-actions">' + codisPvB('btn btn-primary', 'إضافة') + codisPvB('btn btn-quiet', 'إلغاء') + '</div></div></div>';
}
/* تعريفات مشاهد «حالات الغرفة»: [المفتاح، العنوان، الوصف، الباني] */
const CODIS_ROOM_SCENES = {
  planning:[
    ['empty', 'قبل إنشاء الخطة', 'الغرفة وهي فارغة: مربع البداية وزرّه.', ()=>codisPvEmpty('planning')],
    ['start', 'بدء بناء الخطة', 'محرر الخطة: العنوان، تبويبا المهام والتعلّم، مربع الكتابة الفارغ.', ()=>codisPvEditor('tasks', '')],
    ['write', 'إضافة المهام والتعلّم', 'مربع الكتابة ممتلئاً بعناصر التعلّم وعدّاد العناصر.', ()=>codisPvEditor('learn', '3 دروس مونتاج\n!أتعلم أساسيات Excel\nأقرا فصل من كتاب التسويق\nمراجعة المفردات الجديدة')],
    ['distribute', 'توزيع الخطة', 'قائمة العناصر المفهومة وسؤال التأكيد قبل الترتيب على الأيام.', ()=>'<div class="pt-pv-editor"><div class="write-head"><div class="write-head-row"><div class="write-title">شنو تريد تنجز؟</div></div></div>' +
      '<div class="write-panel pt-pv-wall"><div class="write-items pt-pv-witems">' + ['١٥ ريلز', '!أراجع تقرير المبيعات', 'أرد على رسائل الزبائن', 'قراءة ساعة'].map(t=>'<div class="write-item-row"><span class="write-item-text">' + t + '</span><span class="write-item-actions">' + codisPvB('', 'تعديل') + codisPvB('del', 'حذف') + '</span></div>').join('') + '</div>' +
      '<div class="write-review pt-pv-wrv" style="display:flex"><p>فهمت منك ٤ عناصر، صحيح؟</p><div class="write-review-actions">' + codisPvB('review-edit', 'تعديل') + codisPvB('review-ok', 'تمام، رتّبها' + codisIcon('next')) + '</div></div></div></div>'],
    ['active', 'الخطة النشطة', 'بطاقة الخطة بعد التوزيع: نسبة الإنجاز وشريط التقدم وإجراءات الخطة.', ()=>codisPvPlanCard(64)],
    ['manage', 'الخطط المحفوظة والإدارة', 'حفظ الخطة باسم، وقائمة خططك المحفوظة مع التحميل والحذف.', ()=>codisPvPlanCard(64, true) + codisPvEditor('tasks', '١٥ ريلز\n!أراجع تقرير المبيعات', { saved:true, extend:true })]
  ],
  operations:[
    ['empty', 'قبل وصول المهام', 'الغرفة بانتظار خطة: مربع الانتظار وزرّ الانتقال للتخطيط.', ()=>codisPvEmpty('operations')],
    ['list', 'قائمة مهام اليوم', 'مؤشر اليوم وتبويبات الأيام ومستطيلات المهام قبل حسمها.', ()=>codisPvHud(0, 0, 4) + '<div class="pt-pv-tc">' + codisPvDays(2) + '<div class="section-head"><h2 class="section-title">المهام</h2>' + codisPvB('btn btn-quiet', 'إعادة التخطيط') + '</div><div class="pt-pv-list">' +
      codisPvTasks([{ text:'مراجعة تقرير المبيعات الأسبوعي', priority:'high', status:'' }, { text:'اتصال بفريق العمليات', status:'' }, { text:'ترتيب جدول اجتماعات الأسبوع', status:'' }]) + '</div></div>'],
    ['states', 'حالات الإنجاز', 'المهمة نفسها بثلاث حالات: خلصتها · نصها · ما سويتها.', ()=>'<div class="pt-pv-tc"><div class="pt-pv-list">' +
      codisPvTasks([{ text:'مراجعة تقرير المبيعات الأسبوعي', priority:'high', status:'done' }, { text:'اتصال بفريق العمليات', status:'half' }, { text:'الرد على رسائل الزبائن', status:'none' }]) + '</div></div>'],
    ['progress', 'اليوم ومؤشر XP', 'مؤشر الإنجاز ممتلئاً، والأيام المنجزة والمقفلة، ورسالة «كل مهام اليوم محسومة».', ()=>codisPvHud(100, 4, 4) + '<div class="pt-pv-tc">' + codisPvDays(3) + '<div class="pt-pv-list"><div class="empty-state is-clear">' + codisEsMark('opsd') + '<div class="es-copy">كل مهام اليوم محسومة</div></div></div></div>'],
    ['add', 'إضافة مهمة يدوياً', 'حقل المهمة الإضافية لهذا اليوم وزر الإضافة.', ()=>'<div class="pt-pv-tc"><div class="section-head"><h2 class="section-title">المهام</h2>' + codisPvB('btn btn-quiet', 'إعادة التخطيط') + '</div><div class="pt-pv-list">' +
      codisPvTasks([{ text:'اتصال بفريق العمليات', status:'' }]) + '</div><div class="row-input">' + '<input type="text" readonly tabindex="-1" aria-hidden="true" value="تجهيز عرض اجتماع الخميس">' + codisPvB('btn btn-secondary', 'إضافة') + '</div></div>'],
    ['timer', 'مؤقت تنفيذ المهمة', 'مهمة بمدة: زر «ابدأ المهمة» ومؤقت شغّال بحلقته وزرّ الإيقاف.', ()=>'<div class="pt-pv-tc"><div class="pt-pv-list">' + codisPvTimerTask('قراءة ساعة من كتاب الإدارة', false) + codisPvTimerTask('مراجعة الحسابات نص ساعة', true) + '</div></div>']
  ],
  teacher:[
    ['empty', 'قبل مسار التعلّم', 'الغرفة قبل أي خطة: مربع «مسارك التعليمي لم يبدأ بعد».', ()=>codisPvEmpty('teacher')],
    ['add', 'إضافة عناصر التعلّم', 'حقل عنصر التعلّم الإضافي مع أول عنصر بالقائمة.', ()=>'<div class="pt-pv-lc"><div class="section-head"><h2 class="section-title">التعلّم</h2>' + codisPvB('btn btn-quiet', 'إعادة التخطيط') + '</div><div class="pt-pv-list">' +
      codisPvTasks([{ text:'قراءة الفصل الثالث من كتاب الإدارة', status:'' }], true) + '</div><div class="row-input"><input type="text" readonly tabindex="-1" aria-hidden="true" value="درس مونتاج: القصّ والانتقالات">' + codisPvB('btn btn-secondary', 'إضافة') + '</div></div>'],
    ['list', 'قائمة التعلّم', 'عناصر التعلّم كما تظهر قبل حسمها، بأوزانها وخياراتها.', ()=>'<div class="pt-pv-lc"><div class="pt-pv-list">' + codisPvTasks([{ text:'قراءة الفصل الثالث من كتاب الإدارة', priority:'high', status:'' }, { text:'مراجعة المفردات الجديدة', status:'' }, { text:'٣ دروس مونتاج', status:'' }], true) + '</div></div>'],
    ['days', 'تبويبات الأيام', 'أيام المسار: المنجز والحالي والمقفل.', ()=>'<div class="pt-pv-lc">' + codisPvDays(2, true) + '<div class="section-head"><h2 class="section-title">التعلّم</h2>' + codisPvB('btn btn-quiet', 'إعادة التخطيط') + '</div><div class="pt-pv-list">' +
      codisPvTasks([{ text:'أتعلم أساسيات Excel', priority:'high', status:'' }], true) + '</div></div>'],
    ['progress', 'مؤشر الإنجاز', 'نسبة تقدم اليوم بشريط XP مع عناصر بعضها محسوم.', ()=>codisPvHud(58, 2, 4) + '<div class="pt-pv-lc"><div class="pt-pv-list">' + codisPvTasks([{ text:'مراجعة المفردات الجديدة', status:'done' }, { text:'٣ دروس مونتاج', status:'half' }], true) + '</div></div>'],
    ['done', 'بعد الإنجاز', 'كل عناصر اليوم محسومة والمؤشر مكتمل.', ()=>codisPvHud(100, 4, 4) + '<div class="pt-pv-lc"><div class="pt-pv-list"><div class="empty-state is-clear">' + codisEsMark('lrnd') + '<div class="es-copy">كل عناصر اليوم محسومة</div></div></div></div>']
  ],
  discipline:[
    ['build', '«أكتسبها»', 'قسم العادات التي تبنيها في حالته الأساسية مع عادة واحدة.', ()=>codisPvModes('build') + '<div class="pt-pv-hlist">' + codisPvHabit({ id:'ptpv-h1', text:'قراءة عشر صفحات', type:'E', importance:'important', log:codisPvLog(5) }) + '</div>'],
    ['list', 'قائمة العادات', 'عادات يومية وأسبوعية بأهميات مختلفة وسلاسلها.', ()=>codisPvModes('build') + '<div class="pt-pv-hlist">' + codisPvHabits('build') + '</div>'],
    ['add', 'إضافة عادة جديدة', 'نموذج الإضافة: الاسم والنوع والأهمية.', ()=>codisPvModes('build') + codisPvAddHabit('build', 'E', 'normal', [], 'رياضة صباحية')],
    ['options', 'الأهمية والتكرار والأيام', 'عادة أسبوعية: اختيار أيامها وأهميتها.', ()=>codisPvAddHabit('build', 'W', 'critical', [0, 2, 4], 'نادي الرياضة')],
    ['quit', '«أتخلص منها»', 'قسم العادات التي تتركها: الوصف ونموذج الإضافة الخاص بها.', ()=>codisPvModes('quit') + codisPvAddHabit('quit', 'H', 'important', [], 'التدخين')],
    ['quitList', 'عادات التخلص', 'عادات الامتناع اليومي والحدثية بعناصرها.', ()=>codisPvModes('quit') + '<div class="pt-pv-qlist">' + codisPvHabits('quit') + '</div>']
  ]
};
function codisPvTimerTask(text, running){
  let h = codisPtPvTask({ id:running ? 'ptpv-t2' : 'ptpv-t1', text:text, status:'' }, false);
  const row = running ? '<div class="tt-row is-run"><div class="tt-clock" role="timer"><span class="tt-ring" aria-hidden="true"></span><span class="tt-txt"><b dir="ltr">24:13</b><i>باقي من نص ساعة</i></span></div><button type="button" class="tt-stop" tabindex="-1">إيقاف</button></div>'
    : '<div class="tt-row"><button type="button" class="tt-start" tabindex="-1">' + CODIS_PLAY_SVG + '<span>ابدأ المهمة</span><span class="tt-dur">ساعة</span></button></div>';
  /* المهمة بمدة يبني لها التطبيق سطر المؤقت تلقائياً؛ نثبّت الحالة المطلوبة للعرض */
  return /class="tt-row/.test(h) ? h.replace(/<div class="tt-row[\s\S]*?<\/div>(?=\s*<div class="status-group)/, row) : h.replace(/(<div class="status-group)/, row + '$1');
}
/* المشاهد: غرفة كاملة ⇒ حالات الغرفة؛ أسطح ⇒ سطح لكل مشهد (كما كان) */
const CODIS_SURF_DESC = { box:'المربع الذي يظهر والغرفة بلا خطة.', card:'بطاقة الخطة الشغّالة ونسبة إنجازها وأزرارها.', panel:'مربع كتابة الخطة والمهام.', scope:'مستطيلات المهام: الاسم والوزن وخيارات الحالة.', inner:'الرسالة التي تظهر حين تُحسم كل مهام اليوم.' };
function codisThemeScenes(d){
  if(!d) return [];
  if(codisThemeIsRoom(d)) return (CODIS_ROOM_SCENES[d.target] || []).map(s=>({ key:s[0], title:s[1], desc:s[2], kind:'room', html:()=>codisPvRoom(d, s[3](), d.target === 'discipline' ? ' data-mode="' + (/^quit/.test(s[0]) ? 'quit' : 'build') + '"' : '') }));
  return codisThemeSurfaces(d.target).map(sf=>({ key:sf.key, title:sf.short || sf.label || sf.key, desc:sf.label && sf.label !== sf.short ? sf.label : (CODIS_SURF_DESC[sf.kind] || ''), kind:'surface', html:()=>codisPtSlideHtml(d, sf) }));
}
let codisPvScenes = [];
function codisPlanThemeStageHtml(id, big){
  const d = CodisPlanThemes.def(id); if(!d) return '';
  if(!big) return codisThemeIsRoom(d) ? codisRoomThemeStageHtml(d, false) : '<div class="pt-stage is-mini">' + codisPlanThemeBoxHtml(d.id, true) + '</div>';
  const sc = codisPvScenes = codisThemeScenes(d), n = sc.length, fx = codisThemeFxOf(d);
  const nav = n < 2 ? '' : '<div class="pt-scn-bar"><button type="button" class="pt-slide-nav is-prev" aria-label="المشهد السابق" onclick="codisPtSlideStep(-1)">' + codisIcon('next') + '</button>' +
    '<div class="pt-scn-mid"><div class="pt-scn-top"><b class="pt-scn-t pt-slide-lab" aria-live="polite">' + escapeHtml(sc[0].title) + '</b><span class="pt-scn-n" dir="ltr">1 / ' + n + '</span></div><p class="pt-scn-d">' + escapeHtml(sc[0].desc) + '</p>' +
    '<div class="pt-scn-dots" role="tablist" aria-label="مشاهد المعاينة">' + sc.map((s, i)=>'<button type="button" role="tab" class="pt-scn-dot' + (i ? '' : ' is-on') + '" aria-selected="' + (i ? 'false' : 'true') + '" tabindex="' + (i ? '-1' : '0') + '" aria-label="' + escapeHtml((i + 1) + ' — ' + s.title) + '" onclick="codisPtSlideStep(0, ' + i + ')"></button>').join('') + '</div></div>' +
    '<button type="button" class="pt-slide-nav is-next" aria-label="المشهد التالي" onclick="codisPtSlideStep(1)">' + codisIcon('next') + '</button></div>';
  const slides = sc.map((s, i)=>'<div class="pt-stage is-big pt-slide' + (i ? '' : ' is-on') + (s.kind === 'room' ? ' is-room' : '') + '" data-i="' + i + '" data-surface="' + escapeHtml(s.key) + '"' + (i ? ' aria-hidden="true"' : '') + '>' + (i ? '' : s.html()) + '</div>').join('');
  return nav + '<div class="pt-slides pt-scn" data-n="' + n + '" data-i="0" data-fx="' + escapeHtml(fx) + '"' + (fx ? ' aria-describedby="pt-scn-try"' : '') + '>' + slides + '</div>' +
    (fx ? '<p class="pt-scn-try" id="pt-scn-try">' + (fx === 'meteor' ? 'جرّب: حرّك المؤشر أو المس المعاينة واضغط الأزرار — نفس ضوء النيزك وحلقاته وشراراته بالغرفة.' : 'جرّب: حرّك المؤشر فوق الخشب أو المسه واضغط الأزرار — نفس الضوء الكهرماني والحلقة والانضغاط بالغرفة.') + '</p>' : '');
}
function codisPtSlideLab(d, i){ const s = codisPvScenes[i]; return s ? s.title : ''; }
/* التنقل: بلا إعادة بناء للنافذة؛ المشهد يُبنى أول مرة فقط؛ التفاعل ينتقل للمشهد الظاهر وحده */
function codisPtSlideStep(dir, to){
  const el = codisPtPrevEl, d = el && CodisPlanThemes.def(codisPtPrevId), S = el && el.querySelector('.pt-slides'); if(!d || !S) return;
  const n = +S.getAttribute('data-n') || 1; if(n < 2) return;
  const cur = +S.getAttribute('data-i') || 0;
  let i = to !== undefined ? to : cur + dir; i = ((i % n) + n) % n; if(i === cur && to !== undefined) return;
  try{ CodisThemePreviewFx.reset(); }catch(e){}
  S.setAttribute('data-i', i);
  S.querySelectorAll(':scope > .pt-slide').forEach(x=>{ const k = +x.getAttribute('data-i'), on = k === i;
    if(on && !x.firstElementChild){ const s = codisPvScenes[k]; try{ x.innerHTML = s ? s.html() : ''; }catch(e){ console.error('CODIS theme scene:', e); } }
    x.classList.toggle('is-on', on); if(on) x.removeAttribute('aria-hidden'); else x.setAttribute('aria-hidden', 'true'); });
  const s = codisPvScenes[i] || {};
  el.querySelectorAll('.pt-scn-dot').forEach((x, k)=>{ const on = k === i; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
  const t = el.querySelector('.pt-scn-t'), c = el.querySelector('.pt-scn-n'), p = el.querySelector('.pt-scn-d');
  if(t) t.textContent = s.title || ''; if(c) c.textContent = (i + 1) + ' / ' + n; if(p) p.textContent = s.desc || '';
  try{ codisSfx('press', { ctx:'tab' }); }catch(e){}
}

/* ---------- CodisThemePreviewFx: تجربة تفاعل الثيم داخل نافذة التفاصيل فقط ---------- */
const CODIS_PV_FX_KITS = {
  /* النيزك: نفس طبقة .bm-fx (ضوء يتبع المؤشر، حلقات طاقة، شرارات، bm-press/bm-near وحافة اللوح --bm-mx/--bm-my) */
  meteor:{
    PANEL:'.task-item, .habit-card, .plan-card, .xp-hud, .write-box, .empty-state, .card, .saved-plan-row, .row-input, .disc-mode, .day-tab, .write-item-row, .write-review',
    PRESS:'button, .btn, .stat-btn, .pm-btn, .task-wt, .day-tab, .hb-chip, .disc-mode, .review-ok, .review-edit',
    host(t, slide){ const r = t.closest('.bm-pv.pt-room'); return r && slide.contains(r) ? r : null; },
    layer(h){ const f = h.querySelector(':scope > .bm-decor > .bm-fx'); return f ? { fx:f, light:f.querySelector('.bm-light'), box:h.querySelector(':scope > .bm-decor') } : null; },
    on(S, touch){ S.L.fx.classList.add('is-on'); S.L.fx.classList.toggle('is-touch', !!touch); },
    off(S){ if(S.L) S.L.fx.classList.remove('is-on', 'is-touch'); },
    paint(S){ const r = S.L.box.getBoundingClientRect(); if(S.L.light) S.L.light.style.transform = 'translate3d(' + Math.round(S.x - r.left) + 'px,' + Math.round(S.y - r.top) + 'px,0)';
      if(S.panel && (++S.pf & 1) === 0 && (Math.abs(S.x - S.pmx) >= 5 || Math.abs(S.y - S.pmy) >= 5)){ S.pmx = S.x; S.pmy = S.y; const b = S.panel.getBoundingClientRect(); S.panel.style.setProperty('--bm-mx', Math.round(S.x - b.left) + 'px'); S.panel.style.setProperty('--bm-my', Math.round(S.y - b.top) + 'px'); } },
    panelCls:'bm-near', pressCls:'bm-press',
    ring(S, e, strong){
      const fx = S.L.fx, rs = fx.querySelectorAll('.bm-ring'); if(!rs.length || typeof Element.prototype.animate !== 'function') return;
      const r = S.L.box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, el = rs[S.n++ % rs.length];
      el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
      try{ el.animate([{ transform:'translate(-50%,-50%) scale(.15)', opacity:.95 }, { transform:'translate(-50%,-50%) scale(1)', opacity:0 }], { duration:strong ? 640 : 520, easing:'cubic-bezier(.2,.7,.2,1)' }); }catch(x){}
      if(!strong) return; const sp = fx.querySelector('.bm-sparks'); if(!sp) return; sp.style.left = Math.round(x) + 'px'; sp.style.top = Math.round(y) + 'px';
      Array.prototype.forEach.call(sp.children, (b, i)=>{ const a = (i / sp.children.length) * 6.283 + (S.n % 5) * .37, dist = 18 + ((i * 7 + S.n * 3) % 13);
        try{ b.animate([{ transform:'rotate(' + a + 'rad) translateX(4px) scaleX(.6)', opacity:1 }, { transform:'rotate(' + a + 'rad) translateX(' + dist + 'px) scaleX(.15)', opacity:0 }], { duration:360 + (i % 3) * 60, easing:'cubic-bezier(.1,.8,.3,1)' }); }catch(x){} });
    }
  },
  /* الخشب: نفس طبقة .aw-fx (توهج يتبع المؤشر، لمعة الحافة النحاسية، حلقة اللمس، ظل الضغط، aw-press) على السطح الملبّس أو مستطيل المهمة */
  wood:{
    PANEL:'', PRESS:'button, .btn, .stat-btn, .pm-btn, .task-wt',
    host(t, slide){ const s = t.closest('[data-pt^="agedWood"][data-pt-target]'); if(!s || !slide.contains(s)) return null;
      if(s.classList.contains('pt-scope')){ const it = t.closest('.task-item'); return (it && it.parentElement === s) ? it : null; } return s; },
    layer(h){ let f = h.querySelector(':scope > .aw-fx, :scope > .pt-decor > .aw-fx');
      if(!f){ f = document.createElement('span'); f.className = 'aw-fx'; f.setAttribute('aria-hidden', 'true'); f.innerHTML = '<i class="aw-glow"></i><i class="aw-rim"></i><i class="aw-ring"></i>'; (h.querySelector(':scope > .pt-decor') || h).appendChild(f); }
      return { fx:f, box:h }; },
    on(S, touch){ S.host.classList.add('aw-lit'); S.L.fx.classList.add('is-on'); if(touch){ S.host.classList.add('aw-touch'); S.L.fx.classList.add('is-touch'); } },
    off(S){ if(S.host) S.host.classList.remove('aw-lit', 'aw-touch'); if(S.L) S.L.fx.classList.remove('is-on', 'is-touch', 'is-ring'); },
    paint(S){ const r = S.host.getBoundingClientRect(); S.L.fx.style.setProperty('--aw-x', Math.round((S.x - r.left) * 10) / 10 + 'px'); S.L.fx.style.setProperty('--aw-y', Math.round((S.y - r.top) * 10) / 10 + 'px'); },
    panelCls:'', pressCls:'aw-press',
    ring(S, e){ const r = S.host.getBoundingClientRect(), f = S.L.fx; f.style.setProperty('--aw-rx', Math.round((e.clientX - r.left) * 10) / 10 + 'px'); f.style.setProperty('--aw-ry', Math.round((e.clientY - r.top) * 10) / 10 + 'px'); f.classList.remove('is-ring'); void f.offsetWidth; f.classList.add('is-ring'); }
  }
};
const CodisThemePreviewFx = (function(){
  let ov = null, kit = null, S = null, raf = 0, pid = null, press = null, sw = null, H = null;
  const calm = ()=>{ try{ return !!(window.CODIS_REDUCED_MOTION || document.documentElement.classList.contains('sx-calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); }catch(e){ return false; } };
  const slideOf = ()=>ov && ov.querySelector('.pt-slides > .pt-slide.is-on');
  function release(){ if(press){ if(kit) press.classList.remove(kit.pressCls); press = null; } }
  function setPanel(p){ if(!S || S.panel === p) return; if(S.panel){ S.panel.classList.remove(kit.panelCls); S.panel.style.removeProperty('--bm-mx'); S.panel.style.removeProperty('--bm-my'); if(!S.panel.getAttribute('style')) S.panel.removeAttribute('style'); }
    S.panel = p; S.pmx = S.pmy = -1e4; S.pf = 1; if(p && kit.panelCls) p.classList.add(kit.panelCls); }
  function off(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } if(S){ setPanel(null); kit.off(S); } S = null; }
  function paint(){ raf = 0; if(!S || !S.host.isConnected || !ov){ off(); return; } kit.paint(S); }
  function queue(e){ if(!S) return; S.x = e.clientX; S.y = e.clientY; if(!raf) raf = requestAnimationFrame(paint); }
  function bind(h){ if(S && S.host === h) return true; off(); const L = kit.layer(h); if(!L) return false; S = { host:h, L:L, x:0, y:0, n:0, panel:null, pf:0, pmx:-1e4, pmy:-1e4 }; return true; }
  function hostAt(t){ const sl = slideOf(); return (sl && t && t.closest && sl.contains(t)) ? kit.host(t, sl) : null; }
  function down(e){
    if(calm()) return; const h = hostAt(e.target); if(!h){ off(); return; } if(!bind(h)) return;
    const b = e.target.closest(kit.PRESS), isB = !!(b && h.contains(b));
    if(isB){ release(); press = b; b.classList.add(kit.pressCls); }
    if(kit.PANEL){ const p = e.target.closest(kit.PANEL); setPanel(p && h.contains(p) ? p : null); }
    queue(e); kit.on(S, e.pointerType !== 'mouse'); kit.ring(S, e, isB);
    if(e.pointerType !== 'mouse') pid = e.pointerId;
  }
  function move(e){
    if(calm()) return;
    if(e.pointerType === 'mouse'){ if(pid !== null) return;   /* إصبع ضاغط الآن ⇒ الماوس لا يلغي حالة اللمس */
      const h = hostAt(e.target); if(!h){ if(S) off(); return; } if(!bind(h)) return; kit.on(S, false);
      if(kit.PANEL){ const p = e.target.closest(kit.PANEL); setPanel(p && h.contains(p) ? p : null); } queue(e); return; }
    if(pid !== e.pointerId || !S) return;
    const r = S.host.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){ release(); pid = null; off(); return; }
    queue(e);
  }
  function up(e){ release(); if(e.pointerType !== 'mouse' && (pid === e.pointerId || pid === null)){ pid = null; off(); } }
  function cancel(){ release(); pid = null; off(); }
  function outF(e){ if(e.pointerType !== 'mouse' || !S) return; const to = e.relatedTarget; if(!to || !S.host.contains(to)) off(); }
  /* السحب الأفقي بين المشاهد (لمس/قلم): العمودي للمتصفح (touch-action:pan-y على المسرح) */
  function swDown(e){ if(e.pointerType === 'mouse' || !e.target.closest('.pt-slides')) return; sw = { id:e.pointerId, x:e.clientX, y:e.clientY, t:Date.now() }; }
  function swUp(e){ const s = sw; sw = null; if(!s || s.id !== e.pointerId || e.type !== 'pointerup') return; const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if(Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - s.t < 900){ cancel(); codisPtSlideStep(dx < 0 === (document.documentElement.dir !== 'ltr') ? 1 : -1); } }
  /* عزل تام: النقرة داخل المشهد لا تصل لأي معالج بالتطبيق (المعالجات بمرحلة الفقاعة) ولا تغيّر شيئاً */
  function block(e){ if(e.target && e.target.closest && e.target.closest('.pt-slides > .pt-slide')){ e.preventDefault(); e.stopPropagation(); } }
  function keys(e){
    const t = e.target; if(!ov || (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const rtl = document.documentElement.dir !== 'ltr', k = e.key;
    if(k === 'ArrowLeft' || k === 'ArrowRight'){ e.preventDefault(); codisPtSlideStep((k === 'ArrowLeft') === rtl ? 1 : -1); const d = ov.querySelector('.pt-scn-dot.is-on'); if(d && t && t.classList && t.classList.contains('pt-scn-dot')) d.focus(); }
    else if((k === 'Home' || k === 'End') && t && t.classList && t.classList.contains('pt-scn-dot')){ e.preventDefault(); const S = ov.querySelector('.pt-slides'), n = S ? +S.getAttribute('data-n') || 1 : 1; codisPtSlideStep(0, k === 'Home' ? 0 : n - 1); const d = ov.querySelector('.pt-scn-dot.is-on'); if(d) d.focus(); }
  }
  function vis(){ if(document.hidden) cancel(); }
  function attach(el, d){
    detach(); if(!el) return;
    ov = el; const k = CODIS_PV_FX_KITS[codisThemeFxOf(d)] || null; kit = k;
    const o = { passive:true };
    H = [['pointerdown', swDown, o], ['pointerup', swUp, o], ['pointercancel', ()=>{ sw = null; }, o], ['click', block, true], ['keydown', keys, false]];
    if(k) H.push(['pointerdown', down, o], ['pointermove', move, o], ['pointerup', up, o], ['pointercancel', cancel, o], ['pointerout', outF, o]);
    H.forEach(h=>el.addEventListener(h[0], h[1], h[2]));
    window.addEventListener('pagehide', cancel); window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', vis);
  }
  function detach(){
    cancel(); sw = null;
    if(ov && H) H.forEach(h=>ov.removeEventListener(h[0], h[1], h[2]));
    if(H){ window.removeEventListener('pagehide', cancel); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', vis); }
    H = null; ov = null; kit = null;
  }
  return { attach, detach, reset:cancel, state:()=>({ open:!!ov, kit:kit ? Object.keys(CODIS_PV_FX_KITS).find(x=>CODIS_PV_FX_KITS[x] === kit) : '', active:!!S, press:!!press, listeners:H ? H.length : 0 }) };
})();

/* ---------- «؟» وصف العائلة/المنتج: نافذة صغيرة واحدة على مستوى الصفحة ---------- */
function codisInfoText(key){
  const m = /^(fam|pt|cf|cfsec):(.+)$/.exec(key || ''); if(!m) return null;
  if(m[1] === 'fam'){ const f = CODIS_THEME_FAMILIES.find(x=>x.id === m[2]); return f && f.desc ? { t:f.ar || f.name, s:f.name, b:f.desc } : null; }
  if(m[1] === 'pt'){ const d = CodisPlanThemes.def(m[2]); return d && d.desc ? { t:d.ar + ' — ' + codisPtRoom(d).room, s:d.name, b:d.desc } : null; }
  if(m[1] === 'cf'){ const d = CodisConfirmThemes.def(m[2]); return d ? { t:'ثيم ' + d.ar + ' لنوافذ الموافقة', s:d.name, b:d.desc } : null; }
  if(m[1] === 'cfsec') return { t:'ثيمات نوافذ الموافقة', s:'Confirmation Themes', b:'أربعة منتجات مستقلة، كل واحد يُشترى وحده بسعره. الثيم المجهّز يلبّس كل نوافذ الموافقة والتأكيد بالتطبيق (الحذف، الشراء، الإجراءات المهمة) — ولا يمسّ الغرف ولا بقية النوافذ.' };
  return null;
}
function codisInfoBtnHtml(key, label, cls){ return codisInfoText(key) ? '<button type="button" class="pt-info' + (cls ? ' ' + cls : '') + '" data-info="' + escapeHtml(key) + '" aria-haspopup="dialog" aria-expanded="false" aria-label="' + escapeHtml('عن ' + label) + '" onclick="codisInfoOpen(this, event)"><span aria-hidden="true">?</span></button>' : ''; }
let codisInfoEl = null, codisInfoFrom = null;
function codisInfoOpen(btn, ev){
  if(ev){ ev.stopPropagation(); ev.preventDefault(); }
  if(!btn) return; const key = btn.getAttribute('data-info'), same = codisInfoFrom === btn && codisInfoEl;
  codisInfoClose(true); if(same) return;
  const x = codisInfoText(key); if(!x) return;
  const el = document.createElement('div'); el.className = 'pt-pop'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'false'); el.setAttribute('aria-labelledby', 'pt-pop-t'); el.setAttribute('aria-describedby', 'pt-pop-b'); el.tabIndex = -1;
  el.innerHTML = '<div class="pt-pop-h"><div class="pt-pop-tt"><b id="pt-pop-t">' + escapeHtml(x.t) + '</b>' + (x.s ? '<span dir="ltr">' + escapeHtml(x.s) + '</span>' : '') + '</div><button type="button" class="pt-pop-x" aria-label="إغلاق الوصف" onclick="codisInfoClose()">' + codisIcon('close') + '</button></div><p class="pt-pop-b" id="pt-pop-b">' + escapeHtml(x.b) + '</p>';
  (btn.closest('#eco-store-body') || document.body).appendChild(el); codisInfoEl = el; codisInfoFrom = btn; btn.setAttribute('aria-expanded', 'true'); btn.classList.add('is-open');
  /* الموضع: تحت الزر (أو فوقه إن لم يتسع)، محصور بالشاشة */
  const r = btn.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight, w = Math.min(320, vw - 24);
  el.style.width = w + 'px'; el.style.left = '0px'; el.style.top = '0px'; const o0 = el.getBoundingClientRect(), h = el.offsetHeight;   /* الحاوية قد تكون محوَّلة (إطار 430px) ⇒ نطرح أصلها */
  let left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), vw - w - 12), top = r.bottom + 8; if(top + h > vh - 12 && r.top - h - 8 > 12) top = r.top - h - 8;
  top = Math.max(12, Math.min(top, vh - h - 12));
  el.style.left = Math.round(left - o0.left) + 'px'; el.style.top = Math.round(top - o0.top) + 'px'; el.style.setProperty('--pop-ax', Math.round(r.left + r.width / 2 - left) + 'px'); el.classList.toggle('is-up', top < r.top);
  requestAnimationFrame(()=>{ if(codisInfoEl === el){ el.classList.add('is-in'); try{ el.focus({ preventScroll:true }); }catch(e){} } });
  document.addEventListener('pointerdown', codisInfoOutside, true); document.addEventListener('keydown', codisInfoKey, true);
  window.addEventListener('resize', codisInfoCloseQuiet); document.addEventListener('scroll', codisInfoCloseQuiet, true);
  try{ codisSfx('expand'); }catch(e){}
}
function codisInfoOutside(e){ if(!codisInfoEl) return; if(codisInfoEl.contains(e.target)) return; if(codisInfoFrom && codisInfoFrom.contains(e.target)) return; codisInfoClose(true, true); }
function codisInfoKey(e){ if(e.key === 'Escape' && codisInfoEl){ e.stopPropagation(); e.preventDefault(); codisInfoClose(); } }
function codisInfoCloseQuiet(e){ if(e && e.type === 'scroll' && codisInfoEl && codisInfoEl.contains(e.target)) return; codisInfoClose(true, true); }
function codisInfoClose(silent, keepFocus){
  document.removeEventListener('pointerdown', codisInfoOutside, true); document.removeEventListener('keydown', codisInfoKey, true);
  window.removeEventListener('resize', codisInfoCloseQuiet); document.removeEventListener('scroll', codisInfoCloseQuiet, true);
  const el = codisInfoEl, b = codisInfoFrom; codisInfoEl = null; codisInfoFrom = null; if(!el) return;
  el.remove(); if(b){ b.setAttribute('aria-expanded', 'false'); b.classList.remove('is-open'); if(!keepFocus && b.isConnected){ try{ b.focus({ preventScroll:true }); }catch(e){} } }
  if(!silent){ try{ codisSfx('collapse'); }catch(e){} }
}
