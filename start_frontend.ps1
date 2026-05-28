# BIST Screener - Frontend Başlatma Scripti
# Çalıştır: .\start_frontend.ps1

$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendDir

Write-Host "=== BIST Screener Frontend ===" -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "npm bağımlılıkları yükleniyor..." -ForegroundColor Yellow
    npm install
}

Write-Host "Frontend http://localhost:3000 adresinde başlatılıyor..." -ForegroundColor Cyan
npm run dev
