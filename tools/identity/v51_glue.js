/* =====================================================================
   CODIS · CodisBox3D v1 — جسر بين نظام الصناديق وطبقة العرض ثلاثية الأبعاد (CODIS-BOX3D / V51)
   • عرض فقط: النتيجة تُسحب وتُمنح وتُحفظ داخل CodisBoxes.open()/buyOpenMany() قبل أي حركة؛ هذا الجسر يقرأ النتيجة المحفوظة فقط ولا يلمس الاقتصاد ولا المحفظة ولا الحفظ.
   • المحرك (Three.js مُقلَّم + المجسّمات والمشاهد) نصٌّ خامل داخل #codis-b3d-src يُشغَّل عند أول حاجة (أو وقت الخمول)؛ لا تحميل خارجي ولا ملفات إضافية.
   • أي فشل (لا WebGL، خطأ بالمشهد، فقد السياق، تعطل الخط الزمني) ⇒ يُسلَّم المشهد فوراً إلى الواجهة النهائية فتصل المكافأة دائماً؛ وإن لم يتوفر WebGL يعمل المشهد القديم (2D) كما كان.
   ===================================================================== */
const CodisBox3D = (function(){
  'use strict';
  let lib = null, bad = false, cur = null, bulk = null, watch = 0, bwatch = 0, bulkMsVal = 0, handing = false;
  function webglOK(){
    try{ const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if(!gl) return false; const x = gl.getExtension('WEBGL_lose_context'); if(x) x.loseContext(); return true; }catch(e){ return false; }
  }
  function ensure(){
    if(lib) return lib; if(bad || window.CODIS_B3D_OFF) return null;   /* CODIS_B3D_OFF: اختبارات المشهد القديم */
    try{
      if(!webglOK()) throw new Error('nowebgl');
      const el = document.getElementById('codis-b3d-src'); if(!el) throw new Error('nosrc');
      const s = document.createElement('script'); s.textContent = el.textContent; document.head.appendChild(s); s.remove();
      lib = window.CodisB3D; if(!lib || typeof lib.playSingle !== 'function') throw new Error('badlib');
    }catch(e){ bad = true; lib = null; try{ console.warn('CodisBox3D unavailable', e && e.message); }catch(x){} }
    return lib;
  }
  const can = ()=>!!ensure();
  function isLow(){ const n = navigator; return (n.hardwareConcurrency || 8) <= 4 || (n.deviceMemory || 8) <= 2; }
  function theme(){ return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'paper'; }
  function fontFam(){ try{ return getComputedStyle(document.body).fontFamily || 'sans-serif'; }catch(e){ return 'sans-serif'; } }
  /* وصف الجائزة الفعلي لوجه البطاقة ثلاثية الأبعاد (الاسم/الفئة من نتيجة النظام نفسها؛ لا اختراع) */
  /* وجه البطاقة الفعلي: نفس ترميز نافذة النتيجة (econPaintBox) فيطابق ما ربحته حرفياً */
  function faceOf(r, tier){
    try{
      let html = '', tone = (r.rarity && r.rarity.tone) || 'C';
      if(r.cosmetic){ const d = CodisCosmetics.def(r.cosmetic.id); html = '<div class="bx-stage is-done"><div class="bx-reveal store-detail-art is-bare">' + econCosmeticPreviewHtml(d) + '</div></div>'; }
      else if(r.holiday){ html = '<div class="bx-stage is-done"><div class="bx-reveal bx-pass-art">' + hcdCardHtml(r.holiday, {}) + '</div></div>'; }
      else if(r.pouch){ html = '<div class="bx-stage is-done"><div class="bx-reveal bx-pass-art"><div class="pch-art is-big">' + econPouchSvg(r.pouch.type) + '</div></div></div>'; }
      else if(r.pass){ html = '<div class="bx-stage is-done"><div class="bx-reveal bx-pass-art">' + codisPassCardHtml(r.pass, { plain:true }) + '</div></div>'; }
      else { const a = econBoxRewardArt(r.item, r.rarity); html = '<div class="bx-stage is-done"><div class="bx-reveal store-detail-art' + (a.indexOf('rwc-d') > -1 ? ' is-bare' : '') + '">' + a + '</div></div>'; }
      return html ? { html:html, tone:tone } : null;
    }catch(e){ return null; }
  }
  function descOf(r, tier, RL){
    let name = '', kind = 'مكافأة';
    try{
      if(r.cosmetic){ name = CodisCosmetics.def(r.cosmetic.id).name; kind = 'مظهر'; }
      else if(r.pouch){ name = CodisPouches.def(r.pouch.type).name; kind = 'كيس فضة'; }
      else if(r.pass){ name = CodisPasses.label(r.pass); kind = 'بطاقة تجاوز'; }
      else if(r.holiday){ const d = CodisHolidayCards.def(r.holiday.kind); name = d ? d.name : 'بطاقة عطلة'; kind = 'بطاقة عطلة'; }
      else { name = (r.item && r.item.name) || ''; }
    }catch(e){}
    const rgb = String(RL.rgb).split(',').map(Number);
    return { face:faceOf(r, tier), title:name || 'مكافأة', sub:(r.rarity && r.rarity.name) || '', tag:kind + ((tier && tier.name) ? ' · ' + tier.name : ''), rgb:rgb, font:fontFam() };
  }
  function hooks(onReveal, onDispose){
    return { fit:el=>{ try{ codisFitRewardCard(el); }catch(e){} }, sfx:(a, b)=>{ try{ codisSfx(a, b); }catch(e){} }, haptic:p=>{ try{ codisHaptic(p); }catch(e){} }, onReveal:onReveal, onDispose:onDispose };
  }
  /* ---- صندوق واحد: يعيد true إن بدأ المشهد (وإلا يعمل المشهد القديم) ---- */
  function playSingle(o){
    const L = ensure(); if(!L) return false;
    abortSingle();
    const r = o.result, t = o.tier; if(!r || !t || !r.rarity) return false;
    let ctl = null;
    try{
      const lv = CodisRevealLevels.levelOfResult(r), RL = CodisRevealLevels.info(lv), g = CodisBoxCinema.groupOf(lv), calm = econCalm();
      ctl = L.playSingle({ n:t.index, g:g, calm:calm, low:isLow(), theme:theme(), host:document.documentElement, reward:descOf(r, t, RL),
        hooks:hooks(()=>{ handing = true; try{ o.reveal(); }catch(e){ try{ console.warn('CodisBox3D reveal', e); }catch(x){} } finally { handing = false; } }, ()=>{ if(cur === ctl) cur = null; clearTimeout(watch); }) });
      cur = ctl;
      clearTimeout(watch); watch = window.setTimeout(()=>{ if(cur === ctl && ctl.run && !ctl.run.handed) ctl.run.fail('watchdog'); }, (L.sceneSeconds(g, calm) + 12) * 1000);   /* حارس: لا تبقى الطبقة عالقة مهما حدث */
      return true;
    }catch(e){ try{ console.warn('CodisBox3D single', e); }catch(x){} if(ctl){ try{ ctl.abort(); }catch(y){} } cur = null; return false; }
  }
  function abortSingle(){ if(handing) return; clearTimeout(watch); const c = cur; cur = null; if(c){ try{ c.abort(); }catch(e){} } }
  /* ---- ×10 ---- */
  function playBulk(root, res, plan, onDone){
    const L = ensure(); if(!L) return false;
    abortBulk();
    let ctl = null;
    try{
      const calm = econCalm(), ord = econBulkOrder(res);
      const items = ord.map(o=>{ const r = res.items[o.i], RL = CodisRevealLevels.info(o.lv); return { i:o.i, lv:o.lv, g:CodisBoxCinema.groupOf(o.lv), reward:descOf(r, res.tier, RL) }; });
      bulkMsVal = L.bulkSeconds(items, calm) * 1000;
      ctl = L.playBulk({ n:res.tier.index, items:items, calm:calm, low:isLow(), theme:theme(), host:document.documentElement,
        hooks:hooks(()=>{ handing = true; try{ onDone(); }catch(e){ try{ console.warn('CodisBox3D bulk done', e); }catch(x){} } finally { handing = false; } }, ()=>{ if(bulk === ctl) bulk = null; clearTimeout(bwatch); }) });
      bulk = ctl;
      clearTimeout(bwatch); bwatch = window.setTimeout(()=>{ if(bulk === ctl && ctl.run && !ctl.run.handed) ctl.run.fail('watchdog'); }, bulkMsVal + 14000);
      return true;
    }catch(e){ try{ console.warn('CodisBox3D bulk', e); }catch(x){} if(ctl){ try{ ctl.abort(); }catch(y){} } bulk = null; return false; }
  }
  function abortBulk(){ if(handing) return; clearTimeout(bwatch); const c = bulk; bulk = null; if(c){ try{ c.abort(); }catch(e){} } }
  /* تسخين مبكر وقت الخمول: يُشغّل المحرك قبل أول فتح فلا يتأخر المشهد */
  function prewarm(){ try{ if('requestIdleCallback' in window) requestIdleCallback(()=>{ ensure(); }, { timeout:20000 }); else setTimeout(ensure, 8000); }catch(e){} }
  window.addEventListener('load', ()=>setTimeout(prewarm, 6000), { once:true });
  return Object.freeze({ can:can, playSingle:playSingle, abortSingle:abortSingle, playBulk:playBulk, abortBulk:abortBulk, active:()=>!!(cur || bulk), bulkMs:()=>bulkMsVal, _lib:()=>lib, _ctl:()=>({ cur:cur, bulk:bulk }) });
})();
