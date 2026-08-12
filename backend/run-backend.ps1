# Run the Legislative Intelligence backend (Windows PowerShell).
#
#   cd "backend"
#   ./run-backend.ps1
#
# Serves on http://localhost:8000. Health check: http://localhost:8000/api/health
# Stop with Ctrl+C.

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# --- Console encoding (so Kinyarwanda/French accents print cleanly) ---
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# --- Neural Bridge model configuration ---------------------------------
# Default = "none": the API runs on grounded, retrieval-only answers with NO
# model key required. Everything works; generation is simply layered on when
# a provider is configured. See docs/08-model-selection.md for the rationale.
if (-not $env:NEURAL_BRIDGE_PROVIDER) { $env:NEURAL_BRIDGE_PROVIDER = "none" }

# Model defaults (used only when a provider is set). Chosen from the
# fair-forward/languagebench evaluation for Kinyarwanda/English/French.
if (-not $env:MODEL_CHAT)      { $env:MODEL_CHAT      = "google/gemma-3-27b-it" }
if (-not $env:MODEL_TRANSLATE) { $env:MODEL_TRANSLATE = "deepseek/deepseek-v4-flash" }
if (-not $env:OLLAMA_MODEL_CHAT) { $env:OLLAMA_MODEL_CHAT = "gemma3:27b" }

# To enable generation, uncomment ONE block below (or set these vars before
# running this script) --------------------------------------------------
#
# Hosted open-source inference (fastest to try):
#   $env:NEURAL_BRIDGE_PROVIDER = "openrouter"
#   $env:OPENROUTER_API_KEY     = "sk-or-..."   # your OpenRouter key
#
# Fully local / data-sovereign (needs Ollama running + `ollama pull gemma3:27b`):
#   $env:NEURAL_BRIDGE_PROVIDER = "ollama"
#   $env:OLLAMA_BASE            = "http://localhost:11434"
# -----------------------------------------------------------------------

# --- Ensure the venv exists --------------------------------------------
$py = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    Write-Host "Virtual env not found at .venv - creating it..." -ForegroundColor Yellow
    python -m venv .venv
    & $py -m pip install --quiet --upgrade pip
    & $py -m pip install requests pdfplumber pypdfium2 fastapi "uvicorn[standard]"
}

Write-Host "Starting Legislative Intelligence API" -ForegroundColor Green
Write-Host "  provider = $($env:NEURAL_BRIDGE_PROVIDER)   chat = $($env:MODEL_CHAT)" -ForegroundColor DarkGray
Write-Host "  http://localhost:8000/api/health" -ForegroundColor DarkGray

& $py -m uvicorn api.app:app --port 8000
