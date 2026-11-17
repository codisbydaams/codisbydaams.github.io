/* ================= CODIS-V63 (3.50.0) · الواجهة =================
   (1) هوية الصندوق المغلق المملوك = رسمة القسيمة السابقة (تذكرة بحافة مثقّبة + مصغّر صندوق مستواها) ⇒ econOwnedBoxArt (المصدر الوحيد).
       القسيمة صار لها تصميم كوبون مستقل بلا أي صندوق (econVoucherArt).
   (2) «بحوزتك»: لا قسم «الصناديق» — الصناديق المغلقة مجموعة أولى داخل «العناصر» (ECON_ITEM_KINDS key:'boxes')، وعدّادها ضمن elements فقط.
   (3) المتجر: لا صف صناديق فوق البكجات ولا «لديك ×N – فتح» بالبطاقة؛ أيقونة صندوق واحدة (بلا رقم) بصف سعر «شراء 1» للمستوى الذي يملك منه صندوقاً مغلقاً.
       «استخدام» من «بحوزتك» ⇒ البكجات + تحديد المستوى + نافذة الخيارين (لا فتح تلقائي). */

/* ---------- (1) رسمة الصندوق المغلق المملوك ---------- */
function econOwnedBoxArt(tier, o){
  o = o || {}; let t = null; try{ t = CodisBoxes.tier(tier); }catch(e){ t = null; } if(!t) return '';
  const lv = [1, 2, 3, 4, 5].map(i=>'<i' + (i <= t.index ? ' class="on"' : '') + '></i>').join('');
  return '<span class="obx-art' + (o.big ? ' is-big' : '') + (o.mini ? ' is-mini' : '') + '" data-tone="' + t.tone + '"' + (o.label === false ? ' aria-hidden="true"' : ' role="img" aria-label="' + escapeHtml(o.label || (t.name + ' مغلق')) + '"') + '>' +
    '<svg class="obx-tk" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="obx-bg" d="M10 4h140a6 6 0 0 1 6 6v24a8 8 0 0 0 0 32v24a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V66a8 8 0 0 0 0-32V10a6 6 0 0 1 6-6Z"/>' +
    '<path class="obx-perf" d="M48 10v80"/><path class="obx-gl" d="M56 12h90"/></svg>' +
    '<span class="obx-box">' + econBoxArt(t.index) + '</span>' + (o.mini ? '' : '<span class="obx-stub" aria-hidden="true"><span class="obx-lv">' + lv + '</span></span>') + '</span>';
}

/* ---------- (2) «بحوزتك» ← العناصر ← الصناديق المغلقة (بطاقة لكل مستوى + عدده + «استخدام») ---------- */
function econOwnClosedHtml(){
  const ts = CodisBoxes.tiers(); let i = 0;
  const tiles = ts.map(t=>{
    const c = CodisBoxes.owned(t.id).length; if(!c) return '';
    return '<div class="st-tile own-bx" role="listitem" data-tier="' + t.id + '" data-tone="' + t.tone + '" style="--i:' + (i++) + '">' +
      '<div class="own-bx-art">' + econOwnedBoxArt(t.id, { label:t.name + ' مغلق — لديك ' + econFmt(c) }) + '<span class="own-bx-n" dir="ltr" aria-hidden="true">×' + econFmt(c) + '</span></div>' +
      '<div class="st-cap own-bx-cap"><span class="shop-name" dir="auto">' + escapeHtml(t.name) + '</span></div>' +
      '<div class="shop-acts"><button type="button" class="btn btn-achievement own-use own-bx-use" aria-label="' + escapeHtml('استخدام ' + t.name + ' — ينقلك إلى البكجات ويعرض طريقة استخدامه') + '" onclick="econOwnUseBox(\'' + t.id + '\')">استخدام</button></div></div>';
  }).join('');
  return i ? econItemGroupHtml('boxes', 'الصناديق المغلقة', 0, '<div class="st-grid own-bx-grid" role="list">' + tiles + '</div>') : '';
}
econItemRegister({ key:'boxes', name:'الصناديق المغلقة', icon:'shop_packs', order:5, count:()=>CodisBoxes.owned().length, html:()=>econOwnClosedHtml(), action:id=>econOwnUseBox(id), empty:'ما عندك صناديق مغلقة.' });

/* «استخدام»: لا يفتح ولا يستهلك — ينقل إلى البكجات، يحدد بطاقة المستوى، ثم يعرض نافذة الخيارين (الشراء بالعملة · استخدام صندوق موجود). الفتح بضغط المستخدم فقط */
function econOwnUseBox(tierId){
  if(econStoreBusy) return; const t = CodisBoxes.tier(tierId);
  if(!t || !CodisBoxes.owned(tierId).length){ codisSfx('invalid', { ctx:'unavailable' }); showToast('ما عندك صندوق مغلق من هذا النوع', 'var(--warning)'); econRenderAll(); return; }
  window.codisBoxPick = tierId; codisSfx('press', { ctx:'store' });
  econGoBoxes(); econBoxPickSync(true);
  const tok = (window.codisBoxUseTok = (window.codisBoxUseTok || 0) + 1);
  setTimeout(()=>{
    if(tok !== window.codisBoxUseTok || econStoreBusy || window.codisBoxPick !== tierId || !econStoreIsOpen()) return;
    let shown = false; try{ shown = econBoxChoiceNeeded(tierId) && econBoxChoiceOpen(tierId); }catch(e){ shown = false; }
    if(!shown) showToast(t.name + ' — اضغط «شراء 1» واختر «استخدام صندوق موجود»', 'var(--gold)', 'gift');
  }, econCalm() ? 60 : 520);
}
/* تحديد بطاقة المستوى بقسم البكجات + التركيز على زر «شراء 1» (منه تظهر نافذة الخيارين) */
function econBoxPickSync(focus){
  const sec = document.getElementById('eco-boxes'); if(!sec) return;
  const id = window.codisBoxPick || null;
  Array.prototype.forEach.call(sec.querySelectorAll('.bx-card.is-picked'), c=>{ if(c.getAttribute('data-tier') !== id) c.classList.remove('is-picked'); });
  if(!id) return;
  const c = sec.querySelector('.bx-card[data-tier="' + id + '"]'); if(!c) return;
  c.classList.add('is-picked');
  if(focus){
    try{ c.scrollIntoView({ block:'center', behavior:econCalm() ? 'auto' : 'smooth' }); }catch(e){ try{ c.scrollIntoView(); }catch(x){} }
    const b = c.querySelector('.bx-buy'); if(b) setTimeout(()=>{ if(!document.querySelector('#econ-pack-modal[aria-hidden="false"]')){ try{ b.focus({ preventScroll:true }); }catch(e){} } }, econCalm() ? 0 : 420);
  }
}

/* ---------- (3) زر «شراء 1» بالبكج: إن كان يملك صندوقاً مغلقاً من المستوى نفسه ⇒ أيقونة الصندوق (واحدة، بلا رقم) بصف السعر:
   «شراء 1» · أيقونة الصندوق · أيقونة الجواهر · السعر. وحدة واحدة فيبقى الترتيب بالصف (العرض الواسع) وبالعمود (تحت 380px). بلا صندوق ⇒ السعر كما كان حرفياً ---------- */
function econBoxBuyPriceHtml(t){
  let own = false; try{ own = econBoxChoiceNeeded(t.id); }catch(e){ own = false; }
  if(!own) return econGem(t.gems);
  return '<span class="bx-buy-v">' + econOwnedBoxArt(t.id, { mini:true, label:false }) + econGem(t.gems) + '</span>';
}

/* ---------- (4) مكافآت التقدم المستلمة: تعرض ما استُلم فعلاً (مكافأة «أول أسبوع ناجح» القديمة 5 تبقى 5) ---------- */
function codisProgressPaidRewards(a){
  try{
    const ref = 'progress|' + a.id, w = data.wallet || {};
    const find = (L, cur)=>Array.isArray(L) ? L.find(t=>t && t.type === 'PROGRESS_REWARD' && t.referenceId === ref && (!cur || t.currency === cur)) : null;
    return a.rewards.map(rw=>{
      const t = rw.type === 'gems' ? find(w.gems && w.gems.transactions) : rw.type === 'silver' ? find(w.silver && w.silver.transactions) : rw.type === 'coins' ? find(w.transactions) : null;
      const n = t ? Math.abs(Number(t.amount)) : 0;
      return (t && isFinite(n) && n > 0 && n !== rw.n) ? Object.assign({}, rw, { n:n }) : rw;
    });
  }catch(e){ return a.rewards; }
}
