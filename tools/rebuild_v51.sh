#!/bin/sh
set -e
cd "$(dirname "$0")/.."
node tools/box3d/build.mjs
py -3 tools/patch_v51.py backups/before_v51/CODIS_FINAL.html app/CODIS_FINAL.html
py -3 tools/set_version.py 3.38.0
node tests/syntax.js app/CODIS_FINAL.html
