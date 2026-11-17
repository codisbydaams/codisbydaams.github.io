"""CODIS-V67 (3.54.0) — ثيمات نوافذ الموافقة: أربعة منتجات تجميلية مستقلة (الترابي · المائي · الناري · الرياحي)، ليست عائلة ولا ثيمات غرف.
   مفتاح بيانات واحد جديد: data.inventory.confirmThemes = { owned:[…], equipped:'' } (تطبيع لا يرمي، المعرّفات المجهولة تُحفظ).
   الشراء بنفس محفظة الفضة (PURCHASE_COSMETIC، مرجع confirmtheme|<id>)، التجهيز من «بحوزتك» بخانة واحدة،
   والتطبيق = codisConfirm يضع data-cfx على #codis-confirm-modal فقط (opts.notice ⇒ المظهر الأصلي). فوق ناتج patch_v66 وقبل boot_split.
   py -3 tools/patch_v67.py <ناتج patch_v66> <out>   (sh tools/rebuild_v67.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V67' not in s and 'CODIS-V66' in s, 'needs v66 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t

# 1) البيانات: تطبيع الخانة الجديدة (declaration تُستدعى وقت التحميل: لا const ولا رمي)
rep("function econNormCosmetics(inv, iso, now){", """/* CODIS-V67: ثيمات نوافذ الموافقة — ملكية مستقلة + خانة تجهيز واحدة ('' = الأصلي). المعرّفات المجهولة تُحفظ، لا تكرار، والمجهّز مملوك فقط */
function econNormConfirmThemes(inv, iso, now){
  try{
    const t = (inv && inv.confirmThemes && typeof inv.confirmThemes === 'object' && !Array.isArray(inv.confirmThemes)) ? inv.confirmThemes : {}, seen = {};
    const owned = (Array.isArray(t.owned) ? t.owned : []).filter(x=>x && typeof x === 'object' && typeof x.id === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(x.id)).filter(x=>{ if(seen[x.id]) return false; seen[x.id] = true; return true; }).map(x=>({
      id:x.id, source:x.source === 'box' ? 'box' : 'store', sourceRef:String(x.sourceRef || '').slice(0, 120), acquiredAt:iso(x.acquiredAt) || now, paid:(x.paid === null || x.paid === undefined) ? null : econNum(x.paid, 0, 0, 1e9, true) }));
    return { owned:owned, equipped:(typeof t.equipped === 'string' && seen[t.equipped]) ? t.equipped : '' };
  }catch(e){ return { owned:[], equipped:'' }; }
}
function econNormCosmetics(inv, iso, now){""")
rep("planThemes:econNormPlanThemes(inv, iso, now) };", "planThemes:econNormPlanThemes(inv, iso, now), confirmThemes:econNormConfirmThemes(inv, iso, now) };   /* CODIS-V67 */")

# 2) الوحدة: بعد نافذة تفاصيل ثيمات الغرف
anchor = "document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && codisPtPrevEl){ ev.stopPropagation(); codisPlanThemePreviewClose(); } }, true);\n"
rep(anchor, anchor + "/* ===== CODIS-V67 ===== */\n" + clean(rd('identity', 'v67_confirm.js'), 'module'))

# 3) المتجر: قسم «ثيمات نوافذ الموافقة» بعد عائلات الغرف داخل تبويب «الثيمات» + الأعداد
rep("codisThemeFamilies().map(g=>econThemeFamilyHtml(g, 'pt-fam-', false)).join('') + '</div></section>';",
    "codisThemeFamilies().map(g=>econThemeFamilyHtml(g, 'pt-fam-', false)).join('') + econConfirmThemesShopHtml() + '</div></section>';   /* CODIS-V67 */")
rep("nT = CodisPlanThemes.defs().length", "nT = CodisPlanThemes.defs().length + CodisConfirmThemes.defs().length")
rep("CodisCosmetics.defs().length + CodisPlanThemes.defs().length, html:()=>econCosmeticsPaneHtml()",
    "CodisCosmetics.defs().length + CodisPlanThemes.defs().length + CodisConfirmThemes.defs().length, html:()=>econCosmeticsPaneHtml()")
rep("html:()=>econCosmeticsInvHtml() + econPlanThemesInvHtml()", "html:()=>econCosmeticsInvHtml() + econPlanThemesInvHtml() + econConfirmThemesInvHtml()")
rep("let themes = 0; try{ themes = CodisPlanThemes.owned().length; }catch(e){}", "let themes = 0; try{ themes = CodisPlanThemes.owned().length; }catch(e){} try{ themes += CodisConfirmThemes.owned().length; }catch(e){}   /* CODIS-V67 */")
rep("  if(codisPtPrevEl) return { act:()=>codisPlanThemePreviewClose(), el:codisPtPrevEl };   /* CODIS-V56 */",
    "  if(codisPtPrevEl) return { act:()=>codisPlanThemePreviewClose(), el:codisPtPrevEl };   /* CODIS-V56 */\n  if(codisCfEl) return { act:()=>codisCfClose(), el:codisCfEl };   /* CODIS-V67 */")

# 4) نافذة الموافقة: الثيم المجهّز يُعلَّم عند كل فتح؛ الإشعار المعلوماتي الوحيد (تعويض المحطات) يبقى بالأصل
rep("const danger = opts.danger !== false;", "const danger = opts.danger !== false;\n    try{ codisConfirmThemeMark(modal, opts); }catch(e){ modal.removeAttribute('data-cfx'); }   /* CODIS-V67 */")
rep("icon:'info', danger:false, confirmText:'تمام' })", "icon:'info', danger:false, confirmText:'تمام', notice:true })")

# 5) CSS
CF = ':is(#codis-confirm-modal, .cfx-pv):is(#cfx-k, [data-cfx])'
css = clean(rd('identity', 'v67.css'), 'css').replace('@CF', CF)
assert '@CF' not in css
i = s.index('<style id="codis-v66-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v67-css">\n/* CODIS-V67 */\n' + css + '</style>' + s[j:]

assert s.count('const CodisConfirmThemes') == 1 and s.count('function codisConfirmThemeMark(') == 1 and s.count('function econNormConfirmThemes(') == 1
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v67 applied')
