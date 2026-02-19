#!/usr/bin/env bash
# ============================================================================
# OpenSchool – Build Script (Linux / macOS / Git Bash on Windows)
# Produces minified CSS & JS bundles.
# Requires: Node 18+ (terser, clean-css-cli installed via npx)
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "[BUILD] OpenSchool asset pipeline"

# ── Check Node ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo "[FAIL] Node.js is required. Install from https://nodejs.org/ (LTS 18+)"
    exit 1
fi

NODE_VER=$(node -v | grep -oP '\d+' | head -1)
if [ "$NODE_VER" -lt 18 ]; then
    echo "[WARN] Node $(node -v) detected – LTS 18+ recommended"
fi

# Install deps if needed
if [ ! -d "node_modules" ] && [ -f "package.json" ]; then
    echo "[INFO] Running npm install..."
    npm install --quiet 2>/dev/null || true
fi

# ── CSS Minification ─────────────────────────────────────────────────────────
echo "[CSS]  Minifying css/styles.css -> css/styles.min.css"
npx --yes clean-css-cli -o css/styles.min.css css/styles.css
CSS_SIZE=$(wc -c < css/styles.min.css | tr -d ' ')
echo "[CSS]  Done (${CSS_SIZE} bytes)"

# ── JS Concatenation ─────────────────────────────────────────────────────────
echo "[JS]   Bundling JS modules -> js/bundle.js"

JS_FILES=(
    "js/storage.js"
    "js/components/toast.js"
    "js/components/modal.js"
    "js/components/auth.js"
    "js/components/attendance.js"
    "js/components/assignments.js"
    "js/components/gradebook.js"
    "js/components/timetable.js"
    "js/components/announcements.js"
    "js/main.js"
)

{
    echo "/**"
    echo " * OpenSchool – Bundled JavaScript"
    echo " * Generated: $(date '+%Y-%m-%d %H:%M:%S')"
    echo " * Files: ${#JS_FILES[@]} modules"
    echo " * License: MIT"
    echo " */"
    echo ""

    for f in "${JS_FILES[@]}"; do
        if [ -f "$f" ]; then
            echo "// ──── $f ────"
            cat "$f"
            echo ""
            echo ""
        else
            echo "// [WARN] Missing: $f" >&2
        fi
    done
} > js/bundle.js

BUNDLE_SIZE=$(wc -c < js/bundle.js | tr -d ' ')
echo "[JS]   bundle.js created (${BUNDLE_SIZE} bytes)"

# ── JS Minification ──────────────────────────────────────────────────────────
echo "[JS]   Minifying js/bundle.js -> js/bundle.min.js"
npx --yes terser js/bundle.js \
    -o js/bundle.min.js \
    --compress \
    --mangle \
    --source-map "filename='bundle.min.js.map'"

MIN_SIZE=$(wc -c < js/bundle.min.js | tr -d ' ')
echo "[JS]   bundle.min.js created (${MIN_SIZE} bytes)"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "[BUILD] Complete!"
echo "  css/styles.min.css  : ${CSS_SIZE} bytes"
echo "  js/bundle.js        : ${BUNDLE_SIZE} bytes"
echo "  js/bundle.min.js    : ${MIN_SIZE} bytes"
