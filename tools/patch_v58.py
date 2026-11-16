"""CODIS-V58 (3.45.0) — ثيمات الغرف: عائلات بالمتجر و«بحوزتك» + أسطح متعددة لكل غرفة.
  • قسم «الثيمات» (كان «ثيمات الغرف») مجمّع حسب العائلة: CODIS_THEME_FAMILIES (id · name · ar · desc · order) + family بكل منتج؛
    عنوان العائلة ← وصفها ← بطاقاتها (3 أعمدة كما هي)، وفاصل شمبانيا بين العائلات. عائلة جديدة تظهر تلقائياً بترتيبها.
  • ثيم الغرفة يلبّس كل أسطحها (CODIS_THEME_TARGETS[tg].surfaces): التخطيط = مربع الانتظار + بطاقة الخطة النشطة؛
    العمليات = مربع الانتظار + كل مستطيلات المهام (#day-task-list)؛ الأستاذ = مربع المسار + كل المستطيلات التعليمية (#learn-day-task-list).
    لا منتجات/مشتريات جديدة، لا بيانات مستخدم جديدة، لا مساس بمنطق النسبة/الحالات/الوزن/المؤقت/الحذف.
  • الوحدة tools/identity/v58_themes.js تحلّ محل v57_themes.js المضمَّنة، و v58.css تحلّ محل طبقة v57.css.
  py -3 tools/patch_v58.py <ناتج patch_v57 قبل boot_split> <out>   (sh tools/rebuild_v58.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V58' not in s and 'CODIS-V57' in s, 'needs v57 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:160])
    s = s.replace(old, new)
css = rd('identity', 'v58.css'); js = rd('identity', 'v58_themes.js'); js57 = rd('identity', 'v57_themes.js')
assert '</style' not in css and '<!--' not in css and '</script' not in js

# 1) طبقة CSS: v58 تحلّ محل v57 في مكانها نفسه
i = s.index('<style id="codis-v57-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:i] + '<style id="codis-v58-css">\n/* CODIS-V58 (يحلّ محل CODIS-V57) */\n' + css + '</style>' + s[j:]

# 2) الوحدة: v58 تحلّ محل v57 حرفياً
rep("/* CODIS-V57 */\n" + js57.strip() + "\nfunction econOwnTotals(){", "/* CODIS-V58 */\n" + js.strip() + "\nfunction econOwnTotals(){")

# 3) نص «بحوزتك» الفارغ
rep("""مظاهر البطاقات وثيمات الغرف تشتريها بالفضة""", """مظاهر البطاقات والثيمات تشتريها بالفضة""")

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v58 applied')
