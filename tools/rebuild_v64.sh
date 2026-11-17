#!/bin/sh
# CODIS-V64 (3.51.0): v54 ← … ← v63 ← v64 (ثيم «الخشب المعتّق»: عائلة + 3 منتجات + راسم + تفاعل لمس/ماوس + أصوات خشبية محصورة بالأسطح) ← boot_split ← set_version. يبدأ من backups/before_v54.
set -e
cd "$(dirname "$0")/.."
T="${TMPDIR:-/tmp}/codis_v64_$$"; mkdir -p "$T"
py -3 tools/patch_v54.py backups/before_v54/CODIS_FINAL.html "$T/a.html"
py -3 tools/patch_v55.py "$T/a.html" "$T/b.html"
py -3 tools/patch_v56.py "$T/b.html" "$T/c.html"
py -3 tools/patch_v57.py "$T/c.html" "$T/d.html"
py -3 tools/patch_v58.py "$T/d.html" "$T/e.html"
py -3 tools/patch_v59.py "$T/e.html" "$T/f.html"
py -3 tools/patch_v60.py "$T/f.html" "$T/g.html"
py -3 tools/patch_v61.py "$T/g.html" "$T/h.html"
py -3 tools/patch_v62.py "$T/h.html" "$T/i.html"
py -3 tools/patch_v63.py "$T/i.html" "$T/j.html"
py -3 tools/patch_v64.py "$T/j.html" "$T/k.html"
node tools/boot_split.mjs "$T/k.html" app/CODIS_FINAL.html
rm -rf "$T"
py -3 tools/set_version.py 3.51.0
node tests/syntax.js app/CODIS_FINAL.html
