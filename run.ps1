# One-command launcher for the Parliament Legislative Intelligence platform.
#
#   cd "Parliament (Legislative Intelligence)"
#   ./run.ps1
#
# Starts the backend API (:8000) and the frontend (:3000), each in its own
# PowerShell window so you can watch their logs. Frees the ports first, so
# re-running never hits "address already in use". Close the two windows (or
# Ctrl+C in each) to stop.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

function Free-Port($port) {
    $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        try { Stop-Process -Id $p -Force -ErrorAction Stop; Write-Host "  freed port $port (stopped PID $p)" -ForegroundColor DarkGray }
        catch { Write-Host "  could not free port $port (PID $p)" -ForegroundColor Yellow }
    }
}

Write-Host "Freeing ports 8000 and 3000..." -ForegroundColor Cyan
Free-Port 8000
Free-Port 3000
Start-Sleep -Seconds 1

# --- Backend --------------------------------------------------------------
Write-Host "Starting backend (:8000) in a new window..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -WorkingDirectory $backend `
    -ArgumentList "-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\run-backend.ps1"

# Wait until the API answers before launching the frontend.
Write-Host "Waiting for the API to become healthy..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $h = Invoke-RestMethod "http://localhost:8000/api/health" -TimeoutSec 3
        if ($h.status -eq "ok") {
            Write-Host "  API healthy: $($h.laws_in_force) laws in force, $($h.index_chunks) chunks indexed" -ForegroundColor DarkGray
            $ready = $true
            break
        }
    } catch { Start-Sleep -Seconds 2 }
}
if (-not $ready) {
    Write-Host "  API did not respond in time - check the backend window for errors." -ForegroundColor Yellow
}

# --- Frontend -------------------------------------------------------------
Write-Host "Starting frontend (:3000) in a new window..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -WorkingDirectory $frontend `
    -ArgumentList "-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\run-frontend.ps1"

Write-Host ""
Write-Host "Both services launching:" -ForegroundColor Green
Write-Host "  Backend : http://localhost:8000/api/health"
Write-Host "  Frontend: http://localhost:3000"
Write-Host "Close the two new windows to stop them." -ForegroundColor DarkGray
