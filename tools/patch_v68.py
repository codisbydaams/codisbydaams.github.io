"""CODIS-V68 (3.55.0) — (1) النيزك يغطي الغرفة حتى أسفل الشاشة (min-height من حشوتي .main نفسيهما)
   (2) معاينة متعددة المشاهد: «حالات الغرفة» (6 لكل غرفة) لثيمات apply:'room' و«الأسطح» كما كانت للثيمات القديمة، تنقل كامل (أزرار/نقاط/أسهم/سحب)
   (3) CodisThemePreviewFx: تجربة تفاعل النيزك والخشب داخل نافذة التفاصيل (سجل CODIS_THEME_FX) معزولة عن التطبيق
   (4) «؟» لوصف العائلة/المنتج + نظام مسافات موحد. بلا مفتاح بيانات جديد. فوق ناتج patch_v67 وقبل boot_split.
   py -3 tools/patch_v68.py <ناتج patch_v67> <out>   (sh tools/rebuild_v68.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V68' not in s and 'CODIS-V67' in s, 'needs v67 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t
def fn_span(text, name):
    k = text.find('\nfunction ' + name + '(')
    assert k >= 0, ('no function', name)
    k += 1
    assert text.find('\nfunction ' + name + '(', k) < 0, ('duplicate function', name)
    eol = text.find('\n', k); first = text[k:eol]
    if first.rstrip().endswith('}') and first.count('{') == first.count('}'):
        return k, eol + 1
    e = text.find('\n}\n', k); assert e > 0, name
    return k, e + 3

# 1) الدوال التي يحلّ محلها نظام المشاهد تُزال من مكانها (التعريف الجديد داخل الوحدة)
for name in ('codisPlanThemeStageHtml', 'codisPtSlideStep', 'codisPtSlideLab'):
    a, b = fn_span(s, name); s = s[:a] + '/* CODIS-V68: ' + name + ' ⇒ وحدة المشاهد */\n' + s[b:]

# 2) الوحدة بعد وحدة V67
anchor = "document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && codisCfEl && "
i = s.index(anchor); j = s.index('\n', i) + 1
s = s[:j] + '/* ===== CODIS-V68 ===== */\n' + clean(rd('identity', 'v68_scenes.js'), 'module') + s[j:]

# 3) نافذة التفاصيل: دورة حياة التفاعل + الحصر بالأزرار القابلة للتركيز + المربع الكبير بلا inert (المعزول بالوحدة)
rep("document.body.appendChild(el); codisPtPrevEl = el; codisSfx('open', { ctx:'store' });",
    "document.body.appendChild(el); codisPtPrevEl = el; codisSfx('open', { ctx:'store' }); try{ CodisThemePreviewFx.attach(el, d); }catch(e){ console.error('CODIS preview fx:', e); }   /* CODIS-V68 */")
rep("const el = codisPtPrevEl; if(!el) return; codisPtPrevEl = null;", "const el = codisPtPrevEl; if(!el) return; codisPtPrevEl = null; try{ CodisThemePreviewFx.detach(); }catch(e){}   /* CODIS-V68 */")
rep("const f = Array.prototype.filter.call(el.querySelectorAll('button:not([disabled])'), b=>b.offsetParent !== null); if(!f.length) return;",
    "const f = Array.prototype.filter.call(el.querySelectorAll('button:not([disabled]):not([tabindex=\"-1\"])'), b=>b.offsetParent !== null); if(!f.length) return;")
rep("'\" aria-hidden=\"true\" inert>' + codisPlanThemeDecorHtml(d, mini)", "'\" aria-hidden=\"true\"' + (mini ? ' inert' : '') + '>' + codisPlanThemeDecorHtml(d, mini)")

# 4) «؟»: العائلة (بجانب العنوان) والمنتج (زر مستقل داخل البلاطة، ليس داخل زر المعاينة)
rep("'<h5 class=\"pt-fam-ar\" id=\"' + hid + '\">' + escapeHtml(f.ar || f.name) + '</h5>'",
    "'<h5 class=\"pt-fam-ar\" id=\"' + hid + '\"><span>' + escapeHtml(f.ar || f.name) + '</span>' + codisInfoBtnHtml('fam:' + f.id, 'عائلة ' + (f.ar || f.name)) + '</h5>'")
rep("(f.desc && !inInv ? '<p class=\"pt-fam-desc\">' + escapeHtml(f.desc) + '</p>' : '')", "''")
rep("codisPlanThemeStageHtml(d.id, false) + '<span class=\"pt-mname\">' + escapeHtml(R.room) + '</span>' + badge + '</button></div>';",
    "codisPlanThemeStageHtml(d.id, false) + '<span class=\"pt-mname\">' + escapeHtml(R.room) + '</span>' + badge + '</button>' + codisInfoBtnHtml('pt:' + d.id, d.ar + ' · ' + R.room, 'is-tile') + '</div>';")
rep("econCfMiniHtml(d) + '<span class=\"pt-mname\">' + escapeHtml(d.ar) + '<small dir=\"ltr\">' + escapeHtml(d.name) + '</small></span>' + badge + '</button></div>';",
    "econCfMiniHtml(d) + '<span class=\"pt-mname\">' + escapeHtml(d.ar) + '<small dir=\"ltr\">' + escapeHtml(d.name) + '</small></span>' + badge + '</button>' + codisInfoBtnHtml('cf:' + d.id, 'ثيم ' + d.ar, 'is-tile') + '</div>';")
rep("'<h5 class=\"pt-fam-ar\" id=\"cf-h\">ثيمات نوافذ الموافقة</h5><span", "'<h5 class=\"pt-fam-ar\" id=\"cf-h\"><span>ثيمات نوافذ الموافقة</span>' + codisInfoBtnHtml('cfsec:1', 'ثيمات نوافذ الموافقة') + '</h5><span")
# إغلاق «؟» مع أي إعادة رسم للمتجر أو إغلاقه (لا وصف معلّق على زر لم يعد موجوداً)
rep("function econRenderAll(){", "function econRenderAll(){\n  try{ if(codisInfoEl) codisInfoClose(true, true); }catch(e){}   /* CODIS-V68 */")

# 5) CSS
css = clean(rd('identity', 'v68.css'), 'css')
i = s.index('<style id="codis-v67-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v68-css">\n/* CODIS-V68 */\n' + css + '</style>' + s[j:]

assert s.count('function codisPlanThemeStageHtml(') == 1 and s.count('function codisPtSlideStep(') == 1 and s.count('const CodisThemePreviewFx') == 1
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v68 applied')
