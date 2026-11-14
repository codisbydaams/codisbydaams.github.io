"""CODIS-V50 (3.37.0) — هوية المتجر «سوق التحف» (عرض فقط): ورق أنتيكا + كرتون حديث، مظهران (ورقي/داكن) بنفس الأشكال.
  رموز --sx-* محصورة بالمتجر ونوافذه، إطار قماشي (رصيد+شريط)، عملة ميدالية، أزرار موحّدة، ندرة بالإطار، أيقونات SVG مرسومة، حركة تحترم تقليل الحركة.
  py -3 tools/patch_v50.py backups/before_v50/CODIS_FINAL.html app/CODIS_FINAL.html   (بعد patch_v49؛ ثم set_version.py 3.37.0)"""
import sys, os, random, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V50' not in s and 'codis-v49-css' in s, 'needs v49, not v50'
def rd(p): return open(os.path.join(HERE, 'identity', p), encoding='utf-8').read()
def once(old, new):
    global s
    assert s.count(old) == 1, ('anchor count', s.count(old), old[:140])
    s = s.replace(old, new)
def uri(svg): return 'url("data:image/svg+xml,' + urllib.parse.quote(svg.replace('\n', ''), safe="/:=' ,.-") + '")'

# ---- خامات SVG صغيرة (بلا فلاتر: WebKit يرسمها بدقة منخفضة) ----
def speck(fill):
    r = random.Random(50); c = []
    for _ in range(46):
        c.append("<circle cx='%.1f' cy='%.1f' r='%.2f' fill='%s' fill-opacity='%.2f'/>" % (r.uniform(0, 96), r.uniform(0, 96), r.uniform(.35, .9), fill, r.uniform(.07, .2)))
    for _ in range(9):
        x, y = r.uniform(4, 86), r.uniform(4, 90); c.append("<path d='M%.1f %.1fq%.1f %.1f %.1f %.1f' stroke='%s' stroke-opacity='.09' fill='none' stroke-width='.6'/>" % (x, y, r.uniform(2, 5), r.uniform(-2, 2), r.uniform(5, 10), r.uniform(-1, 3), fill))
    return uri("<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>" + ''.join(c) + "</svg>")
def lattice(col, op):
    return uri("<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><g fill='none' stroke='%s' stroke-opacity='%s' stroke-width='.8'><path d='M0 28L28 0L56 28L28 56Z'/><circle cx='28' cy='28' r='5'/></g></svg>" % (col, op))
def seal(ink, gold, paper):
    return uri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18.5' fill='%s' stroke='%s' stroke-width='1.6'/><circle cx='20' cy='20' r='14.6' fill='none' stroke='%s' stroke-width='1' stroke-dasharray='1.6 1.7'/><path d='M20 9.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z' fill='%s' stroke='%s' stroke-width='1' stroke-linejoin='round'/><circle cx='20' cy='20' r='2.4' fill='%s'/></svg>" % (paper, gold, gold, gold, ink, paper))
def coin(a, b, c, ring, mono):
    return uri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%s'/><stop offset='.55' stop-color='%s'/><stop offset='1' stop-color='%s'/></linearGradient></defs><circle cx='16' cy='16' r='14.6' fill='url(#g)' stroke='%s' stroke-width='1.5'/><circle cx='16' cy='16' r='10.8' fill='none' stroke='#ffffff' stroke-opacity='.55' stroke-width='1'/><circle cx='16' cy='16' r='10.8' fill='none' stroke='%s' stroke-opacity='.45' stroke-width='.7' stroke-dasharray='1.3 1.5'/><path d='M20.6 11.7a6.3 6.3 0 1 0 0 8.6' fill='none' stroke='%s' stroke-width='2.3' stroke-linecap='round'/></svg>" % (a, b, c, ring, ring, mono))
css = rd('v50.css')
for k, v in {
    '__SX_SPECK_INK__': speck('%234a3622'), '__SX_SPECK_LIGHT__': speck('%23e6c88a'),
    '__SX_LATTICE_INK__': lattice('%234a3622', '.045'), '__SX_LATTICE_GOLD__': lattice('%23e0b052', '.05'),
    '__SX_SEAL_PAPER__': seal('#5a3a10', '#a06c14', '#f8f0da'), '__SX_SEAL_DARK__': seal('#2a1c08', '#e0b052', '#2a2118'),
    '__SX_COIN__': coin('#f6df93', '#d1a032', '#8d5f12', '#6b470e', '#5a3a08'),
    '__SX_COIN_SILVER__': coin('#f1f3f4', '#b5bcc2', '#6f7880', '#515a62', '#3f474e'),
}.items():
    assert k in css, k; css = css.replace(k, v)
assert '__SX' not in css and '</style' not in css and '<!--' not in css

# ---- JS: أيقونات المتجر + وسم الحركة ----
JS = rd('v50_store.js')
a = s.index('let econLastBal = null, econStoreEnterAt = 0;')
s = s[:a] + JS.rstrip() + '\n' + s[a:]
once("codisIcon(d.icon, { size:'hero' }) + (c ? '<span class=\"st-rail-n\"", "econStoreIconHtml(d.icon) + (c ? '<span class=\"st-rail-n\"")
once("onclick=\"econToggleClosed()\">' + codisIcon('archive') + '<span class=\"sr\">", "onclick=\"econToggleClosed()\">' + econStoreIconHtml('archive', 26).replace('ico-hero', 'ico-lg') + '<span class=\"sr\">")
once("function econStoreAfterRender(closedKeep){\n  econStoreNavSync();", "function econStoreAfterRender(closedKeep){\n  econStoreCalmSync();   /* CODIS-V50 */\n  econStoreNavSync();")

# ---- CSS بعد v49 ----
i = s.index('<style id="codis-v49-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v50-css">\n' + css + '</style>' + s[j:]
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v50 applied')
