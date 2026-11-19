/* CODIS-V73 — قياسات أداء منشئ الشخصية: WebKit (ملف iPhone 12) + Chromium بمعالج مبطّأ ×4 وDPR 3 (swiftshader) + Chromium على GPU حقيقي.
   PW=<playwright-core/index.mjs> node tests/v73_perf.mjs [url]
   تنبيه: أرقام جهاز التطوير (WebKit headless / swiftshader / GTX 970) — ليست قياس هاتف حقيقي. */
import { pathToFileURL } from 'url';
const { webkit, chromium, devices } = await import(pathToFileURL(process.env.PW).href);
const url = process.argv[2] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html';
async function run(label, launcher, ctxOpts, cpu, args) {
  const br = await launcher.launch(launcher === chromium ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args } : {});
  const ctx = await br.newContext(ctxOpts), p = await ctx.newPage();
  if (cpu && launcher === chromium) { const s = await ctx.newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  await p.goto(url); await p.waitForTimeout(3500);
  await p.evaluate(() => { try { document.getElementById('codis-gate').remove(); } catch (e) {} navigateToPage('settings'); });
  const R = { tier: await p.evaluate(() => CodisChar.tier()) };
  for (const pass of ['cold', 'warm']) {
    R[pass + 'Open'] = await p.evaluate(async () => { const t0 = performance.now(); codisCharOpen('create'); await new Promise(r => { const f = () => (codisChx && codisChx.ready) ? r() : setTimeout(f, 20); f(); }); return Math.round(performance.now() - t0); });
    if (pass === 'cold') {
      Object.assign(R, await p.evaluate(async () => {
        const v = CodisChar.current(), sel = codisChx.sel, m = {}, time = async (k, s) => { const t0 = performance.now(); await v.setConfig(CodisChar.spec(s)); m[k] = Math.round(performance.now() - t0); };
        await time('face', Object.assign({}, sel, { face: 'm5' })); await time('face2', Object.assign({}, sel, { face: 'm12' }));
        await time('hairNew', Object.assign({}, sel, { face: 'm12', hair: 'afro' })); await time('hairLong', Object.assign({}, sel, { face: 'm12', hair: 'shoulder' })); await time('hairBack', Object.assign({}, sel, { face: 'm12', hair: 'afro' }));
        await time('build', Object.assign({}, sel, { build: 'musc' })); await time('sex', Object.assign({}, CodisChar.fix({ body: 'female' })));
        await time('beard', Object.assign({}, sel, { beard: 'full' })); await time('slider', Object.assign({}, sel, { adv: 'fw:60,nw:-40' })); await time('bodySlider', Object.assign({}, sel, { advb: 'sd:60,be:40' }));
        const t0 = performance.now(); for (let i = 0; i < 3; i++) await v.snapshot(CodisChar.spec(Object.assign({}, sel, { face: 'm' + (i + 1) })), { focus: 'face', z: 1, size: 132 }); m.thumbEach = Math.round((performance.now() - t0) / 3);
        await v.setConfig(CodisChar.spec(Object.assign({}, sel, { hair: 'side_part', beard: 'full' }))); v.render();
        /* زمن الإطار المتوسط (دوران مستمر) */
        const f0 = performance.now(); let fr = 0; await new Promise(r => { const tick = () => { v.yaw += .03; v.render(); fr++; if (performance.now() - f0 < 1500) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); });
        m.fps = Math.round(fr / ((performance.now() - f0) / 1000));
        const info = v.renderer.info; m.geometries = info.memory.geometries; m.textures = info.memory.textures; m.programs = (info.programs || []).length; m.drawCalls = info.render.calls; m.tris = info.render.triangles;
        m.dpr = v.renderer.getPixelRatio(); m.canvas = [v.canvas.width, v.canvas.height];
        if (performance.memory) m.heapMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
        return m;
      }));
    }
    await p.evaluate(() => codisChxClose(false)); await p.waitForTimeout(400);
  }
  R.cycles = await p.evaluate(async () => { for (let i = 0; i < 5; i++) { codisCharOpen('edit'); await new Promise(r => { const f = () => (codisChx && codisChx.ready) ? r() : setTimeout(f, 20); f(); }); codisChxClose(false); await new Promise(r => setTimeout(r, 300)); } return { canvases: document.querySelectorAll('canvas').length, view: !!CodisChar.current(), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }; });
  console.log(label, JSON.stringify(R));
  await br.close();
}
if (!process.env.NO_WEBKIT) await run('webkit-iphone12', webkit, { ...devices['iPhone 12'] }, 0);
await run('chrome-cpu4-dpr3-swiftshader', chromium, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, 4, ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']);
await run('chrome-gpu-gtx970-dpr3', chromium, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, 0, ['--headless=new', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']);
