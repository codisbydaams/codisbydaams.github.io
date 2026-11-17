/* CODIS-V63: كل دالة هنا تحلّ محل الدالة بالاسم نفسه في مكانها (patch_v63.replfn) — لا تعريفات مكررة */
function econOwnTotals(){
  const H = CodisHolidayCards, items = CodisInventory.owned().length, passes = CodisPasses.owned().length, hc = H.usable().length, boxes = CodisBoxes.owned().length, pouches = CodisPouches.owned().length, cosmetics = CodisCosmetics.owned().length;
  /* CODIS-V55: المنتهية المعروضة بالمخزون (نفس حد hcdInvTilesHtml) — عدّاد منفصل؛ ليست صالحة للاستخدام لكنها مقتنيات يجب الوصول إليها (تفكيك) */
  /* CODIS-V63: الصناديق المغلقة مجموعة داخل «العناصر» ⇒ ضمن elements مرة واحدة فقط (لا قسم مستقل ولا عدّ مرتين) */
  const hcDead = Math.min(H.expired().length, 8), cards = items, elements = pouches + passes + hc + hcDead + codisVoucherTotalSafe() + boxes;
  let themes = 0; try{ themes = CodisPlanThemes.owned().length; }catch(e){}   /* CODIS-V56: ثيمات التخطيط المملوكة (قسم «المظاهر») */
  return { items:items, passes:passes, hc:hc, hcDead:hcDead, cards:cards, elements:elements, boxes:boxes, pouches:pouches, cosmetics:cosmetics, themes:themes, total:cards + elements + cosmetics + themes };
}
/* CODIS-V63: المجموعة بصرية فقط — بلا عنوان ظاهر ولا عدد ولا شرح (اسم النوع لقارئات الشاشة)؛ الفصل بمسافة وخط هادئ (CSS .own-kinds) */
function econItemGroupHtml(key, name, n, body){
  return '<section class="own-part own-kind" id="own-' + key + '" data-kind="' + key + '" aria-label="' + escapeHtml(name) + '">' + body + '</section>';
}
/* CODIS-V63: رسم القسيمة — كوبون بزوايا مقصوصة وحافة مزدوجة وكعب مثقّب بسهمي استبدال وختم نجمة ونقاط المستوى (لونه وتفاصيله لكل مستوى). لا صندوق إطلاقاً.
   o.big للنتائج · o.mini أيقونة صغيرة (مكافآت التقدم) · o.label=false حين يحمل الأب الوصف */
function econVoucherArt(tier, o){
  o = o || {}; const d = CodisVouchers.def(tier); if(!d) return '';
  const t = CodisBoxes.tier(d.tier), n = t ? t.index : 1;
  const BG = 'M16 6H144A12 12 0 0 0 156 18V82A12 12 0 0 0 144 94H16A12 12 0 0 0 4 82V18A12 12 0 0 0 16 6Z';
  let pips = '', holes = '';
  for(let i = 0; i < 5; i++) pips += '<circle class="vc-pip' + (i < n ? ' on' : '') + '" cx="' + (34 + i * 9) + '" cy="80" r="2.6"/>';
  for(let y = 18; y <= 82; y += 8) holes += '<circle cx="112" cy="' + y + '" r="1.8"/>';
  return '<span class="vch-art' + (o.big ? ' is-big' : '') + (o.mini ? ' is-mini' : '') + '" data-tone="' + d.tone + '"' + (o.label === false ? ' aria-hidden="true"' : ' role="img" aria-label="' + escapeHtml(o.label || d.name) + '"') + '>' +
    '<svg class="vch-cp" viewBox="0 0 160 100" aria-hidden="true" focusable="false">' +
    '<path class="vc-sh" d="' + BG + '" transform="translate(2 3)"/><path class="vc-bg" d="' + BG + '"/>' +
    '<rect class="vc-in vc-fine" x="12" y="14" width="92" height="72" rx="5"/>' +
    '<rect class="vc-stub" x="118" y="14" width="30" height="72" rx="5"/><g class="vc-holes vc-fine">' + holes + '</g>' +
    '<path class="vc-arw" d="M126 42h14l-4-4M140 42l-4 4M140 58h-14l4-4M126 58l4 4"/>' +
    '<g class="vc-mk"><circle class="vc-seal" cx="52" cy="44" r="22"/><circle class="vc-seal2 vc-fine" cx="52" cy="44" r="17"/>' +
    '<path class="vc-star" d="M52 33L54.7 40.28L62.46 40.6L56.37 45.42L58.47 52.9L52 48.6L45.53 52.9L47.63 45.42L41.54 40.6L49.3 40.28Z"/></g>' +
    '<g class="vc-fine">' + pips + '</g><path class="vc-ln vc-fine" d="M82 32h16M82 42h16M82 52h10"/></svg></span>';
}
/* CODIS-V63: اسم قديم — نفس قسم الدمج (لا بطاقات لأنواع عددها صفر) */
function econVouchersOwnHtml(){ return econVouchersMergeHtml(); }
/* CODIS-V63: القسائم والصناديق بنفس شكل الجواهر — أيقونة المستوى + الرقم؛ الاسم لقارئات الشاشة فقط */
function codisProgressRewardHtml(rw){
  if(rw.type === 'gems') return econGem(rw.n);
  if(rw.type === 'silver') return econSilver(rw.n);
  if(rw.type === 'coins') return econCoin(rw.n);
  if(rw.type === 'vouchers'){ const d = CodisVouchers.def(rw.tier), n = rw.n || 1; return '<span class="eco-coin eco-itm is-vch" role="img" aria-label="' + escapeHtml(econFmt(n) + ' × ' + (d ? d.name : 'قسيمة')) + '">' + econVoucherArt(rw.tier, { mini:true, label:false }) + '<b dir="ltr" aria-hidden="true">' + econFmt(n) + '</b></span>'; }
  if(rw.type === 'boxes' || rw.type === 'packs'){ const t = CodisBoxes.tier(rw.tier), n = rw.n || 1; return '<span class="eco-coin eco-itm is-bx" role="img" aria-label="' + escapeHtml(econFmt(n) + ' × ' + (t ? t.name : 'صندوق') + ' مغلق') + '">' + econOwnedBoxArt(rw.tier, { mini:true, label:false }) + '<b dir="ltr" aria-hidden="true">' + econFmt(n) + '</b></span>'; }
  return '';
}
/* CODIS-V63: «بحوزتك» ← العناصر ← القسائم: الأنواع المملوكة فقط (العدد > 0)؛ النوع الذي نفد يختفي. الدمج يدوي كما هو */
function econVouchersMergeHtml(){
  const c = CodisVouchers.counts(), per = CodisVouchers.PER_BOX; let i = 0;
  const rows = CodisVouchers.defs().map(d=>{
    const n = c[d.tier] || 0; if(!(n > 0)) return '';
    const t = CodisBoxes.tier(d.tier), can = n >= per, sets = Math.floor(n / per);
    return '<div class="st-tile vch-own-tile vch-mg' + (can ? ' is-ready' : '') + '" role="listitem" data-tier="' + d.tier + '" data-tone="' + d.tone + '" style="--i:' + (i++) + '">' +
      '<div class="vch-face">' + econVoucherArt(d.tier) + '</div>' +
      '<div class="vch-cap"><b class="vch-name">' + escapeHtml(d.name) + '</b>' +
      '<span class="vch-prog">لديك <b dir="ltr">' + econFmt(n) + '</b> · نحو الدمج <b dir="ltr">' + econFmt(Math.min(n, per)) + ' / ' + econFmt(per) + '</b></span>' + econVoucherMeter(d.tier) +
      (sets > 1 ? '<span class="vch-more">تكفي لـ' + econFmt(sets) + ' صناديق — كل ضغطة تدمج ' + econFmt(per) + ' فقط</span>' : '') + '</div>' +
      '<button type="button" class="btn ' + (can ? 'btn-achievement' : 'btn-secondary') + ' vch-merge' + (can ? '' : ' is-off') + '" aria-disabled="' + (can ? 'false' : 'true') + '" aria-label="' + escapeHtml('دمج ' + per + ' × ' + d.name + ' في ' + (t ? t.name : 'صندوق') + ' واحد — لديك ' + n) + '" onclick="econVoucherMergeUI(\'' + d.tier + '\', this)">' + codisIcon('voucher') + '<span>دمج 10 قسائم</span></button></div>';
  }).join('');
  return i ? econItemGroupHtml('vouchers', 'قسائم الصناديق', 0, '<div class="shop-grid vch-grid is-own" role="list">' + rows + '</div>') : '';
}
/* CODIS-V63: لوحة النتيجة حسب نوع الجائزة الفعلية فقط (بطاقة: البطاقة + الاسم + القيمة · جواهر/فضة: الأيقونة + الكمية) */
function codisFreeBoxPrizeHtml(r){
  if(r.type === 'card'){
    const rar = r.rarity, it = r.item, kind = (econStoreHasArt(it) && codisCardKey({ rarityTone:rar.tone })) ? 'is-dl' : 'is-plain';
    return '<div class="fb-prize is-card"><div class="fb-cardwrap"><span class="store-art is-card ' + kind + '">' + econStoreFaceHtml(it, rar, { price:r.coin }) + '</span></div>' +
      '<b class="fb-name" dir="auto">' + escapeHtml(it.name) + '</b><span class="fb-val"><em>القيمة</em>' + econCoin(r.coin) + '</span></div>';
  }
  const gem = r.type === 'gems', G = econGemsCfg(), lab = gem ? G.short : 'فضة';
  return '<div class="fb-prize is-' + (gem ? 'gems' : 'silver') + '" role="img" aria-label="' + escapeHtml('+' + econFmt(r.n) + ' ' + lab) + '"><span class="fb-pz-ico" aria-hidden="true">' + (gem ? econGemSvg() : ECON_SILVER_SVG) + '</span>' +
    '<b class="fb-pz-n" dir="ltr" aria-hidden="true">+' + econFmt(r.n) + '</b><span class="fb-pz-l" aria-hidden="true">' + lab + '</span></div>';
}
function codisFreeBoxOpen(){
  if(codisFbOpening) return;
  codisFbOpening = true;
  const btn = document.getElementById('fb-card'); if(btn){ btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }
  let r; try{ r = CodisFreeBox.claim(); }catch(e){ console.error(e); r = { ok:false, reason:'error' }; }
  if(!r.ok){
    codisFbOpening = false;
    if(btn){ btn.disabled = false; btn.removeAttribute('aria-disabled'); }
    codisSfx('invalid', { ctx:'unavailable' }); const m = codisFreeBoxMsg(r.reason, r); if(m) showToast(m, 'var(--warning)');
    if(r.reason === 'wait') { try{ econRenderStore(); }catch(e){} }
    return;
  }
  const calm = (typeof econCalm === 'function') && econCalm(), G = econGemsCfg();
  const note = r.type === 'card' ? 'انضافت البطاقة إلى «بحوزتك» — بلا أي خصم.' : r.type === 'gems' ? 'انضافت ' + G.short + ' لرصيدك — بلا أي خصم.' : 'انضافت الفضة لرصيدك — بلا أي خصم.';
  const ov = document.createElement('div'); ov.id = 'fb-ov'; ov.className = 'fb-ov' + (calm ? ' is-calm' : ''); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'فتح الصندوق المجاني');
  ov.innerHTML = '<div class="fb-stage"><div class="fb-box is-shake" id="fb-box">' + codisFreeBoxArt() + '</div>' +
    '<div class="fb-rev" id="fb-rev" role="status" hidden><span class="fb-kick">مبروك — هذي هديتك</span>' + codisFreeBoxPrizeHtml(r) +
    '<p class="fb-note">' + note + '<br>يرجع الصندوق بعد 24 ساعة.</p>' +
    '<button type="button" class="btn btn-primary fb-ok" onclick="codisFreeBoxClose()">تمام</button></div></div>';
  (document.getElementById('settings-page-eco-store') || document.body).appendChild(ov);
  codisHydrateIcons(ov);
  codisSfx('open', { ctx:'select' }); codisHaptic([12, 40, 18]);
  const show = ()=>{ const b = document.getElementById('fb-box'), v = document.getElementById('fb-rev'); if(!b || !v) return; b.classList.remove('is-shake'); b.classList.add('is-open'); codisSfx('success', { ctx:'settings' });
    setTimeout(()=>{ const v2 = document.getElementById('fb-rev'); if(v2){ const stg = v2.closest('.fb-stage'); if(stg) stg.classList.add('is-done'); v2.hidden = false; v2.classList.add('is-on'); try{ codisFitLazy(v2); }catch(e){} const ok = v2.querySelector('.fb-ok'); if(ok) try{ ok.focus({ preventScroll:true }); }catch(e){} } }, calm ? 0 : 520); };
  setTimeout(show, calm ? 0 : 700);
  showToast(r.type === 'card' ? 'انضافت «' + r.item.name + '» إلى «بحوزتك»' : '+' + econFmt(r.n) + ' ' + (r.type === 'gems' ? G.short : 'فضة') + ' من الصندوق المجاني', 'var(--success)', 'check');   /* CODIS-V63: الجائزة الفعلية فقط */
}
