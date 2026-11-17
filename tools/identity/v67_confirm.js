/* ================= CODIS-V67 · ثيمات نوافذ الموافقة (Confirmation Dialog Themes) =================
   أربعة منتجات تجميلية مستقلة تماماً (ليست عائلة ولا ثيمات غرف): الترابي · المائي · الناري · الرياحي.
   • البيانات: data.inventory.confirmThemes = { owned:[{id, source, sourceRef, acquiredAt, paid}], equipped:'<id>' | '' } — خانة تجهيز واحدة لنوافذ الموافقة،
     لا علاقة لها بـplanThemes.equippedByTarget (الغرف). '' = مظهر الموافقة الأصلي.
   • الشراء: CodisWallet.transact واحدة (PURCHASE_COSMETIC بمرجع confirmtheme|<id>) — نفس محفظة الفضة، لا نظام موازٍ؛ heal() يسترجع ملكية معاملة محفوظة.
   • التطبيق: codisConfirm() وحدها تضع data-cfx على #codis-confirm-modal عند كل فتح (المعيار الهندسي: النافذة طلب قرار عبر codisConfirm، وopts.notice يستثني
     الإشعارات المعلوماتية). كل CSS الثيمات محصور بـ:is(#codis-confirm-modal, .cfx-pv)[data-cfx] — لا أثر على أي نافذة أخرى.
   • المعاينة: نسخة من بنية النافذة نفسها بلا معرّفات ولا أفعال ولا صوت نافذة، داخل نافذة تفاصيل المتجر، تُزال كاملة عند الإغلاق. */
const CODIS_CONFIRM_THEME_DEFS = [
  { id:'earthConfirm', key:'earth', name:'Earth', ar:'الترابي', silver:2499, rarity:'epic', rarityAr:'ملحمي',
    tag:'حجر رملي مصقول وطبقات أرضية',
    desc:'نافذة موافقة من خامات الأرض: حجر رملي مصقول بدفء ناعم، وشريط طبقات جيولوجية بدرجات الطين والتراب، وأيقونة حصاة، وأزرار تنضغط كالحجر. ثبات وهدوء وأصالة.' },
  { id:'waterConfirm', key:'water', name:'Water', ar:'المائي', silver:2999, rarity:'epic', rarityAr:'ملحمي',
    tag:'ماء صافٍ وانعكاسات وتموجات',
    desc:'نافذة موافقة من الماء الصافي: تدرجات سماوية وتركوازية شفافة، وانعكاسات ضوء وتموجات ناعمة وقطرات، وأيقونة قطرة تنداح منها موجة، وأزرار تتموّج عند الضغط.' },
  { id:'fireConfirm', key:'fire', name:'Fire', ar:'الناري', silver:3499, rarity:'legendary', rarityAr:'أسطوري',
    tag:'جمر فحمي وحواف متوهجة',
    desc:'نافذة موافقة من الجمر: سطح فحمي عميق بحرارة خافتة من الأسفل، وحافة علوية كمعدن متوهج، وأيقونة جمرة، وزر تأكيد ناري تتطاير منه شرارات قليلة عند الضغط — بنص واضح تماماً.' },
  { id:'windConfirm', key:'wind', name:'Wind', ar:'الرياحي', silver:2799, rarity:'epic', rarityAr:'ملحمي',
    tag:'نسيم لؤلؤي وخطوط انسيابية',
    desc:'أخف نوافذ الموافقة: أبيض لؤلؤي وسماوي فاتح وفضي، وخطوط رياح انسيابية تنساب مرة واحدة عند الظهور، وأيقونة دوّامة نسيم، وأزرار بيضاوية تعبرها لمعة هواء عند الضغط.' }
].map(d=>Object.freeze(d));
const CodisConfirmThemes = (function(){
  const DEFS = CODIS_CONFIRM_THEME_DEFS;
  /* حالة بإصلاح ذاتي آمن (لا ترمي) */
  function st(){
    const inv = data.inventory; let t = inv.confirmThemes;
    if(!t || typeof t !== 'object' || Array.isArray(t)) t = inv.confirmThemes = { owned:[], equipped:'' };
    if(!Array.isArray(t.owned)) t.owned = []; if(typeof t.equipped !== 'string') t.equipped = '';
    return t;
  }
  function def(id){ return DEFS.find(d=>d.id === id) || null; }
  function rec(id){ return st().owned.find(x=>x && x.id === id) || null; }
  function owns(id){ return !!(def(id) && rec(id)); }
  function owned(){ return DEFS.filter(d=>owns(d.id)); }
  /* معاملة شراء محفوظة بلا سجل ملكية (انقطاع بين الخطوتين) ⇒ تُسترجع الملكية بلا خصم جديد */
  function heal(){
    let n = 0; try{ CodisWallet.silverTxs().forEach(t=>{ const m = /^confirmtheme\|(.+)$/.exec(t && t.type === 'PURCHASE_COSMETIC' ? String(t.referenceId || '') : '');
      if(m && def(m[1]) && !rec(m[1])){ st().owned.push({ id:m[1], source:'store', sourceRef:String(t.id || ''), acquiredAt:t.createdAt || econNowIso(), paid:Math.abs(Number(t.amount) || 0) }); n++; } }); }catch(e){}
    return n;
  }
  /* المجهّز = مملوك ومعروف فقط (لا يُطبَّق شيء لو عُبث بالبيانات) */
  function equippedId(){ const id = st().equipped; return (id && def(id) && owns(id)) ? id : ''; }
  function isEquipped(id){ return !!id && equippedId() === id; }
  function price(id){ const d = def(id); return d ? d.silver : 0; }
  function buy(id){
    const d = def(id); if(!d) return { ok:false, reason:'invalid' };
    if(owns(id)) return { ok:false, reason:'owned' };
    const bal = CodisWallet.silverBalance(); if(!CodisLimits.afford(bal, d.silver)) return { ok:false, reason:'insufficient', need:d.silver - bal, price:d.silver };
    return CodisWallet.transact([], ()=>{
      if(rec(d.id)) return { ok:false, reason:'owned' };
      const tx = CodisWallet.applySilver('PURCHASE_COSMETIC', -d.silver, 'شراء ثيم نوافذ الموافقة ' + d.ar + ' (' + d.name + ')', 'store', 'confirmtheme|' + d.id, { name:d.name, confirmTheme:d.id });
      if(!tx) return { ok:false, reason:'tx' };
      st().owned.push({ id:d.id, source:'store', sourceRef:tx.id, acquiredAt:econNowIso(), paid:d.silver });
      return { ok:true, def:d, price:d.silver, tx:tx };
    });
  }
  /* خانة واحدة: تجهيز ثيم يستبدل السابق؛ الإزالة ترجع المظهر الأصلي. من «بحوزتك» فقط (نفس قاعدة V60) */
  function equip(id, ctx){
    if(ctx !== 'own') return { ok:false, reason:'context' };
    const d = def(id); if(!d) return { ok:false, reason:'invalid' }; if(!owns(id)) return { ok:false, reason:'notowned' };
    if(isEquipped(id)) return { ok:true, def:d, same:true };
    return CodisWallet.transact([], ()=>{ st().equipped = d.id; return { ok:true, def:d }; });
  }
  function unequip(ctx){
    if(ctx !== 'own') return { ok:false, reason:'context' };
    if(!st().equipped) return { ok:true, same:true };
    return CodisWallet.transact([], ()=>{ st().equipped = ''; return { ok:true }; });
  }
  return { defs:()=>DEFS.slice(), def, owns, owned, heal, equippedId, isEquipped, price, buy, equip, unequip };
})();
/* يُستدعى من codisConfirm عند كل فتح: notice = نافذة معلوماتية (لا قرار) ⇒ المظهر الأصلي */
function codisConfirmThemeMark(modal, opts){
  if(!modal) return;
  let id = '';
  try{ id = (opts && opts.notice) ? '' : CodisConfirmThemes.equippedId(); }catch(e){ id = ''; }
  if(id) modal.setAttribute('data-cfx', id); else modal.removeAttribute('data-cfx');
}
function codisCfCalm(){ try{ return !!(window.CODIS_REDUCED_MOTION || document.documentElement.classList.contains('sx-calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); }catch(e){ return false; } }
/* استجابة الضغط (موجة الماء · شرارات النار · غبار الحجر · لمعة الهواء): مستمع واحد مفوَّض يُسجَّل مرة واحدة، passive، لا يمنع شيئاً.
   الصنف cf-hit يبقى حتى تكتمل الحركة (اللمسة القصيرة على الهاتف لا تقطعها) ثم يُزال؛ لا حلقات ولا مستمعات لكل زر. */
document.addEventListener('pointerdown', ev=>{
  try{
    const b = ev.target && ev.target.closest ? ev.target.closest('[data-cfx] .confirm-modal .modal-actions > .btn') : null;
    if(!b || b.disabled || codisCfCalm()) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--cf-x', Math.round(ev.clientX - r.left) + 'px'); b.style.setProperty('--cf-y', Math.round(ev.clientY - r.top) + 'px');
    b.classList.remove('cf-hit'); void b.offsetWidth; b.classList.add('cf-hit');
    clearTimeout(b._cfHitT); b._cfHitT = setTimeout(()=>{ b.classList.remove('cf-hit'); b.style.removeProperty('--cf-x'); b.style.removeProperty('--cf-y'); }, 720);
  }catch(e){}
}, { capture:true, passive:true });

/* ---------- المتجر: بطاقات مستقلة (ليست عائلة) ---------- */
function econCfMiniHtml(d){
  return '<span class="cf-mini" data-cfx="' + d.id + '" aria-hidden="true"><span class="cf-mini-sh"><i class="cf-mini-ic"></i><i class="cf-mini-t"></i><i class="cf-mini-l"></i><i class="cf-mini-l is-s"></i>' +
    '<span class="cf-mini-acts"><i class="cf-mini-ok"></i><i class="cf-mini-no"></i></span></span></span>';
}
function econConfirmThemeTileHtml(d, i, inInv){
  const C = CodisConfirmThemes, own = C.owns(d.id), on = C.isEquipped(d.id), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver);
  const badge = on ? '<span class="pt-mbadge is-on">مجهّز</span>' : own ? '<span class="pt-mbadge is-own">' + (inInv ? 'غير مجهّز' : 'تملكه') + '</span>'
    : '<span class="pt-mbadge is-price' + (ok ? '' : ' is-short') + '">' + econSilver(d.silver) + '</span>';
  const lab = 'ثيم نوافذ الموافقة ' + d.ar + ' (' + d.name + ') · ' + d.rarityAr + ' · ' + (on ? 'مجهّز الآن' : own ? 'تملكه' : econFmt(d.silver) + ' فضة') + ' — افتح المعاينة والتفاصيل';
  return '<div class="st-tile pt-mtile cf-tile' + (own ? ' is-own' : '') + (on ? ' is-on' : '') + (ok ? '' : ' is-short') + '" role="listitem" data-cfid="' + d.id + '" style="--i:' + (i || 0) + '">' +
    '<button type="button" class="pt-mbtn" aria-haspopup="dialog" aria-label="' + escapeHtml(lab) + '" onclick="codisCfPreview(\'' + d.id + '\', this)">' +
    econCfMiniHtml(d) + '<span class="pt-mname">' + escapeHtml(d.ar) + '<small dir="ltr">' + escapeHtml(d.name) + '</small></span>' + badge + '</button></div>';
}
function econConfirmThemesShopHtml(){
  try{ if(CodisConfirmThemes.heal()) saveData(); }catch(e){}
  return '<section class="pt-fam cf-sec" id="eco-confirm-themes" data-family="confirmThemes" aria-labelledby="cf-h"><header class="pt-fam-head">' +
    '<h5 class="pt-fam-ar" id="cf-h">ثيمات نوافذ الموافقة</h5><span class="pt-fam-en" dir="ltr">Confirmation Themes</span>' +
    '<p class="pt-fam-desc">أربعة منتجات مستقلة، كل واحد يُشترى وحده بسعره. الثيم المجهّز يلبّس كل نوافذ الموافقة والتأكيد بالتطبيق (الحذف، الشراء، الإجراءات المهمة) — ولا يمسّ الغرف ولا بقية النوافذ.</p></header>' +
    '<div class="pt-grid cf-grid" role="list">' + CodisConfirmThemes.defs().map((d, i)=>econConfirmThemeTileHtml(d, i, false)).join('') + '</div></section>';
}
function econConfirmThemesInvHtml(){
  try{ if(CodisConfirmThemes.heal()) saveData(); }catch(e){}
  const list = CodisConfirmThemes.owned(); if(!list.length) return '';
  return '<section class="own-part" id="own-confirm-themes" aria-labelledby="own-cf-h"><div class="own-sub"><span id="own-cf-h" role="heading" aria-level="5">ثيمات نوافذ الموافقة</span><span class="own-sub-n">' + econFmt(list.length) + '</span></div>' +
    '<div class="pt-fams is-own"><section class="pt-fam cf-sec" data-family="confirmThemes"><div class="pt-grid cf-grid" role="list">' + list.map((d, i)=>econConfirmThemeTileHtml(d, i, true)).join('') + '</div></section></div></section>';
}
async function econConfirmThemeBuy(id){
  if(econStoreBusy) return; econStoreBusy = true; codisCfOvSync();
  try{
    const C = CodisConfirmThemes, d = C.def(id);
    if(!d){ codisSfx('invalid', { ctx:'funds' }); showToast('الثيم غير متاح', 'var(--warning)'); return; }
    try{ if(C.heal()) saveData(); }catch(e){}
    if(C.owns(id)){ codisSfx('invalid', { ctx:'funds' }); showToast('تملك ثيم «' + d.ar + '» من قبل — جهّزه من «بحوزتك»', 'var(--warning)'); return; }
    const sv = CodisWallet.silverBalance();
    if(!CodisLimits.afford(sv, d.silver)){ codisSfx('invalid', { ctx:'funds' }); showToast('ما عندك فضة كافية', 'var(--warning)'); return; }
    const ok = await codisConfirm({ title:'شراء ثيم نوافذ الموافقة «' + d.ar + '»؟', message:'السعر ' + econFmt(d.silver) + ' فضة · رصيدك ' + econFmt(sv) + ' فضة · المتبقي بعد الشراء ' + econFmt(Math.max(0, sv - d.silver)) + ' فضة. رصيد الكوينز ما يتأثر.',
      detail:'منتج مستقل: شراؤه لا يفتح بقية ثيمات الموافقة، وتجهيزه من «بحوزتك» يغيّر نوافذ التأكيد فقط.', icon:'gift', confirmText:'شراء', danger:false });
    if(!ok) return;
    const r = C.buy(id);
    if(r.ok){ codisSfx('store.buy', { ctx:'cosmetic' }); showToast('تم الشراء: ثيم ' + d.ar + ' لنوافذ الموافقة (−' + econFmt(r.price) + ' فضة) — جهّزه من «بحوزتك»', 'var(--success)', 'gift'); CodisEvents.emit('ECON_PURCHASE', { name:d.name, price:0, silver:r.price }); }
    else { codisSfx('invalid', { ctx:'funds' }); showToast(r.reason === 'insufficient' ? 'ما عندك فضة كافية' : r.reason === 'owned' ? 'تملك هذا الثيم من قبل' : r.reason === 'save' ? 'تعذّر الحفظ — لم يُخصم شيء' : 'تعذّر الشراء — لم يُخصم شيء', 'var(--warning)'); }
  } finally { econStoreBusy = false; econRenderAll(); codisCfOvSync(true); }
}
function econConfirmThemeToggle(id, ctx){
  if(econStoreBusy) return;
  const C = CodisConfirmThemes, d = C.def(id); if(!d) return;
  if(ctx !== 'own' || !econOwnOpen){ codisSfx('invalid', { ctx:'unavailable' }); showToast('التجهيز من «بحوزتك» فقط', 'var(--warning)'); return; }
  const on = C.isEquipped(id), r = on ? C.unequip('own') : C.equip(id, 'own');
  if(!r.ok){ codisSfx('invalid', { ctx:'unavailable' }); showToast(r.reason === 'notowned' ? 'ما تملك هذا الثيم' : r.reason === 'save' ? 'تعذّر الحفظ — بقيت النوافذ كما هي' : 'تعذّر التطبيق', 'var(--warning)'); codisCfOvSync(true); return; }
  codisSfx(on ? 'close' : 'reward.achievement', { ctx:'card' });
  showToast(on ? 'أُزيل ثيم ' + d.ar + ' — رجعت نوافذ الموافقة لشكلها الأصلي' : 'تم تجهيز ثيم ' + d.ar + ' على كل نوافذ الموافقة', on ? 'var(--text-2)' : 'var(--success)', on ? undefined : 'gift');
  econRenderAll(); codisCfOvSync(true);
}

/* ---------- نافذة التفاصيل + المعاينة الحية ---------- */
let codisCfEl = null, codisCfFocus = null, codisCfId = '', codisCfCtx = 'store', codisCfActAt = 0, codisCfToneCur = 'danger';
const CODIS_CF_SAMPLES = {
  danger:{ title:'تأكيد الحذف', msg:'هل أنت متأكد من رغبتك في حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.', ok:'تأكيد الحذف', icon:'warning' },
  neutral:{ title:'تأكيد الشراء', msg:'يتسحب ٢٬٤٩٩ فضة من رصيدك ويصير رصيدك ٧٬٥٠١ فضة.', ok:'شراء', icon:'gift' }
};
/* بنية نافذة الموافقة نفسها (نفس الأصناف) بلا معرّفات: الـCSS نفسه يرسمها كما ستظهر بعد التجهيز. aria-hidden: عرض بصري لا عناصر تحكم حقيقية */
function codisCfSampleHtml(d, tone){
  const S = CODIS_CF_SAMPLES[tone] || CODIS_CF_SAMPLES.danger, dg = tone !== 'neutral';
  return '<div class="cfx-pv" data-cfx="' + d.id + '" aria-hidden="true"><div class="cfx-pv-scrim"></div><div class="modal confirm-modal">' +
    '<div class="discipline-modal-head"><div class="discipline-modal-icon confirm-modal-icon ' + (dg ? 'is-danger' : 'is-neutral') + '">' + codisIcon(S.icon, { size:'lg' }) + '</div><h3>' + escapeHtml(S.title) + '</h3></div>' +
    '<p class="cfx-pv-msg">' + escapeHtml(S.msg) + '</p>' +
    '<div class="modal-actions"><button type="button" tabindex="-1" class="btn ' + (dg ? 'btn-destructive' : 'btn-primary') + '">' + escapeHtml(S.ok) + '</button><button type="button" tabindex="-1" class="btn btn-secondary">إلغاء</button></div></div></div>';
}
function codisCfOvDynHtml(d){
  const C = CodisConfirmThemes, own = C.owns(d.id), on = C.isEquipped(d.id), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver), busy = econStoreBusy;
  const cur = C.equippedId(), curD = cur && cur !== d.id ? C.def(cur) : null;
  if(own && codisCfCtx !== 'own'){
    const st2 = on ? '<span class="pt-ov-st is-on">مجهّز على نوافذ الموافقة</span>' : '<span class="pt-ov-st is-own">مملوك</span>';
    return '<div class="pt-ov-state">' + st2 + '</div><p class="pt-ov-note">' + escapeHtml(on ? 'تغيير التجهيز أو إزالته من «بحوزتك» ← المظاهر.' : 'تملكه — جهّزه من «بحوزتك» ← المظاهر.') + '</p>' +
      '<button type="button" class="pt-ov-act is-off" data-act="goown"' + (busy ? ' disabled aria-disabled="true"' : '') + ' aria-label="' + escapeHtml('افتح «بحوزتك» لتجهيز ثيم ' + d.ar) + '" onclick="codisCfGoOwn(\'' + d.id + '\')">افتح «بحوزتك» للتجهيز</button>';
  }
  const state = on ? '<span class="pt-ov-st is-on">مجهّز الآن على نوافذ الموافقة</span>' : own ? '<span class="pt-ov-st is-own">تملكه — غير مجهّز</span>'
    : '<span class="pt-ov-st">غير مملوك</span><span class="pt-ov-price">' + econSilver(d.silver) + '<small>فضة</small></span>';
  const note = on ? 'كل نوافذ الموافقة تظهر الآن بهذا الثيم. الإزالة ترجعها لتصميمها الأصلي.'
    : own ? (curD ? 'تجهيزه يستبدل ثيم «' + curD.ar + '» على نوافذ الموافقة.' : 'مملوك دائماً — تجهيزه يغيّر نوافذ الموافقة فقط، بلا أي شراء إضافي.')
    : ok ? 'رصيدك ' + econFmt(sv) + ' فضة · المتبقي بعد الشراء ' + econFmt(Math.max(0, sv - d.silver)) + ' فضة.' : 'رصيدك ' + econFmt(sv) + ' فضة.';
  const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة';
  return '<div class="pt-ov-state">' + state + '</div><p class="pt-ov-note' + (!own && !ok ? ' is-short' : '') + '">' + escapeHtml(note) + '</p>' +
    '<button type="button" class="pt-ov-act' + (on ? ' is-off' : '') + '" data-act="' + (on ? 'unequip' : own ? 'equip' : 'buy') + '"' + (busy ? ' disabled aria-disabled="true"' : '') +
    ' aria-label="' + escapeHtml(lab + ' — ثيم نوافذ الموافقة ' + d.ar + (!own ? ' · ' + econFmt(d.silver) + ' فضة' : '')) + '" onclick="codisCfAct(\'' + d.id + '\')">' + lab + (!own ? ' <span class="pt-ov-act-p">' + econFmt(d.silver) + '</span>' : '') + '</button>';
}
function codisCfOvSync(refocus){
  const el = codisCfEl, d = el && CodisConfirmThemes.def(codisCfId); if(!d) return;
  const box = el.querySelector('.pt-ov-dyn'); if(!box) return;
  const had = refocus && (el.contains(document.activeElement) || document.activeElement === document.body || !document.activeElement);
  box.innerHTML = codisCfOvDynHtml(d);
  if(had){ const b = box.querySelector('.pt-ov-act'); if(b && !b.disabled){ try{ b.focus({ preventScroll:true }); }catch(e){} } else { const x = el.querySelector('.pt-ov-x'); if(x){ try{ x.focus({ preventScroll:true }); }catch(e){} } } }
}
function codisCfAct(id){
  const now = Date.now(); if(now - codisCfActAt < 500 || econStoreBusy) return; codisCfActAt = now;
  const C = CodisConfirmThemes; if(!C.def(id)) return;
  if(!C.owns(id)) econConfirmThemeBuy(id); else econConfirmThemeToggle(id, codisCfCtx);
}
/* تبديل نموذج المعاينة (حذف/شراء) في مكانه — لا إعادة بناء للنافذة */
function codisCfTone(tone){
  const el = codisCfEl, d = el && CodisConfirmThemes.def(codisCfId); if(!d) return;
  tone = tone === 'neutral' ? 'neutral' : 'danger'; if(tone === codisCfToneCur) return; codisCfToneCur = tone;
  const st = el.querySelector('.cf-stage'); if(st) st.innerHTML = codisCfSampleHtml(d, tone);
  el.querySelectorAll('.cf-tone-b').forEach(b=>{ const on = b.getAttribute('data-tone') === tone; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
}
function codisCfGoOwn(id){
  codisCfClose(true);
  try{ if(!econOwnOpen) econOpenVault(); }catch(e){}
  let k = 0; const go = ()=>{ try{ if(econOwnPart !== 'cosmetics') econOwnSetPart('cosmetics', { quiet:true }); const b = Array.prototype.find.call(document.querySelectorAll('#own-panel-cosmetics .cf-tile[data-cfid="' + id + '"] .pt-mbtn'), x=>x.offsetParent !== null);
    if(b){ b.scrollIntoView({ block:'center' }); b.focus({ preventScroll:true }); if(document.activeElement === b) return; } }catch(e){} if(++k < 12) setTimeout(go, 120); };
  setTimeout(go, 60);
}
function codisCfPreview(id, opener){
  const d = CodisConfirmThemes.def(id); if(!d) return;
  codisCfClose(true);
  codisCfFocus = opener || document.activeElement; codisCfId = d.id; codisCfToneCur = 'danger';
  codisCfCtx = (opener && opener.closest && opener.closest('#eco-own-sheet')) ? 'own' : 'store';
  const el = document.createElement('div');
  el.className = 'pt-ov cf-ov'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'cf-ov-ttl'); el.setAttribute('aria-describedby', 'cf-ov-desc'); el.setAttribute('data-ctx', codisCfCtx); el.setAttribute('data-cf', d.id);
  el.innerHTML = '<div class="pt-ov-bg" onclick="codisCfClose()"></div><div class="pt-ov-card">' +
    '<div class="pt-ov-head"><div class="pt-ov-chips"><span class="pt-rar">' + escapeHtml(d.rarityAr) + '</span><span class="pt-ov-room">نوافذ الموافقة</span></div><button type="button" class="pt-ov-x" aria-label="إغلاق التفاصيل" onclick="codisCfClose()">' + codisIcon('close') + '</button></div>' +
    '<div class="pt-ov-name" id="cf-ov-ttl"><b>' + escapeHtml(d.ar) + '</b><span dir="ltr">' + escapeHtml(d.name) + '</span></div>' +
    '<div class="cf-tone" role="group" aria-label="نموذج المعاينة"><button type="button" class="cf-tone-b is-on" data-tone="danger" aria-pressed="true" onclick="codisCfTone(\'danger\')">نافذة حذف</button><button type="button" class="cf-tone-b" data-tone="neutral" aria-pressed="false" onclick="codisCfTone(\'neutral\')">نافذة شراء</button></div>' +
    '<div class="cf-stage" role="img" aria-label="' + escapeHtml('معاينة نافذة موافقة بثيم ' + d.ar + ' — للعرض فقط') + '">' + codisCfSampleHtml(d, 'danger') + '</div>' +
    '<dl class="pt-ov-meta"><div><dt>النوع</dt><dd>نوافذ الموافقة</dd></div><div><dt>الهوية</dt><dd>' + escapeHtml(d.tag) + '</dd></div><div><dt>الندرة</dt><dd>' + escapeHtml(d.rarityAr) + '</dd></div></dl>' +
    '<div class="pt-ov-covers"><span class="pt-ov-covers-k">يلبّس</span><ul><li>كل نوافذ الموافقة والتأكيد: الحذف · الشراء · الإجراءات المهمة · المسح والإعادة</li><li>لا يمسّ الغرف ولا المتجر ولا نوافذ المعلومات والإشعارات</li></ul></div>' +
    '<p class="pt-ov-desc" id="cf-ov-desc">' + escapeHtml(d.desc) + '</p><div class="pt-ov-dyn">' + codisCfOvDynHtml(d) + '</div></div>';
  el.addEventListener('keydown', ev=>{
    if(ev.key !== 'Tab' || !el.contains(document.activeElement)) return;
    const f = Array.prototype.filter.call(el.querySelectorAll('button:not([disabled]):not([tabindex="-1"])'), b=>b.offsetParent !== null); if(!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if(ev.shiftKey && document.activeElement === a){ ev.preventDefault(); z.focus(); } else if(!ev.shiftKey && document.activeElement === z){ ev.preventDefault(); a.focus(); }
  });
  document.body.appendChild(el); codisCfEl = el; codisSfx('open', { ctx:'store' });
  requestAnimationFrame(()=>{ if(codisCfEl !== el) return; el.classList.add('is-in'); const x = el.querySelector('.pt-ov-x'); if(x){ try{ x.focus({ preventScroll:true }); }catch(e){} } });
}
function codisCfClose(silent){
  const el = codisCfEl; if(!el) return; codisCfEl = null;
  if(!silent) codisSfx('close', { ctx:'store' });
  el.remove();
  let f = codisCfFocus; const id = codisCfId; codisCfFocus = null; codisCfId = '';
  if(!(f && f.isConnected) && id){ f = Array.prototype.find.call(document.querySelectorAll('.cf-tile[data-cfid="' + id + '"] .pt-mbtn'), b=>b.offsetParent !== null) || null; }
  if(f && f.isConnected){ try{ f.focus({ preventScroll:true }); }catch(e){} }
}
document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && codisCfEl && !(document.getElementById('codis-confirm-modal') && CodisMotion.isOpen(document.getElementById('codis-confirm-modal')))){ ev.stopPropagation(); codisCfClose(); } }, true);
