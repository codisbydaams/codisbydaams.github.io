/* ===== CODIS-V70 · واجهة الصناديق بالندرات العشر (عرض فقط — كل رقم من CodisBoxes.layout/effective نفسها التي يسحب بها roll) ===== */
function econBoxRar(rank){ return CodisBoxClassifier.byRank(rank); }
/* هوية الندرة: متغيرات من تعريفها (مصدر واحد للألوان) — الإطار/الشارة/الحواف فقط، لا تمسّ رسم المنتج */
function econBoxRarStyle(rank){ const R = econBoxRar(rank); return R ? '--brx:' + R.rgb + ';--brx2:' + R.rgb2 + ';--brx-ink:' + R.ink + ';--brx-inkd:' + R.inkDark + ';--brx-glow:' + R.show.glow : ''; }
function econBoxRarTagHtml(rank, o){
  const R = econBoxRar(rank); if(!R) return ''; o = o || {};
  return '<span class="brx-tag' + (o.cls ? ' ' + o.cls : '') + '" data-brar="' + R.rank + '" data-frame="' + R.show.frame + '" style="' + econBoxRarStyle(R.rank) + '"><i class="brx-dot" aria-hidden="true"></i><span class="brx-tn">' + escapeHtml(R.ar) + '</span>' + (o.pct !== undefined ? '<b class="brx-tp" dir="ltr">' + escapeHtml(String(o.pct)) + '%</b>' : '') + '</span>';
}
function econBoxResRank(r){ return r ? (r.rank || (r.boxRarity && r.boxRarity.rank) || 0) : 0; }
function econBoxRarName(r){ const R = r && (r.boxRarity || econBoxRar(r.rank)); return R ? R.ar : ((r && r.rarity && r.rarity.name) || ''); }
function econBoxPts(p){ return econFmt(Math.round(Number(p) * 100) / 100) + ' نقطة'; }
/* شريط الندرات الست على بطاقة البكج بالمتجر (عرض فقط؛ التفاصيل الكاملة بنافذة البكج) */
function econBoxRarStripHtml(t){
  const rows = CodisBoxes.layout(t);
  return '<ul class="brx-strip" aria-hidden="true">' + rows.map(o=>'<li data-brar="' + o.rank + '" class="' + (o.n ? '' : 'is-empty') + '" style="' + econBoxRarStyle(o.rank) + '"><i></i><span>' + escapeHtml(o.name) + '</span><b dir="ltr">' + o.pct + '%</b></li>').join('') + '</ul>';
}
function econBoxEmptyMsg(t){
  const e = t ? CodisBoxes.emptyRanks(t) : [];
  return e.length ? 'هذا البكج غير متاح حالياً — ندرة «' + e.map(R=>R.ar).join('، ') + '» ما بيها عناصر مؤهّلة لك' : 'هذا البكج غير متاح حالياً';
}
/* المنتجات التي تُحصل من الصناديق فقط (مظاهر البطاقات · ثيمات الغرف · ثيمات الموافقة · بدايات الغرف) */
function econBoxOnlyPowerHtml(defId){ const p = CodisBoxes.powerOfDef(defId); return isFinite(p) ? '<span class="brx-pow">القوة: <b dir="ltr">' + escapeHtml(econFmt(p)) + '</b> نقطة</span>' : ''; }
function econBoxOnlyBadgeHtml(defId){ return '<span class="pt-mbadge is-boxonly">من الصناديق</span>'; }
function econBoxOnlyStateHtml(defId){
  const R = CodisBoxes.rarityOfDef(defId);
  return '<span class="pt-ov-st">غير مملوك</span><span class="brx-only">يُحصل عليه من الصناديق</span>' + econBoxOnlyPowerHtml(defId) + (R ? econBoxRarTagHtml(R.rank) : '');
}
function econBoxDefRarHtml(defId){ const R = CodisBoxes.rarityOfDef(defId); return R ? econBoxRarTagHtml(R.rank) : ''; }
function econBoxDefRarName(defId){ const R = CodisBoxes.rarityOfDef(defId); return R ? R.ar : '—'; }
function econBoxDefPowTxt(defId){ const p = CodisBoxes.powerOfDef(defId); return isFinite(p) ? econBoxPts(p) : '—'; }
function econBoxOnlyNote(){ return 'لا يُشترى مباشرة — يُحصل عليه من البكجات فقط، والمعاينة والتفاصيل متاحة هنا.'; }
/* رسم جائزة تجميلية جديدة (ثيم غرفة · ثيم موافقة · بداية غرفة) بإطار 4:5 موحّد — الرسم الأصلي للمنتج كما هو */
function econBoxCosArtHtml(kind, defId){
  try{
    if(kind === 'planTheme'){ const d = CodisPlanThemes.def(defId); return '<div class="brx-cos is-pt" data-pt-fam="' + escapeHtml(d.family || '') + '">' + codisPlanThemeStageHtml(d.id, false) + '<span class="brx-cos-n">' + escapeHtml(d.ar) + '<small>' + escapeHtml(codisPtRoom(d).room) + '</small></span></div>'; }
    if(kind === 'confirmTheme'){ const d = CodisConfirmThemes.def(defId); return '<div class="brx-cos is-cf">' + econCfMiniHtml(d) + '<span class="brx-cos-n">' + escapeHtml(d.ar) + '<small>ثيم نوافذ الموافقة</small></span></div>'; }
    if(kind === 'roomIntro'){ const d = CodisRoomIntros.def(defId); return '<div class="brx-cos is-ri">' + codisRiThumbHtml(d) + '<span class="brx-cos-n">' + escapeHtml(d.ar) + '<small>' + escapeHtml('بداية ' + d.roomAr) + '</small></span></div>'; }
  }catch(e){}
  return '<div class="brx-cos"></div>';
}
function econBoxResInfo(r){
  const K = { reward:'بطاقة مكافأة', pass:'بطاقة تجاوز', holiday:'بطاقة عطلة', pouch:'كيس فضة', cosmetic:'مظهر بطاقة', voucher:'مجموعة قسائم', planTheme:'ثيم غرفة', confirmTheme:'ثيم نوافذ الموافقة', roomIntro:'بداية غرفة' };
  const k = r.prizeKind || (r.cosmetic ? 'cosmetic' : r.voucher ? 'voucher' : r.pouch ? 'pouch' : r.pass ? 'pass' : r.holiday ? 'holiday' : 'reward');
  let name = (r.item && r.item.name) || '';
  try{
    if(k === 'cosmetic') name = CodisCosmetics.def(r.cosmetic ? r.cosmetic.id : r.item.cosmeticId).name;
    else if(k === 'voucher') name = econFmt(r.voucher.n || r.item.n || 1) + ' × ' + r.voucher.def.name;
    else if(k === 'pouch') name = CodisPouches.def(r.pouch.type).name;
    else if(k === 'pass') name = CodisPasses.label(r.pass);
    else if(k === 'holiday'){ const d = CodisHolidayCards.def(r.holiday.kind); name = d ? d.name : 'بطاقة عطلة'; }
    else if(k === 'planTheme'){ const d = CodisPlanThemes.def(r.item.defId); name = d.ar + ' · ' + codisPtRoom(d).room; }
    else if(k === 'confirmTheme'){ const d = CodisConfirmThemes.def(r.item.defId); name = 'ثيم الموافقة ' + d.ar; }
    else if(k === 'roomIntro'){ const d = CodisRoomIntros.def(r.item.defId); name = 'بداية ' + d.roomAr + ' «' + d.ar + '»'; }
  }catch(e){}
  return { kind:k, kindAr:(K[k] || 'جائزة') + (r.dupe ? ' · مكرر' : ''), name:name || 'جائزة', dupe:!!r.dupe };
}
/* وجه الجائزة لنافذة النتيجة/×10/المشهد: الرسم الحقيقي لكل نوع */
function econBoxResArtHtml(r, big){
  const k = econBoxResInfo(r).kind;
  if(k === 'planTheme' || k === 'confirmTheme' || k === 'roomIntro') return econBoxCosArtHtml(k, r.item.defId);
  if(k === 'cosmetic' && r.dupe){ try{ return econCosmeticPreviewHtml(CodisCosmetics.def(r.item.cosmeticId)); }catch(e){ return ''; } }
  if(k === 'voucher') return '<div class="brx-vset">' + econVoucherArt(r.voucher.def.tier, big ? { big:true } : {}) + '<b class="brx-vn" dir="ltr">×' + econFmt(r.voucher.n || 1) + '</b></div>';
  return '';
}

function econBoxOddsHtml(rows){
  if(!rows.length) return '<div class="bx-none">البكج غير متاح حالياً — في ندرة ما بيها عناصر مؤهّلة</div>';
  return '<ul class="bx-odds brx-odds" aria-label="احتمالات الندرات الست">' + rows.map(o=>'<li data-brar="' + o.rank + '" style="' + econBoxRarStyle(o.rank) + '"><span>' + econBoxRarTagHtml(o.rank) + '<small class="brx-on">' + econFmt(o.n) + ' عنصر</small></span><b dir="ltr">' + o.pct + '%</b><span class="bx-bar"><i style="width:' + o.pct + '%"></i></span></li>').join('') +
    '<li class="bx-total"><span>المجموع</span><b dir="ltr">' + rows.reduce((s, o)=>s + o.pct, 0) + '%</b></li></ul>';
}
function econPackTileHtml(it, rar){
  if(it.kind === 'planTheme' || it.kind === 'confirmTheme' || it.kind === 'roomIntro') return '<div class="pk-tile is-boxcos" role="listitem" data-id="' + escapeHtml(it.id) + '">' + econBoxCosArtHtml(it.kind, it.defId) + '</div>';   /* CODIS-V70 */
  if(it.kind === 'holiday') return '<div class="pk-tile is-holiday" role="listitem" data-id="' + escapeHtml(it.id) + '">' + hcdCardHtml({ kind:it.cardKind, status:'owned', expiresAt:'' }, { sub:CodisHolidayCards.def(it.cardKind).ui.shopSub }) + '</div>';
  if(it.kind === 'voucher') return '<div class="pk-tile is-voucher" role="listitem" data-id="' + escapeHtml(it.id) + '"><div class="brx-vset">' + econVoucherArt(it.tier) + '<b class="brx-vn" dir="ltr">×' + econFmt(it.n || 1) + '</b></div></div>';   /* CODIS-V70: مجموعة */
  if(it.kind === 'pouch') return '<div class="pk-tile is-pouch" role="listitem" data-id="' + escapeHtml(it.id) + '"><div class="pch-art">' + econPouchSvg(it.pouchType) + '</div></div>';
  if(it.kind === 'cosmetic') return '<div class="pk-tile is-cosmetic" role="listitem" data-id="' + escapeHtml(it.id) + '">' + econCosmeticPreviewHtml(CodisCosmetics.def(it.cosmeticId)) + '</div>';
  if(it.kind === 'pass') return '<div class="pk-tile is-pass" role="listitem" data-id="' + escapeHtml(it.id) + '">' + codisPassCardHtml(it, { plain:true }) + '</div>';
  if(codisSlotOf(it)) return '<div class="pk-tile" role="listitem" data-id="' + escapeHtml(it.id) + '">' + econStoreFaceHtml(it, rar, { label:it.name }) + '</div>';
  const plain = !econStoreArtAr(it, rar);
  const art = plain ? '<div class="pk-plain">' + codisPlainCardHtml(it.name, rar, { stickerId:it.stickerId }) + '</div>' : econStoreFaceHtml(it, rar, { label:it.name });
  return '<div class="pk-tile' + (plain ? ' is-plain' : '') + '" role="listitem" data-id="' + escapeHtml(it.id) + '">' + art + '</div>';
}
function econPackKindOf(it){ const K = { pass:'بطاقة تخطي عقوبة', holiday:'بطاقة عطلة', pouch:'كيس فضة', cosmetic:'مظهر بطاقة', voucher:'مجموعة قسائم', planTheme:'ثيم غرفة', confirmTheme:'ثيم نوافذ الموافقة', roomIntro:'بداية غرفة' }; return K[it.kind] || (it.room === 'weekly' ? 'مكافأة أسبوعية' : it.room === 'monthly' ? 'مكافأة شهرية' : 'مكافأة'); }
function econPackNameOf(it){
  try{
    if(it.kind === 'cosmetic'){ const d = CodisCosmetics.def(it.cosmeticId); if(d && d.name) return d.name; }
    if(it.kind === 'pass') return CodisPasses.title(it);
    if(it.kind === 'holiday'){ const d = CodisHolidayCards.def(it.cardKind); if(d && d.name) return d.name; }
    if(it.kind === 'pouch'){ const d = CodisPouches.def(it.pouchType); if(d && d.name) return d.name; }
    if(it.kind === 'voucher'){ const d = CodisVouchers.def(it.tier); if(d) return econFmt(it.n || 1) + ' × ' + d.name; }
  }catch(e){}
  return it.name || '—';
}
function econPackExtraRows(it){
  try{
    if(it.kind === 'pass') return [['الفترة', CodisPasses.scopeName(it.scope)], ['الشدة', econSevLabel(econNormSeverity(it.severity, 'MEDIUM'))], ['الاستعمال', 'مرة واحدة']];
    if(it.kind === 'holiday'){ const d = CodisHolidayCards.def(it.cardKind); return d && d.ui && d.ui.shopSub ? [['الاستعمال', d.ui.shopSub]] : []; }
    if(it.kind === 'pouch'){ const d = CodisPouches.def(it.pouchType); if(!d) return []; const r = d.rewards.slice().sort((a, b)=>a - b); return [['الفضة', econFmt(r[0]) + '–' + econFmt(r[r.length - 1])], ['الفتح', 'من «بحوزتك»']]; }
    if(it.kind === 'voucher'){ const t = CodisBoxes.tier(it.tier); return [['العدد', econFmt(it.n || 1) + ' قسائم'], ['الدمج اليدوي', econFmt(CodisVouchers.PER_BOX) + ' قسائم = ' + (t ? t.name : 'صندوق')], ['لديك', econFmt(CodisVouchers.count(it.tier)) + ' / ' + econFmt(CodisVouchers.PER_BOX)]]; }
    if(it.kind === 'planTheme' || it.kind === 'confirmTheme' || it.kind === 'roomIntro' || it.kind === 'cosmetic') return [['الملكية', 'دائمة'], ['إذا تكرر', 'يُفكَّك مقابل ' + econFmt(CodisDismantle.reward(CodisBoxes.valueOf(it))) + ' فضة']];
  }catch(e){}
  return [];
}
/* تفاصيل البكج: الندرات الست بألوانها واحتمالاتها وعدد عناصرها، ثم كل جائزة تحت ندرتها. الاحتمالات = نفسها بالسحب (لا نموذج ثانٍ) */
function econPackPaint(){
  const m = econPackModal(), body = document.getElementById('econ-pack-body'); if(!m || !body) return;
  const sheet = m.querySelector('.pk-modal'), t = econPackId ? CodisBoxes.tier(econPackId) : null;
  const close = '<div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="econPackClose()">إغلاق</button></div>';
  if(!t){
    if(sheet) sheet.removeAttribute('data-tone');
    body.innerHTML = '<h3 id="econ-pack-title">البكج غير متاح</h3><div class="eco-empty">هذا البكج ما عاد موجود في المتجر</div>' + close; return;
  }
  if(sheet) sheet.setAttribute('data-tone', t.tone);
  const rows = CodisBoxes.layout(t), ready = rows.every(o=>o.n > 0), total = rows.reduce((q, o)=>q + o.n, 0);
  const gem = '<span class="pk-gems" aria-hidden="true">' + [1,2,3,4,5].map(i=>'<i class="' + (i <= t.index ? 'on' : '') + '"></i>').join('') + '</span>';
  const hero = '<header class="pkx-hero"><div class="pkx-art">' + econBoxArt(t.index) + '</div><div class="pkx-id"><h3 id="econ-pack-title">' + escapeHtml(t.name) + '</h3>' +
    '<div class="pkx-tier">' + gem + '<span>المستوى ' + t.index + ' من 5</span></div><div class="pkx-price"><span>سعر الفتح</span>' + econGem(t.gems) + '</div></div></header>' +
    '<ul class="pkx-facts"><li><b>' + econFmt(total) + '</b><span>جائزة ممكنة</span></li><li><b>6</b><span>ندرات</span></li><li><b>' + escapeHtml(rows[0].name + ' ← ' + rows[5].name) + '</b><span>النطاق</span></li></ul>';
  const warn = ready ? '' : '<p class="brx-warn" role="status">' + escapeHtml(econBoxEmptyMsg(t)) + ' — لا يمكن شراؤه أو فتحه حتى تتوفر عناصر بكل ندرة.</p>';
  const seg = '<div class="pk-seg pkg-seg brx-seg" role="img" aria-label="' + escapeHtml(rows.map(o=>o.name + ' ' + o.pct + '%').join('، ')) + '">' + rows.map(o=>'<i style="flex:' + o.pct + ';' + econBoxRarStyle(o.rank) + '"></i>').join('') + '</div>';
  const odds = '<section class="pkg brx-tbl" aria-labelledby="brx-h"><div class="pkg-head"><h4 class="pkx-h" id="brx-h">الندرات واحتمالاتها</h4><span class="pkx-sum">المجموع <b dir="ltr">' + rows.reduce((q, o)=>q + o.pct, 0) + '%</b></span></div>' + seg +
    '<ul class="brx-rows" role="list">' + rows.map(o=>'<li role="listitem" data-brar="' + o.rank + '" class="' + (o.n ? '' : 'is-empty') + '" style="' + econBoxRarStyle(o.rank) + '">' + econBoxRarTagHtml(o.rank) +
      '<span class="brx-rr" dir="ltr">' + escapeHtml(econFmt(o.min) + '–' + econFmt(o.max)) + '</span><span class="brx-rn">' + (o.n ? econFmt(o.n) + ' عنصر' : 'فارغة') + '</span><b class="brx-rp" dir="ltr">' + o.pct + '%</b></li>').join('') + '</ul>' +
    '<p class="pkg-hint">طريقة السحب: تُختار الندرة أولاً بهذه النسب، ثم عنصر واحد بالتساوي من عناصرها. النطاق = قوة العنصر بالنقاط (أداة تصنيف، ليست عملة).</p></section>';
  const grid = rows.slice().reverse().filter(o=>o.n).map(o=>{
    const each = o.pct / o.n;
    return '<section class="pkg brx-grp" data-brar="' + o.rank + '" style="' + econBoxRarStyle(o.rank) + '" aria-label="' + escapeHtml('ندرة ' + o.name) + '"><div class="pkg-head">' + econBoxRarTagHtml(o.rank, { pct:o.pct }) + '<span class="pkx-sum">' + econFmt(o.n) + ' عنصر · الواحد <b dir="ltr">' + econPackPctTxt(each) + '</b></span></div>' +
      '<div class="pkg-grid" role="list">' + o.items.map(it=>{
        const nm = econPackNameOf(it), kind = econPackKindOf(it), pct = econPackPctTxt(each), p = CodisBoxes.valueOf(it);
        const front = econPackTileHtml(it, econRarityById(it.rarity)).replace(' role="listitem"', '');
        const back = ()=>codisCardBackHtml(nm, [['النوع', kind], ['الندرة', o.name], ['نسبة الحصول', '<b class="pkg-bp" dir="ltr">' + pct + '</b>', '', true], ['القوة', econBoxPts(p)]].concat(econPackExtraRows(it)),
          { tone:o.tone, kind:it.kind === 'voucher' ? 'box' : (it.kind === 'planTheme' || it.kind === 'confirmTheme' || it.kind === 'roomIntro') ? 'cosmetic' : (it.kind || 'reward'), note:'من ' + t.name + ' · كل سحب مستقل' });
        return '<div class="pkg-cell brx-cell" role="listitem" data-kind="' + escapeHtml(it.kind || 'reward') + '" data-brar="' + o.rank + '">' +
          codisFlipHtml(front, back, { cls:'pkg-flip', bk:'pk|' + t.id + '|' + it.id, label:nm + ' — ' + kind + ' — ' + o.name + ' — ' + pct }) +
          '<span class="pkg-cap"><span class="pkg-n" dir="auto">' + escapeHtml(nm) + '</span><b class="pkg-p" dir="ltr">' + pct + '</b></span></div>';
      }).join('') + '</div></section>';
  }).join('');
  CodisArt.set(body, ()=>hero + warn + odds + (grid || '<div class="eco-empty pk-empty">ماكو جوائز مؤهّلة حالياً</div>') + close);
  codisFitRewardCard(body); codisWatchRewardCards(body);
}
function econBulkCounts(res){
  const c = { reward:0, pass:0, holiday:0, pouch:0, cosmetic:0, voucher:0 };
  res.items.forEach(r=>{ const k = econBoxResInfo(r).kind; if(k === 'planTheme' || k === 'confirmTheme' || k === 'roomIntro') c.cosmetic++; else c[k] = (c[k] || 0) + 1; });
  return c;
}
function econBulkBackRows(r, inf, extra){
  const K = econBoxResInfo(r);
  return [['النوع', K.kindAr], ['الندرة', econBoxRarName(r)], isFinite(r.points) ? ['القوة', econBoxPts(r.points)] : null, ['من', r.tier && r.tier.name]].concat(extra || []);
}
function econBulkInfo(r){
  const K = econBoxResInfo(r), rk = econBoxResRank(r), chip = rk ? econBoxRarTagHtml(rk) : '';
  return { name:K.name, chip:chip, special:K.kind !== 'reward', kind:K.kind === 'planTheme' || K.kind === 'confirmTheme' || K.kind === 'roomIntro' ? 'cosmetic' : K.kind, prizeKind:K.kind };
}
function econBulkCellHtml(r, i, run, ord, best){
  const it = r.item, rar = r.rarity, inf = econBulkInfo(r), lv = CodisRevealLevels.levelOfResult(r), RL = CodisRevealLevels.infoOfResult(r), d = econBulkSch ? econBulkSch.at[i] : ECON_BULK_LEAD + ord * ECON_BULK_STEP, hold = econBulkSch ? econBulkSch.dur[i] : 300, rk = econBoxResRank(r);
  const special = econBoxResArtHtml(r, false);
  const art = special ? '<div class="pk-tile is-boxcos">' + special + '</div>' : r.pouch ? '<div class="pk-tile is-pouch"><div class="pch-art">' + econPouchSvg(r.pouch.type) + '</div></div>' : econPackTileHtml(it, rar).replace(' role="listitem"', '');
  return '<div class="bk-cell brx-frame' + (inf.special ? ' is-special' : '') + (best ? ' is-best' : '') + '" role="listitem" data-tone="' + escapeHtml(rar.tone) + '" data-kind="' + inf.kind + '" data-brar="' + rk + '" data-lv="' + lv + '"' + (rk >= 7 ? ' data-hot="1"' : '') + ' data-box="' + escapeHtml(r.box.uid) + '" style="--i:' + i + ';--d:' + d + 'ms;--hold:' + hold + 'ms;--lrgb:' + RL.rgb + ';--lrgb2:' + RL.rgb2 + ';' + econBoxRarStyle(rk) + '">' +
    '<span class="bk-no" dir="ltr" aria-label="البكج رقم ' + (i + 1) + '">' + (i + 1) + '</span>' + (best ? '<span class="bk-best">الأفضل</span>' : '') +
    (run ? '<div class="bk-chest" aria-hidden="true">' + CodisBoxCinema.rigHtml(r.tier.index, true) + '</div><span class="bk-burst" aria-hidden="true"></span>' : '') +
    '<div class="bk-card">' + codisFlipHtml(art, codisCardBackHtml(inf.name, econBulkBackRows(r, inf), { tone:rar.tone, kind:inf.kind === 'reward' ? 'reward' : inf.kind }), { label:inf.name + ' — ' + econBoxRarName(r) }) + '</div><p class="bk-name" dir="auto">' + escapeHtml(inf.name) + '</p><div class="bk-meta">' + inf.chip + '</div></div>';
}
/* نافذة النتيجة: الجوائز التجميلية الجديدة (ثيم غرفة/موافقة/بداية) — ملكية دائمة، والتجهيز من «بحوزتك» كما هو */
function econBoxCosRevealHtml(r, t, left){
  const K = econBoxResInfo(r), tail = r.dupe ? 'تملكه من قبل — انضاف كمكرر إلى «بحوزتك» ← العناصر، وتقدر تفككه مقابل ' + econFmt(CodisDismantle.reward(r.dupe.points)) + ' فضة'
    : r.prizeKind === 'roomIntro' ? 'صارت ملكك وتعمل تلقائياً عند دخول الغرفة' : 'صار ملكك الدائم — جهّزه من «بحوزتك» ← المظاهر';
  return '<div class="bx-stage is-done"><div class="bx-reveal store-detail-art is-bare">' + econBoxResArtHtml(r, true) + '</div></div>' +
    '<h3 id="econ-box-title" class="bx-reveal">' + escapeHtml(K.name) + '</h3>' +
    '<div class="store-detail-tags bx-reveal"><span class="st-tag">' + escapeHtml(K.kindAr) + '</span></div>' +
    '<p class="store-detail-note" role="status">طلع من ' + escapeHtml(t.name) + ' · فرصة الندرة ' + r.pct + '% · ' + tail + '</p>' +
    '<div class="modal-actions">' + (left ? '<button type="button" class="btn btn-achievement" onclick="econBoxNext()">افتح بكجاً آخر (' + econFmt(left) + ')</button>' : '') +
    '<button type="button" class="btn ' + (left ? 'btn-secondary' : 'btn-primary') + '" onclick="econBoxClose()">تمام</button></div>';
}
/* بعد رسم أي نتيجة: هوية الندرة على المسرح + شارة الندرة تحت العنوان (لكل الأنواع بمكان واحد) */
function econBoxRevealMark(body, r){
  try{
    const rk = econBoxResRank(r); if(!rk) return;
    const st = body.querySelector('.bx-stage') || body.firstElementChild; if(st){ st.classList.add('brx-frame'); st.setAttribute('data-brar', String(rk)); st.setAttribute('style', econBoxRarStyle(rk)); }
    const h = body.querySelector('#econ-box-title') || body.querySelector('h3'); if(h && !body.querySelector('.brx-tag.is-reveal')){ const w = document.createElement('div'); w.className = 'brx-revtag bx-reveal'; w.innerHTML = econBoxRarTagHtml(rk, { cls:'is-reveal' }) + (isFinite(r.points) ? '<span class="brx-pow">القوة ' + escapeHtml(econBoxPts(r.points)) + '</span>' : ''); h.insertAdjacentElement('afterend', w); }
  }catch(e){}
}
function econRoomIntroCardHtml(d, i, inInv){
  const R = CodisRoomIntros, own = R.owns(d.id);
  const st = own ? '<span class="ri-st is-own">' + codisIcon('check') + '<span>' + (inInv ? 'يعمل تلقائياً عند دخول الغرفة' : 'تملكه · يعمل تلقائياً') + '</span></span>'
    : '<span class="ri-price is-boxonly"><span class="brx-only">من الصناديق</span>' + econBoxOnlyPowerHtml(d.id) + '</span>';
  const pvLab = 'معاينة بداية ' + d.roomAr + ' «' + d.ar + '»' + (own ? ' — تملكها' : ' — يُحصل عليها من الصناديق');
  return '<article class="ri-card' + (own ? ' is-own' : '') + '" role="listitem" data-riid="' + d.id + '" data-ri-room="' + d.room + '" style="--i:' + (i || 0) + '">' +
    '<button type="button" class="ri-thumb" aria-haspopup="dialog" aria-label="' + escapeHtml(pvLab) + '" onclick="codisRiPreview(\'' + d.id + '\', this)">' + codisRiThumbHtml(d) +
      '<span class="ri-play" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M5 3.2v9.6L12.6 8Z" fill="currentColor"/></svg></span></button>' +
    '<div class="ri-body"><span class="ri-room">' + escapeHtml(d.roomAr) + '</span><h6 class="ri-name">' + escapeHtml(d.ar) + '</h6>' +
      '<p class="ri-short">' + escapeHtml(d.short) + '</p>' +
      '<div class="ri-foot">' + st + '<div class="ri-acts">' +
        '<button type="button" class="ri-b ri-b-pv" aria-haspopup="dialog" aria-label="' + escapeHtml(pvLab) + '" onclick="codisRiPreview(\'' + d.id + '\', this)">معاينة</button>' +
      '</div></div></div></article>';
}
function codisRiOvDynHtml(d){
  const R = CodisRoomIntros, own = R.owns(d.id);
  if(own) return '<div class="pt-ov-state"><span class="pt-ov-st is-on">مملوك · يعمل تلقائياً</span></div><p class="pt-ov-note">' + escapeHtml('تُعرض كلما دخلت ' + d.roomAr + ' من غرفة أخرى. لا تحتاج تجهيزاً.') + '</p>';
  return '<div class="pt-ov-state">' + econBoxOnlyStateHtml(d.id) + '</div><p class="pt-ov-note">' + escapeHtml(econBoxOnlyNote()) + '</p>';
}
async function econRoomIntroBuy(id){ codisSfx('invalid', { ctx:'unavailable' }); showToast('بدايات الغرف ما تنشترى مباشرة — تحصل عليها من البكجات', 'var(--warning)'); }
async function econPlanThemeBuy(id){ codisSfx('invalid', { ctx:'unavailable' }); showToast('الثيمات ما تنشترى مباشرة — تحصل عليها من البكجات', 'var(--warning)'); }
async function econConfirmThemeBuy(id){ codisSfx('invalid', { ctx:'unavailable' }); showToast('ثيمات الموافقة ما تنشترى مباشرة — تحصل عليها من البكجات', 'var(--warning)'); }
async function econCosBuy(id){ codisSfx('invalid', { ctx:'unavailable' }); showToast('مظاهر البطاقات ما تنشترى مباشرة — تحصل عليها من البكجات', 'var(--warning)'); }
function econCosmeticsShopHtml(){
  const C = CodisCosmetics;
  return '<section class="st-part cos-sec" id="eco-cosmetics" aria-labelledby="cos-h"><header class="st-part-head"><h4 class="hcd-title" id="cos-h">مظاهر البطاقات</h4></header><div class="hcd-grid cos-grid" role="list">' +
    C.defs().map((d, i)=>{
      const own = C.owns(d.id);
      const btn = own ? econCosEquipBtnHtml(d) : '<span class="brx-only-box" role="note" aria-label="' + escapeHtml(d.name + ' — يُحصل عليه من الصناديق') + '"><span class="brx-only">من الصناديق</span>' + econBoxOnlyPowerHtml(d.id) + '</span>';
      return '<div class="hcd-shop st-tile cos-tile" role="listitem" data-cos="' + d.id + '" style="--i:' + i + '"><div class="st-face" title="' + escapeHtml(d.desc) + '">' + econCosmeticPreviewHtml(d) + '</div>' +
        '<div class="st-cap"><span class="shop-name" dir="ltr">' + escapeHtml(d.name) + '</span><span class="st-sub">' + escapeHtml(d.ar) + '</span><span class="st-sub">' + escapeHtml('البطاقة #' + d.cardNo + ' · ' + (CODIS_CARD_RARITY_AR[d.card] || '')) + '</span>' +
        '<span class="st-tags"><span class="st-tag">' + escapeHtml(econCosTypeLabel(d)) + '</span>' + econCosStateTag(d) + '</span></div>' +
        '<div class="store-meta">' + btn + '</div></div>';
    }).join('') + '</div></section>';
}
/* المكررات في «بحوزتك» ← العناصر: بلاطة لكل منتج (العدد ×n) + زر التفكيك نفسه (econDismBtn ⇒ نافذة الكمية ⇒ CodisDismantle) */
function econDupeArtHtml(d){
  try{ if(d.kind === 'cosmetic') return econCosmeticPreviewHtml(CodisCosmetics.def(d.defId)); }catch(e){}
  return econBoxCosArtHtml(d.kind, d.defId);
}
function econDupeTilesHtml(){
  const owned = CodisBoxDupes.owned(); if(!owned.length) return { html:'', n:0 };
  const groups = {}, order = []; owned.forEach(d=>{ const k = d.kind + '|' + d.defId; if(!groups[k]){ groups[k] = []; order.push(k); } groups[k].push(d); });
  let i = 0;
  return { n:owned.length, html:order.map(k=>{ const g = groups[k], d = g[0], nm = CodisBoxDupes.name(d), R = CodisBoxClassifier.rarityOf(d.points);
    const back = codisCardBackHtml(nm, [['النوع', 'مكرر من الصناديق'], ['الندرة', R ? R.ar : '—'], ['القوة', econBoxPts(d.points)], ['التفكيك', econFmt(CodisDismantle.reward(d.points)) + ' فضة'], g.length > 1 ? ['العدد', '×' + econFmt(g.length)] : null], { tone:CodisBoxClassifier.tone(R ? R.rank : 1), kind:'cosmetic', note:'تملك الأصل — المكرر للتفكيك فقط' });
    return '<div class="st-tile brx-dupe" role="listitem" data-brar="' + (R ? R.rank : 0) + '" style="--i:' + (i++) + ';' + (R ? econBoxRarStyle(R.rank) : '') + '">' + codisFlipHtml('<div class="st-face">' + econDupeArtHtml(d) + (g.length > 1 ? '<span class="st-n" dir="ltr">×' + econFmt(g.length) + '</span>' : '') + '</div>', back, { label:nm + ' — مكرر' }) +
      '<div class="st-cap"><span class="shop-name">' + escapeHtml(nm) + '</span><span class="st-sub">مكرر' + (R ? ' · ' + escapeHtml(R.ar) : '') + '</span></div>' + econDismBtn('dupe', d.uid, d.points) + '</div>';
  }).join('') };
}
