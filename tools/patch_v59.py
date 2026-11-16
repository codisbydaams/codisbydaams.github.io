"""CODIS-V59 (3.46.0) — عائلة ثيمات FROST CRYSTAL «الجليد الصاقع» فوق نظام V58 نفسه (لا نظام موازٍ):
  • ثلاثة منتجات: frostCrystalPlanning · frostCrystalOperations · frostCrystalTeacher (7,999 فضة لكلٍّ، أسطوري، عائلة frostCrystal order 20).
  • راسم 'frost' بـCODIS_PLAN_THEME_ART + طبقة CSS مقيّدة بـ[data-pt^="frostCrystal"] تُلحق بعد طبقة V58 كما هي (الجحيم لم يُمس).
  • طبقة ثلج CSS (transform فقط، بلا canvas/rAF) بالمربعات وبطاقة الخطة وخلف مستطيلات المهام؛ تتوقف مع تقليل الحركة/الهدوء.
  • لا بيانات مستخدم جديدة: الملكية/الشراء/التجهيز لكل غرفة = نظام V57/V58 (PURCHASE_COSMETIC بمرجع plantheme|<id>).
  الوحدة tools/identity/v59_themes.js تحلّ محل v58_themes.js المضمَّنة حرفياً؛ <style id="codis-v59-css"> = v58.css + v59_frost.css.
  صور الثلج/البلورات SVG تُولَّد هنا حتمياً (بذرة ثابتة، بلا فلاتر SVG) وتُحقن مكان __FX_*__.
  py -3 tools/patch_v59.py <ناتج patch_v58 قبل boot_split> <out>   (sh tools/rebuild_v59.sh)"""
import sys, os, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V59' not in s and 'CODIS-V58' in s, 'needs v58 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:160])
    s = s.replace(old, new)

def uri(svg):
    svg = ' '.join(svg.split())
    return 'url("data:image/svg+xml,' + svg.replace('"', "'").replace('#', '%23').replace('<', '%3C').replace('>', '%3E') + '")'
def f(x): return ('%.2f' % x).rstrip('0').rstrip('.')

rng = random.Random(5901)
def spread(n, w, h, m, minD):
    pts = []
    while len(pts) < n:
        x, y = rng.uniform(m, w - m), rng.uniform(m, h - m)
        if all((x - a) ** 2 + (y - b) ** 2 >= minD ** 2 for a, b in pts): pts.append((x, y))
    return pts
# A: نقاط ثلج دقيقة (320×240) — أبيض بحافة سماوية رفيعة كي يظهر فوق الخلفيات الفاتحة أيضاً
A = []
for x, y in spread(12, 320, 240, 6, 42):
    r = rng.uniform(.8, 1.9); o = rng.uniform(.55, .95)
    A.append('<circle cx="%s" cy="%s" r="%s" fill="#fff" fill-opacity="%s" stroke="#3C8CBE" stroke-opacity=".3" stroke-width=".5"/>' % (f(x), f(y), f(r), f(o)))
SNOW_A = uri('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">' + ''.join(A) + '</svg>')
# B: بلورات سداسية صغيرة + نقاط أكبر (280×240)
def flake(cx, cy, L, rot):
    arms = []
    for k in range(6):
        a = math.radians(rot + 60 * k); ex, ey = cx + L * math.cos(a), cy + L * math.sin(a)
        arms.append('M%s %sL%s %s' % (f(cx), f(cy), f(ex), f(ey)))
        bx, by = cx + .58 * L * math.cos(a), cy + .58 * L * math.sin(a)
        for sgn in (-1, 1):
            b = a + sgn * math.radians(42)
            arms.append('M%s %sL%s %s' % (f(bx), f(by), f(bx + .34 * L * math.cos(b)), f(by + .34 * L * math.sin(b))))
    d = ''.join(arms)
    return ('<path d="%s" stroke="#3C8CBE" stroke-opacity=".32" stroke-width="2.1" stroke-linecap="round" fill="none"/>' % d +
            '<path d="%s" stroke="#fff" stroke-width="1" stroke-linecap="round" fill="none"/>' % d)
B = []
pts = spread(7, 280, 240, 12, 70)
for i, (x, y) in enumerate(pts):
    if i < 4: B.append(flake(x, y, rng.uniform(3.6, 6.2), rng.uniform(0, 60)))
    else: B.append('<circle cx="%s" cy="%s" r="%s" fill="#fff" fill-opacity=".9" stroke="#3C8CBE" stroke-opacity=".3" stroke-width=".6"/>' % (f(x), f(y), f(rng.uniform(1.8, 2.5))))
SNOW_B = uri('<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">' + ''.join(B) + '</svg>')
# بلورة سداسية لزوايا مستطيل العمليات
HEX = uri('<svg xmlns="http://www.w3.org/2000/svg" width="13" height="15" viewBox="0 0 13 15">'
          '<path d="M6.5 .8L12.2 4.1V10.9L6.5 14.2L.8 10.9V4.1Z" fill="#EAF7FF" stroke="#58C5E9" stroke-width=".9"/>'
          '<path d="M6.5 .8L12.2 4.1L6.5 7.5L.8 4.1Z" fill="#fff"/><path d="M6.5 7.5V14.2M6.5 7.5L.8 10.9M6.5 7.5L12.2 10.9" stroke="#8BD8F4" stroke-width=".6"/></svg>')
# شبكة سداسية خافتة تتلاشى (ركن مستطيل العمليات)
hx = []
for row in range(4):
    for col in range(8):
        cx = 7 + col * 12.2 + (6.1 if row % 2 else 0); cy = 7 + row * 10.6
        if cx > 92: continue
        o = max(0, .3 - .075 * row - .025 * col)
        if o <= .02: continue
        p = ' '.join('%s,%s' % (f(cx + 6.6 * math.cos(math.radians(30 + 60 * k))), f(cy + 6.6 * math.sin(math.radians(30 + 60 * k)))) for k in range(6))
        hx.append('<polygon points="%s" fill="none" stroke="#58C5E9" stroke-opacity="%s" stroke-width=".7"/>' % (p, f(o)))
LATTICE = uri('<svg xmlns="http://www.w3.org/2000/svg" width="92" height="54" viewBox="0 0 92 54">' + ''.join(hx) + '</svg>')
# كتاب بلوري صغير (ركن المستطيل التعليمي)
BOOK = uri('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16" viewBox="0 0 22 16">'
           '<path d="M11 3.6Q6 1.2 1.5 2.6V13.6Q6 12.2 11 14.6Q16 12.2 20.5 13.6V2.6Q16 1.2 11 3.6Z" fill="#fff" fill-opacity=".9" stroke="#3FB4E0" stroke-width=".9" stroke-linejoin="round"/>'
           '<path d="M11 3.6V14.6" stroke="#58C5E9" stroke-width=".8"/><path d="M3.6 5.4Q7 4.4 9.4 5.6M3.6 8Q7 7 9.4 8.2M12.6 5.6Q15 4.4 18.4 5.4M12.6 8.2Q15 7 18.4 8" stroke="#8BD8F4" stroke-width=".6" fill="none"/>'
           '<path d="M16.6 .4l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z" fill="#58C5E9"/></svg>')

frost = rd('identity', 'v59_frost.css')
for k, v in (('__FX_SNOW_A__', SNOW_A), ('__FX_SNOW_B__', SNOW_B), ('__FX_HEX__', HEX), ('__FX_LATTICE__', LATTICE), ('__FX_BOOK__', BOOK)):
    assert k in frost, k
    frost = frost.replace(k, v)
assert '__FX_' not in frost
css = rd('identity', 'v58.css') + frost + rd('identity', 'v59_surfaces.css')
# أسطح V59 للثيمين: طبقة الزخارف العامة تشمل مربع الكتابة (.pt-panel)، وقواعد المربع تشمل «كل المهام/العناصر محسومة» داخل القائمتين.
# :is() يأخذ أعلى خصوصية بين عناصره ⇒ الخصوصية والترتيب كما هما لكل سطح قديم.
assert css.count(':is(.pt-box, .pt-card)') > 20
css = css.replace(':is(.pt-box, .pt-card)', ':is(.pt-box, .pt-card, .pt-panel)')
B0 = ':is(#planning-empty, #tasks-empty, #learn-empty, .pt-stage) > .empty-state.pt-box'
assert css.count(B0) >= 8
css = css.replace(B0, ':is(#planning-empty, #tasks-empty, #learn-empty, #day-task-list, #learn-day-task-list, .pt-stage) > .empty-state.pt-box')
js = rd('identity', 'v59_themes.js'); js58 = rd('identity', 'v58_themes.js')
assert '</style' not in css and '<!--' not in css and '</script' not in js

# 1) طبقة CSS: v59 (= v58 + الجليد) تحلّ محل v58 في مكانها نفسه
i = s.index('<style id="codis-v58-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:i] + '<style id="codis-v59-css">\n/* CODIS-V59 (يحلّ محل CODIS-V58: نصّها كما هو + طبقة FROST CRYSTAL) */\n' + css + '</style>' + s[j:]

# 2) الوحدة: v59 تحلّ محل v58 حرفياً
rep("/* CODIS-V58 */\n" + js58.strip() + "\nfunction econOwnTotals(){", "/* CODIS-V59 */\n" + js.strip() + "\nfunction econOwnTotals(){")

# 3) المربعات داخل القائمة تُبنى بعد تطبيق ثيم الغرفة ⇒ تلبس ثيم القائمة بعد اكتمال الرسم (العمليات والأستاذ)
A3 = "  const _userAction = codisJustChangedId !== null;\n  if(codisJustChangedId === null) CodisMotion.enterList(listWrap);"
rep(A3, "  try{ codisThemeInnerApply(listWrap); }catch(e){}   /* CODIS-V59 */\n" + A3, 2)

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v59 applied')
