// CODIS-V61 store bench: each step repeated N times (default 5), median of sync JS ms / summed long-task ms / worst frame ms.
// node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_v61_bench.mjs --cpu 4   (N=7)
export default async function(c){
  const N = Number(process.env.N || 5);
  await c.load(); await c.sleep(1500);
  if(await c.evaluate(`!!document.getElementById('gate-guest') && document.getElementById('gate-guest').offsetParent !== null`)){ await c.tap('#gate-guest'); await c.sleep(2500); }
  await c.evaluate(`(()=>{ const R = data.settings.rewardItems; const rooms = ['daily','weekly','monthly']; const rar = ['C','B','A','S','SS'];
    for(let i = 0; i < 45; i++) R.push({ id:'pf_' + i, name:'مكافأة ' + i, rarity:rar[i % 5], room:rooms[i % 3], enabled:true, storePrice:null, coinValue:null, stickerId:null, weight:10, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() });
    data.wallet.balance = 800000; CodisWallet.transact([], ()=>{ CodisWallet.applyGems('ADMIN_GRANT', 5000, 'prof', 'admin', 'prof-g'); return { ok:true }; }); saveData(); return 1; })()`);
  await c.load(); await c.sleep(4000);
  await c.evaluate(`window.CODIS_B3D_OFF = true`);   // no 3D warm-up inside the measured steps
  const res = {};
  async function step(label, expr, wait){
    await c.evaluate(`window.__lt = []; window.__fr.length = 0`);
    const sync = await c.evaluate(`(()=>{ const t = performance.now(); ${expr}; return performance.now() - t; })()`);
    await c.sleep(wait || 1200);
    const m = await c.evaluate(`(()=>{ const lt = window.__lt || [], f = window.__fr || []; return { lt:lt.reduce((a, b)=>a + b.d, 0), wf:f.length ? Math.max(...f) : 0 }; })()`);
    (res[label] = res[label] || []).push([sync, m.lt, m.wf]);
  }
  const first = !!process.env.FIRST;
  for(let k = 0; k < N; k++){
    await step('A open (after a save)', `saveData(); econOpenStore()`, 2200);
    await step('B part boxes', `econStoreSetPart('boxes')`, 1100);
    await step('C part cosmetics', `econStoreSetPart('cosmetics')`, 1100);
    await step('D part cards', `econStoreSetPart('cards')`, 1100);
    await step('E pack open bx3', `econPackOpen('bx3')`, 1300);
    await step('F pack close', `econPackClose()`, 800);
    await step('G own open', `econOpenVault()`, 1300);
    await step('H own close', `econCloseOwn()`, 800);
    await step('I close store', `CodisNav.back()`, 1000);
    await step('J reopen (no change)', `econOpenStore()`, 2000);
    await step('K close store', `CodisNav.back()`, 1000);
  }
  const med = a=>{ const s = a.slice().sort((x, y)=>x - y); return Math.round(s[Math.floor(s.length / 2)]); };
  console.log('step'.padEnd(26) + 'sync  longTasks  worstFrame   (median of ' + N + ')');
  for(const k of Object.keys(res).sort()){ const r = res[k]; console.log(k.padEnd(26) + String(med(r.map(x=>x[0]))).padStart(4) + String(med(r.map(x=>x[1]))).padStart(11) + String(med(r.map(x=>x[2]))).padStart(12)); }
}
