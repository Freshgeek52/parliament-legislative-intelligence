# Run the Parliament frontend (Windows PowerShell).
#
#   cd "frontend"
#   ./run-frontend.ps1
#
# Serves on http://localhost:3000 and talks to the backend on :8000.
# Start the backend FIRST (backend/run-backend.ps1). Stop with Ctrl+C.

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# Point the app at the backend (idempotent - only writes if missing).
if (-not (Test-Path ".env.local")) {
    "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Host "Wrote .env.local -> backend at http://localhost:8000" -ForegroundColor DarkGray
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies (first run)..." -ForegroundColor Yellow
    npm install
}

# Warn if a stray production build is present (it conflicts with `next dev`).
if (Test-Path ".next\BUILD_ID") {
    Write-Host "Removing a stale production build in .next to avoid dev/prod conflicts..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next"
}

Write-Host "Starting frontend at http://localhost:3000" -ForegroundColor Green
npm run dev
