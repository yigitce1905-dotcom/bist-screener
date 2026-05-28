# BIST Screener - Backend Başlatma Scripti
# Çalıştır: .\start_backend.ps1

$ErrorActionPreference = "Stop"
$backendDir = Join-Path $PSScriptRoot "backend"
Set-Location $backendDir

Write-Host "=== BIST Screener Backend ===" -ForegroundColor Green

# Sanal ortam kontrolü
if (-not (Test-Path "venv")) {
    Write-Host "Sanal ortam oluşturuluyor..." -ForegroundColor Yellow
    python -m venv venv
}

# Aktivasyon
& ".\venv\Scripts\Activate.ps1"

# Bağımlılıkları yükle
Write-Host "Bağımlılıklar yükleniyor..." -ForegroundColor Yellow
pip install -r requirements.txt -q

Write-Host "Backend http://localhost:8000 adresinde başlatılıyor..." -ForegroundColor Green
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
