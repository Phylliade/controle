#!/bin/sh
set -e
cd "$(dirname "$0")"
rm -f no-shorts.xpi
zip -r -X no-shorts.xpi manifest.json rules.json content.js hide-shorts.css icon.svg blocked.html
echo "-> no-shorts.xpi"
