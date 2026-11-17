  /* CODIS-V64 · AGED WOOD «الخشب المعتّق»: Dark Walnut · Smoked Oak · Antique Mahogany · Aged Bronze · Tarnished Brass · Warm Amber · Parchment Cream.
     خشب داكن دافئ بطبقات (الخشب ← الإطار المحفور ← النقش ← النحاس ← النص)، والنص كريمي رقّي فوقه (تباين ≥ 7:1 للعنوان و≥ 4.5:1 للثانوي).
     sound:'agedWood' = سياق الهوية الصوتية الخشبية (SOUNDS 'اسم@agedWood') — تُستعمل فقط داخل سطح ملبّس بهذا الثيم المجهّز (codisSoundScopeOf). */
  const wood = {
    '--pt-bg':'radial-gradient(120% 70% at 50% 116%, rgb(255 170 82 / .17), rgb(255 170 82 / 0) 62%), radial-gradient(150% 95% at 50% 42%, rgb(10 5 2 / 0) 56%, rgb(10 5 2 / .5)), linear-gradient(172deg, #4B2E1B 0%, #3B2314 36%, #2D1A0F 68%, #3A2316 100%)',
    '--pt-edge':'0 0 0 1px rgb(26 13 6 / .92), 0 0 0 3px rgb(156 112 60 / .62), 0 0 0 4px rgb(22 11 5 / .9), inset 0 1px 0 rgb(255 216 160 / .24), inset 0 -3px 8px rgb(0 0 0 / .42), 0 18px 32px -18px rgb(0 0 0 / .82), 0 20px 36px -26px rgb(255 160 70 / .3)',
    '--pt-title':'#F7E8CD', '--pt-title-glow':'0 1px 0 rgb(0 0 0 / .78), 0 0 14px rgb(255 178 92 / .2)', '--pt-copy':'#E6D0AC',
    '--pt-ea-paper':'#2B190E', '--pt-ea-ink':'#EBD5B0', '--pt-ea-line':'rgb(235 213 176 / .34)', '--pt-ea-shade':'rgb(0 0 0 / .55)', '--pt-ea-acc':'#DDA858', '--pt-road':'#1A0E07', '--pt-road-edge':'rgb(221 168 88 / .32)', '--pt-gem':'#E4B866', '--pt-gem-edge':'#FFF0CF',
    '--pt-metal':'#B9884A', '--pt-metal-edge':'#F2D49C', '--pt-socket':'#170C06', '--pt-mark-ink':'#2A1708',
    '--pt-art-glow':'drop-shadow(0 0 6px rgb(255 176 92 / .26)) drop-shadow(0 2px 2px rgb(0 0 0 / .72))',
    '--pt-btn-bg':'linear-gradient(180deg, rgb(255 228 184 / .17), rgb(255 228 184 / 0) 48%) padding-box, linear-gradient(180deg, #6E4428, #4C2D18 58%, #3B2212) padding-box, linear-gradient(180deg, #EBC67E, #A9763A 52%, #5E3B17) border-box',
    '--pt-btn-tx':'#FCEDD3', '--pt-btn-sh':'0 0 0 1px rgb(20 10 4 / .82), inset 0 1px 0 rgb(255 228 184 / .3), inset 0 -2px 0 rgb(0 0 0 / .32), 0 3px 0 #24130A, 0 9px 16px -8px rgb(0 0 0 / .72)',
    '--pt-btn-sh-hover':'0 0 0 1px rgb(20 10 4 / .82), inset 0 1px 0 rgb(255 228 184 / .36), inset 0 -2px 0 rgb(0 0 0 / .32), 0 3px 0 #24130A, 0 0 0 4px rgb(232 186 104 / .16), 0 10px 18px -8px rgb(255 160 70 / .42)',
    '--pt-btn-sh-press':'0 0 0 1px rgb(20 10 4 / .88), inset 0 2px 7px rgb(0 0 0 / .5), inset 0 1px 0 rgb(255 228 184 / .12), 0 1px 0 #24130A',
    '--pt-focus':'#F0C878', '--pt-frame':'rgb(230 192 132 / .26)', '--pt-chip':'#DDA858'
  };
  const wbase = { family:'agedWood', name:'Aged Wood', ar:'الخشب المعتّق', silver:7999, rarity:'legendary', rarityAr:'أسطوري', art:'agedWood', sound:'agedWood', tokens:wood };
  const woodDefs = [
    Object.assign({}, wbase, { id:'agedWoodPlanning', target:'planning', motion:{ sheen:15, breath:8, glint:9 },
      desc:'مكتب كاتب ومخطِّط أثري من خشب الجوز: مربع «ابدأ بناء خطة أسبوعك» ومربع كتابة الخطة وبطاقة الخطة النشطة كسطح مكتب مصقول يدوياً — إطار محفور، زوايا نحاسية معتّقة بمسامير، شريط زخرفي كحواشي المخطوطات، محبرة وريشة محفورتان، وأزرار كمقابض خشبية مثبتة في المكتب. الضوء الكهرماني يتبع مؤشرك أو إصبعك فوق العروق، وكل ضغطة تُسمع كنقرة خشب.' }),
    Object.assign({}, wbase, { id:'agedWoodOperations', target:'operations', motion:{ sheen:16, breath:8.5, glint:9.5 },
      desc:'لوحة إدارة خشبية في ورشة حرفية فاخرة: مربع الانتظار وكل مستطيلات المهام كقطع بلوط مدخّن مصقولة مثبتة على اللوحة — مجارٍ محفورة، فواصل وزوايا برونزية، مسطرة نحاسية، وأزرار الحالة كمفاتيح خشبية منفصلة بألوان واضحة: زِنجار أخضر لـ«خلصتها»، كهرمان لـ«نصها»، أحمر عتيق لـ«ما سويتها».' }),
    Object.assign({}, wbase, { id:'agedWoodTeacher', target:'teacher', motion:{ sheen:17, breath:9, glint:10 },
      desc:'مكتبة تاريخية وكتاب علمي قديم لغرفة الأستاذ: مربع المسار وكل المستطيلات التعليمية كصفحات مخطوطة مثبتة داخل إطار خشبي — كعب جلدي بأحزمة مذهّبة، فاصل كتاب نحاسي وشريط قماشي، أطراف صفحات، ومحطة نحاسية لكل درس تحمل حالته.' })
  ];
