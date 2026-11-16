/* ================= CODIS-V61 (3.48.0) · النواة: قسائم الصناديق + مكافآت التقدم =================
   كل ما قبل `const CodisVouchers` function declarations آمنة وقت التحميل: لا تقرأ const/let معرّفاً بعدها ولا ترمي مهما كانت القيمة المخزّنة.

   • القسائم (data.vouchers = { v:1, events:[…] }) — دفتر أحداث إلحاق فقط بمعرّفات ثابتة (يُدمج بين الأجهزة باتحاد المعرّفات كدفتر سلفني):
       buy    'vb|<معرّف معاملة الفضة>'        n = الكمية (موجب)، day = يوم الشراء المحلي (CodisClock) ⇒ الحد اليومي يُشتق من الدفتر نفسه
       box    'vx|<معرّف الصندوق المفتوح>'      n = 1 (قسيمة طلعت من صندوق؛ لا تدخل الحد اليومي)
       reward 'vp|<معرّف الإنجاز>|<رقم>'        n = الكمية (مكافأة تقدم مستقبلية)
       redeem 'vr|<المستوى>|<k>'                n = −10، k = رقم الاستبدال التراكمي لهذا المستوى ⇒ جهازان استبدلا الدفعة نفسها ينتجان المعرّف نفسه (صندوق واحد)
     الرصيد = مجموع n لكل مستوى (لا قيمة مخزّنة). كل 10 من المستوى نفسه ⇒ صندوق مغلق عادي بالمخزون uid 'box|vr|<المستوى>|<k>' داخل المعاملة نفسها.
   • مكافآت التقدم (data.progress = { v:1, unlocked:[{ id, at }], claims:[{ id, at }] }): فتح (جاهزة) ثم استلام يدوي لكل إنجاز بمعرّف ثابت. المنح (عند الضغط فقط) داخل CodisWallet.transact
     بمرجع 'progress|<id>' في دفتر العملة (لا تكرار ولا عند الدمج). التعريفات بسجل CODIS_PROGRESS (إنجاز جديد = تعريف واحد بلا تعديل المحرّك). */

function codisVoucherDefs(){
  return codisVoucherDefs.c || (codisVoucherDefs.c = Object.freeze([
    Object.freeze({ tier:'bx1', id:'voucher|bx1', name:'قسيمة برونزية',  many:'القسائم البرونزية',  short:'برونزية',  silver:7,  tone:'c' }),
    Object.freeze({ tier:'bx2', id:'voucher|bx2', name:'قسيمة فضية',     many:'القسائم الفضية',     short:'فضية',     silver:14, tone:'b' }),
    Object.freeze({ tier:'bx3', id:'voucher|bx3', name:'قسيمة كريستالية', many:'القسائم الكريستالية', short:'كريستالية', silver:21, tone:'a' }),
    Object.freeze({ tier:'bx4', id:'voucher|bx4', name:'قسيمة ذهبية',    many:'القسائم الذهبية',    short:'ذهبية',    silver:37, tone:'s' }),
    Object.freeze({ tier:'bx5', id:'voucher|bx5', name:'قسيمة خرافية',   many:'القسائم الخرافية',   short:'خرافية',   silver:54, tone:'ss' })
  ]));
}
/* دفتر القسائم المخزّن: أحداث سليمة فقط، بلا تكرار معرّف، المستويات المعروفة فقط. لا يرمي أبداً */
function codisVouchersNorm(v){
  try{
    const T = ['bx1', 'bx2', 'bx3', 'bx4', 'bx5'], K = ['buy', 'box', 'reward', 'redeem', 'admin'], seen = {}, out = [];
    const src = (v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v.events)) ? v.events : [];
    for(let i = 0; i < src.length && out.length < 6000; i++){
      const e = src[i]; if(!e || typeof e !== 'object' || typeof e.id !== 'string' || !e.id || e.id.length > 120 || seen[e.id]) continue;
      if(T.indexOf(e.tier) === -1 || K.indexOf(e.t) === -1) continue;
      const n = Math.trunc(Number(e.n)); if(!isFinite(n) || n === 0 || Math.abs(n) > 10000) continue;
      if(e.t === 'redeem' ? n >= 0 : n <= 0) continue;
      const at = (typeof e.at === 'string' && isFinite(Date.parse(e.at))) ? e.at : '';
      const o = { id:e.id, t:e.t, tier:e.tier, n:n, at:at };
      if(typeof e.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.day)) o.day = e.day;
      if(typeof e.ref === 'string' && e.ref.length <= 120) o.ref = e.ref;
      seen[e.id] = true; out.push(o);
    }
    return { v:1, events:out };
  }catch(e){ return { v:1, events:[] }; }
}
/* سجل استلام مكافآت التقدم: معرّف إنجاز صالح مرة واحدة. المعرّفات المجهولة (إنجازات مستقبلية) تُحفظ كما هي */
function codisProgressNorm(p){
  try{
    const src = (p && typeof p === 'object' && !Array.isArray(p) && Array.isArray(p.claims)) ? p.claims : [], seen = {}, out = [];
    src.forEach(c=>{ if(!c || typeof c !== 'object' || typeof c.id !== 'string' || !/^[a-z0-9_.-]{1,60}$/i.test(c.id) || seen[c.id]) return; seen[c.id] = true;
      out.push({ id:c.id, at:(typeof c.at === 'string' && isFinite(Date.parse(c.at))) ? c.at : '' }); });
    const us = (p && typeof p === 'object' && !Array.isArray(p) && Array.isArray(p.unlocked)) ? p.unlocked : [], useen = {}, uo = [];
    us.forEach(c=>{ if(!c || typeof c !== 'object' || typeof c.id !== 'string' || !/^[a-z0-9_.-]{1,60}$/i.test(c.id) || useen[c.id]) return; useen[c.id] = true;
      uo.push({ id:c.id, at:(typeof c.at === 'string' && isFinite(Date.parse(c.at))) ? c.at : '' }); });
    return { v:1, claims:out.slice(0, 2000), unlocked:uo.slice(0, 2000) };   /* unlocked = «جاهزة للاستلام» (فُتحت ولم تُستلم بعد، أو استُلمت) */
  }catch(e){ return { v:1, claims:[], unlocked:[] }; }
}
/* عدد صحيح عشوائي متساوي الاحتمال بين min وmax (شاملين) — crypto بلا انحياز (رفض الباقي)، وإلا Math.random */
function codisRandInt(min, max){
  min = Math.ceil(min); max = Math.floor(max); const span = max - min + 1; if(!(span >= 1)) return min;
  try{
    if(window.crypto && crypto.getRandomValues){
      const lim = Math.floor(4294967296 / span) * span, a = new Uint32Array(1);
      for(let i = 0; i < 64; i++){ crypto.getRandomValues(a); if(a[0] < lim) return min + (a[0] % span); }
    }
  }catch(e){}
  return min + Math.floor(Math.random() * span);
}

const CodisVouchers = (function(){
  const PER_BOX = 10, DAILY_N = 20;
  try{
    CodisLimits.reg('voucher.daily', 'الحد اليومي لشراء القسائم (20 قسيمة يومياً لكل الأنواع)', DAILY_N);
    codisVoucherDefs().forEach(d=>CodisLimits.reg('voucher.price.' + d.tier, 'سعر ' + d.name + ' بالفضة', d.silver));
  }catch(e){}
  function defs(){ return codisVoucherDefs().slice(); }
  function def(tier){ return codisVoucherDefs().find(d=>d.tier === tier || d.id === tier) || null; }
  function L(){ if(!data.vouchers || typeof data.vouchers !== 'object' || !Array.isArray(data.vouchers.events)) data.vouchers = { v:1, events:[] }; return data.vouchers.events; }
  function price(tier){ const d = def(tier); return d ? Math.max(1, Math.round(CodisLimits.num('voucher.price.' + d.tier, d.silver))) : 0; }
  /* القيمة المرجعية بالكوين داخل نموذج احتمالات الصناديق = السعر الأصلي بالفضة × 0.5 (نفس معامل الأكياس والمظاهر). ثابتة لا تتأثر بتعديل المطوّر للسعر */
  function value(tier){ const d = def(tier); return d ? d.silver * 0.5 : 0; }
  function count(tier){ let n = 0; L().forEach(e=>{ if(e.tier === tier) n += e.n; }); return Math.max(0, n); }
  function counts(){ const o = {}; codisVoucherDefs().forEach(d=>{ o[d.tier] = 0; }); L().forEach(e=>{ if(e.tier in o) o[e.tier] += e.n; }); Object.keys(o).forEach(k=>{ o[k] = Math.max(0, o[k]); }); return o; }
  function total(){ const c = counts(); return Object.keys(c).reduce((s, k)=>s + c[k], 0); }
  function today(){ return localDateStr(CodisClock.date()); }
  function boughtToday(){ const d = today(); let n = 0; L().forEach(e=>{ if(e.t === 'buy' && e.day === d) n += e.n; }); return n; }
  function dailyCap(){ return Math.max(0, Math.round(CodisLimits.num('voucher.daily', DAILY_N))); }
  function dailyLeft(){ return Math.max(0, dailyCap() - boughtToday()); }
  function redeemed(tier){ return L().filter(e=>e.t === 'redeem' && e.tier === tier).length; }
  /* جوائز الصناديق: قسيمة المستوى نفسه فقط (لا قسائم مستويات أخرى) */
  function prizes(tierId){ const d = def(tierId); return d ? [{ id:d.id, kind:'voucher', tier:d.tier, name:d.name, enabled:true }] : []; }
  /* داخل CodisWallet.transact فقط: كل 10 من المستوى ⇒ حدث استبدال (−10) + صندوق مغلق عادي. المعرّف من رقم الاستبدال التراكمي فلا يتكرر */
  function settleInTx(tier){
    const made = []; let guard = 0;
    while(count(tier) >= PER_BOX && guard++ < 1000){
      const k = redeemed(tier) + 1, id = 'vr|' + tier + '|' + k, uid = 'box|' + id;
      if(L().some(e=>e.id === id)) return null;   /* مستحيل منطقياً: حماية من حلقة */
      L().push({ id:id, t:'redeem', tier:tier, n:-PER_BOX, at:econNowIso() });
      if(!(CodisBoxes.get(uid))){
        if(!data.inventory.boxes) data.inventory.boxes = [];
        data.inventory.boxes.push({ uid:uid, tier:tier, paid:0, currency:'VOUCHER', acquiredAt:econNowIso(), status:'unopened', sourceRef:id });
        made.push(uid);
      }
    }
    return made;
  }
  /* منح داخل معاملة قائمة (صندوق/مكافأة تقدم): الحدث بمعرّف ثابت؛ موجود مسبقاً ⇒ فشل (لا منح مرتين) */
  function grantInTx(o){
    const d = def(o && o.tier), n = Math.trunc(Number(o && o.n)); if(!d || !(n >= 1) || !o.id) return null;
    if(L().some(e=>e.id === o.id)) return null;
    const ev = { id:String(o.id).slice(0, 120), t:o.t === 'reward' ? 'reward' : o.t === 'admin' ? 'admin' : 'box', tier:d.tier, n:n, at:econNowIso() };
    if(o.ref) ev.ref = String(o.ref).slice(0, 120);
    L().push(ev);
    const boxes = settleInTx(d.tier); if(!boxes) return null;
    return { def:d, n:n, have:count(d.tier), boxes:boxes, ev:ev };
  }
  let busy = false;
  /* شراء qty قسيمة من مستوى واحد بالفضة: خصم + أحداث + استبدال تلقائي بمعاملة واحدة. الحد اليومي (20 لكل الأنواع) عبر CodisLimits */
  function buy(tier, qty){
    if(busy) return { ok:false, reason:'busy' };
    const d = def(tier); qty = Math.trunc(Number(qty)); if(!d || !(qty >= 1) || qty > 100) return { ok:false, reason:'invalid' };
    const left = dailyLeft();
    if(qty > left && !CodisLimits.bypass('voucher.daily')) return { ok:false, reason:'daily', left:left };
    const cost = price(d.tier) * qty, bal = CodisWallet.silverBalance();
    if(!CodisLimits.afford(bal, cost)) return { ok:false, reason:'insufficient', need:cost - bal, price:cost };
    busy = true;
    try{
      return CodisWallet.transact([], ()=>{
        if(qty > dailyLeft() && !CodisLimits.bypass('voucher.daily')) return { ok:false, reason:'daily', left:dailyLeft() };
        const before = count(d.tier);
        const tx = CodisWallet.applySilver('PURCHASE_VOUCHER', -cost, 'شراء ' + econFmt(qty) + ' × ' + d.name, 'store', 'voucher|' + d.tier + '|' + econUid('v'), { tier:d.tier, n:qty, unit:price(d.tier) });
        if(!tx) return { ok:false, reason:'tx' };
        L().push({ id:'vb|' + tx.id, t:'buy', tier:d.tier, n:qty, at:tx.createdAt, day:today() });
        const boxes = settleInTx(d.tier); if(!boxes) return { ok:false, reason:'inventory' };
        return { ok:true, def:d, n:qty, cost:cost, tx:tx, before:before, have:count(d.tier), boxes:boxes, left:dailyLeft() };
      });
    } finally { busy = false; }
  }
  return Object.freeze({ PER_BOX:PER_BOX, defs, def, price, value, count, counts, total, boughtToday, dailyCap, dailyLeft, prizes, grantInTx, settleInTx, buy, redeemed });
})();

/* ================= مكافآت التقدم =================
   تعريف الإنجاز: { id ثابت, name, desc, goal, metric (مفتاح بـCODIS_PROGRESS_METRICS), rewards:[{ type:'gems'|'silver'|'coins'|'vouchers'|'boxes'|'packs', n, tier? }], order }.
   المقياس دالة تقرأ البيانات الحقيقية فقط. إنجاز جديد = سطر هنا؛ مكافأة من نوع جديد = منفّذ واحد بـCODIS_PROGRESS_GRANT. */
const CODIS_PROGRESS = Object.freeze([
  Object.freeze({ id:'first_week', order:10, name:'أول أسبوع ناجح', desc:'أنهِ أول أسبوع ينجح بتقييم CODIS الأسبوعي (نتيجة الأسبوع = مكافأة).', goal:1, metric:'weeklySuccess', icon:'calendar', rewards:Object.freeze([{ type:'gems', n:5 }]) }),
  Object.freeze({ id:'ops_tasks_25', order:20, name:'إكمال 25 مهمة', desc:'أكمل 25 مهمة بالكامل («خلصتها») من غرفة العمليات — المهام المنجزة جزئياً لا تُحتسب.', goal:25, metric:'opsDone', icon:'clipboard-check', rewards:Object.freeze([{ type:'gems', n:10 }]) }),
  Object.freeze({ id:'learn_items_25', order:30, name:'إكمال 25 عنصر تعلّم', desc:'أكمل 25 عنصراً تعليمياً بالكامل من غرفة الأستاذ — العناصر المنجزة جزئياً لا تُحتسب.', goal:25, metric:'learnDone', icon:'book', rewards:Object.freeze([{ type:'gems', n:10 }]) })
]);
/* المهام المكتملة بالكامل (status 'done') في غرفة واحدة عبر كل الخطط: الأسابيع الجارية + الأرشيف. نفس قاعدة CodisEconomy (doneTasks): أيام العطلة خارج الحساب،
   والمعرّف نفسه لا يُحتسب مرتين (مهمة ظهرت بنسختين). العمليات = tasksWeek/data.weeks، الأستاذ = learnWeek/data.learnWeeks (لا خلط بينهما) */
function codisProgressDoneCount(room){
  const seen = {}; let n = 0;
  const add = w=>{
    if(!w || typeof w !== 'object' || !w.days || typeof w.days !== 'object') return;
    const ex = holidayExtras(w);
    for(let d = 0; d < 7; d++){
      if(d === w.holidayDay || ex.indexOf(d) !== -1) continue;
      const L = w.days[d]; if(!Array.isArray(L)) continue;
      L.forEach(t=>{ if(!t || t.status !== 'done') return; if(t.id){ const k = String(t.id); if(seen[k]) return; seen[k] = true; } n++; });
    }
  };
  const live = room === 'learn' ? data.learnWeeks : data.weeks;
  if(live && typeof live === 'object') Object.keys(live).forEach(k=>add(live[k]));
  (Array.isArray(data.archive) ? data.archive : []).forEach(a=>{ if(a && typeof a === 'object') add(room === 'learn' ? a.learnWeek : a.tasksWeek); });
  return n;
}
/* أسابيع ناجحة = نتائج أسبوعية نوعها «مكافأة» بسجل النتائج (نفس قرار weeklyFromArchive: النسبة الموزونة + حدود الإنجاز + منع الدفع المكرر/الحصاد). الملغاة لا تُحتسب */
function codisProgressWeeklyWins(){
  const L = data.outcomeLedger || {}; let n = 0;
  Object.keys(L).forEach(k=>{ const e = L[k]; if(e && e.scope === 'weekly' && e.kind === 'reward' && e.status !== 'void') n++; });
  return n;
}
const CODIS_PROGRESS_METRICS = Object.freeze({ weeklySuccess:codisProgressWeeklyWins, opsDone:()=>codisProgressDoneCount('tasks'), learnDone:()=>codisProgressDoneCount('learn') });
/* منفّذو المكافآت (داخل CodisWallet.transact فقط؛ المرجع ثابت لكل إنجاز ⇒ لا منح مرتين). null = فشل ⇒ المعاملة كلها ترجع */
const CODIS_PROGRESS_GRANT = Object.freeze({
  gems:(r, a, ref)=>CodisWallet.applyGems('PROGRESS_REWARD', r.n, 'مكافأة تقدم: ' + a.name, 'progress', ref, { ach:a.id }),
  silver:(r, a, ref)=>CodisWallet.applySilver('PROGRESS_REWARD', r.n, 'مكافأة تقدم: ' + a.name, 'progress', ref, { ach:a.id }),
  coins:(r, a, ref)=>CodisWallet.apply('PROGRESS_REWARD', r.n, 'مكافأة تقدم: ' + a.name, 'progress', ref, { ach:a.id }),
  vouchers:(r, a, ref, i)=>CodisVouchers.grantInTx({ id:'vp|' + a.id + '|' + i, t:'reward', tier:r.tier, n:r.n, ref:ref }),
  boxes:(r, a, ref, i)=>{
    if(!CodisBoxes.tier(r.tier)) return null; const out = [];
    for(let k = 0; k < Math.max(1, r.n | 0); k++){ const uid = 'box|prog|' + a.id + '|' + i + '|' + k; if(CodisBoxes.get(uid)) return null;
      data.inventory.boxes.push({ uid:uid, tier:r.tier, paid:0, currency:'PROGRESS', acquiredAt:econNowIso(), status:'unopened', sourceRef:ref }); out.push(uid); }
    return out;
  },
  packs:(r, a, ref, i)=>CODIS_PROGRESS_GRANT.boxes(r, a, ref, i)   /* البكجات = الصناديق بنظامها نفسه */
});
/* ثلاث مراحل مستقلة (CODIS-V61 · الاستلام اليدوي):
   (1) الشرط: المقياس الحقيقي ≥ الهدف (value) — قراءة فقط.
   (2) الفتح: الإنجاز يصير «جاهزاً للاستلام» ويُحفظ بـdata.progress.unlocked (بلا أي عملة) — بعد الحدث الحقيقي وعند الإقلاع (إنجازات تحققت قبل النظام).
       المفتوح يبقى جاهزاً حتى لو نزل المقياس لاحقاً (حذف أرشيف مثلاً) — لا يضيع حق المستخدم.
   (3) الاستلام: فقط بضغط المستخدم (claim) — المعاملة الذرّية الوحيدة التي تمنح أي عملة/عنصر، مرة واحدة بمرجع ثابت. */
const CodisProgress = (function(){
  let busy = false, soonT = 0;
  function defs(){ return CODIS_PROGRESS.slice().sort((a, b)=>a.order - b.order); }
  function def(id){ return CODIS_PROGRESS.find(a=>a.id === id) || null; }
  function P(){ const p = data.progress; if(!p || typeof p !== 'object' || Array.isArray(p)) data.progress = { v:1, claims:[], unlocked:[] }; if(!Array.isArray(data.progress.claims)) data.progress.claims = []; if(!Array.isArray(data.progress.unlocked)) data.progress.unlocked = []; return data.progress; }
  function ref(id){ return 'progress|' + id; }
  /* مستلَم = بسجل الاستلام، أو بأي دفتر عملة بمرجعه (يحمي من نسخة فقدت السجل) */
  function claimed(id){
    if(P().claims.some(c=>c.id === id)) return true;
    const r = ref(id), w = data.wallet || {}, hit = L=>Array.isArray(L) && L.some(t=>t && t.type === 'PROGRESS_REWARD' && t.referenceId === r);
    return hit(w.transactions) || hit(w.silver && w.silver.transactions) || hit(w.gems && w.gems.transactions);
  }
  function unlocked(id){ return P().unlocked.some(u=>u.id === id); }
  function value(a){ try{ const f = CODIS_PROGRESS_METRICS[a.metric]; const v = f ? Number(f()) : 0; return isFinite(v) && v > 0 ? Math.floor(v) : 0; }catch(e){ return 0; } }
  function met(a){ return value(a) >= a.goal; }
  /* الحالة: progress (قيد التقدم) · ready (جاهزة للاستلام) · claimed (تم الاستلام) */
  function state(a){
    const v = value(a), c = claimed(a.id), u = unlocked(a.id), ready = !c && (u || v >= a.goal), shown = (c || ready) ? a.goal : Math.min(v, a.goal);
    return { def:a, value:v, shown:shown, goal:a.goal, pct:Math.min(1, shown / a.goal), done:c || ready, ready:ready, claimed:c, unlocked:u, status:c ? 'claimed' : ready ? 'ready' : 'progress' };
  }
  function list(){ return defs().map(state); }
  function readyCount(){ return defs().filter(a=>state(a).ready).length; }
  /* (2) الفتح: يسجّل كل إنجاز تحقق شرطه ولم يُفتح/يُستلم — بلا منح. يُحفظ وحده؛ فشل الحفظ ⇒ يُرجع (ويُعاد الفتح بالحدث التالي) */
  function check(o){
    if(busy) return [];
    busy = true; const out = [];
    try{
      if(window.CODIS_SYNC_HOLD || (typeof codisSaveSuspended !== 'undefined' && codisSaveSuspended)) return out;
      const p = P(), at = econNowIso();
      defs().forEach(a=>{ if(claimed(a.id) || unlocked(a.id) || !met(a)) return; p.unlocked.push({ id:a.id, at:at }); out.push(a); });
      if(out.length && !saveData()){ p.unlocked = p.unlocked.filter(u=>out.indexOf(def(u.id)) === -1); out.length = 0; }
    }catch(e){ console.warn('CODIS progress check:', e && e.message); }
    finally{ busy = false; }
    if(out.length && !(o && o.quiet)){ try{ codisProgressAnnounce(out); }catch(e){} }
    return out;
  }
  /* (3) الاستلام — بضغط المستخدم فقط. كل المكافآت + سجل الاستلام بمعاملة واحدة: أي فشل (منح/حفظ) ⇒ لا شيء، وتبقى جاهزة */
  let claiming = false;
  function claim(id){
    const a = def(id); if(!a) return { ok:false, reason:'invalid' };
    if(claiming) return { ok:false, reason:'busy' };
    if(claimed(id)) return { ok:false, reason:'claimed' };
    if(!unlocked(id) && !met(a)) return { ok:false, reason:'notyet' };
    claiming = true;
    try{
      return CodisWallet.transact([], ()=>{
        if(claimed(id)) return { ok:false, reason:'claimed' };
        if(!unlocked(id)){ if(!met(a)) return { ok:false, reason:'notyet' }; P().unlocked.push({ id:id, at:econNowIso() }); }
        const r = ref(id), got = [];
        for(let i = 0; i < a.rewards.length; i++){
          const rw = a.rewards[i], fn = CODIS_PROGRESS_GRANT[rw.type]; if(!fn) return { ok:false, reason:'type' };
          const res = fn(rw, a, r, i); if(!res) return { ok:false, reason:'grant' };
          got.push(rw);
        }
        P().claims.push({ id:id, at:econNowIso() });
        return { ok:true, def:a, rewards:got };
      });
    } finally { claiming = false; }
  }
  function soon(ms){ clearTimeout(soonT); soonT = setTimeout(()=>{ soonT = 0; check(); }, ms === undefined ? 900 : ms); }
  return Object.freeze({ defs, def, list, state, claimed, unlocked, readyCount, claim, check, soon, value });
})();
