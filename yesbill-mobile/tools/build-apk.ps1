# build-apk.ps1 — Build debug and/or release APKs using values from .env
#
# Usage (run from the yesbill-mobile/ directory or anywhere):
#   .\tools\build-apk.ps1              # debug build only
#   .\tools\build-apk.ps1 -Release     # release build only
#   .\tools\build-apk.ps1 -Both        # debug + release in one run

param(
    [switch]$Release,
    [switch]$Both
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Resolve Flutter executable (prefers bundled SDK) ──────────────────────────
$localFlutter = [IO.Path]::Combine($PSScriptRoot, '..', '..', 'flutter_windows_3.41.6-stable', 'flutter', 'bin', 'flutter.bat')
$flutter = if (Test-Path $localFlutter) { $localFlutter } else { 'flutter' }

# ── Locate the .env file ───────────────────────────────────────────────────────
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile     = Join-Path $projectRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Error ".env not found at $envFile`nCopy .env.example and fill in real values."
}

# ── Parse .env into a hashtable ───────────────────────────────────────────────
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
        $envVars[$Matches[1].Trim()] = $Matches[2].Trim()
    }
}

# ── All supported dart-define keys (add new ones here as needed) ──────────────
$knownKeys = @(
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'API_BASE_URL',
    'GOOGLE_WEB_CLIENT_ID'
)

$defines = @()
foreach ($key in $knownKeys) {
    if ($envVars.ContainsKey($key) -and $envVars[$key] -ne '') {
        $defines += "--dart-define=$key=$($envVars[$key])"
    }
}

Write-Host "`n dart-define values loaded: $($defines.Count) / $($knownKeys.Count)" -ForegroundColor DarkCyan
foreach ($d in $defines) { Write-Host "   $d" -ForegroundColor DarkGray }

if ($defines.Count -eq 0) {
    Write-Warning "No dart-define values found. App config will use compiled-in defaults."
}

# ── Helper: run one build and report result ───────────────────────────────────
function Invoke-FlutterBuild([string]$Mode) {
    Write-Host "`n Building $Mode APK..." -ForegroundColor Cyan
    Push-Location $projectRoot
    try {
        & $flutter build apk "--$Mode" @defines
        if ($LASTEXITCODE -ne 0) {
            Write-Error "flutter build apk --$Mode failed (exit $LASTEXITCODE)."
        }

        $outDir  = "build\app\outputs\flutter-apk"
        $apkName = "app-$Mode.apk"
        $apkPath = Join-Path $outDir $apkName
        if (Test-Path $apkPath) {
            $size = [math]::Round((Get-Item $apkPath).Length / 1MB, 1)
            Write-Host " Built: $(Resolve-Path $apkPath) ($size MB)" -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
}

# ── Determine which modes to build ────────────────────────────────────────────
$modes = @()
if ($Both)    { $modes = @('debug', 'release') }
elseif ($Release) { $modes = @('release') }
else              { $modes = @('debug') }

foreach ($mode in $modes) {
    Invoke-FlutterBuild -Mode $mode
}

Write-Host "`nAll builds complete.`n" -ForegroundColor Green
