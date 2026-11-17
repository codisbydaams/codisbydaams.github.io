/* CODIS-V63: الأيام المكتملة — نفس تعريف اكتمال الغرفة الموجود (codisRoomCompletePayload / ROOM_DAY_COMPLETE): يوم غير فارغ وكل عناصره «تمّت» (status 'done') في غرفة واحدة.
   غرفة العمليات (data.weeks / tasksWeek) وغرفة الأستاذ (data.learnWeeks / learnWeek) كلٌّ على حدة: اكتمال يوم في غرفة = يوم مكتمل واحد.
   يوم العطلة (holidayDay + extraHolidays) والأيام الفارغة خارج الحساب. الهوية الثابتة = الغرفة|الخطة|اليوم (نفس مفتاح إشعار room-day) ⇒
   الخطة الجارية ونسختها بالأرشيف (أو نسختان بالأرشيف) لا تُحتسبان مرتين. قراءة فقط ولا ترمي (function declaration آمنة وقت التحميل). */
function codisProgressDaysDone(){
  try{
    const seen = {}; let n = 0;
    const add = (room, wid, w)=>{
      if(!w || typeof w !== 'object' || !w.days || typeof w.days !== 'object') return;
      const ex = holidayExtras(w);
      for(let d = 0; d < 7; d++){
        if(d === w.holidayDay || ex.indexOf(d) !== -1) continue;
        const L = w.days[d]; if(!Array.isArray(L) || !L.length) continue;
        if(L.some(t=>!t || t.status !== 'done')) continue;
        const k = room + '|' + wid + '|' + d; if(seen[k]) continue;
        seen[k] = true; n++;
      }
    };
    ['tasks', 'learn'].forEach(room=>{
      const live = room === 'learn' ? data.learnWeeks : data.weeks;
      if(live && typeof live === 'object') Object.keys(live).forEach(k=>add(room, k, live[k]));
      (Array.isArray(data.archive) ? data.archive : []).forEach(a=>{ if(a && typeof a === 'object' && a.kind !== 'habit') add(room, String(a.weekId || a.id || ''), room === 'learn' ? a.learnWeek : a.tasksWeek); });
    });
    return n;
  }catch(e){ return 0; }
}
/* تراجع عن «خلصتها» (المهمة لم تعد مكتملة): مثل V62 revalidate — إنجاز فُتح اليوم نفسه ولم يعد شرطه متحققاً ولم يُستلم يرجع «قيد التقدم». الفتح من يوم سابق يبقى */
function codisProgressTaskUndo(){
  try{ const ids = CodisProgress.defs().filter(a=>a.metric === 'opsDone' || a.metric === 'learnDone' || a.metric === 'daysDone').map(a=>a.id); CodisProgress.revalidate(ids); }catch(e){}
}
