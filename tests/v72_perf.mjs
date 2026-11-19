/* CODIS-V72 — قياسات أداء منشئ الشخصية (WebKit iPhone 12 + Chrome بمعالج مبطّأ ×4 عبر CDP).
   PW=<playwright-core/index.mjs> node tests/v72_perf.mjs [url]   — أرقام تقريبية لجهاز التطوير (swiftshader/WebKit headless)، ليست قياس هاتف حقيقي. */
import { pathToFileURL } from 'url';
const { webkit, chromium, devices } = await import(pathToFileURL(process.env.PW).href);
const url = process.argv[2] || 'http://127.0.0.1:8766/app/CODIS_FINAL.html';
async function run(label, launcher, ctxOpts, cpu) {
  const br = await launcher.launch(launcher === chromium ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
  const ctx = await br.newContext(ctxOpts), p = await ctx.newPage();
  if (cpu && launcher === chromium) { const s = await ctx.newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  await p.goto(url); await p.waitForTimeout(3500);
  await p.evaluate(() => { try { document.getElementById('codis-gate').remove(); } catch (e) {} navigateToPage('settings'); });
  const R = {};
  for (const pass of ['cold', 'warm']) {
    R[pass + 'Open'] = await p.evaluate(async () => { const t0 = performance.now(); codisCharOpen('create'); await new Promise(r => { const f = () => (codisChx && codisChx.ready) ? r() : setTimeout(f, 20); f(); }); return Math.round(performance.now() - t0); });
    if (pass === 'cold') {
      const t = await p.evaluate(async () => {
        const v = CodisChar.current(), sel = codisChx.sel, m = {}, time = async (k, s) => { const t0 = performance.now(); await v.setConfig(CodisChar.spec(s)); m[k] = Math.round(performance.now() - t0); };
        await time('face', Object.assign({}, sel, { face: 'm5' })); await time('face2', Object.assign({}, sel, { face: 'm7' }));
        await time('hairNew', Object.assign({}, sel, { face: 'm7', hair: 'afro01' })); await time('hairBack', Object.assign({}, sel, { face: 'm7', hair: 'short04' }));
        await time('build', Object.assign({}, sel, { build: 'athl' })); await time('sex', Object.assign({}, CodisChar.fix({ body: 'female' })));
        await time('beard', Object.assign({}, sel, { beard: 'full' })); await time('slider', Object.assign({}, sel, { adv: 'fw:60,nw:-40' }));
        const t0 = performance.now(); for (let i = 0; i < 3; i++) await v.snapshot(CodisChar.spec(Object.assign({}, sel, { face: 'm' + (i + 1) })), { focus: 'face', z: 1, size: 140 }); m.thumbEach = Math.round((performance.now() - t0) / 3);
        const info = v.renderer.info; m.geometries = info.memory.geometries; m.textures = info.memory.textures; m.programs = (info.programs || []).length; m.drawCalls = info.render.calls; m.tris = info.render.triangles;
        m.dpr = v.renderer.getPixelRatio(); m.canvas = [v.canvas.width, v.canvas.height];
        if (performance.memory) m.heapMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
        return m;
      });
      Object.assign(R, t);
    }
    await p.evaluate(() => codisChxClose(false)); await p.waitForTimeout(400);
  }
  R.cycles = await p.evaluate(async () => { for (let i = 0; i < 5; i++) { codisCharOpen('edit'); await new Promise(r => { const f = () => (codisChx && codisChx.ready) ? r() : setTimeout(f, 20); f(); }); codisChxClose(false); await new Promise(r => setTimeout(r, 300)); } return { canvases: document.querySelectorAll('canvas').length, view: !!CodisChar.current(), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }; });
  console.log(label, JSON.stringify(R));
  await br.close();
}
await run('webkit-iphone12', webkit, { ...devices['iPhone 12'] }, 0);
await run('chrome-cpu4-iphoneDPR3', chromium, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, 4);
