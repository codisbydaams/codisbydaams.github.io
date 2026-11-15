#!/bin/sh
# CODIS-V52 (3.39.0): يبني المحرك ثم v51 (من backups/before_v51) ثم v52 فوقه.
set -e
cd "$(dirname "$0")/.."
node tools/box3d/build.mjs
TMP="${TMPDIR:-/tmp}/codis_v51_$$.html"
py -3 tools/patch_v51.py backups/before_v51/CODIS_FINAL.html "$TMP"
py -3 tools/patch_v52.py "$TMP" app/CODIS_FINAL.html
rm -f "$TMP"
py -3 tools/set_version.py 3.39.0
node tests/syntax.js app/CODIS_FINAL.html
