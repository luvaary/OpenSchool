#!/usr/bin/env pwsh
<#
.SYNOPSIS
    OpenSchool – environment validation & first-run setup (Windows 11 / PowerShell 5.1+).

.DESCRIPTION
    Checks prerequisites (Python 3.12+, optional Node LTS), creates virtual-env,
    installs pip requirements, and launches the dev server.

.EXAMPLE
    .\setup.ps1              # full setup + launch
    .\setup.ps1 -SkipServer  # setup only, don't start the server
#>
[CmdletBinding()]
param(
    [switch]$SkipServer
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   OpenSchool – Environment Setup"        -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ── 1. Python check ──────────────────────────────────────────────────────────
$pyCmd = $null
foreach ($candidate in @('python3', 'python', 'py')) {
    try {
        $ver = & $candidate --version 2>&1
        if ($ver -match '(\d+)\.(\d+)') {
            $major = [int]$Matches[1]; $minor = [int]$Matches[2]
            if ($major -ge 3 -and $minor -ge 12) {
                $pyCmd = $candidate
                Write-Host "[OK]  Python found: $ver ($candidate)" -ForegroundColor Green
                break
            } else {
                Write-Host "[WARN] $candidate is $ver – need 3.12+" -ForegroundColor Yellow
            }
        }
    } catch { }
}
if (-not $pyCmd) {
    Write-Host "[FAIL] Python 3.12+ not found. Install from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# ── 2. Node.js check (optional) ──────────────────────────────────────────────
$nodeOk = $false
try {
    $nodeVer = & node --version 2>&1
    if ($nodeVer -match 'v(\d+)') {
        $nodeMajor = [int]$Matches[1]
        if ($nodeMajor -ge 18) {
            Write-Host "[OK]  Node.js found: $nodeVer" -ForegroundColor Green
            $nodeOk = $true
        } else {
            Write-Host "[WARN] Node $nodeVer detected – LTS 18+ recommended for build scripts" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[INFO] Node.js not found (optional – needed only for build/minify)" -ForegroundColor Gray
}

# ── 3. Virtual environment ───────────────────────────────────────────────────
$venvDir = Join-Path $ROOT '.venv'
if (-not (Test-Path $venvDir)) {
    Write-Host "`nCreating Python virtual environment..." -ForegroundColor Cyan
    & $pyCmd -m venv $venvDir
    Write-Host "[OK]  .venv created" -ForegroundColor Green
} else {
    Write-Host "[OK]  .venv already exists" -ForegroundColor Green
}

# Activate
$activateScript = Join-Path $venvDir 'Scripts\Activate.ps1'
if (Test-Path $activateScript) {
    . $activateScript
    Write-Host "[OK]  Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "[WARN] Could not find Activate.ps1 – continuing without venv" -ForegroundColor Yellow
}

# ── 4. Pip requirements ──────────────────────────────────────────────────────
$reqFile = Join-Path $ROOT 'requirements.txt'
if (Test-Path $reqFile) {
    Write-Host "`nInstalling Python dependencies..." -ForegroundColor Cyan
    & pip install -r $reqFile --quiet
    Write-Host "[OK]  Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[INFO] No requirements.txt – installing Flask + extras..." -ForegroundColor Gray
    & pip install flask bcrypt --quiet
    Write-Host "[OK]  Flask + bcrypt installed" -ForegroundColor Green
}

# ── 5. Node modules (if Node available and package.json exists) ──────────────
$pkgJson = Join-Path $ROOT 'package.json'
if ($nodeOk -and (Test-Path $pkgJson)) {
    Write-Host "`nInstalling Node dependencies..." -ForegroundColor Cyan
    Push-Location $ROOT
    & npm install --quiet 2>$null
    Pop-Location
    Write-Host "[OK]  Node modules installed" -ForegroundColor Green
}

# ── 6. Schema validation ─────────────────────────────────────────────────────
Write-Host "`nValidating sample data against schemas..." -ForegroundColor Cyan
$schemaScript = Join-Path $ROOT 'scripts\schema_check.py'
if (Test-Path $schemaScript) {
    try {
        & python $schemaScript
        Write-Host "[OK]  Schema validation passed" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Schema validation had issues: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] schema_check.py not found" -ForegroundColor Gray
}

# ── 7. Summary ───────────────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Quick-start commands:" -ForegroundColor White
Write-Host "    Static mode:  cd $ROOT; python -m http.server 8000" -ForegroundColor Gray
Write-Host "    Flask mode:   cd $ROOT; python server/app.py" -ForegroundColor Gray
Write-Host "    Open browser: http://localhost:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Demo logins:" -ForegroundColor White
Write-Host "    admin   / admin123" -ForegroundColor Gray
Write-Host "    teacher / teacher123" -ForegroundColor Gray
Write-Host "    student / student123" -ForegroundColor Gray
Write-Host ""

# ── 8. Launch server (unless -SkipServer) ─────────────────────────────────────
if (-not $SkipServer) {
    Write-Host "Starting static dev server on http://localhost:8000 ..." -ForegroundColor Cyan
    Write-Host "(Press Ctrl+C to stop)`n" -ForegroundColor Gray
    Push-Location $ROOT
    & python -m http.server 8000
    Pop-Location
}
