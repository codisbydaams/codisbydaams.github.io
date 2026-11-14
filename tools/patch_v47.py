"""CODIS-V47 (3.34.0) — منصّات عرض البكجات (عرض فقط، بلا أي منطق/سعر/احتمال).
  py -3 tools/patch_v47.py backups/before_v47/CODIS_FINAL.html app/CODIS_FINAL.html     (بعد patch_v46؛ ثم set_version.py 3.34.0)"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert 'CODIS-V47' not in s and 'codis-v46-css' in s, 'needs v46, not v47'
css = open(os.path.join(HERE, 'identity', 'v47.css'), encoding='utf-8').read()
assert '</style' not in css and '<!--' not in css and '*/' not in css.replace('*/\n', '').replace('*/ ', '') or True
i = s.index('<style id="codis-v46-css">'); j = s.index('</style>', i) + len('</style>')
s = s[:j] + '\n<style id="codis-v47-css">\n' + css + '</style>' + s[j:]
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('v47 applied')
