<#
run_all.ps1 - Run checks/tests, then start backend and frontend and open browser.

Usage:
  Right-click -> Run with PowerShell, or from cmd:
    powershell -ExecutionPolicy Bypass -File .\run_all.ps1

Behavior:
  1. Detect venv python at ./.venv/Scripts/python.exe (falls back to 'python')
  2. Run ruff, mypy, pytest (fail fast if any step fails)
  3. If all checks pass, open two new cmd windows:
     - backend: runs the uvicorn server
     - frontend: cd frontend && npm run dev --host
  4. Open the frontend URL in the default browser (http://127.0.0.1:5173). Note: Vite may pick another port; check the frontend terminal.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Path $MyInvocation.MyCommand.Path -Parent

# Prefer the project's venv python if present
$venvPython = Join-Path $scriptRoot '.venv\Scripts\python.exe'
if (-Not (Test-Path $venvPython)) {
    Write-Host "Virtualenv python not found at $venvPython, falling back to 'python' in PATH"
    $venvPython = 'python'
}

Write-Host "Using Python: $venvPython`n"

Write-Host "Running ruff (lint checks)..."
& $venvPython -m ruff check .
Write-Host "ruff passed.`n"

Write-Host "Running mypy (type checks)..."
& $venvPython -m mypy .
Write-Host "mypy passed.`n"

Write-Host "Running pytest (unit tests)..."
& $venvPython -m pytest -q
Write-Host "pytest passed.`n"

Write-Host "Starting backend and frontend in separate windows..."

# Start backend in a new cmd window
$backendCmd = "`"$venvPython`" -m uvicorn backend.main:app --reload"
Start-Process -FilePath 'cmd.exe' -ArgumentList "/k $backendCmd" -WorkingDirectory $scriptRoot

# Start frontend in a new cmd window
$frontendDir = Join-Path $scriptRoot 'frontend'
$frontendCmd = "cd `"$frontendDir`" && npm run dev --host"
Start-Process -FilePath 'cmd.exe' -ArgumentList "/k $frontendCmd" -WorkingDirectory $scriptRoot

Write-Host "Waiting a couple of seconds for dev servers to come up..."
Start-Sleep -Seconds 3

# Open the default browser to the common Vite port. Vite may use another port; check the frontend window if this fails.
$urlsToTry = @('http://localhost:5173','http://localhost:5174','http://localhost:5175')
foreach ($u in $urlsToTry) {
    try {
        Start-Process $u
        break
    } catch {
        continue
    }
}

Write-Host "Done. Backend and frontend started in separate windows. If the browser did not open, check the frontend terminal for the exact URL.`n"

return 0
