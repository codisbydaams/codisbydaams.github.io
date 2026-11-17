/* ================= CODIS-V62 (3.49.0) · مقاييس مكافآت التقدم الجديدة =================
   function declarations فقط (آمنة وقت التحميل: لا تقرأ const/let معرّفاً بعدها إلا عند الاستدعاء، ولا ترمي — كل مقياس داخل try).
   كل مقياس يقرأ البيانات الحقيقية لنظامه نفسه — لا عدّاد ثانٍ ولا نسبة نجاح جديدة:
   • شهر بلا وقوع: عادة «حدثية» (H) بـ«أتخلص منها» — نفس hDays (من الإنشاء أو آخر وقوع) ونفس محطة الـ30 يوماً (monthlyMilestones) التي يسجّلها runHabitChecks.
     أي وقوع يعيد العدّاد (lastOccurrence) فلا تُحتسب المحاولة.
   • أول أسبوع بعادة يومية (E): 7 أيام متتالية مسجّلة فعلاً بسجل العادة (h.log = «سويتها اليوم» / «نجحت اليوم») — نفس قاعدة محطة السلسلة 7 (V34)، لا مرور الأيام.
     «أكتسبها» = E بلا abstain · «أتخلص منها» = E مع abstain:true (isAbstainDaily).
   • أول شهر ناجح: نتيجة شهرية بسجل النتائج (monthly|<الشهر>) غير ملغاة وتقييمها ليس «إخفاق» — نفس r.success = tier !== 'fail' بالتقرير الشهري (شهادة نجاح). */
function codisPgArchHabits(kind, type){
  try{ return (Array.isArray(data.archive) ? data.archive : []).filter(a=>a && a.kind === 'habit' && a.habitKind === kind && a.habitType === type && a.habit && typeof a.habit === 'object').map(a=>a.habit); }
  catch(e){ return []; }
}
function codisProgressHabitMonth(){
  try{
    let best = 0;
    const has = h=>!!(h && h.monthlyMilestones && typeof h.monthlyMilestones === 'object' && Object.keys(h.monthlyMilestones).length);
    const live = (data.habits && Array.isArray(data.habits.quit)) ? data.habits.quit : [];
    live.forEach(h=>{ if(!h || h.type !== 'H') return; if(has(h)){ best = 30; return; } let d = 0; try{ d = hDays(h); }catch(e){ d = 0; } if(isFinite(d) && d > best) best = d; });
    codisPgArchHabits('quit', 'H').forEach(h=>{ if(has(h)) best = 30; });   /* شهر مكتمل ثم أُرشفت العادة: الإنجاز تحقق فعلاً */
    return Math.min(30, Math.max(0, Math.floor(best)));
  }catch(e){ return 0; }
}
/* أطول سلسلة أيام متتالية مسجّلة بنجاح لعادة يومية (لا أيام قبل إنشائها ولا بعد اليوم ولا يوم مسجّل فيه إخفاق) */
function codisPgRun(h){
  try{
    const today = todayKey(), fl = (h.failLog && typeof h.failLog === 'object') ? h.failLog : {};
    const ds = habitDoneDays(h).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k) && k <= today && (!h.createdAt || k >= h.createdAt) && !fl[k]);
    let b = 0, r = 0, p = null;
    ds.forEach(d=>{ r = (p && daysBetween(p, d) === 1) ? r + 1 : 1; p = d; if(r > b) b = r; });
    return b;
  }catch(e){ return 0; }
}
function codisProgressDailyWeek(kind){
  try{
    const ok = h=>!!h && h.type === 'E' && (kind === 'quit' ? h.abstain === true : h.abstain !== true);
    let best = 0;
    const live = (data.habits && Array.isArray(data.habits[kind])) ? data.habits[kind] : [];
    live.concat(codisPgArchHabits(kind, 'E')).forEach(h=>{ if(ok(h)){ const r = codisPgRun(h); if(r > best) best = r; } });
    return Math.min(7, best);
  }catch(e){ return 0; }
}
function codisProgressMonthWins(){
  try{
    const L = data.outcomeLedger || {}; let n = 0;
    Object.keys(L).forEach(k=>{ const e = L[k]; if(e && e.scope === 'monthly' && e.status !== 'void' && (e.kind === 'reward' || (e.kind === 'neutral' && e.tier !== 'fail'))) n++; });
    return n;
  }catch(e){ return 0; }
}
