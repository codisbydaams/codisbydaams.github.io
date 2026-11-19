#!/bin/sh
# CODIS-V73 (3.60.0): ناتج سلسلة v54…v72 قبل boot_split (backups/before_v73/CODIS_FINAL_pre_split_v72.html) ← v73 (منظومة الشخصية الاحترافية) ← boot_split ← set_version.
# الأصل: tools/char3d/v73/build.py ← dist/codis_char_v73.bin (gzip) ← assets/char/codis_char_v73.bin. الحزمة: tools/box3d (char.js v3).
# SKIP_ASSETS=1 ⇒ الأصل كما هو (تعديل واجهة/محرك فقط). FRESH=1 ⇒ إعادة توليد خامات الجلد المخزّنة مؤقتاً.
set -e
cd "$(dirname "$0")/.."
if [ -z "$SKIP_ASSETS" ]; then
  py -3 tools/char3d/v73/build.py
  mkdir -p assets/char && cp tools/char3d/dist/codis_char_v73.bin assets/char/codis_char_v73.bin
fi
node tools/box3d/build.mjs
T="${TMPDIR:-/tmp}/codis_v73_$$"; mkdir -p "$T"
py -3 tools/patch_v73.py backups/before_v73/CODIS_FINAL_pre_split_v72.html "$T/s.html"
node tools/boot_split.mjs "$T/s.html" app/CODIS_FINAL.html
rm -rf "$T"
py -3 tools/set_version.py 3.60.0
node tests/syntax.js app/CODIS_FINAL.html
