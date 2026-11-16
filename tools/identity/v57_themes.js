/* ================= CODIS-V57: ثيمات الغرف (Skins لمربعات «لا خطة» في التخطيط · العمليات · الأستاذ) =================
   توسعة لنظام V56 (لا نظام موازٍ): نفس السجل/الملكية/الشراء/المعاملة، والإضافة = الحقل target + تجهيز مستقل لكل غرفة.
   • التعريف (CODIS_PLAN_THEME_DEFS): id · name · ar · target · silver · rarity · rarityAr · desc · art · motion · tokens.
     target ∈ CODIS_THEME_TARGETS (planning → #planning-empty · operations → #tasks-empty · teacher → #learn-empty).
     ثيم جديد = تعريف (+ راسم زخارف إن أردت هوية جديدة)؛ الشراء/التجهيز/المتجر/بحوزتك/التطبيق لا تتغير. غرفة جديدة = سطر بـCODIS_THEME_TARGETS.
   • الحالة: data.inventory.planThemes = { owned:[{id,source,sourceRef,acquiredAt,paid}], equipped:'<ثيم التخطيط>',
     equippedByTarget:{ planning, operations, teacher } } — '' = التصميم الأصلي لتلك الغرفة.
     equipped (حقل V56) يبقى مصدر الحقيقة لغرفة التخطيط ومرآة equippedByTarget.planning: نسخة 3.43 تكتبه وتُسقط الخريطة ⇒ لا يضيع شيء.
   • الشراء: CodisWallet.transact واحدة = خصم فضة (PURCHASE_COSMETIC بمرجع plantheme|<id>) + تسجيل الملكية؛ أي فشل ⇒ تراجع كامل.
   • العرض: مكوّن واحد (codisPlanThemeDecorHtml + رموز --pt-*) للمربع الحقيقي وللمعاينتين: Mini (شبكة المتجر/بحوزتك) وLarge (النافذة)،
     والمعاينة تأخذ رسمة ونصوص مربع غرفتها الحقيقي من DOM ⇒ لكل ثيم رسمة غرفته. */
const CODIS_THEME_TARGETS = {
  planning:{ sel:'#planning-empty', room:'غرفة التخطيط', short:'التخطيط', box:'ابدأ بناء خطة أسبوعك', btn:'ابدأ بناء الخطة' },
  operations:{ sel:'#tasks-empty', room:'غرفة العمليات', short:'العمليات', box:'العمليات بانتظار خطة', btn:'روح لغرفة التخطيط' },
  teacher:{ sel:'#learn-empty', room:'غرفة الأستاذ', short:'الأستاذ', box:'مسارك التعليمي لم يبدأ بعد', btn:'روح لغرفة التخطيط' }
};
const CODIS_PLAN_THEME_DEFS = (function(){
  /* هوية INFERNO CRYSTAL واحدة للغرف الثلاث: Obsidian · Molten Orange · Deep Crimson · Champagne Gold · Crystal */
  const inferno = {
    '--pt-bg':'radial-gradient(120% 62% at 50% 112%, rgb(255 92 24 / .26), transparent 62%), radial-gradient(70% 46% at 50% 40%, rgb(255 214 176 / .055), transparent 72%), linear-gradient(162deg, #1c1310 0%, #0d0907 42%, #0a0706 64%, #160d0a 100%)',
    '--pt-edge':'0 0 0 1px rgb(217 190 150 / .34), inset 0 0 0 1px rgb(255 224 190 / .07), inset 0 1px 0 rgb(255 236 214 / .14), 0 18px 34px -18px rgb(0 0 0 / .85), 0 22px 40px -26px rgb(255 80 20 / .45)',
    '--pt-title':'#F4D7B6', '--pt-title-glow':'0 1px 0 rgb(0 0 0 / .7), 0 0 18px rgb(255 120 40 / .26)', '--pt-copy':'#CDB8A3',
    '--pt-ea-paper':'#1d1411', '--pt-ea-ink':'#D9C2A0', '--pt-ea-line':'rgb(217 194 160 / .34)', '--pt-ea-shade':'rgb(0 0 0 / .62)', '--pt-ea-acc':'#FF8A2E', '--pt-road':'#050303', '--pt-road-edge':'rgb(255 140 60 / .22)', '--pt-gem':'#FFB565', '--pt-gem-edge':'#FFE2BF',
    '--pt-metal':'#C9A26E', '--pt-metal-edge':'#F3DDB8', '--pt-socket':'#070404', '--pt-mark-ink':'#2A1208',
    '--pt-art-glow':'drop-shadow(0 0 7px rgb(255 110 30 / .38)) drop-shadow(0 2px 2px rgb(0 0 0 / .7))',
    '--pt-btn-bg':'linear-gradient(180deg, #2c1a13, #150c09) padding-box, linear-gradient(180deg, #FFC48A, #D2541F 46%, #6B1D08) border-box',
    '--pt-btn-tx':'#FFE8D0', '--pt-btn-sh':'0 0 0 1px rgb(0 0 0 / .65), inset 0 1px 0 rgb(255 226 196 / .2), 0 10px 20px -10px rgb(255 90 20 / .7)',
    '--pt-btn-sh-hover':'0 0 0 1px rgb(0 0 0 / .65), inset 0 1px 0 rgb(255 226 196 / .26), 0 0 0 3px rgb(255 140 60 / .14), 0 12px 24px -10px rgb(255 100 26 / .85)',
    '--pt-btn-sh-press':'0 0 0 1px rgb(0 0 0 / .7), inset 0 2px 8px rgb(255 90 20 / .35), 0 4px 10px -6px rgb(255 90 20 / .6)',
    '--pt-focus':'#FFB565', '--pt-frame':'rgb(217 194 160 / .2)', '--pt-chip':'#FFB565'
  };
  const base = { name:'Inferno Crystal', ar:'الجحيم الكريستالي', silver:3499, rarity:'legendary', rarityAr:'أسطوري', art:'inferno', tokens:inferno };
  return [
    Object.assign({}, base, { id:'infernoCrystal', target:'planning', motion:{ sheen:11, breath:6.5, glint:7 },
      desc:'أوبسيديان أسود تشقّه عروق حمم منصهرة، بحواف كريستالية وأركان معدنية كلاسيكية — يلبسه مربع غرفة التخطيط بالكامل: الورقة والمسار المحفور والعلم الكريستالي.' }),
    Object.assign({}, base, { id:'infernoCrystalOperations', target:'operations', motion:{ sheen:12, breath:7, glint:7.5 },
      desc:'نفس خامة الجحيم الكريستالي على مربع غرفة العمليات: لوح المهام ورقة أوبسيديان بمشبك من ذهب الشمبانيا، خاناته محفورة بحافة جمر، وسهم النزول يتوهّج حمماً.' }),
    Object.assign({}, base, { id:'infernoCrystalTeacher', target:'teacher', motion:{ sheen:13, breath:7.5, glint:8 },
      desc:'نفس خامة الجحيم الكريستالي على مربع غرفة الأستاذ: كتاب مسارك بأوراق أوبسيديان وحبر شمبانيا، ومحطاتك الدراسية بلورات كهرمان على مسار محفور بالحجر البركاني.' })
  ];
})();
/* راسمو الزخارف: (def, uid) ⇒ HTML لطبقة .pt-decor (مشتركة لكل الغرف). uid يجعل معرّفات التدرّج فريدة لكل نسخة بالصفحة */
const CODIS_PLAN_THEME_ART = {
  inferno:function(d, u){
    const g = (id)=>'pt' + u + id;
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
    const crack = '<svg class="pt-crack c-ts" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round" style="--pv:url(#' + g('lv') + ')">' + vein('M120 4C108 10 104 18 98 26S90 38 82 42', .7) + '</g></svg>';
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
  const DEFS = CODIS_PLAN_THEME_DEFS, TG = CODIS_THEME_TARGETS;
  /* الحالة بعد إصلاح ذاتي آمن (لا ترمي): الخريطة موجودة دائماً، وخانة التخطيط مرآة لحقل equipped القديم */
  function st(){
    const inv = data.inventory; let t = inv.planThemes;
    if(!t || typeof t !== 'object' || Array.isArray(t)) t = inv.planThemes = { owned:[], equipped:'', equippedByTarget:{} };
    if(!Array.isArray(t.owned)) t.owned = []; if(typeof t.equipped !== 'string') t.equipped = '';
    let by = t.equippedByTarget; if(!by || typeof by !== 'object' || Array.isArray(by)) by = t.equippedByTarget = {};
    Object.keys(TG).forEach(k=>{ if(typeof by[k] !== 'string') by[k] = ''; }); by.planning = t.equipped;
    return t;
  }
  function targets(){ return Object.keys(TG); }
  function target(k){ return TG[k] || null; }
  function def(id){ return DEFS.find(d=>d.id === id) || null; }
  function rec(id){ return st().owned.find(x=>x && x.id === id) || null; }
  function owns(id){ return !!(def(id) && rec(id)); }
  function owned(){ return DEFS.filter(d=>owns(d.id)); }
  function heal(){
    let n = 0; try{ CodisWallet.silverTxs().forEach(t=>{ const m = /^plantheme\|(.+)$/.exec(t && t.type === 'PURCHASE_COSMETIC' ? String(t.referenceId || '') : '');
      if(m && def(m[1]) && !rec(m[1])){ st().owned.push({ id:m[1], source:'store', sourceRef:String(t.id || ''), acquiredAt:t.createdAt || econNowIso(), paid:Math.abs(Number(t.amount) || 0) }); n++; } }); }catch(e){}
    return n;
  }
  /* المجهّز لغرفة: مملوك + هدفه الغرفة نفسها (لا يُطبَّق ثيم غرفة على غيرها حتى لو عُبث بالبيانات) */
  function equippedId(tg){ tg = TG[tg] ? tg : 'planning'; const id = st().equippedByTarget[tg]; const d = id ? def(id) : null; return (d && d.target === tg && owns(id)) ? id : ''; }
  function equippedMap(){ const m = {}; targets().forEach(k=>{ m[k] = equippedId(k); }); return m; }
  function isEquipped(id){ const d = def(id); return !!d && equippedId(d.target) === id; }
  function price(id){ const d = def(id); return d ? d.silver : 0; }
  function buy(id){
    const d = def(id); if(!d) return { ok:false, reason:'invalid' };
    if(owns(id)) return { ok:false, reason:'owned' };
    const bal = CodisWallet.silverBalance(); if(!CodisLimits.afford(bal, d.silver)) return { ok:false, reason:'insufficient', need:d.silver - bal, price:d.silver };
    return CodisWallet.transact([], ()=>{
      if(rec(d.id)) return { ok:false, reason:'owned' };
      const tx = CodisWallet.applySilver('PURCHASE_COSMETIC', -d.silver, 'شراء ثيم ' + d.name + ' — ' + ((TG[d.target] || {}).room || ''), 'store', 'plantheme|' + d.id, { name:d.name, planTheme:d.id, target:d.target });
      if(!tx) return { ok:false, reason:'tx' };
      st().owned.push({ id:d.id, source:'store', sourceRef:tx.id, acquiredAt:econNowIso(), paid:d.silver });
      return { ok:true, def:d, price:d.silver, tx:tx };
    });
  }
  /* تجهيز/إزالة: خانة لكل غرفة (ثيم واحد لكل غرفة)، لا يمسّ خانات الغرف الأخرى، محفوظ بالمعاملة نفسها (تراجع كامل إن فشل الحفظ) */
  function setSlot(tg, id){ const t = st(); t.equippedByTarget[tg] = id; if(tg === 'planning') t.equipped = id; }
  function equip(id){
    const d = def(id); if(!d) return { ok:false, reason:'invalid' }; if(!TG[d.target]) return { ok:false, reason:'invalid' }; if(!owns(id)) return { ok:false, reason:'notowned' };
    if(isEquipped(id)) return { ok:true, def:d, same:true };
    return CodisWallet.transact([], ()=>{ setSlot(d.target, d.id); return { ok:true, def:d }; });
  }
  /* unequip(target | themeId) — بلا وسيط = غرفة التخطيط (توافق V56) */
  function unequip(x){
    const tg = TG[x] ? x : (def(x) ? def(x).target : 'planning');
    if(!st().equippedByTarget[tg]) return { ok:true, same:true };
    return CodisWallet.transact([], ()=>{ setSlot(tg, ''); return { ok:true, target:tg }; });
  }
  return { defs:()=>DEFS.slice(), def, targets, target, heal, owns, owned, equippedId, equippedMap, isEquipped, price, buy, equip, unequip };
})();
let codisPtUid = 0;
function codisPlanThemeDecorHtml(d){ const f = d && CODIS_PLAN_THEME_ART[d.art]; if(!f) return ''; try{ return f(d, ++codisPtUid); }catch(e){ console.error('CODIS plan theme art:', e); return ''; } }
function codisPlanThemeVars(d){
  const t = (d && d.tokens) || {}, m = (d && d.motion) || {};
  return Object.keys(t).map(k=>[k, t[k]]).concat([['--pt-sheen-dur', (m.sheen || 10) + 's'], ['--pt-breath-dur', (m.breath || 6) + 's'], ['--pt-glint-dur', (m.glint || 7) + 's']]);
}
function codisPlanThemeStyle(d){ return codisPlanThemeVars(d).map(p=>p[0] + ':' + p[1]).join(';'); }
function codisPlanThemeTargetBox(tg){ const T = CODIS_THEME_TARGETS[tg]; return T ? document.querySelector(T.sel + ' > .empty-state') : null; }
/* إزالة ما أضافه الثيم فقط: رموز --pt-* من style (بقية الخصائص الأصلية تبقى) + الصنف + السمات + طبقة الزخارف */
function codisPlanThemeStrip(box){
  for(let i = box.style.length - 1; i >= 0; i--){ const p = box.style[i]; if(p && p.indexOf('--pt-') === 0) box.style.removeProperty(p); }
  if(box.hasAttribute('data-pt-nostyle')){ if(!box.style.length) box.removeAttribute('style'); box.removeAttribute('data-pt-nostyle'); }
  box.removeAttribute('data-pt'); box.removeAttribute('data-pt-target'); box.classList.remove('pt-box');
  const dc = box.querySelector(':scope > .pt-decor'); if(dc) dc.remove();
}
/* يطبّق المجهّز على مربع غرفة (أو كل الغرف بلا وسيط). idempotent: لا يعيد بناء DOM إن كان الثيم نفسه مطبّقاً */
function codisPlanThemeApply(tg){
  let map = null; try{ if(CodisPlanThemes.heal()) saveData(); map = CodisPlanThemes.equippedMap(); }catch(e){ map = {}; }
  (tg && CODIS_THEME_TARGETS[tg] ? [tg] : Object.keys(CODIS_THEME_TARGETS)).forEach(k=>{
    try{
      const box = codisPlanThemeTargetBox(k); if(!box) return;
      const id = map[k] || '', d = id ? CodisPlanThemes.def(id) : null, cur = box.getAttribute('data-pt') || '';
      if(!d){ if(cur || box.querySelector(':scope > .pt-decor')) codisPlanThemeStrip(box); return; }
      if(cur === d.id && box.querySelector(':scope > .pt-decor')) return;
      if(cur) codisPlanThemeStrip(box);
      if(!box.hasAttribute('style')) box.setAttribute('data-pt-nostyle', '');
      codisPlanThemeVars(d).forEach(p=>box.style.setProperty(p[0], p[1]));
      box.setAttribute('data-pt', d.id); box.setAttribute('data-pt-target', k); box.classList.add('pt-box');
      box.insertAdjacentHTML('afterbegin', codisPlanThemeDecorHtml(d));
    }catch(e){ console.error('CODIS room theme:', k, e); }
  });
}
/* المعاينة = مربع الغرفة المستهدفة نفسه: رسمته ونصوصه من DOM. mini = نسخة مصغّرة مصممة (الرسمة + مقابض العنوان/الزر بنفس الرموز) */
function codisPlanThemeBoxHtml(id, mini){
  const d = CodisPlanThemes.def(id); if(!d) return '';
  const T = CODIS_THEME_TARGETS[d.target] || CODIS_THEME_TARGETS.planning, src = codisPlanThemeTargetBox(d.target), q = s=>src ? src.querySelector(s) : null;
  const mark = q(':scope > .es-mark'), t = q(':scope > .es-title'), c = q(':scope > .es-copy'), b = q(':scope > .btn');
  const open = '<div class="empty-state pt-box" data-pt="' + d.id + '" data-pt-target="' + d.target + '" style="' + escapeHtml(codisPlanThemeStyle(d)) + '" aria-hidden="true" inert>' + codisPlanThemeDecorHtml(d) + (mark ? mark.outerHTML : '');
  if(mini) return open + '<span class="pt-mini-t"></span><span class="pt-mini-c"></span><span class="pt-mini-b"></span></div>';
  return open + '<div class="es-title">' + escapeHtml(t ? t.textContent : T.box) + '</div>' +
    '<div class="es-copy">' + escapeHtml(c ? c.textContent : '') + '</div><span class="btn btn-primary">' + escapeHtml(b ? b.textContent.trim() : T.btn) + '</span></div>';
}
function codisPlanThemeStageHtml(id, big){ const d = CodisPlanThemes.def(id); if(!d) return ''; return '<div class="pt-stage ' + (big ? 'is-big' : 'is-mini') + '">' + codisPlanThemeBoxHtml(d.id, !big) + '</div>'; }
function codisPtRoom(d){ return (CODIS_THEME_TARGETS[d && d.target] || CODIS_THEME_TARGETS.planning); }
/* بطاقة مصغّرة (المتجر وبحوزتك): معاينة Mini + الاسم + الغرفة + شارة مختصرة؛ الضغط يفتح نافذة التفاصيل */
function econPlanThemeTileHtml(d, i, inInv){
  const P = CodisPlanThemes, own = P.owns(d.id), on = P.isEquipped(d.id), R = codisPtRoom(d), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver);
  const badge = on ? '<span class="pt-mbadge is-on">مجهّز</span>' : own ? '<span class="pt-mbadge is-own">' + (inInv ? 'غير مجهّز' : 'تملكه') + '</span>'
    : '<span class="pt-mbadge is-price' + (ok ? '' : ' is-short') + '">' + econSilver(d.silver) + '</span>';
  const lab = d.name + ' — ' + d.ar + ' · ثيم ' + R.room + ' · ' + d.rarityAr + ' · ' + (on ? 'مجهّز الآن' : own ? 'تملكه' : econFmt(d.silver) + ' فضة') + ' — افتح التفاصيل';
  return '<div class="st-tile pt-mtile' + (own ? ' is-own' : '') + (on ? ' is-on' : '') + (ok ? '' : ' is-short') + '" role="listitem" data-ptid="' + d.id + '" data-pt-target="' + d.target + '" style="--i:' + (i || 0) + '">' +
    '<button type="button" class="pt-mbtn" aria-haspopup="dialog" aria-label="' + escapeHtml(lab) + '" onclick="codisPlanThemePreview(\'' + d.id + '\', this)">' +
    codisPlanThemeStageHtml(d.id, false) + '<span class="pt-mname" dir="ltr">' + escapeHtml(d.name) + '</span>' +
    '<span class="pt-mroom"><span class="pt-mroom-k">غرفة </span>' + escapeHtml(R.short) + '</span>' + badge + '</button></div>';
}
function econPlanThemesShopHtml(){
  return '<section class="st-part pt-sec" id="eco-plan-themes" aria-labelledby="pt-h"><header class="st-part-head"><h4 class="hcd-title" id="pt-h">ثيمات الغرف</h4></header>' +
    '<p class="pt-lead">ثيم يلبّس مربع غرفته بالكامل (التخطيط · العمليات · الأستاذ). تشتريه بالفضة مرة وحدة، وتجهّزه أو تزيله متى ما تريد — كل غرفة بثيمها.</p>' +
    '<div class="pt-grid" role="list">' + CodisPlanThemes.defs().map((d, i)=>econPlanThemeTileHtml(d, i, false)).join('') + '</div></section>';
}
function econPlanThemesInvHtml(){
  const list = CodisPlanThemes.owned(); if(!list.length) return '';
  return '<section class="own-part" id="own-plan-themes" aria-labelledby="own-pt-h"><div class="own-sub"><span id="own-pt-h" role="heading" aria-level="5">ثيمات الغرف</span><span class="own-sub-n">' + econFmt(list.length) + '</span></div>' +
    '<div class="pt-grid" role="list">' + list.map((d, i)=>econPlanThemeTileHtml(d, i, true)).join('') + '</div></section>';
}
/* قسم «المظاهر» بالمتجر: تبويبان داخليان (مظاهر البطاقات · ثيمات الغرف) — حالة واجهة فقط، والتبديل بلا إعادة رسم */
let econCosSub = 'cards';
function econCosmeticsPaneHtml(){
  const nC = CodisCosmetics.defs().length, nT = CodisPlanThemes.defs().length, cur = econCosSub === 'themes' ? 'themes' : 'cards';
  const tab = (k, lab, n)=>'<button type="button" role="tab" class="cos-seg-b' + (cur === k ? ' is-on' : '') + '" id="cos-tab-' + k + '" data-sub="' + k + '" aria-selected="' + (cur === k ? 'true' : 'false') + '" aria-controls="cos-sub-' + k + '" tabindex="' + (cur === k ? '0' : '-1') + '" onclick="econCosSetSub(\'' + k + '\')">' + lab + '<span class="cos-seg-n">' + econFmt(n) + '</span></button>';
  return '<div class="cos-seg" role="tablist" aria-label="أنواع المظاهر" onkeydown="econCosSubKey(event)">' + tab('cards', 'مظاهر البطاقات', nC) + tab('themes', 'ثيمات الغرف', nT) + '</div>' +
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
  if(econStoreBusy) return; econStoreBusy = true; codisPtOvSync();
  try{
    const P = CodisPlanThemes, d = P.def(id);
    if(!d){ codisSfx('invalid', { ctx:'funds' }); showToast('الثيم غير متاح', 'var(--warning)'); return; }
    const R = codisPtRoom(d);
    if(P.owns(id)){ codisSfx('invalid', { ctx:'funds' }); showToast('تملك «' + d.name + '» لـ' + R.room + ' من قبل — جهّزه من «بحوزتك»', 'var(--warning)'); return; }
    const sv = CodisWallet.silverBalance();
    if(!CodisLimits.afford(sv, d.silver)){ codisSfx('invalid', { ctx:'funds' }); showToast('الفضة غير كافية — ينقصك ' + econFmt(d.silver - sv) + ' فضة', 'var(--warning)'); return; }
    const ok = await codisConfirm({ title:'شراء ثيم «' + d.name + '» لـ' + R.room + '؟', message:'السعر ' + econFmt(d.silver) + ' فضة · رصيدك ' + econFmt(sv) + ' فضة · المتبقي بعد الشراء ' + econFmt(Math.max(0, sv - d.silver)) + ' فضة. رصيد الكوينز ما يتأثر.',
      detail:d.ar + ' — ' + d.desc + ' ثيم دائم: تشتريه مرة وحدة وتجهّزه أو تزيله متى ما تريد.', icon:'gift', confirmText:'شراء', danger:false });
    if(!ok) return;
    const r = P.buy(id);
    if(r.ok){ codisSfx('store.buy', { ctx:'cosmetic' }); showToast('تم الشراء: ' + d.name + ' لـ' + R.room + ' (−' + econFmt(r.price) + ' فضة) — جهّزه من هنا أو من «بحوزتك»', 'var(--success)', 'gift'); CodisEvents.emit('ECON_PURCHASE', { name:d.name, price:0, silver:r.price }); }
    else { codisSfx('invalid', { ctx:'funds' }); showToast(r.reason === 'insufficient' ? 'الفضة غير كافية — ينقصك ' + econFmt(r.need) + ' فضة' : r.reason === 'owned' ? 'تملك هذا الثيم من قبل' : r.reason === 'save' ? 'تعذّر الحفظ — لم يُخصم شيء' : 'تعذّر الشراء — لم يُخصم شيء', 'var(--warning)'); }
  } finally { econStoreBusy = false; econRenderAll(); codisPtOvSync(true); }
}
function econPlanThemeToggle(id){
  if(econStoreBusy) return;
  const P = CodisPlanThemes, d = P.def(id); if(!d) return;
  const R = codisPtRoom(d), on = P.isEquipped(id), r = on ? P.unequip(d.target) : P.equip(id);
  if(!r.ok){ codisSfx('invalid', { ctx:'unavailable' }); showToast(r.reason === 'notowned' ? 'ما تملك هذا الثيم' : r.reason === 'save' ? 'تعذّر الحفظ — بقي المربع كما هو' : 'تعذّر التطبيق', 'var(--warning)'); codisPtOvSync(true); return; }
  codisSfx(on ? 'close' : 'reward.achievement', { ctx:'card' });
  showToast(on ? 'أُزيل ' + d.name + ' — رجع مربع ' + R.room + ' لشكله الأصلي' : 'تم تجهيز ' + d.name + ' على ' + R.room, on ? 'var(--text-2)' : 'var(--success)', on ? undefined : 'gift');
  codisPlanThemeApply(d.target); econRenderAll(); codisPtOvSync(true);
}
/* ---- نافذة التفاصيل (تطوير نافذة V56 نفسها): معاينة كبيرة لمربع الغرفة الصحيحة + الهوية + الحالة + إجراء واحد مناسب ---- */
let codisPtPrevEl = null, codisPtPrevFocus = null, codisPtPrevId = '', codisPtActAt = 0;
function codisPtOvDynHtml(d){
  const P = CodisPlanThemes, own = P.owns(d.id), on = P.isEquipped(d.id), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver), busy = econStoreBusy, R = codisPtRoom(d);
  const state = on ? '<span class="pt-ov-st is-on">مجهّز الآن على ' + escapeHtml(R.room) + '</span>' : own ? '<span class="pt-ov-st is-own">تملكه — غير مجهّز</span>'
    : '<span class="pt-ov-st">غير مملوك</span><span class="pt-ov-price">' + econSilver(d.silver) + '<small>فضة</small></span>';
  const note = on ? 'يظهر الآن بدل التصميم الأصلي لمربع ' + R.room + '. الإزالة ترجعه لشكله الأصلي ولا تمسّ الغرف الأخرى.'
    : own ? 'مملوك دائماً — تجهيزه يغيّر مربع ' + R.room + ' فقط.'
    : ok ? 'رصيدك ' + econFmt(sv) + ' فضة · المتبقي بعد الشراء ' + econFmt(Math.max(0, sv - d.silver)) + ' فضة.' : 'رصيدك ' + econFmt(sv) + ' فضة — ينقصك ' + econFmt(d.silver - sv) + ' فضة.';
  const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة', dis = busy || (!own && !ok);
  return '<div class="pt-ov-state">' + state + '</div><p class="pt-ov-note' + (!own && !ok ? ' is-short' : '') + '">' + escapeHtml(note) + '</p>' +
    '<button type="button" class="pt-ov-act' + (on ? ' is-off' : '') + '" data-act="' + (on ? 'unequip' : own ? 'equip' : 'buy') + '"' + (dis ? ' disabled aria-disabled="true"' : '') +
    ' aria-label="' + escapeHtml(lab + ' — ' + d.name + ' · ' + R.room + (!own ? ' · ' + econFmt(d.silver) + ' فضة' : '')) + '" onclick="codisPtAct(\'' + d.id + '\')">' + lab + (!own ? ' <span class="pt-ov-act-p">' + econFmt(d.silver) + '</span>' : '') + '</button>';
}
/* يحدّث الحالة والزر فقط (المعاينة لا تُعاد فلا تتكرر حركتها)؛ refocus يعيد التركيز للزر الجديد إن كان التركيز داخل النافذة */
function codisPtOvSync(refocus){
  const el = codisPtPrevEl, d = el && CodisPlanThemes.def(codisPtPrevId); if(!d) return;
  const box = el.querySelector('.pt-ov-dyn'); if(!box) return;
  const had = refocus && (el.contains(document.activeElement) || document.activeElement === document.body || !document.activeElement);
  box.innerHTML = codisPtOvDynHtml(d);
  if(had){ const b = box.querySelector('.pt-ov-act'); if(b && !b.disabled){ try{ b.focus({ preventScroll:true }); }catch(e){} } else { const x = el.querySelector('.pt-ov-x'); if(x){ try{ x.focus({ preventScroll:true }); }catch(e){} } } }
}
/* زر النافذة: قفل قصير ضد النقرة المزدوجة (لا تجهيز ثم إزالة بنقرتين متتاليتين) + econStoreBusy للشراء */
function codisPtAct(id){
  const now = Date.now(); if(now - codisPtActAt < 500 || econStoreBusy) return; codisPtActAt = now;
  const P = CodisPlanThemes; if(!P.def(id)) return;
  if(!P.owns(id)) econPlanThemeBuy(id); else econPlanThemeToggle(id);
}
function codisPlanThemePreview(id, opener){
  const d = CodisPlanThemes.def(id); if(!d) return;
  codisPlanThemePreviewClose(true);
  codisPtPrevFocus = opener || document.activeElement; codisPtPrevId = d.id;
  const R = codisPtRoom(d), el = document.createElement('div');
  el.className = 'pt-ov'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'pt-ov-ttl'); el.setAttribute('aria-describedby', 'pt-ov-desc'); el.setAttribute('data-pt-target', d.target);
  el.innerHTML = '<div class="pt-ov-bg" onclick="codisPlanThemePreviewClose()"></div><div class="pt-ov-card">' +
    '<div class="pt-ov-head"><div class="pt-ov-chips"><span class="pt-rar">' + escapeHtml(d.rarityAr) + '</span><span class="pt-ov-room">' + escapeHtml(R.room) + '</span></div><button type="button" class="pt-ov-x" aria-label="إغلاق التفاصيل" onclick="codisPlanThemePreviewClose()">' + codisIcon('close') + '</button></div>' +
    '<div class="pt-ov-name" id="pt-ov-ttl"><b dir="ltr">' + escapeHtml(d.name) + '</b><span>' + escapeHtml(d.ar) + '</span></div>' +
    codisPlanThemeStageHtml(d.id, true) +
    '<dl class="pt-ov-meta"><div><dt>الغرفة</dt><dd>' + escapeHtml(R.room) + '</dd></div><div><dt>المربع</dt><dd>«' + escapeHtml(R.box) + '»</dd></div><div><dt>الندرة</dt><dd>' + escapeHtml(d.rarityAr) + '</dd></div></dl>' +
    '<p class="pt-ov-desc" id="pt-ov-desc">' + escapeHtml(d.desc) + '</p><div class="pt-ov-dyn">' + codisPtOvDynHtml(d) + '</div></div>';
  el.addEventListener('keydown', ev=>{
    if(ev.key !== 'Tab' || !el.contains(document.activeElement)) return;
    const f = Array.prototype.filter.call(el.querySelectorAll('button:not([disabled])'), b=>b.offsetParent !== null); if(!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if(ev.shiftKey && document.activeElement === a){ ev.preventDefault(); z.focus(); } else if(!ev.shiftKey && document.activeElement === z){ ev.preventDefault(); a.focus(); }
  });
  document.body.appendChild(el); codisPtPrevEl = el; codisSfx('open', { ctx:'store' });
  requestAnimationFrame(()=>{ el.classList.add('is-in'); const x = el.querySelector('.pt-ov-x'); if(x){ try{ x.focus({ preventScroll:true }); }catch(e){} } });
}
function codisPlanThemePreviewClose(silent){
  const el = codisPtPrevEl; if(!el) return; codisPtPrevEl = null;
  if(!silent) codisSfx('close', { ctx:'store' });
  el.remove();
  let f = codisPtPrevFocus; const id = codisPtPrevId; codisPtPrevFocus = null; codisPtPrevId = '';
  /* المتجر/بحوزتك قد يُعاد رسمهما أثناء فتح النافذة (شراء/تجهيز) ⇒ التركيز يرجع للبطاقة نفسها بنسختها الجديدة */
  if(!(f && f.isConnected) && id){ f = Array.prototype.find.call(document.querySelectorAll('.pt-mtile[data-ptid="' + id + '"] .pt-mbtn'), b=>b.offsetParent !== null) || null; }
  if(f && f.isConnected){ try{ f.focus({ preventScroll:true }); }catch(e){} }
}
document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && codisPtPrevEl){ ev.stopPropagation(); codisPlanThemePreviewClose(); } }, true);
