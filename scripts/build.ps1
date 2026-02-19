#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build script – concatenate + minify CSS/JS assets for OpenSchool.

.DESCRIPTION
    Produces:
      css/styles.min.css   – minified master stylesheet
      js/bundle.js         – concatenated readable JS
      js/bundle.min.js     – minified JS bundle

    Requires Node 18+ with 'terser' and 'clean-css-cli' (installed automatically).

.EXAMPLE
    .\scripts\build.ps1          # build all
    .\scripts\build.ps1 -Watch   # rebuild on file change (requires chokidar-cli)
#>
[CmdletBinding()]
param(
    [switch]$Watch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location $ROOT

Write-Host "`n[BUILD] OpenSchool asset pipeline" -ForegroundColor Cyan

# ── Ensure Node tools ─────────────────────────────────────────────────────────
function Ensure-Tool($name) {
    try { & npx --yes $name --version 2>$null | Out-Null }
    catch {
        Write-Host "[INFO] Installing $name..." -ForegroundColor Gray
        & npm install --save-dev $name 2>$null
    }
}

try { node --version | Out-Null }
catch {
    Write-Host "[FAIL] Node.js is required for the build step." -ForegroundColor Red
    Write-Host "       Install from https://nodejs.org/ (LTS 18+)" -ForegroundColor Red
    Pop-Location; exit 1
}

# Install devDependencies if package.json exists
if (-not (Test-Path 'node_modules')) {
    if (Test-Path 'package.json') {
        Write-Host "[INFO] Running npm install..." -ForegroundColor Gray
        & npm install --quiet 2>$null
    }
}

Ensure-Tool 'terser'
Ensure-Tool 'clean-css-cli'

# ── CSS Minification ──────────────────────────────────────────────────────────
Write-Host "[CSS]  Minifying css/styles.css -> css/styles.min.css" -ForegroundColor Yellow
& npx clean-css-cli -o css/styles.min.css css/styles.css
$cssSize = (Get-Item css/styles.min.css).Length
Write-Host "[CSS]  Done ($cssSize bytes)" -ForegroundColor Green

# ── JS Concatenation ─────────────────────────────────────────────────────────
Write-Host "[JS]   Bundling JS modules -> js/bundle.js" -ForegroundColor Yellow

$jsOrder = @(
    'js/storage.js',
    'js/components/toast.js',
    'js/components/modal.js',
    'js/components/auth.js',
    'js/components/attendance.js',
    'js/components/assignments.js',
    'js/components/gradebook.js',
    'js/components/timetable.js',
    'js/components/announcements.js',
    'js/main.js'
)

$banner = @"
/**
 * OpenSchool – Bundled JavaScript
 * Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
 * Files: $($jsOrder.Count) modules
 * License: MIT
 */

"@

$bundleContent = $banner
foreach ($f in $jsOrder) {
    if (Test-Path $f) {
        $bundleContent += "// ──── $f ────`n"
        $bundleContent += (Get-Content $f -Raw) + "`n`n"
    } else {
        Write-Host "[WARN] Missing: $f" -ForegroundColor Yellow
    }
}
Set-Content -Path 'js/bundle.js' -Value $bundleContent -Encoding UTF8
$bundleSize = (Get-Item 'js/bundle.js').Length
Write-Host "[JS]   bundle.js created ($bundleSize bytes)" -ForegroundColor Green

# ── JS Minification ──────────────────────────────────────────────────────────
Write-Host "[JS]   Minifying js/bundle.js -> js/bundle.min.js" -ForegroundColor Yellow
& npx terser js/bundle.js -o js/bundle.min.js --compress --mangle --source-map "filename='bundle.min.js.map'"
$minSize = (Get-Item 'js/bundle.min.js').Length
Write-Host "[JS]   bundle.min.js created ($minSize bytes)" -ForegroundColor Green

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "`n[BUILD] Complete!" -ForegroundColor Green
Write-Host "  css/styles.min.css  : $cssSize bytes" -ForegroundColor Gray
Write-Host "  js/bundle.js        : $bundleSize bytes" -ForegroundColor Gray
Write-Host "  js/bundle.min.js    : $minSize bytes" -ForegroundColor Gray

Pop-Location
