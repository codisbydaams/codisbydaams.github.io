#!/bin/sh
# CODIS-V56 (3.43.0): v54 ← v55 ← v56 (ثيمات غرفة التخطيط) ← boot_split ← set_version. يبدأ من backups/before_v54.
set -e
cd "$(dirname "$0")/.."
TMP="${TMPDIR:-/tmp}/codis_v54_$$.html"; TMP2="${TMPDIR:-/tmp}/codis_v55_$$.html"; TMP3="${TMPDIR:-/tmp}/codis_v56_$$.html"
py -3 tools/patch_v54.py backups/before_v54/CODIS_FINAL.html "$TMP"
py -3 tools/patch_v55.py "$TMP" "$TMP2"
py -3 tools/patch_v56.py "$TMP2" "$TMP3"
node tools/boot_split.mjs "$TMP3" app/CODIS_FINAL.html
rm -f "$TMP" "$TMP2" "$TMP3"
py -3 tools/set_version.py 3.43.0
node tests/syntax.js app/CODIS_FINAL.html
