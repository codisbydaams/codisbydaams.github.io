"""CODIS-V71 (3.58.0) — الشخصية البشرية ثلاثية الأبعاد: إنشاء بمراحل (الجسم · الوجه · الشعر · اللون · التأكيد) + حفظ بـ data.profile.character
   + صفحة «شخصيتي» بالإعدادات + ربط بعد شاشة «معلوماتك» (مرة واحدة للمستخدم الحالي).
   الأصول: Quaternius «Universal Base Characters [Standard]» (CC0) ← tools/char3d (build_assets.mjs) ← dist/*.glb مدفونة نصاً خاملاً.
   المحرك: tools/box3d/src/char.js داخل حزمة #codis-b3d-src نفسها (Three r170 واحدة) ← node tools/box3d/build.mjs.
   فوق ناتج patch_v70 وقبل boot_split.   py -3 tools/patch_v71.py <in> <out>   (sh tools/rebuild_v71.sh)"""
import sys, os, base64
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V71' not in s and 'CODIS-V70' in s, 'needs v70 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t

# 1) الحزمة: Three r170 + مشاهد الصناديق (بلا تغيير) + عارض الشخصية
bundle = clean(rd('box3d', 'dist', 'b3d.min.js'), 'bundle')
assert 'char:{create' in bundle.replace(' ', ''), 'bundle without char module — run node tools/box3d/build.mjs'
a = s.index('<script type="text/plain" id="codis-b3d-src">') + len('<script type="text/plain" id="codis-b3d-src">')
b = s.index('</script>', a)
s = s[:a] + bundle + s[b:]

# 2) CodisBox3D يعيد استعمال الحزمة إن شغّلتها الشخصية أولاً (لا نسخة ثانية من Three بالذاكرة)
rep("      const el = document.getElementById('codis-b3d-src'); if(!el) throw new Error('nosrc');\n      const s = document.createElement('script'); s.textContent = el.textContent; document.head.appendChild(s); s.remove();",
    "      if(!(window.CodisB3D && typeof window.CodisB3D.playSingle === 'function')){   /* CODIS-V71: الحزمة مشتركة مع عارض الشخصية */\n"
    "      const el = document.getElementById('codis-b3d-src'); if(!el) throw new Error('nosrc');\n      const s = document.createElement('script'); s.textContent = el.textContent; document.head.appendChild(s); s.remove();\n      }")

# 3) البيانات: تطبيع آمن (declaration، لا ترمي، لا تقرأ const)؛ لا تمس الاسم/العمر/الجنس/المدينة/الصورة
rep("  if(!d.profile || typeof d.profile !== 'object' || Array.isArray(d.profile)) d.profile = null;",
    "  if(!d.profile || typeof d.profile !== 'object' || Array.isArray(d.profile)) d.profile = null;\n"
    "  if(d.profile && 'character' in d.profile){ const ch = codisCharNorm(d.profile.character); if(ch) d.profile.character = ch; else delete d.profile.character; }   /* CODIS-V71 */")
rep("\nfunction saveData(){", """
/* CODIS-V71: data.profile.character — معرّفات فقط (لا مجسّمات/صور). المعرّف المجهول يُحفظ كما هو (العارض يرجع للافتراضي) والحقول الإضافية لإصدار أحدث تبقى */
function codisCharNorm(c){
  try{
    if(!c || typeof c !== 'object' || Array.isArray(c)) return null;
    if(c.body !== 'male' && c.body !== 'female') return null;
    const id = v=>(typeof v === 'string' && /^[a-z0-9_-]{1,32}$/.test(v)) ? v : '';
    const t = v=>{ const n = Math.floor(Number(v)); return n > 0 && n < 4e12 ? n : 0; };
    const o = {};
    Object.keys(c).forEach(k=>{ if(/^[A-Za-z0-9_]{1,32}$/.test(k)){ const v = c[k]; if(v === null || typeof v === 'string' && v.length <= 64 || typeof v === 'number' && isFinite(v) || typeof v === 'boolean') o[k] = v; } });
    return Object.assign(o, { v:Math.max(1, Math.floor(Number(c.v)) || 1), body:c.body, face:id(c.face), hair:id(c.hair), color:id(c.color), model:id(c.model) || 'ubc-std', assets:id(c.assets), createdAt:t(c.createdAt), updatedAt:t(c.updatedAt) });
  }catch(e){ return null; }
}
function saveData(){""")

# 4) الإعدادات: مدخل «شخصيتي» + صفحة مستقلة
CHAR_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.6" r="2.6"/><path d="M8.2 9.4h7.6l1.3 6.4h-1.9l-.7 6.4H9.5l-.7-6.4H6.9z"/></svg>'
rep("            <button type=\"button\" class=\"ios-row\" onclick=\"openSettingsCategory('progress')\">",
    "            <button type=\"button\" class=\"ios-row\" onclick=\"openSettingsCategory('character')\">\n"
    "              <span class=\"ios-row-icon tone-aqua\">" + CHAR_ICON + "</span>\n"
    "              <span class=\"ios-row-title\">شخصيتي</span>\n"
    "              <span class=\"ios-row-trailing\"><span class=\"ios-row-badge\" id=\"home-char-state\"></span><svg class=\"ios-chevron\" data-icon=\"forward\"></svg></span>\n"
    "            </button>\n"
    "            <button type=\"button\" class=\"ios-row\" onclick=\"openSettingsCategory('progress')\">")
rep("    <div id=\"settings-page-acct-delete\" class=\"settings-page-section\" style=\"display:none;\">",
    "    <div id=\"settings-page-character\" class=\"settings-page-section\" style=\"display:none;\">\n"
    "      <button type=\"button\" class=\"settings-back-btn\" onclick=\"showSettingsHome()\"><svg class=\"ios-chevron\" data-icon=\"back\"></svg>الإعدادات</button>\n"
    "      <div class=\"settings-section-head\"><div class=\"settings-section-title\">شخصيتي</div></div>\n"
    "      <div id=\"char-root\"></div>\n"
    "    </div>\n"
    "    <div id=\"settings-page-acct-delete\" class=\"settings-page-section\" style=\"display:none;\">")
rep("  if(cat === 'dev' && typeof CodisDev !== 'undefined' && CodisDev) CodisDev.open();",
    "  if(cat === 'dev' && typeof CodisDev !== 'undefined' && CodisDev) CodisDev.open();\n"
    "  if(cat === 'character' && typeof codisCharRenderPage === 'function'){ try{ codisCharRenderPage(); }catch(e){ console.warn('[CODIS char3d]', e && e.message); } }   /* CODIS-V71 */")
rep("  codisRenderSoundSettings();\n  renderNotifSettings();\n}",
    "  codisRenderSoundSettings();\n  renderNotifSettings();\n  try{ if(typeof codisCharHomeBadge === 'function') codisCharHomeBadge(); }catch(e){}   /* CODIS-V71 */\n}")
rep("  if(codisPtPrevEl) return { act:()=>codisPlanThemePreviewClose(), el:codisPtPrevEl };   /* CODIS-V56 */",
    "  if(typeof window.codisCharBack === 'function'){ const cb = window.codisCharBack(); if(cb) return cb; }   /* CODIS-V71: تجربة الشخصية */\n"
    "  if(codisPtPrevEl) return { act:()=>codisPlanThemePreviewClose(), el:codisPtPrevEl };   /* CODIS-V56 */")

# 5) التدفق: «معلوماتك» (حفظ ناجح) ← إنشاء الشخصية؛ المستخدم الحالي بلا شخصية ⇒ مرة واحدة بعد المزامنة
rep("  codisCloseProfile();\n  showToast(p.dataset.edit ?",
    "  codisCloseProfile();\n  if(!p.dataset.edit){ try{ setTimeout(()=>codisCharAfterProfile(false), 320); }catch(e){} }   /* CODIS-V71 */\n  showToast(p.dataset.edit ?")
rep("    if(!S || !S.user || status !== 'synced' || codisProfileDone()) return;   // لا نسأل قبل التأكد من المزامنة: قد تكون معلوماتك محفوظة بالسحابة\n    codisOpenProfile(false);",
    "    if(!S || !S.user || status !== 'synced') return;   // لا نسأل قبل التأكد من المزامنة: قد تكون معلوماتك (وشخصيتك) محفوظة بالسحابة\n"
    "    if(codisProfileDone()){ codisCharAfterProfile(true); return; }   /* CODIS-V71: الشخصية مرة واحدة لمن أكمل معلوماته سابقاً */\n"
    "    codisOpenProfile(false);")

# 6) الوحدة والواجهة (بعد شاشة «معلوماتك»، نفس السكربت)
glue = clean(rd('identity', 'v71_char.js'), 'glue')
rep("window.codisOpenProfile = codisOpenProfile;", "window.codisOpenProfile = codisOpenProfile;\n/* ===== CODIS-V71 ===== */\n" + glue)

# 7) الأنماط
css = clean(rd('identity', 'v71.css'), 'css')
assert '*/' not in css.replace('/*', '\x00').split('\x00', 1)[0] or True
rep('<style id="codis-v70-css">', '<style id="codis-v71-css">\n' + css + '</style>\n<style id="codis-v70-css">')

# 8) الأصول: GLB مدفونة نصاً خاملاً بنهاية الصفحة (لا تؤخر الإقلاع ولا تُفك إلا عند فتح الشخصية)
blobs = ''
for name, f in [('body_male', 'char_male.glb'), ('body_female', 'char_female.glb'), ('hair', 'char_hair.glb')]:
    b64 = base64.b64encode(open(os.path.join(HERE, 'char3d', 'dist', f), 'rb').read()).decode('ascii')
    blobs += '<script type="text/plain" id="codis-char-' + name + '" data-codis-asset="char3d">' + b64 + '</script>\n'
rep('</body>', '<!-- CODIS-V71: Quaternius Universal Base Characters (CC0 1.0) — tools/char3d/source/License_Standard.txt -->\n' + blobs + '</body>')

open(dst, 'w', encoding='utf-8').write(s)
print('CODIS-V71 ok', len(s) // 1024, 'KB')
