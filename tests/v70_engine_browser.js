/* CODIS-V70 (3.57.0) — اختبار محرك الصناديق الجديد داخل الصفحة (كل اختبارات القسم 19 من طلب المالك).
   Run: VERBOSE=1 TEST=tests/v70_engine_browser.js node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_evaltest.mjs --cpu 1
   يعمل على بيانات الضيف المحلية ويستعيدها كاملة في النهاية. Returns { passed, failed, results[] }. */
(async function(){
  const out = [], T = (name, ok, info)=>out.push({ name, ok:!!ok, info:info === undefined ? '' : String(info) });
  const eq = (name, a, b)=>T(name, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' vs ' + JSON.stringify(b));
  const KEEP = JSON.stringify(data), wait = ms=>new Promise(r=>setTimeout(r, ms));
  const B = CodisBoxes, P = B.powerInfo, tier = id=>B.tier(id);
  const giveGems = n=>CodisWallet.transact([], ()=>{ const tx = CodisWallet.applyGems('ADMIN_GRANT', n, 'v70 test', 'admin', 'v70|gems|' + Math.random(), {}); return tx ? { ok:true } : { ok:false }; });
  const bal = ()=>({ c:CodisWallet.balance(), s:CodisWallet.silverBalance(), g:CodisWallet.gemBalance() });
  const rngSeq = vals=>{ let i = 0; CodisRewardEngine.setRng(()=>vals[Math.min(i++, vals.length - 1)]); };
  const rngReset = ()=>CodisRewardEngine.setRng(null);
  /* السحب: الندرة بعشوائية u1 ثم العنصر بـu2 — هذه تعطي موضع الندرة k (0..5) والعنصر j من n */
  const uRank = k=>{ const c = [0, 50, 75, 88, 95, 99, 100]; return (c[k] + c[k + 1]) / 2 / 100; };
  const uItem = (j, n)=>(j + .5) / n;
  try{
    T('guest is not admin (limits apply)', !(()=>{ try{ return CodisAccount.isAdmin(); }catch(e){ return false; } })());
    /* ===== 1) النقاط ===== */
    eq('40 coin = 40 pts', CodisBoxPoints.coins(40), 40);
    eq('100 coin = 100 pts', CodisBoxPoints.coins(100), 100);
    eq('500 silver = 250 pts', CodisBoxPoints.silver(500), 250);
    eq('1000 silver = 500 pts', CodisBoxPoints.silver(1000), 500);
    eq('points unit not divided again', CodisBoxPoints.of('points', 2500), 2500);
    T('invalid amount ⇒ NaN (unclassified)', isNaN(CodisBoxPoints.of('coin', -5)) && isNaN(CodisBoxPoints.of('gems', 5)));
    eq('3 silver vouchers @14 = 42 silver = 21 pts', P({ kind:'voucher', tier:'bx2', n:3, forBox:'bx1' }).points, 21);
    eq('5 silver vouchers = 35 pts', P({ kind:'voucher', tier:'bx2', n:5, forBox:'bx1' }).points, 35);
    eq('cosmetic crocShades 1999 silver = 999.5', B.powerOfDef('crocShades'), 999.5);
    eq('cosmetic signatureWink 2999 silver = 1499.5', B.powerOfDef('signatureWink'), 1499.5);
    T('every card cosmetic = silver ÷ 2', CodisCosmetics.defs().every(d=>B.powerOfDef(d.id) === d.silver / 2), CodisCosmetics.defs().map(d=>d.id + ':' + B.powerOfDef(d.id)).join(','));
    const FAM = { infernoCrystal:2500, frostCrystal:3100, agedWood:3500, blazingMeteor:6500 };
    T('all room themes by family points', CodisPlanThemes.defs().every(d=>B.powerOfDef(d.id) === FAM[d.family]), CodisPlanThemes.defs().map(d=>d.id + '/' + d.family + ':' + B.powerOfDef(d.id)).join(','));
    eq('room theme families present', Object.keys(CodisPlanThemes.defs().reduce((o, d)=>{ o[d.family] = 1; return o; }, {})).sort(), Object.keys(FAM).sort());
    eq('confirm themes 4 × 1500', CodisConfirmThemes.defs().map(d=>B.powerOfDef(d.id)), [1500, 1500, 1500, 1500]);
    eq('confirm theme ids', CodisConfirmThemes.defs().map(d=>d.id), ['earthConfirm', 'waterConfirm', 'fireConfirm', 'windConfirm']);
    eq('room intros 4 × 2500', CodisRoomIntros.defs().map(d=>d.id + ':' + B.powerOfDef(d.id)), ['planningIntro:2500', 'tasksIntro:2500', 'learnIntro:2500', 'habitsIntro:2500']);
    eq('pouch power = average silver ÷ 2 (no rounding)', CodisPouches.defs().map(d=>P({ kind:'pouch', pouchType:d.type }).points), CodisPouches.defs().map(d=>d.average / 2));
    eq('holiday power = base coin (no store markup)', CodisHolidayCards.kinds().map(k=>P({ kind:'holiday', cardKind:k }).points), CodisHolidayCards.kinds().map(k=>CodisHolidayCards.basePrice(k)));
    T('pass power = bypass cost coins', CodisPasses.prizes().every(x=>P(x).points === CodisPasses.price(x)));
    eq('no unclassified items', B.unclassified().map(c=>c.item.id), []);
    T('points are not a currency (no wallet field)', !('points' in data.wallet) && !('boxPoints' in data.wallet));

    /* ===== 2) حدود الندرات ===== */
    const BOUND = [[0, 1], [34.99, 1], [35, 2], [66.99, 2], [67, 3], [104.99, 3], [105, 4], [181.99, 4], [182, 5], [265.99, 5], [266, 6], [999.5, 6], [999.99, 6], [1000, 7], [1999.99, 7], [2000, 8], [2999.99, 8], [3000, 9], [5999.99, 9], [6000, 10], [14000, 10]];
    BOUND.forEach(([p, r])=>{ const R = CodisBoxClassifier.rarityOf(p); T('rarity(' + p + ') = ' + r, R && R.rank === r, R && R.rank); });
    T('>14000 / negative / NaN unclassified', CodisBoxClassifier.rarityOf(14000.01) === null && CodisBoxClassifier.rarityOf(-1) === null && CodisBoxClassifier.rarityOf(NaN) === null);
    eq('10 rarity names in order', CODIS_BOX_RARITY_DEFS.map(r=>r.ar), ['عادي', 'جيد', 'برونزي', 'فضي', 'ذهبي', 'بلاتين', 'ايس', 'ماستر', 'برو', 'أسطوري']);
    eq('ranges', CODIS_BOX_RARITY_DEFS.map(r=>r.min + '-' + r.max), ['0-35', '35-67', '67-105', '105-182', '182-266', '266-1000', '1000-2000', '2000-3000', '3000-6000', '6000-14000']);
    T('10 distinct colours', new Set(CODIS_BOX_RARITY_DEFS.map(r=>r.rgb)).size === 10);

    /* ===== 3) الصناديق ===== */
    eq('box ids', B.tiers().map(t=>t.id), ['bx1', 'bx2', 'bx3', 'bx4', 'bx5']);
    eq('box rarity ranges', B.tiers().map(t=>t.ranks.join('')), ['123456', '234567', '345678', '456789', '5678910']);
    T('odds 50/25/13/7/4/1 in every box, sum 100', B.tiers().every(t=>JSON.stringify(t.odds) === '[50,25,13,7,4,1]' && t.odds.reduce((a, b)=>a + b, 0) === 100));
    T('layout pct = tier odds (engine rows)', B.tiers().every(t=>JSON.stringify(B.layout(t).map(r=>r.pct)) === JSON.stringify(t.odds)));
    T('gem prices unchanged', JSON.stringify(B.tiers().map(t=>t.gems)) === JSON.stringify(['bx1', 'bx2', 'bx3', 'bx4', 'bx5'].map(econBoxGemPrice)), B.tiers().map(t=>t.gems));
    /* العرض = السحب: نسب نافذة التفاصيل ونافذة الفتح من الصفوف نفسها */
    econOpenStore(); await wait(400);
    for(const t of B.tiers()){
      econPackOpen(t.id); await wait(150);
      const shown = [...document.querySelectorAll('#econ-pack-body .brx-rows li')].map(li=>li.getAttribute('data-brar') + ':' + li.querySelector('.brx-rp').textContent.replace('%', ''));
      eq('details shows same rarities+odds as engine ' + t.id, shown, B.layout(t).map(r=>r.rank + ':' + r.pct));
      const odds = document.createElement('div'); odds.innerHTML = econBoxOddsHtml(B.effective(t));
      eq('open-window odds = engine ' + t.id, [...odds.querySelectorAll('li[data-brar]')].map(li=>li.getAttribute('data-brar') + ':' + li.querySelector('b').textContent.replace('%', '')), B.layout(t).map(r=>r.rank + ':' + r.pct));
      econPackClose();
    }
    /* سحب حقيقي: الندرة المسحوبة ضمن الست، والإحصاء قريب من النسب (20000 سحب، لا تغيير بالحالة) */
    rngReset();
    const t5 = tier('bx5'), cnt = {}; for(let i = 0; i < 20000; i++){ const r = B.roll(t5); cnt[r.rank] = (cnt[r.rank] || 0) + 1; }
    T('roll ranks only 5..10 for bx5', Object.keys(cnt).every(k=>+k >= 5 && +k <= 10), JSON.stringify(cnt));
    T('empirical odds ≈ 50/25/13/7/4/1 (±1.5%)', t5.ranks.every((rk, k)=>Math.abs((cnt[rk] || 0) / 200 - t5.odds[k]) < 1.5), JSON.stringify(cnt));
    T('rolled item belongs to rolled rarity', (()=>{ for(let i = 0; i < 300; i++){ const r = B.roll(tier('bx3')); if(CodisBoxClassifier.rarityOf(B.valueOf(r.item)).rank !== r.rank) return false; } return true; })());

    /* ===== 4) توزيع الجوائز ===== */
    const inBoxes = id=>B.tiers().filter(t=>B.layout(t).some(r=>r.items.some(x=>x.id === id))).map(t=>t.id);
    eq('21-pt pouch only in bx1', inBoxes('pouch|1'), ['bx1']);
    eq('1500 (confirm theme, ايس) in bx2..bx5', inBoxes('confirmtheme|earthConfirm'), ['bx2', 'bx3', 'bx4', 'bx5']);
    eq('2500 (intro/inferno, ماستر) in bx3..bx5', [inBoxes('roomintro|learnIntro'), inBoxes('plantheme|infernoCrystal')], [['bx3', 'bx4', 'bx5'], ['bx3', 'bx4', 'bx5']]);
    eq('3500 (aged wood, برو) in bx4..bx5', inBoxes('plantheme|agedWoodPlanning'), ['bx4', 'bx5']);
    eq('3100 (frost, برو) in bx4..bx5', inBoxes('plantheme|frostCrystalPlanning'), ['bx4', 'bx5']);
    eq('6500 (meteor, أسطوري) only bx5', inBoxes('plantheme|blazingMeteorPlanning'), ['bx5']);
    T('1500 classified ace / 2500 master / 3500 pro / 6500 legendary', [[1500, 'ace'], [2500, 'master'], [3500, 'pro'], [6500, 'legendary']].every(([p, id])=>CodisBoxClassifier.rarityOf(p).id === id));
    T('every eligible item sits in its own rarity row', B.tiers().every(t=>B.layout(t).every(r=>r.items.every(x=>CodisBoxClassifier.rarityOf(B.valueOf(x)).rank === r.rank))));
    T('no direct currency prizes', B.tiers().every(t=>B.layout(t).every(r=>r.items.every(x=>B.PRIZE_KINDS.indexOf(x.kind) !== -1 && ['coins', 'silver', 'gems', 'coin'].indexOf(x.kind) === -1))));
    eq('prize kinds', B.PRIZE_KINDS, ['reward', 'pass', 'holiday', 'pouch', 'voucher', 'cosmetic', 'planTheme', 'confirmTheme', 'roomIntro']);

    /* ===== 5) القسائم ===== */
    const vOf = t=>B.layout(tier(t)).reduce((a, r)=>a.concat(r.items.filter(x=>x.kind === 'voucher')), []);
    eq('bx1 gives silver (bx2) vouchers only', [...new Set(vOf('bx1').map(x=>x.tier))], ['bx2']);
    eq('bx2 gives crystal (bx3) vouchers only', [...new Set(vOf('bx2').map(x=>x.tier))], ['bx3']);
    eq('bx3 gives gold (bx4) vouchers only', [...new Set(vOf('bx3').map(x=>x.tier))], ['bx4']);
    eq('bx4 gives mythic (bx5) vouchers only', [...new Set(vOf('bx4').map(x=>x.tier))], ['bx5']);
    eq('bx5 gives no vouchers', vOf('bx5').length, 0);
    T('no single voucher anywhere', B.tiers().every(t=>vOf(t.id).every(x=>x.n >= 2 && x.n <= 5)));
    T('no same-tier voucher', B.tiers().every(t=>vOf(t.id).every(x=>x.tier !== t.id)));
    eq('bx2 voucher sets = only those in rarities 2..7 (n=4,5)', vOf('bx2').map(x=>x.n).sort(), [4, 5]);
    eq('bx1 voucher sets n=2,3,4 (r1) + 5 (r2)', vOf('bx1').map(x=>x.n + ':' + CodisBoxClassifier.rarityOf(B.valueOf(x)).rank).sort(), ['2:1', '3:1', '4:1', '5:2']);
    /* سعر القسيمة من لوحة المطوّر يغيّر النقاط ديناميكياً (محاكاة بقيمة الحد) */
    const keepLim = JSON.stringify(data.adminOverrides || null);
    const numOrig = CodisLimits.num; CodisLimits.num = (id, nv)=>id === 'voucher.price.bx2' ? 30 : numOrig(id, nv);
    eq('voucher points follow current price (30×3÷2=45)', P({ kind:'voucher', tier:'bx2', n:3, forBox:'bx1' }).points, 45);
    CodisLimits.num = numOrig;
    /* منح مجموعة من الصندوق: العدد الحقيقي + حدث بمعرّف الصندوق، بلا دمج تلقائي */
    giveGems(10000);
    { const t = tier('bx1'), rows = B.layout(t); let k = -1, j = -1; rows.forEach((r, ki)=>r.items.forEach((x, ji)=>{ if(k < 0 && x.kind === 'voucher' && x.n === 4){ k = ki; j = ji; } }));
      const v0 = CodisVouchers.count('bx2'), boxes0 = (data.inventory.boxes || []).length;
      rngSeq([uRank(k), uItem(j, rows[k].n)]); const r = B.buy('bx1'); const o = r.ok ? B.open(r.box.uid) : r; rngReset();
      T('voucher set prize opened', o.ok && o.prizeKind === 'voucher', JSON.stringify(o.reason));
      eq('voucher count +4', CodisVouchers.count('bx2') - v0, 4);
      T('event id linked to box', o.ok && data.vouchers.events.some(e=>e.id === 'vx|' + o.box.uid && e.n === 4 && e.ref === o.box.uid));
      T('no auto-merge into a box', (data.inventory.boxes || []).length === boxes0 + 1);
      T('same event cannot be granted twice', CodisVouchers.grantInTx({ id:'vx|' + o.box.uid, t:'box', tier:'bx2', n:4, ref:o.box.uid }) === null);
      /* دمج 10 ⇒ صندوق فضي */
      CodisWallet.transact([], ()=>CodisVouchers.grantInTx({ id:'v70test|' + Date.now(), t:'admin', tier:'bx2', n:10 }) ? { ok:true } : { ok:false });
      const c0 = CodisVouchers.count('bx2'), m = CodisVouchers.merge('bx2');
      T('merge 10 silver vouchers ⇒ closed silver box', m.ok && B.get(m.uid) && B.get(m.uid).tier === 'bx2' && B.get(m.uid).status === 'unopened' && CodisVouchers.count('bx2') === c0 - 10);
    }

    /* ===== 6) الاقتصاد والمنح ===== */
    { const b0 = bal(), r = B.buy('bx2'); const b1 = bal();
      T('buy deducts exactly the gem price once', r.ok && b0.g - b1.g === tier('bx2').gems && b0.c === b1.c && b0.s === b1.s);
      const o = B.open(r.box.uid), b2 = bal();
      T('open adds no coins/silver/gems directly', o.ok && b2.c === b1.c && b2.s === b1.s && b2.g === b1.g, JSON.stringify([b1, b2, o.prizeKind]));
      T('second open of same box refused', B.open(r.box.uid).reason === 'opened');
      T('opened box records rarity + prize', B.get(r.box.uid).rar === o.rank && B.get(r.box.uid).prize === o.item.id);
    }
    /* كل نوع يُمنح بنظامه الأصلي (سحب موجّه لكل عنصر في bx5 وbx1) */
    const grantedKinds = {};
    for(const tid of ['bx1', 'bx5', 'bx3']){
      const t = tier(tid);
      for(let k = 0; k < 6; k++){
        const rows = B.layout(t); const row = rows[k]; if(!row.n) continue;
        const pickKinds = {}; row.items.forEach((x, j)=>{ if(!pickKinds[x.kind]) pickKinds[x.kind] = j; });
        for(const kind of Object.keys(pickKinds)){
          const rows2 = B.layout(t); const j = rows2[k].items.findIndex(x=>x.kind === kind); if(j < 0) continue;
          const b0 = bal(); rngSeq([uRank(k), uItem(j, rows2[k].n)]); const r = B.buy(tid); const o = r.ok ? B.open(r.box.uid) : r; rngReset(); const b1 = bal();
          const okGrant = o.ok && o.prizeKind === kind && (
            kind === 'reward' ? !!(o.owned && CodisInventory.owned().some(x=>x.uid === o.owned.uid)) :
            kind === 'pass' ? !!CodisPasses.get(o.pass.uid) : kind === 'holiday' ? !!CodisHolidayCards.get(o.holiday.uid) : kind === 'pouch' ? !!CodisPouches.get(o.pouch.uid) :
            kind === 'voucher' ? !!o.voucher : kind === 'cosmetic' ? CodisCosmetics.owns(o.item.cosmeticId) : kind === 'planTheme' ? CodisPlanThemes.owns(o.item.defId) :
            kind === 'confirmTheme' ? CodisConfirmThemes.owns(o.item.defId) : kind === 'roomIntro' ? CodisRoomIntros.owns(o.item.defId) : false);
          grantedKinds[kind] = (grantedKinds[kind] || 0) + (okGrant ? 1 : 0);
          T('grant ' + kind + ' via ' + tid + ' r' + (k + t.start) + ' (no direct currency)', okGrant && b0.c === b1.c && b0.s === b1.s && b0.g - b1.g === t.gems, JSON.stringify([o.reason, o.prizeKind, b0, b1]));
        }
      }
    }
    eq('all 9 kinds granted at least once', Object.keys(grantedKinds).filter(k=>grantedKinds[k] > 0).sort(), B.PRIZE_KINDS.slice().sort());
    /* قرار المالك: كل شيء يتكرر — الدائم المملوك يبقى بالسحب ويُمنح «مكرراً» يُفكَّك مقابل فضة (قاعدة بطاقات العقوبة: floor(القوة × 1.5)) */
    { const own = CodisPlanThemes.owned().map(d=>d.id);
      T('owned themes stay in the pool (duplicates allowed)', own.length > 0 && own.every(id=>B.tiers().some(t=>B.layout(t).some(r=>r.items.some(x=>x.defId === id)))), own.join(','));
      T('module grant still refuses a second ownership record', CodisPlanThemes.grant({ id:own[0], sourceRef:'x' }) === null);
      /* سحب موجّه لثيم مملوك ⇒ مكرر */
      const t = tier('bx5'), rows = B.layout(t), j = rows[5].items.findIndex(x=>x.kind === 'planTheme' && CodisPlanThemes.owns(x.defId));
      let d = null;
      if(j >= 0){
        const before = JSON.stringify(data.inventory.planThemes), b0 = bal(), dn0 = CodisBoxDupes.owned().length;
        rngSeq([uRank(5), uItem(j, rows[5].n)]); const r = B.buy('bx5'); const o = r.ok ? B.open(r.box.uid) : r; rngReset(); const b1 = bal();
        d = o.dupe;
        T('owned permanent drawn ⇒ duplicate item (not refused)', o.ok && !!d && d.kind === 'planTheme' && d.defId === o.item.defId && d.points === B.powerOfDef(o.item.defId), JSON.stringify(o.reason));
        T('duplicate leaves ownership untouched', JSON.stringify(data.inventory.planThemes) === before);
        T('duplicate stored in «بحوزتك» list', CodisBoxDupes.owned().length === dn0 + 1 && B.get(r.box.uid).dupeUid === d.uid);
        T('duplicate adds no silver/coins at draw', b1.s === b0.s && b1.c === b0.c);
        { const k = ECON_ITEM_KINDS.find(x=>x.key === 'dupes'), box = document.createElement('div'); box.innerHTML = k ? k.html() : '';
          T('«المكررات» group renders with dismantle button', !!box.querySelector('#own-dupes .own-dism') && econOwnTotals().elements >= 1); }
        const pv = CodisDismantle.preview('dupe', d.uid);
        eq('dismantle value = floor(points × 1.5) like penalty cards', pv.silver, Math.floor(d.points * 1.5));
        const s0 = bal().s, rd = CodisDismantle.dismantle('dupe', d.uid);
        T('dismantle dupe ⇒ +silver once (DISMANTLE_CARD)', rd.ok && bal().s - s0 === Math.floor(d.points * 1.5) && CodisWallet.silverTxs().some(x=>x.type === 'DISMANTLE_CARD' && x.referenceId === 'dismantle|dupe|' + d.uid));
        T('dismantled dupe removed, second dismantle refused', !CodisBoxDupes.get(d.uid) && !CodisDismantle.dismantle('dupe', d.uid).ok);
        T('original theme still owned after dismantle', CodisPlanThemes.owns(o.item.defId));
      } else T('need an owned theme in bx5 legendary for dupe test', false);
      /* مكرر مظهر بطاقة + تفكيك بالكمية */
      const cid = CodisCosmetics.defs()[0].id; if(!CodisCosmetics.owns(cid)) CodisWallet.transact([], ()=>CodisCosmetics.grant({ id:cid, source:'box', sourceRef:'t' }) ? { ok:true } : { ok:false });
      const made = []; for(let k = 0; k < 2; k++){ const tt = tier('bx3'), rr = B.layout(tt); let kk = -1, jj = -1; rr.forEach((row, ki)=>row.items.forEach((x, ji)=>{ if(kk < 0 && x.cosmeticId === cid){ kk = ki; jj = ji; } }));
        if(kk < 0) break; rngSeq([uRank(kk), uItem(jj, rr[kk].n)]); const r = B.buy('bx3'); const o = r.ok ? B.open(r.box.uid) : r; rngReset(); if(o.dupe) made.push(o.dupe.uid); }
      T('two cosmetic dupes created', made.length === 2);
      const g = CodisDismantle.group('dupe', made[0]); T('dismantle group counts identical dupes', g.ok && g.uids.length >= 2);
      const s1 = bal().s, rm = CodisDismantle.dismantleMany('dupe', made); T('dismantleMany dupes', rm.ok && bal().s - s1 === made.length * Math.floor(B.powerOfDef(cid) * 1.5));
    }
    /* ندرة فارغة (محاكاة: لا ثيمات ولا بطاقة تجاوز أسطورية) ⇒ الصندوق غير متاح، لا خصم، لا استهلاك */
    { const defsOrig = CodisPlanThemes.defs, prizesOrig = CodisPasses.prizes;
      CodisPlanThemes.defs = ()=>defsOrig().filter(d=>d.family !== 'blazingMeteor'); CodisPasses.prizes = ()=>prizesOrig().filter(x=>CodisPasses.price(x) < 6000);
      try{
        const g0 = bal().g, r = B.buy('bx5');
        T('empty legendary ⇒ bx5 not ready, buy refused, no deduction', !B.ready(tier('bx5')) && !r.ok && r.reason === 'empty' && bal().g === g0, JSON.stringify(r.reason));
        T('effective() empty ⇒ UI shows unavailable', B.effective(tier('bx5')).length === 0 && /أسطوري/.test(econBoxEmptyMsg(tier('bx5'))));
        CodisWallet.transact([], ()=>{ data.inventory.boxes.push({ uid:'box|v70old|1', tier:'bx5', paid:0, currency:'GEMS', acquiredAt:econNowIso(), status:'unopened', sourceRef:'old' }); return { ok:true }; });
        const ro = B.open('box|v70old|1'); T('open refused on empty rarity, box stays unopened', !ro.ok && B.get('box|v70old|1').status === 'unopened');
        const g1 = bal().g, rm = B.buyOpenMany('bx5'); T('×10 refused on empty rarity, no deduction', !rm.ok && bal().g === g1);
      } finally { CodisPlanThemes.defs = defsOrig; CodisPasses.prizes = prizesOrig; }
      T('real data: bx5 ready (owned items repeat)', B.ready(tier('bx5')));
    }
    /* ×10: كل شيء قابل للتكرار — عشرة سحوبات على الندرة العليا تكتمل؛ المتكرر من الدائم يصير مكررات */
    { const seq = []; for(let i = 0; i < 10; i++){ seq.push(uRank(5), .999); }
      CodisRewardEngine.setRng((()=>{ let i = 0; return ()=>seq[Math.min(i++, seq.length - 1)]; })());
      const g0 = bal().g, dn0 = CodisBoxDupes.owned().length, res = B.buyOpenMany('bx3'); rngReset();
      T('×10 on the same top item completes (no exhaustion)', res.ok && res.items.length === 10 && g0 - bal().g === 10 * tier('bx3').gems, JSON.stringify(res.reason));
      const permIt = res.ok && res.items.filter(o=>B.TYPES[o.prizeKind].permanent);
      if(permIt && permIt.length) T('×10 repeated permanent ⇒ one ownership, rest are duplicates', permIt.filter(o=>!o.dupe).length <= 1 && CodisBoxDupes.owned().length - dn0 === permIt.filter(o=>o.dupe).length);
      rngReset(); const g1 = bal().g, r2 = B.buyOpenMany('bx2');
      T('×10 normal: 10 boxes, 10 prizes, one deduction of 10×price', r2.ok && r2.items.length === 10 && g1 - bal().g === 10 * tier('bx2').gems, JSON.stringify(r2.reason));
    }
    /* فشل الحفظ ⇒ لا ضياع ولا خصم */
    { const r = B.buy('bx1'); const before = JSON.stringify([data.inventory, data.vouchers, data.wallet.gems.balance]);
      codisSaveSuspended = 'fail'; const o = B.open(r.box.uid); codisSaveSuspended = false;
      T('save failure ⇒ box stays closed, no grant', !o.ok && B.get(r.box.uid).status === 'unopened' && JSON.stringify([data.inventory, data.vouchers, data.wallet.gems.balance]) === before, o.reason);
      const g0 = bal().g; codisSaveSuspended = 'fail'; const rb = B.buy('bx1'); codisSaveSuspended = false;
      T('save failure on buy ⇒ no deduction', !rb.ok && bal().g === g0);
      const g2 = bal().g; codisSaveSuspended = 'fail'; const rm = B.buyOpenMany('bx1'); codisSaveSuspended = false;
      T('save failure on ×10 ⇒ no deduction', !rm.ok && bal().g === g2);
    }

    /* ===== 7) لا شراء مباشر للمظاهر/الثيمات/البدايات ===== */
    { const s0 = bal().s;
      const nb = [CodisCosmetics.buy('crocShades'), CodisPlanThemes.buy('frostCrystalPlanning'), CodisConfirmThemes.buy('fireConfirm'), CodisRoomIntros.buy('habitsIntro')];
      T('direct buy refused (boxonly) for all 4 product families', nb.every(r=>!r.ok && (r.reason === 'boxonly' || r.reason === 'owned')), JSON.stringify(nb.map(r=>r.reason)));
      T('silver untouched by refused buys', bal().s === s0);
      econRenderAll(); econCosSetSub('cards'); await wait(100);
      { const sec = document.getElementById('eco-cosmetics'), notOwned = CodisCosmetics.defs().filter(d=>!CodisCosmetics.owns(d.id));
        T('store: no cosmetic buy button; each un-owned cosmetic shows «من الصناديق» + power', !sec.querySelector('.cos-buy') && notOwned.every(d=>{ const el = sec.querySelector('[data-cos="' + d.id + '"]'); return el && /من الصناديق/.test(el.textContent) && /القوة/.test(el.textContent); }), notOwned.map(d=>d.id).join(',')); }
      econCosSetSub('themes'); await wait(100);
      T('store: themes have no silver price badge', !document.querySelector('#cos-sub-themes .pt-mbadge.is-price') && !!document.querySelector('#cos-sub-themes .pt-mbadge.is-boxonly, #cos-sub-themes .pt-mbadge.is-own, #cos-sub-themes .pt-mbadge.is-on'));
      econCosSetSub('intros'); await wait(100);
      T('store: intros have no buy button', !document.querySelector('#cos-sub-intros .ri-b-buy'));
      const notOwnedT = CodisPlanThemes.defs().find(d=>!CodisPlanThemes.owns(d.id));
      if(notOwnedT){ codisPlanThemePreview(notOwnedT.id, null); await wait(200); const ov = document.querySelector('.pt-ov');
        T('theme preview: no buy action, shows power + rarity', ov && !ov.querySelector('.pt-ov-act[data-act="buy"]') && /يُحصل عليه من الصناديق/.test(ov.textContent) && /القوة/.test(ov.textContent) && !!ov.querySelector('.brx-tag'));
        try{ codisPlanThemePreviewClose(); }catch(e){} }
      econCosSetSub('cards');
    }

    /* ===== 8) البيانات والترحيل ===== */
    { const clone = JSON.parse(JSON.stringify(data)); clone.inventory.boxes.push({ uid:'box|v70norm', tier:'bx2', paid:0, status:'opened', acquiredAt:econNowIso(), openedAt:econNowIso(), rar:4, prize:'pouch|2', prizeDef:'agedWoodPlanning', sourceRef:'x' },
        { uid:'box|legacyopen', tier:'bx3', paid:105, status:'opened', acquiredAt:'2026-11-01T00:00:00.000Z', openedAt:'2026-11-01T00:00:00.000Z', rewardUid:'own|box|x', sourceRef:'y' });
      econNormalizeInventory(clone);
      const a = clone.inventory.boxes.find(b=>b.uid === 'box|v70norm'), l = clone.inventory.boxes.find(b=>b.uid === 'box|legacyopen');
      T('normalizer keeps rar/prize/prizeDef', a && a.rar === 4 && a.prize === 'pouch|2' && a.prizeDef === 'agedWoodPlanning');
      T('legacy opened box kept as history (no rar invented)', l && l.status === 'opened' && l.rewardUid === 'own|box|x' && !('rar' in l));
      const n2 = JSON.parse(JSON.stringify(clone)); econNormalizeInventory(n2); T('normalize idempotent', JSON.stringify(n2.inventory.boxes) === JSON.stringify(clone.inventory.boxes));
      /* صندوق قديم مغلق (قبل V70) يُفتح بالمحرك الجديد */
      CodisWallet.transact([], ()=>{ data.inventory.boxes.push({ uid:'box|legacy|unopened', tier:'bx2', paid:67, currency:'GEMS', acquiredAt:'2026-11-10T00:00:00.000Z', status:'unopened', sourceRef:'legacy' }); return { ok:true }; });
      const o = B.open('box|legacy|unopened'); T('legacy closed box opens with new engine', o.ok && tier('bx2').ranks.indexOf(o.rank) !== -1 && B.get('box|legacy|unopened').rar === o.rank);
      T('legacy admin box odds override ignored', (()=>{ data.adminOverrides = data.adminOverrides || {}; data.adminOverrides.boxes = { bx1:{ pm:[1000, 0, 0, 0, 0, 0] } }; const ok = JSON.stringify(B.layout(tier('bx1')).map(r=>r.pct)) === '[50,25,13,7,4,1]'; return ok; })());
    }

    /* ===== 9) الواجهة: نتيجة فردية وندرة ظاهرة ===== */
    { window.CODIS_B3D_OFF = true; window.CODIS_REDUCED_MOTION = true; const t = tier('bx4'), rows = B.layout(t); const j = rows[2].items.findIndex(x=>x.kind !== 'reward');
      rngSeq([uRank(2), uItem(Math.max(0, j), rows[2].n)]); const r = B.buy('bx4'); rngReset();
      econBoxOpenFor('bx4', r.box.uid, false); await wait(200); { const o = B.open(r.box.uid); econBoxState.result = o; econBoxState.phase = 'reveal'; econPaintBox(); } await wait(100);   /* مسار الرسم نفسه بعد المشهد (المشهد 3D ينتظر لمسة) */
      const body = document.getElementById('econ-box-body'), st = body.querySelector('.bx-stage');
      T('reveal shows rarity tag + frame + power', econBoxState && econBoxState.phase === 'reveal' && !!body.querySelector('.brx-tag.is-reveal') && st && st.getAttribute('data-brar') === String(econBoxState.result.rank) && /القوة/.test(body.textContent),
        econBoxState && econBoxState.phase);
      T('reveal level from rarity (not value)', CodisRevealLevels.levelOfResult(econBoxState.result) === econBoxState.result.boxRarity.reveal.level);
      T('reveal colour = rarity colour', CodisRevealLevels.infoOfResult(econBoxState.result).rgb === econBoxState.result.boxRarity.rgb);
      econBoxClose(); window.CODIS_B3D_OFF = false; window.CODIS_REDUCED_MOTION = false;
    }
  }catch(e){ T('exception', false, e && (e.stack || e.message)); }
  finally{
    rngReset(); try{ codisSaveSuspended = false; }catch(e){}
    try{ const k = JSON.parse(KEEP); Object.keys(data).forEach(x=>{ if(!(x in k)) delete data[x]; }); Object.assign(data, k); saveData(); econRenderAll(); }catch(e){ T('restore', false, e.message); }
  }
  return { passed:out.filter(x=>x.ok).length, failed:out.filter(x=>!x.ok).length, results:out };
})()
