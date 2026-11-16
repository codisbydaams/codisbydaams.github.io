"""CODIS-V60 (3.47.0) — الجواهر + محتويات الصناديق + «العناصر» + تجهيز الثيمات من «بحوزتك» فقط. فوق ناتج patch_v59 وقبل boot_split.
  • الجواهر: عملة ثالثة مستقلة data.wallet.gems = { balance, lifetimeEarned, lifetimeSpent, transactions[] } (currency:'GEMS') بنفس بنية الفضة:
    التطبيع econNormGems (لا ترمي، صفر لمن لا يملك)، CodisWallet.applyGems/gemBalance/gemTxs داخل transact (اللقطة والتراجع يشملانها)،
    منع السالب (المطوّر: تعبئة صريحة عبر CodisLimits.bypass)، منع تكرار (type + referenceId)، ودمج الأجهزة mergeWalletSide كالفضة.
    لا منح ولا تحويل ولا طريقة كسب: الأنواع econGemTxTypes() = الصرف PURCHASE_BOX + ADMIN_GRANT فقط (أي مصدر كسب لاحق = نوع يُضاف هناك).
  • الصناديق: الشراء (فردي/×10) بالجواهر فقط بأسعار econBoxGemPrice (نفس أرقام الكوين الحالية 35/67/105/182/266، جدول مستقل + CodisLimits).
    t.price (الكوين) يبقى مرجع نموذج الاحتمالات فقط فلا يرتبط سعر الجواهر بقيم المكافآت.
    المحتويات: قائمة سماح BOX_PRIZE_KINDS = pass · holiday · pouch من مصادرها (CodisPasses/CodisHolidayCards/CodisPouches) — لا مكافآت ولا مظاهر ولا ثيمات،
    ولا شرط وجود مكافآت عادية. roll وopenInTx يرفضان أي نوع خارج القائمة (دفاع ثانٍ). الصناديق القديمة المغلقة تُفتح بالنظام الجديد، والمفتوحة تاريخ كما هي.
  • «بحوزتك»: الكروت (المكافآت فقط) · العناصر (سجل econItemRegister: الأكياس · بطاقات تخطي العقوبة · بطاقات العطلة) · المظاهر. قسما الأكياس والبكجات حُذفا من
    الواجهة فقط (البيانات كما هي؛ الصناديق المغلقة تُفتح من شريط «بكجاتك المغلقة» بقسم البكجات بالمتجر).
  • الثيمات: الشراء والمعاينة من المتجر؛ التجهيز/الإزالة من «بحوزتك» فقط — CodisPlanThemes.equip/unequip تتطلب سياق 'own' والواجهة تتحقق أن الورقة مفتوحة.
  py -3 tools/patch_v60.py <ناتج patch_v59 قبل boot_split> <out>   (sh tools/rebuild_v60.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V60' not in s and 'CODIS-V59' in s, 'needs v59 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:180])
    s = s.replace(old, new)

# ===================== 1) الجواهر: الأنواع + التطبيع + الأسعار + العرض (function declarations: آمنة وقت التحميل) =====================
rep("function econBoxPrice(id){", r"""/* CODIS-V60 · الجواهر — عملة ثالثة مستقلة (لا كوين ولا فضة). الاسم والوحدة من مكان واحد */
function econGemsCfg(){ return { name:'الجواهر', unit:'جوهرة', short:'جواهر' }; }
/* أنواع معاملات الجواهر: الصرف الوحيد حالياً شراء الصناديق؛ ADMIN_GRANT للمطوّر. طريقة كسب مستقبلية = نوع جديد هنا (يُحفظ بالتطبيع ويُدمج بين الأجهزة) */
function econGemTxTypes(){ return ['PURCHASE_BOX','ADMIN_GRANT']; }
function econNormGems(s){
  try{
    s = (s && typeof s === 'object' && !Array.isArray(s)) ? s : {};
    const types = econGemTxTypes();
    const txs = (Array.isArray(s.transactions) ? s.transactions : []).filter(t=>t && typeof t === 'object' && typeof t.id === 'string' && types.indexOf(t.type) !== -1 && typeof t.amount === 'number' && isFinite(t.amount) && t.amount !== 0 && typeof t.createdAt === 'string').map(t=>({
      id:t.id, type:t.type, currency:'GEMS', amount:Math.trunc(t.amount), reason:String(t.reason || ''), source:String(t.source || ''), referenceId:String(t.referenceId || ''), createdAt:t.createdAt,
      meta:(t.meta && typeof t.meta === 'object' && !Array.isArray(t.meta)) ? t.meta : undefined })).slice(-1500);
    return { balance:econNum(s.balance, 0, 0, 1e12, true), lifetimeEarned:econNum(s.lifetimeEarned, 0, 0, 1e12, true), lifetimeSpent:econNum(s.lifetimeSpent, 0, 0, 1e12, true), transactions:txs };
  }catch(e){ return { balance:0, lifetimeEarned:0, lifetimeSpent:0, transactions:[] }; }
}
/* أسعار الصناديق بالجواهر — جدول مستقل (بدأ بنفس أرقام الكوين السابقة). تعديل سعر مستوى = هذا السطر (أو لوحة المطوّر box.gemPrice.<id>) */
function econBoxGemPrice(id){
  const P = { bx1:35, bx2:67, bx3:105, bx4:182, bx5:266 }, p = Number(P[id]);
  return (isFinite(p) && p >= 1) ? Math.max(1, Math.round(CodisLimits.num('box.gemPrice.' + id, p))) : 0;
}
function econGemSvg(){   /* جوهرة ألماسية بأوجه + لمعة (رمز لعبة، لا عملة). صورة SVG واحدة مضمّنة (عقدة DOM واحدة؛ بلا فلاتر SVG — آمنة على WebKit) */
  if(!econGemSvg.u) econGemSvg.u = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 3.4h10l4.6 5.3L12 21.2 2.4 8.7z" fill="#0B6E4C"/><path d="M9.2 3.4h5.6l1.6 5.3H7.6z" fill="#9DF7D6"/><path d="M7 3.4h2.2L7.6 8.7H2.4z" fill="#3EE0AA"/><path d="M14.8 3.4H17l4.6 5.3h-5.2z" fill="#21C38D"/><path d="M2.4 8.7h5.2L12 21.2z" fill="#1AAE7C"/><path d="M7.6 8.7h8.8L12 21.2z" fill="#2FD69C"/><path d="M16.4 8.7h5.2L12 21.2z" fill="#0F8D62"/><path d="M7 3.4h10l4.6 5.3L12 21.2 2.4 8.7z" fill="none" stroke="#05402C" stroke-width=".9" stroke-linejoin="round"/><path d="M2.4 8.7h19.2M9.2 3.4L7.6 8.7 12 21.2l4.4-12.5-1.6-5.3" fill="none" stroke="#E9FFF6" stroke-opacity=".55" stroke-width=".6" stroke-linejoin="round"/><path d="M10 4.4h2.6l-1.8 3.2H8.6z" fill="#fff" fill-opacity=".85"/><path d="M19.6 1.2l.55 1.45 1.45.55-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55z" fill="#fff"/></svg>');
  return '<img class="ico eco-gem-ico" src="' + econGemSvg.u + '" width="18" height="18" alt="" aria-hidden="true" draggable="false" decoding="async">';
}
function econGem(n){ return '<span class="eco-coin eco-gem" aria-label="' + econFmt(n) + ' ' + econGemsCfg().unit + '">' + econGemSvg() + '<b>' + econFmt(n) + '</b></span>'; }
function econGemLine(){ let b = 0; try{ b = CodisWallet.gemBalance(); }catch(e){} return '<span class="eco-silver-line eco-gem-line"><span class="eco-lab">' + econGemsCfg().short + '</span>' + econGem(b) + '</span>'; }
function econBoxPrice(id){""")
rep("transactions:txs, silver:econNormSilver(w.silver) };", "transactions:txs, silver:econNormSilver(w.silver), gems:econNormGems(w.gems) };   /* CODIS-V60 */")

# ===================== 2) CodisWallet: الجواهر داخل المعاملة الذرّية =====================
rep("sv = JSON.stringify(silverW()), fz = JSON.stringify(data.finance || null)", "sv = JSON.stringify(silverW()), gm = JSON.stringify(gemsW()), fz = JSON.stringify(data.finance || null)")
rep("w.transactions.length = snap.n; w.silver = JSON.parse(sv);", "w.transactions.length = snap.n; w.silver = JSON.parse(sv); w.gems = JSON.parse(gm);   /* CODIS-V60 */")
rep("    { const sw = silverW(); if(sw.transactions.length > 1500) sw.transactions.splice(0, sw.transactions.length - 1500); }\n",
    "    { const sw = silverW(); if(sw.transactions.length > 1500) sw.transactions.splice(0, sw.transactions.length - 1500); }\n    { const gw = gemsW(); if(gw.transactions.length > 1500) gw.transactions.splice(0, gw.transactions.length - 1500); }\n")
rep("  return { balance, apply, transact, adjust, silverBalance, applySilver, silverTxs:()=>silverW().transactions.slice() };",
r"""  /* CODIS-V60 · الجواهر: رصيد ودفتر مستقلان (data.wallet.gems)، نفس قواعد الفضة: لا سالب (المطوّر: تعبئة صريحة مسجّلة)، لا تكرار (type + referenceId)، داخل transact فقط */
  function gemsW(){ const w = data.wallet; if(!w.gems || typeof w.gems !== 'object' || Array.isArray(w.gems)) w.gems = { balance:0, lifetimeEarned:0, lifetimeSpent:0, transactions:[] }; if(!Array.isArray(w.gems.transactions)) w.gems.transactions = []; return w.gems; }
  function gemBalance(){ return Number(gemsW().balance) || 0; }
  function applyGems(type, amount, reason, source, referenceId, meta){
    if(econGemTxTypes().indexOf(type) === -1) return null;
    amount = Math.trunc(Number(amount)); if(!isFinite(amount) || amount === 0) return null;
    const g = gemsW();
    if(g.balance + amount < 0){
      if(!CodisLimits.bypass('wallet.nonnegative')) return null;
      const need = -(g.balance + amount);
      g.balance += need; g.lifetimeEarned += need;
      g.transactions.push({ id:econUid('gtx'), type:'ADMIN_GRANT', currency:'GEMS', amount:need, reason:'تعبئة تلقائية — صلاحية المطوّر', source:'admin', referenceId:'', createdAt:econNowIso() });
    }
    if(referenceId && g.transactions.some(t=>t.type === type && t.referenceId === referenceId)) return null;
    const tx = { id:econUid('gtx'), type:type, currency:'GEMS', amount:amount, reason:String(reason || ''), source:String(source || ''), referenceId:String(referenceId || ''), createdAt:econNowIso() };
    if(meta) tx.meta = meta;
    g.balance += amount; if(amount > 0) g.lifetimeEarned += amount; else g.lifetimeSpent += -amount;
    g.transactions.push(tx);
    return tx;
  }
  return { balance, apply, transact, adjust, silverBalance, applySilver, silverTxs:()=>silverW().transactions.slice(), gemBalance, applyGems, gemTxs:()=>gemsW().transactions.slice() };""")

# دمج الأجهزة: الجواهر كالفضة (معاملات الجهاز الجديدة فقط تُضاف)
rep("    Object.keys(l).forEach(k=>{ if(!(k in out) && k !== 'silver') out[k] = cl(l[k]); });",
    "    if(isO(l.gems) || isO(r.gems)) out.gems = mergeWalletSide(b && b.gems, l.gems || { transactions:[], balance:0 }, r.gems || { transactions:[], balance:0 });   /* CODIS-V60 */\n    Object.keys(l).forEach(k=>{ if(!(k in out) && k !== 'silver' && k !== 'gems') out[k] = cl(l[k]); });")
# سجل الصندوق: عملة الدفع تُحفظ
rep("status:opened ? 'opened' : 'unopened', sourceRef:String(x.sourceRef || '') };", "status:opened ? 'opened' : 'unopened', sourceRef:String(x.sourceRef || '') };\n    if(x.currency === 'GEMS') b.currency = 'GEMS';   /* CODIS-V60 */")

# ===================== 3) CodisBoxes: الشراء بالجواهر + قائمة سماح المحتويات =====================
rep("      return { id:m.id, name:m.name, tone:m.tone, index:i + 1, tilt:m.tilt, odds:odds, expectedCoin:ev, basePrice:base, price:econBoxPrice(m.id) };",
    "      return { id:m.id, name:m.name, tone:m.tone, index:i + 1, tilt:m.tilt, odds:odds, expectedCoin:ev, basePrice:base, price:econBoxPrice(m.id), gems:econBoxGemPrice(m.id) };   /* CODIS-V60: price = مرجع النموذج (كوين) · gems = سعر الشراء */")
rep("  function prizePool(){ const p = pool(); return p.length ? p.concat(CodisPasses.prizes(), CodisHolidayCards.prizes(), CodisPouches.prizes(), CodisCosmetics.prizes()) : []; }   /* مظاهر البطاقات: غير المملوكة فقط */",
r"""  /* CODIS-V60 · قائمة السماح: محتويات كل الصناديق = بطاقات تخطي العقوبة + بطاقات العطلة + أكياس الفضة فقط (من أنظمتها). لا مكافآت ولا مظاهر ولا ثيمات،
     ولا شرط وجود مكافآت عادية. أي نوع جديد لا يدخل الصناديق إلا بإضافته هنا صراحة */
  const BOX_PRIZE_KINDS = Object.freeze(['pass', 'holiday', 'pouch']);
  function prizeAllowed(x){ return !!x && BOX_PRIZE_KINDS.indexOf(x.kind) !== -1; }
  function prizePool(){ return [].concat(CodisPasses.prizes(), CodisHolidayCards.prizes(), CodisPouches.prizes()).filter(prizeAllowed); }""")
rep("    if(!item) return null;\n    if(item.kind === 'pass') return",
    "    if(!item || !prizeAllowed(item)) return null;   /* CODIS-V60: دفاع ثانٍ — لا نتيجة خارج قائمة السماح */\n    if(item.kind === 'pass') return")
rep("    if(!b || b.status !== 'unopened') return { ok:false, reason:'opened' };\n    const it = r.item, rar = r.rarity;",
    "    if(!b || b.status !== 'unopened') return { ok:false, reason:'opened' };\n    if(!r || !(r.pass || r.pouchType || r.holidayKind) || !prizeAllowed(r.item)) return { ok:false, reason:'kind' };   /* CODIS-V60 */\n    const it = r.item, rar = r.rarity;")
rep("""    const tx = CodisWallet.apply('PURCHASE_BOX', -t.price, 'شراء ' + t.name, 'store', 'box|' + t.id + '|' + econUid('b'), { name:t.name, tier:t.id });
    if(!tx) return { ok:false, reason:'tx' };
    const box = { uid:'box|' + tx.id, tier:t.id, paid:t.price, acquiredAt:tx.createdAt, status:'unopened', sourceRef:tx.id };
    if(get(box.uid)) return { ok:false, reason:'inventory' };
    list().push(box);
    return { ok:true, tx:tx, price:t.price, tier:t, box:box };""",
"""    /* CODIS-V60: الدفع بالجواهر فقط (دفتر الجواهر، مرجع فريد لكل صندوق) */
    const tx = CodisWallet.applyGems('PURCHASE_BOX', -t.gems, 'شراء ' + t.name, 'store', 'box|' + t.id + '|' + econUid('b'), { name:t.name, tier:t.id });
    if(!tx) return { ok:false, reason:'tx' };
    const box = { uid:'box|' + tx.id, tier:t.id, paid:t.gems, currency:'GEMS', acquiredAt:tx.createdAt, status:'unopened', sourceRef:tx.id };
    if(get(box.uid)) return { ok:false, reason:'inventory' };
    list().push(box);
    return { ok:true, tx:tx, price:t.gems, tier:t, box:box };""")
rep("    if(!CodisLimits.afford(CodisWallet.balance(), t.price)) return { ok:false, reason:'insufficient', need:t.price - CodisWallet.balance(), price:t.price };",
    "    const gb = CodisWallet.gemBalance(); if(!CodisLimits.afford(gb, t.gems)) return { ok:false, reason:'insufficient', need:t.gems - gb, price:t.gems };")
rep("    const total = t.price * BULK, bal0 = CodisWallet.balance();\n    if(!CodisLimits.afford(bal0, total)) return { ok:false, reason:'insufficient', need:total - bal0, price:t.price, total:total };",
    "    const total = t.gems * BULK, bal0 = CodisWallet.gemBalance();\n    if(!CodisLimits.afford(bal0, total)) return { ok:false, reason:'insufficient', need:total - bal0, price:t.gems, total:total };")
rep("      return { ok:true, tier:t, n:BULK, price:t.price, total:total, items:items, balanceBefore:bal0, balanceAfter:CodisWallet.balance() };",
    "      return { ok:true, tier:t, n:BULK, price:t.gems, total:total, items:items, balanceBefore:bal0, balanceAfter:CodisWallet.gemBalance() };")
rep("  return { tiers, tier, pool, classes, effective, effectiveBase, stats, valueOf, minValue, owned, get, roll, buy, open, buyOpenMany, BULK, model:{ BAND_EDGES, RHO, DUD_CAP, DUD_RATIO, FLOOR_PM, solve, toPm } };",
    "  return { tiers, tier, pool, prizePool, PRIZE_KINDS:BOX_PRIZE_KINDS, classes, effective, effectiveBase, stats, valueOf, minValue, owned, get, roll, buy, open, buyOpenMany, BULK, model:{ BAND_EDGES, RHO, DUD_CAP, DUD_RATIO, FLOOR_PM, solve, toPm } };")

# ===================== 4) واجهة الصناديق: الجواهر بدل الكوين =====================
i = s.index('function econBoxesHtml(){'); j = s.index('\n}\n', i) + 3
f = s[i:j]; f0 = f
f = f.replace("const bal = data.wallet.balance, ts = CodisBoxes.tiers();", "const bal = CodisWallet.gemBalance(), ts = CodisBoxes.tiers();   /* CODIS-V60: الصناديق بالجواهر */")
f = f.replace("CodisLimits.afford(bal, t.price)", "CodisLimits.afford(bal, t.gems)").replace("econFmt(t.price - bal)", "econFmt(t.gems - bal)")
f = f.replace("const total = t.price * CodisBoxes.BULK", "const total = t.gems * CodisBoxes.BULK")
f = f.replace("econFmt(t.price) + ' كوين'", "econFmt(t.gems) + ' ' + econGemsCfg().unit").replace("econFmt(total) + ' كوين (' + econFmt(t.price) + ' للبكج)'", "econFmt(total) + ' ' + econGemsCfg().unit + ' (' + econFmt(t.gems) + ' للبكج)'")
f = f.replace("econCoin(t.price)", "econGem(t.gems)").replace("econCoin(total)", "econGem(total)")
assert f != f0 and 't.price' not in f and 'econCoin' not in f and 'كوين' not in f, f[:400]
s = s[:i] + f + s[j:]
rep("  const price = '<div class=\"cfm-price\">' + codisIcon('coin') + '<b dir=\"ltr\">' + escapeHtml(String(total)) + '</b></div>';",
    "  const price = '<div class=\"cfm-price is-gem\">' + econGemSvg() + '<b dir=\"ltr\">' + escapeHtml(String(total)) + '</b></div>';   /* CODIS-V60: الصناديق بالجواهر */")
# الشراء الفردي
rep("""    if(!CodisBoxes.pool().length){ codisSfx('invalid', { ctx:'funds' }); showToast('ماكو مكافآت بالمتجر — أضف مكافآت مفعّلة أولاً', 'var(--warning)'); return; }
    if(!CodisBoxes.effective(t).length){ codisSfx('invalid', { ctx:'funds' }); showToast('هذا البكج غير متاح حالياً — لا توجد كروت مناسبة لسعره', 'var(--warning)'); return; }
    if(!CodisLimits.afford(data.wallet.balance, t.price)){ codisSfx('invalid', { ctx:'funds' }); showToast('الرصيد غير كافٍ — ينقصك ' + econFmt(t.price - data.wallet.balance) + ' كوين', 'var(--warning)'); return; }
    const ok = await codisConfirm(CodisCopy.buyBox(t.name, econFmt(t.price), econFmt(data.wallet.balance - t.price), t));""",
"""    if(!CodisBoxes.effective(t).length){ codisSfx('invalid', { ctx:'funds' }); showToast('هذا البكج غير متاح حالياً — لا توجد عناصر مؤهّلة له', 'var(--warning)'); return; }
    const gb = CodisWallet.gemBalance(), G = econGemsCfg();   /* CODIS-V60: الجواهر فقط */
    if(!CodisLimits.afford(gb, t.gems)){ codisSfx('invalid', { ctx:'funds' }); showToast('ما عندك ' + G.short + ' كافية', 'var(--warning)'); return; }
    const ok = await codisConfirm(CodisCopy.buyBox(t.name, econFmt(t.gems), econFmt(Math.max(0, gb - t.gems)), t, econFmt(gb)));""")
rep("    if(r.ok){ boughtBox = r.box; if(!CodisBox3D.can()) codisSfx('store.buy', { ctx:'box' }); buyToast = 'تم الشراء: ' + t.name + ' (−' + econFmt(r.price) + ')';",
    "    if(r.ok){ boughtBox = r.box; if(!CodisBox3D.can()) codisSfx('store.buy', { ctx:'box' }); buyToast = 'تم الشراء: ' + t.name + ' (−' + econFmt(r.price) + ' ' + econGemsCfg().unit + ')';")
rep("    else { codisSfx('invalid', { ctx:'funds' }); showToast(r.reason === 'insufficient' ? 'الرصيد غير كافٍ' : r.reason === 'empty' ?",
    "    else { codisSfx('invalid', { ctx:'funds' }); showToast(r.reason === 'insufficient' ? 'ما عندك ' + econGemsCfg().short + ' كافية' : r.reason === 'empty' ?")
# الشراء والفتح ×10
rep("""    if(!CodisBoxes.pool().length){ codisSfx('invalid', { ctx:'funds' }); showToast('ماكو مكافآت بالمتجر — أضف مكافآت مفعّلة أولاً', 'var(--warning)'); return; }
    if(!CodisBoxes.effective(t).length){ codisSfx('invalid', { ctx:'funds' }); showToast('هذا البكج غير متاح حالياً — لا توجد كروت مناسبة لسعره', 'var(--warning)'); return; }
    const total = t.price * N, bal = data.wallet.balance;
    if(bal < total){ codisSfx('invalid', { ctx:'funds' }); showToast('الرصيد غير كافٍ لشراء ' + econFmt(N) + ' بكجات — ينقصك ' + econFmt(total - bal) + ' كوين', 'var(--warning)'); return; }
    const ok = await codisConfirm(CodisCopy.buyBox10(t.name, 'المستوى ' + econFmt(t.index) + ' من ' + econFmt(CodisBoxes.tiers().length), N, econFmt(t.price), econFmt(total), econFmt(bal), econFmt(bal - total), t));""",
"""    if(!CodisBoxes.effective(t).length){ codisSfx('invalid', { ctx:'funds' }); showToast('هذا البكج غير متاح حالياً — لا توجد عناصر مؤهّلة له', 'var(--warning)'); return; }
    const total = t.gems * N, bal = CodisWallet.gemBalance(), G = econGemsCfg();   /* CODIS-V60: الجواهر فقط */
    if(!CodisLimits.afford(bal, total)){ codisSfx('invalid', { ctx:'funds' }); showToast('ما عندك ' + G.short + ' كافية لـ' + econFmt(N) + ' بكجات', 'var(--warning)'); return; }
    const ok = await codisConfirm(CodisCopy.buyBox10(t.name, 'المستوى ' + econFmt(t.index) + ' من ' + econFmt(CodisBoxes.tiers().length), N, econFmt(t.gems), econFmt(total), econFmt(bal), econFmt(Math.max(0, bal - total)), t));""")
rep("res.toastMsg = 'تم شراء وفتح ' + econFmt(res.n) + ' بكجات: ' + t.name + ' (−' + econFmt(res.total) + ')';",
    "res.toastMsg = 'تم شراء وفتح ' + econFmt(res.n) + ' بكجات: ' + t.name + ' (−' + econFmt(res.total) + ' ' + econGemsCfg().unit + ')';")
rep("showToast(res.reason === 'insufficient' ? 'الرصيد غير كافٍ — ينقصك ' + econFmt(res.need) + ' كوين' :",
    "showToast(res.reason === 'insufficient' ? 'ما عندك ' + econGemsCfg().short + ' كافية' :")
# نافذة التأكيد: السعر · رصيد الجواهر · المتبقي (بالجواهر)
rep("  buyBox10:(name, kind, n, unit, total, bal, after, tier)=>({ title:'شراء ' + n + ' بكجات', message:'',",
    "  buyBox10:(name, kind, n, unit, total, bal, after, tier)=>({ title:'شراء ' + n + ' بكجات', message:'السعر ' + total + ' ' + econGemsCfg().unit + ' (' + unit + ' للبكج) · رصيد ' + econGemsCfg().name + ' ' + bal + ' · المتبقي بعد الشراء ' + after,")
rep("  buyBox:(name, price, after, tier)=>({ title:'شراء بكج', message:'',",
    "  buyBox:(name, price, after, tier, bal)=>({ title:'شراء بكج', message:'السعر ' + price + ' ' + econGemsCfg().unit + (bal !== undefined ? ' · رصيد ' + econGemsCfg().name + ' ' + bal : '') + ' · المتبقي بعد الشراء ' + after,")
# تفاصيل البكج: سعر الفتح بالجواهر
rep("<div class=\"pkx-price\"><span>سعر الفتح</span>' + econCoin(t.price) + '</div>", "<div class=\"pkx-price\"><span>سعر الفتح</span>' + econGem(t.gems) + '</div>")
rep("  const KIND = { pass:'تجاوز عقوبة', holiday:'بطاقة عطلة', pouch:'كيس فضة', cosmetic:'مظهر' };", "  const KIND = { pass:'تخطي عقوبة', holiday:'بطاقة عطلة', pouch:'كيس فضة', cosmetic:'مظهر' };")
# رصيد المتجر: الجواهر سطر ثالث مستقل
rep("<span class=\"eco-lab\">رصيدك</span>' + econCoin(bal) + econSilverLine() + '</span>'", "<span class=\"eco-lab\">رصيدك</span>' + econCoin(bal) + econSilverLine() + econGemLine() + '</span>'")
# لوحة المطوّر: أسعار الجواهر قابلة للتعديل
rep("  CodisBoxes.tiers().forEach(t=>R('box.price.' + t.id, 'سعر ' + t.name + ' (كوين)', t.price));",
    "  CodisBoxes.tiers().forEach(t=>R('box.price.' + t.id, 'السعر المرجعي لنموذج احتمالات ' + t.name + ' (كوين — ليس سعر الشراء)', t.price));\n  CodisBoxes.tiers().forEach(t=>R('box.gemPrice.' + t.id, 'سعر ' + t.name + ' (جواهر)', t.gems));   /* CODIS-V60 */")

# ===================== 5) «بحوزتك»: الكروت · العناصر · المظاهر =====================
rep("  const hcDead = Math.min(H.expired().length, 8), cards = items + passes + hc + hcDead;",
    "  const hcDead = Math.min(H.expired().length, 8), cards = items, elements = pouches + passes + hc + hcDead;   /* CODIS-V60: الكروت = المكافآت فقط؛ التخطي/العطلة/الأكياس بقسم «العناصر» (لا عدّ مرتين) */")
rep("  return { items:items, passes:passes, hc:hc, hcDead:hcDead, cards:cards, boxes:boxes, pouches:pouches, cosmetics:cosmetics, themes:themes, total:cards + boxes + pouches + cosmetics + themes };",
    "  return { items:items, passes:passes, hc:hc, hcDead:hcDead, cards:cards, elements:elements, boxes:boxes, pouches:pouches, cosmetics:cosmetics, themes:themes, total:cards + elements + cosmetics + themes };   /* boxes: الصناديق المغلقة تُفتح من المتجر (لا تُعدّ هنا) */")
rep("""econOwnRegister({ key:'pouches', name:'الأكياس', icon:'own_pouch', order:20, count:T=>T.pouches, html:()=>econPouchesHtml(), empty:'ما عندك أكياس فضة حالياً — تطلع من البكجات.' });""",
    """econOwnRegister({ key:'items', name:'العناصر', icon:'own_items', order:20, count:T=>T.elements, html:T=>econOwnItemsHtml(T), empty:'ما عندك عناصر حالياً — أكياس الفضة وبطاقات تخطي العقوبة وبطاقات العطلة تطلع من البكجات.' });   /* CODIS-V60 */""")
rep("""econOwnRegister({ key:'boxes', name:'البكجات', icon:'shop_packs', order:40, count:T=>T.boxes, html:T=>econOwnBoxesHtml(T), empty:'ما عندك بكجات مغلقة حالياً.' });\n""", "")
rep("  const map = { 'own-items':'cards', 'own-pouches':'pouches', 'own-cosmetics':'cosmetics', 'own-boxes':'boxes' };",
    "  const map = { 'own-items':'cards', 'own-pouches':'items', 'own-passes':'items', 'own-holiday':'items', 'own-cosmetics':'cosmetics', 'own-boxes':'items', pouches:'items', boxes:'items' };   /* CODIS-V60 */")
rep("""  const pt = econPassTilesHtml(owned.length), ht = hcdInvTilesHtml(owned.length + pt.n);
  if(!owned.length && !pt.html && !ht.any) return '';""", """  if(!owned.length) return '';   /* CODIS-V60: بطاقات التخطي والعطلة انتقلت لقسم «العناصر» */""")
rep("""    (T.hcDead ? '<span class="own-sub-x" title="بطاقات عطلة منتهية — تُفكَّك فقط">منها ' + econFmt(T.hcDead) + ' منتهية</span>' : '') +
    (owned.length ? '<div class="own-tools\"""", """    (owned.length ? '<div class="own-tools\"""")
rep("  html += pt.html + ht.html + '</div>';\n  if(sm){", "  html += '</div>';\n  if(sm){")
rep("const ECON_OWN_ICONS = Object.freeze({", """const ECON_OWN_ICONS = Object.freeze({
  /* CODIS-V60 «العناصر»: صندوق عناصر بثلاث خانات (كيس · بطاقة · تقويم) بلغة أيقونات المتجر نفسها */
  own_items:
    '<rect x="3.2" y="6.4" width="17.6" height="13.4" rx="2.6" fill="currentColor" fill-opacity=".14"/><path d="M3.2 10.6h17.6M9.2 10.6v9.2M14.8 10.6v9.2"/>' +
    '<path d="M8.4 6.4V5.2c0-1 .8-1.8 1.8-1.8h3.6c1 0 1.8.8 1.8 1.8v1.2"/><circle cx="6.2" cy="15.3" r="1.3" fill="currentColor" fill-opacity=".55"/><rect x="10.9" y="13.4" width="2.2" height="3.8" rx=".6" fill="currentColor" fill-opacity=".55"/><path d="M16.6 14.2h2.4M16.6 16.4h2.4"/>',""")
rep("/* يبقى للتوافق (كان يبني كل الأقسام عمودياً): كل الأقسام بالترتيب */", r"""/* ===== CODIS-V60 · قسم «العناصر»: سجل أنواع قابل للتوسع =====
   كل نوع: key · name · icon · order · count() · html() (بلاطاته بنظامه الأصلي وأزراره كما هي) · action (إجراء النوع، للتوسعة) · empty.
   نوع جديد = استدعاء econItemRegister واحد. كل نوع مجموعة مستقلة (عنوان + عدد + شبكته) فلا تختلط الأنواع */
const ECON_ITEM_KINDS = [];
function econItemRegister(d){ const i = ECON_ITEM_KINDS.findIndex(x=>x.key === d.key); if(i >= 0) ECON_ITEM_KINDS[i] = d; else ECON_ITEM_KINDS.push(d); ECON_ITEM_KINDS.sort((a, b)=>a.order - b.order); }
econItemRegister({ key:'pouches', name:'أكياس الفضة', icon:'own_pouch', order:10, count:()=>CodisPouches.owned().length,
  html:()=>{ const h = econPouchesHtml(), i = h.indexOf('<div class="pcd-inv"'), j = h.lastIndexOf('</section>'); return (i < 0 || j < i) ? h : econItemGroupHtml('pouches', 'أكياس الفضة', CodisPouches.owned().length, h.slice(i, j), 'افتح الكيس لتحصل على فضة عشوائية ضمن مجاله'); },
  action:type=>econPouchUse(type), empty:'ما عندك أكياس فضة.' });
econItemRegister({ key:'passes', name:'بطاقات تخطي العقوبة', icon:'pass', order:20, count:()=>CodisPasses.owned().length,
  html:()=>{ const t = econPassTilesHtml(0); return t.n ? econItemGroupHtml('passes', 'بطاقات تخطي العقوبة', t.n, '<div class="shop-grid" role="list">' + t.html + '</div>', 'تُستهلك تلقائياً عند قرار عقوبة مطابقة') : ''; }, action:null, empty:'ما عندك بطاقات تخطي عقوبة.' });
econItemRegister({ key:'holiday', name:'بطاقات العطلة', icon:'calendar', order:30, count:()=>CodisHolidayCards.usable().length + Math.min(CodisHolidayCards.expired().length, 8),
  html:()=>{ const t = hcdInvTilesHtml(0), dead = Math.min(CodisHolidayCards.expired().length, 8), n = CodisHolidayCards.usable().length + dead; return t.any ? econItemGroupHtml('holiday', 'بطاقات العطلة', n, '<div class="shop-grid" role="list">' + t.html + '</div>', dead ? 'منها ' + econFmt(dead) + ' منتهية — تُفكَّك فقط' : '') : ''; }, action:null, empty:'ما عندك بطاقات عطلة.' });
function econItemGroupHtml(key, name, n, body, note){
  return '<section class="own-part own-kind" id="own-' + key + '" data-kind="' + key + '" aria-labelledby="own-' + key + '-h"><div class="own-sub"><span id="own-' + key + '-h" role="heading" aria-level="5">' + escapeHtml(name) + '</span><span class="own-sub-n">' + econFmt(n) + '</span>' +
    (note ? '<span class="own-sub-x">' + escapeHtml(note) + '</span>' : '') + '</div>' + body + '</section>';
}
function econOwnItemsHtml(T){
  return '<div class="own-kinds">' + ECON_ITEM_KINDS.map(k=>{ let n = 0, h = ''; try{ n = k.count() || 0; if(n) h = k.html() || ''; }catch(e){ console.error('CODIS own items (' + k.key + '):', e); } return h; }).join('') + '</div>';
}
/* يبقى للتوافق (كان يبني كل الأقسام عمودياً): كل الأقسام بالترتيب */""")

# ===================== 6) الثيمات: التجهيز من «بحوزتك» فقط =====================
rep("""  function equip(id){
    const d = def(id); if(!d) return { ok:false, reason:'invalid' }; if(!TG[d.target])""", """  /* CODIS-V60: التجهيز/الإزالة سياقهما «بحوزتك» فقط — أي استدعاء بسياق آخر (المتجر) يُرفض قبل أي تعديل */
  function equip(id, ctx){
    if(ctx !== 'own') return { ok:false, reason:'context' };
    const d = def(id); if(!d) return { ok:false, reason:'invalid' }; if(!TG[d.target])""")
rep("""  function unequip(x){
    const tg = TG[x] ? x : (def(x) ? def(x).target : 'planning');""", """  function unequip(x, ctx){
    if(ctx !== 'own') return { ok:false, reason:'context' };
    const tg = TG[x] ? x : (def(x) ? def(x).target : 'planning');""")
rep("""function econPlanThemeToggle(id){
  if(econStoreBusy) return;
  const P = CodisPlanThemes, d = P.def(id); if(!d) return;
  const R = codisPtRoom(d), on = P.isEquipped(id), r = on ? P.unequip(d.target) : P.equip(id);""",
"""function econPlanThemeToggle(id, ctx){
  if(econStoreBusy) return;
  const P = CodisPlanThemes, d = P.def(id); if(!d) return;
  /* CODIS-V60: من «بحوزتك» فقط (النافذة فُتحت من بلاطة «بحوزتك» والورقة مفتوحة فعلاً) */
  if(ctx !== 'own' || !econOwnOpen){ codisSfx('invalid', { ctx:'unavailable' }); showToast('التجهيز من «بحوزتك» فقط', 'var(--warning)'); return; }
  const R = codisPtRoom(d), on = P.isEquipped(id), r = on ? P.unequip(d.target, 'own') : P.equip(id, 'own');""")
rep("let codisPtPrevEl = null, codisPtPrevFocus = null, codisPtPrevId = '', codisPtActAt = 0;", "let codisPtPrevEl = null, codisPtPrevFocus = null, codisPtPrevId = '', codisPtActAt = 0, codisPtCtx = 'store';   /* CODIS-V60: سياق النافذة store | own */")
rep("""  const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة', dis = busy || (!own && !ok);""",
"""  /* CODIS-V60: بالمتجر — شراء للغير مملوك، ولمملوك/مجهّز زر ينقل لـ«بحوزتك» (لا تجهيز ولا إزالة هنا) */
  if(own && codisPtCtx !== 'own'){
    const st2 = on ? '<span class="pt-ov-st is-on">مجهّز على ' + escapeHtml(R.room) + '</span>' : '<span class="pt-ov-st is-own">مملوك</span>';
    return '<div class="pt-ov-state">' + st2 + '</div><p class="pt-ov-note">' + escapeHtml(on ? 'تغيير التجهيز أو إزالته من «بحوزتك» ← المظاهر.' : 'تملكه — جهّزه من «بحوزتك» ← المظاهر.') + '</p>' +
      '<button type="button" class="pt-ov-act is-off" data-act="goown"' + (busy ? ' disabled aria-disabled="true"' : '') + ' aria-label="' + escapeHtml('افتح «بحوزتك» لتجهيز ' + d.name + ' · ' + R.room) + '" onclick="codisPtGoOwn(\\'' + d.id + '\\')">افتح «بحوزتك» للتجهيز</button>';
  }
  const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة', dis = busy || (!own && !ok);""")
rep("""  if(!P.owns(id)) econPlanThemeBuy(id); else econPlanThemeToggle(id);
}""", """  if(!P.owns(id)) econPlanThemeBuy(id); else econPlanThemeToggle(id, codisPtCtx);
}
/* CODIS-V60: من المتجر إلى «بحوزتك ← المظاهر» على بلاطة الثيم نفسه */
function codisPtGoOwn(id){
  codisPlanThemePreviewClose(true);
  try{ if(!econOwnOpen) econOpenVault(); }catch(e){}
  /* الورقة تُرسم/تتحرك بعد فتحها ⇒ محاولات قصيرة حتى تظهر بلاطة الثيم ثم التركيز عليها */
  let k = 0; const go = ()=>{ try{ if(econOwnPart !== 'cosmetics') econOwnSetPart('cosmetics', { quiet:true }); const b = Array.prototype.find.call(document.querySelectorAll('#own-panel-cosmetics .pt-mtile[data-ptid="' + id + '"] .pt-mbtn'), x=>x.offsetParent !== null);
    if(b){ b.scrollIntoView({ block:'center' }); b.focus({ preventScroll:true }); if(document.activeElement === b) return; } }catch(e){} if(++k < 12) setTimeout(go, 120); };
  setTimeout(go, 60);
}""")
rep("""  codisPtPrevFocus = opener || document.activeElement; codisPtPrevId = d.id;""",
    """  codisPtPrevFocus = opener || document.activeElement; codisPtPrevId = d.id;
  codisPtCtx = (opener && opener.closest && opener.closest('#eco-own-sheet')) ? 'own' : 'store';   /* CODIS-V60 */""")
rep("""el.setAttribute('data-pt-fam', d.family || '');""", """el.setAttribute('data-pt-fam', d.family || ''); el.setAttribute('data-ctx', codisPtCtx);""")

# ===================== 8) لا «ينقصك» بأي مكان: السعر فقط، وزر الشراء يبقى قابلاً للضغط؛ عند الضغط بلا رصيد كافٍ رسالة «ما عندك … كافية» =====================
NO_COIN = "'ما عندك كوين كافية'"; NO_SILVER = "'ما عندك فضة كافية'"
rep("showToast('رصيدك لا يكفي — ينقصك ' + econFmt(res.need) + ' كوين', 'var(--warning)')", "showToast(" + NO_COIN + ", 'var(--warning)')")
rep("showToast('الرصيد غير كافٍ — ينقصك ' + econFmt(price - data.wallet.balance) + ' كوين', 'var(--warning)')", "showToast(" + NO_COIN + ", 'var(--warning)')", 1)
rep("showToast('الرصيد غير كافٍ — ينقصك ' + econFmt(p - data.wallet.balance) + ' كوين', 'var(--warning)')", "showToast(" + NO_COIN + ", 'var(--warning)')")
rep("showToast(r.reason === 'insufficient' ? 'الرصيد غير كافٍ' :", "showToast(r.reason === 'insufficient' ? " + NO_COIN + " :", 2)
rep("showToast('الفضة غير كافية — ينقصك ' + econFmt(d.silver - sv) + ' فضة', 'var(--warning)')", "showToast(" + NO_SILVER + ", 'var(--warning)')", 2)
rep("showToast(r.reason === 'insufficient' ? 'الفضة غير كافية — ينقصك ' + econFmt(r.need) + ' فضة' :", "showToast(r.reason === 'insufficient' ? " + NO_SILVER + " :", 2)
# كرت المكافأة بالمتجر
rep("  const need = price - bal, label = busy ? econBuyStack('جارٍ', 'الشراء…') : ok ? econCoin(price) : econBuyStack('ينقصك', econFmt(need));",
    "  const label = busy ? econBuyStack('جارٍ', 'الشراء…') : econCoin(price);   /* CODIS-V60: السعر فقط (لا «ينقصك»)؛ الضغط بلا رصيد ⇒ رسالة */")
rep("""'<button type="button" class="btn ' + (ok ? 'btn-primary' : 'btn-secondary') + ' shop-buy' + (busy ? ' is-busy' : '') + '" data-len="' + econBuyLen(ok ? price : need) + '" ' + (ok && !busy ? '' : 'disabled aria-disabled="true"') +""",
    """'<button type="button" class="btn btn-primary shop-buy' + (busy ? ' is-busy' : '') + '" data-len="' + econBuyLen(price) + '" ' + (!busy ? '' : 'disabled aria-disabled="true"') +""")
rep("(busy ? ' — جارٍ الشراء' : ok ? '' : ' — ينقصك ' + econFmt(need))", "(busy ? ' — جارٍ الشراء' : '')")
# نافذة تفاصيل الكرت
rep("  const btnText = busy ? 'جارٍ الشراء…' : !avail ? 'غير متاحة للشراء' : ok ? 'شراء · ' + econFmt(price) + ' كوين' : 'ينقصك ' + econFmt(price - bal) + ' كوين';",
    "  const btnText = busy ? 'جارٍ الشراء…' : !avail ? 'غير متاحة للشراء' : 'شراء · ' + econFmt(price) + ' كوين';")
rep(" : '<div><dt>الناقص</dt><dd>' + econCoin(price - bal) + '</dd></div>') : '')", " : '') : '')")
rep("""(avail && !ok ? '<p class="store-detail-note is-short" role="status">الرصيد غير كافٍ — ينقصك ' + econFmt(price - bal) + ' كوين لإتمام الشراء</p>' : !avail ?""", "(!avail ?")
rep("""'<div class="modal-actions"><button type="button" class="btn ' + (ok ? 'btn-primary' : 'btn-secondary') + ' shop-buy store-detail-buy' + (busy ? ' is-busy' : '') + '" ' + (ok && !busy ? '' : 'disabled aria-disabled="true"') +""",
    """'<div class="modal-actions"><button type="button" class="btn ' + (avail ? 'btn-primary' : 'btn-secondary') + ' shop-buy store-detail-buy' + (busy ? ' is-busy' : '') + '" ' + (avail && !busy ? '' : 'disabled aria-disabled="true"') +""")
# مظاهر البطاقات
rep("""'<button type="button" class="btn ' + (ok ? 'btn-primary' : 'btn-secondary') + ' hcd-buy cos-buy" ' + (ok && !busy ? '' : 'disabled aria-disabled="true"') +""", """'<button type="button" class="btn btn-primary hcd-buy cos-buy" ' + (!busy ? '' : 'disabled aria-disabled="true"') +""")
rep("""escapeHtml('شراء ' + d.name + ' — ' + econFmt(d.silver) + ' فضة' + (ok ? '' : ' — ينقصك ' + econFmt(d.silver - sv) + ' فضة'))""", """escapeHtml('شراء ' + d.name + ' — ' + econFmt(d.silver) + ' فضة')""")
rep("""(ok ? econSilver(d.silver) : 'ينقصك ' + econFmt(d.silver - sv) + ' فضة') + '</button>';""", """econSilver(d.silver) + '</button>';""")
# بطاقات العطلة
rep("  const label = blocked ? econBuyStack('الأسبوع', 'القادم') : ok ? econCoin(p) : econBuyStack('ينقصك', econFmt(p - bal));", "  const label = blocked ? econBuyStack('الأسبوع', 'القادم') : econCoin(p);")
rep("""(ok ? 'btn-primary' : 'btn-secondary') + ' hcd-buy' + (busy && ok ? ' is-busy' : '') + '" data-len="' + econBuyLen(ok || blocked ? p : p - bal) + '" ' + (ok && !busy ? '' : 'disabled aria-disabled="true"') +""",
    """(!blocked ? 'btn-primary' : 'btn-secondary') + ' hcd-buy' + (busy && !blocked ? ' is-busy' : '') + '" data-len="' + econBuyLen(p) + '" ' + (!blocked && !busy ? '' : 'disabled aria-disabled="true"') +""")
rep("(blocked ? ' — اشتريتها هذا الأسبوع' : ok ? '' : ' — ينقصك ' + econFmt(p - bal))", "(blocked ? ' — اشتريتها هذا الأسبوع' : '')")
# الثيمات: الملاحظة والزر
rep(": 'رصيدك ' + econFmt(sv) + ' فضة — ينقصك ' + econFmt(d.silver - sv) + ' فضة.';", ": 'رصيدك ' + econFmt(sv) + ' فضة.';")
rep("const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة', dis = busy || (!own && !ok);", "const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة', dis = busy;   /* الضغط بلا رصيد ⇒ رسالة (لا زر معطّل) */")
# الصناديق: السعر دائماً، الزر يعمل ما دام الصندوق متاحاً
i = s.index('function econBoxesHtml(){'); j = s.index('\n}\n', i) + 3
f = s[i:j]
for a, b in [("label = !n ? 'غير متاح' : CodisLimits.afford(bal, t.gems) ? 'شراء' : 'ينقصك ' + econFmt(t.gems - bal);", "label = 'غير متاح';"),
             ("label10 = !n ? 'غير متاح' : 'ينقصك ' + econFmt(total - bal);", "label10 = 'غير متاح';"),
             ("(ok ? 'btn-primary' : 'btn-secondary') + ' bx-buy\" ' + (ok && !econStoreBusy ?", "(n ? 'btn-primary' : 'btn-secondary') + ' bx-buy\" ' + (n && !econStoreBusy ?"),
             ("(ok ? '' : ' — ' + label)", "(n ? '' : ' — ' + label)"), ("(ok ? econGem(t.gems) :", "(n ? econGem(t.gems) :"),
             ("(ok10 ? 'btn-achievement' : 'btn-secondary') + ' bx-buy10\" ' + (ok10 && !econStoreBusy ?", "(n ? 'btn-achievement' : 'btn-secondary') + ' bx-buy10\" ' + (n && !econStoreBusy ?"),
             ("(ok10 ? '' : ' — ' + label10)", "(n ? '' : ' — ' + label10)"), ("(ok10 ? econGem(total) :", "(n ? econGem(total) :")]:
    assert f.count(a) == 1, (a, f.count(a)); f = f.replace(a, b)
assert 'ينقصك' not in f
s = s[:i] + f + s[j:]
# الإدارة المالية (دينار)
rep("funds:'رصيدك لا يكفي — ينقصك ' + finFmt(r.need || 0) + ' د.ع (رصيدك ' + finFmt(r.balance || 0) + ')'", "funds:'رصيدك المالي لا يكفي'")
rep("showToast('رصيدك المالي غير كافٍ — ينقصك ' + finFmt(iqd - bal) + ' دينار، والمكافأة تبقى بحوزتك', 'var(--warning)')", "showToast('رصيدك المالي غير كافٍ، والمكافأة تبقى بحوزتك', 'var(--warning)')")
# لا «ينقصك» معروضة بعد الآن (يبقى ذكرها بتعليقات CSS/JS القديمة فقط)
import re as _re
_left = []
for _m in _re.finditer('ينقصك', s):
    _ln = s[s.rfind('\n', 0, _m.start()) + 1:_m.start()]
    if not ('/*' in _ln or _ln.lstrip().startswith('*') or '//' in _ln or _ln.lstrip().startswith('Disabled') or 'القواعد' in _ln or 'فيصير' in _ln): _left.append(s[_m.start() - 140:_m.start() + 40])
assert not _left, _left[:3]

# ===================== 7) CSS =====================
css = rd('identity', 'v60.css'); assert '</style' not in css
i = s.index('<style id="codis-v59-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v60-css">\n/* CODIS-V60 */\n' + css + '</style>' + s[j:]
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v60 applied')
