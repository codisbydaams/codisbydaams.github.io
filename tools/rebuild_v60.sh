#!/bin/sh
# CODIS-V60 (3.47.0): v54 ← … ← v59 (FROST CRYSTAL + أسطح) ← v60 (الجواهر + الصناديق + العناصر + التجهيز من بحوزتك) ← boot_split ← set_version. يبدأ من backups/before_v54.
set -e
cd "$(dirname "$0")/.."
T="${TMPDIR:-/tmp}/codis_v60_$$"; mkdir -p "$T"
py -3 tools/patch_v54.py backups/before_v54/CODIS_FINAL.html "$T/a.html"
py -3 tools/patch_v55.py "$T/a.html" "$T/b.html"
py -3 tools/patch_v56.py "$T/b.html" "$T/c.html"
py -3 tools/patch_v57.py "$T/c.html" "$T/d.html"
py -3 tools/patch_v58.py "$T/d.html" "$T/e.html"
py -3 tools/patch_v59.py "$T/e.html" "$T/f.html"
py -3 tools/patch_v60.py "$T/f.html" "$T/g.html"
node tools/boot_split.mjs "$T/g.html" app/CODIS_FINAL.html
rm -rf "$T"
py -3 tools/set_version.py 3.47.0
node tests/syntax.js app/CODIS_FINAL.html
