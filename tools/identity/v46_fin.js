/* ================= CODIS-V46 — Premium Banking: بطاقة الرصيد · كشف الحساب · مركز التحكم · الأيقونات =================
   عرض فقط (لا منطق مالي): كل الأرقام من codisFin و finStats كما هي. */
let finBalPrev = null, finBalRaf = 0;

/* نقش غيوشيه: وردة من أهليلجات مائلة + خطوط موجية دقيقة — مولّد حتمي بلا عشوائية */
function finGuilloche(){
  let r = '', w = '';
  for(let k = 0; k < 24; k++) r += '<ellipse rx="92" ry="30" transform="rotate(' + (k * 7.5) + ')"/>';
  for(let i = 0; i < 9; i++){ const y = 168 + i * 4.2; w += '<path d="M-10 ' + y.toFixed(1) + ' q 16 -' + (6 + i * .5).toFixed(1) + ' 32 0 t 32 0 t 32 0 t 32 0 t 32 0 t 32 0 t 32 0 t 32 0 t 32 0 t 32 0 t 32 0"/>'; }
  return '<svg class="fin-card-gil" viewBox="0 0 340 214" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g class="gl-a" transform="translate(272 48)">' + r + '<circle r="22"/><circle r="12"/></g><g class="gl-b">' + w + '</g></svg>';
}
function finChipSvg(){
  return '<svg class="fin-chip-ic" viewBox="0 0 44 34" aria-hidden="true" focusable="false"><defs><linearGradient id="fcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e3b4"/><stop offset=".45" stop-color="#cdb072"/><stop offset="1" stop-color="#8e7440"/></linearGradient></defs>' +
    '<rect x=".75" y=".75" width="42.5" height="32.5" rx="7" fill="url(#fcg)" stroke="rgb(60 44 14 / .55)" stroke-width="1"/><g fill="none" stroke="rgb(60 44 14 / .5)" stroke-width="1"><path d="M.8 12h12.4c3 0 4.2 2.2 4.2 5s-1.2 5-4.2 5H.8M43.2 12H30.8c-3 0-4.2 2.2-4.2 5s1.2 5 4.2 5h12.4M17.4 .8v8.6M26.6 .8v8.6M17.4 24.6v8.6M26.6 24.6v8.6M17.4 9.4h9.2M17.4 24.6h9.2"/></g></svg>';
}
function finMarkSvg(){   /* علامة CODIS الهندسية: معيّن داخل دائرة مع نقطة */
  return '<svg class="fin-mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><circle cx="14" cy="14" r="12.2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M14 5.2l8.8 8.8-8.8 8.8-8.8-8.8Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="14" cy="14" r="2.3" fill="currentColor"/></svg>';
}
/* اسم صاحب البطاقة = الاسم المسجَّل بشاشة «معلوماتك» (data.profile.name)، وإلا اسم حساب الدخول؛ الضيف بلا اسم لا يظهر عنده السطر */
function finHolderName(){
  try{ const p = data && data.profile, n = String((p && p.name) || (CodisAccount.state && CodisAccount.state.user && CodisAccount.state.user.name) || '').trim(); return n.slice(0, 40); }catch(e){ return ''; }
}
function finCardHtml(f){
  const bal = codisFinBalance(f), fx = codisFinFxStatus(), hn = finHolderName();
  return '<div class="fin-card" id="fin-card" role="group" aria-label="بطاقة الرصيد المالي">' + finGuilloche() + '<i class="fin-card-sheen" aria-hidden="true"></i>' +
    '<div class="fin-card-top"><div class="fin-card-id">' + finChipSvg() + codisIcon('contactless', { size:'lg', cls:'fin-nfc' }) + '</div>' +
      '<div class="fin-card-brand">' + finMarkSvg() + '<span><b>CODIS</b><small>FINANCIAL CLUB</small></span></div></div>' +
    '<div class="fin-card-mid"><div class="fin-card-lab">رصيدك الحالي</div><div class="fin-card-bal" dir="ltr"><span class="fin-cur">IQD</span><b id="fin-bal">' + finFmt(bal) + '</b></div></div>' +
    (hn ? '<div class="fin-card-holder"><small>CARDHOLDER</small><b>' + escapeHtml(hn) + '</b></div>' : '') + '<div class="fin-card-foot"><span class="fin-emb">الدينار العراقي · IQD</span><span class="fin-emb">1 كوين = <b dir="ltr">' + finFmt(fx.rate || 0) + '</b> د.ع</span></div></div>';
}
function finMainHtml(f){
  const run = codisFinRunning(f).reverse();
  return '<div class="fin-bar"><button type="button" class="fin-menu" id="fin-menu" aria-label="قائمة الإدارة المالية" aria-haspopup="dialog" aria-expanded="false" aria-controls="fin-drawer" onclick="finDrawerOpen()">' + codisIcon('menu', { size:'md' }) + '</button>' +
      '<span class="fin-bar-t"><i aria-hidden="true"></i>دفتر الحسابات</span></div>' + finCardHtml(f) +
    '<div class="fin-actions"><button type="button" class="fin-btn-main is-in" onclick="finDepositOpen()"><span class="fin-act-ic" aria-hidden="true">' + codisIcon('deposit', { size:'lg' }) + '</span><span class="fin-act-t"><b>إيداع</b><small>Deposit</small></span></button>' +
      '<button type="button" class="fin-btn-main is-out" onclick="finExpenseOpen()"><span class="fin-act-ic" aria-hidden="true">' + codisIcon('withdraw', { size:'lg' }) + '</span><span class="fin-act-t"><b>مصروف / سحب</b><small>Withdraw</small></span></button></div>' +
    '<section class="fin-sec fin-stmt"><header class="fin-sec-h"><h3>أحدث الحركات</h3>' + (run.length > 8 ? '<button type="button" class="fin-link" onclick="finAllTx()">كل الحركات (' + finFmt(run.length) + ')</button>' : '') + '</header>' +
      (run.length ? '<ul class="fin-txs">' + run.slice(0, 8).map(finTxRowHtml).join('') + '</ul>' : '<div class="fin-empty">ماكو حركات بعد</div>') + '</section>';
}
/* تحديث الرصيد بعدّ رقمي هادئ (بلا اهتزاز) — يحترم تقليل الحركة */
function finBalAnim(){
  const el = document.getElementById('fin-bal'); if(!el) return;
  let to = 0; try{ to = codisFinBalance(codisFin()); }catch(e){ return; }
  const from = finBalPrev; finBalPrev = to; cancelAnimationFrame(finBalRaf);
  if(from === null || from === to || !isFinite(from) || window.CODIS_REDUCED_MOTION) return;
  const card = document.getElementById('fin-card'); if(card){ card.classList.remove('is-upd'); void card.offsetWidth; card.classList.add('is-upd'); }
  const t0 = performance.now(), D = 700;
  const step = now=>{ const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = finFmt(k < 1 ? Math.round(from + (to - from) * e) : to); if(k < 1) finBalRaf = requestAnimationFrame(step); };
  finBalRaf = requestAnimationFrame(step);
}

/* ---------- كشف الحساب ---------- */
const FIN_TX_KIND = { OPENING_BALANCE:['open', 'wallet'], DEPOSIT:['dep', 'deposit'], SALARY:['sal', 'salary'], EXPENSE:['exp', 'withdraw'], REWARD_REDEMPTION:['rwd', 'gift'] };
function finTimeAr(e){
  try{ if(!e.at || /T00:00:00\.000Z$/.test(e.at)) return ''; const d = new Date(e.at); if(isNaN(d.getTime())) return ''; return d.toLocaleTimeString('ar', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Baghdad' }); }catch(x){ return ''; }
}
function finTxRowHtml(r){
  const e = r.e, up = e.amount > 0, k = FIN_TX_KIND[e.type] || ['oth', 'coin'], tm = finTimeAr(e);
  const src = e.type === 'EXPENSE' ? finCatName(e.cat) : (e.src && e.type === 'DEPOSIT' ? e.src : '');
  return '<li class="fin-tx ' + (up ? 'is-up' : 'is-down') + ' k-' + k[0] + '"><span class="fin-tx-ic" aria-hidden="true">' + codisIcon(k[1], { size:'md' }) + '</span><div class="fin-tx-m"><b>' + escapeHtml(e.desc || codisFinTypeLabel(e.type)) + '</b>' +
    '<small><em class="fin-tx-k">' + escapeHtml(codisFinTypeLabel(e.type)) + '</em>' + (src ? '<span>' + escapeHtml(src) + '</span>' : '') + '<span>' + escapeHtml(finDateAr(e.date)) + (tm ? ' · ' + escapeHtml(tm) : '') + '</span></small></div>' +
    '<div class="fin-tx-a"><b dir="ltr" class="' + (up ? 'fin-up' : 'fin-down') + '"><span class="sr-only">' + (up ? 'دخل ' : 'مصروف ') + '</span>' + (up ? '+' : '−') + finFmt(Math.abs(e.amount)) + '</b><small dir="ltr">' + finFmt(r.bal) + '</small></div></li>';
}

/* ---------- الصفوف والقائمة (مركز التحكم المالي) ---------- */
function finRowHtml(ic, t, s, fn){ return '<button type="button" class="fin-row" onclick="' + fn + '"><span class="fin-row-ic">' + codisIcon(ic) + '</span><span class="fin-row-t"><b>' + t + '</b><small>' + escapeHtml(s) + '</small></span><svg class="ios-chevron fin-row-ch" data-icon="back" aria-hidden="true"></svg></button>'; }
function finDrawerBodyHtml(){
  const f = codisFin(), per = finRange(finPeriod), st = finStats(f, per[0], per[1]), ns = codisFinNextSalary(f), fx = codisFinFxStatus(), bal = codisFinBalance(f);
  const seg = '<div class="fin-seg" role="tablist" aria-label="الفترة">' + [['day', 'اليوم'], ['week', 'الأسبوع'], ['month', 'الشهر'], ['all', 'الكل']].map(p=>'<button type="button" role="tab" class="' + (finPeriod === p[0] ? 'is-on' : '') + '" aria-selected="' + (finPeriod === p[0]) + '" onclick="finSetPeriod(\'' + p[0] + '\')">' + p[1] + '</button>').join('') + '</div>';
  const acct = '<div class="fin-dr-acct"><span class="fin-dr-acct-l">الرصيد الحالي</span><span class="fin-dr-acct-v" dir="ltr"><i>IQD</i><b>' + finFmt(bal) + '</b></span><span class="fin-dr-acct-r">1 كوين = <b dir="ltr">' + finFmt(fx.rate || 0) + '</b> د.ع</span></div>';
  const tiles = '<div class="fin-flow"><div class="fin-flow-i is-in"><span class="fin-flow-ic" aria-hidden="true">' + codisIcon('income') + '</span><small>إجمالي الدخل</small>' + finIqd(st.income) + '</div>' +
    '<div class="fin-flow-i is-out"><span class="fin-flow-ic" aria-hidden="true">' + codisIcon('expense') + '</span><small>إجمالي المصروفات</small>' + finIqd(st.expense) + '</div></div>' +
    '<div class="fin-net ' + (st.net >= 0 ? 'is-pos' : 'is-neg') + '"><span>صافي الحركة</span><b dir="ltr">' + (st.net > 0 ? '+' : st.net < 0 ? '−' : '') + finFmt(Math.abs(st.net)) + ' <i>د.ع</i></b></div>';
  const detail = '<div class="fin-kv"><div><span>رواتب</span><b dir="ltr">' + finFmt(st.salary) + '</b></div><div><span>إيداعات</span><b dir="ltr">' + finFmt(st.deposit) + '</b></div><div><span>استبدال مكافآت مالية</span><b dir="ltr">' + finFmt(st.reward) + '</b></div><div><span>عدد الحركات</span><b dir="ltr">' + finFmt(st.n) + '</b></div></div>';
  const rows = '<nav class="fin-rows" aria-label="الأدوات والإعدادات المالية">' +
    finRowHtml('exchange', 'سعر صرف الكوينز', '1 كوين = ' + finFmt(fx.rate || 0) + ' د.ع' + (fx.canChange ? '' : ' · تغيّر هذا الشهر'), 'finDrawerGo(finRateOpen)') +
    finRowHtml('salary', 'إدارة الراتب', f.work === 'employee' ? (f.salary.rules.length ? finFmt(f.salary.rules[f.salary.rules.length - 1].amount) + ' د.ع شهرياً' : 'غير مضبوط') : 'عمل حر — أدخل أرباحك بالإيداع', 'finDrawerGo(finSalaryOpen)') +
    finRowHtml('profile', 'ملفي المالي', (f.work === 'employee' ? 'موظف' : 'عمل حر') + (f.source ? ' · ' + f.source : ''), 'finDrawerGo(finProfileOpen)') +
    finRowHtml('statement', 'التقارير المالية', 'دخل · مصروفات · تصنيفات · رصيد', 'finDrawerGo(finReportsOpen)') + '</nav>';
  return acct + '<section class="fin-dr-g" aria-labelledby="fin-dr-h1"><h3 class="fin-dr-h" id="fin-dr-h1">الملخص والتحليلات</h3>' + seg + tiles + detail +
      (ns ? '<div class="fin-note">' + codisIcon('salary') + '<span>الراتب القادم <b>' + finFmt(ns.amount) + '</b> د.ع — ' + escapeHtml(finDateAr(ns.due)) + '</span></div>' : '') + '</section>' +
    '<section class="fin-dr-g" aria-labelledby="fin-dr-h2"><h3 class="fin-dr-h" id="fin-dr-h2">الأدوات والإعدادات</h3>' + rows + '</section>';
}

/* ---------- النوافذ الداخلية ---------- */
function finRateHeroHtml(rate, st){
  return '<div class="fin-conv" id="fin-conv"><div class="fin-conv-side"><small>الكوين</small><b dir="ltr">1</b><span>CODIS</span></div><span class="fin-conv-sw" aria-hidden="true">' + codisIcon('exchange', { size:'lg' }) + '</span>' +
    '<div class="fin-conv-side is-iqd"><small>الدينار العراقي</small><b dir="ltr" id="fin-conv-v">' + finFmt(rate) + '</b><span>IQD</span></div></div>' +
    '<div class="fin-conv-st ' + (st.canChange ? 'is-ok' : 'is-lock') + '">' + (st.canChange ? 'التعديل متاح هذا الشهر — مرة واحدة فقط' : 'التعديل القادم متاح من <b>' + escapeHtml(finDateAr(st.nextAllowed)) + '</b>') + '</div>';
}
function finRateHeroSet(root, rate){ const v = root.querySelector('#fin-conv-v'); if(v) v.textContent = finFmt(rate); }
function finPayCardHtml(cur, ns){
  return '<div class="fin-pay"><div class="fin-pay-top"><span class="fin-pay-ic" aria-hidden="true">' + codisIcon('salary', { size:'lg' }) + '</span><small>الراتب الحالي</small></div>' +
    (cur ? '<div class="fin-pay-v" dir="ltr"><b>' + finFmt(cur.amount) + '</b><i>د.ع</i></div><div class="fin-pay-meta"><span>ينزل يوم <b>' + cur.day + '</b> من كل شهر</span>' + (ns ? '<span>الاستحقاق القادم <b>' + escapeHtml(finDateAr(ns.due)) + '</b></span>' : '') + '</div>' : '<div class="fin-pay-v"><b>لا يوجد راتب مضبوط</b></div>') + '</div>';
}
function finProfileCardHtml(f){
  return '<div class="fin-id"><span class="fin-id-ic" aria-hidden="true">' + codisIcon('profile', { size:'lg' }) + '</span><div class="fin-id-t"><small>الملف المالي الشخصي</small><b>' + (f.work === 'employee' ? 'موظف' : 'عمل حر') + '</b><span>' +
    (f.work === 'employee' ? (f.salary.rules.length ? 'راتب شهري ' + finFmt(f.salary.rules[f.salary.rules.length - 1].amount) + ' د.ع' : 'راتب غير مضبوط') : (f.source ? escapeHtml(f.source) : 'مصدر الدخل غير محدد')) + '</span></div>' +
    '<div class="fin-id-r"><small>الرصيد</small><b dir="ltr">' + finFmt(codisFinBalance(f)) + '</b></div></div>';
}
function finReportHeroHtml(f){
  const m = finRange('month'), s = finStats(f, m[0], m[1]);
  return '<div class="fin-rhero ' + (s.net >= 0 ? 'is-pos' : 'is-neg') + '"><small>صافي هذا الشهر</small><b dir="ltr">' + (s.net > 0 ? '+' : s.net < 0 ? '−' : '') + finFmt(Math.abs(s.net)) + ' <i>د.ع</i></b>' +
    '<div class="fin-rhero-r"><span class="is-in">' + codisIcon('income') + '<em dir="ltr">' + finFmt(s.income) + '</em></span><span class="is-out">' + codisIcon('expense') + '<em dir="ltr">' + finFmt(s.expense) + '</em></span></div></div>';
}
function finWizHeadHtml(){
  return '<div class="fin-wiz-head">' + finMarkSvg() + '<div><b>CODIS Financial Club</b><small>افتح محفظتك المالية الخاصة</small></div></div>';
}
