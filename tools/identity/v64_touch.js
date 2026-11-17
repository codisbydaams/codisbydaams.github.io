/* ================= CODIS-V64 · AGED WOOD — التفاعل والصوت المحصوران بالأسطح الملبّسة =================
   (1) codisSoundScopeOf(target): سياق الهوية الصوتية للعنصر المضغوط — فقط إن كان داخل سطح ملبّس فعلاً (data-pt + data-pt-surface + data-pt-target)
       بثيم له sound، والثيم مجهّز الآن لتلك الغرفة نفسها. المعاينات (.pt-stage/.pt-ov) والبطاقات المصغّرة مستبعدة. أي شيء آخر ⇒ null (الصوت الأصلي).
   (2) CodisWoodTouch: مستمعات Pointer Events مفوَّضة على document (لا مستمع لكل زر)، كلها passive (لا preventDefault ⇒ التمرير والتكبير كما هما):
       • الماوس: لمعة كهرمانية تتبع المؤشر فوق المضيف (السطح، أو مستطيل المهمة داخل القائمة) + لمعة على الحافة النحاسية؛ تختفي بسلاسة عند الخروج.
       • اللمس/القلم: عند الملامسة ضوء دافئ حول الإصبع + حلقة استجابة من نقطة التماس + ظل ضغط خفيف، يتبع الإصبع داخل المضيف، ويرجع عند الرفع؛
         pointercancel (بدء التمرير/المتصفح أخذ اللمسة) يرجع كل شيء فوراً. لا شيء يعتمد على :hover.
       • الأزرار داخل السطح: صنف aw-press أثناء الضغط (قطعة خشب تنضغط) لكل أنواع المؤشر.
       التحديث بـrequestAnimationFrame واحد (قراءة gBCR واحدة + متغيرات CSS على عنصر الطبقة فقط؛ الحركة transform/opacity). طبقة .aw-fx تُنشأ عند أول تفاعل
       وتُزال مع الثيم (codisPlanThemeStrip). تقليل الحركة/‏sx-calm ⇒ الضوء ثابت بلا حلقة ولا انتقالات. الصفحة المخفية ⇒ يُطفأ كل شيء. */
function codisSoundScopeOf(target){
  try{
    const s = target && target.closest ? target.closest('[data-pt][data-pt-surface][data-pt-target]') : null;
    if(!s || s.closest('.pt-stage, .pt-ov, .pt-mtile')) return null;
    const d = CodisPlanThemes.def(s.getAttribute('data-pt')); if(!d || !d.sound) return null;
    if(s.getAttribute('data-pt-target') !== d.target || !CodisPlanThemes.isEquipped(d.id)) return null;
    return d.sound;
  }catch(e){ return null; }
}
const CodisWoodTouch = (function(){
  const SURF = '[data-pt^="agedWood"][data-pt-surface][data-pt-target]', PRESS = 'button, .btn, .stat-btn, .pm-btn, .task-wt, [role="button"]';
  let host = null, fx = null, pid = null, px = 0, py = 0, raf = 0, press = null;
  const calm = ()=>{ try{ return !!(window.CODIS_REDUCED_MOTION || document.documentElement.classList.contains('sx-calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); }catch(e){ return false; } };
  function surfaceOf(t){ const s = t && t.closest ? t.closest(SURF) : null; return (s && !s.closest('.pt-stage, .pt-ov, .pt-mtile')) ? s : null; }
  /* مضيف الضوء: السطح نفسه، أو مستطيل المهمة (ابن مباشر لحاوية القائمة) — لا ضوء على فراغ القائمة بين المستطيلات */
  function hostOf(t, s){ if(s.classList.contains('pt-scope')){ const it = t.closest('.task-item'); return (it && it.parentElement === s) ? it : null; } return s; }
  function fxOf(h){
    let f = h.querySelector(':scope > .aw-fx, :scope > .pt-decor > .aw-fx'); if(f) return f;
    f = document.createElement('span'); f.className = 'aw-fx'; f.setAttribute('aria-hidden', 'true'); f.innerHTML = '<i class="aw-glow"></i><i class="aw-rim"></i><i class="aw-ring"></i>';
    (h.querySelector(':scope > .pt-decor') || h).appendChild(f); return f;
  }
  function paint(){
    raf = 0; if(!host || !fx || !host.isConnected){ off(); return; }
    const r = host.getBoundingClientRect(), x = px - r.left, y = py - r.top;
    fx.style.setProperty('--aw-x', f1(x) + 'px'); fx.style.setProperty('--aw-y', f1(y) + 'px');
  }
  function f1(n){ return Math.round(n * 10) / 10; }
  function queue(e){ px = e.clientX; py = e.clientY; if(!raf) raf = requestAnimationFrame(paint); }
  function on(h){ if(host === h) return; off(); host = h; fx = fxOf(h); h.classList.add('aw-lit'); fx.classList.add('is-on'); }
  function off(){
    if(raf){ cancelAnimationFrame(raf); raf = 0; }
    if(host){ host.classList.remove('aw-lit', 'aw-touch'); }
    if(fx){ fx.classList.remove('is-on', 'is-touch'); }
    host = null; fx = null;
  }
  function ring(e){
    if(!fx || calm()) return; const r = host.getBoundingClientRect();
    fx.style.setProperty('--aw-rx', f1(e.clientX - r.left) + 'px'); fx.style.setProperty('--aw-ry', f1(e.clientY - r.top) + 'px');
    fx.classList.remove('is-ring'); void fx.offsetWidth; fx.classList.add('is-ring');
  }
  function release(){ if(press){ press.classList.remove('aw-press'); press = null; } }
  function down(e){
    const s = surfaceOf(e.target); if(!s) return;
    const b = e.target.closest(PRESS); if(b && s.contains(b) && !b.disabled){ release(); press = b; b.classList.add('aw-press'); }
    const h = hostOf(e.target, s); if(!h) return;
    on(h); queue(e); ring(e);
    if(e.pointerType !== 'mouse'){ pid = e.pointerId; host.classList.add('aw-touch'); fx.classList.add('is-touch'); }
  }
  function move(e){
    if(e.pointerType === 'mouse'){
      const s = surfaceOf(e.target), h = s ? hostOf(e.target, s) : null;
      if(!h){ if(host) off(); return; }
      on(h); queue(e); return;
    }
    if(pid !== e.pointerId || !host) return;
    /* الإصبع خرج من المضيف ⇒ الضوء يتوقف عند حدوده (لا حركة خارج الخشب) */
    const r = host.getBoundingClientRect();
    if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){ off(); pid = null; release(); return; }
    queue(e);
  }
  function up(e){
    release();
    if(e.pointerType !== 'mouse'){ if(pid === e.pointerId || pid === null){ pid = null; off(); } return; }
    if(host){ host.classList.remove('aw-touch'); if(fx) fx.classList.remove('is-touch'); }
  }
  function cancel(){ release(); pid = null; off(); }
  function out(e){ if(e.pointerType !== 'mouse' || !host) return; const to = e.relatedTarget; if(!to || !host.contains(to)) off(); }
  try{
    const o = { passive:true, capture:true };
    document.addEventListener('pointerdown', down, o);
    document.addEventListener('pointermove', move, o);
    document.addEventListener('pointerup', up, o);
    document.addEventListener('pointercancel', cancel, o);
    document.addEventListener('pointerout', out, o);
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) cancel(); });
  }catch(e){}
  return { state:()=>({ host:host ? (host.id || host.className) : null, touch:pid !== null, press:!!press }), reset:cancel };
})();
