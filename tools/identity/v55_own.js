/* CODIS-V55: «بحوزتك» بأقسام مستقلة (شريط عمودي يمين + قسم واحد ظاهر). عرض/تنقل فقط فوق الأنظمة الموجودة —
   لا يغيّر CodisInventory/CodisPasses/CodisHolidayCards/CodisPouches/CodisCosmetics/CodisBoxes ولا قواعد البيع/الاستخدام.
   الحالة مستقلة عن المتجر: econOwnPart + econOwnScroll (لا econStorePart ولا econStoreScrollPos). */
const ECON_OWN_ICONS = Object.freeze({
  /* الأكياس: كيس فضة مربوط بخيط وعليه قطعة — بنفس لغة رسم أيقونات المتجر (خط 1.55 + تعبئة شفافة) */
  own_pouch:
    '<path d="M8.6 7.6h6.8c3 2.4 4.9 5.8 4.9 8.6 0 2.7-2.1 4.6-5.2 4.6H8.9c-3.1 0-5.2-1.9-5.2-4.6 0-2.8 1.9-6.2 4.9-8.6z" fill="currentColor" fill-opacity=".18"/>' +
    '<path d="M8.6 7.6L7.2 4.4c-.2-.5.2-1 .7-.9l2 .5L12 3l2.1 1 2-.5c.5-.1.9.4.7.9l-1.4 3.2"/>' +
    '<path d="M8.2 7.6h7.6" stroke-width="1.9"/>' +
    '<circle cx="12" cy="14.8" r="2.6" fill="currentColor" fill-opacity=".55"/><path d="M12 13.6v2.4" stroke-opacity=".8" stroke-width="1.2"/>'
});
function econOwnIconHtml(name){
  const b = ECON_OWN_ICONS[name]; if(!b) return econStoreIconHtml(name);
  return '<svg class="ico ico-hero sx-ico" data-icon="' + name + '" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + b + '</svg>';
}
/* سجل أقسام «بحوزتك»: معرّف · اسم · أيقونة · ترتيب · عدد · بناء المحتوى · نص الحالة الفارغة */
const ECON_OWN_SECTIONS = [];
function econOwnRegister(d){
  const i = ECON_OWN_SECTIONS.findIndex(x=>x.key === d.key);
  if(i >= 0) ECON_OWN_SECTIONS[i] = d; else ECON_OWN_SECTIONS.push(d);
  ECON_OWN_SECTIONS.sort((a, b)=>a.order - b.order);
}
econOwnRegister({ key:'cards', name:'الكروت', icon:'shop_cards', order:10, count:T=>T.cards, html:T=>econOwnCardsHtml(T), empty:'ما عندك كروت حالياً — تحصل عليها من المتجر أو البكجات أو بإنجاز مهامك.' });
econOwnRegister({ key:'pouches', name:'الأكياس', icon:'own_pouch', order:20, count:T=>T.pouches, html:()=>econPouchesHtml(), empty:'ما عندك أكياس فضة حالياً — تطلع من البكجات.' });
econOwnRegister({ key:'cosmetics', name:'المظاهر', icon:'shop_skins', order:30, count:T=>T.cosmetics, html:()=>econCosmeticsInvHtml(), empty:'ما عندك مظاهر حالياً — تشتريها بالفضة من قسم المظاهر بالمتجر.' });
econOwnRegister({ key:'boxes', name:'البكجات', icon:'shop_packs', order:40, count:T=>T.boxes, html:T=>econOwnBoxesHtml(T), empty:'ما عندك بكجات مغلقة حالياً.' });
/* حالة الواجهة فقط (لا تُحفظ): القسم النشط + موضع تمرير مستقل لكل قسم. تُصفَّر عند فتح المتجر من جديد */
let econOwnPart = '', econOwnScroll = {}, econOwnBound = false;
function econOwnSections(){ return ECON_OWN_SECTIONS.filter(d=>{ try{ return d.enabled ? d.enabled() !== false : true; }catch(e){ return false; } }); }
function econOwnPartOf(k){ const L = econOwnSections(); return L.find(d=>d.key === k) || L[0] || null; }
function econOwnCount(d, T){ try{ return Math.max(0, d.count(T) || 0); }catch(e){ return 0; } }
/* القسم الافتراضي: الحالي إن وُجد، وإلا أول قسم فيه مقتنيات (لا ينقل المستخدم من قسم صار فارغاً بعد عملية) */
function econOwnPickPart(T){
  const L = econOwnSections(); if(!L.length) return 'cards';
  if(econOwnPart && L.some(d=>d.key === econOwnPart)) return econOwnPart;
  const f = L.find(d=>econOwnCount(d, T) > 0); return (f || L[0]).key;
}
function econOwnSheetHtml(){
  let T; try{ T = econOwnTotals(); }catch(e){ T = { total:0 }; }
  if(!T.total && !econOwnOpen) return '';   /* لا شيء ولا الورقة مفتوحة ⇒ لا ورقة (زر «بحوزتك» يعرض رسالته) */
  econSelPrune();
  econOwnPart = econOwnPickPart(T);
  const L = econOwnSections();
  const rail = '<div class="own-rail" role="tablist" aria-orientation="vertical" aria-label="أقسام ما بحوزتك" onkeydown="econOwnKey(event)">' + L.map(d=>{
    const on = d.key === econOwnPart, n = econOwnCount(d, T);
    return '<button type="button" role="tab" class="own-tab' + (on ? ' is-on' : '') + (n ? '' : ' is-empty') + '" id="own-tab-' + d.key + '" data-own="' + d.key + '" aria-selected="' + (on ? 'true' : 'false') + '" aria-controls="own-panel-' + d.key + '" tabindex="' + (on ? '0' : '-1') + '" onclick="econOwnSetPart(\'' + d.key + '\')">' +
      econOwnIconHtml(d.icon) + '<span class="own-tab-l">' + d.name + '</span><span class="own-tab-n" aria-hidden="true"' + (n ? '' : ' hidden') + '>' + econFmt(n) + '</span><span class="sr">' + (n ? econFmt(n) + ' عنصر' : 'فارغ') + '</span></button>';
  }).join('') + '</div>';
  const stage = '<div class="own-stage" id="eco-own-stage" data-own="' + econOwnPart + '">' + L.map(d=>{
    const on = d.key === econOwnPart; let h = ''; try{ h = econOwnCount(d, T) ? d.html(T) : ''; }catch(e){ console.error('CODIS own section (' + d.key + '):', e); }
    return '<div class="own-panel' + (on ? ' is-on' : '') + '" role="tabpanel" id="own-panel-' + d.key + '" data-own="' + d.key + '" aria-labelledby="own-tab-' + d.key + '"' + (on ? '' : ' hidden') + '>' +
      (h || '<div class="own-empty"><span class="own-empty-ico" aria-hidden="true">' + econOwnIconHtml(d.icon) + '</span><b>' + d.name + '</b><span>' + d.empty + '</span></div>') + '</div>';
  }).join('') + '</div>';
  return '<div id="eco-own-sheet" class="own-sheet own-v55' + (econOwnOpen ? ' is-open' : '') + '" role="dialog" aria-modal="true" aria-labelledby="eco-own-title">' +
    '<div class="own-sheet-bar"><button type="button" class="own-sheet-close" onclick="econCloseOwn()">' + codisIcon('back') + '<span>رجوع للمتجر</span></button>' +
    '<span class="own-sheet-title" id="eco-own-title">بحوزتك' + (T.total ? '<span class="own-title-n" aria-label="' + econFmt(T.total) + ' عنصر">' + econFmt(T.total) + '</span>' : '') + '</span></div>' +
    '<div class="own-shell">' + rail + stage + '</div></div>';
}
/* تبديل القسم: أصناف وخصائص فقط (كل الأقسام مبنية مسبقاً) ⇒ لا إعادة رسم ولا وميض للقسم السابق ولا تمرير للصفحة الخارجية */
function econOwnSetPart(key, opts){
  opts = opts || {}; const d = econOwnPartOf(key); if(!d) return;
  const st = document.getElementById('eco-own-stage');
  if(d.key === econOwnPart && !opts.force){
    if(st && !opts.quiet){ econOwnScroll[d.key] = 0; try{ st.scrollTo({ top:0, behavior:econCalm() ? 'auto' : 'smooth' }); }catch(x){ st.scrollTop = 0; } }   /* نقرة ثانية = أعلى القسم */
    return;
  }
  if(!opts.quiet) codisSfx('press', { ctx:'tab' });
  econOwnScrollSave();
  econOwnPart = d.key; econOwnSync();
  econOwnRestore();
  const p = document.getElementById('own-panel-' + d.key);
  if(p){ try{ codisFitLazy(p); }catch(x){} try{ codisNameCutSync(p); }catch(x){} if(!econCalm()){ p.classList.remove('is-part-in'); void p.offsetWidth; p.classList.add('is-part-in'); } }
  if(opts.focus){ const t = document.getElementById('own-tab-' + d.key); if(t){ try{ t.focus({ preventScroll:true }); }catch(x){} } }
}
function econOwnSync(){
  const sh = document.getElementById('eco-own-sheet'); if(!sh) return;
  const st = document.getElementById('eco-own-stage'); if(st) st.setAttribute('data-own', econOwnPart);
  Array.prototype.forEach.call(sh.querySelectorAll('.own-tab'), b=>{ const on = b.getAttribute('data-own') === econOwnPart; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    if(on && !econCalm()){ b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); setTimeout(()=>b.classList.remove('is-pop'), 600); } });
  Array.prototype.forEach.call(sh.querySelectorAll('.own-panel'), p=>{ const on = p.getAttribute('data-own') === econOwnPart; p.classList.toggle('is-on', on); p.hidden = !on; if(!on) p.classList.remove('is-part-in'); });
}
/* لوحة المفاتيح (نمط Tabs في WAI-ARIA، تفعيل تلقائي): أعلى/أسفل (والأسهم الأفقية) بين الأقسام · Home/End */
function econOwnKey(ev){
  const keys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End']; if(keys.indexOf(ev.key) === -1) return;
  const L = econOwnSections().map(d=>d.key), i = Math.max(0, L.indexOf(econOwnPart)); let j = i;
  if(ev.key === 'Home') j = 0; else if(ev.key === 'End') j = L.length - 1;
  else if(ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') j = (i + 1) % L.length;   /* RTL: اليسار = التالي */
  else j = (i - 1 + L.length) % L.length;
  ev.preventDefault(); econOwnSetPart(L[j], { focus:true });
}
function econOwnScrollSave(){ const st = document.getElementById('eco-own-stage'); if(st && econOwnPart) econOwnScroll[econOwnPart] = st.scrollTop; }
function econOwnRestore(){
  const st = document.getElementById('eco-own-stage'); if(!st) return;
  const k = econOwnPart, px = econOwnScroll[k] || 0; st.scrollTop = px;
  if(px) requestAnimationFrame(()=>{ const s2 = document.getElementById('eco-own-stage'); if(s2 && econOwnPart === k && Math.abs(s2.scrollTop - px) > 1) s2.scrollTop = px; });   /* بعد ملاءمة البطاقات */
}
function econOwnBindOnce(){
  if(econOwnBound) return; const box = document.getElementById('eco-store-body'); if(!box) return; econOwnBound = true;
  box.addEventListener('scroll', e=>{ const t = e.target; if(t && t.id === 'eco-own-stage' && econOwnPart) econOwnScroll[econOwnPart] = t.scrollTop; }, { passive:true, capture:true });
}
/* توافق: الاستدعاءات القديمة (معرّفات الأقسام القديمة) تبدّل القسم بدل التمرير لعنوانه */
function econOwnJump(id){
  const map = { 'own-items':'cards', 'own-pouches':'pouches', 'own-cosmetics':'cosmetics', 'own-boxes':'boxes' };
  econOwnSetPart(map[id] || id);
}
/* قسم الكروت الموحّد: المكافآت ثم بطاقات التجاوز ثم بطاقات العطلة (الصالحة ثم المنتهية المعروضة) — كل نوع بأزراره وقواعده كما كانت */
function econOwnCardsHtml(T){
  const owned = CodisInventory.owned().slice().sort((a,b)=>a.acquiredAt < b.acquiredAt ? 1 : a.acquiredAt > b.acquiredAt ? -1 : 0);
  const sm = econSelMode;
  const pt = econPassTilesHtml(owned.length), ht = hcdInvTilesHtml(owned.length + pt.n);
  if(!owned.length && !pt.html && !ht.any) return '';
  const sellable = owned.filter(it=>CodisInventory.sellValue(it) > 0), dp = CodisEconomy.dupPlan(), busy0 = econSellBusy;
  let html = '<section class="own-part" id="own-items" aria-labelledby="own-items-h"><div class="own-sub"><span id="own-items-h" role="heading" aria-level="5">الكروت</span><span class="own-sub-n">' + econFmt(T.cards) + '</span>' +
    (T.hcDead ? '<span class="own-sub-x" title="بطاقات عطلة منتهية — تُفكَّك فقط">منها ' + econFmt(T.hcDead) + ' منتهية</span>' : '') +
    (owned.length ? '<div class="own-tools" role="group" aria-label="خيارات البيع">' +
    (sm ? '<button type="button" class="chip-act own-all" ' + (busy0 ? 'disabled' : '') + ' onclick="econSelAll()">تحديد الكل</button>' : '') +
    '<button type="button" class="btn btn-secondary own-dup" ' + (dp.count && !busy0 ? '' : 'disabled aria-disabled="true"') + ' onclick="econSellDuplicates()">' + codisIcon('coin') + '<span>' + (dp.count ? 'المكررات · ' + econFmt(dp.count) : 'المكررات') + '</span></button>' +
    '<button type="button" class="btn btn-secondary own-multi" aria-pressed="' + (sm ? 'true' : 'false') + '" ' + (busy0 || (!sm && !sellable.length) ? 'disabled aria-disabled="true"' : '') + ' onclick="econSelToggleMode()"><span>' + (sm ? 'إلغاء' : 'تحديد') + '</span></button>' +
    '</div>' : '') + '</div><div class="shop-grid" role="list">';
  owned.forEach((it, i)=>{
    const sv = CodisInventory.sellValue(it), busy = econSellBusy, can = sv > 0 && !codisTimerBlocksSell(it.uid), on = !!econSelSet[it.uid], uid = escapeHtml(it.uid);
    const art = econPackTileHtml({ id:it.uid, room:it.room, name:it.name, stickerId:it.stickerId, rewardId:it.rewardId, fin:it.fin, source:it.source }, { id:it.rarity, name:it.rarityName, tone:it.rarityTone, order:it.rarityOrder }).replace(' role="listitem"', '');   /* نفس بطاقة المتجر والبكج */
    const dur = codisDurBadgeHtml(it);
    const cap = '<div class="st-cap' + (dur ? ' has-dur' : '') + '"><span class="shop-name' + codisNameCls(it.name) + '" dir="auto" title="' + escapeHtml(it.name) + '">' + escapeHtml(it.name) + '</span>' + dur + '</div>';
    if(sm){
      const inner = '<div class="own-art">' + art + (can ? '<span class="own-check" aria-hidden="true">' + (on ? ICONS.check : '') + '</span>' : '') + '</div>' + cap;
      html += '<div class="shop-card st-tile is-selectable' + (can ? '' : ' is-nosell') + (on ? ' is-sel' : '') + ' rar-' + escapeHtml(it.rarityTone) + '" data-uid="' + uid + '" style="--i:' + i + '" ' +
        (can ? 'role="button" tabindex="0" aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + escapeHtml(it.name + ' — ' + econFmt(sv) + ' كوين') + '" onclick="econSelToggle(\'' + uid + '\')" onkeydown="econSelKey(event, \'' + uid + '\')"' : 'role="listitem" aria-disabled="true"') + '>' + inner +
        (can ? '<div class="own-pick"><span class="own-pick-t">' + (on ? 'محدّدة' : 'تحديد') + '</span><span class="own-pick-v">' + econCoin(sv) + '</span></div>' : '<div class="own-pick is-off">لا تُباع</div>') + '</div>';
    } else {
      const back = codisCardBackHtml(it.name, [['الفئة', (codisSlotOf(it) || { label:(it.room === 'learn' ? codisTeacherTierById(codisTeacherTierOf(it)).ar : it.rarityName) }).label], ['المصدر', econSourceLabel(it)], ['التاريخ', formatArDate(it.acquiredAt)], ['البيع', can ? econCoin(sv) : 'لا تُباع', '', can]], { tone:it.rarityTone, kind:(it.scope === 'weekly' ? 'weekly' : it.scope === 'monthly' ? 'monthly' : 'reward'), sticker:it.stickerId });   /* CODIS-PAPER-BACK */
      html += '<div class="shop-card st-tile rar-' + escapeHtml(it.rarityTone) + '" role="listitem" data-uid="' + uid + '" style="--i:' + i + '">' + codisFlipHtml('<div class="own-art">' + art + '</div>', back, { label:it.name + ' — ' + it.rarityName }) + cap +
        '<div class="shop-acts">' + codisOwnUseBtnHtml(it, uid, busy) + '<button type="button" class="btn btn-secondary own-sell" ' + (can && !busy ? '' : 'disabled aria-disabled="true"') + ' aria-label="' + escapeHtml((can ? 'بيع ' + it.name + ' — ' + econFmt(sv) + ' كوين' : it.name + ' — غير قابلة للبيع')) + '" onclick="econSell(\'' + uid + '\')">' + (can ? codisIcon('coin') + '<span>بيع · ' + econFmt(sv) + '</span>' : '<span>لا تُباع</span>') + '</button></div></div>';
    }
  });
  html += pt.html + ht.html + '</div>';
  if(sm){
    const plan = CodisEconomy.sellPlan(Object.keys(econSelSet));
    html += '<div class="own-bar" role="region" aria-live="polite" aria-label="البيع الجماعي"><div class="own-bar-sum"><span>المحدد <b class="own-bar-n">' + econFmt(plan.list.length) + '</b></span><span>الإجمالي <b class="own-bar-total">' + econCoin(plan.total) + '</b></span></div>' +
      '<button type="button" class="btn btn-primary own-bar-sell" ' + (plan.list.length && !busy0 ? '' : 'disabled aria-disabled="true"') + ' onclick="econSellSelected()">' + codisIcon('coin') + '<span>بيع المحدد</span></button></div>';
  }
  return html + '</section>';
}
function econOwnBoxesHtml(T){
  if(!T.boxes) return '';
  return '<section class="own-part" id="own-boxes" aria-labelledby="own-boxes-h"><div class="own-sub"><span id="own-boxes-h" role="heading" aria-level="5">البكجات المغلقة</span><span class="own-sub-n">' + econFmt(T.boxes) + '</span></div><div class="st-grid" role="list">' +
    CodisBoxes.tiers().map((t, i)=>{ const c = CodisBoxes.owned(t.id).length; if(!c) return '';
      return '<div class="st-tile bx-own-tile" role="listitem" data-tone="' + t.tone + '" style="--i:' + i + '"><button type="button" class="store-open" aria-haspopup="dialog" aria-label="' + escapeHtml('فتح ' + t.name + ' — لديك ' + econFmt(c)) + '" onclick="econOwnOpenBox(\'' + t.id + '\')">' +
        '<span class="bx-art">' + econBoxArt(t.index) + '</span>' + (c > 1 ? '<span class="st-n" dir="ltr">×' + econFmt(c) + '</span>' : '') + '</button>' +
        '<div class="st-cap"><span class="shop-name" dir="auto">' + escapeHtml(t.name) + '</span></div><div class="shop-acts"><button type="button" class="btn btn-achievement own-use" onclick="econOwnOpenBox(\'' + t.id + '\')">افتح</button></div></div>';
    }).join('') + '</div></section>';
}
/* يبقى للتوافق (كان يبني كل الأقسام عمودياً): كل الأقسام بالترتيب */
function econInventoryHtml(){
  econSelPrune(); const T = econOwnTotals();
  return econOwnSections().map(d=>{ try{ return econOwnCount(d, T) ? d.html(T) : ''; }catch(e){ return ''; } }).join('');
}
