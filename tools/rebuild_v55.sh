#!/bin/sh
# CODIS-V55 (3.42.0): v54 كما هو ← patch_v55 (كروت المتجر + «بحوزتك» بأقسام) ← boot_split ← set_version.
#   يبدأ من backups/before_v54/CODIS_FINAL.html (= ناتج rebuild_v53.sh 3.40.0) فلا حاجة لإعادة بناء المحرّك.
set -e
cd "$(dirname "$0")/.."
TMP="${TMPDIR:-/tmp}/codis_v54_$$.html"; TMP2="${TMPDIR:-/tmp}/codis_v55_$$.html"
py -3 tools/patch_v54.py backups/before_v54/CODIS_FINAL.html "$TMP"
py -3 tools/patch_v55.py "$TMP" "$TMP2"
node tools/boot_split.mjs "$TMP2" app/CODIS_FINAL.html
rm -f "$TMP" "$TMP2"
py -3 tools/set_version.py 3.42.0
node tests/syntax.js app/CODIS_FINAL.html
