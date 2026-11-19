"""CODIS-V72 (3.59.0) — منظومة الشخصية الواقعية (MakeHuman CC0) تحل محل شخصية V71 (Quaternius).
   • الحزمة #codis-b3d-src ← tools/box3d/dist/b3d.min.js (عارض char v2: حاوية CDC2، أهداف أصلية، هيكل مُعاد التركيب، قطع مُركّبة، قشور).
   • الواجهة/البيانات ← tools/identity/v72_char.js (+ وجوه tools/char3d/faces.json) والأنماط ← tools/identity/v72.css.
   • أصول V71 المدفونة (3 GLB base64 ≈ 2.9MB) تُحذف: الأصل الجديد ملف مستقل assets/char/codis_char_v72.bin يُحمَّل عند الحاجة
     ويُخزَّن بالـService Worker («الكاش أولاً» لكل ملف ثابت من الموقع نفسه) ⇒ يعمل بلا اتصال بعد أول فتح؛ CSP: connect-src 'self'.
   • codisCharNorm: يقبل حقل adv (نص التخصيص الدقيق حتى 800 حرف) — بقية القواعد كما هي (معرّفات فقط، لا ترمي).
   فوق ناتج patch_v71 وقبل boot_split.   py -3 tools/patch_v72.py <in> <out>   (sh tools/rebuild_v72.sh)"""
import sys, os, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V72' not in s and 'CODIS-V71' in s, 'needs v71 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t

# 1) الحزمة
bundle = clean(rd('box3d', 'dist', 'b3d.min.js'), 'bundle')
assert 'version:"2"' in bundle.replace(' ', '') and 'CDC2' in bundle, 'bundle without char v2 — run node tools/box3d/build.mjs'
a = s.index('<script type="text/plain" id="codis-b3d-src">') + len('<script type="text/plain" id="codis-b3d-src">')
b = s.index('</script>', a)
s = s[:a] + bundle + s[b:]

# 2) الواجهة: نص V71 المدرج حرفياً ⇒ V72
old_glue = clean(rd('identity', 'v71_char.js'), 'v71 glue')
faces = json.loads(rd('char3d', 'faces.json')); faces.pop('_', None)
for sex in faces:
    for f in faces[sex]:
        assert abs(sum(f['e']) - 1) < 1e-6, f['id']
glue = clean(rd('identity', 'v72_char.js'), 'glue').replace('__CODIS_CHAR_FACES__', json.dumps(faces, ensure_ascii=False, separators=(',', ':')))
rep("/* ===== CODIS-V71 ===== */\n" + old_glue, "/* ===== CODIS-V71 ===== */\n/* ===== CODIS-V72 ===== */\n" + glue)

# 3) الأنماط
old_css = clean(rd('identity', 'v71.css'), 'v71 css')
css = clean(rd('identity', 'v72.css'), 'css')
rep('<style id="codis-v71-css">\n' + old_css + '</style>', '<style id="codis-v72-css">\n' + css + '</style>')

# 4) أصول V71 المدفونة تُحذف (الأصل الجديد ملف مستقل)
m = re.search(r'<!-- CODIS-V71: Quaternius[^\n]*-->\n(<script type="text/plain" id="codis-char-[a-z_]+" data-codis-asset="char3d">[A-Za-z0-9+/=]*</script>\n){3}', s)
assert m, 'v71 blobs'
s = s[:m.start()] + '<!-- CODIS-V72: أصول الشخصية = assets/char/codis_char_v72.bin (MakeHuman CC0 1.0 — tools/char3d/SOURCE_AND_LICENSE.md) -->\n' + s[m.end():]

# 5) التطبيع: حقل adv (التخصيص الدقيق) أطول من 64 حرفاً
rep("if(v === null || typeof v === 'string' && v.length <= 64 || typeof v === 'number' && isFinite(v) || typeof v === 'boolean') o[k] = v;",
    "if(v === null || typeof v === 'string' && (v.length <= 64 || k === 'adv' && v.length <= 800) || typeof v === 'number' && isFinite(v) || typeof v === 'boolean') o[k] = v;   /* CODIS-V72: adv */")
rep("model:id(c.model) || 'ubc-std'", "model:id(c.model) || (Number(c.v) >= 2 ? 'mh-cc0' : 'ubc-std')")

open(dst, 'w', encoding='utf-8').write(s)
print('CODIS-V72 ok', len(s) // 1024, 'KB')
