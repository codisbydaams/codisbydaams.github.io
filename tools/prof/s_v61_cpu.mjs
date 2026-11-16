// CODIS-V61: JS CPU profile per store step — self time and inclusive time per app function (forced layout shows as the calling function's self time).
// node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_v61_cpu.mjs --cpu 4   (STEPS=open,cards,... to filter)
export default async function(c){
  await c.load(); await c.sleep(1500);
  if(await c.evaluate(`!!document.getElementById('gate-guest') && document.getElementById('gate-guest').offsetParent !== null`)){ await c.tap('#gate-guest'); await c.sleep(2500); }
  await c.evaluate(`(()=>{ const R = data.settings.rewardItems; const rooms = ['daily','weekly','monthly']; const rar = ['C','B','A','S','SS'];
    for(let i = 0; i < 45; i++) R.push({ id:'pf_' + i, name:'مكافأة ' + i, rarity:rar[i % 5], room:rooms[i % 3], enabled:true, storePrice:null, coinValue:null, stickerId:null, weight:10, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() });
    data.wallet.balance = 800000; CodisWallet.transact([], ()=>{ CodisWallet.applyGems('ADMIN_GRANT', 5000, 'prof', 'admin', 'prof-g'); return { ok:true }; }); saveData(); return 1; })()`);
  await c.load(); await c.sleep(3500);
  await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval', { interval:200 });
  const only = (process.env.STEPS || '').split(',').filter(Boolean);
  async function prof(label, expr, wait){
    await c.send('Profiler.start');
    await c.evaluate(`(()=>{ ${expr}; })()`).catch(e=>console.log('ERR', e.message));
    await c.sleep(wait || 1500);
    const { profile } = await c.send('Profiler.stop');
    if(only.length && !only.some(k=>label.indexOf(k) >= 0)) return;
    const byId = new Map(); profile.nodes.forEach(n=>byId.set(n.id, n));
    const parent = new Map(); profile.nodes.forEach(n=>(n.children || []).forEach(ch=>parent.set(ch, n.id)));
    const dt = profile.timeDeltas, smp = profile.samples, self = new Map(), incl = new Map();
    for(let i = 0; i < smp.length; i++){
      const d = (dt[i + 1] || 0) / 1000; let n = byId.get(smp[i]); if(!n) continue;
      const nm = f=>(f.callFrame.functionName || '(anon)') + (f.callFrame.lineNumber >= 0 && f.callFrame.url ? ':' + (f.callFrame.lineNumber + 1) : '');
      self.set(nm(n), (self.get(nm(n)) || 0) + d);
      const seen = new Set(); let cur = n;
      while(cur){ const k = nm(cur); if(!seen.has(k)){ seen.add(k); incl.set(k, (incl.get(k) || 0) + d); } cur = byId.get(parent.get(cur.id)); }
    }
    const top = (m, k)=>[...m.entries()].filter(([x])=>!/^\((root|program|idle|garbage collector)\)/.test(x)).sort((a, b)=>b[1] - a[1]).slice(0, k).map(([x, v])=>Math.round(v) + 'ms ' + x);
    console.log('\n### ' + label + '  (gc ' + Math.round(self.get('(garbage collector)') || 0) + 'ms)');
    console.log('  SELF: ' + top(self, 14).join('\n        '));
    console.log('  INCL: ' + top(incl, 22).join('\n        '));
  }
  await prof('open cold', `econOpenStore()`, 2500);
  await prof('close', `CodisNav.back()`, 1000);
  await prof('reopen same', `econOpenStore()`, 1800);
  await prof('part boxes', `econStoreSetPart('boxes')`, 1500);
  await prof('part cosmetics', `econStoreSetPart('cosmetics')`, 1200);
  await prof('part cards', `econStoreSetPart('cards')`, 1500);
  await prof('pack open', `econPackOpen('bx3')`, 1500);
  await prof('pack close', `econPackClose()`, 900);
  await prof('close2', `CodisNav.back()`, 1000);
  await prof('reopen after save', `saveData(); econOpenStore()`, 2000);
}
