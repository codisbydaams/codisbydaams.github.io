"""CODIS-V64 (3.51.0) — ثيم «الخشب المعتّق» (agedWood) لنظام ثيمات الغرف الحالي: عائلة + 3 منتجات (التخطيط/العمليات/الأستاذ، 7,999 فضة، أسطوري)
   + راسم SVG + طبقة CSS + تفاعل Pointer Events (ماوس/لمس/قلم) + هوية صوتية خشبية بسياق agedWood داخل CodisAudio نفسه، محصورة بالأسطح الملبّسة.
   فوق ناتج patch_v63 وقبل boot_split.   py -3 tools/patch_v64.py <ناتج patch_v63> <out>   (sh tools/rebuild_v64.sh)"""
import sys, os, math, random, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V64' not in s and 'CODIS-V63' in s, 'needs v63 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t

# ===================== 1) العائلة =====================
rep("""تساقط ثلجي هادئ يمنح غرفتك إحساساً بالنقاء والفخامة.' }
];""", """تساقط ثلجي هادئ يمنح غرفتك إحساساً بالنقاء والفخامة.' },
  /* CODIS-V64 */
  { id:'agedWood', name:'Aged Wood', ar:'الخشب المعتّق', order:30,
    desc:'عالم من الحرفية الخشبية العتيقة، تتلاقى فيه عروق خشب الجوز الداكن والبلوط المدخّن مع طبقات الطلاء المعتّق المصقول يدوياً. تحيط بالأسطح حواف محفورة بزخارف كلاسيكية دقيقة، وتطعيمات من النحاس المعتّق والبرونز الداكن، مع مسامير معدنية صغيرة وملامح خشبية تحمل أثر الزمن دون أن تفقد أناقتها. ينساب فوق الخشب ضوء كهرماني دافئ يكشف تفاصيل العروق والنقوش، ليمنح كل مساحة إحساس مكتب أثري فاخر صُنع على يد حرفي محترف قبل عقود طويلة.' }
];""")

# ===================== 2) المنتجات الثلاثة (نفس بنية التعريفات؛ sound = سياق الهوية الصوتية) =====================
defs = clean(rd('identity', 'v64_defs.js'), 'defs')
rep("  return [\n    Object.assign({}, base, { id:'infernoCrystal', target:'planning'", defs + "  return [\n    Object.assign({}, base, { id:'infernoCrystal', target:'planning'")
rep("].concat(frostDefs);", "].concat(frostDefs, woodDefs);   /* CODIS-V64 */")

# ===================== 3) الراسم داخل CODIS_PLAN_THEME_ART =====================
art = clean(rd('identity', 'v64_art.js'), 'art')
rep("""<span class="pt-sheen"></span></div>');
  }
};""", """<span class="pt-sheen"></span></div>');
  },
""" + art + """};""")

# ===================== 4) الإزالة تزيل طبقة التفاعل أيضاً (لا طبقات معلّقة بعد إزالة الثيم) =====================
rep("const dc = el.querySelector(':scope > .pt-decor'); if(dc) dc.remove();",
    "const dc = el.querySelector(':scope > .pt-decor'); if(dc) dc.remove();\n  el.classList.remove('aw-lit', 'aw-touch'); el.querySelectorAll('.aw-fx').forEach(x=>x.remove());   /* CODIS-V64 */")

# ===================== 5) التفاعل + تحديد النطاق الصوتي =====================
touch = clean(rd('identity', 'v64_touch.js'), 'touch')
anchor = "document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && codisPtPrevEl){ ev.stopPropagation(); codisPlanThemePreviewClose(); } }, true);\n"
rep(anchor, anchor + "/* ===== CODIS-V64 ===== */\n" + touch)

# ===================== 6) الصوت: سجل agedWood + نطاق صوتي للنقرة داخل CodisAudio نفسه =====================
snd = clean(rd('identity', 'v64_sounds.js'), 'sounds')
rep("Object.assign(SOUNDS, V2);", "Object.assign(SOUNDS, V2);\n" + snd)
rep("  function play(name, opts){\n    try{\n      opts = opts || {};",
    "  /* CODIS-V64: نطاق صوتي للنقرة الجارية فقط (سطح ملبّس بثيم له هوية صوتية): 'اسم@النطاق' إن وُجد يغلب سياق الاستدعاء؛ لا وجود ⇒ الصوت الأصلي حرفياً */\n"
    "  let soundScope = null;\n  function play(name, opts){\n    try{\n      opts = opts || {};")
rep("      const key = (opts.ctx && SOUNDS[name + '@' + opts.ctx]) ? name + '@' + opts.ctx : name, def = SOUNDS[key];   /* CODIS-AUDIO-V2: هوية حسب السياق */",
    "      const key = (soundScope && SOUNDS[name + '@' + soundScope]) ? name + '@' + soundScope : (opts.ctx && SOUNDS[name + '@' + opts.ctx]) ? name + '@' + opts.ctx : name, def = SOUNDS[key];   /* CODIS-AUDIO-V2: هوية حسب السياق · CODIS-V64: + نطاق السطح */")
rep("    play, preview, xpBegin, beginClick, endClick, applySettings,",
    "    setScope(x){ soundScope = (typeof x === 'string' && x) ? x : null; }, scope:()=>soundScope,   /* CODIS-V64 */\n    play, preview, xpBegin, beginClick, endClick, applySettings,")
# التصنيف بمرحلة capture (قبل أي تغيير DOM): النطاق من العنصر المضغوط نفسه؛ يُصفَّر بعد إصدار الصوت العام وبعد انتهاء الإرسال مهما حدث (stopPropagation)
rep("document.addEventListener('click', e=>{ pendingKind = codisClassifyClick(e.target); try{ CodisAudio.beginClick(); }catch(err){} }, true);",
    "document.addEventListener('click', e=>{ pendingKind = codisClassifyClick(e.target); try{ const sc = codisSoundScopeOf(e.target); CodisAudio.setScope(sc); if(sc) setTimeout(()=>{ try{ CodisAudio.setScope(null); }catch(x){} }, 0); }catch(err){} try{ CodisAudio.beginClick(); }catch(err){} }, true);   /* CODIS-V64: نطاق صوتي */")
rep("document.addEventListener('click', ()=>{ const k = pendingKind; pendingKind = null; try{ CodisAudio.endClick(k); }catch(err){} });",
    "document.addEventListener('click', ()=>{ const k = pendingKind; pendingKind = null; try{ CodisAudio.endClick(k); }catch(err){} try{ CodisAudio.setScope(null); }catch(err){} });")
# البديل الصامت (محرك صوت معطّل): نفس الواجهة
if "return { play:no, preview:no, xpBegin:()=>null," in s:
    rep("return { play:no, preview:no, xpBegin:()=>null,", "return { setScope(){}, scope:()=>null, play:no, preview:no, xpBegin:()=>null,")

# ===================== 6b) أداء المتجر: تبويب «الثيمات» داخل «المظاهر» يُبنى عند أول فتح (مخفي افتراضياً) =====================
# كل بطاقات الثيمات (~1000 عقدة بثلاث عائلات) كانت تُبنى ضمن المتجر وهي مخفية ⇒ ميزانية العقد (حارس الأداء ≤3200). نفس نمط «العناصر» الكسول (V61).
rep("""(cur === 'themes' ? '' : ' hidden') + '>' + econPlanThemesShopHtml() + '</div>';""",
    """(cur === 'themes' ? '>' + econPlanThemesShopHtml() : ' hidden data-lazy="1">') + '</div>';   /* CODIS-V64: كسول حتى أول فتح */""")
rep("""  econCosSub = k;
  document.querySelectorAll('#pane-cosmetics .cos-seg-b')""", """  econCosSub = k;
  if(k === 'themes'){ const tp = document.getElementById('cos-sub-themes'); if(tp && tp.hasAttribute('data-lazy')){ try{ tp.innerHTML = econPlanThemesShopHtml(); tp.removeAttribute('data-lazy'); }catch(x){ console.error('CODIS themes pane:', x); } } }   /* CODIS-V64 */
  document.querySelectorAll('#pane-cosmetics .cos-seg-b')""")

# ===================== 7) CSS + عروق مستطيلات المهام (SVG بلا فلاتر، بلاطة 240×120 تتكرر بلا فاصل) =====================
def grain_tile():
    rng = random.Random(6401); W, H = 240, 120; out = []
    for i in range(22):
        y0 = (i + .5) * H / 22 + (rng.random() - .5) * 4
        a, k, ph = 1 + rng.random() * 3.2, rng.choice([1, 2]), rng.random() * 6.283
        a2, k2, ph2 = rng.random() * 1.6, rng.choice([3, 4, 5]), rng.random() * 6.283
        dark = rng.random() < .6
        w = (.5 + rng.random() * 1.2) if dark else (.4 + rng.random() * .8)
        op = (.22 + rng.random() * .3) if dark else (.05 + rng.random() * .09)
        col = '%23120904' if dark else '%23D9A36A'
        for off in (-H, 0, H):
            if off and not (y0 < 10 and off == H or y0 > H - 10 and off == -H): continue
            pts = []
            for j in range(25):
                x = W * j / 24
                y = y0 + off + a * math.sin(2 * math.pi * k * x / W + ph) + a2 * math.sin(2 * math.pi * k2 * x / W + ph2)
                pts.append(('M' if j == 0 else 'L') + ('%g' % round(x, 1)) + ' ' + ('%g' % round(y, 1)))
            out.append("<path d='" + ''.join(pts) + "' stroke='" + col + "' stroke-opacity='" + ('%.2f' % op) + "' stroke-width='" + ('%.2f' % w) + "'/>")
    svg = "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='120' viewBox='0 0 240 120'><g fill='none' stroke-linecap='round'>" + ''.join(out) + "</g></svg>"
    enc = svg.replace('<', '%3C').replace('>', '%3E').replace('"', "'")
    assert 'filter' not in svg and '"' not in enc
    return 'url("data:image/svg+xml,' + enc + '")'
css = clean(rd('identity', 'v64.css'), 'css')
css = css.replace('__AW_GRAIN__', grain_tile()); assert '__AW_' not in css
i = s.index('<style id="codis-v63-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v64-css">\n/* CODIS-V64 */\n' + css + '</style>' + s[j:]

# حراس: مرة واحدة لكل تعريف، ولا AudioContext جديد
assert s.count("agedWood:function(d, u, mini){") == 1 and s.count('const CodisWoodTouch') == 1 and s.count('function codisSoundScopeOf(') == 1
assert s.count("'press@agedWood'") == 1
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v64 applied')
