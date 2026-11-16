#!/bin/sh
# CODIS-V57 (3.44.0): v54 ← v55 ← v56 ← v57 (ثيمات الغرف الثلاث) ← boot_split ← set_version. يبدأ من backups/before_v54.
set -e
cd "$(dirname "$0")/.."
T="${TMPDIR:-/tmp}/codis_v57_$$"; mkdir -p "$T"
py -3 tools/patch_v54.py backups/before_v54/CODIS_FINAL.html "$T/a.html"
py -3 tools/patch_v55.py "$T/a.html" "$T/b.html"
py -3 tools/patch_v56.py "$T/b.html" "$T/c.html"
py -3 tools/patch_v57.py "$T/c.html" "$T/d.html"
node tools/boot_split.mjs "$T/d.html" app/CODIS_FINAL.html
rm -rf "$T"
py -3 tools/set_version.py 3.44.0
node tests/syntax.js app/CODIS_FINAL.html
