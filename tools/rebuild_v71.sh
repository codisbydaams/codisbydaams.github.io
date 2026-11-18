#!/bin/sh
# CODIS-V71 (3.58.0): v54 ← … ← v70 ← v71 (الشخصية ثلاثية الأبعاد) ← boot_split ← set_version. يبدأ من backups/before_v54.
set -e
cd "$(dirname "$0")/.."
(cd tools/char3d && py -3 make_textures.py && node build_assets.mjs) && node tools/box3d/build.mjs   # الأصول + الحزمة (تحتاج npm i داخل tools/char3d و tools/box3d)
T="${TMPDIR:-/tmp}/codis_v71_$$"; mkdir -p "$T"
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
py -3 tools/patch_v65.py "$T/k.html" "$T/l.html"
py -3 tools/patch_v66.py "$T/l.html" "$T/m.html"
py -3 tools/patch_v67.py "$T/m.html" "$T/n.html"
py -3 tools/patch_v68.py "$T/n.html" "$T/o.html"
py -3 tools/patch_v69.py "$T/o.html" "$T/p.html"
py -3 tools/patch_v70.py "$T/p.html" "$T/q.html"
py -3 tools/patch_v71.py "$T/q.html" "$T/r.html"
node tools/boot_split.mjs "$T/r.html" app/CODIS_FINAL.html
rm -rf "$T"
py -3 tools/set_version.py 3.58.0
node tests/syntax.js app/CODIS_FINAL.html
