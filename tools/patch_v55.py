"""CODIS-V55 (3.42.0) — تدقيق قسم الكروت بالمتجر + «بحوزتك» بأقسام مستقلة (عرض/تنقل فقط).
  لا يمسّ: CodisInventory/CodisPasses/CodisHolidayCards/CodisPouches/CodisCosmetics/CodisBoxes/CodisEconomy/CodisWallet،
  مفاتيح التخزين، الأسعار، قواعد البيع/الاستخدام/التفكيك، الصلاحيات، الاحتمالات.
  1) الكروت (#pane-cards): مصدر CSS واحد نهائي (tools/identity/v55.css) + إزالة القواعد المتعارضة من مصدرها في v49/v50
     (سطران مقابل ثلاثة، فجوتان، زر العطلة الملتف). الزر: سعر بسطر واحد، و«ينقصك/الأسبوع القادم/جارٍ الشراء» بسطرين مكدّسين.
  2) منطق العرض: رسالة «المتجر فاضي» كانت تعتمد r.it فتظهر مع وجود بطاقات عطلة فقط؛ وصف نطاق السعر الأخير كان
     يكتب الحد الأعلى 40,000 حتى لسعر أعلى منه.
  3) «بحوزتك»: شريط أقسام عمودي (tablist) + قسم واحد ظاهر (tools/identity/v55_own.js) بحالة وذاكرة تمرير مستقلة عن المتجر.
  4) econOwnTotals: البطاقات المنتهية المعروضة (حتى 8، نفس سياسة hcdInvTilesHtml) تُعدّ بحقل مستقل hcDead وتدخل المجموع
     فلا يُمنع الوصول إليها؛ hc (الصالحة) كما هو.
  py -3 tools/patch_v55.py <ناتج patch_v54 قبل boot_split> <out>   (sh tools/rebuild_v55.sh)"""
import sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V55' not in s and 'CODIS-V54' in s, 'needs v54 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:160])
    s = s.replace(old, new)
def fn_span(name):
    m = [x.start() for x in re.finditer(r'(?m)^function ' + re.escape(name) + r'\(', s)]
    assert len(m) == 1, ('fn count', name, len(m))
    i = m[0]; j = s.index('{', i); d = 0; k = j
    while True:
        c = s[k]
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: break
        k += 1
    return i, k + 1
def replace_fn(name, new):
    global s
    i, j = fn_span(name); s = s[:i] + new + s[j:]
def drop_fn(name, comment_before=None):
    global s
    i, j = fn_span(name)
    if s[j] == '\n': j += 1
    if comment_before:
        assert s[:i].endswith(comment_before + '\n'), ('comment', name); i -= len(comment_before) + 1
    s = s[:i] + s[j:]

css = rd('identity', 'v55.css'); own = rd('identity', 'v55_own.js')
assert '</style' not in css and '<!--' not in css and '</script' not in own

# ---------- 1) CSS: إزالة القواعد المتعارضة من مصدرها ----------
def css_block(sid):
    i = s.index('<style id="%s">' % sid); return i, s.index('</style>', i)
def css_edit(sid, old, new):
    global s
    i, j = css_block(sid); blk = s[i:j]
    assert blk.count(old) == 1, ('css anchor', sid, blk.count(old), old)
    s = s[:i] + blk.replace(old, new) + s[j:]
# v49: المتغيرات + الاسم + أحجام الزر (تعريفها النهائي في v55 بخصوصية تغلب :is() .btn لـv50)
css_edit('codis-v49-css', '#pane-cards{ --tile-name:10px; --tile-sub:8.5px; --tile-btn-h:28px; --tile-gap:6px; --tile-row-gap:12px; }', '/* CODIS-V55: متغيرات #pane-cards انتقلت إلى v55 */')
css_edit('codis-v49-css', '#pane-cards .store-row{ grid-template-columns:repeat(4, minmax(0, 1fr)); gap:var(--tile-row-gap) var(--tile-gap); }\n', '')
css_edit('codis-v49-css', '#pane-cards .st-tile{ gap:4px; }\n', '')
css_edit('codis-v49-css', '#pane-cards .st-tile .shop-name{ -webkit-line-clamp:2; line-height:1.3; }\n', '')
css_edit('codis-v49-css', '#pane-cards .st-tile .btn{ padding:0 3px; font-size:10.5px; gap:2px; }\n', '')
css_edit('codis-v49-css', '#pane-cards .st-tile .btn .eco-coin{ font-size:11px; gap:2px; }\n', '')
css_edit('codis-v49-css', '#pane-cards .st-tile .btn svg{ width:11px; height:11px; }\n', '')
# v50: الفجوة المكررة + ثلاثة أسطر + التفاف زر العطلة (38px بدل 30px لزر المكافأة)
css_edit('codis-v50-css', '#pane-cards{ --tile-gap:9px; --tile-row-gap:14px; }', '/* CODIS-V55: الفجوات في v55 */')
css_edit('codis-v50-css', '#pane-cards .st-tile .shop-name, #eco-store-body .st-tile .shop-name{ -webkit-line-clamp:3; line-clamp:3; line-height:1.35; overflow-wrap:anywhere; }', '/* CODIS-V55: أسطر الاسم في v55 (سطران بارتفاع محجوز) */')
css_edit('codis-v50-css', '#eco-store-body .btn.cos-buy, #eco-store-body .btn.hcd-buy{', '#eco-store-body .btn.cos-buy{')
i, j = css_block('codis-v54-css'); j = j + len('</style>')
s = s[:j] + '\n<style id="codis-v55-css">\n/* CODIS-V55 */\n' + css + '</style>' + s[j:]

# ---------- 2) المتجر: الأزرار + الرسالة الفارغة + وصف النطاق ----------
replace_fn('econShopInnerHtml', r"""function econShopInnerHtml(rows){
  const bal = data.wallet.balance; rows = rows || econStoreCardRows();
  /* CODIS-V55: كانت rows.some(r=>r.it) ⇒ «فاضي» تظهر مع وجود بطاقات عطلة فقط (لها hk لا it) */
  const empty = rows.length ? '' : '<div class="eco-empty st-empty">المتجر فاضي — أضف مكافآت مفعّلة من الإعدادات ← المكافآت</div>';
  const groups = []; rows.forEach(r=>{ const b = econPriceBand(r.p); (groups[b] = groups[b] || []).push(r); });
  let i = 0, html = '';
  groups.forEach((g, b)=>{
    const lo = b ? ECON_PRICE_BANDS[b - 1] + 1 : 0, top = ECON_PRICE_BANDS[b], hi = g.reduce((m, r)=>Math.max(m, r.p), 0);
    /* المجموعة الأخيرة تضم كل ما فوق حدها ⇒ «من … فأكثر» بدل حد أعلى غير صحيح */
    const lab = hi > top ? 'من ' + econFmt(lo) + ' كوين فأكثر' : econFmt(lo) + '–' + econFmt(top) + ' كوين';
    html += '<div class="store-row st-pg" role="list" data-band="' + b + '" aria-label="' + escapeHtml(lab) + '">' +
      g.map(r=>r.hk ? hcdStoreTileHtml(r.hk, bal, i++) : econStoreCardHtml(r.it, econRarityById(r.it.rarity), bal, i++)).join('') + '</div>';
  });
  return empty + html;
}
/* CODIS-V55: محتوى زر الشراء — السعر بسطر واحد (العملة ملتصقة بالرقم) أو سطران مكدّسان (تسمية صغيرة + قيمة) */
function econBuyStack(k, v){ return '<span class="sb2"><span class="sb-k">' + k + '</span><span class="sb-v">' + v + '</span></span>'; }
function econBuyLen(n){ return String(econFmt(n)).length; }
/* CODIS-V55: WebKit يضع نقاط -webkit-line-clamp بمكان خاطئ حين يخلط السطر عربياً ولاتينياً («…AX 3D» بدل «IMAX 3D…»).
   الاسم المختلط يُقصّ بلا نقاط ويُطمس طرفه بنهاية القراءة، فقط إذا فاض فعلاً (يُقاس بعد الرسم/التبديل) */
function codisNameCls(n){ n = String(n || ''); if(!(/[؀-ۿ]/.test(n) && /[A-Za-z]/.test(n))) return ''; const f = n.match(/[؀-ۿA-Za-z]/); return ' is-bidi' + (f && /[A-Za-z]/.test(f[0]) ? ' is-ltr' : ''); }
function codisNameCutSync(root){
  if(!root) return; const L = root.querySelectorAll('.shop-name.is-bidi'); if(!L.length) return;
  const cut = Array.prototype.map.call(L, e=>e.clientHeight > 0 && e.scrollHeight > e.clientHeight + 1);   /* قراءة كلها ثم كتابة */
  Array.prototype.forEach.call(L, (e, i)=>{ if(e.clientHeight > 0 && e.classList.contains('is-cut') !== cut[i]) e.classList.toggle('is-cut', cut[i]); });
}""")
replace_fn('econStoreCardHtml', r"""function econStoreCardHtml(it, rar, bal, i){
  const price = CodisEconomy.storePrice(it), ok = CodisLimits.afford(bal, price), busy = econBusyId === it.id, id = escapeHtml(it.id), wk = econStoreWeeklyKey(it, rar), mo = econStoreMonthlyKey(it, rar);
  const kind = wk ? 'is-wk' : mo ? 'is-mo' : (econStoreHasArt(it) && codisCardKey({ rarityTone:rar.tone })) ? 'is-dl' : 'is-plain';
  const need = price - bal, label = busy ? econBuyStack('جارٍ', 'الشراء…') : ok ? econCoin(price) : econBuyStack('ينقصك', econFmt(need));
  const buy = '<button type="button" class="btn ' + (ok ? 'btn-primary' : 'btn-secondary') + ' shop-buy' + (busy ? ' is-busy' : '') + '" data-len="' + econBuyLen(ok ? price : need) + '" ' + (ok && !busy ? '' : 'disabled aria-disabled="true"') +
    ' aria-label="' + escapeHtml('شراء ' + it.name + ' — ' + econFmt(price) + ' كوين' + (busy ? ' — جارٍ الشراء' : ok ? '' : ' — ينقصك ' + econFmt(need))) + '" onclick="econBuy(\'' + id + '\')">' + label + '</button>';
  const back = codisCardBackHtml(it.name, [['الفئة', it.freebox ? 'كرت الصندوق المجاني' : econCardName(it, rar)], ['القسم', it.freebox ? 'الصندوق المجاني' : econRoomLabel(it.room)], ['السعر', econCoin(price), '', true]], { tone:rar.tone, kind:wk ? 'weekly' : mo ? 'monthly' : 'reward', sticker:it.stickerId });   /* CODIS-PAPER-BACK */
  const dur = codisDurBadgeHtml(it);
  return '<div class="shop-card store-card st-tile rar-' + escapeHtml(rar.tone) + (ok ? '' : ' is-short') + '" style="--i:' + (i || 0) + '" role="listitem" data-id="' + id + '">' +
    codisFlipHtml('<span class="store-art is-card ' + kind + '">' + econStoreFaceHtml(it, rar, { price:price }) + '</span>', back, { cls:'store-open', label:it.name + ' — ' + econCardName(it, rar) + ' — ' + econFmt(price) + ' كوين' }) +
    '<div class="st-cap' + (dur ? ' has-dur' : '') + '"><span class="shop-name' + codisNameCls(it.name) + '" dir="auto" title="' + escapeHtml(it.name) + '">' + escapeHtml(it.name) + '</span>' + dur + '</div>' +
    '<div class="store-meta">' + buy + '</div></div>';
}""")
replace_fn('hcdStoreTileHtml', r"""function hcdStoreTileHtml(k, bal, i){
  const H = CodisHolidayCards, d = H.def(k), p = H.price(k), blocked = d.weeklyBuyLimit && H.storeLocked(k), ok = !blocked && CodisLimits.afford(bal, p), busy = econStoreBusy;
  /* CODIS-V55: نفس صندوق زر المكافأة (كان يلتف بسطرين بارتفاع 38–51px مقابل 30px) */
  const label = blocked ? econBuyStack('الأسبوع', 'القادم') : ok ? econCoin(p) : econBuyStack('ينقصك', econFmt(p - bal));
  return '<div class="hcd-shop st-tile' + (ok ? '' : ' is-short') + '" role="listitem" data-kind="' + k + '" style="--i:' + (i || 0) + '">' +
    codisFlipHtml('<div class="st-face">' + hcdCardHtml({ kind:k, status:'owned', expiresAt:'' }, { sub:'', bare:true }) + '</div>', hcdBackHtml(d, { price:p, blocked:blocked }), { label:d.name + ' — ' + econFmt(p) + ' كوين' }) +
    '<div class="st-cap"><span class="shop-name" dir="auto" title="' + escapeHtml(d.name) + '">' + escapeHtml(d.name) + '</span></div>' +
    '<div class="store-meta"><button type="button" class="btn ' + (ok ? 'btn-primary' : 'btn-secondary') + ' hcd-buy' + (busy && ok ? ' is-busy' : '') + '" data-len="' + econBuyLen(ok || blocked ? p : p - bal) + '" ' + (ok && !busy ? '' : 'disabled aria-disabled="true"') +
    ' aria-label="' + escapeHtml('شراء ' + d.name + ' — ' + econFmt(p) + ' كوين' + (blocked ? ' — اشتريتها هذا الأسبوع' : ok ? '' : ' — ينقصك ' + econFmt(p - bal))) + '" onclick="hcdBuy(\'' + k + '\')">' + label + '</button></div></div>';
}""")

# ---------- 3) «بحوزتك» ----------
replace_fn('econOwnTotals', r"""function econOwnTotals(){
  const H = CodisHolidayCards, items = CodisInventory.owned().length, passes = CodisPasses.owned().length, hc = H.usable().length, boxes = CodisBoxes.owned().length, pouches = CodisPouches.owned().length, cosmetics = CodisCosmetics.owned().length;
  /* CODIS-V55: المنتهية المعروضة بالمخزون (نفس حد hcdInvTilesHtml) — عدّاد منفصل؛ ليست صالحة للاستخدام لكنها مقتنيات يجب الوصول إليها (تفكيك) */
  const hcDead = Math.min(H.expired().length, 8), cards = items + passes + hc + hcDead;
  return { items:items, passes:passes, hc:hc, hcDead:hcDead, cards:cards, boxes:boxes, pouches:pouches, cosmetics:cosmetics, total:cards + boxes + pouches + cosmetics };
}""")
drop_fn('econOwnSheetHtml')
drop_fn('econOwnJump', '/* تنقّل داخل ورقة «بحوزتك» (عرض فقط) */')
i, j = fn_span('econInventoryHtml')
s = s[:i] + '/* CODIS-V55 */\n' + own.strip() + s[j:]
# فتح الورقة: القسم (الحالي أو أول قسم فيه مقتنيات) وموضعه، بدل التصفير إلى أول المخزون
rep("""  const go = ()=>{ econOwnOpen = true; const s = document.getElementById('eco-own-sheet'); if(s){ s.classList.add('is-open'); s.scrollTop = 0; const c = s.querySelector('.own-sheet-close'); if(c){ try{ c.focus({ preventScroll:true }); }catch(x){} } } };""",
    """  const go = ()=>{ econOwnOpen = true; const s = document.getElementById('eco-own-sheet'); if(s){ s.classList.add('is-open'); try{ const T = econOwnTotals(), d = econOwnPartOf(econOwnPart); if(!d || d.key !== econOwnPart || !econOwnCount(d, T)) econOwnPart = ''; econOwnPart = econOwnPickPart(T); econOwnSync(); econOwnRestore(); econOwnBindOnce(); codisNameCutSync(document.getElementById('own-panel-' + econOwnPart)); }catch(x){} const c = s.querySelector('.own-sheet-close'); if(c){ try{ c.focus({ preventScroll:true }); }catch(x){} } } };   /* CODIS-V55 */""")
# فتح المتجر من جديد = بداية جديدة لحالة «بحوزتك» (مثل المتجر)
rep("""function econOpenStore(){ econStorePart = econStoreDefaultKey(); econStoreScrollPos = {}; econStoreAnchor = {};""",
    """function econOpenStore(){ econStorePart = econStoreDefaultKey(); econStoreScrollPos = {}; econStoreAnchor = {}; econOwnPart = ''; econOwnScroll = {};   /* CODIS-V55 */""")
# إعادة رسم المتجر: حفظ واستعادة القسم النشط وموضع كل قسم (كان scrollTop واحد للورقة كلها)
rep("""  const ownKeep = (document.getElementById('eco-own-sheet') || {}).scrollTop || 0, closedKeep = (document.getElementById('eco-closed-sheet') || {}).scrollTop || 0;""",
    """  econOwnScrollSave(); const closedKeep = (document.getElementById('eco-closed-sheet') || {}).scrollTop || 0;   /* CODIS-V55 */""")
rep("""  if(ownKeep){ const os = document.getElementById('eco-own-sheet'); if(os) os.scrollTop = ownKeep; }""",
    """  if(document.getElementById('eco-own-stage')){ econOwnBindOnce(); econOwnRestore(); }   /* CODIS-V55: القسم نفسه وموضعه */""")
rep("""  econStoreAfterRender(closedKeep);   /* CODIS-V49: ذاكرة التمرير + ورقة المباعة + الشريط */""",
    """  econStoreAfterRender(closedKeep);   /* CODIS-V49: ذاكرة التمرير + ورقة المباعة + الشريط */
  try{ codisNameCutSync(document.getElementById('pane-' + econStorePart)); codisNameCutSync(document.getElementById('own-panel-' + econOwnPart)); }catch(x){}   /* CODIS-V55 */""")
rep("""    try{ codisFitLazy(pane); }catch(x){}   /* القسم كان display:none فلم تُقَس بطاقاته: تُلاءم الآن */""",
    """    try{ codisFitLazy(pane); }catch(x){}   /* القسم كان display:none فلم تُقَس بطاقاته: تُلاءم الآن */
    try{ codisNameCutSync(pane); }catch(x){}   /* CODIS-V55 */""")

# إغلاق نافذة البكج المفتوحة من «بحوزتك»: التركيز يرجع لبلاطة البكج داخل الورقة (كان يذهب لزر بقسم المتجر المخفي خلفها)
rep("""  const opener = document.querySelector('#eco-boxes .bx-own-chip, #eco-boxes .bx-buy'); if(opener && opener.isConnected){ try{ opener.focus({ preventScroll:true }); }catch(x){} }""",
    """  const opener = econOwnOpen ? (document.querySelector('#own-panel-boxes .bx-own-tile .store-open') || document.getElementById('own-tab-boxes')) : document.querySelector('#eco-boxes .bx-own-chip, #eco-boxes .bx-buy'); if(opener && opener.isConnected){ try{ opener.focus({ preventScroll:true }); }catch(x){} }   /* CODIS-V55 */""")

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v55 applied')
