// CODIS-V50: لقطات ثانية: قلب البطاقة (ظهر)، نافذة البكج، «بحوزتك» ببيانات، تقليل الحركة. SHOT=<مجلد>
export default async function(c){
  const D = process.env.SHOT || 'docs/store_v50';
  await c.load(); await c.sleep(1500);
  if(await c.evaluate(`!!document.getElementById('gate-guest') && document.getElementById('gate-guest').offsetParent !== null`)){ await c.tap('#gate-guest'); await c.sleep(2500); }
  await c.evaluate(`(()=>{ const R = data.settings.rewardItems; const rooms = ['daily','weekly','monthly','master']; const rar = ['C','B','A','S','SS'];
    for(let i = 0; i < 30; i++) R.push({ id:'pf_' + i, name:'مكافأة ' + i, rarity:rar[i % 5], room:rooms[i % 4], enabled:true, storePrice:null, coinValue:null, stickerId:null, weight:10, createdAt:'2026-01-01T00:00:00.000Z', updatedAt:'2026-01-01T00:00:00.000Z' });
    data.wallet.balance = 5000; saveData(); return 1; })()`);
  await c.load(); await c.sleep(3000);
  for(const th of ['paper', 'dark']){
    await c.evaluate(`CodisTheme.set('${th}', true)`); await c.sleep(300);
    await c.evaluate(`econOpenStore()`); await c.sleep(2500);
    // اشتر بطاقتين وصندوقاً (عبر الدوال نفسها)
    await c.evaluate(`(async()=>{ for(const t of [...document.querySelectorAll('#pane-cards .st-tile[data-id]')].slice(0,2)){ try{ const p = econBuy(t.dataset.id); await new Promise(r=>setTimeout(r,400)); const ok = document.getElementById('codis-confirm-ok'); if(ok) ok.click(); await new Promise(r=>setTimeout(r,2500)); const st=[...document.querySelectorAll('button')].find(b=>b.offsetParent&&b.textContent.trim()==='تخزين'); if(st) st.click(); await new Promise(r=>setTimeout(r,1500)); }catch(e){} } return 1; })()`);
    await c.sleep(2500);
    await c.evaluate(`econStoreSetPart('cards', { quiet:true })`); await c.sleep(800);
    const info = await c.evaluate(`(()=>{ const f = document.querySelector('#pane-cards .cflip'); f.scrollIntoView({ block:'center' }); f.id='flipme'; codisFlipToggle(f); return 1; })()`); await c.sleep(1400); await c.screenshot(D + '/' + th + '_card_back.png');
    await c.evaluate(`codisFlipToggle(document.getElementById('flipme'))`); await c.sleep(900);
    await c.evaluate(`econStoreSetPart('boxes', { quiet:true })`); await c.sleep(900);
    await c.evaluate(`econPackOpen('bx4', document.querySelector('#pane-boxes .bx-open'))`); await c.sleep(1800); await c.screenshot(D + '/' + th + '_pack_modal.png');
    await c.evaluate(`document.querySelector('#econ-box-modal .bx-close, #econ-pack-modal .modal-close, [onclick*="econClosePack"]') && document.querySelector('[onclick*="econClosePack"]').click()`); await c.sleep(600);
    await c.evaluate(`econOpenVault()`); await c.sleep(1500); await c.screenshot(D + '/' + th + '_own_sheet.png');
    await c.evaluate(`(typeof econCloseOwn === 'function') && econCloseOwn()`); await c.sleep(700);
    // تقليل الحركة: لا animations جارية على عناصر المتجر
    await c.evaluate(`window.CODIS_REDUCED_MOTION = true; econStoreCalmSync(); econStoreSetPart('cosmetics', { quiet:true }); econStoreSetPart('cards', { quiet:true });`); await c.sleep(300);
    const n = await c.evaluate(`document.getAnimations().filter(a=>/^sx/.test(a.animationName||'')).length`);
    console.log(th, 'calm: sx animations running =', n);
    await c.evaluate(`window.CODIS_REDUCED_MOTION = false; econStoreCalmSync();`);
  }
}
