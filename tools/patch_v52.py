"""CODIS-V52 (3.39.0) — فتح الصناديق v2 (عرض وصوت فقط): مجسّمات PBR جديدة، مشهدان معاد إخراجهما بمستويات الكشف التسعة،
  طبقة داخل إطار الهاتف، دقة بنسبة بكسل الجهاز + حاكم تكيّفي، هبوط البطاقات بالعنصر المشترك على بطاقات الواجهة الحقيقية،
  وهوية صوتية جديدة chest.* (المفاتيح القديمة box.*/bulk.*/press@box أسماء بديلة لها).
  لا يلمس CodisBoxes ولا المحفظة ولا الحفظ ولا الاحتمالات ولا ترتيب النتائج.
  py -3 tools/patch_v52.py <ناتج patch_v51> app/CODIS_FINAL.html   (sh tools/rebuild_v52.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V52' not in s and 'codis-v51-css' in s, 'needs v51 output, not v52'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def once(old, new):
    global s
    assert s.count(old) == 1, ('anchor count', s.count(old), old[:160])
    s = s.replace(old, new)
for name in ('v52.css', 'v52_glue.js', 'v52_audio.js'):
    t = rd('identity', name); assert '</style' not in t and '</script' not in t.lower() and '<!--' not in t, name

# ---- CSS: يحل محل v51 ----
i = s.index('<style id="codis-v51-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:i] + '<style id="codis-v51-css">\n/* CODIS-V52 */\n' + rd('identity', 'v52.css') + '</style>' + s[j:]

# ---- الجسر ----
once(rd('identity', 'v51_glue.js').rstrip(), rd('identity', 'v52_glue.js').rstrip())

# ---- الصوت: الكتالوج الجديد بعد V2 ----
once("  Object.assign(SOUNDS, V2);\n", "  Object.assign(SOUNDS, V2);\n" + rd('identity', 'v52_audio.js').rstrip() + "\n")

# ---- صندوق واحد: لا أصوات قديمة بالتوازي ----
once("s.phase = 'opening'; s.result = r; codisSfx('press', { ctx:'box' });",
     "s.phase = 'opening'; s.result = r; if(!CodisBox3D.can()) codisSfx('press', { ctx:'box' });   /* CODIS-V52: مع 3D يبدأ المشهد نفسه بـchest.touch */")
once("if(!s.cine) codisSfx('store.buy', { ctx:'box' }); if(r.pass || r.holiday || r.pouch || r.cosmetic) codisSfx('reward.achievement');",
     "if(!s.cine && !s.b3d) codisSfx('chest.reveal', { lv:CodisRevealLevels.levelOfResult(r) });   /* CODIS-V52: صوت الكشف من الهوية الجديدة فقط حين لا مشهد */")
once("const base = 'modal store-detail bx-modal' + (econCalm() ? ' is-calm' : '')", "const base = 'modal store-detail bx-modal' + (s.b3d ? ' is-b3d' : '') + (econCalm() ? ' is-calm' : '')")

# ---- ×10: الشبكة النهائية تحت الطبقة + لا وصول متحرك ولا خاتمة مكررة بعد المشهد ----
once("econBulkPaint(); codisSfx('open', { ctx:'box' });", "econBulkPaint(); if(calm || !CodisBox3D.can()) codisSfx('chest.touch', { bulk:true });   /* CODIS-V52 */")
once("function econBulkCue(s){", "/* CODIS-V52: يرسم شبكة النتائج النهائية (نفس econBulkPaint) تحت مشهد 3D لتُقاس خاناتها، بلا تغيير مرحلة الفتح */\nfunction econBulkPaintFinal(){ const s = econBulkState; if(!s) return; const ph = s.phase; s.phase = 'done'; try{ econBulkPaint(); } finally { s.phase = ph; } s.b3d = true; try{ const m = econBulkModal(); if(m && m.getAnimations) m.getAnimations({ subtree:true }).forEach(a=>{ try{ if(a.effect && a.effect.getTiming && isFinite(a.effect.getTiming().iterations)) a.finish(); }catch(e){} }); }catch(e){} }   /* حركة دخول النافذة (مخفية تحت المشهد) تُنهى فوراً لتُقاس الخانات بمكانها النهائي */\nfunction econBulkCue(s){")
once("if(sheet){ sheet.classList.add('is-arrive');", "if(sheet && !s.b3d){ sheet.classList.add('is-arrive');")
once("\n  econBulkCue(s);\n}", "\n  if(!s.b3d) econBulkCue(s);   /* CODIS-V52: الخاتمة سُمعت داخل المشهد */\n}")

# ---- المشهد 2D الاحتياطي: صوت الهوية الجديدة + دقة أعلى للجسيمات ----
once("cue(now() + delay + 640, ()=>codisSfx('reward.achievement'));", "cue(now() + delay + 640, ()=>codisSfx('chest.rare', { lv:7 }));")
once("dpr = Math.min(window.devicePixelRatio || 1, q > .8 ? 1.75 : 1.25)", "dpr = Math.min(window.devicePixelRatio || 1, q > .8 ? 2.5 : 2)")

# ---- الشراء الذي يفتح فوراً: صوت الهوية الجديدة (chest.buy) فقط حين لا مشهد 3D يبدأ بـchest.touch ----
once("boughtBox = r.box; codisSfx('store.buy', { ctx:'box' });", "boughtBox = r.box; if(!CodisBox3D.can()) codisSfx('store.buy', { ctx:'box' });")
once("if(res.ok){ codisSfx('store.buy', { ctx:'bulk' });", "if(res.ok){ if(!CodisBox3D.can()) codisSfx('store.buy', { ctx:'bulk' });")

once("  econPaintBox(); codisSfx('open', { ctx:'box' });", "  econPaintBox(); if(!(auto && CodisBox3D.can())) codisSfx('open', { ctx:'box' });   /* CODIS-V52: شراء+فتح ⇒ المشهد يبدأ بصوته */")

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v52 applied')
