/* =====================================================================
   CODIS · CodisBox3D v2 — جسر بين نظام الصناديق وطبقة العرض ثلاثية الأبعاد (CODIS-BOX3D-V2 / V52)
   • عرض فقط: النتيجة تُسحب وتُمنح وتُحفظ داخل CodisBoxes.open()/buyOpenMany() قبل أي حركة؛ هذا الجسر يقرأ النتيجة المحفوظة فقط.
   • المشهد يُركَّب داخل body (إطار الهاتف على الحاسوب)، ومستوى الكشف التسعة (CodisRevealLevels) يُمرَّر كما هو مع لونيه.
   • التسليم بعنصر مشترك: targets() يعيد بطاقات الواجهة النهائية الحقيقية (نتيجة الصندوق / خلايا ×10) فتهبط عليها بطاقات المشهد بالضبط.
   • الأصوات: مجموعة 'b3d' تُوقَف عند التخطي/الإغلاق. أي فشل ⇒ تسليم فوري؛ بلا WebGL ⇒ المشهد 2D (CodisBoxCinema/CodisBulkCinema).
   ===================================================================== */
const CodisBox3D = (function(){
  'use strict';
  let lib = null, bad = false, cur = null, bulk = null, watch = 0, bwatch = 0, bulkMsVal = 0, handing = false;
  function webglOK(){
    try{ const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if(!gl) return false; const x = gl.getExtension('WEBGL_lose_context'); if(x) x.loseContext(); return true; }catch(e){ return false; }
  }
  function ensure(){
    if(lib) return lib; if(bad || window.CODIS_B3D_OFF) return null;
    try{
      if(!webglOK()) throw new Error('nowebgl');
      const el = document.getElementById('codis-b3d-src'); if(!el) throw new Error('nosrc');
      const s = document.createElement('script'); s.textContent = el.textContent; document.head.appendChild(s); s.remove();
      lib = window.CodisB3D; if(!lib || typeof lib.playSingle !== 'function') throw new Error('badlib');
    }catch(e){ bad = true; lib = null; try{ console.warn('CodisBox3D unavailable', e && e.message); }catch(x){} }
    return lib;
  }
  const can = ()=>!!ensure();
  /* فئة الجهاز: iOS يُبلغ عن أنوية أقل من الحقيقية (كان كل آيفون يُعامل كجهاز ضعيف فيُرسم بنصف الدقة) — الحاكم التكيّفي داخل المشهد هو الضمان الفعلي */
  function tier(){
    const n = navigator, ios = /iPhone|iPad|iPod/.test(n.userAgent || '') || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
    if((n.deviceMemory && n.deviceMemory <= 2) || (!ios && (n.hardwareConcurrency || 8) <= 2)) return 'low';
    return 'hi';
  }
  function theme(){ return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'paper'; }
  function fontFam(){ try{ return getComputedStyle(document.body).fontFamily || 'sans-serif'; }catch(e){ return 'sans-serif'; } }
  /* وجه البطاقة الفعلي: نفس ترميز نافذة النتيجة (econPaintBox) */
  function faceOf(r){
    try{
      let html = '', tone = (r.rarity && r.rarity.tone) || 'C';
      if(r.cosmetic){ const d = CodisCosmetics.def(r.cosmetic.id); html = '<div class="bx-stage is-done"><div class="bx-reveal store-detail-art is-bare">' + econCosmeticPreviewHtml(d) + '</div></div>'; }
      else if(r.holiday){ html = '<div class="bx-stage is-done"><div class="bx-reveal bx-pass-art">' + hcdCardHtml(r.holiday, {}) + '</div></div>'; }
      else if(r.pouch){ html = '<div class="bx-stage is-done"><div class="bx-reveal bx-pass-art"><div class="pch-art is-big">' + econPouchSvg(r.pouch.type) + '</div></div></div>'; }
      else if(r.pass){ html = '<div class="bx-stage is-done"><div class="bx-reveal bx-pass-art">' + codisPassCardHtml(r.pass, { plain:true }) + '</div></div>'; }
      else { const a = econBoxRewardArt(r.item, r.rarity); html = '<div class="bx-stage is-done"><div class="bx-reveal store-detail-art' + (a.indexOf('rwc-d') > -1 ? ' is-bare' : '') + '">' + a + '</div></div>'; }
      return html ? { html:html, tone:tone, sel:'.bx-reveal > *' } : null;
    }catch(e){ return null; }
  }
  function descOf(r, t, RL){
    let name = '', kind = 'مكافأة';
    try{
      if(r.cosmetic){ name = CodisCosmetics.def(r.cosmetic.id).name; kind = 'مظهر'; }
      else if(r.pouch){ name = CodisPouches.def(r.pouch.type).name; kind = 'كيس فضة'; }
      else if(r.pass){ name = CodisPasses.label(r.pass); kind = 'بطاقة تجاوز'; }
      else if(r.holiday){ const d = CodisHolidayCards.def(r.holiday.kind); name = d ? d.name : 'بطاقة عطلة'; kind = 'بطاقة عطلة'; }
      else { name = (r.item && r.item.name) || ''; }
    }catch(e){}
    const rgb = String(RL.rgb).split(',').map(Number), rgb2 = String(RL.rgb2 || RL.rgb).split(',').map(Number);
    return { face:faceOf(r), title:name || 'مكافأة', sub:(r.rarity && r.rarity.name) || '', tag:kind + ((t && t.name) ? ' · ' + t.name : ''), rgb:rgb, rgb2:rgb2, font:fontFam() };
  }
  function hooks(o){
    return { fit:el=>{ try{ codisFitRewardCard(el); }catch(e){} }, sfx:(a, b)=>{ try{ codisSfx(a, b); }catch(e){} }, haptic:p=>{ try{ codisHaptic(p); }catch(e){} },
      stopSfx:()=>{ try{ CodisAudio.stopGroup('b3d', .12); }catch(e){} }, onReveal:o.reveal, onDispose:o.dispose, targets:o.targets };
  }
  /* بطاقة النتيجة الحقيقية داخل نافذة الصندوق */
  function singleTarget(){ const b = document.getElementById('econ-box-body'); const el = b && b.querySelector('.bx-stage .bx-reveal > *'); return el ? { '0':el } : null; }
  function bulkTargets(res){ return ()=>{ const g = document.querySelector('#econ-bulk-modal .bk-grid'); if(!g) return null; const m = {}; res.items.forEach((r, i)=>{ const c = g.children[i]; const el = c && c.querySelector('.bk-card'); if(el) m[String(i)] = el; }); return m; }; }
  /* ---- صندوق واحد ---- */
  function playSingle(o){
    const L = ensure(); if(!L) return false;
    abortSingle();
    const r = o.result, t = o.tier; if(!r || !t || !r.rarity) return false;
    let ctl = null;
    try{
      const lv = CodisRevealLevels.levelOfResult(r), RL = CodisRevealLevels.info(lv), calm = econCalm();
      if(o.state) o.state.b3d = true;
      ctl = L.playSingle({ n:t.index, lv:lv, calm:calm, tier:tier(), theme:theme(), host:document.body, reward:descOf(r, t, RL),
        hooks:hooks({ reveal:()=>{ handing = true; try{ o.reveal(); }catch(e){ try{ console.warn('CodisBox3D reveal', e); }catch(x){} } finally { handing = false; } },
          dispose:()=>{ if(cur === ctl) cur = null; clearTimeout(watch); }, targets:singleTarget }) });
      cur = ctl;
      clearTimeout(watch); watch = window.setTimeout(()=>{ if(cur === ctl && ctl.run && !ctl.run.handed) ctl.run.fail('watchdog'); }, (L.sceneSeconds(lv, calm) + 12) * 1000);
      return true;
    }catch(e){ try{ console.warn('CodisBox3D single', e); }catch(x){} if(o.state) o.state.b3d = false; if(ctl){ try{ ctl.abort(); }catch(y){} } cur = null; return false; }
  }
  function abortSingle(){ if(handing) return; clearTimeout(watch); const c = cur; cur = null; if(c){ try{ c.abort(); }catch(e){} } }
  /* ---- ×10: الشبكة النهائية تُرسم تحت الطبقة أولاً لتُقاس خاناتها ---- */
  function playBulk(root, res, plan, onDone){
    const L = ensure(); if(!L) return false;
    abortBulk();
    let ctl = null;
    try{
      const calm = econCalm(), ord = econBulkOrder(res);
      try{ if(typeof econBulkPaintFinal === 'function') econBulkPaintFinal(); }catch(e){}
      const items = ord.map(o=>{ const r = res.items[o.i], RL = CodisRevealLevels.info(o.lv); return { i:o.i, lv:o.lv, reward:descOf(r, res.tier, RL) }; });
      bulkMsVal = L.bulkSeconds(items, calm) * 1000;
      ctl = L.playBulk({ n:res.tier.index, items:items, calm:calm, tier:tier(), theme:theme(), host:document.body,
        hooks:hooks({ reveal:()=>{ handing = true; try{ onDone(); }catch(e){ try{ console.warn('CodisBox3D bulk done', e); }catch(x){} } finally { handing = false; } },
          dispose:()=>{ if(bulk === ctl) bulk = null; clearTimeout(bwatch); }, targets:bulkTargets(res) }) });
      bulk = ctl;
      clearTimeout(bwatch); bwatch = window.setTimeout(()=>{ if(bulk === ctl && ctl.run && !ctl.run.handed) ctl.run.fail('watchdog'); }, bulkMsVal + 14000);
      return true;
    }catch(e){ try{ console.warn('CodisBox3D bulk', e); }catch(x){} if(ctl){ try{ ctl.abort(); }catch(y){} } bulk = null; return false; }
  }
  function abortBulk(){ if(handing) return; clearTimeout(bwatch); const c = bulk; bulk = null; if(c){ try{ c.abort(); }catch(e){} } }
  function prewarm(){ try{ if('requestIdleCallback' in window) requestIdleCallback(()=>{ ensure(); }, { timeout:20000 }); else setTimeout(ensure, 8000); }catch(e){} }
  window.addEventListener('load', ()=>setTimeout(prewarm, 6000), { once:true });
  return Object.freeze({ can:can, playSingle:playSingle, abortSingle:abortSingle, playBulk:playBulk, abortBulk:abortBulk, active:()=>!!(cur || bulk), bulkMs:()=>bulkMsVal, _lib:()=>lib, _ctl:()=>({ cur:cur, bulk:bulk }) });
})();
