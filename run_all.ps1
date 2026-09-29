<#
run_all.ps1 - Run checks/tests, then start backend and frontend and open browser.

Usage:
  Right-click -> Run with PowerShell, or from cmd:
    powershell -ExecutionPolicy Bypass -File .\run_all.ps1

Behavior:
  1. Detect venv python at ./.venv/Scripts/python.exe (falls back to 'python')
  2. Run pytest, and stop if it fails
  3. If it passes, open two new cmd windows:
     - backend: runs the uvicorn server
     - frontend: cd frontend && npm run dev --host
  4. Open the frontend in the default browser (http://localhost:5420). The
     backend runs on http://127.0.0.1:8420.
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

Write-Host "Running pytest..."
& $venvPython -m pytest -q
# PowerShell 5.1 doesn't stop on a failing native command, even with
# $ErrorActionPreference = 'Stop', so check the exit code by hand.
if ($LASTEXITCODE -ne 0) {
    Write-Host "pytest failed; not starting the servers."
    exit 1
}
Write-Host "pytest passed.`n"

Write-Host "Starting backend and frontend in separate windows..."

# Start backend in a new cmd window
$backendCmd = "`"$venvPython`" -m uvicorn backend.main:app --reload --port 8420"
Start-Process -FilePath 'cmd.exe' -ArgumentList "/k $backendCmd" -WorkingDirectory $scriptRoot

# Start frontend in a new cmd window
$frontendDir = Join-Path $scriptRoot 'frontend'
$frontendCmd = "cd `"$frontendDir`" && npm run dev --host"
Start-Process -FilePath 'cmd.exe' -ArgumentList "/k $frontendCmd" -WorkingDirectory $scriptRoot

Write-Host "Waiting a couple of seconds for dev servers to come up..."
Start-Sleep -Seconds 3

# vite.config.ts pins the port with strictPort, so the frontend is either here
# or its window shows why it didn't start.
Start-Process 'http://localhost:5420'

Write-Host "Done. Backend and frontend started in separate windows. If the page doesn't load, check the frontend window for errors.`n"

return 0
