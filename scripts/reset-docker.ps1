# Сброс контейнеров и volumes, подъём Postgres + ClickHouse с нуля.
# Запускать из корня репо (thesis): .\scripts\reset-docker.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (Test-Path (Join-Path $root "docker-compose.yml")) {
    Set-Location $root
} else {
    Set-Location (Split-Path -Parent $PSScriptRoot)
}

Write-Host "Stopping and removing containers and volumes..." -ForegroundColor Yellow
docker compose down -v

Write-Host "Starting postgres and clickhouse..." -ForegroundColor Green
docker compose up -d postgres clickhouse

Write-Host ""
Write-Host "Wait 10-15 seconds, then run:" -ForegroundColor Cyan
Write-Host "  cd OneTake-back-end" -ForegroundColor White
Write-Host "  dotnet ef database update --project OneTake.Infrastructure --startup-project OneTake.WebApi" -ForegroundColor White
Write-Host "  dotnet run --project OneTake.WebApi" -ForegroundColor White
