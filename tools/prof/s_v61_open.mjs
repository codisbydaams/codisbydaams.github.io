// CODIS-V61: store open after a data save — duration of econRenderStore itself + time until frames settle (2 consecutive frames < 40ms). Median of N.
export default async function(c){
  const N = Number(process.env.N || 7);
  await c.load(); await c.sleep(1500);
  if(await c.evaluate(`!!document.getElementById('gate-guest') && document.getElementById('gate-guest').offsetParent !== null`)){ await c.tap('#gate-guest'); await c.sleep(2500); }
  await c.evaluate(`(()=>{ const R = data.settings.rewardItems; const rooms = ['daily','weekly','monthly']; const rar = ['C','B','A','S','SS'];
    for(let i = 0; i < 45; i++) R.push({ id:'pf_' + i, name:'مكافأة ' + i, rarity:rar[i % 5], room:rooms[i % 3], enabled:true, storePrice:null, coinValue:null, stickerId:null, weight:10, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() });
    saveData(); return 1; })()`);
  await c.load(); await c.sleep(4000);
  await c.evaluate(`window.CODIS_B3D_OFF = true; (()=>{ const o = econRenderStore; window.__rs = []; econRenderStore = function(){ const t = performance.now(); const r = o.apply(this, arguments); window.__rs.push(performance.now() - t); return r; }; })()`);
  const rows = [];
  for(let k = 0; k < N + 1; k++){
    const r = await c.evaluate(`new Promise(res=>{ window.__rs.length = 0; saveData(); const t0 = performance.now(); econOpenStore(); let last = t0, calm = 0, worst = 0;
      window.__fl = []; const f = t=>{ const d = t - last; last = t; window.__fl.push(Math.round(d)); worst = Math.max(worst, d); calm = d < 40 ? calm + 1 : 0; if((calm >= 2 && t - t0 > 200) || t - t0 > 12000) res({ settle:Math.round(t - t0), worst:Math.round(worst), render:Math.round(window.__rs.reduce((a,b)=>a+b,0)), fl:(window.__fl||[]).slice(0,30) }); else requestAnimationFrame(f); }; requestAnimationFrame(f); })`);
    if(k) rows.push(r);   // first open (cold) excluded
    await c.evaluate(`CodisNav.back()`); await c.sleep(900);
  }
  const med = a=>{ const s = a.slice().sort((x, y)=>x - y); return s[Math.floor(s.length / 2)]; };
  console.log('open-after-save median of ' + N + ': render=' + med(rows.map(r=>r.render)) + 'ms settle=' + med(rows.map(r=>r.settle)) + 'ms worstFrame=' + med(rows.map(r=>r.worst)) + 'ms   all=' + JSON.stringify(rows.map(r=>[r.render, r.settle, r.worst])));
}
