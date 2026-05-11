<#
.SYNOPSIS
    Syncs mobile documentation between Docusaurus (docs-site/docs/mobile/) and
    Flutter assets (yesbill-mobile/assets/docs/).

.DESCRIPTION
    Docusaurus is the source of truth for content.

    toFlutter  — Copies docs-site/docs/mobile/ → yesbill-mobile/assets/docs/
                 Docusaurus frontmatter (displayed_sidebar, sidebar_label) is
                 kept as-is; Flutter's _stripFrontmatter removes it at runtime.

    toDocusaurus — Copies yesbill-mobile/assets/docs/ → docs-site/docs/mobile/
                   Adds "displayed_sidebar: mobileSidebar" to frontmatter if
                   not already present so the Docusaurus sidebar works.

.PARAMETER Direction
    'toFlutter'     - Docusaurus → Flutter  (default)
    'toDocusaurus'  - Flutter → Docusaurus

.EXAMPLE
    .\scripts\sync-mobile-docs.ps1
    .\scripts\sync-mobile-docs.ps1 -Direction toDocusaurus
#>

param(
    [ValidateSet('toFlutter', 'toDocusaurus')]
    [string]$Direction = 'toFlutter'
)

$ErrorActionPreference = 'Stop'

$repoRoot     = Resolve-Path "$PSScriptRoot\.."
$docsRoot     = Join-Path $repoRoot 'docs-site\docs\mobile'
$flutterRoot  = Join-Path $repoRoot 'yesbill-mobile\assets\docs'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Ensure-Dir([string]$path) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
    }
}

function Add-MobileSidebar([string]$content) {
    # Insert displayed_sidebar: mobileSidebar into existing frontmatter
    if ($content -match '^---(\r?\n)') {
        if ($content -notmatch 'displayed_sidebar') {
            $nl = if ($content -match '\r\n') { "`r`n" } else { "`n" }
            $content = $content -replace '^---(\r?\n)', "---${nl}displayed_sidebar: mobileSidebar${nl}"
        }
    }
    return $content
}

function Sync-Files {
    param(
        [string]$Source,
        [string]$Dest,
        [bool]$InjectSidebar = $false
    )

    $files = Get-ChildItem -Path $Source -Recurse -Filter '*.md'
    if (-not $files) {
        Write-Warning "No .md files found in: $Source"
        return 0
    }

    $count = 0
    foreach ($file in $files) {
        $rel        = $file.FullName.Substring($Source.Length).TrimStart('\').TrimStart('/')
        $targetPath = Join-Path $Dest $rel
        $targetDir  = Split-Path $targetPath -Parent

        Ensure-Dir $targetDir

        if ($InjectSidebar) {
            $raw     = Get-Content -Path $file.FullName -Raw -Encoding UTF8
            $updated = Add-MobileSidebar $raw
            [System.IO.File]::WriteAllText($targetPath, $updated, [System.Text.Encoding]::UTF8)
        } else {
            Copy-Item -Path $file.FullName -Destination $targetPath -Force
        }

        Write-Host "  [OK] $rel" -ForegroundColor Green
        $count++
    }
    return $count
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

switch ($Direction) {
    'toFlutter' {
        Write-Host ""
        Write-Host "Syncing  Docusaurus → Flutter assets" -ForegroundColor Cyan
        Write-Host "  Source : $docsRoot"
        Write-Host "  Dest   : $flutterRoot"
        Write-Host ""

        $n = Sync-Files -Source $docsRoot -Dest $flutterRoot -InjectSidebar $false

        Write-Host ""
        Write-Host "$n file(s) synced." -ForegroundColor Green
        Write-Host "Rebuild the APK to include updated docs in the Flutter app." -ForegroundColor Yellow
        Write-Host ""
    }

    'toDocusaurus' {
        Write-Host ""
        Write-Host "Syncing  Flutter assets → Docusaurus" -ForegroundColor Cyan
        Write-Host "  Source : $flutterRoot"
        Write-Host "  Dest   : $docsRoot"
        Write-Host ""

        $n = Sync-Files -Source $flutterRoot -Dest $docsRoot -InjectSidebar $true

        Write-Host ""
        Write-Host "$n file(s) synced." -ForegroundColor Green
        Write-Host "Run 'npm run build' inside docs-site/ to preview changes." -ForegroundColor Yellow
        Write-Host ""
    }
}
