"""CODIS-V73 (3.60.0) — منظومة الشخصية الاحترافية: تحل محل V72 (الواجهة + المحرك + الأصل).
   • الحزمة #codis-b3d-src ← tools/box3d/dist/b3d.min.js (عارض char v3: تقسيم Catmull–Clark، جلد بتشتت مُدمج، شعر/لحية/حواجب خصلاً،
     ملابس مولّدة من سطح الجسم، ظلال استوديو، رمش، حاوية CDC3 مضغوطة gzip مع فك ذاتي احتياطي).
   • الواجهة/البيانات ← tools/identity/v73_char.js (+ وجوه tools/char3d/v73/faces.json) والأنماط ← tools/identity/v73.css.
   • الأصل: assets/char/codis_char_v73.bin (يُبنى بـ tools/char3d/v73/build.py) — ملف مستقل يُحمَّل عند فتح الشخصية فقط ويُخزَّن بالـSW.
   • codisCharNorm: يقبل advb (التخصيص الدقيق للجسم) حتى 800 حرف مثل adv — بقية القواعد كما هي (معرّفات فقط، لا ترمي).
   فوق ناتج سلسلة v54…v72 قبل boot_split (backups/before_v73/CODIS_FINAL_pre_split_v72.html).
   py -3 tools/patch_v73.py <in> <out>   (sh tools/rebuild_v73.sh)"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V73' not in s and 'CODIS-V72' in s, 'needs v72 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t

# 1) الحزمة (عارض v3)
bundle = clean(rd('box3d', 'dist', 'b3d.min.js'), 'bundle')
assert 'version:"3"' in bundle.replace(' ', '') and 'CDC3' in bundle, 'bundle without char v3 — run node tools/box3d/build.mjs'
a = s.index('<script type="text/plain" id="codis-b3d-src">') + len('<script type="text/plain" id="codis-b3d-src">')
b = s.index('</script>', a)
s = s[:a] + bundle + s[b:]

# 2) الواجهة: نص V72 المدرج ⇒ V73
i = s.index('/* ===== CODIS-V72 ===== */\n'); end_mark = 'window.codisCharReset = codisCharReset;\n'; j = s.index(end_mark, i) + len(end_mark)
faces = json.loads(rd('char3d', 'v73', 'faces.json')); faces.pop('_', None)
for sex in faces:
    assert len(faces[sex]) == 16, sex
    for f in faces[sex]: assert abs(sum(f['e']) - 1) < 1e-6, f['id']
glue = clean(rd('identity', 'v73_char.js'), 'glue').replace('__CODIS_CHAR_FACES__', json.dumps(faces, ensure_ascii=False, separators=(',', ':')))
assert glue.endswith(end_mark)
s = s[:i] + '/* ===== CODIS-V72 ===== */\n/* ===== CODIS-V73 ===== */\n' + glue + s[j:]

# 3) الأنماط
k = s.index('<style id="codis-v72-css">\n'); e = s.index('</style>', k)
s = s[:k] + '<style id="codis-v73-css">\n' + clean(rd('identity', 'v73.css'), 'css') + s[e:]

# 4) تعليق الأصل
k = s.index('<!-- CODIS-V72: '); e = s.index('-->', k) + 3
s = s[:k] + '<!-- CODIS-V73: أصول الشخصية = assets/char/codis_char_v73.bin (MakeHuman CC0 1.0 + مولّدات CODIS — tools/char3d/SOURCE_AND_LICENSE.md) -->' + s[e:]

# 5) التطبيع: advb مثل adv
rep("(v.length <= 64 || k === 'adv' && v.length <= 800)", "(v.length <= 64 || (k === 'adv' || k === 'advb') && v.length <= 800)")

open(dst, 'w', encoding='utf-8').write(s)
print('CODIS-V73 ok', len(s) // 1024, 'KB')
