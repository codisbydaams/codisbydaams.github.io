"""CODIS-V48 (3.35.0) — (1) تصميم بكجات ورقي مستقل (v48.css) والداكن محصور بـ html[data-theme=dark] (v47.css)
  (2) المتجر: قسم واحد ظاهر + شريط أيقونات عمودي (حالة واجهة فقط، لا تُحفظ ولا تمس البيانات).
  py -3 tools/patch_v48.py backups/before_v48/CODIS_FINAL.html app/CODIS_FINAL.html     (يُطبَّق على ناتج patch_v47 المحصور بالداكن؛ ثم set_version.py 3.35.0)"""
import sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V48' not in s and 'codis-v47-css' in s, 'needs v47, not v48'
def rd(p): return open(os.path.join(HERE, 'identity', p), encoding='utf-8').read()
def once(old, new):
    global s
    assert s.count(old) == 1, ('anchor count', s.count(old), old[:140])
    s = s.replace(old, new)

# ---- 1) كتلة v47 تُستبدل بنسختها المحصورة بالداكن ----
css47 = rd('v47.css'); assert 'html[data-theme="dark"]' in css47
i = s.index('<style id="codis-v47-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:i] + '<style id="codis-v47-css">\n' + css47 + '</style>' + s[j:]

# ---- 2) أيقونات القسم ----
ICONS = """  shop_packs: { id:'icon-shop-packs', meaning:'البكجات: صندوق جوائز مغلق', size:'lg',
    body:'<path d="M3.2 6.2A2 2 0 0 1 5.2 4.2h13.6a2 2 0 0 1 2 2V9.4H3.2Z"/><path d="M4.4 9.4h15.2v8.6a2 2 0 0 1-2 2H6.4a2 2 0 0 1-2-2Z"/><path d="M12 9.4v2.2"/><circle cx="12" cy="13.6" r="1.5"/>' },
  shop_skins: { id:'icon-shop-skins', meaning:'المظاهر: تخصيص مظهر البطاقات', size:'lg',
    body:'<path d="M12 3.3c-4.9 0-8.8 3.6-8.8 8.1 0 4.2 3.4 7.6 7.5 7.6h1c1.2 0 1.9-1 1.5-2-.4-.9.1-1.9 1.1-1.9h1.7c2.3 0 3.8-1.5 3.8-3.7 0-4.2-3.9-8.1-8.8-8.1Z"/><circle cx="7.9" cy="11.3" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.6" cy="8.3" r="1"/>' },
  shop_cards: { id:'icon-shop-cards', meaning:'الكروت: بطاقات المكافآت', size:'lg',
    body:'<path d="M8.4 6.4V5.2a2 2 0 0 1 2-2h7.4a2 2 0 0 1 2 2v9.8a2 2 0 0 1-2 2h-1.2"/><rect x="3.6" y="6.4" width="12.4" height="14.4" rx="2.2"/><path d="M9.8 10.2l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L6.9 12.4l2-.3Z"/>' },
"""
once("  menu: { id:'icon-menu'", ICONS + "  menu: { id:'icon-menu'")

# ---- 3) منطق التنقل: قسم نشط واحد بدل التمرير ----
a = s.index('/* شريط أقسام المتجر: انتقال مباشر'); b = s.index('let econLastBal = null, econStoreEnterAt = 0;')
NAV = r"""/* CODIS-V48: شريط أيقونات جانبي — قسم واحد ظاهر. الاختيار حالة واجهة فقط (لا تُحفظ ولا تدخل البيانات)؛ الأقسام غير النشطة تبقى في DOM مخفية (display:none) فتعمل دوال الملاءمة والفتح بالمعرّف */
const ECON_STORE_PARTS = [['eco-boxes', 'البكجات', 'shop_packs', 'boxes'], ['eco-cosmetics', 'المظاهر', 'shop_skins', 'cosmetics'], ['eco-cards', 'الكروت', 'shop_cards', 'cards']];
let econStorePart = 'boxes';
function econStorePartOf(x){ for(let i = 0; i < ECON_STORE_PARTS.length; i++){ if(ECON_STORE_PARTS[i][0] === x || ECON_STORE_PARTS[i][3] === x) return ECON_STORE_PARTS[i]; } return ECON_STORE_PARTS[0]; }
function econStoreNavHtml(){
  const n = { 'eco-boxes':CodisBoxes.tiers().length, 'eco-cosmetics':CodisCosmetics.defs().length, 'eco-cards':econStoreCardRows().length };
  return '<nav class="st-rail" aria-label="أقسام المتجر">' + ECON_STORE_PARTS.map(p=>{ const on = p[3] === econStorePart, c = n[p[0]];
    return '<button type="button" class="st-rail-b' + (on ? ' is-on' : '') + '" data-part="' + p[3] + '" data-to="' + p[0] + '" data-tip="' + p[1] + '" aria-label="' + p[1] + (c ? ' — ' + econFmt(c) : '') + '" aria-controls="' + p[0] + '"' + (on ? ' aria-current="true"' : '') + ' onclick="econStoreSetPart(\'' + p[3] + '\')">' + codisIcon(p[2]) + (c ? '<span class="st-rail-n" aria-hidden="true">' + econFmt(c) + '</span>' : '') + '</button>'; }).join('') + '</nav>';
}
function econStoreScroller(){ return document.querySelector('.main') || document.getElementById('page-settings'); }   /* CODIS-MOBILE: المتجر يتمرر مع .main */
/* يطابق الواجهة مع econStorePart (الرسم الأول وإعادة الفتح والتبديل): خصائص بلا إعادة بناء */
function econStoreNavSync(){
  const box = document.getElementById('eco-store-body'); if(!box) return;
  const cur = econStorePartOf(econStorePart)[3], stage = box.querySelector('.st-stage');
  if(stage && stage.getAttribute('data-part') !== cur) stage.setAttribute('data-part', cur);
  Array.prototype.forEach.call(box.querySelectorAll('.st-rail-b'), b=>{ const on = b.getAttribute('data-part') === cur; if(b.classList.contains('is-on') === on) return; b.classList.toggle('is-on', on); if(on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
}
function econStoreSetPart(part, opts){
  opts = opts || {}; const p = econStorePartOf(part), box = document.getElementById('eco-store-body');
  const same = econStorePart === p[3]; econStorePart = p[3];
  if(!box) return;
  if(same && !opts.force){ if(!opts.quiet) codisSfx('press', { ctx:'tab' }); return; }
  if(!opts.quiet) codisSfx('press', { ctx:'tab' });
  box.classList.remove('is-enter');   /* حركة الدخول الأولى لا تتكرر مع كل تبديل؛ للقسم حركته الخاصة */
  econStoreNavSync();
  const sec = document.getElementById(p[0]), sc = econStoreScroller();
  if(sc && !opts.keepScroll) sc.scrollTop = 0;
  if(sec){
    Array.prototype.forEach.call(sec.querySelectorAll('.fit-wait'), c=>c.classList.remove('fit-wait'));
    try{ codisFitLazy(sec); }catch(x){}   /* القسم كان display:none فلم تُقَس بطاقاته: تُلاءم الآن */
    if(!econCalm()){ sec.classList.remove('is-part-in'); void sec.offsetWidth; sec.classList.add('is-part-in'); }
  }
}
function econStoreJump(id){ econStoreSetPart(econStorePartOf(id)[3]); }   /* توافق: كان تمريراً إلى الموضع */
"""
s = s[:a] + NAV + s[b:]

# ---- 4) الرسم: بنية shell/stage ----
once("    econStoreNavHtml() + (econClosedOpen ? econClosedPanelHtml() : '') + codisFreeBoxStoreHtml() + econBoxesHtml() + econCosmeticsShopHtml() + econShopHtml() + econOwnSheetHtml(), { thumbs:true });",
     "    (econClosedOpen ? econClosedPanelHtml() : '') + '<div class=\"st-shell\">' + econStoreNavHtml() + '<div class=\"st-stage\" id=\"eco-store-stage\" data-part=\"' + econStorePartOf(econStorePart)[3] + '\">' + codisFreeBoxStoreHtml() + econBoxesHtml() + econCosmeticsShopHtml() + econShopHtml() + '</div></div>' + econOwnSheetHtml(), { thumbs:true });   /* CODIS-V48 */")
once("econVaultSync(); econStoreNavBind(); econStoreNavSync();", "econVaultSync(); econStoreNavSync();")
once("function econOpenStore(){ CodisCrumb.mark('store:open');", "function econOpenStore(){ econStorePart = 'boxes'; CodisCrumb.mark('store:open');   /* CODIS-V48: يُفتح المتجر دائماً على البكجات */")
once("function econGoBoxes(){ econCloseOwn(); const el = document.getElementById('eco-boxes'); if(el) el.scrollIntoView({ block:'start', behavior:window.CODIS_REDUCED_MOTION ? 'auto' : 'smooth' }); }",
     "function econGoBoxes(){ econCloseOwn(); econStoreSetPart('boxes', { quiet:true }); }   /* CODIS-V48: يعمل من أي قسم */")

# ---- 5) CSS: حذف شريط الأقسام الأفقي القديم وقواعد content-visibility للأقسام (لم تعد أبناءً مباشرين) من الستايلين، ثم كتلة v48 ----
n0 = len(s)
pat = re.compile(r"/\* — شريط الأقسام: لاصق أعلى المتجر للانتقال السريع — \*/\n\.st-nav\{.*?\.st-nav button:active\{ transform:scale\(var\(--press\)\); \}\n", re.S)
assert len(pat.findall(s)) == 2, len(pat.findall(s))
s = pat.sub('', s)
cv = "#eco-store-body > #eco-cosmetics, #eco-store-body > #eco-cards{ content-visibility:auto; contain-intrinsic-size:auto 1200px; }\n"
assert s.count(cv) == 2, s.count(cv)
s = s.replace(cv, '')
css = rd('v48.css'); assert '</style' not in css and '<!--' not in css
i = s.index('<style id="codis-v47-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v48-css">\n' + css + '</style>' + s[j:]
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v48 applied')
