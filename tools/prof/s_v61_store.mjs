// CODIS-V61 store lifecycle profile: per-step sync JS time + trace phase totals + long tasks + frame gaps.
// node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_v61_store.mjs --cpu 4 [--out x.json]
export default async function(c){
  await c.load(); await c.sleep(1500);
  if(await c.evaluate(`!!document.getElementById('gate-guest') && document.getElementById('gate-guest').offsetParent !== null`)){ await c.tap('#gate-guest'); await c.sleep(2500); }
  await c.evaluate(`(()=>{ const R = data.settings.rewardItems; const rooms = ['daily','weekly','monthly']; const rar = ['C','B','A','S','SS'];
    for(let i = 0; i < 45; i++) R.push({ id:'pf_' + i, name:'مكافأة ' + i, rarity:rar[i % 5], room:rooms[i % 3], enabled:true, storePrice:null, coinValue:null, stickerId:null, weight:10, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() });
    data.wallet.balance = 800000; CodisWallet.transact([], ()=>{ CodisWallet.applyGems('ADMIN_GRANT', 5000, 'prof', 'admin', 'prof-g'); return { ok:true }; }); saveData(); return 1; })()`).catch(e=>console.log('seed', e.message));
  await c.load(); await c.sleep(3500);
  await c.snap('boot');
  const events = []; c.onMsg(m=>{ if(m.method === 'Tracing.dataCollected') events.push(...m.params.value); });
  const NAMES = ['FunctionCall', 'EvaluateScript', 'v8.compile', 'UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'ParseHTML', 'Decode Image', 'ImageDecodeTask', 'MajorGC', 'MinorGC', 'RasterTask', 'HitTest', 'TimerFire', 'FireAnimationFrame'];
  async function step(label, expr, wait){
    events.length = 0;
    await c.send('Tracing.start', { transferMode:'ReportEvents', traceConfig:{ includedCategories:['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'blink.user_timing'] } });
    const sync = await c.evaluate(`(()=>{ const t = performance.now(); ${expr}; return Math.round(performance.now() - t); })()`).catch(e=>'ERR ' + e.message);
    await c.sleep(wait || 1800);
    const done = new Promise(r=>c.onMsg(m=>{ if(m.method === 'Tracing.tracingComplete') r(); })); await c.send('Tracing.end'); await done;
    const sum = {}; let main = null;
    for(const e of events){ if(e.name === 'TracingStartedInBrowser' || e.name === 'TracingStartedInPage') main = main; }
    for(const e of events){ if(e.ph !== 'X' || !e.dur || NAMES.indexOf(e.name) === -1) continue; sum[e.name] = (sum[e.name] || 0) + e.dur; }
    const big = events.filter(e=>e.ph === 'X' && e.dur > 30000 && ['UpdateLayoutTree', 'Layout', 'Paint', 'Layerize', 'PrePaint', 'MajorGC', 'Decode Image'].includes(e.name)).map(e=>e.name + ':' + Math.round(e.dur / 1000) + (e.args && e.args.elementCount ? '/els' + e.args.elementCount : ''));
    const top = Object.entries(sum).sort((a, b)=>b[1] - a[1]).slice(0, 7).map(([k, v])=>k + ' ' + Math.round(v / 1000));
    await c.snap(label, { syncMs:sync, phases:top.join(' | '), big:big.slice(0, 8).join(' ') });
  }
  await step('store open #1 (cold)', `econOpenStore()`, 2500);
  await step('scroll cards pane', `(async()=>{ const sc = econStoreScroller(); for(let y = 0; y < sc.scrollHeight; y += 300){ sc.scrollTop = y; await new Promise(r=>setTimeout(r, 80)); } sc.scrollTop = 0; })()`, 2600);
  await step('close store', `CodisNav.back()`, 1200);
  await step('store reopen (no data change)', `econOpenStore()`, 2000);
  await step('close store', `CodisNav.back()`, 1000);
  await step('reopen after a save', `saveData(); econOpenStore()`, 2200);
  await step('part → boxes', `econStoreSetPart('boxes')`, 1300);
  await step('part → cosmetics', `econStoreSetPart('cosmetics')`, 1300);
  await step('part → cards', `econStoreSetPart('cards')`, 1300);
  await step('card detail open', `econOpenDetail(econStoreCardRows()[0].id || econStoreCardRows()[0].x.id)`, 1300);
  await step('card detail close', `econCloseDetail()`, 900);
  await step('part → boxes (again)', `econStoreSetPart('boxes')`, 1000);
  await step('pack detail open bx3', `econPackOpen('bx3')`, 1500);
  await step('pack: open every group', `document.querySelectorAll('#econ-pack-body details').forEach(d=>d.open = true)`, 1500);
  await step('pack close', `econPackClose()`, 900);
  await step('pack detail open bx5', `econPackOpen('bx5')`, 1500);
  await step('pack close', `econPackClose()`, 900);
  await step('own (بحوزتك) open', `econOpenVault()`, 1500);
  await step('own close', `econCloseOwn()`, 900);
  await step('buy+open box bx1 (3D)', `(()=>{ const r = CodisBoxes.buy('bx1'); econRenderAll(); econBoxOpenFor('bx1', r.box.uid, true); })()`, 7000);
  await step('box modal close', `econBoxClose()`, 1000);
  console.log('consoleErrors?', JSON.stringify(await c.evaluate(`(window.__codisErr||[]).slice(0,5)`).catch(()=>null)));
}
