"""CODIS-V46 (3.33.0) — Premium Private Banking: هوية بصرية مصرفية للإدارة المالية (عرض فقط، بلا أي منطق مالي).
  py -3 tools/patch_v46.py backups/before_v46/CODIS_FINAL.html app/CODIS_FINAL.html     (بعد patch_v45؛ ثم set_version.py 3.33.0)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V46' not in s and 'CODIS-V45' in s, 'needs v45, not v46'
def rd(p): return open(os.path.join(HERE, 'identity', p), encoding='utf-8').read()
def once(old, new):
    global s
    assert s.count(old) == 1, ('anchor count', s.count(old), old[:140])
    s = s.replace(old, new)
def cut_fn(name):
    global s
    key = 'function ' + name + '('
    assert s.count(key) == 1, (name, s.count(key))
    a = s.index(key); le = s.index('\n', a); first = s[a:le]
    if first.rstrip().endswith('}') and first.count('{') == first.count('}'): e = le + 1
    else: e = s.index('\n}\n', a) + 3
    s = s[:a] + s[e:]

# ---- 1) إزالة الدوال القديمة التي يعاد تعريفها ----
for n in ['finTxRowHtml', 'finRowHtml', 'finMainHtml', 'finDrawerBodyHtml']: cut_fn(n)
once("function finDrawerPaint(){", rd('v46_fin.js').rstrip() + "\n\nfunction finDrawerPaint(){")   # CODIS-V46
once("  box.innerHTML = finMainHtml(f);\n  codisHydrateIcons(box);", "  box.innerHTML = finMainHtml(f);\n  codisHydrateIcons(box); finBalAnim();   /* CODIS-V46 */")

# ---- 2) الأيقونات: لغة بصرية مصرفية موحّدة (شبكة 24، خط موحّد) ----
ICONS = """  contactless: { id:'icon-contactless', meaning:'دفع لاسلكي', size:'lg',
    body:'<path d="M8.4 8.6a5 5 0 0 1 0 6.8"/><path d="M11.8 6a8.6 8.6 0 0 1 0 12"/><path d="M15.2 3.4a12.2 12.2 0 0 1 0 17.2"/>' },
  salary: { id:'icon-salary', meaning:'الراتب', size:'md',
    body:'<rect x="3" y="6.4" width="18" height="11.2" rx="2.4"/><circle cx="12" cy="12" r="2.7"/><path d="M6.6 9.6h.01M17.4 14.4h.01"/>' },
  exchange: { id:'icon-exchange', meaning:'سعر الصرف / تحويل', size:'md',
    body:'<path d="M4 8.2h13.4"/><path d="M13.8 4.6l3.6 3.6-3.6 3.6"/><path d="M20 15.8H6.6"/><path d="M10.2 12.2l-3.6 3.6 3.6 3.6"/>' },
  profile: { id:'icon-profile', meaning:'الملف المالي', size:'md',
    body:'<rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.6"/><circle cx="9" cy="10.8" r="2.1"/><path d="M5.8 16c.6-1.5 1.7-2.1 3.2-2.1s2.6.6 3.2 2.1"/><path d="M14.4 10h3.6M14.4 13.6h2.8"/>' },
  statement: { id:'icon-statement', meaning:'كشف / تقرير مالي', size:'md',
    body:'<path d="M6.6 3.5h10.8A1.6 1.6 0 0 1 19 5.1v14.6l-2.3-1.4-2.2 1.4-2.5-1.4-2.5 1.4-2.2-1.4L5 19.7V5.1a1.6 1.6 0 0 1 1.6-1.6Z"/><path d="M8.6 8.4h6.8M8.6 12h6.8"/>' },
  income: { id:'icon-income', meaning:'دخل', size:'sm',
    body:'<path d="M17 7L7 17"/><path d="M7 9.4V17h7.6"/>' },
  expense: { id:'icon-expense', meaning:'مصروف', size:'sm',
    body:'<path d="M7 17L17 7"/><path d="M9.4 7H17v7.6"/>' },
"""
once("  menu: { id:'icon-menu'", ICONS + "  menu: { id:'icon-menu'")

# ---- 3) النوافذ الداخلية ----
once("CodisFinUI.open({ title:'إيداع', body:", "CodisFinUI.open({ title:'إيداع', cls:'fin-k-in', body:")
once("CodisFinUI.open({ title:'تسجيل مصروف / سحب', body:", "CodisFinUI.open({ title:'تسجيل مصروف / سحب', cls:'fin-k-out', body:")
once("CodisFinUI.open({ title:'سعر صرف الكوينز', body:noteHtml + finRateOptionsHtml(sel) +", "CodisFinUI.open({ title:'سعر صرف الكوينز', body:finRateHeroHtml(f.fx.rate, st) + noteHtml + finRateOptionsHtml(sel) +")
once("sel = Number(b.dataset.r);", "sel = Number(b.dataset.r); finRateHeroSet(root, sel);")
once("""'<div class="fin-note">' + codisIcon('calendar') + '<span>' + (cur ? 'الراتب الحالي <b>' + finFmt(cur.amount) + '</b> د.ع — يوم <b>' + cur.day + '</b> من كل شهر' : 'لا يوجد راتب مضبوط') + (ns ? '<br>الاستحقاق القادم: ' + escapeHtml(finDateAr(ns.due)) : '') + '</span></div>' +""", "finPayCardHtml(cur, ns) +")
once("CodisFinUI.open({ title:'ملفي المالي', body:\n    '", "CodisFinUI.open({ title:'ملفي المالي', body:\n    finProfileCardHtml(f) + '")
once("CodisFinUI.open({ title:'التقارير المالية', cls:'is-wide', body:\n    '", "CodisFinUI.open({ title:'التقارير المالية', cls:'is-wide', body:\n    finReportHeroHtml(f) + '")
once("""box.innerHTML = '<div class="fin-wiz">' + bar""", """box.innerHTML = '<div class="fin-wiz">' + finWizHeadHtml() + bar""")

# ---- 4) CSS (محصور بالإدارة المالية ونوافذها وقائمتها) ----
css = rd('v46.css'); assert '</style' not in css and '<!--' not in css
i = s.index('<style id="codis-v45-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v46-css">\n' + css + '</style>' + s[j:]
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v46 applied')
