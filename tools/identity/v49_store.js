/* ===== CODIS-V49: المباعة والمستخدمة — ورقة مستقلة مثل «بحوزتك» (شريط علوي لاصق: تبويبان + بحث + مرشّحات أقسام). عرض فقط: القراءة من econClosedRows/econMostUsed/hcdTaskLogHtml كما كانت ===== */
let econClosedSec = 'all', econClosedQ = '';
const ECON_CLOSED_LIMIT = 200;
function econClosedNorm(t){ return String(t || '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه'); }
function econClosedParts(){
  const rows = econClosedRows(), u = econClosedUnread(rows), v = econClosedView;
  const desc = (a, b)=>a.t < b.t ? 1 : a.t > b.t ? -1 : 0, of = st=>rows.filter(r=>r.st === st).sort(desc);
  const sold = of('sold'), used = of('used'), expired = of('expired'), silver = of('silver');
  const top = v === 'used' ? econMostUsed(rows) : [], tasks = v === 'used' ? hcdTaskLogHtml() : '';
  const ICO = { sold:codisIcon('coin'), used:ICONS.check };
  const tab = (id, label, n)=>'<button type="button" role="tab" id="eco-ctab-' + id + '" aria-controls="eco-cpanel" class="eco-ctab hx-tab' + (v === id ? ' is-on' : '') + '" aria-selected="' + (v === id ? 'true' : 'false') + '" tabindex="' + (v === id ? '0' : '-1') + '" onclick="econClosedSetView(\'' + id + '\')">' +
    '<span class="hx-ti" aria-hidden="true">' + ICO[id] + '</span><span class="hx-tl">' + label + '</span><span class="hx-tc">' + econFmt(n) + '</span>' +
    (u[id] ? '<span class="eco-hist-n eco-ctab-n" aria-label="' + escapeHtml(econFmt(u[id]) + ' غير مقروء') + '">' + econFmt(u[id]) + '</span>' : '') + '</button>';
  const sec = (key, title, n, inner, cls)=>'<section class="hx-sec' + (cls ? ' ' + cls : '') + '" data-sec="' + key + '"><h4 class="hx-h"><span>' + title + '</span>' + (n !== null ? '<span class="hx-hn">' + econFmt(n) + '</span>' : '') + '</h4>' + inner + '</section>';
  const listOf = (list, cls)=>'<div class="ios-list eco-log hx-list' + (cls ? ' ' + cls : '') + '">' + list.slice(0, ECON_CLOSED_LIMIT).map(r=>r.html).join('') + '</div>' + (list.length > ECON_CLOSED_LIMIT ? '<p class="hx-more">يُعرض آخر ' + econFmt(ECON_CLOSED_LIMIT) + ' من ' + econFmt(list.length) + ' — استعمل البحث للوصول لأي عنصر</p>' : '');
  let body = '', chips = [];
  if(v === 'sold'){
    const total = sold.reduce((q, r)=>q + (r.coins || 0), 0);
    body = sold.length ? '<div class="hx-stat"><span>مجموع ما بعته</span><b class="eco-up" dir="ltr">+' + econFmt(total) + '</b></div>' + sec('log', 'سجل البيع', sold.length, listOf(sold))
      : '<div class="hx-empty">ما في مكافآت مباعة بعد — اللي تبيعه من «بحوزتك» يظهر هنا بقيمته وتاريخه.</div>';
  } else {
    const RANK = ['الأكثر استخداماً', 'ثاني أكثر استخداماً', 'ثالث أكثر استخداماً'];
    if(top.length) body += sec('top', 'الأكثر استخداماً', null, '<ol class="hx-rank">' + top.slice(0, 5).map((e, i)=>'<li class="hx-rk' + (i < 3 ? ' is-top is-' + (i + 1) : '') + '"><span class="hx-rn" aria-hidden="true">' + (i + 1) + '</span>' +
      '<span class="hx-rm"><span class="hx-rname">' + escapeHtml(e.name) + '</span><span class="hx-rsub">' + escapeHtml((i < 3 ? RANK[i] + ' · ' : '') + e.type) + '</span></span><b class="hx-rc"><span dir="ltr">×' + econFmt(e.n) + '</span><small>' + (e.n === 1 ? 'مرة' : 'مرات') + '</small></b></li>').join('') + '</ol>', 'hx-top');
    body += used.length ? sec('log', 'سجل الاستخدام', used.length, listOf(used)) : '<div class="hx-empty">ما في مكافآت مستخدمة بعد — لما تستخدم مكافأة أو بطاقة تظهر هنا.</div>';
    if(expired.length) body += sec('exp', 'انتهت صلاحيتها', expired.length, listOf(expired, 'is-expired'), 'hx-exp');
    if(tasks) body += '<div class="hx-sec" data-sec="tasks">' + tasks + '</div>';
    if(silver.length) body += sec('silver', 'سجل الفضة', silver.length, listOf(silver));
    chips = [['top', 'الأكثر استخداماً', Math.min(top.length, 5)], ['log', 'السجل', used.length], ['exp', 'المنتهية', expired.length], ['tasks', 'المهام', tasks ? 1 : 0], ['silver', 'الفضة', silver.length]].filter(c=>c[2] > 0);
  }
  if(econClosedSec !== 'all' && !chips.some(c=>c[0] === econClosedSec)) econClosedSec = 'all';
  const chipHtml = chips.length > 1 ? '<div class="hx-chips" role="group" aria-label="أقسام السجل"><button type="button" class="hx-chip' + (econClosedSec === 'all' ? ' is-on' : '') + '" data-sec="all" onclick="econClosedSetSec(\'all\')">الكل</button>' +
    chips.map(c=>'<button type="button" class="hx-chip' + (econClosedSec === c[0] ? ' is-on' : '') + '" data-sec="' + c[0] + '" onclick="econClosedSetSec(\'' + c[0] + '\')">' + c[1] + (c[0] === 'tasks' ? '' : '<b>' + econFmt(c[2]) + '</b>') + '</button>').join('') + '</div>' : '';
  const tools = '<div class="hx-tool"><div class="eco-ctabs hx-tabs" role="tablist" aria-label="المباعة والمستخدمة">' + tab('sold', 'المباعة', sold.length) + tab('used', 'المستخدمة', used.length) + '</div>' +
    '<label class="hx-search"><span class="sr">بحث في السجل</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>' +
    '<input type="search" class="hx-q" id="eco-closed-q" placeholder="ابحث بالاسم…" autocomplete="off" enterkeyhint="search" value="' + escapeHtml(econClosedQ) + '" oninput="econClosedFind(this.value)"></label>' + chipHtml + '</div>';
  return { tools:tools, body:'<div class="hx-panel" id="eco-cpanel" role="tabpanel" aria-labelledby="eco-ctab-' + v + '" data-sec="' + econClosedSec + '">' + body + '<div class="hx-nores" hidden>لا توجد نتائج مطابقة</div></div>' };
}
function econClosedApplyFilter(){
  const p = document.getElementById('eco-cpanel'); if(!p) return;
  const q = econClosedNorm(econClosedQ).trim(), items = p.querySelectorAll('.eco-log-row, .hx-rk');
  let vis = 0;
  Array.prototype.forEach.call(items, el=>{ const hide = !!q && econClosedNorm(el.textContent).indexOf(q) === -1; if(el.hidden !== hide) el.hidden = hide;
    const s = el.closest('.hx-sec'); if(!hide && (econClosedSec === 'all' || (s && s.getAttribute('data-sec') === econClosedSec))) vis++; });
  const nr = p.querySelector('.hx-nores'); if(nr) nr.hidden = !(q && items.length && !vis);
}
function econClosedPaint(){
  const t = document.getElementById('eco-closed-tools'), b = document.getElementById('eco-closed-body'); if(!t || !b) return;
  const m = econClosedParts(); t.innerHTML = m.tools; b.innerHTML = m.body; econClosedApplyFilter();
}
function econClosedSheetHtml(){
  return '<div id="eco-closed-sheet" class="own-sheet hx-sheet' + (econClosedOpen ? ' is-open' : '') + '" role="dialog" aria-modal="true" aria-label="المباعة والمستخدمة"><div class="hx-head"><div class="own-sheet-bar"><button type="button" class="own-sheet-close" onclick="econCloseClosed()">' + codisIcon('back') + '<span>رجوع للمتجر</span></button><span class="own-sheet-title">المباعة والمستخدمة</span></div><div id="eco-closed-tools"></div></div><div class="own-sheet-body" id="eco-closed-body"></div></div>';
}
function econClosedBadge(){
  const b = document.querySelector('#eco-store-body .eco-hist-btn'); if(!b) return;
  const n = econClosedCount(); let e = b.querySelector('.eco-hist-n');
  if(!n){ if(e) e.remove(); return; }
  if(!e){ e = document.createElement('span'); e.className = 'eco-hist-n'; e.setAttribute('aria-hidden', 'true'); b.appendChild(e); }
  e.textContent = econFmt(n);
}
function econClosedBtnState(){ const b = document.querySelector('#eco-store-body .eco-hist-btn'); if(b) b.setAttribute('aria-expanded', econClosedOpen ? 'true' : 'false'); }
function econOpenClosed(){
  if(econClosedOpen) return;
  const s = document.getElementById('eco-closed-sheet'); if(!s) return;
  econClosedOpen = true; econClosedQ = ''; econClosedSec = 'all';
  const u = econClosedUnread(); econClosedView = (u.sold > 0 && u.used === 0) ? 'sold' : (u.used > 0 ? 'used' : econClosedView);
  codisSfx('open', { ctx:'store' }); econClosedPaint(); econClosedMarkSeen(econClosedView); econClosedBadge(); econClosedBtnState();
  s.classList.remove('is-closing'); s.classList.add('is-open'); s.scrollTop = 0;
  const c = s.querySelector('.own-sheet-close'); if(c){ try{ c.focus({ preventScroll:true }); }catch(x){} }
}
function econCloseClosed(){
  if(!econClosedOpen) return;
  econClosedOpen = false; codisSfx('close', { ctx:'store' }); econClosedBtnState();
  const s = document.getElementById('eco-closed-sheet');
  if(s){ s.classList.remove('is-open'); if(!econCalm()){ s.classList.add('is-closing'); setTimeout(()=>{ s.classList.remove('is-closing'); }, 360); } }
  const b = document.querySelector('#eco-store-body .eco-hist-btn'); if(b){ try{ b.focus({ preventScroll:true }); }catch(x){} }
}
function econToggleClosed(){ if(econClosedOpen) econCloseClosed(); else econOpenClosed(); }
function econClosedSetView(v){
  if(v !== 'sold' && v !== 'used') return; econClosedView = v; econClosedSec = 'all'; codisSfx('press', { ctx:'tab' });
  econClosedPaint(); econClosedMarkSeen(v); econClosedBadge();
  const s = document.getElementById('eco-closed-sheet'); if(s) s.scrollTop = 0;
}
function econClosedSetSec(k){
  econClosedSec = k; codisSfx('press', { ctx:'tab' });
  const p = document.getElementById('eco-cpanel'); if(p) p.setAttribute('data-sec', k);
  Array.prototype.forEach.call(document.querySelectorAll('#eco-closed-tools .hx-chip'), c=>c.classList.toggle('is-on', c.getAttribute('data-sec') === k));
  econClosedApplyFilter(); const s = document.getElementById('eco-closed-sheet'); if(s) s.scrollTop = 0;
}
function econClosedFind(q){ econClosedQ = String(q || ''); econClosedApplyFilter(); }

/* ===== CODIS-V49: سجل أقسام المتجر المركزي =====
   قسم جديد = استدعاء econStoreRegister واحد: { key, domId, name, icon, order, html(), count(), enabled() }.
   الشريط والمسرح (جزء .st-pane لكل قسم) وتحديد النشط وذاكرة التمرير والتبديل كلها تقرأ هذا السجل ولا تعرف أسماء الأقسام. الاختيار حالة واجهة فقط (لا يُحفظ). */
const ECON_STORE_SECTIONS = [];
function econStoreRegister(d){
  const i = ECON_STORE_SECTIONS.findIndex(x=>x.key === d.key);
  if(i >= 0) ECON_STORE_SECTIONS[i] = d; else ECON_STORE_SECTIONS.push(d);
  ECON_STORE_SECTIONS.sort((a, b)=>a.order - b.order);
}
econStoreRegister({ key:'cards', domId:'eco-cards', name:'الكروت', icon:'shop_cards', order:10, count:()=>econStoreCardRows().length, html:()=>econShopHtml() });
econStoreRegister({ key:'boxes', domId:'eco-boxes', name:'البكجات', icon:'shop_packs', order:20, count:()=>CodisBoxes.tiers().length, html:()=>codisFreeBoxStoreHtml() + econBoxesHtml() });
econStoreRegister({ key:'cosmetics', domId:'eco-cosmetics', name:'المظاهر', icon:'shop_skins', order:30, count:()=>CodisCosmetics.defs().length, html:()=>econCosmeticsShopHtml() });
let econStorePart = 'cards', econStoreScrollPos = {}, econStoreBound = false;
function econStoreSections(){ return ECON_STORE_SECTIONS.filter(d=>{ try{ return d.enabled ? d.enabled() !== false : true; }catch(e){ return false; } }); }
function econStorePartOf(x){ const L = econStoreSections(); for(let i = 0; i < L.length; i++){ if(L[i].key === x || L[i].domId === x) return L[i]; } return L[0] || null; }
function econStoreDefaultKey(){ const L = econStoreSections(); return L.length ? L[0].key : 'cards'; }
function econStoreNavHtml(){
  const cur = (econStorePartOf(econStorePart) || {}).key;
  return '<nav class="st-rail" aria-label="أقسام المتجر">' + econStoreSections().map(d=>{ const on = d.key === cur; let c = 0; try{ c = d.count ? d.count() : 0; }catch(e){}
    return '<button type="button" class="st-rail-b' + (on ? ' is-on' : '') + '" data-part="' + d.key + '" data-to="' + d.domId + '" data-tip="' + d.name + '" aria-label="' + d.name + (c ? ' — ' + econFmt(c) : '') + '" aria-controls="pane-' + d.key + '"' + (on ? ' aria-current="true"' : '') + ' onclick="econStoreSetPart(\'' + d.key + '\')">' + codisIcon(d.icon) + (c ? '<span class="st-rail-n" aria-hidden="true">' + econFmt(c) + '</span>' : '') + '</button>'; }).join('') + '</nav>';
}
function econStoreStageHtml(){
  const cur = (econStorePartOf(econStorePart) || {}).key;
  return '<div class="st-stage" id="eco-store-stage" data-part="' + cur + '">' + econStoreSections().map(d=>'<div class="st-pane' + (d.key === cur ? ' is-on' : '') + '" id="pane-' + d.key + '" data-part="' + d.key + '">' + d.html() + '</div>').join('') + '</div>';
}
/* المسرح هو المُمرِّر الوحيد؛ .main لا يتحرك أثناء المتجر */
function econStoreScroller(){ return document.getElementById('eco-store-stage') || document.querySelector('.main') || document.getElementById('page-settings'); }
let econStoreAnchor = {};
/* مرساة = أول بلاطة ظاهرة + إزاحتها: ارتفاعات البلاطات البعيدة (content-visibility) تتغير بعد إعادة الرسم فلا يصلح الموضع بالبكسل وحده */
function econStoreScrollSave(){
  const st = document.getElementById('eco-store-stage'); if(!st || st.offsetParent === null) return;
  const k = econStorePart, top = st.scrollTop; econStoreScrollPos[k] = top; econStoreAnchor[k] = null; if(!top) return;
  const pane = document.getElementById('pane-' + k); if(!pane) return;
  const sy = st.getBoundingClientRect().top, L = pane.querySelectorAll('[role="listitem"]');
  for(let i = 0; i < L.length; i++){ const r = L[i].getBoundingClientRect(); if(r.height && r.bottom > sy + 1){ econStoreAnchor[k] = { i:i, off:sy - r.top }; break; } }
}
function econStoreRailFit(){
  const r = document.querySelector('#eco-store-body .st-rail'); if(!r) return;
  r.classList.remove('is-scroll'); if(r.scrollHeight > r.clientHeight + 1) r.classList.add('is-scroll');
}
/* يطابق الواجهة مع econStorePart: أصناف/خصائص فقط بلا إعادة بناء */
function econStoreNavSync(){
  const box = document.getElementById('eco-store-body'); if(!box) return;
  const d = econStorePartOf(econStorePart); if(!d) return; econStorePart = d.key;
  const stage = box.querySelector('.st-stage'); if(stage && stage.getAttribute('data-part') !== d.key) stage.setAttribute('data-part', d.key);
  Array.prototype.forEach.call(box.querySelectorAll('.st-pane'), p=>{ const on = p.getAttribute('data-part') === d.key; if(p.classList.contains('is-on') !== on) p.classList.toggle('is-on', on); });
  Array.prototype.forEach.call(box.querySelectorAll('.st-rail-b'), b=>{ const on = b.getAttribute('data-part') === d.key; if(b.classList.contains('is-on') === on) return; b.classList.toggle('is-on', on); if(on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
}
function econStoreBindOnce(){
  if(econStoreBound) return; const box = document.getElementById('eco-store-body'); if(!box) return; econStoreBound = true;
  ['touchstart', 'wheel', 'pointerdown', 'keydown'].forEach(t=>box.addEventListener(t, ()=>{ econStoreTouched = true; }, { passive:true, capture:true }));
  box.addEventListener('scroll', e=>{ const t = e.target; if(t && t.id === 'eco-store-stage') econStoreScrollPos[econStorePart] = t.scrollTop; }, { passive:true, capture:true });
  window.addEventListener('resize', econStoreRailFit, { passive:true });
}
/* استعادة الموضع: الأقسام البعيدة (content-visibility) ترسم بارتفاع مبدئي أصغر ثم تكبر، فيُقصّ الموضع المطلوب؛ نعيد ضبطه بضع مرات قصيرة ما لم يلمس المستخدم المسرح */
let econStoreRestoreTok = 0, econStoreTouched = false;
function econStoreRestorePos(key){
  const st = document.getElementById('eco-store-stage'); if(!st) return;
  const px = econStoreScrollPos[key] || 0, an = econStoreAnchor[key], tok = ++econStoreRestoreTok; econStoreTouched = false;
  const target = ()=>{ const s2 = document.getElementById('eco-store-stage'); if(!s2) return px; const pane = document.getElementById('pane-' + key), el = an && pane ? pane.querySelectorAll('[role="listitem"]')[an.i] : null;
    if(el && el.getBoundingClientRect().height) return Math.max(0, Math.round(el.getBoundingClientRect().top - s2.getBoundingClientRect().top + s2.scrollTop + an.off)); return px; };
  st.scrollTop = target();
  if(!px) return;
  [60, 160, 320, 600, 1000].forEach(ms=>setTimeout(()=>{ const s2 = document.getElementById('eco-store-stage'); if(tok !== econStoreRestoreTok || econStoreTouched || !s2 || econStorePart !== key) return; const w = target(); if(Math.abs(s2.scrollTop - w) > 1) s2.scrollTop = w; }, ms));
}
function econStoreAfterRender(closedKeep){
  econStoreNavSync();
  econStoreRestorePos(econStorePart);
  econStoreRailFit(); econStoreBindOnce();
  if(econClosedOpen){ econClosedPaint(); const cs = document.getElementById('eco-closed-sheet'); if(cs && closedKeep) cs.scrollTop = closedKeep; }
}
/* opts: quiet (بلا صوت) · top (ابدأ من أعلى القسم) · force */
function econStoreSetPart(part, opts){
  opts = opts || {}; const d = econStorePartOf(part), box = document.getElementById('eco-store-body'); if(!d) return;
  const same = econStorePart === d.key;
  if(!opts.quiet) codisSfx('press', { ctx:'tab' });
  const st = document.getElementById('eco-store-stage');
  if(same && !opts.force){
    if((opts.top || !opts.quiet) && st){ econStoreScrollPos[d.key] = 0; econStoreAnchor[d.key] = null; try{ st.scrollTo({ top:0, behavior:econCalm() ? 'auto' : 'smooth' }); }catch(x){ st.scrollTop = 0; } }   /* نقرة ثانية على الأيقونة النشطة = إلى أعلى القسم */
    return;
  }
  econStoreScrollSave(); econStorePart = d.key;
  if(!box) return;
  box.classList.remove('is-enter');   /* حركة الدخول الأولى لا تتكرر مع كل تبديل؛ للقسم حركته الخاصة */
  econStoreNavSync();
  if(opts.top){ econStoreScrollPos[d.key] = 0; econStoreAnchor[d.key] = null; }
  econStoreRestorePos(d.key);
  const pane = document.getElementById('pane-' + d.key);
  if(pane){
    Array.prototype.forEach.call(pane.querySelectorAll('.fit-wait'), c=>c.classList.remove('fit-wait'));
    try{ codisFitLazy(pane); }catch(x){}   /* القسم كان display:none فلم تُقَس بطاقاته: تُلاءم الآن */
    if(!econCalm()){ pane.classList.remove('is-part-in'); void pane.offsetWidth; pane.classList.add('is-part-in'); }
  }
  const rb = box.querySelector('.st-rail-b.is-on'); if(rb && box.querySelector('.st-rail.is-scroll')){ try{ rb.scrollIntoView({ block:'nearest' }); }catch(x){} }
}
function econStoreJump(id){ econStoreSetPart(id); }   /* توافق: كان تمريراً إلى الموضع */
function econGoBoxes(){ econCloseOwn(); econCloseClosed(); econStoreSetPart('boxes', { quiet:true, top:true }); }   /* يعمل من أي قسم */
