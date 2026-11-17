  /* ===== CODIS-V66 · الهوية الصوتية «النيزك المشتعل» (سياق blazingMeteor) =====
     تفريغات Tesla وبلازما: شرارة (noise عالي التردد قصير جداً) + طنين FM بمؤشر يهبط بسرعة (قوس كهربائي) + انزلاق نغمة مربعة مفلترة (شحنة) +
     طبقة معدنية عابرة (strike 'metal'/'crystal' بتلاشٍ قصير). كلها أقل من ~0.3ث، والتنويع بـvars/jit المحرّك نفسه.
     نفس القناة/الأولوية/التبريد/hold للصوت الأصلي المقابل ⇒ الكتم ومستوى القنوات وحد الأصوات المتزامنة كما هي تماماً.
     تُختار فقط حين يكون النطاق الصوتي (setScope) = blazingMeteor، أي النقرة داخل غرفة ملبّسة بالثيم المجهّز. */
  Object.assign(SOUNDS, {
    'press@blazingMeteor':         { ch:'ui', p:1, cd:60, vars:3, jit:.04, fn(v,o){ const f = [1180, 1320, 1060][o.vr] * o.j;
                                      v.noise({ dur:.012, peak:.016, type:'highpass', f:5200 }); v.fm({ f:f, ratio:3.01, index:4, index2:.2, dur:.07, a:.001, peak:.012, lp:6000 });
                                      v.strike('metal', f * 2.1, .004, .004, { decay:.08, bright:.5, ex:0 }); } },
    'press.primary@blazingMeteor': { ch:'ui', p:1, cd:70, vars:2, jit:.02, fn(v,o){ const f = (o.vr ? 220 : 196) * o.j;
                                      v.tone({ f:f, f2:f * 2.6, type:'square', dur:.09, a:.003, peak:.012, lp:2400, lp2:5200 }); v.noise({ t:.004, dur:.02, peak:.02, type:'highpass', f:4800 });
                                      v.fm({ t:.02, f:f * 4, ratio:1.5, index:5, index2:.3, dur:.14, a:.002, peak:.012, lp:5200 }); v.strike('crystal', 2637 * o.j, .005, .05, { decay:.18, bright:.5, ex:0 }); } },
    'press.danger@blazingMeteor':  { ch:'ui', p:1, cd:70, fn(v){ v.tone({ f:240, f2:96, type:'square', dur:.13, a:.002, peak:.016, lp:1400 }); v.noise({ dur:.05, peak:.018, type:'bandpass', f:2600, f2:900, q:1.2 });
                                      v.fm({ t:.01, f:150, ratio:2.41, index:6, index2:.5, dur:.12, peak:.01, lp:2200 }); } },
    'tab@blazingMeteor':           { ch:'ui', p:1, cd:90, vars:2, jit:.03, fn(v,o){ v.noise({ dur:.035, peak:.01, type:'bandpass', f:3000 * o.j, f2:6000, q:1.4, a:.004 });
                                      v.fm({ t:.03, f:(o.vr ? 1568 : 1397) * o.j, ratio:2, index:2.2, index2:.1, dur:.08, peak:.011, lp:7000 }); } },
    'select@blazingMeteor':        { ch:'ui', p:1, cd:50, vars:2, jit:.04, fn(v,o){ v.fm({ f:(o.vr ? 1760 : 1660) * o.j, ratio:2.76, index:2.5, index2:.1, dur:.06, peak:.01, lp:7500 }); v.noise({ dur:.008, peak:.012, type:'highpass', f:6500 }); } },
    'toggle.on@blazingMeteor':     { ch:'ui', p:2, cd:80, hold:120, fn(v){ v.tone({ f:330, f2:1320, type:'square', dur:.1, a:.003, peak:.011, lp:2200, lp2:6000 }); v.noise({ t:.09, dur:.014, peak:.016, type:'highpass', f:5600 }); v.strike('crystal', 1976, .006, .1, { decay:.2, bright:.5, ex:0 }); } },
    'toggle.off@blazingMeteor':    { ch:'ui', p:2, cd:80, hold:120, fn(v){ v.tone({ f:1100, f2:240, type:'square', dur:.11, a:.002, peak:.01, lp:3600, lp2:1100 }); v.noise({ dur:.02, peak:.012, type:'bandpass', f:3000, q:1 }); } },
    'expand@blazingMeteor':        { ch:'ui', p:1, cd:90, fn(v){ v.tone({ f:440, f2:990, type:'triangle', dur:.12, a:.01, peak:.016, lp:3200 }); v.noise({ t:.05, dur:.05, peak:.006, type:'bandpass', f:4000, f2:7000, q:1, a:.02 }); } },
    'collapse@blazingMeteor':      { ch:'ui', p:1, cd:90, fn(v){ v.tone({ f:990, f2:400, type:'triangle', dur:.12, a:.006, peak:.014, lp:3000 }); v.noise({ dur:.012, peak:.01, type:'highpass', f:5000 }); } },
    'open@blazingMeteor':          { ch:'ui', p:2, cd:120, hold:120, fn(v){ v.noise({ dur:.16, peak:.01, type:'bandpass', f:1200, f2:5200, q:.9, a:.08 }); v.tone({ f:180, f2:720, type:'square', dur:.18, a:.04, peak:.008, lp:1600, lp2:4200 });
                                      v.fm({ t:.15, f:1318, ratio:3, index:3, index2:.1, dur:.12, peak:.012, lp:7000 }); } },
    'close@blazingMeteor':         { ch:'ui', p:2, cd:120, hold:120, fn(v){ v.noise({ dur:.12, peak:.009, type:'bandpass', f:5000, f2:1200, q:.9, a:.03 }); v.tone({ f:700, f2:160, type:'square', dur:.15, a:.004, peak:.009, lp:3000, lp2:900 });
                                      v.noise({ t:.13, dur:.012, peak:.014, type:'highpass', f:4200 }); } },
    'invalid@blazingMeteor':       { ch:'ui', p:2, cd:220, hold:180, fn(v){ v.fm({ f:118, ratio:1.01, index:8, index2:2, dur:.16, a:.004, peak:.018, lp:1800 }); v.noise({ t:.02, dur:.05, peak:.01, type:'bandpass', f:2200, q:2 });
                                      v.fm({ t:.12, f:110, ratio:1.01, index:6, index2:1.5, dur:.12, peak:.012, lp:1600 }); } },
    'confirm@blazingMeteor':       { ch:'ui', p:2, cd:150, hold:200, fn(v){ v.tone({ f:262, f2:524, type:'square', dur:.07, a:.002, peak:.01, lp:2600 }); v.noise({ t:.06, dur:.016, peak:.018, type:'highpass', f:5000 });
                                      v.fm({ t:.07, f:1046, ratio:2, index:3, index2:.1, dur:.18, peak:.014, lp:6500 }); v.strike('crystal', 2093, .006, .08, { decay:.3, bright:.5, ex:0 }); } },
    'success@blazingMeteor':       { ch:'ui', p:2, cd:200, hold:250, fn(v){ [784, 1046, 1568].forEach((f, k)=>v.fm({ t:k * .06, f:f, ratio:2, index:2.5, index2:.08, dur:.2, peak:.012 - k * .002, lp:7000 }));
                                      v.noise({ dur:.014, peak:.016, type:'highpass', f:5500 }); v.strike('crystal', 3136, .005, .13, { decay:.35, bright:.6, ex:0 }); } },
    /* حالات المهمة/العادة: «خلصتها» تفريغ صاعد يستقر بنغمة بلورية · «نصها» شحنة نصفية تتوقف · «ما سويتها» قوس كهربائي هابط مكتوم · التراجع سحب الشحنة */
    'task.done@blazingMeteor':     { ch:'ui', p:3, cd:60, hold:160, vars:2, jit:.01, fn(v,o){ v.tone({ f:330 * o.j, f2:990 * o.j, type:'square', dur:.08, a:.002, peak:.011, lp:2600, lp2:6000 });
                                      v.noise({ t:.07, dur:.014, peak:.02, type:'highpass', f:5200 }); v.fm({ t:.075, f:(o.vr ? 1318 : 1175) * o.j, ratio:2, index:2.8, index2:.06, dur:.24, peak:.015, lp:7000 }); v.strike('crystal', 2637, .006, .09, { decay:.35, bright:.6, ex:0 }); } },
    'task.half@blazingMeteor':     { ch:'ui', p:3, cd:60, hold:160, fn(v){ v.tone({ f:330, f2:660, type:'square', dur:.1, a:.002, peak:.01, lp:2400 }); v.fm({ t:.08, f:660, ratio:1.5, index:3, index2:1.5, dur:.14, peak:.011, lp:4200 });
                                      v.noise({ t:.04, dur:.06, peak:.006, type:'bandpass', f:3600, f2:2400, q:1, a:.02 }); } },
    'task.none@blazingMeteor':     { ch:'ui', p:3, cd:60, hold:160, fn(v){ v.tone({ f:300, f2:110, type:'square', dur:.14, a:.002, peak:.014, lp:1300 }); v.fm({ t:.01, f:140, ratio:2.41, index:5, index2:.6, dur:.14, peak:.01, lp:1800 });
                                      v.noise({ dur:.03, peak:.01, type:'bandpass', f:1800, q:1.4 }); } },
    'task.undo@blazingMeteor':     { ch:'ui', p:3, cd:60, hold:160, fn(v){ v.noise({ dur:.09, peak:.008, type:'bandpass', f:6000, f2:1400, q:1, a:.05 }); v.tone({ f:880, f2:330, type:'triangle', dur:.12, a:.004, peak:.012, lp:3000 }); } },
    'task.restore@blazingMeteor':  { ch:'ui', p:3, cd:150, hold:200, fn(v){ v.tone({ f:330, f2:880, type:'triangle', dur:.12, a:.005, peak:.012, lp:3200 }); v.fm({ t:.1, f:1046, ratio:2, index:2, index2:.1, dur:.14, peak:.01, lp:6000 }); } },
    'task.delete@blazingMeteor':   { ch:'ui', p:3, cd:80, hold:160, fn(v){ v.noise({ dur:.12, peak:.012, type:'bandpass', f:2400, f2:500, q:1, a:.004 }); v.tone({ f:420, f2:70, type:'square', dur:.16, a:.002, peak:.012, lp:1500, lp2:500 }); } },
    'task.leave@blazingMeteor':    { ch:'ui', p:1, cd:80, fn(v){ v.noise({ dur:.2, peak:.009, type:'bandpass', f:5200, f2:1300, q:.9, a:.04 }); v.pan(0); v.panTo(-.3, .22); } },
    /* طبقات تسلسل الحالة (نفس توقيتها وخصائصها): قلم على الورق ⇒ قلم بلازما يحفر خطاً متوهجاً (طقطقة حبيبات عالية + طنين خافت) */
    'pen.stroke@blazingMeteor':    { ch:'ui', p:1, cd:0, fn(v,o){ const d = o.dur || .3, x = o.kind === 'x'; v.grains({ dur:d, rate:x ? 80 : 64, peak:x ? .011 : .01, f:x ? 3400 : 4600, q:.9, gd:.01, shape:'swell' });
                                      v.tone({ f:x ? 180 : 240, dur:d, a:.03, peak:.004, lp:1200 }); v.pan(o.pan || 0); if(!x) v.panTo(.25, d); } },
    'pen.scribble@blazingMeteor':  { ch:'ui', p:1, cd:0, fn(v,o){ const d = o.dur || .5; v.grains({ dur:d, rate:100, peak:.008, f:4200, q:.9, gd:.008, shape:'swell' }); v.pan(-.15); v.panTo(.15, d); } },
    'pen.fill@blazingMeteor':      { ch:'ui', p:1, cd:0, fn(v,o){ const d = o.dur || .6; v.grains({ dur:d, rate:70, peak:.009, f:3000, q:.7, gd:.014, shape:'swell' }); v.tone({ f:220, f2:330, dur:d, a:.05, peak:.004, lp:1400 }); v.pan(.2); v.panTo(-.2 + .4 * (1 - (o.pct || 50) / 100), d); } }
  });
