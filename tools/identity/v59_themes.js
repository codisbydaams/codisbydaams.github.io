/* ================= CODIS-V59: ثيمات الغرف — + عائلة FROST CRYSTAL «الجليد الصاقع» (يحلّ محل وحدة V58 حرفياً؛ كل ما سبق كما هو) =================
   V59: عائلة ثانية بثلاثة منتجات (frostCrystalPlanning · frostCrystalOperations · frostCrystalTeacher، 7,999 فضة لكلٍّ) + راسم 'frost'
   (بلورات سداسية، طبقات جليد شفافة، رف جليدي لكل غرفة، لمعات، وطبقة ثلج CSS). الـCSS يميّز العائلة بـ[data-pt^="frostCrystal"]
   على السطح نفسه (data-pt موجود أصلاً) ⇒ لا سمات/حقول جديدة على أسطح الغرف؛ البطاقة المصغّرة ونافذة التفاصيل فقط تحملان data-pt-fam.
   ================= (نص V58 الأصلي) =================
   توسعة لنظام V56/V57 (لا نظام موازٍ): نفس السجل/الملكية/الشراء/المعاملة/التجهيز لكل غرفة. لا بيانات مستخدم جديدة.
   • العائلة (CODIS_THEME_FAMILIES): id · name · ar · desc · order — تجمع منتجات الغرف بالمتجر و«بحوزتك» (عنوان + وصف + شبكة، وفاصل بين العائلات).
     عائلة جديدة = سطر هنا + منتجاتها بـfamily:'<id>'؛ منتج بعائلة مجهولة يُعرض بعائلة مشتقة منه (لا يختفي).
   • المنتج (CODIS_PLAN_THEME_DEFS): id · family · name · ar · target · silver · rarity · rarityAr · desc · art · motion · tokens.
   • الغرفة (CODIS_THEME_TARGETS): الأسطح التي يلبسها ثيمها (surfaces). أنواع السطح:
       box   = مربع انتظار: .pt-box + رموز + طبقة .pt-decor (ورسمة الغرفة الأصلية تُعاد معالجتها بالـCSS)
       card  = بطاقة ثابتة بالـHTML (بطاقة الخطة النشطة): .pt-card + رموز + طبقة .pt-decor واحدة
       scope = حاوية قائمة تُبنى عناصرها ديناميكياً (مستطيلات المهام): .pt-scope + data-pt + رموز فقط؛ الـCSS يلبّس كل
               عنصر جديد تلقائياً (لا كود بعد إنشاء كل مستطيل، ولا أثر خارج حاوية تلك الغرفة).
     التطبيق/الإزالة idempotent ويزيلان فقط ما أضافاه (رموز --pt-* وأصناف/سمات pt) — خصائص style الأصلية (مثل عرض شريط الإنجاز) لا تُمس.
   • الحالة: data.inventory.planThemes = { owned:[...], equipped:'<ثيم التخطيط>', equippedByTarget:{ planning, operations, teacher } }
     (equipped حقل V56 = مصدر الحقيقة لغرفة التخطيط). الشراء: CodisWallet.transact واحدة (PURCHASE_COSMETIC بمرجع plantheme|<id>). */
const CODIS_THEME_TARGETS = {
  planning:{ sel:'#planning-empty', room:'غرفة التخطيط', short:'التخطيط', box:'ابدأ بناء خطة أسبوعك', btn:'ابدأ بناء الخطة',
    surfaces:[ { key:'emptyState', kind:'box', sel:'#planning-empty > .empty-state', label:'مربع «ابدأ بناء خطة أسبوعك»', short:'مربع البداية' },
      { key:'writeBox', kind:'panel', sel:'#plan-editor .write-box', all:true, label:'مربع كتابة الخطة والمهام', short:'مربع كتابة الخطة' },
      { key:'activePlanCard', kind:'card', sel:'#planning-active > .plan-card', label:'بطاقة الخطة النشطة ونسبة الإنجاز', short:'بطاقة الخطة النشطة' } ] },
  operations:{ sel:'#tasks-empty', room:'غرفة العمليات', short:'العمليات', box:'العمليات بانتظار خطة', btn:'روح لغرفة التخطيط',
    surfaces:[ { key:'emptyState', kind:'box', sel:'#tasks-empty > .empty-state', label:'مربع «العمليات بانتظار خطة»', short:'مربع الانتظار' },
      { key:'taskItems', kind:'scope', sel:'#day-task-list', label:'مستطيلات المهام: الاسم والوزن وخيارات الحالة', short:'مستطيلات المهام' },
      { key:'clearState', kind:'inner', sel:'#day-task-list > .empty-state.is-clear', label:'مربع «كل مهام اليوم محسومة»', short:'كل المهام محسومة' } ] },
  teacher:{ sel:'#learn-empty', room:'غرفة الأستاذ', short:'الأستاذ', box:'مسارك التعليمي لم يبدأ بعد', btn:'روح لغرفة التخطيط',
    surfaces:[ { key:'emptyState', kind:'box', sel:'#learn-empty > .empty-state', label:'مربع «مسارك التعليمي لم يبدأ بعد»', short:'مربع المسار' },
      { key:'learningTaskItems', kind:'scope', sel:'#learn-day-task-list', label:'المستطيلات التعليمية: الاسم والوزن وخيارات الحالة', short:'المستطيلات التعليمية' },
      { key:'clearState', kind:'inner', sel:'#learn-day-task-list > .empty-state.is-clear', label:'مربع «كل عناصر اليوم محسومة»', short:'كل العناصر محسومة' } ] }
};
const CODIS_THEME_FAMILIES = [
  { id:'infernoCrystal', name:'Inferno Crystal', ar:'الجحيم الكريستالي', order:10,
    desc:'أوبسيديان أسود تشقّه عروق حمم منصهرة، بحواف كريستالية وذهب شمبانيا. كل منتج يلبّس غرفة كاملة: مربعها وبطاقاتها ومستطيلات مهامها.' },
  { id:'frostCrystal', name:'Frost Crystal', ar:'الجليد الصاقع', order:20,
    desc:'عالم من البلورات الجليدية النقية، تتداخل فيه طبقات الجليد الشفاف مع انعكاسات الضوء الأبيض والسماوي. تصميم قطبي مضيء، تحيط به بلورات متلألئة وتساقط ثلجي هادئ يمنح غرفتك إحساساً بالنقاء والفخامة.' }
];
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
  const base = { family:'infernoCrystal', name:'Inferno Crystal', ar:'الجحيم الكريستالي', silver:3499, rarity:'legendary', rarityAr:'أسطوري', art:'inferno', tokens:inferno };
  /* هوية FROST CRYSTAL: Snow White · Crystal White · Ice Blue · Glacier Cyan · Frozen Silver · Pale Aqua · Deep Arctic (للنص والعمق).
     النص داكن قطبي فوق جليد مضيء (تباين ≥ 7:1 للعنوان و≥ 4.5:1 للنص الثانوي) */
  const frost = {
    '--pt-bg':'radial-gradient(90% 46% at 82% -6%, rgb(255 255 255 / .95), rgb(255 255 255 / 0) 64%), radial-gradient(70% 52% at 8% 0%, rgb(188 231 250 / .55), rgb(255 255 255 / 0) 70%), radial-gradient(120% 60% at 50% 118%, rgb(88 197 233 / .34), rgb(255 255 255 / 0) 64%), linear-gradient(168deg, #FFFFFF 0%, #F3FAFF 30%, #E4F4FD 62%, #D3ECFA 100%)',
    '--pt-edge':'0 0 0 1px rgb(120 186 222 / .62), inset 0 0 0 1px rgb(255 255 255 / .9), inset 0 2px 0 rgb(255 255 255 / .95), inset 0 -14px 26px -18px rgb(88 197 233 / .45), 0 18px 34px -18px rgb(28 84 128 / .32), 0 22px 40px -26px rgb(88 197 233 / .6)',
    '--pt-title':'#0B3352', '--pt-title-glow':'0 1px 0 rgb(255 255 255 / .95), 0 0 16px rgb(139 216 244 / .55)', '--pt-copy':'#33607F',
    '--pt-ea-paper':'#FBFEFF', '--pt-ea-ink':'#2C5D80', '--pt-ea-line':'rgb(44 93 128 / .32)', '--pt-ea-shade':'rgb(120 178 214 / .38)', '--pt-ea-acc':'#1FA3D6', '--pt-road':'#CDEEFC', '--pt-road-edge':'rgb(88 197 233 / .55)', '--pt-gem':'#8BD8F4', '--pt-gem-edge':'#FFFFFF',
    '--pt-metal':'#DCEBFA', '--pt-metal-edge':'#9FB9CF', '--pt-socket':'#F1F9FE', '--pt-mark-ink':'#0B3352',
    '--pt-art-glow':'drop-shadow(0 0 7px rgb(139 216 244 / .7)) drop-shadow(0 2px 2px rgb(28 84 128 / .2))',
    '--pt-btn-bg':'linear-gradient(160deg, rgb(255 255 255 / .9) 0 26%, rgb(255 255 255 / 0) 26.5%) padding-box, linear-gradient(180deg, #FFFFFF, #E6F6FE 52%, #CBEBFA) padding-box, linear-gradient(180deg, #FFFFFF, #8BD8F4 46%, #3FB4E0) border-box',
    '--pt-btn-tx':'#0A3A5A', '--pt-btn-sh':'0 0 0 1px rgb(63 140 190 / .28), inset 0 1px 0 #fff, inset 0 -3px 8px -4px rgb(88 197 233 / .45), 0 10px 20px -10px rgb(30 120 170 / .5)',
    '--pt-btn-sh-hover':'0 0 0 1px rgb(63 140 190 / .32), inset 0 1px 0 #fff, inset 0 -3px 8px -4px rgb(88 197 233 / .55), 0 0 0 4px rgb(139 216 244 / .28), 0 0 18px 2px rgb(139 216 244 / .55), 0 12px 24px -10px rgb(30 120 170 / .55)',
    '--pt-btn-sh-press':'0 0 0 1px rgb(63 140 190 / .4), inset 0 2px 8px rgb(63 160 210 / .38), inset 0 0 0 1px rgb(255 255 255 / .6), 0 3px 8px -5px rgb(30 120 170 / .5)',
    '--pt-focus':'#1C8FC4', '--pt-frame':'rgb(255 255 255 / .9)', '--pt-chip':'#58C5E9'
  };
  const fbase = { family:'frostCrystal', name:'Frost Crystal', ar:'الجليد الصاقع', silver:7999, rarity:'legendary', rarityAr:'أسطوري', art:'frost', tokens:frost };
  const frostDefs = [
    Object.assign({}, fbase, { id:'frostCrystalPlanning', target:'planning', motion:{ sheen:12, breath:7, glint:6.5, snow:22 },
      desc:'لوح كريستالي أبيض بحواف جليدية شفافة يلبّس غرفة التخطيط: مربع «ابدأ بناء خطة أسبوعك» (ورقة جليد ومسار محفور وعلم بلوري) وبطاقة الخطة النشطة كلوحة تحكم قطبية، نسبة إنجاز بحبر قطبي ومسار تقدّم من بلورة مضيئة، وثلج هادئ يتساقط خلفها.' }),
    Object.assign({}, fbase, { id:'frostCrystalOperations', target:'operations', motion:{ sheen:13, breath:7.5, glint:7, snow:24 },
      desc:'لوحة عمليات قطبية: مربع الانتظار (لوح مهام فضي بخانات جليدية) وكل مستطيلات المهام كقطع جليد هندسية — زوايا بلورية سداسية، سكة حالة متوهجة، شريحة وزن فضية، وحالات واضحة: سماوي كريستالي لـ«خلصتها»، ذهبي جليدي لـ«نصها»، وردي بارد لـ«ما سويتها».' }),
    Object.assign({}, fbase, { id:'frostCrystalTeacher', target:'teacher', motion:{ sheen:14, breath:8, glint:7.5, snow:26 },
      desc:'كتاب كريستالي لغرفة الأستاذ: مربع المسار (كتاب بأوراق جليد ومحطات بلورية) وكل المستطيلات التعليمية كصفحات جليد شفافة — كعب فضي مضاء، حواف صفحات متجمدة، محطة بلورية لكل درس، وفاصل صفحة سماوي يحمل حالة الدرس.' })
  ];
  return [
    Object.assign({}, base, { id:'infernoCrystal', target:'planning', motion:{ sheen:11, breath:6.5, glint:7 },
      desc:'أوبسيديان أسود تشقّه عروق حمم منصهرة، بحواف كريستالية وأركان معدنية كلاسيكية — يلبّس غرفة التخطيط: مربع «ابدأ بناء خطة أسبوعك» (الورقة والمسار المحفور والعلم الكريستالي) وبطاقة الخطة النشطة بنسبة إنجاز منصهرة وشريط تقدّم من الحمم.' }),
    Object.assign({}, base, { id:'infernoCrystalOperations', target:'operations', motion:{ sheen:12, breath:7, glint:7.5 },
      desc:'يلبّس غرفة العمليات: مربع الانتظار (لوح المهام بمشبك شمبانيا وخانات محفورة بحافة جمر) وكل مستطيلات المهام — شريحة وزن معدنية ولوحة حالات: كريستال لـ«خلصتها»، كهرمان لـ«نصها»، قرمزي لـ«ما سويتها».' }),
    Object.assign({}, base, { id:'infernoCrystalTeacher', target:'teacher', motion:{ sheen:13, breath:7.5, glint:8 },
      desc:'يلبّس غرفة الأستاذ: مربع المسار (كتاب بأوراق أوبسيديان ومحطات كهرمان) وكل المستطيلات التعليمية كأغلفة كتب فاخرة — حفر ذهبي وكعب مضاء ومحطة كريستالية لكل درس.' })
  ].concat(frostDefs);
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
  },
  /* FROST CRYSTAL — نفس الطبقة لكل الأسطح (المربعات، بطاقة الخطة، المعاينات)؛ الغرفة تخصّص الرف الجليدي السفلي فقط:
     التخطيط = قمم جليد · العمليات = رف هندسي بمدرجات وشبكة سداسية · الأستاذ = كتاب جليدي مفتوح بفاصل بلوري.
     كل الرسم SVG مضمَّن (لا فلاتر SVG)، والحركة من الـCSS على عناصر HTML (transform/opacity فقط). */
  frost:function(d, u, mini){
    const g = (id)=>'pt' + u + id, tg = (d && d.target) || 'planning', W = '#FFFFFF', C = '#58C5E9';
    const lin = (id, x2, y2, stops)=>'<linearGradient id="' + g(id) + '" x1="' + (x2 < 0 ? 1 : 0) + '" y1="0" x2="' + (x2 < 0 ? 0 : x2) + '" y2="' + y2 + '">' + stops.map(s=>'<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + s[2] + '"/>').join('') + '</linearGradient>';
    const hexLattice = tg === 'operations' && !mini ? '<defs><pattern id="' + g('hx') + '" width="24" height="41.57" patternUnits="userSpaceOnUse"><path d="M12 0L24 6.93V20.78L12 27.71L0 20.78V6.93Z M12 27.71V41.57" fill="none" stroke="' + C + '" stroke-width=".7"/></pattern>' +
      lin('hm', 0, 1, [[0, W, 1], [1, W, 0]]) + '<mask id="' + g('hk') + '"><rect width="400" height="220" fill="url(#' + g('hm') + ')"/></mask></defs><rect width="400" height="220" fill="url(#' + g('hx') + ')" opacity=".26" mask="url(#' + g('hk') + ')"/>' : '';
    const facets = '<svg class="pt-facets" viewBox="0 0 400 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>' +
      lin('fa', 1, 1, [[0, W, .95], [1, '#EAF7FF', 0]]) + lin('fb', -1, 1, [[0, '#D8F0FF', .9], [1, '#EAF7FF', 0]]) +
      (mini ? '' : lin('fc', 1, 0, [[0, '#8BD8F4', 0], [.3, '#BCE7FA', .4], [.5, W, .6], [.7, '#DDF7F3', .4], [1, '#8BD8F4', 0]])) + '</defs>' + hexLattice +
      (mini ? '' : '<path d="M236 0H300L120 480H56Z" fill="url(#' + g('fc') + ')" opacity=".42"/>') +
      '<g stroke="' + W + '" stroke-opacity=".9" stroke-width="1" stroke-linejoin="round">' +
      '<path d="M0 0H168L104 66L0 112Z" fill="url(#' + g('fa') + ')"/><path d="M168 0H236L170 30L104 66Z" fill="url(#' + g('fb') + ')" fill-opacity=".8"/>' +
      '<path d="M400 0H258L316 78L400 122Z" fill="url(#' + g('fb') + ')"/><path d="M258 0H236L284 42L316 78Z" fill="url(#' + g('fa') + ')" fill-opacity=".7"/>' +
      '<path d="M0 112L104 66L62 170L0 194Z" fill="url(#' + g('fb') + ')" fill-opacity=".55"/><path d="M400 122L316 78L346 182L400 206Z" fill="url(#' + g('fa') + ')" fill-opacity=".5"/></g>' +
      (mini ? '' : '<g stroke="' + C + '" stroke-opacity=".38" stroke-width=".8" fill="none" stroke-linecap="round"><path d="M104 66L62 170M316 78L346 182M168 0L104 66M258 0L316 78M104 66L170 30M316 78L284 42"/></g>') + '</svg>';
    /* منشور سداسي: قاعدة (x,y) ورأس بطول len وعرض w، مُدار rot درجة؛ وجه مضيء + وجه سماوي + حافة بيضاء */
    const prism = (x, y, len, w, rot)=>{ const h = w / 2, s = -len + w * .9, b = w * .3;
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><path d="M0 ' + (-len) + 'L' + (-h) + ' ' + s + 'V0L0 ' + b + 'Z" fill="url(#' + g('pa') + ')"/><path d="M0 ' + (-len) + 'L' + h + ' ' + s + 'V0L0 ' + b + 'Z" fill="url(#' + g('pb') + ')"/>' +
        '<path d="M0 ' + (-len) + 'L' + (-h) + ' ' + s + 'V0L0 ' + b + 'L' + h + ' 0V' + s + 'Z" fill="none" stroke="' + W + '" stroke-width=".9" stroke-linejoin="round"/><path d="M0 ' + (-len) + 'V' + b + '" stroke="' + W + '" stroke-opacity=".85" stroke-width=".7"/></g>'; };
    const cryst = '<svg class="pt-cryst c-ts" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>' +
      lin('pa', 1, 0, [[0, W, 1], [1, '#D8F0FF', .9]]) + lin('pb', 1, 0, [[0, '#BCE7FA', .95], [1, '#58C5E9', .85]]) + '</defs>' +
      (mini ? prism(118, -8, 70, 12, 200) + prism(126, -6, 94, 15, 224) + '</svg>' : prism(128, 18, 40, 8, 262) + prism(108, -10, 46, 9, 186) + prism(128, 4, 64, 11, 248) + prism(118, -8, 70, 12, 200) + prism(126, -6, 94, 15, 224) +
      '<g fill="' + W + '"><circle cx="58" cy="56" r="1.4"/><circle cx="44" cy="30" r=".9"/><circle cx="80" cy="74" r="1"/></g></svg>');
    const corner = (pos)=>mini ? '<svg class="pt-corner ' + pos + '" viewBox="0 0 56 56" aria-hidden="true" focusable="false"><path d="M7 1.5L11.76 4.25V9.75L7 12.5L2.24 9.75V4.25Z" fill="#EAF7FF" stroke="' + C + '" stroke-width=".8"/></svg>' : '<svg class="pt-corner ' + pos + '" viewBox="0 0 56 56" aria-hidden="true" focusable="false">' +
      '<path d="M7 44V15Q7 7 15 7H44" fill="none" stroke="#7FC8E8" stroke-opacity=".45" stroke-width="3.4"/><path d="M7 44V15Q7 7 15 7H44" fill="none" stroke="' + W + '" stroke-width="1.5"/>' +
      '<path d="M12.5 40V18.5Q12.5 12.5 18.5 12.5H40" fill="none" stroke="' + C + '" stroke-opacity=".5" stroke-width=".9"/>' +
      '<path d="M7 25l-3.2-2.2M7 31l-2.6 1.6M7 37l-2-1.4M25 7l-2.2-3.2M31 7l1.6-2.6M37 7l-1.4-2" stroke="' + W + '" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M7 1.5L11.76 4.25V9.75L7 12.5L2.24 9.75V4.25Z" fill="#EAF7FF" stroke="' + C + '" stroke-width=".8"/><path d="M7 1.5L11.76 4.25L7 7L2.24 4.25Z" fill="' + W + '"/>' +
      '<path d="M7 7V12.5M7 7L2.24 9.75M7 7L11.76 9.75" stroke="#8BD8F4" stroke-width=".6"/></svg>';
    const fdefs = '<defs>' + lin('f1', 0, 1, [[0, W, 0], [.35, '#E4F5FD', .6], [1, '#BCE7FA', .95]]) + lin('f2', 0, 1, [[0, W, .6], [1, '#EEF8FE', .98]]) + lin('f3', 1, 0, [[0, '#8BD8F4', .55], [1, '#BCE7FA', .08]]) + '</defs>';
    const fr = (dd, f, extra)=>'<path d="' + dd + '" fill="url(#' + g(f) + ')"' + (extra || '') + '/>', edge = ' stroke="' + W + '" stroke-width="1.1" stroke-linejoin="round"';
    const floeBody = tg === 'operations'
      ? fr('M0 130V82H70L84 70H150L164 82H236L250 70H316L330 82H400V130Z', 'f1') + fr('M84 70H150L164 82H70Z', 'f3') + fr('M250 70H316L330 82H236Z', 'f3') +
        fr('M0 130V100H120L132 92H268L280 100H400V130Z', 'f2', edge) + (mini ? '' :
        '<g fill="none" stroke="' + C + '" stroke-opacity=".34" stroke-width=".7">' + [20, 46, 72, 98, 124, 150, 176, 202, 228, 254, 280, 306, 332, 358, 384].map(x=>'<path d="M' + x + ' 106l6 3.5v7l-6 3.5l-6-3.5v-7Z"/>').join('') + '</g>' +
        '<g stroke="' + W + '" stroke-opacity=".7" stroke-width=".8">' + [40, 120, 200, 280, 360].map(x=>'<path d="M' + x + ' 82V100"/>').join('') + '</g>')
      : tg === 'teacher'
      ? fr('M0 130V96L30 84L56 94L90 78L120 92L156 82L200 92L244 82L280 92L310 78L344 94L370 84L400 96V130Z', 'f1') +
        fr('M6 130V106Q100 86 198 104V130Z', 'f2', edge) + fr('M202 104Q300 86 394 106V130Z', 'f2', edge) +
        '<path d="M200 98V130" stroke="' + C + '" stroke-opacity=".7" stroke-width="1.2"/>' +
        (mini ? '' : '<g fill="none" stroke="#8BD8F4" stroke-opacity=".5" stroke-width=".7"><path d="M22 114Q100 100 186 113M22 121Q100 107 186 120M214 113Q300 100 378 114M214 120Q300 107 378 121"/></g>') +
        '<path d="M284 92H294V122L289 117L284 122Z" fill="#8BD8F4" fill-opacity=".85" stroke="' + W + '" stroke-width=".8" stroke-linejoin="round"/>'
      : fr('M0 130V88L22 70L40 84L64 56L88 80L112 64L134 82L160 50L188 78L214 62L238 80L266 46L292 76L316 60L340 82L364 58L386 74L400 66V130Z', 'f1') +
        fr('M64 56L88 80L70 84Z', 'f3') + fr('M160 50L188 78L166 82Z', 'f3') + fr('M266 46L292 76L262 80Z', 'f3') + fr('M364 58L386 74L360 84Z', 'f3') +
        fr('M0 130V104L30 92L52 102L80 86L108 100L140 90L172 104L206 88L236 100L268 86L300 102L330 90L362 100L400 88V130Z', 'f2', edge) +
        (mini ? '' : '<g stroke="' + C + '" stroke-opacity=".38" stroke-width=".8" stroke-linecap="round"><path d="M64 56L70 84M160 50L166 82M266 46L262 80M364 58L360 84"/></g>');
    const floe = '<svg class="pt-floe" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' + fdefs + floeBody + '</svg>';
    return '<div class="pt-decor" aria-hidden="true">' + facets + '<span class="pt-breath"></span>' + floe + cryst +
      corner('k-ts') + corner('k-te') + corner('k-bs') + corner('k-be') + '<span class="pt-frame"></span><span class="pt-rim"></span>' +
      (mini ? '<span class="pt-snow s1"></span></div>' : '<span class="pt-snow s1"></span><span class="pt-snow s2"></span><span class="pt-glint gl1"></span><span class="pt-glint gl2"></span><span class="pt-glint gl3"></span><span class="pt-sheen"></span></div>');
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
function codisPlanThemeDecorHtml(d, mini){ const f = d && CODIS_PLAN_THEME_ART[d.art]; if(!f) return ''; try{ return f(d, ++codisPtUid, !!mini); }catch(e){ console.error('CODIS plan theme art:', e); return ''; } }
function codisPlanThemeVars(d){
  const t = (d && d.tokens) || {}, m = (d && d.motion) || {};
  return Object.keys(t).map(k=>[k, t[k]]).concat([['--pt-sheen-dur', (m.sheen || 10) + 's'], ['--pt-breath-dur', (m.breath || 6) + 's'], ['--pt-glint-dur', (m.glint || 7) + 's']], m.snow ? [['--pt-snow-dur', m.snow + 's']] : []);
}
function codisPlanThemeStyle(d){ return codisPlanThemeVars(d).map(p=>p[0] + ':' + p[1]).join(';'); }
/* أسطح الغرفة: القائمة من CODIS_THEME_TARGETS[tg].surfaces (الافتراضي للتوافق: مربع الانتظار وحده) */
function codisThemeSurfaces(tg){ const T = CODIS_THEME_TARGETS[tg]; if(!T) return []; return Array.isArray(T.surfaces) && T.surfaces.length ? T.surfaces : [{ key:'emptyState', kind:'box', sel:T.sel + ' > .empty-state' }]; }
const CODIS_THEME_SURFACE_CLS = { box:'pt-box', card:'pt-card', scope:'pt-scope', panel:'pt-panel', inner:'pt-box' };   /* V59: panel = مربع الكتابة · inner = مربع داخل القائمة (يُعاد إنشاؤه مع كل رسم) */
function codisPlanThemeTargetBox(tg){ const s = codisThemeSurfaces(tg).find(x=>x.kind === 'box'); return s ? document.querySelector(s.sel) : null; }
/* إزالة ما أضافه الثيم فقط: رموز --pt-* من style (بقية الخصائص الأصلية تبقى) + أصناف/سمات pt + طبقة الزخارف */
function codisPlanThemeStrip(el){
  for(let i = el.style.length - 1; i >= 0; i--){ const p = el.style[i]; if(p && p.indexOf('--pt-') === 0) el.style.removeProperty(p); }
  if(el.hasAttribute('data-pt-nostyle')){ if(!el.style.length) el.removeAttribute('style'); el.removeAttribute('data-pt-nostyle'); }
  el.removeAttribute('data-pt'); el.removeAttribute('data-pt-target'); el.removeAttribute('data-pt-surface');
  el.classList.remove('pt-box', 'pt-card', 'pt-scope', 'pt-panel');
  const dc = el.querySelector(':scope > .pt-decor'); if(dc) dc.remove();
}
/* يلبّس سطحاً واحداً (أو يعيده للأصل). idempotent: نفس الثيم مطبّق ⇒ لا شيء */
function codisThemeSurfaceApply(el, sf, d, tg){
  const cls = CODIS_THEME_SURFACE_CLS[sf.kind] || 'pt-box', decor = sf.kind !== 'scope', cur = el.getAttribute('data-pt') || '';
  if(!d){ if(cur || el.classList.contains(cls) || el.querySelector(':scope > .pt-decor')) codisPlanThemeStrip(el); return; }
  if(cur === d.id && el.classList.contains(cls) && (!decor || el.querySelector(':scope > .pt-decor'))) return;
  if(cur || el.classList.contains(cls)) codisPlanThemeStrip(el);
  if(!el.hasAttribute('style')) el.setAttribute('data-pt-nostyle', '');
  codisPlanThemeVars(d).forEach(p=>el.style.setProperty(p[0], p[1]));
  el.setAttribute('data-pt', d.id); el.setAttribute('data-pt-target', tg); el.setAttribute('data-pt-surface', sf.key || sf.kind); el.classList.add(cls);
  if(decor) el.insertAdjacentHTML('afterbegin', codisPlanThemeDecorHtml(d));
}
/* يطبّق ثيم كل غرفة على كل أسطحها (أو غرفة واحدة). أي سطح غائب عن DOM يُتخطّى بلا خطأ */
function codisPlanThemeApply(tg){
  let map = null; try{ if(CodisPlanThemes.heal()) saveData(); map = CodisPlanThemes.equippedMap(); }catch(e){ map = {}; }
  (tg && CODIS_THEME_TARGETS[tg] ? [tg] : Object.keys(CODIS_THEME_TARGETS)).forEach(k=>{
    const id = map[k] || '', d = id ? CodisPlanThemes.def(id) : null;
    codisThemeSurfaces(k).forEach(sf=>{ try{ (sf.all || sf.kind === 'inner' ? Array.prototype.slice.call(document.querySelectorAll(sf.sel)) : [document.querySelector(sf.sel)]).forEach(el=>{ if(el) codisThemeSurfaceApply(el, sf, d, k); }); }catch(e){ console.error('CODIS room theme:', k, sf && sf.key, e); } });
  });
}
/* V59: المربعات داخل قائمة المهام تُبنى بعد تطبيق الثيم بأول الرسم ⇒ يُستدعى بعد بناء القائمة: تأخذ ثيم القائمة نفسها (لا حساب جديد للتجهيز) */
function codisThemeInnerApply(list){
  try{
    if(!list) return; const id = list.getAttribute('data-pt') || '', tg = list.getAttribute('data-pt-target') || '', d = id ? CodisPlanThemes.def(id) : null;
    Object.keys(CODIS_THEME_TARGETS).forEach(k=>codisThemeSurfaces(k).forEach(sf=>{ if(sf.kind !== 'inner' || sf.sel.indexOf('#' + list.id + ' ') !== 0) return;
      list.querySelectorAll(':scope ' + sf.sel.slice(list.id.length + 2)).forEach(el=>{ if(el.parentElement === list) codisThemeSurfaceApply(el, sf, (d && k === tg) ? d : null, k); }); }));
  }catch(e){ console.error('CODIS room theme (inner):', e); }
}
function codisThemeFamilyOf(d){ return CODIS_THEME_FAMILIES.find(x=>x.id === (d && d.family)) || { id:'_' + (d && d.id), name:d ? d.name : '', ar:d ? d.ar : '', desc:'', order:1e6 }; }
/* العائلات: تجمع المنتجات بترتيب العائلة ثم ترتيب السجل؛ منتج بعائلة مجهولة ⇒ عائلة مشتقة منه */
function codisThemeFamilies(list){
  const out = [], by = {};
  (list || CodisPlanThemes.defs()).forEach(d=>{
    const fid = d.family || ('_' + d.id); let g = by[fid];
    if(!g){ const f = codisThemeFamilyOf(d); g = by[fid] = { fam:f, items:[] }; out.push(g); }
    g.items.push(d);
  });
  return out.sort((a, b)=>((a.fam.order || 0) - (b.fam.order || 0)));
}
/* المعاينة = مربع الغرفة المستهدفة نفسه: رسمته ونصوصه من DOM. mini = نسخة مصغّرة مصممة (الرسمة + مقابض العنوان/الزر بنفس الرموز) */
function codisPlanThemeBoxHtml(id, mini){
  const d = CodisPlanThemes.def(id); if(!d) return '';
  const T = CODIS_THEME_TARGETS[d.target] || CODIS_THEME_TARGETS.planning, src = codisPlanThemeTargetBox(d.target), q = s=>src ? src.querySelector(s) : null;
  const mark = q(':scope > .es-mark'), t = q(':scope > .es-title'), c = q(':scope > .es-copy'), b = q(':scope > .btn');
  const open = '<div class="empty-state pt-box" data-pt="' + d.id + '" data-pt-target="' + d.target + '" style="' + escapeHtml(codisPlanThemeStyle(d)) + '" aria-hidden="true" inert>' + codisPlanThemeDecorHtml(d, mini) + (mark ? mark.outerHTML : '');
  if(mini) return open + '<span class="pt-mini-t"></span><span class="pt-mini-c"></span><span class="pt-mini-b"></span></div>';
  return open + '<div class="es-title">' + escapeHtml(t ? t.textContent : T.box) + '</div>' +
    '<div class="es-copy">' + escapeHtml(c ? c.textContent : '') + '</div><span class="btn btn-primary">' + escapeHtml(b ? b.textContent.trim() : T.btn) + '</span></div>';
}
/* ---- V59: المعاينة الكبيرة = شرائح لكل أسطح الغرفة (الضغط على المعاينة ⇒ السطح التالي). المصغّرة كما هي (المربع الأول) ----
   كل شريحة تُبنى بمكوّنات التطبيق نفسها (codisTaskItemHtml، رسمات codisEsMark، بنية بطاقة الخطة ومربع الكتابة) بقيم عيّنة،
   وأنماط الغرف المربوطة بمعرّفات (#page-tasks، #planning-active، #plan-editor...) تُعكس مرة لكل مظهر إلى أصناف المعاينة
   بـ:is(#pt-pv-none, .صنف) ⇒ نفس الخصوصية حرفياً (معرّف غير موجود) فتطابق المعاينة الغرفة دون تعديل أي CSS موجود. */
const CODIS_PT_PV_MAP = { 'page-planning':'pt-pv-planning', 'planning-active':'pt-pv-plan', 'plan-editor':'pt-pv-editor', 'plan-section-tasks':'pt-pv-wsec', 'page-tasks':'pt-pv-ops', 'day-task-list':'pt-pv-list', 'page-learn':'pt-pv-lrn', 'learn-day-task-list':'pt-pv-list' };
let codisPtPvKey = '';
function codisPtSplitSel(sel){ const out = []; let dep = 0, cur = ''; for(const ch of sel){ if(ch === '(' || ch === '[') dep++; else if(ch === ')' || ch === ']') dep--; if(ch === ',' && !dep){ out.push(cur.trim()); cur = ''; } else cur += ch; } if(cur.trim()) out.push(cur.trim()); return out; }
function codisPtPvSel(part){
  /* يكفي معرّف معروف واحد؛ المعرّفات الأخرى تبقى كما هي (لا تطابق شيئاً بالمعاينة ولا تغيّر الخصوصية) — قواعد مثل :is(#planning-empty, …, #day-task-list) تُعكس كاملة */
  const ids = part.replace(/\[[^\]]*\]/g, '').match(/#[A-Za-z][\w-]*/g); if(!ids || !ids.some(x=>CODIS_PT_PV_MAP[x.slice(1)])) return null;
  /* موضوع القاعدة نفسه صفحة/حاوية (لا مكوّن) ⇒ لا يُعكس */
  let dep = 0, cut = 0; for(let i = 0; i < part.length; i++){ const ch = part[i]; if(ch === '(' || ch === '[') dep++; else if(ch === ')' || ch === ']') dep--; else if(!dep && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) cut = i + 1; }
  const sub = /^#(?:page-|planning-active|plan-editor|plan-section)/.test(part.slice(cut).trim());
  return { sub:sub, sel:part.replace(/#([A-Za-z][\w-]*)/g, (m, id)=>CODIS_PT_PV_MAP[id] ? ':is(#pt-pv-none, .' + CODIS_PT_PV_MAP[id] + ')' : m) };
}
function codisPtPvCss(){
  try{
    const key = (document.documentElement.getAttribute('data-theme') || '') + '|' + document.styleSheets.length; let st = document.getElementById('codis-pt-pv-css');
    if(st && codisPtPvKey === key) return;
    const out = [];
    const walk = (rules, wrap)=>{ for(let i = 0; i < rules.length; i++){ const r = rules[i]; try{
      if(r.type === 1){ if(!r.selectorText || r.selectorText.indexOf('#') < 0) continue; const parts = codisPtSplitSel(r.selectorText).map(codisPtPvSel).filter(Boolean);
        const comp = parts.filter(x=>!x.sub).map(x=>x.sel), pg = parts.filter(x=>x.sub).map(x=>x.sel);
        if(comp.length) out.push(wrap(comp.join(', ') + '{' + r.style.cssText + '}'));
        /* قاعدة موضوعها الصفحة/الحاوية: متغيراتها فقط (--op-*، --room-ink...) — لا خلفية/حشوة/ارتفاع الصفحة */
        if(pg.length){ const v = []; for(let k = 0; k < r.style.length; k++){ const pr = r.style[k]; if(pr.indexOf('--') === 0) v.push(pr + ':' + r.style.getPropertyValue(pr)); } if(v.length) out.push(wrap(pg.join(', ') + '{' + v.join(';') + '}')); } }
      else if(r.type === 4 && r.cssRules){ const c = r.conditionText || (r.media && r.media.mediaText) || 'all'; walk(r.cssRules, x=>wrap('@media ' + c + '{' + x + '}')); }
      else if(r.type === 12 && r.cssRules){ const c = r.conditionText; walk(r.cssRules, x=>wrap('@supports ' + c + '{' + x + '}')); }
    }catch(e){} } };
    for(const sh of Array.prototype.slice.call(document.styleSheets)){ if(sh.ownerNode && sh.ownerNode.id === 'codis-pt-pv-css') continue; try{ walk(sh.cssRules, x=>x); }catch(e){} }
    if(!st){ st = document.createElement('style'); st.id = 'codis-pt-pv-css'; document.head.appendChild(st); }
    st.textContent = out.join('\n'); codisPtPvKey = key;
  }catch(e){ console.error('CODIS theme preview css:', e); }
}
function codisPtPvTask(tk, learn){ let h = ''; try{ h = codisTaskItemHtml(tk, !learn); }catch(e){ h = '<div class="task-main"><div class="task-text">' + escapeHtml(tk.text) + '</div></div>'; }
  return '<div class="task-item' + (tk.status ? ' is-' + tk.status : '') + '">' + h + '</div>'; }
function codisPtSlideHtml(d, sf){
  const tg = d.target, L = tg === 'teacher', room = tg === 'operations' ? 'pt-pv-ops' : L ? 'pt-pv-lrn' : 'pt-pv-planning';
  const at = ' data-pt="' + d.id + '" data-pt-target="' + tg + '" data-pt-surface="' + escapeHtml(sf.key) + '" style="' + escapeHtml(codisPlanThemeStyle(d)) + '"', dec = ()=>codisPlanThemeDecorHtml(d);
  const list = inner=>'<div class="pt-pv ' + room + '"><div class="pt-pv-list pt-scope"' + at + '>' + inner + '</div></div>';
  if(sf.kind === 'box') return codisPlanThemeBoxHtml(d.id, false);
  if(sf.kind === 'card') return '<div class="pt-pv ' + room + '"><div class="pt-pv-plan"><div class="plan-card pt-card"' + at + '>' + dec() + '<span class="eyebrow">الخطة</span><div class="plan-name">خطة الأسبوع</div><div class="plan-info">١٢ مهمة، ٦ عناصر تعلّم</div>' +
    '<div class="plan-progress"><div class="plan-progress-row"><span>نسبة الإنجاز</span><span class="plan-pct">٦٤٪</span></div><div class="xp-track"><div class="xp-fill" style="width:64%;"></div></div></div>' +
    '<div class="plan-cta"><span class="btn btn-primary">' + codisIcon('next') + 'أضف للخطة</span></div><div class="plan-more"><span class="pm-btn">احفظ الخطة</span><span class="pm-btn">خطة جديدة</span><span class="pm-btn is-danger">إيقاف الخطة</span></div></div></div></div>';
  if(sf.kind === 'panel') return '<div class="pt-pv ' + room + '"><div class="pt-pv-editor"><div class="pt-pv-wsec"><div class="write-box pt-panel"' + at + '>' + dec() +
    '<textarea readonly tabindex="-1" aria-hidden="true">١٥ ريلز\n!أراجع تقرير المبيعات\nأرد على رسائل الزبائن\nأرتّب جدول اجتماعات الأسبوع</textarea><span class="write-count show">٤ مهام</span></div></div></div></div>';
  if(sf.kind === 'scope') return list(codisPtPvTask({ id:'ptpv1', text:L ? 'قراءة الفصل الثالث من كتاب الإدارة' : 'مراجعة تقرير المبيعات الأسبوعي', status:'', priority:'high' }, L) +
    codisPtPvTask({ id:'ptpv2', text:L ? 'مراجعة المفردات الجديدة' : 'اتصال بفريق العمليات', status:'done', priority:'' }, L));
  if(sf.kind === 'inner') return list('<div class="empty-state is-clear pt-box"' + at + '>' + dec() + codisEsMark(L ? 'lrnd' : 'opsd') + '<div class="es-copy">' + (L ? 'كل عناصر اليوم محسومة' : 'كل مهام اليوم محسومة') + '</div></div>');
  return '';
}
function codisPtSlideLab(d, i){ const sf = codisThemeSurfaces(d.target), n = sf.length, x = sf[i] || {}; return econFmt(i + 1) + ' / ' + econFmt(n) + ' · ' + (x.short || x.label || x.key || ''); }
function codisPlanThemeStageHtml(id, big){
  const d = CodisPlanThemes.def(id); if(!d) return '';
  if(!big) return '<div class="pt-stage is-mini">' + codisPlanThemeBoxHtml(d.id, true) + '</div>';
  const sfs = codisThemeSurfaces(d.target), n = sfs.length;
  const slides = sfs.map((sf, i)=>'<div class="pt-stage is-big pt-slide' + (i ? '' : ' is-on') + '" data-i="' + i + '" data-surface="' + escapeHtml(sf.key) + '"' + (i ? ' aria-hidden="true"' : '') + ' inert>' + codisPtSlideHtml(d, sf) + '</div>').join('');
  if(n < 2) return '<div class="pt-slides" data-n="1" data-i="0">' + slides + '</div>';
  return '<div class="pt-slides" data-n="' + n + '" data-i="0">' + slides + '<button type="button" class="pt-slide-hit" aria-label="اعرض السطح التالي الذي يلبسه الثيم" onclick="codisPtSlideStep(1)"></button></div>' +
    '<div class="pt-slide-bar"><button type="button" class="pt-slide-nav is-prev" aria-label="السطح السابق" onclick="codisPtSlideStep(-1)">' + codisIcon('next') + '</button>' +
    '<div class="pt-slide-mid"><span class="pt-slide-lab" aria-live="polite">' + escapeHtml(codisPtSlideLab(d, 0)) + '</span><span class="pt-slide-dots" aria-hidden="true">' + sfs.map((x, i)=>'<i' + (i ? '' : ' class="is-on"') + '></i>').join('') + '</span></div>' +
    '<button type="button" class="pt-slide-nav is-next" aria-label="السطح التالي" onclick="codisPtSlideStep(1)">' + codisIcon('next') + '</button></div>';
}
/* التنقّل بين الشرائح: دوري، بلا إعادة بناء (الشرائح كلها جاهزة؛ المخفية متوقفة الحركة) */
function codisPtSlideStep(dir, to){
  const el = codisPtPrevEl, d = el && CodisPlanThemes.def(codisPtPrevId), S = el && el.querySelector('.pt-slides'); if(!d || !S) return;
  const n = +S.getAttribute('data-n') || 1; if(n < 2) return;
  let i = to !== undefined ? to : (+S.getAttribute('data-i') || 0) + dir; i = ((i % n) + n) % n; S.setAttribute('data-i', i);
  S.querySelectorAll(':scope > .pt-slide').forEach(x=>{ const on = +x.getAttribute('data-i') === i; x.classList.toggle('is-on', on); if(on) x.removeAttribute('aria-hidden'); else x.setAttribute('aria-hidden', 'true'); });
  el.querySelectorAll('.pt-slide-dots > i').forEach((x, k)=>x.classList.toggle('is-on', k === i));
  const lab = el.querySelector('.pt-slide-lab'); if(lab) lab.textContent = codisPtSlideLab(d, i);
  try{ codisSfx('press', { ctx:'tab' }); }catch(e){}
}
function codisPtRoom(d){ return (CODIS_THEME_TARGETS[d && d.target] || CODIS_THEME_TARGETS.planning); }
/* بطاقة مصغّرة (المتجر وبحوزتك): معاينة Mini + اسم المنتج (= غرفته؛ اسم العائلة في عنوان المجموعة فلا يتكرر) + شارة مختصرة؛ الضغط يفتح نافذة التفاصيل */
function econPlanThemeTileHtml(d, i, inInv){
  const P = CodisPlanThemes, own = P.owns(d.id), on = P.isEquipped(d.id), R = codisPtRoom(d), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver);
  const badge = on ? '<span class="pt-mbadge is-on">مجهّز</span>' : own ? '<span class="pt-mbadge is-own">' + (inInv ? 'غير مجهّز' : 'تملكه') + '</span>'
    : '<span class="pt-mbadge is-price' + (ok ? '' : ' is-short') + '">' + econSilver(d.silver) + '</span>';
  const lab = d.ar + ' (' + d.name + ') · ثيم ' + R.room + ' · ' + d.rarityAr + ' · ' + (on ? 'مجهّز الآن' : own ? 'تملكه' : econFmt(d.silver) + ' فضة') + ' — افتح التفاصيل';
  return '<div class="st-tile pt-mtile' + (own ? ' is-own' : '') + (on ? ' is-on' : '') + (ok ? '' : ' is-short') + '" role="listitem" data-ptid="' + d.id + '" data-pt-target="' + d.target + '" data-pt-fam="' + escapeHtml(d.family || '') + '" style="--i:' + (i || 0) + '">' +
    '<button type="button" class="pt-mbtn" aria-haspopup="dialog" aria-label="' + escapeHtml(lab) + '" onclick="codisPlanThemePreview(\'' + d.id + '\', this)">' +
    codisPlanThemeStageHtml(d.id, false) + '<span class="pt-mname">' + escapeHtml(R.room) + '</span>' + badge + '</button></div>';
}
/* مجموعة عائلة: العنوان (عربي كبير + لاتيني صغير) ← وصف قصير ← شبكة منتجاتها؛ الفاصل بين العائلات من الـCSS (.pt-fam + .pt-fam) */
function econThemeFamilyHtml(g, pre, inInv){
  const f = g.fam, hid = pre + String(f.id).replace(/[^A-Za-z0-9_-]/g, '');
  return '<section class="pt-fam" data-family="' + escapeHtml(f.id) + '" aria-labelledby="' + hid + '"><header class="pt-fam-head">' +
    '<h5 class="pt-fam-ar" id="' + hid + '">' + escapeHtml(f.ar || f.name) + '</h5>' + (f.name ? '<span class="pt-fam-en" dir="ltr">' + escapeHtml(f.name) + '</span>' : '') +
    (f.desc && !inInv ? '<p class="pt-fam-desc">' + escapeHtml(f.desc) + '</p>' : '') + '</header>' +
    '<div class="pt-grid" role="list">' + g.items.map((d, i)=>econPlanThemeTileHtml(d, i, inInv)).join('') + '</div></section>';
}
function econPlanThemesShopHtml(){
  return '<section class="st-part pt-sec" id="eco-plan-themes" aria-labelledby="pt-h"><header class="st-part-head"><h4 class="hcd-title" id="pt-h">الثيمات</h4></header>' +
    '<div class="pt-fams">' + codisThemeFamilies().map(g=>econThemeFamilyHtml(g, 'pt-fam-', false)).join('') + '</div></section>';
}
function econPlanThemesInvHtml(){
  const list = CodisPlanThemes.owned(); if(!list.length) return '';
  return '<section class="own-part" id="own-plan-themes" aria-labelledby="own-pt-h"><div class="own-sub"><span id="own-pt-h" role="heading" aria-level="5">الثيمات</span><span class="own-sub-n">' + econFmt(list.length) + '</span></div>' +
    '<div class="pt-fams is-own">' + codisThemeFamilies(list).map(g=>econThemeFamilyHtml(g, 'own-pt-fam-', true)).join('') + '</div></section>';
}
/* قسم «المظاهر» بالمتجر: تبويبان داخليان (مظاهر البطاقات · الثيمات) — حالة واجهة فقط، والتبديل بلا إعادة رسم */
let econCosSub = 'cards';
function econCosmeticsPaneHtml(){
  const nC = CodisCosmetics.defs().length, nT = CodisPlanThemes.defs().length, cur = econCosSub === 'themes' ? 'themes' : 'cards';
  const tab = (k, lab, n)=>'<button type="button" role="tab" class="cos-seg-b' + (cur === k ? ' is-on' : '') + '" id="cos-tab-' + k + '" data-sub="' + k + '" aria-selected="' + (cur === k ? 'true' : 'false') + '" aria-controls="cos-sub-' + k + '" tabindex="' + (cur === k ? '0' : '-1') + '" onclick="econCosSetSub(\'' + k + '\')">' + lab + '<span class="cos-seg-n">' + econFmt(n) + '</span></button>';
  return '<div class="cos-seg" role="tablist" aria-label="أنواع المظاهر" onkeydown="econCosSubKey(event)">' + tab('cards', 'مظاهر البطاقات', nC) + tab('themes', 'الثيمات', nT) + '</div>' +
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
  const note = on ? 'يلبّس الآن ' + R.room + ' بدل تصميمها الأصلي. الإزالة ترجع كل عناصرها لشكلها الأصلي ولا تمسّ الغرف الأخرى.'
    : own ? 'مملوك دائماً — تجهيزه يغيّر عناصر ' + R.room + ' فقط، بلا أي شراء إضافي.'
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
  codisPtPvCss();
  const R = codisPtRoom(d), el = document.createElement('div');
  el.className = 'pt-ov'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'pt-ov-ttl'); el.setAttribute('aria-describedby', 'pt-ov-desc'); el.setAttribute('data-pt-target', d.target); el.setAttribute('data-pt-fam', d.family || '');
  el.innerHTML = '<div class="pt-ov-bg" onclick="codisPlanThemePreviewClose()"></div><div class="pt-ov-card">' +
    '<div class="pt-ov-head"><div class="pt-ov-chips"><span class="pt-rar">' + escapeHtml(d.rarityAr) + '</span><span class="pt-ov-room">' + escapeHtml(R.room) + '</span></div><button type="button" class="pt-ov-x" aria-label="إغلاق التفاصيل" onclick="codisPlanThemePreviewClose()">' + codisIcon('close') + '</button></div>' +
    '<div class="pt-ov-name" id="pt-ov-ttl"><b dir="ltr">' + escapeHtml(d.name) + '</b><span>' + escapeHtml(d.ar) + '</span></div>' +
    codisPlanThemeStageHtml(d.id, true) +
    '<dl class="pt-ov-meta"><div><dt>الغرفة</dt><dd>' + escapeHtml(R.room) + '</dd></div><div><dt>العائلة</dt><dd>' + escapeHtml(codisThemeFamilyOf(d).ar) + '</dd></div><div><dt>الندرة</dt><dd>' + escapeHtml(d.rarityAr) + '</dd></div></dl>' +
    '<div class="pt-ov-covers"><span class="pt-ov-covers-k">يلبّس بالغرفة</span><ul>' + codisThemeSurfaces(d.target).map(x=>'<li>' + escapeHtml(x.label || x.key) + '</li>').join('') + '</ul></div>' +
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
