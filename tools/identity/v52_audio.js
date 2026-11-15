  /* ===================== CODIS-CHEST-AUDIO (V52) · هوية صوتية جديدة لفتح الصناديق =====================
     «آلية أتيليه»: خشب مكتوم باللبّاد + آليات نحاسية (نوابض، لسان قفل، مفصلات) + نَفَس منخفض يتصاعد + أجراس زجاج/كريستال
     على سلّم F الليدي (F·G·A·B·C·E) — مركز نغمي مختلف كلياً عن أصوات CODIS العامة (D/A/E) وعن هوية الصناديق السابقة.
     كل حدث مرتبط بحركة فعلية في المشهد ويتدرّج بمستوى الكشف lv (1..9) ومادة الصندوق n (1..5)، و{ bulk:true } يخفف ويقصّر لـ×10.
     القناة reward (تحترم الكتم/المستوى العام/قناة المكافآت). المجموعة 'b3d' تُوقَف عند التخطي/الإغلاق.
     المفاتيح القديمة box.* / bulk.* / press@box صارت أسماء بديلة لهذه الهوية (المشهد ثنائي الأبعاد الاحتياطي يسمع الجديد فقط). */
  Object.assign(SOUNDS, (function(){
    const F = { F2:87.31, F3:174.61, A3:220, C4:261.63, E4:329.63, F4:349.23, G4:392, A4:440, B4:493.88, C5:523.25, E5:659.25, F5:698.46, G5:783.99, A5:880, B5:987.77, C6:1046.5, E6:1318.5, F6:1396.9, G6:1568 };
    const MATN = [null, 'gold', 'silver', 'crystal', 'gold', 'bronze'], BODY = [null, 'wood', 'hollow', 'stone', 'wood', 'stone'];
    const L9 = o=>Math.max(1, Math.min(9, (o && o.lv) | 0 || 1)), G2L = g=>[1, 1, 3, 5, 7, 9][Math.max(1, Math.min(5, g | 0 || 1))];
    const SC = [F.F5, F.G5, F.A5, F.C6, F.E6, F.F6, F.G6, F.A5 * 2, F.C6 * 2, F.E6 * 2];
    const K = o=>o.bulk ? .6 : 1;
    const C = {
      /* التفاعل الأول: لبّاد + نقرة نحاس بمادة الصندوق + نَفَس صاعد */
      'chest.touch': { ch:'reward', p:3, cd:250, fn(v,o){ const n = o.n || 1, m = MATN[n];
        v.tone({ f:118, f2:72, dur:.2, a:.003, peak:.07, lp:520 }); v.noise({ dur:.03, peak:.03, type:'bandpass', f:900, q:.8, a:.001 });
        v.strike(m, [0, F.C5, F.E5, F.G5, F.A4, F.C5][n] * 2, .016, .025, { decay:.55, bright:.55 });
        if(o.bulk) v.strike(m, [0, F.G5, F.B5, F.C6, F.E5, F.G5][n] * 2, .012, .09, { decay:.5, bright:.5 });
        v.air({ t:.02, dur:.42, f:420, f2:2400, peak:.011, q:.8 }); } },
      /* سقوط الصندوق: ثقل منخفض + ارتطام مادة الجسم + خشخشة الحليات */
      'chest.drop': { ch:'reward', p:3, cd:60, fn(v,o){ const g = o.g == null ? 1 : o.g, n = o.n || 1;
        v.tone({ f:74, f2:36, dur:.34, a:.003, peak:.15 * g, lp:240 }); v.noise({ dur:.1, peak:.055 * g, type:'lowpass', f:700, f2:160, a:.002 });
        v.strike(BODY[n], n === 3 || n === 5 ? 96 : 128, .05 * g, .004, { decay:1.1, ex:.3 });
        v.grains({ t:.025, dur:.14, n:5, peak:.011 * g, f:3000 + n * 250, q:3.5, gd:.01, type:'bandpass', shape:'fade' }); } },
      /* دوران المنصة: صرير خشبي رنّان + هدير خفيف يتحرك يميناً */
      'chest.shift': { ch:'reward', p:2, cd:200, fn(v,o){ const n = o.n || 1;
        v.grains({ dur:.5, rate:24, peak:.011, f:850 + n * 110, q:8, gd:.032, shape:'swell' }); v.tone({ f:56, dur:.55, a:.2, peak:.018, lp:170 }); v.pan(-.25); v.panTo(.25, .5); } },
      /* الترقّب: نَفَس منخفض بسنّين متباعدين يصعد خامس تام + ضجيج يتفتح؛ فوق 5 لمعان حبيبي، فوق 7 جرس FM يتكثّف */
      'chest.charge': { ch:'reward', p:3, cd:0, fn(v,o){ const lv = L9(o), d = Math.max(.25, o.dur || 1), k = K(o), b = 55 + lv * 4;
        [-8, 8].forEach(dt=>v.tone({ f:b, f2:b * 1.5, dur:d + .12, a:d * .85, peak:(.022 + lv * .003) * k, lp:200, lp2:800 + lv * 240, type:'sawtooth', det:dt }));
        v.noise({ dur:d + .1, a:d * .9, peak:(.008 + lv * .002) * k, type:'bandpass', f:300, f2:2600 + lv * 450, q:1.2 });
        if(lv >= 5) v.grains({ t:d * .35, dur:d * .65, rate:28 + lv * 6, peak:(.003 + lv * .0007) * k, f:6500, type:'highpass', gd:.01, shape:'swell' });
        if(lv >= 7) v.fm({ t:d * .3, f:F.F5, ratio:1.5, index:.4, index2:3.5, dur:d * .75, a:d * .65, peak:(.004 + lv * .0009) * k }); } },
      /* نبضة الترقّب: طرقة داخلية + خشخشة الآلية، تشتد مع رقم النبضة */
      'chest.rattle': { ch:'reward', p:3, cd:0, fn(v,o){ const n = o.n || 1, of = Math.max(1, o.of || 1), q = ((o.i || 0) + 1) / of, g = (o.g == null ? 1 : o.g) * K(o);
        v.tone({ f:84, f2:52, dur:.17, a:.003, peak:(.045 + q * .05) * g, lp:300 });
        v.strike(BODY[n], 150 + q * 50, (.03 + q * .03) * g, 0, { decay:.6, ex:.25 });
        v.grains({ t:.01, dur:.13, n:4 + Math.round(q * 4), peak:(.008 + q * .01) * g, f:2600 + n * 220, q:4, gd:.011, type:'bandpass', shape:'fade' }); } },
      /* تحرّر القفل: نابض مزدوج + رنين اللسان بمادة الصندوق + نفخة هواء */
      'chest.unlatch': { ch:'reward', p:3, cd:0, fn(v,o){ const n = o.n || 1, g = (o.g == null ? 1 : o.g) * K(o);
        v.noise({ dur:.012, peak:.055 * g, type:'highpass', f:3600, a:.0005 });
        v.strike('iron', 1720, .028 * g, 0, { decay:.22, ex:.6 }); v.strike('iron', 1260, .022 * g, .055, { decay:.28, ex:.5 });
        v.strike(MATN[n], [0, 620, 880, 1046, 740, 523][n], .02 * g, .06, { decay:.9 });
        v.air({ t:.07, dur:.24, f:2500, f2:900, peak:.015 * g }); } },
      /* تأرجح الغطاء: صرير المفصلة + هواء يندفع + جسم منخفض (الأثقل أبطأ وأغلظ) */
      'chest.lid': { ch:'reward', p:3, cd:0, fn(v,o){ const w = o.w || 1, g = K(o);
        v.grains({ dur:.34 * w, rate:30, peak:.013 * g, f:720 / w, q:9, gd:.034, shape:'swell' });
        v.air({ t:.02, dur:.46, f:380, f2:1900, peak:.022 * g, q:.7 }); v.tone({ f:92 / w, f2:58 / w, dur:.42, a:.08, peak:.028 * g, lp:240 }); } },
      /* ارتطام الغطاء بحدّه */
      'chest.lidstop': { ch:'reward', p:3, cd:0, fn(v,o){ const w = o.w || 1, n = o.n || 1;
        v.strike('wood', 112 / w, .06, 0, { decay:.9, ex:.4 }); v.strike(MATN[n], 300, .016, .004, { decay:.5 }); v.tone({ f:66, f2:44, dur:.2, a:.002, peak:.05, lp:200 }); } },
      /* الكشف — توقيع الهوية: انفتاح هواء + أجراس F الليدي، تتكاثر طبقاتها مع المستوى: وسادة (5+) · رعد منخفض (5+) · تألّق حبيبي (7+) · غونغ برونزي وتاج نغمي (9) */
      'chest.reveal': { ch:'reward', p:4, cd:0, duck:true, wet:o=>.12 + L9(o) * .018, fn(v,o){ const lv = L9(o), k = K(o), bulk = !!o.bulk;
        v.noise({ dur:.45, a:.008, peak:(.022 + lv * .003) * k, type:'bandpass', f:800, f2:5200, q:.6 });
        const notes = lv <= 2 ? [F.F5, F.A5] : lv <= 4 ? [F.F5, F.A5, F.C6] : lv <= 6 ? [F.C5, F.F5, F.A5, F.C6] : lv <= 8 ? [F.C5, F.E5, F.G5, F.B5, F.E6] : [F.F4, F.C5, F.E5, F.G5, F.A5, F.B5, F.E6, F.G6];
        const gap = bulk ? .035 : lv >= 7 ? .07 : .055, mat = lv >= 7 ? 'crystal' : 'glass';
        notes.forEach((f, i)=>v.strike(mat, f, (.026 - i * .0015) * k, .02 + i * gap, { decay:(bulk ? .5 : .8) + lv * .09, bright:.7 }));
        if(lv >= 5 && !bulk) [F.F4, F.C5, F.A4].forEach((f, i)=>v.tone({ t:.03, f:f, dur:1.1 + lv * .18, a:.09, peak:(.01 + lv * .0015), lp:1500 + lv * 120, partials:[[1,1,1],[2,.25,.7],[3,.08,.4]], det:(i - 1) * 6 }));
        if(lv >= 5) v.tone({ f:62, f2:34, dur:.85, a:.004, peak:(.06 + lv * .008) * k, lp:170 });
        if(lv >= 7) v.grains({ t:.12, dur:.7 + lv * .08, rate:40 + lv * 5, peak:.006 * k, f:7800, type:'highpass', gd:.008, shape:'fade' });
        if(lv >= 9){ v.strike('bronze', F.F2, .08 * k, 0, { decay:2.2 }); v.fm({ t:.08, f:F.F5, ratio:3.5, index:2.5, index2:.1, dur:1.8, peak:.014 * k }); } } },
      /* خروج البطاقة: هواء صاعد + لمعات صغيرة */
      'chest.rise': { ch:'reward', p:2, cd:0, fn(v,o){ const d = Math.max(.3, o.dur || .8), g = (o.g == null ? 1 : o.g) * K(o);
        v.air({ dur:d * .7, f:520, f2:3300, peak:.015 * g, q:1, a:d * .4 }); v.grains({ t:d * .2, dur:d * .5, n:5, peak:.004 * g, f:7200, type:'highpass', gd:.008, shape:'swell' }); } },
      /* دوران البطاقة: رفرفة قصيرة تتبادل يميناً/يساراً */
      'chest.spin': { ch:'reward', p:2, cd:0, max:6, fn(v,o){ const i = o.i || 0; v.air({ dur:.12, f:1500 + i * 120, f2:4300, peak:.011, q:1.6 }); v.pan(i % 2 ? .22 : -.22); } },
      /* وصول البطاقة لوضعية البطل */
      'chest.settle': { ch:'reward', p:2, cd:0, fn(v,o){ const lv = L9(o); v.strike('glass', lv >= 5 ? F.E6 : F.C6, .015, 0, { decay:.5, bright:.5 }); v.noise({ dur:.03, peak:.018, type:'bandpass', f:2400, q:1.5 }); v.tone({ f:180, f2:140, dur:.08, a:.002, peak:.018, lp:600 }); } },
      /* المكافآت النادرة (6+): تاج صاعد من الكريستال + وسادة ذهبية؛ أطول وأغنى مع المستوى */
      'chest.rare': { ch:'reward', p:4, cd:300, wet:.24, fn(v,o){ const lv = L9(o), k = K(o), N = Math.min(8, 3 + lv - 5);
        const S = [F.C5, F.E5, F.G5, F.B5, F.C6, F.E6, F.G6, F.B5 * 2];
        for(let i = 0; i < N; i++) v.strike('crystal', S[i], (.017 - i * .001) * k, i * (o.bulk ? .045 : .06), { decay:.9 + lv * .1, bright:.75 });
        if(!o.bulk) [F.F4, F.A4, F.E5].forEach((f, i)=>v.tone({ t:.05, f:f, dur:1.4 + lv * .15, a:.25, peak:.008 + lv * .001, lp:2200, partials:[[1,1,1],[2,.2,.6]], det:(i - 1) * 5 }));
        if(lv >= 8) v.strike('gold', F.F3, .03 * k, .02, { decay:1.6 }); } },
      /* ×10: انتقال التركيز للصندوق التالي */
      'chest.focus': { ch:'reward', p:1, cd:80, fn(v,o){ const k = o.k || 0; v.strike('wood', [F.F5, F.G5, F.A5, F.C6][k % 4] * .5, .01, 0, { decay:.3, ex:.2 }); v.air({ dur:.15, f:1100, f2:2600, peak:.007 }); v.pan(o.pan || 0); } },
      /* ×10: تحليق البطاقة نحو خانتها (اتجاه ستيريو نحو الخانة، نبرة تختلف بالترتيب) */
      'chest.fly': { ch:'reward', p:2, cd:0, fn(v,o){ const k = o.k || 0; v.air({ dur:.32, f:3100 + (k % 5) * 110, f2:780, peak:.013 + L9(o) * .0012, q:1 }); v.pan(0); v.panTo(o.pan || 0, .3); } },
      /* ×10: هبوط البطاقة بخانتها — لمسة لبّاد + نغمة من سلّم صاعد مع الترتيب (لا تكرار آلي) */
      'chest.slot': { ch:'reward', p:2, cd:0, max:6, fn(v,o){ const lv = L9(o), k = o.k || 0, m = lv >= 7 ? 'gold' : lv >= 4 ? 'crystal' : 'glass';
        v.noise({ dur:.026, peak:.022, type:'bandpass', f:1800, q:1.2 }); v.tone({ f:150, f2:110, dur:.07, a:.002, peak:.026, lp:500 });
        v.strike(m, SC[k % SC.length], .011 + lv * .0018, .005, { decay:.4 + lv * .06, bright:.6 }); v.pan(o.pan || 0); } },
      /* ×10: لحظة هدوء قبل الأفضل */
      'chest.hush': { ch:'reward', p:2, cd:0, fn(v){ v.tone({ f:F.F2, dur:.62, a:.42, peak:.028, lp:280 }); v.air({ dur:.56, a:.42, f:300, f2:1300, peak:.009 }); } },
      /* ×10: إبراز أفضل جائزة */
      'chest.best': { ch:'reward', p:4, cd:300, wet:.2, duck:true, fn(v,o){ const lv = L9(o); [F.F5, F.A5, F.C6, F.E6].forEach((f, i)=>v.strike('crystal', f, .018 - i * .002, i * .05, { decay:1 + lv * .08, bright:.7 })); v.strike('bronze', F.F3, .03 + lv * .003, 0, { decay:1.2 }); v.pan(o.pan || 0); } },
      /* ×10: الخاتمة — قفلة F مع تاسعة، أغنى بأعلى مستوى في النتائج */
      'chest.finale': { ch:'reward', p:4, cd:600, wet:.2, duck:true, fn(v,o){ const lv = L9(o);
        [F.F4, F.C5, F.F5, F.G5, F.A5].forEach((f, i)=>v.strike(lv >= 6 ? 'gold' : 'glass', f, .018, i * .045, { decay:1 + lv * .12, bright:.6 }));
        v.air({ t:.05, dur:.6, f:1600, f2:6000, peak:.012 });
        if(lv >= 6) v.tone({ f:58, f2:40, dur:.7, a:.004, peak:.05, lp:160 }); } },
      /* شراء صندوق يُفتح فوراً (المسار بلا 3D): عملات نحاس + لمسة الصندوق */
      'chest.buy': { ch:'reward', p:3, cd:250, hold:200, fn(v,o){ for(let k = 0; k < (o.bulk ? 4 : 2); k++) v.strike('gold', [F.C6, F.A5, F.F5, F.C6][k], .014, k * .055, { decay:.45, bright:.6 }); v.tone({ t:.06, f:120, f2:74, dur:.2, a:.003, peak:.06, lp:480 }); v.strike('wood', 140, .03, .06, { decay:.8 }); } },
      'chest.skip':  { ch:'reward', p:2, cd:200, fn(v){ v.air({ dur:.26, f:4200, f2:600, peak:.02, q:.8 }); v.grains({ dur:.2, rate:60, peak:.006, f:5200, shape:'fade' }); } },
      /* البطاقة تستقر بمكانها النهائي في الواجهة */
      'chest.place': { ch:'reward', p:2, cd:200, fn(v){ v.noise({ dur:.03, peak:.02, type:'bandpass', f:1500, q:1 }); v.strike('glass', F.A5, .01, .01, { decay:.4, bright:.5 }); } },
    };
    /* أسماء بديلة: كل مفاتيح الصناديق القديمة تمر بالهوية الجديدة (لا صوت قديم يعمل) */
    const alias = (nk, fn)=>Object.assign({}, C[nk], { fn(v, o){ C[nk].fn(v, fn ? fn(o || {}) : (o || {})); } });
    C['box.thud'] = alias('chest.drop'); C['box.creak'] = alias('chest.shift'); C['box.latch'] = alias('chest.unlatch'); C['box.unlock'] = alias('chest.unlatch');
    C['box.charge'] = alias('chest.charge', o=>Object.assign({}, o, { lv:G2L(o.lv) })); C['box.release'] = alias('chest.lid', o=>Object.assign({}, o, { w:1 }));
    C['box.reveal'] = alias('chest.reveal', o=>Object.assign({}, o, { lv:G2L(o.lv || o.g) })); C['bulk.reveal'] = alias('chest.reveal', o=>Object.assign({}, o, { lv:G2L(o.g || o.lv), bulk:true }));
    C['bulk.fly'] = alias('chest.fly', o=>Object.assign({}, o, { lv:G2L(o.g) })); C['bulk.slot'] = alias('chest.slot', o=>Object.assign({}, o, { lv:G2L(o.g), k:(Math.random() * 6) | 0 }));
    C['bulk.finale'] = alias('chest.finale', o=>Object.assign({}, o, { lv:G2L(o.g) })); C['bulk.skip'] = alias('chest.skip'); C['bulk.advance'] = alias('chest.focus'); C['press@box'] = alias('chest.touch'); C['store.buy@box'] = alias('chest.buy'); C['store.buy@bulk'] = alias('chest.buy', o=>Object.assign({}, o, { bulk:true }));
    return C;
  })());
