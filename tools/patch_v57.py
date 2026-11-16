"""CODIS-V57 (3.44.0) — ثيمات الغرف: توسعة V56 من غرفة التخطيط إلى ثلاث غرف (التخطيط · العمليات · الأستاذ).
  • ثيمان جديدان بنفس هوية INFERNO CRYSTAL وسعرها: infernoCrystalOperations (#tasks-empty) و infernoCrystalTeacher (#learn-empty)؛
    infernoCrystal كما هو (المعرّف/السعر/الملكية) وصار target:'planning'.
  • تجهيز مستقل لكل غرفة: data.inventory.planThemes.equippedByTarget {planning, operations, teacher}؛ equipped (V56) يبقى مصدر خانة التخطيط
    ومرآتها، فنسخة 3.43 التي تُسقط الخريطة لا تضيّع تجهيز التخطيط. لا مفتاح تخزين جديد، لا نوع معاملة جديد، لا عملة جديدة.
  • المتجر/بحوزتك: شبكة ثلاثة أعمدة من بطاقات مصغّرة (Mini Preview) والضغط يفتح نافذة V56 المطوّرة (Large Preview + الإجراء).
  • الوحدة tools/identity/v57_themes.js تحلّ محل v56_themes.js المضمَّنة، و v57.css تحلّ محل طبقة v56.css.
  py -3 tools/patch_v57.py <ناتج patch_v56 قبل boot_split> <out>   (sh tools/rebuild_v57.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V57' not in s and 'CODIS-V56' in s, 'needs v56 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:160])
    s = s.replace(old, new)
css = rd('identity', 'v57.css'); js = rd('identity', 'v57_themes.js'); js56 = rd('identity', 'v56_themes.js')
assert '</style' not in css and '<!--' not in css and '</script' not in js

# 1) طبقة CSS: v57 تحلّ محل v56 في مكانها نفسه
i = s.index('<style id="codis-v56-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:i] + '<style id="codis-v57-css">\n/* CODIS-V57 (يحلّ محل CODIS-V56) */\n' + css + '</style>' + s[j:]

# 2) الوحدة: v57 تحلّ محل v56 حرفياً (نفس الموضع قبل econOwnTotals)
rep("/* CODIS-V56 */\n" + js56.strip() + "\nfunction econOwnTotals(){", "/* CODIS-V57 */\n" + js.strip() + "\nfunction econOwnTotals(){")

# 3) التطبيع: + equippedByTarget (declaration، لا تقرأ const، لا ترمي — قاعدة وقت التحميل). خانة التخطيط = equipped دائماً
rep("""    return { owned:owned, equipped:(typeof t.equipped === 'string' && seen[t.equipped]) ? t.equipped : '' };
  }catch(e){ return { owned:[], equipped:'' }; }""",
"""    /* CODIS-V57: تجهيز مستقل لكل غرفة. المفاتيح المجهولة (غرف مستقبلية) تُحفظ إن كانت قيمتها ثيماً مملوكاً؛ مطابقة target للغرفة تُفحص وقت التشغيل */
    const eq = (typeof t.equipped === 'string' && seen[t.equipped]) ? t.equipped : '', by = {};
    const sb = (t.equippedByTarget && typeof t.equippedByTarget === 'object' && !Array.isArray(t.equippedByTarget)) ? t.equippedByTarget : {};
    Object.keys(sb).forEach(k=>{ if(/^[a-z]{1,24}$/.test(k) && typeof sb[k] === 'string' && seen[sb[k]]) by[k] = sb[k]; });
    ['planning', 'operations', 'teacher'].forEach(k=>{ if(typeof by[k] !== 'string') by[k] = ''; });
    by.planning = eq;
    return { owned:owned, equipped:eq, equippedByTarget:by };
  }catch(e){ return { owned:[], equipped:'', equippedByTarget:{ planning:'', operations:'', teacher:'' } }; }""")

# 4) غرفتا العمليات والأستاذ: تطبيق ثيم الغرفة مع كل رسم (الإقلاع، فتح الغرفة، الرجوع، بعد المزامنة). التخطيط: renderPlanningPage (V56) يطبّق الكل
rep("""function renderTasksPage(selectDay){
  const week = currentWeek();""", """function renderTasksPage(selectDay){
  try{ codisPlanThemeApply('operations'); }catch(e){ console.error('CODIS room theme:', e); }   /* CODIS-V57 */
  const week = currentWeek();""")
rep("""function renderLearnPage(selectDay){
  const week = learnCurrentWeek();""", """function renderLearnPage(selectDay){
  try{ codisPlanThemeApply('teacher'); }catch(e){ console.error('CODIS room theme:', e); }   /* CODIS-V57 */
  const week = learnCurrentWeek();""")

# 5) نص «بحوزتك» الفارغ
rep("""مظاهر البطاقات وثيمات غرفة التخطيط تشتريها بالفضة""", """مظاهر البطاقات وثيمات الغرف تشتريها بالفضة""")

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v57 applied')
