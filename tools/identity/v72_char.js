/* =====================================================================
   CODIS-V72 · منظومة الشخصية الواقعية — الإنشاء والتخصيص والحفظ وصفحة «شخصيتي» (تحل محل V71)
   • الأصول: MakeHuman (CC0 1.0) ← tools/char3d/mh_build.py ← assets/char/codis_char_v72.bin (ملف واحد مستقل، يُحمَّل عند فتح الشخصية فقط
     ويُخزَّن تلقائياً بالـService Worker «الكاش أولاً» ⇒ يعمل بلا اتصال بعد أول فتح). لا CDN ولا روابط خارجية.
   • المحرك: CodisB3D.char داخل حزمة #codis-b3d-src نفسها (Three واحدة مع مشاهد الصناديق).
   • البيانات: data.profile.character = { v:2, body, build, height, face, eyeShape, eyes, brows, skin, hair, hairColor, beard, beardColor,
     adv, sym, model, assets, createdAt, updatedAt } — معرّفات وأرقام فقط (لا مجسّمات/صور). ترحيل V71 (v:1) بجدول صريح.
   • مستقل تماماً عن data.profile.gender؛ صورة الحساب (photo/photoMode) لا تُمس. عارض واحد/سياق WebGL واحد في أي لحظة.
   ===================================================================== */
const CODIS_CHAR_FACES = __CODIS_CHAR_FACES__;
const CODIS_CHAR_DEFS = {
  model:'mh-cc0', assets:'v72-1', ver:2, file:'codis_char_v72.bin',
  bodies:[ { id:'male', name:'ذكر' }, { id:'female', name:'أنثى' } ],
  builds:[ { id:'slim', name:'نحيف' }, { id:'avg', name:'متوازن' }, { id:'athl', name:'رياضي' }, { id:'broad', name:'عريض' } ],
  faces:CODIS_CHAR_FACES,
  /* أشكال العين: أهداف الجفن/الزوايا/الفتحة الأصلية (تُطبَّق على الجانبين) */
  eyeShapes:[
    { id:'almond', name:'لوزية', t:{} },
    { id:'round', name:'مستديرة', t:{ 'eye-height2-incr':.7, 'eye-height1-incr':.25 } },
    { id:'narrow', name:'ضيقة', t:{ 'eye-height2-decr':.6, 'eye-height1-decr':.3 } },
    { id:'up', name:'مائلة للأعلى', t:{ 'eye-corner1-up':.75, 'eye-eyefold-angle-up':.35 } },
    { id:'down', name:'مائلة للأسفل', t:{ 'eye-corner1-down':.7 } },
    { id:'hooded', name:'جفن ثقيل', t:{ 'eye-eyefold-down':.85, 'eye-height2-decr':.15 } },
    { id:'epi', name:'جفن مستتر', t:{ 'eye-epicanthus-in':.8, 'eye-eyefold-down':.35, 'eye-height2-decr':.2 } },
    { id:'big', name:'واسعة', t:{ 'eye-scale-incr':.55, 'eye-height2-incr':.25 } },
    { id:'deep', name:'غائرة', t:{ 'eye-push1-in':.7, 'eye-bag-decr':.2 } },
  ],
  /* درجات البشرة: مزج خامتين أصليتين (التفاصيل من الصورة نفسها) + لمسة لون خفيفة */
  skins:[
    { id:'s1', name:'فاتح جداً', a:'light', b:'light', mix:0, tint:'#fff3ee', sw:'#f2d6c7' },
    { id:'s2', name:'فاتح', a:'light', b:'mid', mix:.25, tint:'#ffffff', sw:'#e8c3a8' },
    { id:'s3', name:'فاتح دافئ', a:'light', b:'mid', mix:.6, tint:'#fff4e6', sw:'#dcb38f' },
    { id:'s4', name:'حنطي', a:'mid', b:'dark', mix:.12, tint:'#f8e6cf', sw:'#c99a72' },
    { id:'s5', name:'حنطي داكن', a:'mid', b:'dark', mix:.3, tint:'#f2dcc4', sw:'#b4835c' },
    { id:'s6', name:'أسمر فاتح', a:'mid', b:'dark', mix:.5, tint:'#f3dccb', sw:'#9c6b48' },
    { id:'s7', name:'أسمر', a:'mid', b:'dark', mix:.72, tint:'#f4e2d6', sw:'#7d5236' },
    { id:'s8', name:'داكن', a:'dark', b:'dark', mix:0, tint:'#ffffff', sw:'#5c3a25' },
    { id:'s9', name:'داكن جداً', a:'dark', b:'dark', mix:0, tint:'#d8c4b6', sw:'#432a1c' },
  ],
  eyes:[
    { id:'darkbrown', name:'بني داكن', tex:'brown', tint:'#a8968c', sw:'#3b2416' }, { id:'brown', name:'بني', tex:'brown', sw:'#5d3518' },
    { id:'hazel', name:'عسلي', tex:'brownlight', sw:'#8a6a2c' }, { id:'green', name:'أخضر', tex:'green', sw:'#5e7a3c' },
    { id:'bluegreen', name:'أزرق مخضر', tex:'bluegreen', sw:'#4f7f7c' }, { id:'blue', name:'أزرق', tex:'blue', sw:'#3f6aa0' },
    { id:'lightblue', name:'أزرق فاتح', tex:'lightblue', sw:'#7fa4c8' }, { id:'grey', name:'رمادي', tex:'grey', sw:'#8a9298' },
  ],
  brows:[
    { id:'eyebrow001', name:'متوسط مستقيم' }, { id:'eyebrow002', name:'مقوّس كثيف' }, { id:'eyebrow003', name:'مقوّس' }, { id:'eyebrow004', name:'مستقيم كثيف' },
    { id:'eyebrow005', name:'رفيع طويل' }, { id:'eyebrow006', name:'رفيع عالٍ' }, { id:'eyebrow007', name:'رفيع ناعم' }, { id:'eyebrow008', name:'عريض داكن' },
    { id:'eyebrow009', name:'كثيف جداً' }, { id:'eyebrow010', name:'قوس رفيع' }, { id:'eyebrow011', name:'حادّ الزاوية' }, { id:'eyebrow012', name:'كثيف مستقيم' },
  ],
  /* تسريحات: مجسّمات MakeHuman الأصلية (mesh) + حلاقة قصيرة مولّدة من سطح الرأس نفسه (shell) */
  hairs:{
    male:[
      { id:'buzz', name:'حلاقة قصيرة جداً', shell:{ region:'scalp', style:'buzz', layers:1, len:.0006, rep:90, sparse:.18 }, scalp:.75 },
      { id:'crew', name:'قصيرة كثيفة', shell:{ region:'scalp', style:'crew', layers:3, len:.0032, rep:90, sparse:.06 }, scalp:.8 },
      { id:'fade', name:'تدريج جانبي', shell:{ region:'scalp', style:'fade', layers:3, len:.003, rep:90, sparse:.08 }, scalp:.6 },
      { id:'short04', name:'للخلف', mesh:'short04', scalp:.8 },
      { id:'short02', name:'كثيفة مموجة', mesh:'short02', scalp:.85 },
      { id:'short03', name:'تسريحة جانبية', mesh:'short03', scalp:.85 },
      { id:'short01', name:'كلاسيكية', mesh:'short01', scalp:.85 },
      { id:'afro01', name:'مجعّدة كثيفة', mesh:'afro01', scalp:.9 },
      { id:'ponytail01', name:'طويلة مربوطة', mesh:'ponytail01', scalp:.85 },
      { id:'long01', name:'طويلة منسدلة', mesh:'long01', scalp:.85 },
    ],
    female:[
      { id:'long01', name:'طويلة منسدلة', mesh:'long01', scalp:.85 },
      { id:'ponytail01', name:'ذيل حصان', mesh:'ponytail01', scalp:.85 },
      { id:'braid01', name:'ضفيرة', mesh:'braid01', scalp:.85 },
      { id:'bob01', name:'متوسطة بطبقات', mesh:'bob01', scalp:.85 },
      { id:'bob02', name:'بوب قصير', mesh:'bob02', scalp:.85 },
      { id:'afro01', name:'مجعّدة كثيفة', mesh:'afro01', scalp:.9 },
      { id:'short01', name:'قصيرة', mesh:'short01', scalp:.85 },
      { id:'short03', name:'قصيرة جانبية', mesh:'short03', scalp:.85 },
      { id:'buzz', name:'قصيرة جداً', shell:{ region:'scalp', style:'buzz', layers:1, len:.0006, rep:90, sparse:.18 }, scalp:.75 },
    ],
  },
  /* اللحية مستقلة عن الشعر (قشور من سطح الوجه نفسه) */
  beards:[
    { id:'none', name:'بدون' },
    { id:'stubble', name:'لحية خفيفة', shell:{ region:'beard', style:'stubble', layers:1, len:.0005, rep:85, sparse:.52 }, tint:.5 },
    { id:'short', name:'لحية قصيرة', shell:{ region:'beard', style:'short', layers:4, len:.0038, rep:70, sparse:.14 }, tint:.45 },
    { id:'full', name:'لحية كثيفة', shell:{ region:'beard', style:'full', layers:7, len:.0085, rep:64, sparse:.08 }, tint:.5 },
    { id:'goatee', name:'سكسوكة', shell:{ region:'beard', style:'goatee', layers:5, len:.0058, rep:66, sparse:.1 }, tint:.4 },
    { id:'chin', name:'ذقن فقط', shell:{ region:'beard', style:'chin', layers:5, len:.0058, rep:66, sparse:.1 }, tint:.4 },
    { id:'mustache', name:'شارب', shell:{ region:'beard', style:'mustache', layers:5, len:.0048, rep:66, sparse:.08 }, tint:.35 },
  ],
  colors:[
    { id:'black', name:'أسود', hex:'#141011' }, { id:'darkbrown', name:'بني داكن', hex:'#2e1d14' }, { id:'brown', name:'بني', hex:'#4e3020' },
    { id:'chestnut', name:'كستنائي', hex:'#6a3a22' }, { id:'lightbrown', name:'بني فاتح', hex:'#8a6240' }, { id:'blonde', name:'أشقر', hex:'#b99059' },
    { id:'lightblonde', name:'أشقر فاتح', hex:'#d6bb86' }, { id:'red', name:'أحمر طبيعي', hex:'#8a3a1e' }, { id:'copper', name:'نحاسي', hex:'#a2542a' },
    { id:'gray', name:'رمادي', hex:'#8c8784' }, { id:'white', name:'أبيض', hex:'#d9d6d2' },
  ],
  outfit:{ male:'male_casualsuit06', female:'female_casualsuit01' }, shoes:{ male:'shoes06', female:'shoes02' },
  lashes:{ male:'eyelashes01', female:'eyelashes02' },
  /* التخصيص الدقيق: كل منزلق = هدفان أصليان (−/+) — له أثر حقيقي متحقق منه بالاختبار. side:true ⇒ هدف لكل جانب (l-/r-) والتناظر قابل للتعطيل */
  adv:[
    { g:'face', name:'شكل الرأس والوجه', items:[
      { k:'fw', name:'عرض الوجه', m:'head-scale-horiz-decr', p:'head-scale-horiz-incr' },
      { k:'fl', name:'طول الوجه', m:'head-scale-vert-decr', p:'head-scale-vert-incr' },
      { k:'fh', name:'ارتفاع الجبهة', m:'forehead-scale-vert-decr', p:'forehead-scale-vert-incr' },
      { k:'fp', name:'بروز الجبهة', m:'forehead-trans-backward', p:'forehead-trans-forward' },
      { k:'jw', name:'عرض الفك', m:'chin-bones-decr', p:'chin-bones-incr' },
      { k:'jp', name:'بروز الفك', m:'chin-prognathism-decr', p:'chin-prognathism-incr' },
      { k:'cs', name:'بروز الذقن', m:'chin-prominent-decr', p:'chin-prominent-incr' },
      { k:'cl', name:'طول الذقن', m:'chin-height-decr', p:'chin-height-incr' },
      { k:'cw', name:'عرض الذقن', m:'chin-width-decr', p:'chin-width-incr' },
      { k:'cb', name:'عظام الخد', m:'cheek-bones-decr', p:'cheek-bones-incr', side:true },
      { k:'cv', name:'امتلاء الخدين', m:'cheek-volume-decr', p:'cheek-volume-incr', side:true },
    ] },
    { g:'eyes', name:'العينان', items:[
      { k:'es', name:'حجم العين', m:'eye-scale-decr', p:'eye-scale-incr', side:true },
      { k:'eh', name:'فتحة العين', m:'eye-height2-decr', p:'eye-height2-incr', side:true },
      { k:'ed', name:'المسافة بين العينين', m:'eye-trans-in', p:'eye-trans-out', side:true },
      { k:'ev', name:'ارتفاع العين', m:'eye-trans-down', p:'eye-trans-up', side:true },
      { k:'ez', name:'عمق العين', m:'eye-push1-in', p:'eye-push1-out', side:true },
      { k:'et', name:'ميل العين', m:'eye-corner1-down', p:'eye-corner1-up', side:true },
      { k:'el', name:'الجفن', m:'eye-eyefold-up', p:'eye-eyefold-down', side:true },
    ] },
    { g:'nose', name:'الأنف', items:[
      { k:'nw', name:'عرض الأنف', m:'nose-scale-horiz-decr', p:'nose-scale-horiz-incr' },
      { k:'nl', name:'طول الأنف', m:'nose-scale-vert-decr', p:'nose-scale-vert-incr' },
      { k:'nb', name:'جسر الأنف', m:'nose-hump-decr', p:'nose-hump-incr' },
      { k:'nz', name:'بروز الأنف', m:'nose-scale-depth-decr', p:'nose-scale-depth-incr' },
      { k:'nt', name:'طرف الأنف', m:'nose-point-down', p:'nose-point-up' },
      { k:'nn', name:'عرض فتحتي الأنف', m:'nose-nostrils-width-decr', p:'nose-nostrils-width-incr' },
    ] },
    { g:'mouth', name:'الفم', items:[
      { k:'mw', name:'عرض الفم', m:'mouth-scale-horiz-decr', p:'mouth-scale-horiz-incr' },
      { k:'mu', name:'الشفة العليا', m:'mouth-upperlip-volume-decr', p:'mouth-upperlip-volume-incr' },
      { k:'ml', name:'الشفة السفلى', m:'mouth-lowerlip-volume-decr', p:'mouth-lowerlip-volume-incr' },
      { k:'mc', name:'قوس الشفة', m:'mouth-cupidsbow-decr', p:'mouth-cupidsbow-incr' },
      { k:'ma', name:'زاويتا الفم', m:'mouth-angles-down', p:'mouth-angles-up' },
    ] },
    { g:'detail', name:'الحاجبان والأذنان', items:[
      { k:'bh', name:'ارتفاع الحاجبين', m:'eyebrows-trans-down', p:'eyebrows-trans-up' },
      { k:'ba', name:'ميل الحاجبين', m:'eyebrows-angle-down', p:'eyebrows-angle-up' },
      { k:'as', name:'حجم الأذن', m:'ear-scale-decr', p:'ear-scale-incr', side:true },
      { k:'aw', name:'بروز الأذن', m:'ear-wing-decr', p:'ear-wing-incr', side:true },
      { k:'ap', name:'شكل الأذن (مستدير ⇠ مدبّب)', m:'ear-shape-round', p:'ear-shape-pointed', side:true },
      { k:'al', name:'شحمة الأذن', m:'ear-lobe-decr', p:'ear-lobe-incr', side:true },
    ] },
    { g:'body', name:'نسب الجسم', items:[
      { k:'sh', name:'عرض الكتفين', m:'torso-vshape-decr', p:'torso-vshape-incr' },
      { k:'wa', name:'الخصر', m:'hip-waist-down', p:'hip-waist-up' },
      { k:'hp', name:'عرض الحوض', m:'hip-scale-horiz-decr', p:'hip-scale-horiz-incr' },
      { k:'be', name:'البطن', m:'stomach-pregnant-decr', p:'stomach-pregnant-incr' },
      { k:'bu', name:'الأرداف', m:'buttocks-volume-decr', p:'buttocks-volume-incr' },
      { k:'lg', name:'طول الساقين', m:'upperlegs-height-decr', p:'upperlegs-height-incr' },
    ] },
  ],
  defaults:{
    male:{ build:'avg', height:50, face:'m1', eyeShape:'almond', eyes:'brown', brows:'eyebrow001', skin:'s4', hair:'short04', hairColor:'darkbrown', beard:'none', beardColor:'' },
    female:{ build:'avg', height:50, face:'f1', eyeShape:'almond', eyes:'brown', brows:'eyebrow006', skin:'s3', hair:'long01', hairColor:'darkbrown', beard:'none', beardColor:'' },
  },
  /* ترحيل V71 (v:1، Quaternius) ⇒ أقرب اختيار مكافئ — المعرّفات القديمة m3/m4/f4 كانت تعني أشكالاً أخرى */
  migrate1:{
    face:{ male:{ m1:'m1', m2:'m2', m3:'m8', m4:'m3' }, female:{ f1:'f1', f2:'f2', f3:'f3', f4:'f8' } },
    hair:{ male:{ parted:['short03', 'none'], buzz:['buzz', 'none'], long:['long01', 'none'], parted_beard:['short03', 'full'], buzz_beard:['buzz', 'short'] },
           female:{ long:['long01'], buns:['ponytail01'], short:['short01'], parted:['bob02'] } },
  },
};

const CodisChar = (function(){
  'use strict';
  const D = CODIS_CHAR_DEFS;
  let lib = null, perm = '', lastErr = '', view = null, assetP = null;
  const find = (arr, id)=>(arr || []).find(x=>x.id === id) || null;
  const clampI = (v, a, b, d)=>{ v = Math.round(Number(v)); return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  function webglOK(){
    try{ const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if(!gl) return false; const x = gl.getExtension('WEBGL_lose_context'); if(x) x.loseContext(); return true; }catch(e){ return false; }
  }
  /* نفس حزمة مشاهد الصناديق. الفشل الدائم فقط: WebGL غير مدعوم/معطّل عمداً — غيره يُعاد تجربته (لا حالة فشل عالقة) */
  function ensure(){
    if(lib) return lib; if(perm) return null;
    try{
      if(window.CODIS_CHAR_OFF){ perm = 'off'; throw new Error('off'); }
      if(!webglOK()){ perm = 'nowebgl'; throw new Error('nowebgl'); }
      if(!(window.CodisB3D && window.CodisB3D.char)){
        const el = document.getElementById('codis-b3d-src'); if(!el) throw new Error('nosrc');
        const s = document.createElement('script'); s.textContent = el.textContent; document.head.appendChild(s); s.remove();
      }
      lib = window.CodisB3D; if(!lib || !lib.char || typeof lib.char.create !== 'function' || lib.char.version !== '2'){ lib = null; throw new Error('badlib'); }
      lastErr = '';
    }catch(e){ lastErr = perm || (e && e.message) || 'err'; lib = null; try{ console.warn('[CODIS char3d] unavailable', lastErr); }catch(x){} }
    return lib;
  }
  /* الأصل: ملف مستقل بجانب الصفحة (assets/char/…) — وعد واحد مشترك، يُصفَّر عند الفشل فتنجح إعادة المحاولة */
  function assetURL(){ const inApp = /\/app\//.test(location.pathname); return (window.CODIS_CHAR_BASE || (inApp ? '../assets/char/' : 'assets/char/')) + D.file; }
  function asset(){
    if(!assetP){
      assetP = fetch(assetURL(), { credentials:'same-origin' }).then(r=>{
        if(!r.ok){ const e = new Error('char asset http ' + r.status); e.code = r.status === 404 ? 'missing' : 'network'; throw e; }
        return r.arrayBuffer();
      }, e=>{ const x = new Error('char asset network'); x.code = 'network'; throw x; });
      assetP.catch(()=>{ assetP = null; });
    }
    return assetP;
  }
  function reduced(){ try{ return !!window.CODIS_REDUCED_MOTION || matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
  function tier(){ const n = navigator; let h = {}; try{ h = JSON.parse(localStorage.getItem('codis_b3d_health') || '{}') || {}; }catch(e){} if(+h.lost > 0 && Date.now() - (+h.at || 0) < 14 * 864e5) return 'low'; return (n.deviceMemory && n.deviceMemory <= 3) ? 'low' : 'hi'; }
  /* --- التخصيص الدقيق: نص مضغوط «k:v,k:v» (v −100..100)؛ للجانبين: k = متناظر، kL/kR عند تعطيل التناظر --- */
  const ADV = {}; D.adv.forEach(g=>g.items.forEach(it=>{ ADV[it.k] = it; }));
  function advParse(s){
    const o = {}; if(typeof s !== 'string') return o;
    s.split(',').forEach(p=>{ const m = /^([a-z]{2})([LR]?):(-?\d{1,3})$/.exec(p.trim()); if(m && ADV[m[1]]){ const v = clampI(m[3], -100, 100, 0); if(v) o[m[1] + m[2]] = v; } });
    return o;
  }
  function advStr(o){ return Object.keys(o || {}).filter(k=>o[k]).sort().map(k=>k + ':' + clampI(o[k], -100, 100, 0)).join(','); }
  /* --- الترحيل + التصحيح: اختيار كامل صالح دائماً (المجهول ⇒ الافتراضي؛ يحمي من الدمج حقلاً بحقل بين جهازين) --- */
  function fix(sel){
    sel = sel || {}; const body = sel.body === 'female' ? 'female' : 'male', d = D.defaults[body], s = Object.assign({}, sel);
    if(Number(s.v) === 1){   /* V71 ⇒ V72 — فقط لما حفظه V71 صراحةً (v:1)؛ الاختيار الجديد بلا v لا يُرحَّل أبداً */
      const fm = D.migrate1.face[body] || {}, hm = (D.migrate1.hair[body] || {})[s.hair];
      if(fm[s.face]) s.face = fm[s.face];
      if(hm){ s.hair = hm[0]; if(hm[1] && s.beard == null) s.beard = hm[1]; }
    }
    const hairs = D.hairs[body];
    return {
      v:2, body,
      build:find(D.builds, s.build) ? s.build : d.build,
      height:clampI(s.height, 0, 100, d.height),
      face:find(D.faces[body], s.face) ? s.face : d.face,
      eyeShape:find(D.eyeShapes, s.eyeShape) ? s.eyeShape : d.eyeShape,
      eyes:find(D.eyes, s.eyes) ? s.eyes : d.eyes,
      brows:find(D.brows, s.brows) ? s.brows : d.brows,
      skin:find(D.skins, s.skin) ? s.skin : d.skin,
      hair:find(hairs, s.hair) ? s.hair : d.hair,
      hairColor:find(D.colors, s.hairColor || s.color) ? (s.hairColor || s.color) : d.hairColor,
      beard:body === 'male' && find(D.beards, s.beard) ? s.beard : 'none',
      beardColor:find(D.colors, s.beardColor) ? s.beardColor : '',
      adv:advStr(advParse(s.adv)), sym:s.sym === false ? false : true,
    };
  }
  /* --- الاختيار ⇒ مواصفة المحرك (أهداف وأوزان فقط) --- */
  function spec(sel){
    const s = fix(sel), b = s.body, face = find(D.faces[b], s.face), t = {};
    const put = (k, w)=>{ if(!w) return; t[k] = (t[k] || 0) + w; };
    const both = (k, w)=>{ put('l-' + k, w); put('r-' + k, w); };
    ['caucasian', 'african', 'asian'].forEach((e, i)=>put('face-' + e + '-' + b, face.e[i] - 1 / 3));
    Object.keys(face.t).forEach(k=>{ if(k[0] === '*') both(k.slice(1), face.t[k]); else put(k, face.t[k]); });
    const es = find(D.eyeShapes, s.eyeShape); Object.keys(es.t).forEach(k=>both(k, es.t[k]));
    const A = advParse(s.adv);
    Object.keys(A).forEach(key=>{
      const it = ADV[key.slice(0, 2)], side = key[2], v = A[key] / 100, tg = v < 0 ? it.m : it.p, w = Math.abs(v);
      if(!it.side) put(tg, w); else if(!side) both(tg, w); else put((side === 'L' ? 'l-' : 'r-') + tg, w);
    });
    const sk = find(D.skins, s.skin), ey = find(D.eyes, s.eyes), hr = find(D.hairs[b], s.hair), bd = find(D.beards, s.beard), hc = find(D.colors, s.hairColor).hex;
    const bc = s.beardColor ? find(D.colors, s.beardColor).hex : hc;
    return {
      sex:b, build:s.build, height:.5 + (s.height / 100 - .5) * .22, targets:t,   /* نطاق بشري طبيعي (≈ ±14سم؛ أقصى هدف MakeHuman ≈ +65سم) */
      skin:{ a:sk.a, b:sk.b, mix:sk.mix, tint:sk.tint }, eye:{ tex:ey.tex, tint:ey.tint || '' },
      brows:s.brows, lashes:D.lashes[b], hair:hr.mesh || null, scalpShell:hr.shell || null, scalpTint:hr.scalp || 0,
      beard:null, beardShell:bd && bd.shell || null, beardTint:bd && bd.tint || 0,
      outfit:D.outfit[b], shoes:D.shoes[b], hairColor:hc, browColor:hc, beardColor:bc,
    };
  }
  function names(sel){
    const s = fix(sel), b = s.body, hc = find(D.colors, s.hairColor);
    return { body:find(D.bodies, b).name, build:find(D.builds, s.build).name, height:s.height, face:find(D.faces[b], s.face).name, eyeShape:find(D.eyeShapes, s.eyeShape).name,
      eyes:find(D.eyes, s.eyes).name, eyesHex:find(D.eyes, s.eyes).sw, brows:find(D.brows, s.brows).name, skin:find(D.skins, s.skin).name, skinHex:find(D.skins, s.skin).sw,
      hair:find(D.hairs[b], s.hair).name, color:hc.name, hex:hc.hex, beard:b === 'male' ? find(D.beards, s.beard).name : '', beardColor:s.beardColor ? find(D.colors, s.beardColor).name : 'مثل الشعر',
      adv:Object.keys(advParse(s.adv)).length };
  }
  function heightLabel(h){ return h <= 20 ? 'قصير' : h <= 40 ? 'أقصر من المتوسط' : h < 60 ? 'متوسط' : h < 80 ? 'أطول من المتوسط' : 'طويل'; }
  function mount(host, o){
    unmount(); if(!ensure()) return null; o = o || {};
    try{ view = lib.char.create(host, { asset, reduced:reduced(), quality:tier(), onState:o.onState, yaw:o.yaw, idle:o.idle, wheel:o.wheel }); lastErr = ''; }
    catch(e){ view = null; lastErr = (e && e.code) || 'create'; try{ console.warn('[CODIS char3d] create failed', e && e.message); }catch(x){} }
    return view;
  }
  function unmount(v){ if(view && (!v || v === view)){ try{ view.dispose(); }catch(e){} view = null; } }
  function get(){ try{ const c = data && data.profile && data.profile.character; return c && (c.body === 'male' || c.body === 'female') ? c : null; }catch(e){ return null; } }
  /* الحفظ: data.profile فقط (بقية الحقول كما هي) ⇒ saveData (المرآة المحلية + جدولة المزامنة). لا نجاح إلا إن نجح الحفظ المحلي */
  function save(sel){
    const s = fix(sel), now = Date.now(), old = (data && data.profile) || {}, prev = old.character || null;
    const ch = Object.assign({}, prev || {}, s, { v:2, color:s.hairColor, model:D.model, assets:D.assets, createdAt:(prev && prev.createdAt) || now, updatedAt:now });
    const before = data.profile;
    data.profile = Object.assign({}, old, { character:ch });
    let ok = false; try{ ok = saveData() !== false; }catch(e){ ok = false; }
    if(!ok){ data.profile = before; return false; }
    return true;
  }
  /* حالة المزامنة الفعلية (للعرض فقط): local | pending | synced | offline | guest */
  function syncState(){
    try{ const S = CodisAccount && CodisAccount.state; if(!S || !S.user) return 'guest'; if(navigator.onLine === false) return 'offline'; return S.status === 'synced' ? 'synced' : 'pending'; }catch(e){ return 'guest'; }
  }
  function why(){ return perm || lastErr; }
  return { DEFS:D, fix, spec, names, heightLabel, advParse, advStr, mount, unmount, get, save, syncState, has:()=>!!get(), available:()=>!!ensure(), why, permanent:()=>!!perm, current:()=>view, assetURL };
})();
window.CodisChar = CodisChar;

/* ---------------- تجربة الإنشاء (مراحل) ---------------- */
const CODIS_CHAR_STEPS = [
  { key:'body', title:'الجسم', sub:'نوع الجسم وبنيته وطوله', focus:'body', z:0 },
  { key:'skin', title:'البشرة', sub:'درجة لون البشرة', focus:'face', z:.55 },
  { key:'face', title:'الوجه', sub:'اختر وجهاً ثم عدّل تفاصيله إن أردت', focus:'face', z:1 },
  { key:'eyes', title:'العينان والحاجبان', sub:'شكل العين ولونها وشكل الحاجب', focus:'face', z:1 },
  { key:'hair', title:'الشعر', sub:'قصة الشعر ولونه', focus:'hair', z:1 },
  { key:'beard', title:'اللحية', sub:'شعر الوجه مستقل عن قصة الشعر', focus:'face', z:1, male:true },
  { key:'review', title:'المراجعة', sub:'تأكد من اختياراتك ثم احفظ', focus:'body', z:0 },
];
let codisChx = null;
const CODIS_CHX_ICON = {
  male:'<svg viewBox="0 0 60 120" aria-hidden="true"><circle cx="30" cy="13" r="10"/><path d="M15 30c0-4 3-6 7-6h16c4 0 7 2 7 6l4 38h-8l-3-28v80h-9V76h-4v44h-9V40l-3 28h-8z"/></svg>',
  female:'<svg viewBox="0 0 60 120" aria-hidden="true"><circle cx="30" cy="13" r="10"/><path d="M19 30c0-4 3-6 7-6h8c4 0 7 2 7 6l5 36h-7l-4-26 5 34H35v46h-8V74h-2v46h-8V74h-5l5-34-4 26h-7z"/></svg>',
};
/* جدولة لقطات بالخمول — بديل صحيح حين لا توجد requestIdleCallback (Safari/iOS): لا يُمرَّر كائن الخيارات إلى setTimeout */
const codisChxIdle = cb=>{ if(typeof window.requestIdleCallback === 'function') return window.requestIdleCallback(()=>cb(), { timeout:150 }); return setTimeout(cb, 24); };
function codisChxSteps(st){ return CODIS_CHAR_STEPS.filter(s=>!s.male || st.sel.body === 'male'); }
function codisCharAfterProfile(existing){
  try{
    if(CodisChar.has() || codisChx) return;
    const p = data && data.profile; if(existing && p && p.charOfferedAt) return;
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
      '<ol class="chx-steps" aria-label="مراحل الإنشاء"></ol>' +
    '</header>' +
    '<div class="chx-stage"><div class="chx-view"></div>' +
      '<div class="chx-load" role="status" aria-live="polite"><span class="chx-spin" aria-hidden="true"></span><span class="chx-load-t">جارٍ تجهيز الشخصية…</span></div>' +
      '<div class="chx-fail" hidden><p></p><button type="button" class="btn btn-secondary" data-chx="retry">إعادة المحاولة</button></div>' +
      '<div class="chx-tools" role="group" aria-label="التحكم بالعرض"><button type="button" data-chx="zin" aria-label="تقريب"><b aria-hidden="true">+</b></button><button type="button" data-chx="zout" aria-label="إبعاد"><b aria-hidden="true">−</b></button><button type="button" data-chx="rot" aria-label="تدوير"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg></button></div>' +
      '<div class="chx-hint" aria-hidden="true">اسحب للتدوير · قرّب بإصبعين</div>' +
    '</div>' +
    '<section class="chx-panel"><div class="chx-sub"></div><div class="chx-body"></div><p class="chx-msg" role="alert"></p>' +
      '<div class="chx-quit" hidden><span>تجاهل التعديلات والخروج؟</span><button type="button" class="btn btn-secondary" data-chx="stay">متابعة</button><button type="button" class="btn btn-primary" data-chx="quit">خروج</button></div>' +
      '<div class="chx-nav"><button type="button" class="btn btn-secondary chx-prev" data-chx="prev">السابق</button><button type="button" class="btn btn-primary chx-next" data-chx="next">التالي</button></div></section>';
  document.body.appendChild(el);
  const st = codisChx = { el, mode, step:0, sel, start:JSON.stringify(sel), view:null, thumbs:{}, tok:0, done:false, ready:false, open:{}, applyT:0 };
  document.documentElement.classList.add('chx-open');
  el.addEventListener('click', codisChxClick);
  el.addEventListener('input', codisChxInput);
  el.addEventListener('change', codisChxInput);
  el.querySelector('.chx-stage').addEventListener('pointerdown', ()=>el.classList.add('is-touched'), { passive:true, once:true });
  el.addEventListener('keydown', ev=>{
    if(ev.key === 'Escape'){ ev.preventDefault(); codisChxBack(); return; }
    const r = ev.target.closest && ev.target.closest('[role=radio]');
    if(r && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown')){ ev.preventDefault(); const all = [...r.closest('[role=radiogroup]').querySelectorAll('[role=radio]')], i = all.indexOf(r), d = (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') ? 1 : -1, n = all[(i + d + all.length) % all.length]; if(n){ n.focus(); n.click(); } }
  });
  codisChxMountView();
  codisChxStep(0, true);
  requestAnimationFrame(()=>el.classList.add('is-in'));
  try{ CodisCrumb.mark('char:open', mode); }catch(e){}
}
const CODIS_CHX_ERR = {
  nowebgl:'جهازك أو متصفحك لا يدعم العرض ثلاثي الأبعاد (WebGL). يمكنك متابعة الاختيار وحفظ شخصيتك، وستظهر عند فتحها من جهاز يدعم العرض.',
  off:'العرض ثلاثي الأبعاد متوقف على هذا الجهاز. يمكنك متابعة الاختيار وحفظ شخصيتك.',
  context:'تعذّر تشغيل العرض ثلاثي الأبعاد الآن (المتصفح رفض إنشاء سياق الرسم). أغلق التطبيقات الثقيلة ثم أعد المحاولة. اختياراتك محفوظة.',
  network:'تعذّر تنزيل ملف الشخصية — تحقّق من الاتصال ثم أعد المحاولة. بعد أول تنزيل تعمل بلا اتصال. اختياراتك محفوظة.',
  missing:'ملف الشخصية غير موجود على الخادم (assets/char). اختياراتك محفوظة ويمكنك الحفظ.',
  parse:'ملف الشخصية تالف أو غير مكتمل — أعد المحاولة. اختياراتك محفوظة.',
  decode:'تعذّر فك إحدى خامات الشخصية — قد تكون الذاكرة ممتلئة. أعد المحاولة. اختياراتك محفوظة.',
  lost:'توقّف العرض ثلاثي الأبعاد مؤقتاً (الجهاز استعاد ذاكرة الرسم). سيعود تلقائياً، أو أعد المحاولة. اختياراتك محفوظة.',
  asset:'تعذّر تجهيز الشخصية. أعد المحاولة. اختياراتك محفوظة.',
};
function codisChxMountView(){
  const st = codisChx; if(!st) return;
  const host = st.el.querySelector('.chx-view'), load = st.el.querySelector('.chx-load'), fail = st.el.querySelector('.chx-fail');
  fail.hidden = true; load.hidden = false; st.el.classList.remove('is-flat');
  st.view = CodisChar.mount(host, { yaw:-.3, onState:(s, x)=>{
    if(!codisChx || codisChx !== st) return;
    if(s === 'loading' && !st.ready){ load.hidden = false; }
    if(s === 'ready'){ st.ready = true; load.hidden = true; fail.hidden = true; st.el.classList.add('is-ready'); codisChxThumbs(); }
    if(s === 'error'){ load.hidden = true; codisChxFail(CODIS_CHX_ERR[x && x.code] || CODIS_CHX_ERR.asset, false); }
    if(s === 'lost'){ codisChxFail(CODIS_CHX_ERR.lost, false); }
    if(s === 'restored'){ fail.hidden = true; }
  } });
  if(!st.view){
    load.hidden = true; st.el.classList.add('is-flat');
    const w = CodisChar.why(); codisChxFail(CODIS_CHX_ERR[w] || CODIS_CHX_ERR.context, CodisChar.permanent());
    return;
  }
  codisChxStage(true);
  st.view.setConfig(CodisChar.spec(st.sel)).catch(()=>{});
}
function codisChxFail(msg, permanent){
  const st = codisChx; if(!st) return; const f = st.el.querySelector('.chx-fail');
  f.querySelector('p').textContent = msg; f.hidden = false; f.querySelector('[data-chx="retry"]').hidden = !!permanent;
}
/* تطبيق الاختيار على المجسّم: منزلقات متتالية ⇒ تطبيق واحد لكل إطار (آخر قيمة تفوز) */
function codisChxApply(){
  const st = codisChx; if(!st) return;
  const c = st.el.querySelector('.chx-count'); if(c) c.textContent = CodisChar.names(st.sel).body;
  if(!st.view || st.applyT) return;
  st.applyT = requestAnimationFrame(()=>{ st.applyT = 0; if(codisChx === st && st.view) st.view.setConfig(CodisChar.spec(st.sel)).catch(()=>{}); });
}
function codisChxStage(first){
  const st = codisChx; if(!st || !st.view) return; const S = codisChxSteps(st)[st.step];
  if(st.view.setFocus) st.view.setFocus(S.focus, S.z); else st.view.setZoom(S.z);
}
function codisChxStep(i, first){
  const st = codisChx; if(!st) return; const steps = codisChxSteps(st);
  i = Math.max(0, Math.min(steps.length - 1, i)); const prev = st.step; st.step = i; const S = steps[i];
  st.el.dataset.step = S.key;
  st.el.querySelector('#chx-title').textContent = S.title;
  const ol = st.el.querySelector('.chx-steps'); ol.style.setProperty('--n', steps.length);
  ol.innerHTML = steps.map((s, k)=>'<li class="' + (k === i ? 'is-now' : k < i ? 'is-done' : '') + '"><button type="button" data-chx-go="' + k + '" aria-current="' + (k === i ? 'step' : 'false') + '" aria-label="' + (k + 1) + ' من ' + steps.length + ': ' + s.title + '"><i aria-hidden="true"></i><span>' + s.title.split(' ')[0] + '</span></button></li>').join('');
  const prevB = st.el.querySelector('.chx-prev'), next = st.el.querySelector('.chx-next');
  prevB.disabled = i === 0; prevB.style.visibility = i === 0 ? 'hidden' : '';
  next.textContent = S.key === 'review' ? 'تأكيد وحفظ الشخصية' : 'التالي'; next.classList.toggle('is-save', S.key === 'review');
  st.el.querySelector('.chx-msg').textContent = '';
  codisChxStage(first);
  const body = st.el.querySelector('.chx-body');
  body.classList.remove('is-swap'); void body.offsetWidth; if(!first && !window.CODIS_REDUCED_MOTION) body.classList.add('is-swap'); body.dataset.dir = i >= prev ? 'f' : 'b';
  codisChxRender();
  st.el.querySelector('.chx-panel').scrollTop = 0;
  const foc = ()=>{ try{ (body.querySelector('[aria-checked="true"]') || next).focus({ preventScroll:true }); }catch(e){} };
  if(!first) foc(); else setTimeout(foc, 80);
  codisChxApply();
  st.tok++; if(st.ready) codisChxIdle(codisChxThumbs);
}
function codisChxCard(kind, id, name, on, inner, extra){
  return '<button type="button" role="radio" class="chx-opt is-' + kind + (on ? ' is-on' : '') + '" aria-checked="' + (on ? 'true' : 'false') + '" data-k="' + kind + '" data-v="' + id + '"' + (extra || '') + '>' +
    '<span class="chx-thumb">' + (inner || '') + '</span><span class="chx-name">' + escapeHtml(name) + '</span><span class="chx-tick" aria-hidden="true"></span></button>';
}
function codisChxGroup(kind, label, cls, cards){ return '<div class="chx-grp"><h2 class="chx-gt">' + label + '</h2><div class="chx-opts ' + cls + '" role="radiogroup" aria-label="' + label + '">' + cards + '</div></div>'; }
function codisChxSw(hex, cls){ return '<i class="chx-sw' + (cls ? ' ' + cls : '') + '" style="--sw:' + hex + '"></i>'; }
function codisChxRender(){
  const st = codisChx; if(!st) return; const D = CODIS_CHAR_DEFS, s = st.sel, S = codisChxSteps(st)[st.step], box = st.el.querySelector('.chx-body'), sub = st.el.querySelector('.chx-sub');
  sub.textContent = S.sub; let h = '';
  const th = (kind, id)=>codisChxThumb(kind, id);
  if(S.key === 'body'){
    h = codisChxGroup('body', 'نوع الجسم', 'is-body', D.bodies.map(b=>codisChxCard('body', b.id, b.name, s.body === b.id, th('body', b.id) || CODIS_CHX_ICON[b.id])).join('')) +
      codisChxGroup('build', 'البنية', 'is-build', D.builds.map(b=>codisChxCard('build', b.id, b.name, s.build === b.id, th('build', b.id))).join('')) +
      '<div class="chx-grp"><h2 class="chx-gt">الطول</h2>' + codisChxSlider('height', 'الطول', s.height, 0, 100, CodisChar.heightLabel(s.height)) + '</div>' +
      codisChxAdvHtml(['body']);
  } else if(S.key === 'skin'){
    h = codisChxGroup('skin', 'درجة البشرة', 'is-skin', D.skins.map(x=>codisChxCard('skin', x.id, x.name, s.skin === x.id, codisChxSw(x.sw, 'is-skin'))).join(''));
  } else if(S.key === 'face'){
    h = codisChxGroup('face', 'الوجه', 'is-face', D.faces[s.body].map(f=>codisChxCard('face', f.id, f.name, s.face === f.id, th('face', f.id))).join('')) +
      codisChxAdvHtml(['face', 'nose', 'mouth', 'detail']);
  } else if(S.key === 'eyes'){
    h = codisChxGroup('eyeShape', 'شكل العين', 'is-eyeShape', D.eyeShapes.map(x=>codisChxCard('eyeShape', x.id, x.name, s.eyeShape === x.id, th('eyeShape', x.id))).join('')) +
      codisChxGroup('eyes', 'لون العينين', 'is-swatch', D.eyes.map(x=>codisChxCard('eyes', x.id, x.name, s.eyes === x.id, codisChxIris(x))).join('')) +
      codisChxGroup('brows', 'الحاجبان', 'is-brows', D.brows.map(x=>codisChxCard('brows', x.id, x.name, s.brows === x.id, th('brows', x.id))).join('')) +
      codisChxAdvHtml(['eyes']);
  } else if(S.key === 'hair'){
    h = codisChxGroup('hair', 'قصة الشعر', 'is-hair', D.hairs[s.body].map(x=>codisChxCard('hair', x.id, x.name, s.hair === x.id, th('hair', x.id))).join('')) +
      codisChxGroup('hairColor', 'لون الشعر', 'is-swatch', D.colors.map(c=>codisChxCard('hairColor', c.id, c.name, s.hairColor === c.id, codisChxSw(c.hex))).join(''));
  } else if(S.key === 'beard'){
    h = codisChxGroup('beard', 'شعر الوجه', 'is-beard', D.beards.map(x=>codisChxCard('beard', x.id, x.name, s.beard === x.id, th('beard', x.id))).join('')) +
      (s.beard !== 'none' ? codisChxGroup('beardColor', 'لون اللحية', 'is-swatch', [codisChxCard('beardColor', '', 'مثل الشعر', !s.beardColor, codisChxSw(CodisChar.names(s).hex, 'is-link'))].concat(D.colors.map(c=>codisChxCard('beardColor', c.id, c.name, s.beardColor === c.id, codisChxSw(c.hex)))).join('')) : '');
  } else {
    const n = CodisChar.names(s), steps = codisChxSteps(st), go = k=>steps.findIndex(x=>x.key === k);
    const rows = [['نوع الجسم', n.body, 'body'], ['البنية', n.build, 'body'], ['الطول', CodisChar.heightLabel(n.height), 'body'], ['البشرة', codisChxSw(n.skinHex, 'is-mini') + escapeHtml(n.skin), 'skin', 1], ['الوجه', n.face, 'face'],
      ['العينان', codisChxSw(n.eyesHex, 'is-mini') + escapeHtml(n.eyeShape + ' · ' + n.eyes), 'eyes', 1], ['الحاجبان', n.brows, 'eyes'], ['قصة الشعر', n.hair, 'hair'], ['لون الشعر', codisChxSw(n.hex, 'is-mini') + escapeHtml(n.color), 'hair', 1]];
    if(s.body === 'male') rows.push(['اللحية', n.beard + (s.beard !== 'none' ? ' · ' + n.beardColor : ''), 'beard']);
    if(n.adv) rows.push(['تخصيص دقيق', n.adv + ' تعديلات', 'face']);
    h = '<dl class="chx-sum">' + rows.map(r=>'<div><dt>' + r[0] + '</dt><dd>' + (r[3] ? r[1] : escapeHtml(r[1])) + '</dd><button type="button" class="chx-edit" data-chx-go="' + go(r[2]) + '" aria-label="تغيير ' + r[0] + '">تغيير</button></div>').join('') + '</dl>';
  }
  box.className = 'chx-body is-' + S.key + (box.classList.contains('is-swap') ? ' is-swap' : '');
  box.innerHTML = h;
}
/* قزحية حقيقية: دائرة ملوّنة بدرجة العين (الخامة نفسها لا تُفك هنا — اللون من القائمة) */
function codisChxIris(x){ return '<i class="chx-iris" style="--sw:' + x.sw + '"></i>'; }
function codisChxSlider(key, name, val, min, max, label, extra){
  return '<label class="chx-sl"><span class="chx-sl-n">' + escapeHtml(name) + '</span><output>' + escapeHtml(label != null ? String(label) : String(val)) + '</output>' +
    '<input type="range" min="' + min + '" max="' + max + '" step="1" value="' + val + '" data-sl="' + key + '"' + (extra || '') + ' aria-label="' + escapeHtml(name) + '"></label>';
}
/* أقسام التخصيص الدقيق (قابلة للفتح/الإغلاق، إعادة ضبط لكل قسم، تناظر قابل للتعطيل) */
function codisChxAdvHtml(groups){
  const st = codisChx, D = CODIS_CHAR_DEFS, A = CodisChar.advParse(st.sel.adv);
  return '<div class="chx-adv">' + D.adv.filter(g=>groups.indexOf(g.g) >= 0).map(g=>{
    const n = g.items.filter(it=>A[it.k] || A[it.k + 'L'] || A[it.k + 'R']).length, open = !!st.open[g.g], hasSide = g.items.some(it=>it.side);
    return '<details class="chx-acc" data-g="' + g.g + '"' + (open ? ' open' : '') + '><summary><span>' + escapeHtml(g.name) + '</span>' + (n ? '<b class="chx-acc-n">' + n + '</b>' : '') + '</summary><div class="chx-acc-b">' +
      (hasSide ? '<label class="chx-sym"><input type="checkbox" data-sym="1"' + (st.sel.sym !== false ? ' checked' : '') + '> تناظر الجانبين</label>' : '') +
      g.items.map(it=>{
        if(it.side && st.sel.sym === false) return ['L', 'R'].map(sd=>{ const v = A[it.k + sd] != null ? A[it.k + sd] : (A[it.k] || 0); return codisChxSlider('adv:' + it.k + sd, it.name + (sd === 'L' ? ' (يسار)' : ' (يمين)'), v, -100, 100, v > 0 ? '+' + v : v); }).join('');
        const v = A[it.k] || 0; return codisChxSlider('adv:' + it.k, it.name, v, -100, 100, v > 0 ? '+' + v : v);
      }).join('') +
      '<button type="button" class="chx-reset" data-reset="' + g.g + '"' + (n ? '' : ' disabled') + '>إعادة ضبط «' + escapeHtml(g.name) + '»</button></div></details>';
  }).join('') + '</div>';
}
function codisChxInput(ev){
  const st = codisChx; if(!st) return; const t = ev.target;
  if(t.matches && t.matches('[data-sym]') && ev.type === 'change'){
    const A = CodisChar.advParse(st.sel.adv);
    if(!t.checked){ Object.keys(A).forEach(k=>{ if(k.length === 2 && CodisChar.DEFS.adv.some(g=>g.items.some(it=>it.k === k && it.side))){ A[k + 'L'] = A[k]; A[k + 'R'] = A[k]; delete A[k]; } }); }
    else { Object.keys(A).forEach(k=>{ if(k.length === 3){ const b = k.slice(0, 2); A[b] = Math.round(((A[b + 'L'] || 0) + (A[b + 'R'] || 0)) / 2); delete A[b + 'L']; delete A[b + 'R']; } }); }
    st.sel = CodisChar.fix(Object.assign({}, st.sel, { sym:t.checked, adv:CodisChar.advStr(A) }));
    codisChxKeepOpen(); codisChxRender(); codisChxApply(); return;
  }
  const k = t.getAttribute && t.getAttribute('data-sl'); if(!k) return;
  const v = +t.value, out = t.parentNode.querySelector('output');
  if(k === 'height'){ st.sel = Object.assign({}, st.sel, { height:v }); if(out) out.textContent = CodisChar.heightLabel(v); }
  else if(k.indexOf('adv:') === 0){
    const key = k.slice(4), A = CodisChar.advParse(st.sel.adv); if(v) A[key] = v; else delete A[key];
    st.sel = Object.assign({}, st.sel, { adv:CodisChar.advStr(A) }); if(out) out.textContent = v > 0 ? '+' + v : v;
    if(ev.type === 'change'){ codisChxKeepOpen(); const acc = t.closest('.chx-acc'); if(acc){ const g = acc.dataset.g, n = CodisChar.DEFS.adv.find(x=>x.g === g).items.filter(it=>A[it.k] || A[it.k + 'L'] || A[it.k + 'R']).length; let b = acc.querySelector('.chx-acc-n'); if(n && !b){ b = document.createElement('b'); b.className = 'chx-acc-n'; acc.querySelector('summary').appendChild(b); } if(b){ if(n) b.textContent = n; else b.remove(); } const r = acc.querySelector('.chx-reset'); if(r) r.disabled = !n; } }
  }
  codisChxApply();
}
function codisChxKeepOpen(){ const st = codisChx; if(!st) return; st.el.querySelectorAll('.chx-acc').forEach(d=>{ st.open[d.dataset.g] = d.open; }); }
function codisChxThumb(kind, id){
  const st = codisChx, k = codisChxThumbKey(kind, id), u = st && st.thumbs[k];
  return u ? '<img alt="" src="' + u + '" decoding="async">' : (kind === 'body' ? '' : '<i class="chx-ph" aria-hidden="true"></i>');
}
/* مفتاح اللقطة = كل ما يؤثر على شكلها (تغيير غير مؤثر لا يعيد التصوير) */
function codisChxThumbKey(kind, id){
  const s = codisChx.sel;
  if(kind === 'body') return 'b|' + id;
  if(kind === 'build') return 'u|' + s.body + '|' + id + '|' + s.skin;
  if(kind === 'face') return 'f|' + s.body + '|' + id + '|' + s.skin + '|' + s.hair + '|' + s.hairColor + '|' + s.beard;
  if(kind === 'eyeShape') return 'e|' + s.body + '|' + id + '|' + s.face + '|' + s.skin + '|' + s.eyes + '|' + s.brows;
  if(kind === 'brows') return 'w|' + s.body + '|' + id + '|' + s.face + '|' + s.skin + '|' + s.hairColor;
  if(kind === 'hair') return 'h|' + s.body + '|' + id + '|' + s.face + '|' + s.skin + '|' + s.hairColor;
  return 'd|' + id + '|' + s.face + '|' + s.skin + '|' + s.hairColor + '|' + s.beardColor;
}
const CODIS_CHX_SHOT = {   /* زاوية/تقريب ثابتان لكل نوع (اتساق الصور) */
  body:{ focus:'body', z:0, yaw:-.25, aspect:.62 }, build:{ focus:'body', z:0, yaw:-.25, aspect:.62 },
  face:{ focus:'face', z:1, yaw:-.42 }, eyeShape:{ focus:'eyes', z:1, yaw:-.12, aspect:1.6 }, brows:{ focus:'eyes', z:1, yaw:-.12, aspect:1.6 },
  hair:{ focus:'hair', z:1, yaw:-.85 }, beard:{ focus:'face', z:1, yaw:-.55 },
};
/* لقطات بطاقات الاختيار من المجسّم الحقيقي: طابور واحد، بالخمول، تُلغى عند تغيّر المرحلة/الخروج (st.tok) */
async function codisChxThumbs(){
  const st = codisChx; if(!st || !st.view || !st.ready) return;
  const S = codisChxSteps(st)[st.step], D = CODIS_CHAR_DEFS, my = st.tok, s = st.sel;
  const jobs = S.key === 'body' ? [['body', D.bodies, 'body'], ['build', D.builds, 'build']] : S.key === 'face' ? [['face', D.faces[s.body], 'face']] : S.key === 'eyes' ? [['eyeShape', D.eyeShapes, 'eyeShape'], ['brows', D.brows, 'brows']] :
    S.key === 'hair' ? [['hair', D.hairs[s.body], 'hair']] : S.key === 'beard' ? [['beard', D.beards, 'beard']] : [];
  if(st.thumbBusy){ st.thumbAgain = true; return; } st.thumbBusy = true;
  try{
    for(const [kind, list, field] of jobs) for(const it of list){
      if(!codisChx || codisChx !== st || st.tok !== my || !st.view) return;
      const k = codisChxThumbKey(kind, it.id); if(st.thumbs[k]){ codisChxPut(kind, it.id, st.thumbs[k]); continue; }
      await new Promise(r=>codisChxIdle(r));
      if(!codisChx || st.tok !== my || !st.view) return;
      const sel = Object.assign({}, st.sel, { [field]:it.id }); if(kind === 'body') Object.assign(sel, CodisChar.fix(Object.assign({}, CODIS_CHAR_DEFS.defaults[it.id], { body:it.id, skin:s.skin })));
      const o = CODIS_CHX_SHOT[kind]; let u = '';
      try{ u = await st.view.snapshot(CodisChar.spec(sel), { focus:o.focus, z:o.z, yaw:o.yaw, aspect:o.aspect || 1, size:kind === 'eyeShape' || kind === 'brows' ? 88 : 140 }); }catch(e){}
      if(!codisChx || st.tok !== my) return;
      if(u){ st.thumbs[k] = u; codisChxPut(kind, it.id, u); }
    }
  } finally { st.thumbBusy = false; if(st.thumbAgain && codisChx === st){ st.thumbAgain = false; codisChxIdle(codisChxThumbs); } }
}
function codisChxPut(kind, id, u){ const st = codisChx; if(!st) return; const b = st.el.querySelector('.chx-opt[data-k="' + kind + '"][data-v="' + id + '"] .chx-thumb'); if(b && !b.querySelector('img')) b.innerHTML = '<img alt="" src="' + u + '" decoding="async">'; }
function codisChxPick(kind, v){
  const st = codisChx; if(!st) return; const s = st.sel, prevSteps = codisChxSteps(st).length;
  if(kind === 'body'){
    if(s.body === v) return; st.memo = st.memo || {}; st.memo[s.body] = s;
    const m = st.memo[v] || Object.assign({}, CODIS_CHAR_DEFS.defaults[v], { skin:s.skin, eyes:s.eyes, hairColor:s.hairColor, build:s.build, height:s.height });
    st.sel = CodisChar.fix(Object.assign({}, m, { body:v }));
  } else st.sel = CodisChar.fix(Object.assign({}, s, { [kind]:v }));
  if(kind === 'body' || (kind === 'beard' && ((s.beard === 'none') !== (v === 'none')))){ codisChxKeepOpen(); codisChxRender(); if(kind === 'body' && codisChxSteps(st).length !== prevSteps) codisChxStep(st.step, true); }
  else st.el.querySelectorAll('.chx-opt[data-k="' + kind + '"]').forEach(b=>{ const on = b.dataset.v === v; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  codisChxApply();
  st.tok++; if(st.ready) codisChxIdle(codisChxThumbs);   /* لقطات تعتمد على الاختيار الجديد (لون/وجه…) */
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
  const sync = CodisChar.syncState();
  codisChxClose(true);
  /* الحفظ المحلي تم فعلاً؛ المزامنة السحابية تُعرض بحالتها الحقيقية (لا «تمت المزامنة» قبل حدوثها) */
  showToast(sync === 'guest' ? 'حُفظت شخصيتك على هذا الجهاز' : sync === 'offline' ? 'حُفظت شخصيتك على الجهاز — ستُزامَن عند الاتصال' : 'حُفظت شخصيتك على الجهاز — جارٍ المزامنة', 'var(--success)', 'check');
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
  if(JSON.stringify(CodisChar.fix(st.sel)) !== st.start){ const q = st.el.querySelector('.chx-quit'); q.hidden = false; try{ q.querySelector('[data-chx="stay"]').focus(); }catch(e){} return; }
  codisChxClose(false);
}
function codisChxLater(){
  try{ data.profile = Object.assign({}, data.profile || {}, { charOfferedAt:Date.now() }); saveData(); }catch(e){}
  codisChxClose(false);
  showToast('يمكنك إنشاء شخصيتك لاحقاً من الإعدادات ← شخصيتي', 'var(--aqua)', 'info');
}
function codisChxClose(saved){
  const st = codisChx; if(!st) return; codisChx = null; st.tok++;
  if(st.applyT) cancelAnimationFrame(st.applyT);
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
  const go = ev.target.closest('[data-chx-go]'); if(go){ const k = +go.getAttribute('data-chx-go'); if(k >= 0) codisChxStep(k); return; }
  const o = ev.target.closest('.chx-opt'); if(o){ codisChxPick(o.dataset.k, o.dataset.v); return; }
  const rs = ev.target.closest('[data-reset]');
  if(rs){ const g = CodisChar.DEFS.adv.find(x=>x.g === rs.dataset.reset), A = CodisChar.advParse(st.sel.adv); g.items.forEach(it=>{ delete A[it.k]; delete A[it.k + 'L']; delete A[it.k + 'R']; }); st.sel = CodisChar.fix(Object.assign({}, st.sel, { adv:CodisChar.advStr(A) })); codisChxKeepOpen(); codisChxRender(); codisChxApply(); return; }
  const sm = ev.target.closest('.chx-acc > summary'); if(sm){ setTimeout(codisChxKeepOpen, 0); return; }
  const b = ev.target.closest('[data-chx]'); if(!b) return; const a = b.getAttribute('data-chx'), v = st.view;
  if(a === 'next'){ if(st.step === codisChxSteps(st).length - 1) codisChxSave(); else codisChxStep(st.step + 1); }
  else if(a === 'prev') codisChxStep(st.step - 1);
  else if(a === 'close') codisChxTryClose();
  else if(a === 'quit') codisChxClose(false);
  else if(a === 'stay') st.el.querySelector('.chx-quit').hidden = true;
  else if(a === 'retry'){ CodisChar.unmount(st.view); st.view = null; st.ready = false; st.el.classList.remove('is-ready'); codisChxMountView(); }   /* لا حالة فشل عالقة: سياق جديد بعد تحرير القديم */
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
const CODIS_SYNC_LABEL = { guest:'محفوظة على هذا الجهاز', offline:'محفوظة على الجهاز — بانتظار الاتصال للمزامنة', pending:'محفوظة على الجهاز — جارٍ المزامنة', synced:'محفوظة ومُزامَنة' };
function codisCharRenderPage(){
  const root = document.getElementById('char-root'); if(!root) return;
  CodisChar.unmount();
  const c = CodisChar.get();
  codisCharHomeBadge();
  if(!c){
    root.innerHTML = '<div class="settings-card chp-empty"><div class="chp-empty-art" aria-hidden="true">' + CODIS_CHX_ICON.male + CODIS_CHX_ICON.female + '</div>' +
      '<h2 class="chp-empty-t">لم تُنشئ شخصيتك بعد</h2><p class="chp-empty-s">صمّم شخصية ثلاثية الأبعاد: الجسم والبشرة والوجه والعينين والشعر واللحية.</p>' +
      '<button type="button" class="btn btn-primary" onclick="codisCharOpen(\'create\')">إنشاء شخصيتي</button></div>';
    return;
  }
  const n = CodisChar.names(c), s = CodisChar.fix(c), sy = CodisChar.syncState();
  const sec = (t, rows)=>'<section class="chp-sec"><h3>' + t + '</h3><dl class="chp-info">' + rows.map(r=>'<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') + '</dl></section>';
  const rows1 = [['نوع الجسم', escapeHtml(n.body)], ['البنية', escapeHtml(n.build)], ['الطول', escapeHtml(CodisChar.heightLabel(n.height))], ['البشرة', codisChxSw(n.skinHex, 'is-mini') + escapeHtml(n.skin)]];
  const rows2 = [['الوجه', escapeHtml(n.face)], ['العينان', codisChxSw(n.eyesHex, 'is-mini') + escapeHtml(n.eyeShape + ' · ' + n.eyes)], ['الحاجبان', escapeHtml(n.brows)]].concat(n.adv ? [['تخصيص دقيق', n.adv + ' تعديلات']] : []);
  const rows3 = [['قصة الشعر', escapeHtml(n.hair)], ['لون الشعر', codisChxSw(n.hex, 'is-mini') + escapeHtml(n.color)]].concat(s.body === 'male' ? [['اللحية', escapeHtml(n.beard + (s.beard !== 'none' ? ' · ' + n.beardColor : ''))]] : []);
  root.innerHTML = '<div class="settings-card chp-card"><div class="chp-stage"><div class="chp-view"></div><div class="chp-load" role="status"><span class="chx-spin" aria-hidden="true"></span><span>جارٍ تجهيز شخصيتك…</span></div><div class="chp-fail" hidden><p></p><button type="button" class="btn btn-secondary" data-chp="retry">إعادة المحاولة</button></div>' +
    '<div class="chx-tools" role="group" aria-label="التحكم بالعرض"><button type="button" data-chp="zin" aria-label="تقريب"><b aria-hidden="true">+</b></button><button type="button" data-chp="zout" aria-label="إبعاد"><b aria-hidden="true">−</b></button><button type="button" data-chp="rot" aria-label="تدوير"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg></button></div></div>' +
    '<p class="chp-sync is-' + sy + '">' + CODIS_SYNC_LABEL[sy] + '</p>' +
    sec('الجسم', rows1) + sec('الوجه والعينان', rows2) + sec('الشعر' + (s.body === 'male' ? ' واللحية' : ''), rows3) +
    '<div class="chp-btns"><button type="button" class="btn btn-primary" onclick="codisCharOpen(\'edit\')">تعديل الشخصية</button><button type="button" class="btn btn-secondary" onclick="codisCharReset()">إعادة الاختيارات الافتراضية</button></div></div>';
  codisCharPageMount(root, c);
}
function codisCharPageMount(root, c){
  const host = root.querySelector('.chp-view'), load = root.querySelector('.chp-load'), fail = root.querySelector('.chp-fail'), stage = root.querySelector('.chp-stage');
  load.hidden = false; fail.hidden = true; stage.classList.remove('is-flat');
  const showFail = (msg, perm)=>{ load.hidden = true; fail.hidden = false; fail.querySelector('p').textContent = msg; fail.querySelector('button').hidden = !!perm; };
  const v = CodisChar.mount(host, { yaw:-.3, wheel:false, onState:(s, x)=>{
    if(s === 'ready'){ load.hidden = true; fail.hidden = true; }
    if(s === 'error') showFail(CODIS_CHX_ERR[x && x.code] || CODIS_CHX_ERR.asset);
    if(s === 'lost') showFail(CODIS_CHX_ERR.lost);
    if(s === 'restored') fail.hidden = true;
  } });
  if(!stage.dataset.bound){ stage.dataset.bound = '1'; stage.addEventListener('click', ev=>{ const b = ev.target.closest('[data-chp]'); if(!b) return; const a = b.getAttribute('data-chp'), cv = CodisChar.current();
    if(a === 'retry'){ codisCharPageMount(root, CodisChar.get() || c); return; } if(!cv) return; if(a === 'zin') cv.setZoom(cv.zoomT + .34); else if(a === 'zout') cv.setZoom(cv.zoomT - .34); else cv.rotateBy(Math.PI / 4); }); }
  if(!v){ stage.classList.add('is-flat'); showFail(CODIS_CHX_ERR[CodisChar.why()] || CODIS_CHX_ERR.context, CodisChar.permanent()); return; }
  v.setConfig(CodisChar.spec(c)).catch(()=>{});
}
async function codisCharReset(){
  const c = CodisChar.get(); if(!c) return;
  const ok = await codisConfirm({ title:'إعادة الاختيارات الافتراضية؟', message:'يرجع الوجه والعينان والشعر واللحية والبنية إلى الافتراضي لنوع الجسم الحالي (' + CodisChar.names(c).body + '). بقية بيانات حسابك لا تتغيّر.', icon:'info', danger:false, confirmText:'إعادة الافتراضي' });
  if(!ok) return;
  if(!CodisChar.save(Object.assign({ body:c.body }, CODIS_CHAR_DEFS.defaults[c.body]))){ showToast('تعذّر الحفظ — حاول مجدداً.', 'var(--danger)'); return; }
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
