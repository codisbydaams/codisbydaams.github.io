"""CODIS-V49 (3.36.0) — (1) متجر بارتفاع ثابت: شريط أيقونات ممتد + مسرح يتمرر وحده بذاكرة موضع لكل قسم
  (2) سجل أقسام مركزي (إضافة قسم = تعريف واحد) (3) يفتح المتجر على الكروت (4) المباعة والمستخدمة ورقة مستقلة مثل «بحوزتك» ببحث ومرشّحات.
  عرض/واجهة فقط. py -3 tools/patch_v49.py backups/before_v49/CODIS_FINAL.html app/CODIS_FINAL.html   (بعد patch_v48؛ ثم set_version.py 3.36.0)"""
import sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V49' not in s and 'codis-v48-css' in s, 'needs v48, not v49'
def rd(p): return open(os.path.join(HERE, 'identity', p), encoding='utf-8').read()
def once(old, new):
    global s
    assert s.count(old) == 1, ('anchor count', s.count(old), old[:140])
    s = s.replace(old, new)

# ---- 1) JS: المباعة والمستخدمة (ورقة) + سجل الأقسام + التنقل وذاكرة التمرير ----
a = s.index('function econClosedPanelHtml(){'); b = s.index('let econLastBal = null, econStoreEnterAt = 0;')
JS = rd('v49_store.js')
s = s[:a] + JS.rstrip() + '\n' + s[b:]

# ---- 2) الرسم ----
pat = re.compile(r'''    \(econClosedOpen \? econClosedPanelHtml\(\) : ''\) \+ '<div class="st-shell">'.*?econOwnSheetHtml\(\), \{ thumbs:true \}\);   /\* CODIS-V48 \*/''', re.S)
assert len(pat.findall(s)) == 1, len(pat.findall(s))
s = pat.sub(lambda m: "    '<div class=\"st-shell\">' + econStoreNavHtml() + econStoreStageHtml() + '</div>' + econOwnSheetHtml() + econClosedSheetHtml(), { thumbs:true });   /* CODIS-V49 */", s)
once("aria-controls=\"eco-closed-panel\" title=\"المباعة والمستخدمة\" onclick=\"econToggleClosed()\"", "aria-controls=\"eco-closed-sheet\" title=\"المباعة والمستخدمة\" onclick=\"econToggleClosed()\"")
once("  const ownKeep = (document.getElementById('eco-own-sheet') || {}).scrollTop || 0;\n",
     "  const ownKeep = (document.getElementById('eco-own-sheet') || {}).scrollTop || 0, closedKeep = (document.getElementById('eco-closed-sheet') || {}).scrollTop || 0;\n  econStoreScrollSave();   /* CODIS-V49 */\n")
once("  if(ownKeep){ const os = document.getElementById('eco-own-sheet'); if(os) os.scrollTop = ownKeep; }\n  if(econDetailId) econPaintDetail();\n}",
     "  if(ownKeep){ const os = document.getElementById('eco-own-sheet'); if(os) os.scrollTop = ownKeep; }\n  econStoreAfterRender(closedKeep);   /* CODIS-V49: ذاكرة التمرير + ورقة المباعة + الشريط */\n  if(econDetailId) econPaintDetail();\n}")
once("econVaultSync(); econStoreNavSync();\n  box._codisSig", "econVaultSync();\n  box._codisSig")

# ---- 3) فتح المتجر على الكروت + إعادة الفتح بلا إعادة رسم ----
once("function econOpenStore(){ econStorePart = 'boxes'; CodisCrumb.mark('store:open');   /* CODIS-V48: يُفتح المتجر دائماً على البكجات */",
     "function econOpenStore(){ econStorePart = econStoreDefaultKey(); econStoreScrollPos = {}; econStoreAnchor = {}; CodisCrumb.mark('store:open');   /* CODIS-V49: يُفتح المتجر دائماً على أول قسم (الكروت) وبمواضع تمرير جديدة */")
once("    try{ econVaultSync(); econStoreNavSync(); }catch(e){}\n    return;",
     "    try{ econVaultSync(); econStoreNavSync(); const st = document.getElementById('eco-store-stage'); if(st) st.scrollTop = 0; econStoreRailFit(); econStoreWarm(); }catch(e){}\n    return;")
once("function econGoBoxes(){ econCloseOwn(); econStoreSetPart('boxes', { quiet:true }); }   /* CODIS-V48: يعمل من أي قسم */", "")

# ---- 4) رجوع/Esc: الورقتان أولاً ----
once("    if(econStoreIsOpen()) return { act:econCloseStore, el:sec || null };",
     "    if(econStoreIsOpen()){ if(econClosedOpen) return { act:econCloseClosed, el:document.getElementById('eco-closed-sheet') }; if(econOwnOpen) return { act:econCloseOwn, el:document.getElementById('eco-own-sheet') }; return { act:econCloseStore, el:sec || null }; }   /* CODIS-V49 */")
once("ev.key === 'Escape' && econStoreSaved && !CodisFinUI.isOpen()", "ev.key === 'Escape' && econStoreSaved && !econClosedOpen && !econOwnOpen && !CodisFinUI.isOpen()")
once("document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && econOwnOpen){",
     "document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && econClosedOpen && !document.querySelector('.modal-overlay[aria-hidden=\"false\"], [role=\"dialog\"][aria-hidden=\"false\"]:not(#eco-closed-sheet)')) econCloseClosed(); });   /* CODIS-V49 */\ndocument.addEventListener('keydown', ev=>{ if(ev.key === 'Escape' && econOwnOpen){")
once("  econOwnOpen = false;\n  if(econDetailId) econCloseDetail();", "  econOwnOpen = false; econClosedOpen = false;\n  if(econDetailId) econCloseDetail();")

# ---- 5) CSS: كتلة v48 المحدَّثة + كتلة v49 ----
i = s.index('<style id="codis-v48-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:i] + '<style id="codis-v48-css">\n' + rd('v48.css') + '</style>' + s[j:]
css = rd('v49.css'); assert '</style' not in css and '<!--' not in css
i = s.index('<style id="codis-v48-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v49-css">\n' + css + '</style>' + s[j:]
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v49 applied')
