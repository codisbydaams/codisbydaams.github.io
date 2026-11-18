/* ================= CODIS-V69 · بدايات الغرف (Room Intros) =================
   أربعة منتجات تجميلية مستقلة تماماً (منتج لكل غرفة) — ليست ثيمات غرف ولا مظاهر بطاقات ولا ثيمات موافقة.
   • البيانات: data.inventory.roomIntros = { owned:[{id, room, source, sourceRef, acquiredAt, paid}] } — لا خانة تجهيز: المملوك يعمل تلقائياً.
   • الشراء: CodisWallet.transact واحدة (PURCHASE_COSMETIC بمرجع roomintro|<id>) — نفس محفظة الفضة؛ applySilver يرفض تكرار المرجع،
     والتراجع يشمل الملكية (اللقطة تشمل data.inventory). heal() يسترجع ملكية معاملة محفوظة بلا سجل (انقطاع بين الخطوتين).
   • التشغيل: navigateToPage وحدها تستدعي codisRoomIntroOnNav(page, pageChanged) بعد اكتمال الانتقال. الشرط: انتقال حقيقي (الصفحة تغيّرت)
     + التطبيق انكشف (codisBootState.revealed — تضعه codisReveal فقط، بعد codisBoot الذي يستدعي navigateToPage('tasks') أثناء التجهيز) ⇒ لا مؤقتات.
   • المعاينة: نسخة مضمّنة داخل نافذة تفاصيل المتجر، لا تلمس الغرف ولا navigateToPage. */
const CODIS_ROOM_INTRO_DEFS = [
  { id:'planningIntro', room:'planning', roomAr:'غرفة التخطيط', roomEn:'Planning Room', ar:'مكتب الخطة العتيق', silver:2299, rarity:'epic', rarityAr:'ملحمي',
    line:'كل إنجاز يبدأ بخطة', tag:'خريطة مخطوطة · بوصلة نحاسية · ختم شمعي',
    short:'خريطة تنبسط على مكتب عتيق وبوصلة نحاسية ترسم مسار خطتك.',
    desc:'على مكتب خشبي قديم تنزلق خريطة مخطوطة مطوية، ثم تنبسط من خط طيّها، فترسم بوصلة نحاسية مسار الخطة نقطة بعد نقطة حتى العلم الأخير، ويُختم المخطط بختم شمعي ويُثبَّت بدبوس.',
    beats:['تنزلق الخريطة', 'تنبسط من الطي', 'البوصلة ترسم المسار', 'ختم شمعي ودبوس'] },
  { id:'tasksIntro', room:'tasks', roomAr:'غرفة العمليات', roomEn:'Operations Room', ar:'لوح العمليات', silver:2599, rarity:'epic', rarityAr:'ملحمي',
    line:'حان وقت التنفيذ', tag:'لوح مهام بإطار أنتيكا · ختم «منجز» · ساعة تدق',
    short:'لوح مهام يُعلَّق، بطاقات تُثبَّت، وختم «منجز» ينزل على المهمة.',
    desc:'يُعلَّق لوح عمليات بإطار خشبي أنتيكا، وتُثبَّت عليه بطاقات المهام بدبابيس ويربطها خيط أحمر، ثم ينزل ختم مطاطي على المهمة الوسطى، وتُشطب البقية بعلامات إنجاز بينما تدق الساعة ويتقدم شريط التنفيذ.',
    beats:['يُعلَّق اللوح', 'تُثبَّت البطاقات', 'ختم «منجز»', 'شريط التنفيذ يتقدم'] },
  { id:'learnIntro', room:'learn', roomAr:'غرفة الأستاذ', roomEn:"Teacher's Room", ar:'مخطوطة الأستاذ', silver:2799, rarity:'epic', rarityAr:'ملحمي',
    line:'المعرفة تصنع الفرق', tag:'كتاب جلدي · مسار تعلّم بمحطات · ريشة وفاصل',
    short:'كتاب جلدي ينفتح وتُقلب صفحته، ومسار تعلّم تُعلَّم محطته بالريشة.',
    desc:'في مكتبة هادئة ينفتح كتاب جلدي أخضر بزخارف ذهبية، وتُقلب صفحة، فتُكتب السطور وتظهر رموز المعرفة، ويُرسم مسار تعلّم بمحطاته، وينزل فاصل الكتاب، وتعلّم الريشة المحطة الأخيرة بتوهج خفيف.',
    beats:['ينفتح الكتاب', 'تُقلب صفحة', 'يُرسم مسار التعلّم', 'الريشة تعلّم المحطة'] },
  { id:'habitsIntro', room:'habits', roomAr:'غرفة التأديب', roomEn:'Discipline Room', ar:'سجل الثبات', silver:3199, rarity:'legendary', rarityAr:'أسطوري',
    line:'الثبات يصنع الفرق', tag:'سجل جلدي بحزام · مربعات الأيام · ختم الثبات',
    short:'سجل جلدي يُفك حزامه، تمتلئ مربعات الأيام وتتصل سلسلة الثبات.',
    desc:'سجل انضباط من جلد معتّق يُفك حزامه ويُرفع غلافه، فتظهر صفحة المتابعة وتمتلئ مربعات الأيام بعلامات الاستمرار، وتتصل سلسلة الثبات حتى يوم اليوم، ثم يُختم السجل بختم أحمر.',
    beats:['يُفك الحزام', 'يُرفع الغلاف', 'علامات الاستمرار', 'سلسلة الثبات والختم'] }
].map(d=>Object.freeze(d));
const CODIS_RI_PLAY_MS = 2350, CODIS_RI_OUT_MS = 340, CODIS_RI_CALM_MS = 1300;

const CodisRoomIntros = (function(){
  const DEFS = CODIS_ROOM_INTRO_DEFS;
  function st(){
    const inv = data.inventory; let t = inv.roomIntros;
    if(!t || typeof t !== 'object' || Array.isArray(t)) t = inv.roomIntros = { owned:[] };
    if(!Array.isArray(t.owned)) t.owned = [];
    return t;
  }
  function def(id){ return DEFS.find(d=>d.id === id) || null; }
  function forRoom(room){ return DEFS.find(d=>d.room === room) || null; }
  function rec(id){ return st().owned.find(x=>x && x.id === id) || null; }
  function owns(id){ return !!(def(id) && rec(id)); }
  function owned(){ return DEFS.filter(d=>owns(d.id)); }
  function heal(){
    let n = 0; try{ CodisWallet.silverTxs().forEach(t=>{ const m = /^roomintro\|(.+)$/.exec(t && t.type === 'PURCHASE_COSMETIC' ? String(t.referenceId || '') : '');
      const d = m && def(m[1]); if(d && !rec(d.id)){ st().owned.push({ id:d.id, room:d.room, source:'store', sourceRef:String(t.id || ''), acquiredAt:t.createdAt || econNowIso(), paid:Math.abs(Number(t.amount) || 0) }); n++; } }); }catch(e){}
    return n;
  }
  function price(id){ const d = def(id); return d ? d.silver : 0; }
  function buy(id){
    const d = def(id); if(!d) return { ok:false, reason:'invalid' };
    if(owns(id)) return { ok:false, reason:'owned' };
    const bal = CodisWallet.silverBalance(); if(!CodisLimits.afford(bal, d.silver)) return { ok:false, reason:'insufficient', need:d.silver - bal, price:d.silver };
    return CodisWallet.transact([], ()=>{
      if(rec(d.id)) return { ok:false, reason:'owned' };
      const tx = CodisWallet.applySilver('PURCHASE_COSMETIC', -d.silver, 'شراء بداية ' + d.roomAr + ' «' + d.ar + '»', 'store', 'roomintro|' + d.id, { name:d.ar, roomIntro:d.id, room:d.room });
      if(!tx) return { ok:false, reason:'tx' };
      st().owned.push({ id:d.id, room:d.room, source:'store', sourceRef:tx.id, acquiredAt:econNowIso(), paid:d.silver });
      return { ok:true, def:d, price:d.silver, tx:tx };
    });
  }
  return { defs:()=>DEFS.slice(), def, forRoom, owns, owned, heal, price, buy };
})();

/* ---------- المشهد (مشترك بين التشغيل الحقيقي والمعاينة والمصغّرة) ---------- */
let codisRiSeq = 0;
function codisRiCalm(){ try{ return !!(window.CODIS_REDUCED_MOTION || document.documentElement.classList.contains('sx-calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); }catch(e){ return false; } }
function codisRiArtHtml(d, uid){
  const f = CODIS_RI_ART[d.room]; if(!f) return '';
  try{ return f('ri' + uid + '-'); }catch(e){ console.error('CODIS room intro art:', e); return ''; }
}
/* thumb ⇒ اللقطة الأخيرة ثابتة (بلا is-play)؛ المصغّرة بمعرّفات بنطاق ثابت كي يبقى ناتج المتجر مطابقاً حرفياً بين الرسمات (V61) */
function codisRiThumbHtml(d){
  const i = CODIS_ROOM_INTRO_DEFS.indexOf(d);
  return '<span class="ri-thumb-art" data-ri-room="' + d.room + '">' + codisRiArtHtml(d, 'k' + (600000 + i)) + '</span>';
}
function codisRiSceneHtml(d, mode){
  return '<div class="ri-scene" data-ri-room="' + d.room + '" data-ri-mode="' + mode + '">' +
    '<div class="ri-art">' + codisRiArtHtml(d, 's' + (++codisRiSeq)) + '</div>' +
    '<div class="ri-cap"><span class="ri-kick" dir="ltr">' + escapeHtml(d.roomEn) + '</span>' +
    '<span class="ri-title"' + (mode === 'live' ? ' id="ri-live-ttl"' : '') + '>' + escapeHtml(d.roomAr) + '</span>' +
    '<span class="ri-orn" aria-hidden="true"><i></i><b></b><i></i></span>' +
    '<span class="ri-line"' + (mode === 'live' ? ' id="ri-live-line"' : '') + '>' + escapeHtml(d.line) + '</span></div></div>';
}
/* يبدأ الحركة من أولها. أطوال الخطوط المرسومة ثابتة بالرسم (data-len، لا pathLength — دعمه بـWebKit متفاوت، ولا getTotalLength الذي يجبر تخطيطاً
   متزامناً لحظة الانتقال). fresh = مشهد أُدرج للتو ⇒ لا حاجة لإعادة تدفق قسرية لإعادة التشغيل */
function codisRiStart(scene, fresh){
  if(!scene) return;
  scene.classList.remove('is-play', 'is-calm');
  const calm = codisRiCalm();
  scene.querySelectorAll('.k-draw').forEach(p=>{
    if(calm){ p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; return; }
    let L = +p.getAttribute('data-len') || 0; if(!L){ try{ L = Math.ceil(p.getTotalLength()) + 2; }catch(e){ L = 0; } }
    if(L > 0){ p.style.strokeDasharray = L + ' ' + L; p.style.strokeDashoffset = String(L); } else { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }
  });
  if(!fresh) void scene.offsetWidth;
  scene.classList.add(calm ? 'is-calm' : 'is-play');
}

/* ---------- التشغيل الحقيقي عند دخول الغرفة ---------- */
let codisRiLive = null;
function codisRoomIntroReady(){
  try{
    const B = window.codisBootState;
    if(!B || !(B.revealed > 0)) return false;                       /* أثناء codisBoot (حتى navigateToPage('tasks') الأولي) وقبل الكشف */
    if(document.documentElement.classList.contains('codis-booting')) return false;
    if(document.hidden) return false;
    return true;
  }catch(e){ return false; }
}
function codisRoomIntroStop(instant){
  const L = codisRiLive; if(!L) return;
  codisRiLive = null;
  L.timers.forEach(t=>clearTimeout(t)); L.timers.length = 0;
  const el = L.el, hadFocus = el.contains(document.activeElement);
  const done = ()=>{ if(el.parentNode) el.parentNode.removeChild(el); };
  if(instant || codisRiCalm()){ if(instant) done(); else { el.classList.add('is-out'); setTimeout(done, 200); } }
  else { el.classList.add('is-out'); setTimeout(done, CODIS_RI_OUT_MS + 10); }
  if(hadFocus){ const f = L.focus; if(f && f.isConnected && f.offsetParent !== null){ try{ f.focus({ preventScroll:true }); }catch(e){} } else { try{ el.querySelector('.ri-skip').blur(); }catch(e){} } }
}
function codisRoomIntroPlay(id){
  const d = CodisRoomIntros.def(id); if(!d) return false;
  codisRoomIntroStop(true);
  const calm = codisRiCalm();
  const el = document.createElement('div');
  el.className = 'ri-layer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'ri-live-ttl'); el.setAttribute('aria-describedby', 'ri-live-line'); el.setAttribute('data-ri', d.id);
  el.innerHTML = '<div class="ri-bg" aria-hidden="true"></div>' + codisRiSceneHtml(d, 'live') +
    '<button type="button" class="ri-skip" aria-label="' + escapeHtml('تخطي بداية ' + d.roomAr) + '"><span>تخطي</span>' +
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><i class="ri-skip-bar" aria-hidden="true"></i></button>';
  const L = { el:el, d:d, timers:[], focus:document.activeElement, at:Date.now() };
  /* أي نقرة أو لمسة بالطبقة = تخطٍّ (بعد 250ms كي لا تُحسب لمسة التنقل نفسها) — الزر واضح للوحة المفاتيح وقارئ الشاشة */
  el.addEventListener('click', ev=>{ ev.stopPropagation(); if(Date.now() - L.at < 250 && !ev.target.closest('.ri-skip')) return; if(codisRiLive === L) codisRoomIntroStop(false); });
  el.addEventListener('keydown', ev=>{ if(ev.key === 'Tab'){ ev.preventDefault(); const b = el.querySelector('.ri-skip'); try{ b.focus({ preventScroll:true }); }catch(e){} } });
  el.style.setProperty('--ri-play', (calm ? CODIS_RI_CALM_MS : CODIS_RI_PLAY_MS) + 'ms');
  document.body.appendChild(el);
  codisRiLive = L;
  codisRiStart(el.querySelector('.ri-scene'), true);
  requestAnimationFrame(()=>{ if(codisRiLive !== L) return; el.classList.add('is-in'); const b = el.querySelector('.ri-skip'); try{ b.focus({ preventScroll:true }); }catch(e){} });
  L.timers.push(setTimeout(()=>{ if(codisRiLive === L) codisRoomIntroStop(false); }, calm ? CODIS_RI_CALM_MS : CODIS_RI_PLAY_MS));
  return true;
}
/* يُستدعى من navigateToPage فقط، بعد navEnd (الغرفة الجديدة ظاهرة وحركة دخولها بدأت تحت الطبقة) */
function codisRoomIntroOnNav(page, changed){
  if(!changed) return;                                    /* نفس الغرفة المفتوحة ⇒ لا شيء */
  codisRoomIntroStop(true);                               /* انتقال جديد ينهي بداية غرفة سابقة فوراً */
  if(!codisRoomIntroReady()) return;
  const d = CodisRoomIntros.forRoom(page);                /* الإعدادات وغيرها ⇒ لا تعريف */
  if(!d || !CodisRoomIntros.owns(d.id)) return;
  codisRoomIntroPlay(d.id);
}
document.addEventListener('keydown', ev=>{ if(codisRiLive && ev.key === 'Escape'){ ev.stopPropagation(); ev.preventDefault(); codisRoomIntroStop(false); } }, true);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && codisRiLive) codisRoomIntroStop(true); });

/* ---------- المتجر: تبويب «بدايات الغرف» ---------- */
function econRoomIntroCardHtml(d, i, inInv){
  const R = CodisRoomIntros, own = R.owns(d.id), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver);
  const st = own ? '<span class="ri-st is-own">' + codisIcon('check') + '<span>' + (inInv ? 'يعمل تلقائياً عند دخول الغرفة' : 'تملكه · يعمل تلقائياً') + '</span></span>'
    : '<span class="ri-price' + (ok ? '' : ' is-short') + '">' + econSilver(d.silver) + '</span>';
  const pvLab = 'معاينة بداية ' + d.roomAr + ' «' + d.ar + '»' + (own ? ' — تملكها' : ' · ' + econFmt(d.silver) + ' فضة');
  return '<article class="ri-card' + (own ? ' is-own' : '') + (ok ? '' : ' is-short') + '" role="listitem" data-riid="' + d.id + '" data-ri-room="' + d.room + '" style="--i:' + (i || 0) + '">' +
    '<button type="button" class="ri-thumb" aria-haspopup="dialog" aria-label="' + escapeHtml(pvLab) + '" onclick="codisRiPreview(\'' + d.id + '\', this)">' + codisRiThumbHtml(d) +
      '<span class="ri-play" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M5 3.2v9.6L12.6 8Z" fill="currentColor"/></svg></span></button>' +
    '<div class="ri-body"><span class="ri-room">' + escapeHtml(d.roomAr) + '</span><h6 class="ri-name">' + escapeHtml(d.ar) + '</h6>' +
      '<p class="ri-short">' + escapeHtml(d.short) + '</p>' +
      '<div class="ri-foot">' + st + '<div class="ri-acts">' +
        '<button type="button" class="ri-b ri-b-pv" aria-haspopup="dialog" aria-label="' + escapeHtml(pvLab) + '" onclick="codisRiPreview(\'' + d.id + '\', this)">معاينة</button>' +
        (own ? '' : '<button type="button" class="ri-b ri-b-buy" aria-label="' + escapeHtml('شراء بداية ' + d.roomAr + ' «' + d.ar + '» · ' + econFmt(d.silver) + ' فضة') + '" onclick="econRoomIntroBuy(\'' + d.id + '\')">شراء</button>') +
      '</div></div></div></article>';
}
function econRoomIntrosShopHtml(){
  try{ if(CodisRoomIntros.heal()) saveData(); }catch(e){}
  return '<section class="st-part ri-sec" id="eco-room-intros" aria-labelledby="ri-h"><header class="st-part-head"><h4 class="hcd-title" id="ri-h">بدايات الغرف</h4></header>' +
    '<p class="ri-lead">مشهد ترحيبي قصير يُعرض كلما دخلت الغرفة. لكل غرفة بدايتها الخاصة وسعرها، وتعمل تلقائياً بعد الشراء — بلا تجهيز.</p>' +
    '<div class="ri-grid" role="list">' + CodisRoomIntros.defs().map((d, i)=>econRoomIntroCardHtml(d, i, false)).join('') + '</div></section>';
}
function econRoomIntrosInvHtml(){
  try{ if(CodisRoomIntros.heal()) saveData(); }catch(e){}
  const list = CodisRoomIntros.owned(); if(!list.length) return '';
  return '<section class="own-part" id="own-room-intros" aria-labelledby="own-ri-h"><div class="own-sub"><span id="own-ri-h" role="heading" aria-level="5">بدايات الغرف</span><span class="own-sub-n">' + econFmt(list.length) + '</span></div>' +
    '<div class="ri-grid is-own" role="list">' + list.map((d, i)=>econRoomIntroCardHtml(d, i, true)).join('') + '</div></section>';
}
async function econRoomIntroBuy(id){
  if(econStoreBusy) return; econStoreBusy = true; codisRiOvSync();
  try{
    const R = CodisRoomIntros, d = R.def(id);
    if(!d){ codisSfx('invalid', { ctx:'funds' }); showToast('البداية غير متاحة', 'var(--warning)'); return; }
    try{ if(R.heal()) saveData(); }catch(e){}
    if(R.owns(id)){ codisSfx('invalid', { ctx:'funds' }); showToast('تملك بداية ' + d.roomAr + ' من قبل — تعمل تلقائياً', 'var(--warning)'); return; }
    const sv = CodisWallet.silverBalance();
    if(!CodisLimits.afford(sv, d.silver)){ codisSfx('invalid', { ctx:'funds' }); showToast('ما عندك فضة كافية', 'var(--warning)'); return; }
    const ok = await codisConfirm({ title:'شراء بداية ' + d.roomAr + ' «' + d.ar + '»؟', message:'السعر ' + econFmt(d.silver) + ' فضة · رصيدك ' + econFmt(sv) + ' فضة · المتبقي بعد الشراء ' + econFmt(Math.max(0, sv - d.silver)) + ' فضة. رصيد الكوينز والجواهر ما يتأثر.',
      detail:'منتج مستقل لـ' + d.roomAr + ' فقط: يُعرض تلقائياً كلما دخلتها، بلا تجهيز، ولا يغيّر ثيماتك ولا مظاهر بطاقاتك.', icon:'gift', confirmText:'شراء', danger:false });
    if(!ok) return;
    const r = R.buy(id);
    if(r.ok){ codisSfx('store.buy', { ctx:'cosmetic' }); showToast('تم الشراء: بداية ' + d.roomAr + ' (−' + econFmt(r.price) + ' فضة) — تظهر كلما دخلتها', 'var(--success)', 'gift'); CodisEvents.emit('ECON_PURCHASE', { name:d.ar, price:0, silver:r.price }); }
    else { codisSfx('invalid', { ctx:'funds' }); showToast(r.reason === 'insufficient' ? 'ما عندك فضة كافية' : r.reason === 'owned' ? 'تملك هذه البداية من قبل' : r.reason === 'save' ? 'تعذّر الحفظ — لم يُخصم شيء' : 'تعذّر الشراء — لم يُخصم شيء', 'var(--warning)'); }
  } finally { econStoreBusy = false; econRenderAll(); codisRiOvSync(true); }
}

/* ---------- نافذة المعاينة (قشرة .pt-ov نفسها) ---------- */
let codisRiEl = null, codisRiFocus = null, codisRiId = '', codisRiActAt = 0, codisRiTimer = 0;
function codisRiOvDynHtml(d){
  const R = CodisRoomIntros, own = R.owns(d.id), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver), busy = econStoreBusy;
  if(own) return '<div class="pt-ov-state"><span class="pt-ov-st is-on">مملوك · يعمل تلقائياً</span></div><p class="pt-ov-note">' + escapeHtml('تُعرض كلما دخلت ' + d.roomAr + ' من غرفة أخرى. لا تحتاج تجهيزاً.') + '</p>';
  const note = ok ? 'رصيدك ' + econFmt(sv) + ' فضة · المتبقي بعد الشراء ' + econFmt(Math.max(0, sv - d.silver)) + ' فضة.' : 'رصيدك ' + econFmt(sv) + ' فضة.';
  return '<div class="pt-ov-state"><span class="pt-ov-st">غير مملوك</span><span class="pt-ov-price">' + econSilver(d.silver) + '<small>فضة</small></span></div><p class="pt-ov-note' + (ok ? '' : ' is-short') + '">' + escapeHtml(note) + '</p>' +
    '<button type="button" class="pt-ov-act" data-act="buy"' + (busy ? ' disabled aria-disabled="true"' : '') + ' aria-label="' + escapeHtml('شراء بداية ' + d.roomAr + ' · ' + econFmt(d.silver) + ' فضة') + '" onclick="codisRiAct(\'' + d.id + '\')">شراء بالفضة <span class="pt-ov-act-p">' + econFmt(d.silver) + '</span></button>';
}
function codisRiOvSync(refocus){
  const el = codisRiEl, d = el && CodisRoomIntros.def(codisRiId); if(!d) return;
  const box = el.querySelector('.pt-ov-dyn'); if(!box) return;
  const had = refocus && (el.contains(document.activeElement) || document.activeElement === document.body || !document.activeElement);
  box.innerHTML = codisRiOvDynHtml(d);
  if(had){ const b = box.querySelector('.pt-ov-act'); const t = (b && !b.disabled) ? b : el.querySelector('.pt-ov-x'); if(t){ try{ t.focus({ preventScroll:true }); }catch(e){} } }
}
function codisRiAct(id){
  const now = Date.now(); if(now - codisRiActAt < 500 || econStoreBusy) return; codisRiActAt = now;
  if(CodisRoomIntros.def(id) && !CodisRoomIntros.owns(id)) econRoomIntroBuy(id);
}
function codisRiReplay(){
  const el = codisRiEl; if(!el) return;
  const sc = el.querySelector('.ri-pv .ri-scene'); codisRiStart(sc);
  const b = el.querySelector('.ri-pv-re'); if(b){ b.classList.remove('is-done'); }
  clearTimeout(codisRiTimer); codisRiTimer = setTimeout(()=>{ const x = codisRiEl && codisRiEl.querySelector('.ri-pv-re'); if(x) x.classList.add('is-done'); }, codisRiCalm() ? CODIS_RI_CALM_MS : CODIS_RI_PLAY_MS);
}
function codisRiPreview(id, opener){
  const d = CodisRoomIntros.def(id); if(!d) return;
  codisRiClose(true);
  codisRiFocus = opener || document.activeElement; codisRiId = d.id;
  const ctx = (opener && opener.closest && opener.closest('#eco-own-sheet')) ? 'own' : 'store';
  const el = document.createElement('div');
  el.className = 'pt-ov ri-ov'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'ri-ov-ttl'); el.setAttribute('aria-describedby', 'ri-ov-desc'); el.setAttribute('data-ctx', ctx); el.setAttribute('data-ri', d.id);
  el.innerHTML = '<div class="pt-ov-bg" onclick="codisRiClose()"></div><div class="pt-ov-card">' +
    '<div class="pt-ov-head"><div class="pt-ov-chips"><span class="pt-rar">' + escapeHtml(d.rarityAr) + '</span><span class="pt-ov-room">' + escapeHtml(d.roomAr) + '</span></div><button type="button" class="pt-ov-x" aria-label="إغلاق المعاينة" onclick="codisRiClose()">' + codisIcon('close') + '</button></div>' +
    '<div class="pt-ov-name" id="ri-ov-ttl"><b>' + escapeHtml(d.ar) + '</b><span>بداية ' + escapeHtml(d.roomAr) + '</span></div>' +
    '<div class="ri-pv" role="img" aria-label="' + escapeHtml('معاينة متحركة لبداية ' + d.roomAr + ' — للعرض فقط، لا تنقلك للغرفة') + '">' + codisRiSceneHtml(d, 'pv') + '</div>' +
    '<div class="ri-pv-bar"><button type="button" class="ri-pv-re" onclick="codisRiReplay()"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5M3 2.6v2.6h2.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>إعادة التشغيل</button>' +
      '<ol class="ri-beats">' + d.beats.map(b=>'<li>' + escapeHtml(b) + '</li>').join('') + '</ol></div>' +
    '<dl class="pt-ov-meta"><div><dt>الغرفة</dt><dd>' + escapeHtml(d.roomAr) + '</dd></div><div><dt>الهوية</dt><dd>' + escapeHtml(d.tag) + '</dd></div><div><dt>الندرة</dt><dd>' + escapeHtml(d.rarityAr) + '</dd></div></dl>' +
    '<p class="pt-ov-desc" id="ri-ov-desc">' + escapeHtml(d.desc) + ' مدتها نحو ثانيتين، وتقدر تتخطاها بلمسة.</p><div class="pt-ov-dyn">' + codisRiOvDynHtml(d) + '</div></div>';
  el.addEventListener('keydown', ev=>{
    if(ev.key !== 'Tab' || !el.contains(document.activeElement)) return;
    const f = Array.prototype.filter.call(el.querySelectorAll('button:not([disabled]):not([tabindex="-1"])'), b=>b.offsetParent !== null); if(!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if(ev.shiftKey && document.activeElement === a){ ev.preventDefault(); z.focus(); } else if(!ev.shiftKey && document.activeElement === z){ ev.preventDefault(); a.focus(); }
  });
  document.body.appendChild(el); codisRiEl = el; codisSfx('open', { ctx:'store' });
  requestAnimationFrame(()=>{ if(codisRiEl !== el) return; el.classList.add('is-in'); codisRiReplay(); const x = el.querySelector('.pt-ov-x'); if(x){ try{ x.focus({ preventScroll:true }); }catch(e){} } });
}
function codisRiClose(silent){
  const el = codisRiEl; if(!el) return; codisRiEl = null; clearTimeout(codisRiTimer);
  if(!silent) codisSfx('close', { ctx:'store' });
  el.remove();
  let f = codisRiFocus; const id = codisRiId; codisRiFocus = null; codisRiId = '';
  if(!(f && f.isConnected) && id){ f = Array.prototype.find.call(document.querySelectorAll('.ri-card[data-riid="' + id + '"] .ri-b-pv'), b=>b.offsetParent !== null) || null; }
  if(f && f.isConnected){ try{ f.focus({ preventScroll:true }); }catch(e){} }
}
document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && codisRiEl && !(document.getElementById('codis-confirm-modal') && CodisMotion.isOpen(document.getElementById('codis-confirm-modal')))){ ev.stopPropagation(); codisRiClose(); } }, true);
