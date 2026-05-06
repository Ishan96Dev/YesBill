# build-apk.ps1 — Build a debug or release APK using values from .env
# Usage (from yesbill-mobile/ root):
#   .\tools\build-apk.ps1              # debug build
#   .\tools\build-apk.ps1 -Release     # release build

param(
    [switch]$Release
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Locate the .env file ───────────────────────────────────────────────────────
$envFile = Resolve-Path (Join-Path (Join-Path $PSScriptRoot "..") ".env")
if (-not (Test-Path $envFile)) {
    Write-Error ".env file not found at $envFile. Copy .env.example and fill in real values."
}

# ── Parse .env into a hashtable ───────────────────────────────────────────────
$env_vars = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
        $env_vars[$Matches[1].Trim()] = $Matches[2].Trim()
    }
}

# ── Build --dart-define flags for non-empty values ────────────────────────────
$defines = @()
foreach ($key in @('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'API_BASE_URL', 'GOOGLE_WEB_CLIENT_ID')) {
    if ($env_vars.ContainsKey($key) -and $env_vars[$key] -ne '') {
        $defines += "--dart-define=$key=$($env_vars[$key])"
    }
}

if ($defines.Count -eq 0) {
    Write-Warning "No dart-define values found in .env. App config will be empty."
}

# ── Run the Flutter build ──────────────────────────────────────────────────────
$buildMode = if ($Release) { 'release' } else { 'debug' }
$flutter   = 'flutter'

# If the project bundles Flutter, prefer it
$localFlutter = [IO.Path]::Combine($PSScriptRoot, '..', '..', 'flutter_windows_3.41.6-stable', 'flutter', 'bin', 'flutter.bat')
if (Test-Path $localFlutter) { $flutter = $localFlutter }

Write-Host "`nBuilding $buildMode APK with $($defines.Count) dart-define(s)..." -ForegroundColor Cyan
Write-Host "  $($defines -join ' ')`n"

Push-Location (Join-Path $PSScriptRoot "..")
try {
    & $flutter build apk "--$buildMode" @defines
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $outDir  = "build\app\outputs\flutter-apk"
    $apkName = if ($Release) { "app-release.apk" } else { "app-debug.apk" }
    $apkPath = Join-Path $outDir $apkName

    if (Test-Path $apkPath) {
        Write-Host "`n APK built successfully:" -ForegroundColor Green
        Write-Host "  $(Resolve-Path $apkPath)"
    }
} finally {
    Pop-Location
}
