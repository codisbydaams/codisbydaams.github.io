  function lastMs(now){
    let m = Date.parse(st().at); if(!isFinite(m)) m = 0;
    ((data.inventory && data.inventory.items) || []).forEach(x=>{ if(x && x.source === 'free'){ const a = Date.parse(x.acquiredAt); if(isFinite(a) && a > m) m = a; } });
    /* CODIS-V63: الجائزة قد تكون جواهر أو فضة فقط (بلا بطاقة بالمخزون) ⇒ آخر منحة FREEBOX_GRANT بالدفترين دليل مطالبة أيضاً (تعارض دمج الأجهزة) */
    try{
      const w = data.wallet || {};
      [w.gems && w.gems.transactions, w.silver && w.silver.transactions].forEach(L=>{ if(Array.isArray(L)) L.forEach(t=>{ if(t && t.type === 'FREEBOX_GRANT'){ const a = Date.parse(t.createdAt); if(isFinite(a) && a > m) m = a; } }); });
    }catch(e){}
    return Math.min(m, now);
  }
  /* CODIS-V63: الصندوق متاح حتى بلا بطاقات مؤهّلة (الجواهر والفضة متاحتان دائماً) ⇒ empty دائماً false؛ cards = عدد البطاقات المؤهّلة */
  function status(){
    const now = CodisClock.now(), last = lastMs(now), next = last ? last + DAY : 0;
    const free = CodisLimits.bypass('freebox.cooldown');
    const ready = !last || now >= next || free, n = pool().length;
    return { ready:ready, empty:false, poolN:n, cards:n, last:last, next:next, waitMs:ready ? 0 : Math.max(0, next - now), now:now };
  }
  /* CODIS-V63: جائزة واحدة فقط لكل مطالبة — فئة واحدة متساوية الاحتمال من: بطاقة مؤهّلة · جواهر 1–10 · فضة 1–20 (شاملة).
     بلا بطاقات مؤهّلة ⇒ جواهر أو فضة بالتساوي. البطاقة: سحب متساوٍ بين المؤهّلة (نفس الآلية السابقة).
     الحساب المسجّل: السحب حتمي من (معرّف الحساب + المطالبة السابقة) ⇒ جهازان بنفس الحالة يسحبان الجائزة نفسها بالمرجع نفسه فيندمجان بنسخة واحدة
     (لا جائزتان من تزامن جهازين). الضيف (جهاز واحد بلا مزامنة) ⇒ crypto عشوائي. */
  function seedOf(f){
    let u = '';
    try{ const S = CodisAccount && CodisAccount.state; u = (S && S.user && typeof S.user.id === 'string') ? S.user.id : ''; }catch(e){ u = ''; }
    return u ? (u + '|' + (f.at || '0') + '|' + (f.n | 0)) : '';
  }
  function roll(seed, salt, min, max){
    const span = max - min + 1; if(!(span >= 1)) return min;
    if(!seed) return codisRandInt(min, max);
    const s = seed + '#' + salt; let h = 0x811c9dc5;
    for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return min + ((h >>> 0) % span);
  }
  /* المنح + تسجيل المطالبة بمعاملة واحدة: أي فشل (منح/حفظ) ⇒ لا شيء يُمنح ولا تُسجَّل المطالبة (يبقى حقه بالمحاولة) */
  function claim(){
    if(busy) return { ok:false, reason:'busy' };
    busy = true;
    try{
      const s0 = status(); if(!s0.ready) return { ok:false, reason:'wait', nextAt:s0.next };
      return CodisWallet.transact([], ()=>{
        const s1 = status(); if(!s1.ready) return { ok:false, reason:'wait', nextAt:s1.next };
        const f = st(), at = econNowIso(), seed = seedOf(f), rows = pool();
        const kinds = rows.length ? ['card', 'gems', 'silver'] : ['gems', 'silver'];
        const type = kinds[roll(seed, 1, 0, kinds.length - 1)];
        const fref = 'freebox|' + (f.at || '0'), meta = { claim:(f.n | 0) + 1, prize:type };
        const out = { ok:true, type:type, at:at };
        if(type === 'card'){
          const pick = seed ? rows[roll(seed, 2, 0, rows.length - 1)] : CodisRewardEngine.pick(rows, ()=>1);
          const rar = pick ? econRarityById(pick.rarity) : null; if(!rar) return { ok:false, reason:'error' };
          const coin = econEffCoin(pick, rar);
          /* المعرّف مشتق من المطالبة السابقة: جهازان بنفس الحالة ينتجان المعرّف نفسه فيُدمجان بنسخة واحدة */
          const owned = CodisInventory.grant({ uid:'own|free|' + (f.at || '0'), rewardId:pick.id, stickerId:pick.stickerId, fin:pick.fin, name:pick.name, rarity:rar.id, rarityName:rar.name, rarityTone:rar.tone, rarityOrder:rar.order,
            room:pick.room, source:'free', sourceRef:'freebox', scope:'', coinValue:coin, paid:null });
          if(!owned) return { ok:false, reason:'inventory' };
          out.owned = owned; out.item = pick; out.rarity = rar; out.coin = coin;
        } else if(type === 'gems'){
          const n = roll(seed, 3, 1, 10);
          if(!CodisWallet.applyGems('FREEBOX_GRANT', n, 'الصندوق المجاني', 'freebox', fref, meta)) return { ok:false, reason:'tx' };
          out.n = n; out.gems = n;
        } else {
          const n = roll(seed, 4, 1, 20);
          if(!CodisWallet.applySilver('FREEBOX_GRANT', n, 'الصندوق المجاني', 'freebox', fref, meta)) return { ok:false, reason:'tx' };
          out.n = n; out.silver = n;
        }
        f.at = at; f.n = (f.n | 0) + 1;
        return out;
      });
    }catch(e){ console.error('freebox claim', e); return { ok:false, reason:'error' }; }
    finally{ busy = false; }
  }
