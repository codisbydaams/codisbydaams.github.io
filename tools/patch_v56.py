"""CODIS-V56 (3.43.0) — ثيمات غرفة التخطيط (Skins) + الثيم الأول INFERNO CRYSTAL.
  نظام مستقل عن CodisCosmetics: CodisPlanThemes (tools/identity/v56_themes.js) + طبقة CSS عامة بالرموز (tools/identity/v56.css).
  البيانات: حقل جديد data.inventory.planThemes {owned[], equipped:''} يُطبَّع بـeconNormPlanThemes (لا يُحذف أي حقل قديم، لا تغيير
  بمفتاح التخزين ولا بالإصدار المخطط). الشراء بالفضة فقط بمعاملة PURCHASE_COSMETIC موجودة (مرجع plantheme|<id>) داخل CodisWallet.transact.
  المتجر: قسم «المظاهر» بتبويبين (مظاهر البطاقات · ثيمات التخطيط). بحوزتك: قسم «المظاهر» يعرض النوعين. غرفة التخطيط: codisPlanThemeApply.
  py -3 tools/patch_v56.py <ناتج patch_v55 قبل boot_split> <out>   (sh tools/rebuild_v56.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V56' not in s and 'CODIS-V55' in s, 'needs v55 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:160])
    s = s.replace(old, new)
css = rd('identity', 'v56.css'); js = rd('identity', 'v56_themes.js')
assert '</style' not in css and '<!--' not in css and '</script' not in js

# 1) CSS بعد طبقة v55
i = s.index('<style id="codis-v55-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v56-css">\n/* CODIS-V56 */\n' + css + '</style>' + s[j:]

# 2) التطبيع: حقل مستقل للثيمات (دالة declaration، لا تقرأ const، لا ترمي — قاعدة وقت التحميل)
rep("""cosmetics:econNormCosmetics(inv, iso, now) };""", """cosmetics:econNormCosmetics(inv, iso, now), planThemes:econNormPlanThemes(inv, iso, now) };   /* CODIS-V56 */""")
rep("""function econNormCosmetics(inv, iso, now){""", """/* CODIS-V56: ثيمات غرفة التخطيط — مستقلة عن مظاهر البطاقات. المعرّفات المجهولة تُحفظ (ثيمات مستقبلية)، لا تكرار، والمجهّز مملوك فقط أو '' (الأصلي) */
function econNormPlanThemes(inv, iso, now){
  try{
    const t = (inv && inv.planThemes && typeof inv.planThemes === 'object' && !Array.isArray(inv.planThemes)) ? inv.planThemes : {}, seen = {};
    const owned = (Array.isArray(t.owned) ? t.owned : []).filter(x=>x && typeof x === 'object' && typeof x.id === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(x.id)).filter(x=>{ if(seen[x.id]) return false; seen[x.id] = true; return true; }).map(x=>({
      id:x.id, source:x.source === 'box' ? 'box' : 'store', sourceRef:String(x.sourceRef || '').slice(0, 120), acquiredAt:iso(x.acquiredAt) || now, paid:(x.paid === null || x.paid === undefined) ? null : econNum(x.paid, 0, 0, 1e9, true) }));
    return { owned:owned, equipped:(typeof t.equipped === 'string' && seen[t.equipped]) ? t.equipped : '' };
  }catch(e){ return { owned:[], equipped:'' }; }
}
function econNormCosmetics(inv, iso, now){""")

# 3) الوحدة (قبل بناء «بحوزتك» — داخل السكربت الرئيسي قبل codisBoot)
rep("""function econOwnTotals(){""", "/* CODIS-V56 */\n" + js.strip() + "\nfunction econOwnTotals(){")
rep("""const hcDead = Math.min(H.expired().length, 8), cards = items + passes + hc + hcDead;
  return { items:items, passes:passes, hc:hc, hcDead:hcDead, cards:cards, boxes:boxes, pouches:pouches, cosmetics:cosmetics, total:cards + boxes + pouches + cosmetics };""",
"""const hcDead = Math.min(H.expired().length, 8), cards = items + passes + hc + hcDead;
  let themes = 0; try{ themes = CodisPlanThemes.owned().length; }catch(e){}   /* CODIS-V56: ثيمات التخطيط المملوكة (قسم «المظاهر») */
  return { items:items, passes:passes, hc:hc, hcDead:hcDead, cards:cards, boxes:boxes, pouches:pouches, cosmetics:cosmetics, themes:themes, total:cards + boxes + pouches + cosmetics + themes };""")
rep("""econOwnRegister({ key:'cosmetics', name:'المظاهر', icon:'shop_skins', order:30, count:T=>T.cosmetics, html:()=>econCosmeticsInvHtml(), empty:'ما عندك مظاهر حالياً — تشتريها بالفضة من قسم المظاهر بالمتجر.' });""",
    """econOwnRegister({ key:'cosmetics', name:'المظاهر', icon:'shop_skins', order:30, count:T=>T.cosmetics + (T.themes || 0), html:()=>econCosmeticsInvHtml() + econPlanThemesInvHtml(), empty:'ما عندك مظاهر حالياً — مظاهر البطاقات وثيمات غرفة التخطيط تشتريها بالفضة من قسم المظاهر بالمتجر.' });   /* CODIS-V56 */""")

# 4) المتجر: قسم المظاهر بتبويبين
rep("""econStoreRegister({ key:'cosmetics', domId:'eco-cosmetics', name:'المظاهر', icon:'shop_skins', order:30, count:()=>CodisCosmetics.defs().length, html:()=>econCosmeticsShopHtml() });""",
    """econStoreRegister({ key:'cosmetics', domId:'eco-cosmetics', name:'المظاهر', icon:'shop_skins', order:30, count:()=>CodisCosmetics.defs().length + CodisPlanThemes.defs().length, html:()=>econCosmeticsPaneHtml() });   /* CODIS-V56 */""")

# 5) غرفة التخطيط: تطبيق الثيم المجهّز مع كل رسم (الإقلاع، الرجوع للغرفة، بعد المزامنة)
rep("""function renderPlanningPage(){
  const emptyBox = document.getElementById('planning-empty');""", """function renderPlanningPage(){
  try{ codisPlanThemeApply(); }catch(e){ console.error('CODIS plan theme:', e); }   /* CODIS-V56 */
  const emptyBox = document.getElementById('planning-empty');""")

# 6) الرجوع/السحب يغلق نافذة المعاينة أولاً
rep("""  if(CodisUseCine.isOpen()) return { act:CodisUseCine.dismiss, el:CodisUseCine.el() };   /* CODIS-USE-CINE */""",
    """  if(codisPtPrevEl) return { act:()=>codisPlanThemePreviewClose(), el:codisPtPrevEl };   /* CODIS-V56 */
  if(CodisUseCine.isOpen()) return { act:CodisUseCine.dismiss, el:CodisUseCine.el() };   /* CODIS-USE-CINE */""")

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v56 applied')
