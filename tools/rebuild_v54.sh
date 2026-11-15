#!/bin/sh
# CODIS-V54 (3.41.0): v53 كما هو (rebuild_v53.sh يعيد بناءه) ← patch_v54 ← boot_split ← set_version.
#   يبدأ من backups/before_v54/CODIS_FINAL.html (= ناتج rebuild_v53.sh 3.40.0) فلا حاجة لإعادة بناء المحرّك.
#   صور الإقلاع: py -3 tools/build_startup_images.py (يكتب tools/identity/v54_startup.html) قبل هذا السكربت إن تغيّرت الخلفية.
set -e
cd "$(dirname "$0")/.."
TMP="${TMPDIR:-/tmp}/codis_v54_$$.html"
py -3 tools/patch_v54.py backups/before_v54/CODIS_FINAL.html "$TMP"
node tools/boot_split.mjs "$TMP" app/CODIS_FINAL.html
rm -f "$TMP"
py -3 tools/set_version.py 3.41.0
node tests/syntax.js app/CODIS_FINAL.html
