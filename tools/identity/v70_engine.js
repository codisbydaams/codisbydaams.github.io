/* =====================================================================
   CODIS-V70 · محرك الصناديق الجديد (BOX POINT CLASSIFICATION ENGINE)
   المصدر الوحيد لكل ما يخص تصنيف جوائز الصناديق واحتمالاتها. حلّ محل محرك فئات القيمة القديم
   (نطاقات القيمة وأسماؤها · أقصى فرق/مضاعف/عائد/احتمال ربح · ρ · سقف ونسبة الجوائز الضعيفة · حدّ الألف الأدنى · سقف الفئة الأدنى · حلّ β بالعائد المتوقع ·
    الحدّ الأدنى للقيمة · نسب المطوّر القديمة للفئات · أهلية الجوائز بالسعر المرجعي بالكوين) — حُذف كله ولا يؤثر بأي سحب.
   الطبقات (كل مسؤولية في مكان واحد):
     CODIS_BOX_RARITY_DEFS  الندرات العشر (معرّف ثابت · اسم · ترتيب · نطاق النقاط · ألوان · إعدادات العرض والكشف)
     CodisBoxPoints         القوة بالنقاط من وحدة القيمة: 1 كوين = 1 نقطة · 2 فضة = 1 نقطة · النقاط كما هي. ليست عملة.
     CODIS_BOX_PRIZE_TYPES  سجل أنواع الجوائز: محوّل (Adapter) لكل نوع = العناصر · القوة · دائم؟ · مملوك؟ · المنح بنظامه الأصلي
     CodisBoxClassifier     النقاط → الندرة (الحد الأدنى مشمول، الأعلى غير مشمول، 14000 مشمول بالأخيرة؛ خارج النطاق = غير مصنّف)
     CODIS_BOX_TIER_DEFS    الصناديق الخمسة: ست ندرات متتالية تبدأ من رقم الصندوق + الاحتمالات الثابتة 50/25/13/7/4/1
     CodisBoxes             المجمّع (layout/effective) · السحب (roll) · المنح (openInTx) · الشراء/الفتح/×10 — نفس الواجهة العامة القديمة
   ندرات الصناديق مستقلة تماماً عن ندرات المكافآت العامة C/B/A/S/SS (لا تقرأها ولا تغيّرها).
   ===================================================================== */
const CODIS_BOX_RARITY_DEFS = Object.freeze([
  Object.freeze({ id:'common',    rank:1,  ar:'عادي',   en:'Common',    min:0,    max:35,    rgb:'150,150,150', rgb2:'120,120,120', ink:'#5b5a55', inkDark:'#c9c7c0', show:Object.freeze({ frame:'none',   glow:0 }),    reveal:Object.freeze({ level:1, shine:false, pulse:false }) }),
  Object.freeze({ id:'good',      rank:2,  ar:'جيد',    en:'Good',      min:35,   max:67,    rgb:'238,236,228', rgb2:'206,203,192', ink:'#66645c', inkDark:'#f1efe8', show:Object.freeze({ frame:'thin',   glow:.15 }),  reveal:Object.freeze({ level:1, shine:false, pulse:false }) }),
  Object.freeze({ id:'bronze',    rank:3,  ar:'برونزي', en:'Bronze',    min:67,   max:105,   rgb:'132,137,146', rgb2:'98,103,112',  ink:'#4a4f57', inkDark:'#c6cad1', show:Object.freeze({ frame:'thin',   glow:.2 }),   reveal:Object.freeze({ level:2, shine:false, pulse:false }) }),
  Object.freeze({ id:'silver',    rank:4,  ar:'فضي',    en:'Silver',    min:105,  max:182,   rgb:'184,164,238', rgb2:'150,126,220', ink:'#5f45b5', inkDark:'#cbbcff', show:Object.freeze({ frame:'thin',   glow:.3 }),   reveal:Object.freeze({ level:3, shine:false, pulse:false }) }),
  Object.freeze({ id:'gold',      rank:5,  ar:'ذهبي',   en:'Gold',      min:182,  max:266,   rgb:'110,56,182',  rgb2:'78,34,140',   ink:'#562899', inkDark:'#b993ff', show:Object.freeze({ frame:'double', glow:.4 }),   reveal:Object.freeze({ level:4, shine:true,  pulse:false }) }),
  Object.freeze({ id:'platinum',  rank:6,  ar:'بلاتين', en:'Platinum',  min:266,  max:1000,  rgb:'246,172,206', rgb2:'228,130,176', ink:'#a1386c', inkDark:'#ffb8d8', show:Object.freeze({ frame:'double', glow:.5 }),   reveal:Object.freeze({ level:5, shine:true,  pulse:false }) }),
  Object.freeze({ id:'ace',       rank:7,  ar:'ايس',    en:'Ace',       min:1000, max:2000,  rgb:'212,44,122',  rgb2:'160,20,88',   ink:'#a01a59', inkDark:'#ff78b4', show:Object.freeze({ frame:'double', glow:.62 }),  reveal:Object.freeze({ level:6, shine:true,  pulse:true }) }),
  Object.freeze({ id:'master',    rank:8,  ar:'ماستر',  en:'Master',    min:2000, max:3000,  rgb:'255,180,104', rgb2:'236,140,60',  ink:'#8f4708', inkDark:'#ffc68e', show:Object.freeze({ frame:'ornate', glow:.74 }),  reveal:Object.freeze({ level:7, shine:true,  pulse:true }) }),
  Object.freeze({ id:'pro',       rank:9,  ar:'برو',    en:'Pro',       min:3000, max:6000,  rgb:'232,106,22',  rgb2:'180,70,6',    ink:'#9e4100', inkDark:'#ffa055', show:Object.freeze({ frame:'ornate', glow:.86 }),  reveal:Object.freeze({ level:8, shine:true,  pulse:true }) }),
  Object.freeze({ id:'legendary', rank:10, ar:'أسطوري', en:'Legendary', min:6000, max:14000, rgb:'156,20,34',   rgb2:'110,8,20',    ink:'#8a0e1b', inkDark:'#ff7676', show:Object.freeze({ frame:'ornate', glow:1 }),    reveal:Object.freeze({ level:9, shine:true,  pulse:true }) })
]);
/* القوة بالنقاط من وحدة القيمة. لا تقريب (999.5 تبقى 999.5). قيمة غير صالحة/سالبة ⇒ NaN (تذهب لتقرير غير المصنّف) */
const CodisBoxPoints = Object.freeze({
  UNITS:Object.freeze({ coin:1, silver:0.5, points:1 }),
  of(unit, amount){ const k = CodisBoxPoints.UNITS[unit], a = Number(amount); return (k && isFinite(a) && a >= 0) ? a * k : NaN; },
  coins(n){ return CodisBoxPoints.of('coin', n); }, silver(n){ return CodisBoxPoints.of('silver', n); }
});
const CodisBoxClassifier = Object.freeze({
  MAX:14000,
  rarityOf(p){
    p = Number(p); if(!isFinite(p) || p < 0 || p > 14000) return null;
    const R = CODIS_BOX_RARITY_DEFS;
    for(let i = 0; i < R.length; i++){ const r = R[i]; if(p >= r.min && (p < r.max || (i === R.length - 1 && p <= r.max))) return r; }
    return null;
  },
  byRank(n){ return CODIS_BOX_RARITY_DEFS[(n | 0) - 1] || null; },
  /* نغمة قديمة للعرض فقط (لون فن البطاقة العادية/الأنيميشن القديم) — لا تدخل التصنيف أبداً */
  tone(n){ return ['c', 'c', 'b', 'b', 'a', 'a', 's', 's', 'ss', 'ss'][Math.max(1, Math.min(10, n | 0)) - 1]; }
});
/* الصناديق الخمسة: start = أول ندرة؛ الست المتتالية تبدأ منها. الاحتمالات ثابتة بالمئة (نفسها للعرض وللسحب) */
const CODIS_BOX_ODDS = Object.freeze([50, 25, 13, 7, 4, 1]);
const CODIS_BOX_TIER_DEFS = Object.freeze([
  Object.freeze({ id:'bx1', name:'بكج برونزي',   tone:'c',  start:1, voucherTier:'bx2' }),
  Object.freeze({ id:'bx2', name:'بكج فضي',      tone:'b',  start:2, voucherTier:'bx3' }),
  Object.freeze({ id:'bx3', name:'بكج كريستالي', tone:'a',  start:3, voucherTier:'bx4' }),
  Object.freeze({ id:'bx4', name:'بكج ذهبي',     tone:'s',  start:4, voucherTier:'bx5' }),
  Object.freeze({ id:'bx5', name:'بكج خرافي',    tone:'ss', start:5, voucherTier:'' })
]);
const CODIS_BOX_VOUCHER_SETS = Object.freeze([2, 3, 4, 5]);   /* مجموعات القسائم (لا قسيمة منفردة) */
/* قوة ثابتة بالنقاط لعائلات ثيمات الغرف (حسب العائلة لا السعر القديم) · ثيمات الموافقة · بدايات الغرف */
const CODIS_BOX_THEME_FAMILY_POINTS = Object.freeze({ infernoCrystal:2500, frostCrystal:3100, agedWood:3500, blazingMeteor:6500 });
const CODIS_BOX_CONFIRM_POINTS = 1500, CODIS_BOX_INTRO_POINTS = 2500;

/* ===== سجل أنواع الجوائز (Adapters) =====
   كل نوع: kind · label · permanent (دائم: لا يتكرر، المملوك يخرج من السحب) · items(ctx) · value(item) ⇒ {unit, amount, note?} · owned(item) · grant(item, ctx) ⇒ نتيجة أو null.
   items تُقرأ عند الطلب من أنظمتها (لا تُخزَّن)؛ grant يعمل داخل CodisWallet.transact فقط وبمعرّف مشتق من الصندوق ⇒ لا منح مرتين.
   لا يوجد نوع «عملة مباشرة»: الكوين/الفضة/الجواهر لا تدخل الصناديق إطلاقاً. */
const CODIS_BOX_PRIZE_TYPES = Object.freeze([
  Object.freeze({ kind:'reward', label:'بطاقة مكافأة', permanent:false,
    items(){ try{ return data.settings.rewardItems.filter(x=>x && x.enabled && !x.fixed && !x.variantOf && !x.freebox && econRarityById(x.rarity) && CodisEconomy.storePrice(x) > 0).map(x=>Object.assign({}, x, { kind:'reward', rewardId:x.id })); }catch(e){ return []; } },
    value(x){ return { unit:'coin', amount:econEffCoin(x, econRarityById(x.rarity)), note:'قيمة الاستبدال بالكوين' }; },
    grant(x, c){ const rar = econRarityById(x.rarity); if(!rar) return null; const o = CodisInventory.grant({ uid:'own|box|' + c.uid, rewardId:x.rewardId || x.id, stickerId:x.stickerId, fin:x.fin, name:x.name, rarity:rar.id, rarityName:rar.name, rarityTone:rar.tone, rarityOrder:rar.order,
      room:x.room, source:'box', sourceRef:c.uid, coinValue:econEffCoin(x, rar), paid:null }); return o ? { owned:o, rec:{ rewardUid:o.uid } } : null; } }),
  Object.freeze({ kind:'pass', label:'بطاقة تجاوز عقوبة', permanent:false,
    items(){ try{ return CodisPasses.prizes(); }catch(e){ return []; } },
    value(x){ return { unit:'coin', amount:CodisPasses.price(x), note:'تكلفة تجاوز العقوبة المطابقة' }; },
    grant(x, c){ const p = CodisPasses.grant({ uid:'pass|box|' + c.uid, scope:x.scope, severity:x.severity, tier:c.tier.id, sourceRef:c.uid }); return p ? { pass:p, rec:{ passUid:p.uid } } : null; } }),
  Object.freeze({ kind:'holiday', label:'بطاقة عطلة', permanent:false,
    items(){ try{ return CodisHolidayCards.prizes(); }catch(e){ return []; } },
    value(x){ return { unit:'coin', amount:CodisHolidayCards.basePrice(x.cardKind), note:'السعر الأساسي بالكوين (بلا هامش المتجر)' }; },
    grant(x, c){ const h = CodisHolidayCards.grant({ uid:'hc|box|' + c.uid, kind:x.cardKind, source:'box', sourceRef:c.uid, tier:c.tier.id }); return h ? { holiday:h, rec:{ holidayUid:h.uid } } : null; } }),
  Object.freeze({ kind:'pouch', label:'كيس فضة', permanent:false,
    items(){ try{ return CodisPouches.prizes(); }catch(e){ return []; } },
    value(x){ const d = CodisPouches.def(x.pouchType); return { unit:'silver', amount:d ? d.average : NaN, note:'متوسط فضة الكيس' }; },
    grant(x, c){ const p = CodisPouches.grant({ uid:'pouch|box|' + c.uid, type:x.pouchType, tier:c.tier.id, sourceRef:c.uid }); return p ? { pouch:p, rec:{ pouchUid:p.uid } } : null; } }),
  Object.freeze({ kind:'voucher', label:'مجموعة قسائم', permanent:false,
    /* قسائم الصندوق التالي فقط (bx1 ⇒ قسائم bx2 …، bx5 بلا قسائم) كمجموعات 2–5. القوة = سعر القسيمة الحالي بالفضة × العدد ÷ 2 (يتبع تعديل السعر من لوحة المطوّر) */
    items(ctx){
      const out = []; try{
        CODIS_BOX_TIER_DEFS.forEach(bt=>{ if(ctx && ctx.tier && ctx.tier !== bt.id) return; const d = bt.voucherTier && CodisVouchers.def(bt.voucherTier); if(!d) return;
          CODIS_BOX_VOUCHER_SETS.forEach(n=>out.push({ id:'vset|' + bt.id + '|' + d.tier + '|' + n, kind:'voucher', tier:d.tier, n:n, forBox:bt.id, name:econFmt(n) + ' × ' + d.name, enabled:true })); });
      }catch(e){}
      return out;
    },
    value(x){ return { unit:'silver', amount:CodisVouchers.price(x.tier) * x.n, note:'سعر القسيمة × العدد' }; },
    grant(x, c){ if(x.forBox !== c.tier.id) return null; const v = CodisVouchers.grantInTx({ id:'vx|' + c.uid, t:'box', tier:x.tier, n:x.n, ref:c.uid }); return v ? { voucher:Object.assign(v, { n:x.n }), rec:{ voucher:v.ev.id } } : null; } }),
  Object.freeze({ kind:'cosmetic', label:'مظهر بطاقة', permanent:true,
    items(){ try{ return CodisCosmetics.defs().map(d=>({ id:'cosmetic|' + d.id, kind:'cosmetic', cosmeticId:d.id, defId:d.id, name:d.name, enabled:true })); }catch(e){ return []; } },
    value(x){ const d = CodisCosmetics.def(x.cosmeticId); return { unit:'silver', amount:d ? d.silver : NaN, note:'القيمة الأساسية بالفضة' }; },
    owned(x){ return CodisCosmetics.owns(x.cosmeticId); },
    grant(x, c){ const r = CodisCosmetics.grant({ id:x.cosmeticId, source:'box', sourceRef:c.uid }); return r ? { cosmetic:r, rec:{ cosmeticId:r.id } } : null; } }),
  Object.freeze({ kind:'planTheme', label:'ثيم غرفة', permanent:true,
    items(){ try{ return CodisPlanThemes.defs().map(d=>({ id:'plantheme|' + d.id, kind:'planTheme', defId:d.id, family:d.family || '', name:d.ar + ' · ' + codisPtRoom(d).room, enabled:true })); }catch(e){ return []; } },
    /* عائلة غير معرّفة بجدول النقاط ⇒ لا تخمين: سعرها الأساسي بالفضة ÷ 2 (ويُذكر بالتقرير) */
    value(x){ const p = CODIS_BOX_THEME_FAMILY_POINTS[x.family]; if(p) return { unit:'points', amount:p, note:'قوة ثابتة لعائلة الثيم' }; const d = CodisPlanThemes.def(x.defId); return { unit:'silver', amount:d ? d.silver : NaN, note:'عائلة جديدة: السعر الأساسي بالفضة', derived:true }; },
    owned(x){ return CodisPlanThemes.owns(x.defId); },
    grant(x, c){ const r = CodisPlanThemes.grant({ id:x.defId, sourceRef:c.uid }); return r ? { planTheme:r, rec:{ prizeDef:r.id } } : null; } }),
  Object.freeze({ kind:'confirmTheme', label:'ثيم نوافذ الموافقة', permanent:true,
    items(){ try{ return CodisConfirmThemes.defs().map(d=>({ id:'confirmtheme|' + d.id, kind:'confirmTheme', defId:d.id, name:'ثيم الموافقة ' + d.ar, enabled:true })); }catch(e){ return []; } },
    value(){ return { unit:'points', amount:CODIS_BOX_CONFIRM_POINTS, note:'قوة ثابتة لثيمات الموافقة' }; },
    owned(x){ return CodisConfirmThemes.owns(x.defId); },
    grant(x, c){ const r = CodisConfirmThemes.grant({ id:x.defId, sourceRef:c.uid }); return r ? { confirmTheme:r, rec:{ prizeDef:r.id } } : null; } }),
  Object.freeze({ kind:'roomIntro', label:'بداية غرفة', permanent:true,
    items(){ try{ return CodisRoomIntros.defs().map(d=>({ id:'roomintro|' + d.id, kind:'roomIntro', defId:d.id, name:'بداية ' + d.roomAr + ' «' + d.ar + '»', enabled:true })); }catch(e){ return []; } },
    value(){ return { unit:'points', amount:CODIS_BOX_INTRO_POINTS, note:'قوة ثابتة لبدايات الغرف' }; },
    owned(x){ return CodisRoomIntros.owns(x.defId); },
    grant(x, c){ const r = CodisRoomIntros.grant({ id:x.defId, sourceRef:c.uid }); return r ? { roomIntro:r, rec:{ prizeDef:r.id } } : null; } })
]);

/* ===== المكررات: منتج دائم سُحب وهو مملوك ⇒ نسخة مكررة في «بحوزتك» تُفكَّك مقابل فضة بقاعدة تفكيك بطاقات العقوبة نفسها
   (CodisDismantle: الفضة = floor(القوة × 1.5)، والقوة بالنقاط = قيمتها بالكوين). القوة تُثبَّت لحظة المنح. الملكية الأصلية لا تُمس.
   data.inventory.boxDupes = [{ uid, kind, defId, points, tier, sourceRef, acquiredAt, status:'owned' }] — التفكيك يحذف السجل (مثل بطاقات التجاوز) ===== */
const CodisBoxDupes = (function(){
  const KINDS = ['cosmetic', 'planTheme', 'confirmTheme', 'roomIntro'];
  function all(){ if(!Array.isArray(data.inventory.boxDupes)) data.inventory.boxDupes = []; return data.inventory.boxDupes; }
  function get(uid){ return all().find(d=>d.uid === uid) || null; }
  function owned(){ return all().filter(d=>d.status === 'owned').sort((a, b)=>a.acquiredAt < b.acquiredAt ? -1 : a.acquiredAt > b.acquiredAt ? 1 : (a.uid < b.uid ? -1 : 1)); }
  function name(d){
    try{
      if(d.kind === 'cosmetic'){ const x = CodisCosmetics.def(d.defId); return x ? x.name : d.defId; }
      if(d.kind === 'planTheme'){ const x = CodisPlanThemes.def(d.defId); return x ? x.ar + ' · ' + codisPtRoom(x).room : d.defId; }
      if(d.kind === 'confirmTheme'){ const x = CodisConfirmThemes.def(d.defId); return x ? 'ثيم الموافقة ' + x.ar : d.defId; }
      if(d.kind === 'roomIntro'){ const x = CodisRoomIntros.def(d.defId); return x ? 'بداية ' + x.roomAr + ' «' + x.ar + '»' : d.defId; }
    }catch(e){}
    return String(d.defId || '');
  }
  /* داخل transact فقط؛ المعرّف مشتق من الصندوق ⇒ لا منح مرتين */
  function grant(o){
    const p = Number(o && o.points);
    if(!o || !o.uid || get(String(o.uid)) || KINDS.indexOf(o.kind) === -1 || !o.defId || !(p > 0)) return null;
    const d = { uid:String(o.uid), kind:o.kind, defId:String(o.defId), points:p, tier:econBoxTierIds().indexOf(o.tier) !== -1 ? o.tier : '', sourceRef:String(o.sourceRef || ''), acquiredAt:econNowIso(), status:'owned' };
    all().push(d); return d;
  }
  return { KINDS:KINDS.slice(), all, get, owned, name, grant };
})();
const CodisBoxes = (function(){
  const KEEP_OPENED_N = 100, BULK = 10;
  const TYPES = {}; CODIS_BOX_PRIZE_TYPES.forEach(a=>{ TYPES[a.kind] = a; });
  const PRIZE_KINDS = Object.freeze(CODIS_BOX_PRIZE_TYPES.map(a=>a.kind));
  function prizeAllowed(x){ return !!x && !!TYPES[x.kind]; }
  function tiers(){
    return CODIS_BOX_TIER_DEFS.map((m, i)=>({ id:m.id, name:m.name, tone:m.tone, index:i + 1, start:m.start, ranks:CODIS_BOX_ODDS.map((_, k)=>m.start + k), odds:CODIS_BOX_ODDS.slice(), voucherTier:m.voucherTier,
      price:econBoxPrice(m.id), gems:econBoxGemPrice(m.id) }));   /* gems = سعر الشراء (بلا تغيير) · price = رقم مرجعي قديم بالكوين لا يدخل السحب */
  }
  function tier(id){ return tiers().find(t=>t.id === id) || null; }
  /* ===== BOX_POINT_ENGINE: قوة عنصر واحد (المصدر الوحيد — لا حساب نقاط بأي مكان آخر) ===== */
  function powerInfo(x){
    const a = x && TYPES[x.kind]; if(!a) return { points:NaN, unit:'', amount:NaN };
    let v = null; try{ v = a.value(x); }catch(e){ v = null; }
    if(!v) return { points:NaN, unit:'', amount:NaN };
    return { points:CodisBoxPoints.of(v.unit, v.amount), unit:v.unit, amount:Number(v.amount), note:v.note || '', derived:!!v.derived };
  }
  function valueOf(x){ const p = powerInfo(x).points; return isFinite(p) ? p : 0; }
  /* ===== BOX_ITEM_REGISTRY + BOX_REWARD_CLASSIFIER: كل الجوائز بكل الأنواع مع قوتها وندرتها (للعرض والتقارير والاختبارات) ===== */
  function catalog(ctx){
    const out = [];
    CODIS_BOX_PRIZE_TYPES.forEach(a=>{ let L = []; try{ L = a.items(ctx || {}) || []; }catch(e){ L = []; }
      L.forEach(x=>{ if(!x || x.enabled === false) return; const pi = powerInfo(x), r = CodisBoxClassifier.rarityOf(pi.points); let own = false; if(a.permanent){ try{ own = !!a.owned(x); }catch(e){ own = false; } }
        out.push({ item:x, kind:a.kind, permanent:a.permanent, owned:own, points:pi.points, unit:pi.unit, amount:pi.amount, derived:pi.derived, rarity:r, rank:r ? r.rank : 0 }); }); });
    return out;
  }
  function unclassified(){ return catalog().filter(c=>!c.rarity); }
  /* منتج دائم بمعرّف تعريفه (للمتجر: «القوة» وندرة العرض) — يبحث بأنواع المنتجات الدائمة فقط، بلا بناء السجل كله */
  function findDef(defId){
    for(let i = 0; i < CODIS_BOX_PRIZE_TYPES.length; i++){ const a = CODIS_BOX_PRIZE_TYPES[i]; if(!a.permanent) continue; let L = []; try{ L = a.items({}) || []; }catch(e){ L = []; } const x = L.find(x=>x.defId === defId); if(x) return x; }
    return null;
  }
  function powerOfDef(defId){ const x = findDef(defId); return x ? powerInfo(x).points : NaN; }
  function rarityOfDef(defId){ return CodisBoxClassifier.rarityOf(powerOfDef(defId)); }
  /* ===== BOX_REWARD_POOL: المؤهّل لصندوق = ندرته ضمن نطاق الصندوق، والقسائم الخاصة بهذا الصندوق فقط.
     قرار المالك: كل شيء يمكن أن يطلع أكثر من مرة — الدائم المملوك يبقى بالسحب ويُمنح «مكرراً» يُفكَّك مقابل فضة ===== */
  function eligible(t){
    return catalog({ tier:t.id }).filter(c=>c.rarity && t.ranks.indexOf(c.rank) !== -1 && (c.kind !== 'voucher' || c.item.forBox === t.id));
  }
  /* الصفوف الست دائماً (حتى الفارغة) — للعرض الصريح: لا احتمال وهمي ولا إخفاء */
  function layout(t){
    const el = eligible(t);
    return t.ranks.map((rank, k)=>{
      const R = CodisBoxClassifier.byRank(rank), g = el.filter(c=>c.rank === rank).sort((a, b)=>a.points - b.points || String(a.item.id).localeCompare(String(b.item.id)));
      const vals = g.map(c=>c.points);
      return { id:'br' + rank, rank:rank, key:R.id, name:R.ar, en:R.en, rarity:R, tone:CodisBoxClassifier.tone(rank), rgb:R.rgb, pct:t.odds[k], pm:t.odds[k] * 10, order:k + 1, band:rank,
        items:g.map(c=>c.item), vals:vals, n:g.length, min:R.min, max:R.max, mean:vals.length ? vals.reduce((s, v)=>s + v, 0) / vals.length : 0 };
    });
  }
  function ready(t){ return !!t && layout(t).every(r=>r.n > 0); }
  /* توافق: effective = الصفوف المستعملة بالسحب، أو [] إن كانت أي ندرة من الست فارغة (الصندوق غير متاح — لا شراء ولا فتح ولا سحب بديل) */
  function effective(t){ if(!t) return []; const rows = layout(t); return rows.every(r=>r.n > 0) ? rows : []; }
  function effectiveBase(t){ return effective(t); }
  function emptyRanks(t){ return t ? layout(t).filter(r=>!r.n).map(r=>r.rarity) : []; }
  function stats(t){ const rows = effective(t), ev = rows.reduce((s, o)=>s + o.pct / 100 * o.mean, 0); return { evPoints:ev, classes:rows.length, ready:rows.length === 6, minPrize:rows.length ? rows[0].vals[0] : 0, maxPrize:rows.length ? rows[5].vals[rows[5].vals.length - 1] : 0 }; }
  function pool(){ return TYPES.reward.items(); }
  function prizePool(tierId){ const t = tier(tierId); return t ? eligible(t).map(c=>c.item) : catalog().filter(c=>c.rarity).map(c=>c.item); }
  function list(){ if(!data.inventory.boxes) data.inventory.boxes = []; return data.inventory.boxes; }
  function owned(tierId){ return list().filter(b=>b.status === 'unopened' && (!tierId || b.tier === tierId)).sort((a,b)=>a.acquiredAt < b.acquiredAt ? -1 : a.acquiredAt > b.acquiredAt ? 1 : 0); }
  function get(uid){ return list().find(b=>b.uid === uid) || null; }
  function pruneOpened(){
    const op = list().filter(b=>b.status === 'opened').sort((a,b)=>a.openedAt < b.openedAt ? 1 : a.openedAt > b.openedAt ? -1 : 0);
    const keepN = CodisLimits.bypass('box.prune') ? Infinity : CodisLimits.num('box.keepOpened', KEEP_OPENED_N);
    if(op.length <= keepN) return;
    const drop = {}; op.slice(keepN).forEach(b=>{ drop[b.uid] = true; });
    data.inventory.boxes = list().filter(b=>!drop[b.uid]);
  }
  /* ندرة العرض لبطاقة النتيجة: المكافأة العادية تبقى بندرتها الأصلية (لرسم بطاقتها فقط)؛ البقية باسم ندرة الصندوق ونغمة عرض مشتقة */
  function displayRarity(kind, item, R){
    if(kind === 'reward'){ const r = econRarityById(item.rarity); if(r) return r; }
    return { id:'BOXR' + R.rank, name:R.ar, tone:CodisBoxClassifier.tone(R.rank), order:R.rank };
  }
  /* ===== BOX_REWARD_PICKER: (1) الندرة بالاحتمال الثابت (2) عنصر متساوي الحظ من مؤهّلي تلك الندرة. لا يغيّر أي حالة ===== */
  function roll(t){
    if(!t) return null;
    const rows = layout(t);
    if(!rows.every(r=>r.n > 0)) return null;   /* ندرة فارغة ⇒ لا سحب (لا احتمال وهمي ولا بديل مخفي) */
    const row = CodisRewardEngine.pick(rows, x=>x.pct); if(!row) return null;
    const item = CodisRewardEngine.pick(row.items, ()=>1); if(!item || !prizeAllowed(item)) return null;
    const R = row.rarity, out = { item:item, prizeKind:item.kind, rank:R.rank, boxRarity:R, rarity:displayRarity(item.kind, item, R), cls:row, pm:row.pm, pct:row.pct, points:valueOf(item) };
    if(item.kind === 'pass') out.pass = { scope:item.scope, severity:item.severity };
    return out;
  }
  function buyInTx(t){
    const tx = CodisWallet.applyGems('PURCHASE_BOX', -t.gems, 'شراء ' + t.name, 'store', 'box|' + t.id + '|' + econUid('b'), { name:t.name, tier:t.id });
    if(!tx) return { ok:false, reason:'tx' };
    const box = { uid:'box|' + tx.id, tier:t.id, paid:t.gems, currency:'GEMS', acquiredAt:tx.createdAt, status:'unopened', sourceRef:tx.id };
    if(get(box.uid)) return { ok:false, reason:'inventory' };
    list().push(box);
    return { ok:true, tx:tx, price:t.gems, tier:t, box:box };
  }
  function buy(tierId){
    const t = tier(tierId); if(!t) return { ok:false, reason:'unavailable' };
    if(!ready(t)) return { ok:false, reason:'empty', empty:emptyRanks(t) };
    const gb = CodisWallet.gemBalance(); if(!CodisLimits.afford(gb, t.gems)) return { ok:false, reason:'insufficient', need:t.gems - gb, price:t.gems };
    return CodisWallet.transact([], ()=>buyInTx(t));
  }
  /* ===== BOX_REWARD_GRANT: منح الجائزة لنظامها الأصلي + ربطها بالصندوق + opened — داخل transact فقط ===== */
  function openInTx(uid, t, r, keepOpened){
    const b = get(uid);
    if(!b || b.status !== 'unopened') return { ok:false, reason:'opened' };
    if(!r || !r.item || !prizeAllowed(r.item) || !r.boxRarity || t.ranks.indexOf(r.rank) === -1) return { ok:false, reason:'kind' };
    const a = TYPES[r.item.kind];
    if(r.item.kind === 'voucher' && r.item.forBox !== t.id) return { ok:false, reason:'kind' };
    let own = false; if(a.permanent){ try{ own = !!a.owned(r.item); }catch(e){ own = true; } }
    /* دائم مملوك ⇒ مكرر بـ«بحوزتك» (الملكية الأصلية لا تُمس)، وإلا المنح بنظامه الأصلي */
    const g = own ? (()=>{ const d = CodisBoxDupes.grant({ uid:'dupe|box|' + uid, kind:r.item.kind, defId:r.item.defId || r.item.cosmeticId, points:valueOf(r.item), tier:t.id, sourceRef:uid }); return d ? { dupe:d, rec:{ dupeUid:d.uid } } : null; })()
      : a.grant(r.item, { uid:uid, tier:t });
    if(!g) return { ok:false, reason:'inventory' };
    b.status = 'opened'; b.openedAt = econNowIso(); b.rar = r.rank; b.prize = String(r.item.id).slice(0, 120);
    Object.keys(g.rec || {}).forEach(k=>{ b[k] = g.rec[k]; });
    if(!keepOpened) pruneOpened();
    return { ok:true, box:b, item:r.item, prizeKind:r.item.kind, rarity:r.rarity, boxRarity:r.boxRarity, rank:r.rank, points:r.points, tier:t, pm:r.pm, pct:r.pct, cls:r.cls,
      owned:g.owned || null, pass:g.pass || null, holiday:g.holiday || null, pouch:g.pouch || null, cosmetic:g.cosmetic || null, voucher:g.voucher || null, planTheme:g.planTheme || null, confirmTheme:g.confirmTheme || null, roomIntro:g.roomIntro || null, dupe:g.dupe || null };
  }
  function open(uid){
    const box = get(uid);
    if(!box) return { ok:false, reason:'notowned' };
    if(box.status !== 'unopened') return { ok:false, reason:'opened' };
    const t = tier(box.tier); if(!t) return { ok:false, reason:'invalid' };
    if(!ready(t)) return { ok:false, reason:'empty', empty:emptyRanks(t) };   /* لا يُستهلك الصندوق */
    const r = roll(t); if(!r) return { ok:false, reason:'empty' };
    return CodisWallet.transact([], ()=>openInTx(uid, t, r));
  }
  /* ×10: عشرة سحوبات مستقلة بالاحتمالات نفسها؛ الدائم المسحوب مرتين = الثاني مكرر (يُفكَّك) — كل شيء قابل للتكرار */
  function buyOpenMany(tierId){
    const t = tier(tierId); if(!t) return { ok:false, reason:'unavailable' };
    if(!ready(t)) return { ok:false, reason:'empty', empty:emptyRanks(t) };
    const total = t.gems * BULK, bal0 = CodisWallet.gemBalance();
    if(!CodisLimits.afford(bal0, total)) return { ok:false, reason:'insufficient', need:total - bal0, price:t.gems, total:total };
    const rolls = [];
    for(let i = 0; i < BULK; i++){ const r = roll(t); if(!r) return { ok:false, reason:'empty' }; rolls.push(r); }
    return CodisWallet.transact([], ()=>{
      const bought = [], seenTx = {}, seenBox = {};
      for(let i = 0; i < BULK; i++){
        const b = buyInTx(t); if(!b.ok) return b;
        if(seenTx[b.tx.id] || seenBox[b.box.uid]) return { ok:false, reason:'inventory' };
        seenTx[b.tx.id] = true; seenBox[b.box.uid] = true; bought.push(b);
      }
      const items = [];
      for(let i = 0; i < BULK; i++){
        const o = openInTx(bought[i].box.uid, t, rolls[i], true); if(!o.ok) return o;
        o.tx = bought[i].tx; items.push(o);
      }
      pruneOpened();
      return { ok:true, tier:t, n:BULK, price:t.gems, total:total, items:items, balanceBefore:bal0, balanceAfter:CodisWallet.gemBalance() };
    });
  }
  return { tiers, tier, pool, prizePool, PRIZE_KINDS, TYPES, catalog, unclassified, powerInfo, powerOfDef, rarityOfDef, layout, ready, emptyRanks, effective, effectiveBase, stats, valueOf, owned, get, roll, buy, open, buyOpenMany, BULK,
    RARITIES:CODIS_BOX_RARITY_DEFS, ODDS:CODIS_BOX_ODDS, classify:CodisBoxClassifier.rarityOf };
})();
