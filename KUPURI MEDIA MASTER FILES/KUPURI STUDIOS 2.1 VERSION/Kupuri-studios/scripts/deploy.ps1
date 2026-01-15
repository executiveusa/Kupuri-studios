# Load environment variables from .env.coolify and run deployment
$envFile = Join-Path $PSScriptRoot ".." ".env.coolify"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ ERROR: .env.coolify not found!" -ForegroundColor Red
    Write-Host "Expected location: $envFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "📂 Loading configuration from .env.coolify..." -ForegroundColor Cyan

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "   ✓ $key" -ForegroundColor Green
    }
}

Write-Host "`n🚀 Starting deployment...`n" -ForegroundColor Cyan

$scriptPath = Join-Path $PSScriptRoot "deploy_coolify.py"
python $scriptPath
