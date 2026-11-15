#!/bin/sh
# CODIS-V53 (3.40.0): يبني المحرك ثم v51 (من backups/before_v51) ثم v52 ثم v53 فوقه.
set -e
cd "$(dirname "$0")/.."
node tools/box3d/build.mjs
TMP="${TMPDIR:-/tmp}/codis_v51_$$.html"; TMP2="${TMPDIR:-/tmp}/codis_v52_$$.html"
py -3 tools/patch_v51.py backups/before_v51/CODIS_FINAL.html "$TMP"
py -3 tools/patch_v52.py "$TMP" "$TMP2"
py -3 tools/patch_v53.py "$TMP2" app/CODIS_FINAL.html
rm -f "$TMP" "$TMP2"
py -3 tools/set_version.py 3.40.0
node tests/syntax.js app/CODIS_FINAL.html
