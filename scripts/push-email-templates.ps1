# ============================================================
# YesBill - Push Email Templates to Supabase via Management API
# ============================================================
# USAGE:
#   1. Get your Personal Access Token (PAT) from:
#      https://app.supabase.com/account/tokens
#   2. Run this script:
#      .\scripts\push-email-templates.ps1 -Token "sbp_your_token_here"
#
# NOTE: Token is required. The project ref is hardcoded below.
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$Token
)

$ProjectRef = "dmabraziqscumpbwhjbf"
$BaseUrl    = "https://api.supabase.com/v1/projects/$ProjectRef/config/auth"
$Headers    = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

$TemplateDir = Join-Path $PSScriptRoot "..\email-templates"

function Read-Template {
    param([string]$FileName)
    $path = Join-Path $TemplateDir $FileName
    if (-not (Test-Path $path)) {
        Write-Warning "Template file not found: $path"
        return $null
    }
    return Get-Content -Path $path -Raw -Encoding UTF8
}

Write-Host ""
Write-Host "=== YesBill Email Template Push ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRef" -ForegroundColor Gray
Write-Host ""

# Read all template files
$templates = @{
    mailer_templates_signup_content          = Read-Template "01-confirm-signup.html"
    mailer_templates_invite_content          = Read-Template "02-invite-user.html"
    mailer_templates_magic_link_content      = Read-Template "03-magic-link.html"
    mailer_templates_email_change_content    = Read-Template "04-change-email.html"
    mailer_templates_recovery_content        = Read-Template "05-reset-password.html"
    mailer_templates_reauthentication_content = Read-Template "06-reauthentication.html"
    mailer_templates_confirmation_content     = Read-Template "07-password-changed.html"
    mailer_templates_email_change_confirmation_content = Read-Template "09-email-address-changed.html"
}

# Check all templates loaded
$missingCount = 0
foreach ($key in $templates.Keys) {
    if ($null -eq $templates[$key]) {
        Write-Warning "Skipping missing template: $key"
        $missingCount++
    }
}

if ($missingCount -gt 0) {
    Write-Warning "$missingCount template(s) could not be read. Continuing with available templates..."
}

# Remove null values
$payload = @{}
foreach ($key in $templates.Keys) {
    if ($null -ne $templates[$key]) {
        $payload[$key] = $templates[$key]
    }
}

Write-Host "Pushing $($payload.Count) templates to Supabase..." -ForegroundColor Yellow
Write-Host ""

try {
    $body = $payload | ConvertTo-Json -Depth 3 -Compress
    $response = Invoke-RestMethod -Method Patch -Uri $BaseUrl -Headers $Headers -Body $body -ErrorAction Stop
    Write-Host "[OK] All templates pushed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verify at:" -ForegroundColor Gray
    Write-Host "  https://app.supabase.com/project/$ProjectRef/auth/templates" -ForegroundColor Cyan
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $message    = $_.ErrorDetails.Message

    if ($statusCode -eq 401) {
        Write-Host "[ERROR] 401 Unauthorized — Invalid or expired token." -ForegroundColor Red
        Write-Host "        Get a new PAT at: https://app.supabase.com/account/tokens" -ForegroundColor Yellow
    }
    elseif ($statusCode -eq 403) {
        Write-Host "[ERROR] 403 Forbidden — You don't have permission on this project." -ForegroundColor Red
        Write-Host "        Make sure your PAT has access to project: $ProjectRef" -ForegroundColor Yellow
    }
    else {
        Write-Host "[ERROR] HTTP $statusCode — $message" -ForegroundColor Red
    }
}
