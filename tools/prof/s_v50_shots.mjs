// CODIS-V50: لقطات حقيقية للمتجر بالمظهرين (iPhone-size, DPR3) إلى docs/store_v50. SHOT=<مجلد>
export default async function(c){
  const D = process.env.SHOT || 'docs/store_v50';
  await c.load(); await c.sleep(1500);
  if(await c.evaluate(`!!document.getElementById('gate-guest') && document.getElementById('gate-guest').offsetParent !== null`)){ await c.tap('#gate-guest'); await c.sleep(2500); }
  await c.evaluate(`(()=>{ const R = data.settings.rewardItems; const rooms = ['daily','weekly','monthly','master']; const rar = ['C','B','A','S','SS'];
    const names = ['ساعة سوشل ميديا','تطلب أكل تحبه','فلم بالسينما','نص ساعة مشي','عشاء','iPhone 15 Pro Max'];
    for(let i = 0; i < 40; i++) R.push({ id:'pf_' + i, name:names[i % names.length], rarity:rar[i % 5], room:rooms[i % 4], enabled:true, storePrice:null, coinValue:null, stickerId:null, weight:10, createdAt:'2026-01-01T00:00:00.000Z', updatedAt:'2026-01-01T00:00:00.000Z' });
    data.wallet.balance = 800; saveData(); return 1; })()`);
  await c.load(); await c.sleep(3000);
  for(const th of ['paper', 'dark']){
    await c.evaluate(`CodisTheme.set('${th}', true)`); await c.sleep(400);
    await c.evaluate(`econOpenStore()`); await c.sleep(2800);
    for(const part of ['cards', 'boxes', 'cosmetics']){ await c.evaluate(`econStoreSetPart('${part}', { quiet:true })`); await c.sleep(1600); await c.screenshot(D + '/' + th + '_' + part + '.png'); }
    await c.evaluate(`econStoreSetPart('cards', { quiet:true })`); await c.sleep(900);
    await c.evaluate(`(()=>{ const t = document.querySelector('#pane-cards .st-tile.rar-ss[data-id]') || document.querySelector('#pane-cards .st-tile[data-id]'); econOpenDetail(t.dataset.id, t); return 1; })()`); await c.sleep(1800); await c.screenshot(D + '/' + th + '_detail.png');
    await c.evaluate(`econCloseDetail()`); await c.sleep(700);
    await c.evaluate(`econToggleClosed()`); await c.sleep(1400); await c.screenshot(D + '/' + th + '_closed_sheet.png'); await c.evaluate(`econCloseClosed()`); await c.sleep(700);
    await c.evaluate(`(()=>{ const id = document.querySelector('#pane-cards .st-tile[data-id] .shop-buy:not(:disabled)').closest('.st-tile').dataset.id; econBuy(id); return 1; })()`); await c.sleep(1800); await c.screenshot(D + '/' + th + '_confirm.png');
    await c.evaluate(`resolveCodisConfirm(false)`); await c.sleep(700);
  }
}
