/* CODIS-V58 — عائلات الثيمات + أسطح الغرف (بطاقة الخطة النشطة، مستطيلات المهام والتعلّم). WebKit حقيقي (محاكاة iPhone).
   Run:  PW=<path to playwright-core/index.mjs> node tests/roomthemes_v58.mjs [app.html]     (RUNS="paper:375,dark:320,paper:430" افتراضياً)
   يغطي اختبارات الطلب الثلاثين: التجهيز/الإزالة لكل غرفة مع رجوع كل سطح لقيمه المحسوبة الأصلية حرفياً، نسبة الإنجاز وعرض الشريط كما هما،
   الحالات الثلاث (نقرات حقيقية + تمييز بصري)، الوزن التلقائي/اليدوي وتعديله، مهمة جديدة، تغيير اليوم، العزل بين الغرف، إعادة التشغيل،
   «الثيمات» بعائلات + عائلة مؤقتة بفاصل، «بحوزتك» بنفس التنظيم، 320/375/430 بالورقي والداكن، لا تمرير أفقي ولا قص، لا أخطاء. */
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = process.argv[2] || path.join(ROOT, 'app/CODIS_FINAL.html');
const { webkit, devices } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright-core');
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = p === '/app/CODIS_FINAL.html' ? APP : path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':{ '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml', '.js':'text/javascript' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/app/CODIS_FINAL.html';
let pass = 0, fail = 0; const ok = (n, c, info) => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + n + (!c && info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 600) : '')); };
async function open(w, theme){
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'codis-v58t-'));
  const ctx = await webkit.launchPersistentContext(prof, { ...devices['iPhone 12'], viewport:{ width:w, height:844 }, screen:{ width:w, height:844 } });
  const page = ctx.pages()[0] || await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  const until = async (fn, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await page.waitForTimeout(120); } return false; };
  const boot = async () => { await page.goto(URL0, { waitUntil:'commit', timeout:60000 }); if (!await until(() => !!(window.codisBootState && window.codisBootState.revealed > 0))) throw new Error('no reveal');
    if (await page.evaluate(() => { const g = document.getElementById('gate-guest'); return !!g && g.offsetParent !== null; })) { await page.click('#gate-guest'); await page.waitForTimeout(1200); } await page.waitForTimeout(700); await page.evaluate(t => CodisTheme.set(t, true), theme); };
  await boot();
  return { page, errs, boot, close: async () => { await ctx.close(); try { fs.rmSync(prof, { recursive:true, force:true }); } catch (e) {} } };
}
const IDS = { planning:'infernoCrystal', operations:'infernoCrystalOperations', teacher:'infernoCrystalTeacher' };
const nav = async (p, pg) => { await p.evaluate(x => navigateToPage(x), pg); await p.waitForTimeout(900); };
/* لقطة القيم المحسوبة لكل سطح (لمقارنة «قبل التجهيز» بـ«بعد الإزالة» حرفياً) */
const SNAP = () => { const c = (e, ps, pseudo) => e ? ps.map(x => getComputedStyle(e, pseudo || null).getPropertyValue(x)).join('|') : 'none';
  const card = document.querySelector('#planning-active > .plan-card'), q = s => card.querySelector(s);
  const item = l => document.querySelector(l + ' > .task-item'), I = l => { const it = item(l); if (!it) return 'no-item'; const g = s => it.querySelector(s);
    return [c(it, ['background-image', 'box-shadow', 'color', 'border-top-color']), c(it, ['background-color', 'box-shadow', 'width'], '::before'), c(it, ['background-image', 'width'], '::after'), c(g('.task-text'), ['color']), c(g('.task-wt'), ['background-image', 'border-top-color', 'color']), c(g('.status-group'), ['background-color', 'box-shadow']), [...it.querySelectorAll('.stat-btn')].map(b => c(b, ['background-image', 'color', 'border-top-color'])).join('/')].join(' ‖ '); };
  return { card:[c(card, ['background-image', 'box-shadow', 'color']), c(card, ['display', 'background-image'], '::before'), c(q('.plan-name'), ['color']), c(q('.plan-progress'), ['background-image', 'margin-left']), c(q('.plan-pct'), ['color', '-webkit-text-fill-color', 'font-size']), c(q('.xp-fill'), ['background-image']), c(q('.plan-cta .btn'), ['background-image', 'color']), c(q('.pm-btn'), ['color'])].join(' ‖ '),
    cardDecor:card.querySelectorAll(':scope > .pt-decor').length, ops:I('#day-task-list'), learn:I('#learn-day-task-list'),
    pct:document.getElementById('plan-active-pct').textContent, fill:document.getElementById('plan-active-fill').getAttribute('style') }; };
const ATTR = () => ['#planning-empty > .empty-state', '#planning-active > .plan-card', '#tasks-empty > .empty-state', '#day-task-list', '#learn-empty > .empty-state', '#learn-day-task-list'].map(s => { const e = document.querySelector(s); return s + '=' + (e.getAttribute('data-pt') || '') + '/' + e.className + '/' + (e.getAttribute('style') || ''); });
const setEq = (p, tg, on) => p.evaluate(([t, id, o]) => { const P = CodisPlanThemes; if (o) P.equip(id, 'own'); else P.unequip(t, 'own'); codisPlanThemeApply(t); }, [tg, IDS[tg], on]);
const clipped = () => [...document.querySelectorAll('#day-task-list > .task-item, #learn-day-task-list > .task-item, #planning-active > .plan-card')].filter(e => e.offsetParent !== null)
  .flatMap(it => [...it.querySelectorAll('.task-text, .task-wt, .stat-btn, .stat-label, .plan-name, .plan-pct, .pm-btn, .plan-cta .btn')]).filter(e => e.offsetParent !== null && (e.scrollWidth > e.clientWidth + 1)).map(e => e.className + ':' + e.textContent.trim().slice(0, 20));

for (const [theme, w] of (process.env.RUNS || 'paper:375,dark:320,paper:430').split(',').map(x => x.split(':'))) {
  const T = theme + ' ' + w + ': ';
  const o = await open(+w, theme); const p = o.page;
  // خطة حقيقية عبر المحرّر (مهام + تعلّم) + شراء الثيمات الثلاثة (غير مجهّزة)
  await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); codisConfirm = async () => true; CodisOutcomeUI.show = () => {}; CodisOutcomeUI.enqueue = () => {};
    CodisWallet.transact([], () => { CodisWallet.applySilver('ADMIN_GRANT', 20000, 'qa', 'admin', 'qa|' + Math.random(), null); return { ok:true }; });
    ['infernoCrystal', 'infernoCrystalOperations', 'infernoCrystalTeacher'].forEach(id => CodisPlanThemes.buy(id));
    navigateToPage('planning'); await sleep(600); startNewPlan(); await sleep(500);
    const L = n => Array.from({ length:n }, (_, i) => (i + 1) + '- ' + ['مراجعة تقرير المبيعات الأسبوعي للفريق', '!اجتماع فريق العمليات لمراجعة خطة الربع', 'اتصال بالعائلة', 'قراءة الفصل الثالث من كتاب الإدارة', 'حل تمارين الرياضيات', 'مراجعة المفردات الجديدة'][i % 6] + ' ' + (i + 1)).join('\n');
    const ti = document.getElementById('plan-tasks-input'); ti.value = L(21); ti.dispatchEvent(new Event('input', { bubbles:true }));
    const li = document.getElementById('plan-learn-input'); li.value = L(21); li.dispatchEvent(new Event('input', { bubbles:true }));
    distributePlan(); await sleep(900); });
  await nav(p, 'planning'); await nav(p, 'tasks'); await nav(p, 'learn'); await nav(p, 'planning');
  const base = await p.evaluate(SNAP); const silver0 = await p.evaluate(() => CodisWallet.silverBalance()), owned0 = await p.evaluate(() => JSON.stringify(data.inventory.planThemes.owned));
  ok(T + 'setup: plan distributed, plan card + task & learning rectangles present, nothing themed', base.ops !== 'no-item' && base.learn !== 'no-item' && !base.cardDecor && (await p.evaluate(ATTR)).every(a => /=\//.test(a)), { base, a:await p.evaluate(ATTR) });
  // 1–5: التخطيط ⇒ مربع الانتظار + بطاقة الخطة النشطة؛ النسبة والشريط كما هما
  await setEq(p, 'planning', true); await p.evaluate(() => renderPlanningPage()); await p.waitForTimeout(1200);
  let s = await p.evaluate(SNAP), a = await p.evaluate(ATTR);
  ok(T + '1–3 planning equipped: waiting box + active plan card wear the theme (one decor layer)', /infernoCrystal\/empty-state pt-box/.test(a[0]) && /=infernoCrystal\/plan-card pt-card/.test(a[1]) && s.cardDecor === 1 && s.card !== base.card, a.slice(0, 2));
  ok(T + '20 planning theme does not touch operations/teacher surfaces', a.slice(2).every(x => /=\//.test(x)) && s.ops === base.ops && s.learn === base.learn);
  const look = await p.evaluate(() => { const c = document.querySelector('#planning-active > .plan-card'), g = (e, x, ps) => getComputedStyle(e, ps || null).getPropertyValue(x); return { bg:g(c, 'background-image').slice(0, 16), before:g(c, 'display', '::before'), pctFill:g(c.querySelector('.plan-pct'), '-webkit-text-fill-color'), fillBg:g(c.querySelector('.xp-fill'), 'background-image').slice(0, 16), btn:g(c.querySelector('.plan-cta .btn'), 'background-image').slice(0, 16), title:g(c.querySelector('.plan-name'), 'color') }; });
  ok(T + '4 plan card look: obsidian bg, molten % + fill, molten CTA, paper binding hidden', /gradient/.test(look.bg) && /gradient/.test(look.fillBg) && /gradient/.test(look.btn) && look.title === 'rgb(244, 215, 182)' && /rgba\(0, 0, 0, 0\)|transparent/.test(look.pctFill), look);
  ok(T + '4 % text and fill width unchanged by the theme', s.pct === base.pct && s.fill === base.fill, { base:[base.pct, base.fill], now:[s.pct, s.fill] });
  // 5: تغيير النسبة عدة مرات (ثيم مجهّز) ⇒ النص والعرض يتحدّثان كما في الأصل
  const steps = [];
  for (let k = 0; k < 3; k++) {
    await p.evaluate(k => { const wk = currentWeekId(), W = data.weeks[wk]; let n = 0; const td = String(CodisClock.day()); for (const [dk, d] of Object.entries(W.days || {})) { if (dk === td) continue; for (const t of (d || [])) { if (n >= (k + 1) * 4) break; if (!t.status) { t.status = 'done'; } n++; } } saveData(); renderPlanningPage(); }, k);
    await p.waitForTimeout(1700);
    steps.push(await p.evaluate(() => ({ pct:document.getElementById('plan-active-pct').textContent, w:document.getElementById('plan-active-fill').style.width, pt:document.querySelector('#planning-active > .plan-card').getAttribute('data-pt') })));
  }
  const nums = steps.map(x => parseFloat(x.pct.replace(/[^\d.]/g, '')));
  ok(T + '5 progress updates repeatedly while themed (text rises, fill width = text, theme stays)', nums[0] < nums[1] && nums[1] < nums[2] && steps.every(x => x.pt === 'infernoCrystal' && Math.abs(parseFloat(x.w) - parseFloat(x.pct.replace(/[^\d.]/g, ''))) < 1.01), steps);
  const pctThemed = steps[2];
  // 19 (تخطيط): إزالة ⇒ رجوع حرفي
  await setEq(p, 'planning', false); await p.evaluate(() => renderPlanningPage()); await p.waitForTimeout(1500);
  const base2 = await p.evaluate(SNAP); a = await p.evaluate(ATTR);
  ok(T + '19 planning unequip: box + card back to the original computed look, no pt attrs/vars, % & width kept', base2.card === base.card && !base2.cardDecor && /=\/plan-card\//.test(a[1]) && /=\/empty-state\//.test(a[0]) && base2.pct === pctThemed.pct && /width/.test(base2.fill), { a:a.slice(0, 2), pct:[base2.pct, pctThemed.pct] });
  // 6–8: العمليات
  await nav(p, 'tasks'); const opsBase = (await p.evaluate(SNAP)).ops;
  await setEq(p, 'operations', true); await p.evaluate(() => renderTasksPage()); await p.waitForTimeout(700);
  s = await p.evaluate(SNAP); a = await p.evaluate(ATTR);
  const nOps = await p.evaluate(() => document.querySelectorAll('#day-task-list > .task-item').length);
  ok(T + '6–8 operations equipped: waiting box + every task rectangle themed', /infernoCrystalOperations\/empty-state pt-box/.test(a[2]) && /=infernoCrystalOperations\/pt-scope/.test(a[3]) && s.ops !== opsBase && nOps >= 1 &&
    await p.evaluate(() => [...document.querySelectorAll('#day-task-list > .task-item')].every(it => /gradient/.test(getComputedStyle(it).backgroundImage) && ['rgb(241, 220, 196)', 'rgb(255, 232, 208)'].includes(getComputedStyle(it.querySelector('.task-text')).color))), { a:a.slice(2, 4), nOps });
  ok(T + '20 operations theme leaves planning + teacher surfaces untouched', a[1].includes('=/plan-card') && a[5].startsWith('#learn-day-task-list=/') && s.learn === base.learn);
  // 9–11, 13: الحالات الثلاث مميزة بصرياً (عينات مؤقتة بالـHTML نفسه داخل القائمة ثم تُحذف)
  const states = await p.evaluate(list => { const L = document.querySelector(list), out = {}; ['done', 'half', 'none'].forEach(st => { const it = document.createElement('div'); it.className = 'task-item is-' + st + ' qa-fx'; it.innerHTML = codisTaskItemHtml({ id:'qa_' + st, text:'عينة ' + st, status:st, priority:'' }, false); L.appendChild(it);
      const b = it.querySelector('.stat-btn.active'), c = getComputedStyle(b); out[st] = { active:b.dataset.status, color:c.color, border:c.borderTopColor, bg:c.backgroundImage.slice(0, 60), rail:getComputedStyle(it, '::before').backgroundColor }; }); L.querySelectorAll('.qa-fx').forEach(x => x.remove()); return out; }, '#day-task-list');
  const uniq = k => new Set(['done', 'half', 'none'].map(x => states[x][k])).size === 3;
  ok(T + '9–11/13 ops states: active button + rail colours are three distinct identities (crystal/amber/crimson)', ['done', 'half', 'none'].every(x => states[x].active === x) && uniq('color') && uniq('border') && uniq('rail'), states);
  // نقرات حقيقية: خلصتها / ما سويتها على مستطيلات فعلية ⇒ البيانات تتغير كما في الأصل
  const clickRes = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const L = document.getElementById('day-task-list'); const its = [...L.querySelectorAll(':scope > .task-item')];
    const res = []; for (const [i, st] of [[0, 'done'], [1, 'none']]) { const it = [...L.querySelectorAll(':scope > .task-item')][0]; if (!it) break; const id = it.dataset.tid; it.querySelector('.stat-btn[data-status="' + st + '"]').click(); await sleep(250);
      const cur = L.querySelector(':scope > .task-item[data-tid="' + id + '"]') || it; const mid = { cls:cur.className, themedBg:/gradient/.test(getComputedStyle(cur).backgroundImage) }; await sleep(1800);
      const wk = currentWeekId(); let t = null; Object.values(data.weeks[wk].days || {}).forEach(d => (d || []).forEach(x => { if (String(x.id) === String(id)) t = x; })); res.push({ st, saved:t && t.status, mid, scope:L.classList.contains('pt-scope') }); }
    return res; });
  ok(T + '9/11 real clicks: «خلصتها» / «ما سويتها» save the status; rectangle stays themed while answering', clickRes.length === 2 && clickRes.every(r => r.saved === r.st && r.mid.themedBg && r.scope), clickRes);
  // 12: الوزن التلقائي ⇒ يدوي ⇒ تلقائي، والشريحة مقروءة ومميزة
  const wt = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const it = document.querySelector('#day-task-list > .task-item'); if (!it) return null; const id = it.dataset.tid;
    const chip = () => document.querySelector('#day-task-list > .task-item[data-tid="' + id + '"] .task-wt'); const c0 = chip(), r0 = { manual:c0.classList.contains('is-manual'), border:getComputedStyle(c0).borderTopColor, v:getComputedStyle(c0.querySelector('.tw-v')).color, h:c0.getBoundingClientRect().height };
    c0.click(); await sleep(300); const inp = document.querySelector('#day-task-list > .task-item[data-tid="' + id + '"] .tw-in'); const inpBg = inp && getComputedStyle(inp).backgroundColor;
    inp.value = '2.5'; document.querySelector('#day-task-list > .task-item[data-tid="' + id + '"] .tw-save').click(); await sleep(500);
    const c1 = chip(), r1 = { manual:c1.classList.contains('is-manual'), border:getComputedStyle(c1).borderTopColor, txt:c1.textContent };
    c1.click(); await sleep(300); document.querySelector('#day-task-list > .task-item[data-tid="' + id + '"] .tw-auto').click(); await sleep(500);
    return { r0, inpBg, r1, back:!chip().classList.contains('is-manual') }; });
  ok(T + '12 weight: auto chip readable → edit (themed input) → manual 2.5 (amber edge) → back to auto', wt && !wt.r0.manual && wt.r0.h >= 30 && wt.inpBg === 'rgb(10, 6, 5)' && wt.r1.manual && /2\.5/.test(wt.r1.txt) && wt.r1.border !== wt.r0.border && wt.back, wt);
  // 14: مهمة جديدة ⇒ تلبس الثيم تلقائياً
  const added = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const i = document.getElementById('manual-task-input'); i.value = 'مهمة جديدة للاختبار'; addManualTask(); await sleep(600);
    const it = [...document.querySelectorAll('#day-task-list > .task-item')].find(x => /مهمة جديدة للاختبار/.test(x.textContent)); return it ? { bg:/gradient/.test(getComputedStyle(it).backgroundImage), col:getComputedStyle(it.querySelector('.task-text')).color } : null; });
  ok(T + '14 a newly added task is themed automatically', added && added.bg && added.col === 'rgb(241, 220, 196)', added);
  // 15: تغيير اليوم
  const day = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const cur = activeDayIdx, nxt = (cur + 1) % 7; renderTasksPage(nxt); await sleep(500); const r = { scope:document.getElementById('day-task-list').classList.contains('pt-scope'), items:[...document.querySelectorAll('#day-task-list > .task-item')].map(it => /gradient/.test(getComputedStyle(it).backgroundImage)) }; renderTasksPage(cur); await sleep(400); return r; });
  ok(T + '15 changing the day keeps the theme on the re-rendered list', day.scope && day.items.every(Boolean), day);
  ok(T + '29 operations: no clipped text in rectangles, no horizontal scroll', !(await p.evaluate(clipped)).length && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await p.evaluate(clipped));
  // 19 (عمليات): إزالة ⇒ رجوع حرفي
  await setEq(p, 'operations', false); await p.evaluate(() => renderTasksPage()); await p.waitForTimeout(600);
  a = await p.evaluate(ATTR);
  const opsAfter = await p.evaluate(() => { const it = document.querySelector('#day-task-list > .task-item'); return it ? getComputedStyle(it).backgroundImage.slice(0, 30) + '|' + getComputedStyle(it.querySelector('.task-text')).color : 'none'; });
  const opsBefore = opsBase.split(' ‖ ')[0].split('|')[0].slice(0, 30) + '|' + opsBase.split(' ‖ ')[3];
  ok(T + '19 operations unequip: list + box back to original (no pt class/attrs/vars), rectangles original look', /^#tasks-empty > \.empty-state=\/empty-state\/$/.test(a[2]) && /^#day-task-list=\/\/$/.test(a[3]) && opsAfter === opsBefore, { a:a.slice(2, 4), opsAfter, opsBefore });
  // 16–18: الأستاذ
  await nav(p, 'learn'); const lrnBase = (await p.evaluate(SNAP)).learn;
  await setEq(p, 'teacher', true); await p.evaluate(() => renderLearnPage()); await p.waitForTimeout(700);
  s = await p.evaluate(SNAP); a = await p.evaluate(ATTR);
  ok(T + '16–17 teacher equipped: path box + every learning rectangle themed; other rooms untouched', /infernoCrystalTeacher\/empty-state pt-box/.test(a[4]) && /=infernoCrystalTeacher\/pt-scope/.test(a[5]) && s.learn !== lrnBase && /=\/plan-card/.test(a[1]) && /^#day-task-list=\/\/$/.test(a[3]), a);
  const lstates = await p.evaluate(list => { const L = document.querySelector(list), out = {}; ['done', 'half', 'none'].forEach(st => { const it = document.createElement('div'); it.className = 'task-item is-' + st + ' qa-fx'; it.innerHTML = codisTaskItemHtml({ id:'ql_' + st, text:'عينة ' + st, status:st, priority:'' }, false); L.appendChild(it);
      const b = it.querySelector('.stat-btn.active'), c = getComputedStyle(b); out[st] = { color:c.color, border:c.borderTopColor, node:getComputedStyle(it, '::before').backgroundColor + ' ' + getComputedStyle(it, '::before').backgroundImage.slice(0, 30) }; }); L.querySelectorAll('.qa-fx').forEach(x => x.remove()); return out; }, '#learn-day-task-list');
  ok(T + '18 teacher states: three distinct active identities + distinct station gems', new Set(Object.values(lstates).map(x => x.color)).size === 3 && new Set(Object.values(lstates).map(x => x.node)).size === 3, lstates);
  const lclick = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const it = document.querySelector('#learn-day-task-list > .task-item'); if (!it) return null; const id = it.dataset.tid; it.querySelector('.stat-btn[data-status="done"]').click(); await sleep(2000);
    const wk = currentWeekId(); let t = null; Object.values(data.learnWeeks[wk].days || {}).forEach(d => (d || []).forEach(x => { if (String(x.id) === String(id)) t = x; })); return t && t.status; });
  ok(T + '18 real click «خلصتها» in the teacher room saves the status', lclick === 'done', lclick);
  const teacherOps = await p.evaluate(() => { const it = document.querySelector('#learn-day-task-list > .task-item'); return it ? getComputedStyle(it).boxShadow.includes('217, 194, 160') : null; });
  ok(T + 'teacher keeps its own book identity (double gilt tooling), not a copy of operations', teacherOps === true);
  ok(T + '29 teacher: no clipped text, no horizontal scroll', !(await p.evaluate(clipped)).length && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await p.evaluate(clipped));
  // 21: إعادة التشغيل (الغرف الثلاث مجهّزة)
  await setEq(p, 'planning', true); await setEq(p, 'operations', true);
  await o.boot(); await nav(p, 'tasks'); await nav(p, 'learn'); await nav(p, 'planning');
  a = await p.evaluate(ATTR);
  ok(T + '21 after restart all six surfaces wear their room theme', /=infernoCrystal\//.test(a[0]) && /=infernoCrystal\//.test(a[1]) && /=infernoCrystalOperations\//.test(a[2]) && /=infernoCrystalOperations\//.test(a[3]) && /=infernoCrystalTeacher\//.test(a[4]) && /=infernoCrystalTeacher\//.test(a[5]), a);
  ok(T + 'idempotent: repeated apply/render keeps exactly one decor per box/card and does not rebuild them', await p.evaluate(() => { const d0 = document.querySelector('#planning-active > .plan-card > .pt-decor'); for (let i = 0; i < 4; i++) { codisPlanThemeApply(); renderPlanningPage(); renderTasksPage(); renderLearnPage(); } return document.querySelector('#planning-active > .plan-card > .pt-decor') === d0 && ['#planning-empty > .empty-state', '#planning-active > .plan-card', '#tasks-empty > .empty-state', '#learn-empty > .empty-state'].every(s => document.querySelectorAll(s + ' > .pt-decor').length === 1) && !document.querySelector('#day-task-list > .pt-decor, #learn-day-task-list > .pt-decor'); }));
  ok(T + '22 no new purchase, silver/ownership unchanged by equips', await p.evaluate(([s0, o0]) => CodisWallet.silverBalance() === s0 && JSON.stringify(data.inventory.planThemes.owned) === o0 && CodisWallet.silverTxs().filter(t => /^plantheme\|/.test(t.referenceId || '')).length === 3, [silver0, owned0]));
  // 23–26: المتجر/بحوزتك
  await p.evaluate(() => { econOpenStore(); }); await p.waitForTimeout(1300); await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(500);
  let st = await p.evaluate(() => ({ tab:document.getElementById('cos-tab-themes').firstChild.textContent.trim(), h:document.getElementById('pt-h').textContent, fams:[...document.querySelectorAll('#cos-sub-themes .pt-fam')].map(f => ({ id:f.dataset.family, ar:f.querySelector('.pt-fam-ar').textContent, en:(f.querySelector('.pt-fam-en') || {}).textContent, desc:!!f.querySelector('.pt-fam-desc'), n:f.querySelectorAll('.pt-mtile').length, names:[...f.querySelectorAll('.pt-mname')].map(x => x.textContent) })), repeat:[...document.querySelectorAll('#cos-sub-themes .pt-mtile')].some(t => /Inferno|الجحيم/.test(t.textContent)) }));
  ok(T + '23–24 store: «الثيمات»; one Inferno Crystal family (title + EN + desc) with its 3 room products, family name not repeated on tiles', st.tab === 'الثيمات' && st.h === 'الثيمات' && st.fams[0].id === 'infernoCrystal' && st.fams.filter(f => f.id === 'infernoCrystal').length === 1 /* V59: + عائلة الجليد بعدها */ && st.fams[0].ar === 'الجحيم الكريستالي' && st.fams[0].en === 'Inferno Crystal' && st.fams[0].desc && st.fams[0].n === 3 && st.fams[0].names.join() === 'غرفة التخطيط,غرفة العمليات,غرفة الأستاذ' && !st.repeat, st);
  await p.evaluate(() => { CODIS_THEME_FAMILIES.push({ id:'qaFam', name:'QA Glass', ar:'زجاج الاختبار', desc:'عائلة مؤقتة.', order:20 }); CODIS_THEME_FAMILIES.push({ id:'qaFam0', name:'QA First', ar:'الأولى', desc:'ترتيب أقل.', order:5 });
    CODIS_PLAN_THEME_DEFS.push(Object.assign({}, CODIS_PLAN_THEME_DEFS[1], { id:'qaF1', family:'qaFam' }), Object.assign({}, CODIS_PLAN_THEME_DEFS[2], { id:'qaF2', family:'qaFam' }), Object.assign({}, CODIS_PLAN_THEME_DEFS[0], { id:'qaF0', family:'qaFam0' }));
    econRenderStore(); }); await p.waitForTimeout(500); await p.evaluate(() => { econStoreSetPart('cosmetics', { quiet:true }); econCosSetSub('themes'); }); await p.waitForTimeout(300);
  st = await p.evaluate(() => ({ order:[...document.querySelectorAll('#cos-sub-themes .pt-fam')].map(f => f.dataset.family + ':' + f.querySelectorAll('.pt-mtile').length), sep:[...document.querySelectorAll('#cos-sub-themes .pt-fam')].map(f => getComputedStyle(f, '::before').content), gap:(() => { const f = document.querySelectorAll('#cos-sub-themes .pt-fam'); return f.length > 1 ? Math.round(f[1].getBoundingClientRect().top - f[0].getBoundingClientRect().bottom) : 0; })(), docW:document.documentElement.scrollWidth <= innerWidth,
    cut:[...document.querySelectorAll('#cos-sub-themes .pt-mname, #cos-sub-themes .pt-mbadge, #cos-sub-themes .pt-fam-ar')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent) }));
  ok(T + '25 future families appear automatically in `order` with the separator before each following family', st.order.join() === 'qaFam0:1,infernoCrystal:3,frostCrystal:3,qaFam:2,agedWood:3,blazingMeteor:4'   /* V64: + الخشب المعتّق (order 30) */ && st.sep[0] === 'none' && st.sep.slice(1).every(x => x !== 'none') && st.gap >= 20 && st.docW && !st.cut.length, st);
  await p.evaluate(() => { for (const arr of [CODIS_PLAN_THEME_DEFS, CODIS_THEME_FAMILIES]) for (let i = arr.length - 1; i >= 0; i--) if (/^qa/.test(arr[i].id)) arr.splice(i, 1); econRenderStore(); }); await p.waitForTimeout(400);
  ok(T + '25 temporary families removed, no data left', await p.evaluate(() => CODIS_PLAN_THEME_DEFS.length === 13 && CODIS_THEME_FAMILIES.length === 4 && !JSON.stringify(data).includes('qaF')));
  await p.evaluate(() => econOpenVault()); await p.waitForTimeout(1300); await p.evaluate(() => econOwnSetPart('cosmetics')); await p.waitForTimeout(400);
  st = await p.evaluate(() => ({ h:(document.getElementById('own-pt-h') || {}).textContent, fams:[...document.querySelectorAll('#own-panel-cosmetics .pt-fam')].map(f => f.dataset.family + ':' + f.querySelectorAll('.pt-mtile.is-on').length), ids:(() => { const seen = {}, d = []; document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) d.push(e.id); seen[e.id] = 1; }); return d; })() }));
  ok(T + '26 «بحوزتك» uses the same family grouping (3 equipped), no duplicate ids', st.h === 'الثيمات' && st.fams.join() === 'infernoCrystal:3' && !st.ids.length, st);
  await p.evaluate(() => document.querySelector('#own-panel-cosmetics .pt-mtile .pt-mbtn').click()); await p.waitForTimeout(500);
  st = await p.evaluate(() => ({ covers:[...document.querySelectorAll('.pt-ov-covers li')].map(x => x.textContent), fam:[...document.querySelectorAll('.pt-ov-meta dd')].map(x => x.textContent) }));
  ok(T + 'details window lists what the theme dresses in its room + the family', st.covers.length === 3 && st.fam.includes('الجحيم الكريستالي'), st);
  await p.keyboard.press('Escape'); await p.evaluate(() => { econCloseOwn(); econCloseStore(); }); await p.waitForTimeout(300);
  ok(T + 'card cosmetics untouched', await p.evaluate(() => CodisCosmetics.defs().length === 2));
  ok(T + '30 no page/console errors', !o.errs.length, o.errs.slice(0, 3));
  await o.close();
}
srv.close();
console.log(`\n${pass} passed, ${fail} failed (engine: webkit)`); process.exit(fail ? 1 : 0);
