#!/bin/sh
set -e
cd "$(dirname "$0")/.."
py -3 tools/patch_v50.py backups/before_v50/CODIS_FINAL.html app/CODIS_FINAL.html
py -3 tools/set_version.py 3.37.0
node tests/syntax.js app/CODIS_FINAL.html
