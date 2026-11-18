/* =====================================================================
   CODIS-V71 · الشخصية ثلاثية الأبعاد — الإنشاء والحفظ وصفحة «شخصيتي»
   • الأصول: Quaternius «Universal Base Characters [Standard]» (CC0 1.0) — جسمان كاملان بهيكل عظمي + 6 تسريحات/لحية،
     مدفونة نصاً خاملاً (#codis-char-body_male|body_female|hair) وتُفك عند فتح التجربة فقط. لا شبكة.
   • المحرك: CodisB3D.char داخل حزمة #codis-b3d-src نفسها (نسخة Three واحدة مع مشاهد الصناديق).
   • البيانات: data.profile.character = { v, body, face, hair, color, model, assets, createdAt, updatedAt } — معرّفات فقط.
     اختيار جنس الشخصية مستقل تماماً عن data.profile.gender. صورة الحساب (photo/photoMode) لا تُمس.
   • العرض: داخل تجربة الإنشاء وصفحة «شخصيتي» فقط. عارض واحد (سياق WebGL واحد) في أي لحظة.
   ===================================================================== */
const CODIS_CHAR_DEFS = {
  model:'ubc-std', assets:'v71-1',
  bodies:[ { id:'male', name:'ذكر' }, { id:'female', name:'أنثى' } ],
  faces:{
    male:[
      { id:'m1', name:'متوازن', p:{} },
      { id:'m2', name:'فكّ عريض', p:{ jaw:.26, chinW:.2, chinLen:.006, brow:.006, chinFwd:.004 } },
      { id:'m3', name:'نحيف حادّ', p:{ jaw:-.16, cheek:.011, full:-.008, chinLen:.016, chinW:-.2, faceLen:.09, noseZ:.004 } },
      { id:'m4', name:'دائري ناعم', p:{ jaw:.1, full:.012, chinLen:-.009, chinW:.22, faceLen:-.08, cheek:-.003, lips:.003 } },
    ],
    female:[
      { id:'f1', name:'بيضاوي', p:{} },
      { id:'f2', name:'قلبي', p:{ cheek:.011, chinW:-.28, jaw:-.2, chinLen:.009, full:-.005, faceLen:.03 } },
      { id:'f3', name:'دائري', p:{ full:.012, jaw:.11, chinLen:-.009, chinW:.2, faceLen:-.08, lips:.003 } },
      { id:'f4', name:'حادّ الملامح', p:{ jaw:.21, chinW:.12, brow:.005, cheek:.005, chinFwd:.005, noseZ:.003 } },
    ],
  },
  hairs:{
    male:[
      { id:'parted', name:'جانبية', mesh:'Hair_SimpleParted' },
      { id:'buzz', name:'قصيرة جداً', mesh:'Hair_Buzzed' },
      { id:'long', name:'طويلة', mesh:'Hair_Long', native:{ Hair_Long:'female' } },
      { id:'parted_beard', name:'جانبية ولحية', mesh:'Hair_SimpleParted', beard:true },
      { id:'buzz_beard', name:'قصيرة ولحية', mesh:'Hair_Buzzed', beard:true },
    ],
    female:[
      { id:'long', name:'طويلة منسدلة', mesh:'Hair_Long', native:{ Hair_Long:'female' } },
      { id:'buns', name:'كعكتان', mesh:'Hair_Buns', native:{ Hair_Buns:'female' } },
      { id:'short', name:'قصيرة', mesh:'Hair_BuzzedFemale', native:{ Hair_BuzzedFemale:'female' } },
      { id:'parted', name:'قصيرة جانبية', mesh:'Hair_SimpleParted', native:{ Hair_SimpleParted:'male' } },
    ],
  },
  colors:[
    { id:'black', name:'أسود', hex:'#1b1512' }, { id:'darkbrown', name:'بني داكن', hex:'#3a2418' }, { id:'brown', name:'بني', hex:'#5b3a24' },
    { id:'chestnut', name:'كستنائي', hex:'#7a4a2a' }, { id:'copper', name:'نحاسي', hex:'#8f3a1f' }, { id:'lightbrown', name:'بني فاتح', hex:'#b88a55' },
    { id:'blonde', name:'أشقر', hex:'#d7b878' }, { id:'gray', name:'رمادي', hex:'#8a8580' },
  ],
  defaults:{ male:{ face:'m1', hair:'parted', color:'darkbrown' }, female:{ face:'f1', hair:'long', color:'darkbrown' } },
};

const CodisChar = (function(){
  'use strict';
  const D = CODIS_CHAR_DEFS;
  let lib = null, bad = '', view = null;
  const find = (arr, id)=>(arr || []).find(x=>x.id === id) || null;
  function webglOK(){
    try{ const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if(!gl) return false; const x = gl.getExtension('WEBGL_lose_context'); if(x) x.loseContext(); return true; }catch(e){ return false; }
  }
  /* نفس حزمة مشاهد الصناديق: تُشغَّل مرة واحدة للجلسة ويستعملها الطرفان */
  function ensure(){
    if(lib) return lib; if(bad) return null;
    try{
      if(window.CODIS_CHAR_OFF) throw new Error('off');
      if(!webglOK()) throw new Error('nowebgl');
      if(!(window.CodisB3D && window.CodisB3D.char)){
        const el = document.getElementById('codis-b3d-src'); if(!el) throw new Error('nosrc');
        const s = document.createElement('script'); s.textContent = el.textContent; document.head.appendChild(s); s.remove();
      }
      lib = window.CodisB3D; if(!lib || !lib.char || typeof lib.char.create !== 'function') throw new Error('badlib');
    }catch(e){ bad = (e && e.message) || 'err'; lib = null; try{ console.warn('[CODIS char3d] unavailable', bad); }catch(x){} }
    return lib;
  }
  /* فك أصل مدفون (base64) عند الطلب فقط — لا يبقى نسخة مفكوكة بعد التحليل */
  function asset(name){
    return new Promise((ok, no)=>{
      setTimeout(()=>{
        try{
          const el = document.getElementById('codis-char-' + name); if(!el) throw new Error('noasset:' + name);
          const b = atob(el.textContent.replace(/\s+/g, '')), u = new Uint8Array(b.length);
          for(let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
          ok(u.buffer);
        }catch(e){ no(e); }
      }, 0);
    });
  }
  function reduced(){ try{ return !!window.CODIS_REDUCED_MOTION || matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
  function tier(){ const n = navigator; let h = {}; try{ h = JSON.parse(localStorage.getItem('codis_b3d_health') || '{}') || {}; }catch(e){} if(+h.lost > 0 && Date.now() - (+h.at || 0) < 14 * 864e5) return 'low'; return (n.deviceMemory && n.deviceMemory <= 3) ? 'low' : 'hi'; }
  /* اختيار كامل صالح دائماً (أي معرّف مجهول ⇒ الافتراضي لنوع الجسم؛ يحمي من الدمج حقلاً بحقل بين جهازين) */
  function fix(sel){
    sel = sel || {}; const body = sel.body === 'female' ? 'female' : 'male', d = D.defaults[body];
    return { body, face:find(D.faces[body], sel.face) ? sel.face : d.face, hair:find(D.hairs[body], sel.hair) ? sel.hair : d.hair, color:find(D.colors, sel.color) ? sel.color : d.color };
  }
  function cfgOf(sel){ const s = fix(sel); return { body:s.body, face:find(D.faces[s.body], s.face), hair:find(D.hairs[s.body], s.hair), color:find(D.colors, s.color).hex }; }
  function names(sel){ const s = fix(sel); return { body:find(D.bodies, s.body).name, face:find(D.faces[s.body], s.face).name, hair:find(D.hairs[s.body], s.hair).name, color:find(D.colors, s.color).name, hex:find(D.colors, s.color).hex }; }
  function mount(host, o){
    unmount(); if(!ensure()) return null; o = o || {};
    try{ view = lib.char.create(host, { asset, reduced:reduced(), quality:tier(), onState:o.onState, yaw:o.yaw, idle:o.idle, wheel:o.wheel }); }catch(e){ view = null; bad = 'create'; try{ console.warn('[CODIS char3d] create failed', e && e.message); }catch(x){} }
    return view;
  }
  function unmount(v){ if(view && (!v || v === view)){ try{ view.dispose(); }catch(e){} view = null; } }
  function get(){ try{ const c = data && data.profile && data.profile.character; return c && (c.body === 'male' || c.body === 'female') ? c : null; }catch(e){ return null; } }
  /* الحفظ: data.profile فقط (بقية الحقول كما هي)، ثم saveData الموجود ⇒ المرآة المحلية + المزامنة. لا نجاح إلا إن نجح الحفظ */
  function save(sel){
    const s = fix(sel), now = Date.now(), old = (data && data.profile) || {}, prev = old.character || null;
    const ch = Object.assign({}, prev || {}, { v:1, body:s.body, face:s.face, hair:s.hair, color:s.color, model:D.model, assets:D.assets, createdAt:(prev && prev.createdAt) || now, updatedAt:now });
    const before = data.profile;
    data.profile = Object.assign({}, old, { character:ch });
    let ok = false; try{ ok = saveData() !== false; }catch(e){ ok = false; }
    if(!ok){ data.profile = before; return false; }
    return true;
  }
  return { DEFS:D, fix, cfgOf, names, mount, unmount, get, save, has:()=>!!get(), available:()=>!!ensure(), why:()=>bad, current:()=>view };
})();
window.CodisChar = CodisChar;

/* ---------------- تجربة الإنشاء (مراحل) ---------------- */
const CODIS_CHAR_STEPS = [
  { key:'body', title:'اختر نوع الجسم', short:'الجسم' },
  { key:'face', title:'اختر شكل الوجه', short:'الوجه' },
  { key:'hair', title:'اختر قصة الشعر', short:'الشعر' },
  { key:'color', title:'اختر لون الشعر', short:'اللون' },
  { key:'review', title:'راجع شخصيتك', short:'التأكيد' },
];
let codisChx = null;   // { el, mode, step, sel, start, view, thumbs, busy, done }
const CODIS_CHX_ICON = {
  male:'<svg viewBox="0 0 60 120" aria-hidden="true"><circle cx="30" cy="13" r="10"/><path d="M15 30c0-4 3-6 7-6h16c4 0 7 2 7 6l4 38h-8l-3-28v80h-9V76h-4v44h-9V40l-3 28h-8z"/></svg>',
  female:'<svg viewBox="0 0 60 120" aria-hidden="true"><circle cx="30" cy="13" r="10"/><path d="M19 30c0-4 3-6 7-6h8c4 0 7 2 7 6l5 36h-7l-4-26 5 34H35v46h-8V74h-2v46h-8V74h-5l5-34-4 26h-7z"/></svg>',
};
function codisCharAfterProfile(existing){
  try{
    if(CodisChar.has() || codisChx) return;
    const p = data && data.profile; if(existing && p && p.charOfferedAt) return;   // المستخدم الحالي: مرة واحدة فقط
    codisCharOpen('onboard');
  }catch(e){ console.warn('[CODIS char3d]', e && e.message); }
}
function codisCharOpen(mode, opts){
  if(codisChx) return;
  mode = mode || 'create'; opts = opts || {};
  CodisChar.unmount();   /* عارض «شخصيتي» إن كان مفتوحاً — سياق WebGL واحد */
  const saved = CodisChar.get(), sel = CodisChar.fix(saved || { body:opts.body || 'male' });
  const el = document.createElement('div'); el.id = 'codis-char'; el.className = 'chx'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'chx-title');
  el.innerHTML =
    '<header class="chx-top">' +
      '<div class="chx-bar"><button type="button" class="chx-x" data-chx="close">' + (mode === 'onboard' ? 'لاحقاً' : 'إلغاء') + '</button>' +
      '<div class="chx-head"><div class="chx-eyebrow">' + (saved ? 'تعديل الشخصية' : 'إنشاء الشخصية') + '</div><h1 class="chx-title" id="chx-title"></h1></div><span class="chx-count" aria-hidden="true"></span></div>' +
      '<ol class="chx-steps" aria-label="مراحل الإنشاء">' + CODIS_CHAR_STEPS.map((s, i)=>'<li data-i="' + i + '"><button type="button" data-chx-go="' + i + '"><i aria-hidden="true"></i><span>' + s.short + '</span></button></li>').join('') + '</ol>' +
    '</header>' +
    '<div class="chx-stage"><div class="chx-view"></div>' +
      '<div class="chx-load" role="status" aria-live="polite"><span class="chx-spin" aria-hidden="true"></span><span class="chx-load-t">جارٍ تجهيز الشخصية…</span></div>' +
      '<div class="chx-fail" hidden><p></p><button type="button" class="btn btn-secondary" data-chx="retry">إعادة المحاولة</button></div>' +
      '<div class="chx-tools" role="group" aria-label="التحكم بالعرض"><button type="button" data-chx="zin" aria-label="تقريب"><b aria-hidden="true">+</b></button><button type="button" data-chx="zout" aria-label="إبعاد"><b aria-hidden="true">−</b></button><button type="button" data-chx="rot" aria-label="تدوير"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg></button></div>' +
      '<div class="chx-hint" aria-hidden="true">اسحب للتدوير · قرّب بإصبعين</div>' +
    '</div>' +
    '<section class="chx-panel"><div class="chx-sub"></div><div class="chx-opts"></div><p class="chx-msg" role="alert"></p>' +
      '<div class="chx-quit" hidden><span>تجاهل التعديلات والخروج؟</span><button type="button" class="btn btn-secondary" data-chx="stay">متابعة</button><button type="button" class="btn btn-primary" data-chx="quit">خروج</button></div>' +
      '<div class="chx-nav"><button type="button" class="btn btn-secondary chx-prev" data-chx="prev">السابق</button><button type="button" class="btn btn-primary chx-next" data-chx="next">التالي</button></div></section>';
  document.body.appendChild(el);
  const st = codisChx = { el, mode, step:0, sel, start:JSON.stringify(sel), view:null, thumbs:{}, tok:0, done:false, ready:false };
  document.documentElement.classList.add('chx-open');
  el.addEventListener('click', codisChxClick);
  el.querySelector('.chx-stage').addEventListener('pointerdown', ()=>el.classList.add('is-touched'), { passive:true, once:true });
  el.addEventListener('keydown', ev=>{
    if(ev.key === 'Escape'){ ev.preventDefault(); codisChxBack(); }
    const r = ev.target.closest && ev.target.closest('[role=radio]');
    if(r && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown')){ ev.preventDefault(); const all = [...el.querySelectorAll('.chx-opts [role=radio]')], i = all.indexOf(r), d = (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') ? 1 : -1, n = all[(i + d + all.length) % all.length]; if(n){ n.focus(); n.click(); } }
  });
  codisChxMountView();
  codisChxStep(0, true);
  requestAnimationFrame(()=>el.classList.add('is-in'));
  try{ CodisCrumb.mark('char:open', mode); }catch(e){}
}
function codisChxMountView(){
  const st = codisChx; if(!st) return;
  const host = st.el.querySelector('.chx-view'), load = st.el.querySelector('.chx-load'), fail = st.el.querySelector('.chx-fail');
  fail.hidden = true; load.hidden = false;
  st.view = CodisChar.mount(host, { yaw:-.3, onState:(s)=>{
    if(!codisChx || codisChx !== st) return;
    if(s === 'loading' && !st.ready){ load.hidden = false; }
    if(s === 'ready'){ st.ready = true; load.hidden = true; st.el.classList.add('is-ready'); codisChxThumbs(); }
    if(s === 'error'){ load.hidden = true; codisChxFail('تعذّر تجهيز الشخصية. تأكد من مساحة الذاكرة ثم أعد المحاولة.'); }
    if(s === 'lost'){ codisChxFail('توقّف العرض ثلاثي الأبعاد مؤقتاً (الجهاز استعاد ذاكرة الرسم). اختياراتك محفوظة.'); }
    if(s === 'restored'){ fail.hidden = true; }
  } });
  if(!st.view){
    load.hidden = true; st.el.classList.add('is-flat');
    codisChxFail(CodisChar.why() === 'nowebgl' ? 'جهازك أو متصفحك لا يدعم العرض ثلاثي الأبعاد (WebGL). يمكنك متابعة الاختيار وحفظ شخصيتك، وستظهر عند فتحها من جهاز يدعم العرض.' : 'تعذّر تشغيل العرض ثلاثي الأبعاد على هذا الجهاز. يمكنك متابعة الاختيار وحفظ شخصيتك.', true);
    return;
  }
  st.view.setConfig(CodisChar.cfgOf(st.sel)).catch(()=>{});
}
function codisChxFail(msg, permanent){
  const st = codisChx; if(!st) return; const f = st.el.querySelector('.chx-fail');
  f.querySelector('p').textContent = msg; f.hidden = false; f.querySelector('[data-chx="retry"]').hidden = !!permanent;
}
function codisChxApply(){
  const st = codisChx; if(!st) return;
  if(st.view){ st.view.setConfig(CodisChar.cfgOf(st.sel)).catch(()=>{}); }
  const n = CodisChar.names(st.sel), c = st.el.querySelector('.chx-count'); if(c) c.textContent = n.body;
}
function codisChxStep(i, first){
  const st = codisChx; if(!st) return;
  i = Math.max(0, Math.min(CODIS_CHAR_STEPS.length - 1, i)); const prev = st.step; st.step = i; const S = CODIS_CHAR_STEPS[i];
  st.el.dataset.step = S.key;
  st.el.querySelector('#chx-title').textContent = S.title;
  st.el.querySelectorAll('.chx-steps li').forEach((li, k)=>{ li.classList.toggle('is-now', k === i); li.classList.toggle('is-done', k < i); const b = li.querySelector('button'); b.setAttribute('aria-current', k === i ? 'step' : 'false'); b.setAttribute('aria-label', (k + 1) + ' من ' + CODIS_CHAR_STEPS.length + ': ' + CODIS_CHAR_STEPS[k].short); });
  const prevB = st.el.querySelector('.chx-prev'), next = st.el.querySelector('.chx-next');
  prevB.disabled = i === 0; prevB.style.visibility = i === 0 ? 'hidden' : '';
  next.textContent = S.key === 'review' ? 'تأكيد وحفظ الشخصية' : 'التالي'; next.classList.toggle('is-save', S.key === 'review');
  st.el.querySelector('.chx-msg').textContent = '';
  if(st.view){ st.view.setZoom(S.key === 'face' ? 1 : S.key === 'hair' || S.key === 'color' ? .9 : 0); }
  const opts = st.el.querySelector('.chx-opts');
  opts.classList.remove('is-swap'); void opts.offsetWidth; if(!first && !window.CODIS_REDUCED_MOTION) opts.classList.add('is-swap'); opts.dataset.dir = i >= prev ? 'f' : 'b';
  codisChxRender();
  if(!first){ try{ (opts.querySelector('[aria-checked="true"]') || next).focus({ preventScroll:true }); }catch(e){} }
  else setTimeout(()=>{ try{ (st.el.querySelector('.chx-opts [aria-checked="true"]') || next).focus({ preventScroll:true }); }catch(e){} }, 80);
  codisChxApply();
  st.thumbSig = ''; st.tok++; if(st.ready) setTimeout(codisChxThumbs, 60);
}
function codisChxCard(kind, id, name, on, inner, extra){
  return '<button type="button" role="radio" class="chx-opt is-' + kind + (on ? ' is-on' : '') + '" aria-checked="' + (on ? 'true' : 'false') + '" data-k="' + kind + '" data-v="' + id + '"' + (extra || '') + '>' +
    '<span class="chx-thumb">' + (inner || '') + '</span><span class="chx-name">' + escapeHtml(name) + '</span><span class="chx-tick" aria-hidden="true"></span></button>';
}
function codisChxRender(){
  const st = codisChx; if(!st) return; const D = CODIS_CHAR_DEFS, s = st.sel, S = CODIS_CHAR_STEPS[st.step], box = st.el.querySelector('.chx-opts'), sub = st.el.querySelector('.chx-sub');
  let h = '';
  if(S.key === 'body'){
    sub.textContent = 'اختيار خاص بالشخصية فقط، مستقل عن معلومات حسابك.';
    h = D.bodies.map(b=>codisChxCard('body', b.id, b.name, s.body === b.id, CODIS_CHX_ICON[b.id])).join('');
  } else if(S.key === 'face'){
    sub.textContent = 'كل وجه يغيّر ملامح المجسّم نفسه: الفك والخدّين والذقن.';
    h = D.faces[s.body].map(f=>codisChxCard('face', f.id, f.name, s.face === f.id, codisChxThumb('face', f.id))).join('');
  } else if(S.key === 'hair'){
    sub.textContent = 'قصّات شعر مجسّمة حقيقية تناسب كل الوجوه.';
    h = D.hairs[s.body].map(x=>codisChxCard('hair', x.id, x.name, s.hair === x.id, codisChxThumb('hair', x.id))).join('');
  } else if(S.key === 'color'){
    sub.textContent = 'يتغيّر لون الشعر والحاجبين واللحية فوراً.';
    h = D.colors.map(c=>codisChxCard('color', c.id, c.name, s.color === c.id, '<i class="chx-sw" style="--sw:' + c.hex + '"></i>')).join('');
  } else {
    const n = CodisChar.names(s);
    sub.textContent = 'تأكد من اختياراتك. يمكنك تعديلها لاحقاً من الإعدادات ← شخصيتي.';
    h = '<dl class="chx-sum">' + [['نوع الجسم', n.body, 0], ['الوجه', n.face, 1], ['قصة الشعر', n.hair, 2], ['لون الشعر', '<i class="chx-sw is-mini" style="--sw:' + n.hex + '"></i>' + escapeHtml(n.color), 3]].map(r=>
      '<div><dt>' + r[0] + '</dt><dd>' + (r[2] === 3 ? r[1] : escapeHtml(r[1])) + '</dd><button type="button" class="chx-edit" data-chx-go="' + r[2] + '" aria-label="تغيير ' + r[0] + '">تغيير</button></div>').join('') + '</dl>';
  }
  box.setAttribute('role', S.key === 'review' ? 'group' : 'radiogroup'); box.setAttribute('aria-label', S.title);
  box.className = 'chx-opts is-' + S.key + (box.classList.contains('is-swap') ? ' is-swap' : '');
  box.innerHTML = h;
}
function codisChxThumb(kind, id){
  const st = codisChx, k = codisChxThumbKey(kind, id), u = st && st.thumbs[k];
  return u ? '<img alt="" src="' + u + '" decoding="async">' : '<i class="chx-ph" aria-hidden="true"></i>';
}
function codisChxThumbKey(kind, id){ const s = codisChx.sel; return kind === 'face' ? 'f|' + s.body + '|' + id + '|' + s.hair + '|' + s.color : 'h|' + s.body + '|' + id + '|' + s.face + '|' + s.color; }
/* لقطات بطاقات الوجه/الشعر من المجسّم الحقيقي (بالخمول، واحدة واحدة، تُلغى عند تغيّر المرحلة) */
async function codisChxThumbs(){
  const st = codisChx; if(!st || !st.view || !st.ready) return;
  const S = CODIS_CHAR_STEPS[st.step]; if(S.key !== 'face' && S.key !== 'hair') return;
  const sig = S.key + '|' + JSON.stringify(st.sel); if(st.thumbSig === sig) return; st.thumbSig = sig;   /* لقطة تُطلق «ready» — لا تعيد التشغيل */
  const my = ++st.tok, D = CODIS_CHAR_DEFS, list = S.key === 'face' ? D.faces[st.sel.body] : D.hairs[st.sel.body];
  for(const it of list){
    if(!codisChx || codisChx !== st || st.tok !== my){ if(st.thumbSig === sig) st.thumbSig = ''; return; }
    const kind = S.key, k = codisChxThumbKey(kind, it.id); if(st.thumbs[k]) continue;
    await new Promise(r=>(window.requestIdleCallback || setTimeout)(r, { timeout:120 }));
    if(!codisChx || st.tok !== my || !st.view) return;
    const sel = Object.assign({}, st.sel, kind === 'face' ? { face:it.id } : { hair:it.id });
    let u = ''; try{ u = await st.view.snapshot(CodisChar.cfgOf(sel), { z:1, size:150, yaw:kind === 'hair' ? -.62 : -.22 }); }catch(e){}
    if(!codisChx || st.tok !== my) return;
    if(u){ st.thumbs[k] = u; const b = st.el.querySelector('.chx-opt[data-k="' + kind + '"][data-v="' + it.id + '"] .chx-thumb'); if(b) b.innerHTML = '<img alt="" src="' + u + '" decoding="async">'; }
  }
  if(st.view) st.view.setConfig(CodisChar.cfgOf(st.sel)).catch(()=>{});
}
function codisChxPick(kind, v){
  const st = codisChx; if(!st) return; const s = st.sel;
  if(kind === 'body'){ if(s.body === v) return; st.memo = st.memo || {}; st.memo[s.body] = { face:s.face, hair:s.hair }; const m = st.memo[v] || CODIS_CHAR_DEFS.defaults[v]; st.sel = CodisChar.fix({ body:v, face:m.face, hair:m.hair, color:s.color }); }
  else st.sel = CodisChar.fix(Object.assign({}, s, { [kind]:v }));
  st.el.querySelectorAll('.chx-opt[data-k="' + kind + '"]').forEach(b=>{ const on = b.dataset.v === v; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  codisChxApply();
}
async function codisChxSave(){
  const st = codisChx; if(!st || st.busy) return;
  const btn = st.el.querySelector('.chx-next'), msg = st.el.querySelector('.chx-msg');
  st.busy = true; btn.disabled = true; btn.textContent = 'جارٍ الحفظ…'; msg.textContent = '';
  await new Promise(r=>setTimeout(r, 30));
  const ok = CodisChar.save(st.sel);
  st.busy = false;
  if(!ok){ btn.disabled = false; btn.textContent = 'تأكيد وحفظ الشخصية'; msg.textContent = 'تعذّر حفظ الشخصية على هذا الجهاز — اختياراتك ما زالت هنا، حاول مجدداً.'; return; }
  st.done = true;
  codisChxClose(true);
  showToast(st.mode === 'edit' ? 'تم حفظ تعديلات شخصيتك' : 'تم حفظ شخصيتك', 'var(--success)', 'check');
}
function codisChxBack(){
  const st = codisChx; if(!st) return;
  const q = st.el.querySelector('.chx-quit'); if(!q.hidden){ q.hidden = true; return; }
  if(st.step > 0){ codisChxStep(st.step - 1); return; }
  codisChxTryClose();
}
function codisChxTryClose(){
  const st = codisChx; if(!st) return;
  if(st.mode === 'onboard'){ codisChxLater(); return; }
  if(JSON.stringify(st.sel) !== st.start){ const q = st.el.querySelector('.chx-quit'); q.hidden = false; try{ q.querySelector('[data-chx="stay"]').focus(); }catch(e){} return; }
  codisChxClose(false);
}
/* «لاحقاً» بالدخول: تُسجَّل مرة واحدة (تُزامَن) فلا تتكرر الشاشة؛ الإنشاء متاح دائماً من الإعدادات ← شخصيتي */
function codisChxLater(){
  try{ data.profile = Object.assign({}, data.profile || {}, { charOfferedAt:Date.now() }); saveData(); }catch(e){}
  codisChxClose(false);
  showToast('يمكنك إنشاء شخصيتك لاحقاً من الإعدادات ← شخصيتي', 'var(--aqua)', 'info');
}
function codisChxClose(saved){
  const st = codisChx; if(!st) return; codisChx = null; st.tok++;
  CodisChar.unmount(st.view); st.view = null; st.thumbs = {};
  document.documentElement.classList.remove('chx-open');
  const el = st.el; el.classList.remove('is-in'); el.classList.add('is-out');
  setTimeout(()=>{ try{ el.remove(); }catch(e){} }, window.CODIS_REDUCED_MOTION ? 0 : 260);
  try{ CodisCrumb.mark('char:close', saved ? 'saved' : 'cancel'); CodisCrumb.settle(1500); }catch(e){}
  try{ codisCharHomeBadge(); }catch(e){}
  try{ if(codisCharPageShown()) codisCharRenderPage(); }catch(e){}
}
function codisChxClick(ev){
  const st = codisChx; if(!st) return;
  const go = ev.target.closest('[data-chx-go]'); if(go){ codisChxStep(+go.getAttribute('data-chx-go')); return; }
  const o = ev.target.closest('.chx-opt'); if(o){ codisChxPick(o.dataset.k, o.dataset.v); return; }
  const b = ev.target.closest('[data-chx]'); if(!b) return; const a = b.getAttribute('data-chx'), v = st.view;
  if(a === 'next'){ if(st.step === CODIS_CHAR_STEPS.length - 1) codisChxSave(); else codisChxStep(st.step + 1); }
  else if(a === 'prev') codisChxStep(st.step - 1);
  else if(a === 'close') codisChxTryClose();
  else if(a === 'quit') codisChxClose(false);
  else if(a === 'stay') st.el.querySelector('.chx-quit').hidden = true;
  else if(a === 'retry'){ CodisChar.unmount(st.view); st.view = null; st.ready = false; codisChxMountView(); }
  else if(a === 'zin' && v) v.setZoom(v.zoomT + .34);
  else if(a === 'zout' && v) v.setZoom(v.zoomT - .34);
  else if(a === 'rot' && v) v.rotateBy(Math.PI / 4);
}
window.codisCharBack = function(){ return codisChx ? { act:codisChxBack, el:codisChx.el } : null; };

/* ---------------- صفحة «شخصيتي» بالإعدادات ---------------- */
function codisCharPageShown(){
  const sec = document.getElementById('settings-page-character'), pg = document.getElementById('page-settings');
  return !!(sec && pg && sec.style.display !== 'none' && pg.style.display !== 'none');
}
function codisCharHomeBadge(){
  const b = document.getElementById('home-char-state'); if(!b) return;
  const c = CodisChar.get(); b.textContent = c ? CodisChar.names(c).body : 'غير منشأة';
}
function codisCharRenderPage(){
  const root = document.getElementById('char-root'); if(!root) return;
  CodisChar.unmount();
  const c = CodisChar.get();
  codisCharHomeBadge();
  if(!c){
    root.innerHTML = '<div class="settings-card chp-empty"><div class="chp-empty-art" aria-hidden="true">' + CODIS_CHX_ICON.male + CODIS_CHX_ICON.female + '</div>' +
      '<h2 class="chp-empty-t">لم تُنشئ شخصيتك بعد</h2><p class="chp-empty-s">صمّم شخصية ثلاثية الأبعاد: نوع الجسم والوجه وقصة الشعر ولونه.</p>' +
      '<button type="button" class="btn btn-primary" onclick="codisCharOpen(\'create\')">إنشاء شخصيتي</button></div>';
    return;
  }
  const n = CodisChar.names(c);
  root.innerHTML = '<div class="settings-card chp-card"><div class="chp-stage"><div class="chp-view"></div><div class="chp-load" role="status"><span class="chx-spin" aria-hidden="true"></span><span>جارٍ تجهيز شخصيتك…</span></div><p class="chp-fail" hidden></p>' +
    '<div class="chx-tools" role="group" aria-label="التحكم بالعرض"><button type="button" data-chp="zin" aria-label="تقريب"><b aria-hidden="true">+</b></button><button type="button" data-chp="zout" aria-label="إبعاد"><b aria-hidden="true">−</b></button><button type="button" data-chp="rot" aria-label="تدوير"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg></button></div></div>' +
    '<dl class="chp-info">' + [['نوع الجسم', escapeHtml(n.body)], ['الوجه', escapeHtml(n.face)], ['قصة الشعر', escapeHtml(n.hair)], ['لون الشعر', '<i class="chx-sw is-mini" style="--sw:' + n.hex + '"></i>' + escapeHtml(n.color)]].map(r=>'<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') + '</dl>' +
    '<div class="chp-btns"><button type="button" class="btn btn-primary" onclick="codisCharOpen(\'edit\')">تعديل الشخصية</button><button type="button" class="btn btn-secondary" onclick="codisCharReset()">إعادة الاختيارات الافتراضية</button></div></div>';
  const host = root.querySelector('.chp-view'), load = root.querySelector('.chp-load'), fail = root.querySelector('.chp-fail');
  const v = CodisChar.mount(host, { yaw:-.3, wheel:false, onState:s=>{
    if(s === 'ready') load.hidden = true;
    if(s === 'error' || s === 'lost'){ load.hidden = true; fail.hidden = false; fail.textContent = s === 'lost' ? 'توقّف العرض مؤقتاً — سيعود تلقائياً.' : 'تعذّر عرض الشخصية الآن. بياناتك محفوظة.'; }
    if(s === 'restored') fail.hidden = true;
  } });
  if(!v){ load.hidden = true; fail.hidden = false; fail.textContent = CodisChar.why() === 'nowebgl' ? 'جهازك لا يدعم العرض ثلاثي الأبعاد (WebGL). اختياراتك محفوظة ويمكنك تعديلها.' : 'تعذّر تشغيل العرض ثلاثي الأبعاد. اختياراتك محفوظة ويمكنك تعديلها.'; root.querySelector('.chp-stage').classList.add('is-flat'); return; }
  root.querySelector('.chp-stage').addEventListener('click', ev=>{ const b = ev.target.closest('[data-chp]'); if(!b) return; const a = b.getAttribute('data-chp'); if(a === 'zin') v.setZoom(v.zoomT + .34); else if(a === 'zout') v.setZoom(v.zoomT - .34); else v.rotateBy(Math.PI / 4); });
  v.setConfig(CodisChar.cfgOf(c)).catch(()=>{});
}
async function codisCharReset(){
  const c = CodisChar.get(); if(!c) return;
  const ok = await codisConfirm({ title:'إعادة الاختيارات الافتراضية؟', message:'يرجع الوجه وقصة الشعر ولونه إلى الافتراضي لنوع الجسم الحالي (' + CodisChar.names(c).body + '). بقية بيانات حسابك لا تتغيّر.', icon:'info', danger:false, confirmText:'إعادة الافتراضي' });
  if(!ok) return;
  const d = CODIS_CHAR_DEFS.defaults[c.body];
  if(!CodisChar.save({ body:c.body, face:d.face, hair:d.hair, color:d.color })){ showToast('تعذّر الحفظ — حاول مجدداً.', 'var(--danger)'); return; }
  showToast('أُعيدت الاختيارات الافتراضية', 'var(--success)', 'check');
  codisCharRenderPage();
}
/* إغلاق العارض عند مغادرة الصفحة (رجوع/تنقّل لغرفة أخرى) — لا سياق WebGL ولا حلقة بالخلفية */
(function(){
  try{
    const watch = ()=>{ if(!codisChx && !codisCharPageShown()){ const v = CodisChar.current(); if(v){ CodisChar.unmount(); const r = document.getElementById('char-root'); if(r) r.innerHTML = ''; } } };
    const mo = new MutationObserver(watch);
    const hook = ()=>{ const a = document.getElementById('settings-page-character'), b = document.getElementById('page-settings'); if(a) mo.observe(a, { attributes:true, attributeFilter:['style', 'class'] }); if(b) mo.observe(b, { attributes:true, attributeFilter:['style', 'class'] }); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
    window.addEventListener('pagehide', ()=>{ if(!codisChx) CodisChar.unmount(); });
  }catch(e){}
})();
window.codisCharOpen = codisCharOpen;
window.codisCharRenderPage = codisCharRenderPage;
window.codisCharReset = codisCharReset;
