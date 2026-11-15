"""CODIS-V53 (3.40.0) — مراجعة نظام الصناديق (عرض/تخطيط فقط؛ لا يمسّ CodisBoxes ولا المحفظة ولا الاحتمالات ولا الأسعار ولا الحفظ).
  1) تباين نتيجة الصندوق على مسرح الطقس الداكن في المظهر الورقي (رموز النص تُعاد على الورقة نفسها).
  2) نافذة ×10: عمود مرن محدود بارتفاع النافذة الفعلي + تخطيط الارتفاع القصير (أفقي) — التخطي/الإنهاء داخل النافذة دائماً.
  3) الطقس 2D لصندوق واحد: لا تداخل البطاقة مع العنوان، والمجسّم محدود بارتفاع المسرح؛ نتيجة الأفقي بعمودين.
  4) بطاقة ×10 الطائرة (2D) محدودة بارتفاع المسرح؛ مساحة مسرح ×10 ثلاثي الأبعاد على الإطار القصير (tools/box3d/src/bulk.js).
  5) رقم خلية ×10 مقروء، شارة الخاص بالمظهر الورقي مقروءة، شارة «الأفضل» لا تُقصّ.
  py -3 tools/patch_v53.py <ناتج patch_v52> app/CODIS_FINAL.html   (sh tools/rebuild_v53.sh)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V53' not in s and 'CODIS-V52' in s, 'needs v52 output'
def rd(*p): return open(os.path.join(HERE, *p), encoding='utf-8').read()
def rep(old, new, n):
    global s
    assert s.count(old) == n, ('anchor count', s.count(old), n, old[:160])
    s = s.replace(old, new)
css = rd('identity', 'v53.css'); assert '</style' not in css and '<!--' not in css

# ---- تصحيحات في مكانها (نسختا الورقي والداكن) ----
rep('.bkc{ position:relative; display:grid; gap:10px;', '.bkc{ position:relative; display:flex; flex-direction:column; gap:10px;', 2)
rep('height:min(40vh, 340px); min-height:260px;', 'flex:0 1 max(260px, min(40vh, 340px)); min-height:132px;', 2)   # CODIS-V53: كان ارتفاعاً ثابتاً ≥260px يتجاوز النافذة القصيرة
# قاعدة الأفقي للأزرار الجامدة صُمّمت لعمودَي التفاصيل؛ ×10 والصندوق يحتاجان أزراراً داخل النافذة
for a in ('  .store-detail .modal-actions{ position:static;', '  .store-detail .modal-actions .btn{ min-height:44px;', '  .store-detail .modal-actions .btn-secondary:last-child{ flex:0 0 auto;'):
    rep(a, a.replace('.store-detail .modal-actions', '.store-detail:not(.bk-modal):not(.bx-modal) .modal-actions'), 2)
# رقم الخلية: كان حبراً بنياً على قرص داكن في الورقي
rep('color:var(--text-2); background:rgb(var(--lo-rgb) / .72); border:1px solid var(--glass-border); }', 'color:#F6EEDC; background:rgb(28 22 16 / .78); border:1px solid rgb(255 238 205 / .28); }', 2)
# شارة الخاص (تجاوز/عطلة/كيس/مظهر) في لافتة ×10: أصفر فاتح على ورق فاتح
rep('.bk-chip.is-special{ color:#ffe9a8;', '.bk-chip.is-special{ color:var(--gold-soft, #ffe9a8);', 2)
# بطاقة ×10 الطائرة (2D): عرضها كان من عرض المسرح فقط فتتجاوز المسرح القصير
rep('const sr = rel(el.stage), w = Math.min(196, sr.w * .48), card', 'const sr = rel(el.stage), w = Math.min(196, sr.w * .48, sr.h * .66), card', 1)   # CODIS-V53

# ---- طبقة v53 بعد v51/v52 ----
i = s.index('<style id="codis-v51-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v53-css">\n/* CODIS-V53 */\n' + css + '</style>' + s[j:]

open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v53 applied')
