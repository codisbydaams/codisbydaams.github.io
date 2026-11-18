"""CODIS-V70 (3.57.0) — إعادة بناء نظام الصناديق: 10 ندرات بنقاط القوة، 5 صناديق × 6 ندرات متتالية باحتمالات ثابتة 50/25/13/7/4/1،
   سجل أنواع جوائز بمحوّلات (مكافآت · تجاوز · عطلة · أكياس · مجموعات قسائم الصندوق التالي · مظاهر البطاقات · ثيمات الغرف · ثيمات الموافقة · بدايات الغرف)،
   المظاهر/الثيمات/البدايات من الصناديق فقط (لا شراء مباشر)، وكل شيء يتكرر: مكرر المنتج الدائم يُفكَّك مقابل فضة. يحذف محرك فئات القيمة القديم (solve/BAND_*/RHO/DUD_*/REF_CAP/minValue/overridePm) بالكامل.
   فوق ناتج patch_v69 وقبل boot_split.   py -3 tools/patch_v70.py <in> <out>   (sh tools/rebuild_v70.sh)"""
import sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V70' not in s and 'CODIS-V69' in s, 'needs v69 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t
def fn_span(text, name):
    pats = ['\nfunction ' + name + '(', '\nasync function ' + name + '(']
    hits = [(text.find(p), p) for p in pats if text.find(p) >= 0]
    if not hits: return None
    assert len(hits) == 1, ('both sync/async', name)
    k, p = hits[0]; k += 1
    assert text.find(p, k) < 0, ('duplicate function', name)
    eol = text.find('\n', k); first = text[k:eol]
    if first.rstrip().endswith('}') and first.count('{') == first.count('}'):
        return k, eol + 1
    e = text.find('\n}\n', k); assert e > 0, name
    return k, e + 3

# ===================== 1) المحرك: استبدال CodisBoxes القديم كله =====================
a = s.index('const CodisBoxes = (function(){')
b = s.index('\n})();\n', a) + len('\n})();\n')
old = s[a:b]
assert 'function solve(cs, price, target, dudCap)' in old and 'BAND_EDGES' in old and "return { tiers, tier, pool, prizePool, PRIZE_KINDS:BOX_PRIZE_KINDS" in old and s.count('const CodisBoxes = (function(){') == 1
eng = clean(rd('identity', 'v70_engine.js'), 'engine')
eng += "try{ CodisLimits.reg('cosmetic.boxOnly', 'المظاهر والثيمات وبدايات الغرف من الصناديق فقط (لا شراء مباشر)'); }catch(e){}\n"
s = s[:a] + '/* ===== CODIS-V70 ===== */\n' + eng + s[b:]
for w in ['BAND_EDGES', 'DUD_CAP', 'DUD_RATIO', 'FLOOR_PM', 'REF_CAP', 'MAX_PRIZE_X_N', 'MAX_RTP_N', 'MAX_PWIN_N', 'VALUE_SPAN_N', 'function solve(', 'overridePm', 'BOX_PRIZE_KINDS']:
    assert w not in s, ('old engine leftover', w)

# حدود المطوّر القديمة الخاصة بنموذج الفئات (لم تعد تؤثر بشيء) — تُزال من السجل
rep("  CodisBoxes.tiers().forEach(t=>R('box.price.' + t.id, 'السعر المرجعي لنموذج احتمالات ' + t.name + ' (كوين — ليس سعر الشراء)', t.price));\n", "")
rep("  [['box.VALUE_SPAN', 'أقصى فرق قيمة داخل الفئة الواحدة', 50], ['box.MAX_PRIZE_X', 'أعلى جائزة مسموحة × سعر البكج', 12], ['box.MAX_RTP', 'أعلى عائد متوقع (نسبة من السعر)', 0.95], ['box.MAX_PWIN', 'أعلى احتمال أن تفوق الجائزة السعر', 0.6],\n   ['box.keepOpened',",
    "  [['box.keepOpened',")
rep("  R('box.refTop', 'نسبة الفئة الأدنى بكل بكج (‰ — 827 = 82.7%)', 827);\n", "")
rep("  [['bx2', 50], ['bx3', 90], ['bx4', 165], ['bx5', 245]].forEach(a=>{ const t = CodisBoxes.tier(a[0]); R('box.minValue.' + a[0], 'الحد الأدنى لقيمة جائزة ' + (t ? t.name : a[0]), a[1]); });\n", "")

# ===================== 2) البيانات: سجل الصندوق المفتوح يحفظ ندرته وجائزته (للتاريخ فقط — لا إعادة سحب) =====================
rep("if(x.cosmeticId) b.cosmeticId = String(x.cosmeticId); }",
    "if(x.cosmeticId) b.cosmeticId = String(x.cosmeticId); const rk = Math.trunc(Number(x.rar)); if(rk >= 1 && rk <= 10) b.rar = rk; if(typeof x.prize === 'string' && x.prize) b.prize = x.prize.slice(0, 120); if(typeof x.prizeDef === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(x.prizeDef)) b.prizeDef = x.prizeDef; }   /* CODIS-V70 */")

# ===================== 2ب) المكررات (قرار المالك: كل شيء يتكرر؛ مكرر المنتج الدائم يُفكَّك مقابل فضة بقاعدة بطاقات العقوبة) =====================
rep("function econNormRoomIntros(inv, iso, now){", """/* CODIS-V70: مكررات المنتجات الدائمة من الصناديق — declaration لا ترمي ولا تقرأ const؛ السجلات التالفة/المكررة تُسقط */
function econNormBoxDupes(inv, iso, now){
  try{
    const seen = {}, K = ['cosmetic', 'planTheme', 'confirmTheme', 'roomIntro'], TB = econBoxTierIds();
    return (Array.isArray(inv && inv.boxDupes) ? inv.boxDupes : []).filter(x=>x && typeof x === 'object' && typeof x.uid === 'string' && x.uid && x.uid.length <= 160 && K.indexOf(x.kind) !== -1 && typeof x.defId === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(x.defId) && Number(x.points) > 0 && Number(x.points) <= 14000)
      .filter(x=>{ if(seen[x.uid]) return false; seen[x.uid] = true; return true; })
      .map(x=>({ uid:x.uid, kind:x.kind, defId:x.defId, points:Number(x.points), tier:TB.indexOf(x.tier) !== -1 ? x.tier : '', sourceRef:String(x.sourceRef || '').slice(0, 160), acquiredAt:iso(x.acquiredAt) || now, status:'owned' }));
  }catch(e){ return []; }
}
function econNormRoomIntros(inv, iso, now){""")
rep("roomIntros:econNormRoomIntros(inv, iso, now) };", "roomIntros:econNormRoomIntros(inv, iso, now), boxDupes:econNormBoxDupes(inv, iso, now) };   /* CODIS-V70 */")
rep("    if(kind === 'pass'){ const p = CodisPasses.get(uid); return (p && p.status === 'owned') ?",
    "    if(kind === 'dupe'){ const d = CodisBoxDupes.get(uid); return (d && d.status === 'owned') ? { rec:d, name:CodisBoxDupes.name(d) + ' (مكرر)', gold:d.points, list:CodisBoxDupes.all } : null; }   /* CODIS-V70: القوة بالنقاط = قيمتها بالكوين */\n    if(kind === 'pass'){ const p = CodisPasses.get(uid); return (p && p.status === 'owned') ?")
rep("    else if(t.expired){ list = CodisHolidayCards.expired().filter(x=>x.kind === t.rec.kind); }",
    "    else if(kind === 'dupe'){ list = CodisBoxDupes.owned().filter(x=>x.kind === t.rec.kind && x.defId === t.rec.defId); }   /* CODIS-V70 */\n    else if(t.expired){ list = CodisHolidayCards.expired().filter(x=>x.kind === t.rec.kind); }")
rep("    if(kind === 'pass'){ const p = CodisPasses.get(uid); return p ? codisPassCardHtml(p, { plain:true }) : ''; }",
    "    if(kind === 'dupe'){ const d = CodisBoxDupes.get(uid); return d ? econDupeArtHtml(d) : ''; }   /* CODIS-V70 */\n    if(kind === 'pass'){ const p = CodisPasses.get(uid); return p ? codisPassCardHtml(p, { plain:true }) : ''; }")
rep("(s.expired ? 'منتهية الصلاحية' : econFmt(s.gold) + ' كوين')", "(s.expired ? 'منتهية الصلاحية' : s.kind === 'dupe' ? econFmt(s.gold) + ' نقطة قوة' : econFmt(s.gold) + ' كوين')")
rep("empty:'ما عندك بطاقات عطلة.' });\n", "empty:'ما عندك بطاقات عطلة.' });\n"
    "econItemRegister({ key:'dupes', name:'المكررات', icon:'gift', order:35, count:()=>CodisBoxDupes.owned().length,   /* CODIS-V70 */\n"
    "  html:()=>{ const t = econDupeTilesHtml(); return t.n ? econItemGroupHtml('dupes', 'المكررات', t.n, '<div class=\"shop-grid\" role=\"list\">' + t.html + '</div>') : ''; }, action:null, empty:'ما عندك مكررات.' });\n")
rep("elements = pouches + passes + hc + hcDead + codisVoucherTotalSafe() + boxes;", "elements = pouches + passes + hc + hcDead + codisVoucherTotalSafe() + boxes + (()=>{ try{ return CodisBoxDupes.owned().length; }catch(e){ return 0; } })();   /* CODIS-V70: المكررات */")

# ===================== 3) القسائم: جوائز الصناديق = مجموعات قسائم الصندوق التالي (من المحرك) =====================
rep("  function prizes(tierId){ const d = def(tierId); return d ? [{ id:d.id, kind:'voucher', tier:d.tier, name:d.name, enabled:true }] : []; }",
    "  function prizes(tierId){ try{ return CodisBoxes.TYPES.voucher.items({ tier:tierId }); }catch(e){ return []; } }   /* CODIS-V70: مجموعات 2–5 من قسائم الصندوق التالي فقط */")

# ===================== 4) المنتجات التجميلية: منح من الصندوق + لا شراء مباشر =====================
GUARD = "  function buyBoxOnly(id){ if(!CodisLimits.bypass('cosmetic.boxOnly')) return { ok:false, reason:'boxonly' }; return buy(id); }   /* CODIS-V70: من الصناديق فقط */\n"
rep("  return { defs:()=>DEFS.slice(), def, targets, target, heal, owns, owned, equippedId, equippedMap, isEquipped, price, buy, equip, unequip };",
    "  function grant(o){ const d = o && def(o.id); if(!d || rec(d.id)) return null; const r = { id:d.id, source:'box', sourceRef:String(o.sourceRef || ''), acquiredAt:econNowIso(), paid:null }; st().owned.push(r); return r; }   /* CODIS-V70: داخل transact فقط */\n" + GUARD +
    "  return { defs:()=>DEFS.slice(), def, targets, target, heal, owns, owned, equippedId, equippedMap, isEquipped, price, buy:buyBoxOnly, grant, equip, unequip };")
rep("  return { defs:()=>DEFS.slice(), def, owns, owned, heal, equippedId, isEquipped, price, buy, equip, unequip };",
    "  function grant(o){ const d = o && def(o.id); if(!d || rec(d.id)) return null; const r = { id:d.id, source:'box', sourceRef:String(o.sourceRef || ''), acquiredAt:econNowIso(), paid:null }; st().owned.push(r); return r; }   /* CODIS-V70 */\n" + GUARD +
    "  return { defs:()=>DEFS.slice(), def, owns, owned, heal, equippedId, isEquipped, price, buy:buyBoxOnly, grant, equip, unequip };")
rep("  return { defs:()=>DEFS.slice(), def, forRoom, owns, owned, heal, price, buy };",
    "  function grant(o){ const d = o && def(o.id); if(!d || rec(d.id)) return null; const r = { id:d.id, room:d.room, source:'box', sourceRef:String(o.sourceRef || ''), acquiredAt:econNowIso(), paid:null }; st().owned.push(r); return r; }   /* CODIS-V70 */\n" + GUARD +
    "  return { defs:()=>DEFS.slice(), def, forRoom, owns, owned, heal, price, buy:buyBoxOnly, grant };")
rep("  return { defs:()=>DEFS.slice(), def, owns, owned, equippedFor, isEquipped, price, value, cardLabel, prizes, grant, buy, equip, unequip };",
    GUARD + "  return { defs:()=>DEFS.slice(), def, owns, owned, equippedFor, isEquipped, price, value, cardLabel, prizes, grant, buy:buyBoxOnly, equip, unequip };")

# المتجر: بلا سعر ولا شراء — «يُحصل عليه من الصناديق» + القوة
rep("  const P = CodisPlanThemes, own = P.owns(d.id), on = P.isEquipped(d.id), R = codisPtRoom(d), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver);\n  const badge",
    "  const P = CodisPlanThemes, own = P.owns(d.id), on = P.isEquipped(d.id), R = codisPtRoom(d), ok = true;   /* CODIS-V70 */\n  const badge")
rep("  const C = CodisConfirmThemes, own = C.owns(d.id), on = C.isEquipped(d.id), sv = CodisWallet.silverBalance(), ok = own || CodisLimits.afford(sv, d.silver);\n  const badge",
    "  const C = CodisConfirmThemes, own = C.owns(d.id), on = C.isEquipped(d.id), ok = true;   /* CODIS-V70 */\n  const badge")
rep("    : '<span class=\"pt-mbadge is-price' + (ok ? '' : ' is-short') + '\">' + econSilver(d.silver) + '</span>';", "    : econBoxOnlyBadgeHtml(d.id);", 2)
rep("d.rarityAr + ' · ' + (on ? 'مجهّز الآن' : own ? 'تملكه' : econFmt(d.silver) + ' فضة') + ' — افتح", "econBoxDefRarName(d.id) + ' · ' + (on ? 'مجهّز الآن' : own ? 'تملكه' : 'من الصناديق') + ' — افتح", 2)
rep("ok = own || CodisLimits.afford(sv, d.silver), busy = econStoreBusy, R = codisPtRoom(d);", "ok = true, busy = econStoreBusy, R = codisPtRoom(d);   /* CODIS-V70 */")
rep("ok = own || CodisLimits.afford(sv, d.silver), busy = econStoreBusy;\n  const cur = C.equippedId()", "ok = true, busy = econStoreBusy;   /* CODIS-V70 */\n  const cur = C.equippedId()")
rep("    : '<span class=\"pt-ov-st\">غير مملوك</span><span class=\"pt-ov-price\">' + econSilver(d.silver) + '<small>فضة</small></span>';", "    : econBoxOnlyStateHtml(d.id);   /* CODIS-V70 */", 2)
rep("  const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة', dis = busy;",
    "  if(!own) return '<div class=\"pt-ov-state\">' + state + '</div><p class=\"pt-ov-note\">' + escapeHtml(econBoxOnlyNote()) + '</p>';   /* CODIS-V70: لا شراء مباشر */\n  const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة', dis = busy;")
rep("  const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة';\n",
    "  if(!own) return '<div class=\"pt-ov-state\">' + state + '</div><p class=\"pt-ov-note\">' + escapeHtml(econBoxOnlyNote()) + '</p>';   /* CODIS-V70: لا شراء مباشر */\n  const lab = on ? 'إزالة الثيم' : own ? 'تجهيز الثيم' : 'شراء بالفضة';\n")
rep("'<div class=\"pt-ov-head\"><div class=\"pt-ov-chips\"><span class=\"pt-rar\">' + escapeHtml(d.rarityAr) + '</span>", "'<div class=\"pt-ov-head\"><div class=\"pt-ov-chips\">' + econBoxDefRarHtml(d.id) + '", 3)
rep("<div><dt>الندرة</dt><dd>' + escapeHtml(d.rarityAr) + '</dd>", "<div><dt>الندرة</dt><dd>' + escapeHtml(econBoxDefRarName(d.id)) + '</dd></div><div><dt>القوة</dt><dd>' + escapeHtml(econBoxDefPowTxt(d.id)) + '</dd>", 3)
rep("أربعة منتجات مستقلة، كل واحد يُشترى وحده بسعره.", "أربعة منتجات مستقلة تُحصل من البكجات فقط.", 2)
rep("مشهد ترحيبي قصير يُعرض كلما دخلت الغرفة. لكل غرفة بدايتها الخاصة وسعرها، وتعمل تلقائياً بعد الشراء — بلا تجهيز.", "مشهد ترحيبي قصير يُعرض كلما دخلت الغرفة. لكل غرفة بدايتها الخاصة، تُحصل من البكجات فقط وتعمل تلقائياً بعد الحصول عليها — بلا تجهيز.")

# ===================== 5) مستوى الكشف ولونه من ندرة الصندوق (لا من C/B/A/S/SS ولا القيمة القديمة) =====================
rep("  function valueOfResult(r){ try{ return (r && r.item) ? Number(CodisBoxes.valueOf(r.item)) : NaN; }catch(e){ return NaN; } }\n  function levelOfResult(r){ return levelOfValue(valueOfResult(r)); }",
    "  /* CODIS-V70: نتيجة صندوق = قوتها بالنقاط، ومستوى الكشف = مستوى ندرتها (CODIS_BOX_RARITY_DEFS.reveal.level) ولونها = لون الندرة */\n"
    "  function valueOfResult(r){ try{ if(r && isFinite(r.points)) return Number(r.points); return (r && r.item) ? Number(CodisBoxes.valueOf(r.item)) : NaN; }catch(e){ return NaN; } }\n"
    "  function rarOf(r){ try{ return r ? (r.boxRarity || (r.rank ? CodisBoxClassifier.byRank(r.rank) : null)) : null; }catch(e){ return null; } }\n"
    "  function levelOfResult(r){ const R = rarOf(r); return R ? R.reveal.level : levelOfValue(valueOfResult(r)); }\n"
    "  function infoOfResult(r){ const L = info(levelOfResult(r)), R = rarOf(r); return (R && R.rank > 1) ? Object.assign({}, L, { rgb:R.rgb, rgb2:R.rgb2, rarity:R }) : L; }")
rep("  return { LEVELS:LEVELS, levelOfValue:levelOfValue, levelOfResult:levelOfResult, valueOfResult:valueOfResult, info:info };",
    "  return { LEVELS:LEVELS, levelOfValue:levelOfValue, levelOfResult:levelOfResult, valueOfResult:valueOfResult, info:info, infoOfResult:infoOfResult };")
rep("      const lv = CodisRevealLevels.levelOfResult(r), RL = CodisRevealLevels.info(lv), calm = econCalm();", "      const lv = CodisRevealLevels.levelOfResult(r), RL = CodisRevealLevels.infoOfResult(r), calm = econCalm();")
rep("const items = ord.map(o=>{ const r = res.items[o.i], RL = CodisRevealLevels.info(o.lv); return", "const items = ord.map(o=>{ const r = res.items[o.i], RL = CodisRevealLevels.infoOfResult(r); return")
rep("    const lv = CodisRevealLevels.levelOfResult(o.result), RL = CodisRevealLevels.info(lv);", "    const lv = CodisRevealLevels.levelOfResult(o.result), RL = CodisRevealLevels.infoOfResult(o.result);")
# المشهد 3D: وجه الجوائز الجديدة + اسم الندرة ونوع الجائزة
rep("      let html = '', tone = (r.rarity && r.rarity.tone) || 'C';\n",
    "      let html = '', tone = (r.rarity && r.rarity.tone) || 'C';\n      { const sp = econBoxResArtHtml(r, true), rk = econBoxResRank(r); if(sp) return { html:'<div class=\"bx-stage is-done brx-frame\" data-brar=\"' + rk + '\" style=\"' + econBoxRarStyle(rk) + '\"><div class=\"bx-reveal store-detail-art is-bare\">' + sp + '</div></div>', tone:tone, sel:'.bx-reveal > *' }; }   /* CODIS-V70 */\n")
rep("    return { face:faceOf(r), title:name || 'مكافأة', sub:(r.rarity && r.rarity.name) || '', tag:kind + ((t && t.name) ? ' · ' + t.name : ''), rgb:rgb, rgb2:rgb2, font:fontFam() };",
    "    let K = null; try{ K = econBoxResInfo(r); }catch(e){ K = null; }   /* CODIS-V70 */\n"
    "    return { face:faceOf(r), title:(K && K.name) || name || 'مكافأة', sub:econBoxRarName(r), tag:((K && K.kindAr) || kind) + ((t && t.name) ? ' · ' + t.name : ''), rgb:rgb, rgb2:rgb2, font:fontFam() };")

# ===================== 6) المتجر والشراء والفتح =====================
rep("        '<div class=\"bx-lv\" aria-hidden=\"true\">' + [1, 2, 3, 4, 5].map(i=>'<i' + (i <= t.index ? ' class=\"on\"' : '') + '></i>').join('') + '</div>' +\n",
    "        '<div class=\"bx-lv\" aria-hidden=\"true\">' + [1, 2, 3, 4, 5].map(i=>'<i' + (i <= t.index ? ' class=\"on\"' : '') + '></i>').join('') + '</div>' + econBoxRarStripHtml(t) +   /* CODIS-V70 */\n")
rep("showToast('هذا البكج غير متاح حالياً — لا توجد عناصر مؤهّلة له', 'var(--warning)')", "showToast(econBoxEmptyMsg(t), 'var(--warning)')", 2)
rep("r.reason === 'empty' ? 'هذا البكج غير متاح حالياً' : r.reason === 'save' ? 'تعذّر الحفظ — لم يُخصم شيء' : 'تعذّر الشراء'",
    "r.reason === 'empty' ? econBoxEmptyMsg(t) : r.reason === 'save' ? 'تعذّر الحفظ — لم يُخصم شيء' : 'تعذّر الشراء'")
rep("res.reason === 'empty' ? 'هذا البكج غير متاح حالياً' :",
    "res.reason === 'empty' ? econBoxEmptyMsg(t) : res.reason === 'exhausted' ? 'نفدت عناصر ندرة سُحبت أثناء الفتح الجماعي — ما انخصم شي ولا انفتح أي بكج، جرّب الفتح الفردي' :")
rep("r.reason === 'empty' ? 'ماكو مكافآت مؤهّلة بالمتجر — البكج بقي مغلقاً'", "r.reason === 'empty' ? econBoxEmptyMsg(CodisBoxes.tier(s.tier)) + ' — البكج بقي مغلقاً'")
rep("    } else if(r.holiday){   /* الجائزة بطاقة عطلة:", "    } else if(r.planTheme || r.confirmTheme || r.roomIntro || r.dupe){   /* CODIS-V70: ثيم غرفة / ثيم موافقة / بداية غرفة / مكرر */\n      body.innerHTML = econBoxCosRevealHtml(r, t, left);\n    } else if(r.holiday){   /* الجائزة بطاقة عطلة:")
rep("      body.innerHTML = '<div class=\"bx-stage is-done\"><div class=\"bx-reveal bx-pass-art vch-reveal\">' + econVoucherArt(vd.tier, { big:true }) + '</div></div>' +\n        '<h3 id=\"econ-box-title\" class=\"bx-reveal\">' + escapeHtml(vd.name) + '</h3>' +",
    "      body.innerHTML = '<div class=\"bx-stage is-done\"><div class=\"bx-reveal bx-pass-art vch-reveal\">' + econBoxResArtHtml(r, true) + '</div></div>' +\n        '<h3 id=\"econ-box-title\" class=\"bx-reveal\">' + escapeHtml(econFmt(r.voucher.n || 1) + ' × ' + vd.name) + '</h3>' +   /* CODIS-V70: مجموعة */")
rep("      '<div class=\"store-detail-tags bx-reveal\">' + econRarityBadge(rar.tone, rar.id, rar.name, rar.order) + '</div>' +\n", "")
rep("    codisFitRewardCard(body); codisWatchRewardCards(body); return;\n  }\n  const opening = s.phase === 'opening';",
    "    econBoxRevealMark(body, r);   /* CODIS-V70: هوية الندرة لكل الأنواع */\n    codisFitRewardCard(body); codisWatchRewardCards(body); return;\n  }\n  const opening = s.phase === 'opening';")
rep("if(c.cosmetic) parts.push(econFmt(c.cosmetic) + ' مظهر بطاقة');", "if(c.cosmetic) parts.push(econFmt(c.cosmetic) + ' مظهر');")
rep("' ×' + econFmt(r.n) + ' · دفعت ' + econCoin(r.total) + '</p>", "' ×' + econFmt(r.n) + ' · دفعت ' + econGem(r.total) + '</p>")

# ===================== 7) دوال الواجهة (تحل محل الدالة بالاسم نفسه، والجديدة تُضاف) =====================
ui = clean(rd('identity', 'v70_ui.js'), 'ui')
lines = ui.split('\n'); FN = []; buf = []; i = 0
while i < len(lines):
    ln = lines[i]
    m = re.match(r'(?:async )?function (\w+)\(', ln)
    if m:
        body = [ln]
        if not (ln.rstrip().endswith('}') and ln.count('{') == ln.count('}')):
            i += 1
            while lines[i] != '}': body.append(lines[i]); i += 1
            body.append('}')
        FN.append((m.group(1), '\n'.join(buf + body) + '\n')); buf = []
    elif ln.startswith('/*') and i > 0: buf.append(ln)
    else: buf = []
    i += 1
new_fns = []; replaced = []
for name, code in FN:
    sp = fn_span(s, name)
    if sp: s = s[:sp[0]] + code + s[sp[1]:]; replaced.append(name)
    else: new_fns.append(code)
k = s.index('\nfunction econBoxesHtml(') + 1
s = s[:k] + '/* ===== CODIS-V70 · واجهة ===== */\n' + ''.join(new_fns) + s[k:]
need = {'econBoxOddsHtml', 'econPackTileHtml', 'econPackKindOf', 'econPackNameOf', 'econPackExtraRows', 'econPackPaint', 'econBulkCounts', 'econBulkBackRows', 'econBulkInfo', 'econBulkCellHtml',
        'econRoomIntroCardHtml', 'codisRiOvDynHtml', 'econRoomIntroBuy', 'econPlanThemeBuy', 'econConfirmThemeBuy', 'econCosBuy', 'econCosmeticsShopHtml'}
assert need <= set(replaced), sorted(need - set(replaced))

# ===================== 8) CSS =====================
css = clean(rd('identity', 'v70.css'), 'css')
assert '*/' not in re.sub(r'/\*.*?\*/', '', css, flags=re.S), 'stray comment end in css'
i = s.index('<style id="codis-v69-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v70-css">\n/* CODIS-V70 */\n' + css + '</style>' + s[j:]

assert s.count('const CodisBoxes = (function(){') == 1 and s.count('const CODIS_BOX_RARITY_DEFS') == 1 and 'econBoxRevealMark(body, r);' in s
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v70 applied; replaced', len(replaced), 'functions, added', len(new_fns))
