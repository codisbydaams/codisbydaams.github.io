  /* CODIS-V66 · BLAZING METEOR «النيزك المشتعل»: Meteor Amber · Molten Gold · Electric Amber · Plasma Orange · Champagne Metal · Obsidian Shadow · Luminous Crystal.
     apply:'room' = نطاق جديد: الثيم يلبّس جذر الغرفة كله (#page-*) بدل أسطحها القديمة — كل عنصر داخل الغرفة، ومنه ما يُبنى لاحقاً، يرث رموز الثيم.
     الرموز المشتركة (--pt-*) لهوية العائلة، و--pt-bm-* لشخصية كل غرفة (اللون الرئيسي/الثانوي/البلازما + السماء). كل الرموز تبدأ بـ--pt- فتزيلها codisPlanThemeStrip.
     sound:'blazingMeteor' = سياق الهوية الصوتية الكهربائية (SOUNDS 'اسم@blazingMeteor') — داخل الغرفة المجهّزة فقط (codisSoundScopeOf). */
  const meteor = {
    '--pt-bg':'radial-gradient(120% 70% at 80% -10%, rgb(255 176 64 / .22), rgb(255 176 64 / 0) 60%), linear-gradient(170deg, #1B130C 0%, #0E0A07 55%, #120C08 100%)',
    '--pt-title':'#FFF1DC', '--pt-copy':'#E3CFAF', '--pt-title-glow':'0 1px 0 rgb(0 0 0 / .8), 0 0 16px rgb(255 170 60 / .28)',
    '--pt-btn-bg':'linear-gradient(180deg, rgb(255 246 220 / .4), rgb(255 246 220 / 0) 46%) padding-box, linear-gradient(180deg, #FFD27A, #FFA834 55%, #E8761C) padding-box, linear-gradient(180deg, #FFF0C8, #B9752A) border-box',
    '--pt-btn-tx':'#1C0E02', '--pt-btn-sh':'0 0 0 1px rgb(30 14 2 / .8), 0 2px 0 #6A3A10, 0 8px 18px -8px rgb(255 140 40 / .7)',
    '--pt-focus':'#FFD27A', '--pt-chip':'#FFB547', '--pt-frame':'rgb(232 211 168 / .3)'
  };
  const mbase = { family:'blazingMeteor', name:'Blazing Meteor', ar:'النيزك المشتعل', silver:7999, rarity:'legendary', rarityAr:'أسطوري', art:'blazingMeteor', sound:'blazingMeteor', apply:'room' };
  const mtok = o=>Object.assign({}, meteor, o);
  const meteorDefs = [
    Object.assign({}, mbase, { id:'blazingMeteorPlanning', target:'planning', silver:7999, motion:{ sheen:14, breath:7, glint:11 },
      tokens:mtok({ '--pt-bm-acc':'255 198 88', '--pt-bm-acc2':'236 214 170', '--pt-bm-hot':'255 140 44',
        '--pt-bm-sky':'radial-gradient(90% 46% at 88% 0%, rgb(255 190 80 / .2), rgb(255 190 80 / 0) 70%), radial-gradient(70% 40% at 0% 64%, rgb(255 140 44 / .08), rgb(255 140 44 / 0) 70%), linear-gradient(176deg, #19120B 0%, #0D0906 46%, #100B07 100%)' }),
      desc:'منصة قيادة نيزكية لغرفة التخطيط كاملة: الرأس والعنوان ومربع البداية وبطاقة الخطة النشطة ونسبة إنجازها، ومحرّر الخطة بتبويباته ومربعات كتابته، و«خططي المحفوظة» وكل أزرار التوزيع والحفظ والإلغاء — ألواح أوبسيديان بحواف شمبانيا معدنية، مسارات طاقة ذهبية مصهورة ترسم مدار خطتك، ونيازك تعبر سماء الغرفة. الضوء الكهرماني يتبع مؤشرك أو إصبعك، وكل ضغطة تفريغ كهربائي قصير.' }),
    Object.assign({}, mbase, { id:'blazingMeteorOperations', target:'operations', silver:7999, motion:{ sheen:15, breath:7.5, glint:12 },
      tokens:mtok({ '--pt-bm-acc':'255 172 56', '--pt-bm-acc2':'255 116 38', '--pt-bm-hot':'255 92 40',
        '--pt-bm-sky':'radial-gradient(80% 38% at 50% -4%, rgb(255 150 50 / .2), rgb(255 150 50 / 0) 72%), radial-gradient(60% 40% at 100% 100%, rgb(255 96 30 / .1), rgb(255 96 30 / 0) 70%), linear-gradient(180deg, #170F09 0%, #0B0806 50%, #0F0A07 100%)' }),
      desc:'غرفة تحكم نيزكية متطورة تلبّس غرفة العمليات كاملة: مؤشرات XP ونسبة اليوم، تبويبات الأيام، وكل مستطيلات المهام كألواح تقنية متينة بأقواس معدنية وسكة حالة مضيئة — خلصتها بلورة نعناعية، نصها كهرمان كهربائي، ما سويتها بلازما حمراء — مع الوزن والمؤقت والحذف والإضافة اليدوية و«المنجزة». شبكة رادار خافتة وتفريغات كهربائية مع كل ضغطة.' }),
    Object.assign({}, mbase, { id:'blazingMeteorTeacher', target:'teacher', silver:7999, motion:{ sheen:16, breath:8, glint:13 },
      tokens:mtok({ '--pt-bm-acc':'255 192 96', '--pt-bm-acc2':'186 236 255', '--pt-bm-hot':'255 150 60',
        '--pt-bm-sky':'radial-gradient(80% 42% at 12% -2%, rgb(255 186 90 / .18), rgb(255 186 90 / 0) 70%), radial-gradient(70% 36% at 96% 36%, rgb(170 226 255 / .07), rgb(170 226 255 / 0) 72%), linear-gradient(178deg, #15100B 0%, #0B0807 50%, #0E0A08 100%)' }),
      desc:'مركز تعليم وأبحاث نيزكي لغرفة الأستاذ كاملة: الرأس ومؤشر إكمال التعلّم وتبويبات الأيام وكل مستطيلات الدروس كمحطات بحثية — هندسة كهرمانية مع تفاصيل بلورية مضيئة، مدارات ومحطات على مسار التعلّم، وأوزان ومؤقتات وأزرار حالة بإضاءة طاقة.' }),
    Object.assign({}, mbase, { id:'blazingMeteorDiscipline', target:'discipline', silver:7999, motion:{ sheen:17, breath:8.5, glint:14 },
      tokens:mtok({ '--pt-bm-acc':'255 136 52', '--pt-bm-acc2':'245 196 96', '--pt-bm-hot':'255 74 48',
        '--pt-bm-sky':'radial-gradient(90% 40% at 50% 104%, rgb(255 100 40 / .16), rgb(255 100 40 / 0) 70%), radial-gradient(70% 34% at 90% -4%, rgb(255 160 70 / .14), rgb(255 160 70 / 0) 70%), linear-gradient(180deg, #120C08 0%, #090605 54%, #0D0806 100%)' }),
      desc:'غرفة انضباط نيزكية قوية ومتماسكة تلبّس غرفة التأديب كاملة: تبويبا «أكتسبها» و«أتخلص منها» وعداداتهما، شريط الأدوات ومربع إضافة العادة بحقوله وأنواعه وأيامه وأهميته، وكل بطاقات العادات بحلقات تقدم كهرمانية وعدادات استمرار وأزرار تسجيل — معدن كهرماني مدرّع وطبقات داكنة وشرارات كهربائية دقيقة.' })
  ];
