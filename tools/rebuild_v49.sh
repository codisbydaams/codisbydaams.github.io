#!/bin/sh
set -e
cd "$(dirname "$0")/.."
py -3 tools/patch_v49.py backups/before_v49/CODIS_FINAL.html app/CODIS_FINAL.html
py -3 tools/set_version.py 3.36.0
node tests/syntax.js app/CODIS_FINAL.html
