"""CODIS-V61 (3.48.0) — أداء المتجر + معاينة البكج بشبكة واحدة وبطاقات تنقلب + الصندوق المجاني (جواهر وفضة) + قسائم الصناديق + مكافآت التقدم. فوق ناتج patch_v60 وقبل boot_split.
  py -3 tools/patch_v61.py <ناتج patch_v60 قبل boot_split> <out>   (sh tools/rebuild_v61.sh)
  الأقسام:
  1) الأداء (لا تغيير مرئي): قياس الخانة بدل البطاقة داخل خانات content-visibility (كل قراءة كانت تجبر تخطيطاً منفصلاً لخانة مقفلة ~22ms ×N)،
     إعادة استعمال DOM المتجر إن كان ناتج الرسم مطابقاً حرفياً (أي حفظ بيانات كان يعيد بناء المتجر كاملاً عند فتحه)، وظهر بطاقة المتجر يُبنى عند القلب فقط.
  2) …  (انظر بقية الأقسام أدناه)"""
import sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V61' not in s and 'CODIS-V60' in s, 'needs v60 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:180])
    s = s.replace(old, new)

# ===================== 1) الأداء =====================
# 1a) الخانة (ابن مباشر لقائمة بالمتجر، content-visibility:auto) تُقاس بدل البطاقة داخلها: موضع الخانة لا يحتاج تخطيط محتواها المقفل.
#     كل القراءات أولاً ثم الكتابات. نفس القرار (قريبة ⇒ تُلاءم الآن، بعيدة ⇒ fit-wait وتُلاءم عند ظهورها)
rep("""  for(let i = 0; i < cards.length; i++){ if(skipped.length && skipped.some(s=>s.contains(cards[i]))){ cards[i].classList.add('fit-wait'); continue; } const r = cards[i].getBoundingClientRect(); if(r.width && (r.bottom < -vh * .3 || r.top > vh * 1.3)){ cards[i].classList.add('fit-wait'); far.push(cards[i]); } }""",
"""  /* CODIS-V61: القراءة على الخانة (لا على البطاقة المقفلة داخلها) ثم الكتابة دفعة واحدة — كانت كل قراءة تجبر تخطيطاً منفصلاً (~22ms × كل بطاقة بالمعالج المبطّأ) */
  const rc = new Map(), wait = [];
  for(let i = 0; i < cards.length; i++){
    if(skipped.length && skipped.some(s=>s.contains(cards[i]))){ wait.push(cards[i]); continue; }
    const m = codisCvTileOf(cards[i]) || cards[i]; let r = rc.get(m); if(!r){ r = m.getBoundingClientRect(); rc.set(m, r); }
    if(r.width && (r.bottom < -vh * .3 || r.top > vh * 1.3)){ wait.push(cards[i]); far.push(cards[i]); }
  }
  for(let i = 0; i < wait.length; i++) wait[i].classList.add('fit-wait');""")
rep("function codisFitLazy(root){", r"""/* CODIS-V61: خانة المتجر التي تحمل content-visibility:auto (ابن مباشر لـ[role=list] داخل #eco-store-body) أو null */
function codisCvTileOf(el){
  if(!codisCvOK || !el) return null;
  for(let p = el; p && p.parentElement; p = p.parentElement){ const q = p.parentElement; if(q.getAttribute('role') === 'list') return q.closest('#eco-store-body') ? p : null; if(q.id === 'eco-store-body') return null; }
  return null;
}
function codisFitLazy(root){""")
# الأسماء ثنائية الاتجاه: الخانات البعيدة تُقاس عند ظهورها
rep("""    Array.prototype.forEach.call(w, c=>c.classList.remove('fit-wait')); codisFitRewardCard(t);""",
    """    Array.prototype.forEach.call(w, c=>c.classList.remove('fit-wait')); codisFitRewardCard(t); try{ codisNameCutSync(t); }catch(x){}   /* CODIS-V61 */""")
rep("""  if(!root) return; const L = root.querySelectorAll('.shop-name.is-bidi'); if(!L.length) return;
  const cut = Array.prototype.map.call(L, e=>e.clientHeight > 0 && e.scrollHeight > e.clientHeight + 1);   /* قراءة كلها ثم كتابة */""",
"""  if(!root) return; let L = root.querySelectorAll('.shop-name.is-bidi'); if(!L.length) return;
  /* CODIS-V61: داخل خانة بعيدة (content-visibility) لا قراءة الآن — تُقاس عند ظهورها (codisCvTiles) */
  if(codisCvOK){ const vh = window.innerHeight || 800, rc = new Map(); L = Array.prototype.filter.call(L, e=>{ const m = codisCvTileOf(e); if(!m) return true; let r = rc.get(m); if(!r){ r = m.getBoundingClientRect(); rc.set(m, r); } return !(r.width && (r.bottom < -vh * .3 || r.top > vh * 1.3)); }); if(!L.length) return; }
  const cut = Array.prototype.map.call(L, e=>e.clientHeight > 0 && e.scrollHeight > e.clientHeight + 1);   /* قراءة كلها ثم كتابة */""")

# 1b) CodisArt.put: نفس set لكن من نص جاهز (لمقارنة الناتج قبل لمس DOM)
rep("  return { src:src, hydrate:hydrate, set:set, html:html, full:full, thumb:thumb };",
    "  function put(el, h, o){ el.innerHTML = h; thumbsOn = !!(o && o.thumbs); try{ hydrate(el); } finally { thumbsOn = false; } }   /* CODIS-V61 */\n  return { src:src, hydrate:hydrate, set:set, html:html, put:put, full:full, thumb:thumb };")

# 1c) econRenderStore: ناتج مطابق حرفياً ⇒ نفس DOM (لا innerHTML/فك صور/ملاءمة)، مع إعادة حالات الواجهة كما يفعل البناء الجديد
rep("""  const vlt = document.getElementById('eco-vault'), vwrap = document.querySelector('#settings-page-eco-store .vault-wrap');
  if(vlt && vwrap && vlt.parentNode !== vwrap) vwrap.appendChild(vlt);   /* يخرج قبل استبدال المحتوى فيبقى العنصر نفسه بمستمعاته */
  CodisArt.set(box, ()=>'<div class="settings-card eco-balance'""",
"""  const vlt = document.getElementById('eco-vault'), vwrap = document.querySelector('#settings-page-eco-store .vault-wrap');
  const cosSeq0 = codisCosSeq, ptUid0 = codisPtUid; codisCosSeq = 500000; codisPtUid = 500000;   /* CODIS-V61: معرّفات SVG المظاهر داخل المتجر بنطاق ثابت لكل رسم ⇒ الناتج نفسه يبقى مطابقاً حرفياً (المعرّفات فريدة داخل الرسم، وخارجه العدّاد العام لا يصل هذا النطاق) */
  let hNew; try{ hNew = CodisArt.html(()=>'<div class="settings-card eco-balance'""")
rep("""    '<div class="st-shell">' + econStoreNavHtml() + econStoreStageHtml() + '</div>' + econOwnSheetHtml() + econClosedSheetHtml(), { thumbs:true });   /* CODIS-V49 */
  /* حركة الدخول مرة واحدة عند فتح المتجر (لا تتكرر مع كل إعادة رسم بعد شراء/تصفية) */
  const bal0 = box.querySelector('.eco-balance'); if(vlt && bal0) bal0.appendChild(vlt);
  box.classList.toggle('is-enter', !econCalm() && Date.now() - econStoreEnterAt < 700);
  codisFitLazy(box); codisWatchRewardCards(box); codisFreeBoxSchedule();   /* CODIS-V44 */""",
"""    '<div class="st-shell">' + econStoreNavHtml() + econStoreStageHtml() + '</div>' + econOwnSheetHtml() + econClosedSheetHtml()); } finally { codisCosSeq = cosSeq0; codisPtUid = ptUid0; }   /* CODIS-V49 */
  /* CODIS-V61: الناتج نفسه حرفياً (نفس البيانات ونفس حالة الواجهة) ⇒ DOM الحالي يبقى: لا تحليل HTML ولا فك صور ولا ملاءمة من جديد.
     ما يعيده البناء الجديد للواجهة يُعاد هنا: البطاقات المقلوبة لوجهها، والورقتان حسب حالتهما، وحركة الدخول */
  const reuse = !!(box.firstElementChild && box._codisHtml === hNew && box.querySelector('.st-shell'));
  if(!reuse){
    if(vlt && vwrap && vlt.parentNode !== vwrap) vwrap.appendChild(vlt);   /* يخرج قبل استبدال المحتوى فيبقى العنصر نفسه بمستمعاته */
    CodisArt.put(box, hNew, { thumbs:true }); box._codisHtml = hNew;
  } else {
    Array.prototype.forEach.call(box.querySelectorAll('.cflip.is-flipped, .cflip.is-3d'), el=>{ el.classList.remove('is-flipped', 'is-3d'); el.setAttribute('aria-pressed', 'false'); const f = el.querySelector('.cflip-f'), b = el.querySelector('.cflip-b'); if(f) f.setAttribute('aria-hidden', 'false'); if(b) b.setAttribute('aria-hidden', 'true'); });
    [['eco-own-sheet', econOwnOpen], ['eco-closed-sheet', econClosedOpen]].forEach(p=>{ const e = document.getElementById(p[0]); if(e && e.classList.contains('is-open') !== !!p[1]) e.classList.toggle('is-open', !!p[1]); });
  }
  /* حركة الدخول مرة واحدة عند فتح المتجر (لا تتكرر مع كل إعادة رسم بعد شراء/تصفية) */
  const bal0 = box.querySelector('.eco-balance'); if(vlt && bal0 && vlt.parentNode !== bal0) bal0.appendChild(vlt);
  const enter = !econCalm() && Date.now() - econStoreEnterAt < 700;
  if(reuse && enter){ box.classList.remove('is-enter'); void box.offsetWidth; }
  box.classList.toggle('is-enter', enter);
  if(!reuse){ codisFitLazy(box); codisWatchRewardCards(box); }
  codisFreeBoxSchedule();   /* CODIS-V44 */""")

# 1d) ظهر بطاقة المتجر يُبنى عند القلب فقط (كان ~نصف زمن توليد قسم الكروت: SVG الظهر لكل بطاقة). المفتاح ثابت لكل بلاطة فيبقى الناتج مطابقاً بين الرسمات
rep("""    '<div class="cflip-in"><div class="cflip-f">' + front + '</div><div class="cflip-b" aria-hidden="true">' + (o.eager ? back : '<template class="cflip-lazy">' + back + '</template>') + '</div></div></div>';   /* CODIS-BUTTER */""",
"""    '<div class="cflip-in"><div class="cflip-f">' + front + '</div><div class="cflip-b" aria-hidden="true">' + (o.eager ? (typeof back === 'function' ? back() : back) : (typeof back === 'function' && o.bk ? (codisFlipLazy.set(o.bk, back), '<template class="cflip-lazy" data-bk="' + escapeHtml(o.bk) + '"></template>') : '<template class="cflip-lazy">' + (typeof back === 'function' ? back() : back) + '</template>')) + '</div></div></div>';   /* CODIS-BUTTER · CODIS-V61: back دالة + o.bk مفتاح ثابت ⇒ يُبنى عند القلب */""")
rep("function codisFlipHtml(front, back, o){", "const codisFlipLazy = new Map();   /* CODIS-V61: مفتاح البلاطة ← دالة بناء ظهرها (آخر رسم يكتب فوق السابق) */\nfunction codisFlipHtml(front, back, o){")
rep("""  if(lz){ const bk = lz.parentNode; bk.replaceChild(lz.content, lz); try{ codisHydrateIcons(bk); }catch(e){} }""",
"""  if(lz){ const bk = lz.parentNode, k = lz.getAttribute('data-bk'), fn = k ? codisFlipLazy.get(k) : null;
    if(k){ let h = ''; try{ h = fn ? fn() : ''; }catch(e){ console.error('CODIS card back:', e); } lz.remove(); bk.insertAdjacentHTML('beforeend', h); }   /* CODIS-V61 */
    else bk.replaceChild(lz.content, lz);
    try{ codisHydrateIcons(bk); }catch(e){} }""")
rep("""  const back = codisCardBackHtml(it.name, [['الفئة', it.freebox ? 'كرت الصندوق المجاني' : econCardName(it, rar)], ['القسم', it.freebox ? 'الصندوق المجاني' : econRoomLabel(it.room)], ['السعر', econCoin(price), '', true]], { tone:rar.tone, kind:wk ? 'weekly' : mo ? 'monthly' : 'reward', sticker:it.stickerId });   /* CODIS-PAPER-BACK */""",
"""  const back = ()=>codisCardBackHtml(it.name, [['الفئة', it.freebox ? 'كرت الصندوق المجاني' : econCardName(it, rar)], ['القسم', it.freebox ? 'الصندوق المجاني' : econRoomLabel(it.room)], ['السعر', econCoin(price), '', true]], { tone:rar.tone, kind:wk ? 'weekly' : mo ? 'monthly' : 'reward', sticker:it.stickerId });   /* CODIS-PAPER-BACK · CODIS-V61: يُبنى عند القلب */""")
rep("""back, { cls:'store-open', label:it.name + ' — ' + econCardName(it, rar) + ' — ' + econFmt(price) + ' كوين' }) +""",
    """back, { cls:'store-open', bk:'st|' + it.id, label:it.name + ' — ' + econCardName(it, rar) + ' — ' + econFmt(price) + ' كوين' }) +""")

# ===================== 2) أنواع المعاملات (طرق كسب/صرف جديدة = نوع جديد بقائمة السماح؛ التطبيع والدمج يحفظانها) =====================
rep("'HABIT_LAPSE','HABIT_COMPENSATION']; }", "'HABIT_LAPSE','HABIT_COMPENSATION','PROGRESS_REWARD']; }   /* CODIS-V61: PROGRESS_REWARD = مكافأة تقدم (لا تُستعمل للكوين حالياً) */")
rep("function econSilverTxTypes(){ return ['DISMANTLE_CARD','OPEN_POUCH','PURCHASE_COSMETIC','ADMIN_GRANT']; }",
    "function econSilverTxTypes(){ return ['DISMANTLE_CARD','OPEN_POUCH','PURCHASE_COSMETIC','ADMIN_GRANT','PURCHASE_VOUCHER','FREEBOX_GRANT','PROGRESS_REWARD']; }   /* CODIS-V61: شراء القسائم · الصندوق المجاني · مكافآت التقدم */")
rep("function econGemTxTypes(){ return ['PURCHASE_BOX','ADMIN_GRANT']; }",
    "function econGemTxTypes(){ return ['PURCHASE_BOX','ADMIN_GRANT','FREEBOX_GRANT','PROGRESS_REWARD']; }   /* CODIS-V61: أول طريقتي كسب للجواهر بطلب المالك: الصندوق المجاني + مكافآت التقدم */")

# ===================== 3) البيانات: دفترا القسائم والتقدم (مفتاحان جديدان بالمستوى الأعلى — النسخ الأقدم تتركهما كما هما) + المعاملة الذرّية =====================
rep("  d.loans = codisLoansNorm(d.loans);   /* CODIS-V45: دفتر سلفني (آمن وقت التحميل) */",
    "  d.loans = codisLoansNorm(d.loans);   /* CODIS-V45: دفتر سلفني (آمن وقت التحميل) */\n  d.vouchers = codisVouchersNorm(d.vouchers); d.progress = codisProgressNorm(d.progress);   /* CODIS-V61 (function declarations، لا ترمي) */")
rep("gm = JSON.stringify(gemsW()), fz = JSON.stringify(data.finance || null)", "gm = JSON.stringify(gemsW()), vc = JSON.stringify(data.vouchers || null), pg = JSON.stringify(data.progress || null), fz = JSON.stringify(data.finance || null)")
rep("w.transactions.length = snap.n; w.silver = JSON.parse(sv); w.gems = JSON.parse(gm);   /* CODIS-V60 */",
    "w.transactions.length = snap.n; w.silver = JSON.parse(sv); w.gems = JSON.parse(gm);   /* CODIS-V60 */\n      if(vc !== 'null') data.vouchers = JSON.parse(vc); else delete data.vouchers; if(pg !== 'null') data.progress = JSON.parse(pg); else delete data.progress;   /* CODIS-V61: القسائم والتقدم جزء من نفس المعاملة */")
rep("    if(x.currency === 'GEMS') b.currency = 'GEMS';   /* CODIS-V60 */",
    "    if(x.currency === 'GEMS' || x.currency === 'VOUCHER' || x.currency === 'PROGRESS') b.currency = x.currency;   /* CODIS-V60 · CODIS-V61: مصدر الصندوق */")
rep("if(x.pouchUid) b.pouchUid = String(x.pouchUid);", "if(x.pouchUid) b.pouchUid = String(x.pouchUid); if(x.voucher) b.voucher = String(x.voucher).slice(0, 120);")

# ===================== 4) النواة (قبل CodisBoxes) =====================
core = rd('identity', 'v61_core.js'); assert '</script' not in core and '<!--' not in core
rep("const CodisBoxes = (function(){", "/* ===== CODIS-V61 ===== */\n" + core + "\nconst CodisBoxes = (function(){")

# ===================== 5) الصناديق: القسيمة نتيجة محتملة ضمن السحب نفسه (قسيمة المستوى فقط)، بقيمة مرجعية = سعرها بالفضة × 0.5 =====================
rep("  function valueOf(x){ return x.kind === 'cosmetic' ?", "  function valueOf(x){ return x.kind === 'voucher' ? CodisVouchers.value(x.tier) : x.kind === 'cosmetic' ?")
rep("  const BOX_PRIZE_KINDS = Object.freeze(['pass', 'holiday', 'pouch']);", "  const BOX_PRIZE_KINDS = Object.freeze(['pass', 'holiday', 'pouch', 'voucher']);   /* CODIS-V61: + قسيمة المستوى نفسه */")
rep("  function prizePool(){ return [].concat(CodisPasses.prizes(), CodisHolidayCards.prizes(), CodisPouches.prizes()).filter(prizeAllowed); }",
    "  function prizePool(tierId){ return [].concat(CodisPasses.prizes(), CodisHolidayCards.prizes(), CodisPouches.prizes(), tierId ? CodisVouchers.prizes(tierId) : []).filter(prizeAllowed); }   /* CODIS-V61: قسيمة المستوى ضمن جوائزه فقط */")
rep("  function classes(minV, capV){\n    const lim = capV === undefined || capV === null ? Infinity : capV;\n    const items = prizePool().map(",
    "  function classes(minV, capV, tierId){\n    const lim = capV === undefined || capV === null ? Infinity : capV;\n    const items = prizePool(tierId).map(")
rep("    let cs = classes(minValue(t.id), cap);\n    if(!cs.length){ if(!CodisLimits.bypass('box.empty')) return []; cs = classes(minValue(t.id)); if(!cs.length) return []; }",
    "    let cs = classes(minValue(t.id), cap, t.id);\n    if(!cs.length){ if(!CodisLimits.bypass('box.empty')) return []; cs = classes(minValue(t.id), undefined, t.id); if(!cs.length) return []; }")
rep("  function cosmeticRarity(row){", "  function voucherRarity(row){ return { id:'VOUCHER', name:'قسيمة صندوق', tone:row.tone, order:econTones().indexOf(row.tone) + 1 }; }   /* CODIS-V61 */\n  function cosmeticRarity(row){")
rep("    if(item.kind === 'pouch') return { item:item, pouchType:item.pouchType, rarity:pouchRarity(row), cls:row, pm:row.pm };",
    "    if(item.kind === 'pouch') return { item:item, pouchType:item.pouchType, rarity:pouchRarity(row), cls:row, pm:row.pm };\n    if(item.kind === 'voucher') return item.tier === t.id ? { item:item, voucherTier:item.tier, rarity:voucherRarity(row), cls:row, pm:row.pm } : null;   /* CODIS-V61 */")
rep("    if(!r || !(r.pass || r.pouchType || r.holidayKind) || !prizeAllowed(r.item)) return { ok:false, reason:'kind' };   /* CODIS-V60 */",
    "    if(!r || !(r.pass || r.pouchType || r.holidayKind || r.voucherTier) || !prizeAllowed(r.item)) return { ok:false, reason:'kind' };   /* CODIS-V60 · V61 */")
rep("    let o = null, pass = null, holiday = null, pouch = null, cosmetic = null;", "    let o = null, pass = null, holiday = null, pouch = null, cosmetic = null, voucher = null;")
rep("    } else if(r.pouchType){   /* الجائزة كيس فضة: يُمنح للمخزون فقط ولا يُضاف أي رصيد فضة الآن */",
    """    } else if(r.voucherTier){   /* CODIS-V61: قسيمة المستوى نفسه — حدث بمعرّف الصندوق (لا تُمنح مرتين) + استبدال تلقائي عند 10 بالمعاملة نفسها */
      if(r.voucherTier !== t.id) return { ok:false, reason:'kind' };
      voucher = CodisVouchers.grantInTx({ id:'vx|' + uid, t:'box', tier:r.voucherTier, n:1, ref:uid }); if(!voucher) return { ok:false, reason:'inventory' };
    } else if(r.pouchType){   /* الجائزة كيس فضة: يُمنح للمخزون فقط ولا يُضاف أي رصيد فضة الآن */""")
rep("if(pouch) b.pouchUid = pouch.uid; if(cosmetic) b.cosmeticId = cosmetic.id;", "if(pouch) b.pouchUid = pouch.uid; if(cosmetic) b.cosmeticId = cosmetic.id; if(voucher) b.voucher = voucher.ev.id;")
rep("pass:pass, holiday:holiday, pouch:pouch, cosmetic:cosmetic };\n  }", "pass:pass, holiday:holiday, pouch:pouch, cosmetic:cosmetic, voucher:voucher };\n  }")

# ===================== 6) نتائج الصناديق بالواجهة: القسيمة بكل مسار (الفردي · ×10 · المشهد ثلاثي الأبعاد · المعاينة) =====================
rep("  if(it.kind === 'pouch') return '<div class=\"pk-tile is-pouch\" role=\"listitem\"",
    "  if(it.kind === 'voucher') return '<div class=\"pk-tile is-voucher\" role=\"listitem\" data-id=\"' + escapeHtml(it.id) + '\">' + econVoucherArt(it.tier) + '</div>';   /* CODIS-V61 */\n  if(it.kind === 'pouch') return '<div class=\"pk-tile is-pouch\" role=\"listitem\"")
rep("function econPackPaint(){", "function econPackPaintV28(){   /* CODIS-V61: حلّت محلها econPackPaint (شبكة واحدة + بطاقات تنقلب) — تبقى مرجعاً فقط */")
rep("    } else if(r.pouch){   /* الجائزة كيس فضة: يُعرض ويُضاف للمخزون، ولا تُضاف فضة إلا عند استخدامه من «بحوزتك» */",
    """    } else if(r.voucher){   /* CODIS-V61: قسيمة — تُعرض بتصميمها وتقدّمها نحو الصندوق التالي (والصندوق المكتمل انضاف مغلقاً) */
      const vd = r.voucher.def, tb = CodisBoxes.tier(vd.tier), nb = r.voucher.boxes.length;
      body.innerHTML = '<div class="bx-stage is-done"><div class="bx-reveal bx-pass-art vch-reveal">' + econVoucherArt(vd.tier, { big:true }) + '</div></div>' +
        '<h3 id="econ-box-title" class="bx-reveal">' + escapeHtml(vd.name) + '</h3>' +
        '<p class="store-detail-note" role="status">طلعت من ' + escapeHtml(t.name) + ' · فرصة ' + econPm(r.pm) + ' · ' + (nb ? 'اكتملت ' + econFmt(CodisVouchers.PER_BOX) + ' قسائم — انضاف ' + escapeHtml(tb ? tb.name : 'صندوق') + ' مغلق إلى ممتلكاتك' : 'صار عندك ' + econFmt(r.voucher.have) + ' / ' + econFmt(CodisVouchers.PER_BOX) + ' للصندوق التالي') + '</p>' +
      '<div class="modal-actions">' + (left ? '<button type="button" class="btn btn-achievement" onclick="econBoxNext()">افتح بكجاً آخر (' + econFmt(left) + ')</button>' : '') +
      '<button type="button" class="btn ' + (left ? 'btn-secondary' : 'btn-primary') + '" onclick="econBoxClose()">تمام</button></div>';
    } else if(r.pouch){   /* الجائزة كيس فضة: يُعرض ويُضاف للمخزون، ولا تُضاف فضة إلا عند استخدامه من «بحوزتك» */""")
rep("      else if(r.pouch){ html = '<div class=\"bx-stage is-done\"><div class=\"bx-reveal bx-pass-art\"><div class=\"pch-art is-big\">' + econPouchSvg(r.pouch.type) + '</div></div></div>'; }",
    "      else if(r.voucher){ html = '<div class=\"bx-stage is-done\"><div class=\"bx-reveal bx-pass-art vch-reveal\">' + econVoucherArt(r.voucher.def.tier, { big:true }) + '</div></div>'; }   /* CODIS-V61 */\n      else if(r.pouch){ html = '<div class=\"bx-stage is-done\"><div class=\"bx-reveal bx-pass-art\"><div class=\"pch-art is-big\">' + econPouchSvg(r.pouch.type) + '</div></div></div>'; }")
rep("      else if(r.pouch){ name = CodisPouches.def(r.pouch.type).name; kind = 'كيس فضة'; }",
    "      else if(r.voucher){ name = r.voucher.def.name; kind = 'قسيمة صندوق'; }   /* CODIS-V61 */\n      else if(r.pouch){ name = CodisPouches.def(r.pouch.type).name; kind = 'كيس فضة'; }")
rep("  if(r.pouch) return { name:CodisPouches.def(r.pouch.type).name, chip:sp, special:true, kind:'pouch' };",
    "  if(r.voucher) return { name:r.voucher.def.name, chip:sp, special:true, kind:'voucher' };   /* CODIS-V61 */\n  if(r.pouch) return { name:CodisPouches.def(r.pouch.type).name, chip:sp, special:true, kind:'pouch' };")
rep("  const c = { reward:0, pass:0, holiday:0, pouch:0, cosmetic:0 };", "  const c = { reward:0, pass:0, holiday:0, pouch:0, cosmetic:0, voucher:0 };")
rep("res.items.forEach(r=>{ if(r.cosmetic) c.cosmetic++; else if(r.pouch) c.pouch++;", "res.items.forEach(r=>{ if(r.cosmetic) c.cosmetic++; else if(r.voucher) c.voucher++; else if(r.pouch) c.pouch++;")
rep("if(c.pouch) parts.push(econFmt(c.pouch) + ' كيس فضة');", "if(c.pouch) parts.push(econFmt(c.pouch) + ' كيس فضة'); if(c.voucher) parts.push(econFmt(c.voucher) + ' قسيمة');")
rep("  const KIND = { reward:'مكافأة', pass:'تجاوز عقوبة', holiday:'بطاقة عطلة', pouch:'كيس فضة', cosmetic:'مظهر' };", "  const KIND = { reward:'مكافأة', pass:'تجاوز عقوبة', holiday:'بطاقة عطلة', pouch:'كيس فضة', cosmetic:'مظهر', voucher:'قسيمة صندوق' };")

# ===================== 7) «بحوزتك»: القسائم ضمن «العناصر» (لا عدّ مرتين) =====================
rep("const hcDead = Math.min(H.expired().length, 8), cards = items, elements = pouches + passes + hc + hcDead;",
    "const hcDead = Math.min(H.expired().length, 8), cards = items, elements = pouches + passes + hc + hcDead + codisVoucherTotalSafe();   /* CODIS-V61: + القسائم */")

# ===================== 8) الصندوق المجاني: البطاقة + 1–10 جواهر + 1–20 فضة بمعاملة واحدة ذرّية (مرجع المطالبة نفسه لكل دفتر) =====================
rep("""      const pick = CodisRewardEngine.pick(rows, ()=>1);
      if(!pick) return { ok:false, reason:'empty' };
      const res = CodisWallet.transact([], ()=>{""",
"""      const pick = CodisRewardEngine.pick(rows, ()=>1);
      if(!pick) return { ok:false, reason:'empty' };
      const gN = codisRandInt(1, 10), sN = codisRandInt(1, 20);   /* CODIS-V61: متساوي الاحتمال بين الأعداد الصحيحة (شاملة) */
      const res = CodisWallet.transact([], ()=>{""")
rep("""        if(!owned) return { ok:false, reason:'inventory' };
        f.at = at; f.n = (f.n | 0) + 1;
        return { ok:true, owned:owned, item:pick, rarity:rar, coin:coin, at:at };""",
"""        if(!owned) return { ok:false, reason:'inventory' };
        /* CODIS-V61: الجواهر والفضة بنفس المعاملة وبمرجع المطالبة نفسه (المطالبة السابقة) ⇒ جهازان بنفس الحالة لا يُمنحان مرتين بعد الدمج؛ أي فشل يرجع البطاقة أيضاً */
        const fref = 'freebox|' + (f.at || '0');
        const gtx = CodisWallet.applyGems('FREEBOX_GRANT', gN, 'الصندوق المجاني', 'freebox', fref, { claim:(f.n | 0) + 1 }); if(!gtx) return { ok:false, reason:'tx' };
        const stx = CodisWallet.applySilver('FREEBOX_GRANT', sN, 'الصندوق المجاني', 'freebox', fref, { claim:(f.n | 0) + 1 }); if(!stx) return { ok:false, reason:'tx' };
        f.at = at; f.n = (f.n | 0) + 1;
        return { ok:true, owned:owned, item:pick, rarity:rar, coin:coin, at:at, gems:gN, silver:sN, gemBal:CodisWallet.gemBalance(), silverBal:CodisWallet.silverBalance() };""")
rep("""    '<b class="fb-name" dir="auto">' + escapeHtml(it.name) + '</b><span class="fb-val">' + econCoin(r.coin) + '<em>قيمة المكافأة</em></span>' +
    '<p class="fb-note" role="status">انضافت لـ«بحوزتك» — بلا أي خصم كوينز. يرجع الصندوق بعد 24 ساعة.</p>' +""",
"""    '<b class="fb-name" dir="auto">' + escapeHtml(it.name) + '</b><span class="fb-val">' + econCoin(r.coin) + '<em>قيمة المكافأة</em></span>' +
    '<div class="fb-bonus" role="group" aria-label="مكافآت إضافية"><span class="fb-bn is-gem">+' + econGem(r.gems) + '<em>' + econGemsCfg().short + '</em></span><span class="fb-bn is-silver">+' + econSilver(r.silver) + '<em>فضة</em></span></div>' +
    '<p class="fb-bal" role="status">رصيدك الآن ' + econGem(r.gemBal) + econSilver(r.silverBal) + '</p>' +
    '<p class="fb-note" role="status">البطاقة انضافت لـ«بحوزتك» والجواهر والفضة لرصيدك — بلا أي خصم. يرجع الصندوق بعد 24 ساعة.</p>' +""")
rep("  showToast('انضافت «' + it.name + '» لممتلكاتك', 'var(--success)', 'check');",
    "  showToast('انضافت «' + it.name + '» + ' + econFmt(r.gems) + ' ' + econGemsCfg().short + ' + ' + econFmt(r.silver) + ' فضة', 'var(--success)', 'check');   /* CODIS-V61 */")
rep("'<span class=\"fb-txt\"><b>هديتك جاهزة</b><small>مكافأة عشوائية مجانية — بلا أي كوينز</small></span>",
    "'<span class=\"fb-txt\"><b>هديتك جاهزة</b><small>بطاقة مكافأة عشوائية + جواهر وفضة — مجاناً</small></span>")

# ===================== 9) مكافآت التقدم: ربطها بالحدث الحقيقي + صفحة الإعدادات =====================
rep("  const _roomDone = (changedDay !== null && newStatus === 'done') ? codisRoomCompletePayload('tasks', changedDay) : null;   // قبل أي أرشفة تلقائية",
    "  const _roomDone = (changedDay !== null && newStatus === 'done') ? codisRoomCompletePayload('tasks', changedDay) : null;   // قبل أي أرشفة تلقائية\n  if(newStatus === 'done'){ try{ CodisProgress.soon(); }catch(x){} }   /* CODIS-V61: مهمة «خلصتها» ⇒ فحص مكافآت التقدم */")
rep("  const _learnDone = (changedDay !== null && newStatus === 'done') ? codisRoomCompletePayload('learn', changedDay) : null;   // قبل أي أرشفة تلقائية",
    "  const _learnDone = (changedDay !== null && newStatus === 'done') ? codisRoomCompletePayload('learn', changedDay) : null;   // قبل أي أرشفة تلقائية\n  if(newStatus === 'done'){ try{ CodisProgress.soon(); }catch(x){} }   /* CODIS-V61 */")
rep("""    L()[id] = e;
    saveData();
    return { entry:e, isNew:true };
  }

  /* قرار المكافأة""", """    L()[id] = e;
    saveData();
    if(scope === 'weekly' && kind === 'reward'){ try{ CodisProgress.soon(1500); }catch(x){} }   /* CODIS-V61: نتيجة أسبوع ناجحة ⇒ فحص «أول أسبوع ناجح» (مؤجّل؛ وقت الإقلاع قبل تعريف الوحدة يُلتقط بالفحص بعد التحميل) */
    return { entry:e, isNew:true };
  }

  /* قرار المكافأة""")
rep("""              <span class="ios-row-trailing"><span class="ios-row-badge" id="home-account-state">غير مسجّل</span><svg class="ios-chevron" data-icon="forward"></svg></span>
            </button>""", """              <span class="ios-row-trailing"><span class="ios-row-badge" id="home-account-state">غير مسجّل</span><svg class="ios-chevron" data-icon="forward"></svg></span>
            </button>
            <button type="button" class="ios-row" onclick="openSettingsCategory('progress')">
              <span class="ios-row-icon tone-gold"><svg data-icon="trophy" data-size="md"></svg></span>
              <span class="ios-row-title">مكافآت التقدم</span>
              <span class="ios-row-trailing"><span class="ios-row-badge" id="home-progress-state"></span><svg class="ios-chevron" data-icon="forward"></svg></span>
            </button>""")
rep("""    <div id="settings-page-account" class="settings-page-section" style="display:none;">""", """    <div id="settings-page-progress" class="settings-page-section" style="display:none;">
      <button type="button" class="settings-back-btn" onclick="showSettingsHome()"><svg class="ios-chevron" data-icon="back"></svg>الإعدادات</button>
      <div class="settings-section-head"><div class="settings-section-title">مكافآت التقدم</div></div>
      <div id="progress-root"></div>
    </div>
    <div id="settings-page-account" class="settings-page-section" style="display:none;">""")
rep("const ECON_PAGES = { 'eco-store':'econRenderStore'", "const ECON_PAGES = { 'progress':'codisProgressRender', 'eco-store':'econRenderStore'")

# أيقونات: الكأس والقسيمة (سجل الأيقونات) + أيقونة قسم «العناصر» بالمتجر (نفس رسم الأقسام)
rep("  celebrate: { id:'icon-celebrate'", """  trophy: { id:'icon-trophy', meaning:'إنجاز / مكافآت التقدم', size:'md',
    body:'<path d="M8 4.5h8v4.4a4 4 0 0 1-8 0Z"/><path d="M8 6.2H5.4v1a3 3 0 0 0 3 3M16 6.2h2.6v1a3 3 0 0 1-3 3"/><path d="M12 12.9v3"/><path d="M9.6 15.9h4.8l.8 3.6H8.8Z"/>' },
  voucher: { id:'icon-voucher', meaning:'قسيمة صندوق', size:'md',
    body:'<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4Z"/><path d="M14.6 6.6v10.8" stroke-dasharray="1.4 1.7"/>' },
  celebrate: { id:'icon-celebrate'""")
rep("  /* السجل: دفتر مفتوح بشريط مرجعي */", """  /* العناصر (CODIS-V61): قسيمتان متراكبتان بحافة مثقّبة */
  shop_items:
    '<path d="M6.4 3.9h11a1.4 1.4 0 0 1 1.4 1.4v1.7a1.8 1.8 0 0 0 0 3.6v1.7" fill="currentColor" fill-opacity=".12" stroke-opacity=".6"/>' +
    '<path d="M4.5 8.6h13.4a1.5 1.5 0 0 1 1.5 1.5v2.1a2 2 0 0 0 0 4v2.1a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 18.3v-2.1a2 2 0 0 0 0-4v-2.1a1.5 1.5 0 0 1 1.5-1.5z" fill="currentColor" fill-opacity=".2"/>' +
    '<path d="M14.6 9.3v10.4" stroke-dasharray="1.3 1.5"/>' +
    '<path d="M5.9 13.2h5.6M5.9 16h3.6" stroke-opacity=".7" stroke-width="1.3"/>',
  /* السجل: دفتر مفتوح بشريط مرجعي */""")

# ===================== 10) الواجهة (بعد سجلّي أقسام المتجر و«العناصر») =====================
ui = rd('identity', 'v61_ui.js'); assert '</script' not in ui and '<!--' not in ui
rep("/* ---- سجل الكوينز ---- */\nfunction econShowMoreLog(){", "/* ===== CODIS-V61 ===== */\n" + ui + r"""
function codisVoucherTotalSafe(){ try{ return CodisVouchers.total(); }catch(e){ return 0; } }
function codisProgressHomeBadge(){ try{ const b = document.getElementById('home-progress-state'); if(!b) return; const L = CodisProgress.list(); b.textContent = econFmt(L.filter(s=>s.claimed).length) + ' / ' + econFmt(L.length); }catch(e){} }
/* بعد التحميل: إنجازات تحققت قبل هذا النظام (أو على جهاز آخر) تُمنح مرة واحدة — المرجع الثابت يمنع التكرار */
window.addEventListener('load', ()=>{ try{ codisProgressHomeBadge(); CodisProgress.soon(5000); setTimeout(codisProgressHomeBadge, 6500); }catch(e){} }, { once:true });

/* ---- سجل الكوينز ---- */
function econShowMoreLog(){""")

# قسم كسول: عنصر نائب [data-lazy] يُستبدل بمحتواه الحقيقي عند أول تبديل إليه (بلا إعادة رسم المتجر)
rep("""  const pane = document.getElementById('pane-' + d.key);
  if(pane){""", """  const pane = document.getElementById('pane-' + d.key);
  if(pane && pane.querySelector('[data-lazy]')){ try{ pane.innerHTML = d.html(); }catch(x){ console.error('CODIS store section (' + d.key + '):', x); } }   /* CODIS-V61 */
  if(pane){""")

# ===================== 11) CSS =====================
css = rd('identity', 'v61.css'); assert '</style' not in css
i = s.index('<style id="codis-v60-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v61-css">\n/* CODIS-V61 */\n' + css + '</style>' + s[j:]

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v61 applied')
