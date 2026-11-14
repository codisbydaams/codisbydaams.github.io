"""CODIS-V51 (3.38.0) — فتح الصناديق ثلاثي الأبعاد بملء الشاشة (عرض فقط): مجسّمات حقيقية بالكود (Three.js مُقلَّم داخل الملف)، مشهد صندوق واحد + مشهد ×10 مستقلان،
  طبقة سينمائية ثابتة فوق كل التطبيق (الواجهة inert أثناءها)، تسليم للواجهة النهائية، وfallback للمشهد القديم إن لم يتوفر WebGL.
  لا يلمس CodisBoxes ولا المحفظة ولا الحفظ ولا الاحتمالات.
  py -3 tools/patch_v51.py backups/before_v51/CODIS_FINAL.html app/CODIS_FINAL.html   (بعد patch_v50؛ ثم set_version.py 3.38.0)
  المصدر: tools/box3d/src/*.js ← `node tools/box3d/build.mjs` ← tools/box3d/dist/b3d.min.js (يُدفن نصاً خاملاً #codis-b3d-src)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V51' not in s and 'codis-v50-css' in s, 'needs v50, not v51'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def once(old, new):
    global s
    assert s.count(old) == 1, ('anchor count', s.count(old), old[:140])
    s = s.replace(old, new)

bundle = rd('box3d', 'dist', 'b3d.min.js').rstrip()
assert '</script' not in bundle.lower() and '<!--' not in bundle, 'bundle must be embeddable'
css = rd('identity', 'v51.css'); assert '</style' not in css and '<!--' not in css
glue = rd('identity', 'v51_glue.js'); assert '</script' not in glue and '<!--' not in glue

# ---- CSS + المحرك (نص خامل) ----
i = s.index('<style id="codis-v50-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v51-css">\n' + css + '</style>\n<script type="text/plain" id="codis-b3d-src">' + bundle + '</script>' + s[j:]

# ---- الجسر قبل CodisBoxCinema ----
once("const CodisBoxCinema = (function(){\n  'use strict';\n", glue.rstrip() + "\n\nconst CodisBoxCinema = (function(){\n  'use strict';\n")

# ---- المشهد القديم: الإلغاء/إعادة التهيئة يوقفان المشهد الجديد أيضاً ----
once("return { play:play, skip:skip, abort:abort, reset:abort,", "return { play:play, skip:skip, abort:()=>{ try{ CodisBox3D.abortSingle(); }catch(e){} abort(); }, reset:()=>{ try{ CodisBox3D.abortSingle(); }catch(e){} abort(); },")

# ---- صندوق واحد: 3D أولاً (حتى مع تقليل الحركة: نسخة مختصرة) ثم القديم ----
once("  let cine = false;\n  if(!econCalm()){ try{ cine = CodisBoxCinema.play({ state:s, tier:CodisBoxes.tier(s.tier), result:r, reveal:reveal }); }catch(e){ cine = false; } }",
     "  let cine = false;\n  try{ cine = CodisBox3D.playSingle({ state:s, tier:CodisBoxes.tier(s.tier), result:r, reveal:reveal }); }catch(e){ cine = false; }   /* CODIS-V51: مشهد 3D بملء الشاشة */\n  if(!cine && !econCalm()){ try{ cine = CodisBoxCinema.play({ state:s, tier:CodisBoxes.tier(s.tier), result:r, reveal:reveal }); }catch(e){ cine = false; } }")

# ---- ×10 ----
once("return { html:html, play:play, stop:stop,", "return { html:html, play:(root, res, plan, onDone)=>{ try{ if(CodisBox3D.playBulk(root, res, plan, onDone)) return true; }catch(e){} return play(root, res, plan, onDone); }, stop:()=>{ try{ CodisBox3D.abortBulk(); }catch(e){} stop(); },")
once("const calm = econCalm(), token = ++econBulkToken; econBulkZoomClose(); CodisBulkCinema.stop();", "const calm = econCalm() && !CodisBox3D.can(), token = ++econBulkToken; econBulkZoomClose(); CodisBulkCinema.stop();   /* V51: مع 3D يعمل ×10 بنسخة مختصرة بدل القفز للنتائج */")
once("s.timer = window.setTimeout(()=>econBulkFinish(token), econBulkSch.total + 4000);", "s.timer = window.setTimeout(()=>econBulkFinish(token), Math.max(econBulkSch.total, CodisBox3D.bulkMs()) + 16000);")
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v51 applied; bundle', len(bundle) // 1024, 'KB')
