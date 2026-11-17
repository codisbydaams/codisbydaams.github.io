/* ================= CODIS-V62 (3.49.0) · الواجهة =================
   (1) «بحوزتك» ← العناصر ← «قسائم الصناديق»: الدمج يدوي فقط (زر «دمج 10 قسائم» لكل نوع؛ ضغطة = صندوق واحد = −10 من النوع نفسه).
   (2) «بحوزتك» ← «الصناديق»: الصناديق المغلقة (من الدمج/مكافآت التقدم/الشراء) بزر «استخدام» ← قسم البكجات + تحديد بطاقة المستوى + زر «فتح» (لا فتح تلقائي).
   (3) «شراء 1» مع صندوق مغلق مطابق ⇒ نافذة خيارين (الشراء بالعملة · استخدام صندوق موجود) داخل نافذة البكج نفسها؛ الفتح بالنظام الأصلي (econBoxOpenFor/CodisBoxes.open).
   الحالة المشتركة مع دوال أقدم بالملف على window (لا let بالمستوى الأعلى تُقرأ من دالة قد تُستدعى قبل هذا السطر). */

/* ---------- (1) قسائم الصناديق: دمج يدوي ---------- */
function econVouchersMergeHtml(){
  const c = CodisVouchers.counts(), per = CodisVouchers.PER_BOX, tot = Object.keys(c).reduce((s, k)=>s + c[k], 0); if(!tot) return '';
  const rows = CodisVouchers.defs().map((d, i)=>{
    const n = c[d.tier], t = CodisBoxes.tier(d.tier), can = n >= per, sets = Math.floor(n / per);
    return '<div class="st-tile vch-own-tile vch-mg' + (n ? '' : ' is-zero') + (can ? ' is-ready' : '') + '" role="listitem" data-tier="' + d.tier + '" data-tone="' + d.tone + '" style="--i:' + i + '">' +
      '<div class="vch-face">' + econVoucherArt(d.tier) + '</div>' +
      '<div class="vch-cap"><b class="vch-name">' + escapeHtml(d.name) + '</b><span class="vch-lvl">المستوى ' + econFmt(t ? t.index : i + 1) + ' · ' + escapeHtml(t ? t.name : '') + '</span>' +
      '<span class="vch-prog">لديك <b dir="ltr">' + econFmt(n) + '</b> · نحو الدمج <b dir="ltr">' + econFmt(Math.min(n, per)) + ' / ' + econFmt(per) + '</b></span>' + econVoucherMeter(d.tier) +
      (sets > 1 ? '<span class="vch-more">تكفي لـ' + econFmt(sets) + ' صناديق — كل ضغطة تدمج ' + econFmt(per) + ' فقط</span>' : '') + '</div>' +
      '<button type="button" class="btn ' + (can ? 'btn-achievement' : 'btn-secondary') + ' vch-merge' + (can ? '' : ' is-off') + '" aria-disabled="' + (can ? 'false' : 'true') + '" aria-label="' + escapeHtml('دمج ' + per + ' × ' + d.name + ' في ' + (t ? t.name : 'صندوق') + ' واحد — لديك ' + n) + '" onclick="econVoucherMergeUI(\'' + d.tier + '\', this)">' + codisIcon('voucher') + '<span>دمج 10 قسائم</span></button></div>';
  }).join('');
  return econItemGroupHtml('vouchers', 'قسائم الصناديق', tot, '<div class="shop-grid vch-grid is-own" role="list">' + rows + '</div>', 'الدمج يدوي: كل ' + econFmt(per) + ' قسائم من النوع نفسه = صندوق مغلق واحد من مستواها');
}
econItemRegister({ key:'vouchers', name:'قسائم الصناديق', icon:'voucher', order:40, count:()=>CodisVouchers.total(), html:()=>econVouchersMergeHtml(), action:null, empty:'ما عندك قسائم.' });
function econVoucherMergeUI(tier, btn){
  const now = Date.now(); if(econStoreBusy || now - (window.codisVchMergeAt || 0) < 600) return;   /* قفل ضد النقر المتكرر (المحرك نفسه يرفض الدفعة الثانية إن نقصت عن 10) */
  const d = CodisVouchers.def(tier); if(!d) return;
  const per = CodisVouchers.PER_BOX, n = CodisVouchers.count(tier), t = CodisBoxes.tier(tier);
  if(n < per){ codisSfx('invalid', { ctx:'funds' }); showToast('الدمج يحتاج ' + econFmt(per) + ' ' + d.many + ' — عندك ' + econFmt(n), 'var(--warning)'); return; }
  window.codisVchMergeAt = now; econStoreBusy = true;
  if(btn){ btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }
  let r; try{ r = CodisVouchers.merge(tier); }catch(e){ console.error(e); r = { ok:false, reason:'error' }; } finally { econStoreBusy = false; }
  if(!r.ok){
    codisSfx('invalid', { ctx:'funds' });
    showToast(r.reason === 'save' ? 'تعذّر الحفظ — قسائمك كما هي' : r.reason === 'few' ? 'الدمج يحتاج ' + econFmt(per) + ' ' + d.many : 'تعذّر الدمج — قسائمك كما هي', 'var(--warning)');
    econRenderAll(); return;
  }
  codisSfx('store.buy', { ctx:'store' }); try{ codisHaptic([10, 30, 14]); }catch(e){}
  showToast('دمجت ' + econFmt(per) + ' × ' + d.name + ' — انضاف ' + (t ? t.name : 'صندوق') + ' مغلق إلى «بحوزتك» ← الصناديق' + (r.have ? ' · بقي ' + econFmt(r.have) : ''), 'var(--success)', 'gift');
  econRenderAll();
}

/* ---------- (2) «بحوزتك» ← الصناديق المغلقة ---------- */
function econOwnClosedHtml(){
  const ts = CodisBoxes.tiers(); let tot = 0, i = 0;
  const SRC = { VOUCHER:'من دمج القسائم', PROGRESS:'من مكافآت التقدم', GEMS:'مشترى' };
  const tiles = ts.map(t=>{
    const L = CodisBoxes.owned(t.id), c = L.length; if(!c) return ''; tot += c;
    const src = {}; L.forEach(b=>{ const k = SRC[b.currency] || 'مكافأة'; src[k] = (src[k] || 0) + 1; });
    const st = Object.keys(src).map(k=>(c > 1 ? econFmt(src[k]) + ' ' : '') + k).join(' · ');
    return '<div class="st-tile bx-own-tile own-bx" role="listitem" data-tier="' + t.id + '" data-tone="' + t.tone + '" style="--i:' + (i++) + '">' +
      '<div class="own-bx-art"><span class="bx-art">' + econBoxArt(t.index) + '</span>' + (c > 1 ? '<span class="st-n" dir="ltr">×' + econFmt(c) + '</span>' : '') + '</div>' +
      '<div class="st-cap own-bx-cap"><span class="shop-name" dir="auto">' + escapeHtml(t.name) + '</span><span class="own-bx-st">مغلق <b dir="ltr">×' + econFmt(c) + '</b></span><span class="own-bx-src">' + escapeHtml(st) + '</span></div>' +
      '<div class="shop-acts"><button type="button" class="btn btn-achievement own-use own-bx-use" aria-label="' + escapeHtml('استخدام ' + t.name + ' — ينقلك إلى قسم البكجات لتفتحه') + '" onclick="econOwnUseBox(\'' + t.id + '\')">استخدام</button></div></div>';
  }).join('');
  if(!tot) return '';
  return '<section class="own-part own-kind" id="own-closed-boxes" data-kind="boxes" aria-labelledby="own-closed-boxes-h"><div class="own-sub"><span id="own-closed-boxes-h" role="heading" aria-level="5">الصناديق المغلقة</span><span class="own-sub-n">' + econFmt(tot) + '</span>' +
    '<span class="own-sub-x">«استخدام» ينقلك لقسم البكجات ويحدد الصندوق — والفتح بضغطك على «فتح»</span></div><div class="st-grid own-bx-grid" role="list">' + tiles + '</div></section>';
}
econOwnRegister({ key:'boxes', name:'الصناديق', icon:'shop_packs', order:25, count:T=>T.boxes || 0, html:()=>econOwnClosedHtml(), empty:'ما عندك صناديق مغلقة — تحصل عليها بدمج 10 قسائم من «العناصر» أو من مكافآت التقدم.' });
/* «استخدام»: لا يفتح ولا يستهلك — ينقل إلى البكجات ويحدد بطاقة المستوى ويركّز زر «فتح» */
function econOwnUseBox(tierId){
  if(econStoreBusy) return; const t = CodisBoxes.tier(tierId);
  if(!t || !CodisBoxes.owned(tierId).length){ codisSfx('invalid', { ctx:'unavailable' }); showToast('ما عندك صندوق مغلق من هذا النوع', 'var(--warning)'); econRenderAll(); return; }
  window.codisBoxPick = tierId; codisSfx('press', { ctx:'store' });
  econGoBoxes(); econBoxPickSync(true);
  showToast(t.name + ' جاهز — اضغط «فتح» عند البطاقة', 'var(--gold)', 'gift');
}
function econBoxPickSync(focus){
  const sec = document.getElementById('eco-boxes'); if(!sec) return;
  const id = window.codisBoxPick || null;
  Array.prototype.forEach.call(sec.querySelectorAll('.bx-card.is-picked'), c=>{ if(c.getAttribute('data-tier') !== id) c.classList.remove('is-picked'); });
  if(!id) return;
  const c = sec.querySelector('.bx-card[data-tier="' + id + '"]'); if(!c) return;
  c.classList.add('is-picked');
  if(focus){
    try{ c.scrollIntoView({ block:'center', behavior:econCalm() ? 'auto' : 'smooth' }); }catch(e){ try{ c.scrollIntoView(); }catch(x){} }
    const b = c.querySelector('.bx-mine-open'); if(b) setTimeout(()=>{ try{ b.focus({ preventScroll:true }); }catch(e){} }, econCalm() ? 0 : 420);
  }
}
/* «فتح» صندوق مملوك من بطاقة المستوى: أقدم صندوق مغلق من المستوى نفسه، بنفس نافذة/مشهد الفتح الأصلي، بلا أي خصم */
function econBoxOpenOwned(tierId){
  if(econStoreBusy) return; const b = CodisBoxes.owned(tierId)[0];
  if(!b){ codisSfx('invalid', { ctx:'unavailable' }); showToast('ما عندك صندوق مغلق من هذا النوع', 'var(--warning)'); econRenderAll(); return; }
  window.codisBoxPick = null; econBoxPickSync();
  econBoxOpenFor(tierId, b.uid, true);
}
/* صف «لديك» على بطاقة المستوى بقسم البكجات (يُستدعى من econBoxesHtml) */
function econBoxMineHtml(t){
  let c = 0; try{ c = CodisBoxes.owned(t.id).length; }catch(e){ c = 0; } if(!c) return '';
  return '<div class="bx-mine" role="group" aria-label="' + escapeHtml(t.name + ' — صناديقك المغلقة') + '"><span class="bx-mine-n">لديك <b dir="ltr">×' + econFmt(c) + '</b></span>' +
    '<button type="button" class="btn btn-achievement bx-mine-open" ' + (econStoreBusy ? 'disabled aria-disabled="true" ' : '') + 'aria-label="' + escapeHtml('فتح ' + t.name + ' من صناديقك — بلا أي خصم') + '" onclick="econBoxOpenOwned(\'' + t.id + '\')">فتح</button></div>';
}

/* ---------- (3) «شراء 1» مع صندوق مطابق: نافذة خيارين (نافذة البكج نفسها بوضع اختيار) ---------- */
function econBoxChoiceNeeded(tierId){ try{ return !!CodisBoxes.tier(tierId) && CodisBoxes.owned(tierId).length > 0; }catch(e){ return false; } }
function econBoxChoiceOpen(tierId){
  const m = econPackModal(), body = document.getElementById('econ-pack-body'), t = CodisBoxes.tier(tierId); if(!m || !body || !t) return false;
  const own = CodisBoxes.owned(tierId).length, bal = CodisWallet.gemBalance(), G = econGemsCfg();
  econPackId = tierId; econPackOpener = document.querySelector('#eco-boxes .bx-card[data-tier="' + tierId + '"] .bx-buy');
  const sheet = m.querySelector('.pk-modal'); if(sheet){ sheet.setAttribute('data-tone', t.tone); sheet.classList.add('is-choice'); }
  body.innerHTML = '<header class="bxc-hero"><div class="bxc-art" aria-hidden="true">' + econBoxArt(t.index) + '</div><div class="bxc-id"><h3 id="econ-pack-title">' + escapeHtml(t.name) + '</h3>' +
      '<p class="bxc-sub">عندك <b dir="ltr">' + econFmt(own) + '</b> ' + (own === 1 ? 'صندوق مغلق' : 'صناديق مغلقة') + ' من هذا المستوى — كيف تريد تفتحه؟</p></div></header>' +
    '<div class="bxc-opts" role="group" aria-label="طريقة الحصول على ' + escapeHtml(t.name) + '">' +
      '<button type="button" class="bxc-opt is-coin" onclick="econBoxChoiceCoin()"><span class="bxc-t"><b>الشراء بالعملة</b><small>صندوق جديد بسعره — صناديقك المغلقة تبقى كما هي</small><small class="bxc-bal">رصيدك ' + econGem(bal) + '</small></span>' +
        '<span class="bxc-v"><em>السعر</em>' + econGem(t.gems) + '</span></button>' +
      '<button type="button" class="bxc-opt is-own" onclick="econBoxChoiceOwn()"><span class="bxc-t"><b>استخدام صندوق موجود</b><small>يُفتح واحد من صناديقك المغلقة — بلا أي خصم ' + escapeHtml(G.short) + '</small></span>' +
        '<span class="bxc-v"><em>لديك</em><b dir="ltr">×' + econFmt(own) + '</b></span></button></div>' +
    '<p class="bxc-note">الطريقتان تفتحان الصندوق بنفس الطريقة ونفس الاحتمالات.</p>' +
    '<div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="econPackClose()">إلغاء</button></div>';
  codisSfx('open', { ctx:'box' });
  m.setAttribute('aria-hidden', 'false'); CodisMotion.modalIn(m);
  if(sheet) sheet.scrollTop = 0;
  const f = body.querySelector('.bxc-opt.is-own'); if(f) setTimeout(()=>{ try{ f.focus({ preventScroll:true }); }catch(e){} }, 60);
  return true;
}
function econBoxChoiceCoin(){ const id = econPackId; econPackClose(); if(id) econBuyBox(id, true); }
function econBoxChoiceOwn(){ const id = econPackId; econPackClose(); if(id) econBoxOpenOwned(id); }
