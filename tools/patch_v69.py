"""CODIS-V69 (3.56.0) — «بدايات الغرف»: أربعة منتجات تجميلية مستقلة (انترو لكل غرفة: التخطيط · العمليات · الأستاذ · التأديب).
   مفتاح بيانات واحد جديد: data.inventory.roomIntros = { owned:[…] } (تطبيع لا يرمي، المعرّفات المجهولة تُحفظ). لا خانة تجهيز: المملوك يعمل تلقائياً.
   الشراء بنفس محفظة الفضة (PURCHASE_COSMETIC، مرجع roomintro|<id>). التشغيل من navigateToPage فقط بعد انتقال حقيقي وبعد الكشف (codisBootState.revealed).
   تبويب ثالث «بدايات الغرف» داخل «المظاهر» (كسول) + قسم داخل «بحوزتك ← المظاهر». فوق ناتج patch_v68 وقبل boot_split.
   py -3 tools/patch_v69.py <ناتج patch_v68> <out>   (sh tools/rebuild_v69.sh)"""
import sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V69' not in s and 'CODIS-V68' in s, 'needs v68 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t

# 1) البيانات: تطبيع الخانة الجديدة (declaration تُستدعى وقت التحميل: لا const ولا رمي، ولا تقرأ تعريفات المنتجات المعرّفة لاحقاً)
rep("function econNormConfirmThemes(inv, iso, now){", """/* CODIS-V69: بدايات الغرف — ملكية مستقلة بلا تجهيز. المعرّفات المجهولة تُحفظ (منتجات مستقبلية)، لا تكرار */
function econNormRoomIntros(inv, iso, now){
  try{
    const t = (inv && inv.roomIntros && typeof inv.roomIntros === 'object' && !Array.isArray(inv.roomIntros)) ? inv.roomIntros : {}, seen = {};
    const owned = (Array.isArray(t.owned) ? t.owned : []).filter(x=>x && typeof x === 'object' && typeof x.id === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(x.id)).filter(x=>{ if(seen[x.id]) return false; seen[x.id] = true; return true; }).map(x=>({
      id:x.id, room:(typeof x.room === 'string' && /^[a-z]{1,20}$/.test(x.room)) ? x.room : '', source:x.source === 'box' ? 'box' : 'store', sourceRef:String(x.sourceRef || '').slice(0, 120),
      acquiredAt:iso(x.acquiredAt) || now, paid:(x.paid === null || x.paid === undefined) ? null : econNum(x.paid, 0, 0, 1e9, true) }));
    return { owned:owned };
  }catch(e){ return { owned:[] }; }
}
function econNormConfirmThemes(inv, iso, now){""")
rep("confirmThemes:econNormConfirmThemes(inv, iso, now) };", "confirmThemes:econNormConfirmThemes(inv, iso, now), roomIntros:econNormRoomIntros(inv, iso, now) };   /* CODIS-V69 */")

# 2) الوحدة + الرسومات: بعد وحدة V67 مباشرة
i = s.index("document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && codisCfEl"); j = s.index('\n', i) + 1
s = s[:j] + "/* ===== CODIS-V69 ===== */\n" + clean(rd('identity', 'v69_intro_art.js'), 'art') + clean(rd('identity', 'v69_intro.js'), 'module') + s[j:]

# 3) التشغيل: نقطة واحدة في navigateToPage بعد اكتمال الانتقال (navEnd + الصوت)
rep("  if(pageChanged) codisSfx('nav', { ctx:page });", "  if(pageChanged) codisSfx('nav', { ctx:page });\n  try{ codisRoomIntroOnNav(page, pageChanged); }catch(e){ console.error('CODIS room intro:', e); }   /* CODIS-V69 */", 1)

# 4) المتجر: تبويب ثالث كسول «بدايات الغرف»
rep("cur = econCosSub === 'themes' ? 'themes' : 'cards';", "nI = CodisRoomIntros.defs().length, cur = (econCosSub === 'themes' || econCosSub === 'intros') ? econCosSub : 'cards';   /* CODIS-V69 */")
rep('<div class="cos-seg" role="tablist"', '<div class="cos-seg is-3" role="tablist"')
rep("tab('cards', 'مظاهر البطاقات', nC) + tab('themes', 'الثيمات', nT) + '</div>' +", "tab('cards', 'مظاهر البطاقات', nC) + tab('themes', 'الثيمات', nT) + tab('intros', 'بدايات الغرف', nI) + '</div>' +")
rep("' hidden data-lazy=\"1\">') + '</div>';   /* CODIS-V64",
    "' hidden data-lazy=\"1\">') + '</div>' +\n    '<div class=\"cos-sub\" role=\"tabpanel\" id=\"cos-sub-intros\" aria-labelledby=\"cos-tab-intros\"' + (cur === 'intros' ? '>' + econRoomIntrosShopHtml() : ' hidden data-lazy=\"1\">') + '</div>';   /* CODIS-V69 */   /* CODIS-V64")
rep("k = k === 'themes' ? 'themes' : 'cards';", "k = (k === 'themes' || k === 'intros') ? k : 'cards';   /* CODIS-V69 */")
rep("  document.querySelectorAll('#pane-cosmetics .cos-seg-b').forEach(b=>{ const on",
    "  if(k === 'intros'){ const ip = document.getElementById('cos-sub-intros'); if(ip && ip.hasAttribute('data-lazy')){ try{ ip.innerHTML = econRoomIntrosShopHtml(); ip.removeAttribute('data-lazy'); }catch(x){ console.error('CODIS intros pane:', x); } } }   /* CODIS-V69 */\n"
    "  document.querySelectorAll('#pane-cosmetics .cos-seg-b').forEach(b=>{ const on")
m = re.search(r"function econCosSubKey\(ev\)\{[^\n]*\n", s); assert m
s = s[:m.start()] + ("function econCosSubKey(ev){ if(['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(ev.key) === -1) return; ev.preventDefault(); const L = ['cards', 'themes', 'intros'], i = Math.max(0, L.indexOf(econCosSub));   /* CODIS-V69: ثلاثة تبويبات؛ يسار = التالي بـRTL */\n"
    "  const k = ev.key === 'Home' ? L[0] : ev.key === 'End' ? L[L.length - 1] : L[(i + (ev.key === 'ArrowLeft' ? 1 : L.length - 1)) % L.length]; econCosSetSub(k, true); }\n") + s[m.end():]

# 5) «بحوزتك ← المظاهر» + العدّاد
rep("html:()=>econCosmeticsInvHtml() + econPlanThemesInvHtml() + econConfirmThemesInvHtml()", "html:()=>econCosmeticsInvHtml() + econPlanThemesInvHtml() + econConfirmThemesInvHtml() + econRoomIntrosInvHtml()")
rep("try{ themes += CodisConfirmThemes.owned().length; }catch(e){}   /* CODIS-V67 */", "try{ themes += CodisConfirmThemes.owned().length; }catch(e){}   /* CODIS-V67 */ try{ themes += CodisRoomIntros.owned().length; }catch(e){}   /* CODIS-V69 */")

# 6) الرجوع/Esc + المعاينة بالضغط المطوّل لا تبدأ من زري البطاقة
rep("  if(codisCfEl) return { act:()=>codisCfClose(), el:codisCfEl };   /* CODIS-V67 */",
    "  if(codisRiLive) return { act:()=>codisRoomIntroStop(false), el:codisRiLive.el };   /* CODIS-V69 */\n  if(codisRiEl) return { act:()=>codisRiClose(), el:codisRiEl };   /* CODIS-V69 */\n"
    "  if(codisCfEl) return { act:()=>codisCfClose(), el:codisCfEl };   /* CODIS-V67 */")
rep("if(e.target.closest('.btn, .chip-act, input, select, textarea, a[href]')) return;", "if(e.target.closest('.btn, .chip-act, .ri-b, input, select, textarea, a[href]')) return;")

# 7) CSS
css = clean(rd('identity', 'v69.css'), 'css')
assert '*/' not in re.sub(r'/\*.*?\*/', '', css, flags=re.S), 'stray comment end in css'
i = s.index('<style id="codis-v68-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v69-css">\n/* CODIS-V69 */\n' + css + '</style>' + s[j:]

assert s.count('const CodisRoomIntros') == 1 and s.count('function codisRoomIntroOnNav(') == 1 and s.count('function econNormRoomIntros(') == 1 and s.count('try{ codisRoomIntroOnNav(page, pageChanged); }') == 1
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v69 applied')
