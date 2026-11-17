  /* ===== CODIS-V64 · الهوية الصوتية «الخشب المعتّق» (سياق agedWood) =====
     خشب جوز/بلوط (strike 'wood' بتردد منخفض-متوسط + رنين صندوق 'hollow') + احتكاك قصير (noise ضيق) + طقة نحاس دقيقة ('bronze' بتلاشٍ قصير).
     نفس القناة/الأولوية/التبريد/hold للصوت الأصلي المقابل ⇒ الكتم ومستوى الواجهة وحد الأصوات ومنطق «الصوت الخاص يغلب العام» كما هي تماماً.
     تُختار فقط حين يكون النطاق الصوتي (setScope) = agedWood، أي النقرة داخل سطح ملبّس بالثيم المجهّز. */
  Object.assign(SOUNDS, {
    'press@agedWood':         { ch:'ui', p:1, cd:60, vars:3, jit:.03, fn(v,o){ const f = [540, 600, 500][o.vr] * o.j;
                                 v.strike('wood', f, .05, 0, { decay:.55, ex:.3, exF:2400 }); v.strike('hollow', f * .36, .022, .003, { decay:.5, ex:0 });
                                 v.noise({ t:.004, dur:.022, peak:.008, type:'bandpass', f:1700, q:1.4 }); } },
    'press.primary@agedWood': { ch:'ui', p:1, cd:70, vars:2, jit:.02, fn(v,o){ const f = (o.vr ? 168 : 152) * o.j;
                                 v.strike('hollow', f, .06, 0, { decay:.95, ex:.4, exF:1500 }); v.strike('wood', f * 2.7, .045, .002, { decay:.6, ex:.25 });
                                 v.strike('bronze', 2480 * o.j, .0055, .014, { decay:.14, bright:.5, ex:0 }); v.noise({ t:.006, dur:.03, peak:.007, type:'bandpass', f:1300, q:1.1 }); } },
    'press.danger@agedWood':  { ch:'ui', p:1, cd:70, fn(v){ v.strike('hollow', 118, .06, 0, { decay:.7, ex:.35, exF:1100 }); v.strike('wood', 300, .035, .006, { decay:.4, ex:.2 }); } },
    'tab@agedWood':           { ch:'ui', p:1, cd:90, vars:2, jit:.02, fn(v,o){ v.noise({ dur:.05, peak:.009, type:'bandpass', f:1500 * o.j, f2:950, q:1, a:.012 });
                                 v.strike('wood', (o.vr ? 940 : 860) * o.j, .03, .042, { decay:.28, ex:.45, exF:3000 }); } },
    'confirm@agedWood':       { ch:'ui', p:2, cd:150, hold:200, fn(v){ v.strike('wood', 380, .05, 0, { decay:.65, ex:.3 }); v.strike('hollow', 140, .03, .004, { decay:.6, ex:0 });
                                 v.noise({ t:.07, dur:.012, peak:.012, type:'bandpass', f:3200, q:1.6 }); v.strike('bronze', 1900, .009, .072, { decay:.16, bright:.5, ex:0 }); } },
    'success@agedWood':       { ch:'ui', p:2, cd:200, hold:250, fn(v){ v.strike('wood', 520, .046, 0, { decay:.55, ex:.3 }); v.strike('wood', 660, .044, .11, { decay:.55, ex:.3 });
                                 v.strike('bronze', 1318, .007, .13, { decay:.4, bright:.6, ex:0 }); } },
    /* فتح/إغلاق من داخل السطح (مثل «أضف للخطة» يفتح المحرّر): درج خشبي ينزلق ثم يستقر */
    'open@agedWood':          { ch:'ui', p:2, cd:120, hold:120, fn(v){ v.noise({ dur:.16, peak:.011, type:'bandpass', f:800, f2:1500, q:.9, a:.07 }); v.strike('wood', 330, .04, .15, { decay:.5, ex:.25 }); v.strike('hollow', 120, .02, .155, { decay:.5, ex:0 }); } },
    'close@agedWood':         { ch:'ui', p:2, cd:120, hold:120, fn(v){ v.noise({ dur:.13, peak:.01, type:'bandpass', f:1400, f2:750, q:.9, a:.05 }); v.strike('hollow', 140, .045, .12, { decay:.6, ex:.3, exF:1000 }); v.strike('wood', 280, .025, .125, { decay:.35, ex:0 }); } },
    /* حالات المهمة: تبقى مميزة بالمعنى — «خلصتها» نقرتان صاعدتان + طقة نحاس، «نصها» نقرة وسطى + انزلاق قصير، «ما سويتها» طرقة مكتومة منخفضة، التراجع انزلاق عكسي */
    'task.done@agedWood':     { ch:'ui', p:3, cd:60, hold:160, vars:2, jit:.01, fn(v,o){ v.strike('wood', 640 * o.j, .05, 0, { decay:.5, ex:.3 }); v.strike('wood', (o.vr ? 860 : 820) * o.j, .046, .07, { decay:.55, ex:.3 });
                                 v.strike('bronze', 2093, .007, .085, { decay:.35, bright:.5, ex:0 }); } },
    'task.half@agedWood':     { ch:'ui', p:3, cd:60, hold:160, fn(v){ v.strike('wood', 520, .05, 0, { decay:.55, ex:.3 }); v.noise({ t:.03, dur:.07, peak:.008, type:'bandpass', f:1200, f2:1700, q:1, a:.02 }); } },
    'task.none@agedWood':     { ch:'ui', p:3, cd:60, hold:160, fn(v){ v.strike('hollow', 128, .065, 0, { decay:.6, ex:.35, exF:900 }); v.strike('wood', 240, .035, .028, { decay:.35, ex:.15 }); } },
    'task.undo@agedWood':     { ch:'ui', p:3, cd:60, hold:160, fn(v){ v.noise({ dur:.09, peak:.009, type:'bandpass', f:1800, f2:900, q:1, a:.05 }); v.strike('wood', 430, .04, .085, { decay:.45, ex:.25 }); } },
    /* طبقات تسلسل الحالة (نفس توقيتها وخصائصها): ريشة القلم على الورق ⇒ إزميل يحفر في الخشب، وخروج المهمة ⇒ انزلاق قطعة خشب في مجراها */
    'pen.stroke@agedWood':    { ch:'ui', p:1, cd:0, fn(v,o){ const d = o.dur || .3, x = o.kind === 'x'; v.grains({ dur:d, rate:x ? 60 : 48, peak:x ? .012 : .011, f:x ? 1700 : 2100, q:.8, gd:.018, shape:'swell' });
                                 v.strike('wood', x ? 420 : 620, .02, d * .9, { decay:.35, ex:.2 }); v.pan(o.pan || 0); if(!x) v.panTo(.25, d); } },
    'pen.scribble@agedWood':  { ch:'ui', p:1, cd:0, fn(v,o){ const d = o.dur || .5; v.grains({ dur:d, rate:80, peak:.008, f:1800, q:.8, gd:.014, shape:'swell' }); v.pan(-.15); v.panTo(.15, d); } },
    'pen.fill@agedWood':      { ch:'ui', p:1, cd:0, fn(v,o){ const d = o.dur || .6; v.grains({ dur:d, rate:55, peak:.01, f:1400, q:.6, gd:.022, shape:'swell' }); v.pan(.2); v.panTo(-.2 + .4 * (1 - (o.pct || 50) / 100), d); } },
    'task.leave@agedWood':    { ch:'ui', p:1, cd:80, fn(v){ v.noise({ dur:.22, peak:.01, type:'bandpass', f:1300, f2:650, q:.9, a:.06 }); v.strike('wood', 300, .022, .2, { decay:.4, ex:.15 }); v.pan(0); v.panTo(-.3, .24); } }
  });
