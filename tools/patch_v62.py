"""CODIS-V62 (3.49.0) — أربعة إنجازات جديدة بمكافآت التقدم (استلام يدوي) + إلغاء الدمج التلقائي للقسائم (دمج يدوي من «بحوزتك») + الصناديق المغلقة بـ«بحوزتك»
   (استخدام ← قسم البكجات ← فتح) + نافذة خيارين عند «شراء 1» مع صندوق مطابق. فوق ناتج patch_v61 وقبل boot_split.
  py -3 tools/patch_v62.py <ناتج patch_v61 قبل boot_split> <out>   (sh tools/rebuild_v62.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V62' not in s and 'CODIS-V61' in s, 'needs v61 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)

# ===================== 1) القسائم: لا دمج تلقائي أبداً (شراء/صندوق/مكافأة) + دمج يدوي واحد لكل ضغطة =====================
rep("""    L().push(ev);
    const boxes = settleInTx(d.tier); if(!boxes) return null;
    return { def:d, n:n, have:count(d.tier), boxes:boxes, ev:ev };""",
"""    L().push(ev);
    return { def:d, n:n, have:count(d.tier), boxes:[], ev:ev };   /* CODIS-V62: لا دمج تلقائي — الدمج بطلب المستخدم فقط (merge) */""")
rep("""        const boxes = settleInTx(d.tier); if(!boxes) return { ok:false, reason:'inventory' };
        return { ok:true, def:d, n:qty, cost:cost, tx:tx, before:before, have:count(d.tier), boxes:boxes, left:dailyLeft() };""",
"""        const boxes = [];   /* CODIS-V62: لا دمج تلقائي مهما بلغ العدد */
        return { ok:true, def:d, n:qty, cost:cost, tx:tx, before:before, have:count(d.tier), boxes:boxes, left:dailyLeft() };""")
rep("""  return Object.freeze({ PER_BOX:PER_BOX, defs, def, price, value, count, counts, total, boughtToday, dailyCap, dailyLeft, prizes, grantInTx, settleInTx, buy, redeemed });""",
"""  /* CODIS-V62: الدمج اليدوي — ضغطة واحدة = −10 من المستوى نفسه + صندوق مغلق واحد من مستواه (لا يُفتح) بمعاملة واحدة ذرّية.
     المعرّف من رقم الدمج التراكمي لهذا المستوى (vr|<tier>|<k> · box|vr|<tier>|<k>) ⇒ نقرتان متزامنتان أو جهازان دمجا الدفعة نفسها ⇒ حدث واحد وصندوق واحد بعد الدمج.
     فشل الحفظ ⇒ التراجع كاملاً (القسائم كما هي ولا صندوق). */
  let merging = false;
  function merge(tier){
    const d = def(tier); if(!d || !CodisBoxes.tier(d.tier)) return { ok:false, reason:'invalid' };
    if(merging) return { ok:false, reason:'busy' };
    if(count(d.tier) < PER_BOX) return { ok:false, reason:'few', have:count(d.tier) };
    merging = true;
    try{
      return CodisWallet.transact([], ()=>{
        if(count(d.tier) < PER_BOX) return { ok:false, reason:'few' };
        const k = redeemed(d.tier) + 1, id = 'vr|' + d.tier + '|' + k, uid = 'box|' + id;
        if(L().some(e=>e.id === id) || CodisBoxes.get(uid)) return { ok:false, reason:'dup' };
        const at = econNowIso();
        L().push({ id:id, t:'redeem', tier:d.tier, n:-PER_BOX, at:at });
        if(!data.inventory.boxes) data.inventory.boxes = [];
        data.inventory.boxes.push({ uid:uid, tier:d.tier, paid:0, currency:'VOUCHER', acquiredAt:at, status:'unopened', sourceRef:id });
        return { ok:true, def:d, uid:uid, have:count(d.tier), tier:CodisBoxes.tier(d.tier) };
      });
    } finally { merging = false; }
  }
  return Object.freeze({ PER_BOX:PER_BOX, defs, def, price, value, count, counts, total, boughtToday, dailyCap, dailyLeft, prizes, grantInTx, settleInTx, buy, redeemed, merge });""")

# ===================== 2) الدمج بين الأجهزة: الصندوق المفتوح لا يرجع مغلقاً أبداً =====================
rep("const RANK = { pending:0, owned:0,", "const RANK = { pending:0, unopened:0, owned:0,")

# ===================== 3) مكافآت التقدم: أربعة إنجازات + مقاييسها (الإنجازات السابقة كما هي) =====================
core = rd('identity', 'v62_core.js'); assert '</script' not in core and '<!--' not in core
rep("const CODIS_PROGRESS = Object.freeze([", "/* ===== CODIS-V62 ===== */\n" + core + "\nconst CODIS_PROGRESS = Object.freeze([")
rep("""icon:'book', rewards:Object.freeze([{ type:'gems', n:10 }]) })
]);""", """icon:'book', rewards:Object.freeze([{ type:'gems', n:10 }]) }),
  /* CODIS-V62 */
  Object.freeze({ id:'habit_month_clean', order:40, name:'شهر كامل بدون وقوع', desc:'أكمل 30 يوماً متتالية بدون تسجيل أي وقوع في عادة «حدثية» من قسم «أتخلص منها» بغرفة التأديب. أي وقوع يعيد العدّاد.', goal:30, metric:'habitMonthClean', icon:'hourglass', rewards:Object.freeze([{ type:'gems', n:30 }]) }),
  Object.freeze({ id:'build_week1', order:50, name:'أول أسبوع في اكتساب عادة', desc:'سجّل «سويتها اليوم» 7 أيام متتالية في عادة يومية من قسم «أكتسبها». الأيام المسجّلة فعلاً فقط تُحتسب.', goal:7, metric:'buildWeek', icon:'sparkle', rewards:Object.freeze([{ type:'gems', n:5 }]) }),
  Object.freeze({ id:'quit_week1', order:60, name:'أول أسبوع في التخلص من عادة', desc:'سجّل «نجحت اليوم» 7 أيام متتالية في عادة يومية من قسم «أتخلص منها». الأيام المسجّلة فعلاً فقط تُحتسب.', goal:7, metric:'quitWeek', icon:'check', rewards:Object.freeze([{ type:'gems', n:5 }]) }),
  Object.freeze({ id:'first_month', order:70, name:'أول شهر ناجح', desc:'أنهِ أول شهر ينجح بالتقييم الشهري لـCODIS (شهادة نجاح: شهر ناجح أو ممتاز). الصناديق تنضاف مغلقة إلى «بحوزتك».', goal:1, metric:'monthSuccess', icon:'trophy', rewards:Object.freeze([{ type:'boxes', tier:'bx1', n:5 }]) })
]);""")
rep("const CODIS_PROGRESS_METRICS = Object.freeze({ weeklySuccess:codisProgressWeeklyWins, opsDone:()=>codisProgressDoneCount('tasks'), learnDone:()=>codisProgressDoneCount('learn') });",
    "const CODIS_PROGRESS_METRICS = Object.freeze({ weeklySuccess:codisProgressWeeklyWins, opsDone:()=>codisProgressDoneCount('tasks'), learnDone:()=>codisProgressDoneCount('learn'),\n  habitMonthClean:codisProgressHabitMonth, buildWeek:()=>codisProgressDailyWeek('build'), quitWeek:()=>codisProgressDailyWeek('quit'), monthSuccess:codisProgressMonthWins });   /* CODIS-V62 */")
rep("  function soon(ms){ clearTimeout(soonT);", """  /* CODIS-V62: تراجع اليوم نفسه عن التسجيل الذي جعل الإنجاز جاهزاً (مثل V34 voidIfPending لمحطة السلسلة) ⇒ يرجع «قيد التقدم» ما دام لم يُستلم ولم يعد شرطه متحققاً.
     الفتح من يوم سابق يبقى (حق المستخدم لا يضيع). فشل الحفظ ⇒ لا تغيير */
  function revalidate(ids){
    try{
      const p = P(), today = localDateStr(CodisClock.date()), drop = [];
      (ids || []).forEach(id=>{ const a = def(id); if(!a || claimed(id) || met(a)) return; const u = p.unlocked.find(x=>x.id === id); if(!u) return;
        let d = ''; try{ d = u.at ? localDateStr(new Date(u.at)) : ''; }catch(e){ d = ''; } if(d === today) drop.push(id); });
      if(!drop.length) return [];
      const keep = p.unlocked; p.unlocked = keep.filter(u=>drop.indexOf(u.id) === -1);
      if(!saveData()){ p.unlocked = keep; return []; }
      try{ codisProgressRender(); codisProgressHomeBadge(); }catch(e){}
      return drop;
    }catch(e){ return []; }
  }
  function soon(ms){ clearTimeout(soonT);""")
rep("  return Object.freeze({ defs, def, list, state, claimed, unlocked, readyCount, claim, check, soon, value });",
    "  return Object.freeze({ defs, def, list, state, claimed, unlocked, readyCount, claim, check, soon, value, revalidate });")

# الأحداث الحقيقية ⇒ فحص (فتح فقط، بلا منح)
rep("""  saveData();
  if(!celebrated) codisSfx(was ? 'task.undo' : 'task.done', { ctx:'habit' });""",
"""  saveData();
  try{ if(was) CodisProgress.revalidate(['build_week1', 'quit_week1']); else CodisProgress.soon(); }catch(x){}   /* CODIS-V62: يوم ناجح ⇒ فحص «أول أسبوع»؛ تراجع اليوم نفسه ⇒ إعادة تحقق */
  if(!celebrated) codisSfx(was ? 'task.undo' : 'task.done', { ctx:'habit' });""")
rep("""  if(!changed) return;
  saveData();
  out.forEach(o=>{ CodisEvents.emit(o.ev, o.p); if(o.entryId) CodisOutcomeUI.enqueue(o.entryId, 600); });""",
"""  if(!changed) return;
  saveData();
  out.forEach(o=>{ CodisEvents.emit(o.ev, o.p); if(o.entryId) CodisOutcomeUI.enqueue(o.entryId, 600); });
  try{ CodisProgress.soon(1200); }catch(x){}   /* CODIS-V62: محطة 30 يوماً بلا وقوع ⇒ فحص «شهر كامل بدون وقوع» */""")
rep("    if(scope === 'weekly' && kind === 'reward'){ try{ CodisProgress.soon(1500); }catch(x){} }",
    "    if((scope === 'weekly' && kind === 'reward') || (scope === 'monthly' && kind !== 'punish')){ try{ CodisProgress.soon(1500); }catch(x){} }   /* CODIS-V62: + نتيجة شهرية ناجحة */")

# واجهة مكافآت التقدم: نصوص المكافآت العينية + الحالة بالنص المطلوب
rep("""  if(rw.type === 'coins') return econFmt(rw.n) + ' كوين';
  return '';""", """  if(rw.type === 'coins') return econFmt(rw.n) + ' كوين';
  if(rw.type === 'boxes' || rw.type === 'packs'){ const t = CodisBoxes.tier(rw.tier); return econFmt(rw.n || 1) + ' × ' + (t ? t.name : 'صندوق'); }   /* CODIS-V62 */
  if(rw.type === 'vouchers'){ const d = CodisVouchers.def(rw.tier); return econFmt(rw.n) + ' × ' + (d ? d.name : 'قسيمة'); }
  return '';""")
rep("""showToast('استلمت مكافأة «' + r.def.name + '»: +' + r.rewards.map(codisProgressRewardTxt).filter(Boolean).join(' + '), 'var(--success)', 'trophy');""",
    """showToast('استلمت مكافأة «' + r.def.name + '»: +' + r.rewards.map(codisProgressRewardTxt).filter(Boolean).join(' + ') + (r.rewards.some(x=>x.type === 'boxes' || x.type === 'packs') ? ' — مغلقة في «بحوزتك» ← الصناديق' : ''), 'var(--success)', 'trophy');""")
rep("""'<span class="pg-st">قيد التقدّم</span>'""", """'<span class="pg-st">قيد التقدم</span>'""")

# ===================== 4) «بحوزتك»: الصناديق المغلقة تُعدّ (قسم مستقل) =====================
rep("total:cards + elements + cosmetics + themes };", "total:cards + elements + cosmetics + themes + boxes };   /* CODIS-V62: الصناديق المغلقة قسم مستقل بـ«بحوزتك» */")
rep("const opener = econOwnOpen ? (document.querySelector('#own-panel-boxes .bx-own-tile .store-open') || document.getElementById('own-tab-boxes'))",
    "const opener = econOwnOpen ? (document.querySelector('#own-panel-boxes .own-bx-use') || document.getElementById('own-tab-boxes'))")

# ===================== 5) قسم البكجات: صف «لديك + فتح» + تحديد البطاقة القادمة من «استخدام» =====================
rep("""      return '<div class="bx-card' + (ok ? '' : ' is-short') + '" role="listitem" data-tier="' + t.id + '\"""",
    """      return '<div class="bx-card' + (ok ? '' : ' is-short') + (window.codisBoxPick === t.id ? ' is-picked' : '') + '" role="listitem" data-tier="' + t.id + '\"""")
rep("""        '<div class="bx-buys" role="group" aria-label="' + escapeHtml(t.name + ' — خيارات الشراء') + '">' +""",
    """        econBoxMineHtml(t) +   /* CODIS-V62 */
        '<div class="bx-buys" role="group" aria-label="' + escapeHtml(t.name + ' — خيارات الشراء') + '">' +""")

# ===================== 6) «شراء 1»: صندوق مطابق مملوك ⇒ نافذة الخيارين أولاً (×10 بلا تغيير) =====================
rep("""async function econBuyBox(tierId){
  if(econStoreBusy) return; econStoreBusy = true;""",
"""async function econBuyBox(tierId, viaCoin){
  if(econStoreBusy) return;
  if(!viaCoin && econBoxChoiceNeeded(tierId) && econBoxChoiceOpen(tierId)) return;   /* CODIS-V62: «الشراء بالعملة» يعود هنا بـviaCoin=true */
  econStoreBusy = true;""")
rep("  econPackPaint(); codisSfx('open', { ctx:'box' });",
    "  { const sh = m.querySelector('.pk-modal'); if(sh) sh.classList.remove('is-choice'); }   /* CODIS-V62 */\n  econPackPaint(); codisSfx('open', { ctx:'box' });")

# ===================== 7) نصوص القسائم: الدمج يدوي =====================
rep("صندوق مغلق من مستواها ينضاف لـ«بحوزتك» تلقائياً. الأنواع لا تُجمع مع بعض.",
    "صندوق مغلق من مستواها — الدمج يدوي من «بحوزتك» ← العناصر بزر «دمج 10 قسائم». الأنواع لا تُجمع مع بعض.")
rep("""('اشتريت ' + econFmt(r.n) + ' × ' + d.name + ' (−' + econFmt(r.cost) + ' فضة)')""",
    """('اشتريت ' + econFmt(r.n) + ' × ' + d.name + ' (−' + econFmt(r.cost) + ' فضة)' + (r.have >= CodisVouchers.PER_BOX ? ' — صار عندك ' + econFmt(r.have) + '، تقدر تدمج 10 من «بحوزتك»' : ''))""")
rep("""'صار عندك ' + econFmt(r.voucher.have) + ' / ' + econFmt(CodisVouchers.PER_BOX) + ' للصندوق التالي'""",
    """'صار عندك ' + econFmt(r.voucher.have) + ' ' + escapeHtml(vd.many) + (r.voucher.have >= CodisVouchers.PER_BOX ? ' — تقدر تدمج 10 منها من «بحوزتك»' : ' — الدمج عند ' + econFmt(CodisVouchers.PER_BOX))""")
rep("[['الاستبدال', econFmt(CodisVouchers.PER_BOX) + ' قسائم = '", "[['الدمج اليدوي', econFmt(CodisVouchers.PER_BOX) + ' قسائم = '")

# ===================== 8) الواجهة + CSS =====================
ui = rd('identity', 'v62_ui.js'); assert '</script' not in ui and '<!--' not in ui
rep("/* ---- سجل الكوينز ---- */\nfunction econShowMoreLog(){", "/* ===== CODIS-V62 ===== */\n" + ui + "\n/* ---- سجل الكوينز ---- */\nfunction econShowMoreLog(){")
css = rd('identity', 'v62.css'); assert '</style' not in css
i = s.index('<style id="codis-v61-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v62-css">\n/* CODIS-V62 */\n' + css + '</style>' + s[j:]

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v62 applied')
