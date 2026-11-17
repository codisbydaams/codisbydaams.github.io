"""CODIS-V66 (3.53.0) — عائلة «النيزك المشتعل» (blazingMeteor) + نطاق تلبيس جديد «الغرفة كاملة» (apply:'room' ⇒ سطح kind:'room' = #page-*)
   + الغرفة الرابعة «التأديب» في نظام الثيمات (discipline) + 4 منتجات مستقلة (7,999 فضة لكلٍّ، أسطوري) + تفاعل Pointer Events + هوية صوتية كهربائية
   بسياق blazingMeteor داخل CodisAudio نفسه. الثيمات القديمة تحتفظ بأسطحها حرفياً. فوق ناتج patch_v65 وقبل boot_split.
   py -3 tools/patch_v66.py <ناتج patch_v65> <out>   (sh tools/rebuild_v66.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V66' not in s and 'CODIS-V65' in s, 'needs v65 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t

# ===================== 1) الغرف: جذر الغرفة + الغرفة الرابعة (قبل العائلات، بعد تعريف الأهداف) =====================
rep("const CODIS_THEME_FAMILIES = [", "/* CODIS-V66 */\n" + clean(rd('identity', 'v66_targets.js'), 'targets') + "const CODIS_THEME_FAMILIES = [")

# ===================== 2) العائلة (بعد الخشب المعتّق) =====================
rep("""قبل عقود طويلة.' }
];""", """قبل عقود طويلة.' },
  /* CODIS-V66 */
  { id:'blazingMeteor', name:'Blazing Meteor', ar:'النيزك المشتعل', order:40,
    desc:'عالم كهرماني نيزكي فاخر، تتجسد فيه طاقة النيازك والبلازما الكهربائية داخل واجهة عصرية متقدمة. يجمع بين الكهرمان المصهور، والذهب المتوهج، والشرارات الكهربائية، والانعكاسات المعدنية، والتوهجات البرتقالية الذهبية، مع تفاصيل هندسية دقيقة — وكل منتج يلبّس غرفته كاملة من بدايتها إلى نهايتها.' }
];""")

# ===================== 3) المنتجات الأربعة =====================
rep("  return [\n    Object.assign({}, base, { id:'infernoCrystal', target:'planning'", clean(rd('identity', 'v66_defs.js'), 'defs') + "  return [\n    Object.assign({}, base, { id:'infernoCrystal', target:'planning'")
rep("].concat(frostDefs, woodDefs);   /* CODIS-V64 */", "].concat(frostDefs, woodDefs, meteorDefs);   /* CODIS-V64 · CODIS-V66 */")

# ===================== 4) الراسم =====================
rep("  }\n};\nconst CodisPlanThemes = (function(){", "  },\n" + clean(rd('identity', 'v66_art.js'), 'art') + "};\nconst CodisPlanThemes = (function(){")

# ===================== 5) الأسطح: room + غرفة بلا أسطح قديمة =====================
rep("function codisThemeSurfaces(tg){ const T = CODIS_THEME_TARGETS[tg]; if(!T) return []; return Array.isArray(T.surfaces) && T.surfaces.length ? T.surfaces",
    "function codisThemeSurfaces(tg){ const T = CODIS_THEME_TARGETS[tg]; if(!T) return []; return Array.isArray(T.surfaces) && (T.surfaces.length || T.page) ? T.surfaces")   # CODIS-V66: غرفة بلا أسطح قديمة (التأديب) ⇒ []
rep("const CODIS_THEME_SURFACE_CLS = { box:'pt-box', card:'pt-card', scope:'pt-scope', panel:'pt-panel', inner:'pt-box' };",
    "const CODIS_THEME_SURFACE_CLS = { box:'pt-box', card:'pt-card', scope:'pt-scope', panel:'pt-panel', inner:'pt-box', room:'pt-room' };   /* CODIS-V66: room = جذر الغرفة كاملة */")
rep("el.classList.remove('pt-box', 'pt-card', 'pt-scope', 'pt-panel');",
    "el.classList.remove('pt-box', 'pt-card', 'pt-scope', 'pt-panel', 'pt-room');\n  try{ if(codisMeteorFxApi) codisMeteorFxApi.detach(el); }catch(x){}   /* CODIS-V66: لا مؤثر نشط بعد الإزالة */")
rep("""    const id = map[k] || '', d = id ? CodisPlanThemes.def(id) : null;
    codisThemeSurfaces(k).forEach(sf=>{ try{ (sf.all || sf.kind === 'inner' ? Array.prototype.slice.call(document.querySelectorAll(sf.sel)) : [document.querySelector(sf.sel)]).forEach(el=>{ if(el) codisThemeSurfaceApply(el, sf, d, k); }); }catch(e){ console.error('CODIS room theme:', k, sf && sf.key, e); } });""",
    """    const id = map[k] || '', d = id ? CodisPlanThemes.def(id) : null, whole = codisThemeIsRoom(d);   /* CODIS-V66: ثيم الغرفة كاملة يأخذ الجذر والأسطح القديمة ترجع لأصلها */
    codisThemeSurfaces(k).forEach(sf=>{ try{ (sf.all || sf.kind === 'inner' ? Array.prototype.slice.call(document.querySelectorAll(sf.sel)) : [document.querySelector(sf.sel)]).forEach(el=>{ if(el) codisThemeSurfaceApply(el, sf, whole ? null : d, k); }); }catch(e){ console.error('CODIS room theme:', k, sf && sf.key, e); } });
    const rs = codisThemeRoomSurface(k); if(rs){ try{ const el = document.querySelector(rs.sel); if(el) codisThemeSurfaceApply(el, rs, whole ? d : null, k); }catch(e){ console.error('CODIS room theme (room):', k, e); } }""")

# ===================== 6) المتجر/المعاينة =====================
rep("  if(!big) return '<div class=\"pt-stage is-mini\">'", "  if(codisThemeIsRoom(d)) return codisRoomThemeStageHtml(d, big);   /* CODIS-V66 */\n  if(!big) return '<div class=\"pt-stage is-mini\">'")
rep("codisThemeSurfaces(d.target).map(x=>'<li>' + escapeHtml(x.label || x.key) + '</li>').join('')", "codisThemeCoversOf(d).map(x=>'<li>' + escapeHtml(x) + '</li>').join('')")
rep("if(sh.ownerNode && sh.ownerNode.id === 'codis-pt-pv-css') continue;", "if(sh.ownerNode && (sh.ownerNode.id === 'codis-pt-pv-css' || sh.ownerNode.id === 'codis-v66-css')) continue;   /* CODIS-V66: طبقة النيزك تغطي المعاينة بنفسها */")
rep("showToast(on ? 'أُزيل ' + d.name + ' — رجع مربع ' + R.room + ' لشكله الأصلي'",
    "showToast(on ? 'أُزيل ' + d.name + (codisThemeIsRoom(d) ? ' — رجعت ' + R.room + ' لشكلها الأصلي' : ' — رجع مربع ' + R.room + ' لشكله الأصلي')")

# ===================== 7) البيانات: خانة التأديب (توافق كامل: equipped = مرآة التخطيط) =====================
rep("['planning', 'operations', 'teacher'].forEach(k=>{ if(typeof by[k] !== 'string') by[k] = ''; });",
    "['planning', 'operations', 'teacher', 'discipline'].forEach(k=>{ if(typeof by[k] !== 'string') by[k] = ''; });   /* CODIS-V66: + discipline */")
rep("equippedByTarget:{ planning:'', operations:'', teacher:'' } }; }", "equippedByTarget:{ planning:'', operations:'', teacher:'', discipline:'' } }; }")

# ===================== 8) الغرف: التأديب يطبّق ثيمه عند كل رسم + ورقة «المنجزة» ترث هوية الغرفة =====================
rep("function renderHabitsPage(){\n", "function renderHabitsPage(){\n  try{ codisPlanThemeApply('discipline'); }catch(e){ console.error('CODIS room theme:', e); }   /* CODIS-V66 */\n")
rep("const root = document.createElement('div'); root.className = 'cd-ov';", "const root = document.createElement('div'); root.className = 'cd-ov'; codisThemeTagSheet(root, opener);   /* CODIS-V66 */")

# ===================== 9) الوحدة: المعاينات + التفاعل =====================
anchor = "touch:pid !== null, press:!!press }), reset:cancel };\n})();\n"
rep(anchor, anchor + "/* ===== CODIS-V66 ===== */\n" + clean(rd('identity', 'v66_core.js'), 'core'))

# ===================== 10) الصوت =====================
rep("Object.assign(SOUNDS, V2);\n", "Object.assign(SOUNDS, V2);\n" + clean(rd('identity', 'v66_sounds.js'), 'sounds'))

# ===================== 10b) الصوت المتأخر من نقرة داخل غرفة ملبّسة بالكامل (تأكيد غير متزامن، تسلسل الحالة...) =====================
# النطاق الفوري (V64) يُصفَّر بعد النقرة؛ للغرفة الكاملة يبقى «نطاق لاصق» قصير (2.5ث) ما دامت تلك الغرفة/الورقة ظاهرة،
# ويُلغى فوراً بأي نقرة خارجها (التنقل العام مثلاً). الأسطح القديمة (الخشب) لا تدخل هذا المسار.
rep("  let soundScope = null;\n", "  let soundScope = null, stickyScope = null, stickyUntil = 0, stickyEl = null;   /* CODIS-V66 */\n"
    "  function curScope(){ if(soundScope) return soundScope; if(stickyScope && Date.now() < stickyUntil && stickyEl && stickyEl.isConnected && stickyEl.getClientRects().length) return stickyScope; return null; }\n")
rep("const key = (soundScope && SOUNDS[name + '@' + soundScope]) ? name + '@' + soundScope :", "const sc0 = curScope(), key = (sc0 && SOUNDS[name + '@' + sc0]) ? name + '@' + sc0 :")
rep("setScope(x){ soundScope = (typeof x === 'string' && x) ? x : null; }, scope:()=>soundScope,",
    "setScope(x){ soundScope = (typeof x === 'string' && x) ? x : null; }, scope:()=>soundScope,\n    setSticky(x, ms, el){ stickyScope = (typeof x === 'string' && x && el) ? x : null; stickyUntil = stickyScope ? Date.now() + (ms || 0) : 0; stickyEl = stickyScope ? el : null; }, sticky:()=>(soundScope ? null : curScope()),   /* CODIS-V66 */")
rep("return { setScope(){}, scope:()=>null,", "return { setScope(){}, scope:()=>null, setSticky(){}, sticky:()=>null,")
rep("const sc = codisSoundScopeOf(e.target); CodisAudio.setScope(sc);", "const sc = codisSoundScopeOf(e.target); CodisAudio.setScope(sc); try{ const rm = sc ? e.target.closest('.pt-room[data-pt-surface], .pt-room-sheet') : null; CodisAudio.setSticky(rm ? sc : null, 2500, rm); }catch(x){}")

# ===================== 11) CSS =====================
ROOTS = {
    '@R':   ':is(#page-planning, #page-tasks, #page-learn, #page-habits, .bm-pv)',
    '@PLN': ':is(#page-planning, .bm-pv.pt-pv-planning)',
    '@OPS': ':is(#page-tasks, .bm-pv.pt-pv-ops)',
    '@LRN': ':is(#page-learn, .bm-pv.pt-pv-lrn)',
    '@DSC': ':is(#page-habits, .bm-pv.pt-pv-dsc)',
}
BOOST = ':is(#bm-k, .pt-room):is(#bm-k2, [data-pt-surface])[data-pt^="blazingMeteor"]'
css = clean(rd('identity', 'v66.css'), 'css')
css = css.replace('@SH', '.cd-ov.pt-room-sheet:is(#bm-k, [data-pt-surface]):is(#bm-k2, [data-pt-surface])[data-pt^="blazingMeteor"]')
for k in ('@PLN', '@OPS', '@LRN', '@DSC', '@R'):
    css = css.replace(k + ' ', ROOTS[k] + BOOST + ' ').replace(k + ',', ROOTS[k] + BOOST + ',').replace(k + '{', ROOTS[k] + BOOST + '{').replace(k + ':', ROOTS[k] + BOOST + ':')
assert '@R' not in css and '@PLN' not in css and '@OPS' not in css and '@LRN' not in css and '@DSC' not in css and '@SH' not in css, 'macro left'
i = s.index('<style id="codis-v65-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v66-css">\n/* CODIS-V66 */\n' + css + '</style>' + s[j:]

# حراس: مرة واحدة لكل تعريف
assert s.count("blazingMeteor:function(d, u, mini){") == 1 and s.count('const CodisMeteorFx') == 1 and s.count("'press@blazingMeteor'") == 1 and s.count("id:'blazingMeteorDiscipline'") == 1
assert s.count('function codisSoundScopeOf(') == 1
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v66 applied')
