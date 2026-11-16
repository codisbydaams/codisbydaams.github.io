/* ================= CODIS-V56: ثيمات غرفة التخطيط (Skins لمربع «لا خطة» #planning-empty) =================
   نظام مستقل عن CodisCosmetics (مظاهر البطاقات): سجل تعريفات + ملكية/تجهيز في data.inventory.planThemes + شراء بالفضة فقط.
   • التعريف (CODIS_PLAN_THEME_DEFS): معرّف ثابت · اسمان · وصف · سعر بالفضة · ندرة · tokens (متغيرات CSS: ألوان/خامات/أزرار)
     · art (مفتاح راسم الزخارف بـCODIS_PLAN_THEME_ART) · motion (مدد الحركة). ثيم جديد = تعريف + راسم زخارفه فقط؛ الشراء/التجهيز/المتجر/
     بحوزتك/التطبيق لا تتغير.
   • الحالة: data.inventory.planThemes = { owned:[{id,source,sourceRef,acquiredAt,paid}], equipped:'' } — '' = التصميم الأصلي.
     تُطبَّع بـeconNormPlanThemes (المعرّفات المجهولة تُحفظ كما هي لثيمات مستقبلية؛ لا يُجهَّز إلا مملوك).
   • الشراء: CodisWallet.transact واحدة = خصم فضة (PURCHASE_COSMETIC بمرجع plantheme|<id>، لا نوع معاملة جديد فلا تُسقطه نسخ أقدم)
     + تسجيل الملكية؛ فشل أيٍّ منهما أو فشل الحفظ ⇒ تراجع كامل. مرجع المعاملة يمنع الخصم مرتين مهما تكرر الضغط.
   • العرض: مكوّن واحد codisPlanThemeDecorHtml/codisPlanThemeStyle يُستعمل للمربع الحقيقي ولمعاينة المتجر/بحوزتك/النافذة الكبيرة،
     والمعاينة تأخذ نصوص المربع الحقيقي وصورته من DOM نفسه ⇒ لا نسختان تختلفان. */
const CODIS_PLAN_THEME_DEFS = [
  { id:'infernoCrystal', name:'Inferno Crystal', ar:'الجحيم الكريستالي', silver:3499, rarity:'legendary', rarityAr:'أسطوري',
    desc:'أوبسيديان أسود تشقّه عروق حمم منصهرة، بحواف كريستالية وأركان معدنية كلاسيكية — يلبسه مربع غرفة التخطيط بالكامل.',
    art:'inferno', motion:{ sheen:11, breath:6.5, glint:7 },
    tokens:{
      '--pt-bg':'radial-gradient(120% 62% at 50% 112%, rgb(255 92 24 / .26), transparent 62%), radial-gradient(70% 46% at 50% 40%, rgb(255 214 176 / .055), transparent 72%), linear-gradient(162deg, #1c1310 0%, #0d0907 42%, #0a0706 64%, #160d0a 100%)',
      '--pt-edge':'0 0 0 1px rgb(217 190 150 / .34), inset 0 0 0 1px rgb(255 224 190 / .07), inset 0 1px 0 rgb(255 236 214 / .14), 0 18px 34px -18px rgb(0 0 0 / .85), 0 22px 40px -26px rgb(255 80 20 / .45)',
      '--pt-title':'#F4D7B6', '--pt-title-glow':'0 1px 0 rgb(0 0 0 / .7), 0 0 18px rgb(255 120 40 / .26)', '--pt-copy':'#CDB8A3',
      '--pt-ea-paper':'#1d1411', '--pt-ea-ink':'#D9C2A0', '--pt-ea-line':'rgb(217 194 160 / .34)', '--pt-ea-shade':'rgb(0 0 0 / .62)', '--pt-ea-acc':'#FF8A2E', '--pt-road':'#050303', '--pt-road-edge':'rgb(255 140 60 / .22)', '--pt-gem':'#FFB565', '--pt-gem-edge':'#FFE2BF',
      '--pt-art-glow':'drop-shadow(0 0 7px rgb(255 110 30 / .38)) drop-shadow(0 2px 2px rgb(0 0 0 / .7))',
      '--pt-btn-bg':'linear-gradient(180deg, #2c1a13, #150c09) padding-box, linear-gradient(180deg, #FFC48A, #D2541F 46%, #6B1D08) border-box',
      '--pt-btn-tx':'#FFE8D0', '--pt-btn-sh':'0 0 0 1px rgb(0 0 0 / .65), inset 0 1px 0 rgb(255 226 196 / .2), 0 10px 20px -10px rgb(255 90 20 / .7)',
      '--pt-btn-sh-hover':'0 0 0 1px rgb(0 0 0 / .65), inset 0 1px 0 rgb(255 226 196 / .26), 0 0 0 3px rgb(255 140 60 / .14), 0 12px 24px -10px rgb(255 100 26 / .85)',
      '--pt-btn-sh-press':'0 0 0 1px rgb(0 0 0 / .7), inset 0 2px 8px rgb(255 90 20 / .35), 0 4px 10px -6px rgb(255 90 20 / .6)',
      '--pt-focus':'#FFB565', '--pt-frame':'rgb(217 194 160 / .2)', '--pt-chip':'#FFB565'
    } }
];
/* راسمو الزخارف: (def, uid) ⇒ HTML لطبقة .pt-decor. uid يجعل معرّفات التدرّج فريدة لكل نسخة (المربع الحقيقي والمعاينات معاً بنفس الصفحة) */
const CODIS_PLAN_THEME_ART = {
  inferno:function(d, u){
    const g = (id)=>'pt' + u + id;
    /* الأوجه: مستويات أوبسيديان كبيرة هادئة عند الأركان العليا والجانبين فقط + مستوى انعكاس زجاجي؛ الوسط والأرض خاليان (النص والحمم) */
    const facets = '<svg class="pt-facets" viewBox="0 0 400 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + g('fa') + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b1e19"/><stop offset="1" stop-color="#0d0908" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + g('fb') + '" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#261a16"/><stop offset="1" stop-color="#0d0908" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + g('rf') + '" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3e2" stop-opacity=".11"/><stop offset=".55" stop-color="#ffd9b0" stop-opacity=".03"/><stop offset="1" stop-color="#ffd9b0" stop-opacity="0"/></linearGradient></defs>' +
      '<g stroke="#ffe0bd" stroke-opacity=".05" stroke-width="1" stroke-linejoin="round">' +
      '<path d="M0 0H150L96 64L0 104Z" fill="url(#' + g('fa') + ')"/><path d="M150 0H226L168 30L96 64Z" fill="url(#' + g('fb') + ')" fill-opacity=".7"/>' +
      '<path d="M400 0H262L318 74L400 116Z" fill="url(#' + g('fb') + ')"/><path d="M262 0H226L280 44L318 74Z" fill="url(#' + g('fa') + ')" fill-opacity=".55"/>' +
      '<path d="M0 104L96 64L58 168L0 196Z" fill="url(#' + g('fb') + ')" fill-opacity=".55"/><path d="M400 116L318 74L350 184L400 210Z" fill="url(#' + g('fa') + ')" fill-opacity=".5"/>' +
      '</g><path d="M262 0H400V96L318 74Z" fill="url(#' + g('rf') + ')"/>' +
      '<g stroke="#fff1de" stroke-opacity=".1" stroke-width=".8" fill="none" stroke-linecap="round"><path d="M96 64L58 168M318 74L350 184M150 0L96 64M262 0L318 74"/></g></svg>';
    /* الحمم: شقّ رئيسي على الأرض بانحناءات طبيعية تتفرّع منه عروق تتنفّس، فوق بركة توهّج منصهرة. ثلاث طبقات لكل عرق (هالة ← حمم ← قلب) بدل blur */
    const vein = (dd, w)=>'<path class="pv-h" d="' + dd + '" stroke-width="' + (w * 6) + '"/><path class="pv-m" d="' + dd + '" stroke-width="' + (w * 2.3) + '"/><path class="pv-c" d="' + dd + '" stroke-width="' + w + '"/>';
    const lava = '<svg class="pt-lava" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + g('lv') + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF6A1A"/><stop offset=".55" stop-color="#E2391B"/><stop offset="1" stop-color="#8A1A08"/></linearGradient>' +
      '<linearGradient id="' + g('pool') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A14" stop-opacity="0"/><stop offset=".7" stop-color="#E2391B" stop-opacity=".22"/><stop offset="1" stop-color="#FF7A2A" stop-opacity=".5"/></linearGradient></defs>' +
      '<rect x="0" y="92" width="400" height="38" fill="url(#' + g('pool') + ')"/>' +
      '<g fill="none" stroke-linecap="round" stroke-linejoin="round" style="--pv:url(#' + g('lv') + ')">' +
      vein('M-4 121C26 116 40 124 66 115S110 108 132 114S170 104 196 109S236 100 262 106S300 98 326 104S366 112 404 103', 1.5) +
      vein('M66 115C70 104 62 96 70 84S80 70 76 62', .9) + vein('M196 109C204 98 198 88 208 78S222 66 220 58', 1) +
      vein('M326 104C334 94 330 84 340 74S352 64 350 56', .9) + vein('M132 114C128 104 138 98 134 88', .65) +
      vein('M262 106C258 96 268 90 264 80', .65) + vein('M24 118C20 108 28 102 24 94', .55) + vein('M380 106C376 96 384 90 380 82', .55) +
      '</g><g class="pt-embers"><circle cx="58" cy="94" r="1.2"/><circle cx="150" cy="88" r=".9"/><circle cx="238" cy="82" r="1.1"/><circle cx="300" cy="78" r=".9"/><circle cx="356" cy="90" r="1.2"/><circle cx="104" cy="76" r=".8"/></g></svg>';
    /* شقّ صغير يخرج من تحت زاوية البداية العليا */
    const crack = '<svg class="pt-crack c-ts" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round" style="--pv:url(#' + g('lv') + ')">' + vein('M120 4C108 10 104 18 98 26S90 38 82 42', .7) + '</g></svg>';
    /* الأركان: زاوية معدنية كلاسيكية بدرجتين + بلورة كهرمان بوجهين (انكسار) */
    const corner = (pos)=>'<svg class="pt-corner ' + pos + '" viewBox="0 0 56 56" aria-hidden="true" focusable="false">' +
      '<path d="M7 44V15Q7 7 15 7H44" fill="none" stroke="#D9C2A0" stroke-opacity=".62" stroke-width="1.3"/>' +
      '<path d="M12.5 40V18.5Q12.5 12.5 18.5 12.5H40" fill="none" stroke="#FF8A2E" stroke-opacity=".38" stroke-width=".9"/>' +
      '<path d="M7 26H11M26 7V11" stroke="#D9C2A0" stroke-opacity=".5" stroke-width="1.1"/>' +
      '<path d="M7 1.5L12.5 7L7 12.5L1.5 7Z" fill="#FFB565"/><path d="M7 1.5L12.5 7L7 7Z" fill="#FFE2BF"/><path d="M1.5 7L7 12.5L7 7Z" fill="#B8481B"/></svg>';
    return '<div class="pt-decor" aria-hidden="true">' + facets + '<span class="pt-breath"></span>' + lava + crack +
      corner('k-ts') + corner('k-te') + corner('k-bs') + corner('k-be') + '<span class="pt-frame"></span><span class="pt-rim"></span><span class="pt-sheen"></span></div>';
  }
};
const CodisPlanThemes = (function(){
  const DEFS = CODIS_PLAN_THEME_DEFS;
  function st(){ const inv = data.inventory; let t = inv.planThemes; if(!t || typeof t !== 'object' || Array.isArray(t)) t = inv.planThemes = { owned:[], equipped:'' }; if(!Array.isArray(t.owned)) t.owned = []; if(typeof t.equipped !== 'string') t.equipped = ''; return t; }
  function def(id){ return DEFS.find(d=>d.id === id) || null; }
  function rec(id){ return st().owned.find(x=>x && x.id === id) || null; }
  function owns(id){ return !!(def(id) && rec(id)); }
  function owned(){ return DEFS.filter(d=>owns(d.id)); }
  /* إصلاح ذاتي: معاملة شراء ثيم موجودة بدفتر الفضة والملكية مفقودة (نسخة أقدم من التطبيق على جهاز آخر أسقطت الحقل بالتطبيع ثم زامنت)
     ⇒ تُعاد الملكية من المعاملة نفسها. لا خصم جديد، ومتكررة بأمان */
  function heal(){
    let n = 0; try{ CodisWallet.silverTxs().forEach(t=>{ const m = /^plantheme\|(.+)$/.exec(t && t.type === 'PURCHASE_COSMETIC' ? String(t.referenceId || '') : '');
      if(m && def(m[1]) && !rec(m[1])){ st().owned.push({ id:m[1], source:'store', sourceRef:String(t.id || ''), acquiredAt:t.createdAt || econNowIso(), paid:Math.abs(Number(t.amount) || 0) }); n++; } }); }catch(e){}
    return n;
  }
  function equippedId(){ const id = st().equipped; return (id && owns(id)) ? id : ''; }
  function isEquipped(id){ return !!id && equippedId() === id; }
  function price(id){ const d = def(id); return d ? d.silver : 0; }
  /* شراء بالفضة: تحقق ← (خصم + ملكية) بمعاملة واحدة ذرّية. الرصيد غير الكافي عبر CodisLimits (المطوّر معفى) */
  function buy(id){
    const d = def(id); if(!d) return { ok:false, reason:'invalid' };
    if(owns(id)) return { ok:false, reason:'owned' };
    const bal = CodisWallet.silverBalance(); if(!CodisLimits.afford(bal, d.silver)) return { ok:false, reason:'insufficient', need:d.silver - bal, price:d.silver };
    return CodisWallet.transact([], ()=>{
      if(rec(d.id)) return { ok:false, reason:'owned' };
      const tx = CodisWallet.applySilver('PURCHASE_COSMETIC', -d.silver, 'شراء ثيم ' + d.name, 'store', 'plantheme|' + d.id, { name:d.name, planTheme:d.id });
      if(!tx) return { ok:false, reason:'tx' };
      st().owned.push({ id:d.id, source:'store', sourceRef:tx.id, acquiredAt:econNowIso(), paid:d.silver });
      return { ok:true, def:d, price:d.silver, tx:tx };
    });
  }
  /* تجهيز/إزالة: خانة واحدة (ثيم واحد مجهّز)، محفوظ بنفس آلية المعاملة (تراجع كامل إن فشل الحفظ). لا فضة ولا مساس بمظاهر البطاقات */
  function equip(id){
    const d = def(id); if(!d) return { ok:false, reason:'invalid' }; if(!owns(id)) return { ok:false, reason:'notowned' };
    if(isEquipped(id)) return { ok:true, def:d, same:true };
    return CodisWallet.transact([], ()=>{ st().equipped = d.id; return { ok:true, def:d }; });
  }
  function unequip(){ if(!st().equipped) return { ok:true, same:true }; return CodisWallet.transact([], ()=>{ st().equipped = ''; return { ok:true }; }); }
  return { defs:()=>DEFS.slice(), def, heal, owns, owned, equippedId, isEquipped, price, buy, equip, unequip };
})();
let codisPtUid = 0;
function codisPlanThemeDecorHtml(d){ const f = d && CODIS_PLAN_THEME_ART[d.art]; if(!f) return ''; try{ return f(d, ++codisPtUid); }catch(e){ console.error('CODIS plan theme art:', e); return ''; } }
function codisPlanThemeStyle(d){
  const t = (d && d.tokens) || {}, m = (d && d.motion) || {};
  return Object.keys(t).map(k=>k + ':' + t[k]).concat(['--pt-sheen-dur:' + (m.sheen || 10) + 's', '--pt-breath-dur:' + (m.breath || 6) + 's', '--pt-glint-dur:' + (m.glint || 7) + 's']).join(';');
}
/* يطبّق الثيم المجهّز على المربع الحقيقي (أو يعيده للأصل). أصناف/خصائص + طبقة زخارف فقط — النصوص والزر والصورة تبقى عناصرها نفسها */
function codisPlanThemeApply(){
  const box = document.querySelector('#planning-empty > .empty-state'); if(!box) return;
  let id = ''; try{ if(CodisPlanThemes.heal()) saveData(); id = CodisPlanThemes.equippedId(); }catch(e){ id = ''; }
  const d = id ? CodisPlanThemes.def(id) : null, cur = box.getAttribute('data-pt') || '';
  if(!d){ if(cur){ box.removeAttribute('data-pt'); box.classList.remove('pt-box'); box.removeAttribute('style'); const dc = box.querySelector(':scope > .pt-decor'); if(dc) dc.remove(); } return; }
  if(cur === d.id && box.querySelector(':scope > .pt-decor')) return;
  const old = box.querySelector(':scope > .pt-decor'); if(old) old.remove();
  box.setAttribute('style', codisPlanThemeStyle(d)); box.setAttribute('data-pt', d.id); box.classList.add('pt-box');
  box.insertAdjacentHTML('afterbegin', codisPlanThemeDecorHtml(d));
}
/* المعاينة = المربع نفسه: نفس الصنف/الخصائص/الزخارف، ونصوص المربع الحقيقي وصورته من DOM (لا بيانات مستخدم، ولا وظيفة عند الضغط) */
function codisPlanThemeBoxHtml(id){
  const d = CodisPlanThemes.def(id); if(!d) return '';
  const src = document.querySelector('#planning-empty > .empty-state'), q = s=>src ? src.querySelector(s) : null;
  const mark = q('.es-mark'), t = q('.es-title'), c = q('.es-copy'), b = q('.btn');
  return '<div class="empty-state pt-box" data-pt="' + d.id + '" style="' + escapeHtml(codisPlanThemeStyle(d)) + '" aria-hidden="true" inert>' + codisPlanThemeDecorHtml(d) +
    (mark ? mark.outerHTML : '') + '<div class="es-title">' + escapeHtml(t ? t.textContent : 'ابدأ بناء خطة أسبوعك') + '</div>' +
    '<div class="es-copy">' + escapeHtml(c ? c.textContent : '') + '</div><span class="btn btn-primary">' + escapeHtml(b ? b.textContent.trim() : 'ابدأ بناء الخطة') + '</span></div>';
}
function codisPlanThemeStageHtml(id, big){
  const d = CodisPlanThemes.def(id); if(!d) return '';
  return '<div class="pt-stage' + (big ? ' is-big' : '') + '"' + (big ? '' : ' role="button" tabindex="0" aria-label="' + escapeHtml('معاينة ' + d.name + ' بحجم أكبر') + '" onclick="codisPlanThemePreview(\'' + d.id + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();codisPlanThemePreview(\'' + d.id + '\')}"') + '>' + codisPlanThemeBoxHtml(d.id) + '</div>';
}
function econPlanThemeStateTag(d){ const P = CodisPlanThemes; return P.owns(d.id) ? '<span class="st-tag pt-state' + (P.isEquipped(d.id) ? ' is-on' : '') + '">' + (P.isEquipped(d.id) ? 'مجهّز الآن' : 'تملكه') + '</span>' : ''; }
function econPlanThemeEquipBtnHtml(d){
  const on = CodisPlanThemes.isEquipped(d.id);
  return '<button type="button" class="btn ' + (on ? 'btn-secondary' : 'btn-primary') + ' pt-act" aria-pressed="' + (on ? 'true' : 'false') + '" ' + (econStoreBusy ? 'disabled ' : '') +
    'aria-label="' + escapeHtml((on ? 'إزالة ' : 'تجهيز ') + d.name + ' — ثيم غرفة التخطيط') + '" onclick="econPlanThemeToggle(\'' + d.id + '\')">' + (on ? 'إزالة الثيم' : 'تجهيز الثيم') + '</button>';
}
/* بطاقة ثيم (المتجر وبحوزتك): معاينة حقيقية + هوية + حالة + زر */
function econPlanThemeTileHtml(d, i, inInv){
  const P = CodisPlanThemes, sv = CodisWallet.silverBalance(), own = P.owns(d.id), ok = own || CodisLimits.afford(sv, d.silver), busy = econStoreBusy;
  const btn = own ? econPlanThemeEquipBtnHtml(d)
    : '<button type="button" class="btn ' + (ok ? 'btn-primary' : 'btn-secondary') + ' pt-buy" ' + (ok && !busy ? '' : 'disabled aria-disabled="true"') +
      ' aria-label="' + escapeHtml('شراء ثيم ' + d.name + ' — ' + econFmt(d.silver) + ' فضة' + (ok ? '' : ' — ينقصك ' + econFmt(d.silver - sv) + ' فضة')) + '" onclick="econPlanThemeBuy(\'' + d.id + '\')">' + (ok ? econSilver(d.silver) : 'ينقصك ' + econFmt(d.silver - sv) + ' فضة') + '</button>';
  return '<div class="st-tile pt-tile' + (ok ? '' : ' is-short') + (own ? ' is-own' : '') + (P.isEquipped(d.id) ? ' is-on' : '') + '" role="listitem" data-ptid="' + d.id + '" style="--i:' + (i || 0) + '">' + codisPlanThemeStageHtml(d.id) +
    '<div class="pt-info"><div class="pt-head"><span class="pt-rar">' + escapeHtml(d.rarityAr) + ' · ثيم غرفة التخطيط</span>' + econPlanThemeStateTag(d) + '</div>' +
    '<span class="shop-name pt-name" dir="ltr">' + escapeHtml(d.name) + '</span><span class="pt-ar">' + escapeHtml(d.ar) + '</span><p class="pt-desc">' + escapeHtml(d.desc) + '</p>' +
    (own && inInv ? '<span class="pt-paid">' + (P.isEquipped(d.id) ? 'يظهر الآن بغرفة التخطيط' : 'مملوك دائماً — جهّزه متى ما تريد') + '</span>' : '') + '</div>' +
    '<div class="store-meta">' + btn + '</div></div>';
}
function econPlanThemesShopHtml(){
  return '<section class="st-part pt-sec" id="eco-plan-themes" aria-labelledby="pt-h"><header class="st-part-head"><h4 class="hcd-title" id="pt-h">ثيمات غرفة التخطيط</h4></header>' +
    '<p class="pt-lead">ثيم يلبّس مربع غرفة التخطيط بالكامل. تشتريه بالفضة مرة وحدة، ويبقى ملكك تجهّزه أو تزيله متى ما تريد.</p>' +
    '<div class="pt-grid" role="list">' + CodisPlanThemes.defs().map((d, i)=>econPlanThemeTileHtml(d, i, false)).join('') + '</div></section>';
}
function econPlanThemesInvHtml(){
  const list = CodisPlanThemes.owned(); if(!list.length) return '';
  return '<section class="own-part" id="own-plan-themes" aria-labelledby="own-pt-h"><div class="own-sub"><span id="own-pt-h" role="heading" aria-level="5">ثيمات غرفة التخطيط</span><span class="own-sub-n">' + econFmt(list.length) + '</span></div>' +
    '<div class="pt-grid" role="list">' + list.map((d, i)=>econPlanThemeTileHtml(d, i, true)).join('') + '</div></section>';
}
/* قسم «المظاهر» بالمتجر: تبويبان داخليان (مظاهر البطاقات · ثيمات التخطيط) — حالة واجهة فقط، والتبديل بلا إعادة رسم */
let econCosSub = 'cards';
function econCosmeticsPaneHtml(){
  const nC = CodisCosmetics.defs().length, nT = CodisPlanThemes.defs().length, cur = econCosSub === 'themes' ? 'themes' : 'cards';
  const tab = (k, lab, n)=>'<button type="button" role="tab" class="cos-seg-b' + (cur === k ? ' is-on' : '') + '" id="cos-tab-' + k + '" data-sub="' + k + '" aria-selected="' + (cur === k ? 'true' : 'false') + '" aria-controls="cos-sub-' + k + '" tabindex="' + (cur === k ? '0' : '-1') + '" onclick="econCosSetSub(\'' + k + '\')">' + lab + '<span class="cos-seg-n">' + econFmt(n) + '</span></button>';
  return '<div class="cos-seg" role="tablist" aria-label="أنواع المظاهر" onkeydown="econCosSubKey(event)">' + tab('cards', 'مظاهر البطاقات', nC) + tab('themes', 'ثيمات التخطيط', nT) + '</div>' +
    '<div class="cos-sub" role="tabpanel" id="cos-sub-cards" aria-labelledby="cos-tab-cards"' + (cur === 'cards' ? '' : ' hidden') + '>' + econCosmeticsShopHtml() + '</div>' +
    '<div class="cos-sub" role="tabpanel" id="cos-sub-themes" aria-labelledby="cos-tab-themes"' + (cur === 'themes' ? '' : ' hidden') + '>' + econPlanThemesShopHtml() + '</div>';
}
function econCosSetSub(k, focus){
  k = k === 'themes' ? 'themes' : 'cards'; if(econCosSub !== k) codisSfx('press', { ctx:'tab' });
  econCosSub = k;
  document.querySelectorAll('#pane-cosmetics .cos-seg-b').forEach(b=>{ const on = b.getAttribute('data-sub') === k; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; if(on && focus){ try{ b.focus({ preventScroll:true }); }catch(x){} } });
  document.querySelectorAll('#pane-cosmetics .cos-sub').forEach(p=>{ p.hidden = p.id !== 'cos-sub-' + k; });
  const p = document.getElementById('cos-sub-' + k); if(p){ try{ codisFitLazy(p); }catch(x){} }
}
function econCosSubKey(ev){ if(['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(ev.key) === -1) return; ev.preventDefault(); const k = ev.key === 'Home' ? 'cards' : ev.key === 'End' ? 'themes' : (econCosSub === 'cards' ? 'themes' : 'cards'); econCosSetSub(k, true); }
/* شراء: نظام التأكيد نفسه (السعر · رصيدك · المتبقي) ثم المعاملة الذرّية؛ econStoreBusy يمنع الضغط المتكرر */
async function econPlanThemeBuy(id){
  if(econStoreBusy) return; econStoreBusy = true;
  try{
    const P = CodisPlanThemes, d = P.def(id);
    if(!d){ codisSfx('invalid', { ctx:'funds' }); showToast('الثيم غير متاح', 'var(--warning)'); return; }
    if(P.owns(id)){ codisSfx('invalid', { ctx:'funds' }); showToast('تملك «' + d.name + '» من قبل — جهّزه من «بحوزتك»', 'var(--warning)'); return; }
    const sv = CodisWallet.silverBalance();
    if(!CodisLimits.afford(sv, d.silver)){ codisSfx('invalid', { ctx:'funds' }); showToast('الفضة غير كافية — ينقصك ' + econFmt(d.silver - sv) + ' فضة', 'var(--warning)'); return; }
    const ok = await codisConfirm({ title:'شراء ثيم «' + d.name + '»؟', message:'السعر ' + econFmt(d.silver) + ' فضة · رصيدك ' + econFmt(sv) + ' فضة · المتبقي بعد الشراء ' + econFmt(Math.max(0, sv - d.silver)) + ' فضة. رصيد الكوينز ما يتأثر.',
      detail:d.ar + ' — ' + d.desc + ' ثيم دائم: تشتريه مرة وحدة وتجهّزه أو تزيله متى ما تريد.', icon:'gift', confirmText:'شراء', danger:false });
    if(!ok) return;
    const r = P.buy(id);
    if(r.ok){ codisSfx('store.buy', { ctx:'cosmetic' }); showToast('تم الشراء: ' + d.name + ' (−' + econFmt(r.price) + ' فضة) — جهّزه من هنا أو من «بحوزتك»', 'var(--success)', 'gift'); CodisEvents.emit('ECON_PURCHASE', { name:d.name, price:0, silver:r.price }); }
    else { codisSfx('invalid', { ctx:'funds' }); showToast(r.reason === 'insufficient' ? 'الفضة غير كافية — ينقصك ' + econFmt(r.need) + ' فضة' : r.reason === 'owned' ? 'تملك هذا الثيم من قبل' : r.reason === 'save' ? 'تعذّر الحفظ — لم يُخصم شيء' : 'تعذّر الشراء — لم يُخصم شيء', 'var(--warning)'); }
  } finally { econStoreBusy = false; econRenderAll(); }
}
function econPlanThemeToggle(id){
  if(econStoreBusy) return;
  const P = CodisPlanThemes, d = P.def(id); if(!d) return;
  const on = P.isEquipped(id), r = on ? P.unequip() : P.equip(id);
  if(!r.ok){ codisSfx('invalid', { ctx:'unavailable' }); showToast(r.reason === 'notowned' ? 'ما تملك هذا الثيم' : r.reason === 'save' ? 'تعذّر الحفظ — بقي المربع كما هو' : 'تعذّر التطبيق', 'var(--warning)'); return; }
  codisSfx(on ? 'close' : 'reward.achievement', { ctx:'card' });
  showToast(on ? 'أُزيل ' + d.name + ' — رجع مربع غرفة التخطيط لشكله الأصلي' : 'تم تجهيز ' + d.name + ' على غرفة التخطيط', on ? 'var(--text-2)' : 'var(--success)', on ? undefined : 'gift');
  codisPlanThemeApply(); econRenderAll();
}
/* معاينة أكبر بنافذة مستقلة (فوق المتجر وبحوزتك): Esc/الرجوع/الخلفية/الزر تغلقها، والتركيز يرجع لمكانه */
let codisPtPrevEl = null, codisPtPrevFocus = null;
function codisPlanThemePreview(id){
  const d = CodisPlanThemes.def(id); if(!d) return;
  codisPlanThemePreviewClose(true);
  codisPtPrevFocus = document.activeElement;
  const el = document.createElement('div'); el.className = 'pt-ov'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'معاينة ' + d.name);
  el.innerHTML = '<div class="pt-ov-bg" onclick="codisPlanThemePreviewClose()"></div><div class="pt-ov-card"><div class="pt-ov-head"><span class="pt-rar">' + escapeHtml(d.rarityAr) + ' · ثيم غرفة التخطيط</span><button type="button" class="pt-ov-x" aria-label="إغلاق المعاينة" onclick="codisPlanThemePreviewClose()">' + codisIcon('close') + '</button></div>' +
    '<div class="pt-ov-name"><b dir="ltr">' + escapeHtml(d.name) + '</b><span>' + escapeHtml(d.ar) + '</span></div>' + codisPlanThemeStageHtml(d.id, true) +
    '<p class="pt-ov-note">هكذا يظهر مربع غرفة التخطيط بعد التجهيز.</p></div>';
  document.body.appendChild(el); codisPtPrevEl = el; codisSfx('open', { ctx:'store' });
  requestAnimationFrame(()=>{ el.classList.add('is-in'); const x = el.querySelector('.pt-ov-x'); if(x){ try{ x.focus({ preventScroll:true }); }catch(e){} } });
}
function codisPlanThemePreviewClose(silent){
  const el = codisPtPrevEl; if(!el) return; codisPtPrevEl = null;
  if(!silent) codisSfx('close', { ctx:'store' });
  el.remove();
  const f = codisPtPrevFocus; codisPtPrevFocus = null; if(f && f.isConnected){ try{ f.focus({ preventScroll:true }); }catch(e){} }
}
document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && codisPtPrevEl){ ev.stopPropagation(); codisPlanThemePreviewClose(); } }, true);
