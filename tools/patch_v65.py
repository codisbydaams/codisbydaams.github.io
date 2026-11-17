"""CODIS-V65 (3.52.0) — (أ) رسمة الصندوق المغلق المملوك (econOwnedBoxArt) بنظام إحداثيات SVG واحد: نفس التكوين والنسب بأي حجم،
   بلا تسرّب قواعد .bxa/.bx-card من المتجر إلى المصغّرة. (ب) إعادة تصميم «مكافآت التقدم» (عرض فقط: الملخص + البطاقات + الشبكة المتجاوبة).
   لا يمسّ CODIS_PROGRESS / METRICS / GRANT / CodisProgress / الاستلام / المحفظة / الصناديق / البيانات.
   فوق ناتج patch_v64 وقبل boot_split.   py -3 tools/patch_v65.py <ناتج patch_v64> <out>   (sh tools/rebuild_v65.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V65' not in s and 'CODIS-V64' in s, 'needs v64 output (before boot_split)'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:200])
    s = s.replace(old, new)
def cut(start, end, new, keep_end=False):
    """يستبدل المقطع من start حتى end (end مشمول ما لم keep_end)؛ كلاهما مرة واحدة"""
    global s
    assert s.count(start) == 1, ('start', s.count(start), start[:120])
    i = s.index(start); j = s.index(end, i); assert s.count(end) >= 1
    j = j if keep_end else j + len(end)
    s = s[:i] + new + s[j:]
def clean(t, what):
    assert '</script' not in t and '<!--' not in t and '</style' not in t, what
    return t

# ===================== (أ) الرسمة: الدالة نفسها في مكانها =====================
ui = clean(rd('identity', 'v65_ui.js'), 'ui')
cut('/* ---------- (1) رسمة الصندوق المغلق المملوك ---------- */\nfunction econOwnedBoxArt(tier, o){', "<span class=\"obx-lv\">' + lv + '</span></span>') + '</span>';\n}\n",
    '/* ===== CODIS-V65 ===== */\n' + ui)
assert s.count('function econOwnedBoxArt(') == 1 and s.count('function econObxDefs(') == 1

# CSS القديم للرسمة (v63 §2) والمقاسات الثابتة بالبكسل (v63 §4/§5) ⇒ تُحذف من مصدرها؛ البديل الوحيد في v65.css
cut('/* ---- (2) الصندوق المغلق المملوك = هوية القسيمة السابقة', '.obx-art.is-mini .bxa{ filter:none; }\n',
    '/* ---- (2) الصندوق المغلق المملوك: انتقل إلى طبقة CODIS-V65 (نظام إحداثيات واحد) ---- */\n')
rep('#eco-store-body .bx-buys .bx-buy-v .obx-art.is-mini{ width:24px; height:15px; }\n', '')
rep('.bxc-v .obx-art.is-mini{ width:34px; height:21px; }\n', '')
cut('/* ---- (5) مكافآت التقدم: القسيمة والصندوق بنفس شكل الجواهر', '#progress-root .pg-fly-i .vch-art.is-mini, #progress-root .pg-fly-i .obx-art.is-mini{ width:35px; height:22px; }\n', '')
assert '.obx-art' not in s[s.index('<style id="codis-v63-css">'):s.index('<style id="codis-v64-css">')].replace('/* ---- (2) الصندوق المغلق المملوك: انتقل', '')

# ===================== (ب) مكافآت التقدم: CSS القديم (v61 §4 و§6) يُحذف من مصدره =====================
cut('/* ---------- (4) مكافآت التقدم ---------- */\n', '#progress-root .pg-rw .eco-gem-ico{ width:18px; height:18px; }\n',
    '/* ---------- (4) مكافآت التقدم: انتقلت إلى طبقة CODIS-V65 ---------- */\n')
cut('/* ---------- (6) مكافآت التقدم: جاهزة للاستلام · الاستلام · تم الاستلام ---------- */\n', '#home-progress-state.is-ready{', '', keep_end=True)
assert 'pgReadyIn' not in s and '.pg-card' not in s.split('<script')[0].split('<style id="codis-v64-css">')[0].replace('pg-card[data-ach', ''), 'old progress CSS left'

# الملخص: الأرقام أولاً (مستلمة X / Y · جاهزة N) + الشرح كما هو؛ النص الكامل لقارئات الشاشة بـaria-label
rep("""  root.innerHTML = '<div class="pg-sum' + (nR ? ' has-ready' : '') + '" role="status"><span class="pg-sum-ico" aria-hidden="true">' + codisIcon('trophy') + '</span><span><b>' + econFmt(nC) + ' من ' + econFmt(L.length) + '</b> مكافآت مستلمة' + (nR ? '، <b class="pg-sum-r">' + econFmt(nR) + ' جاهزة للاستلام</b>' : '') + '</span>' +
""", """  root.innerHTML = '<div class="pg-sum' + (nR ? ' has-ready' : '') + '" role="status" aria-label="' + escapeHtml(econFmt(nC) + ' من ' + econFmt(L.length) + ' مكافآت مستلمة' + (nR ? '، ' + econFmt(nR) + ' جاهزة للاستلام' : '')) + '"><span class="pg-sum-ico" aria-hidden="true">' + codisIcon('trophy') + '</span>' +   /* CODIS-V65 */
    '<span class="pg-sum-st" aria-hidden="true"><b dir="ltr">' + econFmt(nC) + '<small> / ' + econFmt(L.length) + '</small></b><span>مكافآت مستلمة</span></span>' +
    '<span class="pg-sum-st' + (nR ? '' : ' is-zero') + '" aria-hidden="true"><b class="pg-sum-r">' + econFmt(nR) + '</b><span>جاهزة للاستلام</span></span>' +
""")

# ===================== CSS =====================
css = clean(rd('identity', 'v65.css'), 'css')
i = s.index('<style id="codis-v64-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v65-css">\n/* CODIS-V65 */\n' + css + '</style>' + s[j:]

# حراس: تعريف واحد لكل حركة وقاعدة جذر
for k in ('@keyframes pgReadyIn', '@keyframes pgFly', '@keyframes pgStampIn', '#progress-root{ --pg-in:40px', '#progress-root{ display', '.obx-art{ '):
    assert s.count(k) == (0 if k == '#progress-root{ display' else 1), (k, s.count(k))
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v65 applied')
