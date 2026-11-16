/* ================= CODIS-V61 (3.48.0) · الواجهة =================
   (1) معاينة البكج: كل الجوائز بشبكة واحدة مباشرة، كل بطاقة تنقلب (codisFlipHtml نفسه: نقر/لمس/Enter/Space) لظهر فيه الاسم والنوع ونسبة الحصول عليها.
       النسبة = pm الفئة ÷ 10 ÷ عدد عناصر الفئة — نفس CodisBoxes.effective(t) التي يسحب بها roll() (فئة بالاحتمال ثم عنصر متساوي الحظ داخلها). لا نموذج ثانٍ.
   (2) القسائم: رسم القسيمة · قسم «العناصر» بالمتجر (سجل الأقسام نفسه) · مجموعة «قسائم الصناديق» داخل «العناصر» في «بحوزتك» (سجل econItemRegister نفسه).
   (3) مكافآت التقدم: صفحة بالإعدادات (عرض فقط — فتحها لا يمنح شيئاً) + إشعار الإنجاز. */

/* ---------- (1) معاينة البكج ---------- */
function econPackPctTxt(x){ return (x >= 10 ? x.toFixed(1) : x >= 1 ? x.toFixed(2) : x >= 0.1 ? x.toFixed(2) : x.toFixed(3)).replace(/\.?0+$/, '') + '%'; }
function econPackKindOf(it){ const K = { pass:'بطاقة تخطي عقوبة', holiday:'بطاقة عطلة', pouch:'كيس فضة', cosmetic:'مظهر بطاقة', voucher:'قسيمة صندوق' }; return K[it.kind] || (it.room === 'weekly' ? 'مكافأة أسبوعية' : it.room === 'monthly' ? 'مكافأة شهرية' : 'مكافأة'); }
function econPackNameOf(it){
  try{
    if(it.kind === 'cosmetic'){ const d = CodisCosmetics.def(it.cosmeticId); if(d && d.name) return d.name; }
    if(it.kind === 'pass') return CodisPasses.title(it);
    if(it.kind === 'holiday'){ const d = CodisHolidayCards.def(it.cardKind); if(d && d.name) return d.name; }
    if(it.kind === 'pouch'){ const d = CodisPouches.def(it.pouchType); if(d && d.name) return d.name; }
    if(it.kind === 'voucher'){ const d = CodisVouchers.def(it.tier); if(d) return d.name; }
  }catch(e){}
  return it.name || '—';
}
/* معلومات إضافية حسب النوع (من أنظمتها الحية) */
function econPackExtraRows(it){
  try{
    if(it.kind === 'pass') return [['الفترة', CodisPasses.scopeName(it.scope)], ['الشدة', econSevLabel(econNormSeverity(it.severity, 'MEDIUM'))], ['الاستعمال', 'مرة واحدة']];
    if(it.kind === 'holiday'){ const d = CodisHolidayCards.def(it.cardKind); return d && d.ui && d.ui.shopSub ? [['الاستعمال', d.ui.shopSub]] : []; }
    if(it.kind === 'pouch'){ const d = CodisPouches.def(it.pouchType); if(!d) return []; const r = d.rewards.slice().sort((a, b)=>a - b); return [['الفضة', econFmt(r[0]) + '–' + econFmt(r[r.length - 1])], ['الفتح', 'من «بحوزتك»']]; }
    if(it.kind === 'voucher'){ const t = CodisBoxes.tier(it.tier); return [['الاستبدال', econFmt(CodisVouchers.PER_BOX) + ' قسائم = ' + (t ? t.name : 'صندوق')], ['لديك', econFmt(CodisVouchers.count(it.tier)) + ' / ' + econFmt(CodisVouchers.PER_BOX)]]; }
  }catch(e){}
  return [];
}
function econPackPaint(){
  const m = econPackModal(), body = document.getElementById('econ-pack-body'); if(!m || !body) return;
  const sheet = m.querySelector('.pk-modal'), t = econPackId ? CodisBoxes.tier(econPackId) : null;
  const close = '<div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="econPackClose()">إغلاق</button></div>';
  if(!t){
    if(sheet) sheet.removeAttribute('data-tone');
    body.innerHTML = '<h3 id="econ-pack-title">البكج غير متاح</h3><div class="eco-empty">هذا البكج ما عاد موجود في المتجر</div>' + close; return;
  }
  if(sheet) sheet.setAttribute('data-tone', t.tone);
  /* كل رقم من CodisBoxes.effective(t) نفسها التي يسحب بها roll(): الفئة pm (بالألف) ثم عنصر متساوي الحظ داخلها ⇒ العنصر = pm ÷ 10 ÷ عدد عناصر فئته */
  const rows = CodisBoxes.effective(t), seen = {}, cells = [];
  rows.slice().reverse().forEach(o=>{ o.items.slice().sort((a, b)=>CodisBoxes.valueOf(b) - CodisBoxes.valueOf(a) || String(a.id).localeCompare(String(b.id))).forEach(it=>{
    if(!it || seen[it.id]) return; seen[it.id] = true;   /* لا بطاقة مرتين */
    cells.push({ it:it, o:o, each:o.pm / 10 / o.items.length });
  }); });
  const sumPct = rows.reduce((q, o)=>q + (Number(o.pm) || 0), 0) / 10, topPrize = rows.length ? Math.max.apply(null, rows.map(o=>o.max)) : 0;
  const TONE_RGB = { c:'154,160,170', b:'74,158,184', a:'62,118,228', s:'208,142,52', ss:'255,208,110' }, rgb = tn=>TONE_RGB[tn] || TONE_RGB.c;
  const gem = '<span class="pk-gems" aria-hidden="true">' + [1,2,3,4,5].map(i=>'<i class="' + (i <= t.index ? 'on' : '') + '"></i>').join('') + '</span>';
  const hero = '<header class="pkx-hero"><div class="pkx-art">' + econBoxArt(t.index) + '</div><div class="pkx-id"><h3 id="econ-pack-title">' + escapeHtml(t.name) + '</h3>' +
    '<div class="pkx-tier">' + gem + '<span>المستوى ' + t.index + ' من 5</span></div><div class="pkx-price"><span>سعر الفتح</span>' + econGem(t.gems) + '</div></div></header>' +
    (cells.length ? '<ul class="pkx-facts"><li><b>' + econFmt(cells.length) + '</b><span>جائزة ممكنة</span></li><li><b>' + econFmt(rows.length) + '</b><span>فئات قيمة</span></li><li><b>' + econFmt(topPrize) + '</b><span>أعلى قيمة</span></li></ul>' : '');
  const seg = rows.length ? '<div class="pk-seg pkg-seg" role="img" aria-label="' + escapeHtml(rows.map(o=>o.name + ' ' + econPm(o.pm)).join('، ')) + '">' + rows.map(o=>'<i style="flex:' + o.pm + ';--k:' + rgb(o.tone) + '"></i>').join('') + '</div>' : '';
  const grid = cells.length ? '<section class="pkg" aria-labelledby="pkg-h"><div class="pkg-head"><h4 class="pkx-h" id="pkg-h">كل ما في البكج</h4><span class="pkx-sum">المجموع <b dir="ltr">' + econPackPctTxt(sumPct) + '</b></span></div>' + seg +
    '<p class="pkg-hint">اضغط أي بطاقة لتنقلب وتعرض اسمها ونوعها ونسبة حصولك عليها — واضغطها مرة ثانية لترجع.</p>' +
    '<div class="pkg-grid" role="list">' + cells.map(c=>{
      const it = c.it, o = c.o, nm = econPackNameOf(it), kind = econPackKindOf(it), pct = econPackPctTxt(c.each), v = CodisBoxes.valueOf(it);
      const front = econPackTileHtml(it, econRarityById(it.rarity)).replace(' role="listitem"', '');
      const back = ()=>codisCardBackHtml(nm, [['النوع', kind], ['نسبة الحصول', '<b class="pkg-bp" dir="ltr">' + pct + '</b>', '', true], ['الفئة', o.name], v > 0 ? ['القيمة', econCoin(v), '', true] : null].concat(econPackExtraRows(it)),
        { tone:o.tone, kind:it.kind === 'voucher' ? 'box' : (it.kind || 'reward'), note:'من ' + t.name + ' · كل سحب مستقل' });
      return '<div class="pkg-cell" role="listitem" data-kind="' + escapeHtml(it.kind || 'reward') + '" style="--k:' + rgb(o.tone) + '">' +
        codisFlipHtml(front, back, { cls:'pkg-flip', bk:'pk|' + t.id + '|' + it.id, label:nm + ' — ' + kind + ' — ' + pct }) +
        '<span class="pkg-cap"><span class="pkg-n" dir="auto">' + escapeHtml(nm) + '</span><b class="pkg-p" dir="ltr">' + pct + '</b></span></div>';
    }).join('') + '</div></section>' : '<div class="eco-empty pk-empty">ماكو جوائز مؤهّلة حالياً</div>';
  CodisArt.set(body, ()=>hero + grid + close);
  codisFitRewardCard(body); codisWatchRewardCards(body);
}

/* ---------- (2) القسائم ---------- */
/* رسم القسيمة: تذكرة بحافة مثقّبة + مصغّر صندوق مستواها + شريط النغمة. SVG بلا فلاتر (آمن على WebKit)، عنصر صورة واحد للصندوق (مخزّن blob) */
function econVoucherArt(tier, o){
  o = o || {}; const d = CodisVouchers.def(tier); if(!d) return '';
  const t = CodisBoxes.tier(d.tier), n = t ? t.index : 1;
  return '<span class="vch-art' + (o.big ? ' is-big' : '') + '" data-tone="' + d.tone + '" role="img" aria-label="' + escapeHtml(d.name) + '">' +
    '<svg class="vch-tk" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="vch-bg" d="M10 4h140a6 6 0 0 1 6 6v24a8 8 0 0 0 0 32v24a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V66a8 8 0 0 0 0-32V10a6 6 0 0 1 6-6Z"/>' +
    '<path class="vch-perf" d="M48 10v80"/><path class="vch-gl" d="M56 12h90"/></svg>' +
    '<span class="vch-box">' + econBoxArt(n) + '</span><span class="vch-stub" aria-hidden="true"><b dir="ltr">' + econFmt(CodisVouchers.PER_BOX) + '</b><small>= 1</small></span></span>';
}
/* أداة التقدم نحو الصندوق التالي (عدد الصندوق الكامل يُستبدل تلقائياً، فالباقي دائماً 0–9) */
function econVoucherMeter(tier){
  const n = CodisVouchers.count(tier), per = CodisVouchers.PER_BOX, d = CodisVouchers.def(tier);
  return '<span class="vch-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + per + '" aria-valuenow="' + Math.min(n, per) + '" aria-label="' + escapeHtml(econFmt(n) + ' من ' + per + ' ' + d.many) + '"><i style="width:' + Math.min(100, n / per * 100).toFixed(1) + '%"></i></span>';
}
function econVouchersStoreHtml(){
  const left = CodisVouchers.dailyLeft(), cap = CodisVouchers.dailyCap(), sb = CodisWallet.silverBalance(), busy = econStoreBusy;
  return '<section class="st-part st-items" id="eco-items" aria-labelledby="it-h"><header class="st-part-head"><h4 class="st-part-title" id="it-h">العناصر</h4></header>' +
    '<div class="vch-intro"><b>قسائم الصناديق</b><span>كل ' + econFmt(CodisVouchers.PER_BOX) + ' قسائم من النوع نفسه = صندوق مغلق من مستواها ينضاف لـ«بحوزتك» تلقائياً. الأنواع لا تُجمع مع بعض.</span>' +
    '<span class="vch-left' + (left ? '' : ' is-out') + '" role="status">متبقي لك <b dir="ltr">' + econFmt(left) + '</b> من <b dir="ltr">' + econFmt(cap) + '</b> قسيمة اليوم</span></div>' +
    '<div class="shop-grid vch-grid" role="list">' + CodisVouchers.defs().map((d, i)=>{
      const p = CodisVouchers.price(d.tier), n = CodisVouchers.count(d.tier), t = CodisBoxes.tier(d.tier);
      return '<div class="st-tile vch-tile" role="listitem" data-tier="' + d.tier + '" data-tone="' + d.tone + '" style="--i:' + i + '">' +
        '<div class="vch-face">' + econVoucherArt(d.tier) + '</div>' +
        '<div class="vch-cap"><b class="vch-name">' + escapeHtml(d.name) + '</b><span class="vch-for">لـ' + escapeHtml(t ? t.name : '') + '</span>' +
        '<span class="vch-own">لديك <b dir="ltr">' + econFmt(n) + '</b> / <b dir="ltr">' + econFmt(CodisVouchers.PER_BOX) + '</b></span>' + econVoucherMeter(d.tier) + '</div>' +
        '<div class="vch-buys" role="group" aria-label="' + escapeHtml('شراء ' + d.name) + '">' +
        '<button type="button" class="btn btn-primary vch-buy" ' + (busy ? 'disabled aria-disabled="true" ' : '') + 'aria-label="' + escapeHtml('شراء ' + d.name + ' واحدة — ' + econFmt(p) + ' فضة') + '" onclick="econVoucherBuy(\'' + d.tier + '\', 1)"><span class="vch-q">1</span>' + econSilver(p) + '</button>' +
        '<button type="button" class="btn btn-secondary vch-buy5" ' + (busy ? 'disabled aria-disabled="true" ' : '') + 'aria-label="' + escapeHtml('شراء 5 ' + d.many + ' — ' + econFmt(p * 5) + ' فضة') + '" onclick="econVoucherBuy(\'' + d.tier + '\', 5)"><span class="vch-q">×5</span>' + econSilver(p * 5) + '</button></div></div>';
    }).join('') + '</div><p class="vch-foot">رصيد الفضة: ' + econSilver(sb) + ' · القسائم اللي تطلع من الصناديق ما تنحسب من حد الشراء اليومي.</p></section>';
}
let econVoucherLock = 0;
function econVoucherBuy(tier, qty){
  if(econStoreBusy || Date.now() - econVoucherLock < 500) return;   /* قفل ضد النقرة المزدوجة (المعاملة نفسها تمنع التكرار بمرجعها) */
  econVoucherLock = Date.now();
  const d = CodisVouchers.def(tier); if(!d) return;
  const left = CodisVouchers.dailyLeft(), cost = CodisVouchers.price(tier) * qty;
  if(qty > left && !CodisLimits.bypass('voucher.daily')){ codisSfx('invalid', { ctx:'funds' }); showToast(left ? 'متبقي لك ' + econFmt(left) + ' قسيمة بس اليوم' : 'خلصت حد الشراء اليومي (' + econFmt(CodisVouchers.dailyCap()) + ' قسيمة) — يتجدد باجر', 'var(--warning)'); return; }
  if(!CodisLimits.afford(CodisWallet.silverBalance(), cost)){ codisSfx('invalid', { ctx:'funds' }); showToast('ما عندك فضة كافية', 'var(--warning)'); return; }
  econStoreBusy = true; let r;
  try{ r = CodisVouchers.buy(tier, qty); }catch(e){ console.error(e); r = { ok:false, reason:'error' }; }
  finally{ econStoreBusy = false; }
  if(!r.ok){
    codisSfx('invalid', { ctx:'funds' });
    showToast(r.reason === 'insufficient' ? 'ما عندك فضة كافية' : r.reason === 'daily' ? 'خلصت حد الشراء اليومي' : r.reason === 'save' ? 'تعذّر الحفظ — ما انخصم شيء' : 'تعذّر الشراء', 'var(--warning)');
  } else {
    codisSfx('store.buy', { ctx:'store' });
    const nb = r.boxes.length, t = CodisBoxes.tier(tier);
    showToast(nb ? ('اكتملت ' + econFmt(nb * CodisVouchers.PER_BOX) + ' قسائم — انضاف ' + (nb > 1 ? econFmt(nb) + ' × ' : '') + (t ? t.name : 'صندوق') + ' مغلق إلى ممتلكاتك') : ('اشتريت ' + econFmt(r.n) + ' × ' + d.name + ' (−' + econFmt(r.cost) + ' فضة)'), 'var(--success)', nb ? 'gift' : 'check');
  }
  econRenderAll();
}
/* «بحوزتك» ← العناصر ← «قسائم الصناديق» */
function econVouchersOwnHtml(){
  const c = CodisVouchers.counts(), tot = Object.keys(c).reduce((s, k)=>s + c[k], 0); if(!tot) return '';
  const rows = CodisVouchers.defs().map((d, i)=>{ const n = c[d.tier], t = CodisBoxes.tier(d.tier);
    return '<div class="st-tile vch-own-tile' + (n ? '' : ' is-zero') + '" role="listitem" data-tone="' + d.tone + '" style="--i:' + i + '"><div class="vch-face">' + econVoucherArt(d.tier) + '</div>' +
      '<div class="vch-cap"><b class="vch-name">' + escapeHtml(d.many) + '</b><span class="vch-prog"><b dir="ltr">' + econFmt(n) + ' / ' + econFmt(CodisVouchers.PER_BOX) + '</b> للصندوق التالي</span>' + econVoucherMeter(d.tier) +
      '<span class="vch-for">' + econFmt(CodisVouchers.PER_BOX) + ' = ' + escapeHtml(t ? t.name : '') + '</span></div></div>'; }).join('');
  return econItemGroupHtml('vouchers', 'قسائم الصناديق', tot, '<div class="shop-grid vch-grid is-own" role="list">' + rows + '</div>', 'الصندوق ينضاف تلقائياً عند اكتمال ' + econFmt(CodisVouchers.PER_BOX));
}
econItemRegister({ key:'vouchers', name:'قسائم الصناديق', icon:'voucher', order:40, count:()=>CodisVouchers.total(), html:()=>econVouchersOwnHtml(), action:null, empty:'ما عندك قسائم.' });
/* يُبنى عند فتح القسم فقط (ميزانية عقد المتجر — حارس الأداء): قبلها عنصر نائب بنفس المعرّف، وeconStoreSetPart يملؤه عند أول تبديل */
econStoreRegister({ key:'items', domId:'eco-items', name:'العناصر', icon:'shop_items', order:40, lazy:true, count:()=>CodisVouchers.defs().length, html:()=>econStorePart === 'items' ? econVouchersStoreHtml() : '<section class="st-part st-items" id="eco-items" data-lazy="1" aria-label="العناصر"></section>' });

/* ---------- (3) مكافآت التقدم ---------- */
function codisProgressRewardHtml(rw){
  if(rw.type === 'gems') return econGem(rw.n);
  if(rw.type === 'silver') return econSilver(rw.n);
  if(rw.type === 'coins') return econCoin(rw.n);
  if(rw.type === 'vouchers'){ const d = CodisVouchers.def(rw.tier); return '<span class="pg-rw-t">' + econFmt(rw.n) + ' × ' + escapeHtml(d ? d.name : 'قسيمة') + '</span>'; }
  if(rw.type === 'boxes' || rw.type === 'packs'){ const t = CodisBoxes.tier(rw.tier); return '<span class="pg-rw-t">' + econFmt(rw.n || 1) + ' × ' + escapeHtml(t ? t.name : 'صندوق') + '</span>'; }
  return '';
}
function codisProgressRewardTxt(rw){
  if(rw.type === 'gems') return econFmt(rw.n) + ' ' + (rw.n > 2 && rw.n < 11 ? 'جواهر' : 'جوهرة');
  if(rw.type === 'silver') return econFmt(rw.n) + ' فضة';
  if(rw.type === 'coins') return econFmt(rw.n) + ' كوين';
  return '';
}
function codisProgressCardHtml(s, i){
  const a = s.def, rw = a.rewards.map(codisProgressRewardHtml).join('');
  const st = s.claimed ? '<span class="pg-st is-claimed">' + codisIcon('check') + 'تم الاستلام</span>' : s.ready ? '<span class="pg-st is-ready">' + codisIcon('gift') + 'جاهزة للاستلام</span>' : '<span class="pg-st">قيد التقدّم</span>';
  return '<article class="pg-card is-' + s.status + '" role="listitem" data-ach="' + escapeHtml(a.id) + '" style="--i:' + i + '" aria-label="' + escapeHtml(a.name + ' — ' + (s.claimed ? 'تم الاستلام' : s.ready ? 'جاهزة للاستلام' : s.shown + ' من ' + a.goal)) + '">' +
    (s.claimed ? '<span class="pg-stamp" aria-hidden="true">' + codisIcon('check') + '<b>تم الاستلام</b></span>' : '') +
    '<div class="pg-top"><span class="pg-ico" aria-hidden="true">' + codisIcon(a.icon || 'star') + '</span><div class="pg-id"><h4 class="pg-name">' + escapeHtml(a.name) + '</h4><p class="pg-desc">' + escapeHtml(a.desc) + '</p></div>' + st + '</div>' +
    '<div class="pg-prog"><span class="pg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + a.goal + '" aria-valuenow="' + s.shown + '"><i style="width:' + (s.pct * 100).toFixed(1) + '%"></i></span><b class="pg-num" dir="ltr">' + econFmt(s.shown) + ' / ' + econFmt(a.goal) + '</b></div>' +
    '<div class="pg-rw"><span class="pg-rw-l">المكافأة</span><span class="pg-rw-v">' + rw + '</span>' +
    (s.ready ? '<button type="button" class="btn btn-primary pg-claim" onclick="codisProgressClaimUI(\'' + escapeHtml(a.id) + '\', this)">' + codisIcon('gift') + '<span>استلام المكافأة</span></button>' : '') + '</div></article>';
}
function codisProgressRender(){
  const root = document.getElementById('progress-root'); if(!root) return;
  let L = []; try{ L = CodisProgress.list(); }catch(e){ console.error('CODIS progress:', e); }
  const nC = L.filter(s=>s.claimed).length, nR = L.filter(s=>s.ready).length;
  root.innerHTML = '<div class="pg-sum' + (nR ? ' has-ready' : '') + '" role="status"><span class="pg-sum-ico" aria-hidden="true">' + codisIcon('trophy') + '</span><span><b>' + econFmt(nC) + ' من ' + econFmt(L.length) + '</b> مكافآت مستلمة' + (nR ? '، <b class="pg-sum-r">' + econFmt(nR) + ' جاهزة للاستلام</b>' : '') + '</span>' +
    '<span class="pg-sum-x">حقّق الإنجاز ثم اضغط «استلام المكافأة» — المكافأة الجاهزة تبقى محفوظة لك حتى تستلمها.</span></div>' +
    '<div class="pg-list" role="list">' + L.map(codisProgressCardHtml).join('') + '</div>';
  codisHydrateIcons(root);
  codisProgressHomeBadge();
}
/* الاستلام من الواجهة: قفل ضد الضغط المتكرر (الزر + القفل + المحرك نفسه يرفض الثانية)، والمنح من CodisProgress.claim فقط */
let codisPgBusy = false;
function codisProgressClaimUI(id, btn){
  if(codisPgBusy) return; codisPgBusy = true;
  if(btn){ btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }
  let r; try{ r = CodisProgress.claim(id); }catch(e){ console.error(e); r = { ok:false, reason:'error' }; }
  if(!r.ok){
    codisPgBusy = false;
    try{ codisSfx('invalid', { ctx:'settings' }); }catch(e){}
    showToast(r.reason === 'claimed' ? 'استلمت هذي المكافأة من قبل' : r.reason === 'save' ? 'تعذّر الحفظ — المكافأة بقيت جاهزة، حاول مرة ثانية' : r.reason === 'notyet' ? 'الإنجاز لم يكتمل بعد' : 'تعذّر الاستلام — المكافأة بقيت جاهزة', 'var(--warning)');
    codisProgressRender(); return;
  }
  try{ codisSfx('success', { ctx:'settings' }); codisHaptic([12, 40, 18]); econRenderChip(); }catch(e){}
  const card = document.querySelector('#progress-root .pg-card[data-ach="' + id + '"]'), calm = !!window.CODIS_REDUCED_MOTION;
  const done = ()=>{ codisPgBusy = false; codisProgressRender(); const c2 = document.querySelector('#progress-root .pg-card[data-ach="' + id + '"]'); if(c2) c2.classList.add('is-just'); };
  if(card && !calm){
    /* حركة الاستلام: المكافأة تنبثق من الزر وتصعد وتتلاشى + ختم «تم الاستلام» — transform/opacity فقط */
    const fly = document.createElement('span'); fly.className = 'pg-fly'; fly.setAttribute('aria-hidden', 'true');
    fly.innerHTML = r.rewards.map(rw=>'<span class="pg-fly-i">+' + codisProgressRewardHtml(rw) + '</span>').join('');
    card.appendChild(fly); card.classList.add('is-claiming');
    setTimeout(done, 1250);
  } else done();
  showToast('استلمت مكافأة «' + r.def.name + '»: +' + r.rewards.map(codisProgressRewardTxt).filter(Boolean).join(' + '), 'var(--success)', 'trophy');
}
/* إشعار فتح الإنجاز (لا منح): المكافأة جاهزة للاستلام من الإعدادات */
function codisProgressAnnounce(list){
  list.forEach((a, i)=>setTimeout(()=>{
    try{ codisSfx('success', { ctx:'settings' }); codisHaptic([10, 30, 14]); }catch(e){}
    showToast('إنجاز جديد: ' + a.name + ' — مكافأتك جاهزة للاستلام من الإعدادات ← مكافآت التقدم', 'var(--gold)', 'trophy');
  }, i * 2600));
  try{ codisProgressRender(); codisProgressHomeBadge(); }catch(e){}
}
/* ---------- (4) أداء: إيقاف حركات الخانات المتخطّاة (انظر v61.css §5) — مستمع واحد مفوَّض، صنف فقط ---------- */
try{ if(codisCvOK) document.addEventListener('contentvisibilityautostatechange', e=>{
  const t = e.target, p = t && t.parentElement; if(!p || p.getAttribute('role') !== 'list' || !t.closest('#eco-store-body')) return;
  if(t.classList.contains('is-cv-off') !== !!e.skipped) t.classList.toggle('is-cv-off', !!e.skipped);
}, true); }catch(e){}
